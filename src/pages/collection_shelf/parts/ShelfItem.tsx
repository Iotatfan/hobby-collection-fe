import { Badge, Box, Image, Link, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { IShelfItem as ShelfItemData } from '@/libs/collection/collection';
import { cloudinarySizes } from '@/utils/cloudinary';

interface ShelfItemProps {
  item: ShelfItemData;
  index?: number;
  variant?: 'standard' | 'wide';
}

const MotionBox = motion.create(Box);

const ShelfItem = ({ item, index = 0, variant = 'standard' }: ShelfItemProps) => {
  const grade = item.type?.grade?.short_name;
  const scale = item.type?.scale;
  const badgeLabel = grade && grade !== 'NG' && scale ? `${grade}` : (scale ?? grade);
  const isWide = variant === 'wide';

  return (
    <Link asChild textDecoration="none" flex="0 0 auto" _hover={{ textDecoration: 'none' }}>
      <RouterLink to={`/collection/${item.id}`}>
        <MotionBox
          role="group"
          position="relative"
          zIndex={1}
          w="max-content"
          borderRadius="sm"
          overflow="hidden"
          borderWidth="1px"
          borderColor="whiteAlpha.400"
          bg="gray.900"
          boxShadow="0 16px 30px rgba(0, 0, 0, 0.5)"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.35 }}
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            boxShadow: 'inset 14px 0 20px rgba(255,255,255,0.16)',
            pointerEvents: 'none',
          }}
          _after={{
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            bg: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)',
            pointerEvents: 'none',
          }}
          whileHover={{ y: -12, scale: 1.03 }}
        >
          <Image
            src={cloudinarySizes(item.cover).cover}
            alt={item.title}
            display="block"
            w="auto"
            h="auto"
            maxH="150px"
            transition="filter 0.2s ease"
            _groupHover={{ filter: 'saturate(1.12) brightness(1.08)' }}
          />

          {badgeLabel && (
            <Badge
              position="absolute"
              top="8px"
              left="8px"
              zIndex={3}
              bg="blackAlpha.800"
              color="white"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              borderRadius="sm"
              fontSize="xs"
            >
              {badgeLabel}
            </Badge>
          )}

          <Text
            position="absolute"
            left="10px"
            right="10px"
            bottom="10px"
            zIndex={3}
            color="white"
            fontSize={isWide ? 'sm' : { base: 'sm', md: 'md' }}
            fontWeight="bold"
            lineHeight="1.05"
            lineClamp={2}
            textShadow="0 2px 10px rgba(0,0,0,0.85)"
          >
            {item.title}
          </Text>
        </MotionBox>
      </RouterLink>
    </Link>
  );
};

export default ShelfItem;
