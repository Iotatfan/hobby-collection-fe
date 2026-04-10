import { Box, Button, Field, Image, Input, SimpleGrid, Text } from '@chakra-ui/react';
import type { ChangeEvent, RefObject } from 'react';

type PicturesFieldProps = {
  existingPicturePreviewUrls: string[];
  existingPicturesCount: number;
  newPicturePreviewUrls: string[];
  newPicturesCount: number;
  onPicturesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveExistingPicture: (index: number) => void;
  onRemoveNewPicture: (index: number) => void;
  picturesInputRef: RefObject<HTMLInputElement | null>;
};

const PicturesField = ({
  existingPicturePreviewUrls,
  existingPicturesCount,
  newPicturePreviewUrls,
  newPicturesCount,
  onPicturesChange,
  onRemoveExistingPicture,
  onRemoveNewPicture,
  picturesInputRef,
}: PicturesFieldProps) => {
  const totalPictures = existingPicturesCount + newPicturesCount;

  return (
    <Field.Root>
      <Field.Label>Pictures</Field.Label>
      <Input
        id="pictures-upload-input"
        ref={picturesInputRef}
        type="file"
        multiple
        accept="image/*"
        display="none"
        onChange={onPicturesChange}
      />
      <Text fontSize="sm" color="fg.muted">
        {totalPictures > 0
          ? `${existingPicturesCount} existing + ${newPicturesCount} new image(s)`
          : 'No pictures selected'}
      </Text>
      <SimpleGrid mt={2} columns={{ base: 3, md: 4 }} gap={2}>
        {existingPicturePreviewUrls.map((url, index) => (
          <Box
            key={`existing-${url}-${index}`}
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            aspectRatio={1}
            position="relative"
          >
            <Image
              src={url}
              alt={`Picture preview ${index + 1}`}
              w="full"
              h="full"
              maxW="100%"
              maxH="100%"
              display="block"
              objectFit="cover"
              objectPosition="center"
            />
            <Button
              type="button"
              size="2xs"
              colorPalette="red"
              position="absolute"
              top={1}
              right={1}
              minW="20px"
              h="20px"
              p={0}
              borderRadius="full"
              lineHeight="1"
              onClick={() => onRemoveExistingPicture(index)}
            >
              X
            </Button>
          </Box>
        ))}
        {newPicturePreviewUrls.map((url, index) => (
          <Box
            key={`new-${url}-${index}`}
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            aspectRatio={1}
            position="relative"
          >
            <Image
              src={url}
              alt={`New picture preview ${index + 1}`}
              w="full"
              h="full"
              maxW="100%"
              maxH="100%"
              display="block"
              objectFit="cover"
              objectPosition="center"
            />
            <Button
              type="button"
              size="2xs"
              colorPalette="red"
              position="absolute"
              top={1}
              right={1}
              minW="20px"
              h="20px"
              p={0}
              borderRadius="full"
              lineHeight="1"
              onClick={() => onRemoveNewPicture(index)}
            >
              X
            </Button>
          </Box>
        ))}
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          borderRadius="md"
          aspectRatio={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="fg.muted"
          cursor="pointer"
          _hover={{ borderColor: 'blue.400', color: 'blue.500' }}
          onClick={() => picturesInputRef.current?.click()}
        >
          Add image
        </Box>
      </SimpleGrid>
    </Field.Root>
  );
};

export default PicturesField;
