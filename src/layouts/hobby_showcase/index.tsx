import type React from 'react';
import { Box } from '@chakra-ui/react';
import Header from './header';

interface IHobbyShowcaseLayout {
  children: React.ReactNode;
  showHeader?: boolean;
}

const HobbyShowcaseLayout: React.FC<IHobbyShowcaseLayout> = ({ children, showHeader = true }) => {
  return (
    <Box>
      {showHeader && <Header />}
      {children}
    </Box>
  );
};

export default HobbyShowcaseLayout;
