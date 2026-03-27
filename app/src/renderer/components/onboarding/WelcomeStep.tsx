import React from 'react';

interface Props {
  onNext: () => void;
  onSkipAll: () => void;
}

const WelcomeStep: React.FC<Props> = ({ onNext, onSkipAll }) => (
  <div className="flex flex-col items-center text-center">
    {/* Animated logo */}
    <div
      className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#1E1E2E] to-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center text-5xl mb-8 shadow-2xl"
      style={{
        animation: 'logoEntrance 800ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <span className="select-none" style={{ filter: 'drop-shadow(0 0 16px rgba(59,130,246,0.4))' }}>
        {'>_'}
      </span>
    </div>

    <h1
      className="text-3xl font-bold text-[#F8FAFC] mb-3 tracking-tight"
      style={{ animation: 'welcomeFade 600ms ease-out 200ms both' }}
    >
      Welcome to CRUX
    </h1>

    <p
      className="text-[#94A3B8] text-sm leading-relaxed max-w-md mb-4"
      style={{ animation: 'welcomeFade 600ms ease-out 350ms both' }}
    >
      A modern terminal built for developers who want power without complexity.
    </p>

    <p
      className="text-[#64748B] text-xs mb-10"
      style={{ animation: 'welcomeFade 600ms ease-out 500ms both' }}
    >
      Let's get you set up in 60 seconds.
    </p>

    <button
      onClick={onNext}
      className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
      style={{ animation: 'welcomeFade 600ms ease-out 650ms both' }}
    >
      Get Started
    </button>

    <button
      onClick={onSkipAll}
      className="mt-6 text-[#64748B] hover:text-[#94A3B8] text-xs transition-colors"
      style={{ animation: 'welcomeFade 600ms ease-out 800ms both' }}
    >
      Skip setup
    </button>

    <style>{`
      @keyframes logoEntrance {
        0% { opacity: 0; transform: scale(0.3) rotate(-12deg); }
        60% { opacity: 1; transform: scale(1.08) rotate(2deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }
      @keyframes welcomeFade {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

export default WelcomeStep;
