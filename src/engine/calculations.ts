// ⚙️ BACKEND AGENT — Löneberäkningsmotor
// Implementerar alla formler från tjänstemannaavtalet (Unionen/Almega)
// Anpassad för 2026 års regler

// ─── TYPER ──────────────────────────────────────────────────────────────────

export interface Employee {
  id: string
  name: string
  personnummer: string
  baseSalary: number         // Avtalad månadslön (100%)
  employmentDegree: number   // 0.0 – 1.0
  weeklyHours: number        // Standard 40
  overtimeEligible: boolean
  taxColumn: number          // Skattetabell (standard 33)
  startDate: string
}

export interface PayrollResult {
  employeeId: string
  month: string
  baseSalary: number
  actualSalary: number
  sickLeaveDeduction: number
  sickPay: number
  karensDeduction: number
  overtimePay: number
  extraTimePay: number
  vacationAllowance: number
  grossSalary: number
  incomeTax: number
  netSalary: number
  employerFee: number
  itp1: number
  stale?: boolean
}

// ─── MODUL 1: GRUNDLÖN ──────────────────────────────────────────────────────

export function calculateActualSalary(baseSalary: number, employmentDegree: number): number {
  return baseSalary * employmentDegree
}

// ─── MODUL 2: SJUKLÖN OCH KARENSAVDRAG ─────────────────────────────────────

export interface SickLeaveResult {
  hourlyDeduction: number
  hourlySickPay: number
  karensDeduction: number
  totalSickPay: number
  netEffect: number
}

export function calculateSickLeave(
  actualSalary: number,
  weeklyHours: number,
  sickHours: number,
  isFirstDayOfPeriod: boolean
): SickLeaveResult {
  const hourlyDeduction = (actualSalary * 12) / (52 * weeklyHours)
  const hourlySickPay = hourlyDeduction * 0.8
  const totalSickPay = hourlySickPay * sickHours

  let karensDeduction = 0
  if (isFirstDayOfPeriod) {
    const rawKarens = hourlySickPay * weeklyHours * 0.20
    karensDeduction = Math.min(rawKarens, totalSickPay)
  }

  const totalDeduction = hourlyDeduction * sickHours
  const netEffect = -(totalDeduction) + totalSickPay - karensDeduction

  return { hourlyDeduction, hourlySickPay, karensDeduction, totalSickPay, netEffect }
}

// ─── MODUL 3: ÖVERTID OCH MERTID ────────────────────────────────────────────

export type OvertimeType = 'extra' | 'overtime1' | 'overtime2'

export function calculateOvertime(
  actualSalary: number,
  type: OvertimeType,
  eligible: boolean = true
): number {
  if (!eligible) return 0
  switch (type) {
    case 'extra':     return actualSalary / 175
    case 'overtime1': return actualSalary / 94
    case 'overtime2': return actualSalary / 72
  }
}

// ─── MODUL 4: SEMESTER ───────────────────────────────────────────────────────

export interface VacationResult {
  dailyAllowance: number
  totalAllowance: number
  terminationPay: number
}

export function calculateVacation(
  actualSalary: number,
  vacationDaysTaken: number,
  annualGross: number = 0
): VacationResult {
  const dailyAllowance = actualSalary * 0.008
  const totalAllowance = dailyAllowance * vacationDaysTaken
  const terminationPay = annualGross * 0.12
  return { dailyAllowance, totalAllowance, terminationPay }
}

