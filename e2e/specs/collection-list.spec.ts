import { expect, test } from '@playwright/test';

const collection = (id: number, title: string) => ({
  id,
  title,
  status: 3,
  built_at: '2026-01-01T00:00:00.000Z',
  type: { name: 'Gunpla', scale: '1/144', grade: { short_name: 'HG' } },
  release_type: { name: 'Standard' },
  cover: '/favicon.png',
});

test.beforeEach(async ({ page }) => {
  await page.route('**/collection/filter*', async (route) => {
    await route.fulfill({
      json: {
        data: {
          collection_types: [{ id: 1, name: 'Gunpla' }],
          gunpla_grades: [],
          figures_scales: [],
          release_types: [],
        },
      },
    });
  });
  await page.route('**/collection/statistics*', async (route) => {
    await route.fulfill({
      json: { data: { total_count: 2, completed_count: 2, backlog_count: 0, limited_count: 0 } },
    });
  });
});

test('uses page length as the current pagination fallback', async ({ page }) => {
  await page.route('**/collection?*', async (route) => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') ?? 0);
    await route.fulfill({
      json: {
        data: { collections: offset === 0 ? [collection(1, 'First item')] : [] },
      },
    });
  });

  await page.goto('/');
  await expect(page.getByText('First item')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('persists filter changes in the URL', async ({ page }) => {
  await page.route('**/collection?*', async (route) => {
    await route.fulfill({ json: { data: { collections: [] } } });
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Gunpla' }).click();
  await expect(page).toHaveURL(/collection=Gunpla/);
});
