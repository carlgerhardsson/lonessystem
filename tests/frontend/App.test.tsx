// 🧪 TESTING AGENT v2 — Smoke tests för frontend
// Fångar render-krascher, modal-buggar och layout-problem
// LÄRDOMEN: TDD gäller hela stacken, inte bara affärslogiken

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mocka localStorage så tester inte påverkar varandra
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// Mocka lucide-react ikoner (behövs inte i jsdom)
vi.mock('lucide-react', () => ({
  Users: () => null, Calculator: () => null, FileText: () => null,
  Settings: () => null, Plus: () => null, ChevronRight: () => null,
  TrendingUp: () => null, AlertCircle: () => null, CheckCircle: () => null,
  Download: () => null, Trash2: () => null, Edit3: () => null, X: () => null,
}))

// ─── SMOKE TEST: Appen kraschar inte vid rendering ────────────────────────────

describe('App — smoke tests', () => {
  it('renderar utan att krascha', async () => {
    const { default: App } = await import('../../src/App')
    expect(() => render(<App />)).not.toThrow()
  })

  it('visar navigationsfältet med alla 5 sektioner', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    expect(screen.getByText('Hem')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('Lön')).toBeInTheDocument()
    expect(screen.getByText('Rapport')).toBeInTheDocument()
    expect(screen.getByText('Inst.')).toBeInTheDocument()
  })

  it('startar på dashboard-sidan', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    expect(screen.getByText('Översikt')).toBeInTheDocument()
  })
})

// ─── NAVIGATIONSTESTER ────────────────────────────────────────────────────────

describe('Navigation', () => {
  it('navigerar till Personal-sidan', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    expect(screen.getByText('Anställda')).toBeInTheDocument()
  })

  it('navigerar till Inställningar-sidan', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Inst.'))
    expect(screen.getByText('Inställningar')).toBeInTheDocument()
  })

  it('navigerar till Rapporter-sidan', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Rapport'))
    expect(screen.getByText('Rapporter')).toBeInTheDocument()
  })
})

// ─── MODAL-TESTER (fångar overflow-hidden-buggen) ─────────────────────────────

describe('Lägg till anställd — modal', () => {
  it('öppnar modal när + klickas på Personal-sidan', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    // Klicka på + Lägg till anställd knappen
    const addBtn = screen.getByText('+ Lägg till anställd')
    fireEvent.click(addBtn)
    expect(screen.getByText('Ny anställd')).toBeInTheDocument()
  })

  it('stänger modal när X klickas', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    fireEvent.click(screen.getByText('+ Lägg till anställd'))
    // Stäng via X-knappen
    const closeBtn = document.querySelector('[data-testid="modal-close"]') ||
      screen.getAllByRole('button').find(b => b.querySelector('svg'))
    if (closeBtn) fireEvent.click(closeBtn)
    // Modal ska vara stängd (ingen "Ny anställd" titel)
    expect(screen.queryByText('Ny anställd')).not.toBeInTheDocument()
  })

  it('kan spara en ny anställd med namn och lön', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    fireEvent.click(screen.getByText('+ Lägg till anställd'))

    // Fyll i namn
    const nameInput = screen.getByPlaceholderText('Anna Andersson')
    fireEvent.change(nameInput, { target: { value: 'Test Testsson' } })

    // Klicka Lägg till
    fireEvent.click(screen.getByText('+ Lägg till'))

    // Anställde ska synas i listan
    expect(screen.getByText('Test Testsson')).toBeInTheDocument()
  })

  it('visar felmeddelande om namn saknas', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    fireEvent.click(screen.getByText('+ Lägg till anställd'))
    // Försök spara utan namn
    fireEvent.click(screen.getByText('+ Lägg till'))
    expect(alertMock).toHaveBeenCalledWith('Ange namn på den anställde')
  })
})

// ─── LOCALSTORAGE-PERSISTENS ──────────────────────────────────────────────────

describe('Datalagring', () => {
  it('sparar anställd i localStorage', async () => {
    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    fireEvent.click(screen.getByText('+ Lägg till anställd'))
    fireEvent.change(screen.getByPlaceholderText('Anna Andersson'), { target: { value: 'Sparad Person' } })
    fireEvent.click(screen.getByText('+ Lägg till'))

    const saved = JSON.parse(localStorage.getItem('lonessystem:employees') || '[]')
    expect(saved.length).toBe(1)
    expect(saved[0].name).toBe('Sparad Person')
  })

  it('laddar anställda från localStorage vid start', async () => {
    // Förinläs data i localStorage
    localStorage.setItem('lonessystem:employees', JSON.stringify([{
      id: 'test-1', name: 'Förinstallerad Person', personnummer: '',
      baseSalary: 40000, employmentDegree: 1.0, weeklyHours: 40,
      overtimeEligible: true, taxColumn: 33, startDate: '2024-01-01'
    }]))

    const { default: App } = await import('../../src/App')
    render(<App />)
    fireEvent.click(screen.getByText('Personal'))
    expect(screen.getByText('Förinstallerad Person')).toBeInTheDocument()
  })
})
