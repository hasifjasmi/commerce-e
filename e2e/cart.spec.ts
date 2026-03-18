import { expect, test } from "@playwright/test";

test("cart requires size, opens drawer, and persists", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("cart-open").click();
  await expect(page.getByTestId("cart-drawer")).toHaveClass(/translate-x-0/);
  await expect(page.getByTestId("cart-checkout")).toBeDisabled();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByTestId("add-to-cart").first().click();
  await expect(page.getByTestId("size-required")).toBeVisible();

  await page.getByRole("combobox").first().selectOption("S");
  await page.getByTestId("add-to-cart").first().click();

  await expect(page.getByTestId("cart-drawer")).toHaveClass(/translate-x-0/);
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await expect(page.getByTestId("cart-checkout")).toBeEnabled();

  await page.reload();
  await page.getByTestId("cart-open").click();
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
});

test("checkout posts cart payload and redirects to returned url", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox").first().selectOption("S");
  await page.getByTestId("add-to-cart").first().click();
  await expect(page.getByTestId("cart-checkout")).toBeEnabled();

  let sawRequest = false;
  await page.route("**/api/checkout", async (route) => {
    const req = route.request();
    expect(req.method()).toBe("POST");

    const body = req.postDataJSON() as unknown;
    expect(body).toBeTruthy();
    expect(typeof body).toBe("object");

    const items = (body as { items?: unknown }).items;
    expect(Array.isArray(items)).toBeTruthy();
    expect((items as unknown[]).length).toBe(1);

    const first = (items as Array<Record<string, unknown>>)[0];
    expect(typeof first.productId).toBe("string");
    expect((first.productId as string).length).toBeGreaterThan(0);
    expect(first.size).toBe("S");
    expect(first.quantity).toBe(1);

    sawRequest = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://checkout.stripe.com/mock" }),
    });
  });

  await page.route("https://checkout.stripe.com/mock", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: "ok" });
  });

  await page.getByTestId("cart-checkout").click();
  await expect(page).toHaveURL("https://checkout.stripe.com/mock");
  expect(sawRequest).toBeTruthy();
});

test("checkout shows localized error and stays on page on api failure", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox").first().selectOption("S");
  await page.getByTestId("add-to-cart").first().click();
  await expect(page.getByTestId("cart-checkout")).toBeEnabled();

  await page.route("**/api/checkout", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: "STRIPE_SESSION_FAILED", message: "Unable to start checkout." }),
    });
  });

  await page.getByTestId("cart-checkout").click();
  await expect(page.getByTestId("checkout-error")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
