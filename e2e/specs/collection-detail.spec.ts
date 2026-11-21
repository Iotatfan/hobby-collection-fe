import { expect, test } from '@playwright/test';

for (const outcome of ['loaded', 'failed'] as const) {
  test(`waits for the selected image to ${outcome === 'loaded' ? 'load' : 'fail'} before preloading adjacent previews`, async ({
    page,
  }) => {
    const imageBase = 'https://res.cloudinary.com/demo/image/upload/';
    const previews: string[] = [];
    let releaseCover!: () => void;
    const coverReady = new Promise<void>((resolve) => {
      releaseCover = resolve;
    });
    await page.route('**/collection/1', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            title: 'Gallery fixture',
            cover: `${imageBase}cover.png`,
            pictures: [`${imageBase}photo.png`],
            type: { name: 'Gunpla', scale: '1/144', grade: { name: 'HG' } },
          },
        },
      }),
    );
    await page.route(`${imageBase}**`, async (route) => {
      const url = route.request().url();
      if (url.includes('w_1280')) {
        previews.push(url);
        if (url.endsWith('/cover.png')) {
          await coverReady;
          if (outcome === 'failed') {
            await route.abort();
            return;
          }
        }
      }
      await route.fulfill({ path: 'public/favicon.png' });
    });
    await page.goto('/collection/1/gallery-fixture', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Next image' })).toBeVisible();
    await expect.poll(() => previews.length).toBe(1);
    expect(previews[0]).toContain('/cover.png');
    releaseCover();
    await expect.poll(() => previews.filter((url) => url.endsWith('/photo.png')).length).toBe(1);
    await page.getByRole('button', { name: 'Next image' }).click();
    await expect(page.getByRole('img', { name: 'Gallery fixture 2', exact: true })).toBeVisible();
  });
}

test('late completion of an old selection cannot preload its adjacent images', async ({ page }) => {
  const imageBase = 'https://res.cloudinary.com/demo/image/upload/';
  const previews: string[] = [];
  let releaseCover!: () => void;
  let releasePhoto!: () => void;
  const coverReady = new Promise<void>((resolve) => {
    releaseCover = resolve;
  });
  const photoReady = new Promise<void>((resolve) => {
    releasePhoto = resolve;
  });
  let coverFinished!: () => void;
  const coverFulfilled = new Promise<void>((resolve) => {
    coverFinished = resolve;
  });
  await page.route('**/collection/1', (route) =>
    route.fulfill({
      json: {
        data: {
          id: 1,
          title: 'Gallery fixture',
          cover: `${imageBase}cover.png`,
          pictures: [1, 2, 3].map((index) => `${imageBase}photo-${index}.png`),
        },
      },
    }),
  );
  await page.route(`${imageBase}**`, async (route) => {
    const url = route.request().url();
    if (url.includes('w_1280')) {
      previews.push(url);
      if (url.endsWith('/cover.png')) {
        await coverReady;
        await route.fulfill({ path: 'public/favicon.png' });
        coverFinished();
        return;
      }
      if (url.endsWith('/photo-1.png')) await photoReady;
    }
    await route.fulfill({ path: 'public/favicon.png' });
  });
  await page.goto('/collection/1/gallery-fixture', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Next image' })).toBeVisible();
  await expect.poll(() => previews.length).toBe(1);
  await page.getByRole('button', { name: 'Next image' }).click();
  await expect.poll(() => previews.some((url) => url.endsWith('/photo-1.png'))).toBe(true);
  releaseCover();
  await coverFulfilled;
  await expect(page.getByRole('img', { name: 'Gallery fixture 2', exact: true })).toBeVisible();
  expect(previews.some((url) => url.endsWith('/photo-3.png'))).toBe(false);
  releasePhoto();
  await expect.poll(() => previews.some((url) => url.endsWith('/photo-2.png'))).toBe(true);
  expect(previews.some((url) => url.endsWith('/photo-3.png'))).toBe(false);
});
