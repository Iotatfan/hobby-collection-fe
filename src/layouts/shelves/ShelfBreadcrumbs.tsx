import { Box, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import type { ShelfCategory } from '@/libs/collection/collection';
import { categories } from '@/pages/collection_shelf/helpers/categories';

export default function ShelfBreadcrumbs({
  category,
  title,
}: {
  category?: ShelfCategory;
  title: string;
}) {
  return (
    <Box as="nav" aria-label="Breadcrumb" mb={4} color="shelves.muted" overflowWrap="anywhere">
      <Link asChild color="shelves.link" minH="44px" focusVisibleRing="outside">
        <RouterLink to="/shelves">Collection</RouterLink>
      </Link>
      {category && (
        <>
          <Text as="span" mx={3} aria-hidden="true">
            /
          </Text>
          <Link asChild color="shelves.link" minH="44px" focusVisibleRing="outside">
            <RouterLink to={`/shelves/category/${category}`}>
              {categories[category].name}
            </RouterLink>
          </Link>
        </>
      )}
      <Text as="span" mx={3} aria-hidden="true">
        /
      </Text>
      <Text as="span" aria-current="page">
        {title}
      </Text>
    </Box>
  );
}
