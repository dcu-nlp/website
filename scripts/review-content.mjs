import { readFile, writeFile } from 'node:fs/promises';
const data = JSON.parse(await readFile('dist/maintenance.json', 'utf8'));
const now = new Date();
const notices = [];
for (const entry of data.opportunities) {
  if (
    entry.deadline &&
    new Date(entry.deadline).toISOString().slice(0, 10) <
      now.toISOString().slice(0, 10)
  )
    notices.push(`Expired opportunity: ${entry.title} (${entry.id})`);
  if (new Date(entry.reviewBy) < now)
    notices.push(`Opportunity needs review: ${entry.title} (${entry.id})`);
}
for (const entry of data.resources) {
  if (now - new Date(entry.reviewedAt) > 180 * 86400000)
    notices.push(`Resource access/licence needs review: ${entry.id}`);
}
await writeFile(
  'content-review.md',
  `# Content review\n\n${notices.length ? notices.map((text) => `- ${text}`).join('\n') : 'No overdue content reviews.'}\n`,
);
for (const notice of notices) console.warn(`::warning::${notice}`);
console.log(
  `${data.opportunities.length} opportunities and ${data.resources.length} resources reviewed.`,
);
