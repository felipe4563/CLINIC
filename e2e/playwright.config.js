const { defineConfig } = require('@playwright/test');

// E2E de los flujos criticos: reservar una cita en el sitio publico, y
// entrar + operar en el sistema interno. Corre contra servidores de
// desarrollo reales (no mocks) -- backend + las 2 apps Next.js, todas
// contra la base de datos de desarrollo (novaged_dev).
//
// Uso: cd e2e && npm install && npx playwright install --with-deps chromium && npm test

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- -p 3001',
      cwd: '../public-site',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- -p 3002',
      cwd: '../staff',
      url: 'http://localhost:3002',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'public-site',
      testMatch: 'public-site-booking.spec.js',
      use: { baseURL: 'http://localhost:3001' },
    },
    {
      name: 'staff',
      testMatch: 'staff-login.spec.js',
      use: { baseURL: 'http://localhost:3002' },
    },
  ],
});
