const searchable = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export function matchesPublication(record, filters) {
  const haystack = searchable(
    [record.title, ...record.authors, record.venue, ...record.tags].join(' '),
  );
  return (
    searchable(filters.q ?? '')
      .split(' ')
      .filter(Boolean)
      .every((word) => haystack.includes(word)) &&
    (!filters.year || String(record.year) === filters.year) &&
    (!filters.author || record.authors.includes(filters.author)) &&
    (!filters.topic || record.tags.includes(filters.topic))
  );
}
