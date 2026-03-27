import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const FONT_OPTIONS = ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo'];
const ACCENT_COLORS = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
  '#22C55E', '#EAB308', '#F97316', '#EF4444',
];
const DEFAULT_DROPDOWN_SHORTCUT = 'Alt+Space';
const DROPDOWN_TEMP_DISABLED = true;

const Settings: React.FC = () => {
  const { showSettings, setShowSettings, settings, updateSettings } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  useEffect(() => {
    if (showSettings) {
      // Load settings from electron-store
      window.electronAPI.store.get('fontSize').then((v: any) => {
        if (v) updateSettings({ fontSize: v });
      });
      window.electronAPI.store.get('fontFamily').then((v: any) => {
        if (v) updateSettings({ fontFamily: v });
      });
      window.electronAPI.store.get('accentColor').then((v: any) => {
        if (v) updateSettings({ accentColor: v });
      });
      window.electronAPI.store.get('soundVolume').then((v: any) => {
        if (v !== undefined) updateSettings({ soundVolume: v });
      });
      window.electronAPI.store.get('soundMuted').then((v: any) => {
        if (v !== undefined) updateSettings({ soundMuted: v });
      });
      window.electronAPI.store.get('shell').then((v: any) => {
        if (v) updateSettings({ shell: v });
      });
      window.electronAPI.store.get('anthropicApiKey').then((v: any) => {
        if (v) {
          setApiKey(v);
          updateSettings({ anthropicApiKey: v });
        }
      });
      window.electronAPI.store.get('aiEnabled').then((v: any) => {
        if (v !== undefined) updateSettings({ aiEnabled: v });
      });
      window.electronAPI.store.get('aiProvider').then((v: any) => {
        if (v) updateSettings({ aiProvider: v });
      });
      window.electronAPI.store.get('aiModel').then((v: any) => {
        if (v) updateSettings({ aiModel: v });
      });
      window.electronAPI.store.get('openaiApiKey').then((v: any) => {
        if (v) updateSettings({ openaiApiKey: v });
      });
      window.electronAPI.store.get('commandTooltips').then((v: any) => {
        if (v !== undefined) updateSettings({ commandTooltips: v });
      });
      window.electronAPI.store.get('linkOpenBehavior').then((v: any) => {
        if (v) updateSettings({ linkOpenBehavior: v });
      });
      window.electronAPI.store.get('vibrancy').then((v: any) => {
        if (v !== undefined) updateSettings({ vibrancy: v });
      });
      window.electronAPI.store.get('fontLigatures').then((v: any) => {
        if (v !== undefined) updateSettings({ fontLigatures: v });
      });
      window.electronAPI.store.get('previewEnabled').then((v: any) => {
        if (v !== undefined) updateSettings({ previewEnabled: v });
      });
      window.electronAPI.store.get('previewClickablePaths').then((v: any) => {
        if (v !== undefined) updateSettings({ previewClickablePaths: v });
      });
      window.electronAPI.store.get('previewInlineImages').then((v: any) => {
        if (v !== undefined) updateSettings({ previewInlineImages: v });
      });
      window.electronAPI.store.get('previewHoverTooltips').then((v: any) => {
        if (v !== undefined) updateSettings({ previewHoverTooltips: v });
      });
      window.electronAPI.store.get('dropdownMode').then((v: any) => {
        if (v !== undefined) updateSettings({ dropdownMode: v });
      });
      window.electronAPI.store.get('dropdownShortcut').then((v: any) => {
        if (v !== undefined) updateSettings({ dropdownShortcut: v });
      });
      window.electronAPI.store.get('dropdownHeight').then((v: any) => {
        if (v !== undefined) updateSettings({ dropdownHeight: v });
      });
      window.electronAPI.store.get('dropdownAutoHide').then((v: any) => {
        if (v !== undefined) updateSettings({ dropdownAutoHide: v });
      });
      window.electronAPI.store.get('keepInBackground').then((v: any) => {
        if (v !== undefined) updateSettings({ keepInBackground: v });
      });
      window.electronAPI.store.get('launchAtLogin').then((v: any) => {
        if (v !== undefined) updateSettings({ launchAtLogin: v });
      });
      window.electronAPI.store.get('tmuxEnabled').then((v: any) => {
        if (v !== undefined) updateSettings({ tmuxEnabled: v });
      });
      window.electronAPI.store.get('tmuxAutoAttach').then((v: any) => {
        if (v !== undefined) updateSettings({ tmuxAutoAttach: v });
      });
      window.electronAPI.store.get('tmuxDefaultSession').then((v: any) => {
        if (v) updateSettings({ tmuxDefaultSession: v });
      });
    }
  }, [showSettings]);

  const saveSetting = (key: string, value: any) => {
    updateSettings({ [key]: value });
    window.electronAPI.store.set(key, value);
  };

  const toggleTrackClass = (enabled: boolean) =>
    `relative w-10 h-5 flex-shrink-0 overflow-hidden rounded-full transition-colors ${
      enabled ? 'bg-green-500' : 'bg-[#1E1E2E]'
    }`;

  const toggleThumbClass = (enabled: boolean) =>
    `absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
      enabled ? 'translate-x-5' : 'translate-x-0'
    }`;

  const formatShortcutLabel = (shortcut: string) => {
    if (shortcut === DEFAULT_DROPDOWN_SHORTCUT) {
      return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? 'Option+Space' : 'Alt+Space';
    }
    return shortcut;
  };

  if (!showSettings) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setShowSettings(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-crux" />
      <div
        className="settings-overlay relative w-full max-w-lg bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E] flex-shrink-0">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-[#64748B] hover:text-[#E2E8F0] transition-colors"
          >
            ×
          </button>
        </div>

        {/* All settings — single scrollable container */}
        <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#64748B] uppercase tracking-wider">
                Font Size
              </label>
              <span className="text-sm font-mono">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => saveSetting('fontSize', parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-xs text-[#64748B] uppercase tracking-wider">
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font}
                  onClick={() => saveSetting('fontFamily', font)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    settings.fontFamily === font
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-[#1E1E2E] text-[#64748B] hover:border-[#3E3E4E]'
                  }`}
                  style={{ fontFamily: `"${font}", monospace` }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-xs text-[#64748B] uppercase tracking-wider">
              Accent Color
            </label>
            <div className="flex gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => saveSetting('accentColor', color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    settings.accentColor === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12121A] scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Sound */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#64748B] uppercase tracking-wider">
                Sound Volume
              </label>
              <button
                onClick={() => saveSetting('soundMuted', !settings.soundMuted)}
                className={`text-xs px-2 py-1 rounded ${
                  settings.soundMuted
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-[#1E1E2E] text-[#64748B]'
                }`}
              >
                {settings.soundMuted ? 'Muted' : 'On'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundVolume * 100}
              onChange={(e) => saveSetting('soundVolume', parseInt(e.target.value) / 100)}
              disabled={settings.soundMuted}
              className="w-full accent-blue-500 disabled:opacity-30"
            />
          </div>

          {/* Shell */}
          <div className="space-y-2">
            <label className="text-xs text-[#64748B] uppercase tracking-wider">
              Shell
            </label>
            <div className="flex gap-2">
              {['/bin/zsh', '/bin/bash', '/usr/local/bin/fish'].map((sh) => (
                <button
                  key={sh}
                  onClick={() => saveSetting('shell', sh)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    settings.shell === sh
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-[#1E1E2E] text-[#64748B] hover:border-[#3E3E4E]'
                  }`}
                >
                  {sh.split('/').pop()}
                </button>
              ))}
            </div>
          </div>

          {/* AI Features Toggle */}
          <div className="flex items-center justify-between min-h-[32px]">
            <div>
              <span className="text-xs text-[#E2E8F0]">AI Features</span>
              <p className="text-[10px] text-[#64748B]">Error explanation, command translation, chat</p>
            </div>
	            <button
	              onClick={() => {
	                const newVal = !settings.aiEnabled;
	                updateSettings({ aiEnabled: newVal });
	                saveSetting('aiEnabled', newVal);
	              }}
	              className={toggleTrackClass(settings.aiEnabled)}
	            >
	              <span className={toggleThumbClass(settings.aiEnabled)} />
	            </button>
	          </div>

          {/* Command Hover Tooltips */}
          <div className="flex items-center justify-between min-h-[32px]">
            <div>
              <span className="text-xs text-[#E2E8F0]">Command hover tooltips</span>
              <p className="text-[10px] text-[#64748B]">Show descriptions on hover</p>
            </div>
	            <button
	              onClick={() => {
	                const newVal = !settings.commandTooltips;
	                updateSettings({ commandTooltips: newVal });
	                saveSetting('commandTooltips', newVal);
	              }}
	              className={toggleTrackClass(settings.commandTooltips)}
	            >
	              <span className={toggleThumbClass(settings.commandTooltips)} />
	            </button>
	          </div>

          {/* AI Configuration — only show when AI is enabled */}
          {settings.aiEnabled && (
          <div className="space-y-3">
            {/* Provider selector */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">AI Provider</label>
              <div className="flex gap-1">
                {(['claude', 'openai'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      saveSetting('aiProvider', p);
                      const defaultModel = p === 'claude' ? 'claude-haiku-4-5-20251001' : 'gpt-5-mini';
                      saveSetting('aiModel', defaultModel);
                    }}
                    className={`px-3 py-1.5 text-[10px] rounded-lg transition-colors ${
                      settings.aiProvider === p
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                    }`}
                  >
                    {p === 'claude' ? 'Claude (Anthropic)' : 'GPT (OpenAI)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Model picker */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Model</label>
              <div className="flex gap-1 flex-wrap">
                {(settings.aiProvider === 'claude'
                  ? [
                      { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', cost: '~$0.004/q' },
                      { id: 'claude-sonnet-4-6-20250427', name: 'Sonnet 4.6', cost: '~$0.01/q' },
                      { id: 'claude-opus-4-6-20250415', name: 'Opus 4.6', cost: '~$0.02/q' },
                    ]
                  : [
                      { id: 'gpt-5-mini', name: 'GPT-5 Mini', cost: '~$0.001/q' },
                      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', cost: '~$0.002/q' },
                    ]
                ).map(m => (
                  <button
                    key={m.id}
                    onClick={() => saveSetting('aiModel', m.id)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      settings.aiModel === m.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                    }`}
                  >
                    {m.name} <span className="text-[8px] opacity-60">{m.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Anthropic API Key */}
            {settings.aiProvider === 'claude' && (
            <div>
              <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">Anthropic API Key</label>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
                />
                <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="text-xs text-[#64748B] hover:text-[#E2E8F0] px-2">
                  {apiKeyVisible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => saveSetting('anthropicApiKey', apiKey)}
                  className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-500/20"
                >
                  Save
                </button>
              </div>
            </div>
            )}

            {/* OpenAI API Key */}
            {settings.aiProvider === 'openai' && (
            <div>
              <label className="text-[10px] text-[#64748B] uppercase tracking-wider block mb-1">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => saveSetting('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono"
                />
                <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="text-xs text-[#64748B] hover:text-[#E2E8F0] px-2">
                  {apiKeyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            )}

            <p className="text-[10px] text-[#64748B]">
              Powers error explanation, command translation, AI chat, and suggestions.
            </p>
          </div>
          )}
        </div>

        {/* Appearance */}
        <div className="p-5 border-t border-[#1E1E2E]">
          <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-medium">
            Appearance
          </label>
          <div className="mt-3 space-y-3">
            {/* Vibrancy */}
            <div className="flex items-center justify-between min-h-[32px]">
              <span className="text-xs text-[#E2E8F0]">Background vibrancy</span>
              <div className="flex gap-1">
                {[
                  { id: 'none', label: 'Off' },
                  { id: 'under-window', label: 'Light' },
                  { id: 'fullscreen-ui', label: 'Full' },
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      saveSetting('vibrancy', v.id);
                      window.electronAPI.window.setVibrancy(v.id);
                    }}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      (settings.vibrancy || 'none') === v.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                    }`}
                  >{v.label}</button>
                ))}
              </div>
            </div>
            {/* Link open behavior */}
            <div className="flex items-center justify-between min-h-[32px]">
              <span className="text-xs text-[#E2E8F0]">Open links in</span>
              <div className="flex gap-1">
                {[
                  { id: 'preview', label: 'CRUX Preview' },
                  { id: 'browser', label: 'System Browser' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => saveSetting('linkOpenBehavior', opt.id)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      (settings.linkOpenBehavior || 'preview') === opt.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            {/* Font Ligatures */}
            <div className="flex items-center justify-between min-h-[32px]">
              <div>
                <span className="text-xs text-[#E2E8F0]">Font ligatures</span>
                <p className="text-[10px] text-[#64748B]">{'=> → ≠ !== (requires restart)'}</p>
              </div>
	              <button
	                onClick={() => {
	                  const newVal = !settings.fontLigatures;
	                  updateSettings({ fontLigatures: newVal });
	                  saveSetting('fontLigatures', newVal);
	                }}
	                className={toggleTrackClass(settings.fontLigatures)}
	              >
	                <span className={toggleThumbClass(settings.fontLigatures)} />
	              </button>
	            </div>
          </div>
        </div>

        {/* File Preview */}
        <div className="p-5 border-t border-[#1E1E2E]">
          <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-medium">
            File Preview
          </label>
          <div className="mt-3 space-y-3">
            {([
              { key: 'previewEnabled', label: 'Enable preview panel' },
              { key: 'previewClickablePaths', label: 'Clickable file paths' },
              { key: 'previewInlineImages', label: 'Inline images' },
              { key: 'previewHoverTooltips', label: 'Hover preview tooltips' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between min-h-[32px]">
                <span className="text-xs text-[#E2E8F0]">{label}</span>
                <button
                  onClick={() => {
                    const newVal = !(settings as any)[key];
                    updateSettings({ [key]: newVal } as any);
                    saveSetting(key, newVal);
                  }}
                  className={toggleTrackClass((settings as any)[key])}
                >
                  <span className={toggleThumbClass((settings as any)[key])} />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-[#64748B]">
              Preview files inline with syntax highlighting, image zoom, JSON tree, and CSV tables.
              Click file paths in terminal output to preview them.
            </p>
          </div>
        </div>

        {/* Dropdown Terminal */}
        <div className="p-5 border-t border-[#1E1E2E]">
          <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-medium">
            Dropdown Terminal
          </label>
          <div className="mt-3 space-y-3">
            {/* Enable dropdown mode */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Enable dropdown mode</span>
              <button
                disabled={DROPDOWN_TEMP_DISABLED}
                onClick={() => {
                  if (DROPDOWN_TEMP_DISABLED) return;
                  const newVal = !settings.dropdownMode;
                  updateSettings({ dropdownMode: newVal });
                  saveSetting('dropdownMode', newVal);
                  window.electronAPI.dropdown.setMode(newVal);
                }}
                className={`${toggleTrackClass(settings.dropdownMode && !DROPDOWN_TEMP_DISABLED)} ${
                  DROPDOWN_TEMP_DISABLED ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <span className={toggleThumbClass(settings.dropdownMode && !DROPDOWN_TEMP_DISABLED)} />
              </button>
            </div>

            {/* Hotkey */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Global hotkey</span>
              <span className="text-xs text-[#94A3B8] bg-[#1E1E2E] px-2 py-1 rounded font-mono">
                {formatShortcutLabel(settings.dropdownShortcut || DEFAULT_DROPDOWN_SHORTCUT)}
              </span>
            </div>

            {/* Height */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Dropdown height</span>
              <div className="flex gap-1">
                {[25, 50, 75, 100].map(h => (
                  <button
                    key={h}
                    disabled={DROPDOWN_TEMP_DISABLED}
                    onClick={() => {
                      if (DROPDOWN_TEMP_DISABLED) return;
                      updateSettings({ dropdownHeight: h });
                      saveSetting('dropdownHeight', h);
                    }}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      settings.dropdownHeight === h
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2A2A3E]'
                    } ${DROPDOWN_TEMP_DISABLED ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {h}%
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-hide on focus loss */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Auto-hide on focus loss</span>
              <button
                disabled={DROPDOWN_TEMP_DISABLED}
                onClick={() => {
                  if (DROPDOWN_TEMP_DISABLED) return;
                  const newVal = !settings.dropdownAutoHide;
                  updateSettings({ dropdownAutoHide: newVal });
                  saveSetting('dropdownAutoHide', newVal);
                }}
                className={`${toggleTrackClass(settings.dropdownAutoHide && !DROPDOWN_TEMP_DISABLED)} ${
                  DROPDOWN_TEMP_DISABLED ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <span className={toggleThumbClass(settings.dropdownAutoHide && !DROPDOWN_TEMP_DISABLED)} />
              </button>
            </div>

            {/* Keep running in background */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Keep running in background</span>
              <button
                onClick={() => {
                  const newVal = !settings.keepInBackground;
                  updateSettings({ keepInBackground: newVal });
                  saveSetting('keepInBackground', newVal);
                }}
                className={toggleTrackClass(settings.keepInBackground)}
              >
                <span className={toggleThumbClass(settings.keepInBackground)} />
              </button>
            </div>

            {/* Launch at login */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Launch at login</span>
              <button
                onClick={() => {
                  const newVal = !settings.launchAtLogin;
                  updateSettings({ launchAtLogin: newVal });
                  saveSetting('launchAtLogin', newVal);
                }}
                className={toggleTrackClass(settings.launchAtLogin)}
              >
                <span className={toggleThumbClass(settings.launchAtLogin)} />
              </button>
            </div>

            <p className="text-[10px] text-[#64748B]">
              {DROPDOWN_TEMP_DISABLED
                ? 'Dropdown mode is temporarily disabled during testing so automation cannot accidentally hide the app.'
                : `Press ${formatShortcutLabel(settings.dropdownShortcut || DEFAULT_DROPDOWN_SHORTCUT)} from any app to toggle the terminal. In dropdown mode, the terminal slides down from the top of the screen.`}
            </p>
          </div>
        </div>

        {/* tmux Integration */}
        <div className="p-5 border-t border-[#1E1E2E]">
          <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-medium">
            tmux Integration
          </label>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Enable tmux</span>
              <button
                onClick={() => {
                  const newVal = !settings.tmuxEnabled;
                  updateSettings({ tmuxEnabled: newVal });
                  saveSetting('tmuxEnabled', newVal);
                }}
                className={toggleTrackClass(settings.tmuxEnabled)}
              >
                <span className={toggleThumbClass(settings.tmuxEnabled)} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E2E8F0]">Auto-attach to last session</span>
              <button
                onClick={() => {
                  const newVal = !settings.tmuxAutoAttach;
                  updateSettings({ tmuxAutoAttach: newVal });
                  saveSetting('tmuxAutoAttach', newVal);
                }}
                className={toggleTrackClass(settings.tmuxAutoAttach)}
              >
                <span className={toggleThumbClass(settings.tmuxAutoAttach)} />
              </button>
            </div>
            <div>
              <span className="text-xs text-[#E2E8F0] block mb-1">Default session name</span>
              <input
                type="text"
                value={settings.tmuxDefaultSession || 'crux'}
                onChange={(e) => {
                  updateSettings({ tmuxDefaultSession: e.target.value });
                  saveSetting('tmuxDefaultSession', e.target.value);
                }}
                className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-blue-500/50 font-mono w-full"
              />
            </div>
            <p className="text-[10px] text-[#64748B]">
              When enabled, CRUX uses tmux for session persistence and native pane management.
              Sessions survive app restarts.
            </p>
          </div>
        </div>

        {/* SSH Connections */}
        <div className="p-5 border-t border-[#1E1E2E]">
          <label className="text-xs text-[#94A3B8] uppercase tracking-wider font-medium">
            SSH Connections
          </label>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const imported = await window.electronAPI.ssh.importConfig();
                  alert(`Imported ${imported.length} connections from ~/.ssh/config`);
                }}
                className="text-[10px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#94A3B8] px-3 py-1.5 rounded-lg transition-colors"
              >
                Import ~/.ssh/config
              </button>
              <button
                onClick={async () => {
                  const json = await window.electronAPI.ssh.exportConnections();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'crux-ssh-connections.json';
                  a.click(); URL.revokeObjectURL(url);
                }}
                className="text-[10px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#94A3B8] px-3 py-1.5 rounded-lg transition-colors"
              >
                Export JSON
              </button>
            </div>
            <p className="text-[10px] text-[#64748B]">
              Manage SSH connections with Cmd+Shift+S or the /ssh command.
              Passwords are encrypted via the OS keychain.
            </p>
          </div>
        </div>

        </div>{/* close scrollable container */}

        {/* Footer */}
        <div className="p-4 border-t border-[#1E1E2E] text-center flex-shrink-0">
          <span className="text-[10px] text-[#64748B]">
            CRUX Terminal v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
