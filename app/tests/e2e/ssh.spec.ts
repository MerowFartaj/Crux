import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp, screenshot } from './helpers';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  const ctx = await launchApp();
  electronApp = ctx.electronApp;
  window = ctx.window;
});

test.afterAll(async () => {
  await closeApp(electronApp);
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== 'passed') {
    await screenshot(window, `ssh-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('/ssh opens SSH Manager', async () => {
  await typeInTerminal(window, '/ssh');
  await pressEnter(window);
  await window.waitForTimeout(1000);

  const hasSSH = await window.evaluate(() => {
    const body = document.body.textContent || '';
    return /SSH|Connection|Server|Quick Connect/i.test(body);
  });
  expect(hasSSH).toBe(true);
});

test('SSH Manager has a New button', async () => {
  const newBtn = window.locator('.settings-overlay >> text=/New|Add|Create/i');
  const count = await newBtn.count();
  expect(count).toBeGreaterThan(0);
});

test('SSH Manager has a search/quick connect input', async () => {
  const input = window.locator('.settings-overlay input[type="text"], .settings-overlay input[placeholder*="connect"], .settings-overlay input[placeholder*="search"]');
  const count = await input.count();
  expect(count).toBeGreaterThan(0);
});

test('Escape closes SSH Manager', async () => {
  await window.keyboard.press('Escape');
  await window.waitForTimeout(500);

  const overlay = window.locator('.settings-overlay');
  const visible = await overlay.isVisible().catch(() => false);
  expect(visible).toBe(false);
});
