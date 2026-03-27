export interface HistoryEntry {
  id?: number;
  command: string;
  directory: string;
  timestamp: string;
  exit_code: number;
  duration_ms: number;
  output_preview: string;
}

export interface SystemStats {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  network: { rx_sec: number; tx_sec: number };
  disk: { used: number; total: number; percent: number };
  processes: number;
}

export interface TabInfo {
  id: string;
  title: string;
  cwd: string;
  process: string;
  status: 'idle' | 'running' | 'error';
  gitBranch?: string;
  isSSH?: boolean;
  sshConnectionId?: string;
  colorTag?: string;
}

export interface Workflow {
  id: string;
  name: string;
  commands: string[];
  lastRun?: string;
  createdAt: string;
}

export interface CruxSettings {
  fontSize: number;
  fontFamily: string;
  accentColor: string;
  soundVolume: number;
  soundMuted: boolean;
  shell: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  aiProvider: 'claude' | 'openai';
  aiModel: string;
  aiEnabled: boolean;
  commandTooltips: boolean;
  tmuxEnabled: boolean;
  tmuxAutoAttach: boolean;
  tmuxDefaultSession: string;
  previewEnabled: boolean;
  previewClickablePaths: boolean;
  previewInlineImages: boolean;
  previewHoverTooltips: boolean;
  vibrancy: string; // 'none', 'under-window', 'fullscreen-ui', etc.
  fontLigatures: boolean;
  linkOpenBehavior: string; // 'preview' or 'browser'
  dropdownMode: boolean;
  dropdownShortcut: string;
  dropdownHeight: number;
  dropdownAutoHide: boolean;
  keepInBackground: boolean;
  launchAtLogin: boolean;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modified: number;
}

export interface FileResolveContext {
  tabId?: string;
  cwd?: string;
}

export interface SplitPane {
  id: string;
  direction: 'horizontal' | 'vertical';
  children: (SplitPane | string)[]; // string = terminal tab id
  sizes: number[];
}

export interface CommandHistorySearch {
  query: string;
  results: HistoryEntry[];
}

export interface IElectronAPI {
  pty: {
    create: (id: string, shell?: string, cwd?: string, args?: string[]) => Promise<void>;
    write: (id: string, data: string) => void;
    resize: (id: string, cols: number, rows: number) => void;
    destroy: (id: string) => void;
    onData: (callback: (id: string, data: string) => void) => () => void;
    onExit: (callback: (id: string, exitCode: number) => void) => () => void;
    getCwd: (id: string) => Promise<string>;
    detectProject: (cwd: string) => Promise<string[]>;
  };
  db: {
    addEntry: (entry: Omit<HistoryEntry, 'id'>) => Promise<number>;
    search: (query: string, limit?: number) => Promise<HistoryEntry[]>;
    getAll: (limit?: number, offset?: number) => Promise<HistoryEntry[]>;
    getByDirectory: (directory: string) => Promise<HistoryEntry[]>;
    getStats: () => Promise<{ totalCommands: number; directories: string[] }>;
  };
  system: {
    getStats: () => Promise<SystemStats>;
    onStats: (callback: (stats: SystemStats) => void) => () => void;
    startMonitoring: (intervalMs: number) => void;
    stopMonitoring: () => void;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  git: {
    getBranch: (cwd: string) => Promise<string | null>;
  };
  ai: {
    translateCommand: (description: string) => Promise<string>;
    explainError: (command: string, output: string, exitCode: number) => Promise<string>;
    ask: (prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) => Promise<string>;
    askCheap: (prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) => Promise<string>;
    suggest: (partial: string, cwd: string, recentCommands: string[]) => Promise<string>;
    commitMessage: (diff: string) => Promise<string>;
    getModels: () => Promise<{ id: string; name: string; provider: string; costEstimate: string }[]>;
    stream: (requestId: string, prompt: string, systemPrompt: string, maxTokens?: number) => Promise<void>;
    onChunk: (cb: (requestId: string, text: string) => void) => () => void;
    onDone: (cb: (requestId: string) => void) => () => void;
    cancelStream: () => void;
  };
  shell: {
    getDefault: () => Promise<string>;
    openPath: (filePath: string) => Promise<string>;
    openExternal: (url: string) => Promise<void>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    setVibrancy: (mode: string) => Promise<void>;
  };
  app: {
    getPath: (name: string) => Promise<string>;
  };
  file: {
    read: (filePath: string) => Promise<string>;
    readBinary: (filePath: string) => Promise<string>; // base64 encoded
    stat: (filePath: string) => Promise<FileInfo>;
    resolve: (filePath: string, context?: FileResolveContext) => Promise<string>;
  };
  tmux: {
    isInstalled: () => Promise<boolean>;
    start: (sessionName?: string) => Promise<void>;
    attach: (sessionName: string) => Promise<void>;
    detach: () => Promise<void>;
    listSessions: () => Promise<import('./tmux-types').TmuxSession[]>;
    getState: () => Promise<import('./tmux-types').TmuxState>;
    splitPane: (tabId: string, direction: 'h' | 'v') => Promise<string>;
    onStateChanged: (cb: (state: import('./tmux-types').TmuxState) => void) => () => void;
    onLayoutChange: (cb: (windowId: string, splitRoot: any) => void) => () => void;
    onWindowAdd: (cb: (windowId: string) => void) => () => void;
    onWindowClose: (cb: (windowId: string) => void) => () => void;
    onWindowRenamed: (cb: (windowId: string, name: string) => void) => () => void;
    onPaneAdded: (cb: (tabId: string, paneId: string, windowId: string) => void) => () => void;
    onPaneRemoved: (cb: (tabId: string) => void) => () => void;
  };
  dropdown: {
    toggle: () => void;
    setMode: (enabled: boolean) => void;
    getMode: () => Promise<boolean>;
    onModeChanged: (cb: (enabled: boolean) => void) => () => void;
    onAnimate: (cb: (direction: 'in' | 'out') => void) => () => void;
  };
  ssh: {
    getConnections: () => Promise<import('./ssh-types').SSHConnection[]>;
    saveConnection: (conn: import('./ssh-types').SSHConnection) => Promise<void>;
    deleteConnection: (id: string) => Promise<void>;
    getGroups: () => Promise<import('./ssh-types').SSHGroup[]>;
    savePassword: (id: string, password: string) => Promise<void>;
    getPassword: (id: string) => Promise<string | null>;
    deletePassword: (id: string) => Promise<void>;
    parseConfig: (configPath?: string) => Promise<import('./ssh-types').SSHConfigHost[]>;
    importConfig: (configPath?: string) => Promise<import('./ssh-types').SSHConnection[]>;
    exportConnections: () => Promise<string>;
    importConnections: (json: string) => Promise<number>;
    buildArgs: (conn: import('./ssh-types').SSHConnection) => Promise<string[]>;
  };
  dialog: {
    openFile: () => Promise<string | null>;
  };
  session: {
    save: (data: SessionData) => Promise<void>;
    load: () => Promise<SessionData | null>;
    clear: () => Promise<void>;
  };
}

export interface SessionData {
  tabs: TabInfo[];
  activeTabId: string;
  splitRoot: any; // SplitNode from appStore
  savedAt: string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
