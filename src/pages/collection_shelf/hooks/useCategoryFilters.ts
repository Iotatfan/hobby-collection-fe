import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ICategoryFilterOptions,
  ShelfCategory,
  ShelfFilters,
} from '@/libs/collection/collection';
import collectionServices from '@/services/content/collectionServices';
import { getCachedCategoryFilters } from '@/utils/collectionCaches';
import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { readFilters, writeFilters } from '../helpers/filters';

export default function useCategoryFilters(category?: ShelfCategory) {
  const enabled = useShelfSceneCurrent();
  const [filters, setFilters] = useState(() => readFilters(category));
  const [options, setOptions] = useState<ICategoryFilterOptions | null>(() =>
    category ? getCachedCategoryFilters(category) : null,
  );
  const [filtersError, setError] = useState('');
  const [filtersLoading, setLoading] = useState(!options && Boolean(category));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled || !category) return;
    const controller = new AbortController();
    setFilters(readFilters(category));
    setError('');
    setLoading(true);
    void collectionServices
      .getCategoryFilters(category, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setOptions(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load filters.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, enabled, attempt]);
  const changeFilter = useCallback(
    (field: keyof ShelfFilters, value?: number) => {
      if (!category) return;
      setFilters((previous) => {
        const next = { ...previous };
        if (value === undefined) delete next[field];
        else next[field] = value;
        writeFilters(category, next);
        return next;
      });
    },
    [category],
  );
  const clearFilters = useCallback(() => {
    if (category) writeFilters(category, {});
    setFilters({});
  }, [category]);
  const retryFilters = useCallback(() => setAttempt((value) => value + 1), []);
  return useMemo(
    () => ({
      filters,
      options,
      filtersError,
      filtersLoading,
      changeFilter,
      clearFilters,
      retryFilters,
    }),
    [filters, options, filtersError, filtersLoading, changeFilter, clearFilters, retryFilters],
  );
}
