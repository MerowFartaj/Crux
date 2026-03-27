import React, { useState } from 'react';

export interface CommandBlockData {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  duration: number;
  timestamp: number;
  cwd: string;
}

interface CommandBlockProps {
  block: CommandBlockData;
  onRerun: (command: string) => void;
  onCopyOutput: (output: string) => void;
}

const CommandBlock: React.FC<CommandBlockProps> = ({ block, onRerun, onCopyOutput }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  const isError = block.exitCode !== 0;
  const lines = block.output.split('\n');

  const filteredLines = searchQuery
    ? lines.filter((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines;

  const handleCopy = () => {
    onCopyOutput(block.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div
      className={`border-l-2 mb-1 ${
        isError ? 'border-l-red-500/60' : 'border-l-[#1E1E2E]'
      } hover:border-l-blue-500/60 transition-colors group`}
    >
      {/* Command header */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none ${
          isError ? 'bg-red-500/5' : 'bg-[#12121A]/50'
        } hover:bg-[#1E1E2E]/50 transition-colors`}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-[10px] text-[#64748B]">
          {collapsed ? '▶' : '▼'}
        </span>
        <span className={`text-xs font-mono flex-1 truncate ${
          isError ? 'text-red-400' : 'text-[#E2E8F0]'
        }`}>
          <span className="text-[#64748B] mr-1">$</span>
          {block.command}
        </span>

        {/* Block actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }}
            className="text-[9px] text-[#64748B] hover:text-[#E2E8F0] bg-[#1E1E2E] px-1.5 py-0.5 rounded"
            title="Search output"
          >
            /
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-[9px] text-[#64748B] hover:text-[#E2E8F0] bg-[#1E1E2E] px-1.5 py-0.5 rounded"
            title="Copy output"
          >
            {copied ? '✓' : '⎘'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRerun(block.command); }}
            className="text-[9px] text-[#64748B] hover:text-[#E2E8F0] bg-[#1E1E2E] px-1.5 py-0.5 rounded"
            title="Re-run command"
          >
            ↻
          </button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-[9px] text-[#64748B]">
          {block.duration > 0 && (
            <span>{formatDuration(block.duration)}</span>
          )}
          <span className={`w-1.5 h-1.5 rounded-full ${
            isError ? 'bg-red-500' : 'bg-emerald-500'
          }`} />
        </div>
      </div>

      {/* Search bar */}
      {showSearch && !collapsed && (
        <div className="px-3 py-1 bg-[#0A0A0F] border-b border-[#1E1E2E]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within output..."
            className="w-full bg-transparent text-[11px] text-[#E2E8F0] placeholder-[#64748B] outline-none font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSearch(false);
                setSearchQuery('');
              }
            }}
          />
        </div>
      )}

      {/* Output body */}
      {!collapsed && filteredLines.length > 0 && (
        <div className="px-3 py-1 max-h-64 overflow-y-auto bg-[#0A0A0F]/30">
          <pre className="text-[11px] font-mono text-[#94A3B8] whitespace-pre-wrap break-all leading-relaxed">
            {searchQuery
              ? filteredLines.map((line, i) => {
                  // Highlight search matches
                  const idx = line.toLowerCase().indexOf(searchQuery.toLowerCase());
                  if (idx === -1) return <div key={i}>{line}</div>;
                  return (
                    <div key={i}>
                      {line.slice(0, idx)}
                      <span className="bg-yellow-500/30 text-yellow-200">
                        {line.slice(idx, idx + searchQuery.length)}
                      </span>
                      {line.slice(idx + searchQuery.length)}
                    </div>
                  );
                })
              : filteredLines.map((line, i) => (
                  <div key={i}>{line || '\u00A0'}</div>
                ))
            }
          </pre>
        </div>
      )}
    </div>
  );
};

export default CommandBlock;
