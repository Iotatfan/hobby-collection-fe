import { Box, Container, Flex, VStack, Text } from "@chakra-ui/react"


const Header = () => {
    return (
        <Box position='sticky' top={0} zIndex={99} shadow='xl' bg='blue.800' py={5}>
            <Container>
                <Flex alignItems='center' padding={4} justifyContent='space-between' gap={4}>
                    <VStack align={'start'}>
                        <Text fontWeight='bold' fontSize={24} color='white'>Hobby Collection</Text>
                        <Text fontWeight='medium' fontSize={15} color='white'>Work in progress</Text>
                    </VStack>
                </Flex>
            </Container>
        </Box>
    )
}

export default Header
