import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1048576) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
};

// Ring chart component
const RingChart: React.FC<{ percent: number; size?: number; strokeWidth?: number; color?: string }> = ({
  percent,
  size = 80,
  strokeWidth = 6,
  color = '#3B82F6',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1E1E2E"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

// Sparkline component
const Sparkline: React.FC<{ data: number[]; color?: string; height?: number; width?: number }> = ({
  data,
  color = '#06B6D4',
  height = 40,
  width = 180,
}) => {
  if (data.length < 2) return <div style={{ width, height }} />;

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4);
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SystemPulse: React.FC = () => {
  const { systemStats, showSystemPulse } = useAppStore();
  const [rxHistory, setRxHistory] = useState<number[]>([]);
  const [txHistory, setTxHistory] = useState<number[]>([]);

  useEffect(() => {
    window.electronAPI.system.startMonitoring(2000);
    const unsub = window.electronAPI.system.onStats((stats) => {
      useAppStore.getState().setSystemStats(stats);
    });
    return () => {
      window.electronAPI.system.stopMonitoring();
      unsub();
    };
  }, []);

  useEffect(() => {
    if (systemStats) {
      setRxHistory((prev) => [...prev.slice(-29), systemStats.network.rx_sec]);
      setTxHistory((prev) => [...prev.slice(-29), systemStats.network.tx_sec]);
    }
  }, [systemStats]);

  if (!showSystemPulse) return null;

  const stats = systemStats;

  return (
    <div className="glass-sidebar w-64 h-full border-l border-[#1E1E2E] flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-[#1E1E2E]">
        <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          System Pulse
        </h2>
      </div>

      {!stats ? (
        <div className="flex items-center justify-center flex-1 text-[#64748B] text-xs">
          Initializing...
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-4">
          {/* CPU */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <RingChart percent={stats.cpu} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{stats.cpu.toFixed(1)}%</span>
              </div>
            </div>
            <span className="text-xs text-[#64748B] uppercase tracking-wider">CPU</span>
          </div>

          {/* Memory */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Memory</span>
              <span>{stats.memory.percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${stats.memory.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>{formatBytes(stats.memory.used)}</span>
              <span>{formatBytes(stats.memory.total)}</span>
            </div>
          </div>

          {/* Network */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#64748B] uppercase tracking-wider">Network</span>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-cyan-400">↓ {formatSpeed(stats.network.rx_sec)}</span>
                <span className="text-blue-400">↑ {formatSpeed(stats.network.tx_sec)}</span>
              </div>
              <Sparkline data={rxHistory} color="#06B6D4" />
              <Sparkline data={txHistory} color="#3B82F6" height={30} />
            </div>
          </div>

          {/* Disk */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Disk</span>
              <span>{stats.disk.percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${stats.disk.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>{formatBytes(stats.disk.used)}</span>
              <span>{formatBytes(stats.disk.total)}</span>
            </div>
          </div>

          {/* Processes */}
          <div className="flex items-center justify-between p-3 bg-[#12121A] rounded-lg border border-[#1E1E2E]">
            <span className="text-xs text-[#64748B]">Processes</span>
            <span className="text-sm font-semibold text-[#E2E8F0]">{stats.processes}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPulse;
