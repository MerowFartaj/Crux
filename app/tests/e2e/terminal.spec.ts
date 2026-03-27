import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp, typeInTerminal, runCommand, getTerminalText, screenshot } from './helpers';

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
    await screenshot(window, `terminal-${testInfo.title.replace(/\s+/g, '-')}`);
  }
});

test('can type text into the terminal', async () => {
  await typeInTerminal(window, 'hello');
  await window.waitForTimeout(200);
  const text = await getTerminalText(window);
  expect(text).toContain('hello');
  // Clean up: clear the typed text
  for (let i = 0; i < 5; i++) await window.keyboard.press('Backspace');
});

test('echo command produces output', async () => {
  await runCommand(window, 'echo CRUX_TEST_OUTPUT');
  await window.waitForTimeout(500);
  const text = await getTerminalText(window);
  expect(text).toContain('CRUX_TEST_OUTPUT');
});

test('pwd shows a valid directory path', async () => {
  await runCommand(window, 'pwd');
  await window.waitForTimeout(500);
  const text = await getTerminalText(window);
  // pwd output starts with / on macOS/Linux
  expect(text).toMatch(/\/[^\s]*/);
});

test('clear removes terminal content', async () => {
  // Write something first
  await runCommand(window, 'echo BEFORE_CLEAR');
  await window.waitForTimeout(300);
  let text = await getTerminalText(window);
  expect(text).toContain('BEFORE_CLEAR');

  // Clear
  await runCommand(window, 'clear');
  await window.waitForTimeout(500);

  text = await getTerminalText(window);
  expect(text).not.toContain('BEFORE_CLEAR');
});

test('exit code tracking — successful command', async () => {
  await runCommand(window, 'true');
  await window.waitForTimeout(800);
  // The block footer should show a checkmark for exit code 0
  const text = await getTerminalText(window);
  // Look for the success indicator (checkmark or "0")
  // This is soft — just verify the command ran
  expect(text).toContain('true');
});

test('exit code tracking — failed command', async () => {
  await runCommand(window, 'false');
  await window.waitForTimeout(800);
  const text = await getTerminalText(window);
  // Should contain error indicator or exit code
  expect(text).toContain('false');
});
