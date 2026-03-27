import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import { DropdownManager, DROPDOWN_TEMP_DISABLED } from './dropdown';
import path from 'path';

let tray: Tray | null = null;

export function createTray(win: BrowserWindow, dropdown: DropdownManager): Tray {
  // Use the custom tray icon from assets (macOS auto-picks @2x for retina)
  const trayIconPath = path.join(__dirname, '..', '..', 'assets', 'trayIcon.png');
  const icon = nativeImage.createFromPath(trayIconPath);
  const resized = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 18, height: 18 });

  tray = new Tray(resized);
  tray.setToolTip('CRUX Terminal');

  function updateMenu() {
    const isDropdown = !DROPDOWN_TEMP_DISABLED && dropdown.isEnabled();
    const menu = Menu.buildFromTemplate([
      {
        label: dropdown.isVisible() ? 'Hide CRUX' : 'Show CRUX',
        click: () => {
          if (isDropdown) {
            dropdown.toggle();
          } else {
            if (win.isVisible()) {
              win.hide();
            } else {
              win.show();
              win.focus();
            }
          }
        },
      },
      { type: 'separator' },
      {
        label: DROPDOWN_TEMP_DISABLED ? 'Dropdown Mode (Temporarily Disabled)' : 'Dropdown Mode',
        type: 'checkbox',
        checked: isDropdown,
        enabled: !DROPDOWN_TEMP_DISABLED,
        click: () => {
          if (isDropdown) {
            dropdown.disable();
          } else {
            dropdown.enable();
          }
          updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          if (!win.isVisible()) {
            if (isDropdown) {
              dropdown.show();
            } else {
              win.show();
            }
          }
          win.focus();
          win.webContents.send('open:settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit CRUX',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray?.setContextMenu(menu);
  }

  // Click tray icon to toggle visibility
  tray.on('click', () => {
    if (dropdown.isEnabled()) {
      dropdown.toggle();
    } else {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
    updateMenu();
  });

  updateMenu();

  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
