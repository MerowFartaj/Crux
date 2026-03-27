import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function useKeyboard() {
  const {
    setShowCommandPalette,
    toggleSystemPulse,
    setShowHistoryView,
    setShowWorkflowPanel,
    setShowSettings,
    setShowSSHManager,
    tabs,
    activeTabId,
    setActiveTab,
    showCommandPalette,
    showHistoryView,
    showWorkflowPanel,
    showSettings,
    showSSHManager,
  } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+K: Command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
        return;
      }

      // Cmd+Shift+P: System pulse
      if (meta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleSystemPulse();
        return;
      }

      // Cmd+Shift+H: History view
      if (meta && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowHistoryView(!showHistoryView);
        return;
      }

      // Cmd+Shift+W: Workflow panel
      if (meta && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        setShowWorkflowPanel(!showWorkflowPanel);
        return;
      }

      // Cmd+Shift+A: Inline AI — prefill /ai in terminal
      if (meta && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        // Write /ai to the active terminal's PTY
        const tid = activeTabId;
        if (tid) window.electronAPI.pty.write(tid, '/ai ');
        return;
      }

      // Cmd+Shift+S: SSH Manager
      if (meta && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowSSHManager(!showSSHManager);
        return;
      }

      // Cmd+,: Settings
      if (meta && e.key === ',') {
        e.preventDefault();
        setShowSettings(!showSettings);
        return;
      }

      // Cmd+1-9: Switch tabs
      if (meta && !e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
          setActiveTab(tabs[idx].id);
        }
        return;
      }

      // Escape: Close overlays
      if (e.key === 'Escape') {
        if (showCommandPalette) setShowCommandPalette(false);
        if (showHistoryView) setShowHistoryView(false);
        if (showWorkflowPanel) setShowWorkflowPanel(false);
        if (showSettings) setShowSettings(false);
        if (showSSHManager) setShowSSHManager(false);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    showCommandPalette,
    showHistoryView,
    showWorkflowPanel,
    showSettings,
    showSSHManager,
    tabs,
    activeTabId,
  ]);
}
