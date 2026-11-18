import {
  loadShelfOverview,
  loadShelfCategory,
  loadShelfDetail,
} from '@/layouts/shelves/pageLoaders';
import collectionServices from '@/services/content/collectionServices';
import { isCategory } from '@/pages/collection_shelf/helpers/categories';
import { readFilters, shelfFilterQuery } from '@/pages/collection_shelf/helpers/filters';

// Prefetch uses the same service requests and response cache as mounted screens.
export function warmShelfRoute(path: string) {
  const categorySlug = path.match(/^\/shelves\/category\/([^/]+)$/)?.[1];
  const id = path.match(/^\/shelves\/collection\/(\d+)/)?.[1];
  if (isCategory(categorySlug)) {
    void loadShelfCategory().catch(() => undefined);
    const query = {
      category: categorySlug,
      limit: 12,
      offset: 0,
      ...shelfFilterQuery(readFilters(categorySlug)),
    };
    void collectionServices.getCollectionShelves(query).catch(() => undefined);
  } else if (id) {
    void loadShelfDetail().catch(() => undefined);
    // Warm route code only; detail data is requested on navigation.
  } else if (path === '/shelves') {
    void loadShelfOverview().catch(() => undefined);
    void collectionServices.getCollectionShelves().catch(() => undefined);
  }
}
