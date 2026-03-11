import { memo } from "react";
import { Badge, Box, Card, HStack, Image } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { cloudinarySizes } from "@/utils/cloudinary";

interface IItemCard {
    id: number;
    grade: string;
    scale: string;
    cover: string;
    title: string;
    releaseType: string;
    index?: number;
    onClick?: (id: number) => void;
}

const MotionBox = motion(Box);

const ItemCard: React.FC<IItemCard> = ({
    id,
    grade,
    scale,
    cover,
    title,
    releaseType,
    index,
    onClick
}) => {
    const shouldShowGradeScaleBadge = !(grade === "NG" && scale === "Unknown Scale");

    return (
        <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index || 0) * 0.2, duration: 0.5 }}
        >
            <Card.Root
                w='full'
                borderRadius='md'
                borderStyle='solid'
                shadow='xl'
                role="group"
                overflow='hidden'
                aspectRatio='3/4'
                minW={{ base: 0, lg: '250px' }}
                borderColor='gray.200'
                transition="all 0.2s ease"
                _hover={{ borderColor: 'gray.400', cursor: 'pointer', transform: "translateY(-10px)" }}
                onClick={() => onClick?.(id)}
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
                            aspectRatio: '4/3',
                        }}
                        src={cloudinarySizes(cover).cover}
                    />
                    {shouldShowGradeScaleBadge && (
                        <HStack
                            position='absolute'
                            bottom='10px' left='10px'
                        >
                            <Badge
                                variant='solid'
                                colorPalette='cyan'
                                fontSize='xs'
                                fontWeight='medium'
                            >
                                {grade + ' ' + scale}
                            </Badge>
                        </HStack>
                    )}
                </Box>

                <Card.Body p={2} gap={1}>
                    <Card.Title truncate lineClamp={2} fontSize={'md'} fontWeight='bold'>{title}</Card.Title>
                    <Box>
                        <Badge
                            variant='solid'
                            bg={releaseType === "P-Bandai" ? "badge.gold.bg" : "badge.regular.bg"}
                            color={releaseType === "P-Bandai" ? "badge.gold.fg" : "badge.regular.fg"}
                            fontSize='xs'
                            fontWeight='medium'>
                            {releaseType}
                        </Badge>
                    </Box>
                    {/* <Text truncate fontSize={'xs'} color='gray.500' fontWeight='medium'>{releaseType}</Text> */}
                </Card.Body>
            </Card.Root>
        </MotionBox>
    )
}

export default memo(ItemCard)
