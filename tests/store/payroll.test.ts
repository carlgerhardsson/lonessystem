// 🧪 TESTING AGENT — TDD för payroll store

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPayrollHistory,
  savePayrollResult,
  saveEmployee,
  deletePayrollResult,
  savePayrollResultForMonth,
  savePayrollResultsForMonth,
} from '../../src/store/index'
import type { Employee } from '../../src/engine/calculations'

const makeResult = (employeeId: string, month: string, net = 30000) => ({
  employeeId,
  month,
  baseSalary: 40000,
  actualSalary: 40000,
  sickLeaveDeduction: 0,
  sickPay: 0,
  karensDeduction: 0,
  overtimePay: 0,
  extraTimePay: 0,
  vacationAllowance: 0,
  grossSalary: 40000,
  incomeTax: 10000,
  netSalary: net,
  employerFee: 12568,
  itp1: 1800,
  stale: false,
})

const makeEmployee = (id: string, baseSalary = 40000): Employee => ({
  id,
  name: 'Test Person',
  personnummer: '19900101-1234',
  baseSalary,
  employmentDegree: 1.0,
  weeklyHours: 40,
  overtimeEligible: true,
  taxColumn: 33,
  startDate: '2024-01-01',
})

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

beforeEach(() => localStorage.clear())

// ─── TA BORT ENSKILD LÖNESPECRAD ──────────────────────────────────────────────

describe('deletePayrollResult', () => {
  it('tar bort lönespecrad för specifik anställd och månad', async () => {
    await savePayrollResult(makeResult('emp-1', '202603'))
    await savePayrollResult(makeResult('emp-2', '202603'))
    await deletePayrollResult('emp-1', '202603')
    const history = await getPayrollHistory()
    expect(history).toHaveLength(1)
    expect(history[0].employeeId).toBe('emp-2')
  })

  it('tar bara bort rätt månad — andra månader bevaras', async () => {
    await savePayrollResult(makeResult('emp-1', '202603'))
    await savePayrollResult(makeResult('emp-1', '202604'))
    await deletePayrollResult('emp-1', '202603')
    const history = await getPayrollHistory()
    expect(history).toHaveLength(1)
    expect(history[0].month).toBe('202604')
  })

  it('gör ingenting om raden inte finns', async () => {
    await savePayrollResult(makeResult('emp-1', '202603'))
    await deletePayrollResult('emp-99', '202603')
    expect(await getPayrollHistory()).toHaveLength(1)
  })
})

// ─── DUBBLETTSKYDD ────────────────────────────────────────────────────────────

describe('savePayrollResultForMonth (dubblettskydd)', () => {
  it('ersätter befintligt resultat för samma anställd+månad', async () => {
    await savePayrollResultForMonth(makeResult('emp-1', '202603', 30000))
    await savePayrollResultForMonth(makeResult('emp-1', '202603', 35000))
    const history = await getPayrollHistory()
    expect(history).toHaveLength(1)
    expect(history[0].netSalary).toBe(35000)
  })

  it('lägger till ny rad om kombination anställd+månad inte finns', async () => {
    await savePayrollResultForMonth(makeResult('emp-1', '202603'))
    await savePayrollResultForMonth(makeResult('emp-2', '202603'))
    expect(await getPayrollHistory()).toHaveLength(2)
  })

  it('olika månader ger separata rader', async () => {
    await savePayrollResultForMonth(makeResult('emp-1', '202603'))
    await savePayrollResultForMonth(makeResult('emp-1', '202604'))
    expect(await getPayrollHistory()).toHaveLength(2)
  })
})

// ─── RACE CONDITION: PARALLELL LÖNEKÖRNING ────────────────────────────────────

