import { Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { BoxIcon, Clock, Package, Star } from 'lucide-react';
import StatisticsSection from '../collection_list/parts/StatisticsSection';
import Shelf from './parts/Shelf';
import useCollectionShelves from './hooks/useCollectionShelves';

const CollectionShelf = () => {
  const { shelves, isLoading, isError } = useCollectionShelves();
  const shelfRows = shelves
    ? [
        { shelf: shelves.gunpla_shelf, icon: BoxIcon, accent: '#5B6CF6' },
        { shelf: shelves.figure_shelf, icon: Star, accent: '#805AD5' },
        { shelf: shelves.other_model_kit_shelf, icon: Package, accent: '#38A169' },
        { shelf: shelves.backlog_shelf, icon: Clock, accent: '#D97706', variant: 'wide' as const },
      ].filter(({ shelf }) => shelf?.items?.length)
    : [];

  return (
    <Box
      minH="100vh"
      bg="radial-gradient(circle at 15% 20%, rgba(30, 64, 175, 0.24), transparent 28%), radial-gradient(circle at 88% 12%, rgba(124, 58, 237, 0.18), transparent 25%), linear-gradient(180deg, #020617 0%, #020617 45%, #07111f 100%)"
    >
      <Flex
        w="full"
        direction="column"
        pt="6"
        pb="12"
        minH="80vh"
        gap={{ base: 7, md: 8 }}
        mx="auto"
        maxW="92rem"
        px={{ base: 4, md: 6, lg: 8 }}
      >
        <Box>
          <Text as="h1" color="white" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold">
            My Collection
          </Text>
          <StatisticsSection variant="dark" />
        </Box>

        {isLoading && (
          <Flex align="center" justify="center" minH="40vh">
            <Spinner borderWidth="4px" animationDuration="0.65s" color="whiteAlpha.900" size="xl" />
          </Flex>
        )}

        {isError && (
          <Text color="red.300" fontWeight="medium">
            Failed to load collection shelves.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          shelfRows.map(({ shelf, icon, accent, variant }) => (
            <Shelf
              key={shelf.name}
              shelf={shelf}
              icon={icon}
              accent={accent}
              variant={variant}
            />
          ))}

        {!isLoading && !isError && shelfRows.length === 0 && (
          <Text color="whiteAlpha.800">No shelf items found.</Text>
        )}
      </Flex>
    </Box>
  );
};

export default CollectionShelf;
