import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import CoverImageField from './parts/CoverImageField';
import FormSelectDrawers from './parts/FormSelectDrawers';
import MetadataTagGroup from './parts/MetadataTagGroup';
import PicturesField from './parts/PicturesField';
import { STATUS_OPTIONS } from './helpers/collectionForm.helpers';
import useCollectionForm from './hooks/useCollectionForm';

const CollectionForm = () => {
  const {
    acquiredAt,
    activeAddonManufacturer,
    activeAddonManufacturerIndex,
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
    handlePicturesChange,
    handleRemoveAddon,
    handleRemoveExistingPicture,
    handleRemoveNewPicture,
    handleSelectAddonManufacturer,
    handleSubmit,
    isEditMode,
    isLoading,
    isGradeDrawerOpen,
    isScaleDrawerOpen,
    isManufacturerDrawerOpen,
    isReleaseTypeDrawerOpen,
    isSeriesDrawerOpen,
    isStatusDrawerOpen,
    isSubmitting,
    isTypeDrawerOpen,
    manufacturers,
    newPicturePreviewUrls,
    picturesInputRef,
    releaseTypeId,
    releaseTypes,
    scaleId,
    scales,
    selectedManufacturer,
    selectedReleaseType,
    selectedSeries,
    selectedStatus,
    selectedGrade,
    selectedScale,
    collectionType,
    collectionTypes,
    gunplaGrades,
    seriesId,
    seriesOptions,
    featureIds,
    setFeatureIds,
    modificationIds,
    setModificationIds,
    drawerFeatures,
    drawerModifications,
    setAcquiredAt,
    setActiveAddonManufacturerIndex,
    setBuiltAt,
    setCoverFile,
    setDescription,
    setIsGradeDrawerOpen,
    setIsScaleDrawerOpen,
    setIsManufacturerDrawerOpen,
    setIsReleaseTypeDrawerOpen,
    setIsSeriesDrawerOpen,
    setIsStatusDrawerOpen,
    setIsTypeDrawerOpen,
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
      <VStack w="full" maxW="44rem" align="stretch" gap={5}>
        <Stack gap={1}>
          <Heading size="xl">{isEditMode ? 'Edit Collection' : 'Create Collection'}</Heading>
          <Text color="fg.muted">
            {isEditMode
              ? 'Update existing collection details.'
              : 'Add a new item to your collection.'}
          </Text>
        </Stack>

        {errorMessage && <Text color="red.500">{errorMessage}</Text>}
        {isLoading ? (
          <Text>Loading collection...</Text>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <VStack align="stretch" gap={4}>
              <Field.Root required>
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
                onCoverFileChange={setCoverFile}
              />

              <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                <Field.Root required>
                  <Field.Label>Type</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsTypeDrawerOpen(true)}
                  >
                    {collectionType ? collectionType : 'Choose collection type'}
                  </Button>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Status</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsStatusDrawerOpen(true)}
                  >
                    {selectedStatus ? selectedStatus.name : 'Choose status'}
                  </Button>
                </Field.Root>

                {collectionType === 'Gunpla' && (
                  <Field.Root required>
                    <Field.Label>Grade</Field.Label>
                    <Button
                      type="button"
                      variant="outline"
                      justifyContent="start"
                      onClick={() => setIsGradeDrawerOpen(true)}
                    >
                      {selectedGrade ? selectedGrade.grade_short_name : 'Choose grade'}
                    </Button>
                  </Field.Root>
                )}

                <Field.Root required>
                  <Field.Label>Scale</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsScaleDrawerOpen(true)}
                  >
                    {selectedScale ? selectedScale.name : 'Choose scale'}
                  </Button>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Manufacturer</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsManufacturerDrawerOpen(true)}
                  >
                    {selectedManufacturer ? selectedManufacturer.name : 'Choose manufacturer'}
                  </Button>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Release Type</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsReleaseTypeDrawerOpen(true)}
                  >
                    {selectedReleaseType ? selectedReleaseType.name : 'Choose release type'}
                  </Button>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Series</Field.Label>
                  <Button
                    type="button"
                    variant="outline"
                    justifyContent="start"
                    onClick={() => setIsSeriesDrawerOpen(true)}
                  >
                    {selectedSeries ? selectedSeries.name : 'Choose series'}
                  </Button>
                </Field.Root>
              </Stack>

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

              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={4}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Addons</Field.Label>
                <VStack align="stretch" gap={3}>
                  {addons.map((addon, index) => {
                    const addonManufacturer = manufacturers.find(
                      (option) => option.id === addon.manufacturerId,
                    );
                    return (
                      <Stack key={addon.rowId} direction={{ base: 'column', md: 'row' }} gap={2}>
                        <Input
                          value={addon.name}
                          onChange={(event) =>
                            handleAddonNameChange(addon.rowId, event.target.value)
                          }
                          placeholder={`Addon ${index + 1} name`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          justifyContent="start"
                          onClick={() => setActiveAddonManufacturerIndex(index)}
                        >
                          {addonManufacturer ? addonManufacturer.name : 'Choose manufacturer'}
                        </Button>
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
                <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                  {isEditMode ? 'Save Changes' : 'Create Collection'}
                </Button>
                <Button asChild variant="outline">
                  <RouterLink to="/">Cancel</RouterLink>
                </Button>
              </Stack>
            </VStack>
          </form>
        )}
      </VStack>

      <FormSelectDrawers
        activeAddonManufacturerId={activeAddonManufacturer?.id}
        activeAddonManufacturerIndex={activeAddonManufacturerIndex}
        collectionType={collectionType}
        collectionTypes={collectionTypes}
        gradeId={gradeId}
        gunplaGrades={gunplaGrades}
        isGradeDrawerOpen={isGradeDrawerOpen}
        isScaleDrawerOpen={isScaleDrawerOpen}
        isManufacturerDrawerOpen={isManufacturerDrawerOpen}
        isReleaseTypeDrawerOpen={isReleaseTypeDrawerOpen}
        isSeriesDrawerOpen={isSeriesDrawerOpen}
        isStatusDrawerOpen={isStatusDrawerOpen}
        isTypeDrawerOpen={isTypeDrawerOpen}
        manufacturerId={selectedManufacturer?.id ?? null}
        manufacturers={manufacturers}
        onSelectAddonManufacturer={handleSelectAddonManufacturer}
        releaseTypeId={releaseTypeId}
        releaseTypes={releaseTypes}
        seriesId={seriesId}
        seriesOptions={seriesOptions}
        setActiveAddonManufacturerIndex={setActiveAddonManufacturerIndex}
        setGradeId={setGradeId}
        setScaleId={setScaleId}
        setIsGradeDrawerOpen={setIsGradeDrawerOpen}
        setIsScaleDrawerOpen={setIsScaleDrawerOpen}
        setIsManufacturerDrawerOpen={setIsManufacturerDrawerOpen}
        setIsReleaseTypeDrawerOpen={setIsReleaseTypeDrawerOpen}
        setIsSeriesDrawerOpen={setIsSeriesDrawerOpen}
        setIsStatusDrawerOpen={setIsStatusDrawerOpen}
        setIsTypeDrawerOpen={setIsTypeDrawerOpen}
        setManufacturerId={setManufacturerId}
        setReleaseTypeId={setReleaseTypeId}
        setSeriesId={setSeriesId}
        setStatusId={setStatusId}
        statusId={statusId}
        statusOptions={STATUS_OPTIONS}
        handleSelectCollectionType={handleSelectCollectionType}
        scaleId={scaleId}
        scales={scales}
      />
    </Flex>
  );
};

export default CollectionForm;
