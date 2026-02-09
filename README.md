<div align="center">

<img src="docs/logo.png" alt="Claude Agent Dashboard" width="200" />

# 🤖 Claude Agent Dashboard

### Stop Flying Blind — Monitor Your Claude Code Agent Teams in Real Time

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mukul975/claude-team-dashboard/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-58%25-F7DF1E.svg?logo=javascript&logoColor=black)](https://github.com/mukul975/claude-team-dashboard)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101.svg?logo=socketdotio&logoColor=white)](https://github.com/mukul975/claude-team-dashboard)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mukul975/claude-team-dashboard/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/mukul975/claude-team-dashboard?style=social)](https://github.com/mukul975/claude-team-dashboard)

**Monitor, track, and orchestrate** your [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) agent teams from a **single, unified dashboard** — with **zero-delay WebSocket streaming**.

[**Get Started in 60 Seconds**](#-quick-start) · [**See Features**](#-features) · [**Live Demo**](#-demo) · [**Docs**](#-documentation) · [**Contributing**](#-contributing)

---

<!-- 🎬 DEMO GIF PLACEHOLDER - Add animated demo showing dashboard in action -->
<img src="docs/dashboard-demo.gif" alt="Claude Agent Dashboard Demo" width="100%" />

_Watch your agents work in real time — track tasks, monitor messages, catch errors instantly_

</div>

## 🎯 Why This Exists

### The Problem

You're running multiple Claude Code agents across projects. Suddenly, chaos:

- **Lost visibility**: Which agent is doing what? You have no idea.
- **Ghost messages**: Agents talk to each other. You can't see it.
- **Debug hell**: Something breaks. You're stuck playing detective across 5 terminal windows.
- **Task black holes**: Tasks start, disappear, maybe finish. Who knows?

**Running multi-agent workflows without monitoring is like driving blindfolded.**

### The Solution

Claude Agent Dashboard gives you **X-ray vision into your agent teams**:

✅ **See everything** — Live status, tasks, messages, system metrics
✅ **Debug faster** — Trace inter-agent communication in real time
✅ **Stay in control** — Know exactly what's happening, always
✅ **Ship with confidence** — Spot failures before they cascade

> Built by a **cybersecurity researcher** who knows that **visibility is the first line of defense** — even for AI agents.

---

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🚀 **Zero-Config Real-Time Monitoring**

Launch the dashboard with **one command**. WebSocket streaming auto-discovers agents. No configuration needed.

### 📋 **Visual Task Management**

See tasks as they flow through your agent team. **Progress bars**, status badges, dependency chains — all live-updated.

### 💬 **Inter-Agent Message Inspector**

Debug coordination issues instantly. Watch agents communicate in real time with **full message history** and **conversation threads**.

</td>
<td width="50%">

### 📊 **Live Activity Chronology**

Every agent action — **timestamped**, **color-coded**, **filterable**. Never wonder "what happened?" again.

### 🖥️ **System Performance Metrics**

Track CPU, memory, and network usage across your agent infrastructure. Catch performance bottlenecks **before** they cause failures.

### 🔔 **Smart Alerts & Notifications**

Instant desktop notifications for task completions, errors, and state changes. **Never miss critical events**.

</td>
</tr>
</table>

> 📘 **Deep dive**: See [**FEATURES.md**](FEATURES.md) for the complete feature breakdown with architecture details.

---

## 🚀 Quick Start

### ⚡ 60-Second Setup

```bash
# 1. Clone and enter
git clone https://github.com/mukul975/claude-team-dashboard.git
cd agentdashboard

# 2. Install dependencies
npm install

# 3. Launch dashboard (starts both frontend + backend)
npm start
```

**That's it.** Open **http://localhost:5173** and you're monitoring agents in real time.

### 🎁 Dev Container (Instant Environment)

Have VS Code + Docker? **Skip setup entirely**:

1. Open project in VS Code
2. Click "Reopen in Container" when prompted
3. Everything auto-installs. You're ready.

### 📦 Alternative Package Managers

```bash
# Using Yarn
yarn install && yarn start

# Using pnpm
pnpm install && pnpm start
```

### ✅ Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)

---

## 🎬 Demo

<!-- VIDEO/GIF PLACEHOLDER -->
> **🎥 Demo video coming soon** — Watch a 2-minute walkthrough of key features

**Try it yourself**: Clone the repo and run `npm start` — see your agent team in action within 60 seconds.

---

## 🏗️ How It Works

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  ├── Real-time UI components                            │
│  ├── WebSocket client                                   │
│  └── State management                                   │
└────────────────┬────────────────────────────────────────┘
                 │ WebSocket (bidirectional)
┌────────────────▼────────────────────────────────────────┐
│  Backend (Node.js + Express)                            │
│  ├── WebSocket server                                   │
│  ├── Agent event aggregation                            │
│  └── File system monitoring (chokidar)                  │
└────────────────┬────────────────────────────────────────┘
                 │ Reads agent logs
┌────────────────▼────────────────────────────────────────┐
│  Claude Code Agent Teams                                │
│  ├── ~/.claude/projects/{project}/*.jsonl               │
│  └── Real-time agent session logs                       │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
agentdashboard/
├── src/                      # Frontend source code
│   ├── components/           # React UI components
│   ├── services/             # WebSocket & API clients
│   ├── hooks/                # Custom React hooks
│   └── utils/                # Helper functions
├── .devcontainer/            # VS Code dev container config
├── .github/                  # GitHub templates & workflows
│   ├── ISSUE_TEMPLATE/       # Bug/feature issue forms
│   └── workflows/            # CI/CD pipelines
├── docs/                     # Documentation & assets
├── server.js                 # WebSocket backend server
├── start.js                  # Unified launcher script
├── cleanup.js                # Process cleanup utility
├── vite.config.js            # Vite bundler config
├── FEATURES.md               # Detailed feature list
├── CONTRIBUTING.md           # Contribution guide
└── CODE_OF_CONDUCT.md        # Community standards
```

---

## 🛠️ Built With

<table>
<tr>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br><strong>React 19.2</strong>
<br><sub>UI Framework</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js" />
<br><strong>Node.js 18+</strong>
<br><sub>Backend Runtime</sub>
</td>
<td align="center" width="25%">
<img src="https://vitejs.dev/logo.svg" width="48" height="48" alt="Vite" />
<br><strong>Vite 7.x</strong>
<br><sub>Build Tool</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="48" height="48" alt="JavaScript" />
<br><strong>JavaScript ES6+</strong>
<br><sub>Core Language</sub>
</td>
</tr>
</table>

**Core Technologies:**

- **WebSocket (ws)** — Real-time bidirectional communication
- **Express.js** — Backend API framework
- **Chokidar** — File system monitoring for agent logs
- **Lucide React** — Icon library
- **Vitest** — Unit testing framework

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [**FEATURES.md**](FEATURES.md) | Complete feature breakdown with technical architecture |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | How to contribute — setup, coding standards, PR process |
| [**CODE_OF_CONDUCT.md**](CODE_OF_CONDUCT.md) | Community guidelines and standards |
| [**docs/**](docs/) | Additional guides, architecture docs, and assets |

**Need help?** Open a [Discussion](https://github.com/mukul975/claude-team-dashboard/discussions) or check existing [Issues](https://github.com/mukul975/claude-team-dashboard/issues).

---

## 🗺️ Roadmap

### 🎯 Planned Features

- [ ] **Multi-project workspace** — Switch between multiple Claude projects in one dashboard
- [ ] **Performance analytics** — Historical charts, trends, bottleneck detection
- [ ] **Custom alerts** — Webhook integrations (Slack, Discord, email)
- [ ] **Theme switcher** — Dark/light mode with custom color schemes
- [ ] **Export reports** — PDF/CSV exports for task summaries and metrics
- [ ] **Plugin system** — Extensible architecture for custom visualizations
- [ ] **Docker deployment** — One-command containerized setup
- [ ] **Agent replay** — Rewind and replay agent sessions for debugging
- [ ] **Collaborative mode** — Share dashboards with team members

### 💡 Have an Idea?

We prioritize features based on community feedback. [**Open a feature request →**](https://github.com/mukul975/claude-team-dashboard/issues/new?template=feature_request.yml)

---

## 🤝 Contributing

We love contributions! Whether you're fixing bugs, adding features, or improving docs — **every contribution matters**.

### 🚀 Quick Contribution Guide

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/agentdashboard.git

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes & commit
git commit -m "feat: add amazing feature"

# 4. Push & create PR
git push origin feature/amazing-feature
```

**📖 Read the full guide**: [**CONTRIBUTING.md**](CONTRIBUTING.md)

### 🌟 Ways to Contribute

- 🐛 **Report bugs** — Use the [bug report template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=bug_report.yml)
- ✨ **Suggest features** — Use the [feature request template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=feature_request.yml)
- 📝 **Improve docs** — Fix typos, add examples, clarify instructions
- 🧪 **Write tests** — Increase code coverage and reliability
- 🎨 **Design improvements** — UI/UX enhancements welcome

**First time contributing?** Check out issues labeled [`good first issue`](https://github.com/mukul975/claude-team-dashboard/labels/good%20first%20issue).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**TL;DR**: Free to use, modify, and distribute. Commercial use allowed. Just keep the license notice.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mukul975/claude-team-dashboard&type=Date)](https://star-history.com/#mukul975/claude-team-dashboard&Date)

---

<div align="center">

---

### ⭐ If This Helps You — Star It!

**Starring helps others discover this project.** It takes 2 seconds and makes a huge difference.

[![GitHub stars](https://img.shields.io/github/stars/mukul975/claude-team-dashboard?style=social)](https://github.com/mukul975/claude-team-dashboard/stargazers)

---

**Built by [Mahipal](https://www.mahipal.engineer)**

_Maintained by [@mukul975](https://github.com/mukul975) — cybersecurity researcher, AI agent enthusiast_

</div>
