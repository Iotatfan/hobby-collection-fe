import { Box, Button, Center, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import useCollections from '@/hooks/collections/useCollections';
import { useEffect, useState, useCallback } from 'react';
import ItemCard from './parts/ItemCard';
import { Link as RouterLink } from 'react-router-dom';
import { canManageCollection } from '@/services/http';
import collectionServices from '@/services/content/collectionServices';
import {
  ICollectionTypeFilterItem,
  IFiguresScaleFilterItem,
  IGunplaGradeFilterItem,
  IReleaseTypeDrawerItem,
} from '@/libs/collection/collection';
import useCollectionListFilters from './hooks/useCollectionListFilters';
import CollectionFilters from './parts/CollectionFilters';
import StatisticsSection from './parts/StatisticsSection';

const CollectionList = () => {
  const { getCollections, collections } = useCollections();
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionTypeOptions, setCollectionTypeOptions] = useState<ICollectionTypeFilterItem[]>(
    [],
  );
  const [figureScaleOptions, setFigureScaleOptions] = useState<IFiguresScaleFilterItem[]>([]);
  const [gunplaGradeOptions, setGunplaGradeOptions] = useState<IGunplaGradeFilterItem[]>([]);
  const [releaseTypeOptions, setReleaseTypeOptions] = useState<IReleaseTypeDrawerItem[]>([]);
  const canManage = canManageCollection();
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
    collectionTypeOptions,
    figureScaleOptions,
    gunplaGradeOptions,
    releaseTypeOptions,
  });

  const handleFetchCollections = useCallback(async () => {
    if (isResolvingCollectionSlug) return;
    setIsLoadingCollections(true);
    setErrorMessage(null);
    try {
      await getCollections(query);
    } catch {
      setErrorMessage('Failed to load collections.');
    } finally {
      setIsLoadingCollections(false);
    }
  }, [getCollections, isResolvingCollectionSlug, query]);

  useEffect(() => {
    void handleFetchCollections();
  }, [handleFetchCollections]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const filterContent = await collectionServices.getCollectionTypeFilters();
        setCollectionTypeOptions(filterContent.collection_types ?? []);
        setFigureScaleOptions(filterContent.figures_scales ?? []);
        setGunplaGradeOptions(filterContent.gunple_grades ?? []);
        setReleaseTypeOptions(filterContent.release_types ?? []);
      } catch {
        setErrorMessage('Failed to load filter options.');
      }
    };

    void loadFilterOptions();
  }, []);

  return (
    <Flex
      w="full"
      mt="6"
      pb="10"
      minH="80vh"
      alignItems="flex-start"
      gap="4"
      mx="auto"
      maxW="78rem"
      px={{ base: 4, md: 6, lg: 8 }}
    >
      <Box flexGrow="1" maxW="100%">
        <Flex justify="space-between" align="center" gap={3} wrap="wrap">
          {canManage && (
            <Button asChild size="sm" colorPalette="blue">
              <RouterLink to="/collection/new">Add New</RouterLink>
            </Button>
          )}
        </Flex>
        <StatisticsSection />
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
          <Text mt={2} color="red.500">
            {errorMessage}
          </Text>
        )}
        {isLoadingCollections ? (
          <Box display="flex" alignItems="center" justifyContent="center" h="50vh">
            <Spinner borderWidth="4px" animationDuration="0.65s" color="blackAlpha.800" size="xl" />
          </Box>
        ) : (
          <>
            <Grid
              marginTop={4}
              templateColumns={[
                'repeat(2, 1fr)',
                'repeat(3, 1fr)',
                'repeat(4, 1fr)',
                'repeat(4, 1fr)',
                'repeat(5, 1fr)',
              ]}
              gap="6px"
            >
              {collections?.map((collection, index) => (
                <Center key={collection.id}>
                  <ItemCard
                    id={collection.id}
                    index={index}
                    title={collection.title}
                    grade={collection.type?.grade?.short_name}
                    scale={collection.type?.scale}
                    typeName={collection.type?.name}
                    cover={collection.cover}
                    releaseType={collection.release_type?.name}
                    status={collection.status}
                    builtAt={collection.built_at}
                    acquiredAt={collection.acquired_at}
                    canManage={canManage}
                  />
                </Center>
              ))}
            </Grid>

            {collections?.length === 0 && (
              <Text mt={4} color="gray.500">
                No collection items found for this filter.
              </Text>
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
          </>
        )}
      </Box>
    </Flex>
  );
};

export default CollectionList;
