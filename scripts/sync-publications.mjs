import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const peopleDir = path.join(rootDir, 'src', 'data', 'people');
const generatedPublicationsPath = path.join(
  rootDir,
  'src',
  'data',
  'generated',
  'publications.json',
);
const generatedAuthorsPath = path.join(
  rootDir,
  'src',
  'data',
  'generated',
  'author-identities.json',
);
const publicationOverridesPath = path.join(
  rootDir,
  'src',
  'data',
  'publication-overrides.json',
);
const REQUEST_TIMEOUT_MS = 12000;
const MIN_PUBLICATION_YEAR = 1900;
const MAX_PUBLICATION_YEAR = new Date().getFullYear() + 1;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['’.:,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function publicationKey(title, year) {
  return `${normalizeText(title)}::${year ?? 'unknown'}`;
}

function extractFrontmatter(fileContents) {
  const match = fileContents.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

function matchField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function matchBooleanField(frontmatter, key) {
  const value = matchField(frontmatter, key);
  return value === 'true';
}

function matchArrayField(frontmatter, key) {
  const lines = frontmatter.split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === `${key}:`);
  if (startIndex === -1) return [];

  const values = [];

  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('- ')) break;
    values.push(trimmed.replace(/^- /, '').replace(/^['"]|['"]$/g, ''));
  }

  return values;
}

function parseDblpAuthors(authorField) {
  if (!authorField) return [];
  if (Array.isArray(authorField.author)) {
    return authorField.author
      .map((author) => (typeof author === 'string' ? author : author.text))
      .filter(Boolean);
  }
  if (authorField.author && typeof authorField.author === 'object') {
    return [authorField.author.text].filter(Boolean);
  }
  if (typeof authorField.author === 'string') {
    return [authorField.author];
  }
  return [];
}

function pickFirstString(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value))
    return value.find((item) => typeof item === 'string') ?? '';
  return '';
}

function sanitizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;

  return value.replace(/\s+/g, ' ').trim();
}

function normalizeYear(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);

  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_PUBLICATION_YEAR ||
    parsed > MAX_PUBLICATION_YEAR
  ) {
    return new Date().getFullYear();
  }

  return parsed;
}

function sanitizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeId(value, fallback) {
  const normalized = sanitizeText(String(value ?? ''));
  return normalized || fallback;
}

function createNameTokens(name) {
  return normalizeText(name).split(' ').filter(Boolean);
}

