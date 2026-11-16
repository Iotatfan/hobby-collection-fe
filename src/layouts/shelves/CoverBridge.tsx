import { Box, Image } from '@chakra-ui/react';
import { motion, useAnimationControls } from 'framer-motion';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { CoverMotion } from '@/layouts/shelves/coverMotion';
import { shelfMotion } from '@/layouts/shelves/motion';

const MotionBox = motion.create(Box);
export default function CoverBridge({
  cover,
  overlayRef,
  onReady,
  onComplete,
  onError,
}: {
  cover: CoverMotion;
  overlayRef: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onComplete: () => void;
  onError: () => void;
}) {
  const image = useRef<HTMLImageElement>(null);
  const blend = useRef<HTMLImageElement>(null);
  const callbacks = useRef({ onReady, onComplete, onError });
  callbacks.current = { onReady, onComplete, onError };
  const controls = useAnimationControls();
  const blendControls = useAnimationControls();
  const resolved = Boolean(cover.to);
  useLayoutEffect(() => {
    if (!resolved) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) callbacks.current.onError();
    }, 500);
    void Promise.all(
      [image.current, ...(cover.blend ? [blend.current] : [])].map((node) =>
        node ? node.decode() : Promise.reject(new Error('Missing bridge image.')),
      ),
    ).then(
      () => {
        clearTimeout(timer);
        if (active) callbacks.current.onReady();
      },
      () => {
        clearTimeout(timer);
        if (active) callbacks.current.onError();
      },
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [resolved, cover.src, cover.blend]);
  useLayoutEffect(() => {
    if (!cover.ready || !cover.to) return;
    let active = true;
    const transition = { duration: shelfMotion.coverDuration, ease: shelfMotion.ease };
    const promises = [
      controls.start({
        x: cover.to.left - cover.from.left,
        y: cover.to.top - cover.from.top,
        scale: cover.to.width / cover.from.width,
        opacity: cover.blend ? 0 : 1,
        transition,
      }),
    ];
    if (cover.blend)
      promises.push(
        blendControls.start({
          x: cover.blend.to.left - cover.blend.from.left,
          y: cover.blend.to.top - cover.blend.from.top,
          scale: cover.blend.to.width / cover.blend.from.width,
          opacity: 1,
          transition,
        }),
      );
    void Promise.all(promises).then(() => {
      if (active) callbacks.current.onComplete();
    });
    return () => {
      active = false;
      controls.stop();
      blendControls.stop();
    };
  }, [cover.ready, cover.to, cover.from, cover.blend, controls, blendControls]);
  return (
    <Box
      aria-hidden="true"
      inert
      pointerEvents="none"
      visibility={cover.ready ? 'visible' : 'hidden'}
    >
      <MotionBox
        ref={overlayRef}
        data-shelf-morph-overlay=""
        position="fixed"
        zIndex={1000}
        left={`${cover.from.left}px`}
        top={`${cover.from.top}px`}
        w={`${cover.from.width}px`}
        h={`${cover.from.height}px`}
        transformOrigin="top left"
        willChange="transform"
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={controls}
      >
        <Image
          ref={image}
          src={cover.src}
          alt=""
          w="full"
          h="full"
          objectFit="contain"
          display="block"
        />
      </MotionBox>
      {cover.blend && (
        <MotionBox
          data-shelf-morph-blend=""
          position="fixed"
          zIndex={1001}
          left={`${cover.blend.from.left}px`}
          top={`${cover.blend.from.top}px`}
          w={`${cover.blend.from.width}px`}
          h={`${cover.blend.from.height}px`}
          transformOrigin="top left"
          willChange="transform, opacity"
          initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
          animate={blendControls}
        >
          <Image
            ref={blend}
            src={cover.blend.src}
            alt=""
            w="full"
            h="full"
            objectFit="contain"
            display="block"
          />
        </MotionBox>
      )}
    </Box>
  );
}
