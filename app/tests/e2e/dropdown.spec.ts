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
  // Make sure dropdown mode is disabled before closing
  try {
    await window.keyboard.press('Meta+,');
    await window.waitForTimeout(500);

    // Try to find and disable dropdown if enabled
    const scrollContainer = window.locator('.settings-overlay .overflow-y-auto');
    if (await scrollContainer.count() > 0) {
      await scrollContainer.evaluate(el => el.scrollTop = 2000);
      await window.waitForTimeout(300);
    }

    await window.keyboard.press('Escape');
    await window.waitForTimeout(300);
  } catch {
    // Best effort cleanup
  }

  await closeApp(electronApp);
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== 'passed') {
    await screenshot(window, `dropdown-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('settings has dropdown terminal section', async () => {
  await window.keyboard.press('Meta+,');
  await window.waitForTimeout(500);

  // Scroll to find dropdown section
  const scrollContainer = window.locator('.settings-overlay .overflow-y-auto');
  if (await scrollContainer.count() > 0) {
    await scrollContainer.evaluate(el => el.scrollTop = 1500);
    await window.waitForTimeout(300);
  }

  const dropdownLabel = window.locator('.settings-overlay >> text=/Dropdown|dropdown/i');
  const count = await dropdownLabel.count();
  expect(count).toBeGreaterThan(0);

  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
});

test('dropdown section has hotkey display', async () => {
  await window.keyboard.press('Meta+,');
  await window.waitForTimeout(500);

  const scrollContainer = window.locator('.settings-overlay .overflow-y-auto');
  if (await scrollContainer.count() > 0) {
    await scrollContainer.evaluate(el => el.scrollTop = 1500);
    await window.waitForTimeout(300);
  }

  // Look for hotkey-related text
  const hotkeyText = window.locator('.settings-overlay >> text=/hotkey|shortcut|Ctrl|`/i');
  const count = await hotkeyText.count();
  expect(count).toBeGreaterThan(0);

  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
});

test('dropdown section has height setting', async () => {
  await window.keyboard.press('Meta+,');
  await window.waitForTimeout(500);

  const scrollContainer = window.locator('.settings-overlay .overflow-y-auto');
  if (await scrollContainer.count() > 0) {
    await scrollContainer.evaluate(el => el.scrollTop = 1500);
    await window.waitForTimeout(300);
  }

  // Look for height percentage options (25%, 50%, 75%, 100%)
  const heightText = window.locator('.settings-overlay >> text=/50%|height/i');
  const count = await heightText.count();
  expect(count).toBeGreaterThan(0);

  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
});

test('window starts in normal (non-dropdown) mode', async () => {
  // In normal mode, the window should not be always-on-top
  const isAlwaysOnTop = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    return win?.isAlwaysOnTop() || false;
  });

  expect(isAlwaysOnTop).toBe(false);
});
