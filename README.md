# 💼 Lönesystem för Tjänstemän

> PWA-app för iPhone · Följer Unionen/Almega-avtalet · Byggd av ett Claude-agentteam

[![CI/CD](https://github.com/carlgerhardsson/lonessystem/actions/workflows/main.yml/badge.svg)](https://github.com/carlgerhardsson/lonessystem/actions)
[![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-blue)](https://carlgerhardsson.github.io/lonessystem/)

## 🚀 Live App

**[→ Öppna appen](https://carlgerhardsson.github.io/lonessystem/)**

Lägg till på iPhone: Safari → Dela → "Lägg till på hemskärmen"

## 🤖 Agentteam-arkitektur

| Agent | Ansvar |
|-------|--------|
| 🎯 Orchestrator | Koordinerar, skapar issues & PRs |
| ⚙️ Backend Agent | Löneberäkningsmotor (kalkyler, skatt, pension) |
| 🎨 Frontend Agent | React PWA UI (iPhone-optimerad) |
| 🧪 Testing Agent | TDD — tester skrivs FÖRE koden |

## 📋 Funktioner

- ✅ Sjuklön & karensavdrag (dag 1–14)
- ✅ Övertid & mertid (vardag/kväll/helg)
- ✅ Semester (sammavariantsregeln)
- ✅ Skatt 2026 (Tabell 33)
- ✅ Pension ITP 1
- ✅ Export: AGI (XML), PAIN.001 (XML), SIE4 (text)
- ✅ Lokal datalagring (localStorage)
- ✅ Offline-stöd (PWA)

## 🛠 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Deploy**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🏃 Kom igång

```bash
npm install
npm run dev       # Starta dev-server
npm test          # Kör tester
npm run build     # Bygg för produktion
```

## 📐 Arkitektur

```
src/
├── engine/         ← ⚙️ Backend Agent
│   ├── calculations.ts   Alla löneberäkningar
│   ├── taxTable.ts       Skatteverkets tabell 33
│   └── exports.ts        AGI, PAIN.001, SIE4
├── store/          ← Datalagring (localStorage)
├── components/     ← 🎨 Frontend Agent
└── pages/          ← App-sidor
tests/
└── engine/         ← 🧪 Testing Agent (TDD)
```

## 📄 Licens

MIT
