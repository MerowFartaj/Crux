import { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import Store from 'electron-store';
import { createPty, writePty, resizePty, destroyPty, getPtyCwd, tryGetPtyCwd, destroyAllPtys } from './pty';
import { initDatabase, addHistoryEntry, searchHistory, getAllHistory, getHistoryByDirectory, getHistoryStats, closeDatabase } from './database';
import { getSystemStats, startMonitoring, stopMonitoring } from './system-stats';
import { TmuxControlSession } from './tmux-control';
import { askAI, askAIStream, getAISettings, getCheapModel, AI_MODELS, AI_PROMPTS } from './ai';
import {
  getSSHConnections, saveSSHConnection, deleteSSHConnection, getSSHGroups,
  saveSSHPassword, getSSHPassword, deleteSSHPassword,
  parseSSHConfig, importFromSSHConfig, buildSSHArgs,
  exportSSHConnections, importSSHConnections,
} from './ssh';
import { createDropdownManager, DropdownManager, DROPDOWN_TEMP_DISABLED } from './dropdown';
import { createTray, destroyTray } from './tray';

const DEFAULT_DROPDOWN_SHORTCUT = 'Alt+Space';
const LEGACY_DROPDOWN_SHORTCUT = 'CommandOrControl+`';
const DEFAULT_WINDOW_WIDTH = 900;
const DEFAULT_WINDOW_HEIGHT = 600;
const MIN_WINDOW_WIDTH = 400;
const MIN_WINDOW_HEIGHT = 300;

const store = new Store({
  encryptionKey: 'crux-terminal-encryption-key-2026',
  defaults: {
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    accentColor: '#3B82F6',
    soundVolume: 0.3,
    soundMuted: false,
    shell: '/bin/zsh',
    anthropicApiKey: '',
    openaiApiKey: '',
    aiProvider: 'claude',
    aiModel: 'claude-haiku-4-5-20251001',
    aiEnabled: true,
    commandTooltips: true,
    workflows: [],
    tmuxEnabled: false,
    tmuxAutoAttach: true,
    tmuxDefaultSession: 'crux',
    onboardingComplete: false,
    previewEnabled: true,
    previewClickablePaths: true,
    previewInlineImages: true,
    previewHoverTooltips: false,
    vibrancy: 'none',
    fontLigatures: true,
    linkOpenBehavior: 'preview',
    dropdownMode: false,
    dropdownShortcut: DEFAULT_DROPDOWN_SHORTCUT,
    dropdownHeight: 50,
    dropdownAutoHide: false,
    keepInBackground: true,
    launchAtLogin: false,
    sshConnections: [],
    sshPasswords: {},
    savedSession: null,
  },
});

const storedDropdownShortcut = store.get('dropdownShortcut') as string | undefined;
if (!storedDropdownShortcut || storedDropdownShortcut === LEGACY_DROPDOWN_SHORTCUT) {
  store.set('dropdownShortcut', DEFAULT_DROPDOWN_SHORTCUT);
}

if (DROPDOWN_TEMP_DISABLED) {
  store.set('dropdownMode', false);
  store.set('dropdownAutoHide', false);
}

['windowBounds', 'windowState', 'windowPosition', 'windowSize'].forEach((key) => {
  (store as any).delete(key);
});

let mainWindow: BrowserWindow | null = null;
let tmuxSession: TmuxControlSession | null = null;
let dropdownManager: DropdownManager | null = null;
let isQuitting = false;

function getCurrentDisplayWorkArea(): Electron.Rectangle {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
}

function getDefaultWindowBounds(): Electron.Rectangle {
  const workArea = getCurrentDisplayWorkArea();
  const width = Math.min(DEFAULT_WINDOW_WIDTH, workArea.width);
  const height = Math.min(DEFAULT_WINDOW_HEIGHT, workArea.height);

  return {
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    width,
    height,
  };
}

function getDropdownLaunchBounds(): Electron.Rectangle {
  const workArea = getCurrentDisplayWorkArea();
  const dropdownHeight = Math.round(workArea.height * (((store.get('dropdownHeight') as number) || 50) / 100));

  return {
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: dropdownHeight,
  };
}

function hasValidWindowBounds(bounds: Electron.Rectangle): boolean {
  return bounds.width >= MIN_WINDOW_WIDTH && bounds.height >= MIN_WINDOW_HEIGHT;
}

function applySafeLaunchBounds(win: BrowserWindow): void {
  const launchBounds = (store.get('dropdownMode') as boolean)
    ? getDropdownLaunchBounds()
    : getDefaultWindowBounds();

  win.setBounds(launchBounds, false);

  if (!hasValidWindowBounds(win.getBounds())) {
    win.setBounds(getDefaultWindowBounds(), false);
  }
}

function createWindow(): void {
  const vibrancy = store.get('vibrancy') as string | undefined;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    center: true,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 }, // hide native traffic lights
    backgroundColor: '#0A0A0F',
    transparent: !!vibrancy && vibrancy !== 'none',
    vibrancy: (vibrancy && vibrancy !== 'none' ? vibrancy : undefined) as any,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  // Only override bounds for dropdown mode — normal mode uses 1200x800 centered
  if (store.get('dropdownMode') as boolean) {
    const bounds = getDropdownLaunchBounds();
    mainWindow.setBounds(bounds, false);
  }

  // Using default Electron icon for now

  // In development, load from webpack dev server; in production, load the built file
  const isDev = !app.isPackaged;
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// PTY IPC handlers (routes through tmux when connected)
ipcMain.handle('pty:create', async (_event, id: string, shellPath?: string, cwd?: string, args?: string[]) => {
  if (!mainWindow) return;
  if (tmuxSession?.connected && !args) {
    await tmuxSession.createPane(id);
  } else {
    const resolvedShell = shellPath || (store.get('shell') as string) || '/bin/zsh';
    createPty(id, mainWindow, resolvedShell, cwd, args);
  }
});

ipcMain.on('pty:write', (_event, id: string, data: string) => {
  if (tmuxSession?.connected) {
    tmuxSession.writeToPane(id, data);
  } else {
    writePty(id, data);
  }
});

ipcMain.on('pty:resize', (_event, id: string, cols: number, rows: number) => {
  if (tmuxSession?.connected) {
    tmuxSession.resizePane(id, cols, rows);
  } else {
    resizePty(id, cols, rows);
  }
});

ipcMain.on('pty:destroy', (_event, id: string) => {
  if (tmuxSession?.connected) {
    tmuxSession.destroyPane(id);
  } else {
    destroyPty(id);
  }
});

ipcMain.handle('pty:getCwd', async (_event, id: string) => {
  return getPtyCwd(id);
});

// Database IPC handlers
ipcMain.handle('db:addEntry', async (_event, entry) => {
  return addHistoryEntry(entry);
});

ipcMain.handle('db:search', async (_event, query: string, limit?: number) => {
  return searchHistory(query, limit);
});

ipcMain.handle('db:getAll', async (_event, limit?: number, offset?: number) => {
  return getAllHistory(limit, offset);
});

ipcMain.handle('db:getByDirectory', async (_event, directory: string) => {
  return getHistoryByDirectory(directory);
});

ipcMain.handle('db:getStats', async () => {
  return getHistoryStats();
});

// System stats IPC handlers
ipcMain.handle('system:getStats', async () => {
  return getSystemStats();
});

ipcMain.on('system:startMonitoring', (_event, intervalMs: number) => {
  if (mainWindow) startMonitoring(mainWindow, intervalMs);
});

ipcMain.on('system:stopMonitoring', () => {
  stopMonitoring();
});

// Store IPC handlers
ipcMain.handle('store:get', async (_event, key: string) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (_event, key: string, value: any) => {
  store.set(key, value);
});

// Git IPC handlers
ipcMain.handle('git:getBranch', async (_event, cwd: string) => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', {
      cwd,
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();
    return branch;
  } catch {
    return null;
  }
});

