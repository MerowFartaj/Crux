import { create } from 'zustand';
import { TabInfo, SystemStats, CruxSettings, Workflow, HistoryEntry } from '../../shared/types';

// Split tree node: either a leaf (terminal) or a branch (split container)
export type SplitNode =
  | { type: 'leaf'; tabId: string }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; children: [SplitNode, SplitNode]; sizes: [number, number] };

interface AppState {
  // Tabs
  tabs: TabInfo[];
  activeTabId: string;
  addTab: (tab: TabInfo) => void;
  removeTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<TabInfo>) => void;
  setActiveTab: (id: string) => void;

  // Split layout tree (per root tab group — for now, one global tree)
  splitRoot: SplitNode | null;
  setSplitRoot: (node: SplitNode | null) => void;
  splitActivePane: (direction: 'horizontal' | 'vertical') => void;
  closeSplitPane: (tabId: string) => void;

  // System stats
  systemStats: SystemStats | null;
  setSystemStats: (stats: SystemStats) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // UI panels
  showSystemPulse: boolean;
  toggleSystemPulse: () => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (show: boolean) => void;
  showHistoryView: boolean;
  setShowHistoryView: (show: boolean) => void;
  showWorkflowPanel: boolean;
  setShowWorkflowPanel: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;

  // Block history
  showBlockHistory: boolean;
  setShowBlockHistory: (show: boolean) => void;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  // SSH Manager
  showSSHManager: boolean;
  setShowSSHManager: (show: boolean) => void;

  // File preview
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  previewFiles: { path: string; name: string }[];
  previewActiveFile: string | null;
  openPreview: (filePath: string) => void;
  closePreviewTab: (filePath: string) => void;

  // Settings
  settings: CruxSettings;
  updateSettings: (updates: Partial<CruxSettings>) => void;

  // Workflows
  workflows: Workflow[];
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  removeWorkflow: (id: string) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;

  // Command blocks
  commandBlocks: Map<string, { command: string; output: string; exitCode: number; duration: number; timestamp: number; cwd: string }[]>;
  addCommandBlock: (tabId: string, block: { command: string; output: string; exitCode: number; duration: number; timestamp: number; cwd: string }) => void;
}

// Helper: replace a leaf node in the tree
function replaceLeaf(node: SplitNode, targetTabId: string, replacement: SplitNode): SplitNode {
  if (node.type === 'leaf') {
    return node.tabId === targetTabId ? replacement : node;
  }
  return {
    ...node,
    children: [
      replaceLeaf(node.children[0], targetTabId, replacement),
      replaceLeaf(node.children[1], targetTabId, replacement),
    ],
  };
}

