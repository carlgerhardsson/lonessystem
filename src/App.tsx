// 🎨 FRONTEND AGENT — Komplett lönesystem-app
// Design: Skandinavisk minimalism · Mörkblå + isblå accenter · iPhone-nativ känsla

import { useState, useEffect } from 'react'
import {
  Users, Calculator, FileText, Settings, Plus, ChevronRight,
  TrendingUp, Calendar, AlertCircle, CheckCircle, Download,
  ArrowLeft, Trash2, Edit3, X, Menu
} from 'lucide-react'
import {
  calculateActualSalary, calculateMonthlyPayroll,
  type Employee, type MonthlyInput, type PayrollResult
} from './engine/calculations'
import {
  getEmployees, saveEmployee, deleteEmployee, generateId,
  getEmployer, saveEmployer, getPayrollForMonth, savePayrollResult,
  type Employer
} from './store'
import { generateAGI, generatePAIN001, generateSIE4, downloadFile } from './engine/exports'

// ─── FORMATTERING ────────────────────────────────────────────────────────────

const kr = (n: number) => new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', maximumFractionDigits: 0
}).format(n)

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── TYPER ────────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'employees' | 'payroll' | 'reports' | 'settings'
type Modal = 'addEmployee' | 'editEmployee' | 'runPayroll' | null

