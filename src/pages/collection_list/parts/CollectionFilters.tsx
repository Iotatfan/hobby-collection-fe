import { Box, Button, Field, Flex, Menu, Portal, Tabs, Text } from '@chakra-ui/react';
import {
  ICollectionTypeFilterItem,
  IFiguresScaleFilterItem,
  IGunplaGradeFilterItem,
  IReleaseTypeDrawerItem,
} from '@/libs/collection/collection';
import {
  ALL_COLLECTION_VALUE,
  ALL_FIGURE_SCALE_VALUE,
  ALL_GUNPLA_GRADE_VALUE,
  SORT_OPTIONS,
} from '../hooks/useCollectionListFilters';

const SORT_FILTER_MIN_WIDTH = '160px';
const RELEASE_TYPE_FILTER_MIN_WIDTH = '200px';

type CollectionFiltersProps = {
  collectionTypeId?: number;
  collectionTypeOptions: ICollectionTypeFilterItem[];
  figureScaleOptions: IFiguresScaleFilterItem[];
  gunplaGradeOptions: IGunplaGradeFilterItem[];
  handleCollectionTypeChange: (value: string) => void;
  handleGradeChange: (value: string) => void;
  handleScaleChange: (value: string) => void;
  handleReleaseTypeToggle: (releaseTypeId: number, shouldCheck: boolean) => void;
  handleSortChange: (selectedSort: string) => void;
  releaseTypeOptions: IReleaseTypeDrawerItem[];
  selectedFigureScaleId?: number;
  selectedGradeId?: number;
  selectedReleaseTypeIds: number[];
  selectedReleaseTypeLabel: string;
  selectedSortLabel: string;
  showFigureScaleFilter: boolean;
  showGunplaGradeFilter: boolean;
  sortBy: string;
};

