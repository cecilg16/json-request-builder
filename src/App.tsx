import { useMemo, useState } from 'react'
import { applyBusinessRules } from './lib/jsonBuilder'
import { statusCatalog as defaultStatusCatalog } from './lib/statusCatalog'
import type { StatusOption } from './lib/types'
import { isIsoCountryCode } from './lib/validators'

function App() {
  const [manualFields, setManualFields] = useState({
    ProviderId: '',
    ProviderName: '',
    MockVariable: '',
    AccountNumber: '',
    CountryTo: '',
  })
  const [statusCatalog] = useState(defaultStatusCatalog)
  const [copyLabel, setCopyLabel] = useState('Copy JSON')
  const [selectedStatus, setSelectedStatus] = useState(defaultStatusCatalog[0].code)
  const [responseEntries, setResponseEntries] = useState<StatusOption[]>([])

  const preview = useMemo(() => {
    if (responseEntries.length === 0) {
      return null
    }

    const activeEntries = responseEntries

    const payload = {
      ProviderId: manualFields.ProviderId || '101713611',
      ProviderName: manualFields.ProviderName || 'DIGICEL',
      MockVariable: manualFields.MockVariable || 'VA_DIGICEL_USEMOCK',
      CountryTo: isIsoCountryCode(manualFields.CountryTo) ? manualFields.CountryTo.toUpperCase() : 'HT',
      Responses: activeEntries.map((entry) => ({
        AccountNumber: manualFields.AccountNumber || '50937007294',
        BeneficiaryAccountName: 'Example Beneficiary',
        BeneficiaryAccountNumber: manualFields.AccountNumber || '50937007294',
        BeneficiaryFamilyName: '',
        BeneficiaryGivenNames: '',
        ProviderStatusCode: entry.code,
        ProviderStatusDescription: entry.description,
      })),
    }

    return applyBusinessRules(payload, manualFields, activeEntries)
  }, [manualFields, responseEntries, selectedStatus, statusCatalog])

  const mockRows = useMemo(() => {
    if (!preview?.Responses || !Array.isArray(preview.Responses)) {
      return []
    }

    return preview.Responses.map((item) => ({
      beneficiaryName: String(item.BeneficiaryAccountName ?? ''),
      accountNumber: String(item.AccountNumber ?? ''),
      statusCode: String(item.ProviderStatusCode ?? ''),
      statusDescription: String(item.ProviderStatusDescription ?? ''),
    }))
  }, [preview])

  const handleExport = () => {
    if (!preview) return

    const blob = new Blob([JSON.stringify(preview, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'final-request.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!preview) return

    const text = JSON.stringify(preview, null, 2)

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopyLabel('Copied!')
      window.setTimeout(() => setCopyLabel('Copy JSON'), 1500)
    } catch (error) {
      setCopyLabel('Copy failed')
      window.setTimeout(() => setCopyLabel('Copy JSON'), 1500)
    }
  }

  const addSelectedStatusToResponseList = () => {
    const selectedEntry = statusCatalog.find((entry) => entry.code === selectedStatus)
    if (!selectedEntry) return

    setResponseEntries((current) => {
      if (current.some((entry) => entry.code === selectedEntry.code)) {
        return current
      }
      return [...current, selectedEntry]
    })
  }

  const removeResponseEntry = (code: string) => {
    setResponseEntries((current) => current.filter((entry) => entry.code !== code))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">JSON Request Builder</p>
          <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">Payment Account Mock Generator</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Enter the request details manually, choose a status code and message from the catalog, and export the final JSON payload.</p>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-xl font-semibold text-white">1. Manual fields</h2>
            <p className="mt-1 text-sm text-slate-400">These are the only fields needed for the MVP.</p>
            <div className="mt-4 grid gap-4">
              {Object.entries(manualFields).map(([key, value]) => (
                <label key={key} className="grid gap-1 text-sm text-slate-200">
                  <span className="text-slate-300">{key}</span>
                  <input
                    value={value}
                    maxLength={key === 'CountryTo' ? 2 : undefined}
                    onChange={(event) => setManualFields((current) => ({ ...current, [key]: event.target.value }))}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                  />
                  {key === 'CountryTo' ? <span className="text-xs text-slate-400">Use exactly 2 ISO letters, such as HT.</span> : null}
                </label>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-xl font-semibold text-white">2. Code / message selector</h2>
            <p className="mt-1 text-sm text-slate-400">Choose a code from the existing catalog and add as many response entries as you need.</p>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
            >
              {statusCatalog.map((option) => (
                <option key={option.code} value={option.code}>{option.code} — {option.description}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={addSelectedStatusToResponseList}
              className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Add selected code to response list
            </button>

            <div className="mt-4 space-y-2">
              {responseEntries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">No response codes added yet. Pick one from the dropdown and click the button above.</p>
              ) : (
                responseEntries.map((option) => (
                  <div key={option.code} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
                    <span>{option.code} — {option.description}</span>
                    <button
                      type="button"
                      onClick={() => removeResponseEntry(option.code)}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200 hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
              <p className="text-slate-400">Rule summary</p>
              <ul className="mt-3 space-y-2 text-slate-200">
                <li>• AccountNumber and BeneficiaryAccountNumber stay aligned</li>
                <li>• BeneficiaryAccountName uses generated first and last names</li>
                <li>• BeneficiaryGivenNames and BeneficiaryFamilyName are populated from the generated names</li>
              </ul>
            </div>
          </article>
        </div>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">3. Preview final JSON</h2>
              <p className="text-sm text-slate-400">The final payload is generated from the parsed JSON plus manual overrides.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                {copyLabel}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Export JSON
              </button>
            </div>
          </div>
          {mockRows.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-100">
                  <thead className="bg-slate-900/90 text-left text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Account Number</th>
                      <th className="px-4 py-3 font-semibold">Beneficiary Name</th>
                      <th className="px-4 py-3 font-semibold">statusDescription</th>
                      <th className="px-4 py-3 font-semibold">statusCode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {mockRows.map((row, index) => (
                      <tr key={`${row.accountNumber}-${row.statusCode}-${index}`} className="hover:bg-slate-900/80">
                        <td className="px-4 py-3">{row.accountNumber}</td>
                        <td className="px-4 py-3">{row.beneficiaryName}</td>
                        <td className="px-4 py-3">{row.statusDescription}</td>
                        <td className="px-4 py-3">{row.statusCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">No mock data rows yet. Add a response code to generate the table.</p>
          )}

          <pre className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-emerald-100">{preview ? JSON.stringify(preview, null, 2) : 'No data to preview yet.'}</pre>
        </article>
      </section>
    </main>
  )
}

export default App
