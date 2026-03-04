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
}

// ─── MODUL 1: GRUNDLÖN ──────────────────────────────────────────────────────

export function calculateActualSalary(baseSalary: number, employmentDegree: number): number {
  return baseSalary * employmentDegree
}

// ─── MODUL 2: SJUKLÖN OCH KARENSAVDRAG ─────────────────────────────────────

export interface SickLeaveResult {
  hourlyDeduction: number   // Avdrag per sjuktimme
  hourlySickPay: number     // Sjuklön per timme (80%)
  karensDeduction: number   // Karensavdrag (en gång per period)
  totalSickPay: number      // Total sjuklön för perioden
  netEffect: number         // Nettopåverkan på lönen
}

export function calculateSickLeave(
  actualSalary: number,
  weeklyHours: number,
  sickHours: number,
  isFirstDayOfPeriod: boolean
): SickLeaveResult {
  // Formel: (actual_salary * 12) / (52 * weekly_hours)
  const hourlyDeduction = (actualSalary * 12) / (52 * weeklyHours)
  const hourlySickPay = hourlyDeduction * 0.8

  // Total sjuklön för sjukperioden
  const totalSickPay = hourlySickPay * sickHours

  // Karensavdrag: sjuklön per timme * veckotimmar * 0.20
  // Dras EN gång per sjukperiod — kan aldrig överstiga utbetald sjuklön
  let karensDeduction = 0
  if (isFirstDayOfPeriod) {
    const rawKarens = hourlySickPay * weeklyHours * 0.20
    karensDeduction = Math.min(rawKarens, totalSickPay)
  }

  const totalDeduction = hourlyDeduction * sickHours
  const netEffect = -(totalDeduction) + totalSickPay - karensDeduction

  return {
    hourlyDeduction,
    hourlySickPay,
    karensDeduction,
    totalSickPay,
    netEffect,
  }
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
    case 'extra':     return actualSalary / 175  // Mertid (deltid → heltid)
    case 'overtime1': return actualSalary / 94   // Övertid 1 (vardag 06–20)
    case 'overtime2': return actualSalary / 72   // Övertid 2 (kväll/helg)
  }
}

// ─── MODUL 4: SEMESTER ───────────────────────────────────────────────────────

export interface VacationResult {
  dailyAllowance: number     // Per semesterdag: actual_salary * 0.008
  totalAllowance: number     // Totalt tillägg för uttagna dagar
  terminationPay: number     // Semesterersättning vid avslut (12% av årsbrutto)
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

// Skatteverkets tabell 33 — approximation baserad på kommunalskatt ~30%
// OBS: Produktionskod bör använda exakt Skatteverket-tabell
const TAX_TABLE_33: [number, number][] = [
  [0,      0],
  [11000,  0],
  [15000,  1660],
  [20000,  3490],
  [25000,  5520],
  [30000,  7610],
  [35000,  9720],
  [40000,  11870],
  [45000,  14060],
  [50000,  16290],
  [55000,  18580],
  [60000,  21580],
  [70000,  27780],
  [80000,  34580],
  [100000, 48180],
  [120000, 61780],
]

export function calculateTax(grossSalary: number): number {
  // Hitta närmaste bracket
  for (let i = TAX_TABLE_33.length - 1; i >= 0; i--) {
    if (grossSalary >= TAX_TABLE_33[i][0]) {
      const baseTax = TAX_TABLE_33[i][1]
      const baseAmount = TAX_TABLE_33[i][0]
      const nextBracket = TAX_TABLE_33[i + 1]
      if (!nextBracket) return Math.floor(baseTax)

      // Interpolera inom bracket
      const bracketRange = nextBracket[0] - baseAmount
      const taxRange = nextBracket[1] - baseTax
      const marginalRate = taxRange / bracketRange
      const extraTax = (grossSalary - baseAmount) * marginalRate

      return Math.floor(baseTax + extraTax)
    }
  }
  return 0
}

// ─── MODUL 5B: ARBETSGIVARAVGIFT ─────────────────────────────────────────────

export function calculateEmployerFee(grossSalary: number): number {
  return grossSalary * 0.3142
}

// ─── MODUL 6: PENSION ITP 1 ──────────────────────────────────────────────────

const ITP1_THRESHOLD = 50000  // 7.5 IBB / 12 ≈ 50 000 SEK (2026)

export function calculateITP1(grossSalary: number): number {
  if (grossSalary <= ITP1_THRESHOLD) {
    return grossSalary * 0.045  // Nivå 1: 4.5%
  }
  const level1 = ITP1_THRESHOLD * 0.045
  const level2 = (grossSalary - ITP1_THRESHOLD) * 0.30  // Nivå 2: 30%
  return level1 + level2
}

// ─── KOMPLETT LÖNEBERÄKNING ───────────────────────────────────────────────────

export interface MonthlyInput {
  sickHoursDay1: number       // Sjukfrånvaro dag 1 (karens)
  sickHoursOther: number      // Sjukfrånvaro övriga dagar
  overtimeHours1: number      // Övertidstimmar (vardag)
  overtimeHours2: number      // Övertidstimmar (kväll/helg)
  extraHours: number          // Mertidstimmar (deltid)
  vacationDays: number        // Semesterdagar
}

export function calculateMonthlyPayroll(
  employee: Employee,
  input: MonthlyInput,
  month: string
): PayrollResult {
  const actualSalary = calculateActualSalary(employee.baseSalary, employee.employmentDegree)

  // Sjuklön
  const sick1 = employee.overtimeEligible || true
    ? calculateSickLeave(actualSalary, employee.weeklyHours, input.sickHoursDay1, true)
    : { netEffect: 0, karensDeduction: 0, totalSickPay: 0 } as SickLeaveResult
  const sickOther = calculateSickLeave(actualSalary, employee.weeklyHours, input.sickHoursOther, false)

  // Övertid
  const overtimePay = employee.overtimeEligible
    ? (calculateOvertime(actualSalary, 'overtime1') * input.overtimeHours1 +
       calculateOvertime(actualSalary, 'overtime2') * input.overtimeHours2)
    : 0
  const extraTimePay = employee.overtimeEligible
    ? calculateOvertime(actualSalary, 'extra') * input.extraHours
    : 0

  // Semester
  const vacation = calculateVacation(actualSalary, input.vacationDays)

  // Bruttolön
  const sickDeduction = (sick1.hourlyDeduction ?? 0) * input.sickHoursDay1
  const grossSalary = actualSalary
    - sickDeduction
    + (sick1.totalSickPay - sick1.karensDeduction)
    - (sickOther.hourlyDeduction * input.sickHoursOther) + sickOther.totalSickPay
    + overtimePay
    + extraTimePay
    + vacation.totalAllowance

  // Skatt & pension
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
  }
}
