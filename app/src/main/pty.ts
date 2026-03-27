import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

interface PtyProcess {
  process: pty.IPty;
  cwd: string;
}

const terminals: Map<string, PtyProcess> = new Map();
const execFileAsync = promisify(execFile);

async function resolveProcessCwd(pid: number): Promise<string | null> {
  if (process.platform === 'linux') {
    try {
      return await fs.promises.readlink(`/proc/${pid}/cwd`);
    } catch {
      return null;
    }
  }

  if (process.platform === 'darwin') {
    try {
      const { stdout } = await execFileAsync('lsof', [
        '-a',
        '-d',
        'cwd',
        '-p',
        String(pid),
        '-Fn',
      ]);
      const cwdLine = stdout
        .split('\n')
        .find((line) => line.startsWith('n') && line.length > 1);
      return cwdLine ? cwdLine.slice(1) : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function createPty(
  id: string,
  window: BrowserWindow,
  shell?: string,
  cwd?: string,
  args?: string[]
): void {
  const defaultShell = shell || process.env.SHELL || '/bin/zsh';
  const defaultCwd = cwd || os.homedir();

  const ptyProcess = pty.spawn(defaultShell, args || [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: defaultCwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      TERM_PROGRAM: 'CRUX',
      CRUX_SHELL_INTEGRATION: '1',
      // Tell zsh to emit OSC 133 prompt markers
      PROMPT_COMMAND: '',
    } as { [key: string]: string },
  });

  terminals.set(id, { process: ptyProcess, cwd: defaultCwd });

  ptyProcess.onData((data: string) => {
    if (!window.isDestroyed()) {
      window.webContents.send('pty:data', id, data);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (!window.isDestroyed()) {
      window.webContents.send('pty:exit', id, exitCode);
    }
    terminals.delete(id);
  });
}

export function writePty(id: string, data: string): void {
  const terminal = terminals.get(id);
  if (terminal) {
    terminal.process.write(data);
  }
}

export function resizePty(id: string, cols: number, rows: number): void {
  const terminal = terminals.get(id);
  if (terminal) {
    terminal.process.resize(cols, rows);
  }
}

export function destroyPty(id: string): void {
  const terminal = terminals.get(id);
  if (terminal) {
    terminal.process.kill();
    terminals.delete(id);
  }
}

export async function tryGetPtyCwd(id: string): Promise<string | null> {
  const terminal = terminals.get(id);
  if (!terminal) return null;

  const pid = terminal.process.pid;
  const cwd = await resolveProcessCwd(pid);
  if (cwd) {
    terminal.cwd = cwd;
    return cwd;
  }

  return terminal.cwd;
}

export async function getPtyCwd(id: string): Promise<string> {
  return (await tryGetPtyCwd(id)) || os.homedir();
}

export function destroyAllPtys(): void {
  for (const [id, terminal] of terminals) {
    terminal.process.kill();
  }
  terminals.clear();
}
