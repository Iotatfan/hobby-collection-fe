import { Box, Image, Link } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { IDisplaySize, IShelfItem as ShelfItemData } from '@/libs/collection/collection';
import { useShelfLocation as useLocation } from '@/layouts/shelves/scene';
import { shelfMotion } from '@/layouts/shelves/motion';
import { warmShelfRoute } from '@/layouts/shelves/warmup';
import {
  getShelfImageDimensions,
  rememberShelfImageDimensions,
} from '@/pages/collection_shelf/helpers/imageDimensions';
import ScenePart from '@/layouts/shelves/ScenePart';
import { captureSource } from '../helpers/navigation';
import { slugify } from '@/pages/collection_detail/helpers/collectionDetail.helpers';
import { cloudinarySizes } from '@/utils/cloudinary';

const HEIGHT_MAP: Record<IDisplaySize, { base: string; md: string }> = {
  small_wide: { base: '100px', md: '120px' },
  small_tall: { base: '120px', md: '150px' },
  medium_wide: { base: '140px', md: '180px' },
  medium_tall: { base: '160px', md: '210px' },
  large_wide: { base: '180px', md: '240px' },
  large_tall: { base: '210px', md: '280px' },
};

interface ShelfItemProps {
  item: ShelfItemData;
  index?: number;
  clickable?: boolean;
  contained?: boolean;
}

const MotionBox = motion.create(Box);

const ShelfItem = ({ item, index = 0, clickable = true, contained = false }: ShelfItemProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const destination = `/shelves/collection/${item.id}/${slugify(item.title)}`;
  const dimensions = getShelfImageDimensions(item.cover);
  // Scene phase and bridge bookkeeping updates should not rebuild unchanged artwork.
  const card = useMemo(() => {
    const cap = HEIGHT_MAP[item.display_size] || HEIGHT_MAP.small_tall;
    const imageWidth = dimensions
      ? {
          base: `${dimensions.width * Math.min(1, parseFloat(cap.base) / dimensions.height)}px`,
          md: `${dimensions.width * Math.min(1, parseFloat(cap.md) / dimensions.height)}px`,
        }
      : 'auto';
    return (
      <MotionBox
        role="group"
        position="relative"
        zIndex={1}
        w="max-content"
        maxW={contained ? 'full' : undefined}
        borderRadius="sm"
        overflow="hidden"
        borderWidth="1px"
        borderColor="whiteAlpha.400"
        bg="gray.900"
        boxShadow="0 16px 30px rgba(0, 0, 0, 0.5)"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shelfMotion.hoverDuration, ease: shelfMotion.ease }}
        cursor={clickable ? 'pointer' : 'not-allowed'}
        opacity={clickable ? 1 : 0.65}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          boxShadow: 'inset 14px 0 20px rgba(255,255,255,0.16)',
          pointerEvents: 'none',
        }}
        _after={{
          content: '""',
          position: 'absolute',
          inset: 0,
          bg: 'whiteAlpha.100',
          opacity: 0,
          transition: `opacity ${shelfMotion.hoverDuration}s ease`,
          pointerEvents: 'none',
        }}
        _hover={clickable ? { _after: { opacity: 1 } } : undefined}
        {...(clickable &&
          !reducedMotion && {
            whileHover: { y: -6, scale: 1.025 },
          })}
      >
        <Image
          src={cloudinarySizes(item.cover).cover}
          data-shelf-morph={`cover-${item.id}`}
          alt={item.title}
          onError={(event) => {
            if (!event.currentTarget.dataset.fallback) {
              event.currentTarget.dataset.fallback = 'true';
              event.currentTarget.src = '/favicon.png';
            }
          }}
          onLoad={(event) => rememberShelfImageDimensions(item.cover, event.currentTarget)}
          htmlWidth={dimensions?.width}
          htmlHeight={dimensions?.height}
          loading="lazy"
          objectFit="contain"
          display="block"
          w={imageWidth}
          aspectRatio={dimensions ? `${dimensions.width} / ${dimensions.height}` : undefined}
          maxW={contained ? 'full' : undefined}
          h="auto"
          maxH={HEIGHT_MAP[item.display_size] || { base: '120px', md: '150px' }}
        />
      </MotionBox>
    );
  }, [item, dimensions, contained, clickable, reducedMotion]);

  if (!clickable) {
    return (
      <ScenePart role="box" itemId={String(item.id)} order={index} flex="0 0 auto">
        {card}
      </ScenePart>
    );
  }

  const content = (
    <ScenePart
      role="box"
      display="flex"
      alignItems="flex-end"
      itemId={String(item.id)}
      order={index}
      minW={0}
      maxW={contained ? 'full' : undefined}
      flex="0 0 auto"
    >
      <Link
        focusRing="none"
        focusVisibleRing="outside"
        asChild
        textDecoration="none"
        flex="0 0 auto"
        minW={0}
        maxW={contained ? 'full' : undefined}
        _hover={{ textDecoration: 'none' }}
      >
        <RouterLink
          onMouseEnter={() => warmShelfRoute(destination)}
          onFocus={() => warmShelfRoute(destination)}
          data-shelf-anchor={`item-${item.id}`}
          aria-label={item.title}
          to={destination}
          onClick={(event) => {
            if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
              return;
            event.preventDefault();
            const categoryName = location.pathname.includes('/category/')
              ? event.currentTarget.closest('[data-shelf-scene]')?.querySelector('h1')
                  ?.textContent || 'category'
              : 'shelves';
            navigate(destination, {
              state: {
                ...captureSource(location, event.currentTarget, categoryName),
                preview: { item },
              },
            });
          }}
        >
          {card}
        </RouterLink>
      </Link>
    </ScenePart>
  );
  return contained ? (
    <Box data-filter-item={item.id} display="flex" alignItems="flex-end" minW={0}>
      {content}
    </Box>
  ) : (
    content
  );
};

export default ShelfItem;