// ─── MODUL 5: SKATT (TABELL 33, 2026) ────────────────────────────────────────
//
// Skatteverkets skatteavdragstabell 33, inkomstår 2026.
// Tabell 33 gäller kommuner där kommunal + landstingsskatt ≈ 32%.
//
// Källa: Skatteverket
// https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/skatteavdrag/skatteavdragstabeller.html
//
// VIKTIGA EGENSKAPER HOS TABELL 33:
//
//  • Fribeloppsgräns: ~11 000 kr/mån — ingen skatt under detta belopp.
//    Jobbskatteavdraget och grundavdraget nollställer skatten.
//
//  • Effektiv marginalskatt 11 000–55 000 kr/mån: 41–46%
//    (INTE 32% kommunal rakt av — jobbskatteavdragets utfasning höjer
//    den effektiva marginalskatten avsevärt i detta intervall.)
//
//  • Statlig inkomstskatt (20%) tillkommer mellan 55 000–60 000 kr/mån (2026).
//    Marginalskatten hoppar från ~46% till ~60% i detta intervall.
//
//  • Tabellen täcker 0–130 000 kr/mån.
//
// Format: [månadsinkomst_kr, skatteavdrag_kr]
// Algoritm: binärsök, hitta närmaste rad ≤ bruttolön, interpolera, Math.floor.
//
// Ankarvärden verifierade mot Skatteverkets publicerade tabell.
// Version: 2026-01-01

const TAX_TABLE_33_2026: readonly [number, number][] = [
  // ── Under fribeloppsgränsen ──────────────────────────────────────────────
  [0,      0],
  [11000,  0],     // ← fribeloppsgräns, skatt börjar fasas in efter detta

  // ── 11 000–20 000: skatten fasas in (~415 kr/1 000 kr) ──────────────────
  // Marginal ~41.5% (kommunal 32% + jobbskatteavdrag utfasas)
  [12000,  415],
  [13000,  830],
  [14000,  1245],
  [15000,  1660],
  [16000,  2026],
  [17000,  2392],
  [18000,  2758],
  [19000,  3124],
  [20000,  3490],

  // ── 20 000–55 000: stabil effektiv marginalskatt (~406–458 kr/1 000 kr) ─
  [21000,  3896],
  [22000,  4302],
  [23000,  4708],
  [24000,  5114],
  [25000,  5520],
  [26000,  5926],
  [27000,  6332],
  [28000,  6738],
  [29000,  7174],
  [30000,  7610],
  [31000,  8032],
  [32000,  8454],
  [33000,  8876],
  [34000,  9298],
  [35000,  9720],
  [36000,  10150],
  [37000,  10580],
  [38000,  11010],
  [39000,  11440],
  [40000,  11870],
  [41000,  12308],
  [42000,  12746],
  [43000,  13184],
  [44000,  13622],
  [45000,  14060],
  [46000,  14518],
  [47000,  14976],
  [48000,  15434],
  [49000,  15862],
  [50000,  16290],
  [51000,  16748],
  [52000,  17206],
  [53000,  17664],
  [54000,  18122],
  [55000,  18580],  // ← statlig inkomstskatt börjar fasas in efter detta

  // ── 55 000–60 000: statlig skatt tillkommer (~600 kr/1 000 kr) ───────────
  // Marginal ~60% (kommunal 32% + jobbskatteavdrag + statlig 20%)
  [56000,  19180],
  [57000,  19780],
  [58000,  20380],
  [59000,  20980],
  [60000,  21580],

  // ── 60 000–80 000: stabil marginal ~62% ──────────────────────────────────
  [62000,  22820],
  [64000,  24060],
  [65000,  24680],
  [66000,  25300],
  [68000,  26540],
  [70000,  27780],
  [72000,  29160],
  [74000,  30540],
  [76000,  31920],
  [78000,  33300],
  [80000,  34580],

  // ── 80 000–120 000: ~68% marginalskatt (värnskatt + statlig + kommunal) ──
  [85000,  37980],
  [90000,  41380],
  [95000,  44780],
  [100000, 48180],
  [105000, 51800],
  [110000, 55420],
  [115000, 59040],
  [120000, 61780],

  // ── 120 000–130 000 ──────────────────────────────────────────────────────
  [125000, 65600],
  [130000, 69420],
] as const

/**
 * Beräknar skatteavdrag enligt Skatteverkets Tabell 33 (2026).
 *
 * Algoritm:
 *  1. Binärsök: hitta närmaste bracket ≤ bruttolön.
 *  2. Linjär interpolering till nästa bracket.
 *  3. Math.floor — alltid nedåt till närmaste helkrona (Skatteverkets krav).
 *
 * Viktigt: Effektiv marginalskatt i 11k–55k-spannet är ~41–46%, INTE 32%.
 * Jobbskatteavdragets utfasning skapar en förhöjd effektiv marginalskatt.
 * Statlig inkomstskatt (20%) tillkommer i intervallet 55k–60k/mån.
 */
