import { Box, Flex, IconButton, Image, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cloudinarySizes } from '@/utils/cloudinary';

function useGalleryImage(selected?: string) {
  const [decoded, setDecoded] = useState('');
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const image = new window.Image();
    const finish = () => {
      if (active) setDecoded(selected);
    };
    image.onload = () => {
      void image
        .decode()
        .catch(() => undefined)
        .then(finish);
    };
    image.onerror = () => {
      if (active) setDecoded(`failed:${selected}`);
    };
    image.src = cloudinarySizes(selected).preview;
    if (image.complete && image.naturalWidth)
      void image
        .decode()
        .catch(() => undefined)
        .then(finish);
    return () => {
      active = false;
    };
  }, [selected]);
  return { ready: decoded === selected, failed: decoded === `failed:${selected}` };
}
export function GalleryHero({
  title,
  cover,
  images,
  index,
  setIndex,
}: {
  title: string;
  cover: string;
  images: string[];
  index: number;
  setIndex: (index: number) => void;
}) {
  const selected = images[index];
  const { ready, failed } = useGalleryImage(selected);
  const name = `${title} - ${index === 0 && cover ? 'Box art' : `Photo ${index + 1}`}`;
  return (
    <>
      {selected && !failed && (
        <Image
          data-gallery-current-image=""
          src={ready ? cloudinarySizes(selected).preview : cloudinarySizes(selected).cover}
          alt={name}
          w="full"
          h="full"
          objectFit="contain"
          draggable={false}
          decoding="async"
        />
      )}
      {(!selected || failed) && (
        <Flex w="full" h="full" align="center" justify="center">
          <Text color="whiteAlpha.700">{failed ? 'Image unavailable' : 'No images available'}</Text>
        </Flex>
      )}
      {images.length > 0 && (
        <Box
          position="absolute"
          top={3}
          right={3}
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
          borderRadius="md"
          px={2.5}
          py={1}
          fontSize="sm"
          fontWeight="semibold"
          lineHeight="1"
          zIndex={5}
        >
          {index + 1} / {images.length}
        </Box>
      )}
      {images.length > 0 && (
        <Text srOnly role="status" aria-live="polite">
          {name}, image {index + 1} of {images.length}
        </Text>
      )}
      {images.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            onClick={() => setIndex((index + images.length - 1) % images.length)}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            variant="ghost"
            color="white"
            bg="blackAlpha.400"
            _hover={{ bg: 'blackAlpha.600' }}
            borderRadius="full"
            size="lg"
          >
            <ChevronLeft size={28} />
          </IconButton>
          <IconButton
            aria-label="Next image"
            onClick={() => setIndex((index + 1) % images.length)}
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            variant="ghost"
            color="white"
            bg="blackAlpha.400"
            _hover={{ bg: 'blackAlpha.600' }}
            borderRadius="full"
            size="lg"
          >
            <ChevronRight size={28} />
          </IconButton>
        </>
      )}
    </>
  );
}
export function GalleryThumbnails({
  title,
  cover,
  images,
  index,
  setIndex,
}: {
  title: string;
  cover: string;
  images: string[];
  index: number;
  setIndex: (index: number) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; pointer: number; dragged: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const root = viewport.current;
    if (!root) return;
    const measure = () => setOverflow(root.scrollWidth > root.clientWidth + 1);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [images.length]);
  useEffect(() => {
    const root = viewport.current;
    const button = root?.children[index] as HTMLElement | undefined;
    if (!root || !button) return;
    const start = button.offsetLeft;
    if (start < root.scrollLeft) root.scrollLeft = start;
    else if (start + button.offsetWidth > root.scrollLeft + root.clientWidth)
      root.scrollLeft = start + button.offsetWidth - root.clientWidth;
  }, [index]);
  return (
    <Flex
      ref={viewport}
      data-gallery-thumbnails=""
      cursor={overflow ? 'grab' : 'default'}
      css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      onPointerDown={(event) => {
        suppressClick.current = false;
        if (event.pointerType !== 'mouse' || event.button !== 0 || !overflow) return;
        drag.current = {
          x: event.clientX,
          scroll: event.currentTarget.scrollLeft,
          pointer: event.pointerId,
          dragged: false,
        };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || event.buttons !== 1) return;
        const delta = event.clientX - current.x;
        if (Math.abs(delta) > 5) current.dragged = true;
        if (!current.dragged) return;
        event.currentTarget.setPointerCapture(current.pointer);
        event.currentTarget.scrollLeft = current.scroll - delta;
        suppressClick.current = true;
      }}
      onPointerUp={(event) => {
        if (drag.current && event.currentTarget.hasPointerCapture(drag.current.pointer))
          event.currentTarget.releasePointerCapture(drag.current.pointer);
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
      position="relative"
      gap={2}
      overflowX="auto"
      px={2}
      pb={1}
      minW={0}
      w="full"
      justifyContent="safe center"
      touchAction="pan-x"
    >
      {images.map((image, imageIndex) => (
        <Box
          asChild
          key={`${image}-${imageIndex}`}
          flexShrink={0}
          w="72px"
          h="56px"
          borderRadius="lg"
          overflow="hidden"
          borderWidth="2px"
          borderColor={index === imageIndex ? 'orange.200' : 'transparent'}
          opacity={index === imageIndex ? 1 : 0.55}
          _hover={{ opacity: 1 }}
          transition="opacity 0.2s, border-color 0.2s"
          bg="#16243b"
        >
          <button
            type="button"
            aria-label={imageIndex === 0 && cover ? 'Show box art' : `Show photo ${imageIndex + 1}`}
            aria-pressed={index === imageIndex}
            onClick={() => setIndex(imageIndex)}
          >
            <Image
              src={cloudinarySizes(image).thumb}
              alt={`${title} thumbnail ${imageIndex + 1}`}
              loading="lazy"
              decoding="async"
              w="full"
              h="full"
              objectFit="cover"
              pointerEvents="none"
              draggable={false}
            />
          </button>
        </Box>
      ))}
    </Flex>
  );
}
