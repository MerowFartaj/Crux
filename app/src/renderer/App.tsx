import React, { useEffect } from 'react';
import { useAppStore, SplitNode } from './stores/appStore';
import { useTmuxStore } from './stores/tmuxStore';
import { useKeyboard } from './hooks/useKeyboard';
import { useSound } from './hooks/useSound';
import Terminal from './components/Terminal';
import TabBar from './components/TabBar';
import SplitPane from './components/SplitPane';
import SystemPulse from './components/SystemPulse';
import CommandPalette from './components/CommandPalette';
import HistoryView from './components/HistoryView';
import WorkflowPanel from './components/WorkflowPanel';
import Settings from './components/Settings';
import PreviewPanel from './components/PreviewPanel';
import SSHManager from './components/SSHManager';
// AIChat removed — AI is now inline in the terminal
import BlockHistory from './components/BlockHistory';
import Onboarding from './components/Onboarding';

// Recursive split renderer
const SplitRenderer: React.FC<{ node: SplitNode }> = ({ node }) => {
  const { activeTabId, setActiveTab } = useAppStore();

  if (node.type === 'leaf') {
    return (
      <div
        className={`w-full h-full ${
          node.tabId === activeTabId ? 'ring-1 ring-blue-500/30' : ''
        }`}
        onClick={() => setActiveTab(node.tabId)}
      >
        <Terminal tabId={node.tabId} />
      </div>
    );
  }

  return (
    <SplitPane direction={node.direction}>
      <SplitRenderer node={node.children[0]} />
      <SplitRenderer node={node.children[1]} />
    </SplitPane>
  );
};

