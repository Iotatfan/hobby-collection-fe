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
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cloudinarySizes } from '@/utils/cloudinary';
import { Link as RouterLink } from 'react-router-dom';
import { canManageCollection } from '@/services/http';
import KitSpecificationsCard from './KitSpecificationsCard';
import ReleaseBadge from './ReleaseBadge';
import { ICollectionAddon, ICollectionStatus } from '@/libs/collection/collection';
import useModalLifecycle from '../hooks/useModalLifecycle';
import useItemModalCarousel from '../hooks/useItemModalCarousel';
import useDescriptionToggle from '../hooks/useDescriptionToggle';
import {
  buildAddonLabels,
  FALLBACK_DESCRIPTION,
  resolveGradeBadge,
} from '../helpers/itemModal.helpers';

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
  addons?: ICollectionAddon[];
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
  addons,
  description,
  status,
  builtDate,
  acquiredDate,
  isLoading,
  isOpen,
  onClose,
}) => {
  const { label: gradeBadgeLabel, shouldShow: shouldShowGradeBadge } = useMemo(
    () => resolveGradeBadge(grade, scale, type),
    [grade, scale, type],
  );
  const {
    currentImage,
    currentIndex,
    displayImages,
    handleCarouselClick,
    handleNext,
    handlePrev,
    imageCount,
  } = useItemModalCarousel({
    cover,
    images,
    isOpen,
  });
  const descriptionText = description || FALLBACK_DESCRIPTION;
  const { descriptionRef, isDescriptionExpanded, isDescriptionLong, setIsDescriptionExpanded } =
    useDescriptionToggle({
      description: descriptionText,
      isLoading,
      isOpen,
    });
  const canManage = canManageCollection();
  const addonLabels = useMemo(() => buildAddonLabels(addons), [addons]);

  useModalLifecycle({
    isOpen,
    onClose,
  });

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
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="full"
          paddingTop={{ base: 4, lg: 80 }}
        >
          <Spinner borderWidth="4px" animationDuration="0.65s" color="white" size="xl" />
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection={{ base: 'column', lg: 'row' }}
          alignItems="center"
          justifyContent="center"
          h="full"
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
            position="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Section */}
            <VStack
              position="relative"
              flex="1"
              alignItems="center"
              justifyContent="space-between"
              display="flex"
              bg="black"
              w="full"
              paddingBottom={4}
              zIndex={1}
            >
              <Box
                position="relative"
                w="full"
                h={{ base: '55vh', lg: 'calc(80vh - 140px)' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
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
                        alt={`${title ?? 'Image'} ${currentIndex + 1}`}
                        w="full"
                        h="full"
                        objectFit="contain"
                        draggable={false}
                        loading="eager"
                        decoding="async"
                      />
                    </MotionBox>
                  ) : (
                    <Text color="gray.300">No images available</Text>
                  )}
                </AnimatePresence>

                {imageCount > 1 && (
                  <IconButton
                    position="absolute"
                    right={4}
                    top="50%"
                    transform="translateY(-50%)"
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
                    top="50%"
                    transform="translateY(-50%)"
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
                    opacity={index === currentIndex ? 1 : 0.5}
                    _hover={{
                      opacity: 1,
                    }}
                    transition="opacity 0.2s, border-color 0.2s"
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
                      loading="lazy"
                      decoding="async"
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
              align="start"
              gap={6}
              zIndex={100}
            >
              {/* Label */}
              <HStack>
                {shouldShowGradeBadge && (
                  <Badge
                    variant="solid"
                    colorPalette="cyan"
                    bottom={2}
                    left={2}
                    fontSize="sm"
                    fontWeight="bold"
                    px={1.5}
                    py={1}
                  >
                    {gradeBadgeLabel}
                  </Badge>
                )}

                <ReleaseBadge
                  release={release}
                  hideRegular
                  bottom={2}
                  left={2}
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

              {addonLabels.length > 0 && (
                <VStack align="start" gap={1} maxWidth="520px">
                  <Text fontSize={{ base: 'sm', lg: 'md' }} color="gray.400">
                    Addons
                  </Text>
                  {addonLabels.map((addon) => (
                    <Text
                      key={addon}
                      fontSize={{ base: 'md', lg: 'lg' }}
                      color="gray.300"
                      lineHeight="relaxed"
                    >
                      {addon}
                    </Text>
                  ))}
                </VStack>
              )}

              {/* Description */}
              <VStack align="start" gap={2} maxWidth="520px">
                <Text fontSize={{ base: 'sm', lg: 'md' }} color="gray.400">
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
                    color="gray.300"
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
                    color="white"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    w="full"
                    justifyContent="center"
                    textAlign="center"
                    minH="unset"
                    height="auto"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {isDescriptionExpanded ? 'View less' : 'View more'}
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
              color="white"
              variant="ghost"
              aria-label="Close modal"
              size="lg"
              onClick={onClose}
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              <X size={24} />
            </IconButton>
          </Box>
        </Box>
      )}
    </MotionBox>
  );
};

export default ItemModal;
