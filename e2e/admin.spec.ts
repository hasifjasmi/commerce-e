import { expect, test } from "@playwright/test";

const adminUser = process.env.ADMIN_USER ?? "e2e";
const adminPass = process.env.ADMIN_PASS ?? "e2e";

test("/admin blocks requests without basic auth", async ({ request }) => {
  const res = await request.get("/admin");
  expect(res.status()).toBe(401);

  const headers = res.headers();
  expect(headers["www-authenticate"]).toContain("Basic");
});

test.describe("admin confirmation generator", () => {
  test.use({ httpCredentials: { username: adminUser, password: adminPass } });

  test("loads, persists language toggle, and renders outputs", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByTestId("admin-page")).toBeVisible();
    await expect(page.getByTestId("stripe-id-input")).toBeVisible();
    await expect(page.getByTestId("phone-override-input")).toBeVisible();

    await page.getByTestId("lang-toggle-bm").click();
    await expect(page.getByTestId("lang-toggle-bm")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("admin_lang")))
      .toBe("bm");

    await page.reload();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("admin_lang")))
      .toBe("bm");

    await page.route("**/api/admin/stripe-details", async (route) => {
      const req = route.request();
      expect(req.method()).toBe("POST");
      const body = req.postDataJSON() as { id?: string };
      expect(body.id).toBe("cs_test_123");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          type: "checkout_session",
          id: "cs_test_123",
          status: "complete",
          payment_status: "paid",
          created: 0,
          amount_total: 12345,
          currency: "myr",
          customer_name: "Ali",
          phone: "+60123456789",
          payment_intent_id: "pi_test_123",
          items: [
            { description: "Tee", quantity: 1, amount_total: 12345, currency: "myr" },
          ],
        }),
      });
    });

    await page.getByTestId("stripe-id-input").fill("cs_test_123");
    await page.getByTestId("fetch-details-button").click();

    await expect(page.getByTestId("stripe-summary")).toBeVisible();
    await expect(page.getByTestId("whatsapp-output")).toBeVisible();
    await expect(page.getByTestId("telegram-output")).toBeVisible();

    const waHref = await page.getByTestId("wa-link").getAttribute("href");
    expect(waHref).toContain("https://wa.me/60123456789");

    await expect(page.getByTestId("whatsapp-message")).toHaveValue(/cs_test_123/);

    await page.getByTestId("phone-override-input").fill("700-800-900");
    const waHref2 = await page.getByTestId("wa-link").getAttribute("href");
    expect(waHref2).toContain("https://wa.me/700800900");

    await page.getByTestId("telegram-destination-input").fill("https://t.me/example");
    await expect(page.getByTestId("telegram-destination-link")).toHaveAttribute(
      "href",
      "https://t.me/example",
    );
    await expect(page.getByTestId("telegram-message")).toHaveValue(/cs_test_123/);
  });
});
