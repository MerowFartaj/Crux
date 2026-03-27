import React, { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import { useAppStore } from '../stores/appStore';
import { HistoryEntry } from '../../shared/types';

const CommandPalette: React.FC = () => {
  const { showCommandPalette, setShowCommandPalette, activeTabId } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HistoryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCommandPalette) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setIsAiMode(false);
      setAiResult('');
      setAiError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  const searchHistory = useCallback(async (q: string) => {
    if (!q.trim()) {
      const recent = await window.electronAPI.db.getAll(20);
      setResults(recent);
      return;
    }
    const found = await window.electronAPI.db.search(q, 20);
    setResults(found);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (!showCommandPalette) return;
    if (isAiMode) return;
    const timer = setTimeout(() => searchHistory(query), 100);
    return () => clearTimeout(timer);
  }, [query, showCommandPalette, isAiMode, searchHistory]);

  const handleInputChange = (value: string) => {
    const aiEnabled = useAppStore.getState().settings.aiEnabled;
    if (value.startsWith('>') && aiEnabled) {
      setIsAiMode(true);
      setQuery(value.substring(1));
      setAiResult('');
      setAiError('');
    } else {
      setIsAiMode(false);
      setQuery(value);
    }
  };

  const handleAiTranslate = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const command = await window.electronAPI.ai.translateCommand(query.trim());
      setAiResult(command);
    } catch (err: any) {
      setAiError(err.message || 'Failed to translate command');
    } finally {
      setAiLoading(false);
    }
  };

  const executeCommand = (command: string) => {
    window.electronAPI.pty.write(activeTabId, command + '\r');
    setShowCommandPalette(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCommandPalette(false);
      return;
    }

    if (isAiMode) {
      if (e.key === 'Enter') {
        if (aiResult) {
          executeCommand(aiResult);
        } else {
          handleAiTranslate();
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      executeCommand(results[selectedIndex].command);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!showCommandPalette) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={() => setShowCommandPalette(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-crux" />
      <div
        className="relative w-full max-w-2xl bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center border-b border-[#1E1E2E] px-4">
          <span className="text-[#64748B] text-sm mr-2">
            {isAiMode ? (
              <span className="text-cyan-400">AI ›</span>
            ) : (
              <span>›</span>
            )}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={isAiMode ? `>${query}` : query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAiMode ? 'Describe what you want to do...' : 'Search commands... (prefix with > for AI mode)'}
            className="flex-1 bg-transparent py-4 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none font-mono"
          />
          <kbd className="text-[10px] text-[#64748B] bg-[#1E1E2E] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* AI Mode */}
        {isAiMode && (
          <div className="p-4">
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Translating...
              </div>
            )}
            {aiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {aiError}
              </div>
            )}
            {aiResult && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Generated command:</span>
                <div className="p-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg font-mono text-sm text-cyan-400">
                  {aiResult}
                </div>
                <span className="text-xs text-[#64748B]">
                  Press Enter to execute or Escape to cancel
                </span>
              </div>
            )}
            {!aiLoading && !aiResult && !aiError && (
              <span className="text-xs text-[#64748B]">
                Press Enter to translate your description into a shell command
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {!isAiMode && (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 && query && (
              <div className="p-4 text-sm text-[#64748B] text-center">
                No commands found
              </div>
            )}
            {results.map((entry, index) => (
              <button
                key={entry.id || index}
                onClick={() => executeCommand(entry.command)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-[#3B82F6]/10 border-l-2 border-l-blue-500'
                    : 'border-l-2 border-l-transparent hover:bg-[#1E1E2E]/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-[#E2E8F0] truncate">
                    {entry.command}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[#64748B]">
                      {entry.directory}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {formatTime(entry.timestamp)}
                    </span>
                    {entry.duration_ms > 0 && (
                      <span className="text-[10px] text-[#64748B]">
                        {entry.duration_ms < 1000
                          ? `${entry.duration_ms}ms`
                          : `${(entry.duration_ms / 1000).toFixed(1)}s`}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    entry.exit_code === 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {entry.exit_code === 0 ? '✓' : `✗ ${entry.exit_code}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1E1E2E] text-[10px] text-[#64748B]">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>
            <kbd className="bg-[#1E1E2E] px-1 rounded">{'>'}</kbd> AI mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
