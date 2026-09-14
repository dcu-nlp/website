import {
  cleanText,
  cleanAuthor,
  samePublication,
} from './publication-records.mjs';
import type { CollectionEntry } from 'astro:content';
import generatedPublicationData from '@/data/generated/publications.json';
import publicationOverrides from '@/data/publication-overrides.json';
import { getEntrySlug } from '@/utils/content';

export interface PublicationSourceRef {
  kind: string;
  id: string;
  url?: string;
  personId?: string;
}

export interface NormalizedPublication {
  slug: string;
  aliases?: string[];
  title: string;
  year: number;
  authors: string[];
  venue: string;
  abstract: string;
  tags: string[];
  paperUrl?: string;
  codeUrl?: string;
  award?: string;
  featured: boolean;
  matchedPeople: string[];
  sources: PublicationSourceRef[];
  detailSource: 'content' | 'generated';
}

interface GeneratedPublicationRecord extends Omit<
  NormalizedPublication,
  'detailSource'
> {}

interface PublicationOverrides {
  featuredSlugs: string[];
  excludedSourceIds: string[];
  manualCorrections: Record<
    string,
    Partial<Omit<NormalizedPublication, 'detailSource'>>
  >;
  manualEntries: GeneratedPublicationRecord[];
}

const generated = generatedPublicationData as {
  generatedAt: string;
  items: GeneratedPublicationRecord[];
};

const overrides = publicationOverrides as PublicationOverrides;

export function slugifyPublicationTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/['’.:,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapCollectionPublication(
  entry: CollectionEntry<'publications'>,
): NormalizedPublication {
  const slug = getEntrySlug(entry);
  return {
    slug,
    title: entry.data.title,
    year: entry.data.year,
    authors: entry.data.authors,
    venue: entry.data.venue,
    abstract: entry.data.abstract,
    tags: entry.data.tags,
    paperUrl: entry.data.paperUrl,
    codeUrl: entry.data.codeUrl,
    award: entry.data.award,
    featured: entry.data.featured || overrides.featuredSlugs.includes(slug),
    matchedPeople: [],
    sources: [{ kind: 'content-collection', id: slug }],
    detailSource: 'content',
  };
}

function applyCorrections(
  publication: GeneratedPublicationRecord,
): GeneratedPublicationRecord {
  const correction = overrides.manualCorrections[publication.slug];
  return correction ? { ...publication, ...correction } : publication;
}

export function getGeneratedPublications(): NormalizedPublication[] {
  return [...generated.items, ...overrides.manualEntries]
    .map(applyCorrections)
    .filter((publication) =>
      publication.sources.every(
        (source) => !overrides.excludedSourceIds.includes(source.id),
      ),
    )
    .map((publication) => ({
      ...publication,
      featured:
        publication.featured ||
        overrides.featuredSlugs.includes(publication.slug),
      detailSource: 'generated' as const,
    }));
}

export function mergePublications(
  collectionEntries: CollectionEntry<'publications'>[],
): NormalizedPublication[] {
  const merged: NormalizedPublication[] = [];
  for (const publication of [
    ...getGeneratedPublications(),
    ...collectionEntries.map(mapCollectionPublication),
  ]) {
    const normalized = {
      ...publication,
      title: cleanText(publication.title),
      authors: publication.authors.map(cleanAuthor),
      venue: cleanText(publication.venue),
      abstract: cleanText(publication.abstract),
    };
    const index = merged.findIndex((item) => samePublication(item, normalized));
    if (index === -1) merged.push(normalized);
    else {
      const existing = merged[index];
      merged[index] = {
        ...existing,
        ...normalized,
        aliases: [
          ...new Set([
            ...(existing.aliases ?? []),
            ...(normalized.aliases ?? []),
            existing.slug,
            normalized.slug,
          ]),
        ].filter((slug) => slug !== normalized.slug),
        sources: [...existing.sources, ...normalized.sources],
        matchedPeople: [
          ...new Set([...existing.matchedPeople, ...normalized.matchedPeople]),
        ],
      };
    }
  }
  return merged.sort(
    (left, right) =>
      right.year - left.year || left.title.localeCompare(right.title),
  );
}

export function getFeaturedPublications(
  publications: NormalizedPublication[],
  limit = 5,
) {
  const featured = publications.filter((publication) => publication.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  return publications.slice(0, limit);
}

export function sanitizePublicationDisplayText(value: string) {
  return cleanText(value);
}

export function findPublicationBySlug(
  publications: NormalizedPublication[],
  slug: string,
) {
  return publications.find((publication) => publication.slug === slug);
}
