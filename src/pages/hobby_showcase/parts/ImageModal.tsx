import { Box, IconButton, Image, VStack, Text, HStack, Badge, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface IImageModal {
    title?: string;
    images?: string[];
    grade?: string;
    description?: string;
    isOpen: boolean;
    isLoading?: boolean;
    onClose: () => void;
}

const ImageModal: React.FC<IImageModal> = ({
    title,
    images,
    grade,
    description,
    isLoading,
    isOpen,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }

    }, [isOpen, onClose])

    const handleCarouselClick = (index: number) => {
        setCurrentIndex(index)
    }

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? (images?.length ?? 1) - 1 : prevIndex - 1))
    }

    const handleNext = () => {
        setCurrentIndex((nextIndex) => (nextIndex === (images?.length ?? 1) - 1 ? 0 : nextIndex + 1))
    }

    return (
        <Box
            position="fixed"
            inset={0}
            zIndex={100}
            bg="blackAlpha.900"
            onClick={onClose}
        >
            {isLoading ? (
                <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    h='full'
                >
                    <Spinner
                        borderWidth="4px"
                        animationDuration="0.65s"
                        color="white"
                        size="xl"
                    />
                </Box>) : (
                <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    h='full'
                >
                    <Box
                        display="flex"
                        flexDirection={{ base: 'column', lg: 'row' }}
                        maxW="1400px"
                        w="full"
                        h={{ base: 'auto', lg: '80vh' }}
                        bg="gray.900"
                        borderRadius="md"
                        overflow="hidden"
                        boxShadow="2xl"
                        position='relative'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Section */}
                        <VStack
                            position='relative'
                            flex="1"
                            overflow="hidden"
                            alignItems='center'
                            justifyContent='center'
                            display='flex'
                            bg='black'
                            h={{ base: '50vh', lg: 'full' }}
                            paddingBottom={4}
                        >
                            <IconButton
                                position="absolute"
                                left={4}
                                zIndex={10}
                                aria-label="Previous image"
                                onClick={handlePrev}
                                variant="ghost"
                                color="white"
                                bg="blackAlpha.500"
                                _hover={{ bg: 'blackAlpha.700' }}
                                borderRadius="full"
                                size="lg"
                            >
                                <ChevronLeft size={32} />
                            </IconButton>

                            <Image
                                src={images && images.length > 0 ? images[currentIndex] : ''}
                                alt="Collection Image"
                                objectFit="contain"
                                h={{ base: '50vh', lg: 'full' }}
                            />

                            <IconButton
                                position="absolute"
                                right={4}
                                zIndex={10}
                                aria-label="Next image"
                                onClick={handleNext}
                                variant="ghost"
                                color="white"
                                bg="blackAlpha.500"
                                _hover={{ bg: 'blackAlpha.700' }}
                                borderRadius="full"
                                size="lg"
                            >
                                <ChevronRight size={32} />
                            </IconButton>

                            {/* Carousel Thumbnails */}
                            <HStack gap={2} mt={4} flexWrap="wrap">
                                {images?.map((image, index) => (
                                    <Box
                                        key={index}
                                        as="button"
                                        onClick={() => {
                                            handleCarouselClick(index);
                                        }}
                                        w={12}
                                        h={12}
                                        borderRadius="md"
                                        overflow="hidden"
                                        border={index === currentIndex ? '2px solid' : '2px solid transparent'}
                                        borderColor={index === currentIndex ? 'red.500' : 'transparent'}
                                    >
                                        <Image
                                            src={image}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </Box>
                                ))}
                            </HStack>
                        </VStack>

                        <Box
                            flex="1"
                            p={{ base: 6, lg: 10 }}
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            bg="gray.800"
                        >
                            <VStack align='start' gap={6}>
                                {/* Label */}
                                <Badge
                                    variant='solid'
                                    colorPalette={grade === 'High Grade' ? 'red' : 'yellow'}
                                    bottom={2} left={2}
                                    fontSize='sm'
                                    fontWeight='bold'
                                    px={1.5}
                                    py={1}
                                >
                                    {grade}
                                </Badge>

                                {/* Title */}
                                <Text
                                    fontSize={{ base: '2xl', lg: '3xl' }}
                                    fontWeight="bold"
                                    color="white"
                                    lineHeight="shorter"
                                >
                                    {title}
                                </Text>

                                {/* Description */}
                                <Text
                                    fontSize={{ base: 'md', lg: 'lg' }}
                                    color="gray.300"
                                    lineHeight="relaxed"
                                >
                                    {description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                                </Text>


                            </VStack>
                        </Box>

                        {/* Close Button */}
                        <IconButton
                            position={'absolute'}
                            right={0}
                            top={0}
                            zIndex={101}
                            color='white'
                            variant='ghost'
                            aria-label='Close modal'
                            size='lg'
                            onClick={onClose}
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            <X size={24} />
                        </IconButton>
                    </Box>
                </Box>
            )
            }

        </Box>
    )
}

export default ImageModal