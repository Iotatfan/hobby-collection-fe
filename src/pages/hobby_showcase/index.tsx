import { Box, Center, Flex, Grid, Spinner, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import useCollectionDetail from "@/hooks/collections/useCollectionDetail"
import { useEffect, useState } from "react"
import ItemCard from "./parts/ItemCard"
import ImageModal from "./parts/ImageModal"

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const { getCollectionDetail, collection } = useCollectionDetail()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingCollectionDetail, setIsLoadingCollectionDetail] = useState(false)

    const handleFetchCollections = async () => {
        setIsLoadingCollections(true)
        await getCollections().then(() => {
            setIsLoadingCollections(false)
        })
    }

    const handleCardClick = async (id: number) => {
        setIsLoadingCollectionDetail(true)
        setIsModalOpen(true)
        await getCollectionDetail(id).then(() => {
            setIsLoadingCollectionDetail(false)
        }).
            catch(() => {
                setIsModalOpen(false)
            })
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        handleFetchCollections()
    }, [])


    return (
        <Flex w='full' mt='5' minH='90vh' alignItems='flex-start' gap='4' mx='auto' maxW='78rem' px='2'>
            <Box flexGrow='1' maxW='100%'>
                <Text>Filter Section</Text>
                {
                    isLoadingCollections ? (
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
                                } gap='4'>
                                {collections?.map((collection) => (
                                    <Center>
                                        <ItemCard
                                            key={collection.id}
                                            title={collection.title}
                                            grade={collection.type.grade.name}
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

            {isModalOpen && <ImageModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                isLoading={isLoadingCollectionDetail}
                grade={collection?.type.grade.name}
                title={collection?.title}
                images={collection?.pictures}
                description={collection?.description}
            />}
        </Flex>
    )
}

export default CollectionList