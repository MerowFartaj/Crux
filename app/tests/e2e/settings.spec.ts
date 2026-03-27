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
    await screenshot(window, `settings-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('Cmd+, opens settings panel', async () => {
  await window.keyboard.press('Meta+,');
  await window.waitForTimeout(500);

  const overlay = window.locator('.settings-overlay');
  await expect(overlay).toBeVisible();
});

test('settings panel has a header with title', async () => {
  // Settings should already be open from previous test
  const header = window.locator('.settings-overlay >> text=Settings');
  await expect(header).toBeVisible();
});

test('settings panel has font size control', async () => {
  const fontLabel = window.locator('.settings-overlay >> text=Font Size');
  await expect(fontLabel).toBeVisible();
});

test('settings panel has shell selector', async () => {
  const shellLabel = window.locator('.settings-overlay >> text=Shell');
  await expect(shellLabel).toBeVisible();
});

test('settings panel has AI configuration section', async () => {
  // Scroll down to find AI section
  const scrollContainer = window.locator('.settings-overlay .overflow-y-auto');
  if (await scrollContainer.count() > 0) {
    await scrollContainer.evaluate(el => el.scrollTop = 1000);
    await window.waitForTimeout(300);
  }

  const aiLabel = window.locator('.settings-overlay >> text=/AI|Artificial Intelligence|Model/i');
  const count = await aiLabel.count();
  expect(count).toBeGreaterThan(0);
});

test('settings panel has toggle switches', async () => {
  // Look for rounded-full toggle buttons
  const toggles = window.locator('.settings-overlay button[class*="rounded-full"][class*="w-10"]');
  const count = await toggles.count();
  expect(count).toBeGreaterThan(0);
});

test('Escape closes settings panel', async () => {
  await window.keyboard.press('Escape');
  await window.waitForTimeout(500);

  const overlay = window.locator('.settings-overlay');
  // Should be hidden or removed
  const visible = await overlay.isVisible().catch(() => false);
  expect(visible).toBe(false);
});

test('settings can be reopened after closing', async () => {
  await window.keyboard.press('Meta+,');
  await window.waitForTimeout(500);
  const overlay = window.locator('.settings-overlay');
  await expect(overlay).toBeVisible();

  // Close again
  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
});
