import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { getPreviewType, getFileIcon, isUrl } from '../utils/fileType';
import ImagePreview from './previews/ImagePreview';
import CodePreview from './previews/CodePreview';
import MarkdownPreview from './previews/MarkdownPreview';
import JsonPreview from './previews/JsonPreview';
import CsvPreview from './previews/CsvPreview';
import TextPreview from './previews/TextPreview';
import Notebook from './Notebook';
import WebPreview from './previews/WebPreview';

const PreviewPanel: React.FC = () => {
  const {
    showPreview, setShowPreview,
    previewFiles, previewActiveFile,
    openPreview, closePreviewTab,
  } = useAppStore();

  const [width, setWidth] = useState(400);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fileInfo, setFileInfo] = useState<{ size: number } | null>(null);

  // Load file info for active file
  useEffect(() => {
    if (!previewActiveFile) { setFileInfo(null); return; }
    if (isUrl(previewActiveFile)) { setFileInfo(null); return; }
    window.electronAPI.file.stat(previewActiveFile)
      .then(info => setFileInfo({ size: info.size }))
      .catch(() => setFileInfo(null));
  }, [previewActiveFile]);

  // Resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const windowWidth = window.innerWidth;
      const newWidth = windowWidth - e.clientX;
      setWidth(Math.max(300, Math.min(newWidth, windowWidth * 0.6)));
    };

    const handleUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreview) {
        setShowPreview(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPreview]);

  if (!showPreview || previewFiles.length === 0) return null;

  const activeFile = previewActiveFile || previewFiles[0]?.path;
  const previewType = activeFile ? (isUrl(activeFile) ? 'web' as const : getPreviewType(activeFile)) : 'text';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-shrink-0 h-full"
      style={{
        width,
        animation: 'slideInRight 200ms ease-out',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize bg-[#1E1E2E] hover:bg-[#3B82F6] transition-colors flex-shrink-0"
      />

      {/* Panel content */}
      <div className="flex-1 flex flex-col bg-[#0A0A0F] border-l border-[#1E1E2E] overflow-hidden">
        {/* Header with tabs */}
        <div className="flex items-center border-b border-[#1E1E2E] bg-[#0A0A0F] flex-shrink-0">
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-none">
            {previewFiles.map(file => (
              <div
                key={file.path}
                onClick={() => openPreview(file.path)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-[#1E1E2E] whitespace-nowrap group ${
                  file.path === activeFile
                    ? 'bg-[#1E1E2E]/50 text-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E1E2E]/30'
                }`}
              >
                <span>{getFileIcon(file.path)}</span>
                <span>{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); closePreviewTab(file.path); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-[#64748B] hover:text-[#EF4444] transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="px-3 py-2 text-[#64748B] hover:text-[#EF4444] text-sm flex-shrink-0"
          >
            x
          </button>
        </div>

        {/* File info bar */}
        {activeFile && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#1E1E2E] text-[10px] text-[#64748B] flex-shrink-0">
            <span className="font-mono truncate flex-1">{activeFile}</span>
            {fileInfo && <span>{formatSize(fileInfo.size)}</span>}
            <span className="uppercase">{previewType}</span>
          </div>
        )}

        {/* Preview content */}
        <div className="flex-1 overflow-hidden relative">
          {activeFile && previewType === 'web' && <WebPreview url={activeFile} />}
          {activeFile && previewType === 'image' && <ImagePreview filePath={activeFile} />}
          {activeFile && previewType === 'code' && <CodePreview filePath={activeFile} />}
          {activeFile && previewType === 'markdown' && <Notebook filePath={activeFile} />}
          {activeFile && previewType === 'json' && <JsonPreview filePath={activeFile} />}
          {activeFile && previewType === 'csv' && <CsvPreview filePath={activeFile} />}
          {activeFile && (previewType === 'text' || previewType === 'pdf' || previewType === 'binary') && (
            <TextPreview filePath={activeFile} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default PreviewPanel;