// Shell IPC handlers
ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
  return shell.openPath(filePath);
});

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  return shell.openExternal(url);
});

// File IPC handlers
ipcMain.handle('file:read', async (_event, filePath: string) => {
  return fs.promises.readFile(filePath, 'utf-8');
});

ipcMain.handle('file:readBinary', async (_event, filePath: string) => {
  const buf = await fs.promises.readFile(filePath);
  return buf.toString('base64');
});

ipcMain.handle('file:stat', async (_event, filePath: string) => {
  const stats = await fs.promises.stat(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    modified: stats.mtimeMs,
  };
});

ipcMain.handle('file:resolve', async (_event, filePath: string, context?: { tabId?: string; cwd?: string }) => {
  const home = process.env.HOME || '/tmp';
  const expandHome = (p: string) => p.startsWith('~/') ? path.join(home, p.slice(2)) : p === '~' ? home : p;
  const resolvedFile = expandHome(filePath);
  if (path.isAbsolute(resolvedFile)) return resolvedFile;

  let resolvedCwd = '';
  if (context?.tabId) {
    const liveCwd = await tryGetPtyCwd(context.tabId);
    if (liveCwd && path.isAbsolute(expandHome(liveCwd))) {
      const expandedLiveCwd = expandHome(liveCwd);
      resolvedCwd = expandedLiveCwd;
    }
  }

  if (!resolvedCwd && context?.cwd) {
    const fallbackCwd = expandHome(context.cwd);
    if (path.isAbsolute(fallbackCwd)) {
      resolvedCwd = fallbackCwd;
    }
  }

  if (!resolvedCwd && context?.tabId) {
    const trackedCwd = expandHome(await getPtyCwd(context.tabId));
    if (path.isAbsolute(trackedCwd)) {
      resolvedCwd = trackedCwd;
    }
  }

  if (!resolvedCwd) {
    throw new Error('Relative path resolution requires an absolute shell cwd');
  }

  return path.resolve(resolvedCwd, resolvedFile);
});

