import {
  loadShelfOverview,
  loadShelfCategory,
  loadShelfDetail,
} from '@/layouts/shelves/pageLoaders';
import { createElement, lazy } from 'react';

let OverviewPage = lazy(loadShelfOverview);
let CategoryPage = lazy(loadShelfCategory);
let DetailPage = lazy(loadShelfDetail);
export const ShelfOverview = () => createElement(OverviewPage);
export const ShelfCategoryPage = () => createElement(CategoryPage);
export const ShelfDetailPage = () => createElement(DetailPage);
export function resetShelfRoute(path: string) {
  if (path.startsWith('/shelves/category/')) CategoryPage = lazy(loadShelfCategory);
  else if (path.startsWith('/shelves/collection/')) DetailPage = lazy(loadShelfDetail);
  else OverviewPage = lazy(loadShelfOverview);
}
