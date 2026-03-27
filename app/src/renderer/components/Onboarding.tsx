import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import WelcomeStep from './onboarding/WelcomeStep';
import ShellStep from './onboarding/ShellStep';
import AISetupStep from './onboarding/AISetupStep';
import FeatureTourStep from './onboarding/FeatureTourStep';
import ShortcutsStep from './onboarding/ShortcutsStep';
import ReadyStep from './onboarding/ReadyStep';

const TOTAL_STEPS = 6;

const Onboarding: React.FC = () => {
  const { showOnboarding, setShowOnboarding, settings, updateSettings } = useAppStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  const complete = useCallback(() => {
    window.electronAPI.store.set('onboardingComplete', true);
    setShowOnboarding(false);
  }, [setShowOnboarding]);

  const next = useCallback(() => {
    setDirection('left');
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setDirection('right');
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const skipAll = useCallback(() => {
    setStep(TOTAL_STEPS - 1);
    setDirection('left');
  }, []);

  const handleShellSelect = useCallback((shell: string) => {
    updateSettings({ shell });
    window.electronAPI.store.set('shell', shell);
  }, [updateSettings]);

  const handleAIKeys = useCallback((provider: string, key: string) => {
    if (provider === 'claude') {
      updateSettings({ aiProvider: 'claude' as any, anthropicApiKey: key });
    } else {
      updateSettings({ aiProvider: 'openai' as any, openaiApiKey: key });
    }
  }, [updateSettings]);

  // Escape to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOnboarding) complete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showOnboarding, complete]);

  if (!showOnboarding) return null;

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep onNext={next} onSkipAll={skipAll} />;
      case 1: return <ShellStep currentShell={settings.shell} onSelect={handleShellSelect} />;
      case 2: return <AISetupStep onSaveKeys={handleAIKeys} />;
      case 3: return <FeatureTourStep />;
      case 4: return <ShortcutsStep />;
      case 5: return <ReadyStep onLaunch={complete} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0F]">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl">
        <div
          key={step}
          className="bg-[#12121A]/80 backdrop-blur-xl border border-[#1E1E2E] rounded-2xl p-10 shadow-2xl"
          style={{
            animation: `slideIn${direction === 'left' ? 'Left' : 'Right'} 250ms ease-out`,
          }}
        >
          {renderStep()}
        </div>

        {/* Navigation */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <button
              onClick={back}
              className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
            >
              Back
            </button>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? 'bg-blue-500' : i < step ? 'bg-blue-500/40' : 'bg-[#2A2A3E]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              {step === TOTAL_STEPS - 2 ? 'Finish' : 'Next'}
            </button>
          </div>
        )}

        {/* Minimal progress dots on Welcome and Ready steps */}
        {(step === 0 || step === TOTAL_STEPS - 1) && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-blue-500' : i < step ? 'bg-blue-500/40' : 'bg-[#2A2A3E]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Escape hint */}
      <div className="absolute bottom-6 text-[10px] text-[#4A4A5E]">
        Press Escape to skip
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
