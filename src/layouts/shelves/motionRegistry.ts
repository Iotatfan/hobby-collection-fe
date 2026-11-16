/** Tracks both scheduled and running motion without settling during effect teardown. */
export class MotionRegistry {
  private generation = 0;
  private pending = new Set<symbol>();
  private queuedGeneration: number | null = null;

  constructor(private readonly onIdle: (generation: number) => void) {}

  get size() {
    return this.pending.size;
  }

  reset(generation: number) {
    this.generation = generation;
    this.pending.clear();
  }

  track(promise: Promise<unknown>, generation: number): () => void {
    const token = Symbol();
    let released = false;
    if (generation === this.generation) this.pending.add(token);
    const release = () => {
      if (released) return;
      released = true;
      if (generation !== this.generation) return;
      this.pending.delete(token);
      if (this.pending.size || this.queuedGeneration === generation) return;
      this.queuedGeneration = generation;
      queueMicrotask(() => {
        if (this.queuedGeneration === generation) this.queuedGeneration = null;
        // Replacement layout effects can register work before this check runs.
        if (this.generation === generation && !this.pending.size) this.onIdle(generation);
      });
    };
    void promise.then(release, release);
    return release;
  }
}
