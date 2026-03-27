import { expect, test } from "@playwright/test";
import { mockCollectionApi } from "../fixtures/api";
import { setManagerJwt } from "../fixtures/auth";

test("renders collection cards for public users", async ({ page }) => {
  await mockCollectionApi(page);

  await page.goto("/");

  await expect(page.getByText("RX-78-2 Gundam")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add New" })).toHaveCount(0);
});

test("shows Add New CTA for authenticated managers", async ({ page }) => {
  await setManagerJwt(page);
  await mockCollectionApi(page);

  await page.goto("/");

  await expect(page.getByRole("link", { name: "Add New" })).toBeVisible();
});
