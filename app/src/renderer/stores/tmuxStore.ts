import { create } from 'zustand';
import { TmuxSession, TmuxState } from '../../shared/tmux-types';

interface TmuxStoreState {
  // State
  tmuxAvailable: boolean;
  tmuxEnabled: boolean;
  tmuxConnected: boolean;
  sessionName: string | null;
  sessions: TmuxSession[];

  // Actions
  setTmuxAvailable: (available: boolean) => void;
  setTmuxEnabled: (enabled: boolean) => void;
  setTmuxState: (state: TmuxState) => void;
  setSessions: (sessions: TmuxSession[]) => void;

  // Async actions
  checkAvailability: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  startSession: (name?: string) => Promise<void>;
  attachSession: (name: string) => Promise<void>;
  detachSession: () => Promise<void>;
}

export const useTmuxStore = create<TmuxStoreState>((set, get) => ({
  tmuxAvailable: false,
  tmuxEnabled: false,
  tmuxConnected: false,
  sessionName: null,
  sessions: [],

  setTmuxAvailable: (available) => set({ tmuxAvailable: available }),
  setTmuxEnabled: (enabled) => set({ tmuxEnabled: enabled }),

  setTmuxState: (state) => set({
    tmuxEnabled: state.enabled,
    tmuxConnected: state.connected,
    sessionName: state.sessionName,
    sessions: state.sessions,
  }),

  setSessions: (sessions) => set({ sessions }),

  checkAvailability: async () => {
    try {
      const available = await window.electronAPI.tmux.isInstalled();
      set({ tmuxAvailable: available });
    } catch {
      set({ tmuxAvailable: false });
    }
  },

  refreshSessions: async () => {
    try {
      const sessions = await window.electronAPI.tmux.listSessions();
      set({ sessions });
    } catch {
      set({ sessions: [] });
    }
  },

  startSession: async (name?: string) => {
    await window.electronAPI.tmux.start(name);
  },

  attachSession: async (name: string) => {
    await window.electronAPI.tmux.attach(name);
  },

  detachSession: async () => {
    await window.electronAPI.tmux.detach();
    set({ tmuxConnected: false, sessionName: null });
  },
}));
