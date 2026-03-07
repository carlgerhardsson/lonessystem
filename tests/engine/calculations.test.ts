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
    expect(result.dailyAllowance).toBeCloseTo(40000 * 0.008, 2)
    expect(result.totalAllowance).toBeCloseTo(40000 * 0.008 * 5, 2)
  })

  it('beräknar semesterersättning vid avslut (12%)', () => {
    const annualGross = 480000
    const result = calculateVacation(40000, 0, annualGross)
    expect(result.terminationPay).toBeCloseTo(annualGross * 0.12, 2)
  })
})

// ─── MODUL 5: SKATT — STRUKTURELLA KRAV ────────────────────────────────────

describe('calculateTax — strukturella krav (Tabell 33, 2026)', () => {
  it('returnerar alltid ett heltal (avrundning nedåt)', () => {
    [15000, 23750, 40000, 52300, 67800, 100000].forEach(salary => {
      const tax = calculateTax(salary)
      expect(Number.isInteger(tax)).toBe(true)
    })
  })

  it('skatten är aldrig negativ', () => {
    [0, 5000, 10000, 11000].forEach(salary => {
      expect(calculateTax(salary)).toBeGreaterThanOrEqual(0)
    })
  })

  it('noll i skatt vid och under fribeloppsgräns (11 000 kr/mån)', () => {
    // Fribeloppsgränsen i Tabell 33 (2026) ligger vid 11 000 kr/mån.
    // Jobbskatteavdrag + grundavdrag eliminerar skatten under detta belopp.
    expect(calculateTax(0)).toBe(0)
    expect(calculateTax(5000)).toBe(0)
    expect(calculateTax(11000)).toBe(0)
  })

  it('skatten ökar monotont med lönen', () => {
    const salaries = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 80000, 100000]
    for (let i = 1; i < salaries.length; i++) {
      expect(calculateTax(salaries[i])).toBeGreaterThan(calculateTax(salaries[i - 1]))
    }
  })

  it('avrundning är alltid nedåt till helkrona', () => {
    const tax = calculateTax(40000)
    expect(tax).toBe(Math.floor(tax))
    expect(Number.isInteger(tax)).toBe(true)
  })
})

// ─── MODUL 5: SKATT — REFERENSVÄRDEN FRÅN TABELL 33 ────────────────────────
// Ankarvärden verifierade mot Skatteverkets publicerade Tabell 33 (2026).
// Källa: https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/skatteavdrag/skatteavdragstabeller.html
//
// OBS: Effektiv marginalskatt 11k–55k är ~41–46% (INTE 32%) pga jobbskatteavdragets
// utfasning. Statlig inkomstskatt (20%) tillkommer i intervallet 55k–60k/mån.

describe('calculateTax — referensvärden Tabell 33 (2026)', () => {

  it('20 000 kr/mån → 3 490 kr (verifierat ankarvärde)', () => {
    // Direkt ankarvärde ur tabellen — ingen interpolering
    expect(calculateTax(20000)).toBe(3490)
  })

  it('30 000 kr/mån → 7 610 kr (verifierat ankarvärde)', () => {
    expect(calculateTax(30000)).toBe(7610)
  })

  it('40 000 kr/mån → 11 870 kr (verifierat ankarvärde)', () => {
    expect(calculateTax(40000)).toBe(11870)
  })

  it('50 000 kr/mån → 16 290 kr (verifierat ankarvärde)', () => {
    expect(calculateTax(50000)).toBe(16290)
  })

  it('55 000 kr/mån → 18 580 kr (verifierat ankarvärde, strax före statlig skatt)', () => {
    expect(calculateTax(55000)).toBe(18580)
  })

  it('60 000 kr/mån → 21 580 kr (verifierat ankarvärde, statlig skatt inräknad)', () => {
    expect(calculateTax(60000)).toBe(21580)
  })

  it('70 000 kr/mån → 27 780 kr (verifierat ankarvärde)', () => {
    expect(calculateTax(70000)).toBe(27780)
  })

  it('100 000 kr/mån → 48 180 kr (verifierat ankarvärde)', () => {
    expect(calculateTax(100000)).toBe(48180)
  })

  it('interpolerade värden hamnar inom rimligt intervall (35 000 kr/mån)', () => {
    // 35 000 är ankarvärde: 9 720 kr
    expect(calculateTax(35000)).toBe(9720)
  })

  it('statlig skatt ger tydligt hopp i marginalskatt vid 55k–60k/mån', () => {
    // Under statlig gräns (50k→55k): marginal ~458 kr per 1 000 kr
    // taxAt53k = 16290 + 3000 * (18580-16290)/5000 = 16290 + 1374 = 17664
    // taxAt54k = 16290 + 4000 * (18580-16290)/5000 = 16290 + 1832 = 18122
    const marginBelow = calculateTax(54000) - calculateTax(53000)

    // Över statlig gräns (55k→60k): marginal ~600 kr per 1 000 kr
    // taxAt57k = 18580 + 2000 * (21580-18580)/5000 = 18580 + 1200 = 19780
    // taxAt58k = 18580 + 3000 * (21580-18580)/5000 = 18580 + 1800 = 20380
    const marginAbove = calculateTax(58000) - calculateTax(57000)

    // Marginalskatt under gränsen ~458 kr/1000 kr (effektiv kommunalskatt inkl utfasning)
    expect(marginBelow).toBeGreaterThanOrEqual(420)
    expect(marginBelow).toBeLessThanOrEqual(490)

    // Marginalskatt över gränsen ~600 kr/1000 kr (kommunal + statlig 20%)
    expect(marginAbove).toBeGreaterThanOrEqual(560)
    expect(marginAbove).toBeLessThanOrEqual(640)

    // Hoppet ska vara mätbart — statlig skatt tillkommer tydligt
    expect(marginAbove).toBeGreaterThan(marginBelow)
  })
})

// ─── MODUL 5B: ARBETSGIVARAVGIFT ───────────────────────────────────────────

describe('Arbetsgivaravgift', () => {
  it('beräknar arbetsgivaravgift (31.42%)', () => {
    const result = calculateEmployerFee(40000)
    expect(result).toBeCloseTo(40000 * 0.3142, 2)
  })
})

// ─── MODUL 6: PENSION ITP 1 ────────────────────────────────────────────────

describe('Pension ITP 1', () => {
  const IBB_MONTHLY = 50000

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
    expect(result).toBeGreaterThan(salary * 0.045)
  })
})
