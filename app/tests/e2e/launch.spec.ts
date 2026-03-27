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
    await screenshot(window, `launch-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('app launches without errors', async () => {
  // The app launched successfully in beforeAll
  expect(electronApp).toBeTruthy();
  expect(window).toBeTruthy();
});

test('window has reasonable dimensions', async () => {
  const size = await window.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  expect(size.width).toBeGreaterThan(600);
  expect(size.height).toBeGreaterThan(400);
});

test('title bar is visible', async () => {
  const titlebar = window.locator('.titlebar-drag');
  await expect(titlebar).toBeVisible();
});

test('tab bar is visible with at least one tab', async () => {
  const tabs = window.locator('.tab-indicator');
  const count = await tabs.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test('terminal element is present and visible', async () => {
  const terminal = window.locator('.xterm');
  await expect(terminal).toBeVisible();
});

test('terminal screen is rendered', async () => {
  const screen = window.locator('.xterm-screen');
  await expect(screen).toBeVisible();
});
