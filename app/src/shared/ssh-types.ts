export type SSHAuthMethod =
  | { type: 'password' }
  | { type: 'key'; keyPath: string }
  | { type: 'agent' };

export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: SSHAuthMethod;
  group: string;
  colorTag: string;
  startupCommand?: string;
  createdAt: string;
  lastConnectedAt?: string;
}

export interface SSHGroup {
  name: string;
  connections: SSHConnection[];
  collapsed: boolean;
}

export interface SSHConfigHost {
  host: string;
  hostname?: string;
  user?: string;
  port?: number;
  identityFile?: string;
}

export interface SSHQuickConnect {
  username?: string;
  host: string;
  port?: number;
}

export function parseQuickConnect(input: string): SSHQuickConnect | null {
  const match = input.match(/^(?:(.+)@)?([^:]+)(?::(\d+))?$/);
  if (!match) return null;
  return {
    username: match[1] || undefined,
    host: match[2],
    port: match[3] ? parseInt(match[3], 10) : undefined,
  };
}
