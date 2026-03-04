# 🤖 AGENTS.md — Agentteamets minne

Dokumenterar arkitektur, beslut och lärdomar så varje ny session startar informerat.
Uppdateras av agentteamet vid varje större förändring.

---

## Projektöversikt

**Produkt:** Lönesystem PWA för småföretag enligt tjänstemannaavtalet (Unionen/Almega)
**Live:** https://carlgerhardsson.github.io/lonessystem/
**Stack:** React + Vite + TypeScript + Tailwind CSS + Vitest
**Lagring:** localStorage (v1) — förberedd för API-migration (v2)
**Target:** iPhone via Safari PWA (Add to Home Screen)

---

## Agentroller

| Agent | Ansvar |
|-------|--------|
| 🧪 Testing Agent | Skriver tester INNAN implementation (TDD). Ansvarar för att CI är grön. |
| ⚙️ Backend Agent | `src/engine/` och `src/store/` — löneberäkningar och datalagring |
| 🎨 Frontend Agent | `src/App.tsx` — UI, navigation, modaler |
| 🚀 DevOps Agent | `.github/workflows/` — CI/CD-pipeline och deployment |
| 🔍 Reviewer Agent | Kodgranskning på PRs via @claude-kommentarer |
| 🎯 Orchestrator | Koordinerar agenter, skapar branches, mergar PRs |

---

## Arkitektur

```
src/
  engine/
    calculations.ts   — Alla löneformler (tjänstemannaavtalet)
    exports.ts        — AGI (XML), PAIN.001 (XML), SIE4 (text)
  store/
    index.ts          — localStorage CRUD + StorageAdapter (API-redo)
  App.tsx             — Hela UI:t (single-file React)
  main.tsx            — Entry point

tests/
  engine/             — Löneberäkningsformler (19 tester)
  store/              — CRUD + dubblettskydd (12 tester)
  frontend/           — Store-integrationstester
  config/             — Konfigvalidering (11 tester)
  setup.ts            — localStorage-mock för node-miljö
```

---

## CI/CD-pipeline (5 steg)

```
validate → test ──┐
         → build-check ──→ deploy
         → security (blockerar ej)
```

1. **validate** — kontrollerar att kritiska filer finns + postcss-innehåll
2. **test** — kör alla 36+ vitest-tester
3. **build-check** — `tsc --noEmit` + `npm run build` + verifierar dist/
4. **security** — `npm audit` (continue-on-error)
5. **deploy** — JamesIves/github-pages-deploy-action → gh-pages branch

---

## Viktiga beslut och lärdomar

### Testmiljö
- Vitest kör i `node`-miljö (inte jsdom) — React-komponenttester undviks
- `tsconfig.json` inkluderar bara `src/` — `tsconfig.test.json` ärver och lägger till `tests/`
- localStorage mockas i `tests/setup.ts`

### Datalagring
- Nyckelformat: `lonessystem:employees`, `lonessystem:employer`, `lonessystem:payroll`
- `savePayrollResultForMonth` ersätter befintlig rad (dubblettskydd) — en anställd kan bara ha EN lönespec per månad
- `deletePayrollResult(employeeId, month)` tar bort enskild rad

### Kända begränsningar (v1)
- Ingen validering av personnummerformat (kritiskt för AGI-export)
- Export-tester (AGI/PAIN/SIE4) saknas
- Ingen historikvy per anställd (under utveckling)
- Skattetabell 33 är approximation — bör ersättas med exakt Skatteverket-tabell

### Dependabot-status
- Vite 5→7: **ignoreras** (major versionshopp, breaking changes)
- vite-plugin-pwa 0.20→1.2: **ignoreras** (major versionshopp)

### npm cache
- Inget `package-lock.json` i repot → `cache: 'npm'` i workflow är borttaget
- Använd `npm install` (inte `npm ci`) i alla workflow-steg

---

## Arbetsflöde

1. Ny feature → skapa branch `feature/namn`
2. Testing Agent skriver tester först
3. Backend/Frontend Agent implementerar
4. PR skapas → CI måste vara grön
5. Reviewer Agent (@claude) granskar om komplex logik
6. Merge → auto-deploy

---

## Nästa planerade features (prioritetsordning)

- [x] Historikvy per anställd
- [ ] Reviewer Agent-flöde aktivt
- [ ] Branch protection + auto-merge
- [ ] PDF-lönespecifikation
- [ ] Export-tester (AGI/PAIN/SIE4)
- [ ] Validering av personnummer
