// ⚙️ BACKEND AGENT — Lokal datalagring
// Hanterar all data i localStorage (version 1)
// Förberedd för API-migration (version 2)

import type { Employee, PayrollResult } from '../engine/calculations'

// ─── NYCKELKONSTANTER ────────────────────────────────────────────────────────

const KEYS = {
  EMPLOYEES: 'lonessystem:employees',
  EMPLOYER:  'lonessystem:employer',
  PAYROLL:   'lonessystem:payroll',
} as const

// ─── ARBETSGIVARINFORMATION ──────────────────────────────────────────────────

export interface Employer {
  orgNr: string
  name: string
  bankAccount: string
  taxColumn: number
}

export const getEmployer = (): Employer | null => {
  const raw = localStorage.getItem(KEYS.EMPLOYER)
  return raw ? JSON.parse(raw) : null
}

export const saveEmployer = (employer: Employer): void => {
  localStorage.setItem(KEYS.EMPLOYER, JSON.stringify(employer))
}

// ─── ANSTÄLLDA ───────────────────────────────────────────────────────────────

export const getEmployees = (): Employee[] => {
  const raw = localStorage.getItem(KEYS.EMPLOYEES)
  return raw ? JSON.parse(raw) : []
}

export const saveEmployee = (employee: Employee): void => {
  const employees = getEmployees()
  const idx = employees.findIndex(e => e.id === employee.id)
  if (idx >= 0) employees[idx] = employee
  else employees.push(employee)
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees))
}

export const deleteEmployee = (id: string): void => {
  const employees = getEmployees().filter(e => e.id !== id)
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees))
}

export const generateId = (): string =>
  `emp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// ─── LÖNEHISTORIK ────────────────────────────────────────────────────────────

export const getPayrollHistory = (): PayrollResult[] => {
  const raw = localStorage.getItem(KEYS.PAYROLL)
  return raw ? JSON.parse(raw) : []
}

export const savePayrollResult = (result: PayrollResult): void => {
  const history = getPayrollHistory()
  history.push(result)
  localStorage.setItem(KEYS.PAYROLL, JSON.stringify(history))
}

export const getPayrollForMonth = (month: string): PayrollResult[] =>
  getPayrollHistory().filter(r => r.month === month)

// ─── EXPORT-BEREDSKAP (FÖRBERED FÖR API-MIGRATION) ──────────────────────────
// I version 2 ersätts localStorage-anropen med fetch('/api/employees') etc.

export interface StorageAdapter {
  getEmployees(): Promise<Employee[]>
  saveEmployee(e: Employee): Promise<void>
  getPayrollHistory(): Promise<PayrollResult[]>
  savePayrollResult(r: PayrollResult): Promise<void>
}

// Lokal adapter (version 1)
export const localStorageAdapter: StorageAdapter = {
  getEmployees:     async () => getEmployees(),
  saveEmployee:     async (e) => saveEmployee(e),
  getPayrollHistory: async () => getPayrollHistory(),
  savePayrollResult: async (r) => savePayrollResult(r),
}
