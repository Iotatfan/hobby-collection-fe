import { memo } from 'react';
import { Badge, Box, Flex, Icon, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useShelfLocation as useLocation } from '@/layouts/shelves/scene';
import { warmShelfRoute } from '@/layouts/shelves/warmup';
import { captureSource } from '../helpers/navigation';
import { categories, shelfColumns, shelfCaptionHeight } from '../helpers/categories';
import type { ShelfCategory } from '@/libs/collection/collection';
import { IShelf } from '@/libs/collection/collection';
import ScenePart from '@/layouts/shelves/ScenePart';
import ShelfItem from './ShelfItem';

interface ShelfProps {
  shelf: IShelf;
  icon: LucideIcon;
  accent: string;
  category?: ShelfCategory;
  expanded?: boolean;
  order?: number;
  showHeading?: boolean;
}

const Shelf = ({
  shelf,
  icon,
  accent,
  category,
  expanded = false,
  order = 0,
  showHeading = true,
}: ShelfProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const columns = useBreakpointValue(shelfColumns) || 2;
  const slug = category;
  const displayName = slug ? categories[slug].name : shelf.name;
  const items = !expanded && slug ? shelf.items.slice(0, 6) : shelf.items;
  const rows = Array.from({ length: Math.ceil(items.length / columns) }, (_, index) =>
    items.slice(index * columns, (index + 1) * columns),
  );
  const hasViewAllLink = !expanded && shelf.count > 6 && Boolean(slug);

  return (
    <ScenePart
      order={order}
      role="shelf"
      category={slug}
      as="section"
      data-shelf-leading={!expanded || shelf.id === 0 ? '' : undefined}
    >
      {showHeading && (
        <ScenePart
          role="information"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={4}
          gap={4}
        >
          <Flex align="center" gap={3} minW={0}>
            <Icon as={icon} boxSize={{ base: 6, md: 7 }} color={accent} flexShrink={0} />
            <Text
              as="h2"
              color="white"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              overflowWrap="anywhere"
            >
              {displayName}
            </Text>
            <Badge
              bg={`${accent}26`}
              borderWidth="1px"
              borderColor={`${accent}66`}
              color="white"
              borderRadius="md"
              px={3}
              py={1}
              fontSize="sm"
              flexShrink={0}
            >
              {shelf.count}
            </Badge>
            {shelf.name === 'Backlog' && (
              <Text color="shelves.muted" display={{ base: 'none', md: 'block' }}>
                Waiting to be built
              </Text>
            )}
          </Flex>

          {hasViewAllLink && (
            <Link
              focusRing="none"
              focusVisibleRing="outside"
              asChild
              minH="44px"
              color="shelves.link"
              fontWeight="semibold"
              display="inline-flex"
              alignItems="center"
              gap={2}
              flexShrink={0}
              _hover={{ color: 'white', textDecoration: 'none' }}
            >
              <RouterLink
                onMouseEnter={() => warmShelfRoute(`/shelves/category/${slug}`)}
                onFocus={() => warmShelfRoute(`/shelves/category/${slug}`)}
                data-shelf-anchor={`category-${slug}`}
                aria-label={`View all ${shelf.count} ${displayName} items`}
                to={`/shelves/category/${slug}`}
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
                  const state = captureSource(location, event.currentTarget, 'shelves');
                  navigate(`/shelves/category/${slug}`, {
                    state: { ...state, preview: { category: slug, shelf } },
                  });
                }}
              >
                View all {shelf.count}
                <ChevronRight size={18} />
              </RouterLink>
            </Link>
          )}
        </ScenePart>
      )}

      {rows.map((row, rowIndex) => (
        <Box key={rowIndex} position="relative" mb={rowIndex < rows.length - 1 ? 3 : 0}>
          <Flex
            data-shelf-scroll=""
            display="grid"
            gridTemplateColumns={`repeat(${columns}, minmax(0, 1fr))`}
            gridTemplateRows={`auto ${shelfCaptionHeight}`}
            align="stretch"
            columnGap={{ base: 4, md: 7 }}
            rowGap={0}
            px={{ base: 2, md: 3 }}
            pt={4}
          >
            {row.map((item, index) => (
              <ShelfItem
                key={item.id}
                item={item}
                index={rowIndex * columns + index}
                contained={expanded}
                clickable={Boolean(slug)}
              />
            ))}
          </Flex>

          <ScenePart
            role="ledge"
            data-scene-ledge=""
            data-shelf-leading-ledge={rowIndex === 0 ? '' : undefined}
            pointerEvents="none"
            position="absolute"
            left={0}
            right={0}
            top={`calc(100% - ${shelfCaptionHeight})`}
            zIndex={2}
            h={{ base: '24px', md: '28px' }}
            borderRadius="sm"
            bg="linear-gradient(180deg, #c08a52 0%, #81512d 48%, #4c2c19 100%)"
            boxShadow="0 -8px 24px rgba(255, 196, 118, 0.22), 0 16px 36px rgba(0, 0, 0, 0.65)"
            _before={{
              content: '""',
              position: 'absolute',
              inset: '3px 0 auto 0',
              left: '10%',
              right: '10%',
              top: '-12px',
              height: '24px',
              h: '2px',
              bg: 'rgba(255,255,255,0.28)',
              filter: 'blur(18px)',
            }}
            _after={{
              content: '""',
              position: 'absolute',
              inset: 'auto 0 0 0',
              h: '7px',
              bg: 'linear-gradient(90deg, rgba(62,34,17,0.9), rgba(151,94,48,0.75), rgba(62,34,17,0.9))',
            }}
          />
        </Box>
      ))}
    </ScenePart>
  );
};

export default memo(Shelf);
