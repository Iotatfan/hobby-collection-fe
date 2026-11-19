import { expect, test } from '@playwright/test';
import { MotionRegistry } from '../../src/layouts/shelves/motionRegistry';
import { SceneMotionBatch } from '../../src/layouts/shelves/sceneMotionBatch';

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

test('entrance transforms cannot change a neighboring part measurement', () => {
  const batch = new SceneMotionBatch();
  let anchorTop = 40;
  let neighborOffset = 0;
  batch.prepare(
    () => {
      anchorTop = 0;
    },
    () => () => {
      anchorTop = 48;
    },
  );
  batch.prepare(
    () => {},
    () => {
      const restingTop = anchorTop;
      return () => {
        neighborOffset = 20 - restingTop;
      };
    },
  );
  batch.flushPreparation();
  expect(anchorTop).toBe(48);
  expect(neighborOffset).toBe(20);
});

test('cancelled preparation cannot overwrite replacement motion in a child-only commit', async () => {
  const batch = new SceneMotionBatch();
  let position = 0;
  const cancel = batch.prepare(
    () => {},
    () => () => {
      position = 48;
    },
  );
  cancel();
  batch.prepare(
    () => {},
    () => () => {
      position = -32;
    },
  );
  await flush();
  expect(position).toBe(-32);
});

test('related motion shares one registry entry until all members finish or cancel', async () => {
  const batch = new SceneMotionBatch();
  const first = deferred();
  const second = deferred();
  const idle: number[] = [];
  const registry = new MotionRegistry((generation) => idle.push(generation));
  registry.reset(1);
  const register = (promise: Promise<void>) => registry.track(promise, 1);
  batch.track('1:overview:captions', first.promise, register);
  const cancelSecond = batch.track('1:overview:captions', second.promise, register);
  expect(registry.size).toBe(1);
  first.resolve();
  await flush();
  expect(registry.size).toBe(1);
  cancelSecond();
  await flush();
  expect(registry.size).toBe(0);
  expect(idle).toEqual([1]);
});
