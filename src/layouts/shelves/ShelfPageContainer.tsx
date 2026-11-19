import type { Ref } from 'react';
import { Box, type BoxProps } from '@chakra-ui/react';

/** Shared outer bounds include the gutters on every Shelves route and loading state. */
export default function ShelfPageContainer(props: BoxProps & { ref?: Ref<HTMLDivElement> }) {
  return (
    <Box
      {...props}
      data-shelf-container=""
      w="full"
      maxW="90rem"
      mx="auto"
      px={{ base: 4, md: 6, lg: 8 }}
    />
  );
}
