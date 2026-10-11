import type { CollectionEntry } from 'astro:content';
import type { NormalizedPublication } from './publications';
import { getEntrySlug } from './content';

const nameKey = (name: string) =>
  name
    .replace(/^(?:Dr\.?|Prof\.?)\s+/i, '')
    .normalize('NFKC')
    .toLowerCase()
    .trim();
export function isAuthor(
  person: CollectionEntry<'people'>,
  publication: NormalizedPublication,
) {
  const names = [person.data.name, ...person.data.publicationNameVariants].map(
    nameKey,
  );
  return (
    publication.matchedPeople.includes(getEntrySlug(person)) ||
    publication.authors.some((name) => names.includes(nameKey(name)))
  );
}
export function isMember(
  person: CollectionEntry<'people'>,
  project: CollectionEntry<'projects'>,
) {
  return project.data.people.some(
    (name) => nameKey(name) === nameKey(person.data.name),
  );
}
export function isProjectPublication(
  project: CollectionEntry<'projects'>,
  publication: NormalizedPublication,
) {
  // Editorial paper links establish relationships without guessing from topic overlap.
  const urls = [
    publication.paperUrl,
    ...publication.sources.map((source) => source.url),
  ].filter(Boolean);
  return project.data.links.some((link) => urls.includes(link.href));
}
