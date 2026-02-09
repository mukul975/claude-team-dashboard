<div align="center">

# 🤖 Claude Agent Dashboard

### Real-Time Monitoring Dashboard for Claude Code Agent Teams

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mukul975/agentdashboard/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-58%25-F7DF1E.svg?logo=javascript&logoColor=black)](https://github.com/mukul975/agentdashboard)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101.svg?logo=socketdotio&logoColor=white)](https://github.com/mukul975/agentdashboard)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mukul975/agentdashboard/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/mukul975/agentdashboard?style=social)](https://github.com/mukul975/agentdashboard)

Monitor, track, and manage your [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) agent teams from a single, unified interface — in real time.

[**Getting Started**](#-quick-start) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**Documentation**](#-documentation) · [**Contributing**](#-contributing)

---

<!-- 🔥 PRO TIP: Add a screenshot or GIF here — repos with visuals get 2x more engagement -->
<!-- ![Claude Agent Dashboard Preview](docs/dashboard-preview.png) -->

</div>

## 🎯 The Problem

Running multiple Claude Code agents across projects gets chaotic fast. You lose track of what each agent is doing, messages between agents go unmonitored, and debugging multi-agent workflows becomes a guessing game.

**Claude Agent Dashboard** solves this by giving you a single pane of glass to observe, track, and understand everything your agent team is doing — as it happens.

> Built by a cybersecurity researcher who understands that visibility is the first line of defense — even for AI agents.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📡 **Real-Time Agent Monitoring** | Live status updates for every agent with zero-delay WebSocket streaming |
| 📋 **Task Tracking & Progress** | Visual progress bars and status indicators for all active and completed tasks |
| 💬 **Inter-Agent Communication** | Inspect message flow between agents — debug coordination issues instantly |
| 📊 **Live Activity Streams** | Chronological event feed of every agent action, decision, and output |
| 🖥️ **System Metrics** | CPU, memory, and performance monitoring for your agent infrastructure |
| 🔔 **Status Notifications** | Instant alerts on task completions, failures, and agent state changes |

> 📘 See [**FEATURES.md**](FEATURES.md) for the full feature breakdown with technical details.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mukul975/agentdashboard.git
cd agentdashboard

# Install dependencies
npm install

# Start the dashboard (launches both client & server)
npm start
```

The dashboard will be live at **http://localhost:5173**

### Using Yarn

```bash
yarn install
yarn start
```

---

## 🏗️ Architecture

```
agentdashboard/
├── src/                  # Frontend source code
│   ├── components/       # Dashboard UI components
│   ├── services/         # Agent communication & WebSocket layer
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Shared helper functions
├── docs/                 # Project documentation
├── server.js             # Backend WebSocket server
├── start.js              # Unified startup script
├── cleanup.js            # Process cleanup utility
├── vite.config.js        # Vite build configuration
├── index.html            # App entry point
├── FEATURES.md           # Detailed feature documentation
├── package.json
└── LICENSE
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **JavaScript** | Core language (58%) |
| **CSS** | Custom styling & layouts (42%) |
| **Vite** | Lightning-fast dev server & bundler |
| **WebSocket** | Real-time bidirectional agent communication |
| **Node.js** | Backend server for agent orchestration |

---

## 📖 Documentation

- [**FEATURES.md**](FEATURES.md) — Complete feature list with technical details
- [**docs/**](docs/) — Architecture guides and additional documentation

---

## 🗺️ Roadmap

- [ ] Multi-project workspace support
- [ ] Agent performance analytics with historical trends
- [ ] Custom alert rules & webhook integrations
- [ ] Dark / light theme toggle
- [ ] Task report export (PDF / CSV)
- [ ] Plugin system for custom agent visualizations
- [ ] Docker support for one-command deployment

Have a feature idea? [Open an issue →](https://github.com/mukul975/agentdashboard/issues)

---

## 🤝 Contributing

Contributions make open source incredible. Every contribution is **greatly appreciated**.

```bash
# 1. Fork the repo
# 2. Create your branch
git checkout -b feature/your-feature

# 3. Commit changes
git commit -m "feat: add your feature"

# 4. Push & open a PR
git push origin feature/your-feature
```

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 👤 Author

<table>
  <tr>
    <td>
      <strong>Mahipal Jangra</strong><br><br>
      Cybersecurity Researcher & Front-End Developer based in Berlin, Germany.<br>
      M.Sc. in Computer Science (Cybersecurity) — SRH Berlin University of Applied Sciences.<br><br>
      Research focus: AI agent vulnerabilities, Kubernetes security hardening, fraud detection, and quantum-resistant cryptography. Published with <strong>Springer</strong> and <strong>IS&T Electronic Imaging 2025</strong>.<br><br>
      Also the creator of <a href="https://github.com/mukul975/mcp-web-scrape">MCP Web Scrape</a> and <a href="https://github.com/mukul975/mcp-windows-automation">MCP Windows Server</a>.
    </td>
  </tr>
</table>

| | |
|---|---|
| 🌐 Portfolio | [mahipal.engineer](https://www.mahipal.engineer/) |
| 🔗 GitHub | [@mukul975](https://github.com/mukul975) |
| 💼 LinkedIn | [mahipal975](https://www.linkedin.com/in/mahipal975/) |
| 📸 Instagram | [@_mukul.jangra_](https://www.instagram.com/_mukul.jangra_/) |

---

## 🔗 More From the Author

| Project | Description |
|---|---|
| [**MCP Web Scrape**](https://github.com/mukul975/mcp-web-scrape) | TypeScript web scraping framework — transforms messy HTML into clean, agent-ready content via Model Context Protocol |
| [**MCP Windows Server**](https://github.com/mukul975/mcp-windows-automation) | Python automation framework — 200+ tools for AI assistants to control Windows through natural language |
| [**SK Studio**](https://www.skstudio.co.in/) | Fine art photography portfolio built with React & Vite |
| [**EmailGuard**](https://github.com/mukul975) | AI-driven phishing email detection system using 50+ features with ML & NLP |

---

<div align="center">

### ⭐ If this project helps you manage your Claude agents better, give it a star!

Built with ☕ and [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) in Berlin 🇩🇪

</div>
