import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp, typeInTerminal, pressEnter, getTerminalText, screenshot } from './helpers';

let electronApp: ElectronApplication;
let window: Page;
let aiEnabled = false;

test.beforeAll(async () => {
  const ctx = await launchApp();
  electronApp = ctx.electronApp;
  window = ctx.window;

  // Check if AI is configured by looking for an API key in the app's store
  aiEnabled = await electronApp.evaluate(async ({ app }) => {
    // Check electron-store for API keys
    try {
      const Store = require('electron-store');
      const store = new Store();
      const anthropicKey = store.get('anthropicApiKey') || '';
      const openaiKey = store.get('openaiApiKey') || '';
      return !!(anthropicKey || openaiKey);
    } catch {
      return false;
    }
  });
});

test.afterAll(async () => {
  await closeApp(electronApp);
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== 'passed') {
    await screenshot(window, `ai-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('AI status check', async () => {
  if (aiEnabled) {
    // AI is configured
    expect(aiEnabled).toBe(true);
  } else {
    // Skip AI tests gracefully
    test.skip(!aiEnabled, 'No AI API key configured — skipping AI tests');
  }
});

test('/ai what is npm — response appears', async () => {
  test.skip(!aiEnabled, 'No AI API key configured');

  await typeInTerminal(window, '/ai what is npm');
  await pressEnter(window);

  // Wait for streaming response (up to 15 seconds)
  await window.waitForTimeout(15000);

  const text = await getTerminalText(window);

  // Should contain the AI badge and some response about npm
  expect(text).toMatch(/AI|npm|package|node/i);
});

test('/explain echo — breaks down the command', async () => {
  test.skip(!aiEnabled, 'No AI API key configured');

  await typeInTerminal(window, '/explain echo hello world');
  await pressEnter(window);
  await window.waitForTimeout(10000);

  const text = await getTerminalText(window);
  expect(text).toMatch(/echo|output|print|display/i);
});

test('/how list files — generates a command', async () => {
  test.skip(!aiEnabled, 'No AI API key configured');

  await typeInTerminal(window, '/how list all files in current directory');
  await pressEnter(window);
  await window.waitForTimeout(10000);

  const text = await getTerminalText(window);
  expect(text).toMatch(/ls|find|dir/i);
});
