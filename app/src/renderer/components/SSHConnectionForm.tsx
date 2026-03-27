import React, { useState, useEffect } from 'react';
import { SSHConnection, SSHAuthMethod } from '../../shared/ssh-types';

const COLORS = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
  '#22C55E', '#EAB308', '#F97316', '#EF4444',
];

interface Props {
  connection?: SSHConnection | null;
  existingGroups: string[];
  onSave: (conn: SSHConnection, password?: string) => void;
  onCancel: () => void;
}

const SSHConnectionForm: React.FC<Props> = ({ connection, existingGroups, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState<'password' | 'key' | 'agent'>('agent');
  const [password, setPassword] = useState('');
  const [keyPath, setKeyPath] = useState('~/.ssh/id_rsa');
  const [group, setGroup] = useState('');
  const [colorTag, setColorTag] = useState('#3B82F6');
  const [startupCommand, setStartupCommand] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (connection) {
      setName(connection.name);
      setHost(connection.host);
      setPort(connection.port);
      setUsername(connection.username);
      setAuthType(connection.authMethod.type);
      if (connection.authMethod.type === 'key') {
        setKeyPath(connection.authMethod.keyPath);
      }
      setGroup(connection.group);
      setColorTag(connection.colorTag);
      setStartupCommand(connection.startupCommand || '');
    }
  }, [connection]);

  const handleSave = () => {
    const authMethod: SSHAuthMethod =
      authType === 'password' ? { type: 'password' }
      : authType === 'key' ? { type: 'key', keyPath }
      : { type: 'agent' };

    const conn: SSHConnection = {
      id: connection?.id || `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name || `${username}@${host}`,
      host,
      port,
      username,
      authMethod,
      group,
      colorTag,
      startupCommand: startupCommand || undefined,
      createdAt: connection?.createdAt || new Date().toISOString(),
      lastConnectedAt: connection?.lastConnectedAt,
    };

    onSave(conn, authType === 'password' ? password : undefined);
  };

  const handleBrowseKey = async () => {
    const filePath = await window.electronAPI.dialog.openFile();
    if (filePath) setKeyPath(filePath);
  };

  const isValid = host.trim() && username.trim();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#E2E8F0]">
        {connection ? 'Edit Connection' : 'New Connection'}
      </h3>

      {/* Name */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Production Server"
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Host + Port */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Host</label>
          <input
            type="text"
            value={host}
            onChange={e => setHost(e.target.value)}
            placeholder="192.168.1.1 or server.com"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
          />
        </div>
        <div className="w-20">
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Port</label>
          <input
            type="number"
            value={port}
            onChange={e => setPort(parseInt(e.target.value) || 22)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-blue-500/50 font-mono"
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="root"
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
        />
      </div>

      {/* Auth Method */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Authentication</label>
        <div className="flex gap-1">
          {(['agent', 'key', 'password'] as const).map(type => (
            <button
              key={type}
              onClick={() => setAuthType(type)}
              className={`px-3 py-1.5 text-[10px] rounded-lg transition-colors ${
                authType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
              }`}
            >
              {type === 'agent' ? 'SSH Agent' : type === 'key' ? 'SSH Key' : 'Password'}
            </button>
          ))}
        </div>
      </div>

      {/* Password field */}
      {authType === 'password' && (
        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Password</label>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-blue-500/50 font-mono"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[10px] text-[#64748B] hover:text-[#E2E8F0] px-2"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Stored encrypted via OS keychain</p>
        </div>
      )}

      {/* Key path */}
      {authType === 'key' && (
        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">SSH Key Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keyPath}
              onChange={e => setKeyPath(e.target.value)}
              className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-blue-500/50 font-mono"
            />
            <button
              onClick={handleBrowseKey}
              className="text-[10px] bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E] px-3 py-1.5 rounded-lg"
            >
              Browse
            </button>
          </div>
        </div>
      )}

      {/* Group */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Group</label>
        <input
          type="text"
          value={group}
          onChange={e => setGroup(e.target.value)}
          list="ssh-groups"
          placeholder="e.g. Work Servers"
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50"
        />
        <datalist id="ssh-groups">
          {existingGroups.filter(g => g).map(g => <option key={g} value={g} />)}
        </datalist>
      </div>

      {/* Color Tag */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Color Tag</label>
        <div className="flex gap-2">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => setColorTag(color)}
              className={`w-6 h-6 rounded-full transition-transform ${
                colorTag === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12121A] scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Startup Command */}
      <div>
        <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Startup Command (optional)</label>
        <input
          type="text"
          value={startupCommand}
          onChange={e => setStartupCommand(e.target.value)}
          placeholder="e.g. cd /var/www && tmux attach"
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {connection ? 'Save Changes' : 'Save Connection'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs text-[#94A3B8] bg-[#1E1E2E] hover:bg-[#2A2A3E] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SSHConnectionForm;
