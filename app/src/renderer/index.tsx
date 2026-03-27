import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Browser fallback mock for when running outside Electron
if (!window.electronAPI) {
  const noop = () => {};
  const noopAsync = () => Promise.resolve(undefined as any);
  (window as any).electronAPI = {
    pty: {
      create: noopAsync,
      write: noop,
      resize: noop,
      destroy: noop,
      onData: () => noop,
      onExit: () => noop,
      getCwd: () => Promise.resolve('~'),
    },
    db: {
      addEntry: noopAsync,
      search: () => Promise.resolve([]),
      getAll: () => Promise.resolve([]),
      getByDirectory: () => Promise.resolve([]),
      getStats: () => Promise.resolve({ totalCommands: 0, directories: [] }),
    },
    system: {
      getStats: () => Promise.resolve({
        cpu: 0, memory: { used: 0, total: 1, percent: 0 },
        network: { rx_sec: 0, tx_sec: 0 },
        disk: { used: 0, total: 1, percent: 0 }, processes: 0,
      }),
      onStats: () => noop,
      startMonitoring: noop,
      stopMonitoring: noop,
    },
    store: { get: noopAsync, set: noopAsync },
    git: { getBranch: () => Promise.resolve(null) },
    ai: { translateCommand: () => Promise.resolve('echo "Electron required"') },
    shell: { getDefault: () => Promise.resolve('/bin/zsh') },
    window: { minimize: noop, maximize: noop, close: noop },
    app: { getPath: () => Promise.resolve('/tmp') },
  };
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
