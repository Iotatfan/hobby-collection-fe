import { expect, test } from "@playwright/test";
import { mockCollectionApi } from "../fixtures/api";
import { setManagerJwt } from "../fixtures/auth";

test("redirects anonymous users away from /collection/new @smoke", async ({ page }) => {
  await page.goto("/collection/new");
  await expect(page).toHaveURL(/\/$/);
});

test("allows manager users to access /collection/new @smoke", async ({ page }) => {
  await setManagerJwt(page);
  await mockCollectionApi(page);

  await page.goto("/collection/new");

  await expect(page).toHaveURL(/\/collection\/new$/);
  await expect(page.getByRole("heading", { name: "Create Collection" })).toBeVisible();
});
