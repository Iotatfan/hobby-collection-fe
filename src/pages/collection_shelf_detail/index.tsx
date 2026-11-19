import { typeCategory } from '@/pages/collection_shelf/helpers/categories';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { slugify } from '@/pages/collection_detail/helpers/collectionDetail.helpers';
import { useShelfLocation, useShelfSceneReady, useShelfDetailTitle } from '@/layouts/shelves/scene';
import { DetailLoading } from '@/layouts/shelves/ShelfDestinationLoading';
import { LoadingBackLink } from '@/layouts/shelves/ShelfLoadingParts';
import ShelfBreadcrumbs from '@/layouts/shelves/ShelfBreadcrumbs';
import ShelfDetailLayout from '@/layouts/shelves/ShelfDetailLayout';
import { useShelfRestoration } from '@/pages/collection_shelf/helpers/navigation';
import useShelfDetail from '@/pages/collection_shelf_detail/hooks/useShelfDetail';
import DetailInformation from '@/pages/collection_shelf_detail/parts/DetailInformation';
import { GalleryHero, GalleryThumbnails } from '@/pages/collection_shelf_detail/parts/Gallery';

export default function CollectionShelfDetail() {
  const location = useShelfLocation();
  const [, , , id, title] = location.pathname.split('/');
  const navigate = useNavigate();
  const { collection, error, retry, images, index, setIndex, direction, imageChange } =
    useShelfDetail(id);
  const pendingAtEntry = useRef(!collection);
  const active = useShelfSceneReady(true);
  useShelfRestoration(true);
  useShelfDetailTitle(collection?.title);
  useEffect(() => {
    if (!active || !collection || !title || title === slugify(collection.title)) return;
    navigate(`/shelves/collection/${collection.id}/${slugify(collection.title)}`, {
      replace: true,
      state: location.state,
    });
  }, [active, collection, title, navigate, location.state]);
  if (!collection) return <DetailLoading error={error} retry={retry} />;
  const category = typeCategory(collection.type?.name);
  const gallery = {
    title: collection.title,
    cover: collection.cover,
    images,
    index,
    setIndex,
    direction,
    imageChange,
  };
  return (
    <ShelfDetailLayout
      itemId={id || ''}
      breadcrumb={<ShelfBreadcrumbs category={category} title={collection.title} />}
      coverSelected={index === 0 && Boolean(collection.cover)}
      back={<LoadingBackLink compact />}
      hero={<GalleryHero {...gallery} />}
      thumbnails={<GalleryThumbnails {...gallery} />}
      information={<DetailInformation collection={collection} fade={pendingAtEntry.current} />}
    />
  );
}
