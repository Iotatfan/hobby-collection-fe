import type {
    ICollection,
    ICollectionDrawerContent,
    IManufacturerDrawerItem,
    ICollectionTypeDrawerItem,
} from "@/libs/collection/collection";
import { Box, Button, Drawer, Field, Flex, Heading, Image, Input, Portal, SimpleGrid, Stack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import collectionServices from "@/services/content/collectionServices";

type StatusOption = {
    id: 0 | 1 | 2 | 3;
    name: string;
};

const STATUS_OPTIONS: StatusOption[] = [
    { id: 0, name: "Wishlist" },
    { id: 1, name: "Backlog" },
    { id: 2, name: "Owned" },
    { id: 3, name: "Built" },
];

type ExistingPictureItem = {
    id?: number;
    src: string;
};

const CollectionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = useMemo(() => Boolean(id), [id]);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const picturesInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState("");
    const [pictureFiles, setPictureFiles] = useState<File[]>([]);
    const [existingPictures, setExistingPictures] = useState<ExistingPictureItem[]>([]);
    const [description, setDescription] = useState("");
    const [statusId, setStatusId] = useState<0 | 1 | 2 | 3 | null>(null);
    const [typeId, setTypeId] = useState<number | null>(null);
    const [releaseTypeId, setReleaseTypeId] = useState<number | null>(null);
    const [manufacturerId, setManufacturerId] = useState<number | null>(null);
    const [seriesId, setSeriesId] = useState<number | null>(null);
    const [drawerContent, setDrawerContent] = useState<ICollectionDrawerContent>();
    const [isLoadingCollection, setIsLoadingCollection] = useState(false);
    const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTypeDrawerOpen, setIsTypeDrawerOpen] = useState(false);
    const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
    const [isReleaseTypeDrawerOpen, setIsReleaseTypeDrawerOpen] = useState(false);
    const [isManufacturerDrawerOpen, setIsManufacturerDrawerOpen] = useState(false);
    const [isSeriesDrawerOpen, setIsSeriesDrawerOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const collectionTypes = drawerContent?.collection_types ?? [];
    const releaseTypes = drawerContent?.release_types ?? [];
    const manufacturers = drawerContent?.manufacturers ?? [];
    const seriesOptions = drawerContent?.series ?? [];

    const selectedType = collectionTypes.find((option) => option.id === typeId);
    const selectedStatus = STATUS_OPTIONS.find((option) => option.id === statusId);
    const selectedReleaseType = releaseTypes.find((option) => option.id === releaseTypeId);
    const selectedManufacturer = manufacturers.find((option) => option.id === manufacturerId);
    const selectedSeries = seriesOptions.find((option) => option.id === seriesId);

    const coverPreviewUrl = useMemo(() => {
        if (coverFile) return URL.createObjectURL(coverFile);
        return existingCoverUrl;
    }, [coverFile, existingCoverUrl]);

    const picturePreviewUrls = useMemo(() => {
        if (pictureFiles.length > 0) {
            return pictureFiles.map((file) => URL.createObjectURL(file));
        }
        return existingPictures.map((picture) => picture.src);
    }, [pictureFiles, existingPictures]);

    const existingPictureIds = useMemo(
        () => existingPictures
            .map((picture) => picture.id)
            .filter((id): id is number => typeof id === "number"),
        [existingPictures]
    );

    const getTypeLabel = (type: ICollectionTypeDrawerItem) => {
        const gradeText = type.grade?.name?.trim();
        return gradeText ? `${type.name} - ${type.scale} (${gradeText})` : `${type.name} - ${type.scale}`;
    };

    useEffect(() => {
        const loadDrawerContent = async () => {
            setIsLoadingDrawer(true);
            setErrorMessage(null);
            try {
                const response = await collectionServices.getDrawerContent();
                setDrawerContent(response);
            } catch {
                setErrorMessage("Failed to load drawer content.");
            } finally {
                setIsLoadingDrawer(false);
            }
        };

        void loadDrawerContent();
    }, []);

    useEffect(() => {
        if (!isEditMode || !id) return;

        const collectionId = Number(id);
        if (Number.isNaN(collectionId)) {
            setErrorMessage("Invalid collection id.");
            return;
        }

        const loadCollection = async () => {
            setIsLoadingCollection(true);
            setErrorMessage(null);
            try {
                const response = await collectionServices.getCollection(collectionId);
                const data: ICollection = response.data;
                setTitle(data.title ?? "");
                setExistingCoverUrl(data.cover ?? "");
                setDescription(data.description ?? "");
                setStatusId(data.status ?? null);
                const rawPictures = (data as { pictures?: unknown[] }).pictures ?? [];
                const normalizedPictures = rawPictures
                    .map((picture) => {
                        if (typeof picture === "string") {
                            return { src: picture } as ExistingPictureItem;
                        }

                        if (!picture || typeof picture !== "object") {
                            return null;
                        }

                        const pictureObject = picture as {
                            id?: number;
                            picture_id?: number;
                            url?: string;
                            secure_url?: string;
                            picture_url?: string;
                            public_id?: string;
                        };

                        const src =
                            pictureObject.url ||
                            pictureObject.secure_url ||
                            pictureObject.picture_url ||
                            pictureObject.public_id;

                        if (!src) return null;

                        return {
                            id: typeof pictureObject.id === "number" ? pictureObject.id : pictureObject.picture_id,
                            src,
                        } as ExistingPictureItem;
                    })
                    .filter((picture): picture is ExistingPictureItem => Boolean(picture));

                setExistingPictures(normalizedPictures);
                setTypeId(data.type?.id ?? null);
                setReleaseTypeId(data.release_type?.id ?? null);
                setManufacturerId(data.manufacturer?.id ?? null);
                setSeriesId(data.series?.id ?? null);
            } catch {
                setErrorMessage("Failed to load collection data.");
            } finally {
                setIsLoadingCollection(false);
            }
        };

        void loadCollection();
    }, [id, isEditMode]);

    useEffect(() => {
        return () => {
            if (coverFile && coverPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(coverPreviewUrl);
            }
        };
    }, [coverFile, coverPreviewUrl]);

    useEffect(() => {
        return () => {
            picturePreviewUrls.forEach((url) => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [picturePreviewUrls]);

    const handlePicturesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (!files.length) return;
        setPictureFiles((prev) => [...prev, ...files]);
        event.target.value = "";
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);

        if (!title.trim()) {
            setErrorMessage("Title is required.");
            return;
        }

        if (!coverFile && !existingCoverUrl) {
            setErrorMessage("Cover image is required.");
            return;
        }

        if (statusId === null || typeId === null || releaseTypeId === null || manufacturerId === null || seriesId === null) {
            setErrorMessage("Status, type, release type, manufacturer, and series are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("status", String(statusId));
            if (statusId === 3) {
                formData.append("built_at", new Date().toISOString());
            }
            formData.append("description", description.trim());
            formData.append("type_id", String(typeId));
            formData.append("release_type_id", String(releaseTypeId));
            formData.append("manufacturer_id", String(manufacturerId));
            formData.append("series_id", String(seriesId));

            if (isEditMode && id) {
                if (coverFile) {
                    formData.append("cover", coverFile);
                }

                pictureFiles.forEach((file) => {
                    formData.append("new_pictures", file);
                });

                existingPictureIds.forEach((existingId) => {
                    formData.append("existing_picture_ids", String(existingId));
                });

                await collectionServices.updateCollection(Number(id), formData);
            } else {
                if (coverFile) {
                    formData.append("cover", coverFile);
                }

                pictureFiles.forEach((file) => {
                    formData.append("pictures", file);
                });

                await collectionServices.createCollection(formData);
            }

            navigate("/");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save collection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isLoadingCollection || isLoadingDrawer;

    return (
        <Flex w="full" justify="center" px={4} py={8}>
            <VStack w="full" maxW="44rem" align="stretch" gap={5}>
                <Stack gap={1}>
                    <Heading size="xl">{isEditMode ? "Edit Collection" : "Create Collection"}</Heading>
                    <Text color="fg.muted">
                        {isEditMode ? "Update existing collection details." : "Add a new item to your collection."}
                    </Text>
                </Stack>

                {errorMessage && <Text color="red.500">{errorMessage}</Text>}
                {isLoading ? (
                    <Text>Loading collection...</Text>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <VStack align="stretch" gap={4}>
                            <Field.Root required>
                                <Field.Label>Title</Field.Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Collection title" />
                            </Field.Root>

                            <Field.Root required>
                                <Field.Label>Cover Image</Field.Label>
                                <Input
                                    id="cover-upload-input"
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    display="none"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setCoverFile(file);
                                    }}
                                />
                                <Text fontSize="sm" color="fg.muted">
                                    {coverFile ? `Selected: ${coverFile.name}` : (existingCoverUrl ? "Using existing cover image" : "No cover selected")}
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
                                            _hover={{ borderColor: "blue.400", color: "blue.500" }}
                                            onClick={() => coverInputRef.current?.click()}
                                        >
                                            Add image
                                        </Box>
                                    )}
                                </Box>
                            </Field.Root>

                            <Stack direction={{ base: "column", md: "row" }} gap={4}>
                                <Field.Root required>
                                    <Field.Label>Status</Field.Label>
                                    <Button variant="outline" justifyContent="start" onClick={() => setIsStatusDrawerOpen(true)}>
                                        {selectedStatus ? selectedStatus.name : "Choose status"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Type</Field.Label>
                                    <Button variant="outline" justifyContent="start" onClick={() => setIsTypeDrawerOpen(true)}>
                                        {selectedType ? getTypeLabel(selectedType) : "Choose collection type"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Release Type</Field.Label>
                                    <Button variant="outline" justifyContent="start" onClick={() => setIsReleaseTypeDrawerOpen(true)}>
                                        {selectedReleaseType ? selectedReleaseType.name : "Choose release type"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Series</Field.Label>
                                    <Button variant="outline" justifyContent="start" onClick={() => setIsSeriesDrawerOpen(true)}>
                                        {selectedSeries ? selectedSeries.name : "Choose series"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Manufacturer</Field.Label>
                                    <Button variant="outline" justifyContent="start" onClick={() => setIsManufacturerDrawerOpen(true)}>
                                        {selectedManufacturer ? selectedManufacturer.name : "Choose manufacturer"}
                                    </Button>
                                </Field.Root>
                            </Stack>

                            <Field.Root>
                                <Field.Label>Description</Field.Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                    rows={4}
                                />
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>Pictures</Field.Label>
                                <Input
                                    id="pictures-upload-input"
                                    ref={picturesInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    display="none"
                                    onChange={handlePicturesChange}
                                />
                                <Text fontSize="sm" color="fg.muted">
                                    {pictureFiles.length > 0
                                        ? `${pictureFiles.length} image(s) selected`
                                        : (existingPictures.length > 0 ? `Using ${existingPictures.length} existing image(s)` : "No pictures selected")}
                                </Text>
                                <SimpleGrid mt={2} columns={{ base: 3, md: 4 }} gap={2}>
                                    {picturePreviewUrls.map((url, index) => (
                                        <Box key={`${url}-${index}`} borderWidth="1px" borderRadius="md" overflow="hidden" aspectRatio={1}>
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
                                        _hover={{ borderColor: "blue.400", color: "blue.500" }}
                                        onClick={() => picturesInputRef.current?.click()}
                                    >
                                        Add image
                                    </Box>
                                </SimpleGrid>
                            </Field.Root>

                            <Stack direction={{ base: "column", sm: "row" }} gap={3}>
                                <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                    {isEditMode ? "Save Changes" : "Create Collection"}
                                </Button>
                                <Button asChild variant="outline">
                                    <RouterLink to="/">Cancel</RouterLink>
                                </Button>
                            </Stack>
                        </VStack>
                    </form>
                )}
            </VStack>

            <Drawer.Root open={isTypeDrawerOpen} onOpenChange={(event) => setIsTypeDrawerOpen(event.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Select Collection Type</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <VStack align="stretch" gap={2}>
                                    {collectionTypes.map((option) => (
                                        <Button
                                            key={option.id}
                                            variant={option.id === typeId ? "solid" : "outline"}
                                            colorPalette={option.id === typeId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setTypeId(option.id);
                                                setIsTypeDrawerOpen(false);
                                            }}
                                        >
                                            {getTypeLabel(option)}
                                        </Button>
                                    ))}
                                    {collectionTypes.length === 0 && <Text color="fg.muted">No collection types available.</Text>}
                                </VStack>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Drawer.Root open={isStatusDrawerOpen} onOpenChange={(event) => setIsStatusDrawerOpen(event.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Select Status</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <VStack align="stretch" gap={2}>
                                    {STATUS_OPTIONS.map((option) => (
                                        <Button
                                            key={option.id}
                                            variant={option.id === statusId ? "solid" : "outline"}
                                            colorPalette={option.id === statusId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setStatusId(option.id);
                                                setIsStatusDrawerOpen(false);
                                            }}
                                        >
                                            {option.name}
                                        </Button>
                                    ))}
                                </VStack>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Drawer.Root open={isReleaseTypeDrawerOpen} onOpenChange={(event) => setIsReleaseTypeDrawerOpen(event.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Select Release Type</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <VStack align="stretch" gap={2}>
                                    {releaseTypes.map((option) => (
                                        <Button
                                            key={option.id}
                                            variant={option.id === releaseTypeId ? "solid" : "outline"}
                                            colorPalette={option.id === releaseTypeId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setReleaseTypeId(option.id);
                                                setIsReleaseTypeDrawerOpen(false);
                                            }}
                                        >
                                            {option.name}
                                        </Button>
                                    ))}
                                    {releaseTypes.length === 0 && <Text color="fg.muted">No release types available.</Text>}
                                </VStack>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Drawer.Root open={isSeriesDrawerOpen} onOpenChange={(event) => setIsSeriesDrawerOpen(event.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Select Series</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <VStack align="stretch" gap={2}>
                                    {seriesOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            variant={option.id === seriesId ? "solid" : "outline"}
                                            colorPalette={option.id === seriesId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setSeriesId(option.id);
                                                setIsSeriesDrawerOpen(false);
                                            }}
                                        >
                                            {option.name}
                                        </Button>
                                    ))}
                                    {seriesOptions.length === 0 && <Text color="fg.muted">No series available.</Text>}
                                </VStack>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Drawer.Root open={isManufacturerDrawerOpen} onOpenChange={(event) => setIsManufacturerDrawerOpen(event.open)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Select Manufacturer</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <VStack align="stretch" gap={2}>
                                    {manufacturers.map((option: IManufacturerDrawerItem) => (
                                        <Button
                                            key={option.id}
                                            variant={option.id === manufacturerId ? "solid" : "outline"}
                                            colorPalette={option.id === manufacturerId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setManufacturerId(option.id);
                                                setIsManufacturerDrawerOpen(false);
                                            }}
                                        >
                                            {option.name}
                                        </Button>
                                    ))}
                                    {manufacturers.length === 0 && <Text color="fg.muted">No manufacturers available.</Text>}
                                </VStack>
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </Flex>
    );
};

export default CollectionForm;
