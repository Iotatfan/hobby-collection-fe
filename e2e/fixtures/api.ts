import type { Page } from "@playwright/test";
import {
  collectionTypeFiltersFixture,
  collectionsFixture,
  drawerContentFixture,
} from "../data/collection.factory";

type MockOptions = {
  collectionsCount?: number;
};

const toJson = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ data }),
});

const getPathname = (url: string) => new URL(url).pathname;

export const mockCollectionApi = async (page: Page, options?: MockOptions) => {
  const selectedCollections =
    typeof options?.collectionsCount === "number"
      ? collectionsFixture.slice(0, options.collectionsCount)
      : collectionsFixture;

  await page.route("**/collection/filter", async (route) => {
    await route.fulfill(toJson(collectionTypeFiltersFixture));
  });

  await page.route("**/collection/drawer", async (route) => {
    await route.fulfill(toJson(drawerContentFixture));
  });

  await page.route("**/create_collection", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    await route.fulfill(toJson(collectionsFixture[0]));
  });

  await page.route("**/collection*", async (route) => {
    const request = route.request();
    const method = request.method();
    const pathname = getPathname(request.url());

    if (method === "GET" && pathname.endsWith("/collection")) {
      await route.fulfill(toJson({ collections: selectedCollections }));
      return;
    }

    if (method === "GET" && pathname.match(/\/collection\/\d+$/)) {
      await route.fulfill(toJson(collectionsFixture[0]));
      return;
    }

    if (method === "PATCH" && pathname.match(/\/collection\/\d+$/)) {
      await route.fulfill(toJson(collectionsFixture[0]));
      return;
    }

    await route.continue();
  });
};
