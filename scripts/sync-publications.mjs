import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import {
  cleanText,
  cleanAuthor,
  samePublication,
} from '../src/utils/publication-records.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = path.join(root, 'src/data/generated');
const list = (value) =>
  value == null ? [] : Array.isArray(value) ? value : [value];
const text = (value) =>
  cleanText(
    typeof value === 'object' ? (value?.['#text'] ?? '') : (value ?? ''),
  );
const safeUrl = (value) => {
  try {
    const url = new URL(text(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/['’.:,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function readPeople() {
  const directory = path.join(root, 'src/data/people');
  const people = [];
  for (const name of (await readdir(directory)).filter((name) =>
    name.endsWith('.mdx'),
  )) {
    const contents = await readFile(path.join(directory, name), 'utf8');
    const frontmatter = contents.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const field = (key) =>
      frontmatter
        .match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]
        .trim()
        .replace(/^['"]|['"]$/g, '') ?? '';
    if (field('publicationsEnabled') !== 'true') continue;
    people.push({
      slug: name.replace(/\.mdx$/, ''),
      name: field('name'),
      dblpId: field('dblpId'),
      orcidId: field('orcidId'),
    });
  }
  return people;
}

/** Import only records that explicitly contain the configured DBLP person ID. */
export function parseBibliography(xml, person) {
  if (!xml.includes('<dblpperson') || XMLValidator.validate(xml) !== true) {
    throw new Error(
      `Invalid DBLP bibliography for ${person.slug}; keeping the previous dataset.`,
    );
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    processEntities: false,
    stopNodes: ['*.title'],
  });
  const bibliography = parser.parse(xml).dblpperson;
  if (bibliography?.['@_pid'] !== person.dblpId)
    throw new Error(`DBLP identity mismatch for ${person.slug}`);
  const records = [];
  for (const wrapper of list(bibliography.r)) {
    const item = Object.values(wrapper)[0];
    if (!item || typeof item !== 'object') continue;
    const contributors = list(item.author ?? item.editor);
    if (!contributors.some((author) => author?.['@_pid'] === person.dblpId))
      continue;
    const title = cleanText(
      String(item.title ?? '').replace(/<[^>]*>/g, ''),
    ).replace(/\.$/u, '');
    const year = Number(item.year);
    if (
      !title ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > new Date().getFullYear() + 1
    )
      continue;
    const id = item['@_key'];
    if (!id) continue;
    const urls = list(item.ee).map(safeUrl).filter(Boolean);
    records.push({
      slug: slugify(title),
      title,
      year,
      authors: contributors.map((author) => cleanAuthor(text(author))),
      venue: text(item.booktitle ?? item.journal ?? 'DBLP indexed publication'),
      abstract: '',
      tags: [],
      paperUrl:
        urls.find((url) => url.includes('aclanthology.org/')) ?? urls[0] ?? '',
      award: '',
      featured: false,
      matchedPeople: [person.slug],
      sources: [
        {
          kind: 'dblp-person',
          id,
          personId: person.dblpId,
          url: `https://dblp.org/rec/${id}`,
        },
      ],
    });
  }
  if (!records.length)
    throw new Error(
      `No identity-verified records for ${person.slug}; keeping the previous dataset.`,
    );
  return records;
}

export function mergeRecords(records) {
  const merged = [];
  for (const record of records) {
    const existing = merged.find((item) => samePublication(item, record));
    if (!existing) {
      merged.push({ ...record });
      continue;
    }
    existing.matchedPeople = [
      ...new Set([...existing.matchedPeople, ...record.matchedPeople]),
    ];
    existing.sources = [...existing.sources, ...record.sources].filter(
      (source, index, sources) =>
        sources.findIndex(
          (other) =>
            other.id === source.id && other.personId === source.personId,
        ) === index,
    );
  }
  // Different works can have identical titles in different years. Keep URLs unique.
  const counts = new Map();
  for (const item of merged)
    counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1);
  for (const item of merged)
    if (counts.get(item.slug) > 1) {
      item.aliases = [...new Set([...(item.aliases ?? []), item.slug])];
      item.slug += `-${item.year}-${item.sources[0].id.split('/').at(-1).toLowerCase()}`;
    }
  return merged.sort(
    (a, b) => b.year - a.year || a.title.localeCompare(b.title),
  );
}

export async function fetchBibliographies(people, fetcher = fetch) {
  const records = [];
  // Fail before writing if ANY configured bibliography is unavailable. Never publish partial refreshes.
  for (const person of people) {
    if (!person.dblpId || !/^[a-zA-Z0-9/-]+$/.test(person.dblpId))
      throw new Error(`Configure a verified dblpId for ${person.slug}`);
    const response = await fetcher(
      `https://dblp.org/pid/${person.dblpId}.xml`,
      { signal: AbortSignal.timeout(20000) },
    );
    if (!response.ok)
      throw new Error(`DBLP returned ${response.status} for ${person.slug}`);
    records.push(...parseBibliography(await response.text(), person));
  }
  return mergeRecords(records);
}

export async function main() {
  const people = await readPeople();
  const items = await fetchBibliographies(people);
  const generatedAt = new Date().toISOString();
  await mkdir(generatedDir, { recursive: true });
  await writeFile(
    path.join(generatedDir, 'publications.json'),
    JSON.stringify({ generatedAt, items }, null, 2) + '\n',
  );
  await writeFile(
    path.join(generatedDir, 'author-identities.json'),
    JSON.stringify({ generatedAt, authors: people }, null, 2) + '\n',
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