// SSH IPC handlers
ipcMain.handle('ssh:getConnections', async () => getSSHConnections(store));
ipcMain.handle('ssh:saveConnection', async (_event, conn) => saveSSHConnection(store, conn));
ipcMain.handle('ssh:deleteConnection', async (_event, id: string) => deleteSSHConnection(store, id));
ipcMain.handle('ssh:getGroups', async () => getSSHGroups(store));
ipcMain.handle('ssh:savePassword', async (_event, id: string, password: string) => saveSSHPassword(store, id, password));
ipcMain.handle('ssh:getPassword', async (_event, id: string) => getSSHPassword(store, id));
ipcMain.handle('ssh:deletePassword', async (_event, id: string) => deleteSSHPassword(store, id));
ipcMain.handle('ssh:parseConfig', async (_event, configPath?: string) => parseSSHConfig(configPath));
ipcMain.handle('ssh:importConfig', async (_event, configPath?: string) => importFromSSHConfig(store, configPath));
ipcMain.handle('ssh:exportConnections', async () => exportSSHConnections(store));
ipcMain.handle('ssh:importConnections', async (_event, json: string) => importSSHConnections(store, json));
ipcMain.handle('ssh:buildArgs', async (_event, conn) => buildSSHArgs(conn));

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    defaultPath: path.join(os.homedir(), '.ssh'),
  });
  return result.filePaths[0] || null;
});

// Session save/restore IPC
ipcMain.handle('session:save', async (_event, sessionData: any) => {
  store.set('savedSession', sessionData);
});

ipcMain.handle('session:load', async () => {
  return store.get('savedSession') || null;
});

ipcMain.handle('session:clear', async () => {
  store.delete('savedSession');
});

// tmux IPC handlers
ipcMain.handle('tmux:isInstalled', async () => {
  return TmuxControlSession.isInstalled();
});

ipcMain.handle('tmux:start', async (_event, sessionName?: string) => {
  if (!mainWindow) throw new Error('No window');
  if (tmuxSession?.connected) {
    await tmuxSession.detach();
  }
  tmuxSession = new TmuxControlSession(mainWindow);
  await tmuxSession.start(sessionName);
});

ipcMain.handle('tmux:attach', async (_event, sessionName: string) => {
  if (!mainWindow) throw new Error('No window');
  if (tmuxSession?.connected) {
    await tmuxSession.detach();
  }
  tmuxSession = new TmuxControlSession(mainWindow);
  await tmuxSession.attach(sessionName);
});

