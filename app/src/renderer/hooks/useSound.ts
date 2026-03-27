import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

type SoundType = 'success' | 'error' | 'notification' | 'click';

// Generate sounds programmatically using Web Audio API
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine', fadeOut = true) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume * 0.15, audioContext.currentTime);
  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playSuccessSound(volume: number) {
  playTone(523.25, 0.1, volume); // C5
  setTimeout(() => playTone(659.25, 0.15, volume), 80); // E5
}

function playErrorSound(volume: number) {
  playTone(196, 0.2, volume, 'triangle'); // G3 low buzz
  setTimeout(() => playTone(185, 0.15, volume, 'triangle'), 100);
}

function playNotificationSound(volume: number) {
  playTone(880, 0.08, volume); // A5
  setTimeout(() => playTone(1108.73, 0.08, volume), 100); // C#6
  setTimeout(() => playTone(1318.51, 0.15, volume), 200); // E6
}

function playClickSound(volume: number) {
  playTone(1000, 0.03, volume, 'square');
}

const soundPlayers: Record<SoundType, (volume: number) => void> = {
  success: playSuccessSound,
  error: playErrorSound,
  notification: playNotificationSound,
  click: playClickSound,
};

export function useSound() {
  const { settings } = useAppStore();

  const play = useCallback(
    (type: SoundType) => {
      if (settings.soundMuted) return;

      // Resume audio context if suspended (browser policy)
      if (audioContext?.state === 'suspended') {
        audioContext.resume();
      }

      const player = soundPlayers[type];
      if (player) {
        player(settings.soundVolume);
      }
    },
    [settings.soundMuted, settings.soundVolume]
  );

  return { play };
}
