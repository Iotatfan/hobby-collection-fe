import { Box, Button, Input, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface StandardDropdownProps {
  placeholder: string;
  value: string | number | null;
  options: readonly DropdownOption[];
  onValueChange: (value: string | number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

const StandardDropdown = ({
  placeholder,
  value,
  options,
  onValueChange,
  searchable = false,
  searchPlaceholder = 'Search options',
  emptyText = 'No options available.',
}: StandardDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleOptions = useMemo(
    () =>
      normalizedSearch
        ? options.filter((option) =>
            option.label.toLocaleLowerCase().includes(normalizedSearch),
          )
        : options,
    [normalizedSearch, options],
  );
  const selectedLabel = options.find(
    (option) => String(option.value) === String(value),
  )?.label;

  return (
    <Menu.Root
      open={isOpen}
      onOpenChange={(details) => {
        setIsOpen(details.open);
        if (!details.open) setSearch('');
      }}
      closeOnSelect={!searchable}
      positioning={{ placement: 'bottom-start', sameWidth: true }}
    >
      <Menu.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          justifyContent="space-between"
          w="full"
          minW={0}
          disabled={options.length === 0}
        >
          <Text
            as="span"
            flex="1"
            minW="0"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            textAlign="left"
            color={selectedLabel ? 'fg' : 'fg.muted'}
          >
            {selectedLabel ?? placeholder}
          </Text>
          <Text as="span" ml={2} flexShrink={0} color="fg.muted" aria-hidden="true">
            <ChevronDown size={16} />
          </Text>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            w="var(--reference-width)"
            maxW="var(--available-width)"
          >
            {searchable && (
              <Box
                px={2}
                pt={2}
                pb={2}
                bg="bg.panel"
                position="sticky"
                top={0}
                zIndex={1}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Input
                  size="sm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  autoFocus
                />
              </Box>
            )}
            <Box maxH={searchable ? '14rem' : '18rem'} overflowY="auto">
              {visibleOptions.length === 0 ? (
                <Text fontSize="sm" color="fg.muted" px={2} py={1}>
                  {searchable && normalizedSearch ? 'No matching options found.' : emptyText}
                </Text>
              ) : (
                <Menu.RadioItemGroup
                  value={value === null ? '' : String(value)}
                  onValueChange={(details) => {
                    const selectedOption = options.find(
                      (option) => String(option.value) === details.value,
                    );
                    if (selectedOption) {
                      onValueChange(selectedOption.value);
                      setIsOpen(false);
                      setSearch('');
                    }
                  }}
                >
                  {visibleOptions.map((option) => (
                    <Menu.RadioItem
                      key={String(option.value)}
                      value={String(option.value)}
                      bg="bg.panel"
                      _checked={{ bg: 'bg.panel' }}
                      _highlighted={{ bg: 'bg.subtle' }}
                    >
                      <Menu.ItemIndicator />
                      <Text
                        as="span"
                        display="block"
                        minW="0"
                        flex="1"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        title={option.label}
                      >
                        {option.label}
                      </Text>
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioItemGroup>
              )}
            </Box>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default StandardDropdown;
