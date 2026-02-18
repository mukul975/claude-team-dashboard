# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3](https://github.com/mukul975/agentdashboard/compare/v1.2.2...v1.2.3) (2026-02-18)

### 🐛 Bug Fixes

* fix global install: use `__dirname` in start.js so server.js and vite resolve correctly regardless of working directory

## [1.2.2](https://github.com/mukul975/agentdashboard/compare/v1.2.1...v1.2.2) (2026-02-09)

### 📚 Documentation

* remove author bio and projects section from README ([366b712](https://github.com/mukul975/agentdashboard/commit/366b712b30a72b005680ac427256124b3baeb12c))

## [1.2.1](https://github.com/mukul975/agentdashboard/compare/v1.2.0...v1.2.1) (2026-02-09)

### 🐛 Bug Fixes

* enhance path sanitization with explicit validation and CodeQL suppressions ([e463126](https://github.com/mukul975/agentdashboard/commit/e4631262a92e8529d0bd8a7f6f2ec83385c9c8c3))

## [1.2.0](https://github.com/mukul975/agentdashboard/compare/v1.1.1...v1.2.0) (2026-02-09)

### ✨ Features

* add path validation to enhance security in server.js ([85d837f](https://github.com/mukul975/agentdashboard/commit/85d837fb3ce1671139a4bbddad94ea54ba4ec094))

## [1.1.1](https://github.com/mukul975/agentdashboard/compare/v1.1.0...v1.1.1) (2026-02-09)

### ♻️ Code Refactoring

* clean up imports in LiveAgentStream, LiveMetrics, and RealTimeMessages components ([82ee1d4](https://github.com/mukul975/agentdashboard/commit/82ee1d4a18a90133a7c0928d64a9f4b53249d643))

## [1.1.0](https://github.com/mukul975/agentdashboard/compare/v1.0.2...v1.1.0) (2026-02-09)

### ✨ Features

* enhance security and logging in server.js ([9d09b48](https://github.com/mukul975/agentdashboard/commit/9d09b4801c49bb5db69e4579c2faf376c10bc142))

## [1.0.2](https://github.com/mukul975/agentdashboard/compare/v1.0.1...v1.0.2) (2026-02-09)

### 📚 Documentation

* add builder credit to README footer ([cdf8a9e](https://github.com/mukul975/agentdashboard/commit/cdf8a9ee2b4d7d297a25e99ec2fc41693c26ad87))

## [1.0.1](https://github.com/mukul975/agentdashboard/compare/v1.0.0...v1.0.1) (2026-02-09)

### 📚 Documentation

* add complete GitHub growth transformation summary ([1bed850](https://github.com/mukul975/agentdashboard/commit/1bed850aa7c851d5656b4db5377283c7dd9c7a23))
* remove docs folder and cleanup README footer ([a009f4a](https://github.com/mukul975/agentdashboard/commit/a009f4a10b9321993b8712d00cc12d51ec9f4ea0))

## 1.0.0 (2026-02-09)

### ✨ Features

* add author attribution to footer ([15271cf](https://github.com/mukul975/agentdashboard/commit/15271cf32cf88f0c2197d65e2045ae003daf45c0))
* add complete GitHub growth infrastructure ([37fc866](https://github.com/mukul975/agentdashboard/commit/37fc8660107503cc6bd50dd4f2778aa8e237254d))
* Add GitHub infrastructure and workflows ([9be467e](https://github.com/mukul975/agentdashboard/commit/9be467ebf999db3434cc0ac4195d83dc015c2d9d))
* Complete production-ready improvements ([14d705c](https://github.com/mukul975/agentdashboard/commit/14d705cdba5bed664d3773acea08e5075884ecbb))
* enhance accessibility and performance in App component ([66c7e34](https://github.com/mukul975/agentdashboard/commit/66c7e34d1af75993f86b22d69647f8d1e1b53564))
* major performance and security improvements ([5f92f89](https://github.com/mukul975/agentdashboard/commit/5f92f892752f53fee1ae40118bea463ccc0d6eb6))

### 🐛 Bug Fixes

* address minor bugs and improve code quality ([a92caf4](https://github.com/mukul975/agentdashboard/commit/a92caf4ae8c41649f42a0b23d290e6203d14017d))
* clean install to resolve rollup optional dependencies ([a88f113](https://github.com/mukul975/agentdashboard/commit/a88f113274370cdaf09cf60a1b9f705ed72dfe3f))
* disable npm cache to resolve rollup dependency issue ([9351084](https://github.com/mukul975/agentdashboard/commit/93510847c8ff94b1b96758d334c30885a906b928))
* remove Node 18 from CI matrix ([f81bf9a](https://github.com/mukul975/agentdashboard/commit/f81bf9abd1721333683488ca5b6d5270076a1677))
* remove package-lock.json from .gitignore for CI ([be05f04](https://github.com/mukul975/agentdashboard/commit/be05f04efad0b3afc1a682b699cce0c602f6599d))
* run build before tests and make tests optional ([b5a76e4](https://github.com/mukul975/agentdashboard/commit/b5a76e4967fb971a8ea8190323bb6512691ded49))
* run npm install after npm ci to fix rollup dependencies ([97cc7eb](https://github.com/mukul975/agentdashboard/commit/97cc7eb052a8a8a507e502681ff87e7a10a65c19))
* use dayjs instead of date-fns in ActivityFeed ([4b53bab](https://github.com/mukul975/agentdashboard/commit/4b53bab690d5022a27a408c978e4509cd8473f2e))
* use npm ci --force for rollup optional dependencies ([7544e83](https://github.com/mukul975/agentdashboard/commit/7544e830f3ee04c6595f435c9293f901ede53d52))

### 📚 Documentation

* update CONTRIBUTING.md and README.md for improved clarity and structure ([6b56499](https://github.com/mukul975/agentdashboard/commit/6b564992631ea45adfe9596b2b5d345509662cdd))
