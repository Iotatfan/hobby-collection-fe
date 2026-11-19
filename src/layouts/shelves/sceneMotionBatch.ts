import type { ShelfTransition } from '@/layouts/shelves/scene';

type Anchor = { bounds: DOMRect; row: Element | null } | undefined;

/** Geometry is shared only within one read pass, never across restoration or hydration. */
class SceneMeasurements {
  private anchors = new Map<Element, Anchor>();
  private translations = new Map<Element, { x: number; y: number }>();

  bounds(node: HTMLElement): DOMRect {
    const rect = node.getBoundingClientRect();
    let x = 0;
    let y = 0;
    // Read interrupted transforms once per measurement pass, including inherited scene parts.
    for (
      let part: HTMLElement | null = node;
      part && !part.hasAttribute('data-shelf-scene');
      part = part.parentElement
    ) {
      if (!part.hasAttribute('data-scene-part')) continue;
      let translation = this.translations.get(part);
      if (!translation) {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(part).transform);
        translation = { x: matrix.m41, y: matrix.m42 };
        this.translations.set(part, translation);
      }
      x += translation.x;
      y += translation.y;
    }
    return new DOMRect(rect.left - x, rect.top - y, rect.width, rect.height);
  }

  anchor(node: HTMLElement | null, transition: ShelfTransition): Anchor {
    const root = node?.closest('[data-shelf-scene]');
    if (!root) return;
    if (!this.anchors.has(root)) {
      const anchor = transition.itemId
        ? Array.from(root.querySelectorAll<HTMLElement>('[data-part-item]')).find(
            (part) => part.dataset.partItem === transition.itemId,
          )
        : Array.from(root.querySelectorAll<HTMLElement>('[data-scene-part="shelf"]')).find(
            (part) => part.dataset.partCategory === transition.category,
          );
      this.anchors.set(
        root,
        anchor
          ? { bounds: this.bounds(anchor), row: anchor.closest('[data-shelf-scroll]') }
          : undefined,
      );
    }
    return this.anchors.get(root);
  }
}

type Preparation = {
  reset: () => void;
  measure: (measurements: SceneMeasurements) => () => void;
};
type Animation = () => () => void;

/** Read every part before writing transforms, including the first animation frame. */
export class SceneMotionBatch {
  private preparations = new Set<Preparation>();
  private animations = new Set<Animation>();
  private frame: number | null = null;
  private groups = new Map<string, { members: Set<symbol>; finish: () => void }>();

  /** One registry entry covers related elements, including work scheduled before the next frame. */
  track(key: string, promise: Promise<unknown>, register: (promise: Promise<void>) => () => void) {
    let group = this.groups.get(key);
    if (!group) {
      let resolve = () => {};
      const complete = new Promise<void>((done) => {
        resolve = done;
      });
      const release = register(complete);
      group = {
        members: new Set(),
        finish: () => {
          resolve();
          release();
        },
      };
      this.groups.set(key, group);
    }
    const current = group;
    const member = Symbol();
    current.members.add(member);
    const release = () => {
      if (!current.members.delete(member)) return;
      queueMicrotask(() => {
        if (current.members.size || this.groups.get(key) !== current) return;
        this.groups.delete(key);
        current.finish();
      });
    };
    void promise.then(release, release);
    return release;
  }

  prepare(reset: Preparation['reset'], measure: Preparation['measure']) {
    const job = { reset, measure };
    this.preparations.add(job);
    // Also handle child-only commits that do not render the workspace.
    if (this.preparations.size === 1) queueMicrotask(() => this.flushPreparation());
    return () => {
      this.preparations.delete(job);
    };
  }

  flushPreparation() {
    const jobs = [...this.preparations];
    this.preparations.clear();
    for (const job of jobs) job.reset();
    const measurements = new SceneMeasurements();
    const writes = jobs.map((job) => job.measure(measurements));
    for (const write of writes) write();
  }

  animate(measure: Animation) {
    this.animations.add(measure);
    if (this.frame === null)
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        const jobs = [...this.animations];
        this.animations.clear();
        const writes = jobs.map((job) => job());
        for (const write of writes) write();
      });
    return () => {
      this.animations.delete(measure);
      if (!this.animations.size && this.frame !== null) {
        cancelAnimationFrame(this.frame);
        this.frame = null;
      }
    };
  }
}

export type { SceneMeasurements };
