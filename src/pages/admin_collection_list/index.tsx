import { Badge, Box, Button, Flex, Heading, Image, Spinner, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogOut, Pencil, Plus } from 'lucide-react';
import { clearAuthToken } from '@/services/http';
import useCollections from '@/hooks/collections/useCollections';
import collectionServices from '@/services/content/collectionServices';
import { cloudinarySizes } from '@/utils/cloudinary';
import {
  ICollectionStatus,
  ICollectionTypeFilterItem,
  IFiguresScaleFilterItem,
  IGunplaGradeFilterItem,
  IReleaseTypeDrawerItem,
} from '@/libs/collection/collection';
import useCollectionListFilters from '@/pages/collection_list/hooks/useCollectionListFilters';
import CollectionFilters from '@/pages/collection_list/parts/CollectionFilters';

const STATUS_LABELS: Record<ICollectionStatus, string> = {
  0: 'Wishlist',
  1: 'Backlog',
  2: 'Owned',
  3: 'Built',
};

const AdminCollectionList = () => {
  const { getCollections, collections, totalCount } = useCollections();
  const navigate = useNavigate();
  const requestControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionTypeOptions, setCollectionTypeOptions] = useState<ICollectionTypeFilterItem[]>(
    [],
  );
  const [figureScaleOptions, setFigureScaleOptions] = useState<IFiguresScaleFilterItem[]>([]);
  const [gunplaGradeOptions, setGunplaGradeOptions] = useState<IGunplaGradeFilterItem[]>([]);
  const [releaseTypeOptions, setReleaseTypeOptions] = useState<IReleaseTypeDrawerItem[]>([]);
  const {
    canGoNext,
    canGoPrev,
    collectionTypeId,
    currentPage,
    goNextPage,
    goPrevPage,
    handleCollectionTypeChange,
    handleGradeChange,
    handleScaleChange,
    handleReleaseTypeToggle,
    handleSortChange,
    isResolvingCollectionSlug,
    offset,
    query,
    selectedFigureScaleId,
    selectedGradeId,
    selectedReleaseTypeIds,
    selectedReleaseTypeLabel,
    selectedSortLabel,
    showFigureScaleFilter,
    showGunplaGradeFilter,
    sortBy,
  } = useCollectionListFilters({
    collectionsCount: collections?.length ?? 0,
    totalCount,
    collectionTypeOptions,
    figureScaleOptions,
    gunplaGradeOptions,
    releaseTypeOptions,
  });

  const fetchCollections = useCallback(async () => {
    if (isResolvingCollectionSlug) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await getCollections(query, controller.signal);
    } catch {
      if (!controller.signal.aborted) setErrorMessage('Failed to load collections.');
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [getCollections, isResolvingCollectionSlug, query]);

  useEffect(() => {
    void fetchCollections();
    return () => requestControllerRef.current?.abort();
  }, [fetchCollections]);

  useEffect(() => {
    if (!isLoading && offset > 0 && collections?.length === 0) goPrevPage();
  }, [collections, goPrevPage, isLoading, offset]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const filters = await collectionServices.getCollectionTypeFilters();
        setCollectionTypeOptions(filters.collection_types ?? []);
        setFigureScaleOptions(filters.figures_scales ?? []);
        setGunplaGradeOptions(filters.gunpla_grades ?? []);
        setReleaseTypeOptions(filters.release_types ?? []);
      } catch {
        setErrorMessage('Failed to load filter options.');
      }
    };
    void loadFilterOptions();
  }, []);

  return (
    <>
      <Helmet>
        <title>Manage Collections | Hobby Collection</title>
      </Helmet>
      <Box maxW="78rem" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        <Flex justify="space-between" align="center" gap={4} mb={6} wrap="wrap">
          <Box>
            <Heading size="lg">Manage collections</Heading>
            <Text color="fg.muted" mt={1}>
              Review and update your collection items.
            </Text>
          </Box>
          <Flex gap={2}>
            <Button
              variant="outline"
              onClick={() => {
                clearAuthToken();
                navigate('/admin/login', { replace: true });
              }}
            >
              <LogOut size={16} aria-hidden="true" /> Logout
            </Button>
            <Button asChild colorPalette="blue">
              <RouterLink to="/collection/new">
                <Plus size={16} aria-hidden="true" /> Add new
              </RouterLink>
            </Button>
          </Flex>
        </Flex>

        <CollectionFilters
          collectionTypeId={collectionTypeId}
          collectionTypeOptions={collectionTypeOptions}
          figureScaleOptions={figureScaleOptions}
          gunplaGradeOptions={gunplaGradeOptions}
          handleCollectionTypeChange={handleCollectionTypeChange}
          handleGradeChange={handleGradeChange}
          handleScaleChange={handleScaleChange}
          handleReleaseTypeToggle={handleReleaseTypeToggle}
          handleSortChange={handleSortChange}
          releaseTypeOptions={releaseTypeOptions}
          selectedFigureScaleId={selectedFigureScaleId}
          selectedGradeId={selectedGradeId}
          selectedReleaseTypeIds={selectedReleaseTypeIds}
          selectedReleaseTypeLabel={selectedReleaseTypeLabel}
          selectedSortLabel={selectedSortLabel}
          showFigureScaleFilter={showFigureScaleFilter}
          showGunplaGradeFilter={showGunplaGradeFilter}
          sortBy={sortBy}
        />

        {errorMessage && (
          <Text mt={4} color="red.500">
            {errorMessage}
          </Text>
        )}
        {isLoading ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <Box overflowX="auto" mt={6} bg="white" rounded="lg" shadow="sm">
            <Box as="table" w="full" minW="640px" borderCollapse="collapse">
              <Box as="thead" bg="gray.50">
                <Box as="tr">
                  {['Collection', 'Collection type', 'Status', 'Release type', ''].map(
                    (heading) => (
                      <Box
                        as="th"
                        key={heading}
                        textAlign="left"
                        px={4}
                        py={3}
                        fontSize="sm"
                        color="fg.muted"
                      >
                        {heading}
                      </Box>
                    ),
                  )}
                </Box>
              </Box>
              <Box as="tbody">
                {collections?.map((collection) => (
                  <Box as="tr" key={collection.id} borderTop="1px solid" borderColor="gray.100">
                    <Box as="td" px={4} py={3}>
                      <Flex align="center" gap={3}>
                        <Image
                          src={cloudinarySizes(collection.cover).thumb}
                          alt={`${collection.title} cover`}
                          onError={(event) => {
                            event.currentTarget.src = '/favicon.png';
                          }}
                          boxSize="52px"
                          rounded="md"
                          objectFit="cover"
                        />
                        <Text fontWeight="medium" lineClamp={2}>
                          {collection.title}
                        </Text>
                      </Flex>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text fontSize="sm">{collection.type?.name ?? '—'}</Text>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Badge
                        colorPalette={
                          collection.status === 3
                            ? 'green'
                            : collection.status === 1
                              ? 'orange'
                              : 'gray'
                        }
                      >
                        {STATUS_LABELS[collection.status ?? 0]}
                      </Badge>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text fontSize="sm">{collection.release_type?.name ?? '—'}</Text>
                    </Box>
                    <Box as="td" px={4} py={3} textAlign="right">
                      <Button asChild size="sm" variant="outline">
                        <RouterLink to={`/collection/${collection.id}/edit`}>
                          <Pencil size={14} /> Edit
                        </RouterLink>
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            {collections?.length === 0 && (
              <Text p={6} color="fg.muted">
                No collection items found for this filter.
              </Text>
            )}
          </Box>
        )}

        <Flex justify="space-between" align="center" mt={4}>
          <Button size="sm" variant="outline" disabled={!canGoPrev} onClick={goPrevPage}>
            Previous
          </Button>
          <Text fontSize="sm">Page {currentPage}</Text>
          <Button size="sm" variant="outline" disabled={!canGoNext} onClick={goNextPage}>
            Next
          </Button>
        </Flex>
      </Box>
    </>
  );
};

export default AdminCollectionList;
