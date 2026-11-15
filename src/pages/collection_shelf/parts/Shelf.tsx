import { Badge, Box, Flex, Icon, Link, Text } from '@chakra-ui/react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useShelfLocation as useLocation } from '@/layouts/shelves/scene';
import { warmShelfRoute } from '@/layouts/shelves/warmup';
import { captureSource } from '../helpers/navigation';
import { categories } from '../helpers/categories';
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
  const slug =
    category ||
    (Object.keys(categories) as ShelfCategory[]).find((key) => categories[key].name === shelf.name);
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
              truncate
            >
              {shelf.name}
            </Text>
            <Badge
              bg={accent}
              color="white"
              borderRadius="md"
              px={3}
              py={1}
              fontSize="sm"
              flexShrink={0}
            >
              {shelf.count}
            </Badge>
          </Flex>

          {hasViewAllLink && (
            <Link
              focusRing="none"
              focusVisibleRing="outside"
              asChild
              color="whiteAlpha.900"
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
                aria-label={`View all ${shelf.name}`}
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
                View All
                <ChevronRight size={18} />
              </RouterLink>
            </Link>
          )}
        </ScenePart>
      )}

      <Box position="relative" pb={{ base: '24px', md: '28px' }}>
        <Flex
          data-shelf-scroll=""
          minH={expanded ? '160px' : '200px'}
          display={expanded ? 'grid' : 'flex'}
          gridTemplateColumns={
            expanded
              ? { base: 'repeat(3, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' }
              : undefined
          }
          align="end"
          gap={{ base: 4, md: 7 }}
          overflowX={expanded ? 'visible' : 'auto'}
          overflowY="visible"
          px={{ base: 2, md: 3 }}
          pt={4}
          pb={0}
          className="custom-scrollbar"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {shelf.items.map((item, index) => (
            <ShelfItem
              key={item.id}
              item={item}
              index={index}
              contained={expanded}
              clickable={shelf.name !== 'Backlog'}
            />
          ))}
        </Flex>

        <ScenePart
          role="ledge"
          data-scene-ledge=""
          position="absolute"
          left={0}
          right={0}
          bottom={0}
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
    </ScenePart>
  );
};

export default Shelf;
