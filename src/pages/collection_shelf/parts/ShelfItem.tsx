import { Box, Image, Link, Text } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { memo, useMemo } from 'react';
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
import { shelfCaptionHeight, typeCategory } from '../helpers/categories';
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

const MotionLink = motion.create(Link);

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
      <Box
        role="group"
        position="relative"
        zIndex={1}
        w="max-content"
        maxW="full"
        borderRadius="sm"
        overflow="hidden"
        borderWidth="1px"
        borderColor="whiteAlpha.400"
        bg="gray.900"
        boxShadow="0 16px 30px rgba(0, 0, 0, 0.5)"
        cursor={clickable ? 'pointer' : 'default'}
        opacity={1}
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
          maxW="full"
          h="auto"
          maxH={HEIGHT_MAP[item.display_size] || { base: '120px', md: '150px' }}
        />
      </Box>
    );
  }, [item, dimensions, clickable]);

  const presentation = (
    <>
      <Box data-shelf-artwork-slot="" display="flex" alignItems="flex-end" minW={0}>
        {clickable ? (
          <MotionLink
            focusRing="none"
            focusVisibleRing="outside"
            asChild
            textDecoration="none"
            display="inline-flex"
            w="max-content"
            flexShrink={1}
            initial={false}
            animate={{ y: 0, scale: 1 }}
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.025 }}
            transition={{ duration: shelfMotion.hoverDuration, ease: shelfMotion.ease }}
            minW={0}
            maxW="full"
            _hover={{ textDecoration: 'none' }}
          >
            <RouterLink
              onMouseEnter={() => warmShelfRoute(destination)}
              onFocus={() => warmShelfRoute(destination)}
              data-shelf-anchor={`item-${item.id}`}
              aria-label={item.title}
              to={destination}
              onClick={(event) => {
                if (
                  event.button ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
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
          </MotionLink>
        ) : (
          card
        )}
      </Box>
      <ScenePart
        role="caption"
        h={shelfCaptionHeight}
        pt={{ base: '30px', md: '34px' }}
        color="shelves.text"
      >
        <Text
          fontSize="md"
          fontWeight="semibold"
          lineHeight="short"
          lineClamp={2}
          overflowWrap="anywhere"
          title={item.title}
        >
          {item.title}
        </Text>
        {typeCategory(item.type?.name) === 'gunpla' && (
          <Text fontSize="sm" color="shelves.muted" mt={1} lineClamp={1}>
            {[
              item.type?.grade?.short_name?.toLowerCase() !== 'no grade'
                ? item.type?.grade?.short_name
                : undefined,
              item.type?.scale,
            ]
              .filter(Boolean)
              .join(' \u00b7 ')}
          </Text>
        )}
      </ScenePart>
    </>
  );

  if (!clickable) {
    return (
      <ScenePart
        role="box"
        itemId={String(item.id)}
        order={index}
        minW={0}
        w="full"
        display="grid"
        gridRow="span 2"
        gridTemplateRows="subgrid"
      >
        {presentation}
      </ScenePart>
    );
  }

  const content = (
    <ScenePart
      role="box"
      display="grid"
      gridRow="span 2"
      gridTemplateRows="subgrid"
      w="full"
      itemId={String(item.id)}
      order={index}
      minW={0}
      maxW="full"
      flex="0 0 auto"
    >
      {presentation}
    </ScenePart>
  );
  return contained ? (
    <Box
      data-filter-item={item.id}
      display="grid"
      gridRow="span 2"
      gridTemplateRows="subgrid"
      minW={0}
    >
      {content}
    </Box>
  ) : (
    content
  );
};

export default memo(ShelfItem);
