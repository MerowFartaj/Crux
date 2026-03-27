import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { HistoryEntry } from '../../shared/types';

interface GroupedHistory {
  directory: string;
  entries: HistoryEntry[];
}

const HistoryView: React.FC = () => {
  const { showHistoryView, setShowHistoryView } = useAppStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [grouped, setGrouped] = useState<GroupedHistory[]>([]);
  const [stats, setStats] = useState<{ totalCommands: number; directories: string[] }>({
    totalCommands: 0,
    directories: [],
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!showHistoryView) return;
    loadHistory();
    loadStats();
  }, [showHistoryView]);

  const loadHistory = async () => {
    const data = searchQuery
      ? await window.electronAPI.db.search(searchQuery, 200)
      : await window.electronAPI.db.getAll(200);
    setEntries(data);

    // Group by directory
    const groups = new Map<string, HistoryEntry[]>();
    for (const entry of data) {
      const dir = entry.directory;
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(entry);
    }
    setGrouped(
      Array.from(groups.entries())
        .map(([directory, entries]) => ({ directory, entries }))
        .sort((a, b) => {
          const aLatest = new Date(a.entries[0]?.timestamp || 0).getTime();
          const bLatest = new Date(b.entries[0]?.timestamp || 0).getTime();
          return bLatest - aLatest;
        })
    );
  };

  const loadStats = async () => {
    const s = await window.electronAPI.db.getStats();
    setStats(s);
  };

  useEffect(() => {
    if (!showHistoryView) return;
    const timer = setTimeout(() => loadHistory(), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!showHistoryView) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setShowHistoryView(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-crux" />
      <div
        className="relative w-full max-w-4xl max-h-[80vh] bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col settings-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold">Command History</h2>
            <span className="text-xs text-[#64748B] bg-[#1E1E2E] px-2 py-0.5 rounded-full">
              {stats.totalCommands} commands
            </span>
            <span className="text-xs text-[#64748B] bg-[#1E1E2E] px-2 py-0.5 rounded-full">
              {stats.directories.length} directories
            </span>
          </div>
          <button
            onClick={() => setShowHistoryView(false)}
            className="text-[#64748B] hover:text-[#E2E8F0] transition-colors"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#1E1E2E]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter commands..."
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {grouped.map((group) => (
            <div key={group.directory} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-cyan-400 font-mono">
                  {group.directory}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  ({group.entries.length} commands)
                </span>
              </div>
              <div className="space-y-1">
                {group.entries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E1E2E]/50 group cursor-pointer transition-colors"
                    onClick={() => {
                      const { activeTabId } = useAppStore.getState();
                      window.electronAPI.pty.write(activeTabId, entry.command + '\r');
                      setShowHistoryView(false);
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        entry.exit_code === 0 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="flex-1 font-mono text-xs text-[#E2E8F0] truncate">
                      {entry.command}
                    </span>
                    <span className="text-[10px] text-[#64748B] flex-shrink-0">
                      {entry.duration_ms > 0 &&
                        (entry.duration_ms < 1000
                          ? `${entry.duration_ms}ms`
                          : `${(entry.duration_ms / 1000).toFixed(1)}s`)}
                    </span>
                    <span className="text-[10px] text-[#64748B] flex-shrink-0 w-32 text-right">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[#64748B] text-sm">
              {searchQuery ? 'No matching commands' : 'No history yet. Start typing commands!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
