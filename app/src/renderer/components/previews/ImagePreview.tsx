import React, { useEffect, useState, useRef } from 'react';

interface Props { filePath: string; }

const ImagePreview: React.FC<Props> = ({ filePath }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const base64 = await window.electronAPI.file.readBinary(filePath);
        const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'svg' ? 'image/svg+xml'
          : ext === 'gif' ? 'image/gif'
          : ext === 'webp' ? 'image/webp'
          : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : 'image/png';
        setSrc(`data:${mime};base64,${base64}`);
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    })();
  }, [filePath]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.1), 10));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setDragging(false);

  if (!src) return <div className="flex items-center justify-center h-full text-[#64748B] text-xs">Loading...</div>;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center bg-[#050508] cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src={src}
        alt={filePath}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
      <div className="absolute bottom-2 right-2 text-[10px] text-[#64748B] bg-[#0A0A0F]/80 px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default ImagePreview;
