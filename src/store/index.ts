// ⚙️ BACKEND AGENT — Lokal datalagring
// Hanterar all data i localStorage (version 1)
// Förberedd för API-migration (version 2)

import type { Employee, PayrollResult } from '../engine/calculations'

const KEYS = {
  EMPLOYEES: 'lonessystem:employees',
  EMPLOYER:  'lonessystem:employer',
  PAYROLL:   'lonessystem:payroll',
} as const

// ─── ARBETSGIVARE ─────────────────────────────────────────────────────────────

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

// ─── ANSTÄLLDA ────────────────────────────────────────────────────────────────

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

// ─── LÖNEHISTORIK ─────────────────────────────────────────────────────────────

export const getPayrollHistory = (): PayrollResult[] => {
  const raw = localStorage.getItem(KEYS.PAYROLL)
  return raw ? JSON.parse(raw) : []
}

// Gammal funktion — bevarad för bakåtkompatibilitet
export const savePayrollResult = (result: PayrollResult): void => {
  const history = getPayrollHistory()
  history.push(result)
  localStorage.setItem(KEYS.PAYROLL, JSON.stringify(history))
}

// NY: Ersätter befintligt resultat för samma anställd+månad (dubblettskydd)
export const savePayrollResultForMonth = (result: PayrollResult): void => {
  const history = getPayrollHistory()
  const idx = history.findIndex(
    r => r.employeeId === result.employeeId && r.month === result.month
  )
  if (idx >= 0) history[idx] = result  // Ersätt befintlig
  else history.push(result)             // Lägg till ny
  localStorage.setItem(KEYS.PAYROLL, JSON.stringify(history))
}

// NY: Ta bort enskild lönespecrad
export const deletePayrollResult = (employeeId: string, month: string): void => {
  const history = getPayrollHistory().filter(
    r => !(r.employeeId === employeeId && r.month === month)
  )
  localStorage.setItem(KEYS.PAYROLL, JSON.stringify(history))
}

export const getPayrollForMonth = (month: string): PayrollResult[] =>
  getPayrollHistory().filter(r => r.month === month)

// ─── API-ADAPTER (förbered för v2) ────────────────────────────────────────────

export interface StorageAdapter {
  getEmployees(): Promise<Employee[]>
  saveEmployee(e: Employee): Promise<void>
  getPayrollHistory(): Promise<PayrollResult[]>
  savePayrollResult(r: PayrollResult): Promise<void>
}

export const localStorageAdapter: StorageAdapter = {
  getEmployees:      async () => getEmployees(),
  saveEmployee:      async (e) => saveEmployee(e),
  getPayrollHistory: async () => getPayrollHistory(),
  savePayrollResult: async (r) => savePayrollResultForMonth(r),
}
