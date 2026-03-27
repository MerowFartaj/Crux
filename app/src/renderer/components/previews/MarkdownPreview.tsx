import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface Props { filePath: string; }

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
} as any);

const MarkdownPreview: React.FC<Props> = ({ filePath }) => {
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const content = await window.electronAPI.file.read(filePath);
        const rendered = await marked.parse(content);
        setHtml(rendered);
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      }
    })();
  }, [filePath]);

  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (!html) return <div className="p-4 text-[#64748B] text-xs">Loading...</div>;

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div
        className="markdown-body prose prose-invert prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          color: '#E2E8F0',
          lineHeight: 1.7,
        }}
      />
      <style>{`
        .markdown-body h1 { font-size: 1.5em; font-weight: 700; border-bottom: 1px solid #1E1E2E; padding-bottom: 0.3em; margin-top: 1.5em; color: #F8FAFC; }
        .markdown-body h2 { font-size: 1.3em; font-weight: 600; border-bottom: 1px solid #1E1E2E; padding-bottom: 0.2em; margin-top: 1.3em; color: #F8FAFC; }
        .markdown-body h3 { font-size: 1.1em; font-weight: 600; margin-top: 1em; color: #F8FAFC; }
        .markdown-body p { margin: 0.8em 0; }
        .markdown-body a { color: #3B82F6; text-decoration: underline; }
        .markdown-body code { background: #1E1E2E; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; font-family: 'JetBrains Mono', monospace; }
        .markdown-body pre { background: #0A0A0F; border: 1px solid #1E1E2E; border-radius: 8px; padding: 1em; overflow-x: auto; margin: 1em 0; }
        .markdown-body pre code { background: none; padding: 0; }
        .markdown-body blockquote { border-left: 3px solid #3B82F6; padding-left: 1em; margin-left: 0; color: #94A3B8; }
        .markdown-body ul, .markdown-body ol { padding-left: 1.5em; }
        .markdown-body li { margin: 0.3em 0; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .markdown-body th, .markdown-body td { border: 1px solid #1E1E2E; padding: 0.5em 0.8em; text-align: left; }
        .markdown-body th { background: #1E1E2E; font-weight: 600; }
        .markdown-body tr:nth-child(even) { background: #0A0A0F; }
        .markdown-body img { max-width: 100%; border-radius: 4px; }
        .markdown-body hr { border: none; border-top: 1px solid #1E1E2E; margin: 1.5em 0; }
      `}</style>
    </div>
  );
};

export default MarkdownPreview;
