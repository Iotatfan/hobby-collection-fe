import { Box, Flex } from '@chakra-ui/react';
import ScenePart from '@/layouts/shelves/ScenePart';
import type { ReactNode } from 'react';

interface Props {
  back: ReactNode;
  hero: ReactNode;
  thumbnails: ReactNode;
  information: ReactNode;
  itemId: string;
  coverSelected?: boolean;
}
/** The v1 gallery-first layout, shared with the eager shelves loading state. */
export default function ShelfDetailLayout({
  back,
  hero,
  thumbnails,
  information,
  itemId,
  coverSelected = true,
}: Props) {
  return (
    <Box w="full" pt={6} pb={10} minH="80vh" mx="auto" maxW="78rem" px={{ base: 4, md: 6, lg: 8 }}>
      <Flex direction={{ base: 'column', lg: 'row' }} align="start" w="full">
        <Flex
          data-detail-gallery=""
          flex="1"
          minW={0}
          direction="column"
          w="full"
          h={{ base: 'auto', lg: '80vh' }}
          pt={{ base: 4, lg: 6 }}
          pr={{ base: 4, lg: 6 }}
          pb={{ base: 4, lg: 6 }}
        >
          <ScenePart role="controls">{back}</ScenePart>
          <ScenePart
            role="row"
            data-gallery-item={itemId}
            data-gallery-kind={coverSelected ? 'cover' : 'photo'}
            data-shelf-morph={coverSelected ? `cover-${itemId}` : undefined}
            position="relative"
            w="full"
            flex={{ base: 'none', lg: 1 }}
            h={{ base: '55vh', lg: 'auto' }}
            minH={0}
            borderRadius="xl"
            overflow="hidden"
            bg="#101b2e"
          >
            {hero}
          </ScenePart>
          <ScenePart role="controls" order={1} w="full" flexShrink={0} pt={3} minW={0}>
            {thumbnails}
          </ScenePart>
        </Flex>
        <ScenePart
          role="information"
          order={2}
          display="flex"
          data-detail-information=""
          flex="1"
          minW={0}
          pl={{ base: 0, lg: 4 }}
          py={{ base: 6, lg: 10 }}
          flexDirection="column"
          justifyContent="center"
          alignItems="start"
          w="full"
          gap={6}
          minH={{ lg: '80vh' }}
        >
          {information}
        </ScenePart>
      </Flex>
    </Box>
  );
}
