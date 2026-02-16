import { Badge, Box, Card, HStack, Image, Stack, Text } from "@chakra-ui/react";

interface IItemCard {
    grade: string;
    cover: string;
    title: string;
    releaseType: string;
    index?: number;
}

const ItemCard: React.FC<IItemCard> = ({
    grade,
    cover,
    title,
    releaseType
}) => {
    return (
        <Card.Root
            w='full'
            borderRadius='md'
            borderStyle='solid'
            shadow='xl'
            role="group"
            overflow='hidden'
            aspectRatio='3/4'
            _hover={{ borderColor: 'gray.400', cursor: 'pointer' }}
        >
            <Box
                position='relative'
                overflow='hidden'
            >
                <Image
                    boxSize='full'
                    maxBlockSize='12rem'
                    alt="cover image"
                    objectFit='cover'
                    css={{
                        aspectRatio: '1',
                    }}
                    src={cover}
                />
                <Badge
                    variant='solid'
                    colorPalette= {grade === 'High Grade' ? 'blue' : 'yellow'}
                    position='absolute'
                    bottom={2} left={2}
                    fontSize='xs'
                    fontWeight='medium'>
                    {grade}
                </Badge>
            </Box>

            <Card.Body p={2} gap={1}>
                <Card.Title truncate lineClamp={2} fontSize={'md'} fontWeight='bold' >{title}</Card.Title>
                <Text truncate fontSize={'xs'} color='gray.500' fontWeight='medium'>{releaseType}</Text>
            </Card.Body>
        </Card.Root>
    )
}

export default ItemCard