import { Box, Button, Center, Field, Flex, Grid, Spinner, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import useCollectionDetail from "@/hooks/collections/useCollectionDetail"
import { useEffect, useState, useCallback, useMemo, type CSSProperties } from "react"
import ItemCard from "./parts/ItemCard"
import ImageModal from "./parts/ImageModal"
import { AnimatePresence } from "framer-motion"
import { Link as RouterLink } from "react-router-dom"
import { canManageCollection } from "@/services/http"
import collectionServices from "@/services/content/collectionServices"
import { ICollectionDrawerContent, ICollectionFilterQuery } from "@/libs/collection/collection"

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const { getCollectionDetail, collection } = useCollectionDetail()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingCollectionDetail, setIsLoadingCollectionDetail] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [drawerContent, setDrawerContent] = useState<ICollectionDrawerContent>()
    const [collectionTypeId, setCollectionTypeId] = useState<number | undefined>()
    const [limit, setLimit] = useState(20)
    const [offset, setOffset] = useState(0)
    const canManage = canManageCollection()

    const query = useMemo<ICollectionFilterQuery>(() => {
        return {
            collection_type_id: collectionTypeId,
            limit,
            offset,
        }
    }, [collectionTypeId, limit, offset])

    const handleFetchCollections = useCallback(async () => {
        setIsLoadingCollections(true)
        setErrorMessage(null)
        try {
            await getCollections(query)
        } catch {
            setErrorMessage("Failed to load collections.")
        } finally {
            setIsLoadingCollections(false)
        }
    }, [getCollections, query])

    useEffect(() => {
        void handleFetchCollections()
    }, [handleFetchCollections])

    useEffect(() => {
        const loadDrawerContent = async () => {
            try {
                const response = await collectionServices.getDrawerContent()
                setDrawerContent(response)
            } catch {
                setErrorMessage("Failed to load filter options.")
            }
        }

        void loadDrawerContent()
    }, [])

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
                                setCollectionTypeId(value ? Number(value) : undefined)
                                setOffset(0)
                            }}
                        >
                            <option value=''>All Types</option>
                            {(drawerContent?.collection_types ?? []).map((type) => (
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
                                setLimit(Number(event.target.value))
                                setOffset(0)
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                        </select>
                    </Field.Root>

                    <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                            setCollectionTypeId(undefined)
                            setLimit(20)
                            setOffset(0)
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
                                                grade={collection.type.grade.short_name}
                                                scale={collection.type.scale}
                                                typeName={collection.type.name}
                                                cover={collection.cover}
                                                releaseType={collection.release_type.name}
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
                                        onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                                    >
                                        Previous
                                    </Button>
                                    <Text fontSize='sm'>Page {currentPage}</Text>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        disabled={!canGoNext}
                                        onClick={() => setOffset((prev) => prev + limit)}
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
                    grade={collection?.type.grade.name}
                    scale={collection?.type.scale}
                    series={collection?.series?.name}
                    manufacturer={collection?.manufacturer?.name}
                    release={collection?.release_type.name}
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
