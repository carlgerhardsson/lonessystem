// 🧪 TESTING AGENT v2 — Store-integrationstester
// Testar datalagret (localStorage) utan React-beroenden
// Dessa fångar fel i spara/hämta-logiken som drabbar användaren

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getEmployees, saveEmployee, deleteEmployee, generateId,
  getEmployer, saveEmployer, getPayrollHistory, savePayrollResult,
} from '../../src/store/index'
import type { Employee } from '../../src/engine/calculations'

// ─── HJÄLPFUNKTIONER ─────────────────────────────────────────────────────────

const makeEmployee = (overrides = {}): Employee => ({
  id: generateId(),
  name: 'Anna Andersson',
  personnummer: '19900101-1234',
  baseSalary: 40000,
  employmentDegree: 1.0,
  weeklyHours: 40,
  overtimeEligible: true,
  taxColumn: 33,
  startDate: '2024-01-01',
  ...overrides,
})

// ─── ANSTÄLLDA ────────────────────────────────────────────────────────────────

describe('Anställda — CRUD', () => {
  beforeEach(() => localStorage.clear())

  it('returnerar tom lista när inga anställda finns', () => {
    expect(getEmployees()).toEqual([])
  })

  it('sparar och hämtar en anställd', () => {
    const emp = makeEmployee()
    saveEmployee(emp)
    const result = getEmployees()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Anna Andersson')
  })

  it('uppdaterar befintlig anställd (samma id)', () => {
    const emp = makeEmployee()
    saveEmployee(emp)
    saveEmployee({ ...emp, baseSalary: 50000 })
    const result = getEmployees()
    expect(result).toHaveLength(1)
    expect(result[0].baseSalary).toBe(50000)
  })

  it('sparar flera anställda', () => {
    saveEmployee(makeEmployee({ id: 'emp-1', name: 'Anna' }))
    saveEmployee(makeEmployee({ id: 'emp-2', name: 'Björn' }))
    saveEmployee(makeEmployee({ id: 'emp-3', name: 'Cecilia' }))
    expect(getEmployees()).toHaveLength(3)
  })

  it('tar bort anställd', () => {
    const emp = makeEmployee({ id: 'emp-ta-bort' })
    saveEmployee(emp)
    deleteEmployee('emp-ta-bort')
    expect(getEmployees()).toHaveLength(0)
  })

  it('tar bara bort rätt anställd', () => {
    saveEmployee(makeEmployee({ id: 'emp-1', name: 'Behåll' }))
    saveEmployee(makeEmployee({ id: 'emp-2', name: 'Ta bort' }))
    deleteEmployee('emp-2')
    const result = getEmployees()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Behåll')
  })
})

// ─── ARBETSGIVARE ─────────────────────────────────────────────────────────────

describe('Arbetsgivare', () => {
  beforeEach(() => localStorage.clear())

  it('returnerar null när inget är sparat', () => {
    expect(getEmployer()).toBeNull()
  })

  it('sparar och hämtar arbetsgivarinformation', () => {
    saveEmployer({ orgNr: '556123-4567', name: 'Test AB', bankAccount: 'SE00', taxColumn: 33 })
    const result = getEmployer()
    expect(result?.name).toBe('Test AB')
    expect(result?.orgNr).toBe('556123-4567')
  })

  it('skriver över tidigare arbetsgivarinfo', () => {
    saveEmployer({ orgNr: '111', name: 'Gammalt AB', bankAccount: '', taxColumn: 33 })
    saveEmployer({ orgNr: '222', name: 'Nytt AB', bankAccount: '', taxColumn: 33 })
    expect(getEmployer()?.name).toBe('Nytt AB')
  })
})

// ─── LÖNEHISTORIK ─────────────────────────────────────────────────────────────

describe('Lönehistorik', () => {
  beforeEach(() => localStorage.clear())

  it('returnerar tom lista vid start', () => {
    expect(getPayrollHistory()).toEqual([])
  })

  it('sparar löneresultat', () => {
    savePayrollResult({
      employeeId: 'emp-1', month: '202603',
      baseSalary: 40000, actualSalary: 40000,
      sickLeaveDeduction: 0, sickPay: 0, karensDeduction: 0,
      overtimePay: 0, extraTimePay: 0, vacationAllowance: 0,
      grossSalary: 40000, incomeTax: 8800, netSalary: 31200,
      employerFee: 12568, itp1: 1800,
    })
    expect(getPayrollHistory()).toHaveLength(1)
  })

  it('bevarar flera löneresultat i historiken', () => {
    for (let i = 1; i <= 3; i++) {
      savePayrollResult({
        employeeId: `emp-${i}`, month: '202603',
        baseSalary: 40000, actualSalary: 40000,
        sickLeaveDeduction: 0, sickPay: 0, karensDeduction: 0,
        overtimePay: 0, extraTimePay: 0, vacationAllowance: 0,
        grossSalary: 40000, incomeTax: 8800, netSalary: 31200,
        employerFee: 12568, itp1: 1800,
      })
    }
    expect(getPayrollHistory()).toHaveLength(3)
  })
})

// ─── ID-GENERERING ────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('genererar unika ID:n', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })

  it('börjar med emp_', () => {
    expect(generateId()).toMatch(/^emp_/)
  })
})
