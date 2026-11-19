import ShelfPageContainer from '@/layouts/shelves/ShelfPageContainer';
import { useLayoutEffect, useRef } from 'react';
import { Link, Text } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useShelfLocation, useShelfSceneReady } from '@/layouts/shelves/scene';

export default function UnavailableScene() {
  const active = useShelfSceneReady(true);
  const heading = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (active) {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
  }, [active]);
  const location = useShelfLocation();
  const navigate = useNavigate();
  const fallback = location.pathname === '/shelves' ? '/' : '/shelves';
  return (
    <ShelfPageContainer data-scene-error="" py={8} minH="100dvh">
      <Text ref={heading} as="h1" tabIndex={-1} fontSize="2xl">
        This view could not be opened.
      </Text>
      <Text mt={3}>Please return and try again.</Text>
      <Link focusRing="none" focusVisibleRing="outside" asChild mt={6} color="orange.200">
        <RouterLink
          to={fallback}
          onClick={(event) => {
            if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
              return;
            if (window.history.state?.idx > 0) {
              event.preventDefault();
              navigate(-1);
            }
          }}
        >
          Back to {fallback === '/' ? 'collection' : 'shelves'}
        </RouterLink>
      </Link>
    </ShelfPageContainer>
  );
}
