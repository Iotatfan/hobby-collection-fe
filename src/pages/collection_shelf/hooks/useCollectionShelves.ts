import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { useEffect, useState } from 'react';
import { ICollectionShelf } from '@/libs/collection/collection';
import { getCachedCollectionShelves } from '@/utils/collectionCaches';
import collectionServices from '@/services/content/collectionServices';

interface UseCollectionShelvesReturn {
  shelves: ICollectionShelf | null;
  isLoading: boolean;
  isError: boolean;
}

const useCollectionShelves = (): UseCollectionShelvesReturn => {
  const [shelves, setShelves] = useState<ICollectionShelf | null>(getCachedCollectionShelves);
  const [isLoading, setIsLoading] = useState(!shelves);
  const [isError, setIsError] = useState(false);

  const enabled = useShelfSceneCurrent();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const controller = new AbortController();
    const cached = getCachedCollectionShelves();
    if (cached) {
      setIsError(false);
      setShelves(cached);
      setIsLoading(false);
      return;
    }

    const fetchShelves = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const data = await collectionServices.getCollectionShelves(undefined, controller.signal);
        if (!cancelled) setShelves(data);
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchShelves();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled]);

  return { shelves, isLoading, isError };
};

export default useCollectionShelves;
