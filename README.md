<p align="center">
  <img src="assets/banner.png" alt="CRUX Terminal" width="800">
</p>

<p align="center">
  <strong>A modern, GPU-accelerated terminal for macOS.<br>AI-native, local-first, no account required.</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/macOS-12%2B-black?style=flat-square&logo=apple&logoColor=white" alt="macOS"></a>
  <a href="#"><img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/MerowFartaj/Crux?style=flat-square" alt="License"></a>
  <a href="https://github.com/MerowFartaj/Crux/stargazers"><img src="https://img.shields.io/github/stars/MerowFartaj/Crux?style=flat-square" alt="Stars"></a>
</p>

<p align="center">
  <img src="assets/screenshot.png" alt="CRUX Terminal Screenshot" width="700">
</p>

---

## 🎯 Why CRUX

Most terminal apps today either charge a subscription, require an account, or phone home with your data. CRUX takes a different path:

- **Completely free** — no premium tiers, no feature gates, no trials
- **No account required** — download and go, forever
- **Bring your own AI key** — works with OpenAI, Anthropic, Google, Ollama, LM Studio, and more
- **Local-first** — zero telemetry, zero tracking, your data never leaves your machine

---

## ⚡ Features

### Core Terminal

- GPU-accelerated rendering via WebGL for buttery-smooth output
- Split panes — horizontal and vertical, infinitely nestable
- Tabs with drag-and-drop reordering
- Session persistence and restore across restarts
- Inline image rendering

### AI Assistant

- **Multi-model support** — OpenAI, Anthropic, Google, Ollama, LM Studio, and any OpenAI-compatible API
- Inline streaming responses directly in your terminal
- Slash commands: `/ai`, `/fix`, `/how`, `/explain`, `/commit`, and more
- Ghost text suggestions as you type
- **Hard off mode** — completely disable AI with one toggle for full privacy

### File Preview Panel

- Syntax-highlighted code with language detection
- JSON with collapsible tree view
- Markdown rendered preview
- CSV displayed as a sortable, filterable table
- Images and SVGs
- Jupyter notebook viewer

### SSH Manager

- AES-256 encrypted credential storage
- Connection groups and favorites
- One-click import from `~/.ssh/config`
- Multi-hop / jump host support

### Dropdown Terminal

- Quake-style slide-down terminal from the top of your screen
- Customizable global hotkey
- Multi-monitor aware
- Independent from the main window

### And More

- **Command Palette** (⌘K) — quick access to every action
- **Block-based output** — fold, copy, or pin individual command outputs
- **System Pulse** — live CPU, RAM, and disk usage monitor
- **tmux integration** — seamless session management
- **25+ built-in slash commands**
- **Customizable themes and fonts**

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| New Tab | ⌘T |
| Close Tab | ⌘W |
| Split Right | ⌘D |
| Split Down | ⌘⇧D |
| Command Palette | ⌘K |
| Toggle AI | ⌘I |
| Toggle File Preview | ⌘B |
| Toggle Dropdown Terminal | ⌘` |
| Navigate Splits | ⌘⌥←/→/↑/↓ |
| Clear Terminal | ⌘L |
| Search | ⌘F |
| Toggle Full Screen | ⌘⇧F |

---

## 🛠 Tech Stack

| Technology | Purpose |
| --- | --- |
| Electron 28 | Desktop framework |
| React 18 | UI components |
| TypeScript 5 | Type safety |
| xterm.js + WebGL | Terminal rendering |
| Tailwind CSS | Styling |
| SQLite (better-sqlite3) | Local data storage |
| Node-pty | Pseudoterminal |

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+, macOS 12+

```bash
git clone https://github.com/MerowFartaj/Crux.git
cd Crux/app
npm install
npm run dev
```

---

## 📁 Project Structure

```
Crux/
├── app/          # Electron + React terminal application
├── website/      # Next.js marketing site (cruxterminal.com)
└── README.md     # You are here
```

---

## 🗺 Roadmap

- 🔌 Plugin system and API
- 🎨 Custom theme marketplace
- 🐧 Linux support
- 🖥️ Windows support
- ✂️ Snippet manager
- 👥 Team sync (optional, local-first)

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ by <a href="https://github.com/MerowFartaj">Merow</a></p>
