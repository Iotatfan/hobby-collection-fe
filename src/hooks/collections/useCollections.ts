import { ICollectionFilterQuery, ICollectionListResponse } from '@/libs/collection/collection';
import collectionServices from '@/services/content/collectionServices';
import { useState, useCallback, useRef } from 'react';

const useCollections = () => {
  const [result, setResult] = useState<ICollectionListResponse>();
  const requestIdRef = useRef(0);

  const getCollections = useCallback(
    async (query?: ICollectionFilterQuery, signal?: AbortSignal) => {
      const requestId = ++requestIdRef.current;
      const response = await collectionServices.getAllCollections(query, signal);
      if (requestId === requestIdRef.current && !signal?.aborted) setResult(response);
    },
    [],
  );

  return {
    collections: result?.collections,
    totalCount: result?.total_count,
    getCollections,
  };
};

export default useCollections;
