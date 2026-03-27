import path from "node:path";
import { expect, test } from "@playwright/test";
import { mockCollectionApi } from "../fixtures/api";
import { setManagerJwt } from "../fixtures/auth";

test("shows validation message when title is missing", async ({ page }) => {
  await setManagerJwt(page);
  await mockCollectionApi(page);

  await page.goto("/collection/new");
  await page.getByRole("button", { name: "Create Collection" }).click();

  await expect(page.getByText("Title is required.")).toBeVisible();
});

test("creates a collection and redirects to list page @smoke", async ({ page }) => {
  await setManagerJwt(page);
  await mockCollectionApi(page);

  await page.goto("/collection/new");

  await page.getByLabel("Title").fill("Playwright New Build");

  await page.getByRole("button", { name: "Choose status" }).click();
  await page.getByRole("button", { name: "Built", exact: true }).click();
  await page.getByLabel("Built Date").fill("2026-03-01");

  await page.getByRole("button", { name: "Choose release type" }).click();
  await page.getByRole("button", { name: "Regular", exact: true }).click();

  await page.getByRole("button", { name: "Choose series" }).click();
  await page.getByRole("button", { name: "UC", exact: true }).click();

  await page.getByRole("button", { name: "Choose manufacturer" }).click();
  await page.getByRole("button", { name: "Bandai", exact: true }).click();

  const coverImagePath = path.resolve(process.cwd(), "public", "vite.svg");
  await page.setInputFiles("#cover-upload-input", coverImagePath);

  const createRequestPromise = page.waitForRequest(
    (request) => request.method() === "POST" && request.url().includes("/create_collection")
  );

  await page.getByRole("button", { name: "Create Collection" }).click();
  await createRequestPromise;

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("RX-78-2 Gundam")).toBeVisible();
});
