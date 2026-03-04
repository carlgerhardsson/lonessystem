// 🧪 TESTING AGENT — TDD för delete-payroll-rows
// Skrivna INNAN implementation enligt TDD-principen
// Täcker: ta bort enskild rad, dubblettskydd, UI-knapp

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
  it('tar bort lönespecrad för specifik anställd och månad', () => {
    savePayrollResult(makeResult('emp-1', '202603'))
    savePayrollResult(makeResult('emp-2', '202603'))
    deletePayrollResult('emp-1', '202603')
    const history = getPayrollHistory()
    expect(history).toHaveLength(1)
    expect(history[0].employeeId).toBe('emp-2')
  })

  it('tar bara bort rätt månad — andra månader bevaras', () => {
    savePayrollResult(makeResult('emp-1', '202603'))
    savePayrollResult(makeResult('emp-1', '202604'))
    deletePayrollResult('emp-1', '202603')
    const history = getPayrollHistory()
    expect(history).toHaveLength(1)
    expect(history[0].month).toBe('202604')
  })

  it('gör ingenting om raden inte finns', () => {
    savePayrollResult(makeResult('emp-1', '202603'))
    deletePayrollResult('emp-99', '202603')
    expect(getPayrollHistory()).toHaveLength(1)
  })
})

// ─── DUBBLETTSKYDD — ersätt istället för att lägga till ──────────────────────

describe('savePayrollResultForMonth (dubblettskydd)', () => {
  it('ersätter befintligt resultat för samma anställd+månad', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202603', 30000))
    savePayrollResultForMonth(makeResult('emp-1', '202603', 35000))
    const history = getPayrollHistory()
    // Ska bara finnas EN rad, inte två
    expect(history).toHaveLength(1)
    expect(history[0].netSalary).toBe(35000)
  })

  it('lägger till ny rad om kombination anställd+månad inte finns', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202603'))
    savePayrollResultForMonth(makeResult('emp-2', '202603'))
    expect(getPayrollHistory()).toHaveLength(2)
  })

  it('olika månader ger separata rader', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202603'))
    savePayrollResultForMonth(makeResult('emp-1', '202604'))
    expect(getPayrollHistory()).toHaveLength(2)
  })
})
