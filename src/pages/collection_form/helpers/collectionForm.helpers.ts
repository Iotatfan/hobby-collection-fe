import type { ICollectionAddon } from '@/libs/collection/collection';

export type StatusOption = {
  id: 0 | 1 | 2 | 3;
  name: string;
};

export type AddonFormItem = {
  rowId: number;
  addonId: number | null;
  name: string;
  manufacturerId: number | null;
  originalName: string;
  originalManufacturerId: number | null;
};

export const STATUS_OPTIONS: StatusOption[] = [
  { id: 0, name: 'Wishlist' },
  { id: 1, name: 'Backlog' },
  { id: 2, name: 'Owned' },
  { id: 3, name: 'Built' },
];

export const resolveImageSrc = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const imageObject = value as Record<string, unknown>;
  const candidate =
    imageObject.url ??
    imageObject.secure_url ??
    imageObject.picture_url ??
    imageObject.cover_url ??
    imageObject.public_id ??
    imageObject.picture ??
    imageObject.cover;

  return typeof candidate === 'string' ? candidate : '';
};

export const resolveStatusId = (value: unknown): 0 | 1 | 2 | 3 | null => {
  if (typeof value === 'number' && [0, 1, 2, 3].includes(value)) {
    return value as 0 | 1 | 2 | 3;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if ([0, 1, 2, 3].includes(parsed)) {
      return parsed as 0 | 1 | 2 | 3;
    }
  }

  return null;
};

export const toDateInputValue = (value?: string): string => {
  if (!value) return '';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toIsoDateTime = (dateValue: string): string => {
  const parsedDate = new Date(`${dateValue}T00:00:00`);
  return parsedDate.toISOString();
};

export const normalizeAddonManufacturerId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const createAddonRowFactory =
  (nextRowId: () => number) =>
  (addon?: ICollectionAddon): AddonFormItem => {
    const addonName = (addon?.name ?? '').trim();
    const addonManufacturerId = normalizeAddonManufacturerId(addon?.manufacturer?.id);

    return {
      rowId: nextRowId(),
      addonId: addon?.id ?? null,
      name: addonName,
      manufacturerId: addonManufacturerId,
      originalName: addonName,
      originalManufacturerId: addonManufacturerId,
    };
  };
