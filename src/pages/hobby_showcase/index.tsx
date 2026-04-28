import {
  Box,
  Button,
  Center,
  Field,
  Flex,
  Grid,
  Menu,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react';
import useCollections from '@/hooks/collections/useCollections';
import { useEffect, useState, useCallback } from 'react';
import ItemCard from './parts/ItemCard';
import { Link as RouterLink } from 'react-router-dom';
import { canManageCollection } from '@/services/http';
import collectionServices from '@/services/content/collectionServices';
import { ICollectionTypeFilterItem, IReleaseTypeDrawerItem } from '@/libs/collection/collection';
import useCollectionListFilters, {
  ALL_COLLECTION_VALUE,
  LIMIT_OPTIONS,
  SORT_OPTIONS,
} from './hooks/useCollectionListFilters';

const CollectionList = () => {
  const { getCollections, collections } = useCollections();
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<ICollectionTypeFilterItem[]>([]);
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
    handleLimitChange,
    handleReleaseTypeToggle,
    handleSortChange,
    isResolvingCollectionSlug,
    limit,
    query,
    resetFilters,
    selectedCollectionLabel,
    selectedReleaseTypeIds,
    selectedReleaseTypeLabel,
    selectedSortLabel,
    sortBy,
  } = useCollectionListFilters({
    collectionsCount: collections?.length ?? 0,
    filterOptions,
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
        setFilterOptions(filterContent.collection_types ?? []);
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
      mt="5"
      pb="2"
      minH="80vh"
      alignItems="flex-start"
      gap="4"
      mx="auto"
      maxW="78rem"
      px="2"
    >
      <Box flexGrow="1" maxW="100%" px={{ base: 4, lg: 6 }}>
        <Flex justify="space-between" align="center" gap={3} wrap="wrap">
          {canManage && (
            <Button asChild size="sm" colorPalette="blue">
              <RouterLink to="/collection/new">Add New</RouterLink>
            </Button>
          )}
        </Flex>
        <Flex gap={3} mt={3} flexWrap="wrap" align="end">
          <Field.Root flex="1" minW="220px" maxW="360px">
            <Field.Label>Collection</Field.Label>
            <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
              <Menu.Trigger asChild>
                <Button size="sm" variant="outline" justifyContent="space-between" w="full">
                  <Text
                    as="span"
                    flex="1"
                    minW="0"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    textAlign="left"
                  >
                    {selectedCollectionLabel}
                  </Text>
                  <Text as="span" ml={2} flexShrink={0}>
                    v
                  </Text>
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content maxH="220px" overflowY="auto">
                    <Menu.RadioItemGroup
                      value={collectionTypeId ? String(collectionTypeId) : ALL_COLLECTION_VALUE}
                      onValueChange={(details) => {
                        handleCollectionTypeChange(details.value);
                      }}
                    >
                      <Menu.RadioItem value={ALL_COLLECTION_VALUE}>
                        <Menu.ItemIndicator />
                        <Text as="span">All Types</Text>
                      </Menu.RadioItem>
                      {filterOptions.map((type) => (
                        <Menu.RadioItem key={type.id} value={String(type.id)}>
                          <Menu.ItemIndicator />
                          <Text
                            as="span"
                            display="block"
                            minW="0"
                            flex="1"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {type.name}
                          </Text>
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioItemGroup>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Field.Root>

          <Field.Root w="240px" minW="240px" maxW="240px" flex="0 0 auto">
            <Field.Label>Release Types</Field.Label>
            <Menu.Root
              closeOnSelect={false}
              positioning={{ placement: 'bottom-start', sameWidth: true }}
            >
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  w="240px"
                  minW="240px"
                  maxW="240px"
                  justifyContent="space-between"
                >
                  <Text
                    as="span"
                    flex="1"
                    minW="0"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    textAlign="left"
                  >
                    {selectedReleaseTypeLabel}
                  </Text>
                  <Text as="span" ml={2} flexShrink={0}>
                    v
                  </Text>
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content w="240px" minW="240px" maxW="240px" maxH="180px" overflowY="auto">
                    {releaseTypeOptions.length === 0 && (
                      <Text fontSize="sm" color="gray.500" px={2} py={1}>
                        No release types available.
                      </Text>
                    )}
                    <Menu.ItemGroup>
                      {releaseTypeOptions.map((releaseType) => {
                        const isChecked = selectedReleaseTypeIds.includes(releaseType.id);
                        return (
                          <Menu.CheckboxItem
                            key={releaseType.id}
                            value={String(releaseType.id)}
                            checked={isChecked}
                            onCheckedChange={() => {
                              const shouldCheck = !isChecked;
                              handleReleaseTypeToggle(releaseType.id, shouldCheck);
                            }}
                          >
                            <Menu.ItemIndicator />
                            <Text
                              as="span"
                              display="block"
                              minW="0"
                              flex="1"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {releaseType.name}
                            </Text>
                          </Menu.CheckboxItem>
                        );
                      })}
                    </Menu.ItemGroup>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Field.Root>

          <Field.Root maxW="120px">
            <Field.Label>Limit</Field.Label>
            <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
              <Menu.Trigger asChild>
                <Button size="sm" variant="outline" justifyContent="space-between" w="full">
                  <Text as="span" textAlign="left">
                    {limit}
                  </Text>
                  <Text as="span" ml={2} flexShrink={0}>
                    v
                  </Text>
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.RadioItemGroup
                      value={String(limit)}
                      onValueChange={(details) => {
                        handleLimitChange(Number(details.value));
                      }}
                    >
                      {LIMIT_OPTIONS.map((limitOption) => (
                        <Menu.RadioItem key={limitOption} value={String(limitOption)}>
                          <Menu.ItemIndicator />
                          <Text as="span">{limitOption}</Text>
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioItemGroup>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Field.Root>

          <Field.Root maxW="220px">
            <Field.Label>Sort By</Field.Label>
            <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
              <Menu.Trigger asChild>
                <Button size="sm" variant="outline" justifyContent="space-between" w="full">
                  <Text
                    as="span"
                    flex="1"
                    minW="0"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    textAlign="left"
                  >
                    {selectedSortLabel}
                  </Text>
                  <Text as="span" ml={2} flexShrink={0}>
                    v
                  </Text>
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.RadioItemGroup
                      value={sortBy}
                      onValueChange={(details) => {
                        handleSortChange(details.value);
                      }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <Menu.RadioItem key={option.value} value={option.value}>
                          <Menu.ItemIndicator />
                          <Text as="span">{option.label}</Text>
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioItemGroup>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Field.Root>

          <Button size="sm" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </Flex>
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
