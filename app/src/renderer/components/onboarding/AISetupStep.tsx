import React, { useState } from 'react';

interface Props {
  onSaveKeys: (provider: string, key: string) => void;
}

const AISetupStep: React.FC<Props> = ({ onSaveKeys }) => {
  const [provider, setProvider] = useState<'claude' | 'openai' | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'error'>('idle');

  const handleSave = async () => {
    if (!apiKey || !provider) return;
    setStatus('testing');
    try {
      if (provider === 'claude') {
        await window.electronAPI.store.set('anthropicApiKey', apiKey);
        await window.electronAPI.store.set('aiProvider', 'claude');
      } else {
        await window.electronAPI.store.set('openaiApiKey', apiKey);
        await window.electronAPI.store.set('aiProvider', 'openai');
      }
      onSaveKeys(provider, apiKey);
      setStatus('valid');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div style={{ animation: 'aiFade 500ms ease-out both' }}>
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2 text-center">Supercharge with AI</h2>
        <p className="text-[#64748B] text-xs mb-8 text-center max-w-md">
          CRUX can explain errors, suggest commands, and generate commit messages.
          Bring your own API key — pay only for what you use.
        </p>
      </div>

      {/* Provider cards */}
      <div className="flex gap-3 mb-6 w-full max-w-md">
        {(['claude', 'openai'] as const).map((p, i) => (
          <button
            key={p}
            onClick={() => { setProvider(p); setApiKey(''); setStatus('idle'); }}
            className={`flex-1 px-4 py-4 rounded-xl border-2 transition-all text-left group ${
              provider === p
                ? p === 'claude' ? 'border-[#D97706] bg-[#D97706]/10 shadow-lg shadow-[#D97706]/10' : 'border-[#22C55E] bg-[#22C55E]/10 shadow-lg shadow-[#22C55E]/10'
                : 'border-[#1E1E2E] hover:border-[#3E3E4E] bg-[#0A0A0F]'
            }`}
            style={{ animation: `aiCardIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${200 + i * 120}ms both` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{p === 'claude' ? '\uD83E\uDDE0' : '\u26A1'}</span>
              <div>
                <div className="font-semibold text-sm text-[#E2E8F0]">{p === 'claude' ? 'Claude' : 'GPT'}</div>
                <div className="text-[10px] text-[#94A3B8]">{p === 'claude' ? 'Anthropic' : 'OpenAI'}</div>
              </div>
            </div>
            <div className="text-[10px] text-[#64748B] mt-2">
              From {p === 'claude' ? '~$0.004' : '~$0.001'}/query
            </div>
          </button>
        ))}
      </div>

      {/* API key input with animation */}
      {provider && (
        <div
          className="w-full max-w-md space-y-3"
          style={{ animation: 'keyInputSlide 300ms ease-out both' }}
        >
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setStatus('idle'); }}
              placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
              className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-xs text-[#E2E8F0] placeholder-[#4A4A5E] outline-none focus:border-blue-500/50 font-mono transition-colors"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!apiKey || status === 'testing'}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                status === 'valid'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : status === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-40'
              }`}
            >
              {status === 'testing' ? (
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>{'\u21BB'}</span>
              ) : status === 'valid' ? (
                <span style={{ animation: 'checkPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>&#10003; Saved</span>
              ) : status === 'error' ? 'Error' : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-[#64748B]">
            Estimated cost: less than $0.01 per query with mini models.
          </p>
        </div>
      )}

      <p
        className="text-[10px] text-[#64748B] mt-6"
        style={{ animation: 'aiFade 500ms ease-out 500ms both' }}
      >
        You can always add or change this later in Settings (Cmd+,)
      </p>

      <style>{`
        @keyframes aiFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes keyInputSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AISetupStep;
