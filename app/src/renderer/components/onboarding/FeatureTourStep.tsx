import React, { useState, useEffect } from 'react';

const FEATURES = [
  {
    icon: '\u2728',
    title: 'AI Commands',
    desc: '/ai, /fix, /how, /explain — AI lives in your terminal, not a sidebar',
    example: '/how find large files \u2192 find . -size +100M',
    color: '#3B82F6',
  },
  {
    icon: '\uD83D\uDCC4',
    title: 'File Preview',
    desc: '/preview any file — JSON trees, syntax highlighting, images, markdown',
    example: '/preview package.json \u2192 collapsible JSON tree',
    color: '#8B5CF6',
  },
  {
    icon: '\u26A1',
    title: 'Dropdown Mode',
    desc: 'Ctrl+` from any app — CRUX drops down instantly',
    example: 'Enable in Settings \u2192 Dropdown Terminal',
    color: '#EAB308',
  },
  {
    icon: '\uD83D\uDD12',
    title: 'SSH Manager',
    desc: 'Save and connect to servers with encrypted credentials',
    example: 'Cmd+Shift+S or /ssh',
    color: '#22C55E',
  },
  {
    icon: '\uD83E\uDDE0',
    title: 'Smart Terminal',
    desc: 'Hover tooltips, syntax highlighting, context-aware autocomplete',
    example: 'Commands light up as you type. Hover to learn.',
    color: '#EC4899',
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'Command Palette',
    desc: 'Search your history, translate commands with AI',
    example: 'Cmd+K to open',
    color: '#06B6D4',
  },
];

const FeatureTourStep: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visibleCount < FEATURES.length) {
      const timer = setTimeout(() => setVisibleCount(c => c + 1), 120);
      return () => clearTimeout(timer);
    }
  }, [visibleCount]);

  return (
    <div className="flex flex-col items-center">
      <h2
        className="text-xl font-semibold text-[#F8FAFC] mb-2"
        style={{ animation: 'tourFade 500ms ease-out both' }}
      >
        What makes CRUX different
      </h2>
      <p
        className="text-[#64748B] text-xs mb-6"
        style={{ animation: 'tourFade 500ms ease-out 100ms both' }}
      >
        Power tools built into your terminal.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="px-4 py-3.5 rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] transition-all duration-200 cursor-default"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount
                ? hoveredIndex === i ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)'
                : 'translateY(12px) scale(0.95)',
              borderColor: hoveredIndex === i ? f.color + '60' : undefined,
              boxShadow: hoveredIndex === i ? `0 4px 20px ${f.color}15` : undefined,
              transition: 'all 300ms cubic-bezier(0.34, 1, 0.64, 1)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-lg"
                style={{
                  transform: hoveredIndex === i ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 200ms ease-out',
                }}
              >
                {f.icon}
              </span>
              <span className="text-xs font-semibold text-[#E2E8F0]">{f.title}</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] leading-relaxed">{f.desc}</p>
            <p
              className="text-[10px] mt-1.5 font-mono overflow-hidden transition-all duration-200"
              style={{
                color: f.color,
                maxHeight: hoveredIndex === i ? 20 : 14,
                opacity: hoveredIndex === i ? 1 : 0.5,
              }}
            >
              {f.example}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tourFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FeatureTourStep;