// ─── KOMPONENTER ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'blue' }: {
  label: string; value: string; sub?: string; color?: 'blue'|'green'|'amber'
}) {
  const colors = {
    blue:  'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  }
  return (
    <div className={`glass-card bg-gradient-to-br ${colors[color]} p-4 slide-up`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white font-display">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
      active ? 'text-blue-400' : 'text-slate-500 active:text-slate-300'
    }`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// ─── SIDA: DASHBOARD ─────────────────────────────────────────────────────────

function DashboardPage({ employees, onRunPayroll }: {
  employees: Employee[]; onRunPayroll: () => void
}) {
  const month = currentMonth()
  const results = getPayrollForMonth(month)
  const totalGross = results.reduce((s, r) => s + r.grossSalary, 0)
  const totalNet = results.reduce((s, r) => s + r.netSalary, 0)
  const totalCost = results.reduce((s, r) => s + r.grossSalary + r.employerFee, 0)

  return (
    <div className="scroll-container h-full pb-24 px-4">
      {/* Header */}
      <div className="safe-top pt-6 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Lönesystem</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{fontFamily:'Syne, sans-serif'}}>
          Översikt
        </h1>
        <p className="text-slate-400 text-sm">
          {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Anställda" value={String(employees.length)} sub="aktiva" />
        <StatCard label="Bruttolön" value={results.length ? kr(totalGross) : '—'} color="blue" />
        <StatCard label="Nettolön" value={results.length ? kr(totalNet) : '—'} color="green" />
        <StatCard label="Total kostnad" value={results.length ? kr(totalCost) : '—'} color="amber" sub="inkl. avg." />
      </div>

      {/* Kör lön */}
      {employees.length > 0 && results.length === 0 && (
        <button
          onClick={onRunPayroll}
          className="w-full glass-card border-blue-500/30 bg-blue-500/10 py-4 px-5 flex items-center justify-between slide-up mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Calculator size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Kör lön</p>
              <p className="text-slate-400 text-xs">Beräkna månadsutbetalning</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      )}

      {/* Löneresultat */}
      {results.length > 0 && (
        <div className="glass-card p-4 mb-4 slide-up">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
            Lönespec {month}
          </p>
          {results.map(r => {
            const emp = employees.find(e => e.id === r.employeeId)
            return (
              <div key={r.employeeId} className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{emp?.name ?? r.employeeId}</p>
                  <p className="text-slate-400 text-xs">Brutto: {kr(r.grossSalary)}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold text-sm">{kr(r.netSalary)}</p>
                  <p className="text-slate-500 text-xs">Netto</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {employees.length === 0 && (
        <div className="glass-card p-8 text-center slide-up">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Lägg till anställda</p>
          <p className="text-slate-500 text-sm mt-1">Börja med att registrera din första anställde</p>
        </div>
      )}
    </div>
  )
}

// ─── SIDA: ANSTÄLLDA ─────────────────────────────────────────────────────────

function EmployeesPage({ employees, onAdd, onEdit, onDelete }: {
  employees: Employee[]
  onAdd: () => void
  onEdit: (e: Employee) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="scroll-container h-full pb-24 px-4">
      <div className="safe-top pt-6 pb-4 flex justify-between items-end">
        <div>
          <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Personal</p>
          <h1 className="text-2xl font-bold text-white mt-1" style={{fontFamily:'Syne, sans-serif'}}>
            Anställda
          </h1>
        </div>
        <button onClick={onAdd}
          className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {employees.map((emp, i) => (
          <div key={emp.id} className="glass-card p-4 slide-up flex items-center justify-between"
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-600/40 flex items-center justify-center text-white font-bold text-sm">
                {emp.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{emp.name}</p>
                <p className="text-slate-400 text-xs">{kr(calculateActualSalary(emp.baseSalary, emp.employmentDegree))}/mån · {Math.round(emp.employmentDegree * 100)}%</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(emp)}
                className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                <Edit3 size={15} />
              </button>
              <button onClick={() => onDelete(emp.id)}
                className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="glass-card p-10 text-center">
            <Users size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Inga anställda ännu</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SIDA: RAPPORTER ─────────────────────────────────────────────────────────

function ReportsPage({ employees, employer }: { employees: Employee[]; employer: Employer | null }) {
  const month = currentMonth()
  const results = getPayrollForMonth(month)

  const handleDownload = (type: 'agi'|'pain'|'sie') => {
    if (!employer) { alert('Ange arbetsgivaruppgifter i Inställningar'); return }
    if (results.length === 0) { alert('Kör lön för månaden först'); return }
    const today = new Date().toISOString().slice(0,10)
    if (type === 'agi') {
      downloadFile(generateAGI(employer, employees, results, month), `AGI_${month}.xml`, 'application/xml')
    } else if (type === 'pain') {
      downloadFile(generatePAIN001({...employer, bankAccount: employer.bankAccount||'SE0000000000000000'}, employees, results, today), `PAIN001_${month}.xml`, 'application/xml')
    } else {
      downloadFile(generateSIE4(employer, results, month), `SIE4_${month}.se`, 'text/plain')
    }
  }

  const exports = [
    { key: 'agi' as const,  icon: FileText, title: 'AGI – Skatteverket',  sub: 'Arbetsgivardeklaration XML', color: 'blue' },
    { key: 'pain' as const, icon: Download, title: 'PAIN.001 – Bank',     sub: 'Bankfil för utbetalning',    color: 'green' },
    { key: 'sie' as const,  icon: TrendingUp, title: 'SIE4 – Bokföring',  sub: 'Import till bokföringssystem', color: 'amber' },
  ]

  return (
    <div className="scroll-container h-full pb-24 px-4">
      <div className="safe-top pt-6 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Export</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{fontFamily:'Syne, sans-serif'}}>
          Rapporter
        </h1>
        <p className="text-slate-400 text-sm">Period: {month}</p>
      </div>

      {results.length === 0 && (
        <div className="glass-card p-4 mb-4 flex gap-3 border-amber-500/20 bg-amber-500/5">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">Kör lön för perioden för att aktivera export</p>
        </div>
      )}

      <div className="space-y-3">
        {exports.map(({ key, icon: Icon, title, sub, color }) => (
          <button key={key} onClick={() => handleDownload(key)}
            className={`w-full glass-card p-4 flex items-center justify-between slide-up ${
              results.length === 0 ? 'opacity-40' : ''
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                color === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                <Icon size={18} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-sm">{title}</p>
                <p className="text-slate-400 text-xs">{sub}</p>
              </div>
            </div>
            <Download size={16} className="text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── SIDA: INSTÄLLNINGAR ─────────────────────────────────────────────────────

function SettingsPage({ employer, onSave }: { employer: Employer | null; onSave: (e: Employer) => void }) {
  const [form, setForm] = useState<Employer>(employer ?? { orgNr:'', name:'', bankAccount:'', taxColumn:33 })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="scroll-container h-full pb-24 px-4">
      <div className="safe-top pt-6 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Konfiguration</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{fontFamily:'Syne, sans-serif'}}>
          Inställningar
        </h1>
      </div>

      <div className="glass-card p-4 mb-4 slide-up">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Företagsinformation</p>
        {[
          { key:'name',        label:'Företagsnamn',    placeholder:'AB Exempelföretaget' },
          { key:'orgNr',       label:'Organisationsnummer', placeholder:'556123-4567' },
          { key:'bankAccount', label:'Bankkonto (BBAN)', placeholder:'SE0000000000000000' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="mb-4">
            <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>
            <input
              value={(form as any)[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500 text-white active:bg-blue-600'
        }`}>
        {saved ? '✓ Sparat!' : 'Spara inställningar'}
      </button>

      <div className="glass-card p-4 mt-4 slide-up border-slate-700/30">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Avtal</p>
        <p className="text-slate-300 text-sm font-medium">Tjänstemannaavtalet</p>
        <p className="text-slate-500 text-xs mt-1">Unionen / Almega · Regler 2026</p>
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-400" />
          <span className="text-slate-400 text-xs">Skattetabell 33 aktiv</span>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL: LÄGG TILL/REDIGERA ANSTÄLLD ──────────────────────────────────────

function EmployeeModal({ employee, onSave, onClose }: {
  employee?: Employee; onSave: (e: Employee) => void; onClose: () => void
}) {
  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    name: employee?.name ?? '',
    personnummer: employee?.personnummer ?? '',
    baseSalary: employee?.baseSalary ?? 35000,
    employmentDegree: employee?.employmentDegree ?? 1.0,
    weeklyHours: employee?.weeklyHours ?? 40,
    overtimeEligible: employee?.overtimeEligible ?? true,
    taxColumn: employee?.taxColumn ?? 33,
    startDate: employee?.startDate ?? new Date().toISOString().slice(0,10),
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ ...form, id: employee?.id ?? generateId() })
    onClose()
  }

  const fields: { key: keyof typeof form; label: string; type?: string; step?: string }[] = [
    { key: 'name',        label: 'Namn' },
    { key: 'personnummer',label: 'Personnummer', placeholder: 'YYYYMMDD-XXXX' } as any,
    { key: 'baseSalary',  label: 'Grundlön (kr)', type: 'number' },
    { key: 'employmentDegree', label: 'Sysselsättningsgrad', type: 'number', step: '0.25' },
    { key: 'weeklyHours', label: 'Veckoarbetstid', type: 'number' },
    { key: 'startDate',   label: 'Startdatum', type: 'date' },
  ]

  const actualSalary = calculateActualSalary(form.baseSalary, form.employmentDegree)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-slate-900 rounded-t-3xl p-5 safe-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white" style={{fontFamily:'Syne, sans-serif'}}>
            {employee ? 'Redigera anställd' : 'Ny anställd'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400">
            <X size={16} />
          </button>
        </div>

        {fields.map(({ key, label, type, step }) => (
          <div key={key} className="mb-4">
            <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>
            <input
              type={type ?? 'text'}
              step={step}
              value={(form as any)[key]}
              onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        ))}

        <div className="flex items-center justify-between mb-5 glass-card p-3">
          <span className="text-slate-300 text-sm">Övertidsberättigad</span>
          <button onClick={() => setForm({ ...form, overtimeEligible: !form.overtimeEligible })}
            className={`w-12 h-6 rounded-full transition-colors ${form.overtimeEligible ? 'bg-blue-500' : 'bg-slate-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${form.overtimeEligible ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="glass-card p-3 mb-5 bg-blue-500/5 border-blue-500/20">
          <p className="text-xs text-slate-400 mb-0.5">Faktisk månadslön</p>
          <p className="text-xl font-bold text-blue-300">{kr(actualSalary)}</p>
        </div>

        <button onClick={handleSave}
          className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold text-sm active:bg-blue-600">
          {employee ? 'Uppdatera' : 'Lägg till'}
        </button>
      </div>
    </div>
  )
}

// ─── MODAL: KÖR LÖN ──────────────────────────────────────────────────────────

function PayrollModal({ employees, onRun, onClose }: {
  employees: Employee[]; onRun: (inputs: Record<string, MonthlyInput>) => void; onClose: () => void
}) {
  const [inputs, setInputs] = useState<Record<string, MonthlyInput>>(() =>
    Object.fromEntries(employees.map(e => [e.id, {
      sickHoursDay1: 0, sickHoursOther: 0,
      overtimeHours1: 0, overtimeHours2: 0,
      extraHours: 0, vacationDays: 0,
    }]))
  )

  const setInput = (id: string, key: keyof MonthlyInput, value: number) => {
    setInputs(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-slate-900 rounded-t-3xl p-5 safe-bottom max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white" style={{fontFamily:'Syne, sans-serif'}}>
            Kör lön · {currentMonth()}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400">
            <X size={16} />
          </button>
        </div>

        {employees.map(emp => {
          const inp = inputs[emp.id]
          return (
            <div key={emp.id} className="glass-card p-4 mb-3">
              <p className="text-white font-semibold text-sm mb-3">{emp.name}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {([
                  ['sickHoursDay1',  'Sjuk timmar (dag 1)'],
                  ['sickHoursOther', 'Sjuk timmar (övr.)'],
                  ['overtimeHours1', 'Övertid vardagar'],
                  ['overtimeHours2', 'Övertid kväll/helg'],
                  ['extraHours',     'Mertid'],
                  ['vacationDays',   'Semesterdagar'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-slate-500 block mb-1">{label}</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={inp?.[key] ?? 0}
                      onChange={e => setInput(emp.id, key, Number(e.target.value))}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <button onClick={() => onRun(inputs)}
          className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold mt-2 active:bg-blue-600">
          Beräkna och spara
        </button>
      </div>
    </div>
  )
}

// ─── HUVUD-APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [modal, setModal] = useState<Modal>(null)
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employer, setEmployer] = useState<Employer | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    setEmployees(getEmployees())
    setEmployer(getEmployer())
  }, [])

  const handleSaveEmployee = (emp: Employee) => {
    saveEmployee(emp)
    setEmployees(getEmployees())
  }

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Ta bort anställd?')) {
      deleteEmployee(id)
      setEmployees(getEmployees())
    }
  }

  const handleRunPayroll = (inputs: Record<string, MonthlyInput>) => {
    const month = currentMonth()
    employees.forEach(emp => {
      const result = calculateMonthlyPayroll(emp, inputs[emp.id], month)
      savePayrollResult(result)
    })
    setModal(null)
    forceUpdate(n => n + 1)
    setPage('dashboard')
  }

  const nav = [
    { key: 'dashboard' as Page, icon: TrendingUp, label: 'Hem' },
    { key: 'employees' as Page, icon: Users,      label: 'Personal' },
    { key: 'payroll'   as Page, icon: Calculator, label: 'Lön' },
    { key: 'reports'   as Page, icon: FileText,   label: 'Rapport' },
    { key: 'settings'  as Page, icon: Settings,   label: 'Inst.' },
  ]

  return (
    <div className="bg-gradient-navy min-h-screen flex flex-col">
      {/* Sidinnehåll */}
      <main className="flex-1 overflow-hidden relative">
        {page === 'dashboard'  && <DashboardPage employees={employees} onRunPayroll={() => setModal('runPayroll')} />}
        {page === 'employees'  && <EmployeesPage employees={employees}
          onAdd={() => { setEditEmployee(undefined); setModal('addEmployee') }}
          onEdit={e => { setEditEmployee(e); setModal('editEmployee') }}
          onDelete={handleDeleteEmployee} />}
        {page === 'payroll'    && <DashboardPage employees={employees} onRunPayroll={() => setModal('runPayroll')} />}
        {page === 'reports'    && <ReportsPage employees={employees} employer={employer} />}
        {page === 'settings'   && <SettingsPage employer={employer} onSave={e => { saveEmployer(e); setEmployer(e) }} />}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 safe-bottom">
        <div className="flex justify-around px-2">
          {nav.map(({ key, icon, label }) => (
            <NavItem key={key} icon={icon} label={label} active={page === key}
              onClick={() => {
                setPage(key)
                if (key === 'payroll') setModal('runPayroll')
              }} />
          ))}
        </div>
      </nav>

      {/* Modaler */}
      {(modal === 'addEmployee' || modal === 'editEmployee') && (
        <EmployeeModal
          employee={editEmployee}
          onSave={handleSaveEmployee}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'runPayroll' && employees.length > 0 && (
        <PayrollModal employees={employees} onRun={handleRunPayroll} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
