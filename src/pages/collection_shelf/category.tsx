import { useContext, useLayoutEffect } from 'react';
import useCategoryShelves from '@/pages/collection_shelf/hooks/useCategoryShelves';
import { isCategory } from '@/pages/collection_shelf/helpers/categories';
import { ShelfSceneContext, useShelfLocation } from '@/layouts/shelves/scene';

/** Lazy data controller; the workspace retains the visual category shell. */
export default function CollectionShelfCategory() {
  const location = useShelfLocation();
  const slug = location.pathname.split('/')[3];
  const { name, items, count, complete, loading, error, ready, load } = useCategoryShelves(
    isCategory(slug) ? slug : undefined,
  );
  const report = useContext(ShelfSceneContext)?.categoryData;
  useLayoutEffect(() => {
    report?.(location.key, { name, items, count, complete, loading, error, ready, load });
  }, [report, location.key, name, items, count, complete, loading, error, ready, load]);
  return null;
}
