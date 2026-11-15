import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { useEffect, useMemo, useState } from 'react';
import type { ICollection } from '@/libs/collection/collection';
import { getCachedCollection } from '@/utils/collectionCaches';
import collectionServices from '@/services/content/collectionServices';
import { buildDisplayImages } from '@/pages/collection_detail/helpers/collectionDetail.helpers';

export default function useShelfDetail(id?: string) {
  const enabled = useShelfSceneCurrent();
  const [collection, setCollection] = useState<ICollection | null>(() =>
    getCachedCollection(Number(id)),
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const cached = getCachedCollection(Number(id));
    if (cached) {
      setError('');
      setCollection(cached);
      setIndex(0);
      return;
    }
    setCollection(null);
    setIndex(0);
    setError('');
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      setError('Invalid collection ID.');
      return;
    }
    collectionServices
      .getCollection(numericId, controller.signal)
      .then((result) => {
        if (active) setCollection(result.data);
      })
      .catch(() => {
        if (active) setError('Failed to load collection detail.');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, attempt, enabled]);
  const images = useMemo(
    () => buildDisplayImages(collection?.cover, collection?.pictures),
    [collection],
  );
  return {
    collection,
    error,
    retry: () => setAttempt((value) => value + 1),
    images,
    index,
    setIndex,
  };
}
