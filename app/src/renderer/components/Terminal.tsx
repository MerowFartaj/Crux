import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { LigaturesAddon } from '@xterm/addon-ligatures';
import { useAppStore } from '../stores/appStore';
import { useSound } from '../hooks/useSound';
import SlashCommands, { SlashCommand } from './SlashCommands';
import Autocomplete from './Autocomplete';
import CommandTooltip, { TooltipInfo, lookupWord } from './CommandTooltip';
import { AI_PROMPTS } from '../../shared/ai-prompts';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  tabId: string;
}

type HighlightKind = 'plain' | 'knownCommand' | 'unknownCommand' | 'flag' | 'string' | 'operator' | 'variable';

interface HighlightSegment {
  kind: HighlightKind;
  text: string;
}

const HIGHLIGHT_KNOWN_COMMANDS = new Set([
  'git', 'npm', 'npx', 'node', 'pnpm', 'yarn', 'bun', 'python', 'python3', 'pip',
  'docker', 'docker-compose', 'docker-compose-v1', 'kubectl', 'brew', 'ls', 'cd',
  'cat', 'grep', 'find', 'sed', 'awk', 'curl', 'wget', 'ssh', 'scp', 'rsync',
  'mkdir', 'rm', 'cp', 'mv', 'touch', 'code', 'vim', 'nano', 'tmux', 'make',
  'cargo', 'go', 'pnpx', 'deno', 'which', 'echo', 'printf', 'pwd', 'source',
  'export', 'env', 'sudo',
]);
const HIGHLIGHT_COMMAND_PREFIXES = new Set(['sudo', 'env', 'command', 'time', 'nohup']);
const HIGHLIGHT_OPERATOR_TOKENS = ['>>', '<<', '||', '&&', '|', '>', '<', ';'];

function isPrintableInputChunk(data: string): boolean {
  return data.length > 0 && !/[\x00-\x1F\x7F]/.test(data);
}

function appendHighlightSegment(segments: HighlightSegment[], kind: HighlightKind, text: string) {
  if (!text) return;
  const previous = segments[segments.length - 1];
  if (previous && previous.kind === kind) {
    previous.text += text;
    return;
  }
  segments.push({ kind, text });
}

function normalizeCommandName(word: string): string {
  if (word.includes('/')) {
    const parts = word.split('/');
    return parts[parts.length - 1] || word;
  }
  return word;
}

function tokenizeCommandForOverlay(input: string): HighlightSegment[] {
  const tokens: HighlightSegment[] = [];
  let index = 0;
  let expectCommand = true;

  while (index < input.length) {
    const current = input[index];

    if (current === '\n') {
      appendHighlightSegment(tokens, 'plain', '\n');
      expectCommand = true;
      index += 1;
      continue;
    }

    if (/\s/.test(current)) {
      let end = index + 1;
      while (end < input.length && /\s/.test(input[end]) && input[end] !== '\n') end += 1;
      appendHighlightSegment(tokens, 'plain', input.slice(index, end));
      index = end;
      continue;
    }

    const matchedOperator = HIGHLIGHT_OPERATOR_TOKENS.find((token) => input.startsWith(token, index));
    if (matchedOperator) {
      appendHighlightSegment(tokens, 'operator', matchedOperator);
      if (matchedOperator === '|' || matchedOperator === '||' || matchedOperator === '&&' || matchedOperator === ';') {
        expectCommand = true;
      }
      index += matchedOperator.length;
      continue;
    }

    if (current === '"' || current === '\'') {
      const quote = current;
      let end = index + 1;
      while (end < input.length) {
        if (input[end] === '\\' && end + 1 < input.length) {
          end += 2;
          continue;
        }
        if (input[end] === quote) {
          end += 1;
          break;
        }
        end += 1;
      }
      appendHighlightSegment(tokens, 'string', input.slice(index, end));
      expectCommand = false;
      index = end;
      continue;
    }

    if (current === '$') {
      let end = index + 1;
      if (input[end] === '{') {
        end += 1;
        while (end < input.length && input[end] !== '}') end += 1;
        if (end < input.length) end += 1;
      } else {
        while (end < input.length && /[\w]/.test(input[end])) end += 1;
      }
      appendHighlightSegment(tokens, 'variable', input.slice(index, end));
      expectCommand = false;
      index = end;
      continue;
    }

    let end = index + 1;
    while (end < input.length && !/\s/.test(input[end]) && !'|&;<>'.includes(input[end])) end += 1;
    const word = input.slice(index, end);

    if (word.startsWith('-')) {
      appendHighlightSegment(tokens, 'flag', word);
      expectCommand = false;
    } else if (expectCommand) {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) {
        appendHighlightSegment(tokens, 'plain', word);
      } else {
        const normalized = normalizeCommandName(word);
        const kind = HIGHLIGHT_KNOWN_COMMANDS.has(normalized) ? 'knownCommand' : 'unknownCommand';
        appendHighlightSegment(tokens, kind, word);
        expectCommand = HIGHLIGHT_COMMAND_PREFIXES.has(normalized);
      }
    } else {
      appendHighlightSegment(tokens, 'plain', word);
    }

    index = end;
  }

  return tokens;
}

function getHighlightColor(kind: HighlightKind, isDark: boolean): string | null {
  if (kind === 'plain') return null;
  const palette = isDark
    ? { knownCommand: '#22C55E', unknownCommand: '#F87171', flag: '#FDE047', string: '#F59E0B', operator: '#22D3EE', variable: '#C084FC' }
    : { knownCommand: '#15803D', unknownCommand: '#DC2626', flag: '#A16207', string: '#B45309', operator: '#0891B2', variable: '#9333EA' };
  return palette[kind];
}

