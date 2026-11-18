import { useContext, useLayoutEffect, useMemo } from 'react';
import useCategoryFilters from './hooks/useCategoryFilters';
import useCategoryShelves from '@/pages/collection_shelf/hooks/useCategoryShelves';
import { isCategory } from '@/pages/collection_shelf/helpers/categories';
import { ShelfSceneContext, useShelfLocation } from '@/layouts/shelves/scene';

/** Lazy data controller; the workspace retains the visual category shell. */
export default function CollectionShelfCategory() {
  const location = useShelfLocation();
  const slug = location.pathname.split('/')[3];
  const category = isCategory(slug) ? slug : undefined;
  const filters = useCategoryFilters(category);
  const shelf = useCategoryShelves(category, filters.filters);
  const data = useMemo(() => ({ ...shelf, ...filters }), [shelf, filters]);
  const report = useContext(ShelfSceneContext)?.categoryData;
  useLayoutEffect(() => {
    report?.(location.key, data);
  }, [report, location.key, data]);
  return null;
}
