import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
const root = path.resolve('dist');
const files = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? files(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
const pages = new Map();
const errors = [];
const external = new Set();
function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
}
for (const file of (await files(root)).filter((file) =>
  file.endsWith('.html'),
)) {
  const document = parse(await readFile(file, 'utf8'));
  const ids = new Set();
  const references = [];
  walk(document, (node) => {
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map((attr) => [attr.name, attr.value]),
    );
    if (attrs.id) {
      if (ids.has(attrs.id)) errors.push(`${file}: duplicate id ${attrs.id}`);
      ids.add(attrs.id);
    }
    if (node.tagName === 'img' && !('alt' in attrs))
      errors.push(`${file}: image missing alt text`);
    if (attrs.href) references.push(attrs.href);
    if (attrs.src) references.push(attrs.src);
    if (attrs.srcset)
      references.push(
        ...attrs.srcset.split(',').map((item) => item.trim().split(/\s+/)[0]),
      );
    if (attrs.style)
      for (const match of attrs.style.matchAll(/url\(["']?([^"')]+)["']?\)/g))
        references.push(match[1]);
  });
  pages.set(file, { ids, references });
}
const home = await readFile(path.join(root, 'index.html'), 'utf8');
const canonical = home.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
const site = new URL(canonical?.[1] ?? 'https://local.invalid/');
const base = site.pathname.replace(/\/$/, '');
async function resolveFile(url) {
  let pathname = decodeURIComponent(url.pathname);
  if (base && (pathname === base || pathname.startsWith(`${base}/`)))
    pathname = pathname.slice(base.length);
  const candidate = path.resolve(
    root,
    `.${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
  );
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return;
  for (const file of [
    candidate,
    path.join(candidate, 'index.html'),
    `${candidate}.html`,
  ]) {
    if (
      await stat(file)
        .then((info) => info.isFile())
        .catch(() => false)
    )
      return file;
  }
}
for (const [file, page] of pages) {
  const relative = path.relative(root, file).replace(/index\.html$/, '');
  const current = new URL(`${base}/${relative}`, site.origin);
  for (const reference of page.references) {
    if (/^(mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    let url;
    try {
      url = new URL(reference, current);
    } catch {
      errors.push(`${file}: invalid URL ${reference}`);
      continue;
    }
    if (!['http:', 'https:'].includes(url.protocol)) continue;
    if (url.origin !== site.origin) {
      external.add(url.href.split('#')[0]);
      continue;
    }
    const target = await resolveFile(url);
    if (!target)
      errors.push(
        `${path.relative(root, file)}: missing link or asset ${reference}`,
      );
    else if (
      url.hash &&
      pages.has(target) &&
      !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))
    )
      errors.push(`${path.relative(root, file)}: missing anchor ${reference}`);
  }
}
// Validate CSS assets too, including background images.
for (const file of (await files(root)).filter((file) =>
  file.endsWith('.css'),
)) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(data:|https?:)/.test(match[1])) continue;
    const url = new URL(
      match[1],
      new URL(`${base}/${path.relative(root, file)}`, site.origin),
    );
    if (!(await resolveFile(url)))
      errors.push(
        `${path.relative(root, file)}: missing CSS asset ${match[1]}`,
      );
  }
}
if (process.argv.includes('--external')) {
  const queue = [...external];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (queue.length) {
        const url = queue.shift();
        try {
          let response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(15000),
            redirect: 'follow',
          });
          if (response.status === 405)
            response = await fetch(url, {
              signal: AbortSignal.timeout(15000),
              redirect: 'follow',
            });
          await response.body?.cancel();
          if (response.status === 404 || response.status === 410)
            errors.push(`Broken external link (${response.status}): ${url}`);
          else if (!response.ok)
            console.warn(`Review external link (${response.status}): ${url}`);
        } catch (error) {
          console.warn(
            `External link could not be verified: ${url}: ${error.message}`,
          );
        }
      }
    }),
  );
}
await writeFile(
  'site-check-report.json',
  JSON.stringify(
    { pages: pages.size, externalLinks: external.size, errors },
    null,
    2,
  ),
);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Checked ${pages.size} pages: internal links, anchors, images, and CSS assets passed. ${external.size} external URLs inventoried.`,
  );
