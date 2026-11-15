import { Box, Grid, Link, Skeleton, useBreakpointValue } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useShelfLocation } from '@/layouts/shelves/scene';
import {
  canReturn,
  validOrigin,
  type ShelfNavigation,
} from '@/pages/collection_shelf/helpers/navigation';
export function LoadingBackLink({ compact = false }: { compact?: boolean }) {
  const location = useShelfLocation();
  const navigate = useNavigate();
  const origin = (location.state as ShelfNavigation | null)?.origin;
  const destination = validOrigin(origin) ? origin.path : '/shelves';
  return (
    <Link
      focusRing="none"
      focusVisibleRing="outside"
      asChild
      color="orange.200"
      mb={compact ? 3 : 6}
      alignSelf="flex-start"
      px={compact ? 2 : 0}
      py={compact ? 1 : 0}
      fontSize={compact ? 'sm' : undefined}
      _hover={compact ? { bg: 'whiteAlpha.100', textDecoration: 'none' } : undefined}
    >
      <RouterLink
        data-shelf-back=""
        to={destination}
        onClick={(event) => {
          if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
          if (canReturn(origin)) {
            event.preventDefault();
            navigate(-1);
          }
        }}
      >
        <ArrowLeft size={18} /> Back to {validOrigin(origin) ? origin.label : 'shelves'}
      </RouterLink>
    </Link>
  );
}

export function ShelfSkeletonRows({
  count = 12,
  headings = 'all',
}: {
  count?: number;
  headings?: 'all' | 'first' | 'none';
}) {
  const rowSize = useBreakpointValue({ base: 3, md: 6 }) || 3;
  const reduced = useReducedMotion();
  return (
    <Box data-shelf-skeleton="rows" aria-hidden="true">
      {Array.from({ length: Math.ceil(count / rowSize) }, (_, row) => (
        <Box key={row} mt={8}>
          {(headings === 'all' || (headings === 'first' && row === 0)) && (
            <Skeleton h="28px" w="180px" mb={5} animation={reduced ? 'none' : undefined} />
          )}
          <Grid
            templateColumns={`repeat(${rowSize}, minmax(0, 1fr))`}
            alignItems="end"
            gap={{ base: 4, md: 7 }}
            px={3}
            minH="160px"
          >
            {Array.from({ length: Math.min(rowSize, count - row * rowSize) }, (_, index) => (
              <Skeleton
                key={index}
                w="full"
                h={index % 2 ? '110px' : '145px'}
                borderRadius="sm"
                animation={reduced ? 'none' : undefined}
              />
            ))}
          </Grid>
          <Box
            h={{ base: '24px', md: '28px' }}
            borderRadius="sm"
            bg="linear-gradient(180deg,#c08a52,#81512d 48%,#4c2c19)"
          />
        </Box>
      ))}
    </Box>
  );
}