const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    splitRoot,
    splitActivePane,
    closeSplitPane,
    settings,
    showSystemPulse,
    theme,
    setTheme,
  } = useAppStore();
  const { play } = useSound();

  useKeyboard();

  // Dropdown mode state
  const [dropdownMode, setDropdownMode] = React.useState(false);
  const [dropdownAnim, setDropdownAnim] = React.useState<'in' | 'out' | null>(null);

  // Force dark mode on launch
  const didInit = React.useRef(false);
  useEffect(() => {
    setTheme('dark');
    window.electronAPI.store.set('theme', 'dark');
  }, [setTheme]);

  // First-launch onboarding check
  useEffect(() => {
    window.electronAPI.store.get('onboardingComplete').then((v: any) => {
      if (!v) useAppStore.getState().setShowOnboarding(true);
    });
  }, []);

  // Listen for dropdown mode changes and animations
  useEffect(() => {
    window.electronAPI.dropdown.getMode().then(setDropdownMode);
    const removeModeListener = window.electronAPI.dropdown.onModeChanged(setDropdownMode);
    const removeAnimListener = window.electronAPI.dropdown.onAnimate((dir) => {
      setDropdownAnim(dir);
      if (dir === 'in') {
        // Clear animation class after it completes
        setTimeout(() => setDropdownAnim(null), 200);
      }
    });
    // Listen for settings open from tray
    const handleOpenSettings = () => useAppStore.getState().setShowSettings(true);
    window.electronAPI.store.get('_noop').catch(() => {}); // ensure IPC is ready
    // @ts-ignore - custom event from tray
    const ipcHandler = (_e: any) => handleOpenSettings();
    if ((window as any).electronAPI._onOpenSettings) {
      (window as any).electronAPI._onOpenSettings(ipcHandler);
    }
    return () => {
      removeModeListener();
      removeAnimListener();
    };
  }, []);

  // Restore session or create first tab on mount
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      try {
        const session = await window.electronAPI.session.load();
        if (session && session.tabs && session.tabs.length > 0) {
          // Restore tabs from saved session
          for (const tab of session.tabs) {
            // Give each restored tab a new ID (old PTYs are dead)
            const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            addTab({
              ...tab,
              id: newId,
              status: 'idle',
              process: '',
              // Preserve cwd, isSSH, title, etc.
            });
          }
          // Clear saved session after restore
          await window.electronAPI.session.clear();
        } else {
          // No session to restore — create default tab
          const id = `tab-${Date.now()}`;
          addTab({ id, title: 'Terminal', cwd: '~', process: '', status: 'idle' });
        }
      } catch {
        // Fallback: create default tab
        const id = `tab-${Date.now()}`;
        addTab({ id, title: 'Terminal', cwd: '~', process: '', status: 'idle' });
      }
    })();
  }, []);

  // Save session before window closes
  useEffect(() => {
    const saveSession = () => {
      const { tabs, activeTabId, splitRoot } = useAppStore.getState();
      window.electronAPI.session.save({
        tabs: tabs.map(t => ({ ...t, status: 'idle' as const, process: '' })),
        activeTabId,
        splitRoot,
        savedAt: new Date().toISOString(),
      });
    };

    window.addEventListener('beforeunload', saveSession);
    // Also save periodically (every 30s)
    const interval = setInterval(saveSession, 30000);
    return () => {
      window.removeEventListener('beforeunload', saveSession);
      clearInterval(interval);
    };
  }, []);

  // tmux: check availability and set up event listeners
  useEffect(() => {
    const tmux = useTmuxStore.getState();
    tmux.checkAvailability();

    // Listen for tmux state changes
    const unsubState = window.electronAPI.tmux.onStateChanged((state) => {
      useTmuxStore.getState().setTmuxState(state);
    });

    // Listen for layout changes (tmux pane splits/resizes)
    const unsubLayout = window.electronAPI.tmux.onLayoutChange((_windowId, splitNode) => {
      useAppStore.getState().setSplitRoot(splitNode);
    });

    // Listen for new panes added by tmux
    const unsubPaneAdded = window.electronAPI.tmux.onPaneAdded((tabId, _paneId, _windowId) => {
      const { tabs } = useAppStore.getState();
      if (!tabs.find(t => t.id === tabId)) {
        useAppStore.getState().addTab({
          id: tabId,
          title: 'Terminal',
          cwd: '~',
          process: '',
          status: 'idle',
        });
      }
    });

    // Listen for panes removed by tmux
    const unsubPaneRemoved = window.electronAPI.tmux.onPaneRemoved((tabId) => {
      useAppStore.getState().removeTab(tabId);
    });

    // Listen for window renames
    const unsubRenamed = window.electronAPI.tmux.onWindowRenamed((_windowId, name) => {
      // Update the active tab's title to match tmux window name
      const { activeTabId } = useAppStore.getState();
      useAppStore.getState().updateTab(activeTabId, { title: name });
    });

    return () => {
      unsubState();
      unsubLayout();
      unsubPaneAdded();
      unsubPaneRemoved();
      unsubRenamed();
    };
  }, []);

  // tmux: auto-start/attach on launch if enabled
  useEffect(() => {
    const { tmuxAvailable } = useTmuxStore.getState();
    if (!tmuxAvailable || !settings.tmuxEnabled) return;

    (async () => {
      try {
        const sessions = await window.electronAPI.tmux.listSessions();
        if (settings.tmuxAutoAttach && sessions.length > 0) {
          // Attach to the default session or first available
          const target = sessions.find(s => s.name === settings.tmuxDefaultSession) || sessions[0];
          await window.electronAPI.tmux.attach(target.name);
        } else {
          await window.electronAPI.tmux.start(settings.tmuxDefaultSession);
        }
      } catch (err) {
        console.error('tmux auto-start failed:', err);
      }
    })();
  }, [settings.tmuxEnabled]);

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+T: New tab
      if (meta && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        const id = `tab-${Date.now()}`;
        addTab({
          id,
          title: 'Terminal',
          cwd: '~',
          process: '',
          status: 'idle',
        });
        play('click');
        return;
      }

      // Cmd+W: Close tab or split pane
      if (meta && !e.shiftKey && e.key === 'w') {
        e.preventDefault();
        if (splitRoot) {
          closeSplitPane(activeTabId);
          play('click');
        } else if (tabs.length > 1) {
          removeTab(activeTabId);
          play('click');
        }
        return;
      }

      // Cmd+D: Vertical split
      if (meta && !e.shiftKey && e.key === 'd') {
        e.preventDefault();
        splitActivePane('vertical');
        play('click');
        return;
      }

      // Cmd+Shift+D: Horizontal split
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        splitActivePane('horizontal');
        play('click');
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, activeTabId, splitRoot]);

  // Get active tab's info for title bar
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Determine which tabs are "root" tabs (not inside a split)
  const splitTabIds = new Set<string>();
  const collectSplitTabs = (node: SplitNode | null) => {
    if (!node) return;
    if (node.type === 'leaf') { splitTabIds.add(node.tabId); return; }
    collectSplitTabs(node.children[0]);
    collectSplitTabs(node.children[1]);
  };
  collectSplitTabs(splitRoot);

  // Tabs that are standalone (not part of a split tree)
  const standaloneTabs = tabs.filter((t) => !splitTabIds.has(t.id));
  // The active tab might be inside a split — find which root group it belongs to
  const activeIsInSplit = splitTabIds.has(activeTabId);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        dropdownAnim === 'in' ? 'dropdown-slide-in' : dropdownAnim === 'out' ? 'dropdown-slide-out' : ''
      }`}
      data-theme={theme}
      style={{
        background: 'var(--bg-primary)',
        borderBottom: dropdownMode ? `2px solid ${settings.accentColor}` : undefined,
        borderRadius: dropdownMode ? '0 0 8px 8px' : undefined,
      }}
    >
      {/* Title Bar — hidden in dropdown mode */}
      {!dropdownMode && (
      <div className="titlebar-drag flex items-center h-10 border-b px-4 flex-shrink-0" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <div className="titlebar-no-drag flex items-center gap-2 mr-4">
          <button
            onClick={() => window.electronAPI?.window?.close()}
            className="w-3 h-3 rounded-full bg-[#EF4444] hover:bg-[#F87171] transition-colors"
          />
          <button
            onClick={() => window.electronAPI?.window?.minimize()}
            className="w-3 h-3 rounded-full bg-[#EAB308] hover:bg-[#FDE047] transition-colors"
          />
          <button
            onClick={() => window.electronAPI?.window?.maximize()}
            className="w-3 h-3 rounded-full bg-[#22C55E] hover:bg-[#4ADE80] transition-colors"
          />
        </div>

        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {activeTab?.cwd || '~'}
          </span>
          {activeTab?.gitBranch && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z"/>
              </svg>
              {activeTab.gitBranch}
            </span>
          )}
          {activeTab?.status === 'running' && activeTab.process && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {activeTab.process}
            </span>
          )}
        </div>

        <div className="titlebar-no-drag flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {useTmuxStore.getState().tmuxConnected && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              tmux:{useTmuxStore.getState().sessionName || '?'}
            </span>
          )}
          {/* Dark / Light toggle */}
          <div className="flex items-center rounded-full p-0.5 gap-0.5" style={{ background: 'var(--bg-secondary)' }}>
            <button
              onClick={() => { setTheme('light'); window.electronAPI.store.set('theme', 'light'); }}
              className="p-1 rounded-full transition-colors"
              style={{
                background: theme === 'light' ? 'var(--accent)' : 'transparent',
                color: theme === 'light' ? '#fff' : 'var(--text-muted)',
              }}
              title="Light mode"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>
            <button
              onClick={() => { setTheme('dark'); window.electronAPI.store.set('theme', 'dark'); }}
              className="p-1 rounded-full transition-colors"
              style={{
                background: theme === 'dark' ? 'var(--accent)' : 'transparent',
                color: theme === 'dark' ? '#fff' : 'var(--text-muted)',
              }}
              title="Dark mode"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
          </div>

          <span className="opacity-50">CRUX</span>
        </div>
      </div>
      )}

      <TabBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {/* If there's a split tree, render it */}
          {splitRoot ? (
            <div className="absolute inset-0">
              <SplitRenderer node={splitRoot} />
            </div>
          ) : (
            /* Otherwise render standalone tabs */
            tabs.map((tab) => (
              <div
                key={tab.id}
                className={`absolute inset-0 ${tab.id === activeTabId ? 'z-10' : 'z-0 invisible'}`}
              >
                <Terminal tabId={tab.id} />
              </div>
            ))
          )}
        </div>

        {showSystemPulse && <SystemPulse />}
        <PreviewPanel />
        {/* AI is inline in the terminal — no sidebar */}
      </div>

      {/* Overlays */}
      <CommandPalette />
      <HistoryView />
      <WorkflowPanel />
      <Settings />
      <SSHManager />
      <BlockHistory />
      <Onboarding />
    </div>
  );
};

export default App;