const Terminal: React.FC<TerminalProps> = ({ tabId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);
  const settings = useAppStore((s) => s.settings);
  const updateTab = useAppStore((s) => s.updateTab);
  const theme = useAppStore((s) => s.theme);
  const { play } = useSound();
  const commandBufferRef = useRef('');
  const commandStartTimeRef = useRef(0);
  const isRunningRef = useRef(false);
  const outputBufferRef = useRef('');
  const lastSubmittedCommandRef = useRef('');

  // Command tooltip state
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplete state
  const [autocompleteInput, setAutocompleteInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Slash command state
  const [slashVisible, setSlashVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const slashActiveRef = useRef(false);
  const slashBufferRef = useRef('');

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRegex, setSearchRegex] = useState(false);
  const [searchCase, setSearchCase] = useState(false);
  const [searchResults, setSearchResults] = useState({ resultIndex: -1, resultCount: 0 });
  const searchAddonRef = useRef<SearchAddon | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; isPath: boolean } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Undo/redo state
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const cursorPosRef = useRef(0); // track cursor position within command buffer
  const promptColRef = useRef(0); // column where the prompt ends (command starts)
  const overlayRafRef = useRef<number>(0);

  // Multi-line state
  const isMultiLineRef = useRef(false);
  const isPastingRef = useRef(false);

  // Overlay highlight state
  interface OverlaySpan { text: string; color: string | null; }
  const [overlaySpans, setOverlaySpans] = useState<OverlaySpan[] | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ top: number; left: number; cellW: number; cellH: number } | null>(null);

  // Schedule overlay refresh via requestAnimationFrame
  const scheduleHighlightRepaint = useCallback(() => {
    cancelAnimationFrame(overlayRafRef.current);
    overlayRafRef.current = requestAnimationFrame(() => {
      const xterm = xtermRef.current;
      const cmd = commandBufferRef.current;

      if (!xterm || !cmd || isRunningRef.current || slashActiveRef.current || cmd.includes('\n')) {
        setOverlaySpans(null);
        return;
      }

      // Get pixel-perfect cell dimensions from xterm internals
      const core = (xterm as any)._core;
      const dims = core?._renderService?.dimensions;
      if (!dims) { setOverlaySpans(null); return; }

      const cellW = dims.css.cell.width;
      const cellH = dims.css.cell.height;
      if (!cellW || !cellH) { setOverlaySpans(null); return; }

      // Compute overlay position relative to the xterm-screen element
      const buffer = xterm.buffer.active;
      const promptRow = buffer.cursorY; // viewport row of cursor
      // The cursor is at the END of the typed text, so the prompt row
      // is the row where the command lives
      const viewportRow = promptRow;
      // But for wrapped lines the cursor may be on a later row — for single-line, it's the same row

      const top = viewportRow * cellH;
      const left = promptColRef.current * cellW;

      setOverlayPos({ top, left, cellW, cellH });

      // Tokenize and build colored spans
      const isDark = useAppStore.getState().theme === 'dark';
      const tokens = tokenizeCommandForOverlay(cmd);
      const hasSpace = cmd.includes(' ');
      const spans: OverlaySpan[] = [];
      let isFirstWord = true;

      for (const token of tokens) {
        let color: string | null = null;
        if (isFirstWord && (token.kind === 'knownCommand' || token.kind === 'unknownCommand')) {
          color = hasSpace ? getHighlightColor(token.kind, isDark) : null;
          isFirstWord = false;
        } else {
          if (token.kind !== 'plain') isFirstWord = false;
          color = getHighlightColor(token.kind, isDark);
        }
        spans.push({ text: token.text, color });
      }

      setOverlaySpans(spans);
    });
  }, []);

  // Push current state to undo stack
  const pushUndo = useCallback(() => {
    undoStackRef.current.push(commandBufferRef.current);
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, []);

  // Perform undo
  const performUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(commandBufferRef.current);

    // Erase current input and type the previous state
    const currentLen = commandBufferRef.current.length;
    const backspaces = '\x7f'.repeat(currentLen);
    window.electronAPI.pty.write(tabId, backspaces + prev);
    commandBufferRef.current = prev;
    setAutocompleteInput(prev);
    setShowAutocomplete(prev.length >= 2);
    scheduleHighlightRepaint();
  }, [scheduleHighlightRepaint, tabId]);

  // Perform redo
  const performRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(commandBufferRef.current);

    const currentLen = commandBufferRef.current.length;
    const backspaces = '\x7f'.repeat(currentLen);
    window.electronAPI.pty.write(tabId, backspaces + next);
    commandBufferRef.current = next;
    setAutocompleteInput(next);
    setShowAutocomplete(next.length >= 2);
    scheduleHighlightRepaint();
  }, [scheduleHighlightRepaint, tabId]);

  // Build slash commands list
  const slashCommands: SlashCommand[] = [
    {
      name: 'settings',
      description: 'Open settings panel',
      shortcut: '⌘,',
      action: () => useAppStore.getState().setShowSettings(true),
    },
    {
      name: 'pulse',
      description: 'Toggle system pulse sidebar',
      shortcut: '⌘⇧P',
      action: () => useAppStore.getState().toggleSystemPulse(),
    },
    {
      name: 'history',
      description: 'Browse command history',
      shortcut: '⌘⇧H',
      action: () => useAppStore.getState().setShowHistoryView(true),
    },
    {
      name: 'workflows',
      description: 'Manage workflow blocks',
      shortcut: '⌘⇧W',
      action: () => useAppStore.getState().setShowWorkflowPanel(true),
    },
    {
      name: 'search',
      description: 'Open command palette',
      shortcut: '⌘K',
      action: () => useAppStore.getState().setShowCommandPalette(true),
    },
    {
      name: 'newtab',
      description: 'Open a new terminal tab',
      shortcut: '⌘T',
      action: () => {
        const id = `tab-${Date.now()}`;
        useAppStore.getState().addTab({
          id, title: 'Terminal', cwd: '~', process: '', status: 'idle',
        });
        play('click');
      },
    },
    {
      name: 'closetab',
      description: 'Close current terminal tab',
      shortcut: '⌘W',
      action: () => {
        const state = useAppStore.getState();
        if (state.tabs.length > 1) {
          state.removeTab(state.activeTabId);
          play('click');
        }
      },
    },
    {
      name: 'clear',
      description: 'Clear terminal screen',
      action: () => {
        if (xtermRef.current) {
          xtermRef.current.clear();
          window.electronAPI.pty.write(tabId, 'clear\r');
        }
      },
    },
    {
      name: 'ai',
      description: 'Ask AI a question inline',
      shortcut: '\u2318\u21e7A',
      action: () => {
        const xterm = xtermRef.current;
        if (xterm) xterm.writeln('\r\n\x1b[90mUsage: /ai <question> — AI answers inline in the terminal\x1b[0m\r\n');
      },
    },
    {
      name: 'mute',
      description: 'Toggle sound on/off',
      action: () => {
        const s = useAppStore.getState().settings;
        useAppStore.getState().updateSettings({ soundMuted: !s.soundMuted });
        window.electronAPI.store.set('soundMuted', !s.soundMuted);
      },
    },
    {
      name: 'split',
      description: 'Split pane vertically',
      shortcut: '⌘D',
      action: () => {
        useAppStore.getState().splitActivePane('vertical');
        play('click');
      },
    },
    {
      name: 'hsplit',
      description: 'Split pane horizontally',
      shortcut: '⌘⇧D',
      action: () => {
        useAppStore.getState().splitActivePane('horizontal');
        play('click');
      },
    },
    {
      name: 'highlight',
      description: 'Install zsh-syntax-highlighting for inline colors',
      action: () => {
        // Install zsh-syntax-highlighting via brew and source it
        const cmd = 'brew install zsh-syntax-highlighting && echo "source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ~/.zshrc && source ~/.zshrc';
        window.electronAPI.pty.write(tabId, cmd + '\r');
      },
    },
    {
      name: 'theme',
      description: 'Change accent color',
      action: () => useAppStore.getState().setShowSettings(true),
    },
    {
      name: 'tmux',
      description: 'tmux session management',
      action: async () => {
        try {
          const installed = await window.electronAPI.tmux.isInstalled();
          if (!installed) {
            const xterm = xtermRef.current;
            if (xterm) {
              xterm.writeln('\r\n\x1b[33mtmux is not installed.\x1b[0m');
              xterm.writeln('\x1b[90mInstall with: brew install tmux\x1b[0m\r\n');
            }
            return;
          }
          const state = await window.electronAPI.tmux.getState();
          const xterm = xtermRef.current;
          if (!xterm) return;
          if (state.connected) {
            xterm.writeln(`\r\n\x1b[32mtmux connected\x1b[0m — session: \x1b[1m${state.sessionName}\x1b[0m`);
            xterm.writeln('\x1b[90mType /tmux to detach or manage sessions\x1b[0m\r\n');
          } else {
            xterm.writeln('\r\n\x1b[90mtmux sessions:\x1b[0m');
            if (state.sessions.length === 0) {
              xterm.writeln('  (none)');
            } else {
              state.sessions.forEach(s => {
                xterm.writeln(`  \x1b[1m${s.name}\x1b[0m — ${s.windows} window(s) ${s.attached ? '\x1b[32m(attached)\x1b[0m' : ''}`);
              });
            }
            xterm.writeln('\x1b[90mEnable tmux in Settings to auto-connect\x1b[0m\r\n');
          }
        } catch (err: any) {
          console.error('tmux command failed:', err);
        }
      },
    },
    {
      name: 'preview',
      description: 'Preview a file in the side panel',
      action: () => {
        const xterm = xtermRef.current;
        if (!xterm) return;
        xterm.writeln('\r\n\x1b[90mUsage: type a file path after /preview, e.g. /preview package.json\x1b[0m');
        xterm.writeln('\x1b[90m  /preview close — close the preview panel\x1b[0m\r\n');
      },
    },
    {
      name: 'browse',
      description: 'Open a URL in the preview panel',
      action: () => {
        const xterm = xtermRef.current;
        if (xterm) xterm.writeln('\r\n\x1b[90mUsage: /browse <url> — Open a webpage in the preview panel\x1b[0m\r\n');
      },
    },
    {
      name: 'explain',
      description: 'AI explains a command before running it',
      action: () => {
        const xterm = xtermRef.current;
        if (xterm) xterm.writeln('\r\n\x1b[90mUsage: /explain <command> — AI breaks down what the command does\x1b[0m\r\n');
      },
    },
    {
      name: 'fix',
      description: 'AI suggests a fix for the last failed command',
      action: () => {}, // handled by args interceptor below
    },
    {
      name: 'how',
      description: 'AI generates a command from a description',
      action: () => {
        const xterm = xtermRef.current;
        if (xterm) xterm.writeln('\r\n\x1b[90mUsage: /how <description> — AI generates the right command\x1b[0m\r\n');
      },
    },
    {
      name: 'notebook',
      description: 'Open a markdown file as a runnable notebook',
      action: () => {
        const xterm = xtermRef.current;
        if (!xterm) return;
        xterm.writeln('\r\n\x1b[90mUsage: /notebook <file.md> — Opens markdown with runnable code blocks\x1b[0m\r\n');
      },
    },
    {
      name: 'blocks',
      description: 'View command block history',
      action: () => useAppStore.getState().setShowBlockHistory(true),
    },
    {
      name: 'ssh',
      description: 'SSH Connection Manager',
      shortcut: '\u2318\u21e7S',
      action: () => useAppStore.getState().setShowSSHManager(true),
    },
    {
      name: 'onboarding',
      description: 'Replay the setup wizard',
      action: () => useAppStore.getState().setShowOnboarding(true),
    },
    {
      name: 'shortcuts',
      description: 'Show keyboard shortcuts',
      action: () => {
        const xterm = xtermRef.current;
        if (!xterm) return;
        const d = '\x1b[90m';
        const b = '\x1b[1;37m';
        const r = '\x1b[0m';
        xterm.write('\r\n');
        xterm.write(`${b}  Keyboard Shortcuts${r}\r\n\r\n`);
        xterm.write(`  ${b}\u2318T${r}${d} New tab       ${r}${b}\u2318\u21e7S${r}${d} SSH Manager${r}\r\n`);
        xterm.write(`  ${b}\u2318W${r}${d} Close tab     ${r}${b}\u2318\u21e7H${r}${d} History${r}\r\n`);
        xterm.write(`  ${b}\u2318D${r}${d} Split pane    ${r}${b}\u2318\u21e7P${r}${d} System Monitor${r}\r\n`);
        xterm.write(`  ${b}\u2318K${r}${d} Palette       ${r}${b}Ctrl+\`${r}${d} Dropdown${r}\r\n`);
        xterm.write(`  ${b}\u2318F${r}${d} Search        ${r}${b}/ai${r}${d}    AI assistant${r}\r\n`);
        xterm.write(`  ${b}\u2318,${r}${d} Settings      ${r}${b}/preview${r}${d} File preview${r}\r\n`);
        xterm.write('\r\n');
      },
    },
  ];

  const clearInlineInput = useCallback((length: number) => {
    const xterm = xtermRef.current;
    if (!xterm || length <= 0) return;
    xterm.write('\b \b'.repeat(length));
  }, []);

  const resetInputState = useCallback(() => {
    commandBufferRef.current = '';
    setShowAutocomplete(false);
    setAutocompleteInput('');
    isMultiLineRef.current = false;
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, []);

  const cancelSlash = useCallback(() => {
    if (slashActiveRef.current && commandBufferRef.current.startsWith('/')) {
      clearInlineInput(commandBufferRef.current.length);
      resetInputState();
    }
    slashActiveRef.current = false;
    slashBufferRef.current = '';
    setSlashVisible(false);
    setSlashQuery('');
  }, [clearInlineInput, resetInputState]);

  const finalizeSubmittedInput = useCallback((submittedCommand: string) => {
    if (submittedCommand.trim()) {
      isRunningRef.current = true;
      commandStartTimeRef.current = Date.now();
      outputBufferRef.current = '';
      lastSubmittedCommandRef.current = submittedCommand.trim();
      updateTab(tabId, {
        status: 'running',
        process: submittedCommand.trim().split(' ')[0],
      });
    }
    resetInputState();
  }, [resetInputState, tabId, updateTab]);

  // AI conversation memory — last 2 Q&A pairs for follow-up context
  const aiMemoryRef = useRef<{ q: string; a: string }[]>([]);

  // ANSI style constants for AI responses
  const AI = {
    sepDim:    '\x1b[2;36m',  // dim cyan for separators
    text:      '\x1b[3;38;2;130;170;255m', // italic soft blue for explanations
    cmd:       '\x1b[1;32m',  // bold green for suggested commands
    cmdBright: '\x1b[1;97m',  // bold bright white for command in box
    warning:   '\x1b[3;33m',  // italic yellow for warnings
    context:   '\x1b[2;3;90m', // dim italic gray for context info
    meta:      '\x1b[90m',    // dim gray for timing info
    runBtn:    '\x1b[1;32m',  // bold green for [Run]
    copyBtn:   '\x1b[1;34m',  // bold blue for [Copy]
    boxBorder: '\x1b[2;36m',  // dim cyan for box borders
    reset:     '\x1b[0m',
  };

  const aiBadge = (type: string): string => {
    const badges: Record<string, string> = {
      ai:      '\x1b[1;7;36m \u2728 AI \x1b[0m',
      explain: '\x1b[1;7;36m \ud83d\udcd6 Explain \x1b[0m',
      fix:     '\x1b[1;7;33m \ud83d\udd27 Fix \x1b[0m',
      how:     '\x1b[1;7;32m \ud83d\udca1 How \x1b[0m',
    };
    return badges[type] || badges.ai;
  };

  // Inline AI handler — streams response directly into the terminal
  const handleInlineAI = useCallback((command: string, args: string) => {
    const xterm = xtermRef.current;
    if (!xterm) return;

    // /ai with no args → show help
    if (command === 'ai' && !args) {
      xterm.write('\r\n');
      xterm.write(`\x1b[1m  AI Commands:\x1b[0m\r\n\r\n`);
      xterm.write(`  ${AI.text}/ai <question>${AI.reset}      Ask anything about your terminal or project\r\n`);
      xterm.write(`  ${AI.text}/explain <command>${AI.reset}   Break down what a command does\r\n`);
      xterm.write(`  ${AI.text}/fix${AI.reset}                 Suggest a fix for the last failed command\r\n`);
      xterm.write(`  ${AI.text}/how <description>${AI.reset}   Describe what you want, get the command\r\n`);
      xterm.write('\r\n');
      return;
    }

    // Build context
    const tab = useAppStore.getState().tabs.find(t => t.id === tabId);
    const blocks = useAppStore.getState().commandBlocks.get(tabId) || [];
    const recentBlocks = blocks.slice(-3);
    let ctx = `CWD: ${tab?.cwd || '~'}`;
    if (tab?.gitBranch) ctx += ` | branch: ${tab.gitBranch}`;
    ctx += '\nRecent commands:\n';
    for (const b of recentBlocks) {
      ctx += `$ ${b.command} → exit ${b.exitCode}\n`;
      if (b.exitCode !== 0 && b.output) ctx += b.output.slice(-1000) + '\n';
    }

    // Add AI conversation memory for follow-up context
    let memoryCtx = '';
    if (aiMemoryRef.current.length > 0) {
      memoryCtx = '\n\nPrevious AI conversation:\n';
      for (const m of aiMemoryRef.current) {
        memoryCtx += `User: ${m.q}\nAI: ${m.a.slice(0, 500)}\n`;
      }
    }

    let prompt = '';
    let systemPrompt = '';

    if (command === 'ai') {
      prompt = args;
      systemPrompt = `${AI_PROMPTS.general}\n\nContext:\n${ctx}${memoryCtx}`;
    } else if (command === 'explain') {
      if (!args) return;
      prompt = `Explain this command: ${args}`;
      systemPrompt = AI_PROMPTS.explain;
    } else if (command === 'fix') {
      const lastFailed = recentBlocks.filter(b => b.exitCode !== 0).pop();
      if (!lastFailed) {
        xterm.write(`\r\n${AI.warning}No recent failed commands to fix.${AI.reset}\r\n`);
        return;
      }
      prompt = `Command: ${lastFailed.command}\nExit code: ${lastFailed.exitCode}\nOutput:\n${lastFailed.output.slice(-2000)}`;
      systemPrompt = AI_PROMPTS.fix;
    } else if (command === 'how') {
      if (!args) return;
      prompt = args;
      systemPrompt = `${AI_PROMPTS.how}\n\nContext:\n${ctx}`;
    }

    // Draw header with user's question
    const lineWidth = Math.min(xterm.cols - 2, 60);
    const startTime = Date.now();
    xterm.write(`\r\n${AI.sepDim}${'─'.repeat(lineWidth)}${AI.reset}\r\n`);
    xterm.write(`  ${aiBadge(command)}  `);

    // Show context info
    const ctxLabel = tab?.cwd ? tab.cwd.split('/').pop() || '~' : '~';
    xterm.write(`${AI.context}${ctxLabel}${tab?.gitBranch ? ` · ${tab.gitBranch}` : ''}${AI.reset}\r\n`);

    // Echo the user's question so it stays visible
    const displayQuestion = args || (command === 'fix' ? '(fix last failed command)' : '');
    if (displayQuestion) {
      xterm.write(`\x1b[1;37m  > ${displayQuestion}\x1b[0m\r\n`);
    }
    xterm.write('\r\n');

    const requestId = `ai-${Date.now()}`;
    let fullResponse = '';

    const removeChunk = window.electronAPI.ai.onChunk((id, text) => {
      if (id !== requestId) return;
      fullResponse += text;
      // Stream with italic soft blue styling
      xterm.write(`${AI.text}${text.replace(/\n/g, `${AI.reset}\r\n${AI.text}`)}${AI.reset}`);
    });

    const removeDone = window.electronAPI.ai.onDone((id) => {
      if (id !== requestId) return;
      removeChunk();
      removeDone();

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const model = useAppStore.getState().settings.aiModel || 'unknown';
      const modelShort = model.includes('opus') ? 'claude-opus-4.6' :
        model.includes('sonnet') ? 'claude-sonnet-4.6' :
        model.includes('haiku') ? 'claude-haiku-4.5' :
        model.includes('gpt-5.4') ? 'gpt-5.4-mini' :
        model.includes('gpt-5') ? 'gpt-5-mini' : model;
      const cost = model.includes('opus') ? '~$0.02' :
        model.includes('sonnet') ? '~$0.01' :
        model.includes('haiku') ? '~$0.004' :
        model.includes('gpt-5.4') ? '~$0.002' :
        '~$0.001';

      // Timing + model info
      xterm.write(`\r\n\r\n${AI.meta}\x1b[3m${elapsed}s · ${modelShort} · ${cost}${AI.reset}\r\n`);
      xterm.write(`${AI.sepDim}${'─'.repeat(lineWidth)}${AI.reset}\r\n`);

      // Save to memory for follow-ups (keep last 2)
      aiMemoryRef.current.push({ q: args || command, a: fullResponse });
      if (aiMemoryRef.current.length > 2) aiMemoryRef.current.shift();
    });

    // Cancel on Ctrl+C
    const cancelHandler = (data: string) => {
      if (data === '\x03') {
        window.electronAPI.ai.cancelStream();
        xterm.write(`\r\n${AI.meta}(cancelled)${AI.reset}\r\n`);
      }
    };
    const disposable = xterm.onData(cancelHandler);
    window.electronAPI.ai.onDone((id) => {
      if (id === requestId) disposable.dispose();
    });

    // Start streaming
    window.electronAPI.ai.stream(requestId, prompt, systemPrompt);
  }, [tabId]);

  const updateSlashState = useCallback((buffer: string) => {
    const slashContent = buffer.startsWith('/') ? buffer.slice(1) : buffer;
    const [query = ''] = slashContent.split(/\s+/, 1);
    slashBufferRef.current = query;
    setSlashQuery(query);
    setSlashVisible(!/\s/.test(slashContent));
  }, []);

  const resolveFilePath = useCallback((filePath: string) => {
    const activeTab = useAppStore.getState().tabs.find((t) => t.id === tabId);
    return window.electronAPI.file.resolve(filePath, {
      tabId,
      cwd: activeTab?.cwd,
    });
  }, [tabId]);

  const handlePreviewCommand = useCallback((args: string) => {
    const xterm = xtermRef.current;
    if (args === 'close') {
      useAppStore.getState().setShowPreview(false);
      return;
    }

    if (!args) {
      useAppStore.getState().setShowPreview(true);
      return;
    }

    resolveFilePath(args).then((resolved) => {
      useAppStore.getState().openPreview(resolved);
    }).catch(() => {
      xterm?.writeln(`\r\n\x1b[31mCannot resolve path: ${args}\x1b[0m`);
    });
  }, [resolveFilePath]);

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    clearInlineInput(commandBufferRef.current.length);
    resetInputState();
    cancelSlash();
    setTimeout(() => cmd.action(), 50);
  }, [cancelSlash, clearInlineInput, resetInputState]);

  useEffect(() => {
    if (initializedRef.current || !termRef.current) return;
    initializedRef.current = true;

    const el = termRef.current;

    const initTheme = useAppStore.getState().theme;
    const darkTheme = {
      background: '#0A0A0F',
      foreground: '#E2E8F0',
      cursor: '#3B82F6',
      cursorAccent: '#0A0A0F',
      selectionBackground: 'rgba(59, 130, 246, 0.3)',
      selectionForeground: '#E2E8F0',
      black: '#1E1E2E',
      red: '#EF4444',
      green: '#22C55E',
      yellow: '#EAB308',
      blue: '#3B82F6',
      magenta: '#A855F7',
      cyan: '#06B6D4',
      white: '#E2E8F0',
      brightBlack: '#64748B',
      brightRed: '#F87171',
      brightGreen: '#4ADE80',
      brightYellow: '#FDE047',
      brightBlue: '#60A5FA',
      brightMagenta: '#C084FC',
      brightCyan: '#22D3EE',
      brightWhite: '#F8FAFC',
    };
    const lightTheme = {
      background: '#F1F5F9',
      foreground: '#0F172A',
      cursor: '#1D4ED8',
      cursorAccent: '#F1F5F9',
      selectionBackground: 'rgba(37, 99, 235, 0.25)',
      selectionForeground: '#0F172A',
      black: '#94A3B8',
      red: '#B91C1C',
      green: '#15803D',
      yellow: '#A16207',
      blue: '#1D4ED8',
      magenta: '#7E22CE',
      cyan: '#0E7490',
      white: '#0F172A',
      brightBlack: '#475569',
      brightRed: '#DC2626',
      brightGreen: '#16A34A',
      brightYellow: '#CA8A04',
      brightBlue: '#2563EB',
      brightMagenta: '#9333EA',
      brightCyan: '#0891B2',
      brightWhite: '#020617',
    };

    const xterm = new XTerm({
      fontSize: settings.fontSize,
      fontFamily: `"${settings.fontFamily}", "Fira Code", "SF Mono", Menlo, monospace`,
      theme: initTheme === 'light' ? lightTheme : darkTheme,
      cursorBlink: false,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      drawBoldTextInBrightColors: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon((_event, url) => {
      // Open in CRUX preview panel or system browser based on setting
      const linkBehavior = useAppStore.getState().settings.linkOpenBehavior || 'preview';
      if (linkBehavior === 'preview') {
        useAppStore.getState().openPreview(url);
      } else {
        window.electronAPI.shell.openExternal(url);
      }
    }));

    // Search addon
    const searchAddon = new SearchAddon();
    xterm.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon;

    // Font ligatures addon (for JetBrains Mono, Fira Code)
    if (settings.fontLigatures) {
      try {
        const ligaturesAddon = new LigaturesAddon();
        xterm.loadAddon(ligaturesAddon);
      } catch (e) {
        console.warn('Font ligatures addon failed to load:', e);
      }
    }

    // Let Cmd+key shortcuts pass through to window-level handlers
    xterm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return true; // not a shortcut, let xterm handle it

      // Cmd+Shift combos: D (h-split), S (SSH), P (pulse), A (AI), F (find)
      if (e.shiftKey && ['D', 'S', 'P', 'A', 'F'].includes(e.key)) return false;

      // Cmd combos: T (tab), W (close), D (v-split), comma (settings), K (palette),
      //             I (history), F (find), number keys (tab switch)
      if (!e.shiftKey && ['t', 'w', 'd', ',', 'k', 'i', 'f',
        '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) return false;

      return true; // everything else handled by xterm
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.open(el);

    // Expose xterm instance on DOM for testing (e2e access to buffer)
    (el.querySelector('.xterm') as any).__xterm = xterm;

    try {
      const { WebglAddon } = require('@xterm/addon-webgl');
      const webgl = new WebglAddon();
      xterm.loadAddon(webgl);
      webgl.onContextLoss(() => webgl.dispose());
    } catch {}

    // ---------- Custom link providers (file paths, IPs, commit hashes) ----------
    const filePathRegex = /(~\/[\w./_-]+|\.\.?\/[\w./_-]+|\/[\w._-][\w./_-]+)(:\d+)?/g;
    const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?\b/g;
    const hashRegex = /\b[0-9a-f]{7,40}\b/g;

    const makeLinkProvider = (
      regex: RegExp,
      activate: (text: string) => void
    ) => ({
      provideLinks: (lineNumber: number, callback: (links: any[] | undefined) => void) => {
        const line = xterm.buffer.active.getLine(lineNumber - 1);
        if (!line) { callback(undefined); return; }
        const text = line.translateToString();
        const links: any[] = [];
        let match: RegExpExecArray | null;
        const re = new RegExp(regex.source, regex.flags);
        while ((match = re.exec(text)) !== null) {
          const startCol = match.index + 1;
          const endCol = startCol + match[0].length - 1;
          links.push({
            range: { start: { x: startCol, y: lineNumber }, end: { x: endCol, y: lineNumber } },
            text: match[0],
            activate: (_e: any, linkText: string) => activate(linkText),
          });
        }
        callback(links.length > 0 ? links : undefined);
      },
    });

    // File paths → open in preview panel (Cmd+click) or default app
    xterm.registerLinkProvider(makeLinkProvider(filePathRegex, (text) => {
      const filePath = text.replace(/:\d+$/, ''); // strip :lineNumber
      const resolved = filePath.startsWith('~')
        ? filePath.replace('~', process.env.HOME || '')
        : filePath;
      if (resolved.startsWith('/') || resolved.startsWith('~')) {
        useAppStore.getState().openPreview(resolved);
      } else {
        resolveFilePath(resolved).then(abs => {
          useAppStore.getState().openPreview(abs);
        }).catch(() => {
          window.electronAPI.shell.openPath(resolved);
        });
      }
    }));

    // IPv4 addresses → open in browser
    xterm.registerLinkProvider(makeLinkProvider(ipRegex, (text) => {
      const url = text.includes(':') ? `http://${text}` : `http://${text}`;
      window.electronAPI.shell.openExternal(url);
    }));

    // Git commit hashes → copy to clipboard
    xterm.registerLinkProvider(makeLinkProvider(hashRegex, (text) => {
      navigator.clipboard.writeText(text);
    }));

    // "Explain error?" clickable link
    xterm.registerLinkProvider(makeLinkProvider(/Explain error\?/, async () => {
      const errorCtx = (window as any).__cruxLastError;
      if (!errorCtx || errorCtx.tabId !== tabId) return;

      xterm.write('\r\n\x1b[90m⏳ Asking Claude...\x1b[0m\r\n');
      try {
        const explanation = await window.electronAPI.ai.explainError(
          errorCtx.command, errorCtx.output, errorCtx.exitCode
        );
        // Render explanation with ANSI formatting
        const lines = explanation.split('\n');
        for (const line of lines) {
          if (line.startsWith('Fix:') || line.startsWith('fix:')) {
            xterm.write(`\x1b[32m${line}\x1b[0m\r\n`);
          } else {
            xterm.write(`\x1b[36m${line}\x1b[0m\r\n`);
          }
        }
        xterm.write('\r\n');
      } catch (err: any) {
        xterm.write(`\r\n\x1b[31mFailed: ${err.message || 'Unknown error'}\x1b[0m\r\n`);
      }
      (window as any).__cruxLastError = null;
    }));

    // "Generate commit message?" clickable link
    xterm.registerLinkProvider(makeLinkProvider(/Generate commit message\?/, async () => {
      const ctx = (window as any).__cruxPendingCommit;
      if (!ctx || ctx.tabId !== tabId) return;

      xterm.write('\r\n\x1b[90m\u23f3 Getting staged changes...\x1b[0m\r\n');
      try {
        // Get git diff --cached via a temporary PTY command
        const diff = await window.electronAPI.ai.commitMessage(
          'Generating based on staged changes' // The main process will call git diff internally
        );
        xterm.write(`\r\n\x1b[36mSuggested message:\x1b[0m \x1b[1m${diff}\x1b[0m\r\n`);
        xterm.write('\x1b[90mPress Enter to use, or type your own message.\x1b[0m\r\n');

        // Write the commit command with the generated message
        window.electronAPI.pty.write(tabId, `git commit -m "${diff.replace(/"/g, '\\"')}"`);
      } catch (err: any) {
        xterm.write(`\r\n\x1b[31mFailed: ${err.message}\x1b[0m\r\n`);
      }
      (window as any).__cruxPendingCommit = null;
    }));

    const doFit = () => { try { fitAddon.fit(); } catch {} };
    setTimeout(doFit, 50);
    setTimeout(doFit, 200);
    setTimeout(doFit, 500);

    // ---------- Keyboard interceptor for Shift+Enter, Undo/Redo ----------
    const keydownHandler = (e: KeyboardEvent) => {
      // Only intercept when this tab is active
      if (useAppStore.getState().activeTabId !== tabId) return;
      if (slashActiveRef.current) return; // slash commands handle their own keys

      const meta = e.metaKey || e.ctrlKey;

      // Shift+Enter: Multi-line input (send line continuation)
      if (e.key === 'Enter' && e.shiftKey && !isRunningRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Send backslash + newline for shell line continuation
        window.electronAPI.pty.write(tabId, ' \\\n');
        isMultiLineRef.current = true;
        commandBufferRef.current += ' \\\n';
        scheduleHighlightRepaint();
        return;
      }

      // Cmd+F: Open search bar
      if (meta && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }

      // Cmd+C: Copy selected text, or send SIGINT if nothing selected
      if (meta && e.key === 'c' && !e.shiftKey) {
        if (xterm.hasSelection()) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(xterm.getSelection());
          xterm.clearSelection();
          return;
        }
        // No selection → let it pass through as Ctrl+C (SIGINT) via default xterm behavior
        return;
      }

      // Cmd+V: Paste from clipboard
      if (meta && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.readText().then(text => {
          if (text) {
            isPastingRef.current = true;
            window.electronAPI.pty.write(tabId, text);
            commandBufferRef.current += text;
            setTimeout(() => { isPastingRef.current = false; }, 100);
          }
        });
        return;
      }

      // Escape: Close search bar (check DOM for search input focus)
      if (e.key === 'Escape' && searchInputRef.current && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setShowSearch(false);
        setSearchQuery('');
        searchAddonRef.current?.clearDecorations();
        xterm.focus();
        return;
      }

      // Cmd+Z: Undo
      if (meta && e.key === 'z' && !e.shiftKey && !isRunningRef.current) {
        e.preventDefault();
        e.stopPropagation();
        performUndo();
        return;
      }

      // Cmd+Shift+Z: Redo
      if (meta && e.key === 'z' && e.shiftKey && !isRunningRef.current) {
        e.preventDefault();
        e.stopPropagation();
        performRedo();
        return;
      }
    };

    // Use capture phase so we intercept before xterm
    el.addEventListener('keydown', keydownHandler, true);

    // ---------- Mouse click-to-position ----------
    const mouseHandler = (e: MouseEvent) => {
      // Don't reposition while a command is running or if text is selected
      if (isRunningRef.current) return;
      if (xterm.hasSelection()) return;

      const screen = el.querySelector('.xterm-screen') as HTMLElement;
      if (!screen) return;

      const rect = screen.getBoundingClientRect();
      const cellWidth = rect.width / xterm.cols;
      const cellHeight = rect.height / xterm.rows;

      const clickCol = Math.floor((e.clientX - rect.left) / cellWidth);
      const clickRow = Math.floor((e.clientY - rect.top) / cellHeight);

      // Only reposition clicks on the current prompt line
      const cursorRow = xterm.buffer.active.cursorY;
      if (clickRow !== cursorRow) return;

      // Clamp to valid command range
      const cmdLen = commandBufferRef.current.length;
      if (cmdLen === 0) return;

      const minCol = promptColRef.current;
      const maxCol = minCol + cmdLen;
      const targetCol = Math.max(minCol, Math.min(maxCol, clickCol));

      const cursorX = xterm.buffer.active.cursorX;
      const delta = targetCol - cursorX;
      if (delta === 0) return;

      // Send arrow key sequences to the shell
      const arrow = delta > 0 ? '\x1b[C' : '\x1b[D';
      const count = Math.abs(delta);
      for (let i = 0; i < count; i++) {
        window.electronAPI.pty.write(tabId, arrow);
      }
    };
    el.addEventListener('mouseup', mouseHandler);

    // ---------- Right-click context menu ----------
    const contextMenuHandler = (e: MouseEvent) => {
      e.preventDefault();
      const selectedText = xterm.hasSelection() ? xterm.getSelection().trim() : '';
      // Check if clicked text looks like a file path
      const isPath = /^[~.\/]/.test(selectedText) || selectedText.startsWith('/');
      setContextMenu({
        x: Math.min(e.clientX, window.innerWidth - 200),
        y: Math.min(e.clientY, window.innerHeight - 250),
        text: selectedText,
        isPath,
      });
    };
    el.addEventListener('contextmenu', contextMenuHandler);

    // Close context menu on any click
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener('click', closeContextMenu);

    // ---------- Command hover tooltip ----------
    const hoverHandler = (e: MouseEvent) => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

      // Only show tooltips on the prompt line (not running, not in output)
      if (isRunningRef.current || !commandBufferRef.current) {
        setTooltipInfo(null);
        return;
      }

      // Check if tooltips are enabled
      if (!useAppStore.getState().settings.commandTooltips) {
        setTooltipInfo(null);
        return;
      }

      const screen = el.querySelector('.xterm-screen') as HTMLElement;
      if (!screen) return;

      const rect = screen.getBoundingClientRect();
      const cellWidth = rect.width / xterm.cols;
      const cellHeight = rect.height / xterm.rows;

      const hoverCol = Math.floor((e.clientX - rect.left) / cellWidth);
      const hoverRow = Math.floor((e.clientY - rect.top) / cellHeight);
      const cursorRow = xterm.buffer.active.cursorY;

      // Only on the current prompt line
      if (hoverRow !== cursorRow) {
        setTooltipInfo(null);
        return;
      }

      // Figure out which word is being hovered
      const cmdBuf = commandBufferRef.current;
      const promptCol = promptColRef.current;
      const charIndex = hoverCol - promptCol;
      if (charIndex < 0 || charIndex >= cmdBuf.length) {
        setTooltipInfo(null);
        return;
      }

      // Find word boundaries
      const words = cmdBuf.split(/(\s+)/);
      let pos = 0;
      let hoveredWord = '';
      for (const segment of words) {
        if (charIndex >= pos && charIndex < pos + segment.length) {
          hoveredWord = segment.trim();
          break;
        }
        pos += segment.length;
      }

      if (!hoveredWord) {
        setTooltipInfo(null);
        return;
      }

      // Debounce 300ms
      tooltipTimerRef.current = setTimeout(() => {
        const result = lookupWord(hoveredWord, cmdBuf);
        if (result) {
          setTooltipInfo({
            word: hoveredWord,
            type: result.type,
            description: result.description,
            x: e.clientX,
            y: e.clientY,
          });
        } else {
          setTooltipInfo(null);
        }
      }, 300);
    };

    const hoverLeaveHandler = () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      setTooltipInfo(null);
    };

    el.addEventListener('mousemove', hoverHandler);
    el.addEventListener('mouseleave', hoverLeaveHandler);

    // ---------- PTY data listener ----------
    const removeDataListener = window.electronAPI.pty.onData((id: string, data: string) => {
      if (id === tabId) {
        // Parse OSC 133 prompt markers before writing to xterm
        // OSC 133;A = prompt start, B = command start, C = command executed, D;N = finished with exit N
        let cleanData = data;

        if (data.includes('\x1b]133;')) {
          // OSC 133;A — prompt displayed, command finished
          if (data.includes('\x1b]133;A')) {
            isRunningRef.current = false;
          }
          // OSC 133;C — user pressed Enter, command is being executed
          if (data.includes('\x1b]133;C')) {
            if (commandBufferRef.current.trim()) {
              isRunningRef.current = true;
              commandStartTimeRef.current = Date.now();
              lastSubmittedCommandRef.current = commandBufferRef.current.trim();
              outputBufferRef.current = '';
            }
          }
          // OSC 133;D;N — command finished with exit code N
          const exitMatch = data.match(/\x1b\]133;D;(\d+)/);
          if (exitMatch) {
            const oscExitCode = parseInt(exitMatch[1], 10);
            const cmd = lastSubmittedCommandRef.current;
            const duration = commandStartTimeRef.current > 0 ? Date.now() - commandStartTimeRef.current : 0;

            if (cmd) {
              const activeTab = useAppStore.getState().tabs.find(t => t.id === tabId);
              useAppStore.getState().addCommandBlock(tabId, {
                command: cmd,
                output: outputBufferRef.current.slice(0, 10000),
                exitCode: oscExitCode,
                duration,
                timestamp: Date.now(),
                cwd: activeTab?.cwd || '~',
              });
            }
            updateTab(tabId, { status: oscExitCode === 0 ? 'idle' : 'error' });
            lastSubmittedCommandRef.current = '';
            isRunningRef.current = false;
          }

          // Strip OSC 133 sequences from the data before writing to xterm
          cleanData = data.replace(/\x1b\]133;[^\x07]*\x07/g, '');
        }

        xterm.write(cleanData);
        outputBufferRef.current += cleanData;
        scheduleHighlightRepaint();
      }
    });

    const removeExitListener = window.electronAPI.pty.onExit((id: string, exitCode: number) => {
      if (id === tabId) {
        updateTab(tabId, { status: exitCode === 0 ? 'idle' : 'error' });

        const cmd = lastSubmittedCommandRef.current;
        const duration = commandStartTimeRef.current > 0
          ? Date.now() - commandStartTimeRef.current
          : 0;
        const output = outputBufferRef.current;

        // Save command block
        if (cmd) {
          const activeTab = useAppStore.getState().tabs.find(t => t.id === tabId);
          useAppStore.getState().addCommandBlock(tabId, {
            command: cmd,
            output: output.slice(0, 10000), // cap at 10KB
            exitCode,
            duration,
            timestamp: Date.now(),
            cwd: activeTab?.cwd || '~',
          });

          // Write block footer line into terminal
          const xterm = xtermRef.current;
          if (xterm) {
            const durationStr = duration < 1000 ? `${duration}ms` :
              duration < 60000 ? `${(duration / 1000).toFixed(1)}s` :
              `${Math.floor(duration / 60000)}m${Math.round((duration % 60000) / 1000)}s`;

            if (exitCode === 0) {
              xterm.write(`\r\n\x1b[90m\x1b[48;2;16;16;26m \x1b[32m✓\x1b[90m ${durationStr} \x1b[0m\r\n`);
            } else {
              xterm.write(`\r\n\x1b[90m\x1b[48;2;26;16;16m \x1b[31m✗ exit ${exitCode}\x1b[90m · ${durationStr} \x1b[0m`);

              // AI error explanation prompt (if API key is configured AND AI is enabled)
              const { anthropicApiKey: apiKey, aiEnabled } = useAppStore.getState().settings;
              if (apiKey && aiEnabled) {
                xterm.write(`  \x1b[33m💡 Explain error?\x1b[0m\r\n`);

                // Store error context for the explain handler
                (window as any).__cruxLastError = {
                  command: cmd,
                  output: output.slice(-3000), // last 3KB of output
                  exitCode,
                  tabId,
                };
              } else {
                xterm.write('\r\n');
              }
            }
          }
        }

        if (exitCode !== 0) play('error');
        isRunningRef.current = false;
        lastSubmittedCommandRef.current = '';

        // SSH auto-reconnect logic
        const currentTab = useAppStore.getState().tabs.find(t => t.id === tabId);
        if (currentTab?.isSSH && currentTab.sshConnectionId) {
          const xterm = xtermRef.current;
          if (xterm) {
            xterm.write('\r\n\x1b[33m⚡ SSH connection lost.\x1b[0m\r\n');
            xterm.write('\x1b[90mAttempting to reconnect...\x1b[0m\r\n\r\n');
            updateTab(tabId, { status: 'running', process: 'reconnecting' });

            // Auto-reconnect with retry logic (3 attempts, 3s delay)
            let attempt = 0;
            const maxAttempts = 3;
            const retryDelay = 3000;

            const tryReconnect = async () => {
              attempt++;
              if (attempt > maxAttempts) {
                xterm.write(`\r\n\x1b[31m✗ Failed to reconnect after ${maxAttempts} attempts.\x1b[0m\r\n`);
                xterm.write('\x1b[90mType "reconnect" to try again.\x1b[0m\r\n');
                updateTab(tabId, { status: 'error', process: 'disconnected' });
                return;
              }

              xterm.write(`\x1b[90m  Attempt ${attempt}/${maxAttempts}...\x1b[0m\r\n`);

              try {
                const conns = await window.electronAPI.ssh.getConnections();
                const conn = conns.find((c: any) => c.id === currentTab.sshConnectionId);
                if (!conn) {
                  xterm.write('\x1b[31mConnection config not found.\x1b[0m\r\n');
                  updateTab(tabId, { status: 'error' });
                  return;
                }

                const args = await window.electronAPI.ssh.buildArgs(conn);
                await window.electronAPI.pty.create(tabId, 'ssh', undefined, args);

                // Handle password auth
                if (conn.authMethod.type === 'password') {
                  const password = await window.electronAPI.ssh.getPassword(conn.id);
                  if (password) {
                    setTimeout(() => window.electronAPI.pty.write(tabId, password + '\r'), 2500);
                  }
                }

                xterm.write(`\x1b[32m✓ Reconnected!\x1b[0m\r\n\r\n`);
                updateTab(tabId, { status: 'running', process: 'ssh' });

                // Send startup command again
                if (conn.startupCommand) {
                  const delay = conn.authMethod.type === 'password' ? 4500 : 2500;
                  setTimeout(() => window.electronAPI.pty.write(tabId, conn.startupCommand + '\r'), delay);
                }
              } catch {
                setTimeout(tryReconnect, retryDelay);
              }
            };

            setTimeout(tryReconnect, retryDelay);
          }
        }
      }
    });

    // Create PTY
    window.electronAPI.pty.create(tabId).then(() => {
      setTimeout(() => {
        doFit();
        const dims = fitAddon.proposeDimensions();
        if (dims) window.electronAPI.pty.resize(tabId, dims.cols, dims.rows);
      }, 300);
    }).catch(() => {
      xterm.write('\r\n\x1b[31mFailed to create terminal session.\x1b[0m\r\n');
    });

    // ---------- User input → PTY ----------
    xterm.onData((data: string) => {
      // Slash command activation
      if (data === '/' && commandBufferRef.current === '') {
        slashActiveRef.current = true;
        commandBufferRef.current = data;
        promptColRef.current = xterm.buffer.active.cursorX;
        xterm.write(data);
        updateSlashState(commandBufferRef.current);
        scheduleHighlightRepaint();
        return;
      }

      // Slash command mode
      if (slashActiveRef.current) {
        if (data === '\r' || data === '\n') {
          const fullSlashCommand = commandBufferRef.current;
          const trimmedSlashCommand = fullSlashCommand.trim();
          const [slashName = '', ...rest] = trimmedSlashCommand.slice(1).split(/\s+/);
          const args = rest.join(' ').trim();
          const selectedSlashCommand = slashCommands.find((cmd) => cmd.name === slashName);

          clearInlineInput(fullSlashCommand.length);
          resetInputState();
          cancelSlash();

          if (slashName === 'preview') {
            handlePreviewCommand(args);
            return;
          }

          if (slashName === 'browse' && args) {
            let url = args;
            if (/^localhost/i.test(url)) url = `http://${url}`;
            else if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
            useAppStore.getState().openPreview(url);
            return;
          }

          if (slashName === 'notebook' && args) {
            // Open markdown file as notebook in preview panel
            const activeTab = useAppStore.getState().tabs.find(t => t.id === tabId);
            const cwd = activeTab?.cwd || '~';
            window.electronAPI.file.resolve(args, { tabId, cwd }).then(resolved => {
              useAppStore.getState().openPreview(resolved);
            }).catch(() => {
              xtermRef.current?.writeln(`\r\n\x1b[31mCannot resolve path: ${args}\x1b[0m\r\n`);
            });
            return;
          }

          // Inline AI commands — /ai, /explain, /fix, /how
          if (['ai', 'explain', 'fix', 'how'].includes(slashName) && settings.aiEnabled) {
            handleInlineAI(slashName, args);
            return;
          }

          if (selectedSlashCommand) {
            setTimeout(() => selectedSlashCommand.action(), 50);
            return;
          }

          window.electronAPI.pty.write(tabId, fullSlashCommand + data);
          finalizeSubmittedInput(fullSlashCommand);
          return;
        } else if (data === '\x7f') {
          if (commandBufferRef.current.length > 1) {
            clearInlineInput(1);
            commandBufferRef.current = commandBufferRef.current.slice(0, -1);
            updateSlashState(commandBufferRef.current);
          } else {
            clearInlineInput(1);
            resetInputState();
            cancelSlash();
          }
          return;
        } else if (data === '\x1b') {
          clearInlineInput(commandBufferRef.current.length);
          resetInputState();
          cancelSlash();
          return;
        } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
          commandBufferRef.current += data;
          xterm.write(data);
          updateSlashState(commandBufferRef.current);
          scheduleHighlightRepaint();
          return;
        }

        return;
      }

      // Intercept `git commit` without -m → offer AI commit message
      if ((data === '\r' || data === '\n') && settings.aiEnabled) {
        const cmd = commandBufferRef.current.trim();
        if (/^git\s+commit\b/.test(cmd) && !cmd.includes('-m') && !cmd.includes('--message')) {
          // Don't send to PTY yet — offer AI commit message
          const xterm = xtermRef.current;
          if (xterm) {
            xterm.write('\r\n\x1b[33m\ud83d\udcdd Generate commit message?\x1b[0m\r\n');
            // Store the intent
            (window as any).__cruxPendingCommit = { tabId };
          }
          commandBufferRef.current = '';
          resetInputState();
          return;
        }
      }

      // Normal input
      window.electronAPI.pty.write(tabId, data);

      if (data === '\r' || data === '\n') {
        finalizeSubmittedInput(commandBufferRef.current);
      } else if (data === '\x7f') {
        pushUndo();
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        setAutocompleteInput(commandBufferRef.current);
        setShowAutocomplete(commandBufferRef.current.length >= 2);
        scheduleHighlightRepaint();
      } else if (isPrintableInputChunk(data)) {
        isRunningRef.current = false; // user is typing, must be at prompt
        // Record prompt end column on first character of a new command
        if (commandBufferRef.current === '') {
          promptColRef.current = xterm.buffer.active.cursorX;
        }

        pushUndo();
        commandBufferRef.current += data;
        setAutocompleteInput(commandBufferRef.current);
        setShowAutocomplete(commandBufferRef.current.length >= 2 && !slashActiveRef.current);
        scheduleHighlightRepaint();
      }
    });

    // Terminal resize
    xterm.onResize(({ cols, rows }) => {
      window.electronAPI.pty.resize(tabId, cols, rows);
      scheduleHighlightRepaint();
    });

    // No scroll handler needed — ANSI repaint is in the buffer, not an overlay

    // Window resize
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => {
      doFit();
      scheduleHighlightRepaint();
    }));
    resizeObserver.observe(el);

    // Periodically update cwd and git branch
    const cwdInterval = setInterval(async () => {
      try {
        const cwd = await window.electronAPI.pty.getCwd(tabId);
        if (cwd) {
          updateTab(tabId, { cwd });
          const branch = await window.electronAPI.git.getBranch(cwd);
          updateTab(tabId, { gitBranch: branch || undefined });
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(cwdInterval);
      resizeObserver.disconnect();
      el.removeEventListener('keydown', keydownHandler, true);
      el.removeEventListener('mouseup', mouseHandler);
      el.removeEventListener('mousemove', hoverHandler);
      el.removeEventListener('mouseleave', hoverLeaveHandler);
      el.removeEventListener('contextmenu', contextMenuHandler);
      window.removeEventListener('click', closeContextMenu);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      cancelAnimationFrame(overlayRafRef.current);
      removeDataListener();
      removeExitListener();
      xterm.dispose();
      window.electronAPI.pty.destroy(tabId);
    };
  }, [scheduleHighlightRepaint, tabId]);

  // Update font settings
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = settings.fontSize;
      xtermRef.current.options.fontFamily = `"${settings.fontFamily}", "Fira Code", "SF Mono", Menlo, monospace`;
      fitAddonRef.current?.fit();
      scheduleHighlightRepaint();
    }
  }, [scheduleHighlightRepaint, settings.fontSize, settings.fontFamily]);

  // Update terminal theme on dark/light switch
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm) return;
    if (theme === 'light') {
      xterm.options.theme = {
        background: '#F1F5F9',
        foreground: '#0F172A',
        cursor: '#1D4ED8',
        cursorAccent: '#F1F5F9',
        selectionBackground: 'rgba(37, 99, 235, 0.25)',
        selectionForeground: '#0F172A',
        black: '#94A3B8',
        red: '#B91C1C',
        green: '#15803D',
        yellow: '#A16207',
        blue: '#1D4ED8',
        magenta: '#7E22CE',
        cyan: '#0E7490',
        white: '#0F172A',
        brightBlack: '#475569',
        brightRed: '#DC2626',
        brightGreen: '#16A34A',
        brightYellow: '#CA8A04',
        brightBlue: '#2563EB',
        brightMagenta: '#9333EA',
        brightCyan: '#0891B2',
        brightWhite: '#020617',
      };
    } else {
      xterm.options.theme = {
        background: '#0A0A0F',
        foreground: '#E2E8F0',
        cursor: '#3B82F6',
        cursorAccent: '#0A0A0F',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        selectionForeground: '#E2E8F0',
        black: '#1E1E2E',
        red: '#EF4444',
        green: '#22C55E',
        yellow: '#EAB308',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#06B6D4',
        white: '#E2E8F0',
        brightBlack: '#64748B',
        brightRed: '#F87171',
        brightGreen: '#4ADE80',
        brightYellow: '#FDE047',
        brightBlue: '#60A5FA',
        brightMagenta: '#C084FC',
        brightCyan: '#22D3EE',
        brightWhite: '#F8FAFC',
      };
    }
  }, [theme]);

  const handleAcceptAutocomplete = useCallback((completion: string) => {
    window.electronAPI.pty.write(tabId, completion);
    commandBufferRef.current += completion;
    setShowAutocomplete(false);
    setAutocompleteInput('');
    scheduleHighlightRepaint();
  }, [scheduleHighlightRepaint, tabId]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={termRef}
        style={{ width: '100%', height: '100%', padding: '4px' }}
      />

      {/* Syntax highlight overlay — pixel-aligned using xterm cell dimensions */}
      {overlaySpans && overlayPos && (
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            top: overlayPos.top + 4, // +4 for termRef padding
            left: overlayPos.left + 4,
            height: overlayPos.cellH,
            lineHeight: `${overlayPos.cellH}px`,
            fontSize: settings.fontSize,
            fontFamily: `"${settings.fontFamily}", "Fira Code", "SF Mono", Menlo, monospace`,
            whiteSpace: 'pre',
            zIndex: 10,
          }}
        >
          {overlaySpans.map((span, i) => (
            <span
              key={i}
              style={
                span.color
                  ? { color: 'transparent', textShadow: `0 0 0 ${span.color}` }
                  : { color: 'transparent' }
              }
            >
              {span.text}
            </span>
          ))}
        </div>
      )}

      {/* Find bar (Cmd+F) — with regex and case-sensitive toggles */}
      {showSearch && (
        <div className="absolute top-0 right-0 z-40 flex items-center gap-1 p-2 m-2 bg-[#1E1E2E] border border-[#3E3E4E] rounded-lg shadow-xl"
             style={{ minWidth: 320 }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value;
              setSearchQuery(q);
              if (q && searchAddonRef.current) {
                const result = searchAddonRef.current.findNext(q, { regex: searchRegex, caseSensitive: searchCase, incremental: true });
                if (typeof result === 'object' && result !== null) setSearchResults(result as any);
              } else {
                searchAddonRef.current?.clearDecorations();
                setSearchResults({ resultIndex: -1, resultCount: 0 });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSearch(false);
                searchAddonRef.current?.clearDecorations();
                xtermRef.current?.focus();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                searchAddonRef.current?.findNext(searchQuery, { regex: searchRegex, caseSensitive: searchCase });
              } else if (e.key === 'Enter' && e.shiftKey) {
                searchAddonRef.current?.findPrevious(searchQuery, { regex: searchRegex, caseSensitive: searchCase });
              }
            }}
            placeholder={searchRegex ? 'Regex...' : 'Find...'}
            className="flex-1 bg-[#0A0A0F] border border-[#3E3E4E] rounded px-2 py-1 text-xs text-[#E2E8F0] outline-none focus:border-blue-500/50 font-mono"
            autoFocus
          />
          <button
            onClick={() => { setSearchRegex(r => !r); }}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${searchRegex ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[#64748B] hover:text-[#94A3B8] border border-transparent'}`}
            title="Toggle regex"
          >.*</button>
          <button
            onClick={() => { setSearchCase(c => !c); }}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${searchCase ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[#64748B] hover:text-[#94A3B8] border border-transparent'}`}
            title="Toggle case sensitive"
          >Aa</button>
          {searchResults.resultCount > 0 && (
            <span className="text-[10px] text-[#64748B] whitespace-nowrap px-1">
              {searchResults.resultIndex + 1}/{searchResults.resultCount}
            </span>
          )}
          <button
            onClick={() => searchAddonRef.current?.findPrevious(searchQuery, { regex: searchRegex, caseSensitive: searchCase })}
            className="text-xs text-[#94A3B8] hover:text-[#E2E8F0] px-1.5 py-0.5 rounded hover:bg-[#3E3E4E]"
            title="Previous (Shift+Enter)"
          >▲</button>
          <button
            onClick={() => searchAddonRef.current?.findNext(searchQuery, { regex: searchRegex, caseSensitive: searchCase })}
            className="text-xs text-[#94A3B8] hover:text-[#E2E8F0] px-1.5 py-0.5 rounded hover:bg-[#3E3E4E]"
            title="Next (Enter)"
          >▼</button>
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); searchAddonRef.current?.clearDecorations(); xtermRef.current?.focus(); }}
            className="text-xs text-[#64748B] hover:text-[#EF4444] px-1"
            title="Close (Escape)"
          >✕</button>
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1E1E2E] border border-[#3E3E4E] rounded-lg shadow-2xl py-1 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.text && !contextMenu.isPath && (
            <>
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { navigator.clipboard.writeText(contextMenu.text); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">⌘C</span> Copy
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { navigator.clipboard.readText().then(t => { if (t) window.electronAPI.pty.write(tabId, t); }); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">⌘V</span> Paste
              </button>
              <div className="border-t border-[#3E3E4E] my-1" />
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { window.electronAPI.shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(contextMenu.text)}`); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">🔍</span> Search Google
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { window.electronAPI.pty.write(tabId, contextMenu.text + '\r'); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">▶</span> Run as Command
              </button>
            </>
          )}
          {!contextMenu.text && (
            <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
              onClick={() => { navigator.clipboard.readText().then(t => { if (t) window.electronAPI.pty.write(tabId, t); }); setContextMenu(null); }}>
              <span className="text-[#64748B] w-4">⌘V</span> Paste
            </button>
          )}
          {contextMenu.isPath && (
            <>
              <div className="border-t border-[#3E3E4E] my-1" />
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { useAppStore.getState().openPreview(contextMenu.text); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">👁</span> Preview
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { window.electronAPI.shell.openPath(contextMenu.text); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">📂</span> Open in Finder
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-[#E2E8F0] hover:bg-[#3E3E4E] flex items-center gap-2"
                onClick={() => { navigator.clipboard.writeText(contextMenu.text); setContextMenu(null); }}>
                <span className="text-[#64748B] w-4">📋</span> Copy Path
              </button>
            </>
          )}
        </div>
      )}

      {/* Multi-line indicator */}
      {isMultiLineRef.current && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0D0D14]/95 border-t border-[#1E1E2E]">
            <span className="text-[9px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 py-0.5">
              multi-line
            </span>
            <div className="flex items-center gap-2 text-[9px] text-[#64748B] flex-shrink-0">
              <span>⇧↵ newline</span>
              <span>⌘Z undo</span>
            </div>
          </div>
        </div>
      )}

      {/* Legacy multi-line indicator removed — now in bottom bar */}
      {false && (
        <div className="absolute top-1 left-2 z-30 pointer-events-none">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded px-2 py-0.5 text-[9px] text-cyan-400">
            multi-line ⇧↵
          </div>
        </div>
      )}

      <Autocomplete
        currentInput={autocompleteInput}
        visible={showAutocomplete}
        onAccept={handleAcceptAutocomplete}
        tabId={tabId}
      />
      <SlashCommands
        commands={slashCommands}
        query={slashQuery}
        visible={slashVisible}
        onSelect={handleSlashSelect}
        onClose={cancelSlash}
        anchorBottom={40}
      />
      <CommandTooltip info={tooltipInfo} />
    </div>
  );
};

export default Terminal;
