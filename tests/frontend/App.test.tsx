// 🧪 Store-integrationstester — ren node, inga browser-beroenden

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getEmployees, saveEmployee, deleteEmployee, generateId,
  getEmployer, saveEmployer, getPayrollHistory, savePayrollResult,
} from '../../src/store/index'
import type { Employee } from '../../src/engine/calculations'

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
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

beforeEach(() => localStorage.clear())

describe('Anställda — CRUD', () => {
  it('returnerar tom lista', () => {
    expect(getEmployees()).toEqual([])
  })

  it('sparar och hämtar en anställd', () => {
    const emp = makeEmployee()
    saveEmployee(emp)
    expect(getEmployees()).toHaveLength(1)
    expect(getEmployees()[0].name).toBe('Anna Andersson')
  })

  it('uppdaterar befintlig anställd', () => {
    const emp = makeEmployee()
    saveEmployee(emp)
    saveEmployee({ ...emp, baseSalary: 50000 })
    expect(getEmployees()).toHaveLength(1)
    expect(getEmployees()[0].baseSalary).toBe(50000)
  })

  it('sparar flera anställda', () => {
    saveEmployee(makeEmployee({ id: 'e1', name: 'Anna' }))
    saveEmployee(makeEmployee({ id: 'e2', name: 'Björn' }))
    expect(getEmployees()).toHaveLength(2)
  })

  it('tar bort rätt anställd', () => {
    saveEmployee(makeEmployee({ id: 'e1', name: 'Behåll' }))
    saveEmployee(makeEmployee({ id: 'e2', name: 'Ta bort' }))
    deleteEmployee('e2')
    const result = getEmployees()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Behåll')
  })
})

describe('Arbetsgivare', () => {
  it('returnerar null när inget är sparat', () => {
    expect(getEmployer()).toBeNull()
  })

  it('sparar och hämtar arbetsgivarinfo', () => {
    saveEmployer({ orgNr: '556123-4567', name: 'Test AB', bankAccount: 'SE00', taxColumn: 33 })
    expect(getEmployer()?.name).toBe('Test AB')
  })
})

describe('Lönehistorik', () => {
  it('returnerar tom lista', () => {
    expect(getPayrollHistory()).toEqual([])
  })

  it('sparar löneresultat', () => {
    savePayrollResult({
      employeeId: 'e1', month: '202603',
      baseSalary: 40000, actualSalary: 40000,
      sickLeaveDeduction: 0, sickPay: 0, karensDeduction: 0,
      overtimePay: 0, extraTimePay: 0, vacationAllowance: 0,
      grossSalary: 40000, incomeTax: 8800, netSalary: 31200,
      employerFee: 12568, itp1: 1800,
    })
    expect(getPayrollHistory()).toHaveLength(1)
  })
})

describe('generateId', () => {
  it('genererar unika ID:n', () => {
    const ids = new Set(Array.from({ length: 50 }, generateId))
    expect(ids.size).toBe(50)
  })
  it('börjar med emp_', () => {
    expect(generateId()).toMatch(/^emp_/)
  })
})
