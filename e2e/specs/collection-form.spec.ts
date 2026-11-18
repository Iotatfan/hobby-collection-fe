import { expect, test } from '@playwright/test';

const drawer = {
  collection_types: [{ id: 1, name: 'Gunpla' }],
  grades: [{ grade_id: 1, collection_type_name: 'Gunpla', grade_short_name: 'HG' }],
  scales: [{ id: 1, name: '1/144' }],
  release_types: [{ id: 1, name: 'Standard' }],
  manufacturers: [{ id: 1, name: 'Bandai' }],
  series: [{ id: 1, name: 'Gundam' }],
  features: [{ id: 1, name: 'Articulated', slug: 'articulated', type: 0 }],
  modifications: [{ id: 2, name: 'Painted', slug: 'painted', type: 1 }],
};

const collection = {
  id: 1,
  title: 'Test collection',
  status: 3,
  built_at: '2026-01-01T00:00:00.000Z',
  description: '  Preserve  this description\n\n    Indented line\n<script>alert(1)</script>\n  ',
  cover: '/favicon.png',
  pictures: ['/favicon.png'],
  type: { name: 'Gunpla', scale: '1/144', grade: { id: 1, short_name: 'HG' } },
  release_type: { id: 1, name: 'Standard' },
  manufacturer: { id: 1, name: 'Bandai' },
  series: { id: 1, name: 'Gundam' },
  display_size: 'small_wide',
  addons: [{ id: 1, name: 'Stand', manufacturer: { id: 1, name: 'Bandai' } }],
  features: [],
  modifications: [],
};

for (const mode of ['create', 'edit'] as const) {
  test(`${mode}: locks fields while saving and unlocks after failure`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__APP_CONFIG__ = { API_BASE_URL: `${window.location.origin}/api` };
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      document.cookie = `jwt=header.${payload}.signature; Path=/`;
    });

    let requests = 0;
    const submittedDescriptions: string[] = [];
    let releaseRequest: (() => void) | undefined;
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (['POST', 'PATCH'].includes(route.request().method())) {
        requests += 1;
        const body = route.request().postDataBuffer()!.toString('utf8');
        const description = body.match(/name="description"\r\n\r\n([\s\S]*?)\r\n--/);
        submittedDescriptions.push(description?.[1].replace(/\r\n/g, '\n') ?? '');
        if (requests === 1) {
          await new Promise<void>((resolve) => {
            releaseRequest = resolve;
          });
          await route.fulfill({ status: 500, json: { message: 'Save failed. Retry.' } });
        } else {
          await route.fulfill({ json: { data: collection } });
        }
        return;
      }
      const data = path.endsWith('/drawer')
        ? drawer
        : path.endsWith('/collection/1')
          ? collection
          : {
              collections: [],
              collection_types: [],
              release_types: [],
              gunpla_grades: [],
              figures_scales: [],
            };
      await route.fulfill({ json: { data } });
    });

    await page.goto(mode === 'create' ? '/collection/new' : '/collection/1/edit');
    const title = page.getByPlaceholder('Collection title');
    await expect(title).toBeVisible();
    const submit = page.getByRole('button', {
      name: mode === 'create' ? 'Create Collection' : 'Save Changes',
    });

    if (mode === 'create') {
      await submit.click();
      await expect(page.getByRole('alert')).toHaveText('Title is required.');
      await expect(title).toBeEnabled();
      await title.fill(collection.title);
      const image = {
        name: 'cover.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2S8AAAAASUVORK5CYII=',
          'base64',
        ),
      };
      await page.locator('#cover-upload-input').setInputFiles(image);
      await page.locator('#pictures-upload-input').setInputFiles(image);
      for (const [placeholder, value] of [
        ['Choose status', 'Built'],
        ['Choose scale', '1/144'],
        ['Choose brand', 'Bandai'],
        ['Choose release type', 'Standard'],
        ['Choose series', 'Gundam'],
        ['Choose display size', 'small_wide'],
      ]) {
        await page.getByRole('button', { name: placeholder, exact: true }).click();
        await page.getByRole('menuitemradio', { name: value, exact: true }).click();
      }
      await page.locator('input[type="date"]').fill('2026-01-01');
      await page.getByPlaceholder('Optional description').fill(collection.description);
      await page.getByRole('button', { name: 'Add addon' }).click();
      await page.getByPlaceholder('Addon 1 name').fill('Stand');
      await page.getByRole('button', { name: 'Choose brand', exact: true }).click();
      await page.getByRole('menuitemradio', { name: 'Bandai', exact: true }).click();
    }

    await page.getByRole('button', { name: 'Gundam', exact: true }).click();
    await expect(page.getByRole('menu', { name: 'Gundam', exact: true })).toBeVisible();
    await page.locator('form').evaluate((form) => (form as HTMLFormElement).requestSubmit());
    await expect.poll(() => requests).toBe(1);
    for (const control of await page.locator('form input, form textarea, form button').all()) {
      await expect(control).toBeDisabled();
    }
    const tiles = page.locator('form [role="button"]');
    for (const tile of await tiles.all()) {
      await expect(tile).toHaveAttribute('aria-disabled', 'true');
      await expect(tile).toHaveAttribute('tabindex', '-1');
      await tile.dispatchEvent('click');
      await tile.dispatchEvent('keydown', { key: 'Enter' });
      await tile.dispatchEvent('keydown', { key: ' ' });
    }
    await expect(page.getByRole('menu')).toHaveCount(0);
    await page.locator('form').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(requests).toBe(1);
    await expect(page.getByRole('link', { name: 'Cancel', exact: true })).toHaveAttribute(
      'href',
      '/admin/collections',
    );

    releaseRequest!();
    await expect(page.getByRole('alert')).toHaveText('Save failed. Retry.');
    for (const control of await page.locator('form input, form textarea, form button').all()) {
      await expect(control).toBeEnabled();
    }
    await expect(title).toHaveValue(collection.title);
    await expect(page.getByPlaceholder('Optional description')).toHaveValue(collection.description);
    await expect(page.getByPlaceholder('Addon 1 name')).toHaveValue('Stand');
    await submit.click();
    await expect(page).toHaveURL(/\/admin\/collections$/);
    expect(requests).toBe(2);
    expect(submittedDescriptions).toEqual([collection.description, collection.description]);
  });
}
