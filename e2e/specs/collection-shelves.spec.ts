import { expect, test, type Page } from '@playwright/test';

const item = (id: number) => ({
  id,
  title: `Kit ${id}`,
  cover: `https://example.com/kit-${id}.png`,
  display_size: 'medium_wide',
  status: 3,
  type: { id: 2, name: 'Gunpla', scale: '1/144', grade: { id: 1, name: 'HG', short_name: 'HG' } },
  release_type: { id: 1, name: 'Standard' },
});
const shelf = (items = Array.from({ length: 6 }, (_, i) => item(i + 1)), count = 30) => ({
  id: 2,
  name: 'Gunpla',
  items,
  count,
});
const envelope = (items?: ReturnType<typeof item>[], count?: number) => ({
  data: {
    gunpla_shelf: shelf(items, count),
    figure_shelf: { id: 1, name: 'Figure', count: 0, items: [] },
    other_model_kit_shelf: { id: 0, name: 'Other Model Kit', count: 0, items: [] },
    backlog_shelf: { id: 1, name: 'Backlog', count: 0, items: [] },
  },
});
async function mock(
  page: Page,
  mode: 'normal' | 'retry' | 'empty' | 'duplicate' = 'normal',
  automatic = false,
  categoryName = 'Gunpla',
) {
  if (!automatic)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        configurable: true,
      });
    });
  const offsets: number[] = [];
  let failed = false;
  await page.route('https://example.com/**', (route) =>
    route.fulfill({ path: 'public/favicon.png' }),
  );
  await page.route('**/collection/statistics*', (route) =>
    route.fulfill({
      json: { data: { total_count: 30, completed_count: 30, backlog_count: 0, limited_count: 0 } },
    }),
  );
  await page.route('**/collection/shelves*', async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has('category')) {
      await route.fulfill({ json: envelope() });
      return;
    }
    expect(url.searchParams.get('category')).toBe('gunpla');
    expect(url.searchParams.get('limit')).toBe('12');
    const offset = Number(url.searchParams.get('offset'));
    offsets.push(offset);
    if (mode === 'retry' && offset === 12 && !failed) {
      failed = true;
      await route.fulfill({ status: 500, json: {} });
      return;
    }
    const start = mode === 'duplicate' ? 0 : offset;
    const items =
      mode === 'empty'
        ? []
        : Array.from({ length: Math.min(12, 30 - start) }, (_, i) => item(start + i + 1));
    const response = envelope(items, mode === 'empty' ? 0 : 30);
    response.data.gunpla_shelf.name = categoryName;
    await route.fulfill({ json: response });
  });
  await page.route(/\/collection\/\d+$/, (route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    return route.fulfill({
      json: {
        data: {
          ...item(id),
          pictures: ['https://example.com/build.png'],
          description: 'Collection notes',
          manufacturer: { id: 1, name: 'Bandai' },
        },
      },
    });
  });
  return offsets;
}
async function loadAll(page: Page) {
  for (let i = 0; i < 4; i++) {
    if (await page.getByRole('link', { name: 'Kit 30', exact: true }).count()) return;
    await page.getByRole('button', { name: 'Load more Gunpla' }).click();
    await expect(page.getByText('Loading shelf items...')).toHaveCount(0);
  }
}

