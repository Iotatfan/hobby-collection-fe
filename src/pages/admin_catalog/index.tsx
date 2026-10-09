import {
  Box,
  Button,
  chakra,
  Field,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';
import collectionServices, {
  type ICreateGradeRequest,
  type ICreateMetadataTagRequest,
  type ICreateNamedCatalogRequest,
} from '@/services/content/collectionServices';
import StandardDropdown from '@/components/StandardDropdown';
import type { ICollectionTypeItem } from '@/libs/collection/collection';

const CATALOG_OPTIONS = [
  { id: 'types', label: 'Collection type' },
  { id: 'grades', label: 'Grade' },
  { id: 'scales', label: 'Scale' },
  { id: 'release-types', label: 'Release type' },
  { id: 'series', label: 'Series' },
  { id: 'manufacturers', label: 'Manufacturer' },
  { id: 'metadata-tags', label: 'Metadata tag' },
] as const;

type CatalogId = (typeof CATALOG_OPTIONS)[number]['id'];

const AdminCatalog = () => {
  const [catalog, setCatalog] = useState<CatalogId>('types');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [slug, setSlug] = useState('');
  const [metadataType, setMetadataType] = useState<'0' | '1'>('0');
  const [collectionTypeId, setCollectionTypeId] = useState<number | null>(null);
  const [collectionTypes, setCollectionTypes] = useState<ICollectionTypeItem[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    setIsLoadingTypes(true);
    collectionServices
      .getDrawerContent()
      .then((content) => {
        if (isActive) setCollectionTypes(content.collection_types ?? []);
      })
      .catch(() => {
        if (isActive) setErrorMessage('Unable to load collection types.');
      })
      .finally(() => {
        if (isActive) setIsLoadingTypes(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const selectedCatalog = CATALOG_OPTIONS.find((option) => option.id === catalog)!;
  const resetFields = () => {
    setName('');
    setShortName('');
    setSlug('');
    setMetadataType('0');
    setCollectionTypeId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      if (catalog === 'grades') {
        const payload: ICreateGradeRequest = {
          name: name.trim(),
          short_name: shortName.trim(),
          collection_type_id: collectionTypeId!,
        };
        await collectionServices.createGrade(payload);
      } else if (catalog === 'metadata-tags') {
        const payload: ICreateMetadataTagRequest = {
          slug: slug.trim(),
          name: name.trim(),
          type: Number(metadataType) as 0 | 1,
        };
        await collectionServices.createMetadataTag(payload);
      } else {
        const payload: ICreateNamedCatalogRequest = { name: name.trim() };
        const createMethods = {
          types: collectionServices.createCollectionType,
          scales: collectionServices.createScale,
          'release-types': collectionServices.createReleaseType,
          series: collectionServices.createSeries,
          manufacturers: collectionServices.createManufacturer,
        };
        await createMethods[catalog](payload);
      }
      resetFields();
      setSuccessMessage(`${selectedCatalog.label} created successfully.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to create ${selectedCatalog.label.toLowerCase()}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Catalog | Hobby Collection</title>
      </Helmet>
      <Box maxW="48rem" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        <Flex align="center" justify="space-between" gap={4} wrap="wrap" mb={6}>
          <Box>
            <Heading size="lg">Manage catalog</Heading>
            <Text color="fg.muted" mt={1}>
              Add collection types and related catalog data.
            </Text>
          </Box>
          <Button asChild variant="outline">
            <RouterLink to="/admin/collections">Back to collections</RouterLink>
          </Button>
        </Flex>

        <chakra.form
          onSubmit={handleSubmit}
          bg="white"
          rounded="lg"
          shadow="sm"
          p={{ base: 5, md: 7 }}
        >
          <VStack align="stretch" gap={5}>
            <Field.Root>
              <Field.Label>Catalog</Field.Label>
              <StandardDropdown
                placeholder="Select catalog"
                value={catalog}
                options={CATALOG_OPTIONS.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                onValueChange={(value) => {
                  setCatalog(String(value) as CatalogId);
                  resetFields();
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              />
            </Field.Root>

            {catalog === 'grades' ? (
              <>
                <Field.Root required>
                  <Field.Label>Grade name</Field.Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Short name</Field.Label>
                  <Input
                    value={shortName}
                    onChange={(event) => setShortName(event.target.value)}
                    required
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Collection type</Field.Label>
                  <StandardDropdown
                    placeholder={
                      isLoadingTypes ? 'Loading collection types...' : 'Select collection type'
                    }
                    value={collectionTypeId}
                    options={collectionTypes.map((type) => ({
                      value: type.id,
                      label: type.name,
                    }))}
                    onValueChange={(value) => setCollectionTypeId(Number(value))}
                    emptyText="No collection types available."
                  />
                  {!isLoadingTypes && collectionTypes.length === 0 && (
                    <Field.HelperText>No collection types available.</Field.HelperText>
                  )}
                </Field.Root>
              </>
            ) : catalog === 'metadata-tags' ? (
              <>
                <Field.Root required>
                  <Field.Label>Name</Field.Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Slug</Field.Label>
                  <Input value={slug} onChange={(event) => setSlug(event.target.value)} required />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Type</Field.Label>
                  <StandardDropdown
                    placeholder="Select metadata type"
                    value={metadataType}
                    options={[
                      { value: '0', label: 'Feature' },
                      { value: '1', label: 'Modification' },
                    ]}
                    onValueChange={(value) => setMetadataType(String(value) as '0' | '1')}
                  />
                </Field.Root>
              </>
            ) : (
              <Field.Root required>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </Field.Root>
            )}

            {errorMessage && (
              <Text role="alert" color="red.600">
                {errorMessage}
              </Text>
            )}
            {successMessage && (
              <Text role="status" color="green.700">
                {successMessage}
              </Text>
            )}
            <Button
              type="submit"
              colorPalette="blue"
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                (catalog === 'grades' && (collectionTypeId === null || !shortName.trim()))
              }
            >
              {isSubmitting ? <Spinner size="sm" /> : null}
              Add {selectedCatalog.label.toLowerCase()}
            </Button>
          </VStack>
        </chakra.form>
      </Box>
    </>
  );
};

export default AdminCatalog;
