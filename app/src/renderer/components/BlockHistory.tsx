import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import CommandBlock from './CommandBlock';

const BlockHistory: React.FC = () => {
  const { showBlockHistory, setShowBlockHistory, commandBlocks, activeTabId } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'errors' | 'success'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showBlockHistory) {
      setSearch('');
      setFilter('all');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showBlockHistory]);

  const blocks = useMemo(() => {
    const tabBlocks = commandBlocks.get(activeTabId) || [];
    let filtered = [...tabBlocks].reverse(); // newest first

    if (filter === 'errors') filtered = filtered.filter(b => b.exitCode !== 0);
    if (filter === 'success') filtered = filtered.filter(b => b.exitCode === 0);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.command.toLowerCase().includes(q) ||
        b.output.toLowerCase().includes(q) ||
        b.cwd.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [commandBlocks, activeTabId, search, filter]);

  const handleRerun = (command: string) => {
    window.electronAPI.pty.write(activeTabId, command + '\r');
    setShowBlockHistory(false);
  };

  const handleCopy = (output: string) => {
    navigator.clipboard.writeText(output);
  };

  if (!showBlockHistory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setShowBlockHistory(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-crux" />
      <div
        className="settings-overlay relative w-full max-w-3xl bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">Command Blocks</h2>
            <span className="text-[10px] text-[#64748B]">{blocks.length} commands</span>
          </div>
          <button
            onClick={() => setShowBlockHistory(false)}
            className="text-[#64748B] hover:text-[#E2E8F0]"
          >
            x
          </button>
        </div>

        {/* Search + Filter */}
        <div className="p-3 border-b border-[#1E1E2E] flex gap-2 flex-shrink-0">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commands and output..."
            className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-1.5 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
          />
          <div className="flex gap-1">
            {(['all', 'errors', 'success'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'errors' ? 'Errors' : 'Success'}
              </button>
            ))}
          </div>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto">
          {blocks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#64748B]">
              {search ? 'No matching commands' : 'No command blocks yet. Run some commands!'}
            </div>
          ) : (
            blocks.map((block, i) => (
              <CommandBlock
                key={`${block.timestamp}-${i}`}
                block={{ ...block, id: String(block.timestamp) }}
                onRerun={handleRerun}
                onCopyOutput={handleCopy}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockHistory;