const CollectionFilters = ({
  collectionTypeId,
  collectionTypeOptions,
  figureScaleOptions,
  gunplaGradeOptions,
  handleCollectionTypeChange,
  handleGradeChange,
  handleScaleChange,
  handleReleaseTypeToggle,
  handleSortChange,
  releaseTypeOptions,
  selectedFigureScaleId,
  selectedGradeId,
  selectedReleaseTypeIds,
  selectedReleaseTypeLabel,
  selectedSortLabel,
  showFigureScaleFilter,
  showGunplaGradeFilter,
  sortBy,
}: CollectionFiltersProps) => {
  const selectedCollectionValue = collectionTypeId
    ? String(collectionTypeId)
    : ALL_COLLECTION_VALUE;
  const selectedGunplaGradeValue = selectedGradeId
    ? String(selectedGradeId)
    : ALL_GUNPLA_GRADE_VALUE;
  const selectedFigureScaleValue = selectedFigureScaleId
    ? String(selectedFigureScaleId)
    : ALL_FIGURE_SCALE_VALUE;

  return (
    <Box
      mt={3}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="transparent"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      boxShadow="sm"
    >
      <Flex direction="column" gap={3}>
        <Flex gap={3} flexWrap="wrap" align="end">
          <Field.Root flex="1 1 0" minW="0">
            <Tabs.Root
              value={selectedCollectionValue}
              onValueChange={(details) => {
                handleCollectionTypeChange(details.value);
              }}
              variant="line"
            >
              <Tabs.List
                aria-label="Collection filter"
                className="custom-scrollbar"
                display="flex"
                gap="2"
                overflowX="auto"
                overflowY="hidden"
                flexWrap={{ base: 'nowrap', md: 'wrap' }}
                bg="transparent"
                borderBottom="none"
              >
                <Tabs.Trigger
                  value={ALL_COLLECTION_VALUE}
                  flexShrink={0}
                  px="3"
                  h="8"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  All
                </Tabs.Trigger>
                {collectionTypeOptions.map((type) => (
                  <Tabs.Trigger
                    key={type.id}
                    value={String(type.id)}
                    flexShrink={0}
                    px="3"
                    h="8"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {type.name}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </Field.Root>

          <Field.Root
            w={{ base: '100%', md: 'auto' }}
            minW="0"
            maxW={{ base: '100%', md: 'none' }}
            flex={{ base: '1 1 100%', md: '0 0 auto' }}
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'stretch', md: 'center' }}
              gap={2}
              w="full"
            >
              <Text as="span" fontSize="sm" fontWeight="medium" whiteSpace="nowrap" flexShrink={0}>
                Sort By
              </Text>
              <Box w="full" flex="1" minW={{ base: '0', md: SORT_FILTER_MIN_WIDTH }}>
                <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
                  <Menu.Trigger asChild>
                    <Button size="sm" variant="outline" justifyContent="space-between" w="full">
                      <Text
                        as="span"
                        flex="1"
                        minW="0"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        textAlign="left"
                      >
                        {selectedSortLabel}
                      </Text>
                      <Text as="span" ml={2} flexShrink={0}>
                        v
                      </Text>
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.RadioItemGroup
                          value={sortBy}
                          onValueChange={(details) => {
                            handleSortChange(details.value);
                          }}
                        >
                          {SORT_OPTIONS.map((option) => (
                            <Menu.RadioItem key={option.value} value={option.value}>
                              <Menu.ItemIndicator />
                              <Text as="span">{option.label}</Text>
                            </Menu.RadioItem>
                          ))}
                        </Menu.RadioItemGroup>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Box>
            </Flex>
          </Field.Root>
        </Flex>

        <Box w="full" h="1px" bg="gray.200" />

        <Flex gap={3} flexWrap="wrap" align="stretch">
          {showGunplaGradeFilter && (
            <Field.Root flex={{ base: '1 1 100%', sm: '1 1 0' }} minW="0">
              <Flex
                direction={{ base: 'column', sm: 'row' }}
                align={{ base: 'stretch', sm: 'center' }}
                gap={2}
                w="full"
                h="full"
              >
                <Text
                  as="span"
                  fontSize="sm"
                  fontWeight="medium"
                  whiteSpace="nowrap"
                  flexShrink={0}
                  minW="48px"
                  display="flex"
                  alignItems="center"
                  h="8"
                >
                  Grades
                </Text>
                <Tabs.Root
                  value={selectedGunplaGradeValue}
                  onValueChange={(details) => {
                    handleGradeChange(details.value);
                  }}
                  variant="subtle"
                  fitted={false}
                  width="full"
                >
                  <Tabs.List
                    className="custom-scrollbar"
                    display="flex"
                    alignItems="center"
                    gap="2"
                    minH="8"
                    overflowX="auto"
                    overflowY="hidden"
                    flexWrap={{ base: 'nowrap', md: 'wrap' }}
                    bg="transparent"
                    borderBottom="none"
                  >
                    <Tabs.Trigger
                      value={ALL_GUNPLA_GRADE_VALUE}
                      flexShrink={0}
                      px="3"
                      h="8"
                      fontSize="sm"
                      _selected={{ bg: 'blue.500', color: 'white' }}
                    >
                      All
                    </Tabs.Trigger>
                    {gunplaGradeOptions.map((grade) => (
                      <Tabs.Trigger
                        key={grade.id}
                        value={String(grade.id)}
                        flexShrink={0}
                        px="3"
                        h="8"
                        fontSize="sm"
                        _selected={{ bg: 'blue.500', color: 'white' }}
                      >
                        {grade.name}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </Tabs.Root>
              </Flex>
            </Field.Root>
          )}

          {showFigureScaleFilter && (
            <Field.Root flex={{ base: '1 1 100%', sm: '1 1 0' }} minW="0">
              <Flex
                direction={{ base: 'column', sm: 'row' }}
                align={{ base: 'stretch', sm: 'center' }}
                gap={2}
                w="full"
                h="full"
              >
                <Text
                  as="span"
                  fontSize="sm"
                  fontWeight="medium"
                  whiteSpace="nowrap"
                  flexShrink={0}
                  minW="84px"
                  display="flex"
                  alignItems="center"
                  h="8"
                >
                  Scale (Figures)
                </Text>
                <Tabs.Root
                  value={selectedFigureScaleValue}
                  onValueChange={(details) => {
                    handleScaleChange(details.value);
                  }}
                  variant="subtle"
                  fitted={false}
                  width="full"
                >
                  <Tabs.List
                    className="custom-scrollbar"
                    display="flex"
                    alignItems="center"
                    gap="2"
                    minH="8"
                    overflowX="auto"
                    overflowY="hidden"
                    flexWrap={{ base: 'nowrap', md: 'wrap' }}
                    bg="transparent"
                    borderBottom="none"
                  >
                    <Tabs.Trigger
                      value={ALL_FIGURE_SCALE_VALUE}
                      flexShrink={0}
                      px="3"
                      h="8"
                      fontSize="sm"
                      _selected={{ bg: 'blue.500', color: 'white' }}
                    >
                      All
                    </Tabs.Trigger>
                    {figureScaleOptions.map((scale) => (
                      <Tabs.Trigger
                        key={scale.id}
                        value={String(scale.id)}
                        flexShrink={0}
                        px="3"
                        h="8"
                        fontSize="sm"
                        _selected={{ bg: 'blue.500', color: 'white' }}
                      >
                        {scale.name}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </Tabs.Root>
              </Flex>
            </Field.Root>
          )}

          <Field.Root
            w={{ base: '100%', sm: 'auto' }}
            minW="0"
            maxW={{ base: '100%', sm: 'none' }}
            flex={{ base: '1 1 100%', sm: '0 0 auto' }}
          >
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'stretch', sm: 'center' }}
              gap={2}
              w="full"
              h="full"
            >
              <Text
                as="span"
                fontSize="sm"
                fontWeight="medium"
                whiteSpace="nowrap"
                flexShrink={0}
                minW="84px"
                display="flex"
                alignItems="center"
                h="8"
              >
                Release Type
              </Text>
              <Box w="full" flex="1" minW={{ base: '0', sm: RELEASE_TYPE_FILTER_MIN_WIDTH }}>
                <Menu.Root
                  closeOnSelect={false}
                  positioning={{ placement: 'bottom-start', sameWidth: true }}
                >
                  <Menu.Trigger asChild>
                    <Button size="sm" variant="outline" w="full" justifyContent="space-between">
                      <Text
                        as="span"
                        flex="1"
                        minW="0"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        textAlign="left"
                      >
                        {selectedReleaseTypeLabel}
                      </Text>
                      <Text as="span" ml={2} flexShrink={0}>
                        v
                      </Text>
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        w={{ base: 'var(--available-width)', sm: RELEASE_TYPE_FILTER_MIN_WIDTH }}
                        minW={{ base: '0', sm: RELEASE_TYPE_FILTER_MIN_WIDTH }}
                        maxW={{ base: 'var(--available-width)', sm: RELEASE_TYPE_FILTER_MIN_WIDTH }}
                        maxH="180px"
                        overflowY="auto"
                      >
                        {releaseTypeOptions.length === 0 && (
                          <Text fontSize="sm" color="gray.500" px={2} py={1}>
                            No release types available.
                          </Text>
                        )}
                        <Menu.ItemGroup>
                          {releaseTypeOptions.map((releaseType) => {
                            const isChecked = selectedReleaseTypeIds.includes(releaseType.id);
                            return (
                              <Menu.CheckboxItem
                                key={releaseType.id}
                                value={String(releaseType.id)}
                                checked={isChecked}
                                onCheckedChange={() => {
                                  const shouldCheck = !isChecked;
                                  handleReleaseTypeToggle(releaseType.id, shouldCheck);
                                }}
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
                                >
                                  {releaseType.name}
                                </Text>
                              </Menu.CheckboxItem>
                            );
                          })}
                        </Menu.ItemGroup>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Box>
            </Flex>
          </Field.Root>
        </Flex>
      </Flex>
    </Box>
  );
};

export default CollectionFilters;
