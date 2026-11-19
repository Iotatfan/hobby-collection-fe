import { Box, Flex, IconButton, Image, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { shelfMotion } from '@/layouts/shelves/motion';
import { cloudinarySizes } from '@/utils/cloudinary';

interface GalleryProps {
  title: string;
  cover: string;
  images: string[];
  index: number;
  setIndex: (index: number, direction?: number) => void;
  direction?: number;
  imageChange?: number;
}

type GalleryFrame = { key: string; source: string; name: string };
const MotionBox = motion.create(Box);

function GalleryImage({ frame, current }: { frame: GalleryFrame; current: boolean }) {
  const [status, setStatus] = useState<'pending' | 'ready' | 'failed'>('pending');
  return (
    <>
      {status !== 'failed' && (
        <Image
          data-gallery-current-image={current && status === 'ready' ? '' : undefined}
          src={cloudinarySizes(frame.source).preview}
          alt={current ? frame.name : ''}
          visibility={status === 'ready' ? 'visible' : 'hidden'}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('failed')}
          w="full"
          h="full"
          objectFit="contain"
          draggable={false}
          decoding="async"
        />
      )}
      {status === 'failed' && current && (
        <Flex position="absolute" inset={0} align="center" justify="center">
          <Text color="shelves.muted">Image unavailable</Text>
        </Flex>
      )}
    </>
  );
}

export function GalleryHero({
  title,
  cover,
  images,
  index,
  setIndex,
  direction = 1,
  imageChange = 0,
}: GalleryProps) {
  const reduced = useReducedMotion();
  const selected = images[index];
  const name = `${title} - ${index === 0 && cover ? 'Box art' : `Photo ${cover ? index : index + 1}`}`;
  const key = `${selected}:${imageChange}`;
  const [frames, setFrames] = useState<{ current: GalleryFrame; previous: GalleryFrame | null }>({
    current: { key, source: selected, name },
    previous: null,
  });
  if (frames.current.key !== key) {
    setFrames({
      previous: reduced ? null : frames.current,
      current: { key, source: selected, name },
    });
  } else if (reduced && frames.previous) {
    setFrames({ ...frames, previous: null });
  }
  const layers = [...(frames.previous ? [frames.previous] : []), frames.current];
  return (
    <>
      {selected ? (
        layers.map((frame) => {
          const current = frame.key === frames.current.key;
          return (
            <MotionBox
              key={frame.key}
              data-gallery-layer={current ? 'current' : 'outgoing'}
              aria-hidden={!current}
              position="absolute"
              inset={0}
              initial={
                frames.previous && current && !reduced ? { x: `${direction * 100}%` } : false
              }
              animate={{ x: current || reduced ? '0%' : `${-direction * 100}%` }}
              transition={{
                duration: reduced ? 0 : shelfMotion.galleryDuration,
                ease: shelfMotion.categoryEase,
              }}
              onAnimationComplete={() => {
                if (!current)
                  setFrames((previous) =>
                    previous.previous?.key === frame.key
                      ? { ...previous, previous: null }
                      : previous,
                  );
              }}
            >
              <GalleryImage frame={frame} current={current} />
            </MotionBox>
          );
        })
      ) : (
        <Flex w="full" h="full" align="center" justify="center">
          <Text color="shelves.muted">No images available</Text>
        </Flex>
      )}
      {images.length > 0 && (
        <>
          <Box
            position="absolute"
            top={3}
            right={3}
            bg="blackAlpha.800"
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
          <Text srOnly role="status" aria-live="polite">
            {name}, image {index + 1} of {images.length}
          </Text>
        </>
      )}
      {images.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            onClick={() => setIndex((index + images.length - 1) % images.length, -1)}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            variant="ghost"
            color="white"
            bg="blackAlpha.800"
            _hover={{ bg: 'black' }}
            focusVisibleRing="outside"
            borderRadius="full"
            size="lg"
          >
            <ChevronLeft size={28} />
          </IconButton>
          <IconButton
            aria-label="Next image"
            onClick={() => setIndex((index + 1) % images.length, 1)}
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            variant="ghost"
            color="white"
            bg="blackAlpha.800"
            _hover={{ bg: 'black' }}
            focusVisibleRing="outside"
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
  }, [index, overflow]);
  return (
    <Flex
      ref={viewport}
      data-gallery-thumbnails=""
      cursor={overflow ? 'grab' : 'default'}
      className="custom-scrollbar"
      role="group"
      aria-label="Image thumbnails"
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
          w={{ base: '80px', md: '96px' }}
          h={{ base: '68px', md: '80px' }}
          borderRadius="lg"
          overflow="hidden"
          borderWidth="2px"
          borderColor={index === imageIndex ? 'shelves.action' : 'transparent'}
          opacity={1}
          position="relative"
          focusVisibleRing="inside"
          focusRingColor="shelves.link"
          _hover={{ opacity: 1 }}
          transition="opacity 0.2s, border-color 0.2s"
          bg="#16243b"
        >
          <button
            type="button"
            aria-label={
              imageIndex === 0 && cover
                ? 'Show box art'
                : `Show photo ${cover ? imageIndex : imageIndex + 1}`
            }
            aria-pressed={index === imageIndex}
            onClick={() => setIndex(imageIndex)}
          >
            {imageIndex === 0 && cover && (
              <Text
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="blackAlpha.800"
                color="white"
                fontSize="sm"
                zIndex={1}
              >
                Box art
              </Text>
            )}
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
