import { Box, IconButton, Image, VStack, Text, HStack, Badge, Spinner } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from "framer-motion";


const MotionBox = motion(Box);
interface IImageModal {
    title?: string;
    images?: string[];
    grade?: string;
    release?: string;
    description?: string;
    isOpen: boolean;
    isLoading?: boolean;
    onClose: () => void;
}

const ImageModal: React.FC<IImageModal> = ({
    title,
    images,
    grade,
    release,
    description,
    isLoading,
    isOpen,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0)

    const preloadImage = useCallback((src?: string) => {
        if (!src) return
        const img = new window.Image()
        img.src = src
    }, [])

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

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        }
        else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const handlePrev = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? (images?.length ?? 1) - 1 : prevIndex - 1))
    }, [images])

    const handleNext = useCallback(() => {
        setCurrentIndex((nextIndex) => (nextIndex === (images?.length ?? 1) - 1 ? 0 : nextIndex + 1))
    }, [images])

    useEffect(() => {
        if (!isOpen || !images?.length) return

        const nextIndex = (currentIndex + 1) % images.length
        const prevIndex = (currentIndex - 1 + images.length) % images.length

        preloadImage(images[currentIndex])
        preloadImage(images[nextIndex])
        preloadImage(images[prevIndex])
    }, [currentIndex, images, isOpen, preloadImage])

    return (
        <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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
                    paddingTop={{ base: 4, lg: 80 }}
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
                    flexDirection={{ base: 'column', lg: 'row' }}
                    alignItems='center'
                    justifyContent='center'
                    h='full'
                >
                    <Box
                        display="flex"
                        flexDirection={{ base: 'column', lg: 'row' }}
                        maxW="1400px"
                        w="full"
                        h={{ base: 'full', lg: '80vh' }}
                        overflow={{ base: 'auto', lg: 'hidden' }}
                        bg="gray.900"
                        borderRadius={{ base: 0, lg: 'md' }}
                        boxShadow="2xl"
                        position='relative'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Section */}
                        <VStack
                            position='relative'
                            flex="1"
                            alignItems='center'
                            justifyContent='space-between'
                            display='flex'
                            bg='black'
                            w='full'
                            paddingBottom={4}
                            zIndex={1}
                        >
                            <Box
                                position='relative'
                                w='full'
                                h={{ base: '55vh', lg: 'calc(80vh - 140px)' }}
                                display='flex'
                                alignItems='center'
                                justifyContent='center'
                                overflow='hidden'
                            >
                                <MotionBox
                                    w={`${(images?.length ?? 1) * 100}%`}
                                    h='full'
                                    display='flex'
                                    animate={{ x: `-${currentIndex * 100}%` }}
                                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
                                    style={{ willChange: 'transform' }}
                                >
                                    {images?.map((image, index) => (
                                        <Box
                                            key={`${image}-${index}`}
                                            w='100%'
                                            h='full'
                                            flex='0 0 100%'
                                            display='flex'
                                            alignItems='center'
                                            justifyContent='center'
                                        >
                                            <Image
                                                src={image}
                                                alt={`${title ?? 'Image'} ${index + 1}`}
                                                w='full'
                                                h='full'
                                                objectFit='contain'
                                                draggable={false}
                                                loading={index === 0 ? 'eager' : 'lazy'}
                                                decoding='async'
                                            />
                                        </Box>
                                    ))}
                                </MotionBox>

                                <IconButton
                                    position="absolute"
                                    right={4}
                                    top='50%'
                                    transform='translateY(-50%)'
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

                                <IconButton
                                    position="absolute"
                                    left={4}
                                    top='50%'
                                    transform='translateY(-50%)'
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
                            </Box>

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
                                        border={index === currentIndex ? '1px solid' : '1px solid transparent'}
                                        borderColor={index === currentIndex ? 'red.500' : 'transparent'}
                                        opacity={index == currentIndex ? 1 : 0.5}
                                        _hover={{
                                            opacity: 1
                                        }}
                                        transition='opacity 0.2s, border-color 0.2s'
                                    >
                                        <Image
                                            src={image}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                            loading='lazy'
                                            decoding='async'
                                        />
                                    </Box>
                                ))}
                            </HStack>
                        </VStack>

                        <VStack
                            flex="1"
                            p={{ base: 6, lg: 10 }}
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            bg="gray.800"
                            align='start' gap={6}
                            zIndex={100}
                        >
                            {/* Label */}
                            <HStack>
                                <Badge
                                    variant='solid'
                                    colorPalette='cyan'
                                    bottom={2} left={2}
                                    fontSize='sm'
                                    fontWeight='bold'
                                    px={1.5}
                                    py={1}
                                >
                                    {grade}
                                </Badge>

                                <Badge
                                    variant='solid'
                                    bg={release === "P-Bandai" ? "badge.gold.bg" : "badge.regular.bg"}
                                    color={release === "P-Bandai" ? "badge.gold.fg" : "badge.regular.fg"}
                                    bottom={2} left={2}
                                    fontSize='sm'
                                    fontWeight='bold'
                                    px={1.5}
                                    py={1}
                                >
                                    {release}
                                </Badge>
                            </HStack>

                            {/* Title */}
                            <Text
                                fontSize={{ base: '2xl', lg: '3xl' }}
                                fontWeight="bold"
                                color="white"
                                lineHeight="shorter"
                            >
                                {title}
                            </Text>

                            {/* <Text
                                fontSize={{ base: 'md', lg: 'lg' }}
                                fontWeight="bold"
                                color="white"
                                lineHeight="relaxed"
                            >
                                {title}
                            </Text> */}

                            {/* Description */}
                            <Text
                                fontSize={{ base: 'md', lg: 'lg' }}
                                color="gray.300"
                                lineHeight="relaxed"
                            >
                                {description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                            </Text>
                        </VStack>

                        {/* Close Button */}
                        <IconButton
                            position={{ base: 'fixed', lg: 'absolute' }}
                            right={{ base: 0, lg: 0 }}
                            top={{ base: 0, lg: 0 }}
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

        </MotionBox>
    )
}

export default ImageModal
