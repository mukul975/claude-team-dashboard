const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server.js',
    port: 3001,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
