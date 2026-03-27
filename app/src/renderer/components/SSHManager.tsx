import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { SSHConnection, SSHGroup, parseQuickConnect } from '../../shared/ssh-types';
import SSHConnectionForm from './SSHConnectionForm';

const SSHManager: React.FC = () => {
  const { showSSHManager, setShowSSHManager, addTab, setActiveTab } = useAppStore();
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [groups, setGroups] = useState<SSHGroup[]>([]);
  const [search, setSearch] = useState('');
  const [quickConnect, setQuickConnect] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conn: SSHConnection } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadConnections = useCallback(async () => {
    const conns = await window.electronAPI.ssh.getConnections();
    setConnections(conns);
    const grps = await window.electronAPI.ssh.getGroups();
    setGroups(grps);
  }, []);

  useEffect(() => {
    if (showSSHManager) {
      loadConnections();
      setSearch('');
      setQuickConnect('');
      setShowForm(false);
      setEditingConnection(null);
      setContextMenu(null);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSSHManager, loadConnections]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  const connectSSH = useCallback(async (conn: SSHConnection) => {
    const tabId = `tab-${Date.now()}`;
    const args = await window.electronAPI.ssh.buildArgs(conn);

    addTab({
      id: tabId,
      title: `SSH: ${conn.name}`,
      cwd: '~',
      process: 'ssh',
      status: 'running',
      isSSH: true,
      sshConnectionId: conn.id,
      colorTag: conn.colorTag,
    });
    setActiveTab(tabId);

    await window.electronAPI.pty.create(tabId, 'ssh', undefined, args);

    // For password auth, write password after prompt appears
    if (conn.authMethod.type === 'password') {
      const password = await window.electronAPI.ssh.getPassword(conn.id);
      if (password) {
        setTimeout(() => {
          window.electronAPI.pty.write(tabId, password + '\r');
        }, 2500);
      }
    }

    // Send startup command after connection
    if (conn.startupCommand) {
      const delay = conn.authMethod.type === 'password' ? 4500 : 2500;
      setTimeout(() => {
        window.electronAPI.pty.write(tabId, conn.startupCommand + '\r');
      }, delay);
    }

    // Update last connected
    conn.lastConnectedAt = new Date().toISOString();
    await window.electronAPI.ssh.saveConnection(conn);

    setShowSSHManager(false);
  }, [addTab, setActiveTab, setShowSSHManager]);

  const handleQuickConnect = useCallback(async () => {
    const parsed = parseQuickConnect(quickConnect.trim());
    if (!parsed) return;

    const conn: SSHConnection = {
      id: `ssh-quick-${Date.now()}`,
      name: quickConnect.trim(),
      host: parsed.host,
      port: parsed.port || 22,
      username: parsed.username || 'root',
      authMethod: { type: 'agent' },
      group: '',
      colorTag: '#06B6D4',
      createdAt: new Date().toISOString(),
    };

    await connectSSH(conn);
  }, [quickConnect, connectSSH]);

  const handleSaveConnection = useCallback(async (conn: SSHConnection, password?: string) => {
    await window.electronAPI.ssh.saveConnection(conn);
    if (password) {
      await window.electronAPI.ssh.savePassword(conn.id, password);
    }
    setShowForm(false);
    setEditingConnection(null);
    loadConnections();
  }, [loadConnections]);

  const handleDeleteConnection = useCallback(async (id: string) => {
    await window.electronAPI.ssh.deleteConnection(id);
    setContextMenu(null);
    loadConnections();
  }, [loadConnections]);

  const handleDuplicate = useCallback(async (conn: SSHConnection) => {
    const dupe: SSHConnection = {
      ...conn,
      id: `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${conn.name} (copy)`,
      createdAt: new Date().toISOString(),
      lastConnectedAt: undefined,
    };
    await window.electronAPI.ssh.saveConnection(dupe);
    setContextMenu(null);
    loadConnections();
  }, [loadConnections]);

  const handleCopyCommand = useCallback(async (conn: SSHConnection) => {
    const args = await window.electronAPI.ssh.buildArgs(conn);
    const cmd = `ssh ${args.join(' ')}`;
    navigator.clipboard.writeText(cmd);
    setContextMenu(null);
  }, []);

  const handleImportConfig = useCallback(async () => {
    await window.electronAPI.ssh.importConfig();
    loadConnections();
  }, [loadConnections]);

  const toggleGroup = useCallback((name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  if (!showSSHManager) return null;

  // Filter connections by search
  const filtered = search
    ? connections.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.host.toLowerCase().includes(search.toLowerCase()) ||
        c.group.toLowerCase().includes(search.toLowerCase()) ||
        c.username.toLowerCase().includes(search.toLowerCase())
      )
    : connections;

  // Group filtered connections
  const filteredGroups = new Map<string, SSHConnection[]>();
  for (const conn of filtered) {
    const g = conn.group || '';
    if (!filteredGroups.has(g)) filteredGroups.set(g, []);
    filteredGroups.get(g)!.push(conn);
  }

  const existingGroupNames = [...new Set(connections.map(c => c.group).filter(Boolean))];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setShowSSHManager(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-crux" />
      <div
        className="settings-overlay relative w-full max-w-2xl bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔐</span>
            <h2 className="text-sm font-semibold">SSH Connections</h2>
            <span className="text-[10px] text-[#64748B]">{connections.length} saved</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm(true); setEditingConnection(null); }}
              className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + New
            </button>
            <button
              onClick={() => setShowSSHManager(false)}
              className="text-[#64748B] hover:text-[#E2E8F0] transition-colors"
            >
              x
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {showForm ? (
            <div className="p-4">
              <SSHConnectionForm
                connection={editingConnection}
                existingGroups={existingGroupNames}
                onSave={handleSaveConnection}
                onCancel={() => { setShowForm(false); setEditingConnection(null); }}
              />
            </div>
          ) : (
            <>
              {/* Quick Connect + Search */}
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={searchRef}
                    type="text"
                    value={quickConnect}
                    onChange={e => setQuickConnect(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && quickConnect.trim()) handleQuickConnect(); }}
                    placeholder="Quick connect: user@host:port"
                    className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
                  />
                  <button
                    onClick={handleQuickConnect}
                    disabled={!quickConnect.trim()}
                    className="text-[10px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#94A3B8] px-3 py-1.5 rounded-lg disabled:opacity-30"
                  >
                    Connect
                  </button>
                </div>
                {connections.length > 3 && (
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search connections..."
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50"
                  />
                )}
              </div>

              {/* Connection List */}
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#64748B] mb-4">No SSH connections saved</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleImportConfig}
                      className="text-[10px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#94A3B8] px-3 py-1.5 rounded-lg"
                    >
                      Import from ~/.ssh/config
                    </button>
                    <button
                      onClick={() => { setShowForm(true); setEditingConnection(null); }}
                      className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Add Connection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-2 pb-4">
                  {[...filteredGroups.entries()].map(([groupName, groupConns]) => (
                    <div key={groupName || '__ungrouped'} className="mb-1">
                      {/* Group header */}
                      {groupName && (
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-[#64748B] uppercase tracking-wider hover:text-[#94A3B8]"
                        >
                          <span>{collapsedGroups.has(groupName) ? '>' : 'v'}</span>
                          <span>{groupName}</span>
                          <span className="text-[#475569]">({groupConns.length})</span>
                        </button>
                      )}

                      {/* Connections in group */}
                      {(!groupName || !collapsedGroups.has(groupName)) && groupConns.map(conn => (
                        <div
                          key={conn.id}
                          className="flex items-center gap-3 px-3 py-2 mx-1 rounded-lg hover:bg-[#1E1E2E]/50 cursor-pointer group"
                          onClick={() => connectSSH(conn)}
                          onContextMenu={e => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, conn });
                          }}
                        >
                          {/* Color dot */}
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: conn.colorTag }}
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[#E2E8F0] truncate">{conn.name}</div>
                            <div className="text-[10px] text-[#64748B] font-mono truncate">
                              {conn.username}@{conn.host}{conn.port !== 22 ? `:${conn.port}` : ''}
                            </div>
                          </div>

                          {/* Last connected */}
                          {conn.lastConnectedAt && (
                            <span className="text-[9px] text-[#475569] flex-shrink-0">
                              {new Date(conn.lastConnectedAt).toLocaleDateString()}
                            </span>
                          )}

                          {/* Connect button */}
                          <button
                            onClick={e => { e.stopPropagation(); connectSSH(conn); }}
                            className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E1E2E] flex items-center justify-between text-[10px] text-[#64748B] flex-shrink-0">
          <div className="flex gap-3">
            <button onClick={handleImportConfig} className="hover:text-[#94A3B8]">
              Import ~/.ssh/config
            </button>
          </div>
          <span>Cmd+Shift+S</span>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-[#1A1A24] border border-[#2A2A3E] rounded-lg shadow-xl py-1 z-[60]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { label: 'Connect', action: () => { connectSSH(contextMenu.conn); setContextMenu(null); } },
              { label: 'Edit', action: () => { setEditingConnection(contextMenu.conn); setShowForm(true); setContextMenu(null); } },
              { label: 'Duplicate', action: () => handleDuplicate(contextMenu.conn) },
              { label: 'Copy SSH Command', action: () => handleCopyCommand(contextMenu.conn) },
              { label: 'Delete', action: () => handleDeleteConnection(contextMenu.conn.id), danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full text-left px-4 py-1.5 text-xs hover:bg-[#2A2A3E] transition-colors ${
                  (item as any).danger ? 'text-red-400' : 'text-[#E2E8F0]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SSHManager;
