import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SlashCommand {
  name: string;
  description: string;
  shortcut?: string;
  action: () => void;
}

interface SlashCommandsProps {
  commands: SlashCommand[];
  query: string; // current text after the "/"
  visible: boolean;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  anchorBottom: number; // distance from bottom of terminal
}

const SlashCommands: React.FC<SlashCommandsProps> = ({
  commands,
  query,
  visible,
  onSelect,
  onClose,
  anchorBottom,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands by query
  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  // Reset selection when query or visibility changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, visible]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-slash-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [visible, filtered, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    if (visible) {
      // Use capture phase to intercept before xterm
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [visible, handleKeyDown]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      className="absolute left-2 z-50"
      style={{ bottom: `${anchorBottom}px` }}
    >
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-lg shadow-2xl shadow-black/60 overflow-hidden w-72">
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#1E1E2E] flex items-center gap-2">
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Commands</span>
          <span className="text-[10px] text-[#64748B]">
            /{query}<span className="animate-pulse">|</span>
          </span>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {filtered.map((cmd, index) => (
            <button
              key={cmd.name}
              data-slash-item
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-[#3B82F6]/10 border-l-2 border-l-blue-500'
                  : 'border-l-2 border-l-transparent hover:bg-[#1E1E2E]/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#E2E8F0] font-mono">
                    /{cmd.name}
                  </span>
                  {cmd.shortcut && (
                    <span className="text-[9px] text-[#64748B] bg-[#1E1E2E] px-1.5 py-0.5 rounded">
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                  {cmd.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hints */}
        <div className="px-3 py-1.5 border-t border-[#1E1E2E] flex items-center gap-3 text-[9px] text-[#64748B]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>⇥ complete</span>
          <span>esc dismiss</span>
        </div>
      </div>
    </div>
  );
};

export default SlashCommands;
