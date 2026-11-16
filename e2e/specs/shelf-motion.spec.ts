import { expect, test } from '@playwright/test';
import { MotionRegistry } from '../../src/layouts/shelves/motionRegistry';

const deferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test('cancelled motion cannot settle while replacement work is registering', async () => {
  const idle: number[] = [];
  const registry = new MotionRegistry((generation) => idle.push(generation));
  registry.reset(1);
  const original = deferred();
  const cancel = registry.track(original.promise, 1);
  cancel();
  expect(idle).toEqual([]);
  const replacement = deferred();
  registry.track(replacement.promise, 1);
  await flush();
  expect(registry.size).toBe(1);
  expect(idle).toEqual([]);
  original.resolve();
  await flush();
  expect(idle).toEqual([]);
  replacement.resolve();
  await flush();
  expect(registry.size).toBe(0);
  expect(idle).toEqual([1]);
});

test('scheduled frames hold settlement and old generations cannot finish the current one', async () => {
  const idle: number[] = [];
  const registry = new MotionRegistry((generation) => idle.push(generation));
  const old = deferred();
  registry.reset(1);
  const releaseOld = registry.track(old.promise, 1);
  releaseOld();
  registry.reset(2);
  const scheduled = deferred();
  registry.track(scheduled.promise, 2);
  old.resolve();
  await flush();
  expect(idle).toEqual([]);
  expect(registry.size).toBe(1);
  scheduled.resolve();
  await flush();
  expect(idle).toEqual([2]);
});
