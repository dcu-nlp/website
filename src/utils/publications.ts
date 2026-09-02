import type { CollectionEntry } from 'astro:content';
import generatedPublicationData from '@/data/generated/publications.json';
import publicationOverrides from '@/data/publication-overrides.json';
import { getEntrySlug } from '@/utils/content';

export interface PublicationSourceRef {
  kind: string;
  id: string;
  url?: string;
}

export interface NormalizedPublication {
  slug: string;
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createPublicationKey(title: string, year: number) {
  return `${normalizeText(title)}::${year}`;
}

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
  const byKey = new Map<string, NormalizedPublication>();

  for (const generatedPublication of getGeneratedPublications()) {
    byKey.set(
      createPublicationKey(
        generatedPublication.title,
        generatedPublication.year,
      ),
      generatedPublication,
    );
  }

  for (const entry of collectionEntries) {
    const mapped = mapCollectionPublication(entry);
    const key = createPublicationKey(mapped.title, mapped.year);
    const existing = byKey.get(key);

    byKey.set(key, {
      ...(existing ?? {}),
      ...mapped,
      detailSource: 'content',
    });
  }

  return [...byKey.values()].sort((left, right) => {
    if (right.year !== left.year) return right.year - left.year;
    return left.title.localeCompare(right.title);
  });
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
  return value
    .replace(/DCU-ADAPT/gu, 'DCU')
    .replace(/ADAPT\/DCU/gu, 'DCU')
    .replace(/\bADAPT\b/gu, '')
    .replace(/\bNLG\b/gu, 'language generation')
    .replace(/Natural Language Generation/gu, 'Language Generation')
    .replace(/\s{2,}/gu, ' ')
    .replace(/\s+([:,.])/gu, '$1')
    .trim();
}

export function findPublicationBySlug(
  publications: NormalizedPublication[],
  slug: string,
) {
  return publications.find((publication) => publication.slug === slug);
}
