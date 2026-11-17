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
import {
  ShelfSceneContext,
  type ShelfContentRole,
  type ShelfTransition,
} from '@/layouts/shelves/scene';
import { shelfMotion } from '@/layouts/shelves/motion';
import type { SceneMeasurements } from '@/layouts/shelves/sceneMotionBatch';

const MotionBox = motion.create(Box);
const ParentMoving = createContext(false);
const resting = { opacity: 1, x: 0, y: 0 };
type Offset = { x: number; y: number };
type Plan = {
  generation: number;
  departing: boolean;
  skip: boolean;
  offset: Offset;
  role: ShelfContentRole;
  order: number;
};

function movementOffset(
  node: HTMLElement | null,
  transition: ShelfTransition,
  role: ShelfContentRole,
  departures: Map<string, Offset>,
  measurements: SceneMeasurements,
): Offset {
  const key = transition.itemId ? `item:${transition.itemId}` : `category:${transition.category}`;
  const saved =
    transition.direction === 'back' && !transition.departing ? departures.get(key) : undefined;
  if (saved) return saved;
  const anchor = measurements.anchor(node, transition);
  const bounds = node ? measurements.bounds(node) : undefined,
    origin = anchor?.bounds;
  const horizontal = role === 'information' || role === 'controls';
  let offset = { x: horizontal ? (role === 'controls' ? 16 : 32) : 0, y: horizontal ? 0 : 40 };
  if (bounds && origin && role !== 'controls') {
    const centerX = bounds.left + bounds.width / 2,
      centerY = bounds.top + bounds.height / 2;
    const row = node?.closest('[data-shelf-scroll]'),
      anchorRow = anchor?.row;
    const sameRow =
      role === 'box' &&
      (row && anchorRow ? row === anchorRow : centerY >= origin.top && centerY <= origin.bottom);
    offset = sameRow
      ? { x: centerX < origin.left + origin.width / 2 ? -32 : 32, y: 0 }
      : { x: 0, y: centerY < origin.top + origin.height / 2 ? -48 : 48 };
  }
  // Frames and bridged ledges remain at their resting geometry for bridge measurement.
  if (role === 'row' || (role === 'ledge' && transition.sharedItemIds)) offset = { x: 0, y: 0 };
  if (transition.departing) {
    departures.set(key, offset);
    if (departures.size > 32) departures.delete(departures.keys().next().value!);
  }
  return offset;
}

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
  const departures = useRef(new Map<string, Offset>());
  const plan = useRef<Plan | null>(null);
  const transition = scene?.transition;
  const trackMotion = scene?.trackMotion;
  const motionBatch = scene?.motionBatch;
  const anchored =
    (role === 'shelf' && Boolean(category) && category === transition?.category) ||
    (role === 'box' &&
      (itemId === transition?.itemId ||
        Boolean(itemId && transition?.sharedItemIds?.includes(itemId))));
  // Bridge bookkeeping may change during a navigation; it must not replace running motion.
  const input = useRef({ transition, role, order, anchored, parentMoving });
  input.current = { transition, role, order, anchored, parentMoving };
  useLayoutEffect(() => {
    const { transition: current, role, order, anchored, parentMoving } = input.current;
    if (!current || !motionBatch || current.phase === 'settled' || reduced) {
      controls.set(resting);
      return;
    }
    if (current.phase === 'preparing') {
      return motionBatch.prepare(
        () => {
          controls.stop();
          controls.set(resting);
        },
        (measurements) => {
          const skip = !current.participating || anchored || parentMoving;
          const offset = skip
            ? { x: 0, y: 0 }
            : movementOffset(element.current, current, role, departures.current, measurements);
          plan.current = {
            generation: current.generation,
            departing: current.departing,
            skip,
            offset,
            role,
            order,
          };
          return () => {
            if (!skip && !current.departing) controls.set({ opacity: 0, ...offset });
          };
        },
      );
    }
    const prepared = plan.current;
    // Content mounted by hydration did not participate in preparation and does not replay entry.
    if (!prepared || prepared.generation !== current.generation || prepared.skip) {
      controls.set(resting);
      return;
    }
    let finish = () => {};
    const scheduled = new Promise<void>((resolve) => {
      finish = resolve;
    });
    // Reserve motion before the frame so a bridge completion cannot overtake registration.
    const release = trackMotion?.(scheduled, prepared.generation);
    const cancelFrame = motionBatch.animate(() => {
      const bounds = element.current?.getBoundingClientRect();
      const offsetY = prepared.departing ? 0 : prepared.offset.y;
      // Restoration has committed. Test resting bounds, not the entrance translation.
      const offscreen =
        prepared.role !== 'shelf' &&
        bounds &&
        (bounds.bottom - offsetY < 0 || bounds.top - offsetY > window.innerHeight);
      return () => {
        if (offscreen) {
          controls.set(resting);
          finish();
          return;
        }
        void controls
          .start({
            opacity: prepared.departing ? 0 : 1,
            x: prepared.departing ? prepared.offset.x : 0,
            y: prepared.departing ? prepared.offset.y : 0,
            transition: {
              duration: shelfMotion.contentDuration,
              ease: shelfMotion.ease,
              delay: prepared.departing
                ? 0
                : Math.min(
                    prepared.order * shelfMotion.entranceStagger,
                    shelfMotion.maxEntranceDelay,
                  ),
            },
          })
          .then(finish, finish);
      };
    });
    return () => {
      cancelFrame();
      controls.stop();
      release?.();
      finish();
    };
  }, [transition?.generation, transition?.phase, reduced, controls, trackMotion, motionBatch]);
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
