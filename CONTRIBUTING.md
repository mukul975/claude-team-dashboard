# Contributing to Claude Agent Dashboard

**Thank you for considering contributing!** Every bug report, feature request, documentation improvement, and code contribution helps make this project better.

This guide will help you get started quickly and ensure your contributions can be merged smoothly.

## 📖 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Quick Start (4 Commands)](#-quick-start-4-commands)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Commit Message Format](#-commit-message-format)
- [Pull Request Process](#-pull-request-process)
- [Reporting Bugs](#-reporting-bugs)
- [Requesting Features](#-requesting-features)

---

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We're committed to fostering an inclusive, respectful community.

**TL;DR**: Be kind, be professional, be collaborative.

---

## ⚡ Quick Start (4 Commands)

### Option 1: Production Build

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/claude-team-dashboard.git && cd claude-team-dashboard

# 2. Install dependencies
npm install

# 3. Build and start the production server
npm run build && npm start

# 4. Run tests
npm test
```

**Done!** Dashboard is running at `http://localhost:3001`.

### Option 2: Development Mode (Hot Reload)

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/claude-team-dashboard.git && cd claude-team-dashboard

# 2. Install dependencies
npm install

# 3. Start backend in one terminal
npm run server

# 4. Start frontend dev server in another terminal
npm run dev

# 5. Run tests
npm test
```

**Done!** Frontend dev server is running at `http://localhost:5173` (with hot reload).

### Option 3: Dev Container (Instant Setup)

Have VS Code + Docker? Skip everything:

1. Open project in VS Code
2. Click **"Reopen in Container"** when prompted
3. Wait for auto-install (2-3 minutes)
4. Done — environment ready

---

## 🔧 Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (bundled with Node.js)
- **Git** ([Download](https://git-scm.com/))

---

## 🔄 Development Workflow

### Branch Naming Strategy

| Branch Type | Naming Convention | Example |
|-------------|-------------------|---------|
| New feature | `feature/description` | `feature/agent-performance-charts` |
| Bug fix | `fix/description` | `fix/websocket-reconnection` |
| Documentation | `docs/description` | `docs/update-api-guide` |
| Refactoring | `refactor/description` | `refactor/component-structure` |
| Performance | `perf/description` | `perf/optimize-websocket` |

### Step-by-Step Contribution Process

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/claude-team-dashboard.git
cd claude-team-dashboard
git remote add upstream https://github.com/mukul975/claude-team-dashboard.git
```

#### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

#### 3. Make Your Changes

Follow these guidelines:

- ✅ **Write clean, readable code** — Future you will thank you
- ✅ **Follow existing code style** — Consistency matters
- ✅ **Add tests for new features** — Tests prevent regressions
- ✅ **Update documentation** — If it's not documented, it doesn't exist
- ✅ **Keep commits atomic** — One logical change per commit

#### 4. Test Your Changes

```bash
# Run tests
npm test

# Test production build
npm run build && npm run preview

# Lint code
npm run lint
```

#### 5. Commit with Conventional Commits

```bash
git add .
git commit -m "feat: add agent performance analytics"
```

See [Commit Message Format](#-commit-message-format) for details.

#### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub using our [PR template](https://github.com/mukul975/claude-team-dashboard/blob/main/.github/PULL_REQUEST_TEMPLATE.md).

## Coding Standards

### JavaScript/React

- Use functional components with hooks
- Use PropTypes for type checking
- Follow React 19.2+ best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- Use arrow functions where appropriate

### Component Structure

```javascript
import React from 'react';
import PropTypes from 'prop-types';

export function ComponentName({ prop1, prop2 }) {
  // Component logic

  return (
    // JSX
  );
}

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number
};
```

### Testing

- Write tests for all new components
- Use React Testing Library
- Test user interactions, not implementation details
- Aim for meaningful test coverage

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

---

## 📝 Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This enables automatic changelog generation and semantic versioning.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add agent performance charts` |
| `fix` | Bug fix | `fix: resolve WebSocket reconnection issue` |
| `docs` | Documentation only | `docs: update API reference` |
| `style` | Code style (formatting, semicolons) | `style: fix indentation in Dashboard.jsx` |
| `refactor` | Code refactoring (no behavior change) | `refactor: extract WebSocket logic to hook` |
| `perf` | Performance improvement | `perf: optimize task list rendering` |
| `test` | Adding/updating tests | `test: add unit tests for AgentCard` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |

### Examples

**Simple commit:**
```bash
git commit -m "feat: add dark mode toggle"
```

**Commit with body:**
```bash
git commit -m "fix: prevent WebSocket memory leak

- Close connections on component unmount
- Clear event listeners properly
- Add cleanup to useEffect hooks

Closes #42"
```

**Breaking change:**
```bash
git commit -m "feat!: restructure agent status API

BREAKING CHANGE: Agent status format changed from object to array.
See migration guide in CHANGELOG.md"
```

---

## 🐛 Reporting Bugs

Found a bug? Help us fix it!

### Before Submitting

1. **Search existing issues** — Your bug might already be reported
2. **Update to latest version** — Bug might be fixed in newer release
3. **Reproduce the bug** — Make sure it's consistent

### Submit a Bug Report

Use our [bug report template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=bug_report.yml) and include:

- **Clear title** — Describe the bug in one sentence
- **Steps to reproduce** — Detailed, numbered steps
- **Expected behavior** — What should happen?
- **Actual behavior** — What actually happens?
- **Screenshots/videos** — If applicable
- **Environment** — OS, Node version, browser, dashboard version
- **Additional context** — Anything else relevant

**Good bug report = faster fix**

---

## ✨ Requesting Features

Have an idea? We'd love to hear it!

### Before Requesting

1. **Check roadmap** — Feature might already be planned
2. **Search existing requests** — Avoid duplicates
3. **Consider scope** — Does it fit the project's vision?

### Submit a Feature Request

Use our [feature request template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=feature_request.yml) and include:

- **Problem statement** — What problem does this solve?
- **Proposed solution** — How would it work?
- **Alternatives considered** — Other approaches you thought of
- **Use cases** — Real-world scenarios
- **Mockups** — UI mockups or diagrams (if applicable)

**Tip**: Features with strong use cases get prioritized.

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Writing Tests

We use **Vitest** + **React Testing Library**. Test user behavior, not implementation details.

**Example:**

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '../AgentCard';

describe('AgentCard', () => {
  it('displays agent name and status', () => {
    render(<AgentCard name="test-agent" status="active" />);

    expect(screen.getByText('test-agent')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows error state when agent fails', () => {
    render(<AgentCard name="test-agent" status="error" error="Connection failed" />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });
});
```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] Branch is up-to-date with `main`

### PR Checklist

1. **Fill out the PR template completely**
2. **Link related issues** — Use "Closes #123" in description
3. **Request review** — Tag relevant maintainers
4. **Respond to feedback** — Address review comments promptly
5. **Keep PR focused** — One feature/fix per PR

### What Happens Next?

1. **Automated checks run** — CI/CD tests your code
2. **Maintainers review** — We'll provide feedback within 48 hours
3. **You address feedback** — Make requested changes
4. **PR gets merged** — Your contribution goes live!

**Average merge time**: 2-5 days for well-structured PRs.

---

## 💬 Questions or Need Help?

- **📖 Check docs first** — [README](README.md) | [FEATURES](FEATURES.md)
- **💬 Ask in Discussions** — [GitHub Discussions](https://github.com/mukul975/claude-team-dashboard/discussions)
- **🐛 Report bugs** — [Create an issue](https://github.com/mukul975/claude-team-dashboard/issues/new/choose)
- **🤝 Join the community** — Share your agent monitoring stories!

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the **MIT License**.

---

<div align="center">

**Thank you for making Claude Agent Dashboard better!** 🚀

Every contribution — big or small — helps developers worldwide monitor their AI agents more effectively.

[![Contributors](https://img.shields.io/github/contributors/mukul975/claude-team-dashboard)](https://github.com/mukul975/claude-team-dashboard/graphs/contributors)

</div>
