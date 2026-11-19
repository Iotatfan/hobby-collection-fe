export type Bounds = { left: number; top: number; width: number; height: number };
export interface CoverMotion {
  key: string;
  src: string;
  from: Bounds;
  to?: Bounds;
  intrinsic: { width: number; height: number };
  photo?: boolean;
  entry?: boolean;
  handoff?: boolean;
  ready?: boolean;
  revealing?: boolean;
  blend?: { src: string; from: Bounds; to: Bounds };
}
export function findCover(root: HTMLElement, key: string): HTMLImageElement | null {
  const marker = Array.from(root.querySelectorAll<HTMLElement>('[data-shelf-morph]')).find(
    (node) => node.dataset.shelfMorph === key,
  );
  return marker instanceof HTMLImageElement ? marker : marker?.querySelector('img') || null;
}
/** Measure the painted art, including letterboxing inside the detail gallery frame. */
export function paintedCoverBounds(
  image: HTMLImageElement,
  intrinsic: { width: number; height: number },
): Bounds | null {
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height || !intrinsic.width || !intrinsic.height) return null;
  const fit = getComputedStyle(image).objectFit;
  if (fit !== 'contain' && fit !== 'scale-down')
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  const scale = Math.min(
    rect.width / intrinsic.width,
    rect.height / intrinsic.height,
    fit === 'scale-down' ? 1 : Infinity,
  );
  const width = intrinsic.width * scale;
  const height = intrinsic.height * scale;
  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height,
  };
}
export function captureCover(source: HTMLElement, from: string, to: string): CoverMotion | null {
  const detail =
    to.match(/^\/shelves\/collection\/(\d+)/) || from.match(/^\/shelves\/collection\/(\d+)/);
  if (!detail) return null;
  const key = `cover-${detail[1]}`;
  const gallery = source.querySelector<HTMLElement>(`[data-gallery-item="${detail[1]}"]`);
  const image = gallery
    ? gallery.querySelector<HTMLImageElement>('[data-gallery-current-image]')
    : findCover(source, key);
  if (!image?.naturalWidth || !image.naturalHeight) return null;
  const intrinsic = { width: image.naturalWidth, height: image.naturalHeight };
  let bounds = paintedCoverBounds(image, intrinsic);
  if (!gallery) {
    const moving = source.ownerDocument.querySelector<HTMLElement>(
      `[data-category-bridge-item="${key}"]`,
    );
    if (moving && getComputedStyle(moving).visibility === 'visible') {
      const rect = moving.getBoundingClientRect();
      bounds = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
  }
  return bounds
    ? {
        key,
        src: image.currentSrc || image.src,
        from: bounds,
        intrinsic,
        photo: gallery?.dataset.galleryKind === 'photo',
      }
    : null;
}

export function containBounds(intrinsic: { width: number; height: number }, frame: Bounds): Bounds {
  const scale = Math.min(frame.width / intrinsic.width, frame.height / intrinsic.height);
  const width = intrinsic.width * scale;
  const height = intrinsic.height * scale;
  return {
    left: frame.left + (frame.width - width) / 2,
    top: frame.top + (frame.height - height) / 2,
    width,
    height,
  };
}
export function resolveCoverTarget(
  cover: CoverMotion,
  target: HTMLImageElement,
): CoverMotion | null {
  const intrinsic = cover.photo
    ? {
        width: target.naturalWidth || Number(target.getAttribute('width')),
        height: target.naturalHeight || Number(target.getAttribute('height')),
      }
    : cover.intrinsic;
  if (!intrinsic.width || !intrinsic.height) return null;
  const bounds = paintedCoverBounds(target, intrinsic);
  if (!bounds) return null;
  if (!cover.photo) return { ...cover, to: bounds };
  return {
    ...cover,
    to: containBounds(cover.intrinsic, bounds),
    blend: {
      src: target.currentSrc || target.src,
      from: containBounds(intrinsic, cover.from),
      to: bounds,
    },
  };
}

/** Detail layout can be measured before its replacement image has mounted or decoded. */
export function resolveCoverDestination(
  cover: CoverMotion,
  destination: HTMLElement,
): CoverMotion | null {
  const gallery = destination.querySelector<HTMLElement>(
    `[data-gallery-item="${cover.key.slice(6)}"]`,
  );
  if (gallery) {
    const rect = gallery.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { ...cover, entry: true, to: containBounds(cover.intrinsic, rect) };
  }
  const target = findCover(destination, cover.key);
  return target ? resolveCoverTarget(cover, target) : null;
}
