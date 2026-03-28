import { Box, Button, Center, Field, Flex, Grid, Menu, Portal, Spinner, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import useCollectionDetail from "@/hooks/collections/useCollectionDetail"
import { useEffect, useState, useCallback, useMemo } from "react"
import ItemCard from "./parts/ItemCard"
import ItemModal from "./parts/ItemModal"
import { AnimatePresence } from "framer-motion"
import { Link as RouterLink, useSearchParams } from "react-router-dom"
import { canManageCollection } from "@/services/http"
import collectionServices from "@/services/content/collectionServices"
import { ICollectionFilterQuery, ICollectionTypeFilterItem, IReleaseTypeDrawerItem } from "@/libs/collection/collection"

const LIMIT_OPTIONS = [10, 20, 30, 50] as const
const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0
const DEFAULT_SORT = "latest"
const ALL_COLLECTION_VALUE = "__all__"
const SORT_OPTIONS = [
    { value: "latest", label: "Latest Activity" },
    { value: "name", label: "Name (A-Z)" },
    { value: "name_desc", label: "Name (Z-A)" },
] as const

const parsePositiveNumberParam = (value: string | null): number | undefined => {
    if (!value) return undefined
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) return undefined
    return parsed
}

const toCollectionSlug = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

const normalizeCollectionName = (value: string): string => value.trim().toLowerCase()

const parseLimitParam = (value: string | null): number => {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || !LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number])) {
        return DEFAULT_LIMIT
    }
    return parsed
}

const parseOffsetParam = (value: string | null): number => {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0) return DEFAULT_OFFSET
    return parsed
}

const parseReleaseTypeParam = (value: string | null): number[] => {
    if (!value) return []
    return value
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0)
}