test('category pagination retains later rows, focus and position on detail return', async ({
  page,
}) => {
  const offsets = await mock(page);
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await expect(page).toHaveURL(/\/shelves\/category\/gunpla$/);
  await loadAll(page);
  await expect(page.getByText('All 30 items shown.')).toBeVisible();
  const target = page.getByRole('link', { name: 'Kit 25', exact: true });
  await target.scrollIntoViewIfNeeded();
  await target.click({ trial: true });
  const top = await target.evaluate((el) => el.getBoundingClientRect().top);
  await target.click();
  await expect(page).toHaveURL(/\/shelves\/collection\/25\/kit-25$/);
  await expect(page.getByRole('heading', { name: 'Kit 25' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Kit 25 - Box art' })).toBeVisible();
  await page.getByRole('button', { name: 'Show photo 2' }).click();
  await expect(page.getByRole('img', { name: 'Kit 25 - Photo 2' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to Gunpla' }).click();
  await expect(target).toBeFocused();
  expect(
    Math.abs((await target.evaluate((el) => el.getBoundingClientRect().top)) - top),
  ).toBeLessThan(5);
  expect(offsets.filter((offset) => offset > 0)).toEqual([12, 24]);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Kit 30', exact: true })).toBeAttached();
  expect(offsets.filter((offset) => offset > 0)).toEqual([12, 24]);
});

test('failed page retries at the same offset and preserves existing boxes', async ({ page }) => {
  const offsets = await mock(page, 'retry');
  await page.goto('/shelves/category/gunpla');
  await page.getByRole('button', { name: 'Load more Gunpla' }).click();
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('link', { name: 'Kit 24', exact: true })).toBeAttached();
  expect(offsets.filter((offset) => offset > 0).slice(0, 2)).toEqual([12, 12]);
});

test('empty category and invalid category retain safe navigation', async ({ page }) => {
  await mock(page, 'empty');
  await page.goto('/shelves/category/gunpla');
  await expect(page.getByText('No items in this category.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to shelves' })).toBeVisible();
  await page.goto('/shelves/category/unknown');
  await expect(page.getByRole('heading', { name: 'Category unavailable' })).toBeVisible();
});

test('non-advancing API stops automatic requests without duplicating boxes', async ({ page }) => {
  const offsets = await mock(page, 'duplicate');
  await page.goto('/shelves/category/gunpla');
  await page.getByRole('button', { name: 'Load more Gunpla' }).click();
  await expect(page.getByText(/More items could not be loaded/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toHaveCount(1);
  expect(offsets.filter((offset) => offset > 0)).toEqual([12]);
});

test('mobile direct detail, reduced motion and classic detail isolation', async ({ page }) => {
  await mock(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/shelves/collection/1/kit-1');
  await expect(page.getByRole('heading', { name: 'Kit 1' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page).toHaveURL(/\/shelves$/);
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await expect(page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/collection/1/kit-1');
  await expect(page.getByRole('button', { name: 'Back to Collection' })).toBeVisible();
});

test('observer appends ordered pages and ends without duplicate successful requests', async ({
  page,
}) => {
  const offsets = await mock(page, 'normal', true);
  await page.goto('/shelves/category/gunpla');
  await expect(page.getByRole('link', { name: 'Kit 12', exact: true })).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('link', { name: 'Kit 24', exact: true })).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText('All 30 items shown.')).toBeVisible();
  expect(offsets.filter((offset) => offset > 0)).toEqual([12, 24]);
});

test('overview returns to its trigger and browser forward keeps shelf context', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves');
  const trigger = page.getByRole('link', { name: 'View all Gunpla' });
  await trigger.click();
  await expect(page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(trigger).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/\/shelves\/category\/gunpla$/);
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kit 1' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('link', { name: 'Back to Gunpla' })).toBeVisible();
});

test('expired context uses a safe category fallback without restoring old pages', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves/category/gunpla');
  await loadAll(page);
  await page.getByRole('link', { name: 'Kit 25', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kit 25' })).toBeVisible();
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith('shelves:')) continue;
      const entry = JSON.parse(sessionStorage.getItem(key)!);
      entry.time = 0;
      sessionStorage.setItem(key, JSON.stringify(entry));
    }
  });
  await page.getByRole('link', { name: 'Back to Gunpla' }).click();
  await expect(page).toHaveURL(/\/shelves\/category\/gunpla$/);
  await expect(page.getByRole('link', { name: 'Kit 12', exact: true })).toBeAttached();
  await expect(page.getByRole('link', { name: 'Kit 25', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('a rejected successful response is evicted so retry can recover', async ({ page }) => {
  await mock(page);
  let invalid = true;
  await page.route('**/collection/shelves?*', async (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get('offset'));
    if (offset !== 12) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      json: invalid
        ? { data: {} }
        : envelope(
            Array.from({ length: 12 }, (_, i) => item(i + 13)),
            30,
          ),
    });
  });
  await page.goto('/shelves/category/gunpla');
  await page.getByRole('button', { name: 'Load more Gunpla' }).click();
  await expect(page.getByText('Invalid shelf response.')).toBeVisible();
  invalid = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('link', { name: 'Kit 24', exact: true })).toBeAttached();
});

test('late category responses do not leak into the next category', async ({ page }) => {
  await mock(page);
  const waiting: Array<() => void> = [];
  await page.route('**/collection/shelves*', async (route) => {
    const category = new URL(route.request().url()).searchParams.get('category');
    if (category === 'gunpla') {
      await new Promise<void>((resolve) => waiting.push(resolve));
      await route.fulfill({ json: envelope() }).catch(() => undefined);
    } else {
      const response = envelope();
      response.data.figure_shelf = { id: 1, name: 'Figure', count: 1, items: [item(101)] };
      if (!category) response.data.figure_shelf.count = 7;
      await route.fulfill({ json: response });
    }
  });
  try {
    await page.goto('/shelves');
    await page.getByRole('link', { name: 'View all Gunpla' }).click();
    await expect.poll(() => waiting.length).toBeGreaterThan(0);
    await page.goBack();
    await page.getByRole('link', { name: 'View all Figure' }).click();
    await expect(page.getByRole('link', { name: 'Kit 101', exact: true })).toBeAttached();
    waiting.forEach((resolve) => resolve());
    await expect(
      page.getByRole('heading', { name: 'Figure', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toHaveCount(0);
  } finally {
    waiting.forEach((resolve) => resolve());
  }
});

test('overview item return restores the original box and horizontal position', async ({ page }) => {
  await mock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/shelves');
  const box = page.getByRole('link', { name: 'Kit 5', exact: true });
  await box.scrollIntoViewIfNeeded();
  const left = await box.evaluate((el) => el.getBoundingClientRect().left);
  await box.click();
  await expect(page.getByRole('heading', { name: 'Kit 5' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(box).toBeFocused();
  expect(
    Math.abs((await box.evaluate((el) => el.getBoundingClientRect().left)) - left),
  ).toBeLessThan(5);
});

test('opens the destination skeleton with preview assets before category code loads', async ({
  page,
}) => {
  await mock(page);
  let release = () => {};
  let requested = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /(?:\/src\/pages\/collection_shelf\/category\.tsx|\/assets\/category-[^/]+\.js)(?:\?.*)?$/,
    async (route) => {
      requested = true;
      await gate;
      await route.continue();
    },
  );
  await page.goto('/shelves');
  const workspace = page.locator('[data-shelves-workspace]');
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  await workspace.evaluate((el) => {
    (window as unknown as { savedWorkspace: Element }).savedWorkspace = el;
  });
  const documentRequests: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documentRequests.push(request.url());
  });
  try {
    await page.getByRole('link', { name: 'View all Gunpla' }).click();
    await expect.poll(() => requested).toBe(true);
    await expect(
      page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeVisible();
    // Prefetched data may already fill all rows while route code is still delayed.
    await expect
      .poll(
        async () =>
          (await page.locator('[data-scene-active="true"] [data-shelf-skeleton]').count()) +
          (await page.getByRole('link', { name: 'Kit 12', exact: true }).count()),
      )
      .toBeGreaterThan(0);
    await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
    await page.screenshot({ path: test.info().outputPath('category-loading.png'), fullPage: true });
    await page.getByRole('link', { name: 'Back to shelves' }).focus();
    release();
    await expect(
      page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
    expect(
      await workspace.evaluate(
        (el) => el === (window as unknown as { savedWorkspace: Element }).savedWorkspace,
      ),
    ).toBe(true);
    await expect(page.getByRole('link', { name: 'Back to shelves' })).toBeFocused();
    expect(documentRequests).toEqual([]);
  } finally {
    release();
  }
});

test('slow category data shows preview assets and skeletons then keeps previews on failure', async ({
  page,
}) => {
  await mock(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/collection/shelves?*', async (route) => {
    await gate;
    await route.fulfill({ status: 500, json: {} });
  });
  await page.goto('/shelves');
  try {
    await page.getByRole('link', { name: 'View all Gunpla' }).click();
    await expect(
      page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeVisible();
    await expect(page.locator('[data-scene-active="true"] [data-shelf-skeleton]')).not.toHaveCount(
      0,
    );
    await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
      'data-transition-phase',
      'settled',
    );
    release();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(
      page.locator('[data-scene-active="true"]').getByText('30', { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeVisible();
    await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
      'data-transition-phase',
      'settled',
    );
    await page.getByRole('link', { name: 'Back to shelves' }).click();
    await expect(page.getByRole('link', { name: 'View all Gunpla' })).toBeFocused();
  } finally {
    release();
  }
});

test('slow detail image retains box art and reduced motion settles without a morph', async ({
  page,
}) => {
  await mock(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cover = 'https://res.cloudinary.com/test/image/upload/kit-1.png';
  await page.route(/\/collection\/1$/, (route) =>
    route.fulfill({ json: { data: { ...item(1), cover, pictures: [] } } }),
  );
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://res.cloudinary.com/**', async (route) => {
    if (route.request().url().includes('w_1280')) await gate;
    await route.fulfill({ path: 'public/favicon.png' });
  });
  await page.goto('/shelves');
  try {
    await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Kit 1' })).toBeVisible();
    await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
      'data-transition-phase',
      'settled',
    );
    const hero = page.locator('[data-scene-active="true"] [data-shelf-morph="cover-1"]');
    await expect(hero.locator('img')).toHaveAttribute('src', /w_480/);
    release();
    await expect(page.getByRole('img', { name: 'Kit 1 - Box art' })).toBeVisible();
    await expect(page.locator('[data-shelf-morph-overlay]')).toHaveCount(0);
  } finally {
    release();
  }
});

test('failed category code stays inside the workspace with safe return navigation', async ({
  page,
}) => {
  await mock(page);
  await page.route(
    /(?:\/src\/pages\/collection_shelf\/category\.tsx|\/assets\/category-[^/]+\.js)(?:\?.*)?$/,
    (route) => route.abort(),
  );
  await page.goto('/shelves');
  const workspace = page.locator('[data-shelves-workspace]');
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await expect(page.getByRole('heading', { name: 'This view could not be opened.' })).toBeVisible();
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.getByRole('link', { name: 'View all Gunpla' })).toBeFocused();
});

test('slow direct entry cannot cancel into external history', async ({ page }) => {
  await mock(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/collection/shelves?*', async (route) => {
    await gate;
    await route.fallback();
  });
  try {
    await page.goto('/shelves/category/gunpla');
    await expect(page.locator('[data-scene-active="true"] [data-shelf-skeleton]')).not.toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    release();
    await expect(
      page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test('captures desktop expansion and mobile detail for visual verification', async ({ page }) => {
  await mock(page);
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'animating',
  );
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await page.locator('[data-scene-active="true"] img').evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        const img = image as HTMLImageElement;
        img.loading = 'eager';
        return img.decode().catch(() => undefined);
      }),
    ),
  );
  await page.screenshot({ path: test.info().outputPath('desktop-category.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await expect(page.locator('[data-shelf-morph-overlay]')).toBeAttached();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.getByRole('img', { name: 'Kit 1 - Box art' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('mobile-detail.png'), fullPage: true });
});

test('slow browser Back offers no backward cancel that could leave the application', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kit 1' })).toBeVisible();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/collection/shelves', async (route) => {
    await gate;
    await route.fallback();
  });
  try {
    await page.goBack();
    await expect(page.locator('[data-scene-active="true"] [data-shelf-skeleton]')).not.toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    release();
    await expect(page.getByRole('heading', { name: 'My Collection' })).toBeVisible();
    await expect(page).toHaveURL(/\/shelves$/);
  } finally {
    release();
  }
});

test('detail opens its source cover and metadata skeleton before data, then hydrates once', async ({
  page,
}) => {
  await mock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/collection\/1$/, async (route) => {
    await gate;
    await route.fallback();
  });
  await page.goto('/shelves');
  try {
    await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Kit 1', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Kit 1 - Box art', exact: true })).toBeVisible();
    await expect(
      page.locator('[data-scene-active="true"] [data-shelf-skeleton="metadata"]'),
    ).toBeVisible();
    const workspace = page.locator('[data-shelves-workspace]');
    await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
    await page.screenshot({ path: test.info().outputPath('detail-loading.png'), fullPage: true });
    await page.evaluate(() => {
      const phases: string[] = [];
      (window as unknown as { hydrationPhases: string[] }).hydrationPhases = phases;
      const root = document.querySelector('[data-shelves-workspace]')!;
      new MutationObserver(() =>
        phases.push(root.getAttribute('data-transition-phase') || ''),
      ).observe(root, { attributes: true, attributeFilter: ['data-transition-phase'] });
    });
    const heading = page.getByRole('heading', { name: 'Kit 1', exact: true });
    await heading.focus();
    const scroll = await page.evaluate(() => scrollY);
    release();
    await expect(page.getByText('Collection notes')).toBeVisible();
    expect(
      await page.getByRole('img', { name: 'Kit 1 - Box art', exact: true }).evaluate((node) => {
        let element: Element | null = node;
        while (element) {
          if (Number(getComputedStyle(element).opacity) < 0.99) return false;
          element = element.parentElement;
        }
        return true;
      }),
    ).toBe(true);
    await expect(page.locator('[data-scene-active="true"] [data-shelf-skeleton]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => (window as unknown as { hydrationPhases: string[] }).hydrationPhases,
      ),
    ).not.toContain('animating');
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await expect(page.getByRole('heading', { name: 'Kit 1', exact: true })).toBeFocused();
  } finally {
    release();
  }
});

test('wide and portrait shelf artwork keeps natural proportions without a padded frame', async ({
  page,
}) => {
  await mock(page);
  await page.route('https://example.com/kit-*.png', (route) => {
    const portrait = route.request().url().includes('kit-2.png');
    const width = portrait ? 100 : 300;
    const height = portrait ? 300 : 100;
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#945145"/></svg>`,
    });
  });
  await page.goto('/shelves');
  for (const id of [1, 2]) {
    const box = page.getByRole('link', { name: `Kit ${id}`, exact: true });
    const image = box.locator('img');
    await image.evaluate((img) => (img as HTMLImageElement).decode());
    const dimensions = await image.evaluate((node) => {
      const img = node as HTMLImageElement;
      const image = img.getBoundingClientRect();
      const card = img.parentElement!.getBoundingClientRect();
      return {
        ratio: image.width / image.height,
        natural: img.naturalWidth / img.naturalHeight,
        paddingX: card.width - image.width,
        paddingY: card.height - image.height,
      };
    });
    expect(dimensions.ratio).toBeCloseTo(dimensions.natural, 2);
    expect(dimensions.paddingX).toBeLessThanOrEqual(2.1);
    expect(dimensions.paddingY).toBeLessThanOrEqual(2.1);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await expect(page.getByRole('button', { name: 'Load more Gunpla' })).toBeVisible();
  const dimensions = await page
    .getByRole('link', { name: 'Kit 2', exact: true })
    .locator('img')
    .evaluate((node) => {
      const img = node as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      return { ratio: rect.width / rect.height, natural: img.naturalWidth / img.naturalHeight };
    });
  expect(dimensions.ratio).toBeCloseTo(dimensions.natural, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Back focus survives detail data hydration without moving scroll', async ({ page }) => {
  await mock(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/collection\/1$/, async (route) => {
    await gate;
    await route.fallback();
  });
  await page.goto('/shelves');
  try {
    await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
    const back = page.getByRole('link', { name: 'Back to shelves' });
    await back.focus();
    release();
    await expect(page.getByText('Collection notes')).toBeVisible();
    await expect(back).toBeFocused();
  } finally {
    release();
  }
});

async function mockClassic(page: Page) {
  await page.route('**/collection/filter*', (route) =>
    route.fulfill({
      json: {
        data: { collection_types: [], gunpla_grades: [], figures_scales: [], release_types: [] },
      },
    }),
  );
  await page.route('**/collection?*', (route) =>
    route.fulfill({ json: { data: { collections: [], total_count: 0 } } }),
  );
}
const statisticsData = { total_count: 30, completed_count: 30, backlog_count: 0, limited_count: 0 };

test('fresh statistics are reused across shelves, detail, classic and reload', async ({ page }) => {
  await mock(page);
  await mockClassic(page);
  let requests = 0;
  await page.route('**/collection/statistics*', async (route) => {
    requests++;
    await route.fulfill({ json: { data: statisticsData } });
  });
  await page.goto('/shelves');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await page.getByRole('link', { name: 'Back to Gunpla' }).click();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  expect(requests).toBe(1);
});

test('statistics refresh once when the five-minute cache expires', async ({ page }) => {
  await mock(page);
  let requests = 0;
  await page.route('**/collection/statistics*', async (route) => {
    requests++;
    await route.fulfill({ json: { data: statisticsData } });
  });
  await page.goto('/shelves');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const key = 'v2:collection_statistics';
    const entry = JSON.parse(localStorage.getItem(key)!);
    entry.timestamp = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(entry));
  });
  await page.reload();
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

test('failed statistics responses are not cached', async ({ page }) => {
  await mock(page);
  let requests = 0;
  await page.route('**/collection/statistics*', async (route) => {
    requests++;
    await route.fulfill(
      requests === 1 ? { status: 500, json: {} } : { json: { data: statisticsData } },
    );
  });
  await page.goto('/shelves');
  await expect.poll(() => requests).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('v2:collection_statistics'))).toBeNull();
  await page.reload();
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

test('unavailable storage still shares statistics across loading and mounted summaries', async ({
  page,
}) => {
  await mock(page);
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage unavailable', 'SecurityError');
      },
    }),
  );
  let requests = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/collection/statistics*', async (route) => {
    requests++;
    await gate;
    await route.fulfill({ json: { data: statisticsData } });
  });
  try {
    await page.goto('/shelves');
    await expect(page.getByRole('link', { name: 'View all Gunpla' })).toBeVisible();
    await expect.poll(() => requests).toBe(1);
    release();
    await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
    expect(requests).toBe(1);
  } finally {
    release();
  }
});

