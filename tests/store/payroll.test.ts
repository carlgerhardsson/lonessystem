// 🧪 TESTING AGENT — TDD för delete-payroll-rows (async store)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPayrollHistory,
  savePayrollResult,
  deletePayrollResult,
  savePayrollResultForMonth,
  savePayrollResultsForMonth,
} from '../../src/store/index'

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
})

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
// Reproduktion av buggen: radera lönespec för en anställd, kör om lön
// för ALLA anställda parallellt med Promise.all → race condition skriver
// över resultaten så bara en anställds spec syns efteråt.

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
    // Steg 1: kör lön för två anställda
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    expect(await getPayrollHistory()).toHaveLength(2)

    // Steg 2: radera emp-1:s spec (som användaren gör i appen)
    await deletePayrollResult('emp-1', '202603')
    expect(await getPayrollHistory()).toHaveLength(1)

    // Steg 3: kör om lön för BÅDA — emp-1 ska komma tillbaka
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 26000),
      makeResult('emp-2', '202603', 31000),
    ])
    const final = await getPayrollHistory()

    // Kritiskt: BÅDA ska finnas, ingen ska saknas
    expect(final).toHaveLength(2)
    expect(final.find(r => r.employeeId === 'emp-1')?.netSalary).toBe(26000)
    expect(final.find(r => r.employeeId === 'emp-2')?.netSalary).toBe(31000)
  })

  it('ersätter befintliga rader för samma månad atomiskt', async () => {
    // Första lönekörningen
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    // Andra lönekörningen med uppdaterade värden
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
    // Historisk data från februari
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202602', 24000),
      makeResult('emp-2', '202602', 29000),
    ])
    // Mars-lönekörning ska inte ta bort februari
    await savePayrollResultsForMonth([
      makeResult('emp-1', '202603', 25000),
      makeResult('emp-2', '202603', 30000),
    ])
    const history = await getPayrollHistory()
    expect(history).toHaveLength(4)
    expect(history.filter(r => r.month === '202602')).toHaveLength(2)
    expect(history.filter(r => r.month === '202603')).toHaveLength(2)
  })
})
