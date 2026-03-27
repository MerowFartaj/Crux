import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface AppContext {
  electronApp: ElectronApplication;
  window: Page;
}

/**
 * Clear saved app state so each test starts fresh (no leftover splits, tabs, etc.)
 */
// Keys to preserve across test resets (user credentials & preferences)
const PRESERVE_KEYS = [
  'anthropicApiKey', 'openaiApiKey', 'aiProvider', 'aiModel',
  'fontSize', 'fontFamily', 'accentColor', 'soundVolume', 'soundMuted', 'shell',
];

function getConfigPath(): string {
  return path.join(
    os.homedir(),
    'Library', 'Application Support', 'crux-terminal', 'config.json'
  );
}

function clearAppState(): void {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const cleaned: Record<string, any> = {};
      for (const key of PRESERVE_KEYS) {
        if (config[key] !== undefined) cleaned[key] = config[key];
      }
      fs.writeFileSync(configPath, JSON.stringify(cleaned, null, 2));
    }
  } catch {
    // Config might not exist yet or be corrupt — delete it entirely
    try { fs.unlinkSync(getConfigPath()); } catch {}
  }
}

/**
 * Launch CRUX Terminal and wait for it to be ready.
 * Assumes the app has already been built (npm run build).
 */
export async function launchApp(): Promise<AppContext> {
  const appDir = path.resolve(__dirname, '..', '..');

  // Clear saved UI state to ensure clean start (1 tab, no splits)
  clearAppState();

  const electronApp = await electron.launch({
    args: ['.'],
    cwd: appDir,
  });

  const window = await electronApp.firstWindow();

  // Wait for DOM ready, then give the app time to fully render + PTY init
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(3000);

  return { electronApp, window };
}

/**
 * Close the app cleanly.
 */
export async function closeApp(electronApp: ElectronApplication): Promise<void> {
  if (electronApp) {
    await electronApp.close().catch(() => {});
  }
}

/**
 * Type text into the terminal by simulating keyboard input.
 */
export async function typeInTerminal(window: Page, text: string): Promise<void> {
  // Dismiss any overlay that might intercept clicks (settings, SSH manager, etc.)
  await window.evaluate(() => {
    document.querySelectorAll('.fixed.inset-0.z-50').forEach(el => (el as HTMLElement).style.display = 'none');
  });
  await window.click('.xterm', { force: true });
  await window.waitForTimeout(100);
  await window.keyboard.type(text, { delay: 30 });
}

/**
 * Press Enter in the terminal.
 */
export async function pressEnter(window: Page): Promise<void> {
  await window.keyboard.press('Enter');
}

/**
 * Type a command and press Enter.
 */
export async function runCommand(window: Page, command: string): Promise<void> {
  await typeInTerminal(window, command);
  await pressEnter(window);
  await window.waitForTimeout(500);
}

/**
 * Get visible text content from the terminal.
 */
export async function getTerminalText(window: Page): Promise<string> {
  return window.evaluate(() => {
    // xterm renders to canvas (WebGL), so we read from the terminal buffer directly.
    // The xterm instance is stored on the DOM element by the Terminal component.
    const xtermEl = document.querySelector('.xterm') as any;
    if (!xtermEl) return '';

    // Access the xterm Terminal instance through its internal reference
    // xterm.js stores the Terminal on the element via _core
    const term = (xtermEl as any)._xterm || (xtermEl as any).__xterm;
    if (term) {
      const buf = term.buffer.active;
      const lines: string[] = [];
      for (let i = 0; i <= buf.cursorY + 5; i++) {
        const line = buf.getLine(i);
        if (line) lines.push(line.translateToString(true));
      }
      return lines.join('\n');
    }

    // Fallback: try DOM selectors
    const accessRows = document.querySelectorAll('.xterm-accessibility-tree > div');
    if (accessRows.length > 0) {
      return Array.from(accessRows).map(r => r.textContent || '').join('\n');
    }
    const rows = document.querySelectorAll('.xterm-rows > div');
    return Array.from(rows).map(r => r.textContent || '').join('\n');
  });
}

/**
 * Count the number of visible tabs in the tab bar.
 */
export async function getTabCount(window: Page): Promise<number> {
  return window.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-indicator');
    return tabs.length;
  });
}

/**
 * Take a screenshot for debugging.
 */
export async function screenshot(window: Page, name: string): Promise<void> {
  await window.screenshot({
    path: path.resolve(__dirname, 'screenshots', `${name}.png`),
  });
}
