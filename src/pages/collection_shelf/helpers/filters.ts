import type { ShelfCategory, ShelfFilters } from '@/libs/collection/collection';

export const filterFields = [
  'grade_id',
  'scale_id',
  'release_type_id',
  'manufacturer_id',
  'series_id',
] as const;
const retained = new Map<ShelfCategory, ShelfFilters>();

export function filterKey(filters: ShelfFilters = {}) {
  return filterFields
    .filter((field) => filters[field] !== undefined)
    .map((field) => `${field}=${filters[field]}`)
    .join('&');
}

export function readFilters(category?: ShelfCategory): ShelfFilters {
  if (!category) return {};
  try {
    const value = JSON.parse(sessionStorage.getItem(`shelves:filters:${category}`) || 'null');
    if (value) {
      const valid: ShelfFilters = {};
      for (const field of filterFields) {
        if (Number.isInteger(value[field]) && value[field] > 0) valid[field] = value[field];
      }
      retained.set(category, valid);
    }
  } catch {
    /* Storage is optional. */
  }
  return retained.get(category) || {};
}

export function writeFilters(category: ShelfCategory, filters: ShelfFilters) {
  retained.set(category, filters);
  try {
    sessionStorage.setItem(`shelves:filters:${category}`, JSON.stringify(filters));
  } catch {
    /* Storage is optional. */
  }
}

export function categoryPagesKey(category: ShelfCategory, filters: ShelfFilters = {}) {
  const suffix = filterKey(filters);
  return `pages:${category}${suffix ? `:${suffix}` : ''}`;
}

export function shelfFilterQuery(filters: ShelfFilters) {
  return {
    ...filters,
    release_type_id: filters.release_type_id === undefined ? undefined : [filters.release_type_id],
  };
}
