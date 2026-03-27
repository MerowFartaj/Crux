import { BrowserWindow } from 'electron';
import { spawn, ChildProcess, execSync } from 'child_process';
import { EventEmitter } from 'events';
import { TmuxSession, TmuxState } from '../shared/tmux-types';
import { parseTmuxLayout, SplitNode } from './tmux-layout-parser';

interface PendingCommand {
  resolve: (response: string) => void;
  reject: (err: Error) => void;
  lines: string[];
}

/**
 * TmuxControlSession manages a single tmux -CC control mode connection.
 * It spawns the tmux process, parses the protocol, and provides a
 * PTY-compatible API for the renderer.
 */
export class TmuxControlSession extends EventEmitter {
  private proc: ChildProcess | null = null;
  private lineBuffer = '';

  // Bidirectional ID maps
  private paneToTab = new Map<string, string>();   // "%0" -> "tab-xxx"
  private tabToPane = new Map<string, string>();   // "tab-xxx" -> "%0"
  private windowPanes = new Map<string, Set<string>>(); // "@0" -> Set("%0", "%1")

  // Command/response correlation
  private pendingCommands = new Map<number, PendingCommand>();
  private commandCounter = 0;
  private inCommandResponse = false;
  private currentCommandNum = -1;

  // State
  private _sessionName: string | null = null;
  private _connected = false;
  private window: BrowserWindow;

  constructor(window: BrowserWindow) {
    super();
    this.window = window;
  }

  get connected(): boolean { return this._connected; }
  get sessionName(): string | null { return this._sessionName; }

