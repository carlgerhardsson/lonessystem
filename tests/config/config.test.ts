// 🧪 TESTING AGENT v2 — Konfigvalidering
// Kontrollerar att kritiska filer finns och har rätt innehåll
// LÄRDOMEN: Felaktiga konfigfiler kraschar bygget — fånga dem tidigt

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

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
