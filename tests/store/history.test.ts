// 🧪 TESTING AGENT — TDD för historikvy per anställd
// Skrivna INNAN implementation

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPayrollHistory, savePayrollResultForMonth,
  getPayrollForEmployee, getPayrollForMonth,
} from '../../src/store/index'

const makeResult = (employeeId: string, month: string, net = 30000) => ({
  employeeId, month,
  baseSalary: 40000, actualSalary: 40000,
  sickLeaveDeduction: 0, sickPay: 0, karensDeduction: 0,
  overtimePay: 0, extraTimePay: 0, vacationAllowance: 0,
  grossSalary: 40000, incomeTax: 10000, netSalary: net,
  employerFee: 12568, itp1: 1800,
})

beforeEach(() => localStorage.clear())

// ─── HISTORIK PER ANSTÄLLD ────────────────────────────────────────────────────

describe('getPayrollForEmployee', () => {
  it('returnerar tom lista om ingen historik finns', () => {
    expect(getPayrollForEmployee('emp-1')).toEqual([])
  })

  it('returnerar bara rader för rätt anställd', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202601'))
    savePayrollResultForMonth(makeResult('emp-1', '202602'))
    savePayrollResultForMonth(makeResult('emp-2', '202601'))
    const result = getPayrollForEmployee('emp-1')
    expect(result).toHaveLength(2)
    result.forEach(r => expect(r.employeeId).toBe('emp-1'))
  })

  it('returnerar månader i kronologisk ordning (äldst först)', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202603'))
    savePayrollResultForMonth(makeResult('emp-1', '202601'))
    savePayrollResultForMonth(makeResult('emp-1', '202602'))
    const months = getPayrollForEmployee('emp-1').map(r => r.month)
    expect(months).toEqual(['202601', '202602', '202603'])
  })

  it('visar korrekt nettolön per månad', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202601', 30000))
    savePayrollResultForMonth(makeResult('emp-1', '202602', 32000))
    const result = getPayrollForEmployee('emp-1')
    expect(result[0].netSalary).toBe(30000)
    expect(result[1].netSalary).toBe(32000)
  })
})

// ─── BEFINTLIGA FUNKTIONER PÅVERKAS INTE ─────────────────────────────────────

describe('getPayrollForMonth — opåverkad av ny funktion', () => {
  it('returnerar fortfarande rätt för en specifik månad', () => {
    savePayrollResultForMonth(makeResult('emp-1', '202603'))
    savePayrollResultForMonth(makeResult('emp-2', '202603'))
    savePayrollResultForMonth(makeResult('emp-1', '202604'))
    expect(getPayrollForMonth('202603')).toHaveLength(2)
  })
})
