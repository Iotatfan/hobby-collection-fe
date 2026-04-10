import {
  ICollectionFilterQuery,
  ICollectionTypeFilterItem,
  IReleaseTypeDrawerItem,
} from '@/libs/collection/collection';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const LIMIT_OPTIONS = [10, 20, 30, 50] as const;
export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest Activity' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
] as const;
export const ALL_COLLECTION_VALUE = '__all__';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const DEFAULT_SORT = 'latest';

const parsePositiveNumberParam = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;
  return parsed;
};

const toCollectionSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizeCollectionName = (value: string): string => value.trim().toLowerCase();

const parseLimitParam = (value: string | null): number => {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    !LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number])
  ) {
    return DEFAULT_LIMIT;
  }
  return parsed;
};

const parseOffsetParam = (value: string | null): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return DEFAULT_OFFSET;
  return parsed;
};

const parseReleaseTypeParam = (value: string | null): number[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const normalizeSortParam = (value: string | null): string => {
  if (!value) return DEFAULT_SORT;
  if (value === 'latest_built') return 'latest';
  if (value === 'name_asc') return 'name';
  return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT;
};

type UseCollectionListFiltersOptions = {
  collectionsCount: number;
  filterOptions: ICollectionTypeFilterItem[];
  releaseTypeOptions: IReleaseTypeDrawerItem[];
};

const useCollectionListFilters = ({
  collectionsCount,
  filterOptions,
  releaseTypeOptions,
}: UseCollectionListFiltersOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const collectionValue = useMemo(() => searchParams.get('collection') ?? '', [searchParams]);
  const collectionTypeId = useMemo(() => {
    const legacyCollectionTypeId = parsePositiveNumberParam(searchParams.get('collection_type_id'));
    if (legacyCollectionTypeId) return legacyCollectionTypeId;
    if (!collectionValue) return undefined;

    const normalizedCollectionValue = normalizeCollectionName(collectionValue);
    const matchedOption = filterOptions.find((option) => {
      const normalizedName = normalizeCollectionName(option.name);
      return (
        normalizedName === normalizedCollectionValue ||
        toCollectionSlug(option.name) === collectionValue
      );
    });
    return matchedOption?.id;
  }, [collectionValue, filterOptions, searchParams]);

  const limit = useMemo(() => parseLimitParam(searchParams.get('limit')), [searchParams]);
  const offset = useMemo(() => parseOffsetParam(searchParams.get('offset')), [searchParams]);
  const sortBy = useMemo(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) return normalizeSortParam(sortParam);
    return normalizeSortParam(searchParams.get('sortby'));
  }, [searchParams]);
  const selectedReleaseTypeIds = useMemo(() => {
    const releaseTypeParam = searchParams.get('release_type_id');
    if (releaseTypeParam) return parseReleaseTypeParam(releaseTypeParam);
    const legacyReleaseTypeParam = searchParams.get('release_type');
    if (legacyReleaseTypeParam) return parseReleaseTypeParam(legacyReleaseTypeParam);
    return parseReleaseTypeParam(searchParams.get('groups'));
  }, [searchParams]);
  const isResolvingCollectionSlug = Boolean(collectionValue) && filterOptions.length === 0;

  const updateSearchParams = useCallback(
    (updater: (nextParams: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams);
      updater(nextParams);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const legacyCollectionTypeId = parsePositiveNumberParam(searchParams.get('collection_type_id'));
    if (!legacyCollectionTypeId || filterOptions.length === 0) return;

    const selected = filterOptions.find((option) => option.id === legacyCollectionTypeId);
    updateSearchParams((nextParams) => {
      if (selected) nextParams.set('collection', selected.name);
      nextParams.delete('collection_type_id');
    });
  }, [filterOptions, searchParams, updateSearchParams]);

  const query = useMemo<ICollectionFilterQuery>(() => {
    return {
      collection_type_id: collectionTypeId,
      limit,
      offset,
      sort: sortBy,
      release_type_id: selectedReleaseTypeIds.length > 0 ? selectedReleaseTypeIds : undefined,
    };
  }, [collectionTypeId, limit, offset, sortBy, selectedReleaseTypeIds]);

  const selectedReleaseTypeLabel = useMemo(() => {
    if (selectedReleaseTypeIds.length === 0) return 'All Release Types';
    if (selectedReleaseTypeIds.length === 1) {
      const selectedType = releaseTypeOptions.find(
        (option) => option.id === selectedReleaseTypeIds[0],
      );
      return selectedType?.name ?? '1 selected';
    }
    return `${selectedReleaseTypeIds.length} selected`;
  }, [releaseTypeOptions, selectedReleaseTypeIds]);

  const selectedCollectionLabel = useMemo(() => {
    if (!collectionTypeId) return 'All Types';
    const selectedType = filterOptions.find((option) => option.id === collectionTypeId);
    return selectedType?.name ?? 'All Types';
  }, [collectionTypeId, filterOptions]);

  const selectedSortLabel = useMemo(() => {
    const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);
    return selectedSortOption?.label ?? SORT_OPTIONS[0].label;
  }, [sortBy]);

  const canGoPrev = offset > 0;
  const canGoNext = collectionsCount >= limit;
  const currentPage = Math.floor(offset / limit) + 1;

  const handleCollectionTypeChange = useCallback(
    (value: string) => {
      updateSearchParams((nextParams) => {
        if (value !== ALL_COLLECTION_VALUE) {
          const selected = filterOptions.find((option) => option.id === Number(value));
          if (selected) nextParams.set('collection', selected.name);
        } else {
          nextParams.delete('collection');
        }
        nextParams.delete('collection_type_id');
        nextParams.delete('offset');
      });
    },
    [filterOptions, updateSearchParams],
  );

  const handleReleaseTypeToggle = useCallback(
    (releaseTypeId: number, shouldCheck: boolean) => {
      updateSearchParams((nextParams) => {
        const currentIds = parseReleaseTypeParam(
          nextParams.get('release_type_id') ??
            nextParams.get('release_type') ??
            nextParams.get('groups'),
        );
        const nextIds = shouldCheck
          ? Array.from(new Set([...currentIds, releaseTypeId]))
          : currentIds.filter((id) => id !== releaseTypeId);
        if (nextIds.length === 0) nextParams.delete('release_type_id');
        else nextParams.set('release_type_id', nextIds.join(','));
        nextParams.delete('group');
        nextParams.delete('offset');
        nextParams.delete('groups');
        nextParams.delete('release_type');
      });
    },
    [updateSearchParams],
  );

  const handleLimitChange = useCallback(
    (selectedLimit: number) => {
      updateSearchParams((nextParams) => {
        if (selectedLimit === DEFAULT_LIMIT) nextParams.delete('limit');
        else nextParams.set('limit', String(selectedLimit));
        nextParams.delete('offset');
      });
    },
    [updateSearchParams],
  );

  const handleSortChange = useCallback(
    (selectedSort: string) => {
      updateSearchParams((nextParams) => {
        const normalizedSort = normalizeSortParam(selectedSort);
        nextParams.set('sort', normalizedSort);
        nextParams.delete('sortby');
        nextParams.delete('offset');
      });
    },
    [updateSearchParams],
  );

  const resetFilters = useCallback(() => {
    updateSearchParams((nextParams) => {
      nextParams.delete('collection');
      nextParams.delete('collection_type_id');
      nextParams.delete('limit');
      nextParams.delete('offset');
      nextParams.delete('sort');
      nextParams.delete('sortby');
      nextParams.delete('group');
      nextParams.delete('groups');
      nextParams.delete('release_type_id');
      nextParams.delete('release_type');
    });
  }, [updateSearchParams]);

  const goPrevPage = useCallback(() => {
    updateSearchParams((nextParams) => {
      const nextOffset = Math.max(0, offset - limit);
      if (nextOffset === DEFAULT_OFFSET) nextParams.delete('offset');
      else nextParams.set('offset', String(nextOffset));
    });
  }, [limit, offset, updateSearchParams]);

  const goNextPage = useCallback(() => {
    updateSearchParams((nextParams) => {
      const nextOffset = offset + limit;
      if (nextOffset === DEFAULT_OFFSET) nextParams.delete('offset');
      else nextParams.set('offset', String(nextOffset));
    });
  }, [limit, offset, updateSearchParams]);

  return {
    canGoNext,
    canGoPrev,
    collectionTypeId,
    currentPage,
    handleCollectionTypeChange,
    handleLimitChange,
    handleReleaseTypeToggle,
    handleSortChange,
    isResolvingCollectionSlug,
    limit,
    offset,
    query,
    resetFilters,
    selectedCollectionLabel,
    selectedReleaseTypeIds,
    selectedReleaseTypeLabel,
    selectedSortLabel,
    sortBy,
    goNextPage,
    goPrevPage,
  };
};

export default useCollectionListFilters;
