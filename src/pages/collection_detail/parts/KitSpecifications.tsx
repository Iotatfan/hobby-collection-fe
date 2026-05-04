import { Box, Grid, Text } from '@chakra-ui/react';
import { formatBuiltDateLabel } from '@/utils/date';
import { ICollectionStatus } from '@/libs/collection/collection';

interface IKitSpecifications {
  scale?: string;
  manufacturer?: string;
  series?: string;
  status?: ICollectionStatus | string | null;
  builtDate?: string | null;
  acquiredDate?: string | null;
}

const KitSpecifications: React.FC<IKitSpecifications> = ({
  scale,
  manufacturer,
  series,
  status,
  builtDate,
  acquiredDate,
}) => {
  const scaleLabel = scale ?? '-';
  const manufacturerLabel = manufacturer ?? '-';
  const seriesLabel = series ?? '-';
  const normalizedStatus = String(status ?? '')
    .trim()
    .toLowerCase();
  const shouldUseAcquiredDate = normalizedStatus === '1' || normalizedStatus === '2';
  const statusDateTitle = shouldUseAcquiredDate ? 'Acquired on' : 'Completed on';
  const statusDateLabel = formatBuiltDateLabel(shouldUseAcquiredDate ? acquiredDate : builtDate);

  return (
    <Box
      w="full"
      maxW="520px"
      // bg="gray.100"
      // borderRadius="lg"
      // borderWidth="1px"
      // borderColor="whiteAlpha.200"
        // px={{ base: 4, lg: 5 }}
        // py={{ base: 3, lg: 4 }}
    >
      {/* <Text fontSize={{ base: 'sm', lg: 'md' }} color="gray.700" mb={2}>
        Kit Specifications
      </Text> */}
      <Grid
        templateColumns={{ base: '120px 1fr', lg: '140px 1fr' }}
        columnGap={4}
        rowGap={1}
        pb={1}
      >
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationLabel">
          Scale
        </Text>
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationValue">
          {scaleLabel}
        </Text>
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationLabel">
            Brand
        </Text>
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationValue">
          {manufacturerLabel}
        </Text>
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationLabel">
          Series
        </Text>
        <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationValue">
          {seriesLabel}
        </Text>
        {statusDateLabel && (
          <>
            <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationLabel">
              {statusDateTitle}
            </Text>
            <Text fontSize={{ base: 'sm', lg: 'md' }} color="specificationValue">
              {statusDateLabel}
            </Text>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default KitSpecifications;
