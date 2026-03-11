import { Box, Button, Center, Flex, Grid, Spinner, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import useCollectionDetail from "@/hooks/collections/useCollectionDetail"
import { useEffect, useState, useCallback } from "react"
import ItemCard from "./parts/ItemCard"
import ImageModal from "./parts/ImageModal"
import { AnimatePresence } from "framer-motion"
import { Link as RouterLink } from "react-router-dom"
import { canManageCollection } from "@/services/http"

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const { getCollectionDetail, collection } = useCollectionDetail()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingCollectionDetail, setIsLoadingCollectionDetail] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const canManage = canManageCollection()

    const handleFetchCollections = useCallback(async () => {
        setIsLoadingCollections(true)
        try {
            await getCollections()
        } finally {
            setIsLoadingCollections(false)
        }
    }, [getCollections])

    useEffect(() => {
        void handleFetchCollections()
    }, [handleFetchCollections])

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

    return (
        <Flex w='full' mt='5' minH='90vh' alignItems='flex-start' gap='4' mx='auto' maxW='78rem' px='2'>
            <Box flexGrow='1' maxW='100%'>
                <Flex justify='space-between' align='center' gap={3} wrap='wrap'>
                    <Text fontWeight='semibold'>Filter Section</Text>
                    {canManage && (
                        <Button asChild size='sm' colorPalette='blue'>
                            <RouterLink to='/collection/new'>Add New</RouterLink>
                        </Button>
                    )}
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
                                            cover={collection.cover}
                                            releaseType={collection.release_type.name}
                                            onClick={() => handleCardClick(collection.id)}
                                        ></ItemCard>
                                    </Center>
                                ))}
                            </Grid>
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
                    release={collection?.release_type.name}
                    title={collection?.title}
                    images={collection?.pictures}
                    description={collection?.description}
                />}
            </AnimatePresence>
        </Flex>
    )
}

export default CollectionList