test('item hover and keyboard focus do not fetch detail data', async ({ page }) => {
  await mock(page);
  const ids: number[] = [];
  await page.route(/\/collection\/\d+$/, async (route) => {
    ids.push(Number(new URL(route.request().url()).pathname.split('/').pop()));
    await route.fallback();
  });
  await page.goto('/shelves');
  for (const id of [1, 2, 3]) {
    const link = page.getByRole('link', { name: `Kit ${id}`, exact: true });
    await link.hover();
    await link.focus();
  }
  expect(ids).toEqual([]);
  await page.getByRole('link', { name: 'Kit 3', exact: true }).click();
  await expect(page.getByText('Collection notes')).toBeVisible();
  expect(ids).toEqual([3]);
});

async function mockEditing(page: Page) {
  await mock(page);
  await mockClassic(page);
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    document.cookie = `jwt=header.${payload}.signature; Path=/`;
  });
  const record = {
    ...item(1),
    built_at: '2026-01-01T00:00:00Z',
    description: 'Collection notes',
    manufacturer: { id: 1, name: 'Bandai' },
    series: { id: 1, name: 'Gundam' },
    pictures: [],
    addons: [],
  };
  await page.route('**/collection/drawer*', (route) =>
    route.fulfill({
      json: {
        data: {
          collection_types: [{ id: 2, name: 'Gunpla' }],
          grades: [{ grade_id: 1, collection_type_name: 'Gunpla', grade_short_name: 'HG' }],
          scales: [{ id: 1, name: '1/144' }],
          release_types: [{ id: 1, name: 'Standard' }],
          manufacturers: [{ id: 1, name: 'Bandai' }],
          series: [{ id: 1, name: 'Gundam' }],
          features: [],
          modifications: [],
        },
      },
    }),
  );
  await page.route(/\/collection\/1$/, (route) => route.fulfill({ json: { data: record } }));
}

