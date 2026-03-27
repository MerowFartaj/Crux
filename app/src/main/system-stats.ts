import si from 'systeminformation';
import { BrowserWindow } from 'electron';
import { SystemStats } from '../shared/types';

let monitorInterval: NodeJS.Timeout | null = null;

export async function getSystemStats(): Promise<SystemStats> {
  const [cpu, mem, network, disk, processes] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.networkStats(),
    si.fsSize(),
    si.processes(),
  ]);

  const primaryNet = network[0] || { rx_sec: 0, tx_sec: 0 };
  const primaryDisk = disk[0] || { used: 0, size: 1 };

  return {
    cpu: Math.round(cpu.currentLoad * 10) / 10,
    memory: {
      used: mem.used,
      total: mem.total,
      percent: Math.round((mem.used / mem.total) * 1000) / 10,
    },
    network: {
      rx_sec: primaryNet.rx_sec || 0,
      tx_sec: primaryNet.tx_sec || 0,
    },
    disk: {
      used: primaryDisk.used,
      total: primaryDisk.size,
      percent: Math.round((primaryDisk.used / primaryDisk.size) * 1000) / 10,
    },
    processes: processes.all,
  };
}

export function startMonitoring(window: BrowserWindow, intervalMs: number = 2000): void {
  stopMonitoring();
  monitorInterval = setInterval(async () => {
    try {
      const stats = await getSystemStats();
      if (!window.isDestroyed()) {
        window.webContents.send('system:stats', stats);
      }
    } catch (e) {
      // Silently ignore monitoring errors
    }
  }, intervalMs);
}

export function stopMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
