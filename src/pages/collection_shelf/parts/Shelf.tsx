import { Badge, Box, Flex, Icon, Link, Text } from '@chakra-ui/react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { IShelf } from '@/libs/collection/collection';
import ShelfItem from './ShelfItem';

interface ShelfProps {
  shelf: IShelf;
  icon: LucideIcon;
  accent: string;
  variant?: 'standard' | 'wide';
}

const Shelf = ({ shelf, icon, accent, variant = 'standard' }: ShelfProps) => {
  const hasViewAllLink = shelf.count > 6 && shelf.name !== 'Backlog';

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4} gap={4}>
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
            asChild
            color="whiteAlpha.900"
            fontWeight="semibold"
            display="inline-flex"
            alignItems="center"
            gap={2}
            flexShrink={0}
            _hover={{ color: 'white', textDecoration: 'none' }}
          >
            <RouterLink to={'/?collection=' + shelf.name.toLowerCase().replace(/\s+/g, '+')}>
              View All
              <ChevronRight size={18} />
            </RouterLink>
          </Link>
        )}
      </Flex>

      <Box position="relative" pb={{ base: '24px', md: '28px' }}>
        <Flex
          minH="200px"
          align="end"
          gap={{ base: 4, md: 7 }}
          overflowX="auto"
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
              variant={variant}
              clickable={shelf.name !== 'Backlog'}
            />
          ))}
        </Flex>

        <Box
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
    </Box>
  );
};

export default Shelf;
