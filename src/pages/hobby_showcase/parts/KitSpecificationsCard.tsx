import { Box, Grid, Text } from "@chakra-ui/react";

interface IKitSpecificationsCard {
    scale?: string;
    manufacturer?: string;
    series?: string;
}

const KitSpecificationsCard: React.FC<IKitSpecificationsCard> = ({
    scale,
    manufacturer,
    series,
}) => {
    const scaleLabel = scale ?? "-"
    const manufacturerLabel = manufacturer ?? "-"
    const seriesLabel = series ?? "-"

    return (
        <Box
            w="full"
            maxW="520px"
            bg="gray.900"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            px={{ base: 4, lg: 5 }}
            py={{ base: 3, lg: 4 }}
        >
            <Text
                fontSize={{ base: "sm", lg: "md" }}
                color="gray.400"
                mb={2}
            >
                Kit Specifications
            </Text>
            <Grid
                templateColumns={{ base: "120px 1fr", lg: "140px 1fr" }}
                columnGap={4}
                rowGap={1}
            >
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationLabel">Scale</Text>
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationValue">{scaleLabel}</Text>
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationLabel">Manufacturer</Text>
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationValue">{manufacturerLabel}</Text>
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationLabel">Series</Text>
                <Text fontSize={{ base: "sm", lg: "md" }} color="specificationValue">{seriesLabel}</Text>
            </Grid>
        </Box>
    )
}

export default KitSpecificationsCard
