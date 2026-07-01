import { lazy, FC } from 'react';

const PublicRouter = lazy(() => import('@/router/middleware/publicRouter'));
const ProtectedRoute = lazy(() => import('@/router/middleware/protectedRoute'));
const CollectionList = lazy(() => import('@/pages/collection_list'));
const CollectionDetail = lazy(() => import('@/pages/collection_detail'));
const CollectionForm = lazy(() => import('@/pages/collection_form'));
const CollectionShelf = lazy(() => import('@/pages/collection_shelf'));

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
        name: 'collection-list',
        path: '/',
        component: CollectionList,
        handle: {
          showHeader: true,
        },
      },
      {
        name: 'collection-shelf',
        path: '/shelves',
        component: CollectionShelf,
      },
      {
        name: 'collection-detail',
        path: '/collection/:id',
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
