import { Box, Button, Link, Spinner, Text, useBreakpointValue } from '@chakra-ui/react';
import { useEffect, useMemo, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { categories, isCategory, shelfColumns } from '@/pages/collection_shelf/helpers/categories';
import {
  useShelfRestoration,
  canReturn,
  type ShelfNavigation,
} from '@/pages/collection_shelf/helpers/navigation';
import Shelf from '@/pages/collection_shelf/parts/Shelf';
import {
  useShelfLocation as useLocation,
  useShelfNavigationType as useNavigationType,
  useShelfSceneReady,
} from '@/layouts/shelves/scene';
import { ShelfSkeletonRows } from '@/layouts/shelves/ShelfLoadingParts';
import { readCategoryPages } from '@/pages/collection_shelf/helpers/categoryCache';
import type { CategorySceneData } from '@/layouts/shelves/scene';
import { shelfMotion } from '@/layouts/shelves/motion';
import ShelfPageContainer from '@/layouts/shelves/ShelfPageContainer';
import ScenePart from '@/layouts/shelves/ScenePart';
import { warmShelfRoute } from '@/layouts/shelves/warmup';
import CategoryFilters from '@/pages/collection_shelf/parts/CategoryFilters';
import FilterShelfMotion from '@/pages/collection_shelf/parts/FilterShelfMotion';

const MotionBox = motion.create(Box);
export default function CategoryScene({ data }: { data?: CategorySceneData }) {
  const location = useLocation();
  const categorySlug = location.pathname.split('/')[3];
  const category = isCategory(categorySlug) ? categorySlug : undefined;
  const config = category ? categories[category] : undefined;
  const name = data?.name;
  const items = data?.items || [];
  const count = data?.count || 0;
  const complete = data?.complete || false;
  const loading = data?.loading ?? Boolean(category);
  const error = data?.error || '';
  const ready = data?.ready || false;
  const load = data?.load;
  const navigate = useNavigate();
  const type = useNavigationType();
  const reduced = useReducedMotion();
  const sentinel = useRef<HTMLDivElement>(null);

  const state = location.state as ShelfNavigation | null;
  const active = useShelfSceneReady(true);
  useShelfRestoration(true);
  useEffect(() => {
    if (
      !active ||
      !ready ||
      loading ||
      error ||
      complete ||
      !category ||
      !sentinel.current ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load?.();
      },
      { rootMargin: '0px 0px 160px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [category, ready, loading, error, complete, load, active]);
  const back = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (state?.origin?.path === '/shelves' && canReturn(state.origin)) {
      event.preventDefault();
      navigate(-1);
    }
  };
  const rowSize = useBreakpointValue(shelfColumns) || 2;
  const preview = state?.preview?.category === category ? state?.preview?.shelf : undefined;
  const showCarried = !items.length && (loading || Boolean(error));
  const snapshot = showCarried || name == null ? readCategoryPages(category) : null;
  const carried = snapshot || preview;
  const visibleItems = showCarried ? carried?.items || items : items;
  const visibleCount = showCarried ? (carried?.count ?? count) : count;
  const shelfName = name ?? snapshot?.name ?? preview?.name ?? '';
  const skeletonCount = loading && !items.length ? Math.max(0, 12 - visibleItems.length) : 0;
  const rows = useMemo(
    () =>
      Array.from({ length: Math.ceil(visibleItems.length / rowSize) }, (_, index) => ({
        id: index,
        name: shelfName,
        items: visibleItems.slice(index * rowSize, index * rowSize + rowSize),
        count: visibleCount,
      })),
    [visibleItems, rowSize, shelfName, visibleCount],
  );
  return (
    <ShelfPageContainer
      data-destination-loading={loading && !items.length ? 'category' : undefined}
      aria-busy={loading || undefined}
      minH="100vh"
      bg="transparent"
      color="white"
      py={8}
    >
      <Box>
        <ScenePart role="controls">
          <Link focusRing="none" focusVisibleRing="outside" asChild color="shelves.link" mb={6}>
            <RouterLink
              data-shelf-back=""
              to="/shelves"
              onClick={back}
              onMouseEnter={() => warmShelfRoute('/shelves')}
              onFocus={() => warmShelfRoute('/shelves')}
            >
              <ArrowLeft size={18} /> Back to shelves
            </RouterLink>
          </Link>
        </ScenePart>
        <Box>
          <ScenePart role="information">
            <Box as="nav" aria-label="Breadcrumb" color="shelves.muted" mb={4}>
              <Link asChild color="shelves.link">
                <RouterLink to="/shelves" onClick={back}>
                  Collection
                </RouterLink>
              </Link>
              <Text as="span" mx={3} aria-hidden="true">
                /
              </Text>
              <Text as="span" aria-current="page">
                {config?.name || 'Category'}
              </Text>
            </Box>
            <Text as="h1" tabIndex={-1} fontSize="3xl" fontWeight="bold">
              {config?.name || shelfName || 'Category unavailable'}
            </Text>
          </ScenePart>
          {category && (
            <ScenePart role="controls">
              <CategoryFilters category={category} data={data} count={visibleCount} />
            </ScenePart>
          )}
          <FilterShelfMotion
            revision={`${data?.resultKey || ''}:${visibleItems.map((item) => item.id).join(',')}`}
          >
            {config &&
              rows.map((row, index) => (
                <MotionBox
                  key={`${category}-${index}`}
                  initial={
                    reduced || type === 'POP' || !active || index * rowSize < 12
                      ? false
                      : { opacity: 0 }
                  }
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: reduced ? 0 : shelfMotion.rowDuration,
                    ease: shelfMotion.ease,
                  }}
                  mt={index === 0 ? 8 : 4}
                >
                  <Shelf
                    showHeading={false}
                    shelf={row}
                    category={category}
                    icon={config.icon}
                    accent={config.accent}
                    expanded
                  />
                </MotionBox>
              ))}
          </FilterShelfMotion>
          {skeletonCount > 0 && (
            <ShelfSkeletonRows
              count={skeletonCount}
              headings="none"
              appended={visibleItems.length > 0}
            />
          )}
        </Box>
        {config && (
          <ScenePart
            role="controls"
            display="flex"
            minH="100px"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={3}
            mt={!items.length ? 4 : 6}
          >
            <Box role="status" aria-live="polite">
              {loading ? (
                <>
                  <Spinner size="sm" mr={3} />
                  Loading shelf items...
                </>
              ) : error ? (
                <Text color="red.300">{error}</Text>
              ) : !items.length ? (
                data && Object.keys(data.filters).length ? (
                  'No matching items. Try changing or resetting your filters.'
                ) : (
                  'No items in this category.'
                )
              ) : complete ? (
                `All ${items.length} items shown.`
              ) : (
                `${items.length} of ${count} items shown.`
              )}
            </Box>
            {!loading &&
              !error &&
              !items.length &&
              data &&
              Object.keys(data.filters).length > 0 && (
                <Button
                  bg="shelves.action"
                  color="white"
                  _hover={{ bg: 'shelves.actionHover' }}
                  focusVisibleRing="outside"
                  minH="44px"
                  onClick={data.clearFilters}
                >
                  Reset filters
                </Button>
              )}
            {!loading && (!complete || error) && (
              <Button
                bg="shelves.action"
                color="white"
                _hover={{ bg: 'shelves.actionHover' }}
                focusVisibleRing="outside"
                minH="44px"
                onClick={() => void load?.()}
              >
                {error ? 'Retry' : 'Load more'}
              </Button>
            )}
            <Box ref={sentinel} h="1px" aria-hidden="true" />
          </ScenePart>
        )}
      </Box>
    </ShelfPageContainer>
  );
}