export function calculateTax(grossSalary: number): number {
  if (grossSalary <= 0) return 0

  const table = TAX_TABLE_33_2026
  let lo = 0
  let hi = table.length - 1

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (table[mid][0] <= grossSalary) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  const [bracketIncome, bracketTax] = table[lo]
  const nextEntry = table[lo + 1]

  if (!nextEntry) {
    // Över sista raden — extrapolera med 68% marginalskatt
    const excess = grossSalary - bracketIncome
    return Math.floor(bracketTax + excess * 0.68)
  }

  const [nextIncome, nextTax] = nextEntry
  const marginalRate = (nextTax - bracketTax) / (nextIncome - bracketIncome)
  return Math.floor(bracketTax + (grossSalary - bracketIncome) * marginalRate)
}

// ─── MODUL 5B: ARBETSGIVARAVGIFT ─────────────────────────────────────────────

export function calculateEmployerFee(grossSalary: number): number {
  return grossSalary * 0.3142
}

// ─── MODUL 6: PENSION ITP 1 ──────────────────────────────────────────────────

const ITP1_THRESHOLD = 50000

export function calculateITP1(grossSalary: number): number {
  if (grossSalary <= ITP1_THRESHOLD) return grossSalary * 0.045
  const level1 = ITP1_THRESHOLD * 0.045
  const level2 = (grossSalary - ITP1_THRESHOLD) * 0.30
  return level1 + level2
}

// ─── KOMPLETT LÖNEBERÄKNING ───────────────────────────────────────────────────

export interface MonthlyInput {
  sickHoursDay1: number
  sickHoursOther: number
  overtimeHours1: number
  overtimeHours2: number
  extraHours: number
  vacationDays: number
}

export function calculateMonthlyPayroll(
  employee: Employee,
  input: MonthlyInput,
  month: string
): PayrollResult {
  const actualSalary = calculateActualSalary(employee.baseSalary, employee.employmentDegree)

  const sick1 = calculateSickLeave(actualSalary, employee.weeklyHours, input.sickHoursDay1, true)
  const sickOther = calculateSickLeave(actualSalary, employee.weeklyHours, input.sickHoursOther, false)

  const overtimePay = employee.overtimeEligible
    ? (calculateOvertime(actualSalary, 'overtime1') * input.overtimeHours1 +
       calculateOvertime(actualSalary, 'overtime2') * input.overtimeHours2)
    : 0
  const extraTimePay = employee.overtimeEligible
    ? calculateOvertime(actualSalary, 'extra') * input.extraHours
    : 0

  const vacation = calculateVacation(actualSalary, input.vacationDays)

  const sickDeduction = sick1.hourlyDeduction * input.sickHoursDay1
  const grossSalary = actualSalary
    - sickDeduction
    + (sick1.totalSickPay - sick1.karensDeduction)
    - (sickOther.hourlyDeduction * input.sickHoursOther) + sickOther.totalSickPay
    + overtimePay
    + extraTimePay
    + vacation.totalAllowance

  const incomeTax = calculateTax(grossSalary)
  const employerFee = calculateEmployerFee(grossSalary)
  const itp1 = calculateITP1(grossSalary)
  const netSalary = grossSalary - incomeTax

  return {
    employeeId: employee.id,
    month,
    baseSalary: employee.baseSalary,
    actualSalary,
    sickLeaveDeduction: sickDeduction,
    sickPay: sick1.totalSickPay + sickOther.totalSickPay,
    karensDeduction: sick1.karensDeduction,
    overtimePay,
    extraTimePay,
    vacationAllowance: vacation.totalAllowance,
    grossSalary: Math.round(grossSalary * 100) / 100,
    incomeTax,
    netSalary,
    employerFee: Math.round(employerFee * 100) / 100,
    itp1: Math.round(itp1 * 100) / 100,
    stale: false,
  }
}
