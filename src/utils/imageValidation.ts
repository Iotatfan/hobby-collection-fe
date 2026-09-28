export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 20;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const validateImageFile = (file: File): string | null => {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return `${file.name} is not a supported image type.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }

  return null;
};
