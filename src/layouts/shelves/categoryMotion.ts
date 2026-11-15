import { paintedCoverBounds, type Bounds } from '@/layouts/shelves/coverMotion';

export interface ShelfBridgePart {
  id: string;
  src?: string;
  from: Bounds;
  to?: Bounds;
  fromClip?: string;
  toClip?: string;
  leaving?: boolean;
  intrinsic?: { width: number; height: number };
}
export interface CategoryMotion {
  category: string;
  parts: ShelfBridgePart[];
  resolved?: boolean;
  painted?: boolean;
  revealing?: boolean;
}
const bounds = (node: HTMLElement): Bounds => {
  const { left, top, width, height } = node.getBoundingClientRect();
  return { left, top, width, height };
};
const visible = (rect: Bounds) =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.top < innerHeight &&
  rect.top + rect.height > 0 &&
  rect.left < innerWidth &&
  rect.left + rect.width > 0;

function clipArtwork(rect: Bounds, row?: HTMLElement | null) {
  const clip = row?.getBoundingClientRect();
  const left = Math.min(
    100,
    Math.max(0, ((Math.max(0, clip?.left ?? 0) - rect.left) / rect.width) * 100),
  );
  const right = Math.min(
    100,
    Math.max(
      0,
      ((rect.left + rect.width - Math.min(innerWidth, clip?.right ?? innerWidth)) / rect.width) *
        100,
    ),
  );
  return `inset(0% ${right}% 0% ${left}%)`;
}

/** Capture decoded, painted artwork, including a partially scrolled source row. */
export function captureCategory(source: HTMLElement, category: string): CategoryMotion | null {
  const shelves = Array.from(
    source.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]'),
  ).filter((node) => node.dataset.partCategory === category);
  const parts: ShelfBridgePart[] = [];
  for (const shelf of shelves) {
    for (const image of shelf.querySelectorAll<HTMLImageElement>('img[data-shelf-morph]')) {
      if (!image.complete || !image.naturalWidth || !image.naturalHeight) continue;
      const intrinsic = { width: image.naturalWidth, height: image.naturalHeight };
      const from = paintedCoverBounds(image, intrinsic);
      const row = image.closest<HTMLElement>('[data-shelf-scroll]');
      const rowBounds = row?.getBoundingClientRect();
      if (
        !from ||
        !visible(from) ||
        (rowBounds && (from.left + from.width <= rowBounds.left || from.left >= rowBounds.right))
      )
        continue;
      parts.push({
        id: image.dataset.shelfMorph!,
        src: image.currentSrc || image.src,
        from,
        intrinsic,
        fromClip: clipArtwork(from, row),
      });
    }
  }
  // One ledge bridges the selected shelf; additional category ledges belong to new rows.
  const ledge = shelves[0]?.querySelector<HTMLElement>('[data-scene-ledge]');
  if (ledge && visible(bounds(ledge))) parts.push({ id: 'ledge', from: bounds(ledge) });
  if (!parts.some((part) => part.src)) return null;
  // An interruption starts at the currently painted bridge rather than its hidden target.
  for (const moving of document.querySelectorAll<HTMLElement>(
    `[data-category-bridge="${category}"] [data-category-bridge-item]`,
  )) {
    const part = parts.find((entry) => entry.id === moving.dataset.categoryBridgeItem);
    if (part) {
      part.from = bounds(moving);
      if (part.src) part.fromClip = getComputedStyle(moving).clipPath;
    }
  }
  return { category, parts };
}

export function resolveCategory(motion: CategoryMotion, destination: HTMLElement): CategoryMotion {
  const shelves = Array.from(
    destination.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]'),
  ).filter((node) => node.dataset.partCategory === motion.category);
  const parts = motion.parts.flatMap((part) => {
    if (part.id === 'ledge') {
      const ledge = shelves[0]?.querySelector<HTMLElement>('[data-scene-ledge]');
      const to = ledge && bounds(ledge);
      return to && to.width && to.height ? [{ ...part, to }] : [];
    }
    const image = shelves
      .flatMap((shelf) =>
        Array.from(shelf.querySelectorAll<HTMLImageElement>('img[data-shelf-morph]')),
      )
      .find((node) => node.dataset.shelfMorph === part.id);
    const to = image && part.intrinsic && paintedCoverBounds(image, part.intrinsic);
    return to
      ? [
          {
            ...part,
            to,
            toClip: clipArtwork(to, image?.closest<HTMLElement>('[data-shelf-scroll]')),
          },
        ]
      : [{ ...part, to: { ...part.from, top: part.from.top + 48 }, leaving: true }];
  });
  return { ...motion, parts, resolved: true };
}
