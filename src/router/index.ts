import CollectionDetail from '@/pages/hobby_showcase/collection_detail';
import CollectionList from '@/pages/hobby_showcase/collection_list';
import { lazy, FC } from 'react';

const PublicRouter = lazy(() => import('@/router/middleware/publicRouter'));

interface IRoute {
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
                name: 'collection-detail',
                path: '/detail/:id',
                component: CollectionDetail,
            },
        ]
    }
]