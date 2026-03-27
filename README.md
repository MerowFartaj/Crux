<p align="center">
  <img src="assets/banner.png" alt="CRUX Terminal" width="720" />
</p>

<h3 align="center">A modern, GPU-accelerated terminal for macOS.<br/>AI-native, local-first, no account required.</h3>

<p align="center">
  <a href="https://github.com/MerowFartaj/Crux/stargazers"><img src="https://img.shields.io/github/stars/MerowFartaj/Crux?style=flat-square&color=f59e0b" alt="Stars" /></a>
  <a href="https://github.com/MerowFartaj/Crux/blob/main/LICENSE"><img src="https://img.shields.io/github/license/MerowFartaj/Crux?style=flat-square&color=10b981" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-macOS-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS" />
  <img src="https://img.shields.io/badge/electron-33-47848f?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/typescript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/react-18-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 18" />
</p>

<p align="center">
  <img src="assets/screenshot.png" alt="CRUX Terminal Screenshot" width="800" />
</p>

---

## Why CRUX?

Most terminal emulators either lack modern features or lock them behind subscriptions and accounts. CRUX takes a different approach:

- **Free and open source** — No paywalls, no premium tiers, no feature gates. Everything ships for everyone.
- **No account required** — Download, open, use. Zero sign-up friction. Your terminal shouldn't need your email.
- **BYOK AI** — Bring your own API keys for OpenAI, Anthropic, Google, Ollama, or any OpenAI-compatible endpoint. Your keys stay on your machine.
- **Local-first, no telemetry** — No analytics, no tracking, no phone-home. CRUX works entirely offline when you want it to. A hard off switch for AI means full privacy when you need it.

---

## Features

### Core Terminal

- **GPU-accelerated rendering** via xterm.js WebGL renderer — buttery smooth at thousands of lines per second
- **Split panes** — vertical and horizontal, with drag-to-resize dividers
- **Tabbed sessions** with drag-to-reorder and duplicate tab support
- **Session restore** — reopen exactly where you left off after restart
- **Block-based output** — each command and its output grouped visually for easy scanning
- **Inline image rendering** — view images directly in the terminal via iTerm2 protocol support

### AI Features

- **Multi-model support** — OpenAI, Anthropic, Google Gemini, Ollama, LM Studio, and any OpenAI-compatible API
- **Inline streaming responses** — AI output streams directly into your terminal, no context switching
- **Slash commands** — `/ai`, `/fix`, `/how`, `/explain`, `/commit`, and more for quick AI interactions
- **Ghost text suggestions** — context-aware autocomplete that appears as you type, accept with Tab
- **Chat sidebar** — persistent conversation panel with full history and model switching
- **Hard off mode** — one toggle to completely disable all AI features for full privacy sessions

### File Preview Panel

- Syntax-highlighted code files with line numbers and word wrap
- JSON explorer with collapsible tree view
- Markdown rendered with full formatting
- CSV/TSV files in a sortable, filterable table view
- Image previews (PNG, JPG, SVG, GIF) with zoom
- Jupyter notebook rendering with cell outputs

### SSH Manager

- Encrypted credential storage using macOS Keychain
- Connection groups and favorites for fast access
- Auto-import from `~/.ssh/config`
- One-click connect with key-based and password authentication
- Port forwarding management

### Dropdown Terminal

- **Quake-style dropdown** — slides in from the top with a global hotkey
- Multi-monitor aware — appears on the active display
- Configurable height, animation speed, and always-on-top behavior
- Shares sessions with the main window or runs independently

### And More

- **Command palette** (`Cmd+Shift+P`) with fuzzy search across all actions
- **System pulse monitor** — CPU, memory, and network at a glance
- **tmux integration** — detects tmux sessions and provides visual controls
- **25+ slash commands** — `/theme`, `/alias`, `/snippet`, `/history`, `/export`, and many more
- **Customizable themes** — ship with a curated set, or define your own in JSON
- **Smart notifications** — get notified when long-running commands finish

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| New Tab | `Cmd + T` |
| Close Tab | `Cmd + W` |
| Split Vertically | `Cmd + D` |
| Split Horizontally | `Cmd + Shift + D` |
| Toggle Dropdown Terminal | `Ctrl + ~` |
| Command Palette | `Cmd + Shift + P` |
| Toggle AI Chat Sidebar | `Cmd + Shift + A` |
| Navigate Splits | `Cmd + Option + Arrow` |
| Toggle File Preview | `Cmd + Shift + F` |
| Search in Output | `Cmd + F` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Electron 33 |
| UI | React 18 + Tailwind CSS |
| Language | TypeScript 5.x |
| Terminal Engine | xterm.js + WebGL Renderer |
| Database | SQLite via better-sqlite3 |
| AI Integration | OpenAI SDK, Anthropic SDK, Ollama REST |
| Packaging | electron-builder |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommend using [fnm](https://github.com/Schniz/fnm) or nvm)
- **macOS** 12 Monterey or later
- **Git**

### Quick Start

```bash
# Clone the repo
git clone https://github.com/MerowFartaj/Crux.git
cd Crux/app

# Install dependencies
npm install

# Start in development mode
npm run dev
```

The app will launch in development mode with hot reload enabled. DevTools open automatically.

### Build for Production

```bash
npm run build    # Compile TypeScript + bundle with webpack
npm run package  # Package as .dmg for distribution
```

---

## Project Structure

This is a monorepo containing two projects:

```
Crux/
  app/          Electron terminal application (the product)
    src/
      main/       Main process — window management, IPC, native integrations
      renderer/   React UI — terminal views, AI chat, SSH manager, settings
      shared/     Shared types and utilities
  website/      Marketing site for cruxterminal.com (Next.js)
```

See [`website/README.md`](website/README.md) for details on running the marketing site locally.

---

## Roadmap

Planned features and improvements — contributions welcome:

- **Plugin system** — extend CRUX with community-built plugins for custom commands, themes, and integrations
- **Custom themes marketplace** — browse, share, and install themes from the community
- **Linux support** — bring CRUX to Ubuntu, Fedora, and Arch
- **Windows support** — native Windows build with ConPTY backend
- **Vim mode** — modal keybindings for terminal navigation
- **Collaborative sessions** — share a terminal session in real-time via peer-to-peer connection

---

## Contributing

We welcome contributions! See our [Contributing Guide](.github/CONTRIBUTING.md) for details on how to get started.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with love by <a href="https://github.com/MerowFartaj">Merow</a>
</p>
