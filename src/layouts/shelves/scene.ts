import type { IShelfItem } from '@/libs/collection/collection';
import { createContext, useContext, useLayoutEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  type Location,
  type NavigationType,
} from 'react-router-dom';

export type ShelfContentRole =
  | 'summary'
  | 'shelf'
  | 'row'
  | 'box'
  | 'ledge'
  | 'information'
  | 'controls';
export interface ShelfTransition {
  generation: number;
  phase: 'preparing' | 'animating' | 'settled';
  direction: 'forward' | 'back';
  category?: string;
  itemId?: string;
  departing: boolean;
  participating: boolean;
  shared?: boolean;
  sharedItemIds?: string[];
}
export interface CategorySceneData {
  name?: string;
  items: IShelfItem[];
  count: number;
  complete: boolean;
  loading: boolean;
  error: string;
  ready: boolean;
  load: () => Promise<void>;
}
export interface ShelfScene {
  location: Location;
  navigationType: NavigationType;
  active: boolean;
  transition: ShelfTransition;
  trackMotion: (promise: Promise<unknown>, generation: number) => () => void;
  current: boolean;
  categoryData?: (key: string, data: CategorySceneData) => void;
  detailTitle?: (key: string, generation: number, title: string) => void;
  ready: (key: string, generation: number) => void;
  claimPosition: (key: string) => boolean;
}
export const ShelfSceneContext = createContext<ShelfScene | null>(null);
export function useShelfLocation() {
  const fallback = useLocation();
  return useContext(ShelfSceneContext)?.location || fallback;
}
export function useShelfNavigationType() {
  const fallback = useNavigationType();
  return useContext(ShelfSceneContext)?.navigationType || fallback;
}
export function useShelfSceneReady(ready: boolean) {
  const scene = useContext(ShelfSceneContext);
  const report = scene?.ready;
  const key = scene?.location.key;
  const current = scene?.current;
  const generation = scene?.transition.generation;
  useLayoutEffect(() => {
    if (ready && report && key && current && generation !== undefined) report(key, generation);
  }, [ready, report, key, current, generation]);
  return scene?.active ?? true;
}
export function useShelfSceneActive() {
  return useContext(ShelfSceneContext)?.active ?? true;
}

export function useShelfSceneCurrent() {
  return useContext(ShelfSceneContext)?.current ?? true;
}

/** Only the current route may update the workspace-owned document title. */
export function useShelfDetailTitle(title?: string) {
  const scene = useContext(ShelfSceneContext);
  const report = scene?.detailTitle;
  const key = scene?.location.key;
  const generation = scene?.transition.generation;
  const current = scene?.current;
  useLayoutEffect(() => {
    if (current && key && generation !== undefined && title) report?.(key, generation, title);
  }, [report, key, generation, current, title]);
}