ipcMain.handle('tmux:detach', async () => {
  if (tmuxSession?.connected) {
    await tmuxSession.detach();
  }
  tmuxSession = null;
});

ipcMain.handle('tmux:listSessions', async () => {
  return TmuxControlSession.listSessions();
});

ipcMain.handle('tmux:getState', async () => {
  if (tmuxSession) {
    return tmuxSession.getState();
  }
  return {
    enabled: false,
    connected: false,
    sessionName: null,
    sessions: TmuxControlSession.listSessions(),
  };
});

ipcMain.handle('tmux:splitPane', async (_event, tabId: string, direction: 'h' | 'v') => {
  if (!tmuxSession?.connected) throw new Error('tmux not connected');
  return tmuxSession.splitPane(tabId, direction);
});

// AI IPC handlers (unified multi-model)
ipcMain.handle('ai:translateCommand', async (_event, description: string) => {
  const settings = getAISettings(store);
  return askAI(description, AI_PROMPTS.translate, settings, 256);
});

ipcMain.handle('ai:explainError', async (_event, command: string, output: string, exitCode: number) => {
  const settings = getAISettings(store);
  return askAI(
    `Command: ${command}\nExit code: ${exitCode}\nOutput (last 3000 chars):\n${output}`,
    AI_PROMPTS.errorExplain, settings, 512
  );
});

ipcMain.handle('ai:ask', async (_event, prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) => {
  const settings = getAISettings(store);
  return askAI(prompt, systemPrompt, settings, maxTokens || 1024, timeoutMs || 30000);
});

ipcMain.handle('ai:askCheap', async (_event, prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) => {
  const settings = getCheapModel(getAISettings(store));
  return askAI(prompt, systemPrompt, settings, maxTokens || 256, timeoutMs || 10000);
});

ipcMain.handle('ai:suggest', async (_event, partial: string, cwd: string, recentCommands: string[]) => {
  const settings = getCheapModel(getAISettings(store));
  return askAI(
    `Current directory: ${cwd}\nRecent commands:\n${recentCommands.join('\n')}\n\nPartial input: ${partial}`,
    'You are a terminal autocomplete. Suggest ONE completed command. Respond with ONLY the full command. Nothing else.',
    settings, 100, 2000
  );
});

ipcMain.handle('ai:commitMessage', async (_event, diff: string) => {
  const settings = getAISettings(store);
  return askAI(`Git diff of staged changes:\n${diff}`, AI_PROMPTS.commitMessage, settings, 200);
});

ipcMain.handle('ai:getModels', async () => {
  return AI_MODELS;
});

// Streaming AI — sends chunks to renderer via IPC events
let activeStreamAbort: (() => void) | null = null;

ipcMain.handle('ai:stream', async (_event, requestId: string, prompt: string, systemPrompt: string, maxTokens?: number) => {
  if (!mainWindow) return;
  const settings = getAISettings(store);
  let aborted = false;
  activeStreamAbort = () => { aborted = true; };

  try {
    await askAIStream(prompt, systemPrompt, settings, (chunk) => {
      if (aborted || !mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send('ai:chunk', requestId, chunk);
    }, maxTokens || 1024);
  } catch (err: any) {
    if (!aborted && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ai:chunk', requestId, `\n[Error: ${err.message}]`);
    }
  } finally {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ai:done', requestId);
    }
    activeStreamAbort = null;
  }
});

ipcMain.on('ai:cancelStream', () => {
  if (activeStreamAbort) activeStreamAbort();
});

