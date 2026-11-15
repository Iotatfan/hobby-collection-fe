import { Box } from '@chakra-ui/react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type ComponentProps,
} from 'react';
import { ShelfSceneContext, type ShelfContentRole } from '@/layouts/shelves/scene';
import { shelfMotion } from '@/layouts/shelves/motion';

const MotionBox = motion.create(Box);
const ParentMoving = createContext(false);
export default function ScenePart({
  role,
  category,
  itemId,
  order = 0,
  children,
  ...props
}: Omit<ComponentProps<typeof MotionBox>, 'role' | 'children' | 'order'> & {
  role: ShelfContentRole;
  category?: string;
  itemId?: string;
  order?: number;
  children?: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const parentMoving = useContext(ParentMoving);
  const scene = useContext(ShelfSceneContext);
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  const preparedGeneration = useRef<number | null>(null);
  const departures = useRef(new Map<string, { x: number; y: number }>());
  const transition = scene?.transition;
  const trackMotion = scene?.trackMotion;
  const categoryShared = Boolean(transition?.sharedItemIds);
  const anchored =
    (role === 'shelf' && Boolean(category) && category === transition?.category) ||
    (role === 'box' &&
      (itemId === transition?.itemId ||
        Boolean(itemId && transition?.sharedItemIds?.includes(itemId))));
  useLayoutEffect(() => {
    const lateArrival =
      transition?.shared &&
      !transition.departing &&
      transition.phase === 'animating' &&
      preparedGeneration.current !== transition.generation;
    if (transition?.phase === 'preparing' && transition.participating) {
      controls.stop();
      preparedGeneration.current = transition.generation;
    }
    if (lateArrival) {
      controls.set({ opacity: 1, x: 0, y: 0 });
      return;
    }
    if (!transition?.participating || reduced || anchored || parentMoving) {
      controls.set({ opacity: 1, x: 0, y: 0 });
      return;
    }
    const node = element.current;
    const root = node?.closest<HTMLElement>('[data-shelf-scene]');
    const anchor = transition.itemId
      ? Array.from(root?.querySelectorAll<HTMLElement>('[data-part-item]') || []).find(
          (part) => part.dataset.partItem === transition.itemId,
        )
      : Array.from(root?.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]') || []).find(
          (part) => part.dataset.partCategory === transition.category,
        );
    const key = transition.itemId ? `item:${transition.itemId}` : `category:${transition.category}`;
    const returning = transition.direction === 'back' && !transition.departing;
    let offset =
      returning || (transition.departing && transition.phase === 'animating')
        ? departures.current.get(key)
        : undefined;
    if (!offset) {
      const bounds = node?.getBoundingClientRect();
      const origin = anchor?.getBoundingClientRect();
      const horizontal = role === 'information' || role === 'controls';
      offset = { x: horizontal ? (role === 'controls' ? 16 : 32) : 0, y: horizontal ? 0 : 40 };
      if (bounds && origin && role !== 'controls') {
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const originX = origin.left + origin.width / 2;
        const originY = origin.top + origin.height / 2;
        const row = node?.closest('[data-shelf-scroll]');
        const anchorRow = anchor?.closest('[data-shelf-scroll]');
        const sameRow =
          role === 'box' &&
          (row && anchorRow
            ? row === anchorRow
            : centerY >= origin.top && centerY <= origin.bottom);
        offset = sameRow
          ? { x: centerX < originX ? -32 : 32, y: 0 }
          : { x: 0, y: centerY < originY ? -48 : 48 };
      }
      // Shared geometry is measured at rest; frames and bridged ledges only fade.
      if (role === 'row' || (role === 'ledge' && categoryShared)) offset = { x: 0, y: 0 };
      // Retained scene parts reuse these exact paths after scroll restoration.
      if (transition.departing && transition.phase === 'preparing') {
        departures.current.set(key, offset);
        if (departures.current.size > 32)
          departures.current.delete(departures.current.keys().next().value!);
      }
    }
    if (transition.phase === 'preparing') {
      controls.set(
        transition.departing
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y },
      );
    } else if (transition.phase === 'animating') {
      const bounds = element.current?.getBoundingClientRect();
      // A restored viewport can reveal shelf groups after this child effect runs.
      // There are only a few overview groups; always complete their coordinated spread.
      if (role !== 'shelf' && bounds && (bounds.bottom < 0 || bounds.top > window.innerHeight)) {
        controls.set({ opacity: 1, x: 0, y: 0 });
        return;
      }
      const hidden = transition.departing;
      const promise = controls.start({
        opacity: hidden ? 0 : 1,
        x: hidden ? offset.x : 0,
        y: hidden ? offset.y : 0,
        transition: {
          duration: 0.28,
          ease: shelfMotion.ease,
          delay: hidden ? 0 : Math.min(order * 0.025, 0.1),
        },
      });
      const release = trackMotion?.(promise, transition.generation);
      return () => {
        controls.stop();
        release?.();
      };
    } else controls.set({ opacity: 1, x: 0, y: 0 });
    return () => controls.stop();
  }, [
    categoryShared,
    transition?.generation,
    scene?.location.key,
    transition?.shared,
    transition?.phase,
    transition?.departing,
    transition?.participating,
    transition?.direction,
    transition?.category,
    transition?.itemId,
    reduced,
    anchored,
    controls,
    role,
    order,
    parentMoving,
    trackMotion,
  ]);
  return (
    <MotionBox
      {...props}
      ref={element}
      data-scene-part={role}
      data-part-item={itemId}
      data-part-category={category}
      initial={false}
      animate={controls}
    >
      <ParentMoving.Provider value={parentMoving || (role === 'shelf' && !anchored)}>
        {children}
      </ParentMoving.Provider>
    </MotionBox>
  );
}
