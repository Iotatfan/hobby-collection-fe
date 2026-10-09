import { Box, Field, Image, Input, Text } from '@chakra-ui/react';
import type { RefObject } from 'react';

type CoverImageFieldProps = {
  disabled?: boolean;
  coverFile: File | null;
  coverInputRef: RefObject<HTMLInputElement | null>;
  coverPreviewUrl: string;
  existingCoverUrl: string;
  onCoverFileChange: (file: File | null) => void;
};

const CoverImageField = ({
  disabled = false,
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
        disabled={disabled}
        id="cover-upload-input"
        ref={coverInputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={(event) => {
          if (disabled) return;
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
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label="Change cover image"
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            w="160px"
            h="160px"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            opacity={disabled ? 0.5 : 1}
            onClick={() => {
              if (!disabled) coverInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (!disabled && (event.key === 'Enter' || event.key === ' '))
                coverInputRef.current?.click();
            }}
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
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label="Add cover image"
            borderWidth="1px"
            borderStyle="dashed"
            borderRadius="md"
            w="160px"
            h="160px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="fg.muted"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            opacity={disabled ? 0.5 : 1}
            _hover={{ borderColor: 'blue.400', color: 'blue.500' }}
            onClick={() => {
              if (!disabled) coverInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (!disabled && (event.key === 'Enter' || event.key === ' '))
                coverInputRef.current?.click();
            }}
          >
            Add image
          </Box>
        )}
      </Box>
    </Field.Root>
  );
};

export default CoverImageField;
