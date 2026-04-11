import type React from 'react';
import { Box } from '@chakra-ui/react';
import Header from './header';

interface IHobbyShowcaseLayout {
  children: React.ReactNode;
}

const HobbyShowcaseLayout: React.FC<IHobbyShowcaseLayout> = ({ children }) => {
  return (
    <Box>
      <Header></Header>
      {children}
    </Box>
  );
};

export default HobbyShowcaseLayout;
