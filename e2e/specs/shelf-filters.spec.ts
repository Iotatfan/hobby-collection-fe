import { expect, test, type Page } from '@playwright/test';

type Category = 'gunpla' | 'figure' | 'other-model-kit';
const keys = {
  gunpla: 'gunpla_shelf',
  figure: 'figure_shelf',
  'other-model-kit': 'other_model_kit_shelf',
};
const names = { gunpla: 'Gunpla', figure: 'Figure', 'other-model-kit': 'Other Model Kit' };
const grades = [
  { id: 1, name: 'High Grade', short_name: 'HG' },
  { id: 2, name: 'Real Grade', short_name: 'RG' },
  { id: 3, name: 'Master Grade', short_name: 'MG' },
  { id: 4, name: 'Perfect Grade', short_name: 'PG' },
];
const series = [
  { id: 1, name: 'Universal Century' },
  {
    id: 2,
    name: 'A very long alternate universe series name that should wrap comfortably on mobile',
  },
];
const releases = [
  { id: 1, name: 'Regular' },
  { id: 3, name: 'Premium Bandai' },
];
const scales = [
  { id: 1, name: '1/7' },
  { id: 2, name: '1/8' },
];
const manufacturers = [
  { id: 1, name: 'Maker A' },
  { id: 2, name: 'Maker B' },
];
const records = (category: Category) =>
  Array.from({ length: category === 'gunpla' ? 18 : 4 }, (_, index) => {
    const number = index + 1;
    const grade =
      category === 'gunpla'
        ? grades[number >= 17 ? 1 : number === 16 ? 2 : number === 15 ? 3 : 0]
        : grades[0];
    return {
      id: number + (category === 'gunpla' ? 0 : category === 'figure' ? 100 : 200),
      title: `${names[category]} ${number}`,
      type: {
        id: category === 'gunpla' ? 2 : category === 'figure' ? 1 : 3,
        name: names[category],
        grade,
        scale: scales[index % 2].name,
      },
      cover: `https://example.com/kit-${number}.png`,
      display_size: number === 1 ? 'large_tall' : 'medium_tall',
      status: 3,
      release_type: releases[number >= 17 ? 1 : 0],
      series: series[index % 2],
      manufacturer: manufacturers[index % 2],
      scale_id: (index % 2) + 1,
    };
  });

async function setup(page: Page, beforeResponse?: (url: URL) => Promise<void>) {
  await page.addInitScript(() => {
    const NativeIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeIntersectionObserver {
      observe(target: Element) {
        // Suppress automatic shelf paging while preserving menu positioning observers.
        if (this.rootMargin === '0px 0px 160px 0px') return;
        super.observe(target);
      }
    };
  });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="210"><rect width="160" height="210" fill="#304d70"/><rect x="10" y="10" width="140" height="190" fill="#eab308"/><path d="M20 170L80 35L140 170Z" fill="#172a45"/></svg>',
    }),
  );
  await page.route('**/collection/statistics*', (route) =>
    route.fulfill({
      json: { data: { total_count: 26, completed_count: 26, backlog_count: 0, limited_count: 2 } },
    }),
  );
  await page.route('**/collection/filter*', (route) => {
    const category = new URL(route.request().url()).searchParams.get('category') as Category;
    return route.fulfill({
      json: {
        data: {
          category,
          total_count: records(category).length,
          grades: category === 'gunpla' ? grades : [],
          release_types: category === 'gunpla' ? releases : [],
          scales: category !== 'gunpla' ? scales : [],
          manufacturers: category !== 'gunpla' ? manufacturers : [],
          series,
        },
      },
    });
  });
  const requests: URL[] = [];
  await page.route('**/collection/shelves*', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const selected = url.searchParams.get('category');
    const data: Record<string, unknown> = {
      backlog_shelf: { id: 1, name: 'Backlog', count: 0, items: [] },
    };
    for (const category of Object.keys(keys) as Category[]) {
      let items = records(category);
      if (selected === category) {
        items = items.filter(
          (item) =>
            (!url.searchParams.has('grade_id') ||
              item.type.grade.id === Number(url.searchParams.get('grade_id'))) &&
            (!url.searchParams.has('release_type_id') ||
              item.release_type.id === Number(url.searchParams.get('release_type_id'))) &&
            (!url.searchParams.has('scale_id') ||
              item.scale_id === Number(url.searchParams.get('scale_id'))) &&
            (!url.searchParams.has('manufacturer_id') ||
              item.manufacturer.id === Number(url.searchParams.get('manufacturer_id'))) &&
            (!url.searchParams.has('series_id') ||
              item.series.id === Number(url.searchParams.get('series_id'))),
        );
      }
      const count = items.length;
      const offset = selected === category ? Number(url.searchParams.get('offset')) : 0;
      const limit = selected === category ? Number(url.searchParams.get('limit')) : 6;
      data[keys[category]] = {
        id: 2,
        name: names[category],
        items: items.slice(offset, offset + limit),
        count,
      };
    }
    await beforeResponse?.(url);
    return route.fulfill({ json: { data } });
  });
  await page.route(/\/collection\/\d+$/, (route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const item = (Object.keys(keys) as Category[]).flatMap(records).find((item) => item.id === id);
    return route.fulfill({
      json: { data: { ...item, description: 'Test collection', pictures: [] } },
    });
  });
  return requests;
}

