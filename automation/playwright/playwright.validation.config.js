const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /validation\.spec\.js/,
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: process.env.ECLAT_BASE_URL || 'https://eclatsclassiques.com',
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'only-on-failure'
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/validation-junit.xml' }]
  ],
  projects: [
    { name: 'chromium-desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-desktop', use: { browserName: 'webkit', viewport: { width: 1440, height: 900 } } },
    { name: 'firefox-desktop', use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-phone-landscape', use: { browserName: 'chromium', viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true } },
    { name: 'webkit-phone-landscape', use: { browserName: 'webkit', viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true } },
    { name: 'chromium-tablet-landscape', use: { browserName: 'chromium', viewport: { width: 1366, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: 'chromium-fold-vertical', use: { browserName: 'chromium', viewport: { width: 853, height: 1280 }, isMobile: true, hasTouch: true } }
  ]
});
