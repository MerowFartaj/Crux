export interface TmuxSession {
  id: string;        // "$0"
  name: string;
  windows: number;
  attached: boolean;
  created: string;
}

export interface TmuxPaneInfo {
  paneId: string;    // "%0"
  windowId: string;  // "@0"
  tabId: string;     // crux tab ID
  cols: number;
  rows: number;
  active: boolean;
}

export interface TmuxWindowInfo {
  windowId: string;  // "@0"
  name: string;
  panes: TmuxPaneInfo[];
  active: boolean;
}

export type TmuxNotification =
  | { type: 'output'; paneId: string; data: string }
  | { type: 'window-add'; windowId: string }
  | { type: 'window-close'; windowId: string }
  | { type: 'window-renamed'; windowId: string; name: string }
  | { type: 'layout-change'; windowId: string; layout: string }
  | { type: 'session-changed'; sessionId: string; name: string }
  | { type: 'sessions-changed' }
  | { type: 'pane-mode-changed'; paneId: string }
  | { type: 'exit'; reason?: string }
  | { type: 'begin'; time: string; num: number }
  | { type: 'end'; time: string; num: number; exitCode: number };

export interface TmuxState {
  enabled: boolean;
  connected: boolean;
  sessionName: string | null;
  sessions: TmuxSession[];
}
