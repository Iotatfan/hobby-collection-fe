import { Box, Field, Image, Input, Text } from '@chakra-ui/react';
import type { RefObject } from 'react';

type CoverImageFieldProps = {
  coverFile: File | null;
  coverInputRef: RefObject<HTMLInputElement | null>;
  coverPreviewUrl: string;
  existingCoverUrl: string;
  onCoverFileChange: (file: File | null) => void;
};

const CoverImageField = ({
  coverFile,
  coverInputRef,
  coverPreviewUrl,
  existingCoverUrl,
  onCoverFileChange,
}: CoverImageFieldProps) => {
  return (
    <Field.Root required>
      <Field.Label>Cover Image</Field.Label>
      <Input
        id="cover-upload-input"
        ref={coverInputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onCoverFileChange(file);
        }}
      />
      <Text fontSize="sm" color="fg.muted">
        {coverFile
          ? `Selected: ${coverFile.name}`
          : existingCoverUrl
            ? 'Using existing cover image'
            : 'No cover selected'}
      </Text>
      <Box mt={2}>
        {coverPreviewUrl ? (
          <Box
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            w="160px"
            h="160px"
            cursor="pointer"
            onClick={() => coverInputRef.current?.click()}
          >
            <Image
              src={coverPreviewUrl}
              alt="Cover preview"
              w="full"
              h="full"
              maxW="100%"
              maxH="100%"
              display="block"
              objectFit="cover"
              objectPosition="center"
            />
          </Box>
        ) : (
          <Box
            borderWidth="1px"
            borderStyle="dashed"
            borderRadius="md"
            w="160px"
            h="160px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="fg.muted"
            cursor="pointer"
            _hover={{ borderColor: 'blue.400', color: 'blue.500' }}
            onClick={() => coverInputRef.current?.click()}
          >
            Add image
          </Box>
        )}
      </Box>
    </Field.Root>
  );
};

export default CoverImageField;