function isRelevantAuthorMatch(authors, variants) {
  const normalizedAuthors = authors.map((author) => normalizeText(author));
  return variants.some((variant) => {
    const normalizedVariant = normalizeText(variant);
    const tokens = createNameTokens(variant);
    return normalizedAuthors.some((author) => {
      if (author === normalizedVariant) return true;
      return tokens.every((token) => author.includes(token));
    });
  });
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function fetchJson(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${url}: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function readPeople() {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(peopleDir);
  const people = [];

  for (const entry of entries.filter((name) => name.endsWith('.mdx'))) {
    const slug = entry.replace(/\.mdx$/, '');
    const frontmatter = extractFrontmatter(
      await readFile(path.join(peopleDir, entry), 'utf8'),
    );
    const variants = matchArrayField(frontmatter, 'publicationNameVariants');

    people.push({
      slug,
      name: matchField(frontmatter, 'name'),
      affiliation: matchField(frontmatter, 'affiliation'),
      dblpId: matchField(frontmatter, 'dblpId'),
      orcidId: matchField(frontmatter, 'orcidId'),
      publicationNameVariants: variants.length
        ? variants
        : [matchField(frontmatter, 'name')],
      publicationsEnabled: matchBooleanField(
        frontmatter,
        'publicationsEnabled',
      ),
    });
  }

  return people.filter((person) => person.publicationsEnabled);
}

async function discoverOrcidId(person) {
  if (person.orcidId) return person.orcidId;

  const [firstName, ...rest] = person.publicationNameVariants[0]
    .replace(/^Dr\s+/i, '')
    .split(' ');
  const familyName = rest.at(-1);

  if (!firstName || !familyName) return '';

  try {
    const url =
      `https://pub.orcid.org/v3.0/expanded-search/?q=` +
      encodeURIComponent(
        `given-names:${firstName} AND family-name:${familyName}`,
      );
    const payload = await fetchJson(url, { Accept: 'application/json' });
    const results = payload['expanded-result'] ?? [];
    const bestMatch = results.find((result) => {
      const candidateName =
        `${result['given-names'] ?? ''} ${result['family-names'] ?? ''}`.trim();
      return (
        normalizeText(candidateName) ===
        normalizeText(person.publicationNameVariants[0].replace(/^Dr\s+/i, ''))
      );
    });

    return bestMatch?.['orcid-id'] ?? '';
  } catch {
    return '';
  }
}

function mapDblpHitToPublication(hit, person) {
  const info = hit.info ?? {};
  const authors = parseDblpAuthors(info.authors);

  if (
    !authors.length ||
    !isRelevantAuthorMatch(authors, person.publicationNameVariants)
  ) {
    return null;
  }

  const title = sanitizeText((info.title ?? '').replace(/\.$/, ''));
  if (!title) return null;

  const year = normalizeYear(info.year);
  const paperUrl = sanitizeUrl(pickFirstString(info.ee));
  const sourceId = info.key ?? `${person.slug}:${slugify(title)}`;

  return {
    slug: slugify(title),
    title,
    year,
    authors,
    venue: sanitizeText(info.venue, 'DBLP indexed publication'),
    abstract: '',
    tags: [],
    paperUrl,
    award: '',
    featured: false,
    matchedPeople: [person.slug],
    sources: [
      {
        kind: 'dblp-search',
        id: sanitizeId(sourceId, `${person.slug}:${slugify(title)}`),
        url: sanitizeUrl(info.url),
      },
    ],
  };
}

async function fetchDblpPublications(person) {
  const results = [];

  for (const variant of person.publicationNameVariants) {
    try {
      const url =
        `https://dblp.org/search/publ/api?q=` +
        encodeURIComponent(`author:${variant}:`) +
        '&format=json&h=100';
      const payload = await fetchJson(url);
      const hits = payload.result?.hits?.hit ?? [];

      for (const hit of hits) {
        const mapped = mapDblpHitToPublication(hit, person);
        if (mapped) results.push(mapped);
      }
    } catch {
      console.warn(
        `Skipping DBLP lookup for "${variant}" due to a request or parsing failure.`,
      );
      continue;
    }
  }

  return results;
}

async function fetchOrcidPublications(person, orcidId) {
  if (!orcidId) return [];

  try {
    const works = await fetchJson(
      `https://pub.orcid.org/v3.0/${orcidId}/works`,
      {
        Accept: 'application/json',
      },
    );
    const summaries = works.group ?? [];

    return summaries
      .map((group) => {
        const summary = group['work-summary']?.[0];
        if (!summary) return null;
        const title = sanitizeText(summary.title?.title?.value);
        if (!title) return null;
        const year = normalizeYear(summary['publication-date']?.year?.value);
        const doi =
          summary['external-ids']?.['external-id']?.find(
            (id) => id['external-id-type'] === 'doi',
          )?.['external-id-value'] ?? '';

        return {
          slug: slugify(title),
          title,
          year,
          authors: [person.publicationNameVariants[0]],
          venue: sanitizeText(
            summary['journal-title']?.value,
            'ORCID indexed publication',
          ),
          abstract: '',
          tags: [],
          paperUrl: doi
            ? sanitizeUrl(`https://doi.org/${sanitizeText(doi)}`)
            : '',
          award: '',
          featured: false,
          matchedPeople: [person.slug],
          sources: [
            {
              kind: 'orcid-work',
              id: sanitizeId(summary['put-code'], slugify(title)),
            },
          ],
        };
      })
      .filter(Boolean);
  } catch {
    console.warn(
      `Skipping ORCID lookup for "${person.name}" due to a request or parsing failure.`,
    );
    return [];
  }
}

function mergePublicationRecords(records) {
  const merged = new Map();

  for (const record of records) {
    const key = publicationKey(record.title, record.year);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...record,
        tags: [...record.tags],
        matchedPeople: [...record.matchedPeople],
        sources: [...record.sources],
      });
      continue;
    }

    existing.paperUrl = existing.paperUrl || record.paperUrl;
    existing.venue =
      existing.venue === 'ORCID indexed publication'
        ? record.venue
        : existing.venue;
    existing.abstract = existing.abstract || record.abstract;
    existing.featured = existing.featured || record.featured;
    existing.tags = [...new Set([...existing.tags, ...record.tags])];
    existing.matchedPeople = [
      ...new Set([...existing.matchedPeople, ...record.matchedPeople]),
    ];
    existing.authors =
      existing.authors.length >= record.authors.length
        ? existing.authors
        : record.authors;
    existing.sources = [...existing.sources, ...record.sources];
  }

  return [...merged.values()].sort((left, right) => {
    if (right.year !== left.year) return right.year - left.year;
    return left.title.localeCompare(right.title);
  });
}

async function main() {
  const people = await readPeople();
  const overrides = await readJson(publicationOverridesPath);
  const allPublications = [];
  const discoveredAuthors = [];
  const generatedAt = new Date().toISOString();

  await mkdir(path.dirname(generatedPublicationsPath), { recursive: true });

  for (const person of people) {
    const orcidId = await discoverOrcidId(person);
    const [dblpPublications, orcidPublications] = await Promise.all([
      fetchDblpPublications(person),
      fetchOrcidPublications(person, orcidId),
    ]);

    allPublications.push(...dblpPublications, ...orcidPublications);
    discoveredAuthors.push({
      slug: person.slug,
      name: person.name,
      dblpId: person.dblpId,
      orcidId,
      publicationNameVariants: person.publicationNameVariants,
    });
  }

  const publications = mergePublicationRecords(allPublications).map(
    (publication) => ({
      ...publication,
      featured: overrides.featuredSlugs.includes(publication.slug),
    }),
  );

  await writeFile(
    generatedAuthorsPath,
    `${JSON.stringify({ generatedAt, authors: discoveredAuthors }, null, 2)}\n`,
  );
  await writeFile(
    generatedPublicationsPath,
    `${JSON.stringify({ generatedAt, items: publications }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
