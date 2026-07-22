import type { ICollectionAddon } from '@/libs/collection/collection';

export const FALLBACK_DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const buildDisplayImages = (cover?: string, images?: string[]): string[] => {
  const pictures = images ?? [];
  if (!cover) return pictures;
  return [cover, ...pictures.filter((image) => image !== cover)];
};

export const buildAddonLabels = (addons?: ICollectionAddon[]): string[] => {
  const source = addons ?? [];
  return source
    .map((addon) => {
      const name = (addon?.name ?? '').trim();
      const brand = (addon.manufacturer?.name ?? '').trim();

      if (!name) return null;
      if (!brand) return name;
      return `${name} - ${brand}`;
    })
    .filter((addon): addon is string => Boolean(addon));
};

export const resolveGradeBadge = (grade?: string, scale?: string, type?: string) => {
  const normalizedGrade = grade?.trim().toLowerCase();
  const normalizedType = type?.trim().toLowerCase();
  const label = normalizedGrade === 'no grade' ? scale : grade;

  return {
    label,
    shouldShow: Boolean(label) && normalizedType !== 'figure',
  };
};

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Spaces and underscores -> hyphen
    .replace(/[^\w-]+/g, '') // Drop non-word chars (no escape needed inside [])
    .replace(/--+/g, '-') // Collapse multiple hyphens into one
    .replace(/^-+/, '') // Trim leading hyphens
    .replace(/-+$/, ''); // Trim trailing hyphens
};
