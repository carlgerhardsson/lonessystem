// 🧪 TESTING AGENT v2 — Konfigvalidering
// LÄRDOMEN: Felaktiga konfigfiler (postcss, vite, tsconfig) kraschar bygget
// Dessa tester hade fångat postcss-buggen INNAN deploy

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const root = resolve(__dirname, '../../')

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
    'src/index.css',
    'src/engine/calculations.ts',
    'src/engine/exports.ts',
    'src/store/index.ts',
    '.github/workflows/main.yml',
    '.github/dependabot.yml',
  ]

  requiredFiles.forEach(file => {
    it(`${file} ska existera`, () => {
      expect(existsSync(resolve(root, file))).toBe(true)
    })
  })
})

// ─── PACKAGE.JSON VALIDERING ─────────────────────────────────────────────────

describe('package.json', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

  it('har ett namn', () => {
    expect(pkg.name).toBeTruthy()
  })

  it('har dev-script', () => {
    expect(pkg.scripts?.dev).toBeTruthy()
  })

  it('har build-script', () => {
    expect(pkg.scripts?.build).toBeTruthy()
  })

  it('har test-script', () => {
    expect(pkg.scripts?.test).toBeTruthy()
  })

  it('har react som dependency', () => {
    expect(pkg.dependencies?.react).toBeTruthy()
  })

  it('har vite som devDependency', () => {
    expect(pkg.devDependencies?.vite).toBeTruthy()
  })

  it('har vitest som devDependency', () => {
    expect(pkg.devDependencies?.vitest).toBeTruthy()
  })
})

// ─── POSTCSS.CONFIG.JS VALIDERING ────────────────────────────────────────────

describe('postcss.config.js', () => {
  it('innehåller tailwindcss', () => {
    const content = readFileSync(resolve(root, 'postcss.config.js'), 'utf-8')
    expect(content).toContain('tailwindcss')
  })

  it('innehåller autoprefixer', () => {
    const content = readFileSync(resolve(root, 'postcss.config.js'), 'utf-8')
    expect(content).toContain('autoprefixer')
  })

  it('innehåller inte skräpinnehåll', () => {
    const content = readFileSync(resolve(root, 'postcss.config.js'), 'utf-8')
    // Fångar den ursprungliga buggen med felaktigt innehåll
    expect(content).not.toContain('export { default } from')
    expect(content).not.toContain("export * from './export")
  })
})

// ─── VITE.CONFIG.TS VALIDERING ───────────────────────────────────────────────

describe('vite.config.ts', () => {
  it('innehåller base-path för GitHub Pages', () => {
    const content = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8')
    expect(content).toContain('base:')
    expect(content).toContain('/lonessystem/')
  })

  it('innehåller PWA-plugin', () => {
    const content = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8')
    expect(content).toContain('VitePWA')
  })
})

// ─── GITHUB ACTIONS VALIDERING ───────────────────────────────────────────────

describe('.github/workflows/main.yml', () => {
  it('innehåller test-steg', () => {
    const content = readFileSync(resolve(root, '.github/workflows/main.yml'), 'utf-8')
    expect(content).toContain('npm test')
  })

  it('innehåller build-steg', () => {
    const content = readFileSync(resolve(root, '.github/workflows/main.yml'), 'utf-8')
    expect(content).toContain('npm run build')
  })

  it('deployer till gh-pages', () => {
    const content = readFileSync(resolve(root, '.github/workflows/main.yml'), 'utf-8')
    expect(content).toContain('gh-pages')
  })

  it('kör på pushes till main', () => {
    const content = readFileSync(resolve(root, '.github/workflows/main.yml'), 'utf-8')
    expect(content).toContain('main')
  })
})

// ─── INDEX.HTML VALIDERING ───────────────────────────────────────────────────

describe('index.html', () => {
  it('har apple-mobile-web-app-capable meta-tag', () => {
    const content = readFileSync(resolve(root, 'index.html'), 'utf-8')
    expect(content).toContain('apple-mobile-web-app-capable')
  })

  it('har viewport meta-tag', () => {
    const content = readFileSync(resolve(root, 'index.html'), 'utf-8')
    expect(content).toContain('viewport')
  })

  it('laddar in src/main.tsx', () => {
    const content = readFileSync(resolve(root, 'index.html'), 'utf-8')
    expect(content).toContain('/src/main.tsx')
  })
})
