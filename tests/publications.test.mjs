import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cleanText,
  cleanAuthor,
  samePublication,
} from '../src/utils/publication-records.mjs';
import { matchesPublication } from '../src/utils/publication-filters.mjs';
import {
  parseBibliography,
  fetchBibliographies,
  mergeRecords,
  readPeople,
} from '../scripts/sync-publications.mjs';

const person = { slug: 'brian-davis', dblpId: '04/285-1' };
const xml = `<?xml version="1.0"?><dblpperson pid="04/285-1"><r><inproceedings key="conf/example/Davis25"><author pid="04/285-1">Brian Davis 0001</author><author pid="other/person">A. Researcher</author><title>Language &amp; H<sub>2</sub>O.</title><year>2025</year><booktitle>NLP</booktitle><ee>https://example.org/paper</ee></inproceedings></r><r><article key="wrong"><author pid="04/285">Brian Davis</author><title>Unrelated namesake</title><year>2025</year></article></r></dblpperson>`;

test('bibliography import requires exact person IDs and retains title markup text', () => {
  const records = parseBibliography(xml, person);
  assert.equal(records.length, 1);
  assert.equal(records[0].title, 'Language & H2O');
  assert.deepEqual(records[0].authors, ['Brian Davis', 'A. Researcher']);
  assert.equal(records[0].sources[0].personId, '04/285-1');
  assert.throws(
    () => parseBibliography(xml, { ...person, dblpId: '04/285' }),
    /identity mismatch/,
  );
});

test('unavailable, empty and bot-challenge responses fail without yielding a partial refresh', async () => {
  assert.throws(
    () => parseBibliography('<html>Challenge</html>', person),
    /Invalid DBLP/,
  );
  assert.throws(
    () => parseBibliography('<dblpperson pid="04/285-1"/>', person),
    /No identity-verified/,
  );
  let calls = 0;
  await assert.rejects(
    fetchBibliographies([person, person], async () => {
      if (++calls === 1) return new Response(xml);
      return new Response('Unavailable', { status: 503 });
    }),
    /503/,
  );
  assert.equal(calls, 2);
});

test('source entities and author suffixes are cleaned without rewriting paper titles', () => {
  assert.equal(
    cleanText('BullyBench: Youth &amp; Experts'),
    'BullyBench: Youth & Experts',
  );
  assert.equal(cleanText('O&apos;Higgins &quot;NLP&quot;'), 'O\'Higgins "NLP"');
  assert.equal(cleanAuthor('Joachim Wagner 0001'), 'Joachim Wagner');
  assert.equal(
    cleanText('DCU-ADAPT Natural Language Generation'),
    'DCU-ADAPT Natural Language Generation',
  );
});

test('deduplication recognises encoded titles and DOI/ACL URL equivalents', () => {
  assert.ok(
    samePublication(
      { title: 'BullyBench: Youth &amp; Experts', year: 2025 },
      { title: 'BullyBench: Youth & Experts.', year: 2025 },
    ),
  );
  assert.ok(
    samePublication(
      {
        title: 'Short title',
        year: 2025,
        paperUrl: 'https://doi.org/10.18653/v1/2025.emnlp-industry.152',
      },
      {
        title: 'Long title',
        year: 2025,
        paperUrl: 'https://aclanthology.org/2025.emnlp-industry.152/',
      },
    ),
  );
  assert.equal(
    samePublication(
      { title: 'gaBERT', year: 2021 },
      { title: 'gaBERT', year: 2022 },
    ),
    false,
  );
});

test('separate publication versions get unique routes; shared author records merge', () => {
  const [record] = parseBibliography(xml, person);
  const merged = mergeRecords([
    record,
    { ...record, matchedPeople: ['joachim-wagner'] },
    {
      ...record,
      year: 2024,
      paperUrl: '',
      sources: [
        { kind: 'dblp-person', id: 'other/work', personId: person.dblpId },
      ],
    },
  ]);
  assert.equal(merged.length, 2);
  assert.notEqual(merged[0].slug, merged[1].slug);
  assert.deepEqual(merged[0].matchedPeople, ['brian-davis', 'joachim-wagner']);
});

const record = {
  title: 'Gaeilge and multilingual NLP',
  authors: ['Gearóid Ó Cleircín', 'Brian Davis'],
  year: 2025,
  venue: 'EMNLP',
  tags: ['multilingual'],
};
test('filters combine, accept accents and case, and reset to all records', () => {
  assert.ok(
    matchesPublication(record, {
      q: 'GEAROID gaeilge',
      year: '2025',
      author: 'Brian Davis',
      topic: 'multilingual',
    }),
  );
  assert.equal(matchesPublication(record, { year: '2024' }), false);
  assert.equal(matchesPublication(record, { q: 'cyberbullying' }), false);
  assert.equal(
    matchesPublication(record, { author: 'Brian D. Davison' }),
    false,
  );
  assert.equal(matchesPublication(record, { topic: 'online safety' }), false);
  assert.ok(
    matchesPublication(record, { q: '', year: '', author: '', topic: '' }),
  );
});

test('checked-in archive contains only reviewed researcher identities and unique slugs', async () => {
  const { items } = JSON.parse(
    await readFile(
      new URL('../src/data/generated/publications.json', import.meta.url),
      'utf8',
    ),
  );
  const people = await readPeople();
  const pids = new Set(people.map((p) => p.dblpId));
  assert.equal(new Set(items.map((p) => p.slug)).size, items.length);
  for (const item of items) {
    assert.ok(
      item.sources.every(
        (s) =>
          ['dblp-reviewed', 'dblp-person'].includes(s.kind) &&
          pids.has(s.personId),
      ),
    );
    assert.ok(
      item.matchedPeople.every((slug) => people.some((p) => p.slug === slug)),
    );
    assert.ok(
      !item.authors.some((a) =>
        /Brian (D\. Davison|[JL]\. Davis)|Wagner \d{4}/.test(a),
      ),
    );
    assert.ok(!/&(?:amp|apos|quot);/.test(item.title));
  }
});
