# Arkitekturdokumentation — Lönesystem

## Agentteam-arkitektur

Detta projekt byggdes av ett Claude-agentteam med TDD-arbetsflöde.

### Agenter och ansvarsområden

| Agent | Branch | Ansvar |
|-------|--------|--------|
| 🎯 Orchestrator | main | Issues, PRs, kodgranskning, koordinering |
| 🧪 Testing Agent | feature/testing-agent | Skriver tester INNAN implementation (TDD) |
| ⚙️ Backend Agent | feature/backend-agent | Löneberäkningsmotor, datalagring, exportfiler |
| 🎨 Frontend Agent | feature/frontend-agent | React PWA, iPhone-UI, design system |

## Löneberäkningsmotor

Alla beräkningar körs i `src/engine/calculations.ts`.

### Modul 1: Grundlön
```
actual_salary = base_salary × employment_degree
```

### Modul 2: Sjuklön & Karensavdrag
```
sjukavdrag_per_timme = (actual_salary × 12) / (52 × weekly_hours)
sjuklön_per_timme    = sjukavdrag_per_timme × 0.80
karensavdrag         = min(sjuklön_per_timme × weekly_hours × 0.20, total_sjuklön)
```
Karensavdraget dras EN gång per sjukperiod.

### Modul 3: Övertid & Mertid
```
Mertid (deltid → heltid):  actual_salary / 175
Övertid 1 (vardag 06–20):  actual_salary / 94
Övertid 2 (kväll/helg):    actual_salary / 72
```

### Modul 4: Semester (sammavariantsregeln)
```
Semesterdagstillägg:    actual_salary × 0.008 per dag
Semesterersättning:     årsbrutto × 0.12 (vid avslut)
```

### Modul 5: Skatt 2026
- **Inkomstskatt**: Skattetabell 33 (Skatteverket), avrundas nedåt
- **Arbetsgivaravgift**: bruttolön × 31.42%

### Modul 6: Pension ITP 1
```
Gränsvärde: 50 000 SEK/mån (7.5 IBB 2026)
Nivå 1 (≤ 50 000): lön × 4.5%
Nivå 2 (> 50 000): (lön − 50 000) × 30% + 50 000 × 4.5%
```

## Dataflöde

```
Användare → App.tsx → store/index.ts (localStorage)
                    ↓
              engine/calculations.ts (beräkningar)
                    ↓
              engine/exports.ts (AGI/PAIN.001/SIE4)
```

## Exportfiler

| Format | Syfte | Standard |
|--------|-------|----------|
| AGI XML | Arbetsgivardeklaration → Skatteverket | Skatteverket |
| PAIN.001 XML | Bankfil för löneutbetalning | ISO 20022 |
| SIE4 Text | Bokföring (konto 7010/1930/2710/2730) | SIE-gruppen |

## GitHub Actions CI/CD

Varje push triggar:
1. 🧪 **Tester** (Vitest) — misslyckas = blockar merge
2. 🔒 **Säkerhetsskanning** (npm audit)
3. 🚀 **Deploy** (GitHub Pages) — bara på main-branch

## Förberedd för API-migration (v2)

`StorageAdapter`-interface i `src/store/index.ts` möjliggör enkel migration:
```typescript
// v1: localStorage
const adapter = localStorageAdapter

// v2: REST API (framtida)
const adapter = apiAdapter('https://api.lonessystem.se')
```
