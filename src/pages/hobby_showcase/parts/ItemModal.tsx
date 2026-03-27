import { Box, IconButton, Image, VStack, Text, HStack, Badge, Spinner, Button } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { cloudinarySizes } from "@/utils/cloudinary";
import { Link as RouterLink } from "react-router-dom";
import { canManageCollection } from "@/services/http";
import KitSpecificationsCard from "./KitSpecificationsCard";
import ReleaseBadge from "./ReleaseBadge";
import { ICollectionStatus } from "@/libs/collection/collection";


const MotionBox = motion(Box);
interface IItemModal {
    collectionId?: number;
    type?: string;
    title?: string;
    cover?: string;
    images?: string[];
    grade?: string;
    scale?: string;
    series?: string;
    manufacturer?: string;
    release?: string;
    description?: string;
    status?: ICollectionStatus | string | null;
    builtDate?: string | null;
    acquiredDate?: string | null;
    isOpen: boolean;
    isLoading?: boolean;
    onClose: () => void;
}

const ItemModal: React.FC<IItemModal> = ({
    collectionId,
    type,
    title,
    cover,
    images,
    grade,
    scale,
    series,
    manufacturer,
    release,
    description,
    status,
    builtDate,
    acquiredDate,
    isLoading,
    isOpen,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const displayImages = useMemo(() => {
        const pictures = images ?? []
        if (!cover) return pictures
        return [cover, ...pictures.filter((image) => image !== cover)]
    }, [cover, images])
    const normalizedGrade = grade?.trim().toLowerCase()
    const normalizedType = type?.trim().toLowerCase()
    const gradeBadgeLabel = normalizedGrade === "no grade" ? scale : grade
    const shouldShowGradeBadge = Boolean(gradeBadgeLabel) && normalizedType !== 'figure'
    const imageCount = displayImages.length
    const currentImage = imageCount ? displayImages[currentIndex] : undefined
    const descriptionRef = useRef<HTMLParagraphElement | null>(null)
    const [isDescriptionLong, setIsDescriptionLong] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const canManage = canManageCollection()
    const descriptionText = description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

    const preloadImage = useCallback((src?: string) => {
        if (!src) return
        const img = new window.Image()
        img.src = cloudinarySizes(src).preview
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
        if (!imageCount) return
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
        if (imageCount < 2) return
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? imageCount - 1 : prevIndex - 1))
    }, [imageCount])

    const handleNext = useCallback(() => {
        if (imageCount < 2) return
        setCurrentIndex((nextIndex) => (nextIndex === imageCount - 1 ? 0 : nextIndex + 1))
    }, [imageCount])

    useEffect(() => {
        if (!isOpen) return
        setCurrentIndex(0)
    }, [isOpen, images])

    useEffect(() => {
        if (!imageCount) return
        if (currentIndex > imageCount - 1) {
            setCurrentIndex(0)
        }
    }, [currentIndex, imageCount])

    useEffect(() => {
        if (!isOpen || imageCount < 2) return

        const nextIndex = (currentIndex + 1) % imageCount
        const prevIndex = (currentIndex - 1 + imageCount) % imageCount

        preloadImage(displayImages[nextIndex])
        preloadImage(displayImages[prevIndex])
    }, [currentIndex, displayImages, imageCount, isOpen, preloadImage])

    useEffect(() => {
        if (!isOpen) return
        setIsDescriptionExpanded(false)
    }, [description, isOpen])

    useEffect(() => {
        if (!isOpen || isLoading) return

        const checkDescriptionOverflow = () => {
            const element = descriptionRef.current
            if (!element) return

            const hasOverflow = element.scrollHeight > element.clientHeight + 1
            if (!isDescriptionExpanded) {
                setIsDescriptionLong(hasOverflow)
            }
        }

        const frameId = window.requestAnimationFrame(checkDescriptionOverflow)
        window.addEventListener("resize", checkDescriptionOverflow)

        return () => {
            window.cancelAnimationFrame(frameId)
            window.removeEventListener("resize", checkDescriptionOverflow)
        }
    }, [descriptionText, isDescriptionExpanded, isLoading, isOpen])

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
                                <AnimatePresence mode="wait" initial={false}>
                                    {currentImage ? (
                                        <MotionBox
                                            key={`${currentImage}-${currentIndex}`}
                                            w='full'
                                            h='full'
                                            initial={{ opacity: 0.2 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0.2 }}
                                            transition={{ duration: 0.2 }}
                                            display='flex'
                                            alignItems='center'
                                            justifyContent='center'
                                        >
                                            <Image
                                                src={cloudinarySizes(currentImage).preview}
                                                alt={`${title ?? 'Image'} ${currentIndex + 1}`}
                                                w='full'
                                                h='full'
                                                objectFit='contain'
                                                draggable={false}
                                                loading='eager'
                                                decoding='async'
                                            />
                                        </MotionBox>
                                    ) : (
                                        <Text color='gray.300'>No images available</Text>
                                    )}
                                </AnimatePresence>

                                {imageCount > 1 && (
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
                                )}

                                {imageCount > 1 && (
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
                                )}
                            </Box>

                            {/* Carousel Thumbnails */}
                            <HStack gap={2} mt={4} flexWrap="wrap">
                                {displayImages.map((image, index) => (
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
                                        border={index === currentIndex ? '2px solid' : '1px solid transparent'}
                                        borderColor={index === currentIndex ? 'red.500' : 'transparent'}
                                        opacity={index == currentIndex ? 1 : 0.5}
                                        _hover={{
                                            opacity: 1
                                        }}
                                        transition='opacity 0.2s, border-color 0.2s'
                                        scale={index === currentIndex ? '1.2' : '1'}
                                    >
                                        <Image
                                            src={cloudinarySizes(image).thumb}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                aspectRatio: '4/3',
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
                                {shouldShowGradeBadge && (
                                    <Badge
                                        variant='solid'
                                        colorPalette='cyan'
                                        bottom={2} left={2}
                                        fontSize='sm'
                                        fontWeight='bold'
                                        px={1.5}
                                        py={1}
                                    >
                                        {gradeBadgeLabel}
                                    </Badge>
                                )}

                                <ReleaseBadge
                                    release={release}
                                    hideRegular
                                    bottom={2} left={2}
                                    fontSize='sm'
                                    fontWeight='bold'
                                    px={1.5}
                                    py={1}
                                />
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

                            <KitSpecificationsCard
                                scale={scale}
                                manufacturer={manufacturer}
                                series={series}
                                status={status}
                                builtDate={builtDate}
                                acquiredDate={acquiredDate}
                            />

                            {/* Description */}
                            <VStack align="start" gap={2} maxWidth='520px'>
                                <Text
                                    fontSize={{ base: 'sm', lg: 'md' }}
                                    color="gray.400"
                                >
                                    Background
                                </Text>
                                <Box
                                    className={isDescriptionExpanded ? "custom-scrollbar" : undefined}
                                    maxH={isDescriptionExpanded ? { base: "none", lg: "220px" } : { base: "160px", lg: "220px" }}
                                    overflowY={isDescriptionExpanded ? { base: "visible", lg: "auto" } : "hidden"}
                                    w="full"
                                    pr={isDescriptionExpanded ? { base: 0, lg: 2 } : 0}
                                >
                                    <Text
                                        ref={descriptionRef}
                                        fontSize={{ base: 'md', lg: 'lg' }}
                                        color="gray.300"
                                        lineHeight="relaxed"
                                        lineClamp={isDescriptionExpanded ? "none" : { base: "4", lg: "6" }}
                                    >
                                        {descriptionText}
                                    </Text>
                                </Box>
                                {isDescriptionLong && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="white"
                                        onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                                        w="full"
                                        justifyContent="center"
                                        textAlign="center"
                                        minH="unset"
                                        height="auto"
                                        _hover={{ bg: "whiteAlpha.100" }}
                                    >
                                        {isDescriptionExpanded ? "View less" : "View more"}
                                    </Button>
                                )}
                            </VStack>

                            {canManage && collectionId && (
                                <Button asChild colorPalette="blue" variant="solid" onClick={onClose}>
                                    <RouterLink to={`/collection/${collectionId}/edit`}>Edit Collection</RouterLink>
                                </Button>
                            )}
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

export default ItemModal
