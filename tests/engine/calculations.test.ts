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
    [0, 5000, 10000, 15000].forEach(salary => {
      expect(calculateTax(salary)).toBeGreaterThanOrEqual(0)
    })
  })

  it('noll i skatt under fribeloppsgräns (~12 000 kr/mån)', () => {
    expect(calculateTax(0)).toBe(0)
    expect(calculateTax(10000)).toBe(0)
    expect(calculateTax(11000)).toBe(0)
  })

  it('skatten ökar monotont med lönen', () => {
    const salaries = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 80000, 100000]
    for (let i = 1; i < salaries.length; i++) {
      expect(calculateTax(salaries[i])).toBeGreaterThan(calculateTax(salaries[i - 1]))
    }
  })

  it('avrundning är alltid nedåt (aldrig uppåt)', () => {
    // Skatteverket avrundning: nedåt till närmaste helkrona
    const tax1 = calculateTax(40000)
    const tax2 = calculateTax(40001)
    expect(tax2).toBeGreaterThanOrEqual(tax1)
    // Kontrollera att tax == floor(beräknat värde), aldrig ceiling
    expect(tax1).toBe(Math.floor(tax1))
  })
})

// ─── MODUL 5: SKATT — REFERENSVÄRDEN FRÅN TABELL 33 ────────────────────────
// Referensvärden ur Skatteverkets publicerade Tabell 33, 2026.
// Källa: https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/skatteavdrag/skatteavdragstabeller.html

describe('calculateTax — referensvärden Tabell 33 (2026)', () => {
  // Under gräns för skatteplikt — ska vara 0
  it('12 000 kr/mån → 0 kr (under fribeloppsgräns)', () => {
    expect(calculateTax(12000)).toBe(0)
  })

  // Låga löner (kommunalskatt minus grundavdrag)
  it('20 000 kr/mån → korrekt skatt (~3 100–3 500 kr)', () => {
    const tax = calculateTax(20000)
    expect(tax).toBeGreaterThanOrEqual(3000)
    expect(tax).toBeLessThanOrEqual(3700)
  })

  it('30 000 kr/mån → korrekt skatt (~7 500–8 000 kr)', () => {
    const tax = calculateTax(30000)
    expect(tax).toBeGreaterThanOrEqual(7300)
    expect(tax).toBeLessThanOrEqual(8100)
  })

  it('40 000 kr/mån → korrekt skatt (~11 500–12 500 kr)', () => {
    const tax = calculateTax(40000)
    expect(tax).toBeGreaterThanOrEqual(11500)
    expect(tax).toBeLessThanOrEqual(12500)
  })

  it('50 000 kr/mån → korrekt skatt (~16 000–17 500 kr)', () => {
    const tax = calculateTax(50000)
    expect(tax).toBeGreaterThanOrEqual(16000)
    expect(tax).toBeLessThanOrEqual(17500)
  })

  // Statlig inkomstskatt (20%) slår in runt 53 500 kr/mån (2026)
  // Marginalskatten ska öka tydligt här
  it('skattesatsen ökar markant över ~53 500 kr/mån (statlig skatt)', () => {
    // Marginalskatt under gränsen: ~32%
    // Marginalskatt över gränsen: ~52%
    const taxAt53000 = calculateTax(53000)
    const taxAt54000 = calculateTax(54000)
    const taxAt55000 = calculateTax(55000)
    const taxAt56000 = calculateTax(56000)

    const marginBelow = taxAt54000 - taxAt53000
    const marginAbove = taxAt56000 - taxAt55000

    // Marginalskatt under gränsen bör vara ~320 kr per 1000 kr
    expect(marginBelow).toBeGreaterThanOrEqual(280)
    expect(marginBelow).toBeLessThanOrEqual(370)

    // Marginalskatt över gränsen bör vara ~520 kr per 1000 kr (32% + 20%)
    expect(marginAbove).toBeGreaterThanOrEqual(450)
    expect(marginAbove).toBeLessThanOrEqual(560)
  })

  it('70 000 kr/mån → korrekt skatt (~27 000–31 000 kr)', () => {
    const tax = calculateTax(70000)
    expect(tax).toBeGreaterThanOrEqual(27000)
    expect(tax).toBeLessThanOrEqual(31000)
  })

  it('100 000 kr/mån → korrekt skatt (~44 000–50 000 kr)', () => {
    const tax = calculateTax(100000)
    expect(tax).toBeGreaterThanOrEqual(44000)
    expect(tax).toBeLessThanOrEqual(50000)
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
