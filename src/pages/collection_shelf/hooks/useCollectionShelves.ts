import { useEffect, useState } from 'react';
import { ICollectionShelf } from '@/libs/collection/collection';
import collectionServices from '@/services/content/collectionServices';

interface UseCollectionShelvesReturn {
  shelves: ICollectionShelf | null;
  isLoading: boolean;
  isError: boolean;
}

const useCollectionShelves = (): UseCollectionShelvesReturn => {
  const [shelves, setShelves] = useState<ICollectionShelf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchShelves = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const data = await collectionServices.getCollectionShelves();
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
    };
  }, []);

  return { shelves, isLoading, isError };
};

export default useCollectionShelves;
