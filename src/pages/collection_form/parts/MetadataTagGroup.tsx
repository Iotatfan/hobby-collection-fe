import { Button, Flex, Text } from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import type { IMetadataTag } from '@/libs/collection/collection';
import type { Dispatch, SetStateAction } from 'react';

type MetadataTagGroupProps = {
  label: string;
  options: IMetadataTag[];
  selectedIds: number[];
  onChange: Dispatch<SetStateAction<number[]>>;
  emptyText?: string;
};

const MetadataTagGroup = ({
  label,
  options,
  selectedIds,
  onChange,
  emptyText = 'No options available.',
}: MetadataTagGroupProps) => {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Flex wrap="wrap" gap={2}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <Button
              key={option.id}
              type="button"
              variant={isSelected ? 'solid' : 'outline'}
              colorPalette={isSelected ? 'blue' : 'gray'}
              size="sm"
              rounded="full"
              onClick={() => {
                onChange((prev) =>
                  prev.includes(option.id)
                    ? prev.filter((id) => id !== option.id)
                    : [...prev, option.id],
                );
              }}
            >
              {option.name}
            </Button>
          );
        })}
        {options.length === 0 && (
          <Text color="fg.muted" fontSize="sm">
            {emptyText}
          </Text>
        )}
      </Flex>
    </Field.Root>
  );
};

export default MetadataTagGroup;
