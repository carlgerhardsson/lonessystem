// 🧪 TESTING AGENT — TDD
// Dessa tester skrivs INNAN implementationen (Test-Driven Development)
// Backend Agent implementerar koden tills dessa tester blir gröna ✅

import { describe, it, expect } from 'vitest'
import {
  calculateActualSalary,
  calculateSickLeave,
  calculateOvertime,
  calculateVacation,
  calculateTax,
  calculateEmployerFee,
  calculateITP1,
} from '../../src/engine/calculations'

// ─── MODUL 1: GRUNDLÖN ─────────────────────────────────────────────────────

describe('Grundlön', () => {
  it('räknar ut faktisk lön vid 100% tjänst', () => {
    expect(calculateActualSalary(40000, 1.0)).toBe(40000)
  })

  it('räknar ut faktisk lön vid 75% tjänst', () => {
    expect(calculateActualSalary(40000, 0.75)).toBe(30000)
  })

  it('räknar ut faktisk lön vid 50% tjänst', () => {
    expect(calculateActualSalary(50000, 0.5)).toBe(25000)
  })
})

// ─── MODUL 2: SJUKLÖN OCH KARENSAVDRAG ────────────────────────────────────

describe('Sjuklön och karensavdrag', () => {
  const employee = {
    actualSalary: 40000,
    weeklyHours: 40,
  }

  it('beräknar sjukavdrag per timme korrekt', () => {
    const result = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, true)
    // (40000 * 12) / (52 * 40) = 230.77 kr/timme
    const expectedHourlyRate = (40000 * 12) / (52 * 40)
    expect(result.hourlyDeduction).toBeCloseTo(expectedHourlyRate, 1)
  })

  it('beräknar sjuklön per timme (80% av sjukavdrag)', () => {
    const result = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, true)
    const expectedHourlyRate = (40000 * 12) / (52 * 40)
    expect(result.hourlySickPay).toBeCloseTo(expectedHourlyRate * 0.8, 1)
  })

  it('drar av karensavdrag vid första sjukdagen', () => {
    const result = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, true)
    expect(result.karensDeduction).toBeGreaterThan(0)
  })

  it('karensavdraget får inte överstiga utbetald sjuklön', () => {
    // Karensavdrag = sjuklön per timme * veckotimmar * 0.20
    const result = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, true)
    expect(result.karensDeduction).toBeLessThanOrEqual(result.totalSickPay)
  })

  it('karensavdraget dras bara en gång per sjukperiod', () => {
    const day1 = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, true)
    const day2 = calculateSickLeave(employee.actualSalary, employee.weeklyHours, 1, false)
    expect(day1.karensDeduction).toBeGreaterThan(0)
    expect(day2.karensDeduction).toBe(0)
  })
})

// ─── MODUL 3: ÖVERTID OCH MERTID ───────────────────────────────────────────

describe('Övertid och mertid', () => {
  const actualSalary = 40000

  it('beräknar mertid (deltid upp till heltid)', () => {
    const result = calculateOvertime(actualSalary, 'extra')
    expect(result).toBeCloseTo(40000 / 175, 2)
  })

  it('beräknar övertid 1 (vardag 06–20)', () => {
    const result = calculateOvertime(actualSalary, 'overtime1')
    expect(result).toBeCloseTo(40000 / 94, 2)
  })

  it('beräknar övertid 2 (kväll/helg)', () => {
    const result = calculateOvertime(actualSalary, 'overtime2')
    expect(result).toBeCloseTo(40000 / 72, 2)
  })

  it('returnerar 0 om inte övertidsberättigad', () => {
    const result = calculateOvertime(actualSalary, 'overtime1', false)
    expect(result).toBe(0)
  })
})

// ─── MODUL 4: SEMESTER ─────────────────────────────────────────────────────

describe('Semester (sammavariantsregeln)', () => {
  it('beräknar semesterdagstillägg', () => {
    const result = calculateVacation(40000, 5)
    // 40000 * 0.008 * 5 dagar = 1600 kr
    expect(result.dailyAllowance).toBeCloseTo(40000 * 0.008, 2)
    expect(result.totalAllowance).toBeCloseTo(40000 * 0.008 * 5, 2)
  })

  it('beräknar semesterersättning vid avslut (12%)', () => {
    const annualGross = 480000 // 40000 * 12
    const result = calculateVacation(40000, 0, annualGross)
    expect(result.terminationPay).toBeCloseTo(annualGross * 0.12, 2)
  })
})

// ─── MODUL 5: SKATT OCH AVGIFTER ───────────────────────────────────────────

describe('Skatt och avgifter (2026)', () => {
  it('beräknar arbetsgivaravgift (31.42%)', () => {
    const result = calculateEmployerFee(40000)
    expect(result).toBeCloseTo(40000 * 0.3142, 2)
  })

  it('avrundas skattebelopp nedåt till närmaste krona', () => {
    const tax = calculateTax(40000)
    expect(Number.isInteger(tax)).toBe(true)
    expect(tax).toBeGreaterThan(0)
  })

  it('beräknar korrekt skatt för 30000 kr (Tabell 33)', () => {
    // Ungefär 30% skatt på månadslön 30000 => ~9000 kr
    const tax = calculateTax(30000)
    expect(tax).toBeGreaterThan(5000)
    expect(tax).toBeLessThan(15000)
  })
})

// ─── MODUL 6: PENSION ITP 1 ────────────────────────────────────────────────

describe('Pension ITP 1', () => {
  const IBB_MONTHLY = 50000 // 7.5 IBB / 12 månader ≈ 50 000 SEK

  it('beräknar pension nivå 1 (under 50 000 kr)', () => {
    const result = calculateITP1(40000)
    expect(result).toBeCloseTo(40000 * 0.045, 2)
  })

  it('beräknar pension nivå 2 (del över 50 000 kr)', () => {
    const salary = 60000
    const result = calculateITP1(salary)
    const level1 = IBB_MONTHLY * 0.045
    const level2 = (salary - IBB_MONTHLY) * 0.30
    expect(result).toBeCloseTo(level1 + level2, 2)
  })

  it('blandar nivå 1 och 2 korrekt', () => {
    const salary = 55000
    const result = calculateITP1(salary)
    expect(result).toBeGreaterThan(salary * 0.045) // Mer än bara nivå 1
  })
})
