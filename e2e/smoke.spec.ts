import { expect, test } from "@playwright/test";

test("home renders hero + catalog and exposes stable selectors", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Megz/i);

  await expect(page.getByTestId("home-page")).toBeVisible();
  await expect(page.getByTestId("home-main")).toBeVisible();
  await expect(page.getByTestId("hero")).toBeVisible();
  await expect(page.getByTestId("catalog")).toBeVisible();
  await expect(page.getByTestId("jump-to-catalog")).toBeVisible();
  await expect(page.getByTestId("cart-button")).toBeVisible();
  await expect(page.getByTestId("cart-open")).toBeVisible();
});

test("jump-to-catalog scrolls the catalog section into view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.goto("/");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByTestId("jump-to-catalog").click();

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.getByTestId("catalog")).toBeInViewport();
});
