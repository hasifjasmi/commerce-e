import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
const adminUser = process.env.ADMIN_USER ?? "e2e";
const adminPass = process.env.ADMIN_PASS ?? "e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ADMIN_USER: adminUser,
      ADMIN_PASS: adminPass,
      STRIPE_MOCK: process.env.STRIPE_MOCK ?? "",
    },
  },
});
