import { memo } from "react";
import { Badge, Box, Card, Image, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { cloudinarySizes } from "@/utils/cloudinary";
import { formatBuiltDateLabel } from "@/utils/date";
import { ICollectionStatus } from "@/libs/collection/collection";
import ReleaseBadge from "./ReleaseBadge";

interface IItemCard {
    id: number;
    grade: string;
    scale: string;
    typeName: string;
    cover: string;
    title: string;
    releaseType: string;
    status?: ICollectionStatus | string | null;
    builtAt?: string | null;
    acquiredAt?: string | null;
    index?: number;
    onClick?: (id: number) => void;
}

const MotionBox = motion(Box);

const ItemCard: React.FC<IItemCard> = ({
    id,
    grade,
    scale,
    typeName,
    cover,
    title,
    releaseType,
    status,
    builtAt,
    acquiredAt,
    index,
    onClick
}) => {
    const shouldShowGradeScaleBadge = scale !== "Unknown Scale";
    const regularBadgeColors = {
        bg: "badge.regular.bg",
        color: "badge.regular.fg",
    } as const;
    const normalizedStatus = String(status ?? "").trim().toLowerCase();
    const shouldUseAcquiredDate =
        normalizedStatus === "1" ||
        normalizedStatus === "2"
    const dateLabelPrefix = shouldUseAcquiredDate ? "Acquired" : "Built";
    const statusDateLabel = formatBuiltDateLabel(shouldUseAcquiredDate ? acquiredAt : builtAt);

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
                    {(typeName || shouldShowGradeScaleBadge) && (
                        <Box
                            position='absolute'
                            top='10px'
                            left='10px'
                            zIndex={1}
                            display='flex'
                            flexDirection='column'
                            gap={1}
                            alignItems='flex-start'
                        >
                            {typeName && (
                                <Badge
                                    variant='solid'
                                    bg={regularBadgeColors.bg}
                                    color={regularBadgeColors.color}
                                    fontSize='xs'
                                    fontWeight='medium'
                                    opacity={0.9}
                                >
                                    {typeName}
                                </Badge>
                            )}
                            {shouldShowGradeScaleBadge && (
                                <Badge
                                    variant='solid'
                                    bg={regularBadgeColors.bg}
                                    color={regularBadgeColors.color}
                                    fontSize='xs'
                                    fontWeight='medium'
                                    opacity={0.9}
                                >
                                    {
                                        grade == "NG" ? `${scale}` :
                                            `${grade} \u2022 ${scale}`}
                                </Badge>
                            )}
                        </Box>
                    )}
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
                </Box>

                <Card.Body p={2} gap={1}>
                    <Card.Title truncate lineClamp={2} fontSize={'md'} fontWeight='bold' pb='6px'>{title}</Card.Title>
                    <Box>
                        <ReleaseBadge
                            release={releaseType}
                            fontSize='xs'
                            fontWeight='medium'
                        />
                            {statusDateLabel && (
                                <Text mt={1} fontSize='xs' fontWeight='medium' color='blackAlpha.900'>
                                    {dateLabelPrefix}: {statusDateLabel}
                                </Text>
                            )}
                    </Box>
                </Card.Body>
            </Card.Root>
        </MotionBox>
    )
}

export default memo(ItemCard)
