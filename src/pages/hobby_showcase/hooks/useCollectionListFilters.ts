import {
  ICollectionFilterQuery,
  ICollectionTypeFilterItem,
  IFiguresScaleFilterItem,
  IGunplaGradeFilterItem,
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
export const ALL_GUNPLA_GRADE_VALUE = '__all__';
export const ALL_FIGURE_SCALE_VALUE = '__all__';

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

const isGunplaCollectionType = (value: string) => normalizeCollectionName(value).includes('gunpla');

const isFigureCollectionType = (value: string) => normalizeCollectionName(value).includes('figure');

const normalizeSortParam = (value: string | null): string => {
  if (!value) return DEFAULT_SORT;
  if (value === 'latest_built') return 'latest';
  if (value === 'name_asc') return 'name';
  return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT;
};

type UseCollectionListFiltersOptions = {
  collectionsCount: number;
  collectionTypeOptions: ICollectionTypeFilterItem[];
  gunplaGradeOptions: IGunplaGradeFilterItem[];
  figureScaleOptions: IFiguresScaleFilterItem[];
  releaseTypeOptions: IReleaseTypeDrawerItem[];
};

const useCollectionListFilters = ({
  collectionsCount,
  collectionTypeOptions,
  gunplaGradeOptions,
  figureScaleOptions,
  releaseTypeOptions,
}: UseCollectionListFiltersOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const collectionValue = useMemo(() => searchParams.get('collection') ?? '', [searchParams]);
  const collectionTypeId = useMemo(() => {
    const legacyCollectionTypeId = parsePositiveNumberParam(searchParams.get('collection_type_id'));
    if (legacyCollectionTypeId) return legacyCollectionTypeId;
    if (!collectionValue) return undefined;

    const normalizedCollectionValue = normalizeCollectionName(collectionValue);
    const matchedOption = collectionTypeOptions.find((option) => {
      const normalizedName = normalizeCollectionName(option.name);
      return (
        normalizedName === normalizedCollectionValue ||
        toCollectionSlug(option.name) === collectionValue
      );
    });
    return matchedOption?.id;
  }, [collectionValue, collectionTypeOptions, searchParams]);

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
  const selectedGradeId = useMemo(
    () => parsePositiveNumberParam(searchParams.get('grade_id')),
    [searchParams],
  );
  const selectedFigureScaleId = useMemo(
    () =>
      parsePositiveNumberParam(searchParams.get('scale_id')) ??
      parsePositiveNumberParam(searchParams.get('grade_id')),
    [searchParams],
  );
  const isResolvingCollectionSlug = Boolean(collectionValue) && collectionTypeOptions.length === 0;
  const selectedCollectionType = useMemo(
    () => collectionTypeOptions.find((option) => option.id === collectionTypeId),
    [collectionTypeId, collectionTypeOptions],
  );
  const showGunplaGradeFilter = Boolean(
    selectedCollectionType && isGunplaCollectionType(selectedCollectionType.name),
  );
  const showFigureScaleFilter = Boolean(
    selectedCollectionType && isFigureCollectionType(selectedCollectionType.name),
  );

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
    if (!legacyCollectionTypeId || collectionTypeOptions.length === 0) return;

    const selected = collectionTypeOptions.find((option) => option.id === legacyCollectionTypeId);
    updateSearchParams((nextParams) => {
      if (selected) nextParams.set('collection', selected.name);
      nextParams.delete('collection_type_id');
    });
  }, [collectionTypeOptions, searchParams, updateSearchParams]);

  useEffect(() => {
    if (!selectedGradeId) return;

    const validOptionIds = showGunplaGradeFilter
      ? gunplaGradeOptions.map((option) => option.id)
      : [];

    if (validOptionIds.includes(selectedGradeId)) return;

    updateSearchParams((nextParams) => {
      nextParams.delete('grade_id');
      nextParams.delete('offset');
    });
  }, [gunplaGradeOptions, selectedGradeId, showGunplaGradeFilter, updateSearchParams]);

  useEffect(() => {
    if (!selectedFigureScaleId) return;

    const validOptionIds = showFigureScaleFilter
      ? figureScaleOptions.map((option) => option.id)
      : [];

    if (validOptionIds.includes(selectedFigureScaleId)) return;

    updateSearchParams((nextParams) => {
      nextParams.delete('scale_id');
      nextParams.delete('offset');
    });
  }, [figureScaleOptions, selectedFigureScaleId, showFigureScaleFilter, updateSearchParams]);

  const query = useMemo<ICollectionFilterQuery>(() => {
    return {
      collection_type_id: collectionTypeId,
      grade_id: showGunplaGradeFilter ? selectedGradeId : undefined,
      scale_id: showFigureScaleFilter ? selectedFigureScaleId : undefined,
      limit,
      offset,
      sort: sortBy,
      release_type_id: selectedReleaseTypeIds.length > 0 ? selectedReleaseTypeIds : undefined,
    };
  }, [
    collectionTypeId,
    limit,
    offset,
    selectedFigureScaleId,
    selectedGradeId,
    showFigureScaleFilter,
    showGunplaGradeFilter,
    sortBy,
    selectedReleaseTypeIds,
  ]);

  const selectedReleaseTypeLabel = useMemo(() => {
    if (selectedReleaseTypeIds.length === 0) return 'All';
    if (selectedReleaseTypeIds.length === 1) {
      const selectedType = releaseTypeOptions.find(
        (option) => option.id === selectedReleaseTypeIds[0],
      );
      return selectedType?.name ?? '1 selected';
    }
    return `${selectedReleaseTypeIds.length} selected`;
  }, [releaseTypeOptions, selectedReleaseTypeIds]);

  const selectedCollectionLabel = useMemo(() => {
    if (!collectionTypeId) return 'All';
    const selectedType = collectionTypeOptions.find((option) => option.id === collectionTypeId);
    return selectedType?.name ?? 'All';
  }, [collectionTypeId, collectionTypeOptions]);

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
          const selected = collectionTypeOptions.find((option) => option.id === Number(value));
          if (selected) nextParams.set('collection', selected.name);
        } else {
          nextParams.delete('collection');
        }
        nextParams.delete('collection_type_id');
        nextParams.delete('grade_id');
        nextParams.delete('scale_id');
        nextParams.delete('offset');
      });
    },
    [collectionTypeOptions, updateSearchParams],
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

  const handleGradeChange = useCallback(
    (value: string) => {
      updateSearchParams((nextParams) => {
        if (value === ALL_GUNPLA_GRADE_VALUE) {
          nextParams.delete('grade_id');
        } else {
          nextParams.set('grade_id', value);
        }
        nextParams.delete('offset');
      });
    },
    [updateSearchParams],
  );

  const handleScaleChange = useCallback(
    (value: string) => {
      updateSearchParams((nextParams) => {
        if (value === ALL_FIGURE_SCALE_VALUE) {
          nextParams.delete('scale_id');
        } else {
          nextParams.set('scale_id', value);
        }
        nextParams.delete('offset');
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
      nextParams.delete('grade_id');
      nextParams.delete('scale_id');
      nextParams.delete('release_type_id');
      nextParams.delete('release_type');
    });
  }, [updateSearchParams]);

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }, []);

  const goPrevPage = useCallback(() => {
    scrollToTop();
    updateSearchParams((nextParams) => {
      const nextOffset = Math.max(0, offset - limit);
      if (nextOffset === DEFAULT_OFFSET) nextParams.delete('offset');
      else nextParams.set('offset', String(nextOffset));
    });
  }, [limit, offset, updateSearchParams, scrollToTop]);

  const goNextPage = useCallback(() => {
    scrollToTop();
    updateSearchParams((nextParams) => {
      const nextOffset = offset + limit;
      if (nextOffset === DEFAULT_OFFSET) nextParams.delete('offset');
      else nextParams.set('offset', String(nextOffset));
    });
  }, [limit, offset, updateSearchParams, scrollToTop]);

  return {
    canGoNext,
    canGoPrev,
    collectionTypeId,
    currentPage,
    handleCollectionTypeChange,
    handleGradeChange,
    handleScaleChange,
    handleLimitChange,
    handleReleaseTypeToggle,
    handleSortChange,
    isResolvingCollectionSlug,
    limit,
    offset,
    query,
    resetFilters,
    selectedCollectionLabel,
    selectedFigureScaleId,
    selectedGradeId,
    selectedReleaseTypeIds,
    selectedReleaseTypeLabel,
    selectedSortLabel,
    showFigureScaleFilter,
    showGunplaGradeFilter,
    sortBy,
    goNextPage,
    goPrevPage,
  };
};

export default useCollectionListFilters;
