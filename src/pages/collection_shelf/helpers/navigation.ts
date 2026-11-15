import type { IShelf, IShelfItem, ShelfCategory } from '@/libs/collection/collection';
import { useContext, useLayoutEffect, useRef } from 'react';
import {
  useShelfLocation as useLocation,
  useShelfNavigationType as useNavigationType,
  useShelfSceneActive,
  ShelfSceneContext,
} from '@/layouts/shelves/scene';

let pendingFocus: { key: string; target: string } | null = null;

export function useLoadingFocusHandoff() {
  const location = useLocation();
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(
    () => () => {
      const element = document.activeElement as HTMLElement | null;
      if (
        !element ||
        !root.current?.contains(element) ||
        !root.current.closest('[data-scene-active="true"]')
      )
        return;
      const target =
        element.dataset.shelfAnchor ||
        (element.tagName === 'H1'
          ? 'heading'
          : element.hasAttribute('data-shelf-back')
            ? 'back'
            : null);
      if (target) pendingFocus = { key: location.key, target };
    },
    [location.key],
  );
  return root;
}

const TTL = 5 * 60 * 1000;
export function readSession<T>(key: string): T | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(`shelves:${key}`) || 'null');
    return value && Date.now() - value.time < TTL ? (value.data as T) : null;
  } catch {
    return null;
  }
}
export function writeSession(key: string, data: unknown) {
  try {
    sessionStorage.setItem(`shelves:${key}`, JSON.stringify({ time: Date.now(), data }));
  } catch {
    /* Optional cache. */
  }
}
export interface ShelfOrigin {
  path: string;
  key: string;
  label: string;
}
export interface ShelfNavigation {
  origin?: ShelfOrigin;
  preview?: { category?: ShelfCategory; shelf?: IShelf; item?: IShelfItem };
}
export const validOrigin = (origin?: ShelfOrigin): origin is ShelfOrigin =>
  Boolean(
    origin &&
    (origin.path === '/shelves' ||
      /^\/shelves\/category\/(gunpla|figure|other-model-kit)$/.test(origin.path)) &&
    typeof origin.key === 'string',
  );
/** Scroll restoration targets resting layout, not a temporary entrance translation. */
export function restingAnchorTop(anchor: HTMLElement): number {
  let top = anchor.getBoundingClientRect().top;
  for (
    let node: HTMLElement | null = anchor;
    node && !node.hasAttribute('data-shelf-scene');
    node = node.parentElement
  ) {
    if (node.hasAttribute('data-scene-part')) {
      const transform = getComputedStyle(node).transform;
      if (transform !== 'none') top -= new DOMMatrixReadOnly(transform).m42;
    }
  }
  return top;
}
export function captureSource(
  location: { pathname: string; key: string },
  target: HTMLElement,
  label: string,
): ShelfNavigation {
  const anchor = target.closest<HTMLElement>('[data-shelf-anchor]') || target;
  const horizontal =
    anchor.closest<HTMLElement>('[data-shelf-scroll]') ||
    anchor.closest('section')?.querySelector<HTMLElement>('[data-shelf-scroll]');
  writeSession(`entry:${location.key}`, {
    path: location.pathname,
    anchor: anchor.dataset.shelfAnchor,
    y: window.scrollY,
    offset: restingAnchorTop(anchor),
    historyIndex: window.history.state?.idx,
    horizontal: horizontal?.scrollLeft,
  });
  return {
    origin: { path: location.pathname, key: location.key, label },
  };
}
export function canReturn(origin?: ShelfOrigin): boolean {
  if (!validOrigin(origin)) return false;
  const saved = readSession<{ path: string; historyIndex: number }>(`entry:${origin.key}`);
  return saved?.path === origin.path && saved.historyIndex === window.history.state?.idx - 1;
}
export function useShelfRestoration(ready: boolean) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const active = useShelfSceneActive();
  const claimPosition = useContext(ShelfSceneContext)?.claimPosition;
  useLayoutEffect(() => {
    if (!active || !pendingFocus) return;
    const pending = pendingFocus;
    pendingFocus = null;
    if (
      pending.key !== location.key ||
      (document.activeElement !== document.body && document.activeElement?.isConnected)
    )
      return;
    const root = document.querySelector<HTMLElement>('[data-scene-active="true"]');
    const target =
      pending.target === 'heading'
        ? root?.querySelector<HTMLElement>('h1')
        : pending.target === 'back'
          ? root?.querySelector<HTMLElement>('[data-shelf-back]')
          : Array.from(root?.querySelectorAll<HTMLElement>('[data-shelf-anchor]') || []).find(
              (node) => node.dataset.shelfAnchor === pending.target,
            );
    (target || root?.querySelector<HTMLElement>('h1'))?.focus({ preventScroll: true });
  });
  useLayoutEffect(() => {
    if (!ready || !active || (claimPosition && !claimPosition(location.key))) return;
    {
      const root = document.querySelector<HTMLElement>('[data-scene-active="true"]') || document;
      const saved =
        navigationType === 'POP'
          ? readSession<{
              path: string;
              anchor?: string;
              y: number;
              offset: number;
              horizontal?: number;
            }>(`entry:${location.key}`)
          : null;
      const anchor =
        saved?.path === location.pathname && saved.anchor
          ? Array.from(root.querySelectorAll<HTMLElement>('[data-shelf-anchor]')).find(
              (el) => el.dataset.shelfAnchor === saved.anchor,
            )
          : null;
      if (anchor && saved) {
        const horizontal =
          anchor.closest<HTMLElement>('[data-shelf-scroll]') ||
          anchor.closest('section')?.querySelector<HTMLElement>('[data-shelf-scroll]');
        if (horizontal) horizontal.scrollLeft = saved.horizontal || 0;
        const align = () =>
          window.scrollTo(0, window.scrollY + restingAnchorTop(anchor) - saved.offset);
        align();
        anchor.focus({ preventScroll: true });
        // Intrinsic images and responsive regrouping can finish after the first commit.
        // Stabilize only this return anchor; any visitor input ends the adjustment.
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(align);
        if (root instanceof HTMLElement) observer?.observe(root);
        const stop = () => {
          observer?.disconnect();
          root.removeEventListener('load', align, true);
          window.removeEventListener('wheel', stop);
          window.removeEventListener('touchstart', stop);
          window.removeEventListener('pointerdown', stop);
          window.removeEventListener('keydown', stop);
          clearTimeout(timer);
        };
        const timer = setTimeout(stop, 500);
        root.addEventListener('load', align, true);
        window.addEventListener('wheel', stop, { passive: true });
        window.addEventListener('touchstart', stop, { passive: true });
        window.addEventListener('pointerdown', stop, { passive: true });
        window.addEventListener('keydown', stop);
        return stop;
      } else {
        window.scrollTo(0, saved?.path === location.pathname ? saved.y : 0);
        root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      }
    }
  }, [ready, active, location.key, location.pathname, navigationType, claimPosition]);
}
