import { Box, Image } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Suspense, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  useLocation,
  useNavigationType,
  useOutlet,
  type Location,
  type NavigationType,
} from 'react-router-dom';
import ShelfDestinationLoading from '@/layouts/shelves/ShelfDestinationLoading';
import ShelfSceneBoundary from '@/layouts/shelves/ShelfSceneBoundary';
import CategoryScene from '@/layouts/shelves/CategoryScene';
import { ShelfSceneContext, type CategorySceneData } from '@/layouts/shelves/scene';
import { shelfBackground } from '@/pages/collection_shelf/helpers/categories';
import {
  captureCover,
  findCover,
  resolveCoverTarget,
  type CoverMotion,
} from '@/layouts/shelves/coverMotion';
import {
  readSession,
  writeSession,
  restingAnchorTop,
} from '@/pages/collection_shelf/helpers/navigation';
import { shelfMotion } from '@/layouts/shelves/motion';
import CategoryBridge from '@/layouts/shelves/CategoryBridge';
import {
  captureCategory,
  resolveCategory,
  type CategoryMotion,
} from '@/layouts/shelves/categoryMotion';

type Scene = {
  historyIndex: number;
  id: string;
  location: Location;
  navigationType: NavigationType;
  element: ReactNode;
  categoryData?: CategorySceneData;
};
const sceneId = (location: Location) => location.pathname;
const browsing = (scene: Scene) => !scene.location.pathname.startsWith('/shelves/collection/');
function retainScenes(scenes: Scene[], current: Scene, source?: Scene | null) {
  const overview = scenes.find((scene) => scene.location.pathname === '/shelves');
  const category = [...scenes]
    .reverse()
    .find((scene) => scene.location.pathname.startsWith('/shelves/category/'));
  const candidates = [
    current,
    ...(source && source.id !== current.id ? [source] : []),
    ...(overview ? [overview] : []),
    ...(category ? [category] : []),
  ];
  const unique = candidates
    .filter((scene, index) => candidates.findIndex((other) => other.id === scene.id) === index)
    .slice(0, 3);
  return [...unique.filter((scene) => scene.id !== current.id), current];
}
type Phase = 'preparing' | 'animating' | 'settled';
const MotionBox = motion.create(Box);