test('successful collection mutation invalidates statistics before the next visit', async ({
  page,
}) => {
  await mockEditing(page);
  let requests = 0;
  await page.route('**/collection/statistics*', async (route) => {
    requests++;
    await route.fulfill({ json: { data: statisticsData } });
  });
  await page.goto('/shelves');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  await page.goto('/collection/1/edit');
  await page.getByPlaceholder('Collection title').fill('Updated Kit');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/collections$/);
  expect(await page.evaluate(() => localStorage.getItem('v2:collection_statistics'))).toBeNull();
  await page.goto('/shelves');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

test('wide and portrait covers keep their proportions throughout navigation motion', async ({
  page,
}) => {
  await mock(page);
  await page.route('https://example.com/kit-*.png', (route) => {
    const portrait = route.request().url().includes('kit-2.png');
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 100 : 300}" height="${portrait ? 300 : 100}"><rect width="100%" height="100%" fill="#945145"/></svg>`,
    });
  });
  await page.goto('/shelves');
  for (const id of [1, 2]) {
    const link = page.getByRole('link', { name: `Kit ${id}`, exact: true });
    await link.locator('img').evaluate((node) => (node as HTMLImageElement).decode());
    await link.click();
    const overlay = page.locator('[data-shelf-morph-overlay]');
    await expect(overlay).toBeAttached();
    const ratios = await overlay.evaluate(async (node) => {
      const ratios: number[] = [];
      for (let frame = 0; frame < 5; frame++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (node.isConnected) {
          const bounds = node.getBoundingClientRect();
          ratios.push(bounds.width / bounds.height);
        }
      }
      return ratios;
    });
    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) expect(ratio).toBeCloseTo(id === 2 ? 1 / 3 : 3, 2);
    await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
      'data-transition-phase',
      'settled',
    );
    await expect(overlay).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to shelves' }).click();
    await expect(link).toBeFocused();
    await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
      'data-transition-phase',
      'settled',
    );
  }
});

test('statistics started before a mutation cannot overwrite the refreshed cache', async ({
  page,
}) => {
  await mockEditing(page);
  let requests = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/collection/statistics*', async (route) => {
    const request = ++requests;
    if (request === 1) await gate;
    await route.fulfill({
      json: { data: { ...statisticsData, total_count: request === 1 ? 30 : 31 } },
    });
  });
  try {
    await page.goto('/shelves');
    await expect.poll(() => requests).toBe(1);
    await page.evaluate(() => {
      history.pushState(
        { idx: (history.state?.idx || 0) + 1, key: 'pending-stat-edit', usr: null },
        '',
        '/collection/1/edit',
      );
      dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    });
    await page.getByPlaceholder('Collection title').fill('Updated Kit');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/collections$/);
    await page.getByRole('link', { name: 'Go to Hobby Collection home page' }).click();
    await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem('v2:collection_statistics')!).data.total_count,
        ),
      )
      .toBe(31);
    const oldResponse = page.waitForResponse((response) =>
      response.url().includes('/collection/statistics'),
    );
    release();
    const response = await oldResponse;
    await response.finished();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('v2:collection_statistics')!).data.total_count,
      ),
    ).toBe(31);
    expect(requests).toBe(2);
  } finally {
    release();
  }
});

test('interrupted cover Back and Forward settles only the latest scene', async ({ page }) => {
  await mock(page);
  await page.goto('/shelves');
  const item = page.getByRole('link', { name: 'Kit 1', exact: true });
  await item.locator('img').evaluate((node) => (node as HTMLImageElement).decode());
  await item.click();
  await expect(page.locator('[data-shelf-morph-overlay]')).toBeAttached();
  for (let index = 0; index < 2; index++) {
    await page.goBack();
    await expect(page).toHaveURL(/\/shelves$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/shelves\/collection\/1\/kit-1$/);
  }
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.locator('[data-scene-active="true"]')).toHaveCount(1);
  await expect(page.locator('[data-shelf-morph-overlay]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Kit 1', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Kit 1 - Box art', exact: true })).toBeVisible();
});

for (const origin of ['overview', 'category'] as const) {
  for (const method of ['link', 'browser'] as const) {
    test(`selected photo blends back to ${origin} with ${method} Back`, async ({ page }) => {
      await mock(page);
      await page.route('https://example.com/**', (route) => {
        const photo = route.request().url().endsWith('/build.png');
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="${photo ? 100 : 300}" height="${photo ? 300 : 100}"><rect width="100%" height="100%" fill="${photo ? '#295779' : '#a84935'}"/></svg>`,
        });
      });
      const id = origin === 'category' ? 25 : 1;
      await page.goto(origin === 'category' ? '/shelves/category/gunpla' : '/shelves');
      if (origin === 'category') await loadAll(page);
      const item = page.getByRole('link', { name: `Kit ${id}`, exact: true });
      await item.scrollIntoViewIfNeeded();
      await item.locator('img').evaluate((node) => (node as HTMLImageElement).decode());
      await item.click();
      await page.getByRole('button', { name: 'Show photo 2' }).click();
      await page
        .getByRole('img', { name: `Kit ${id} - Photo 2`, exact: true })
        .evaluate((node) => (node as HTMLImageElement).decode());
      if (method === 'browser') await page.goBack();
      else
        await page
          .getByRole('link', { name: origin === 'category' ? 'Back to Gunpla' : 'Back to shelves' })
          .click();
      const source = page.locator('[data-shelf-morph-overlay]');
      const destination = page.locator('[data-shelf-morph-blend]');
      await expect(source).toBeAttached();
      await expect(destination).toBeAttached();
      await expect(source.locator('img')).toHaveAttribute('src', /build\.png/);
      await expect(destination.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`kit-${id}\\.png`),
      );
      const ratios = await page.evaluate(() =>
        ['[data-shelf-morph-overlay]', '[data-shelf-morph-blend]'].map((selector) => {
          const rect = document.querySelector(selector)!.getBoundingClientRect();
          return rect.width / rect.height;
        }),
      );
      expect(ratios[0]).toBeCloseTo(1 / 3, 2);
      expect(ratios[1]).toBeCloseTo(3, 2);
      await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
        'data-transition-phase',
        'settled',
      );
      await expect(source).toHaveCount(0);
      await expect(destination).toHaveCount(0);
      await expect(item).toBeFocused();
      await expect(item.locator('img')).toBeVisible();
    });
  }
}

test('shelves detail follows v1 gallery layout and removes duplicate visible labels', async ({
  page,
}) => {
  await mock(page);
  const description = 'A detailed collection note with paintwork and assembly information. '.repeat(
    70,
  );
  await page.route(/\/collection\/1$/, (route) =>
    route.fulfill({
      json: {
        data: {
          ...item(1),
          description,
          pictures: ['https://example.com/build.png'],
          manufacturer: { id: 1, name: 'Bandai' },
          series: { id: 1, name: 'Gundam' },
          release_type: { id: 1, name: 'P-Bandai' },
          addons: [{ name: 'Stand', manufacturer: { name: 'Bandai' } }],
          features: [{ id: 1, name: 'Articulated' }],
          modifications: [{ id: 2, name: 'Painted' }],
        },
      },
    }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/shelves/collection/1/kit-1');
  await expect(page.getByRole('button', { name: 'Show photo 2' })).toBeVisible();
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Grade', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Release', { exact: true })).toHaveCount(0);
  await expect(page.getByText('HG', { exact: true })).toHaveCount(1);
  await expect(page.getByText('P-Bandai', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Box art - 1 of 2', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View more', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View less', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View less', exact: true }).click();
  const desktop = await page.evaluate(() => {
    const gallery = document.querySelector('[data-detail-gallery]')!.getBoundingClientRect();
    const info = document.querySelector('[data-detail-information]')!.getBoundingClientRect();
    return { galleryRight: gallery.right, infoLeft: info.left };
  });
  expect(desktop.galleryRight).toBeLessThanOrEqual(desktop.infoLeft + 1);
  await page.screenshot({ path: test.info().outputPath('v1-detail-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({
    galleryBottom: document.querySelector('[data-detail-gallery]')!.getBoundingClientRect().bottom,
    titleTop: document.querySelector('h1')!.getBoundingClientRect().top,
    heroHeight: document.querySelector('[data-gallery-item]')!.getBoundingClientRect().height,
    viewport: innerHeight,
  }));
  expect(mobile.titleTop).toBeGreaterThanOrEqual(mobile.galleryBottom);
  expect(mobile.heroHeight).toBeCloseTo(mobile.viewport * 0.55, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('v1-detail-mobile.png'), fullPage: true });
});

test('photo exit with reduced motion returns without overlay or stale scene', async ({ page }) => {
  await mock(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await page.getByRole('button', { name: 'Show photo 2' }).click();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.locator('[data-shelf-morph-overlay], [data-shelf-morph-blend]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeFocused();
});

test('an unavailable selected photo uses a safe exit fallback', async ({ page }) => {
  await mock(page);
  await page.route('https://example.com/build.png', (route) => route.abort());
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await page.getByRole('button', { name: 'Show photo 2' }).click();
  await expect(page.getByText('Image unavailable', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeFocused();
});

test('long thumbnail strips keep the selected photo visible and support dragging', async ({
  page,
}) => {
  await mock(page);
  await page.route(/\/collection\/1$/, (route) =>
    route.fulfill({
      json: {
        data: {
          ...item(1),
          pictures: Array.from(
            { length: 15 },
            (_, index) => `https://example.com/photo-${index}.png`,
          ),
        },
      },
    }),
  );
  await page.goto('/shelves/collection/1/kit-1');
  for (let index = 0; index < 15; index++)
    await page.getByRole('button', { name: 'Next image', exact: true }).click();
  await expect(page.getByText('16 / 16', { exact: true })).toBeVisible();
  const strip = page.locator('[data-gallery-thumbnails]');
  const position = await page
    .getByRole('button', { name: 'Show photo 16', exact: true })
    .evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const viewport = node.closest('[data-gallery-thumbnails]')!.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, start: viewport.left, end: viewport.right };
    });
  expect(position.left).toBeGreaterThanOrEqual(position.start - 1);
  expect(position.right).toBeLessThanOrEqual(position.end + 1);
  const before = await strip.evaluate((node) => node.scrollLeft);
  const bounds = await strip.boundingBox();
  await page.mouse.move(bounds!.x + 40, bounds!.y + 20);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 180, bounds!.y + 20, { steps: 8 });
  await page.mouse.up();
  expect(await strip.evaluate((node) => node.scrollLeft)).toBeLessThan(before - 80);
  await expect(page.getByText('16 / 16', { exact: true })).toBeVisible();
});

