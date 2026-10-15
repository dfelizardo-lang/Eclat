const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: __dirname + "/tests",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: [
    ["list"],
    [
      "junit",
      {
        outputFile:
          process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME || "pw_junit_report.xml",
      },
    ],
    ["html", { open: "never" }],
  ],
  use: {
    serviceWorkers: "block",
    trace: "off",
    video: "off",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
