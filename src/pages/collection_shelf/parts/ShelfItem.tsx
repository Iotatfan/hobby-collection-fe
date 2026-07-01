import { Box, Image, Link } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { IDisplaySize, IShelfItem as ShelfItemData } from '@/libs/collection/collection';
import { cloudinarySizes } from '@/utils/cloudinary';

const HEIGHT_MAP: Record<IDisplaySize, { base: string; md: string }> = {
  small_wide: { base: '100px', md: '120px' },
  small_tall: { base: '120px', md: '150px' },
  medium_wide: { base: '140px', md: '180px' },
  medium_tall: { base: '160px', md: '210px' },
  large_wide: { base: '180px', md: '240px' },
  large_tall: { base: '210px', md: '280px' },
};

interface ShelfItemProps {
  item: ShelfItemData;
  index?: number;
  variant?: 'standard' | 'wide';
}

const MotionBox = motion.create(Box);

const ShelfItem = ({ item, index = 0 }: ShelfItemProps) => {
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
            bg: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
          whileHover={{
            y: -12,
            scale: 1.05,
          }}
        >
          <Image
            src={cloudinarySizes(item.cover).cover}
            alt={item.title}
            display="block"
            w="auto"
            h="auto"
            maxH={HEIGHT_MAP[item.display_size] || { base: '120px', md: '150px' }}
            transition="filter 0.2s ease"
            _groupHover={{ filter: 'saturate(1.12) brightness(1.08)' }}
          />
        </MotionBox>
      </RouterLink>
    </Link>
  );
};

export default ShelfItem;
