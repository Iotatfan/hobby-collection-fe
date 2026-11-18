import {
  readCategoryPages,
  type CategoryPages,
} from '@/pages/collection_shelf/helpers/categoryCache';
import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ShelfCategory, ShelfFilters } from '@/libs/collection/collection';
import { removeCachedCollectionShelves } from '@/utils/collectionCaches';
import collectionServices from '@/services/content/collectionServices';
import { categories } from '../helpers/categories';
import { writeSession } from '../helpers/navigation';
import { categoryPagesKey, filterKey, shelfFilterQuery } from '../helpers/filters';

const empty: CategoryPages = { items: [], count: 0, offset: 0, complete: false };
export default function useCategoryShelves(
  category: ShelfCategory | undefined,
  filters: ShelfFilters,
) {
  const enabled = useShelfSceneCurrent();
  const [pages, setPages] = useState<CategoryPages>(() => readCategoryPages(category) || empty);
  const [loading, setLoading] = useState(pages === empty && Boolean(category));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(pages !== empty || !category);
  const key = filterKey(filters);
  const [resultKey, setResultKey] = useState(key);
  const queryFilters = useMemo(() => shelfFilterQuery(filters), [filters]);
  const current = useRef(pages);
  const request = useRef<AbortController | null>(null);
  const active = useRef(category);
  const load = useCallback(async () => {
    if (!category || request.current || current.current.complete) return;
    const controller = new AbortController();
    request.current = controller;
    const previous = current.current;
    setLoading(true);
    setError('');
    try {
      const response = await collectionServices.getCollectionShelves(
        { category, limit: 12, offset: previous.offset, ...queryFilters },
        controller.signal,
      );
      if (controller.signal.aborted || active.current !== category) return;
      const shelf = response[categories[category].key];
      if (!shelf || !Array.isArray(shelf.items) || !Number.isFinite(shelf.count))
        throw new Error('Invalid shelf response.');
      const ids = new Set(previous.items.map((item) => item.id));
      const additions = shelf.items.filter((item) => {
        if (ids.has(item.id)) return false;
        ids.add(item.id);
        return true;
      });
      if (shelf.items.length && !additions.length)
        throw new Error('More items could not be loaded. Please try again.');
      const next = {
        name: shelf.name,
        items: [...previous.items, ...additions],
        count: shelf.count,
        offset: previous.offset + shelf.items.length,
        complete: !shelf.items.length || previous.offset + shelf.items.length >= shelf.count,
      };
      current.current = next;
      setPages(next);
      setResultKey(key);
      writeSession(categoryPagesKey(category, filters), next);
    } catch (failure) {
      if (!controller.signal.aborted && active.current === category) {
        removeCachedCollectionShelves({
          category,
          limit: 12,
          offset: previous.offset,
          ...queryFilters,
        });
        setError(failure instanceof Error ? failure.message : 'Failed to load shelf items.');
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
        setReady(true);
      }
    }
  }, [category, filters, key, queryFilters]);
  useEffect(() => {
    if (!enabled) return;
    active.current = category;
    setError('');
    setReady(false);
    const cached = readCategoryPages(category, filters);
    current.current = cached || empty;
    // Keep painted artwork until the replacement query has completed.
    if (cached) {
      setPages(cached);
      setResultKey(key);
    }
    if (cached || !category) {
      setLoading(false);
      setReady(true);
    } else void load();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [category, load, enabled, filters, key]);
  return useMemo(
    () => ({ ...pages, loading, error, ready, load, resultKey, pending: resultKey !== key }),
    [pages, loading, error, ready, load, resultKey, key],
  );
}
