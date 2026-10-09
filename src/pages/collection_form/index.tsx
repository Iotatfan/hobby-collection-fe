import {
  Box,
  Button,
  chakra,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import StandardDropdown from '@/components/StandardDropdown';
import { Link as RouterLink } from 'react-router-dom';
import CoverImageField from './parts/CoverImageField';
import MetadataTagGroup from './parts/MetadataTagGroup';
import PicturesField from './parts/PicturesField';
import { STATUS_OPTIONS } from './helpers/collectionForm.helpers';
import useCollectionForm from './hooks/useCollectionForm';

const CollectionForm = () => {
  const {
    acquiredAt,
    addons,
    builtAt,
    coverFile,
    coverInputRef,
    coverPreviewUrl,
    description,
    errorMessage,
    existingCoverUrl,
    existingPictureUrls,
    existingPicturePreviewUrls,
    gradeId,
    handleAddAddon,
    handleAddonNameChange,
    handleAddonManufacturerChange,
    handlePicturesChange,
    handleRemoveAddon,
    handleRemoveExistingPicture,
    handleRemoveNewPicture,
    handleSubmit,
    handleCoverFileChange,
    isEditMode,
    isLoading,
    isSubmitting,
    manufacturers,
    newPicturePreviewUrls,
    picturesInputRef,
    releaseTypeId,
    releaseTypes,
    scaleId,
    scales,
    selectedManufacturer,
    collectionType,
    collectionTypes,
    setDisplaySize,
    displaySize,
    gunplaGrades,
    seriesId,
    seriesOptions,
    featureIds,
    setFeatureIds,
    modificationIds,
    setModificationIds,
    drawerFeatures,
    drawerModifications,
    drawerDisplaySizes,
    setAcquiredAt,
    setBuiltAt,
    setDescription,
    handleSelectCollectionType,
    setManufacturerId,
    setReleaseTypeId,
    setSeriesId,
    setStatusId,
    setTitle,
    statusId,
    title,
    setGradeId,
    setScaleId,
  } = useCollectionForm();
  return (
    <Flex w="full" justify="center" px={4} py={8}>
      <VStack w="full" minW={0} maxW="64rem" align="stretch" gap={5}>
        <Stack gap={1}>
          <Heading size="xl">{isEditMode ? 'Edit Collection' : 'Create Collection'}</Heading>
          <Text color="fg.muted">
            {isEditMode
              ? 'Update existing collection details.'
              : 'Add a new item to your collection.'}
          </Text>
        </Stack>

        {errorMessage && (
          <Text role="alert" tabIndex={-1} color="red.500">
            {errorMessage}
          </Text>
        )}
        {isLoading ? (
          <Text>Loading collection...</Text>
        ) : (
          <chakra.form
            onSubmit={handleSubmit}
            noValidate
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="2xl"
            boxShadow="sm"
            p={{ base: 4, md: 7 }}
          >
            <VStack align="stretch" gap={6} minW={0} w="full">
              <Field.Root required minW={0}>
                <Field.Label>Title</Field.Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Collection title"
                />
              </Field.Root>

              <CoverImageField
                coverFile={coverFile}
                coverInputRef={coverInputRef}
                coverPreviewUrl={coverPreviewUrl}
                existingCoverUrl={existingCoverUrl}
                onCoverFileChange={handleCoverFileChange}
              />

              <Box
                display="grid"
                gridTemplateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
                gap={4}
                minW={0}
              >
                <Field.Root required minW={0}>
                  <Field.Label>Type</Field.Label>
                  <StandardDropdown
                    placeholder="Choose collection type"
                    value={collectionType}
                    options={collectionTypes.map((type) => ({ value: type, label: type }))}
                    onValueChange={(value) => handleSelectCollectionType(String(value))}
                  />
                </Field.Root>

                <Field.Root required minW={0}>
                  <Field.Label>Status</Field.Label>
                  <StandardDropdown
                    placeholder="Choose status"
                    value={statusId}
                    options={STATUS_OPTIONS.map((option) => ({
                      value: option.id,
                      label: option.name,
                    }))}
                    onValueChange={(value) => setStatusId(Number(value) as 0 | 1 | 2 | 3)}
                  />
                </Field.Root>

                {collectionType === 'Gunpla' && (
                  <Field.Root required minW={0}>
                    <Field.Label>Grade</Field.Label>
                    <StandardDropdown
                      placeholder="Choose grade"
                      value={gradeId}
                      options={gunplaGrades.map((grade) => ({
                        value: grade.grade_id,
                        label: grade.grade_short_name,
                      }))}
                      onValueChange={(value) => setGradeId(Number(value))}
                    />
                  </Field.Root>
                )}

                <Field.Root required minW={0}>
                  <Field.Label>Scale</Field.Label>
                  <StandardDropdown
                    placeholder="Choose scale"
                    value={scaleId}
                    options={scales.map((scale) => ({ value: scale.id, label: scale.name }))}
                    onValueChange={(value) => setScaleId(Number(value))}
                  />
                </Field.Root>

                <Field.Root required minW={0}>
                  <Field.Label>Manufacturer</Field.Label>
                  <StandardDropdown
                    placeholder="Choose manufacturer"
                    value={selectedManufacturer?.id ?? null}
                    options={manufacturers.map((manufacturer) => ({
                      value: manufacturer.id,
                      label: manufacturer.name,
                    }))}
                    onValueChange={(value) => setManufacturerId(Number(value))}
                  />
                </Field.Root>

                <Field.Root required minW={0}>
                  <Field.Label>Release Type</Field.Label>
                  <StandardDropdown
                    placeholder="Choose release type"
                    value={releaseTypeId}
                    options={releaseTypes.map((releaseType) => ({
                      value: releaseType.id,
                      label: releaseType.name,
                    }))}
                    onValueChange={(value) => setReleaseTypeId(Number(value))}
                  />
                </Field.Root>

                <Field.Root required minW={0}>
                  <Field.Label>Series</Field.Label>
                  <StandardDropdown
                    placeholder="Choose series"
                    value={seriesId}
                    options={seriesOptions.map((series) => ({
                      value: series.id,
                      label: series.name,
                    }))}
                    onValueChange={(value) => setSeriesId(Number(value))}
                    searchable
                    searchPlaceholder="Search series"
                    emptyText="No series available."
                  />
                </Field.Root>

                <Field.Root required minW={0}>
                  <Field.Label>Display Size</Field.Label>
                  <StandardDropdown
                    placeholder="Choose display size"
                    value={displaySize}
                    options={drawerDisplaySizes.map((size) => ({ value: size, label: size }))}
                    onValueChange={(value) => setDisplaySize(String(value))}
                  />
                </Field.Root>
              </Box>

              <Stack gap={4}>
                <MetadataTagGroup
                  label="Features"
                  options={drawerFeatures}
                  selectedIds={featureIds}
                  onChange={setFeatureIds}
                  emptyText="No features available."
                />

                <MetadataTagGroup
                  label="Modifications"
                  options={drawerModifications}
                  selectedIds={modificationIds}
                  onChange={setModificationIds}
                  emptyText="No modifications available."
                />
              </Stack>

              {statusId === 3 && (
                <Field.Root required>
                  <Field.Label>Built Date</Field.Label>
                  <Input
                    type="date"
                    value={builtAt}
                    onChange={(event) => setBuiltAt(event.target.value)}
                  />
                </Field.Root>
              )}

              {(statusId === 1 || statusId === 2) && (
                <Field.Root required>
                  <Field.Label>Acquired Date</Field.Label>
                  <Input
                    type="date"
                    value={acquiredAt}
                    onChange={(event) => setAcquiredAt(event.target.value)}
                  />
                </Field.Root>
              )}

              <Field.Root minW={0}>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={4}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Add-ons</Field.Label>
                <VStack align="stretch" gap={3} minW={0} w="full">
                  {addons.map((addon, index) => {
                    return (
                      <Stack
                        key={addon.rowId}
                        direction={{ base: 'column', md: 'row' }}
                        gap={2}
                        minW={0}
                        w="full"
                      >
                        <Input
                          value={addon.name}
                          onChange={(event) =>
                            handleAddonNameChange(addon.rowId, event.target.value)
                          }
                          placeholder={`Addon ${index + 1} name`}
                        />
                        <Box w="full" minW={0} flex={{ base: 'initial', md: '0 0 14rem' }}>
                          <StandardDropdown
                            placeholder="Choose manufacturer"
                            value={addon.manufacturerId}
                            options={manufacturers.map((manufacturer) => ({
                              value: manufacturer.id,
                              label: manufacturer.name,
                            }))}
                            onValueChange={(value) =>
                              handleAddonManufacturerChange(addon.rowId, Number(value))
                            }
                          />
                        </Box>
                        <Button
                          type="button"
                          variant="outline"
                          colorPalette="red"
                          onClick={() => handleRemoveAddon(addon.rowId)}
                        >
                          Remove
                        </Button>
                      </Stack>
                    );
                  })}
                  <Button type="button" variant="outline" onClick={handleAddAddon}>
                    Add addon
                  </Button>
                </VStack>
              </Field.Root>

              <PicturesField
                existingPicturePreviewUrls={existingPicturePreviewUrls}
                existingPicturesCount={existingPictureUrls.length}
                newPicturePreviewUrls={newPicturePreviewUrls}
                newPicturesCount={newPicturePreviewUrls.length}
                onPicturesChange={handlePicturesChange}
                onRemoveExistingPicture={handleRemoveExistingPicture}
                onRemoveNewPicture={handleRemoveNewPicture}
                picturesInputRef={picturesInputRef}
              />

              <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
                <Button
                  type="submit"
                  colorPalette="blue"
                  loading={isSubmitting}
                  whiteSpace="normal"
                >
                  {isEditMode ? 'Save Changes' : 'Create Collection'}
                </Button>
                <Button asChild variant="outline">
                  <RouterLink to="/admin/collections">Cancel</RouterLink>
                </Button>
              </Stack>
            </VStack>
          </chakra.form>
        )}
      </VStack>
    </Flex>
  );
};

export default CollectionForm;
