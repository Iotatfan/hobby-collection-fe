import { Box, Image } from '@chakra-ui/react';
import { motion, useAnimationControls } from 'framer-motion';
import { useLayoutEffect, useRef } from 'react';
import type { CategoryMotion, ShelfBridgePart } from '@/layouts/shelves/categoryMotion';
import { shelfMotion } from '@/layouts/shelves/motion';

const MotionBox = motion.create(Box);
export default function CategoryBridge({
  bridge,
  onComplete,
  onReady,
  onError,
}: {
  bridge: CategoryMotion;
  onComplete: () => void;
  onReady: () => void;
  onError: () => void;
}) {
  const decoded = useRef(new Set<string>());
  const completed = useRef(new Set<string>());
  return (
    <Box
      aria-hidden="true"
      inert
      pointerEvents="none"
      data-category-bridge={bridge.category}
      visibility={bridge.painted ? 'visible' : 'hidden'}
    >
      {bridge.parts.map((part) => (
        <MovingPart
          key={part.id}
          part={part}
          resolved={Boolean(bridge.resolved && bridge.painted)}
          onReady={(id) => {
            decoded.current.add(id);
            if (
              bridge.parts.filter((part) => part.src).every((part) => decoded.current.has(part.id))
            )
              onReady();
          }}
          onError={onError}
          onComplete={(id) => {
            if (bridge.revealing) return;
            completed.current.add(id);
            if (completed.current.size === bridge.parts.length) onComplete();
          }}
        />
      ))}
    </Box>
  );
}

function MovingPart({
  part,
  resolved,
  onComplete,
  onReady,
  onError,
}: {
  part: ShelfBridgePart;
  resolved: boolean;
  onComplete: (id: string) => void;
  onReady: (id: string) => void;
  onError: () => void;
}) {
  const image = useRef<HTMLImageElement>(null);
  const ready = useRef(onReady);
  ready.current = onReady;
  const fail = useRef(onError);
  fail.current = onError;
  useLayoutEffect(() => {
    const node = image.current;
    if (!node) return;
    let active = true;
    const decoded = () => {
      void node.decode().then(
        () => {
          if (active) ready.current(part.id);
        },
        () => {
          if (active) fail.current();
        },
      );
    };
    node.addEventListener('load', decoded);
    const failed = () => {
      if (active) fail.current();
    };
    node.addEventListener('error', failed);
    if (node.complete && node.naturalWidth) decoded();
    return () => {
      active = false;
      node.removeEventListener('load', decoded);
      node.removeEventListener('error', failed);
    };
  }, [part.id, part.src]);
  const controls = useAnimationControls();
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useLayoutEffect(() => {
    if (!resolved || !part.to) return;
    let active = true;
    void controls
      .start({
        x: part.to.left - part.from.left,
        y: part.to.top - part.from.top,
        scaleX: part.to.width / part.from.width,
        scaleY: part.to.height / part.from.height,
        opacity: part.leaving ? 0 : 1,
        clipPath: part.src ? part.toClip || part.fromClip || 'inset(0% 0% 0% 0%)' : undefined,
        transition: { duration: shelfMotion.coverDuration, ease: shelfMotion.ease },
      })
      .then(() => {
        if (active) complete.current(part.id);
      });
    return () => {
      active = false;
      controls.stop();
    };
  }, [part, resolved, controls]);
  return (
    <MotionBox
      data-category-bridge-item={part.id}
      position="fixed"
      zIndex={1001}
      left={`${part.from.left}px`}
      top={`${part.from.top}px`}
      w={`${part.from.width}px`}
      h={`${part.from.height}px`}
      transformOrigin="top left"
      initial={{
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        clipPath: part.src ? part.fromClip || 'inset(0% 0% 0% 0%)' : undefined,
      }}
      animate={controls}
      borderRadius={part.src ? undefined : 'sm'}
      bg={part.src ? 'gray.900' : 'linear-gradient(180deg, #c08a52 0%, #81512d 48%, #4c2c19 100%)'}
      boxShadow={
        part.src
          ? '0 16px 30px rgba(0, 0, 0, 0.5)'
          : '0 -8px 24px rgba(255, 196, 118, 0.22), 0 16px 36px rgba(0, 0, 0, 0.65)'
      }
      _before={
        part.src
          ? {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'sm',
              borderWidth: '1px',
              borderColor: 'whiteAlpha.400',
              boxShadow: 'inset 14px 0 20px rgba(255,255,255,0.16)',
              zIndex: 1,
              pointerEvents: 'none',
            }
          : undefined
      }
      _after={
        part.src
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              inset: 'auto 0 0 0',
              h: '7px',
              bg: 'linear-gradient(90deg, rgba(62,34,17,0.9), rgba(151,94,48,0.75), rgba(62,34,17,0.9))',
            }
      }
    >
      {part.src && (
        <Image
          ref={image}
          src={part.src}
          alt=""
          w="full"
          h="full"
          objectFit="contain"
          display="block"
        />
      )}
    </MotionBox>
  );
}
