import type {
  ICollection,
  ICollectionDrawerContent,
  IManufacturerDrawerItem,
} from '@/libs/collection/collection';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import collectionServices from '@/services/content/collectionServices';
import { cloudinarySizes } from '@/utils/cloudinary';
import {
  AddonFormItem,
  createAddonRowFactory,
  resolveImageSrc,
  resolveStatusId,
  STATUS_OPTIONS,
  toDateInputValue,
  toIsoDateTime,
} from './collectionForm.helpers';

const useCollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = useMemo(() => Boolean(id), [id]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const picturesInputRef = useRef<HTMLInputElement>(null);
  const addonRowIdRef = useRef(0);

  const [title, setTitle] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);
  const [existingPictureUrls, setExistingPictureUrls] = useState<string[]>([]);
  const [deletedPictureUrls, setDeletedPictureUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [builtAt, setBuiltAt] = useState('');
  const [acquiredAt, setAcquiredAt] = useState('');
  const [statusId, setStatusId] = useState<0 | 1 | 2 | 3 | null>(null);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [scaleId, setScaleId] = useState<number | null>(null);
  const [releaseTypeId, setReleaseTypeId] = useState<number | null>(null);
  const [manufacturerId, setManufacturerId] = useState<number | null>(null);
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [addons, setAddons] = useState<AddonFormItem[]>([]);
  const [deletedAddonIds, setDeletedAddonIds] = useState<number[]>([]);
  const [drawerContent, setDrawerContent] = useState<ICollectionDrawerContent>();
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeDrawerOpen, setIsTypeDrawerOpen] = useState(false);
  const [isGradeDrawerOpen, setIsGradeDrawerOpen] = useState(false);
  const [isScaleDrawerOpen, setIsScaleDrawerOpen] = useState(false);
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  const [isReleaseTypeDrawerOpen, setIsReleaseTypeDrawerOpen] = useState(false);
  const [isManufacturerDrawerOpen, setIsManufacturerDrawerOpen] = useState(false);
  const [isSeriesDrawerOpen, setIsSeriesDrawerOpen] = useState(false);
  const [activeAddonManufacturerIndex, setActiveAddonManufacturerIndex] = useState<number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionType, setCollectionType] = useState<string | null>(null);

  const drawerGrades = useMemo(() => drawerContent?.grades ?? [], [drawerContent?.grades]);
  const scales = useMemo(() => drawerContent?.scales ?? [], [drawerContent?.scales]);
  const releaseTypes = useMemo(
    () => drawerContent?.release_types ?? [],
    [drawerContent?.release_types],
  );
  const manufacturers = useMemo(
    () => drawerContent?.manufacturers ?? [],
    [drawerContent?.manufacturers],
  );

  const seriesOptions = useMemo(() => drawerContent?.series ?? [], [drawerContent?.series]);

  const collectionTypes = useMemo(() => {
    return Array.from(new Set(drawerGrades.map((g) => g.collection_type_name))).sort();
  }, [drawerGrades]);

  const gunplaGrades = useMemo(() => {
    return drawerGrades.filter((g) => g.collection_type_name === 'Gunpla');
  }, [drawerGrades]);

  const selectedGrade = useMemo(() => {
    return drawerGrades.find((option) => option.grade_id === gradeId) ?? null;
  }, [drawerGrades, gradeId]);
  const selectedScale = scales.find((option) => option.id === scaleId);
  const selectedStatus = STATUS_OPTIONS.find((option) => option.id === statusId);
  const selectedReleaseType = releaseTypes.find((option) => option.id === releaseTypeId);
  const selectedManufacturer = manufacturers.find((option) => option.id === manufacturerId);
  const selectedSeries = seriesOptions.find((option) => option.id === seriesId);
  const activeAddonManufacturer =
    activeAddonManufacturerIndex === null
      ? undefined
      : manufacturers.find(
        (option) => option.id === addons[activeAddonManufacturerIndex]?.manufacturerId,
      );

  const coverPreviewUrl = useMemo(() => {
    if (coverFile) return URL.createObjectURL(coverFile);
    if (!existingCoverUrl) return '';
    return cloudinarySizes(existingCoverUrl).cover;
  }, [coverFile, existingCoverUrl]);

  const existingPicturePreviewUrls = useMemo(
    () => existingPictureUrls.map((url) => cloudinarySizes(url).cover),
    [existingPictureUrls],
  );

  const newPicturePreviewUrls = useMemo(
    () => pictureFiles.map((file) => URL.createObjectURL(file)),
    [pictureFiles],
  );

  const picturePreviewUrls = useMemo(
    () => [...existingPicturePreviewUrls, ...newPicturePreviewUrls],
    [existingPicturePreviewUrls, newPicturePreviewUrls],
  );

  const createAddonRow = useMemo(() => {
    return createAddonRowFactory(() => {
      addonRowIdRef.current += 1;
      return addonRowIdRef.current;
    });
  }, []);

  useEffect(() => {
    const loadDrawerContent = async () => {
      setIsLoadingDrawer(true);
      setErrorMessage(null);
      try {
        const response = await collectionServices.getDrawerContent();
        setDrawerContent(response);
      } catch {
        setErrorMessage('Failed to load drawer content.');
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
      setErrorMessage('Invalid collection id.');
      return;
    }

    const loadCollection = async () => {
      setIsLoadingCollection(true);
      setErrorMessage(null);
      try {
        const response = await collectionServices.getCollection(collectionId);
        const data: ICollection = response.data;
        setTitle(data.title ?? '');
        setExistingCoverUrl(resolveImageSrc((data as { cover?: unknown }).cover));
        setDescription(data.description ?? '');
        setBuiltAt(toDateInputValue(data.built_at));
        setAcquiredAt(toDateInputValue(data.acquired_at));
        setStatusId(resolveStatusId((data as { status?: unknown }).status));
        const rawPictures = (data as { pictures?: unknown[] }).pictures ?? [];
        const normalizedPictureUrls = rawPictures
          .map((picture) => resolveImageSrc(picture))
          .filter((pictureUrl): pictureUrl is string => Boolean(pictureUrl));

        setExistingPictureUrls(normalizedPictureUrls);
        setDeletedPictureUrls([]);
        setGradeId(data.type?.grade?.id ?? null);
        
        const scaleOption = drawerContent?.scales?.find(s => s.name === data.type?.scale) || null;
        setScaleId(scaleOption ? scaleOption.id : null);
        
        setCollectionType(data.type?.name ?? null);
        setReleaseTypeId(data.release_type?.id ?? null);
        setManufacturerId(data.manufacturer?.id ?? null);
        setSeriesId(data.series?.id ?? null);
        setAddons((data.addons ?? []).map((addon) => createAddonRow(addon)));
        setDeletedAddonIds([]);
      } catch {
        setErrorMessage('Failed to load collection data.');
      } finally {
        setIsLoadingCollection(false);
      }
    };

    void loadCollection();
  }, [createAddonRow, id, isEditMode]);

  useEffect(() => {
    if (drawerGrades.length === 0) return;

    if (collectionType === null && gradeId === null) {
      const defaultGrade = drawerGrades[0];
      setCollectionType(defaultGrade.collection_type_name);
      setGradeId(defaultGrade.grade_id);
      return;
    }

    if (gradeId !== null && collectionType === null) {
      const grade = drawerGrades.find((g) => g.grade_id === gradeId);
      if (grade) {
        setCollectionType(grade.collection_type_name);
      }
    }

    const stillValid = drawerGrades.some((grade) => grade.grade_id === gradeId);
    if (!stillValid && gradeId !== null) {
      const defaultGrade = drawerGrades[0];
      setCollectionType(defaultGrade.collection_type_name);
      setGradeId(defaultGrade.grade_id);
    }
  }, [drawerGrades, gradeId, collectionType]);

  useEffect(() => {
    if (statusId !== 3 && builtAt) {
      setBuiltAt('');
    }
  }, [builtAt, statusId]);

  useEffect(() => {
    if (statusId !== 1 && statusId !== 2 && acquiredAt) {
      setAcquiredAt('');
    }
  }, [acquiredAt, statusId]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverFile, coverPreviewUrl]);

  useEffect(() => {
    return () => {
      newPicturePreviewUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [newPicturePreviewUrls]);

  const handlePicturesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    setPictureFiles((prev) => [...prev, ...files]);
    event.target.value = '';
  };

  const handleRemoveExistingPicture = (indexToRemove: number) => {
    setExistingPictureUrls((prev) => {
      const pictureUrlToRemove = prev[indexToRemove];
      if (pictureUrlToRemove) {
        setDeletedPictureUrls((deletedPrev) =>
          deletedPrev.includes(pictureUrlToRemove)
            ? deletedPrev
            : [...deletedPrev, pictureUrlToRemove],
        );
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleRemoveNewPicture = (indexToRemove: number) => {
    setPictureFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Title is required.');
      return;
    }

    if (!coverFile && !existingCoverUrl) {
      setErrorMessage('Cover image is required.');
      return;
    }

    const normalizedStatusId = resolveStatusId(statusId);
    const isBuiltStatus = normalizedStatusId === 3;
    const isAcquiredStatus = normalizedStatusId === 1 || normalizedStatusId === 2;

    if (
      normalizedStatusId === null ||
      gradeId === null ||
      scaleId === null ||
      releaseTypeId === null ||
      manufacturerId === null ||
      seriesId === null
    ) {
      setErrorMessage('Status, type, scale, release type, manufacturer, and series are required.');
      return;
    }

    if (isBuiltStatus && !builtAt) {
      setErrorMessage('Built date is required when status is Built.');
      return;
    }

    if (isAcquiredStatus && !acquiredAt) {
      setErrorMessage('Acquired date is required when status is Backlog or Owned.');
      return;
    }

    const normalizedAddons = addons.map((addon) => ({
      ...addon,
      name: addon.name.trim(),
    }));

    const hasIncompleteAddon = normalizedAddons.some(
      (addon) =>
        (addon.name && addon.manufacturerId === null) ||
        (!addon.name && addon.manufacturerId !== null),
    );
    if (hasIncompleteAddon) {
      setErrorMessage('Each addon needs both a name and a manufacturer.');
      return;
    }

    const completeAddons = normalizedAddons.filter(
      (addon) => addon.name && addon.manufacturerId !== null,
    );

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('status', String(normalizedStatusId));
      if (isBuiltStatus) {
        formData.append('built_at', toIsoDateTime(builtAt));
      }
      if (isAcquiredStatus) {
        formData.append('acquired_at', toIsoDateTime(acquiredAt));
      }
      formData.append('description', description.trim());
      formData.append('grade_id', String(gradeId));
      formData.append('scale_id', String(scaleId));
      formData.append('release_type_id', String(releaseTypeId));
      formData.append('manufacturer_id', String(manufacturerId));
      formData.append('series_id', String(seriesId));

      if (isEditMode && id) {
        if (coverFile) {
          formData.append('cover', coverFile);
        }

        pictureFiles.forEach((file) => {
          formData.append('new_pictures', file);
        });

        deletedPictureUrls.forEach((deletedUrl) => {
          formData.append('deleted_picture_urls', deletedUrl);
        });

        const existingAddons = completeAddons.filter((addon) => addon.addonId !== null);
        const newAddons = completeAddons.filter((addon) => addon.addonId === null);
        const updatedAddons = existingAddons.filter(
          (addon) =>
            addon.name !== addon.originalName ||
            addon.manufacturerId !== addon.originalManufacturerId,
        );

        existingAddons.forEach((addon) => {
          formData.append('existing_addon_ids', String(addon.addonId));
        });

        updatedAddons.forEach((addon) => {
          formData.append('update_addon_ids', String(addon.addonId));
          formData.append('update_addon_names', addon.name);
          formData.append('update_addons_manufacturer_id', String(addon.manufacturerId));
        });

        deletedAddonIds.forEach((deletedAddonId) => {
          formData.append('deleted_addon_ids', String(deletedAddonId));
        });

        newAddons.forEach((addon) => {
          formData.append('new_addon_names', addon.name);
          formData.append('new_addons_manufacturer_id', String(addon.manufacturerId));
        });

        await collectionServices.updateCollection(Number(id), formData);
      } else {
        if (coverFile) {
          formData.append('cover', coverFile);
        }

        pictureFiles.forEach((file) => {
          formData.append('pictures', file);
        });

        completeAddons.forEach((addon) => {
          formData.append('addon_names', addon.name);
          formData.append('addons_manufacturer_id', String(addon.manufacturerId));
        });

        await collectionServices.createCollection(formData);
      }

      navigate('/');
    } catch (error) {
      if (error instanceof AxiosError) {
        const backendMessage = (error.response?.data as { message?: string } | undefined)?.message;
        setErrorMessage(backendMessage ?? error.message ?? 'Failed to save collection.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to save collection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingCollection || isLoadingDrawer;

  const handleAddAddon = () => {
    setAddons((prev) => [...prev, createAddonRow()]);
  };

  const handleRemoveAddon = (rowId: number) => {
    setAddons((prev) => {
      const addonToRemove = prev.find((addon) => addon.rowId === rowId);
      const addonIdToRemove = addonToRemove?.addonId;

      if (isEditMode && addonIdToRemove !== null && addonIdToRemove !== undefined) {
        setDeletedAddonIds((deletedPrev) =>
          deletedPrev.includes(addonIdToRemove) ? deletedPrev : [...deletedPrev, addonIdToRemove],
        );
      }

      return prev.filter((addon) => addon.rowId !== rowId);
    });
  };

  const handleAddonNameChange = (rowId: number, name: string) => {
    setAddons((prev) => prev.map((addon) => (addon.rowId === rowId ? { ...addon, name } : addon)));
  };

  const handleSelectAddonManufacturer = (manufacturer: IManufacturerDrawerItem) => {
    if (activeAddonManufacturerIndex === null) return;
    setAddons((prev) =>
      prev.map((addon, index) =>
        index === activeAddonManufacturerIndex
          ? { ...addon, manufacturerId: manufacturer.id }
          : addon,
      ),
    );
    setActiveAddonManufacturerIndex(null);
  };

  const handleSelectCollectionType = (type: string) => {
    setCollectionType(type);
    if (type === 'Figures') {
      setGradeId(5);
    } else if (type === 'Other Model Kit') {
      setGradeId(6);
    } else if (type === 'Gunpla') {
      const firstGunpla = gunplaGrades[0];
      setGradeId(firstGunpla ? firstGunpla.grade_id : null);
    }
    setIsTypeDrawerOpen(false);
  };

  return {
    activeAddonManufacturer,
    activeAddonManufacturerIndex,
    addons,
    builtAt,
    collectionType,
    collectionTypes,
    coverFile,
    coverInputRef,
    coverPreviewUrl,
    description,
    errorMessage,
    existingCoverUrl,
    existingPictureUrls,
    existingPicturePreviewUrls,
    gradeId,
    gunplaGrades,
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
    handleSelectCollectionType,
    manufacturers,
    newPicturePreviewUrls,
    pictureFiles,
    picturePreviewUrls,
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
    seriesId,
    seriesOptions,
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
    setManufacturerId,
    setReleaseTypeId,
    setSeriesId,
    setStatusId,
    setTitle,
    statusId,
    title,
    acquiredAt,
    setGradeId,
    setScaleId,
  };
};

export default useCollectionForm;