test('Back and Forward interruption during a photo blend cleans up both image layers', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await page.getByRole('button', { name: 'Show photo 2' }).click();
  await page
    .getByRole('img', { name: 'Kit 1 - Photo 2', exact: true })
    .evaluate((node) => (node as HTMLImageElement).decode());
  await page.goBack();
  await expect(page.locator('[data-shelf-morph-blend]')).toBeAttached();
  await page.goForward();
  await expect(page).toHaveURL(/\/shelves\/collection\/1\/kit-1$/);
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.locator('[data-scene-active="true"]')).toHaveCount(1);
  await expect(page.locator('[data-shelf-morph-overlay], [data-shelf-morph-blend]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeFocused();
});

test('retains overview and category instances and loaded rows through detail', async ({ page }) => {
  await mock(page);
  await page.goto('/shelves');
  const workspace = page.locator('[data-shelves-workspace]');
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  await page.locator('[data-shelf-scene="/shelves"]').evaluate((node) => {
    (window as unknown as { savedOverview: Element }).savedOverview = node;
  });
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await loadAll(page);
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  const item = page.getByRole('link', { name: 'Kit 25', exact: true });
  await item.scrollIntoViewIfNeeded();
  await item.evaluate((node) => {
    (window as unknown as { savedItem: Element }).savedItem = node;
  });
  await item.click();
  await expect(page.getByText('Collection notes')).toBeVisible();
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  await expect(page.locator('[data-shelf-scene]')).toHaveCount(3);
  await expect(page.locator('[data-shelf-scene="/shelves/category/gunpla"]')).toHaveAttribute(
    'inert',
    '',
  );
  await expect(page.locator('[data-shelf-scene="/shelves/category/gunpla"]')).toBeHidden();
  await page.getByRole('link', { name: 'Back to Gunpla' }).click();
  await expect(item).toBeFocused();
  expect(
    await item.evaluate((node) => node === (window as unknown as { savedItem: Element }).savedItem),
  ).toBe(true);
  await expect(page.getByRole('link', { name: 'Kit 30', exact: true })).toBeAttached();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(workspace).toHaveAttribute('data-transition-phase', 'settled');
  expect(
    await page
      .locator('[data-shelf-scene="/shelves"]')
      .evaluate((node) => node === (window as unknown as { savedOverview: Element }).savedOverview),
  ).toBe(true);
  await expect(page.locator('[data-shelf-scene]')).toHaveCount(2);
});

test('evicts an older category after departure while keeping a bounded workspace', async ({
  page,
}) => {
  await mock(page);
  await page.route('**/collection/shelves*', async (route) => {
    const category = new URL(route.request().url()).searchParams.get('category');
    const data = envelope();
    data.data.figure_shelf = { id: 1, name: 'Figure', count: 7, items: [item(101)] };
    if (category === 'figure') data.data.figure_shelf.count = 1;
    await route.fulfill({ json: data });
  });
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await page.getByRole('link', { name: 'View all Figure' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.locator('[data-shelf-scene="/shelves/category/gunpla"]')).toHaveCount(0);
  await expect(page.locator('[data-shelf-scene]')).toHaveCount(2);
  await page.getByRole('link', { name: 'Kit 101', exact: true }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await expect(page.locator('[data-shelf-scene]')).toHaveCount(3);
});

test('lazy page modules are requested only when entering or warming their route', async ({
  page,
}) => {
  await mock(page);
  await mockClassic(page);
  const modules: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      /\/src\/pages\/(collection_shelf|collection_shelf_detail)(?:\/index\.tsx|\/category\.tsx)$/.test(
        path,
      )
    )
      modules.push(path);
  });
  await page.goto('/');
  await expect(page.getByText('Total Items', { exact: true })).toBeVisible();
  expect(modules).toEqual([]);
  await page.getByRole('button', { name: 'Switch to Shelves View' }).click();
  await expect(page.getByRole('link', { name: 'View all Gunpla' })).toBeVisible();
  expect(modules).toContain('/src/pages/collection_shelf/index.tsx');
  expect(modules).not.toContain('/src/pages/collection_shelf_detail/index.tsx');
});

test('content groups depart and return around the selected box', async ({ page }) => {
  await mock(page);
  await page.goto('/shelves');
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  const outgoing = page.locator('[data-shelf-scene="/shelves"]');
  const moved = await outgoing.evaluate(async (root) => {
    const node = root.querySelector('[data-scene-part="summary"]')!;
    for (let i = 0; i < 6; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return {
      opacity: Number(getComputedStyle(node).opacity),
      transform: getComputedStyle(node).transform,
      headerOpacity: Number(
        getComputedStyle(
          root.querySelector('[data-part-category="gunpla"] [data-scene-part="information"]')!,
        ).opacity,
      ),
    };
  });
  expect(moved.opacity).toBeLessThan(1);
  expect(moved.transform).not.toBe('none');
  expect(moved.headerOpacity).toBeLessThan(1);
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  const returned = await outgoing
    .locator('[data-scene-part="summary"]')
    .evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(returned).toBe(1);
  await expect(page.getByRole('link', { name: 'Kit 1', exact: true })).toBeFocused();
});

test('retained category rechecks stale pages once without replaying deep pagination', async ({
  page,
}) => {
  const offsets = await mock(page);
  await page.goto('/shelves/category/gunpla');
  await loadAll(page);
  await page.getByRole('link', { name: 'Kit 25', exact: true }).click();
  await expect(page.getByText('Collection notes')).toBeVisible();
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('shelves:pages:')) {
        const entry = JSON.parse(sessionStorage.getItem(key)!);
        entry.time = 0;
        sessionStorage.setItem(key, JSON.stringify(entry));
      }
    for (const key of Object.keys(localStorage))
      if (key.startsWith('v2:collection_shelves_')) {
        const entry = JSON.parse(localStorage.getItem(key)!);
        entry.timestamp = 0;
        localStorage.setItem(key, JSON.stringify(entry));
      }
  });
  await page.getByRole('link', { name: 'Back to Gunpla' }).click();
  await expect(page.getByRole('link', { name: 'Kit 12', exact: true })).toBeAttached();
  await expect(page.getByRole('link', { name: 'Kit 25', exact: true })).toHaveCount(0);
  expect(offsets.filter((offset) => offset > 0)).toEqual([12, 24]);
  expect(offsets.filter((offset) => offset === 0).length).toBe(2);
});

