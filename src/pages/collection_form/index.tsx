import type {
    ICollection,
    ICollectionDrawerContent,
    IManufacturerDrawerItem,
} from "@/libs/collection/collection";
import { Box, Button, Drawer, Field, Flex, Heading, Image, Input, Portal, SimpleGrid, Stack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import collectionServices from "@/services/content/collectionServices";
import { cloudinarySizes } from "@/utils/cloudinary";
import { AxiosError } from "axios";

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

const resolveImageSrc = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";

    const imageObject = value as Record<string, unknown>;
    const candidate =
        imageObject.url ??
        imageObject.secure_url ??
        imageObject.picture_url ??
        imageObject.cover_url ??
        imageObject.public_id ??
        imageObject.picture ??
        imageObject.cover;

    return typeof candidate === "string" ? candidate : "";
};

const resolveStatusId = (value: unknown): 0 | 1 | 2 | 3 | null => {
    if (typeof value === "number" && [0, 1, 2, 3].includes(value)) {
        return value as 0 | 1 | 2 | 3;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        if ([0, 1, 2, 3].includes(parsed)) {
            return parsed as 0 | 1 | 2 | 3;
        }
    }

    return null;
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
    const [gradeId, setGradeId] = useState<number | null>(null);
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

    const drawerGrades = useMemo(() => drawerContent?.grades ?? [], [drawerContent?.grades]);
    const releaseTypes = useMemo(() => drawerContent?.release_types ?? [], [drawerContent?.release_types]);
    const manufacturers = useMemo(() => drawerContent?.manufacturers ?? [], [drawerContent?.manufacturers]);
    const seriesOptions = useMemo(() => drawerContent?.series ?? [], [drawerContent?.series]);

    type TypeOption = {
        grade_id: number;
        collection_type_name: string;
        scale: string;
        grade_short_name: string;
    };
    const typeOptions: TypeOption[] = useMemo(() => {
        return [...drawerGrades]
            .sort(
                (a, b) =>
                    a.collection_type_name.localeCompare(b.collection_type_name) ||
                    a.scale.localeCompare(b.scale) ||
                    a.grade_short_name.localeCompare(b.grade_short_name)
            )
            .map((grade) => ({
                grade_id: grade.grade_id,
                collection_type_name: grade.collection_type_name,
                scale: grade.scale,
                grade_short_name: grade.grade_short_name,
            }));
    }, [drawerGrades]);

    const selectedType = typeOptions.find((option) => option.grade_id === gradeId) ?? null;

    const selectedStatus = STATUS_OPTIONS.find((option) => option.id === statusId);
    const selectedReleaseType = releaseTypes.find((option) => option.id === releaseTypeId);
    const selectedManufacturer = manufacturers.find((option) => option.id === manufacturerId);
    const selectedSeries = seriesOptions.find((option) => option.id === seriesId);

    const coverPreviewUrl = useMemo(() => {
        if (coverFile) return URL.createObjectURL(coverFile);
        if (!existingCoverUrl) return "";
        return cloudinarySizes(existingCoverUrl).cover;
    }, [coverFile, existingCoverUrl]);

    const existingPicturePreviewUrls = useMemo(
        () => existingPictures.map((picture) => cloudinarySizes(picture.src).cover),
        [existingPictures]
    );

    const newPicturePreviewUrls = useMemo(
        () => pictureFiles.map((file) => URL.createObjectURL(file)),
        [pictureFiles]
    );

    const picturePreviewUrls = useMemo(
        () => [...existingPicturePreviewUrls, ...newPicturePreviewUrls],
        [existingPicturePreviewUrls, newPicturePreviewUrls]
    );

    const existingPictureIds = useMemo(
        () => existingPictures
            .map((picture) => picture.id)
            .filter((id): id is number => typeof id === "number"),
        [existingPictures]
    );

    const getTypeLabel = (type: TypeOption) => {
        const scalePart = type.scale?.trim() ? ` (${type.scale})` : "";
        const gradePart = type.grade_short_name?.trim() ? ` - ${type.grade_short_name}` : "";
        return `${type.collection_type_name}${scalePart}${gradePart}`;
    };

    // grade_id is auto-selected from type.

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
                setExistingCoverUrl(resolveImageSrc((data as { cover?: unknown }).cover));
                setDescription(data.description ?? "");
                setStatusId(resolveStatusId((data as { status?: unknown }).status));
                const rawPictures = (data as { pictures?: unknown[] }).pictures ?? [];
                const normalizedPictures = rawPictures
                    .map((picture) => {
                        const src = resolveImageSrc(picture);
                        if (!src) return null;

                        const pictureObject = picture as {
                            id?: number;
                            picture_id?: number;
                        };

                        return {
                            id: typeof pictureObject.id === "number" ? pictureObject.id : pictureObject.picture_id,
                            src,
                        } as ExistingPictureItem;
                    })
                    .filter((picture): picture is ExistingPictureItem => Boolean(picture));

                setExistingPictures(normalizedPictures);
                setGradeId(data.type?.grade?.id ?? null);
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
        if (drawerGrades.length === 0) return;
        if (gradeId === null) {
            setGradeId(drawerGrades[0].grade_id);
            return;
        }
        const stillValid = drawerGrades.some((grade) => grade.grade_id === gradeId);
        if (!stillValid) setGradeId(drawerGrades[0].grade_id);
    }, [drawerGrades, gradeId]);

    useEffect(() => {
        return () => {
            if (coverFile && coverPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(coverPreviewUrl);
            }
        };
    }, [coverFile, coverPreviewUrl]);

    useEffect(() => {
        return () => {
            newPicturePreviewUrls.forEach((url) => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [newPicturePreviewUrls]);

    const handlePicturesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (!files.length) return;
        setPictureFiles((prev) => [...prev, ...files]);
        event.target.value = "";
    };

    const handleRemoveExistingPicture = (indexToRemove: number) => {
        setExistingPictures((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleRemoveNewPicture = (indexToRemove: number) => {
        setPictureFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
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

        const normalizedStatusId = resolveStatusId(statusId);

        if (normalizedStatusId === null || gradeId === null || releaseTypeId === null || manufacturerId === null || seriesId === null) {
            setErrorMessage("Status, type, release type, manufacturer, and series are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("status", String(normalizedStatusId));
            if (normalizedStatusId === 3) {
                formData.append("built_at", new Date().toISOString());
            }
            formData.append("description", description.trim());
            formData.append("grade_id", String(gradeId));
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
            if (error instanceof AxiosError) {
                const backendMessage = (error.response?.data as { message?: string } | undefined)?.message;
                setErrorMessage(backendMessage ?? error.message ?? "Failed to save collection.");
            } else {
                setErrorMessage(error instanceof Error ? error.message : "Failed to save collection.");
            }
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
                    <form onSubmit={handleSubmit} noValidate>
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
                                    <Button type="button" variant="outline" justifyContent="start" onClick={() => setIsStatusDrawerOpen(true)}>
                                        {selectedStatus ? selectedStatus.name : "Choose status"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Type</Field.Label>
                                    <Button type="button" variant="outline" justifyContent="start" onClick={() => setIsTypeDrawerOpen(true)}>
                                        {selectedType ? getTypeLabel(selectedType) : "Choose collection type"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Release Type</Field.Label>
                                    <Button type="button" variant="outline" justifyContent="start" onClick={() => setIsReleaseTypeDrawerOpen(true)}>
                                        {selectedReleaseType ? selectedReleaseType.name : "Choose release type"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Series</Field.Label>
                                    <Button type="button" variant="outline" justifyContent="start" onClick={() => setIsSeriesDrawerOpen(true)}>
                                        {selectedSeries ? selectedSeries.name : "Choose series"}
                                    </Button>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Manufacturer</Field.Label>
                                    <Button type="button" variant="outline" justifyContent="start" onClick={() => setIsManufacturerDrawerOpen(true)}>
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
                                    {picturePreviewUrls.length > 0
                                        ? `${existingPictures.length} existing + ${pictureFiles.length} new image(s)`
                                        : "No pictures selected"}
                                </Text>
                                <SimpleGrid mt={2} columns={{ base: 3, md: 4 }} gap={2}>
                                    {existingPicturePreviewUrls.map((url, index) => (
                                        <Box key={`existing-${url}-${index}`} borderWidth="1px" borderRadius="md" overflow="hidden" aspectRatio={1} position="relative">
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
                                            <Button
                                                type="button"
                                                size="2xs"
                                                colorPalette="red"
                                                position="absolute"
                                                top={1}
                                                right={1}
                                                minW="20px"
                                                h="20px"
                                                p={0}
                                                borderRadius="full"
                                                lineHeight="1"
                                                onClick={() => handleRemoveExistingPicture(index)}
                                            >
                                                X
                                            </Button>
                                        </Box>
                                    ))}
                                    {newPicturePreviewUrls.map((url, index) => (
                                        <Box key={`new-${url}-${index}`} borderWidth="1px" borderRadius="md" overflow="hidden" aspectRatio={1} position="relative">
                                            <Image
                                                src={url}
                                                alt={`New picture preview ${index + 1}`}
                                                w="full"
                                                h="full"
                                                maxW="100%"
                                                maxH="100%"
                                                display="block"
                                                objectFit="cover"
                                                objectPosition="center"
                                            />
                                            <Button
                                                type="button"
                                                size="2xs"
                                                colorPalette="red"
                                                position="absolute"
                                                top={1}
                                                right={1}
                                                minW="20px"
                                                h="20px"
                                                p={0}
                                                borderRadius="full"
                                                lineHeight="1"
                                                onClick={() => handleRemoveNewPicture(index)}
                                            >
                                                X
                                            </Button>
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
                                    {typeOptions.map((option) => (
                                        <Button
                                            type="button"
                                            key={`${option.grade_id}-${option.collection_type_name}-${option.scale}`}
                                            variant={option.grade_id === gradeId ? "solid" : "outline"}
                                            colorPalette={option.grade_id === gradeId ? "blue" : "gray"}
                                            justifyContent="space-between"
                                            onClick={() => {
                                                setGradeId(option.grade_id);
                                                setIsTypeDrawerOpen(false);
                                            }}
                                        >
                                            {getTypeLabel(option)}
                                        </Button>
                                    ))}
                                    {typeOptions.length === 0 && <Text color="fg.muted">No collection types available.</Text>}
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
                                            type="button"
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
                                            type="button"
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
                                            type="button"
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
                                            type="button"
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
