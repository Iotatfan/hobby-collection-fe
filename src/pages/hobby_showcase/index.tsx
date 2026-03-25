import { Box, Button, Center, Field, Flex, Grid, Spinner, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import useCollectionDetail from "@/hooks/collections/useCollectionDetail"
import { useEffect, useState, useCallback, useMemo, type CSSProperties } from "react"
import ItemCard from "./parts/ItemCard"
import ImageModal from "./parts/ImageModal"
import { AnimatePresence } from "framer-motion"
import { Link as RouterLink, useSearchParams } from "react-router-dom"
import { canManageCollection } from "@/services/http"
import collectionServices from "@/services/content/collectionServices"
import { ICollectionFilterQuery, ICollectionTypeFilterItem } from "@/libs/collection/collection"

const LIMIT_OPTIONS = [10, 20, 30, 50] as const
const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

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

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const { getCollectionDetail, collection } = useCollectionDetail()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingCollectionDetail, setIsLoadingCollectionDetail] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [filterOptions, setFilterOptions] = useState<ICollectionTypeFilterItem[]>([])
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
        }
    }, [collectionTypeId, limit, offset])

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
                const response = await collectionServices.getCollectionTypeFilters()
                setFilterOptions(response)
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
    const selectStyle: CSSProperties = {
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }

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
                        <select
                            style={selectStyle}
                            value={collectionTypeId ?? ""}
                            onChange={(event) => {
                                const value = event.target.value
                                updateSearchParams((nextParams) => {
                                    if (value) {
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
                            <option value=''>All Types</option>
                            {filterOptions.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </Field.Root>

                    <Field.Root maxW='120px'>
                        <Field.Label>Limit</Field.Label>
                        <select
                            style={selectStyle}
                            value={limit}
                            onChange={(event) => {
                                const selectedLimit = Number(event.target.value)
                                updateSearchParams((nextParams) => {
                                    if (selectedLimit === DEFAULT_LIMIT) nextParams.delete("limit")
                                    else nextParams.set("limit", String(selectedLimit))
                                    nextParams.delete("offset")
                                })
                            }}
                        >
                            {LIMIT_OPTIONS.map((limitOption) => (
                                <option key={limitOption} value={limitOption}>{limitOption}</option>
                            ))}
                        </select>
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
                                                builtAt={collection.built_at}
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
                {isModalOpen && <ImageModal
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
                    cover={collection?.cover}
                    images={collection?.pictures}
                    description={collection?.description}
                />}
            </AnimatePresence>
        </Flex>
    )
}

export default CollectionList
