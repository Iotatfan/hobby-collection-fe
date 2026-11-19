import { Box, Text } from '@chakra-ui/react';
import { BoxIcon, Clock, LayoutGrid, Package, Star } from 'lucide-react';
import ViewToggleButton from '@/layouts/hobby_showcase/ViewToggleButton';
import StatisticsSection from '../collection_list/parts/StatisticsSection';
import Shelf from './parts/Shelf';
import useCollectionShelves from './hooks/useCollectionShelves';
import { useShelfRestoration } from './helpers/navigation';
import { useShelfSceneReady, useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { ShelfSkeletonRows } from '@/layouts/shelves/ShelfLoadingParts';
import ShelfPageContainer from '@/layouts/shelves/ShelfPageContainer';
import ScenePart from '@/layouts/shelves/ScenePart';
import { Helmet } from 'react-helmet-async';

const CollectionShelf = () => {
  const current = useShelfSceneCurrent();
  const { shelves, isLoading, isError } = useCollectionShelves();
  useShelfSceneReady(true);
  useShelfRestoration(true);
  const shelfRows = shelves
    ? [
        {
          category: 'gunpla' as const,
          shelf: shelves.gunpla_shelf,
          icon: BoxIcon,
          accent: '#5B6CF6',
        },
        { category: 'figure' as const, shelf: shelves.figure_shelf, icon: Star, accent: '#805AD5' },
        {
          category: 'other-model-kit' as const,
          shelf: shelves.other_model_kit_shelf,
          icon: Package,
          accent: '#38A169',
        },
        { category: undefined, shelf: shelves.backlog_shelf, icon: Clock, accent: '#D97706' },
      ].filter(({ shelf }) => shelf?.items?.length)
    : [];

  const pageTitle = 'Hobby Collection Showcase';
  const pageDescription =
    'Explore my personal collection of model kits, custom builds, and hobby projects.';
  const pageUrl = 'https://hobby.iotatfan.com/shelves';

  return (
    <>
      {current && (
        <Helmet>
          {/* Standard Page Info */}
          <meta name="description" content={pageDescription} />

          {/* Open Graph / Facebook / Discord */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          {/* <meta property="og:image" content={pageImage} /> */}
          <meta property="og:url" content={pageUrl} />
          <meta property="og:site_name" content="Hobby Showcase" />

          {/* Twitter / X Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          {/* <meta name="twitter:image" content={pageImage} /> */}
        </Helmet>
      )}

      <Box minH="100vh" bg="transparent">
        <ShelfPageContainer
          display="flex"
          flexDirection="column"
          w="full"
          pt="6"
          pb="28"
          minH="80vh"
          gap={{ base: 7, md: 8 }}
        >
          <ScenePart role="summary">
            <Text
              as="h1"
              tabIndex={-1}
              color="white"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
            >
              My Collection
            </Text>
            <Text color="shelves.muted" fontSize="lg">
              Gunpla, figures &amp; model kits
            </Text>
            <StatisticsSection variant="dark" />
          </ScenePart>

          {isLoading && (
            <>
              <ShelfSkeletonRows />
              <Text role="status">Loading shelves...</Text>
            </>
          )}

          {isError && (
            <Text color="red.300" fontWeight="medium">
              Failed to load collection shelves.
            </Text>
          )}

          {!isLoading && !isError && shelfRows.length > 0 && (
            <Box display="flex" flexDirection="column" gap={{ base: 5, md: 6 }}>
              {shelfRows.map(({ category, shelf, icon, accent }, index) => (
                <Shelf
                  category={category}
                  order={index}
                  key={shelf.name}
                  shelf={shelf}
                  icon={icon}
                  accent={accent}
                />
              ))}
            </Box>
          )}

          {!isLoading && !isError && shelfRows.length === 0 && (
            <Text color="whiteAlpha.800">No shelf items found.</Text>
          )}
        </ShelfPageContainer>
      </Box>

      <ScenePart
        role="controls"
        order={3}
        position="fixed"
        bottom={{
          base: 'max(24px, env(safe-area-inset-bottom))',
          md: 'max(32px, env(safe-area-inset-bottom))',
        }}
        right={{ base: '24px', md: '32px' }}
        zIndex={1000}
      >
        <ViewToggleButton
          floating={false}
          to="/"
          label="Switch to Classic View"
          icon={LayoutGrid}
        />
      </ScenePart>
    </>
  );
};

export default CollectionShelf;
