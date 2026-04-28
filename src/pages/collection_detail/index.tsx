import {
  Box,
  IconButton,
  Image,
  VStack,
  Text,
  HStack,
  Badge,
  Spinner,
  Button,
  Flex,
} from '@chakra-ui/react';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { cloudinarySizes } from '@/utils/cloudinary';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { canManageCollection } from '@/services/http';
import KitSpecificationsCard from '@/pages/hobby_showcase/parts/KitSpecificationsCard';
import ReleaseBadge from '@/pages/hobby_showcase/parts/ReleaseBadge';
import {
  buildAddonLabels,
  FALLBACK_DESCRIPTION,
  resolveGradeBadge,
  buildDisplayImages,
} from '@/pages/hobby_showcase/helpers/itemModal.helpers';
import useCollectionDetail from '@/hooks/collections/useCollectionDetail';
import { useRef } from 'react';

const MotionBox = motion(Box);
const MotionHStack = motion(HStack);

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCollectionDetail, collection } = useCollectionDetail();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailContentRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const thumbnailControls = useAnimation();
  const canManage = canManageCollection();

  // --- Carousel state (adapted from useItemModalCarousel) ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayImages = useMemo(
    () => buildDisplayImages(collection?.cover, collection?.pictures),
    [collection?.cover, collection?.pictures],
  );
  const imageCount = displayImages.length;
  const currentImage = imageCount ? displayImages[currentIndex] : undefined;

  const preloadImage = useCallback((src?: string) => {
    if (!src) return;
    const img = new window.Image();
    img.src = cloudinarySizes(src).preview;
  }, []);

  const handleCarouselClick = useCallback(
    (index: number) => {
      if (!imageCount) return;
      setCurrentIndex(index);
      // Animate to center the selected thumbnail
      animateToThumbnail(index);
    },
    [imageCount],
  );

  const handlePrev = useCallback(() => {
    if (imageCount < 2) return;
    const prevIndex = currentIndex === 0 ? imageCount - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    animateToThumbnail(prevIndex);
  }, [imageCount, currentIndex]);

  const handleNext = useCallback(() => {
    if (imageCount < 2) return;
    const nextIndex = currentIndex === imageCount - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    animateToThumbnail(nextIndex);
  }, [imageCount, currentIndex]);

  // Helper function to animate carousel to show thumbnail at index
  const animateToThumbnail = useCallback(
    (index: number) => {
      if (isDragging) return;

      // Defer animation to next frame to ensure DOM is ready
      window.requestAnimationFrame(() => {
        if (thumbnailContainerRef.current && thumbnailContentRef.current) {
          const containerW = thumbnailContainerRef.current.offsetWidth;
          const contentW = thumbnailContentRef.current.scrollWidth;

          // If content is smaller than container, keep it centered
          if (contentW <= containerW) {
            thumbnailControls.start({ x: 0 });
            return;
          }

          // Use same constraint logic as dragConstraints effect to ensure consistency
          const minX = Math.min(0, containerW - contentW - 16);

          const itemW = 80; // 72px width + 8px gap
          const targetX = containerW / 2 - (index * itemW + 36); // Center the selected thumbnail
          const clampedX = Math.max(minX, Math.min(0, targetX));

          thumbnailControls.start({
            x: clampedX,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
          });
        }
      });
    },
    [isDragging, thumbnailControls],
  );

  // Initialize carousel on image load
  useEffect(() => {
    if (imageCount > 0 && dragConstraints.left !== 0) {
      animateToThumbnail(currentIndex);
    }
  }, [imageCount, dragConstraints.left, currentIndex, animateToThumbnail]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsDragging(false);
  }, [id, collection?.pictures]);

  useEffect(() => {
    if (!imageCount) return;
    if (currentIndex > imageCount - 1) setCurrentIndex(0);
  }, [currentIndex, imageCount]);

  useEffect(() => {
    if (imageCount < 2) return;
    const nextIndex = (currentIndex + 1) % imageCount;
    const prevIndex = (currentIndex - 1 + imageCount) % imageCount;
    preloadImage(displayImages[nextIndex]);
    preloadImage(displayImages[prevIndex]);
  }, [currentIndex, displayImages, imageCount, preloadImage]);

  useEffect(() => {
    const updateConstraints = () => {
      window.requestAnimationFrame(() => {
        if (thumbnailContainerRef.current && thumbnailContentRef.current) {
          const containerW = thumbnailContainerRef.current.offsetWidth;
          const contentW = thumbnailContentRef.current.scrollWidth;
          setDragConstraints({
            left: Math.min(0, containerW - contentW - 16), // 16 for some padding
            right: 0,
          });
        }
      });
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, [displayImages.length]);

  useEffect(() => {
    if (thumbnailContainerRef.current && thumbnailContentRef.current) {
      const containerW = thumbnailContainerRef.current.offsetWidth;
      const contentW = thumbnailContentRef.current.scrollWidth;

      // If content is smaller than container, keep it centered
      if (contentW <= containerW) {
        thumbnailControls.start({ x: 0 });
      }
    }
  }, [dragConstraints.left, thumbnailControls]);

  // --- Description toggle ---
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionText = collection?.description || FALLBACK_DESCRIPTION;

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [descriptionText]);

  useEffect(() => {
    if (isLoading) return;
    const checkOverflow = () => {
      const el = descriptionRef.current;
      if (!el) return;
      if (!isDescriptionExpanded) {
        setIsDescriptionLong(el.scrollHeight > el.clientHeight + 1);
      }
    };
    const frameId = window.requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [descriptionText, isDescriptionExpanded, isLoading]);

  // --- Fetch ---
  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      setErrorMessage('Invalid collection ID.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    getCollectionDetail(numericId)
      .catch(() => setErrorMessage('Failed to load collection detail.'))
      .finally(() => setIsLoading(false));
  }, [id, getCollectionDetail]);

  // --- Derived values ---
  const { label: gradeBadgeLabel, shouldShow: shouldShowGradeBadge } = useMemo(
    () =>
      resolveGradeBadge(
        collection?.type?.grade?.name,
        collection?.type?.scale,
        collection?.type?.name,
      ),
    [collection],
  );
  const addonLabels = useMemo(() => buildAddonLabels(collection?.addons), [collection?.addons]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        bg="background.bg"
      >
        <Spinner borderWidth="4px" animationDuration="0.65s" color="blackAlpha.800" size="xl" />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        bg="background.bg"
        gap={4}
      >
        <Text color="red.500" fontSize="lg">
          {errorMessage}
        </Text>
        <Button asChild variant="outline" size="sm">
          <RouterLink to="/">Back to Collection</RouterLink>
        </Button>
      </Box>
    );
  }

  return (
    <Flex
      w="full"
      mt="6"
      pb="10"
      minH="80vh"
      alignItems="flex-start"
      gap="4"
      mx="auto"
      maxW="78rem"
      px={{ base: 4, md: 6, lg: 8 }}
    >
      {/* Main content */}
      <Box
        display="flex"
        flexDirection={{ base: 'column', lg: 'row' }}
        flexGrow="1"
        maxW="100%"
        alignItems="flex-start"
      >
        {/* Image Section */}
        <Box
          flex="1"
          minW="0"
          display="flex"
          flexDirection="column"
          bg="background.bg"
          w="full"
          h={{ base: 'auto', lg: '80vh' }}
          zIndex={1}
          pt={{ base: 4, lg: 6 }}
          pr={{ base: 4, lg: 6 }}
          pb={{ base: 4, lg: 6 }}
          pl="0"
        >
          {/* Back button above image */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            display="inline-flex"
            alignItems="center"
            gap={1}
            color="gray.600"
            _hover={{ bg: 'gray.100' }}
            alignSelf="flex-start"
            mb={3}
            px={2}
          >
            <ArrowLeft size={16} />
            Back to Collection
          </Button>

          {/* Main image — fills remaining space above thumbnails */}
          <Box
            position="relative"
            w="full"
            flex={{ base: 'none', lg: '1' }}
            h={{ base: '55vh', lg: 'auto' }}
            minH={0}
            borderRadius="xl"
            overflow="hidden"
            bg="gray.100"
          >
            <AnimatePresence mode="wait" initial={false}>
              {currentImage ? (
                <MotionBox
                  key={`${currentImage}-${currentIndex}`}
                  w="full"
                  h="full"
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.2 }}
                  transition={{ duration: 0.2 }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={cloudinarySizes(currentImage).preview}
                    alt={`${collection?.title ?? 'Image'} ${currentIndex + 1}`}
                    w="full"
                    h="full"
                    objectFit="contain"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                  />
                </MotionBox>
              ) : (
                <Text color="gray.400">No images available</Text>
              )}
            </AnimatePresence>

            {/* Image counter badge */}
            {imageCount > 0 && (
              <Box
                position="absolute"
                top={3}
                right={3}
                bg="whiteAlpha.800"
                backdropFilter="blur(4px)"
                borderRadius="md"
                px={2.5}
                py={1}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.700"
                lineHeight="1"
                zIndex={5}
              >
                {currentIndex + 1} / {imageCount}
              </Box>
            )}

            {imageCount > 1 && (
              <IconButton
                position="absolute"
                right={3}
                top="50%"
                transform="translateY(-50%)"
                zIndex={10}
                aria-label="Next image"
                onClick={handleNext}
                variant="ghost"
                color="white"
                bg="blackAlpha.400"
                _hover={{ bg: 'blackAlpha.600' }}
                borderRadius="full"
                size="lg"
              >
                <ChevronRight size={28} />
              </IconButton>
            )}

            {imageCount > 1 && (
              <IconButton
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                zIndex={10}
                aria-label="Previous image"
                onClick={handlePrev}
                variant="ghost"
                color="white"
                bg="blackAlpha.400"
                _hover={{ bg: 'blackAlpha.600' }}
                borderRadius="full"
                size="lg"
              >
                <ChevronLeft size={28} />
              </IconButton>
            )}
          </Box>

          <Box
            key={id}
            ref={thumbnailContainerRef}
            w="full"
            flexShrink={0}
            pt={3}
            display="flex"
            alignItems="center"
            justifyContent={dragConstraints.left < 0 ? 'flex-start' : 'center'}
            overflowX="hidden"
            overflowY="hidden"
            position="relative"
          >
            <MotionHStack
              ref={thumbnailContentRef}
              gap={2}
              flexWrap="nowrap"
              w="max-content"
              px={2}
              dragTransition={{ power: 0.2, restDelta: 0.001 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              drag="x"
              dragConstraints={dragConstraints}
              dragElastic={0.1}
              animate={thumbnailControls}
              cursor="grab"
              _active={{ cursor: 'grabbing' }}
            >
              {displayImages.map((image, index) => (
                <Box
                  key={index}
                  as="button"
                  onClick={() => handleCarouselClick(index)}
                  flexShrink={0}
                  w="72px"
                  h="56px"
                  borderRadius="lg"
                  overflow="hidden"
                  border="2px solid"
                  borderColor={index === currentIndex ? 'gray.800' : 'transparent'}
                  opacity={index === currentIndex ? 1 : 0.55}
                  _hover={{ opacity: 1 }}
                  transition="opacity 0.2s, border-color 0.2s"
                  bg="gray.200"
                  style={{ userSelect: 'none' }}
                >
                  <Image
                    src={cloudinarySizes(image).thumb}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none', // Prevents image drag from interfering
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </Box>
              ))}
            </MotionHStack>
          </Box>
        </Box>

        {/* Info Section */}
        <VStack
          flex="1"
          minW="0"
          pl={{ base: 0, lg: 4 }}
          pr="0"
          py={{ base: 6, lg: 10 }}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          bg="background.bg"
          align="start"
          w="full"
          gap={6}
          zIndex={1}
        >
          {/* Badges */}
          <HStack>
            {shouldShowGradeBadge && (
              <Badge
                variant="solid"
                colorPalette="cyan"
                fontSize="sm"
                fontWeight="bold"
                px={1.5}
                py={1}
              >
                {gradeBadgeLabel}
              </Badge>
            )}

            <ReleaseBadge
              release={collection?.release_type?.name}
              hideRegular
              fontSize="sm"
              fontWeight="bold"
              px={1.5}
              py={1}
            />
          </HStack>

          {/* Title */}
          <Text
            fontSize={{ base: '2xl', lg: '3xl' }}
            fontWeight="bold"
            color="gray.800"
            lineHeight="shorter"
          >
            {collection?.title}
          </Text>

          <KitSpecificationsCard
            scale={collection?.type?.scale}
            manufacturer={collection?.manufacturer?.name}
            series={collection?.series?.name}
            status={collection?.status}
            builtDate={collection?.built_at}
            acquiredDate={collection?.acquired_at}
          />

          {addonLabels.length > 0 && (
            <VStack align="start" gap={1} maxWidth="520px">
              <Text fontSize={{ base: 'sm', lg: 'md' }} color="gray.500">
                Addons
              </Text>
              {addonLabels.map((addon) => (
                <Text
                  key={addon}
                  fontSize={{ base: 'md', lg: 'lg' }}
                  color="gray.700"
                  lineHeight="relaxed"
                >
                  {addon}
                </Text>
              ))}
            </VStack>
          )}

          {/* Description */}
          <VStack align="start" gap={2} maxWidth="520px">
            <Text fontSize={{ base: 'sm', lg: 'md' }} color="gray.500">
              About
            </Text>
            <Box
              className={isDescriptionExpanded ? 'custom-scrollbar' : undefined}
              maxH={
                isDescriptionExpanded
                  ? { base: 'none', lg: '220px' }
                  : { base: '160px', lg: '220px' }
              }
              overflowY={isDescriptionExpanded ? { base: 'visible', lg: 'auto' } : 'hidden'}
              w="full"
              pr={isDescriptionExpanded ? { base: 0, lg: 2 } : 0}
            >
              <Text
                ref={descriptionRef}
                fontSize={{ base: 'md', lg: 'lg' }}
                color="gray.700"
                lineHeight="relaxed"
                lineClamp={isDescriptionExpanded ? 'none' : { base: '4', lg: '6' }}
              >
                {descriptionText}
              </Text>
            </Box>
            {isDescriptionLong && (
              <Button
                size="sm"
                variant="ghost"
                color="gray.700"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                w="full"
                justifyContent="center"
                textAlign="center"
                minH="unset"
                height="auto"
                _hover={{ bg: 'gray.100' }}
              >
                {isDescriptionExpanded ? 'View less' : 'View more'}
              </Button>
            )}
          </VStack>

          {canManage && collection?.id && (
            <Button asChild colorPalette="blue" variant="solid">
              <RouterLink to={`/collection/${collection.id}/edit`}>Edit Collection</RouterLink>
            </Button>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default CollectionDetail;