// Helper: remove a leaf and collapse the tree
function removeLeaf(node: SplitNode, targetTabId: string): SplitNode | null {
  if (node.type === 'leaf') {
    return node.tabId === targetTabId ? null : node;
  }
  const left = removeLeaf(node.children[0], targetTabId);
  const right = removeLeaf(node.children[1], targetTabId);
  if (!left && !right) return null;
  if (!left) return right;
  if (!right) return left;
  return { ...node, children: [left, right] };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Tabs
  tabs: [],
  activeTabId: '',
  addTab: (tab) =>
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id })),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? newTabs[newTabs.length - 1]?.id || ''
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),
  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  setActiveTab: (id) => set({ activeTabId: id }),

  // Split layout
  splitRoot: null,
  setSplitRoot: (node) => set({ splitRoot: node }),
  splitActivePane: (direction) => {
    const state = get();

    // In tmux mode, delegate to tmux — layout comes back via event
    if (state.settings.tmuxEnabled) {
      const tmuxDir = direction === 'horizontal' ? 'v' : 'h';
      window.electronAPI.tmux.splitPane(state.activeTabId, tmuxDir).catch((err: any) => {
        console.error('tmux split failed:', err);
      });
      return;
    }

    const newTabId = `tab-${Date.now()}`;
    const newTab: TabInfo = {
      id: newTabId,
      title: 'Terminal',
      cwd: '~',
      process: '',
      status: 'idle',
    };

    const newSplit: SplitNode = {
      type: 'split',
      direction,
      children: [
        { type: 'leaf', tabId: state.activeTabId },
        { type: 'leaf', tabId: newTabId },
      ],
      sizes: [50, 50],
    };

    let newRoot: SplitNode;
    if (!state.splitRoot) {
      newRoot = newSplit;
    } else {
      newRoot = replaceLeaf(state.splitRoot, state.activeTabId, newSplit);
    }

    set({
      tabs: [...state.tabs, newTab],
      splitRoot: newRoot,
      activeTabId: newTabId,
    });
  },
  closeSplitPane: (tabId) => {
    const state = get();
    if (!state.splitRoot) return;

    const newRoot = removeLeaf(state.splitRoot, tabId);
    const newTabs = state.tabs.filter((t) => t.id !== tabId);
    const newActiveId = state.activeTabId === tabId
      ? newTabs[newTabs.length - 1]?.id || ''
      : state.activeTabId;

    set({
      splitRoot: newRoot,
      tabs: newTabs,
      activeTabId: newActiveId,
    });
  },

  // System stats
  systemStats: null,
  setSystemStats: (stats) => set({ systemStats: stats }),

  // UI panels
  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  showSystemPulse: false,
  toggleSystemPulse: () =>
    set((state) => ({ showSystemPulse: !state.showSystemPulse })),
  showCommandPalette: false,
  setShowCommandPalette: (show) => set({ showCommandPalette: show }),
  showHistoryView: false,
  setShowHistoryView: (show) => set({ showHistoryView: show }),
  showWorkflowPanel: false,
  setShowWorkflowPanel: (show) => set({ showWorkflowPanel: show }),
  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  // Block history
  showBlockHistory: false,
  setShowBlockHistory: (show) => set({ showBlockHistory: show }),

  // Onboarding
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  // SSH Manager
  showSSHManager: false,
  setShowSSHManager: (show) => set({ showSSHManager: show }),

  // File preview
  showPreview: false,
  setShowPreview: (show) => set({ showPreview: show }),
  previewFiles: [],
  previewActiveFile: null,
  openPreview: (filePath) => set((state) => {
    const name = filePath.split('/').pop() || filePath;
    const exists = state.previewFiles.find(f => f.path === filePath);
    return {
      showPreview: true,
      previewActiveFile: filePath,
      previewFiles: exists ? state.previewFiles : [...state.previewFiles, { path: filePath, name }],
    };
  }),
  closePreviewTab: (filePath) => set((state) => {
    const newFiles = state.previewFiles.filter(f => f.path !== filePath);
    return {
      previewFiles: newFiles,
      previewActiveFile: newFiles.length > 0
        ? (state.previewActiveFile === filePath ? newFiles[newFiles.length - 1].path : state.previewActiveFile)
        : null,
      showPreview: newFiles.length > 0,
    };
  }),

  // Settings
  settings: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    accentColor: '#3B82F6',
    soundVolume: 0.3,
    soundMuted: false,
    shell: '/bin/zsh',
    anthropicApiKey: '',
    openaiApiKey: '',
    aiProvider: 'claude' as const,
    aiModel: 'claude-haiku-4-5-20251001',
    aiEnabled: true,
    commandTooltips: true,
    tmuxEnabled: false,
    tmuxAutoAttach: true,
    tmuxDefaultSession: 'crux',
    previewEnabled: true,
    previewClickablePaths: true,
    previewInlineImages: true,
    previewHoverTooltips: false,
    vibrancy: 'none',
    fontLigatures: true,
    linkOpenBehavior: 'preview',
    dropdownMode: false,
    dropdownShortcut: 'Alt+Space',
    dropdownHeight: 50,
    dropdownAutoHide: false,
    keepInBackground: true,
    launchAtLogin: false,
  },
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  // Workflows
  workflows: [],
  setWorkflows: (workflows) => set({ workflows }),
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  removeWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    })),
  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  // Command blocks
  commandBlocks: new Map(),
  addCommandBlock: (tabId, block) =>
    set((state) => {
      const newBlocks = new Map(state.commandBlocks);
      const existing = newBlocks.get(tabId) || [];
      // Keep last 50 blocks per tab
      newBlocks.set(tabId, [...existing.slice(-49), block]);
      return { commandBlocks: newBlocks };
    }),
}));