test('dormant category disconnects observers and ignores later observer notifications', async ({
  page,
}) => {
  await mock(page, 'normal', true);
  await page.addInitScript(() => {
    const callbacks = new Map<object, IntersectionObserverCallback>();
    (
      window as unknown as { categoryCallbacks: Map<object, IntersectionObserverCallback> }
    ).categoryCallbacks = callbacks;
    class Observer {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() {
        callbacks.set(this, this.callback);
      }
      disconnect() {
        callbacks.delete(this);
      }
      unobserve() {
        callbacks.delete(this);
      }
      takeRecords() {
        return [];
      }
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
    }
    Object.defineProperty(window, 'IntersectionObserver', { value: Observer, configurable: true });
  });
  let requests = 0;
  await page.route('**/collection/shelves?*', async (route) => {
    requests++;
    await route.fallback();
  });
  await page.goto('/shelves/category/gunpla');
  await expect(page.getByRole('link', { name: 'Kit 12', exact: true })).toBeAttached();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { categoryCallbacks: Map<object, unknown> }).categoryCallbacks.size,
      ),
    )
    .toBe(1);
  await page.getByRole('link', { name: 'Kit 1', exact: true }).click();
  await expect(page.getByText('Collection notes')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { categoryCallbacks: Map<object, unknown> }).categoryCallbacks.size,
      ),
    )
    .toBe(0);
  expect(requests).toBe(1);
});

test('a retained overview clears its old error when warmup supplies fresh data', async ({
  page,
}) => {
  await mock(page);
  let fail = true;
  await page.route('**/collection/shelves', (route) =>
    fail ? route.fulfill({ status: 500, json: {} }) : route.fallback(),
  );
  await page.goto('/shelves/category/gunpla');
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.getByText('Failed to load collection shelves.')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 })).toBeVisible();
  fail = false;
  await page.getByRole('link', { name: 'Back to shelves' }).focus();
  await expect
    .poll(() => page.evaluate(() => Boolean(localStorage.getItem('v2:collection_shelves'))))
    .toBe(true);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.getByRole('link', { name: 'View all Gunpla' })).toBeVisible();
  await expect(page.getByText('Failed to load collection shelves.')).toHaveCount(0);
});

test('browser departures remember a newly scrolled overview viewport', async ({ page }) => {
  await mock(page);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/shelves');
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  const position = await page.evaluate(() => {
    scrollTo(0, 120);
    return scrollY;
  });
  expect(position).toBeGreaterThan(0);
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Gunpla', exact: true, level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
});

test('the floating view switch stays near its viewport corner during departure and return', async ({
  page,
}) => {
  await mock(page);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/shelves');
  const toggle = page.getByRole('button', { name: 'Switch to Classic View' });
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  const original = await toggle.boundingBox();
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  const departing = await page
    .locator('[data-shelf-scene="/shelves"] #view-toggle-btn')
    .boundingBox();
  if (departing) {
    expect(Math.abs(departing.x - original!.x)).toBeLessThan(25);
    expect(Math.abs(departing.y - original!.y)).toBeLessThan(25);
  }
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
  const returned = await toggle.boundingBox();
  expect(returned!.x).toBeCloseTo(original!.x, 0);
  expect(returned!.y).toBeCloseTo(original!.y, 0);
});

for (const width of [1280, 390]) {
  test(`category shows its backend name and count once at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mock(page, 'normal', false, 'Backend shelf name');
    await page.goto('/shelves/category/gunpla');
    await loadAll(page);
    const category = page.locator('[data-shelf-scene="/shelves/category/gunpla"]');
    await expect(category.getByRole('heading', { level: 2 })).toHaveCount(0);
    await expect(category.getByText('30 items', { exact: true })).toHaveCount(1);
    await expect(category.getByRole('heading', { level: 1 })).toHaveText('Backend shelf name');
    await expect(category.getByRole('link', { name: 'Kit 30', exact: true })).toBeVisible();
    await page.reload();
    await expect(category.getByRole('heading', { level: 1 })).toHaveText('Backend shelf name');
  });
}

async function motionSample(page: Page, selectors: string[]) {
  return page.locator('[data-shelf-scene="/shelves"]').evaluate(async (root, parts) => {
    for (let i = 0; i < 4; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return parts.map((selector) => {
      const node = root.querySelector(selector)!;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      return { x: matrix.m41, y: matrix.m42 };
    });
  }, selectors);
}

async function settledWorkspace(page: Page) {
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
}

test('category shelves depart vertically away from the selected shelf and return along the same paths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1500 });
  await mock(page);
  await page.route('**/collection/shelves*', (route) => {
    const data = envelope();
    data.data.figure_shelf = { id: 1, name: 'Figure', count: 30, items: [item(101), item(102)] };
    data.data.other_model_kit_shelf = {
      id: 0,
      name: 'Other Model Kit',
      count: 2,
      items: [item(201)],
    };
    return route.fulfill({ json: data });
  });
  await page.goto('/shelves');
  await settledWorkspace(page);
  const selectors = [
    '[data-scene-part="shelf"][data-part-category="gunpla"]',
    '[data-scene-part="shelf"][data-part-category="other-model-kit"]',
  ];
  await page.getByRole('link', { name: 'View all Figure' }).click();
  const departing = await motionSample(page, selectors);
  expect(departing[0].y).toBeLessThan(-1);
  expect(departing[1].y).toBeGreaterThan(1);
  expect(departing.every((part) => part.x === 0)).toBe(true);
  await settledWorkspace(page);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  const returning = await motionSample(page, selectors);
  expect(returning[0].y).toBeLessThan(0);
  expect(returning[1].y).toBeGreaterThan(0);
  await settledWorkspace(page);
});

test('mixed-height boxes on the selected row spread sideways and return from the same sides', async ({
  page,
}) => {
  await mock(page);
  await page.route('https://example.com/kit-2.png', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="400"><rect width="80" height="400" fill="red"/></svg>',
    }),
  );
  await page.route('https://example.com/kit-3.png', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80"><rect width="400" height="80" fill="blue"/></svg>',
    }),
  );
  await page.goto('/shelves');
  await expect(page.getByRole('img', { name: 'Kit 2', exact: true })).toBeVisible();
  await settledWorkspace(page);
  const selectors = ['[data-part-item="2"]', '[data-part-item="4"]'];
  await page.getByRole('link', { name: 'Kit 3', exact: true }).click();
  const departing = await motionSample(page, selectors);
  expect(departing[0].x).toBeLessThan(-1);
  expect(departing[1].x).toBeGreaterThan(1);
  expect(departing.every((part) => part.y === 0)).toBe(true);
  await settledWorkspace(page);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  const returning = await motionSample(page, selectors);
  expect(returning[0].x).toBeLessThan(0);
  expect(returning[1].x).toBeGreaterThan(0);
  expect(returning.every((part) => part.y === 0)).toBe(true);
  await settledWorkspace(page);
});

for (const path of ['/collection/1/kit-1', '/shelves/collection/1/kit-1']) {
  for (const width of [1280, 390]) {
    test(`description preserves whitespace as inert plain text on ${path} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await mock(page);
      const description =
        '  Whitespace description  with  spaces\n\n    Indented line\n\tTabbed line\n<script>window.__descriptionExecuted = true</script>\n<img src="/injected-description-image" onerror="window.__descriptionExecuted = true">\n<svg onload="window.__descriptionExecuted = true"></svg>\n<a href="javascript:window.__descriptionExecuted = true">Unsafe link</a>\n' +
        'Unbroken'.repeat(70) +
        '\n  ';
      let injectedRequests = 0;
      await page.route('**/injected-description-image', (route) => {
        injectedRequests++;
        return route.fulfill({ status: 404, body: '' });
      });
      await page.route(/\/collection\/1$/, (route) =>
        route.fulfill({
          json: {
            data: {
              ...item(1),
              description,
              pictures: ['https://example.com/build.png'],
              manufacturer: { id: 1, name: 'Bandai' },
            },
          },
        }),
      );
      await page.goto(path);
      const text = page.locator('p').filter({ hasText: 'Whitespace description' });
      await expect(text).toBeVisible();
      expect(await text.textContent()).toBe(description);
      await expect(text).toHaveCSS('white-space', 'pre-wrap');
      await expect(text).toHaveCSS('overflow-wrap', 'anywhere');
      await expect(page.getByRole('button', { name: 'View more', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'View more', exact: true }).click();
      expect(await text.textContent()).toBe(description);
      expect(await text.evaluate((node) => node.childElementCount)).toBe(0);
      expect(
        await page.evaluate(() => Reflect.get(window, '__descriptionExecuted')),
      ).toBeUndefined();
      expect(injectedRequests).toBe(0);
      expect(await text.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      await page.getByRole('button', { name: 'View less', exact: true }).click();
      expect(await text.textContent()).toBe(description);
    });
  }
}