async function settled(page: Page) {
  await expect(page.locator('[data-shelves-workspace]')).toHaveAttribute(
    'data-transition-phase',
    'settled',
  );
}
const active = (page: Page) => page.locator('[data-scene-active="true"]');
async function choose(page: Page, field: string, value: string) {
  await active(page).getByRole('button', { name: field, exact: true }).click();
  await page.getByRole('menuitemradio', { name: value, exact: true }).click();
}

test('filters the complete category, combines fields and restores selections after detail and category navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests = await setup(page);
  await page.goto('/shelves/');
  await settled(page);
  await active(page).getByRole('link', { name: 'View all Gunpla' }).click();
  await settled(page);
  await expect(active(page).locator('[data-filter-item]')).toHaveCount(12);
  await active(page).getByRole('button', { name: 'RG', exact: true }).click();
  await expect(active(page).getByText('2 of 18 items', { exact: true })).toBeVisible();
  await expect(active(page).getByRole('link', { name: 'Gunpla 17', exact: true })).toBeVisible();
  await choose(page, 'Release Type', 'Premium Bandai');
  await choose(page, 'Series', 'Universal Century');
  await expect(active(page).getByText('1 of 18 items', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('desktop-filters.png'), fullPage: true });
  expect(
    requests.some(
      (url) =>
        url.searchParams.get('grade_id') === '2' &&
        url.searchParams.get('release_type_id') === '3' &&
        url.searchParams.get('series_id') === '1' &&
        url.searchParams.get('offset') === '0',
    ),
  ).toBe(true);
  expect(requests.some((url) => url.searchParams.has('release_type_id[]'))).toBe(false);
  await active(page).getByRole('link', { name: 'Gunpla 17', exact: true }).click();
  await settled(page);
  await page.goBack();
  await settled(page);
  await expect(active(page).getByText('1 of 18 items', { exact: true })).toBeVisible();
  await active(page).getByRole('link', { name: 'Figure', exact: true }).click();
  await settled(page);
  await choose(page, 'Brand', 'Maker A');
  await expect(active(page).getByText('2 of 4 items', { exact: true })).toBeVisible();
  await active(page).getByRole('link', { name: 'Gunpla', exact: true }).click();
  await settled(page);
  await expect(active(page).getByText('1 of 18 items', { exact: true })).toBeVisible();
  await active(page).getByRole('button', { name: 'Remove Series: Universal Century' }).click();
  await expect(active(page).getByText('2 of 18 items', { exact: true })).toBeVisible();
  await active(page).getByRole('button', { name: 'Clear all', exact: true }).click();
  await expect(active(page).getByText('18 items', { exact: true })).toBeVisible();
  await expect(active(page).getByRole('button', { name: 'Clear all', exact: true })).toHaveCount(0);
  await active(page).getByRole('button', { name: 'Load more Gunpla' }).click();
  await expect(active(page).locator('[data-filter-item]')).toHaveCount(18);
  await choose(page, 'Additional grades', 'PG');
  await expect(active(page).getByText('1 of 18 items', { exact: true })).toBeVisible();
  await choose(page, 'Release Type', 'Premium Bandai');
  await expect(active(page).getByText('No matching items', { exact: true })).toBeVisible();
  await expect(active(page).locator('[data-scene-ledge]')).toHaveCount(1);
  await active(page).getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(active(page).getByText('18 items', { exact: true })).toBeVisible();
});

