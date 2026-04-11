import { lazy, FC } from 'react';

const PublicRouter = lazy(() => import('@/router/middleware/publicRouter'));
const ProtectedRoute = lazy(() => import('@/router/middleware/protectedRoute'));
const CollectionList = lazy(() => import('@/pages/hobby_showcase'));
const CollectionForm = lazy(() => import('@/pages/collection_form'));

export interface IRoute {
  name: string;
  path: string;
  component: FC;
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
          },
          {
            name: 'collection-edit',
            path: '/collection/:id/edit',
            component: CollectionForm,
          },
        ],
      },
    ],
  },
];
