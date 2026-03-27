import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp, getTabCount, screenshot } from './helpers';

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
    await screenshot(window, `tabs-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('starts with one tab', async () => {
  const count = await getTabCount(window);
  expect(count).toBe(1);
});

test('Cmd+T creates a new tab', async () => {
  const before = await getTabCount(window);
  await window.keyboard.press('Meta+t');
  await window.waitForTimeout(800); // wait for tab creation + terminal init
  const after = await getTabCount(window);
  expect(after).toBe(before + 1);
});

test('Cmd+W closes a tab', async () => {
  // Ensure we have at least 2 tabs
  const before = await getTabCount(window);
  if (before < 2) {
    await window.keyboard.press('Meta+t');
    await window.waitForTimeout(800);
  }
  const countBefore = await getTabCount(window);

  await window.keyboard.press('Meta+w');
  await window.waitForTimeout(500);

  const countAfter = await getTabCount(window);
  expect(countAfter).toBe(countBefore - 1);
});

test('tab has a visible label', async () => {
  const tabLabel = window.locator('.tab-indicator').first().locator('..').locator('.truncate');
  const fallbackLabel = window.locator('.truncate').first();
  const label = (await tabLabel.count() > 0) ? tabLabel : fallbackLabel;
  await expect(label).toBeVisible();
  const text = await label.textContent();
  expect(text).toBeTruthy();
  expect(text!.length).toBeGreaterThan(0);
});

test('clicking + button creates a new tab', async () => {
  const before = await getTabCount(window);

  // The + button is next to the tabs
  const addBtn = window.locator('button[class*="w-8"][class*="h-full"]').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await window.waitForTimeout(800);
    const after = await getTabCount(window);
    expect(after).toBe(before + 1);

    // Clean up: close the extra tab
    await window.keyboard.press('Meta+w');
    await window.waitForTimeout(500);
  }
});
