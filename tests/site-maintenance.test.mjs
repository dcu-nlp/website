import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const checker = path.resolve('scripts/check-site.mjs');
const reviewer = path.resolve('scripts/review-content.mjs');
async function fixture(run) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'nlg-check-'));
  try {
    await mkdir(path.join(cwd, 'dist'));
    await run(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
const execute = (script, cwd) =>
  spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
test('site checker supports repository base paths and reports broken anchors and assets', async () => {
  await fixture(async (cwd) => {
    const home =
      '<link rel="canonical" href="https://example.test/lab/"><main id="content"></main><a href="/lab/#content">Skip</a><img alt="Example" src="/lab/photo.svg">';
    await writeFile(path.join(cwd, 'dist/index.html'), home);
    await writeFile(path.join(cwd, 'dist/photo.svg'), '<svg></svg>');
    assert.equal(execute(checker, cwd).status, 0);
    await writeFile(
      path.join(cwd, 'dist/index.html'),
      home + '<a href="/lab/#missing">Missing</a><img src="/lab/missing.png">',
    );
    const result = execute(checker, cwd);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing anchor/);
    assert.match(result.stderr, /missing link or asset/);
    assert.match(result.stderr, /image missing alt/);
  });
});
test('content review flags expired opportunities and stale resources', async () => {
  await fixture(async (cwd) => {
    await writeFile(
      path.join(cwd, 'dist/maintenance.json'),
      JSON.stringify({
        opportunities: [
          {
            id: 'past',
            title: 'Old opening',
            deadline: '2000-01-01',
            reviewBy: '2000-01-01',
          },
          { id: 'future', title: 'Future opening', reviewBy: '2999-01-01' },
        ],
        resources: [{ id: 'old-resource', reviewedAt: '2000-01-01' }],
      }),
    );
    assert.equal(execute(reviewer, cwd).status, 0);
    const report = await readFile(path.join(cwd, 'content-review.md'), 'utf8');
    assert.match(report, /Expired opportunity: Old opening/);
    assert.match(report, /Opportunity needs review: Old opening/);
    assert.match(report, /old-resource/);
    assert.doesNotMatch(report, /Future opening/);
  });
});
