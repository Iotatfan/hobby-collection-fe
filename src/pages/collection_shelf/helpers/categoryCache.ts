import type { IShelfItem, ShelfCategory } from '@/libs/collection/collection';
import { getCachedCollectionShelves } from '@/utils/collectionCaches';
import { categories } from '@/pages/collection_shelf/helpers/categories';
import { readSession } from '@/pages/collection_shelf/helpers/navigation';

export interface CategoryPages {
  name?: string;
  items: IShelfItem[];
  count: number;
  offset: number;
  complete: boolean;
}
export function readCategoryPages(category?: ShelfCategory): CategoryPages | null {
  if (!category) return null;
  const retained = readSession<CategoryPages>(`pages:${category}`);
  if (retained?.name != null) return retained;
  const response = getCachedCollectionShelves({ category, limit: 12, offset: 0 });
  const shelf = response?.[categories[category].key];
  if (retained)
    return {
      ...retained,
      name:
        retained.name ??
        shelf?.name ??
        getCachedCollectionShelves()?.[categories[category].key]?.name,
    };
  if (!shelf || !Array.isArray(shelf.items) || !Number.isFinite(shelf.count)) return null;
  return {
    name: shelf.name,
    items: shelf.items,
    count: shelf.count,
    offset: shelf.items.length,
    complete: !shelf.items.length || shelf.items.length >= shelf.count,
  };
}