async function startArtworkFrames(page: Page, id = 1) {
  await page.evaluate((itemId) => {
    const frames: { opacity: number; bridge: boolean; phase: string | null }[] = [];
    let stopped = false;
    Reflect.set(window, '__shelfArtworkFrames', {
      frames,
      stop: () => {
        stopped = true;
      },
    });
    const tick = () => {
      let opacity = 0;
      for (const image of document.querySelectorAll<HTMLImageElement>(
        `img[data-shelf-morph="cover-${itemId}"], [data-category-bridge-item="cover-${itemId}"] img`,
      )) {
        if (!image.complete || !image.naturalWidth) continue;
        const rect = image.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) continue;
        let alpha = 1;
        for (let node: HTMLElement | null = image; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') {
            alpha = 0;
            break;
          }
          alpha *= Number(style.opacity);
        }
        opacity = Math.max(opacity, alpha);
      }
      frames.push({
        opacity,
        bridge: Boolean(document.querySelector('[data-category-bridge]')),
        phase:
          document
            .querySelector('[data-shelves-workspace]')
            ?.getAttribute('data-transition-phase') || null,
      });
      if (!stopped) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, id);
}
async function stopArtworkFrames(page: Page) {
  return page.evaluate(() => {
    const capture = Reflect.get(window, '__shelfArtworkFrames') as {
      frames: { opacity: number; bridge: boolean; phase: string | null }[];
      stop: () => void;
    };
    capture.stop();
    return capture.frames;
  });
}

for (const width of [1280, 390]) {
  test(`selected shelf artwork stays painted across lazy category handoff and return at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mock(page);
    await page.route('https://example.com/kit-1.png', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="orange"/></svg>',
      }),
    );
    let releaseCode = () => {};
    let releaseData = () => {};
    const codeGate = new Promise<void>((resolve) => {
      releaseCode = resolve;
    });
    const dataGate = new Promise<void>((resolve) => {
      releaseData = resolve;
    });
    await page.route(
      /(?:\/src\/pages\/collection_shelf\/category\.tsx|\/assets\/category-[^/]+\.js)(?:\?.*)?$/,
      async (route) => {
        await codeGate;
        await route.continue();
      },
    );
    await page.route('**/collection/shelves*', async (route) => {
      if (new URL(route.request().url()).searchParams.has('category')) await dataGate;
      await route.fallback();
    });
    try {
      await page.goto('/shelves');
      await settledWorkspace(page);
      await expect
        .poll(() =>
          page
            .getByRole('img', { name: 'Kit 1', exact: true })
            .evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBe(400);
      await startArtworkFrames(page);
      await page.getByRole('link', { name: 'View all Gunpla' }).click();
      await expect(page.locator('[data-category-bridge-item="cover-1"]')).toBeVisible();
      const ratio = await page.locator('[data-category-bridge-item="cover-1"]').evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width / rect.height;
      });
      expect(ratio).toBeCloseTo(2, 1);
      await expect(
        page.locator('[data-scene-active="true"] [data-part-item="1"] [role="group"]'),
      ).toHaveCSS('visibility', 'hidden');
      await page.screenshot({ path: test.info().outputPath('category-moving.png') });
      await expect(
        page.locator('[data-scene-active="true"] [data-shelf-skeleton]'),
      ).not.toHaveCount(0);
      releaseCode();
      await settledWorkspace(page);
      await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
      releaseData();
      await expect(page.getByRole('link', { name: 'Kit 12', exact: true })).toBeVisible();
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++)
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      });
      const entry = await stopArtworkFrames(page);
      expect(entry.some((frame) => frame.bridge)).toBe(true);
      expect(entry.filter((frame) => frame.opacity < 0.99)).toEqual([]);
      await startArtworkFrames(page);
      await page.getByRole('link', { name: 'Back to shelves' }).click();
      await settledWorkspace(page);
      const exit = await stopArtworkFrames(page);
      expect(exit.some((frame) => frame.bridge)).toBe(true);
      expect(exit.filter((frame) => frame.opacity < 0.99)).toEqual([]);
    } finally {
      releaseCode();
      releaseData();
    }
  });
}

test('stationary shared artwork completes the bridge and interrupted category navigation cleans up', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves');
  await settledWorkspace(page);
  await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    const source = document
      .querySelector('img[data-shelf-morph="cover-1"]')!
      .getBoundingClientRect();
    Element.prototype.getBoundingClientRect = function () {
      if (
        this.matches('img[data-shelf-morph="cover-1"]') &&
        this.closest('[data-shelf-scene="/shelves/category/gunpla"]')
      )
        return new DOMRect(source.x, source.y, source.width, source.height);
      return original.call(this);
    };
    Reflect.set(window, '__restoreShelfBounds', () => {
      Element.prototype.getBoundingClientRect = original;
    });
  });
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await settledWorkspace(page);
  await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
  await page.evaluate(() => Reflect.get(window, '__restoreShelfBounds')());
  await page.goBack();
  await page.goForward();
  await page.goBack();
  await settledWorkspace(page);
  await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
  await expect(page.locator('[data-scene-active="true"]')).toHaveAttribute(
    'data-shelf-scene',
    '/shelves',
  );
});

test('partially scrolled shelf artwork retains its clipping during category movement', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mock(page);
  await page.goto('/shelves');
  await settledWorkspace(page);
  await page
    .locator('[data-shelf-scroll]')
    .first()
    .evaluate((row) => {
      row.scrollLeft = 50;
    });
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  const bridge = page.locator('[data-category-bridge-item="cover-1"]');
  await expect(bridge).toBeVisible();
  const clip = await bridge.evaluate((node) => getComputedStyle(node).clipPath);
  expect(clip).toMatch(/^inset/);
  expect(parseFloat(clip.match(/[\d.]+%/g)!.at(-1)!)).toBeGreaterThan(0);
  await settledWorkspace(page);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await settledWorkspace(page);
  expect(
    await page
      .locator('[data-scene-active="true"] [data-shelf-scroll]')
      .first()
      .evaluate((row) => row.scrollLeft),
  ).toBe(50);
});

test('shelves links keep keyboard focus visible without leaving pointer outlines', async ({
  page,
}) => {
  await mock(page);
  await page.goto('/shelves');
  await settledWorkspace(page);
  const viewAll = page.getByRole('link', { name: 'View all Gunpla' });
  await page.keyboard.press('Tab');
  await viewAll.focus();
  await expect(viewAll).toHaveCSS('outline-style', 'solid');
  await expect(viewAll).toHaveCSS('outline-width', '2px');
  await page.keyboard.press('Enter');
  await settledWorkspace(page);
  const back = page.getByRole('link', { name: 'Back to shelves' });
  await back.focus();
  await expect(back).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await settledWorkspace(page);
  await expect(viewAll).toBeFocused();
  await expect(viewAll).toHaveCSS('outline-style', 'solid');
  await viewAll.click();
  await settledWorkspace(page);
  await back.click();
  await settledWorkspace(page);
  await expect(viewAll).toBeFocused();
  await expect(viewAll).toHaveCSS('outline-style', 'none');
  const item = page.getByRole('link', { name: 'Kit 1', exact: true });
  await page.keyboard.press('Tab');
  await item.focus();
  await expect(item).toHaveCSS('outline-style', 'solid');
  await item.click();
  const outgoingItem = page.locator('[data-scene-departing="true"] [data-shelf-anchor="item-1"]');
  await expect(outgoingItem).toHaveCSS('outline-style', 'none');
  await settledWorkspace(page);
  await page.getByRole('link', { name: 'Back to shelves' }).click();
  await settledWorkspace(page);
  await expect(item).toBeFocused();
  await expect(item).toHaveCSS('outline-style', 'none');
});

async function mockThreeShelves(page: Page) {
  await mock(page);
  let figureRequests = 0;
  await page.route('**/collection/shelves*', (route) => {
    const category = new URL(route.request().url()).searchParams.get('category');
    if (category === 'figure') figureRequests++;
    const count = category ? 12 : 6;
    const data = envelope(
      Array.from({ length: count }, (_, index) => item(index + 1)),
      12,
    );
    data.data.figure_shelf = {
      id: 1,
      name: 'Figure',
      count: 12,
      items: Array.from({ length: count }, (_, index) => item(index + 101)),
    };
    data.data.other_model_kit_shelf = {
      id: 0,
      name: 'Other Model Kit',
      count: 12,
      items: Array.from({ length: count }, (_, index) => item(index + 201)),
    };
    return route.fulfill({ json: data });
  });
  return () => figureRequests;
}
interface NeighborFrame {
  above: number;
  below: number;
  aboveOpacity: number;
  belowOpacity: number;
  artwork: { x: number; y: number; width: number; height: number } | null;
  summaryY: number;
}
async function startNeighborFrames(page: Page) {
  await page.evaluate(() => {
    const frames: NeighborFrame[] = [];
    let stopped = false;
    Reflect.set(window, '__neighborFrames', {
      frames,
      stop: () => {
        stopped = true;
      },
    });
    const tick = () => {
      const root = document.querySelector('[data-shelf-scene="/shelves"]');
      const above = root?.querySelector('[data-scene-part="shelf"][data-part-category="gunpla"]');
      const below = root?.querySelector(
        '[data-scene-part="shelf"][data-part-category="other-model-kit"]',
      );
      const summary = root?.querySelector('[data-scene-part="summary"]');
      const art = document
        .querySelector('[data-category-bridge-item="cover-101"]')
        ?.getBoundingClientRect();
      if (above && below && summary) {
        const a = getComputedStyle(above),
          b = getComputedStyle(below);
        frames.push({
          above: new DOMMatrixReadOnly(a.transform).m42,
          below: new DOMMatrixReadOnly(b.transform).m42,
          aboveOpacity: Number(a.opacity),
          belowOpacity: Number(b.opacity),
          artwork: art ? { x: art.x, y: art.y, width: art.width, height: art.height } : null,
          summaryY: new DOMMatrixReadOnly(getComputedStyle(summary).transform).m42,
        });
      }
      if (!stopped) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
async function assertNeighborSpread(page: Page, artwork = false, summary = false) {
  const frames = await page.evaluate(() => {
    const sample = Reflect.get(window, '__neighborFrames') as {
      frames: NeighborFrame[];
      stop: () => void;
    };
    sample.stop();
    return sample.frames;
  });
  expect(
    frames.some(
      (frame) => frame.above < -2 && frame.aboveOpacity > 0.01 && frame.aboveOpacity < 0.99,
    ),
    'shelf above the selected shelf must move upward while fading',
  ).toBe(true);
  expect(
    frames.some(
      (frame) => frame.below > 2 && frame.belowOpacity > 0.01 && frame.belowOpacity < 0.99,
    ),
    'shelf below the selected shelf must move downward while fading',
  ).toBe(true);
  if (artwork) {
    const positions = frames.flatMap((frame) => (frame.artwork ? [frame.artwork] : []));
    expect(positions.length).toBeGreaterThan(3);
    const changes = (['x', 'y', 'width', 'height'] as const).map(
      (dimension) =>
        Math.max(...positions.map((rect) => rect[dimension])) -
        Math.min(...positions.map((rect) => rect[dimension])),
    );
    expect(Math.max(...changes)).toBeGreaterThan(2);
  }
  if (summary)
    expect(
      Math.max(...frames.map((frame) => frame.summaryY)) -
        Math.min(...frames.map((frame) => frame.summaryY)),
    ).toBeGreaterThan(2);
}

for (const width of [1280, 390]) {
  for (const back of ['button', 'browser'] as const) {
    test(`scrolled neighboring shelves spread on five cached ${back} cycles at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 });
      const figureRequests = await mockThreeShelves(page);
      await page.goto('/shelves');
      await settledWorkspace(page);
      await expect
        .poll(() =>
          page
            .locator('[data-scene-active="true"] img')
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      await page
        .locator('[data-scene-active="true"] section')
        .first()
        .evaluate((node) => Reflect.set(window, '__retainedReplayShelf', node));
      let generation = Number(
        await page.locator('[data-shelves-workspace]').getAttribute('data-transition-generation'),
      );
      for (let cycle = 0; cycle < 5; cycle++) {
        await page.evaluate(() => scrollTo(0, 350));
        const position = await page.evaluate(() => scrollY);
        const below = page.locator(
          '[data-scene-active="true"] [data-scene-part="shelf"][data-part-category="other-model-kit"]',
        );
        expect(await below.evaluate((node) => node.getBoundingClientRect().top)).toBeLessThan(700);
        await startNeighborFrames(page);
        if (back === 'browser' && cycle > 0) await page.goForward();
        else await page.getByRole('link', { name: 'View all Figure' }).click();
        await settledWorkspace(page);
        await assertNeighborSpread(page, true);
        const nextGeneration = Number(
          await page.locator('[data-shelves-workspace]').getAttribute('data-transition-generation'),
        );
        expect(nextGeneration).toBeGreaterThan(generation);
        generation = nextGeneration;
        await startNeighborFrames(page);
        if (back === 'browser') await page.goBack();
        else await page.getByRole('link', { name: 'Back to shelves' }).click();
        await settledWorkspace(page);
        await assertNeighborSpread(page, true);
        const returnedGeneration = Number(
          await page.locator('[data-shelves-workspace]').getAttribute('data-transition-generation'),
        );
        expect(returnedGeneration).toBeGreaterThan(generation);
        generation = returnedGeneration;
        expect(await page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
        await expect(below).toHaveCSS('opacity', '1');
        await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
      }
      // Also keep the former summary-motion assertion in an unscrolled cached visit.
      await page.evaluate(() => scrollTo(0, 0));
      await startNeighborFrames(page);
      await page.getByRole('link', { name: 'View all Figure' }).click();
      await settledWorkspace(page);
      await assertNeighborSpread(page, true, true);
      await page.getByRole('link', { name: 'Back to shelves' }).click();
      await settledWorkspace(page);
      expect(
        await page
          .locator('[data-scene-active="true"] section')
          .first()
          .evaluate((node) => node === Reflect.get(window, '__retainedReplayShelf')),
      ).toBe(true);
      expect(figureRequests()).toBe(1);
      await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
    });
  }
}

