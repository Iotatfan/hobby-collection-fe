import { Box, Center, Flex, Grid, Text } from "@chakra-ui/react"
import useCollections from "@/hooks/collections/useCollections"
import { useEffect, useState } from "react"
import ItemCard from "./parts/ItemCard"
import ImageModal from "./parts/ImageModal"

const CollectionList = () => {
    const { getCollections, collections } = useCollections()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const isLoadingCollections = false

    const handleFetchCollections = async () => {
        await getCollections()
    }

    const handleCardClick = (id: number) => {
        // fetchCollectionDetail(id)
        setIsModalOpen(true)
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
                        <Grid></Grid>
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
            />}
        </Flex>
    )
}

export default CollectionList