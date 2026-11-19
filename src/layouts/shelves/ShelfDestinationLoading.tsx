import { LoadingBackLink, ShelfSkeletonRows } from '@/layouts/shelves/ShelfLoadingParts';
import { Box, Button, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import { Clock } from 'lucide-react';
import StatisticsSection from '@/pages/collection_list/parts/StatisticsSection';
import { useReducedMotion } from 'framer-motion';
import { useShelfLocation, useShelfSceneReady } from '@/layouts/shelves/scene';
import {
  useShelfRestoration,
  useLoadingFocusHandoff,
  type ShelfNavigation,
} from '@/pages/collection_shelf/helpers/navigation';
import { categories, isCategory, typeCategory } from '@/pages/collection_shelf/helpers/categories';
import { getCachedCollectionShelves } from '@/utils/collectionCaches';
import { cloudinarySizes } from '@/utils/cloudinary';
import ShelfPageContainer from '@/layouts/shelves/ShelfPageContainer';
import ShelfBreadcrumbs from '@/layouts/shelves/ShelfBreadcrumbs';
import ShelfDetailLayout from '@/layouts/shelves/ShelfDetailLayout';
import Shelf from '@/pages/collection_shelf/parts/Shelf';

export function DetailLoading({ error, retry }: { error?: string; retry?: () => void }) {
  const location = useShelfLocation();
  const id = Number(location.pathname.split('/')[3]);
  const candidate = (location.state as ShelfNavigation | null)?.preview?.item;
  const preview = candidate?.id === id ? candidate : undefined;
  const reduced = useReducedMotion();
  const animation = reduced || error ? 'none' : undefined;
  const focusRoot = useLoadingFocusHandoff();
  useShelfSceneReady(true);
  useShelfRestoration(true);
  return (
    <Box ref={focusRoot} data-destination-loading="detail" aria-busy={!error}>
      <ShelfDetailLayout
        itemId={String(id)}
        breadcrumb={
          <ShelfBreadcrumbs
            category={typeCategory(preview?.type?.name)}
            title={preview?.title || 'Collection detail'}
          />
        }
        back={<LoadingBackLink compact />}
        hero={
          preview?.cover ? (
            <Image
              data-gallery-current-image=""
              src={cloudinarySizes(preview.cover).cover}
              alt={`${preview.title} - Box art`}
              w="full"
              h="full"
              objectFit="contain"
            />
          ) : (
            <Skeleton data-shelf-skeleton="hero" w="full" h="full" animation={animation} />
          )
        }
        thumbnails={
          <Flex data-shelf-skeleton="thumbnails" aria-hidden="true" gap={2} justify="center" pb={1}>
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                w={{ base: '80px', md: '96px' }}
                h={{ base: '68px', md: '80px' }}
                borderRadius="lg"
                animation={animation}
              />
            ))}
          </Flex>
        }
        information={
          <>
            <Skeleton aria-hidden="true" w="76px" h="28px" animation={animation} />
            <Text
              as="h1"
              tabIndex={-1}
              fontSize={{ base: '2xl', lg: '3xl' }}
              fontWeight="bold"
              lineHeight="shorter"
            >
              {preview?.title || 'Collection detail'}
            </Text>
            {error ? (
              <Box role="alert">
                <Text color="red.300">{error}</Text>
                {retry && (
                  <Button mt={4} onClick={retry}>
                    Retry
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <Box data-shelf-skeleton="metadata" aria-hidden="true" w="full" maxW="520px">
                  {[100, 90, 65].map((width, index) => (
                    <Skeleton key={index} h="20px" w={`${width}%`} mb={3} animation={animation} />
                  ))}
                  <Box h="1px" bg="whiteAlpha.200" my={6} />
                  {[0, 1, 2, 3].map((index) => (
                    <Skeleton key={index} h="20px" w="80%" mb={3} animation={animation} />
                  ))}
                </Box>
                <Text srOnly role="status">
                  Loading collection detail...
                </Text>
              </>
            )}
          </>
        }
      />
    </Box>
  );
}

export default function ShelfDestinationLoading() {
  const location = useShelfLocation();
  if (location.pathname.startsWith('/shelves/collection/')) return <DetailLoading />;
  return <OverviewLoading />;
}
function OverviewLoading() {
  const cached = getCachedCollectionShelves();
  const focusRoot = useLoadingFocusHandoff();
  useShelfSceneReady(true);
  useShelfRestoration(true);
  return (
    <ShelfPageContainer
      minH="100vh"
      display="flex"
      flexDirection="column"
      pt={6}
      pb={28}
      gap={{ base: 7, md: 8 }}
      ref={focusRoot}
      data-destination-loading="overview"
      aria-busy="true"
    >
      <Box>
        <Text as="h1" tabIndex={-1} fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold">
          My Collection
        </Text>
        <StatisticsSection variant="dark" />
      </Box>
      {cached ? (
        <>
          {Object.entries(categories).map(([slug, config]) =>
            cached[config.key]?.items?.length ? (
              <Shelf
                key={config.key}
                category={isCategory(slug) ? slug : undefined}
                shelf={cached[config.key]}
                icon={config.icon}
                accent={config.accent}
              />
            ) : null,
          )}
          {cached.backlog_shelf?.items?.length > 0 && (
            <Shelf shelf={cached.backlog_shelf} icon={Clock} accent="#D97706" />
          )}
        </>
      ) : (
        <ShelfSkeletonRows />
      )}
      <Text role="status">Loading shelves...</Text>
    </ShelfPageContainer>
  );
}
