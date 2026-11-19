import { Flex } from '@chakra-ui/react';
import ShelfPageContainer from '@/layouts/shelves/ShelfPageContainer';
import ScenePart from '@/layouts/shelves/ScenePart';
import type { ReactNode } from 'react';

interface Props {
  back: ReactNode;
  hero: ReactNode;
  thumbnails: ReactNode;
  information: ReactNode;
  itemId: string;
  coverSelected?: boolean;
  breadcrumb?: ReactNode;
}
/** The v1 gallery-first layout, shared with the eager shelves loading state. */
export default function ShelfDetailLayout({
  back,
  hero,
  thumbnails,
  information,
  itemId,
  coverSelected = true,
  breadcrumb,
}: Props) {
  return (
    <ShelfPageContainer pt={6} pb={10} minH="80vh">
      <ScenePart role="controls">{breadcrumb}</ScenePart>
      <ScenePart role="controls">{back}</ScenePart>
      <Flex
        gap={{ base: 6, lg: 10 }}
        direction={{ base: 'column', lg: 'row' }}
        align="start"
        w="full"
      >
        <Flex
          data-detail-gallery=""
          flex={{ base: 'none', lg: '11 1 0' }}
          minW={0}
          direction="column"
          w="full"
          h={{ base: 'auto', lg: 'min(820px, 85vh)' }}
        >
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
            bg="shelves.raised"
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
          flex={{ base: 'none', lg: '9 1 0' }}
          minW={0}
          py={{ base: 0, lg: 6 }}
          flexDirection="column"
          justifyContent="flex-start"
          alignItems="start"
          w="full"
          gap={4}
        >
          {information}
        </ScenePart>
      </Flex>
    </ShelfPageContainer>
  );
}