  /**
   * Check if tmux is installed.
   */
  static isInstalled(): boolean {
    try {
      execSync('which tmux 2>/dev/null', { encoding: 'utf-8' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List available tmux sessions.
   */
  static listSessions(): TmuxSession[] {
    try {
      const output = execSync(
        'tmux list-sessions -F "#{session_id}:#{session_name}:#{session_windows}:#{session_attached}:#{session_created}" 2>/dev/null',
        { encoding: 'utf-8' }
      ).trim();
      if (!output) return [];
      return output.split('\n').map(line => {
        const [id, name, windows, attached, created] = line.split(':');
        return {
          id: id || '',
          name: name || '',
          windows: parseInt(windows, 10) || 0,
          attached: attached === '1',
          created: created || '',
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Start a new tmux session in control mode.
   */
  async start(sessionName?: string): Promise<void> {
    if (this._connected) {
      throw new Error('Already connected to a tmux session');
    }

    const name = sessionName || `crux-${Date.now()}`;
    this._sessionName = name;

    const args = ['-CC', 'new-session', '-s', name];
    this.spawnTmux(args);
  }

  /**
   * Attach to an existing tmux session in control mode.
   */
  async attach(sessionName: string): Promise<void> {
    if (this._connected) {
      throw new Error('Already connected to a tmux session');
    }

    this._sessionName = sessionName;
    const args = ['-CC', 'attach-session', '-t', sessionName];
    this.spawnTmux(args);
  }

  /**
   * Spawn the tmux -CC process and set up I/O handlers.
   */
  private spawnTmux(args: string[]): void {
    this.proc = spawn('tmux', args, {
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    });

    this.proc.stdout?.on('data', (chunk: Buffer) => {
      this.onStdoutData(chunk);
    });

    this.proc.stderr?.on('data', (chunk: Buffer) => {
      console.error('[tmux stderr]', chunk.toString());
    });

    this.proc.on('close', (code) => {
      console.log(`[tmux] Process exited with code ${code}`);
      this._connected = false;
      this.emit('exit', code);
      this.sendToRenderer('tmux:stateChanged', this.getState());
    });

    this.proc.on('error', (err) => {
      console.error('[tmux] Process error:', err);
      this._connected = false;
      this.emit('error', err);
    });

    this._connected = true;
    this.sendToRenderer('tmux:stateChanged', this.getState());
  }

  /**
   * Detach from the current session (session stays alive).
   */
  async detach(): Promise<void> {
    if (!this._connected || !this.proc) return;
    try {
      await this.sendCommand('detach-client');
    } catch {
      // Process may already be gone
    }
    this.cleanup();
  }

  /**
   * Kill the tmux process and clean up.
   */
  destroy(): void {
    if (this.proc) {
      this.proc.kill();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this._connected = false;
    this.paneToTab.clear();
    this.tabToPane.clear();
    this.windowPanes.clear();
    this.pendingCommands.clear();
    this.lineBuffer = '';
    this.proc = null;
    this.sendToRenderer('tmux:stateChanged', this.getState());
  }

  // ── PTY-compatible API ──────────────────────────────────────

  /**
   * Register a new pane mapping. If no pane exists yet, the first
   * available pane is mapped. Called when renderer creates a Terminal.
   */
  registerPane(tabId: string, paneId?: string): void {
    if (paneId) {
      this.paneToTab.set(paneId, tabId);
      this.tabToPane.set(tabId, paneId);
    }
  }

  /**
   * Create a new tmux window and map it to a tab.
   */
  async createPane(tabId: string): Promise<string> {
    // If this is the first pane (initial window), just map %0
    if (this.tabToPane.size === 0) {
      // Wait a moment for initial notifications
      return new Promise((resolve) => {
        const check = () => {
          // The first pane should have been registered by %layout-change
          const firstPane = this.tabToPane.get(tabId);
          if (firstPane) {
            resolve(firstPane);
          } else if (this.paneToTab.size > 0) {
            // Map the first known pane to this tab
            const [paneId] = this.paneToTab.keys();
            this.paneToTab.set(paneId, tabId);
            this.tabToPane.set(tabId, paneId);
            resolve(paneId);
          } else {
            setTimeout(check, 100);
          }
        };
        setTimeout(check, 200);
      });
    }

    // Create a new tmux window
    const response = await this.sendCommand('new-window -P -F "#{pane_id}"');
    const paneId = response.trim();
    this.paneToTab.set(paneId, tabId);
    this.tabToPane.set(tabId, paneId);
    return paneId;
  }

  /**
   * Write data to a tmux pane (send keystrokes).
   */
  writeToPane(tabId: string, data: string): void {
    const paneId = this.tabToPane.get(tabId);
    if (!paneId || !this.proc) return;

    // For raw terminal data, use send-keys in hex mode for safety
    // Convert each byte to hex escape
    const hexData = Buffer.from(data).toString('hex').match(/.{2}/g);
    if (hexData) {
      const hexStr = hexData.map(h => `0x${h}`).join(' ');
      this.writeRaw(`send-keys -t ${paneId} -H ${hexStr}\n`);
    }
  }

  /**
   * Resize a tmux pane.
   */
  resizePane(tabId: string, cols: number, rows: number): void {
    const paneId = this.tabToPane.get(tabId);
    if (!paneId || !this.proc) return;
    this.writeRaw(`resize-pane -t ${paneId} -x ${cols} -y ${rows}\n`);
  }

  /**
   * Kill a tmux pane.
   */
  destroyPane(tabId: string): void {
    const paneId = this.tabToPane.get(tabId);
    if (!paneId || !this.proc) return;
    this.writeRaw(`kill-pane -t ${paneId}\n`);
    this.paneToTab.delete(paneId);
    this.tabToPane.delete(tabId);
  }

  /**
   * Split a pane.
   */
  async splitPane(tabId: string, direction: 'h' | 'v'): Promise<string> {
    const paneId = this.tabToPane.get(tabId);
    if (!paneId || !this.proc) throw new Error('Pane not found');

    const flag = direction === 'h' ? '-h' : '-v';
    const response = await this.sendCommand(`split-window ${flag} -t ${paneId} -P -F "#{pane_id}"`);
    const newPaneId = response.trim();
    const newTabId = `tab-${Date.now()}`;
    this.paneToTab.set(newPaneId, newTabId);
    this.tabToPane.set(newTabId, newPaneId);
    return newTabId;
  }

  // ── Protocol parser ─────────────────────────────────────────

  private onStdoutData(chunk: Buffer): void {
    this.lineBuffer += chunk.toString();
    const lines = this.lineBuffer.split('\n');
    // Keep the last incomplete line in the buffer
    this.lineBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.length > 0) {
        this.parseLine(line);
      }
    }
  }

  private parseLine(line: string): void {
    // %output %<pane_id> <data>
    const outputMatch = line.match(/^%output (%\d+) (.*)$/);
    if (outputMatch) {
      const paneId = outputMatch[1];
      const data = this.decodeOutput(outputMatch[2]);
      const tabId = this.paneToTab.get(paneId);
      if (tabId) {
        this.sendToRenderer('pty:data', tabId, data);
      }
      return;
    }

    // %begin <time> <num>
    const beginMatch = line.match(/^%begin (\d+) (\d+)$/);
    if (beginMatch) {
      this.currentCommandNum = parseInt(beginMatch[2], 10);
      this.inCommandResponse = true;
      const pending = this.pendingCommands.get(this.currentCommandNum);
      if (pending) {
        pending.lines = [];
      }
      return;
    }

    // %end <time> <num> <exit_code>
    const endMatch = line.match(/^%end (\d+) (\d+) (\d+)$/);
    if (endMatch) {
      const num = parseInt(endMatch[2], 10);
      const exitCode = parseInt(endMatch[3], 10);
      this.inCommandResponse = false;
      const pending = this.pendingCommands.get(num);
      if (pending) {
        this.pendingCommands.delete(num);
        if (exitCode === 0) {
          pending.resolve(pending.lines.join('\n'));
        } else {
          pending.reject(new Error(`tmux command failed with exit code ${exitCode}: ${pending.lines.join('\n')}`));
        }
      }
      return;
    }

    // %error <time> <num>
    const errorMatch = line.match(/^%error (\d+) (\d+)$/);
    if (errorMatch) {
      const num = parseInt(errorMatch[2], 10);
      this.inCommandResponse = false;
      const pending = this.pendingCommands.get(num);
      if (pending) {
        this.pendingCommands.delete(num);
        pending.reject(new Error(`tmux command error: ${pending.lines.join('\n')}`));
      }
      return;
    }

    // If we're inside a command response, accumulate lines
    if (this.inCommandResponse) {
      const pending = this.pendingCommands.get(this.currentCommandNum);
      if (pending) {
        pending.lines.push(line);
      }
      return;
    }

    // %window-add @<window_id>
    const windowAddMatch = line.match(/^%window-add (@\d+)$/);
    if (windowAddMatch) {
      const windowId = windowAddMatch[1];
      this.windowPanes.set(windowId, new Set());
      this.emit('window-add', windowId);
      this.sendToRenderer('tmux:windowAdd', windowId);
      return;
    }

    // %window-close @<window_id>
    const windowCloseMatch = line.match(/^%window-close (@\d+)$/);
    if (windowCloseMatch) {
      const windowId = windowCloseMatch[1];
      // Remove all panes in this window
      const panes = this.windowPanes.get(windowId);
      if (panes) {
        for (const paneId of panes) {
          const tabId = this.paneToTab.get(paneId);
          if (tabId) {
            this.tabToPane.delete(tabId);
            this.sendToRenderer('tmux:paneRemoved', tabId);
          }
          this.paneToTab.delete(paneId);
        }
      }
      this.windowPanes.delete(windowId);
      this.emit('window-close', windowId);
      this.sendToRenderer('tmux:windowClose', windowId);
      return;
    }

    // %window-renamed @<window_id> <name>
    const windowRenamedMatch = line.match(/^%window-renamed (@\d+) (.+)$/);
    if (windowRenamedMatch) {
      const windowId = windowRenamedMatch[1];
      const name = windowRenamedMatch[2];
      this.emit('window-renamed', windowId, name);
      this.sendToRenderer('tmux:windowRenamed', windowId, name);
      return;
    }

    // %layout-change @<window_id> <layout>
    const layoutMatch = line.match(/^%layout-change (@\d+) (.+)$/);
    if (layoutMatch) {
      const windowId = layoutMatch[1];
      const layoutStr = layoutMatch[2];
      this.handleLayoutChange(windowId, layoutStr);
      return;
    }

    // %session-changed $<session_id> <name>
    const sessionChangedMatch = line.match(/^%session-changed (\$\d+) (.+)$/);
    if (sessionChangedMatch) {
      this._sessionName = sessionChangedMatch[2];
      this.sendToRenderer('tmux:stateChanged', this.getState());
      return;
    }

    // %sessions-changed
    if (line === '%sessions-changed') {
      this.sendToRenderer('tmux:sessionsChanged');
      return;
    }

    // %exit [reason]
    const exitMatch = line.match(/^%exit\s*(.*)$/);
    if (exitMatch) {
      const reason = exitMatch[1] || undefined;
      this._connected = false;
      this.emit('exit', reason);
      this.sendToRenderer('tmux:stateChanged', this.getState());
      return;
    }
  }

  /**
   * Handle a layout change notification.
   * Parse the layout string and update pane mappings.
   */
  private handleLayoutChange(windowId: string, layoutStr: string): void {
    try {
      const splitNode = parseTmuxLayout(layoutStr, this.paneToTab, (paneId, tabId) => {
        // New pane discovered via layout — register it
        this.tabToPane.set(tabId, paneId);

        // Track which window this pane belongs to
        let panes = this.windowPanes.get(windowId);
        if (!panes) {
          panes = new Set();
          this.windowPanes.set(windowId, panes);
        }
        panes.add(paneId);

        // Notify renderer about new pane/tab
        this.sendToRenderer('tmux:paneAdded', tabId, paneId, windowId);
      });

      // Update window's pane set
      const panes = this.windowPanes.get(windowId) || new Set();
      for (const [paneId, tabId] of this.paneToTab) {
        if (!panes.has(paneId)) {
          // Check if this pane was removed
        }
      }

      this.emit('layout-change', windowId, splitNode);
      this.sendToRenderer('tmux:layoutChange', windowId, splitNode);
    } catch (err) {
      console.error('[tmux] Failed to parse layout:', layoutStr, err);
    }
  }

  /**
   * Decode tmux control mode output data.
   * Handles octal escapes (\xxx) used for non-printable characters.
   */
  private decodeOutput(encoded: string): string {
    return encoded.replace(/\\(\d{3})/g, (_match, octal) => {
      return String.fromCharCode(parseInt(octal, 8));
    }).replace(/\\\\/g, '\\');
  }

  // ── Command interface ───────────────────────────────────────

  /**
   * Send a tmux command and wait for the response.
   */
  sendCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.proc || !this._connected) {
        reject(new Error('Not connected to tmux'));
        return;
      }

      const num = this.commandCounter++;
      this.pendingCommands.set(num, { resolve, reject, lines: [] });

      // tmux control mode auto-assigns command numbers
      // We track by the order commands are sent
      this.writeRaw(cmd + '\n');

      // Timeout after 10s
      setTimeout(() => {
        if (this.pendingCommands.has(num)) {
          this.pendingCommands.delete(num);
          reject(new Error(`tmux command timed out: ${cmd}`));
        }
      }, 10000);
    });
  }

  /**
   * Write raw data to the tmux process stdin.
   */
  private writeRaw(data: string): void {
    if (this.proc?.stdin?.writable) {
      this.proc.stdin.write(data);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private sendToRenderer(channel: string, ...args: any[]): void {
    try {
      if (!this.window.isDestroyed()) {
        this.window.webContents.send(channel, ...args);
      }
    } catch {
      // Window may be closing
    }
  }

  getState(): TmuxState {
    return {
      enabled: true,
      connected: this._connected,
      sessionName: this._sessionName,
      sessions: TmuxControlSession.listSessions(),
    };
  }

  getPaneToTab(): Map<string, string> {
    return new Map(this.paneToTab);
  }

  getTabToPane(): Map<string, string> {
    return new Map(this.tabToPane);
  }
}
