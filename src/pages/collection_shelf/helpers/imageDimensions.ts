// Intrinsic dimensions reserve returning artwork without imposing an artificial ratio.
const dimensions = new Map<string, { width: number; height: number }>();
export const getShelfImageDimensions = (cover: string) => dimensions.get(cover);
export function rememberShelfImageDimensions(cover: string, image: HTMLImageElement) {
  if (image.naturalWidth && image.naturalHeight) {
    dimensions.delete(cover);
    dimensions.set(cover, { width: image.naturalWidth, height: image.naturalHeight });
    if (dimensions.size > 500) dimensions.delete(dimensions.keys().next().value!);
  }
}
