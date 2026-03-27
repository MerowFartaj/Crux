import { contextBridge, ipcRenderer } from 'electron';
import { FileResolveContext, IElectronAPI } from '../shared/types';

const api: IElectronAPI = {
  pty: {
    create: (id: string, shell?: string, cwd?: string, args?: string[]) =>
      ipcRenderer.invoke('pty:create', id, shell, cwd, args),
    write: (id: string, data: string) =>
      ipcRenderer.send('pty:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('pty:resize', id, cols, rows),
    destroy: (id: string) =>
      ipcRenderer.send('pty:destroy', id),
    onData: (callback: (id: string, data: string) => void) => {
      const handler = (_event: any, id: string, data: string) => callback(id, data);
      ipcRenderer.on('pty:data', handler);
      return () => ipcRenderer.removeListener('pty:data', handler);
    },
    onExit: (callback: (id: string, exitCode: number) => void) => {
      const handler = (_event: any, id: string, exitCode: number) => callback(id, exitCode);
      ipcRenderer.on('pty:exit', handler);
      return () => ipcRenderer.removeListener('pty:exit', handler);
    },
    getCwd: (id: string) => ipcRenderer.invoke('pty:getCwd', id),
    detectProject: (cwd: string) => ipcRenderer.invoke('pty:detectProject', cwd),
  },
  db: {
    addEntry: (entry) => ipcRenderer.invoke('db:addEntry', entry),
    search: (query, limit) => ipcRenderer.invoke('db:search', query, limit),
    getAll: (limit, offset) => ipcRenderer.invoke('db:getAll', limit, offset),
    getByDirectory: (directory) => ipcRenderer.invoke('db:getByDirectory', directory),
    getStats: () => ipcRenderer.invoke('db:getStats'),
  },
  system: {
    getStats: () => ipcRenderer.invoke('system:getStats'),
    onStats: (callback) => {
      const handler = (_event: any, stats: any) => callback(stats);
      ipcRenderer.on('system:stats', handler);
      return () => ipcRenderer.removeListener('system:stats', handler);
    },
    startMonitoring: (intervalMs: number) =>
      ipcRenderer.send('system:startMonitoring', intervalMs),
    stopMonitoring: () => ipcRenderer.send('system:stopMonitoring'),
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  },
  git: {
    getBranch: (cwd: string) => ipcRenderer.invoke('git:getBranch', cwd),
  },
  ai: {
    translateCommand: (description: string) =>
      ipcRenderer.invoke('ai:translateCommand', description),
    explainError: (command: string, output: string, exitCode: number) =>
      ipcRenderer.invoke('ai:explainError', command, output, exitCode),
    ask: (prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) =>
      ipcRenderer.invoke('ai:ask', prompt, systemPrompt, maxTokens, timeoutMs),
    askCheap: (prompt: string, systemPrompt: string, maxTokens?: number, timeoutMs?: number) =>
      ipcRenderer.invoke('ai:askCheap', prompt, systemPrompt, maxTokens, timeoutMs),
    suggest: (partial: string, cwd: string, recentCommands: string[]) =>
      ipcRenderer.invoke('ai:suggest', partial, cwd, recentCommands),
    commitMessage: (diff: string) =>
      ipcRenderer.invoke('ai:commitMessage', diff),
    getModels: () =>
      ipcRenderer.invoke('ai:getModels'),
    stream: (requestId: string, prompt: string, systemPrompt: string, maxTokens?: number) =>
      ipcRenderer.invoke('ai:stream', requestId, prompt, systemPrompt, maxTokens),
    onChunk: (cb: (requestId: string, text: string) => void) => {
      const handler = (_e: any, requestId: string, text: string) => cb(requestId, text);
      ipcRenderer.on('ai:chunk', handler);
      return () => ipcRenderer.removeListener('ai:chunk', handler);
    },
    onDone: (cb: (requestId: string) => void) => {
      const handler = (_e: any, requestId: string) => cb(requestId);
      ipcRenderer.on('ai:done', handler);
      return () => ipcRenderer.removeListener('ai:done', handler);
    },
    cancelStream: () => ipcRenderer.send('ai:cancelStream'),
  },
  shell: {
    getDefault: () => ipcRenderer.invoke('shell:getDefault'),
    openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    setVibrancy: (mode: string) => ipcRenderer.invoke('window:setVibrancy', mode),
  },
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },
  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    readBinary: (filePath: string) => ipcRenderer.invoke('file:readBinary', filePath),
    stat: (filePath: string) => ipcRenderer.invoke('file:stat', filePath),
    resolve: (filePath: string, context?: FileResolveContext) =>
      ipcRenderer.invoke('file:resolve', filePath, context),
  },
  tmux: {
    isInstalled: () => ipcRenderer.invoke('tmux:isInstalled'),
    start: (sessionName?: string) => ipcRenderer.invoke('tmux:start', sessionName),
    attach: (sessionName: string) => ipcRenderer.invoke('tmux:attach', sessionName),
    detach: () => ipcRenderer.invoke('tmux:detach'),
    listSessions: () => ipcRenderer.invoke('tmux:listSessions'),
    getState: () => ipcRenderer.invoke('tmux:getState'),
    splitPane: (tabId: string, direction: 'h' | 'v') =>
      ipcRenderer.invoke('tmux:splitPane', tabId, direction),
    onStateChanged: (cb: (state: any) => void) => {
      const handler = (_e: any, state: any) => cb(state);
      ipcRenderer.on('tmux:stateChanged', handler);
      return () => ipcRenderer.removeListener('tmux:stateChanged', handler);
    },
    onLayoutChange: (cb: (windowId: string, splitRoot: any) => void) => {
      const handler = (_e: any, windowId: string, splitRoot: any) => cb(windowId, splitRoot);
      ipcRenderer.on('tmux:layoutChange', handler);
      return () => ipcRenderer.removeListener('tmux:layoutChange', handler);
    },
    onWindowAdd: (cb: (windowId: string) => void) => {
      const handler = (_e: any, windowId: string) => cb(windowId);
      ipcRenderer.on('tmux:windowAdd', handler);
      return () => ipcRenderer.removeListener('tmux:windowAdd', handler);
    },
    onWindowClose: (cb: (windowId: string) => void) => {
      const handler = (_e: any, windowId: string) => cb(windowId);
      ipcRenderer.on('tmux:windowClose', handler);
      return () => ipcRenderer.removeListener('tmux:windowClose', handler);
    },
    onWindowRenamed: (cb: (windowId: string, name: string) => void) => {
      const handler = (_e: any, windowId: string, name: string) => cb(windowId, name);
      ipcRenderer.on('tmux:windowRenamed', handler);
      return () => ipcRenderer.removeListener('tmux:windowRenamed', handler);
    },
    onPaneAdded: (cb: (tabId: string, paneId: string, windowId: string) => void) => {
      const handler = (_e: any, tabId: string, paneId: string, windowId: string) => cb(tabId, paneId, windowId);
      ipcRenderer.on('tmux:paneAdded', handler);
      return () => ipcRenderer.removeListener('tmux:paneAdded', handler);
    },
    onPaneRemoved: (cb: (tabId: string) => void) => {
      const handler = (_e: any, tabId: string) => cb(tabId);
      ipcRenderer.on('tmux:paneRemoved', handler);
      return () => ipcRenderer.removeListener('tmux:paneRemoved', handler);
    },
  },
  dropdown: {
    toggle: () => ipcRenderer.send('dropdown:toggle'),
    setMode: (enabled: boolean) => ipcRenderer.send('dropdown:setMode', enabled),
    getMode: () => ipcRenderer.invoke('dropdown:getMode'),
    onModeChanged: (cb: (enabled: boolean) => void) => {
      const handler = (_e: any, enabled: boolean) => cb(enabled);
      ipcRenderer.on('dropdown:modeChanged', handler);
      return () => ipcRenderer.removeListener('dropdown:modeChanged', handler);
    },
    onAnimate: (cb: (direction: 'in' | 'out') => void) => {
      const handler = (_e: any, direction: 'in' | 'out') => cb(direction);
      ipcRenderer.on('dropdown:animate', handler);
      return () => ipcRenderer.removeListener('dropdown:animate', handler);
    },
  },
  ssh: {
    getConnections: () => ipcRenderer.invoke('ssh:getConnections'),
    saveConnection: (conn: any) => ipcRenderer.invoke('ssh:saveConnection', conn),
    deleteConnection: (id: string) => ipcRenderer.invoke('ssh:deleteConnection', id),
    getGroups: () => ipcRenderer.invoke('ssh:getGroups'),
    savePassword: (id: string, password: string) => ipcRenderer.invoke('ssh:savePassword', id, password),
    getPassword: (id: string) => ipcRenderer.invoke('ssh:getPassword', id),
    deletePassword: (id: string) => ipcRenderer.invoke('ssh:deletePassword', id),
    parseConfig: (configPath?: string) => ipcRenderer.invoke('ssh:parseConfig', configPath),
    importConfig: (configPath?: string) => ipcRenderer.invoke('ssh:importConfig', configPath),
    exportConnections: () => ipcRenderer.invoke('ssh:exportConnections'),
    importConnections: (json: string) => ipcRenderer.invoke('ssh:importConnections', json),
    buildArgs: (conn: any) => ipcRenderer.invoke('ssh:buildArgs', conn),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },
  session: {
    save: (data: any) => ipcRenderer.invoke('session:save', data),
    load: () => ipcRenderer.invoke('session:load'),
    clear: () => ipcRenderer.invoke('session:clear'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
