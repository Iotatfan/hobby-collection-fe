import { Box } from '@chakra-ui/react';
import { animate, useReducedMotion } from 'framer-motion';
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

const ParentMoving = createContext(false);
function reset(node: HTMLElement) {
  node.style.opacity = '1';
  node.style.transform = 'none';
}
const translation = ({ x, y }: Offset) => `translate(${x}px, ${y}px)`;
type Offset = { x: number; y: number };
type Plan = {
  generation: number;
  departing: boolean;
  skip: boolean;
  offset: Offset;
  role: ShelfContentRole;
  order: number;
  categoryFade: boolean;
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
  if (['summary', 'information', 'controls'].includes(role)) {
    if (bounds && origin && (bounds.bottom <= origin.top || bounds.top >= origin.bottom)) {
      offset = { x: 0, y: bounds.top < origin.top ? -24 : 24 };
    } else {
      offset = horizontal ? { x: offset.x < 0 ? -16 : 16, y: 0 } : { x: 0, y: -24 };
    }
  }
  if (role === 'caption') offset = { x: 0, y: 12 };
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
}: Omit<ComponentProps<typeof Box>, 'role' | 'children' | 'order'> & {
  role: ShelfContentRole;
  category?: string;
  itemId?: string;
  order?: number;
  children?: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const parentMoving = useContext(ParentMoving);
  const scene = useContext(ShelfSceneContext);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const reduced = useReducedMotion();
  const departures = useRef(new Map<string, Offset>());
  const plan = useRef<Plan | null>(null);
  const transition = scene?.transition;
  const locationKey = scene?.location.key;
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
    const node = element.current;
    if (!node) return;
    if (!current || !motionBatch || current.phase === 'settled' || reduced) {
      reset(node);
      return;
    }
    if (current.phase === 'preparing') {
      return motionBatch.prepare(
        () => {
          animation.current?.stop();
          reset(node);
        },
        (measurements) => {
          const categoryFade = Boolean(
            current.categoryNavigation &&
            ['caption', 'information', 'controls', 'ledge'].includes(role),
          );
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
            categoryFade,
          };
          return () => {
            if (!skip && !current.departing) {
              node.style.opacity = '0';
              node.style.transform = translation(offset);
            }
          };
        },
      );
    }
    const prepared = plan.current;
    // Content mounted by hydration did not participate in preparation and does not replay entry.
    if (!prepared || prepared.generation !== current.generation || prepared.skip) {
      reset(node);
      return;
    }
    let finish = () => {};
    const scheduled = new Promise<void>((resolve) => {
      finish = resolve;
    });
    // Reserve motion before the frame so a bridge completion cannot overtake registration.
    const release = motionBatch.track(
      `${prepared.generation}:${locationKey}:${prepared.role}`,
      scheduled,
      (promise) => trackMotion?.(promise, prepared.generation) || (() => {}),
    );
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
          reset(node);
          finish();
          return;
        }
        const target = prepared.departing ? prepared.offset : { x: 0, y: 0 };
        const controls = animate(
          node,
          {
            opacity: prepared.departing ? 0 : 1,
            transform: translation(target),
          },
          {
            duration: prepared.categoryFade
              ? prepared.departing
                ? shelfMotion.categoryFadeOut
                : shelfMotion.categoryFadeIn
              : shelfMotion.contentDuration,
            ease: shelfMotion.categoryEase,
            delay: prepared.departing
              ? 0
              : Math.min(
                  prepared.order * shelfMotion.entranceStagger,
                  shelfMotion.maxEntranceDelay,
                ),
          },
        );
        animation.current = controls;
        void controls.then(finish, finish);
      };
    });
    return () => {
      cancelFrame();
      animation.current?.stop();
      release?.();
      finish();
    };
  }, [transition?.generation, transition?.phase, reduced, trackMotion, motionBatch, locationKey]);
  return (
    <Box
      {...props}
      ref={element}
      data-scene-part={role}
      data-part-item={itemId}
      data-part-category={category}
    >
      <ParentMoving.Provider value={parentMoving || (['shelf', 'box'].includes(role) && !anchored)}>
        {children}
      </ParentMoving.Provider>
    </Box>
  );
}
