// 🧪 TESTING AGENT — TDD för delete-payroll-rows (async store)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPayrollHistory,
  savePayrollResult,
  deletePayrollResult,
  savePayrollResultForMonth,
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
