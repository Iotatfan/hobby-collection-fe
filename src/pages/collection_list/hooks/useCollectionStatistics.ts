import { useState, useEffect } from 'react';
import { ICollectionStatistics } from '@/libs/collection/collection';
import collectionServices from '@/services/content/collectionServices';

interface UseCollectionStatisticsReturn {
  statistics: ICollectionStatistics | null;
  isLoading: boolean;
  isError: boolean;
}

const useCollectionStatistics = (): UseCollectionStatisticsReturn => {
  const [statistics, setStatistics] = useState<ICollectionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
  }, []);

  return { statistics, isLoading, isError };
};

export default useCollectionStatistics;