test('quick scrolled Back and View All still spreads neighboring shelf groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await mockThreeShelves(page);
  await page.goto('/shelves');
  await settledWorkspace(page);
  await page.evaluate(() => scrollTo(0, 350));
  await page.getByRole('link', { name: 'View all Figure' }).click();
  await settledWorkspace(page);
  // Dispatch within the browser so Playwright's stability waiting cannot finish the animation first.
  await page
    .locator('[data-scene-active="true"] [data-shelf-back]')
    .evaluate((node) => (node as HTMLAnchorElement).click());
  await expect(page.locator('[data-scene-active="true"]')).toHaveAttribute(
    'data-shelf-scene',
    '/shelves',
  );
  await startNeighborFrames(page);
  await page
    .locator('[data-scene-active="true"] [data-shelf-anchor="category-figure"]')
    .evaluate((node) => (node as HTMLAnchorElement).click());
  await settledWorkspace(page);
  await assertNeighborSpread(page);
  await page.goBack();
  await settledWorkspace(page);
  await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
});

test('an interrupted switch between categories keeps each ledge tied to its own shelf', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await mockThreeShelves(page);
  await page.goto('/shelves');
  await settledWorkspace(page);
  await page.getByRole('link', { name: 'View all Gunpla' }).click();
  await settledWorkspace(page);
  await page
    .locator('[data-scene-active="true"] [data-shelf-back]')
    .evaluate((node) => (node as HTMLAnchorElement).click());
  await expect(page.locator('[data-scene-active="true"]')).toHaveAttribute(
    'data-shelf-scene',
    '/shelves',
  );
  const expected = await page.evaluate(() => {
    const root = document.querySelector('[data-shelf-scene="/shelves"]')!;
    const ledge = root.querySelector('[data-part-category="figure"] [data-scene-ledge]')!;
    const previous = document.querySelector(
      '[data-category-bridge="gunpla"] [data-category-bridge-item="ledge"]',
    )!;
    const expectedTop = ledge.getBoundingClientRect().top;
    const previousTop = previous.getBoundingClientRect().top;
    (root.querySelector('[data-shelf-anchor="category-figure"]') as HTMLAnchorElement).click();
    return { expectedTop, previousTop };
  });
  expect(Math.abs(expected.expectedTop - expected.previousTop)).toBeGreaterThan(50);
  const ledge = page.locator('[data-category-bridge="figure"] [data-category-bridge-item="ledge"]');
  await expect(ledge).toBeAttached();
  expect(await ledge.evaluate((node) => parseFloat(getComputedStyle(node).top))).toBeCloseTo(
    expected.expectedTop,
    0,
  );
  await settledWorkspace(page);
  await expect(page.locator('[data-category-bridge]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Figure', exact: true })).toBeVisible();
});
