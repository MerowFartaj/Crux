import React, { useEffect, useState } from 'react';

interface Props {
  currentShell: string;
  onSelect: (shell: string) => void;
}

const SHELLS = [
  { path: '/bin/zsh', name: 'zsh', desc: 'Default on macOS. Fast, extensible, great autocomplete.', badge: 'recommended' },
  { path: '/bin/bash', name: 'bash', desc: 'The classic. Universal, reliable, widely documented.' },
  { path: '/usr/local/bin/fish', name: 'fish', desc: 'User-friendly with syntax highlighting out of the box.' },
];

const ShellStep: React.FC<Props> = ({ currentShell, onSelect }) => {
  const [selected, setSelected] = useState(currentShell || '/bin/zsh');
  const [available, setAvailable] = useState<Set<string>>(new Set(['/bin/zsh', '/bin/bash']));

  useEffect(() => {
    // Check if fish is installed
    try {
      window.electronAPI.pty.create('__fish_check').then(() => {
        setAvailable(prev => new Set(prev).add('/usr/local/bin/fish'));
        window.electronAPI.pty.destroy('__fish_check');
      }).catch(() => {});
    } catch {}
  }, []);

  const handleSelect = (path: string) => {
    setSelected(path);
    onSelect(path);
  };

  return (
    <div className="flex flex-col items-center">
      <h2
        className="text-xl font-semibold text-[#F8FAFC] mb-2"
        style={{ animation: 'stepFade 500ms ease-out both' }}
      >
        Which shell do you use?
      </h2>
      <p
        className="text-[#64748B] text-xs mb-8"
        style={{ animation: 'stepFade 500ms ease-out 100ms both' }}
      >
        You can change this anytime in Settings.
      </p>

      <div className="w-full max-w-md space-y-3">
        {SHELLS.map((sh, i) => {
          const isAvailable = available.has(sh.path);
          const isSelected = selected === sh.path;
          return (
            <button
              key={sh.path}
              onClick={() => isAvailable && handleSelect(sh.path)}
              disabled={!isAvailable}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : isAvailable
                    ? 'border-[#1E1E2E] hover:border-[#3E3E4E] bg-[#0A0A0F]'
                    : 'border-[#1E1E2E] bg-[#0A0A0F] opacity-40 cursor-not-allowed'
              }`}
              style={{
                animation: `shellCardIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${200 + i * 100}ms both`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-[#E2E8F0]">
                  {sh.name === 'zsh' ? 'Z' : sh.name === 'bash' ? 'B' : 'F'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#E2E8F0]">{sh.name}</span>
                    {sh.badge && (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                        {sh.badge}
                      </span>
                    )}
                    {!isAvailable && (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1E1E2E] text-[#64748B]">
                        not installed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{sh.desc}</p>
                </div>
                {isSelected && (
                  <span className="text-blue-400 text-lg" style={{ animation: 'checkPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    &#10003;
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes stepFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shellCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes checkPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ShellStep;
