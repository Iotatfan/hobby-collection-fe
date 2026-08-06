import { Box, Container, Flex, VStack, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  return (
    <Box position="sticky" top={0} zIndex={99} shadow="xl" bg="blue.800" py={5}>
      <Container>
        <Flex alignItems="center" padding={4} justifyContent="space-between" gap={4}>
          <VStack align={'start'}>
            <Link asChild color="white" _hover={{ textDecoration: 'none' }}>
              <RouterLink to="/" aria-label="Go to Hobby Collection home page">
                <Text fontWeight="bold" fontSize={24}>
                  Hobby Collection
                </Text>
              </RouterLink>
            </Link>
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
