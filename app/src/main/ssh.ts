import { safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SSHConnection, SSHGroup, SSHConfigHost } from '../shared/ssh-types';

// --- Connection CRUD ---

export function getSSHConnections(store: any): SSHConnection[] {
  return (store.get('sshConnections') as SSHConnection[]) || [];
}

export function saveSSHConnection(store: any, connection: SSHConnection): void {
  const connections = getSSHConnections(store);
  const idx = connections.findIndex(c => c.id === connection.id);
  if (idx >= 0) {
    connections[idx] = connection;
  } else {
    connections.push(connection);
  }
  store.set('sshConnections', connections);
}

export function deleteSSHConnection(store: any, id: string): void {
  const connections = getSSHConnections(store);
  store.set('sshConnections', connections.filter(c => c.id !== id));
  deleteSSHPassword(store, id);
}

export function getSSHGroups(store: any): SSHGroup[] {
  const connections = getSSHConnections(store);
  const grouped = new Map<string, SSHConnection[]>();

  for (const conn of connections) {
    const group = conn.group || '';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(conn);
  }

  const groups: SSHGroup[] = [];
  // Ungrouped first
  if (grouped.has('')) {
    groups.push({ name: '', connections: grouped.get('')!, collapsed: false });
    grouped.delete('');
  }
  // Named groups
  for (const [name, conns] of grouped) {
    groups.push({ name, connections: conns, collapsed: false });
  }
  return groups;
}

// --- Credential Encryption ---

export function saveSSHPassword(store: any, connectionId: string, password: string): void {
  const passwords = (store.get('sshPasswords') as Record<string, string>) || {};
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(password);
    passwords[connectionId] = encrypted.toString('base64');
  } else {
    // Fallback: store with a marker (development only)
    passwords[connectionId] = `plain:${password}`;
  }
  store.set('sshPasswords', passwords);
}

export function getSSHPassword(store: any, connectionId: string): string | null {
  const passwords = (store.get('sshPasswords') as Record<string, string>) || {};
  const stored = passwords[connectionId];
  if (!stored) return null;

  if (stored.startsWith('plain:')) {
    return stored.slice(6);
  }

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      return null;
    }
  }
  return null;
}

export function deleteSSHPassword(store: any, connectionId: string): void {
  const passwords = (store.get('sshPasswords') as Record<string, string>) || {};
  delete passwords[connectionId];
  store.set('sshPasswords', passwords);
}

// --- SSH Config Parser ---

export function parseSSHConfig(configPath?: string): SSHConfigHost[] {
  const filePath = configPath || path.join(os.homedir(), '.ssh', 'config');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const hosts: SSHConfigHost[] = [];
  let current: SSHConfigHost | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const [key, ...rest] = line.split(/\s+/);
    const value = rest.join(' ');

    if (key.toLowerCase() === 'host') {
      if (current && current.host !== '*') hosts.push(current);
      current = { host: value };
    } else if (current) {
      switch (key.toLowerCase()) {
        case 'hostname': current.hostname = value; break;
        case 'user': current.user = value; break;
        case 'port': current.port = parseInt(value, 10); break;
        case 'identityfile':
          current.identityFile = value.replace(/^~/, os.homedir());
          break;
      }
    }
  }
  if (current && current.host !== '*') hosts.push(current);
  return hosts;
}

export function importFromSSHConfig(store: any, configPath?: string): SSHConnection[] {
  const hosts = parseSSHConfig(configPath);
  const existing = getSSHConnections(store);
  const imported: SSHConnection[] = [];

  for (const h of hosts) {
    const hostname = h.hostname || h.host;
    const username = h.user || os.userInfo().username;
    // Skip if already exists
    if (existing.some(c => c.host === hostname && c.username === username)) continue;

    const conn: SSHConnection = {
      id: `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: h.host,
      host: hostname,
      port: h.port || 22,
      username,
      authMethod: h.identityFile ? { type: 'key', keyPath: h.identityFile } : { type: 'agent' },
      group: 'Imported',
      colorTag: '#3B82F6',
      createdAt: new Date().toISOString(),
    };
    imported.push(conn);
    existing.push(conn);
  }

  store.set('sshConnections', existing);
  return imported;
}

// --- SSH Command Builder ---

export function buildSSHArgs(conn: SSHConnection, password?: string): string[] {
  const args: string[] = [];

  // Key auth
  if (conn.authMethod.type === 'key') {
    args.push('-i', conn.authMethod.keyPath);
  }

  // Port
  if (conn.port && conn.port !== 22) {
    args.push('-p', String(conn.port));
  }

  // Accept new host keys automatically
  args.push('-o', 'StrictHostKeyChecking=accept-new');

  // Keep alive
  args.push('-o', 'ServerAliveInterval=30');
  args.push('-o', 'ServerAliveCountMax=3');

  // Target
  args.push(`${conn.username}@${conn.host}`);

  return args;
}

// --- Import/Export ---

export function exportSSHConnections(store: any): string {
  const connections = getSSHConnections(store);
  // Strip passwords — only export connection metadata
  return JSON.stringify(connections, null, 2);
}

export function importSSHConnections(store: any, json: string): number {
  const imported: SSHConnection[] = JSON.parse(json);
  const existing = getSSHConnections(store);
  let count = 0;

  for (const conn of imported) {
    if (!existing.some(c => c.id === conn.id)) {
      conn.id = `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      existing.push(conn);
      count++;
    }
  }

  store.set('sshConnections', existing);
  return count;
}
