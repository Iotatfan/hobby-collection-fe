import { lazy, FC } from 'react';

const PublicRouter = lazy(() => import('@/router/middleware/publicRouter'));
const ProtectedRoute = lazy(() => import('@/router/middleware/protectedRoute'));
const CollectionList = lazy(() => import('@/pages/collection_list'));
const CollectionDetail = lazy(() => import('@/pages/collection_detail'));
const CollectionForm = lazy(() => import('@/pages/collection_form'));
import ShelvesWorkspace from '@/layouts/shelves';
import {
  ShelfOverview as CollectionShelf,
  ShelfCategoryPage as CollectionShelfCategory,
  ShelfDetailPage as CollectionShelfDetail,
} from '@/layouts/shelves/routes';
const AdminLogin = lazy(() => import('@/pages/admin_login'));
const AdminCollectionList = lazy(() => import('@/pages/admin_collection_list'));
const AdminCatalog = lazy(() => import('@/pages/admin_catalog'));

export interface IRoute {
  name: string;
  path: string;
  component: FC;
  handle?: {
    showHeader?: boolean;
  };
  children?: IRoute[];
}

export const routes: IRoute[] = [
  {
    name: 'public',
    path: '/',
    component: PublicRouter,
    children: [
      {
        name: 'admin-login',
        path: '/admin/login',
        component: AdminLogin,
        handle: {
          showHeader: false,
        },
      },
      {
        name: 'collection-list',
        path: '/',
        component: CollectionList,
        handle: {
          showHeader: true,
        },
      },
      {
        name: 'shelves-workspace',
        path: '/shelves',
        component: ShelvesWorkspace,
        children: [
          { name: 'collection-shelf', path: '/shelves', component: CollectionShelf },
          {
            name: 'shelf-category',
            path: '/shelves/category/:categorySlug',
            component: CollectionShelfCategory,
          },
          {
            name: 'shelf-detail',
            path: '/shelves/collection/:id/:title?',
            component: CollectionShelfDetail,
          },
        ],
      },
      {
        name: 'collection-detail',
        path: '/collection/:id/:title?',
        component: CollectionDetail,
        handle: {
          showHeader: true,
        },
      },
      {
        name: 'collection-protected',
        path: '/',
        component: ProtectedRoute,
        children: [
          {
            name: 'admin-collection-list',
            path: '/admin/collections',
            component: AdminCollectionList,
            handle: { showHeader: true },
          },
          {
            name: 'admin-catalog',
            path: '/admin/catalog',
            component: AdminCatalog,
            handle: { showHeader: true },
          },
          {
            name: 'collection-create',
            path: '/collection/new',
            component: CollectionForm,
            handle: {
              showHeader: true,
            },
          },
          {
            name: 'collection-edit',
            path: '/collection/:id/edit',
            component: CollectionForm,
            handle: {
              showHeader: true,
            },
          },
        ],
      },
    ],
  },
];
