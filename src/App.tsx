// 🎨 FRONTEND AGENT — Lönesystem App (bugfix: layout + navigation)

import { useState, useEffect } from 'react'
import {
  Users, Calculator, FileText, Settings, Plus, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle, Download, Trash2, Edit3, X
} from 'lucide-react'
import {
  calculateActualSalary, calculateMonthlyPayroll,
  type Employee, type MonthlyInput
} from './engine/calculations'
import {
  getEmployees, saveEmployee, deleteEmployee, generateId,
  getEmployer, saveEmployer, getPayrollForMonth, savePayrollResult,
  type Employer
} from './store'
import { generateAGI, generatePAIN001, generateSIE4, downloadFile } from './engine/exports'

const kr = (n: number) => new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', maximumFractionDigits: 0
}).format(n)

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

type Page = 'dashboard' | 'employees' | 'payroll' | 'reports' | 'settings'
type Modal = 'addEmployee' | 'editEmployee' | 'runPayroll' | null

// ─── STAT-KORT ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'blue' }: {
  label: string; value: string; sub?: string; color?: 'blue' | 'green' | 'amber'
}) {
  const colors = {
    blue:  'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  }
  return (
    <div className={`glass-card bg-gradient-to-br ${colors[color]} p-4`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── NAV-KNAPP ────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
        active ? 'text-blue-400' : 'text-slate-500'
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardPage({ employees, onRunPayroll, onGoToEmployees }: {
  employees: Employee[]
  onRunPayroll: () => void
  onGoToEmployees: () => void
}) {
  const month = currentMonth()
  const results = getPayrollForMonth(month)
  const totalGross = results.reduce((s, r) => s + r.grossSalary, 0)
  const totalNet   = results.reduce((s, r) => s + r.netSalary, 0)
  const totalCost  = results.reduce((s, r) => s + r.grossSalary + r.employerFee, 0)

  return (
    <div className="overflow-y-auto h-full px-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="pt-14 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Lönesystem</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>Översikt</h1>
        <p className="text-slate-400 text-sm">
          {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Anställda" value={String(employees.length)} sub="aktiva" />
        <StatCard label="Bruttolön" value={results.length ? kr(totalGross) : '—'} color="blue" />
        <StatCard label="Nettolön"  value={results.length ? kr(totalNet)   : '—'} color="green" />
        <StatCard label="Total kostnad" value={results.length ? kr(totalCost) : '—'} color="amber" sub="inkl. avg." />
      </div>

      {employees.length === 0 ? (
        <button
          onClick={onGoToEmployees}
          className="w-full glass-card border-blue-500/30 bg-blue-500/10 py-5 px-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Lägg till anställd</p>
              <p className="text-slate-400 text-xs">Kom igång med ditt lönesystem</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      ) : (
        <>
          {results.length === 0 && (
            <button
              onClick={onRunPayroll}
              className="w-full glass-card border-blue-500/30 bg-blue-500/10 py-4 px-5 flex items-center justify-between mb-4"
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

          {results.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Lönespec {month}</p>
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
        </>
      )}
    </div>
  )
}

// ─── ANSTÄLLDA ────────────────────────────────────────────────────────────────

function EmployeesPage({ employees, onAdd, onEdit, onDelete }: {
  employees: Employee[]
  onAdd: () => void
  onEdit: (e: Employee) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="overflow-y-auto h-full px-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="pt-14 pb-4 flex justify-between items-end">
        <div>
          <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Personal</p>
          <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>Anställda</h1>
        </div>
        <button
          onClick={onAdd}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
        >
          <Plus size={22} />
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-1">Inga anställda ännu</p>
          <p className="text-slate-500 text-sm mb-5">Tryck på + för att lägga till din första anställde</p>
          <button
            onClick={onAdd}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            + Lägg till anställd
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-600/40 flex items-center justify-center text-white font-bold text-sm">
                  {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{emp.name}</p>
                  <p className="text-slate-400 text-xs">
                    {kr(calculateActualSalary(emp.baseSalary, emp.employmentDegree))}/mån · {Math.round(emp.employmentDegree * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(emp)}
                  className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => onDelete(emp.id)}
                  className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── RAPPORTER ────────────────────────────────────────────────────────────────

function ReportsPage({ employees, employer }: { employees: Employee[]; employer: Employer | null }) {
  const month = currentMonth()
  const results = getPayrollForMonth(month)

  const handleDownload = (type: 'agi' | 'pain' | 'sie') => {
    if (!employer) { alert('Ange arbetsgivaruppgifter i Inställningar'); return }
    if (results.length === 0) { alert('Kör lön för månaden först'); return }
    const today = new Date().toISOString().slice(0, 10)
    if (type === 'agi') {
      downloadFile(generateAGI(employer, employees, results, month), `AGI_${month}.xml`, 'application/xml')
    } else if (type === 'pain') {
      downloadFile(generatePAIN001({ ...employer, bankAccount: employer.bankAccount || 'SE0000000000000000' }, employees, results, today), `PAIN001_${month}.xml`, 'application/xml')
    } else {
      downloadFile(generateSIE4(employer, results, month), `SIE4_${month}.se`, 'text/plain')
    }
  }

  const exports = [
    { key: 'agi' as const,  icon: FileText,   title: 'AGI – Skatteverket',    sub: 'Arbetsgivardeklaration XML',    color: 'blue' },
    { key: 'pain' as const, icon: Download,   title: 'PAIN.001 – Bank',       sub: 'Bankfil för utbetalning',       color: 'green' },
    { key: 'sie' as const,  icon: TrendingUp, title: 'SIE4 – Bokföring',      sub: 'Import till bokföringssystem',  color: 'amber' },
  ]

  return (
    <div className="overflow-y-auto h-full px-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="pt-14 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Export</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>Rapporter</h1>
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
          <button
            key={key}
            onClick={() => handleDownload(key)}
            className={`w-full glass-card p-4 flex items-center justify-between ${results.length === 0 ? 'opacity-40' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                color === 'blue'  ? 'bg-blue-500/20 text-blue-400' :
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

// ─── INSTÄLLNINGAR ────────────────────────────────────────────────────────────

function SettingsPage({ employer, onSave }: { employer: Employer | null; onSave: (e: Employer) => void }) {
  const [form, setForm] = useState<Employer>(employer ?? { orgNr: '', name: '', bankAccount: '', taxColumn: 33 })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="overflow-y-auto h-full px-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="pt-14 pb-4">
        <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Konfiguration</p>
        <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>Inställningar</h1>
      </div>

      <div className="glass-card p-4 mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Företagsinformation</p>
        {[
          { key: 'name',        label: 'Företagsnamn',        placeholder: 'AB Exempelföretaget' },
          { key: 'orgNr',       label: 'Organisationsnummer', placeholder: '556123-4567' },
          { key: 'bankAccount', label: 'Bankkonto (BBAN)',     placeholder: 'SE0000000000000000' },
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

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
          saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500 text-white'
        }`}
      >
        {saved ? '✓ Sparat!' : 'Spara inställningar'}
      </button>

      <div className="glass-card p-4 mt-4">
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

// ─── MODAL: NY/REDIGERA ANSTÄLLD ──────────────────────────────────────────────

function EmployeeModal({ employee, onSave, onClose }: {
  employee?: Employee; onSave: (e: Employee) => void; onClose: () => void
}) {
  const [form, setForm] = useState({
    name:             employee?.name ?? '',
    personnummer:     employee?.personnummer ?? '',
    baseSalary:       employee?.baseSalary ?? 35000,
    employmentDegree: employee?.employmentDegree ?? 1.0,
    weeklyHours:      employee?.weeklyHours ?? 40,
    overtimeEligible: employee?.overtimeEligible ?? true,
    taxColumn:        employee?.taxColumn ?? 33,
    startDate:        employee?.startDate ?? new Date().toISOString().slice(0, 10),
  })

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Ange namn på den anställde')
      return
    }
    onSave({ ...form, id: employee?.id ?? generateId() })
    onClose()
  }

  const actualSalary = calculateActualSalary(form.baseSalary, form.employmentDegree)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-t-3xl p-5 pb-10"
        style={{
          backgroundColor: '#0f172a',
          maxHeight: '92vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag-indikator */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" />

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {employee ? 'Redigera anställd' : 'Ny anställd'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Namn */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Namn *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Anna Andersson"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* Personnummer */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Personnummer</label>
          <input
            type="text"
            value={form.personnummer}
            onChange={e => setForm({ ...form, personnummer: e.target.value })}
            placeholder="19900101-1234"
            className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* Grundlön */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Grundlön (kr/mån)</label>
          <input
            type="number"
            value={form.baseSalary}
            onChange={e => setForm({ ...form, baseSalary: Number(e.target.value) })}
            className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* Sysselsättningsgrad */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">
            Sysselsättningsgrad ({Math.round(form.employmentDegree * 100)}%)
          </label>
          <input
            type="range"
            min="0.25" max="1.0" step="0.25"
            value={form.employmentDegree}
            onChange={e => setForm({ ...form, employmentDegree: Number(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {/* Veckoarbetstid */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Veckoarbetstid (timmar)</label>
          <input
            type="number"
            value={form.weeklyHours}
            onChange={e => setForm({ ...form, weeklyHours: Number(e.target.value) })}
            className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* Startdatum */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Startdatum</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* Övertid toggle */}
        <div className="flex items-center justify-between mb-5 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-slate-300 text-sm">Övertidsberättigad</span>
          <button
            onClick={() => setForm({ ...form, overtimeEligible: !form.overtimeEligible })}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: form.overtimeEligible ? '#3b82f6' : '#475569' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: form.overtimeEligible ? 'translateX(26px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Faktisk lön preview */}
        <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-xs text-slate-400 mb-0.5">Faktisk månadslön</p>
          <p className="text-2xl font-bold text-blue-300">{kr(actualSalary)}</p>
        </div>

        {/* Spara-knapp */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ backgroundColor: '#3b82f6' }}
        >
          {employee ? 'Uppdatera' : '+ Lägg till'}
        </button>
      </div>
    </div>
  )
}

// ─── MODAL: KÖR LÖN ──────────────────────────────────────────────────────────

function PayrollModal({ employees, onRun, onClose }: {
  employees: Employee[]
  onRun: (inputs: Record<string, MonthlyInput>) => void
  onClose: () => void
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
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="w-full rounded-t-3xl p-5 pb-10"
        style={{ backgroundColor: '#0f172a', maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Kör lön · {currentMonth()}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <X size={16} />
          </button>
        </div>

        {employees.map(emp => {
          const inp = inputs[emp.id]
          return (
            <div key={emp.id} className="glass-card p-4 mb-3">
              <p className="text-white font-semibold text-sm mb-3">{emp.name}</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['sickHoursDay1',  'Sjuktimmar dag 1'],
                  ['sickHoursOther', 'Sjuktimmar övriga'],
                  ['overtimeHours1', 'Övertid vardagar'],
                  ['overtimeHours2', 'Övertid kväll/helg'],
                  ['extraHours',     'Mertid'],
                  ['vacationDays',   'Semesterdagar'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-slate-500 text-xs block mb-1">{label}</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={inp?.[key] ?? 0}
                      onChange={e => setInput(emp.id, key, Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => onRun(inputs)}
          className="w-full py-4 rounded-2xl font-bold text-white mt-2"
          style={{ backgroundColor: '#3b82f6' }}
        >
          Beräkna och spara
        </button>
      </div>
    </div>
  )
}

// ─── HUVUD-APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]               = useState<Page>('dashboard')
  const [modal, setModal]             = useState<Modal>(null)
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>()
  const [employees, setEmployees]     = useState<Employee[]>([])
  const [employer, setEmployer]       = useState<Employer | null>(null)
  const [, forceUpdate]               = useState(0)

  useEffect(() => {
    setEmployees(getEmployees())
    setEmployer(getEmployer())
  }, [])

  const handleSaveEmployee = (emp: Employee) => {
    saveEmployee(emp)
    setEmployees(getEmployees())
  }

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Ta bort anställd?')) {
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

  const goToEmployees = () => {
    setPage('employees')
    setTimeout(() => setModal('addEmployee'), 100)
  }

  const nav = [
    { key: 'dashboard' as Page, icon: TrendingUp, label: 'Hem' },
    { key: 'employees' as Page, icon: Users,      label: 'Personal' },
    { key: 'payroll'   as Page, icon: Calculator, label: 'Lön' },
    { key: 'reports'   as Page, icon: FileText,   label: 'Rapport' },
    { key: 'settings'  as Page, icon: Settings,   label: 'Inst.' },
  ]

  return (
    <div style={{ backgroundColor: '#0a0f1e', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Sidor */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', height: 'calc(100dvh - 65px)' }}>
        {page === 'dashboard' && (
          <DashboardPage employees={employees} onRunPayroll={() => setModal('runPayroll')} onGoToEmployees={goToEmployees} />
        )}
        {page === 'employees' && (
          <EmployeesPage
            employees={employees}
            onAdd={() => { setEditEmployee(undefined); setModal('addEmployee') }}
            onEdit={e => { setEditEmployee(e); setModal('editEmployee') }}
            onDelete={handleDeleteEmployee}
          />
        )}
        {page === 'payroll' && (
          <DashboardPage employees={employees} onRunPayroll={() => setModal('runPayroll')} onGoToEmployees={goToEmployees} />
        )}
        {page === 'reports'  && <ReportsPage employees={employees} employer={employer} />}
        {page === 'settings' && <SettingsPage employer={employer} onSave={e => { saveEmployer(e); setEmployer(e) }} />}
      </main>

      {/* Navigationsfält */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 40,
      }}>
        <div className="flex justify-around px-2">
          {nav.map(({ key, icon, label }) => (
            <NavItem
              key={key} icon={icon} label={label} active={page === key}
              onClick={() => {
                setPage(key)
                if (key === 'payroll') setModal('runPayroll')
              }}
            />
          ))}
        </div>
      </nav>

      {/* Modaler — renderas utanför main, inte påverkade av overflow:hidden */}
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
