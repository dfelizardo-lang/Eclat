require("./support/report-env.cjs").configureSquashReports(process.env, process.cwd(), __dirname);
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  globalSetup: require.resolve('./support/local-app.cjs'),
  testDir: __dirname + "/tests",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
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
    actionTimeout: 7000,
    navigationTimeout: 20000,
    serviceWorkers: "block",
    trace: "off",
    video: "off",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