describe('savePayrollResultsForMonth (atomisk batch)', () => {
  it('sparar alla anställdas resultat atomiskt — inga rader försvinner', async () => {
    const results = [
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
      makeResult('emp-3', '202603', 35000),
    ]
    await savePayrollResultsForMonth(results)
    const history = await getPayrollHistory()
    expect(history).toHaveLength(3)
    expect(history.map(r => r.employeeId).sort()).toEqual(['emp-1', 'emp-2', 'emp-3'])
  })

  it('efter delete + ny lönekörning för alla — alla syns på hemsidan', async () => {
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    await deletePayrollResult('emp-1', '202603')
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 26000),
      makeResult('emp-2', '202603', 31000),
    ])
    const final = await getPayrollHistory()
    expect(final).toHaveLength(2)
    expect(final.find(r => r.employeeId === 'emp-1')?.netSalary).toBe(26000)
    expect(final.find(r => r.employeeId === 'emp-2')?.netSalary).toBe(31000)
  })

  it('ersätter befintliga rader för samma månad atomiskt', async () => {
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 27000),
      makeResult('emp-2', '202603', 32000),
    ])
    const history = await getPayrollHistory()
    expect(history).toHaveLength(2)
    expect(history.find(r => r.employeeId === 'emp-1')?.netSalary).toBe(27000)
    expect(history.find(r => r.employeeId === 'emp-2')?.netSalary).toBe(32000)
  })

  it('bevarar historik från andra månader vid ny lönekörning', async () => {
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202602', 24000),
      makeResult('emp-2', '202602', 29000),
    ])
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    const history = await getPayrollHistory()
    expect(history).toHaveLength(4)
    expect(history.filter(r => r.month === '202602')).toHaveLength(2)
    expect(history.filter(r => r.month === '202603')).toHaveLength(2)
  })

  it('ny lönekörning rensar stale-flaggan', async () => {
    const month = currentMonth()
    // Kör lön, markera som stale, kör om → stale ska vara false
    await savePayrollResultsForMonth([makeResult('emp-1', month, 25000)])
    await savePayrollResultsForMonth([{ ...makeResult('emp-1', month, 25000), stale: true }])
    await savePayrollResultsForMonth([makeResult('emp-1', month, 27000)])
    const history = await getPayrollHistory()
    expect(history.find(r => r.employeeId === 'emp-1')?.stale).toBe(false)
  })
})

// ─── STALE-FLAGGA: LÖNEUPPDATERING ───────────────────────────────────────────
// När en anställds lön ändras ska innevarande månads lönespec markeras
// som 'stale: true' — en varning att lönekörningen behöver göras om.
// Historiska månader (< innevarande) ska aldrig påverkas.

describe('saveEmployee — märker innevarande månads spec som stale', () => {
  it('markerar innevarande månads spec som stale när lön uppdateras', async () => {
    const month = currentMonth()
    await savePayrollResultsForMonth([makeResult('emp-1', month, 30000)])

    // Uppdatera lönen
    await saveEmployee(makeEmployee('emp-1', 45000))

    const history = await getPayrollHistory()
    const spec = history.find(r => r.employeeId === 'emp-1' && r.month === month)
    expect(spec?.stale).toBe(true)
  })

  it('påverkar INTE historiska månader', async () => {
    const month = currentMonth()
    await savePayrollResultsForMonth([makeResult('emp-1', '202601', 28000)])
    await savePayrollResultsForMonth([makeResult('emp-1', month, 30000)])

    await saveEmployee(makeEmployee('emp-1', 45000))

    const history = await getPayrollHistory()
    const historisk = history.find(r => r.employeeId === 'emp-1' && r.month === '202601')
    expect(historisk?.stale).toBeFalsy() // historisk månad rörs ej
  })

  it('gör ingenting om det inte finns någon spec för innevarande månad', async () => {
    // Bara historisk data — ingen innevarande spec
    await savePayrollResultsForMonth([makeResult('emp-1', '202601', 28000)])
    await saveEmployee(makeEmployee('emp-1', 45000))
    const history = await getPayrollHistory()
    expect(history.every(r => !r.stale)).toBe(true)
  })

  it('spec utan lönändring (samma lön) markeras inte som stale', async () => {
    const month = currentMonth()
    await savePayrollResultsForMonth([makeResult('emp-1', month, 30000)])
    // Spara anställd med samma lön som spec:en
    await saveEmployee(makeEmployee('emp-1', 40000)) // 40000 matchar makeResult default
    const history = await getPayrollHistory()
    const spec = history.find(r => r.employeeId === 'emp-1' && r.month === month)
    expect(spec?.stale).toBeFalsy()
  })
})
