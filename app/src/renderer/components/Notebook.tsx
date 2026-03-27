import React, { useEffect, useState, useCallback } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { useAppStore } from '../stores/appStore';

interface Props {
  filePath: string;
}

interface NotebookCell {
  type: 'markdown' | 'code';
  content: string;
  language?: string;
  output?: string;
  running?: boolean;
}

// Custom renderer that extracts code blocks as separate cells
function parseNotebook(markdown: string): NotebookCell[] {
  const cells: NotebookCell[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    // Markdown before this code block
    const mdBefore = markdown.slice(lastIndex, match.index).trim();
    if (mdBefore) {
      cells.push({ type: 'markdown', content: mdBefore });
    }

    const lang = match[1] || 'bash';
    const code = match[2].trim();
    const isRunnable = ['bash', 'sh', 'zsh', 'shell', 'console', ''].includes(lang.toLowerCase());

    if (isRunnable) {
      cells.push({ type: 'code', content: code, language: lang || 'bash' });
    } else {
      // Non-runnable code blocks stay as markdown
      cells.push({ type: 'markdown', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining markdown
  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) {
    cells.push({ type: 'markdown', content: remaining });
  }

  return cells;
}

const Notebook: React.FC<Props> = ({ filePath }) => {
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const activeTabId = useAppStore((s) => s.activeTabId);

  useEffect(() => {
    (async () => {
      try {
        const content = await window.electronAPI.file.read(filePath);
        setCells(parseNotebook(content));
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      }
    })();
  }, [filePath]);

  const runCell = useCallback(async (index: number) => {
    const cell = cells[index];
    if (!cell || cell.type !== 'code') return;

    // Mark as running
    setCells(prev => prev.map((c, i) => i === index ? { ...c, running: true, output: undefined } : c));

    // Send commands to the active terminal
    const commands = cell.content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    for (const cmd of commands) {
      window.electronAPI.pty.write(activeTabId, cmd + '\r');
      // Small delay between commands
      await new Promise(r => setTimeout(r, 300));
    }

    // Mark as done after a delay
    setTimeout(() => {
      setCells(prev => prev.map((c, i) => i === index ? { ...c, running: false, output: 'Sent to terminal' } : c));
    }, 500);
  }, [cells, activeTabId]);

  const copyCell = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (cells.length === 0) return <div className="p-4 text-[#64748B] text-xs">Loading...</div>;

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-4">
      {cells.map((cell, i) => (
        <div key={i}>
          {cell.type === 'markdown' ? (
            <div
              className="markdown-body prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: marked.parse(cell.content, { async: false }) as string,
              }}
              style={{ color: '#E2E8F0', lineHeight: 1.7 }}
            />
          ) : (
            <div className="relative group rounded-lg border border-[#1E1E2E] overflow-hidden">
              {/* Code header */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1E1E2E]">
                <span className="text-[10px] text-[#64748B] font-mono uppercase">{cell.language}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyCell(cell.content)}
                    className="text-[10px] text-[#64748B] hover:text-[#E2E8F0] bg-[#0A0A0F] px-2 py-0.5 rounded transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => runCell(i)}
                    disabled={cell.running}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                      cell.running
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
                  >
                    {cell.running ? 'Running...' : 'Run'}
                  </button>
                </div>
              </div>

              {/* Code content */}
              <pre className="px-4 py-3 bg-[#0A0A0F] overflow-x-auto">
                <code
                  className="text-xs font-mono text-[#E2E8F0]"
                  dangerouslySetInnerHTML={{
                    __html: hljs.getLanguage(cell.language || 'bash')
                      ? hljs.highlight(cell.content, { language: cell.language || 'bash' }).value
                      : cell.content,
                  }}
                />
              </pre>

              {/* Output indicator */}
              {cell.output && (
                <div className="px-3 py-1 bg-[#0A0A0F] border-t border-[#1E1E2E] text-[10px] text-emerald-400">
                  {cell.output}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <style>{`
        .markdown-body h1 { font-size: 1.5em; font-weight: 700; border-bottom: 1px solid #1E1E2E; padding-bottom: 0.3em; margin-top: 1.5em; color: #F8FAFC; }
        .markdown-body h2 { font-size: 1.3em; font-weight: 600; border-bottom: 1px solid #1E1E2E; padding-bottom: 0.2em; margin-top: 1.3em; color: #F8FAFC; }
        .markdown-body h3 { font-size: 1.1em; font-weight: 600; margin-top: 1em; color: #F8FAFC; }
        .markdown-body p { margin: 0.8em 0; }
        .markdown-body a { color: #3B82F6; text-decoration: underline; }
        .markdown-body code { background: #1E1E2E; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; font-family: 'JetBrains Mono', monospace; }
        .markdown-body pre { display: none; } /* Hide code blocks — we render them as cells */
        .markdown-body ul, .markdown-body ol { padding-left: 1.5em; }
        .markdown-body li { margin: 0.3em 0; }
        .markdown-body blockquote { border-left: 3px solid #3B82F6; padding-left: 1em; margin-left: 0; color: #94A3B8; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .markdown-body th, .markdown-body td { border: 1px solid #1E1E2E; padding: 0.5em 0.8em; text-align: left; }
        .markdown-body th { background: #1E1E2E; font-weight: 600; }
        .markdown-body hr { border: none; border-top: 1px solid #1E1E2E; margin: 1.5em 0; }
      `}</style>
    </div>
  );
};

export default Notebook;
