import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { slugify } from '@/pages/collection_detail/helpers/collectionDetail.helpers';
import { useShelfLocation, useShelfSceneReady } from '@/layouts/shelves/scene';
import { DetailLoading } from '@/layouts/shelves/ShelfDestinationLoading';
import { LoadingBackLink } from '@/layouts/shelves/ShelfLoadingParts';
import ShelfDetailLayout from '@/layouts/shelves/ShelfDetailLayout';
import { useShelfRestoration } from '@/pages/collection_shelf/helpers/navigation';
import useShelfDetail from '@/pages/collection_shelf_detail/hooks/useShelfDetail';
import DetailInformation from '@/pages/collection_shelf_detail/parts/DetailInformation';
import { GalleryHero, GalleryThumbnails } from '@/pages/collection_shelf_detail/parts/Gallery';

export default function CollectionShelfDetail() {
  const { id, title } = useParams();
  const location = useShelfLocation();
  const navigate = useNavigate();
  const { collection, error, retry, images, index, setIndex } = useShelfDetail(id);
  const pendingAtEntry = useRef(!collection);
  const active = useShelfSceneReady(true);
  useShelfRestoration(true);
  useEffect(() => {
    if (!active || !collection || !title || title === slugify(collection.title)) return;
    navigate(`/shelves/collection/${collection.id}/${slugify(collection.title)}`, {
      replace: true,
      state: location.state,
    });
  }, [active, collection, title, navigate, location.state]);
  if (!collection) return <DetailLoading error={error} retry={retry} />;
  const gallery = { title: collection.title, cover: collection.cover, images, index, setIndex };
  return (
    <>
      {active && (
        <Helmet>
          <title>{collection.title} | Hobby Collection</title>
        </Helmet>
      )}
      <ShelfDetailLayout
        itemId={id || ''}
        coverSelected={index === 0 && Boolean(collection.cover)}
        back={<LoadingBackLink compact />}
        hero={<GalleryHero {...gallery} />}
        thumbnails={<GalleryThumbnails {...gallery} />}
        information={<DetailInformation collection={collection} fade={pendingAtEntry.current} />}
      />
    </>
  );
}
