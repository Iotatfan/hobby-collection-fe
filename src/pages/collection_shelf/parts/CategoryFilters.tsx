import { Box, Button, Flex, Icon, Link, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { ShelfCategory, ShelfFilters } from '@/libs/collection/collection';
import type { CategorySceneData } from '@/layouts/shelves/scene';
import { useShelfSceneCurrent } from '@/layouts/shelves/scene';
import { warmShelfRoute } from '@/layouts/shelves/warmup';
import { categories } from '../helpers/categories';
import { filterFields } from '../helpers/filters';

type Option = { id: number; name: string };
type Field = { key: keyof ShelfFilters; label: string; options: Option[] };

function FilterDropdown({
  field,
  value,
  change,
  accent,
  disabled,
}: {
  field: Field;
  value?: number;
  change: (value?: number) => void;
  accent: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = useShelfSceneCurrent();
  const selected = field.options.find((option) => option.id === value);
  return (
    <Menu.Root
      open={current && open}
      onOpenChange={({ open }) => setOpen(open)}
      positioning={{ placement: 'bottom-start', gutter: 8 }}
    >
      <Menu.Trigger asChild>
        <Button
          aria-label={field.label}
          aria-description={selected?.name || 'All'}
          disabled={disabled}
          variant="ghost"
          minH="44px"
          h="auto"
          px={3}
          py={2}
          color={selected ? 'white' : 'whiteAlpha.800'}
          bg={selected ? 'whiteAlpha.100' : 'whiteAlpha.50'}
          borderWidth="1px"
          borderRadius="md"
          borderColor={selected ? accent : 'whiteAlpha.200'}
          fontSize="sm"
          fontWeight="medium"
          _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.400' }}
          _expanded={{ bg: 'whiteAlpha.100', borderColor: accent }}
          whiteSpace="normal"
          textAlign="left"
          maxW="full"
          focusVisibleRing="outside"
          focusRingColor={accent}
        >
          <Text as="span" minW={0} overflowWrap="anywhere">
            {field.label}
            {selected ? `: ${selected.name}` : ''}
          </Text>
          <Icon as={ChevronDown} boxSize={4} flexShrink={0} aria-hidden="true" />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW="min(16rem, calc(100vw - 32px))"
            maxW="min(24rem, calc(100vw - 32px))"
            maxH="20rem"
            overflowY="auto"
            bg="shelves.surface"
            color="white"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="lg"
            p={1.5}
            boxShadow="0 16px 36px rgba(0, 0, 0, 0.5)"
            className="custom-scrollbar"
          >
            <Menu.RadioItemGroup
              value={value?.toString() || ''}
              onValueChange={({ value }) => {
                change(value ? Number(value) : undefined);
                setOpen(false);
              }}
            >
              {[{ id: 0, name: 'All' }, ...field.options].map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  value={option.id ? String(option.id) : ''}
                  minH="44px"
                  fontSize="sm"
                  borderRadius="md"
                  borderInlineStartWidth="2px"
                  borderInlineStartColor="transparent"
                  color="white"
                  whiteSpace="normal"
                  overflowWrap="anywhere"
                  _checked={{
                    color: 'white',
                    bg: 'whiteAlpha.100',
                    borderInlineStartColor: accent,
                  }}
                  _highlighted={{
                    bg: 'whiteAlpha.200',
                    color: 'white',
                    borderInlineStartColor: accent,
                  }}
                >
                  <Menu.ItemIndicator color="white" />
                  {option.name}
                </Menu.RadioItem>
              ))}
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export default function CategoryFilters({
  category,
  data,
  count,
}: {
  category: ShelfCategory;
  data?: CategorySceneData;
  count: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const config = categories[category];
  const filters = data?.filters || {};
  const options = data?.options;
  const grades = options?.grades || [];
  const shortcuts = ['HG', 'RG', 'MG'];
  const extraGrades = grades.filter((grade) => !shortcuts.includes(grade.short_name.toUpperCase()));
  const fields: Field[] =
    category === 'gunpla'
      ? [
          ...(extraGrades.length
            ? [
                {
                  key: 'grade_id' as const,
                  label: 'Additional grades',
                  options: extraGrades.map((grade) => ({
                    ...grade,
                    name: grade.short_name || grade.name,
                  })),
                },
              ]
            : []),
          { key: 'release_type_id', label: 'Release Type', options: options?.release_types || [] },
          { key: 'series_id', label: 'Series', options: options?.series || [] },
        ]
      : [
          { key: 'scale_id', label: 'Scale', options: options?.scales || [] },
          {
            key: 'manufacturer_id',
            label: 'Brand',
            options: options?.manufacturers || [],
          },
          { key: 'series_id', label: 'Series', options: options?.series || [] },
        ];
  const active = filterFields.filter((field) => filters[field] !== undefined);
  const total = options?.total_count;
  const countText = data?.pending
    ? data.error
      ? 'Results unavailable'
      : 'Updating items…'
    : active.length && total !== undefined
      ? `${count} of ${total} items`
      : `${count} items`;
  const chipLabel = (field: keyof ShelfFilters) => {
    if (field === 'grade_id')
      return `Grade: ${grades.find((grade) => grade.id === filters[field])?.short_name || filters[field]}`;
    const definition = fields.find((entry) => entry.key === field);
    return `${definition?.label}: ${definition?.options.find((option) => option.id === filters[field])?.name || filters[field]}`;
  };
  return (
    <Box mt={5}>
      <Flex as="nav" aria-label="Shelf categories" gap={{ base: 1, md: 3 }} flexWrap="wrap" mb={3}>
        {(Object.keys(categories) as ShelfCategory[]).map((slug) => (
          <Link
            key={slug}
            asChild
            minH="44px"
            px={3}
            py={2}
            fontWeight="medium"
            color={slug === category ? 'white' : 'whiteAlpha.700'}
            borderBottomWidth="2px"
            borderColor={slug === category ? config.accent : 'transparent'}
            focusVisibleRing="outside"
          >
            <RouterLink
              to={`/shelves/category/${slug}`}
              aria-current={slug === category ? 'page' : undefined}
              onMouseEnter={() => warmShelfRoute(`/shelves/category/${slug}`)}
              onFocus={() => warmShelfRoute(`/shelves/category/${slug}`)}
            >
              {slug === 'other-model-kit' ? 'Other Model Kits' : categories[slug].name}
            </RouterLink>
          </Link>
        ))}
      </Flex>
      <Flex align="center" flexWrap="wrap" gap={2}>
        {category === 'gunpla' && (
          <Flex role="group" aria-label="Grade" flexWrap="wrap" gap={1}>
            {['All', ...shortcuts].map((label) => {
              const grade = grades.find((grade) => grade.short_name.toUpperCase() === label);
              const selected =
                label === 'All'
                  ? filters.grade_id === undefined
                  : Boolean(grade && filters.grade_id === grade.id);
              return (
                <Button
                  key={label}
                  variant="ghost"
                  minW="44px"
                  minH="44px"
                  px={3}
                  aria-pressed={selected}
                  disabled={label !== 'All' && (!grade || data?.filtersLoading)}
                  bg={selected ? config.accent : 'transparent'}
                  color={selected ? 'white' : 'whiteAlpha.800'}
                  _hover={{ bg: selected ? config.accent : 'whiteAlpha.100' }}
                  focusVisibleRing="outside"
                  onClick={() => data?.changeFilter('grade_id', grade?.id)}
                >
                  {label}
                </Button>
              );
            })}
          </Flex>
        )}
        <Button
          display={{ base: 'inline-flex', md: 'none' }}
          variant="ghost"
          minH="44px"
          px={3}
          aria-expanded={expanded}
          aria-controls={panelId}
          color="whiteAlpha.900"
          _hover={{ bg: 'whiteAlpha.100' }}
          _expanded={{ bg: 'whiteAlpha.100' }}
          focusVisibleRing="outside"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters
        </Button>
        <Flex
          id={panelId}
          display={{ base: expanded ? 'flex' : 'none', md: 'flex' }}
          order={{ base: 2, md: 0 }}
          w={{ base: 'full', md: 'auto' }}
          minW={0}
          flexWrap="wrap"
          gap={1}
        >
          {fields.map((field) => (
            <FilterDropdown
              key={field.key}
              field={field}
              value={filters[field.key]}
              change={(value) => data?.changeFilter(field.key, value)}
              accent={config.accent}
              disabled={!options || Boolean(data?.filtersLoading)}
            />
          ))}
        </Flex>
        <Text
          role="status"
          aria-live="polite"
          aria-atomic="true"
          fontSize="sm"
          color="whiteAlpha.700"
          ml="auto"
          py={2}
        >
          {countText}
        </Text>
      </Flex>
      {data?.filtersError && (
        <Flex align="center" gap={2} flexWrap="wrap">
          <Text fontSize="sm" color="orange.200">
            {data.filtersError}
          </Text>
          <Button
            variant="ghost"
            minH="44px"
            color="white"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={data.retryFilters}
          >
            Reload filters
          </Button>
        </Flex>
      )}
      {active.length > 0 && (
        <Flex gap={2} mt={2} flexWrap="wrap" align="center" aria-label="Active filters">
          {active.map((field) => (
            <Button
              key={field}
              variant="outline"
              size="sm"
              minH="44px"
              h="auto"
              py={2}
              maxW="full"
              whiteSpace="normal"
              overflowWrap="anywhere"
              color="whiteAlpha.900"
              borderColor="whiteAlpha.300"
              _hover={{ bg: 'whiteAlpha.100' }}
              focusVisibleRing="outside"
              aria-label={`Remove ${chipLabel(field)}`}
              onClick={() => data?.changeFilter(field)}
            >
              {chipLabel(field)}
              <X size={14} aria-hidden="true" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            minH="44px"
            color="orange.200"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={data?.clearFilters}
            focusVisibleRing="outside"
          >
            Clear all
          </Button>
        </Flex>
      )}
    </Box>
  );
}