for (const category of Object.keys(keys) as Category[]) {
  test(`mobile ${category} controls expand inline and wrap`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setup(page);
    await page.goto(`/shelves/category/${category}`);
    await settled(page);
    const toggle = active(page).getByRole('button', { name: 'Filters', exact: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(active(page).getByRole('button', { name: 'Series', exact: true })).toBeHidden();
    if (category === 'gunpla')
      await expect(active(page).getByRole('button', { name: 'HG', exact: true })).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    if (category === 'gunpla')
      await expect(
        active(page).getByRole('button', { name: 'Release Type', exact: true }),
      ).toBeVisible();
    else {
      await choose(page, 'Scale', '1/7');
      await choose(page, category === 'figure' ? 'Brand' : 'Manufacturer', 'Maker A');
    }
    await choose(page, 'Series', series[1].name);
    await expect(
      active(page).getByRole('button', { name: `Remove Series: ${series[1].name}` }),
    ).toBeVisible();
    await expect(
      active(page).getByText(category === 'gunpla' ? '9 of 18 items' : '0 of 4 items', {
        exact: true,
      }),
    ).toBeVisible();
    await expect
      .poll(() =>
        active(page)
          .locator('[data-scene-ledge]')
          .first()
          .evaluate((node) => {
            let opacity = 1;
            for (let current: Element | null = node; current; current = current.parentElement) {
              opacity *= Number(getComputedStyle(current).opacity);
            }
            return opacity;
          }),
      )
      .toBe(1);
    await page.screenshot({ path: test.info().outputPath('mobile-filters.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await toggle.click();
    await expect(active(page).getByRole('button', { name: 'Series', exact: true })).toBeHidden();
    await expect(active(page).getByRole('status').first()).toBeVisible();
    await expect(active(page).locator('[data-filter-exit]')).toHaveCount(0);
  });
}

test('regroups across rows, keeps ledges anchored, and clears interrupted exit layers', async ({
  page,
}) => {
  let release = () => {};
  let hold = true;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await setup(page, async (url) => {
    if (url.searchParams.get('grade_id') === '2' && hold) {
      hold = false;
      await gate;
    }
  });
  await page.goto('/shelves/category/gunpla');
  await settled(page);
  await expect(active(page).getByRole('button', { name: 'HG', exact: true })).toBeEnabled();
  await active(page).getByRole('button', { name: 'RG', exact: true }).click();
  await expect(active(page).getByText('Updating items…', { exact: true })).toBeVisible();
  const before = await active(page).locator('[data-scene-ledge]').first().boundingBox();
  release();
  await expect(active(page).locator('[data-filter-exit]').first()).toBeAttached();
  const during = await active(page).locator('[data-scene-ledge]').first().boundingBox();
  expect(during!.height).toBe(before!.height);
  expect(Math.abs(during!.y - before!.y)).toBeLessThan(1);
  const travelling = await active(page)
    .locator('[data-filter-item]')
    .evaluateAll((nodes) => nodes.some((node) => getComputedStyle(node).opacity !== '1'));
  expect(travelling).toBe(true);
  await active(page).getByRole('button', { name: 'HG', exact: true }).click();
  await expect(active(page).getByText('14 of 18 items', { exact: true })).toBeVisible();
  await expect(active(page).locator('[data-filter-exit]')).toHaveCount(0);
  await expect(active(page).locator('[data-filter-item]')).toHaveCount(12);
  expect(
    await active(page)
      .locator('[data-filter-item]')
      .evaluateAll(
        (nodes) => new Set(nodes.map((node) => node.getAttribute('data-filter-item'))).size,
      ),
  ).toBe(12);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await active(page).getByRole('button', { name: 'RG', exact: true }).click();
  await expect(active(page).getByText('2 of 18 items', { exact: true })).toBeVisible();
  await expect(active(page).locator('[data-filter-exit]')).toHaveCount(0);
});

test('moves surviving boxes between rows in server order', async ({ page }) => {
  await setup(page);
  await page.goto('/shelves/category/gunpla');
  await settled(page);
  const survivor = active(page).locator('[data-filter-item="7"]');
  const before = await survivor.boundingBox();
  await choose(page, 'Series', 'Universal Century');
  await expect(active(page).getByText('9 of 18 items', { exact: true })).toBeVisible();
  await expect(active(page).locator('[data-filter-exit]')).toHaveCount(0);
  await expect
    .poll(async () => {
      const rect = await survivor.boundingBox();
      return rect!.y < before!.y - 100;
    })
    .toBe(true);
  expect(
    await active(page)
      .locator('[data-filter-item]')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-filter-item')))),
  ).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17]);
});

test('latest selection wins when an older request finishes late', async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = () => {};
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await setup(page, async (url) => {
    if (url.searchParams.get('grade_id') === '2') {
      requested();
      await gate;
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/shelves/category/gunpla');
  await settled(page);
  await active(page).getByRole('button', { name: 'RG', exact: true }).click();
  await started;
  await active(page).getByRole('button', { name: 'MG', exact: true }).click();
  await expect(active(page).getByText('1 of 18 items', { exact: true })).toBeVisible();
  release();
  await expect(active(page).getByRole('link', { name: 'Gunpla 16', exact: true })).toBeVisible();
  await expect(active(page).locator('[data-filter-item]')).toHaveCount(1);
  await expect(active(page).getByRole('button', { name: 'MG', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(active(page).getByRole('link', { name: 'Gunpla 17', exact: true })).toHaveCount(0);
});

test('metadata failure is retryable and controls have keyboard focus', async ({ page }) => {
  await setup(page);
  let failed = false;
  await page.route('**/collection/filter*', (route) => {
    if (!failed) {
      failed = true;
      return route.fulfill({ status: 500, json: {} });
    }
    return route.fallback();
  });
  await page.goto('/shelves/category/figure');
  await settled(page);
  await expect(active(page).getByText('Could not load filters.')).toBeVisible();
  await active(page).getByRole('button', { name: 'Reload filters' }).click();
  const scale = active(page).getByRole('button', { name: 'Scale', exact: true });
  await expect(scale).toBeEnabled();
  await scale.focus();
  await expect(scale).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitemradio', { name: '1/7', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(scale).toBeFocused();
});

for (const width of [1280, 375]) {
  test(`dropdown options remain readable in every interaction state at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setup(page);
    await page.goto('/shelves/category/figure');
    await settled(page);
    if (width < 768)
      await active(page).getByRole('button', { name: 'Filters', exact: true }).click();
    const scale = active(page).getByRole('button', { name: 'Scale', exact: true });
    await expect(scale).toBeEnabled();
    await scale.click();
    const option = page.getByRole('menuitemradio', { name: '1/7', exact: true });
    const other = page.getByRole('menuitemradio', { name: '1/8', exact: true });
    await expect(option).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(other).toHaveCSS('color', 'rgb(255, 255, 255)');
    await option.hover();
    await expect(option).toHaveAttribute('data-highlighted', '');
    await expect(option).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.getByRole('menu').press('Home');
    const all = page.getByRole('menuitemradio', { name: 'All', exact: true });
    await expect(all).toHaveAttribute('data-highlighted', '');
    await expect(all).toHaveCSS('color', 'rgb(255, 255, 255)');
    await option.click();
    await expect(active(page).getByText('2 of 4 items', { exact: true })).toBeVisible();
    await scale.click();
    await expect(option).toHaveAttribute('aria-checked', 'true');
    await expect(option).toHaveCSS('color', 'rgb(255, 255, 255)');
    const indicator = option.locator('[data-part="item-indicator"]');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.getByRole('menu')).toHaveCSS('background-color', 'rgb(10, 25, 47)');
    await expect(page.getByRole('menu')).toHaveAttribute('data-placement', 'bottom-start');
    await expect(page.getByRole('menu')).toHaveCSS('opacity', '1');
    await expect
      .poll(async () => {
        const triggerBounds = await scale.boundingBox();
        const menuBounds = await page.getByRole('menu').boundingBox();
        return menuBounds!.y - triggerBounds!.y - triggerBounds!.height;
      })
      .toBeCloseTo(8, 0);
    await page.screenshot({ path: test.info().outputPath('dropdown-contrast.png') });
    expect(errors).toEqual([]);
  });
}
