import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  children: [React.ReactNode, React.ReactNode];
  initialSplit?: number; // 0-100 percentage for first pane
}

const SplitPane: React.FC<SplitPaneProps> = ({
  direction,
  children,
  initialSplit = 50,
}) => {
  const [splitPercent, setSplitPercent] = useState(initialSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let percent: number;
      if (direction === 'vertical') {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      }

      // Clamp between 15% and 85%
      percent = Math.max(15, Math.min(85, percent));
      setSplitPercent(percent);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction]);

  const isVertical = direction === 'vertical';

  return (
    <div
      ref={containerRef}
      className="flex w-full h-full"
      style={{ flexDirection: isVertical ? 'row' : 'column' }}
    >
      {/* First pane */}
      <div
        style={{
          [isVertical ? 'width' : 'height']: `${splitPercent}%`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children[0]}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="split-divider flex-shrink-0 relative group"
        style={{
          [isVertical ? 'width' : 'height']: '4px',
          cursor: isVertical ? 'col-resize' : 'row-resize',
          background: '#1E1E2E',
        }}
      >
        {/* Hover highlight */}
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            [isVertical ? 'width' : 'height']: '4px',
            [isVertical ? 'height' : 'width']: '100%',
            background: '#3B82F6',
            top: 0,
            left: 0,
          }}
        />
      </div>

      {/* Second pane */}
      <div
        style={{
          [isVertical ? 'width' : 'height']: `${100 - splitPercent}%`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};

export default SplitPane;
