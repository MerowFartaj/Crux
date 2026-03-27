import { BrowserWindow, screen, globalShortcut, app } from 'electron';

export const DROPDOWN_TEMP_DISABLED = true;
const DEFAULT_DROPDOWN_SHORTCUT = 'Alt+Space';
const DEFAULT_WINDOW_WIDTH = 900;
const DEFAULT_WINDOW_HEIGHT = 600;
const MIN_WINDOW_WIDTH = 400;
const MIN_WINDOW_HEIGHT = 300;

export interface DropdownManager {
  toggle: () => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  isVisible: () => boolean;
  destroy: () => void;
}

export function createDropdownManager(win: BrowserWindow, store: { get: (key: string) => any }): DropdownManager {
  let enabled = false;
  let visible = false;
  let hiding = false;
  let savedBounds: Electron.Rectangle | null = null;
  let savedMinimumSize: [number, number] | null = null;
  let savedResizable = true;
  let savedMovable = true;
  let savedMaximizable = true;
  let registeredShortcut: string | null = null;

  function getShortcut(): string {
    return (store.get('dropdownShortcut') as string) || DEFAULT_DROPDOWN_SHORTCUT;
  }

  function getHeight(): number {
    return (store.get('dropdownHeight') as number) || 50;
  }

  function getAutoHide(): boolean {
    return (store.get('dropdownAutoHide') as boolean) || false;
  }

  function getDropdownBounds(): Electron.Rectangle {
    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    const { workArea } = display;

    return {
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: Math.round(workArea.height * (getHeight() / 100)),
    };
  }

  function getDefaultWindowBounds(): Electron.Rectangle {
    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    const { workArea } = display;
    const width = Math.min(DEFAULT_WINDOW_WIDTH, workArea.width);
    const height = Math.min(DEFAULT_WINDOW_HEIGHT, workArea.height);

    return {
      x: workArea.x + Math.round((workArea.width - width) / 2),
      y: workArea.y + Math.round((workArea.height - height) / 2),
      width,
      height,
    };
  }

  function hasValidBounds(bounds: Electron.Rectangle | null): bounds is Electron.Rectangle {
    return !!bounds && bounds.width >= MIN_WINDOW_WIDTH && bounds.height >= MIN_WINDOW_HEIGHT;
  }

  function positionWindow() {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    }
    if (win.isMaximized()) {
      win.unmaximize();
    }

    win.setBounds(getDropdownBounds(), false);
  }

  function show() {
    if (DROPDOWN_TEMP_DISABLED || !enabled || visible || hiding) return;
    visible = true;

    positionWindow();
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.show();
    win.focus();

    // Tell renderer to animate in
    win.webContents.send('dropdown:animate', 'in');
  }

  function hide() {
    if (!visible || hiding) return;
    hiding = true;

    // Tell renderer to animate out
    win.webContents.send('dropdown:animate', 'out');

    // Wait for animation then hide
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.hide();
      }
      visible = false;
      hiding = false;
    }, 150);
  }

  function toggle() {
    if (DROPDOWN_TEMP_DISABLED || !enabled) return;
    if (visible) {
      hide();
    } else {
      show();
    }
  }

  function registerHotkey() {
    const shortcut = getShortcut();
    if (registeredShortcut) {
      globalShortcut.unregister(registeredShortcut);
      registeredShortcut = null;
    }
    try {
      const success = globalShortcut.register(shortcut, toggle);
      if (success) {
        registeredShortcut = shortcut;
      }
    } catch (err) {
      console.error('Failed to register dropdown shortcut:', err);
    }
  }

  function unregisterHotkey() {
    if (registeredShortcut) {
      globalShortcut.unregister(registeredShortcut);
      registeredShortcut = null;
    }
  }

  // Auto-hide on blur
  let blurHandler: (() => void) | null = null;

  function setupAutoHide() {
    if (blurHandler) {
      win.removeListener('blur', blurHandler);
      blurHandler = null;
    }
    if (getAutoHide()) {
      blurHandler = () => {
        if (enabled && visible) {
          hide();
        }
      };
      win.on('blur', blurHandler);
    }
  }

  function enable() {
    if (DROPDOWN_TEMP_DISABLED || enabled) return;
    enabled = true;

    // Save current window bounds for restoring later
    savedBounds = win.getNormalBounds();
    const [minimumWidth, minimumHeight] = win.getMinimumSize();
    savedMinimumSize = [minimumWidth, minimumHeight];
    savedResizable = win.isResizable();
    savedMovable = win.isMovable();
    savedMaximizable = win.isMaximizable();

    // Configure window for dropdown mode
    win.setAlwaysOnTop(true, 'floating');
    win.setSkipTaskbar(true);
    win.setResizable(false);
    win.setMovable(false);
    win.setMaximizable(false);
    win.setMinimumSize(0, 0);

    // Hide from dock on macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    registerHotkey();
    setupAutoHide();

    // Notify renderer
    win.webContents.send('dropdown:modeChanged', true);

    // Position and show
    positionWindow();
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    visible = false;
    hiding = false;

    unregisterHotkey();

    // Remove blur handler
    if (blurHandler) {
      win.removeListener('blur', blurHandler);
      blurHandler = null;
    }

    // Restore window to normal mode
    win.setAlwaysOnTop(false);
    win.setSkipTaskbar(false);
    win.setResizable(savedResizable);
    win.setMovable(savedMovable);
    win.setMaximizable(savedMaximizable);
    if (savedMinimumSize) {
      win.setMinimumSize(savedMinimumSize[0], savedMinimumSize[1]);
      savedMinimumSize = null;
    }

    // Show dock on macOS
    if (process.platform === 'darwin') {
      app.dock.show();
    }

    // Restore saved bounds
    if (hasValidBounds(savedBounds)) {
      win.setBounds(savedBounds);
    } else {
      win.setBounds(getDefaultWindowBounds(), false);
    }
    savedBounds = null;

    win.show();
    win.focus();

    // Notify renderer
    win.webContents.send('dropdown:modeChanged', false);
  }

  function destroy() {
    unregisterHotkey();
    if (blurHandler) {
      win.removeListener('blur', blurHandler);
    }
  }

  return {
    toggle,
    show,
    hide,
    enable,
    disable,
    isEnabled: () => enabled,
    isVisible: () => visible,
    destroy,
  };
}
