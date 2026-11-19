import { Helmet } from 'react-helmet-async';
import { getCachedCollection } from '@/utils/collectionCaches';
import type { ShelfNavigation } from '@/pages/collection_shelf/helpers/navigation';
import { Box } from '@chakra-ui/react';
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
import {
  ShelfSceneContext,
  ShelfLocationContext,
  ShelfCurrentContext,
  ShelfActiveContext,
  type CategorySceneData,
} from '@/layouts/shelves/scene';
import { shelfBackground } from '@/pages/collection_shelf/helpers/categories';
import {
  captureCover,
  resolveCoverDestination,
  type CoverMotion,
} from '@/layouts/shelves/coverMotion';
import {
  readSession,
  writeSession,
  restingAnchorTop,
} from '@/pages/collection_shelf/helpers/navigation';
import { MotionRegistry } from '@/layouts/shelves/motionRegistry';
import { SceneMotionBatch } from '@/layouts/shelves/sceneMotionBatch';
import { shelfMotion } from '@/layouts/shelves/motion';
import CoverBridge from '@/layouts/shelves/CoverBridge';
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
  detailTitle?: string;
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
type CoverWork = {
  generation: number;
  snapshot: CoverMotion;
  resolve: () => void;
  release: () => void;
};
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
  const [cancelledCoverKey, setCancelledCoverKey] = useState<string | null>(null);
  const [categoryBridge, setCategoryBridge] = useState<CategoryMotion | null>(null);
  const bridgePending = useRef(false);
  const coverNode = useRef<HTMLDivElement>(null);
  const coverWork = useRef<CoverWork | null>(null);
  const navigationSerial = useRef(0);
  // Retained motion nodes keep their ref across history entries; their identity is the scene ID.
  const roots = useRef(new Map<string, HTMLDivElement>());
  const sourceScroll = useRef(0);
  const selectedCategory = useRef<string | undefined>(undefined);
  const positioned = useRef('');
  const settled = useRef<Scene | null>(null);
  const departingId = useRef<string | null>(null);
  const finishRequest = useRef<{ key: string; serial: number } | null>(null);
  const attemptFinish = useRef<() => void>(() => {});
  const registry = useRef<MotionRegistry | null>(null);
  if (!registry.current) registry.current = new MotionRegistry(() => attemptFinish.current());
  const motions = registry.current;
  const [motionBatch] = useState(() => new SceneMotionBatch());
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
  const reportDetailTitle = useCallback((key: string, generation: number, title: string) => {
    if (key !== routeKey.current || generation !== navigationSerial.current) return;
    setScenes((previous) =>
      previous.map((scene) =>
        scene.location.key === key && scene.detailTitle !== title
          ? { ...scene, detailTitle: title }
          : scene,
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
    if (serial !== navigationSerial.current || key !== routeKey.current) return;
    finishRequest.current = { key, serial };
    // Never finish in the middle of React replacing child layout effects.
    queueMicrotask(() => attemptFinish.current());
  }, []);

  attemptFinish.current = () => {
    const request = finishRequest.current;
    if (!request) return;
    if (
      request.serial !== navigationSerial.current ||
      request.key !== routeKey.current ||
      request.key !== latestScene.current.location.key
    ) {
      finishRequest.current = null;
      return;
    }
    if (motions.size || bridgePending.current) return;
    finishRequest.current = null;
    const current = latestScene.current;
    settled.current = current;
    setScenes((previous) =>
      retainScenes(
        previous.filter(
          (scene) =>
            scene.id === current.id ||
            (browsing(scene) && !roots.current.get(scene.id)?.querySelector('[data-scene-error]')),
        ),
        current,
      ),
    );
    departingId.current = null;
    setCover(null);
    setCancelledCoverKey(null);
    setCategoryBridge(null);
    setPhase('settled');
  };
  const trackMotion = useCallback(
    (promise: Promise<unknown>, serial: number) => motions.track(promise, serial),
    [motions],
  );

  const cancelCover = useCallback(
    (key: string, generation: number) => {
      const work = coverWork.current;
      if (!work || work.generation !== generation || generation !== navigationSerial.current)
        return;
      work.resolve();
      work.release();
      coverWork.current = null;
      // Pending scene motions can outlive cancellation. Only the destination
      // should become visible while the departing scene finishes fading.
      setCancelledCoverKey(work.snapshot.key);
      setCover(null);
      settle(key, generation);
    },
    [settle],
  );

  // An interrupted navigation continues from the scene currently visible to the visitor.
  if (latest.location.key !== location.key) {
    const source = phase === 'preparing' ? outgoing || settled.current : latest;
    const item = (location.pathname.match(/collection\/(\d+)/) ||
      source?.location.pathname.match(/collection\/(\d+)/))?.[1];
    const root = source && roots.current.get(source.id);
    const destinationRoot = scenes.find((scene) => scene.id === sceneId(location));
    const targetRoot = destinationRoot && roots.current.get(destinationRoot.id);
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
    let capturedCover =
      root && source && !reduced
        ? captureCover(root, source.location.pathname, location.pathname)
        : null;
    const moving = coverNode.current?.getBoundingClientRect();
    if (
      capturedCover &&
      cover?.ready &&
      cover.key === capturedCover.key &&
      cover.photo === capturedCover.photo &&
      (!cover.photo || cover.src === capturedCover.src) &&
      moving
    ) {
      capturedCover = {
        ...capturedCover,
        from: { left: moving.left, top: moving.top, width: moving.width, height: moving.height },
      };
    }
    navigationSerial.current++;
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
      detailTitle: retained?.detailTitle,
    };
    departingId.current = source?.id || null;
    motions.reset(navigationSerial.current);
    coverWork.current?.resolve();
    coverWork.current?.release();
    coverWork.current = null;
    if (capturedCover) {
      let resolve = () => {};
      const promise = new Promise<void>((done) => {
        resolve = done;
      });
      coverWork.current = {
        generation: navigationSerial.current,
        snapshot: capturedCover,
        resolve,
        release: motions.track(promise, navigationSerial.current),
      };
    }
    finishRequest.current = null;
    setScenes(retainScenes(scenes, next, source));
    setPhase('preparing');
    setReadyEntry(null);
    setCover(capturedCover);
    setCancelledCoverKey(null);
    sceneComplete.current = '';
    positioned.current = '';
  }
  const sharedTransition = Boolean(!reduced && outgoing && (categoryBridge || cover));
  const serial = navigationSerial.current;
  const hasOutgoing = Boolean(outgoing);
  // Child layout effects enqueue preparation before the workspace advances the phase.
  useLayoutEffect(() => motionBatch.flushPreparation());
  useLayoutEffect(() => {
    if (
      phase !== 'preparing' ||
      readyEntry?.key !== latest.location.key ||
      readyEntry.generation !== serial
    )
      return;
    setPhase('animating');
  }, [phase, readyEntry, serial, latest.location.key]);

  useLayoutEffect(() => {
    if (phase !== 'animating') return;
    const key = latest.location.key;
    if (reduced || !hasOutgoing) {
      bridgePending.current = false;
      setCategoryBridge(null);
      cancelCover(key, serial);
      settle(key, serial);
      return;
    }
    const work = coverWork.current;
    if (!work || work.generation !== serial) return;
    let stopped = false;
    let frame = 0;
    let observer: MutationObserver | null = null;
    let resize: ResizeObserver | null = null;
    let observed: HTMLElement | undefined;
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resize?.disconnect();
      observed?.removeEventListener('load', schedule, true);
      clearTimeout(timer);
    };
    const measure = () => {
      frame = 0;
      if (stopped || serial !== navigationSerial.current || routeKey.current !== key) return;
      const destination = roots.current.get(latest.id);
      if (!destination) {
        schedule();
        return;
      }
      if (!observed) {
        observed = destination;
        observer = new MutationObserver(schedule);
        observer.observe(destination, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['src', 'width', 'height', 'data-gallery-kind'],
        });
        resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
        resize?.observe(destination);
        destination.addEventListener('load', schedule, true);
      }
      const resolved = resolveCoverDestination(work.snapshot, destination);
      if (resolved) {
        stop();
        setCover(resolved);
      } else schedule();
    };
    function schedule() {
      if (!stopped && !frame) frame = requestAnimationFrame(measure);
    }
    const timer = setTimeout(() => {
      stop();
      cancelCover(key, serial);
    }, 500);
    schedule();
    return stop;
  }, [phase, latest.location.key, latest.id, reduced, hasOutgoing, serial, cancelCover, settle]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !cover?.revealing) return;
    const key = latest.location.key;
    const frame = requestAnimationFrame(() => {
      const work = coverWork.current;
      if (!work || work.generation !== serial || routeKey.current !== key) return;
      work.resolve();
      work.release();
      coverWork.current = null;
      settle(key, serial);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, cover?.revealing, latest.location.key, serial, settle]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !categoryBridge || categoryBridge.resolved) return;
    const key = latest.location.key;
    const frame = requestAnimationFrame(() => {
      if (serial !== navigationSerial.current || routeKey.current !== key) return;
      const destination = roots.current.get(latest.id);
      const resolved = destination && resolveCategory(categoryBridge, destination);
      if (resolved?.parts.some((part) => part.src && !part.leaving)) setCategoryBridge(resolved);
      else {
        bridgePending.current = false;
        setCategoryBridge(null);
        attemptFinish.current();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, categoryBridge, latest.location.key, latest.id, serial]);

  useLayoutEffect(() => {
    if (!categoryBridge?.revealing) return;
    const key = latest.location.key;
    // Unmask the destination for a painted frame before removing the bridge.
    const frame = requestAnimationFrame(() => {
      if (serial !== navigationSerial.current || routeKey.current !== key) return;
      bridgePending.current = false;
      // Preserve the outgoing mask until the deferred settlement commits.
      settle(key, serial);
    });
    return () => cancelAnimationFrame(frame);
  }, [categoryBridge, latest.location.key, serial, settle]);

  useLayoutEffect(() => {
    if (phase !== 'animating' || !sharedTransition) return;
    sceneComplete.current = latest.location.key;
    if (!cover) settle(latest.location.key, serial);
  }, [phase, sharedTransition, latest.location.key, cover, serial, settle]);

  const completeScene = (key: string) => {
    if (phase !== 'animating' || key !== routeKey.current || serial !== navigationSerial.current)
      return;
    sceneComplete.current = key;
    if (!cover) settle(key, serial);
  };
  const detailId = Number(latest.location.pathname.match(/^\/shelves\/collection\/(\d+)/)?.[1]);
  const titlePreview = (latest.location.state as ShelfNavigation | null)?.preview?.item;
  const itemTitle =
    latest.detailTitle ||
    (titlePreview?.id === detailId ? titlePreview.title : undefined) ||
    (Number.isSafeInteger(detailId) && detailId > 0
      ? getCachedCollection(detailId)?.title
      : undefined);
  const pageTitle = latest.location.pathname.startsWith('/shelves/collection/')
    ? `${itemTitle || 'Collection Detail'} | Hobby Collection`
    : 'Hobby Collection Showcase';
  const departingCoverKey = cover?.ready ? cover.key : cancelledCoverKey;
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
        // The source owns the art until decode completes; then the bridge owns it
        // until settlement removes the bridge and reveals the destination together.
        ...(cover || departingCoverKey
          ? Object.fromEntries(
              [
                ...(cover && !cover.handoff ? [['[data-scene-active="true"]', cover.key]] : []),
                ...(departingCoverKey
                  ? [['[data-scene-departing="true"]', departingCoverKey]]
                  : []),
              ].map(([root, key]) => [
                `& ${root} [data-part-item="${key.slice(6)}"] [role="group"], & ${root} img[data-shelf-morph="${key}"], & ${root} [data-shelf-morph="${key}"] img, & ${root} [data-gallery-item="${key.slice(6)}"] [data-gallery-current-image], & ${root} [data-gallery-item="${key.slice(6)}"] [data-gallery-layer], & ${root} [data-gallery-item="${key.slice(6)}"] [data-gallery-layer] img`,
                { visibility: 'hidden' },
              ]),
            )
          : {}),
        ...(categoryBridge
          ? Object.fromEntries(
              [
                ...(categoryBridge.painted ? ['[data-scene-departing="true"]'] : []),
                ...(!categoryBridge.revealing ? ['[data-scene-active="true"]'] : []),
              ].flatMap((root) =>
                categoryBridge.parts.map((part) => [
                  part.id === 'ledge'
                    ? `& ${root} [data-scene-part="shelf"][data-part-category="${categoryBridge.category}"][data-shelf-leading] [data-shelf-leading-ledge]`
                    : `& ${root} [data-part-item="${part.id.slice(6)}"] [role="group"]`,
                  { visibility: 'hidden' },
                ]),
              ),
            )
          : {}),
      }}
    >
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      {scenes.map((scene) => {
        const incoming = scene.id === latest.id;
        const departing = scene.id === outgoing?.id;
        const dormant = !incoming && !departing;
        const active = incoming && phase !== 'preparing';
        const hidden = incoming && Boolean(outgoing) && phase === 'preparing';
        return (
          <ShelfLocationContext.Provider key={scene.id} value={scene.location}>
            <ShelfCurrentContext.Provider value={incoming}>
              <ShelfActiveContext.Provider value={active}>
                <ShelfSceneContext.Provider
                  value={{
                    location: scene.location,
                    navigationType: scene.navigationType,
                    active,
                    current: incoming,
                    categoryData: reportCategory,
                    detailTitle: reportDetailTitle,
                    ready: reportReady,
                    claimPosition,
                    trackMotion,
                    motionBatch,
                    transition: {
                      generation: serial,
                      phase,
                      direction:
                        outgoing && latest.historyIndex < outgoing.historyIndex
                          ? 'back'
                          : 'forward',
                      category: selectedCategory.current,
                      itemId: (latest.location.pathname.match(/collection\/(\d+)/) ||
                        outgoing?.location.pathname.match(/collection\/(\d+)/))?.[1],
                      departing,
                      participating: !dormant && Boolean(outgoing),
                      shared: sharedTransition,
                      categoryNavigation: Boolean(
                        outgoing &&
                        browsing(outgoing) &&
                        browsing(latest) &&
                        (outgoing.location.pathname === '/shelves' ||
                          latest.location.pathname === '/shelves'),
                      ),
                      sharedItemIds: categoryBridge?.parts
                        .filter((part) => part.src)
                        .map((part) => part.id.slice(6)),
                    },
                  }}
                >
                  <MotionBox
                    ref={(node: HTMLDivElement | null) => {
                      if (node) roots.current.set(scene.id, node);
                      else roots.current.delete(scene.id);
                    }}
                    data-shelf-scene={scene.location.pathname}
                    data-scene-departing={departing ? 'true' : 'false'}
                    data-scene-active={active ? 'true' : 'false'}
                    inert={!active}
                    aria-hidden={!active}
                    display={dormant ? 'none' : undefined}
                    visibility={hidden ? 'hidden' : 'visible'}
                    position={
                      hidden
                        ? 'absolute'
                        : departing && phase === 'animating'
                          ? 'fixed'
                          : 'relative'
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
              </ShelfActiveContext.Provider>
            </ShelfCurrentContext.Provider>
          </ShelfLocationContext.Provider>
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
          onResize={() => {
            if (serial !== navigationSerial.current) return;
            bridgePending.current = false;
            setCategoryBridge(null);
            if (phase === 'animating') {
              motions.reset(serial);
              settle(latest.location.key, serial);
            }
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
        <CoverBridge
          key={serial}
          cover={cover}
          overlayRef={coverNode}
          onReady={() => {
            if (serial === navigationSerial.current)
              setCover((current) =>
                current && !current.ready ? { ...current, ready: true } : current,
              );
          }}
          onHandoff={() => {
            if (serial !== navigationSerial.current || routeKey.current !== latest.location.key)
              return false;
            const gallery = roots.current
              .get(latest.id)
              ?.querySelector<HTMLElement>(`[data-gallery-item="${cover.key.slice(6)}"]`);
            if (gallery?.dataset.galleryKind !== 'photo') return false;
            setCover((current) => (current?.entry ? { ...current, handoff: true } : current));
            return true;
          }}
          onComplete={() => {
            if (serial === navigationSerial.current)
              setCover((current) =>
                current && !current.revealing ? { ...current, revealing: true } : current,
              );
          }}
          onError={() => cancelCover(latest.location.key, serial)}
        />
      )}
    </Box>
  );
}