export default function ShelvesWorkspace() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const element = useOutlet();
  const reduced = useReducedMotion();
  const [scenes, setScenes] = useState<Scene[]>(() => [
    {
      historyIndex: window.history.state?.idx ?? 0,
      id: sceneId(location),
      location,
      navigationType,
      element,
    },
  ]);
  const [phase, setPhase] = useState<Phase>('preparing');
  const [readyEntry, setReadyEntry] = useState<{ key: string; generation: number } | null>(null);
  const [cover, setCover] = useState<CoverMotion | null>(null);
  const [categoryBridge, setCategoryBridge] = useState<CategoryMotion | null>(null);
  const bridgePending = useRef(false);
  const coverNode = useRef<HTMLDivElement>(null);
  const interruptedCover = useRef<CoverMotion | null>(null);
  const navigationSerial = useRef(0);
  const roots = useRef(new Map<string, HTMLDivElement>());
  const sourceScroll = useRef(0);
  const selectedCategory = useRef<string | undefined>(undefined);
  const positioned = useRef('');
  const settled = useRef<Scene | null>(null);
  const departingId = useRef<string | null>(null);
  const pendingMotion = useRef(new Set<Promise<unknown>>());
  const finishRequest = useRef<{ key: string; serial: number } | null>(null);
  const attemptFinish = useRef<() => void>(() => {});
  const sceneComplete = useRef('');
  const latest = scenes[scenes.length - 1];
  const latestScene = useRef(latest);
  latestScene.current = latest;
  const routeKey = useRef(location.key);
  routeKey.current = location.key;
  const outgoing = scenes.find(
    (scene) => scene.id === departingId.current && scene.id !== latest.id,
  );
  const claimPosition = useCallback((key: string) => {
    if (positioned.current === key) return false;
    positioned.current = key;
    return true;
  }, []);
  const reportCategory = useCallback((key: string, data: CategorySceneData) => {
    setScenes((previous) =>
      previous.map((scene) =>
        scene.location.key === key ? { ...scene, categoryData: data } : scene,
      ),
    );
  }, []);
  const reportReady = useCallback((key: string, generation: number) => {
    if (generation !== navigationSerial.current || key !== routeKey.current) return;
    setReadyEntry((previous) =>
      previous?.key === key && previous.generation === generation ? previous : { key, generation },
    );
  }, []);
  const settle = useCallback((key: string, serial: number) => {
    if (
      serial !== navigationSerial.current ||
      routeKey.current !== key ||
      latestScene.current.location.key !== key
    )
      return;
    if (pendingMotion.current.size || bridgePending.current) {
      finishRequest.current = { key, serial };
      return;
    }
    const current = latestScene.current;
    settled.current = current;
    setScenes((previous) =>
      retainScenes(
        previous.filter(
          (scene) =>
            scene.id === current.id ||
            (browsing(scene) &&
              !roots.current.get(scene.location.key)?.querySelector('[data-scene-error]')),
        ),
        current,
      ),
    );
    departingId.current = null;
    setCover(null);
    setCategoryBridge(null);
    setPhase('settled');
  }, []);

  attemptFinish.current = () => {
    const request = finishRequest.current;
    if (request) {
      finishRequest.current = null;
      settle(request.key, request.serial);
    }
  };
  const trackMotion = useCallback((promise: Promise<unknown>, serial: number) => {
    if (serial !== navigationSerial.current) return () => {};
    pendingMotion.current.add(promise);
    const done = () => {
      if (serial !== navigationSerial.current) return;
      pendingMotion.current.delete(promise);
      if (!pendingMotion.current.size) attemptFinish.current();
    };
    void promise.then(done, done);
    return done;
  }, []);

  // An interrupted navigation continues from the scene currently visible to the visitor.
  if (latest.location.key !== location.key) {
    const source = phase === 'preparing' ? outgoing || settled.current : latest;
    const item = (location.pathname.match(/collection\/(\d+)/) ||
      source?.location.pathname.match(/collection\/(\d+)/))?.[1];
    const root = source && roots.current.get(source.location.key);
    const destinationRoot = scenes.find((scene) => scene.id === sceneId(location));
    const targetRoot = destinationRoot && roots.current.get(destinationRoot.location.key);
    const itemCategory = (container: HTMLElement | undefined) =>
      item && container
        ? Array.from(container.querySelectorAll<HTMLElement>('[data-part-item]'))
            .find((node) => node.dataset.partItem === item)
            ?.closest<HTMLElement>('[data-part-category]')?.dataset.partCategory
        : undefined;
    selectedCategory.current =
      (location.pathname.match(/category\/([^/]+)/) ||
        source?.location.pathname.match(/category\/([^/]+)/))?.[1] ||
      itemCategory(root || undefined) ||
      itemCategory(targetRoot || undefined);
    const categoryHandoff =
      source &&
      ((source.location.pathname === '/shelves' &&
        location.pathname.startsWith('/shelves/category/')) ||
        (location.pathname === '/shelves' &&
          source.location.pathname.startsWith('/shelves/category/')));
    const capturedCategory =
      categoryHandoff && root && selectedCategory.current && !reduced
        ? captureCategory(root, selectedCategory.current)
        : null;
    bridgePending.current = Boolean(capturedCategory);
    setCategoryBridge(capturedCategory);
    navigationSerial.current++;
    const moving = coverNode.current?.getBoundingClientRect();
    interruptedCover.current =
      cover && moving
        ? {
            ...cover,
            from: {
              left: moving.left,
              top: moving.top,
              width: moving.width,
              height: moving.height,
            },
            to: undefined,
            blend: undefined,
          }
        : null;
    if (source && root && browsing(source)) {
      const saved = readSession<{ anchor?: string; horizontal?: number }>(
        `entry:${source.location.key}`,
      );
      const focused = document.activeElement as HTMLElement | null;
      const anchorName =
        (focused && root.contains(focused) ? focused.dataset.shelfAnchor : undefined) ||
        saved?.anchor;
      const anchor = Array.from(root.querySelectorAll<HTMLElement>('[data-shelf-anchor]')).find(
        (node) => node.dataset.shelfAnchor === anchorName,
      );
      writeSession(`entry:${source.location.key}`, {
        path: source.location.pathname,
        anchor: anchorName,
        y: window.scrollY,
        offset: anchor ? restingAnchorTop(anchor) : 0,
        horizontal:
          (
            anchor?.closest<HTMLElement>('[data-shelf-scroll]') ||
            anchor?.closest('section')?.querySelector<HTMLElement>('[data-shelf-scroll]')
          )?.scrollLeft ?? saved?.horizontal,
        historyIndex: source.historyIndex,
      });
    }
    sourceScroll.current = window.scrollY;
    const id = sceneId(location);
    const retained = scenes.find((scene) => scene.id === id);
    const next = {
      historyIndex: window.history.state?.idx ?? 0,
      id,
      location,
      navigationType,
      element: retained?.element || element,
      categoryData: retained?.categoryData,
    };
    departingId.current = source?.id || null;
    pendingMotion.current.clear();
    finishRequest.current = null;
    setScenes(retainScenes(scenes, next, source));
    setPhase('preparing');
    setReadyEntry(null);
    setCover(null);
    sceneComplete.current = '';
    positioned.current = '';
  }
  const sharedTransition = Boolean(!reduced && outgoing && (categoryBridge || cover));
  const serial = navigationSerial.current;
  useLayoutEffect(() => {
    if (
      phase !== 'preparing' ||
      readyEntry?.key !== latest.location.key ||
      readyEntry.generation !== serial
    )
      return;
    const source = outgoing && roots.current.get(outgoing.location.key);
    if (source && !reduced) {
      const captured = captureCover(source, outgoing!.location.pathname, latest.location.pathname);
      setCover(
        captured &&
          captured.key === interruptedCover.current?.key &&
          captured.photo === interruptedCover.current.photo &&
          (!captured.photo || captured.src === interruptedCover.current.src)
          ? interruptedCover.current
          : captured,
      );
    }
    interruptedCover.current = null;
    setPhase('animating');
  }, [phase, readyEntry, serial, latest.location.key, latest.location.pathname, outgoing, reduced]);

  useLayoutEffect(() => {
    if (phase !== 'animating') return;
    const key = latest.location.key;
    if (reduced || !outgoing) {
      settle(key, serial);
      return;
    }
    if (!cover) return;
    // Restoration commits before the next frame; geometry is read once, never per frame.
    const frame = requestAnimationFrame(() => {
      if (serial !== navigationSerial.current || routeKey.current !== key) return;
      const destination = roots.current.get(key);
      const target = destination && findCover(destination, cover.key);
      const resolved = target && resolveCoverTarget(cover, target);
      const bounds = resolved?.to;
      if (
        bounds &&
        (cover.photo ||
          Math.abs(bounds.left - cover.from.left) > 0.5 ||
          Math.abs(bounds.top - cover.from.top) > 0.5 ||
          Math.abs(bounds.width - cover.from.width) > 0.5)
      ) {
        setCover(resolved);
      } else {
        setCover(null);
        if (sceneComplete.current === key) settle(key, serial);
      }
    });
    return () => cancelAnimationFrame(frame);
    // Updating the target must not schedule another geometry read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, latest.location.key, reduced, settle, serial]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !categoryBridge || categoryBridge.resolved) return;
    const key = latest.location.key;
    const frame = requestAnimationFrame(() => {
      if (serial !== navigationSerial.current || routeKey.current !== key) return;
      const destination = roots.current.get(key);
      const resolved = destination && resolveCategory(categoryBridge, destination);
      if (resolved?.parts.some((part) => part.src && !part.leaving)) setCategoryBridge(resolved);
      else {
        bridgePending.current = false;
        setCategoryBridge(null);
        attemptFinish.current();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, categoryBridge, latest.location.key, serial]);

  useLayoutEffect(() => {
    if (!categoryBridge?.revealing) return;
    const key = latest.location.key;
    // Unmask the destination for a painted frame before removing the bridge.
    const frame = requestAnimationFrame(() => {
      if (serial !== navigationSerial.current || routeKey.current !== key) return;
      bridgePending.current = false;
      setCategoryBridge(null);
      settle(key, serial);
    });
    return () => cancelAnimationFrame(frame);
  }, [categoryBridge, latest.location.key, serial, settle]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !sharedTransition) return;
    sceneComplete.current = latest.location.key;
    if (!cover) settle(latest.location.key, serial);
  }, [phase, sharedTransition, latest.location.key, cover, serial, settle]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !cover || cover.photo) return;
    const root = roots.current.get(latest.location.key);
    if (!root) return;
    const check = () => {
      const gallery = root.querySelector<HTMLElement>(
        `[data-gallery-item="${cover.key.slice(6)}"]`,
      );
      if (gallery?.dataset.galleryKind === 'photo') settle(latest.location.key, serial);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-gallery-kind'],
    });
    return () => observer.disconnect();
  }, [phase, cover, latest.location.key, serial, settle]);

  const completeScene = (key: string) => {
    if (phase !== 'animating' || key !== routeKey.current || serial !== navigationSerial.current)
      return;
    sceneComplete.current = key;
    if (!cover) settle(key, serial);
  };
  return (
    <Box
      data-shelves-workspace=""
      data-transition-phase={phase}
      data-transition-generation={serial}
      minH="100dvh"
      bg={shelfBackground}
      color="white"
      position="relative"
      overflowX="clip"
      css={{
        '& [data-scene-departing="true"] a:focus': { outline: 'none' },
        ...(cover?.to
          ? {
              [`& [data-part-item="${cover.key.slice(6)}"] [role="group"], & img[data-shelf-morph="${cover.key}"], & [data-shelf-morph="${cover.key}"] img, & [data-gallery-item="${cover.key.slice(6)}"] [data-gallery-current-image]`]:
                { visibility: 'hidden' },
            }
          : {}),
        ...(categoryBridge?.painted
          ? {
              [`& [data-scene-departing="true"] [data-scene-part="shelf"][data-part-category="${categoryBridge.category}"]`]:
                { visibility: 'hidden' },
              ...(!categoryBridge.revealing
                ? Object.fromEntries(
                    categoryBridge.parts.map((part) => [
                      part.id === 'ledge'
                        ? `& [data-scene-active="true"] [data-scene-part="shelf"][data-part-category="${categoryBridge.category}"][data-shelf-leading] [data-scene-ledge]`
                        : `& [data-scene-active="true"] [data-part-item="${part.id.slice(6)}"] [role="group"]`,
                      { visibility: 'hidden' },
                    ]),
                  )
                : {}),
            }
          : {}),
      }}
    >
      {scenes.map((scene) => {
        const incoming = scene.id === latest.id;
        const departing = scene.id === outgoing?.id;
        const dormant = !incoming && !departing;
        const active = incoming && phase !== 'preparing';
        const hidden = incoming && Boolean(outgoing) && phase === 'preparing';
        return (
          <ShelfSceneContext.Provider
            key={scene.id}
            value={{
              location: scene.location,
              navigationType: scene.navigationType,
              active,
              current: incoming,
              categoryData: reportCategory,
              ready: reportReady,
              claimPosition,
              trackMotion,
              transition: {
                generation: serial,
                phase,
                direction:
                  outgoing && latest.historyIndex < outgoing.historyIndex ? 'back' : 'forward',
                category: selectedCategory.current,
                itemId: (latest.location.pathname.match(/collection\/(\d+)/) ||
                  outgoing?.location.pathname.match(/collection\/(\d+)/))?.[1],
                departing,
                participating: !dormant && Boolean(outgoing),
                shared: sharedTransition,
                sharedItemIds: categoryBridge?.parts
                  .filter((part) => part.src)
                  .map((part) => part.id.slice(6)),
              },
            }}
          >
            <MotionBox
              ref={(node: HTMLDivElement | null) => {
                if (node) roots.current.set(scene.location.key, node);
                else roots.current.delete(scene.location.key);
              }}
              data-shelf-scene={scene.location.pathname}
              data-scene-departing={departing ? 'true' : 'false'}
              data-scene-active={active ? 'true' : 'false'}
              inert={!active}
              aria-hidden={!active}
              display={dormant ? 'none' : undefined}
              visibility={hidden ? 'hidden' : 'visible'}
              position={
                hidden ? 'absolute' : departing && phase === 'animating' ? 'fixed' : 'relative'
              }
              top={departing && phase === 'animating' ? `${-sourceScroll.current}px` : 0}
              left={0}
              w="full"
              pointerEvents={active ? 'auto' : 'none'}
              initial={false}
              animate={{
                opacity: sharedTransition
                  ? 1
                  : hidden || (!incoming && phase === 'animating')
                    ? 0
                    : 1,
                y: 0,
              }}
              transition={{
                duration: reduced || sharedTransition ? 0 : shelfMotion.sceneDuration,
                ease: shelfMotion.ease,
              }}
              onAnimationComplete={(definition) => {
                if (
                  incoming &&
                  typeof definition === 'object' &&
                  !Array.isArray(definition) &&
                  definition.opacity === 1 &&
                  definition.y === 0
                )
                  completeScene(scene.location.key);
              }}
            >
              <ShelfSceneBoundary path={scene.location.pathname}>
                {scene.location.pathname.startsWith('/shelves/category/') && (
                  <CategoryScene data={scene.categoryData} />
                )}
                <Suspense
                  fallback={
                    scene.location.pathname.startsWith('/shelves/category/') ? null : (
                      <ShelfDestinationLoading />
                    )
                  }
                >
                  {scene.element}
                </Suspense>
              </ShelfSceneBoundary>
            </MotionBox>
          </ShelfSceneContext.Provider>
        );
      })}
      {categoryBridge && !reduced && (
        <CategoryBridge
          key={serial}
          bridge={categoryBridge}
          onReady={() => {
            if (serial === navigationSerial.current)
              setCategoryBridge((current) =>
                current && !current.painted ? { ...current, painted: true } : current,
              );
          }}
          onError={() => {
            if (serial !== navigationSerial.current) return;
            bridgePending.current = false;
            setCategoryBridge(null);
            attemptFinish.current();
          }}
          onComplete={() => {
            if (serial !== navigationSerial.current) return;
            setCategoryBridge((current) => (current ? { ...current, revealing: true } : null));
          }}
        />
      )}
      {cover && !reduced && (
        <>
          <MotionBox
            key={`${serial}-${cover.key}`}
            ref={coverNode}
            data-shelf-morph-overlay=""
            aria-hidden="true"
            inert
            position="fixed"
            zIndex={1000}
            pointerEvents="none"
            willChange="transform"
            left={`${cover.from.left}px`}
            top={`${cover.from.top}px`}
            w={`${cover.from.width}px`}
            h={`${cover.from.height}px`}
            transformOrigin="top left"
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={
              cover.to
                ? {
                    x: cover.to.left - cover.from.left,
                    y: cover.to.top - cover.from.top,
                    scale: cover.to.width / cover.from.width,
                    opacity: cover.blend ? 0 : 1,
                  }
                : { x: 0, y: 0, scale: 1, opacity: 1 }
            }
            transition={{ duration: shelfMotion.coverDuration, ease: shelfMotion.ease }}
            onAnimationComplete={(definition) => {
              if (
                cover.to &&
                typeof definition === 'object' &&
                !Array.isArray(definition) &&
                definition.x === cover.to.left - cover.from.left &&
                definition.y === cover.to.top - cover.from.top &&
                definition.scale === cover.to.width / cover.from.width &&
                definition.opacity === (cover.blend ? 0 : 1)
              )
                settle(latest.location.key, serial);
            }}
          >
            <Image src={cover.src} alt="" w="full" h="full" display="block" objectFit="contain" />
          </MotionBox>
          {cover.blend && (
            <MotionBox
              key={`${serial}-${cover.key}-blend`}
              data-shelf-morph-blend=""
              aria-hidden="true"
              inert
              position="fixed"
              zIndex={1001}
              pointerEvents="none"
              willChange="transform, opacity"
              left={`${cover.blend.from.left}px`}
              top={`${cover.blend.from.top}px`}
              w={`${cover.blend.from.width}px`}
              h={`${cover.blend.from.height}px`}
              transformOrigin="top left"
              initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
              animate={{
                x: cover.blend.to.left - cover.blend.from.left,
                y: cover.blend.to.top - cover.blend.from.top,
                scale: cover.blend.to.width / cover.blend.from.width,
                opacity: 1,
              }}
              transition={{ duration: shelfMotion.coverDuration, ease: shelfMotion.ease }}
            >
              <Image
                src={cover.blend.src}
                alt=""
                w="full"
                h="full"
                display="block"
                objectFit="contain"
              />
            </MotionBox>
          )}
        </>
      )}
    </Box>
  );
}
