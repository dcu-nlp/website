import { decodeHTML } from 'entities';

/** Decode source metadata as text; templates must still HTML-escape it. */
export function cleanText(value = '') {
  return decodeHTML(String(value)).replace(/\s+/gu, ' ').trim();
}

export function cleanAuthor(value) {
  return cleanText(value).replace(/ \d{4}$/u, '');
}

export function normalizedTitle(value) {
  return cleanText(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function publicationKeys(record) {
  const keys = [`title:${normalizedTitle(record.title)}:${record.year}`];
  if (record.paperUrl) {
    try {
      const url = new URL(record.paperUrl);
      const pathname = decodeURIComponent(url.pathname).replace(/^\/|\/$/g, '');
      if (['doi.org', 'dx.doi.org'].includes(url.hostname))
        keys.push(`doi:${pathname.toLowerCase()}`);
      if (url.hostname === 'aclanthology.org') {
        const id = pathname.replace(/\.(pdf|bib)$/u, '');
        keys.push(`doi:10.18653/v1/${id.toLowerCase()}`);
      }
    } catch {
      /* Invalid optional links cannot be identifiers. */
    }
  }
  for (const source of record.sources ?? []) {
    if (source.kind.startsWith('dblp')) keys.push(`dblp:${source.id}`);
  }
  return keys;
}

export function samePublication(left, right) {
  const keys = new Set(publicationKeys(left));
  return publicationKeys(right).some((key) => keys.has(key));
}
