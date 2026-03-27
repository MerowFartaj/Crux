import React, { useEffect, useRef, useState } from 'react';
import commandDB from '../data/commandDB';

export interface TooltipInfo {
  word: string;
  type: 'command' | 'subcommand' | 'flag';
  description: string;
  x: number;
  y: number;
}

interface Props {
  info: TooltipInfo | null;
}

export function lookupWord(
  word: string,
  commandBuffer: string
): { type: 'command' | 'subcommand' | 'flag'; description: string } | null {
  if (!word) return null;

  // Split command buffer into pipe segments, use the last one
  const pipeSegments = commandBuffer.split(/\s*\|\s*/);
  const currentSegment = pipeSegments[pipeSegments.length - 1].trim();
  const words = currentSegment.split(/\s+/).filter(Boolean);

  const cmd = words[0];
  const cmdEntry = cmd ? commandDB[cmd] : null;

  // Hovering over the command itself (first word)
  if (word === cmd && cmdEntry) {
    return { type: 'command', description: cmdEntry.description };
  }

  // Hovering over a flag (starts with -)
  if (word.startsWith('-') && cmdEntry) {
    // Check subcommand-specific flags first
    for (let i = 1; i < words.length; i++) {
      if (words[i] === word) break; // reached the hovered word
      const sub = cmdEntry.subcommands?.[words[i]];
      if (sub?.flags?.[word]) {
        return { type: 'flag', description: sub.flags[word] };
      }
    }
    // Check command-level flags
    if (cmdEntry.flags?.[word]) {
      return { type: 'flag', description: cmdEntry.flags[word] };
    }
    // Check all subcommands for this flag
    if (cmdEntry.subcommands) {
      // Find which subcommand is in the buffer
      for (const w of words.slice(1)) {
        const sub = cmdEntry.subcommands[w];
        if (sub?.flags?.[word]) {
          return { type: 'flag', description: sub.flags[word] };
        }
      }
    }
    return null;
  }

  // Hovering over a subcommand
  if (cmdEntry?.subcommands?.[word]) {
    return { type: 'subcommand', description: cmdEntry.subcommands[word].description };
  }

  // Hovering over a top-level command that appears after a pipe
  if (commandDB[word]) {
    return { type: 'command', description: commandDB[word].description };
  }

  return null;
}

const CommandTooltip: React.FC<Props> = ({ info }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!info || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = info.x;
    let top = info.y + 20; // below the word

    // Prevent overflow right
    if (left + rect.width > vw - 8) {
      left = vw - rect.width - 8;
    }
    // Prevent overflow left
    if (left < 8) left = 8;

    // If tooltip would go below screen, show above
    if (top + rect.height > vh - 8) {
      top = info.y - rect.height - 4;
    }

    setPosition({ left, top });
  }, [info]);

  if (!info) return null;

  const badgeColor =
    info.type === 'command' ? 'bg-blue-500/20 text-blue-400' :
    info.type === 'subcommand' ? 'bg-purple-500/20 text-purple-400' :
    'bg-amber-500/20 text-amber-400';

  const badgeLabel =
    info.type === 'command' ? 'Command' :
    info.type === 'subcommand' ? 'Subcommand' :
    'Flag';

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] pointer-events-none"
      style={{ left: position.left, top: position.top }}
    >
      <div
        className="bg-[#1A1A24] border border-[#2A2A3E] rounded-md shadow-lg px-3 py-2"
        style={{ maxWidth: 300 }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-[#F8FAFC] font-mono">{info.word}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${badgeColor}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="text-[11px] text-[#94A3B8] leading-snug">{info.description}</p>
      </div>
    </div>
  );
};

export default CommandTooltip;
