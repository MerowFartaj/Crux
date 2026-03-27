import React, { useState, useCallback } from 'react';

interface RichRendererProps {
  output: string;
  command: string;
}

// Try to parse JSON
const tryParseJSON = (str: string): any | null => {
  try {
    const trimmed = str.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return JSON.parse(trimmed);
    }
  } catch {}
  return null;
};

// JSON Tree component
const JSONTree: React.FC<{ data: any; depth?: number }> = ({ data, depth = 0 }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null) return <span className="rich-json-null">null</span>;
  if (typeof data === 'boolean') return <span className="rich-json-boolean">{String(data)}</span>;
  if (typeof data === 'number') return <span className="rich-json-number">{data}</span>;
  if (typeof data === 'string') return <span className="rich-json-string">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-[#64748B]">[]</span>;
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#64748B] hover:text-[#E2E8F0]"
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-[#64748B]"> [{data.length}]</span>
        {!collapsed && (
          <div className="ml-4">
            {data.map((item, i) => (
              <div key={i}>
                <JSONTree data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-[#64748B]">,</span>}
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-[#64748B]">{'{}'}</span>;
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#64748B] hover:text-[#E2E8F0]"
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-[#64748B]"> {'{'}...{'}'}</span>
        {!collapsed && (
          <div className="ml-4">
            {keys.map((key, i) => (
              <div key={key}>
                <span className="rich-json-key">"{key}"</span>
                <span className="text-[#64748B]">: </span>
                <JSONTree data={data[key]} depth={depth + 1} />
                {i < keys.length - 1 && <span className="text-[#64748B]">,</span>}
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  return <span>{String(data)}</span>;
};

// Git status renderer
const GitStatusRenderer: React.FC<{ output: string }> = ({ output }) => {
  const lines = output.split('\n').filter((l) => l.trim());
  const files = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('new file:') || trimmed.startsWith('A '))
      return { name: trimmed.replace(/^(new file:|A)\s+/, ''), status: 'added' };
    if (trimmed.startsWith('deleted:') || trimmed.startsWith('D '))
      return { name: trimmed.replace(/^(deleted:|D)\s+/, ''), status: 'deleted' };
    if (trimmed.startsWith('modified:') || trimmed.startsWith('M '))
      return { name: trimmed.replace(/^(modified:|M)\s+/, ''), status: 'modified' };
    if (trimmed.startsWith('??'))
      return { name: trimmed.replace(/^\?\?\s+/, ''), status: 'untracked' };
    return { name: trimmed, status: 'unknown' };
  });

  const statusColor: Record<string, string> = {
    added: 'text-emerald-400',
    deleted: 'text-red-400',
    modified: 'text-yellow-400',
    untracked: 'text-[#64748B]',
    unknown: 'text-[#64748B]',
  };

  const statusIcon: Record<string, string> = {
    added: '+',
    deleted: '-',
    modified: '~',
    untracked: '?',
    unknown: ' ',
  };

  return (
    <div className="space-y-1">
      {files.map((file, i) => (
        <div key={i} className={`flex items-center gap-2 text-xs font-mono ${statusColor[file.status]}`}>
          <span className="w-4 text-center">{statusIcon[file.status]}</span>
          <span>{file.name}</span>
        </div>
      ))}
    </div>
  );
};

// Table renderer
const TableRenderer: React.FC<{ output: string }> = ({ output }) => {
  const lines = output.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null;

  // Try to split by multiple spaces
  const headers = lines[0].split(/\s{2,}/).filter((h) => h.trim());
  const rows = lines.slice(1).map((line) =>
    line.split(/\s{2,}/).filter((c) => c.trim())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-2 py-1 text-cyan-400 border-b border-[#1E1E2E] font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? 'bg-[#0A0A0F]' : 'bg-[#12121A]'}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1 text-[#E2E8F0]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Error card renderer
const ErrorRenderer: React.FC<{ output: string }> = ({ output }) => {
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs font-medium text-red-400">Error</span>
      </div>
      <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{output}</pre>
    </div>
  );
};

const RichRenderer: React.FC<RichRendererProps> = ({ output, command }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Determine what to render
  const jsonData = tryParseJSON(output);
  const isGitCommand = command.startsWith('git status') || command.startsWith('git diff');
  const isTableLike = output.split('\n').length > 2 &&
    output.split('\n').slice(0, 3).every((l) => (l.match(/\s{2,}/g) || []).length >= 2);

  if (!jsonData && !isGitCommand && !isTableLike) return null;

  return (
    <div className="mx-2 my-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-[10px] text-[#64748B] hover:text-[#E2E8F0] mb-1"
      >
        <span>{collapsed ? '▶' : '▼'}</span>
        <span>Rich Preview</span>
      </button>
      {!collapsed && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-lg p-3 rich-json-tree">
          {jsonData && <JSONTree data={jsonData} />}
          {isGitCommand && !jsonData && <GitStatusRenderer output={output} />}
          {isTableLike && !jsonData && !isGitCommand && <TableRenderer output={output} />}
        </div>
      )}
    </div>
  );
};

export default RichRenderer;
