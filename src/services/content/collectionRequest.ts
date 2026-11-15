type Pending = { promise: Promise<unknown>; controller: AbortController; consumers: number };
const pending = new Map<string, Pending>();

/** Share warmup and mounted requests without one consumer cancelling another. */
export function collectionRequest<T>(
  key: string,
  run: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  let entry = pending.get(key);
  if (!entry || entry.controller.signal.aborted) {
    const controller = new AbortController();
    entry = { promise: run(controller.signal), controller, consumers: 0 };
    pending.set(key, entry);
    const current = entry;
    const clear = () => {
      if (pending.get(key) === current) pending.delete(key);
    };
    entry.promise.then(clear, clear);
  }
  const current = entry;
  current.consumers++;
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const release = () => {
      if (finished) return false;
      finished = true;
      signal?.removeEventListener('abort', abort);
      current.consumers--;
      queueMicrotask(() => {
        if (!current.consumers && pending.get(key) === current) current.controller.abort();
      });
      return true;
    };
    const abort = () => {
      if (release()) reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    current.promise.then(
      (value) => {
        if (release()) resolve(value as T);
      },
      (error) => {
        if (release()) reject(error);
      },
    );
  });
}
