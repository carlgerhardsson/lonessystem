// 🧪 TESTING AGENT v2 — Konfigvalidering
// Kontrollerar att kritiska filer finns och har rätt innehåll
// LÄRDOMEN: Felaktiga konfigfiler kraschar bygget — fånga dem tidigt

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const root = resolve(process.cwd())

// ─── KRITISKA FILER MÅSTE EXISTERA ───────────────────────────────────────────

describe('Obligatoriska projektfiler', () => {
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'src/engine/calculations.ts',
    'src/engine/exports.ts',
    'src/store/index.ts',
    '.github/workflows/main.yml',
  ]

  requiredFiles.forEach(file => {
    it(`${file} ska existera`, () => {
      expect(existsSync(resolve(root, file))).toBe(true)
    })
  })
})

// ─── PACKAGE.JSON ─────────────────────────────────────────────────────────────

describe('package.json', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

  it('har test-script', () => expect(pkg.scripts?.test).toBeTruthy())
  it('har build-script', () => expect(pkg.scripts?.build).toBeTruthy())
  it('har react som dependency', () => expect(pkg.dependencies?.react).toBeTruthy())
  it('har vite som devDependency', () => expect(pkg.devDependencies?.vite).toBeTruthy())
  it('har vitest som devDependency', () => expect(pkg.devDependencies?.vitest).toBeTruthy())
})

// ─── INGA OANVÄNDA PRODUKTIONSBEROENDEN ───────────────────────────────────────
// LÄRDOMEN: react-router-dom låg kvar oanvänt och drog in en sårbarhet i appen.
// Varje paket i "dependencies" följer med till användarna — det ska användas.

describe('Produktionsberoenden', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return /\.(tsx?|jsx?|css)$/.test(entry.name) ? [path] : []
    })

  const allSource = sourceFiles(resolve(root, 'src'))
    .map(file => readFileSync(file, 'utf-8'))
    .join('\n')

  Object.keys(pkg.dependencies ?? {}).forEach(dep => {
    it(`${dep} används i src/`, () => {
      const escaped = dep.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
      const imported = new RegExp(`from\\s+['"]${escaped}(/[^'"]*)?['"]|import\\s+['"]${escaped}(/[^'"]*)?['"]`)
      expect(imported.test(allSource)).toBe(true)
    })
  })
})

// ─── POSTCSS — fångar den ursprungliga buggen ─────────────────────────────────

describe('postcss.config.js', () => {
  const content = readFileSync(resolve(root, 'postcss.config.js'), 'utf-8')

  it('innehåller tailwindcss', () => expect(content).toContain('tailwindcss'))
  it('innehåller autoprefixer', () => expect(content).toContain('autoprefixer'))
  it('är inte tom', () => expect(content.trim().length).toBeGreaterThan(10))
})

// ─── GITHUB ACTIONS ───────────────────────────────────────────────────────────

describe('.github/workflows/main.yml', () => {
  const content = readFileSync(resolve(root, '.github/workflows/main.yml'), 'utf-8')

  it('kör tester', () => expect(content).toContain('npm test'))
  it('bygger appen', () => expect(content).toContain('npm run build'))
  it('deployer till gh-pages', () => expect(content).toContain('gh-pages'))
})
