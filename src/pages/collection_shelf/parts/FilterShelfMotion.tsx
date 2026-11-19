import { Box } from '@chakra-ui/react';
import { animate, useReducedMotion } from 'framer-motion';
import { Component, createRef, useContext, type ReactNode } from 'react';
import { ShelfSceneContext } from '@/layouts/shelves/scene';
import { shelfMotion } from '@/layouts/shelves/motion';

type Artwork = { id: string; rect: DOMRect; clone: HTMLElement; direction: number };
type Snapshot = {
  root: DOMRect;
  items: Artwork[];
  rows: { rect: DOMRect; gridHeight: number; ledge?: HTMLElement; ledgeRect?: DOMRect }[];
};
type Props = {
  children: ReactNode;
  revision: string;
  enabled: boolean;
  track?: (promise: Promise<unknown>) => () => void;
};

/** Capture before React reparents artwork across rows, including interrupted motion. */
class ShelfMotionBoundary extends Component<Props> {
  root = createRef<HTMLDivElement>();
  cancel = () => {};

  getSnapshotBeforeUpdate(previous: Props): Snapshot | null {
    const root = this.root.current;
    if (!root || !this.props.enabled || previous.revision === this.props.revision) return null;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-filter-item], [data-filter-exit]'),
    ).map((node) => {
      const rect = node.getBoundingClientRect();
      const row =
        node.closest('[data-shelf-scroll]')?.getBoundingClientRect() ||
        root.getBoundingClientRect();
      return {
        id: node.dataset.filterItem || node.dataset.filterExit!,
        rect,
        clone: node.cloneNode(true) as HTMLElement,
        direction: rect.left + rect.width / 2 < row.left + row.width / 2 ? -1 : 1,
      };
    });
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]')).map(
      (row) => ({
        rect: row.getBoundingClientRect(),
        gridHeight: row.querySelector('[data-shelf-scroll]')?.getBoundingClientRect().height || 0,
        ledgeRect: row.querySelector<HTMLElement>('[data-scene-ledge]')?.getBoundingClientRect(),
        ledge: row.querySelector<HTMLElement>('[data-scene-ledge]')?.cloneNode(true) as
          | HTMLElement
          | undefined,
      }),
    );
    return { root: root.getBoundingClientRect(), items, rows };
  }

  componentDidUpdate(previous: Props, _state: unknown, snapshot: Snapshot | null) {
    if (!this.props.enabled) {
      this.cancel();
      return;
    }
    if (previous.revision === this.props.revision || !snapshot) return;
    this.cancel();
    const root = this.root.current!;
    const bounds = root.getBoundingClientRect();
    const nodes = new Map(
      Array.from(root.querySelectorAll<HTMLElement>('[data-filter-item]')).map((node) => [
        node.dataset.filterItem!,
        node,
      ]),
    );
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]'));
    const cleanup: (() => void)[] = [];
    const controls: ReturnType<typeof animate>[] = [];
    let cancelled = false;
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const release = this.props.track?.(finished);
    root.style.minHeight = `${snapshot.root.height}px`;
    cleanup.push(() => {
      root.style.minHeight = '';
    });
    // Reserve the old row geometry while artwork clears and travels.
    rows.forEach((row, index) => {
      if (!snapshot.rows[index]) return;
      const grid = row.querySelector<HTMLElement>('[data-shelf-scroll]');
      if (!grid) return;
      grid.style.minHeight = `${snapshot.rows[index].gridHeight}px`;
      cleanup.push(() => {
        grid.style.minHeight = '';
      });
    });
    const ghosts: HTMLElement[] = [];
    const makeGhost = (node: HTMLElement, rect: DOMRect) => {
      for (const element of [node, ...node.querySelectorAll<HTMLElement>('*')]) {
        for (const attribute of Array.from(element.attributes)) {
          if (attribute.name === 'id' || attribute.name.startsWith('data-'))
            element.removeAttribute(attribute.name);
        }
      }
      node.setAttribute('aria-hidden', 'true');
      node.inert = true;
      Object.assign(node.style, {
        position: 'absolute',
        left: `${rect.left - snapshot.root.left}px`,
        top: `${rect.top - snapshot.root.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        pointerEvents: 'none',
        transform: 'none',
        zIndex: '3',
      });
      root.appendChild(node);
      ghosts.push(node);
      return node;
    };
    snapshot.rows.slice(rows.length).forEach(({ ledgeRect, ledge }) => {
      if (!ledge || !ledgeRect) return;
      // The ledge's own height stays intact; its parent row may already be gone.
      makeGhost(ledge, ledgeRect);
    });
    const departing = snapshot.items.filter((item) => !nodes.has(item.id));
    const exits = departing.map((item) => {
      const ghost = makeGhost(item.clone, item.rect);
      ghost.dataset.filterExit = item.id;
      const control = animate(
        ghost,
        { x: [0, item.direction * 64], opacity: [1, 0] },
        { duration: shelfMotion.filterExitDuration, ease: shelfMotion.ease },
      );
      controls.push(control);
      return control;
    });
    // Offset survivors before paint, then regroup after the departures clear.
    const old = new Map(snapshot.items.map((item) => [item.id, item]));
    const movements = Array.from(nodes, ([id, node]) => {
      const rect = node.getBoundingClientRect();
      const from = old.get(id);
      const x = from ? from.rect.left - snapshot.root.left - (rect.left - bounds.left) : 24;
      const y = from ? from.rect.top - snapshot.root.top - (rect.top - bounds.top) : 0;
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.style.opacity = from ? '1' : '0';
      cleanup.push(() => {
        node.style.transform = '';
        node.style.opacity = '';
      });
      return { node, x, y, existing: Boolean(from) };
    });
    this.cancel = () => {
      cancelled = true;
      controls.forEach((control) => control.stop());
      ghosts.forEach((ghost) => ghost.remove());
      cleanup.forEach((reset) => reset());
      release?.();
      finish();
    };
    void Promise.all(exits).then(async () => {
      if (cancelled) return;
      ghosts.forEach((ghost) => {
        if (ghost.dataset.filterExit) ghost.remove();
      });
      const regroup = movements.map(({ node, x, y, existing }) => {
        const control = animate(
          node,
          { x: [x, 0], y: [y, 0], opacity: [existing ? 1 : 0, 1] },
          { duration: shelfMotion.filterRegroupDuration, ease: shelfMotion.ease },
        );
        controls.push(control);
        return control;
      });
      await Promise.all(regroup);
      if (!cancelled) this.cancel();
    });
  }

  componentWillUnmount() {
    this.cancel();
  }

  render() {
    return (
      <Box
        ref={this.root}
        position="relative"
        overflowX="clip"
        onPointerDownCapture={() => this.cancel()}
        onKeyDownCapture={() => this.cancel()}
      >
        {this.props.children}
      </Box>
    );
  }
}

export default function FilterShelfMotion({
  children,
  revision,
}: {
  children: ReactNode;
  revision: string;
}) {
  const scene = useContext(ShelfSceneContext);
  const reduced = useReducedMotion();
  const enabled =
    !reduced && (!scene || (scene.current && scene.active && scene.transition.phase === 'settled'));
  return (
    <ShelfMotionBoundary
      revision={revision}
      enabled={enabled}
      track={
        scene ? (promise) => scene.trackMotion(promise, scene.transition.generation) : undefined
      }
    >
      {children}
    </ShelfMotionBoundary>
  );
}
