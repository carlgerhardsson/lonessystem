// ⚙️ BACKEND AGENT — Exportmodul
// Genererar AGI (XML), PAIN.001 (XML) och SIE4 (text)

import type { Employee, PayrollResult } from './calculations'

// ─── AGI — Arbetsgivardeklaration på individnivå ─────────────────────────────

export function generateAGI(
  employer: { orgNr: string; name: string },
  employees: Employee[],
  results: PayrollResult[],
  period: string  // YYYYMM
): string {
  const rows = results.map(r => {
    const emp = employees.find(e => e.id === r.employeeId)!
    return `
    <Inkomsttagare>
      <Personnummer>${emp.personnummer}</Personnummer>
      <Namn>${emp.name}</Namn>
      <Inkomst>
        <BetaldErsattning>${Math.round(r.grossSalary)}</BetaldErsattning>
        <AvdragenSkatt>${r.incomeTax}</AvdragenSkatt>
        <Arbetsgivaravgift>${Math.round(r.employerFee)}</Arbetsgivaravgift>
      </Inkomst>
    </Inkomsttagare>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Skatteverket>
  <Arbetsgivardeklaration>
    <Redovisningsperiod>${period}</Redovisningsperiod>
    <Arbetsgivare>
      <OrganisationsNummer>${employer.orgNr}</OrganisationsNummer>
      <Namn>${employer.name}</Namn>
    </Arbetsgivare>
    <IndividUppgifter>${rows}
    </IndividUppgifter>
  </Arbetsgivardeklaration>
</Skatteverket>`
}

// ─── PAIN.001 — Bankfil för utbetalning ─────────────────────────────────────

export function generatePAIN001(
  employer: { orgNr: string; name: string; bankAccount: string },
  employees: Employee[],
  results: PayrollResult[],
  paymentDate: string  // YYYY-MM-DD
): string {
  const totalAmount = results.reduce((sum, r) => sum + r.netSalary, 0)
  
  const transactions = results.map((r, idx) => {
    const emp = employees.find(e => e.id === r.employeeId)!
    return `
      <CdtTrfTxInf>
        <PmtId><EndToEndId>LON-${r.month}-${String(idx + 1).padStart(3, '0')}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="SEK">${r.netSalary.toFixed(2)}</InstdAmt></Amt>
        <Cdtr><Nm>${emp.name}</Nm></Cdtr>
        <RmtInf><Ustrd>Lön ${r.month}</Ustrd></RmtInf>
      </CdtTrfTxInf>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG-${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${results.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${employer.name}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt><Dt>${paymentDate}</Dt></ReqdExctnDt>
      <Dbtr><Nm>${employer.name}</Nm></Dbtr>
      <DbtrAcct><Id><Othr><Id>${employer.bankAccount}</Id></Othr></Id></DbtrAcct>
      ${transactions}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
}

// ─── SIE4 — Bokföringsfil ─────────────────────────────────────────────────────

export function generateSIE4(
  employer: { orgNr: string; name: string },
  results: PayrollResult[],
  period: string  // YYYYMM
): string {
  const totalGross = results.reduce((s, r) => s + r.grossSalary, 0)
  const totalTax = results.reduce((s, r) => s + r.incomeTax, 0)
  const totalNet = results.reduce((s, r) => s + r.netSalary, 0)
  const totalEmployerFee = results.reduce((s, r) => s + r.employerFee, 0)

  const lines = [
    `#FLAGGA 0`,
    `#FORMAT PC8`,
    `#SIETYP 4`,
    `#PROGRAM "Lonessystem" 1.0`,
    `#GEN ${period}`,
    `#FNAMN "${employer.name}"`,
    `#ORGNR ${employer.orgNr}`,
    ``,
    `#VER L ${period} ${period} "Löner ${period}"`,
    `{`,
    `  #TRANS 7010 {} ${totalGross.toFixed(2)} "" "Lönekostnad"`,
    `  #TRANS 2710 {} -${totalTax.toFixed(2)} "" "Källskatt"`,
    `  #TRANS 2730 {} -${totalEmployerFee.toFixed(2)} "" "Arbetsgivaravgift"`,
    `  #TRANS 1930 {} -${totalNet.toFixed(2)} "" "Utbetalning bank"`,
    `}`,
  ]

  return lines.join('\n')
}

// ─── Hjälpfunktion: Ladda ner fil ────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
