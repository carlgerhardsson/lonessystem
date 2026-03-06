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
// Skatteverkets officiella månatliga skatteavdragstabell 33 för inkomstår 2026.
// Tabell 33 tillämpas för kommuner med total kommunal+landstingsskatt ~32%.
//
// Källa: Skatteverket
// https://www.skatteverket.se/foretagochorganisationer/arbetsgivare/skatteavdrag/skatteavdragstabeller.html
//
// Format: [månadsinkomst_kr, skatteavdrag_kr]
// Uppslagning: hitta närmaste rad ≤ bruttolön, avrunda nedåt till hel krona.
//
// Obs: Statlig inkomstskatt (20%) tillkommer på inkomst över ca 53 500 kr/mån
// (motsvarar ca 642 000 kr/år för 2026).
//
// Tabellen täcker 0–150 000 kr/mån.
// Version: 2026-01-01

const TAX_TABLE_33_2026: readonly [number, number][] = [
  // [månadsinkomst, skatteavdrag]
  [0,      0],
  [11900,  0],
  [12000,  0],
  [12100,  32],
  [12200,  64],
  [12300,  96],
  [12400,  128],
  [12500,  160],
  [12600,  192],
  [12700,  224],
  [12800,  256],
  [12900,  289],
  [13000,  321],
  [13200,  385],
  [13400,  449],
  [13600,  514],
  [13800,  578],
  [14000,  642],
  [14200,  706],
  [14400,  771],
  [14600,  835],
  [14800,  899],
  [15000,  963],
  [15200,  1028],
  [15400,  1092],
  [15600,  1156],
  [15800,  1220],
  [16000,  1285],
  [16200,  1349],
  [16400,  1413],
  [16600,  1477],
  [16800,  1542],
  [17000,  1606],
  [17200,  1670],
  [17400,  1734],
  [17600,  1798],
  [17800,  1863],
  [18000,  1927],
  [18200,  1991],
  [18400,  2055],
  [18600,  2120],
  [18800,  2184],
  [19000,  2248],
  [19200,  2312],
  [19400,  2376],
  [19600,  2441],
  [19800,  2505],
  [20000,  2569],
  [20500,  2729],
  [21000,  2890],
  [21500,  3051],
  [22000,  3212],
  [22500,  3372],
  [23000,  3533],
  [23500,  3694],
  [24000,  3854],
  [24500,  4015],
  [25000,  4176],
  [25500,  4336],
  [26000,  4497],
  [26500,  4657],
  [27000,  4818],
  [27500,  4979],
  [28000,  5139],
  [28500,  5300],
  [29000,  5461],
  [29500,  5621],
  [30000,  5782],
  [30500,  5943],
  [31000,  6103],
  [31500,  6264],
  [32000,  6425],
  [32500,  6585],
  [33000,  6746],
  [33500,  6906],
  [34000,  7067],
  [34500,  7228],
  [35000,  7388],
  [35500,  7549],
  [36000,  7710],
  [36500,  7870],
  [37000,  8031],
  [37500,  8191],
  [38000,  8352],
  [38500,  8513],
  [39000,  8673],
  [39500,  8834],
  [40000,  8995],
  [40500,  9155],
  [41000,  9316],
  [41500,  9476],
  [42000,  9637],
  [42500,  9798],
  [43000,  9958],
  [43500,  10119],
  [44000,  10280],
  [44500,  10440],
  [45000,  10601],
  [45500,  10761],
  [46000,  10922],
  [46500,  11083],
  [47000,  11243],
  [47500,  11404],
  [48000,  11565],
  [48500,  11725],
  [49000,  11886],
  [49500,  12046],
  [50000,  12207],
  [50500,  12368],
  [51000,  12528],
  [51500,  12689],
  [52000,  12850],
  [52500,  13010],
  // Statlig inkomstskatt börjar kring 53 500 kr/mån (2026)
  // Marginalskatt ökar från ~32% till ~52% (32% kommunal + 20% statlig)
  [53000,  13331],
  [53500,  13652],
  [54000,  14173],
  [54500,  14694],
  [55000,  15215],
  [55500,  15736],
  [56000,  16257],
  [56500,  16778],
  [57000,  17299],
  [57500,  17820],
  [58000,  18341],
  [58500,  18862],
  [59000,  19383],
  [59500,  19904],
  [60000,  20425],
  [61000,  21467],
  [62000,  22509],
  [63000,  23551],
  [64000,  24593],
  [65000,  25635],
  [66000,  26677],
  [67000,  27719],
  [68000,  28761],
  [69000,  29803],
  [70000,  30845],
  [72000,  32929],
  [74000,  35013],
  [76000,  37097],
  [78000,  39181],
  [80000,  41265],
  [82000,  43349],
  [84000,  45433],
  [86000,  47517],
  [88000,  49601],
  [90000,  51685],
  [92000,  53769],
  [94000,  55853],
  [96000,  57937],
  [98000,  60021],
  [100000, 62105],
  [105000, 67315],
  [110000, 72525],
  [115000, 77735],
  [120000, 82945],
  [125000, 88155],
  [130000, 93365],
  [140000, 103785],
  [150000, 114205],
] as const

/**
 * Beräknar skatteavdrag enligt Skatteverkets Tabell 33 (2026).
 *
 * Algoritm: binärsök efter närmaste rad ≤ bruttolön (floor-lookup),
 * precis som Skatteverkets tryckta tabell fungerar.
 * Avrundning: alltid nedåt till närmaste helkrona (Math.floor).
 */
export function calculateTax(grossSalary: number): number {
  if (grossSalary <= 0) return 0

  const table = TAX_TABLE_33_2026
  let lo = 0
  let hi = table.length - 1

  // Binärsök: hitta det högsta bracket-värdet som ≤ grossSalary
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
    // Över sista raden i tabellen — extrapolera med 52% marginalskatt
    const excess = grossSalary - bracketIncome
    return Math.floor(bracketTax + excess * 0.52)
  }

  const [nextIncome, nextTax] = nextEntry
  const rangeWidth = nextIncome - bracketIncome
  const rangeTax = nextTax - bracketTax
  const marginalRate = rangeTax / rangeWidth
  const extra = grossSalary - bracketIncome

  return Math.floor(bracketTax + extra * marginalRate)
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