const normalizeSortParam = (value: string | null): string => {
    if (!value) return DEFAULT_SORT
    if (value === "latest_built") return "latest"
    if (value === "name_asc") return "name"
    return SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT
}

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const { getCollectionDetail, collection } = useCollectionDetail()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingCollectionDetail, setIsLoadingCollectionDetail] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [filterOptions, setFilterOptions] = useState<ICollectionTypeFilterItem[]>([])
    const [releaseTypeOptions, setReleaseTypeOptions] = useState<IReleaseTypeDrawerItem[]>([])
    const canManage = canManageCollection()
    const collectionValue = useMemo(() => searchParams.get("collection") ?? "", [searchParams])
    const collectionTypeId = useMemo(() => {
        const legacyCollectionTypeId = parsePositiveNumberParam(searchParams.get("collection_type_id"))
        if (legacyCollectionTypeId) return legacyCollectionTypeId
        if (!collectionValue) return undefined

        const normalizedCollectionValue = normalizeCollectionName(collectionValue)
        const matchedOption = filterOptions.find((option) => {
            const normalizedName = normalizeCollectionName(option.name)
            return normalizedName === normalizedCollectionValue || toCollectionSlug(option.name) === collectionValue
        })
        return matchedOption?.id
    }, [collectionValue, filterOptions, searchParams])
    const limit = useMemo(() => parseLimitParam(searchParams.get("limit")), [searchParams])
    const offset = useMemo(() => parseOffsetParam(searchParams.get("offset")), [searchParams])
    const sortBy = useMemo(() => {
        const sortParam = searchParams.get("sort")
        if (sortParam) return normalizeSortParam(sortParam)
        return normalizeSortParam(searchParams.get("sortby"))
    }, [searchParams])
    const selectedReleaseTypeIds = useMemo(() => {
        const releaseTypeParam = searchParams.get("release_type_id")
        if (releaseTypeParam) return parseReleaseTypeParam(releaseTypeParam)
        const legacyReleaseTypeParam = searchParams.get("release_type")
        if (legacyReleaseTypeParam) return parseReleaseTypeParam(legacyReleaseTypeParam)
        return parseReleaseTypeParam(searchParams.get("groups"))
    }, [searchParams])
    const isResolvingCollectionSlug = Boolean(collectionValue) && filterOptions.length === 0

    const updateSearchParams = useCallback((updater: (nextParams: URLSearchParams) => void) => {
        const nextParams = new URLSearchParams(searchParams)
        updater(nextParams)
        setSearchParams(nextParams)
    }, [searchParams, setSearchParams])

    const query = useMemo<ICollectionFilterQuery>(() => {
        return {
            collection_type_id: collectionTypeId,
            limit,
            offset,
            sort: sortBy,
            release_type_id: selectedReleaseTypeIds.length > 0 ? selectedReleaseTypeIds : undefined,
        }
    }, [collectionTypeId, limit, offset, sortBy, selectedReleaseTypeIds])

    const selectedReleaseTypeLabel = useMemo(() => {
        if (selectedReleaseTypeIds.length === 0) return "All Release Types"
        if (selectedReleaseTypeIds.length === 1) {
            const selectedType = releaseTypeOptions.find((option) => option.id === selectedReleaseTypeIds[0])
            return selectedType?.name ?? "1 selected"
        }
        return `${selectedReleaseTypeIds.length} selected`
    }, [releaseTypeOptions, selectedReleaseTypeIds])
    const selectedCollectionLabel = useMemo(() => {
        if (!collectionTypeId) return "All Types"
        const selectedType = filterOptions.find((option) => option.id === collectionTypeId)
        return selectedType?.name ?? "All Types"
    }, [collectionTypeId, filterOptions])
    const selectedSortLabel = useMemo(() => {
        const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy)
        return selectedSortOption?.label ?? SORT_OPTIONS[0].label
    }, [sortBy])

    const handleFetchCollections = useCallback(async () => {
        if (isResolvingCollectionSlug) return
        setIsLoadingCollections(true)
        setErrorMessage(null)
        try {
            await getCollections(query)
        } catch {
            setErrorMessage("Failed to load collections.")
        } finally {
            setIsLoadingCollections(false)
        }
    }, [getCollections, isResolvingCollectionSlug, query])

    useEffect(() => {
        void handleFetchCollections()
    }, [handleFetchCollections])

    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const [collectionFilters, drawerContent] = await Promise.all([
                    collectionServices.getCollectionTypeFilters(),
                    collectionServices.getDrawerContent(),
                ])
                setFilterOptions(collectionFilters)
                setReleaseTypeOptions(drawerContent.release_types ?? [])
            } catch {
                setErrorMessage("Failed to load filter options.")
            }
        }

        void loadFilterOptions()
    }, [])

    useEffect(() => {
        const legacyCollectionTypeId = parsePositiveNumberParam(searchParams.get("collection_type_id"))
        if (!legacyCollectionTypeId) return
        if (filterOptions.length === 0) return

        const selected = filterOptions.find((option) => option.id === legacyCollectionTypeId)
        updateSearchParams((nextParams) => {
            if (selected) nextParams.set("collection", selected.name)
            nextParams.delete("collection_type_id")
        })
    }, [filterOptions, searchParams, updateSearchParams])

    const handleCardClick = async (id: number) => {
        setIsLoadingCollectionDetail(true)
        setIsModalOpen(true)
        setErrorMessage(null)
        try {
            await getCollectionDetail(id)
        } catch {
            setIsModalOpen(false)
            setErrorMessage("Failed to load collection detail.")
        } finally {
            setIsLoadingCollectionDetail(false)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const canGoPrev = offset > 0
    const canGoNext = (collections?.length ?? 0) >= limit
    const currentPage = Math.floor(offset / limit) + 1

    return (
        <Flex w='full' mt='5' minH='90vh' alignItems='flex-start' gap='4' mx='auto' maxW='78rem' px='2'>
            <Box flexGrow='1' maxW='100%'>
                <Flex justify='space-between' align='center' gap={3} wrap='wrap'>
                    {canManage && (
                        <Button asChild size='sm' colorPalette='blue'>
                            <RouterLink to='/collection/new'>Add New</RouterLink>
                        </Button>
                    )}
                </Flex>
                <Flex gap={3} mt={3} flexWrap='wrap' align='end'>
                    <Field.Root flex='1' minW='220px' maxW='360px'>
                        <Field.Label>Collection</Field.Label>
                        <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
                            <Menu.Trigger asChild>
                                <Button size='sm' variant='outline' justifyContent='space-between' w='full'>
                                    <Text
                                        as='span'
                                        flex='1'
                                        minW='0'
                                        whiteSpace='nowrap'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        textAlign='left'
                                    >
                                        {selectedCollectionLabel}
                                    </Text>
                                    <Text as='span' ml={2} flexShrink={0}>v</Text>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content maxH='220px' overflowY='auto'>
                                        <Menu.RadioItemGroup
                                            value={collectionTypeId ? String(collectionTypeId) : ALL_COLLECTION_VALUE}
                                            onValueChange={(details) => {
                                                const value = details.value
                                                updateSearchParams((nextParams) => {
                                                    if (value !== ALL_COLLECTION_VALUE) {
                                                        const selected = filterOptions.find((option) => option.id === Number(value))
                                                        if (selected) nextParams.set("collection", selected.name)
                                                    } else {
                                                        nextParams.delete("collection")
                                                    }
                                                    nextParams.delete("collection_type_id")
                                                    nextParams.delete("offset")
                                                })
                                            }}
                                        >
                                            <Menu.RadioItem value={ALL_COLLECTION_VALUE}>
                                                <Menu.ItemIndicator />
                                                <Text as='span'>All Types</Text>
                                            </Menu.RadioItem>
                                            {filterOptions.map((type) => (
                                                <Menu.RadioItem key={type.id} value={String(type.id)}>
                                                    <Menu.ItemIndicator />
                                                    <Text
                                                        as='span'
                                                        display='block'
                                                        minW='0'
                                                        flex='1'
                                                        whiteSpace='nowrap'
                                                        overflow='hidden'
                                                        textOverflow='ellipsis'
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

                    <Field.Root w='240px' minW='240px' maxW='240px' flex='0 0 auto'>
                        <Field.Label>Release Types</Field.Label>
                        <Menu.Root closeOnSelect={false} positioning={{ placement: "bottom-start", sameWidth: true }}>
                            <Menu.Trigger asChild>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    w='240px'
                                    minW='240px'
                                    maxW='240px'
                                    justifyContent='space-between'
                                >
                                    <Text
                                        as='span'
                                        flex='1'
                                        minW='0'
                                        whiteSpace='nowrap'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        textAlign='left'
                                    >
                                        {selectedReleaseTypeLabel}
                                    </Text>
                                    <Text as='span' ml={2} flexShrink={0}>v</Text>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content w='240px' minW='240px' maxW='240px' maxH='180px' overflowY='auto'>
                                        {releaseTypeOptions.length === 0 && (
                                            <Text fontSize='sm' color='gray.500' px={2} py={1}>No release types available.</Text>
                                        )}
                                        <Menu.ItemGroup>
                                            {releaseTypeOptions.map((releaseType) => {
                                                const isChecked = selectedReleaseTypeIds.includes(releaseType.id)
                                                return (
                                                    <Menu.CheckboxItem
                                                        key={releaseType.id}
                                                        value={String(releaseType.id)}
                                                        checked={isChecked}
                                                    onCheckedChange={() => {
                                                        const shouldCheck = !isChecked
                                                        updateSearchParams((nextParams) => {
                                                            const currentIds = parseReleaseTypeParam(
                                                                nextParams.get("release_type_id")
                                                                ?? nextParams.get("release_type")
                                                                ?? nextParams.get("groups")
                                                            )
                                                                const nextIds = shouldCheck
                                                                    ? Array.from(new Set([...currentIds, releaseType.id]))
                                                                    : currentIds.filter((id) => id !== releaseType.id)
                                                                if (nextIds.length === 0) nextParams.delete("release_type_id")
                                                                else nextParams.set("release_type_id", nextIds.join(","))
                                                                nextParams.delete("group")
                                                                nextParams.delete("offset")
                                                                nextParams.delete("groups")
                                                                nextParams.delete("release_type")
                                                            })
                                                        }}
                                                    >
                                                        <Menu.ItemIndicator />
                                                        <Text
                                                            as='span'
                                                            display='block'
                                                            minW='0'
                                                            flex='1'
                                                            whiteSpace='nowrap'
                                                            overflow='hidden'
                                                            textOverflow='ellipsis'
                                                        >
                                                            {releaseType.name}
                                                        </Text>
                                                    </Menu.CheckboxItem>
                                                )
                                            })}
                                        </Menu.ItemGroup>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    </Field.Root>

                    <Field.Root maxW='120px'>
                        <Field.Label>Limit</Field.Label>
                        <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
                            <Menu.Trigger asChild>
                                <Button size='sm' variant='outline' justifyContent='space-between' w='full'>
                                    <Text as='span' textAlign='left'>{limit}</Text>
                                    <Text as='span' ml={2} flexShrink={0}>v</Text>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.RadioItemGroup
                                            value={String(limit)}
                                            onValueChange={(details) => {
                                                const selectedLimit = Number(details.value)
                                                updateSearchParams((nextParams) => {
                                                    if (selectedLimit === DEFAULT_LIMIT) nextParams.delete("limit")
                                                    else nextParams.set("limit", String(selectedLimit))
                                                    nextParams.delete("offset")
                                                })
                                            }}
                                        >
                                            {LIMIT_OPTIONS.map((limitOption) => (
                                                <Menu.RadioItem key={limitOption} value={String(limitOption)}>
                                                    <Menu.ItemIndicator />
                                                    <Text as='span'>{limitOption}</Text>
                                                </Menu.RadioItem>
                                            ))}
                                        </Menu.RadioItemGroup>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    </Field.Root>

                    <Field.Root maxW='220px'>
                        <Field.Label>Sort By</Field.Label>
                        <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
                            <Menu.Trigger asChild>
                                <Button size='sm' variant='outline' justifyContent='space-between' w='full'>
                                    <Text
                                        as='span'
                                        flex='1'
                                        minW='0'
                                        whiteSpace='nowrap'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        textAlign='left'
                                    >
                                        {selectedSortLabel}
                                    </Text>
                                    <Text as='span' ml={2} flexShrink={0}>v</Text>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.RadioItemGroup
                                            value={sortBy}
                                            onValueChange={(details) => {
                                                const selectedSort = details.value
                                                updateSearchParams((nextParams) => {
                                                    const normalizedSort = normalizeSortParam(selectedSort)
                                                    nextParams.set("sort", normalizedSort)
                                                    nextParams.delete("sortby")
                                                    nextParams.delete("offset")
                                                })
                                            }}
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <Menu.RadioItem key={option.value} value={option.value}>
                                                    <Menu.ItemIndicator />
                                                    <Text as='span'>{option.label}</Text>
                                                </Menu.RadioItem>
                                            ))}
                                        </Menu.RadioItemGroup>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    </Field.Root>

                    <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                            updateSearchParams((nextParams) => {
                                nextParams.delete("collection")
                                nextParams.delete("collection_type_id")
                                nextParams.delete("limit")
                                nextParams.delete("offset")
                                nextParams.delete("sort")
                                nextParams.delete("sortby")
                                nextParams.delete("group")
                                nextParams.delete("groups")
                                nextParams.delete("release_type_id")
                                nextParams.delete("release_type")
                            })
                        }}
                    >
                        Reset
                    </Button>
                </Flex>
                {errorMessage && <Text mt={2} color="red.500">{errorMessage}</Text>}
                {
                    isLoadingCollections ?
                        (
                            // Show Skeleton
                            <Box
                                display='flex'
                                alignItems='center'
                                justifyContent='center'
                                h='50vh'
                            >
                                <Spinner
                                    borderWidth="4px"
                                    animationDuration="0.65s"
                                    color="blackAlpha.800"
                                    size="xl"
                                />
                            </Box>
                        )
                        :
                        (
                            // Loading Complete
                            <>
                                <Grid
                                    marginTop={4}
                                    templateColumns={
                                        [
                                            'repeat(2, 1fr)',
                                            'repeat(3, 1fr)',
                                            'repeat(4, 1fr)',
                                            'repeat(4, 1fr)',
                                            'repeat(5, 1fr)',
                                        ]
                                    } gap='6px'>
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
                                                onClick={() => handleCardClick(collection.id)}
                                            ></ItemCard>
                                        </Center>
                                    ))}
                                </Grid>

                                {collections?.length === 0 && (
                                    <Text mt={4} color='gray.500'>No collection items found for this filter.</Text>
                                )}

                                <Flex justify='space-between' align='center' mt={4}>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        disabled={!canGoPrev}
                                        onClick={() => {
                                            updateSearchParams((nextParams) => {
                                                const nextOffset = Math.max(0, offset - limit)
                                                if (nextOffset === DEFAULT_OFFSET) nextParams.delete("offset")
                                                else nextParams.set("offset", String(nextOffset))
                                            })
                                        }}
                                    >
                                        Previous
                                    </Button>
                                    <Text fontSize='sm'>Page {currentPage}</Text>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        disabled={!canGoNext}
                                        onClick={() => {
                                            updateSearchParams((nextParams) => {
                                                const nextOffset = offset + limit
                                                if (nextOffset === DEFAULT_OFFSET) nextParams.delete("offset")
                                                else nextParams.set("offset", String(nextOffset))
                                            })
                                        }}
                                    >
                                        Next
                                    </Button>
                                </Flex>
                            </>
                        )
                }
            </Box>

            <AnimatePresence>
                {isModalOpen && <ItemModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    isLoading={isLoadingCollectionDetail}
                    collectionId={collection?.id}
                    type={collection?.type?.name}
                    grade={collection?.type?.grade?.name}
                    scale={collection?.type?.scale}
                    series={collection?.series?.name}
                    manufacturer={collection?.manufacturer?.name}
                    release={collection?.release_type?.name}
                    title={collection?.title}
                    status={collection?.status}
                    builtDate={collection?.built_at}
                    acquiredDate={collection?.acquired_at}
                    cover={collection?.cover}
                    images={collection?.pictures}
                    addons={collection?.addons}
                    description={collection?.description}
                />}
            </AnimatePresence>
        </Flex>
    )
}

export default CollectionList
