import {
  ICollection,
  ICollectionDrawerContent,
  ICollectionFilterQuery,
  ICollectionFilterOptions,
  ICollectionTypeFilterItem,
  IFiguresScaleFilterItem,
  IGunplaGradeFilterItem,
  IReleaseTypeDrawerItem,
  ICollectionUploadPayload,
  ICollectionUpsertPayload,
  ICollectionStatistics,
  ICollectionShelf,
  ICollectionShelfQuery,
  ICollectionListResponse,
  ICategoryFilterOptions,
  ShelfCategory,
} from '@/libs/collection/collection';
import { collectionRequest } from '@/services/content/collectionRequest';
import http, { getAuthToken, isValidJwtToken } from '@/services/http';
import {
  getCachedCollection,
  setCachedCollection,
  getCachedCollectionList,
  setCachedCollectionList,
  invalidateCollectionCache,
  getCachedCollectionDrawer,
  setCachedCollectionDrawer,
  getCachedCollectionTypeFilters,
  setCachedCollectionTypeFilters,
  getCachedCollectionShelves,
  setCachedCollectionShelves,
  getCachedCollectionStatistics,
  setCachedCollectionStatistics,
  getStatisticsCacheGeneration,
  shelfCacheKey,
  getCachedCategoryFilters,
  setCachedCategoryFilters,
} from '@/utils/collectionCaches';

const logError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const getAllCollections = async (query?: ICollectionFilterQuery, signal?: AbortSignal) => {
  const cached = getCachedCollectionList(query);
  if (cached) return cached;

  try {
    const response = await http.get('/collection', {
      params: {
        collection_type_id: query?.collection_type_id,
        grade_id: query?.grade_id,
        scale_id: query?.scale_id,
        release_type_id: query?.release_type_id,
        sort: query?.sort,
        limit: query?.limit,
        offset: query?.offset,
      },
      paramsSerializer: {
        indexes: null,
      },
      signal,
    });
    const data = response.data.data as ICollectionListResponse;
    const result: ICollectionListResponse = {
      collections: Array.isArray(data?.collections) ? data.collections : [],
      ...(typeof data?.total_count === 'number' ? { total_count: data.total_count } : {}),
    };
    setCachedCollectionList(result, query);

    return result;
  } catch (error) {
    logError('Error fetching collections:', error);
    throw error;
  }
};

const getCollection = async (id: number, signal?: AbortSignal) => {
  const cached = getCachedCollection(id);
  if (cached) return { data: cached, fromCache: true };
  return collectionRequest(
    `detail:${id}`,
    async (requestSignal) => {
      const response = await http.get(`/collection/${id}`, { signal: requestSignal });
      const data = response.data.data as ICollection;
      setCachedCollection(data);
      return { data, fromCache: false };
    },
    signal,
  );
};

const getDrawerContent = async () => {
  const cached = getCachedCollectionDrawer();
  if (cached) return cached as ICollectionDrawerContent;

  try {
    const response = await http.get('/collection/drawer');
    setCachedCollectionDrawer(response.data.data as ICollectionDrawerContent);
    return response.data.data as ICollectionDrawerContent;
  } catch (error) {
    logError('Error fetching drawer content:', error);
    throw error;
  }
};

const getCollectionTypeFilters = async () => {
  const cached = getCachedCollectionTypeFilters();
  if (cached) return cached as ICollectionFilterOptions;

  try {
    const response = await http.get('/collection/filter');
    const data = response.data?.data;

    const collectionTypes = Array.isArray(data)
      ? (data as ICollectionTypeFilterItem[])
      : Array.isArray(data?.collection_types)
        ? (data.collection_types as ICollectionTypeFilterItem[])
        : Array.isArray(data?.items)
          ? (data.items as ICollectionTypeFilterItem[])
          : ([] as ICollectionTypeFilterItem[]);

    const releaseTypes = Array.isArray(data?.release_types)
      ? (data.release_types as IReleaseTypeDrawerItem[])
      : ([] as IReleaseTypeDrawerItem[]);

    const gunplaGrades = Array.isArray(data?.gunpla_grades)
      ? (data.gunpla_grades as IGunplaGradeFilterItem[])
      : ([] as IGunplaGradeFilterItem[]);

    const figureScales = Array.isArray(data?.figures_scales)
      ? (data.figures_scales as IFiguresScaleFilterItem[])
      : ([] as IFiguresScaleFilterItem[]);

    const resolved: ICollectionFilterOptions = {
      collection_types: collectionTypes,
      release_types: releaseTypes,
      gunpla_grades: gunplaGrades,
      figures_scales: figureScales,
    };

    setCachedCollectionTypeFilters(resolved);
    return resolved;
  } catch (error) {
    logError('Error fetching collection filters:', error);
    throw error;
  }
};

