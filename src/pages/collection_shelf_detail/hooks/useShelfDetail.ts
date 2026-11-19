import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ICollection } from '@/libs/collection/collection';
import { getCachedCollection } from '@/utils/collectionCaches';
import collectionServices from '@/services/content/collectionServices';
import { readSession, writeSession } from '@/pages/collection_shelf/helpers/navigation';
import { buildDisplayImages } from '@/pages/collection_detail/helpers/collectionDetail.helpers';

function initialSelection(collection: ICollection | null) {
  if (!collection) return 0;
  const images = buildDisplayImages(collection.cover, collection.pictures);
  const saved = readSession<{ image: string; index: number }>(`gallery:${collection.id}`);
  if (saved) {
    const position = images.indexOf(saved.image);
    if (position >= 0) return position;
    if (Number.isInteger(saved.index)) return Math.max(0, Math.min(saved.index, images.length - 1));
  }
  return collection.cover && images.length > 1 ? 1 : 0;
}

export default function useShelfDetail(id?: string) {
  const enabled = useShelfSceneCurrent();
  const [collection, setCollection] = useState<ICollection | null>(() =>
    getCachedCollection(Number(id)),
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(() => {
    return initialSelection(getCachedCollection(Number(id)));
  });
  const [navigation, setNavigation] = useState({ direction: 1, change: 0 });
  const initializedItem = useRef<number | null>(collection?.id ?? null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const cached = getCachedCollection(Number(id));
    if (cached) {
      setError('');
      setCollection(cached);
      return;
    }
    setCollection(null);
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
  useLayoutEffect(() => {
    if (!collection || collection.id !== Number(id) || initializedItem.current === collection.id)
      return;
    initializedItem.current = collection.id;
    setIndex(initialSelection(collection));
  }, [collection, id, images.length]);
  useLayoutEffect(() => {
    if (collection?.id === Number(id)) {
      setIndex((selected) => Math.max(0, Math.min(selected, images.length - 1)));
    }
  }, [collection, id, images.length]);
  const selectImage = useCallback(
    (selected: number, direction?: number) => {
      if (!collection || !images[selected] || selected === index) return;
      setNavigation((previous) => ({
        direction: direction ?? (selected > index ? 1 : -1),
        change: previous.change + 1,
      }));
      setIndex(selected);
      writeSession(`gallery:${collection.id}`, { image: images[selected], index: selected });
    },
    [collection, images, index],
  );
  return {
    collection: collection?.id === Number(id) ? collection : null,
    error,
    retry: () => setAttempt((value) => value + 1),
    images,
    index: Math.max(0, Math.min(index, images.length - 1)),
    setIndex: selectImage,
    direction: navigation.direction,
    imageChange: navigation.change,
  };
}
