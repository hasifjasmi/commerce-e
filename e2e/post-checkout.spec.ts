import { expect, test } from "@playwright/test";

test("success page handles missing session_id", async ({ page }) => {
  await page.goto("/success");
  await expect(page.getByTestId("success-page")).toBeVisible();
  await expect(page.getByTestId("success-missing")).toBeVisible();
});

test("success page shows error for invalid session_id", async ({ page }) => {
  await page.route("**/api/checkout/session**", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ code: "SESSION_NOT_FOUND", message: "Checkout session was not found." }),
    });
  });

  await page.goto("/success?session_id=cs_test_invalid");
  await expect(page.getByTestId("success-page")).toBeVisible();
  await expect(page.getByTestId("success-error")).toBeVisible();
});

test("cancel banner renders on home when checkout=cancel", async ({ page }) => {
  await page.goto("/?checkout=cancel");
  await expect(page.getByTestId("checkout-cancel-banner")).toBeVisible();
  await page.getByTestId("dismiss-cancel-banner").click();
  await expect(page.getByTestId("checkout-cancel-banner")).toBeHidden();
});