const getCollectionStatistics = async (signal?: AbortSignal): Promise<ICollectionStatistics> => {
  const cached = getCachedCollectionStatistics();
  if (cached) return cached;
  const generation = getStatisticsCacheGeneration();
  return collectionRequest(
    `statistics:${generation}`,
    async (requestSignal) => {
      const response = await http.get('/collection/statistics', { signal: requestSignal });
      const data = response.data.data as ICollectionStatistics;
      // A request started before a mutation must not repopulate the invalidated cache.
      if (generation === getStatisticsCacheGeneration()) setCachedCollectionStatistics(data);
      return data;
    },
    signal,
  );
};

const getCollectionShelves = async (
  query?: ICollectionShelfQuery,
  signal?: AbortSignal,
): Promise<ICollectionShelf> => {
  const cached = getCachedCollectionShelves(query);
  if (cached) return cached;
  const key = shelfCacheKey(query);
  return collectionRequest(
    key,
    async (requestSignal) => {
      const response = await http.get('/collection/shelves', {
        params: query,
        paramsSerializer: { indexes: null },
        signal: requestSignal,
      });
      const data = response.data.data as ICollectionShelf;
      setCachedCollectionShelves(data, query);
      return data;
    },
    signal,
  );
};

const getCategoryFilters = async (
  category: ShelfCategory,
  signal?: AbortSignal,
): Promise<ICategoryFilterOptions> => {
  const cached = getCachedCategoryFilters(category);
  if (cached) return cached;
  const generation = getStatisticsCacheGeneration();
  return collectionRequest(
    `category-filters:${category}:${generation}`,
    async (requestSignal) => {
      const response = await http.get('/collection/filter', {
        params: { category },
        signal: requestSignal,
      });
      const data = response.data?.data as ICategoryFilterOptions;
      if (
        data?.category !== category ||
        !Number.isFinite(data.total_count) ||
        ![data.grades, data.scales, data.release_types, data.manufacturers, data.series].every(
          Array.isArray,
        )
      ) {
        throw new Error('Category filters are unavailable. Please retry.');
      }
      if (generation === getStatisticsCacheGeneration()) setCachedCategoryFilters(data);
      return data;
    },
    signal,
  );
};

type CollectionMutationPayload = ICollectionUpsertPayload | ICollectionUploadPayload | FormData;

export interface ICreateNamedCatalogRequest {
  name: string;
}

export interface ICreateGradeRequest {
  name: string;
  short_name: string;
  collection_type_id: number;
}

export interface ICreateMetadataTagRequest {
  slug: string;
  name: string;
  type: 0 | 1;
}

const createCatalogEntry = async <T>(endpoint: string, payload: T) => {
  const token = getAuthToken();
  if (!isValidJwtToken(token)) {
    throw new Error('Missing or invalid JWT token. Sign in as an admin first.');
  }

  try {
    const response = await http.post(endpoint, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.data;
  } catch (error) {
    logError(`Error creating catalog entry at ${endpoint}:`, error);
    throw error;
  }
};

const createCollectionType = (payload: ICreateNamedCatalogRequest) =>
  createCatalogEntry('/collection/types', payload);
const createGrade = (payload: ICreateGradeRequest) =>
  createCatalogEntry('/collection/grades', payload);
const createScale = (payload: ICreateNamedCatalogRequest) =>
  createCatalogEntry('/collection/scales', payload);
const createReleaseType = (payload: ICreateNamedCatalogRequest) =>
  createCatalogEntry('/collection/release-types', payload);
const createSeries = (payload: ICreateNamedCatalogRequest) =>
  createCatalogEntry('/collection/series', payload);
const createManufacturer = (payload: ICreateNamedCatalogRequest) =>
  createCatalogEntry('/collection/manufacturers', payload);
const createMetadataTag = (payload: ICreateMetadataTagRequest) =>
  createCatalogEntry('/collection/metadata-tags', payload);

const createCollection = async (payload: CollectionMutationPayload) => {
  const token = getAuthToken();
  if (!isValidJwtToken(token)) {
    throw new Error('Missing or invalid JWT token. Sign in as an admin first.');
  }

  const response = await http.post('/create_collection', payload, {
    headers: {
      ...(payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const data = response.data.data as ICollection;
  invalidateCollectionCache(data.id);
  setCachedCollection(data);
  return data;
};

const updateCollection = async (id: number, payload: CollectionMutationPayload) => {
  const token = getAuthToken();
  if (!isValidJwtToken(token)) {
    throw new Error('Missing or invalid JWT token. Sign in as an admin first.');
  }

  const response = await http.patch(`/collection/${id}`, payload, {
    headers: {
      ...(payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const data = response.data.data as ICollection;
  invalidateCollectionCache(id);
  setCachedCollection(data);
  return data;
};

const collectionServices = {
  getAllCollections,
  getCollection,
  getDrawerContent,
  getCollectionTypeFilters,
  getCategoryFilters,
  getCollectionStatistics,
  getCollectionShelves,
  createCollection,
  updateCollection,
  createCollectionType,
  createGrade,
  createScale,
  createReleaseType,
  createSeries,
  createManufacturer,
  createMetadataTag,
};

export default collectionServices;
