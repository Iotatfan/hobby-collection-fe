import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { useState, useEffect } from 'react';
import { ICollectionStatistics } from '@/libs/collection/collection';
import { getCachedCollectionStatistics } from '@/utils/collectionCaches';
import collectionServices from '@/services/content/collectionServices';

interface UseCollectionStatisticsReturn {
  statistics: ICollectionStatistics | null;
  isLoading: boolean;
  isError: boolean;
}

const useCollectionStatistics = (): UseCollectionStatisticsReturn => {
  const [statistics, setStatistics] = useState<ICollectionStatistics | null>(
    getCachedCollectionStatistics,
  );
  const [isLoading, setIsLoading] = useState(!statistics);
  const [isError, setIsError] = useState(false);

  const enabled = useShelfSceneCurrent();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const cached = getCachedCollectionStatistics();
    if (cached) {
      setIsError(false);
      setStatistics(cached);
      setIsLoading(false);
      return;
    }

    const fetchStatistics = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const data = await collectionServices.getCollectionStatistics();
        if (!cancelled) setStatistics(data);
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchStatistics();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { statistics, isLoading, isError };
};

export default useCollectionStatistics;
