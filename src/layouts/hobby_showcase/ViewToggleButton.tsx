import { Box, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

interface ViewToggleButtonProps {
  to: string;
  label: string;
  icon: LucideIcon;
}

const ViewToggleButton = ({ to, label, icon: Icon }: ViewToggleButtonProps) => {
  const navigate = useNavigate();

  return (
    <MotionBox
      position="fixed"
      bottom={{ base: '24px', md: '32px' }}
      right={{ base: '24px', md: '32px' }}
      zIndex={1000}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
    >
      <IconButton
        id="view-toggle-btn"
        aria-label={label}
        title={label}
        onClick={() => navigate(to)}
        borderRadius="full"
        size="lg"
        w={14}
        h={14}
        bg="blue.800"
        color="white"
        shadow="0 8px 32px rgba(30, 58, 138, 0.45), 0 2px 8px rgba(0,0,0,0.25)"
        _hover={{
          bg: 'blue.700',
          shadow: '0 12px 40px rgba(30, 58, 138, 0.6), 0 4px 12px rgba(0,0,0,0.3)',
        }}
        _active={{ bg: 'blue.900' }}
      >
        <Icon size={22} />
      </IconButton>
    </MotionBox>
  );
};

export default ViewToggleButton;
