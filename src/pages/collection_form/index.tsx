import type {
    ICollection,
    ICollectionDrawerContent,
    IManufacturerDrawerItem,
} from "@/libs/collection/collection";
import { Box, Button, Field, Flex, Heading, Image, Input, SimpleGrid, Stack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import collectionServices from "@/services/content/collectionServices";
import { cloudinarySizes } from "@/utils/cloudinary";
import { AxiosError } from "axios";
import FormSelectDrawer from "./parts/FormSelectDrawer";

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
    const [existingPictureUrls, setExistingPictureUrls] = useState<string[]>([]);
    const [deletedPictureUrls, setDeletedPictureUrls] = useState<string[]>([]);
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
        () => existingPictureUrls.map((url) => cloudinarySizes(url).cover),
        [existingPictureUrls]
    );

    const newPicturePreviewUrls = useMemo(
        () => pictureFiles.map((file) => URL.createObjectURL(file)),
        [pictureFiles]
    );

    const picturePreviewUrls = useMemo(
        () => [...existingPicturePreviewUrls, ...newPicturePreviewUrls],
        [existingPicturePreviewUrls, newPicturePreviewUrls]
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
                const normalizedPictureUrls = rawPictures
                    .map((picture) => resolveImageSrc(picture))
                    .filter((pictureUrl): pictureUrl is string => Boolean(pictureUrl));

                setExistingPictureUrls(normalizedPictureUrls);
                setDeletedPictureUrls([]);
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
        setExistingPictureUrls((prev) => {
            const pictureUrlToRemove = prev[indexToRemove];
            if (pictureUrlToRemove) {
                setDeletedPictureUrls((deletedPrev) =>
                    deletedPrev.includes(pictureUrlToRemove)
                        ? deletedPrev
                        : [...deletedPrev, pictureUrlToRemove]
                );
            }

            return prev.filter((_, index) => index !== indexToRemove);
        });
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

                deletedPictureUrls.forEach((deletedUrl) => {
                    formData.append("deleted_picture_urls", deletedUrl);
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
                                        ? `${existingPictureUrls.length} existing + ${pictureFiles.length} new image(s)`
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

            <FormSelectDrawer
                open={isTypeDrawerOpen}
                onOpenChange={setIsTypeDrawerOpen}
                title="Select Collection Type"
                options={typeOptions.map((option) => ({
                    key: `${option.grade_id}-${option.collection_type_name}-${option.scale}`,
                    label: getTypeLabel(option),
                    isSelected: option.grade_id === gradeId,
                    onSelect: () => {
                        setGradeId(option.grade_id);
                        setIsTypeDrawerOpen(false);
                    },
                }))}
                emptyText="No collection types available."
            />

            <FormSelectDrawer
                open={isStatusDrawerOpen}
                onOpenChange={setIsStatusDrawerOpen}
                title="Select Status"
                options={STATUS_OPTIONS.map((option) => ({
                    key: option.id,
                    label: option.name,
                    isSelected: option.id === statusId,
                    onSelect: () => {
                        setStatusId(option.id);
                        setIsStatusDrawerOpen(false);
                    },
                }))}
            />

            <FormSelectDrawer
                open={isReleaseTypeDrawerOpen}
                onOpenChange={setIsReleaseTypeDrawerOpen}
                title="Select Release Type"
                options={releaseTypes.map((option) => ({
                    key: option.id,
                    label: option.name,
                    isSelected: option.id === releaseTypeId,
                    onSelect: () => {
                        setReleaseTypeId(option.id);
                        setIsReleaseTypeDrawerOpen(false);
                    },
                }))}
                emptyText="No release types available."
            />

            <FormSelectDrawer
                open={isSeriesDrawerOpen}
                onOpenChange={setIsSeriesDrawerOpen}
                title="Select Series"
                options={seriesOptions.map((option) => ({
                    key: option.id,
                    label: option.name,
                    isSelected: option.id === seriesId,
                    onSelect: () => {
                        setSeriesId(option.id);
                        setIsSeriesDrawerOpen(false);
                    },
                }))}
                emptyText="No series available."
            />

            <FormSelectDrawer
                open={isManufacturerDrawerOpen}
                onOpenChange={setIsManufacturerDrawerOpen}
                title="Select Manufacturer"
                options={manufacturers.map((option: IManufacturerDrawerItem) => ({
                    key: option.id,
                    label: option.name,
                    isSelected: option.id === manufacturerId,
                    onSelect: () => {
                        setManufacturerId(option.id);
                        setIsManufacturerDrawerOpen(false);
                    },
                }))}
                emptyText="No manufacturers available."
            />
        </Flex>
    );
};

export default CollectionForm;
