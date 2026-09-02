import type { CollectionEntry } from 'astro:content';

export function getEntrySlug(
  entry: CollectionEntry<
    'people' | 'publications' | 'projects' | 'news' | 'teaching'
  >,
) {
  return entry.id.replace(/\.(md|mdx)$/, '');
}

export function pickEntriesBySlug<
  T extends CollectionEntry<
    'people' | 'publications' | 'projects' | 'news' | 'teaching'
  >,
>(entries: T[], slugs: readonly string[]) {
  return slugs
    .map((slug) => entries.find((entry) => getEntrySlug(entry) === slug))
    .filter((entry): entry is T => entry !== undefined);
}
