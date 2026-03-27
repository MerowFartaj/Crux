import React, { useState, useEffect } from 'react';

const LEFT = [
  { keys: '\u2318T', desc: 'New tab' },
  { keys: '\u2318W', desc: 'Close tab' },
  { keys: '\u2318D', desc: 'Split pane' },
  { keys: '\u2318K', desc: 'Command palette' },
  { keys: '\u2318F', desc: 'Search output' },
  { keys: '\u2318,', desc: 'Settings' },
];

const RIGHT = [
  { keys: '\u2318\u21E7S', desc: 'SSH Manager' },
  { keys: '\u2318\u21E7H', desc: 'History' },
  { keys: '\u2318\u21E7P', desc: 'System Monitor' },
  { keys: 'Ctrl+`', desc: 'Dropdown toggle' },
  { keys: '/ai', desc: 'AI assistant' },
  { keys: '/preview', desc: 'File preview' },
];

const ShortcutsStep: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const total = LEFT.length + RIGHT.length;

  useEffect(() => {
    if (visibleCount < total) {
      const timer = setTimeout(() => setVisibleCount(c => c + 1), 60);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, total]);

  const renderRow = (s: { keys: string; desc: string }, globalIndex: number) => (
    <div
      key={s.keys}
      className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E]/50 transition-all"
      style={{
        opacity: globalIndex < visibleCount ? 1 : 0,
        transform: globalIndex < visibleCount ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'all 250ms ease-out',
      }}
    >
      <kbd className="text-xs font-mono bg-[#1E1E2E] text-[#E2E8F0] px-2.5 py-1 rounded-md border border-[#2A2A3E] min-w-[52px] text-center shadow-sm">
        {s.keys}
      </kbd>
      <span className="text-xs text-[#94A3B8]">{s.desc}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <h2
        className="text-xl font-semibold text-[#F8FAFC] mb-2"
        style={{ animation: 'scFade 500ms ease-out both' }}
      >
        Your essential shortcuts
      </h2>
      <p
        className="text-[#64748B] text-xs mb-8"
        style={{ animation: 'scFade 500ms ease-out 100ms both' }}
      >
        Master these and you'll fly through your workflow.
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-0 w-full max-w-lg">
        <div>
          <div
            className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mb-3"
            style={{ animation: 'scFade 400ms ease-out 200ms both' }}
          >
            Terminal
          </div>
          {LEFT.map((s, i) => renderRow(s, i))}
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mb-3"
            style={{ animation: 'scFade 400ms ease-out 200ms both' }}
          >
            Features
          </div>
          {RIGHT.map((s, i) => renderRow(s, LEFT.length + i))}
        </div>
      </div>

      <p
        className="text-[10px] text-[#64748B] mt-6"
        style={{
          opacity: visibleCount >= total ? 1 : 0,
          transition: 'opacity 400ms ease-out',
        }}
      >
        Type /shortcuts anytime to see this again.
      </p>

      <style>{`
        @keyframes scFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ShortcutsStep;
