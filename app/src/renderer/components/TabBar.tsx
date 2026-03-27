import React from 'react';
import { useAppStore } from '../stores/appStore';
import { useSound } from '../hooks/useSound';

const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useAppStore();
  const { play } = useSound();

  const formatTabLabel = (cwd: string, title: string) => {
    if (!cwd || cwd === '~') return cwd || title;
    const parts = cwd.split('/').filter(Boolean);
    return parts[parts.length - 1] || cwd;
  };

  const handleNewTab = () => {
    const id = `tab-${Date.now()}`;
    addTab({
      id,
      title: 'Terminal',
      cwd: '~',
      process: '',
      status: 'idle',
    });
    play('click');
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab
    removeTab(id);
    play('click');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-emerald-500';
      case 'running': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center h-9 overflow-x-auto" style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="group flex items-center gap-2 h-full px-4 text-xs font-medium transition-crux min-w-[120px] max-w-[200px]"
          style={{
            borderRight: '1px solid var(--border)',
            background: tab.id === activeTabId ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
            color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <span
            className={`tab-indicator flex-shrink-0 ${tab.isSSH && tab.colorTag ? '' : statusColor(tab.status)}`}
            style={tab.isSSH && tab.colorTag ? { backgroundColor: tab.colorTag } : undefined}
          />
          <span className="truncate flex-1 text-left">
            <span style={{ color: 'var(--text-muted)' }} className="mr-1">{index + 1}</span>
            {tab.isSSH && <span className="mr-1" title="SSH connection">🔒</span>}
            {tab.process && tab.status === 'running' ? (
              <span className={tab.isSSH ? 'text-cyan-400' : 'text-yellow-400'}>{tab.isSSH ? tab.title.replace('SSH: ', '') : tab.process}</span>
            ) : (
              formatTabLabel(tab.cwd, tab.title)
            )}
          </span>
          {tabs.length > 1 && (
            <span
              onClick={(e) => handleCloseTab(e, tab.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-4 h-4 flex items-center justify-center rounded"
              style={{ color: 'var(--text-muted)' }}
            >
              ×
            </span>
          )}
        </button>
      ))}
      <button
        onClick={handleNewTab}
        className="flex items-center justify-center w-8 h-full transition-crux flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
        title="New Tab (⌘T)"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
