// ⚙️ BACKEND AGENT — Lokal datalagring
// Hanterar all data i localStorage (version 1)
// Förberedd för API-migration (version 2)
// Säkerhet: känslig data krypteras med AES-GCM via Web Crypto API
//           Fallback till JSON om crypto.subtle saknas (testmiljö)

import type { Employee, PayrollResult } from '../engine/calculations'

const KEYS = {
  EMPLOYEES: 'lonessystem:employees',
  EMPLOYER:  'lonessystem:employer',
  PAYROLL:   'lonessystem:payroll',
  KEY:       'lonessystem:key',
} as const

// ─── KRYPTERING (AES-GCM via Web Crypto API) ──────────────────────────────────

const hasCrypto = (): boolean =>
  typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'

const getOrCreateKey = async (): Promise<CryptoKey> => {
  const stored = localStorage.getItem(KEYS.KEY)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const raw = await crypto.subtle.exportKey('raw', key)
  localStorage.setItem(KEYS.KEY, btoa(String.fromCharCode(...new Uint8Array(raw))))
  return key
}

const encryptData = async (data: string): Promise<string> => {
  if (!hasCrypto()) return data
  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(data)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.byteLength)
  return '__enc__' + btoa(String.fromCharCode(...combined))
}

const decryptData = async (raw: string): Promise<string> => {
  if (!raw.startsWith('__enc__')) return raw
  if (!hasCrypto()) return raw
  const encoded = raw.slice(7)
  const key = await getOrCreateKey()
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const cipher = combined.slice(12)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(plain)
}

const store = async (key: string, value: unknown): Promise<void> => {
  const encrypted = await encryptData(JSON.stringify(value))
  localStorage.setItem(key, encrypted)
}

const load = async <T>(key: string, fallback: T): Promise<T> => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const decrypted = await decryptData(raw)
    return JSON.parse(decrypted) as T
  } catch {
    try { return JSON.parse(raw) as T } catch { return fallback }
  }
}

// ─── ARBETSGIVARE ─────────────────────────────────────────────────────────────

export interface Employer {
  orgNr: string
  name: string
  bankAccount: string
  taxColumn: number
}

export const getEmployer = async (): Promise<Employer | null> =>
  load<Employer | null>(KEYS.EMPLOYER, null)

export const saveEmployer = async (employer: Employer): Promise<void> =>
  store(KEYS.EMPLOYER, employer)

// ─── ANSTÄLLDA ────────────────────────────────────────────────────────────────

export const getEmployees = async (): Promise<Employee[]> =>
  load<Employee[]>(KEYS.EMPLOYEES, [])

export const saveEmployee = async (employee: Employee): Promise<void> => {
  const employees = await getEmployees()
  const idx = employees.findIndex(e => e.id === employee.id)
  if (idx >= 0) employees[idx] = employee
  else employees.push(employee)
  await store(KEYS.EMPLOYEES, employees)
}

export const deleteEmployee = async (id: string): Promise<void> => {
  const employees = (await getEmployees()).filter(e => e.id !== id)
  await store(KEYS.EMPLOYEES, employees)
}

export const generateId = (): string =>
  `emp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// ─── LÖNEHISTORIK ─────────────────────────────────────────────────────────────

export const getPayrollHistory = async (): Promise<PayrollResult[]> =>
  load<PayrollResult[]>(KEYS.PAYROLL, [])

export const savePayrollResult = async (result: PayrollResult): Promise<void> => {
  const history = await getPayrollHistory()
  history.push(result)
  await store(KEYS.PAYROLL, history)
}

// Sparar ett enskilt resultat — ersätter om samma anställd+månad redan finns.
// OBS: Använd savePayrollResultsForMonth (plural) vid lönekörning för
// flera anställda — annars uppstår race condition med Promise.all.
export const savePayrollResultForMonth = async (result: PayrollResult): Promise<void> => {
  const history = await getPayrollHistory()
  const idx = history.findIndex(
    r => r.employeeId === result.employeeId && r.month === result.month
  )
  if (idx >= 0) history[idx] = result
  else history.push(result)
  await store(KEYS.PAYROLL, history)
}

// ─── ATOMISK BATCH-SPARNING ───────────────────────────────────────────────────
// Sparar ALLA anställdas löneresultat för en månad i ett enda localStorage-anrop.
//
// Varför detta behövs:
//   Promise.all([save(emp1), save(emp2)]) är en race condition —
//   båda läser samma lista, båda lägger till sin rad, den sista skrivningen
//   vinner och den andras resultat försvinner. Det är exakt buggen där
//   lönespecen inte dök upp efter delete + ny lönekörning.
//
// Lösning: läs listan EN gång, applicera alla ändringar, skriv EN gång.
export const savePayrollResultsForMonth = async (results: PayrollResult[]): Promise<void> => {
  if (results.length === 0) return
  const history = await getPayrollHistory()
  for (const result of results) {
    const idx = history.findIndex(
      r => r.employeeId === result.employeeId && r.month === result.month
    )
    if (idx >= 0) history[idx] = result
    else history.push(result)
  }
  await store(KEYS.PAYROLL, history)
}

export const deletePayrollResult = async (employeeId: string, month: string): Promise<void> => {
  const history = (await getPayrollHistory()).filter(
    r => !(r.employeeId === employeeId && r.month === month)
  )
  await store(KEYS.PAYROLL, history)
}

export const getPayrollForMonth = async (month: string): Promise<PayrollResult[]> =>
  (await getPayrollHistory()).filter(r => r.month === month)

export const getPayrollForEmployee = async (employeeId: string): Promise<PayrollResult[]> =>
  (await getPayrollHistory())
    .filter(r => r.employeeId === employeeId)
    .sort((a, b) => a.month.localeCompare(b.month))

// ─── API-ADAPTER (förbered för v2) ────────────────────────────────────────────

export interface StorageAdapter {
  getEmployees(): Promise<Employee[]>
  saveEmployee(e: Employee): Promise<void>
  getPayrollHistory(): Promise<PayrollResult[]>
  savePayrollResult(r: PayrollResult): Promise<void>
}

export const localStorageAdapter: StorageAdapter = {
  getEmployees:      () => getEmployees(),
  saveEmployee:      (e) => saveEmployee(e),
  getPayrollHistory: () => getPayrollHistory(),
  savePayrollResult: (r) => savePayrollResultForMonth(r),
}