// Project detection for context-aware autocomplete
ipcMain.handle('pty:detectProject', async (_event, cwd: string) => {
  const checks = [
    { file: 'package.json', type: 'node' },
    { file: 'Cargo.toml', type: 'rust' },
    { file: 'go.mod', type: 'go' },
    { file: 'Makefile', type: 'make' },
    { file: 'CMakeLists.txt', type: 'cmake' },
    { file: 'requirements.txt', type: 'python' },
    { file: 'Pipfile', type: 'python' },
    { file: 'pyproject.toml', type: 'python' },
    { file: 'docker-compose.yml', type: 'docker' },
    { file: 'docker-compose.yaml', type: 'docker' },
    { file: 'Dockerfile', type: 'docker' },
    { file: 'Gemfile', type: 'ruby' },
    { file: '.git', type: 'git' },
  ];

  const detected: string[] = [];
  for (const { file, type } of checks) {
    try {
      await fs.promises.access(path.join(cwd, file));
      if (!detected.includes(type)) detected.push(type);
    } catch {}
  }
  return detected;
});

// Shell IPC handlers
ipcMain.handle('shell:getDefault', async () => {
  return process.env.SHELL || '/bin/zsh';
});

// Window IPC handlers
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  const keepInBg = store.get('keepInBackground') as boolean;
  const isDropdown = dropdownManager?.isEnabled() || false;
  if (keepInBg && isDropdown && !isQuitting) {
    if (dropdownManager) {
      dropdownManager.hide();
    } else {
      mainWindow?.hide();
    }
  } else {
    mainWindow?.close();
  }
});

// Vibrancy IPC handler
ipcMain.handle('window:setVibrancy', (_event, mode: string) => {
  if (!mainWindow) return;
  if (mode === 'none') {
    mainWindow.setVibrancy(null as any);
    mainWindow.setBackgroundColor('#0A0A0F');
  } else {
    mainWindow.setVibrancy(mode as any);
  }
});

// Dropdown IPC handlers
ipcMain.on('dropdown:toggle', () => {
  if (DROPDOWN_TEMP_DISABLED) return;
  dropdownManager?.toggle();
});

ipcMain.on('dropdown:setMode', (_event, enabled: boolean) => {
  if (!dropdownManager) return;
  if (DROPDOWN_TEMP_DISABLED) {
    store.set('dropdownMode', false);
    store.set('dropdownAutoHide', false);
    mainWindow?.webContents.send('dropdown:modeChanged', false);
    return;
  }
  if (enabled) {
    dropdownManager.enable();
    store.set('dropdownMode', true);
  } else {
    dropdownManager.disable();
    store.set('dropdownMode', false);
  }
});

ipcMain.handle('dropdown:getMode', () => {
  if (DROPDOWN_TEMP_DISABLED) return false;
  return dropdownManager?.isEnabled() || false;
});

// App path handler
ipcMain.handle('app:getPath', async (_event, name: string) => {
  return app.getPath(name as any);
});

// App lifecycle
app.whenReady().then(() => {
  initDatabase();
  createWindow();

  // Initialize dropdown manager and tray
  if (mainWindow) {
    dropdownManager = createDropdownManager(mainWindow, store);
    createTray(mainWindow, dropdownManager);

    // If dropdown mode was saved, enable it
    if (!DROPDOWN_TEMP_DISABLED && (store.get('dropdownMode') as boolean)) {
      dropdownManager.enable();
    }

    // Handle launch at login
    const launchAtLogin = store.get('launchAtLogin') as boolean;
    app.setLoginItemSettings({ openAtLogin: launchAtLogin });

    // Close-to-tray: intercept the close event on the window
    mainWindow.on('close', (e) => {
      if (isQuitting) return; // let it close
      const keepInBg = store.get('keepInBackground') as boolean;
      if (keepInBg && dropdownManager?.isEnabled()) {
        e.preventDefault();
        dropdownManager.hide();
      }
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      if (dropdownManager?.isEnabled()) {
        dropdownManager.show();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
});

app.on('window-all-closed', () => {
  stopMonitoring();
  if (tmuxSession?.connected) {
    tmuxSession.detach().catch(() => {});
    tmuxSession = null;
  }
  destroyAllPtys();
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopMonitoring();
  if (dropdownManager) {
    dropdownManager.destroy();
    dropdownManager = null;
  }
  destroyTray();
  globalShortcut.unregisterAll();
  if (tmuxSession?.connected) {
    tmuxSession.detach().catch(() => {});
    tmuxSession = null;
  }
  destroyAllPtys();
  closeDatabase();
});
