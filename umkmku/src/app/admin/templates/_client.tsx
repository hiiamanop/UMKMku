'use client'

import { useState } from 'react'
import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Scan, Check, X, Loader2, ChevronDown, ChevronRight, Sparkles, Monitor, Smartphone } from 'lucide-react'

interface SecurityFlag {
  severity: 'critical' | 'warning'
  pattern: string
  file: string
  line?: number
}

interface SecurityReport {
  flags: SecurityFlag[]
  criticalCount: number
  warningCount: number
  scannedFiles: number
  manifestValid: boolean
  manifestData: Record<string, unknown> | null
  error?: string
}

interface Submission {
  id: string
  name: string
  description: string | null
  category: string
  repo_url: string
  demo_url: string
  preview_image_urls: string[]
  security_report: SecurityReport | null
  status: string
  admin_note: string | null
  submitted_at: string
  freelancers: { id: string; name: string; email: string } | null
}

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'live', label: 'Live' },
  { value: 'rejected', label: 'Ditolak' },
]

const PRIMARY = '#0A2F73'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

export function AdminTemplatesClient({ submissions: initial }: { submissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [scanning, setScanning] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [previewMode, setPreviewMode] = useState<Record<string, 'desktop' | 'mobile'>>({})

  const filtered = filter ? submissions.filter(s => s.status === filter) : submissions

  async function scan(id: string) {
    setScanning(id)
    try {
      const res = await fetch(`/api/admin/templates/submissions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      })
      const { report } = await res.json()
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, security_report: report } : s))
    } finally {
      setScanning(null)
    }
  }

  async function act(id: string, action: 'approve' | 'reject') {
    setActing(id + action)
    try {
      await fetch(`/api/admin/templates/submissions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: notes[id] ?? null }),
      })
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, admin_note: notes[id] ?? null } : s))
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Template Submissions</h1>
        <span className="text-sm text-gray-400">{submissions.length} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: filter === t.value ? PRIMARY : 'white',
              color: filter === t.value ? 'white' : TEXT_SEC,
              border: `1.5px solid ${filter === t.value ? PRIMARY : BORDER}`,
            }}
          >
            {t.label}
            {t.value && (
              <span className="ml-1.5 text-xs opacity-70">
                {submissions.filter(s => s.status === t.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">Tidak ada submission.</div>
        )}
        {filtered.map(sub => {
          const isOpen = expanded === sub.id
          const report = sub.security_report
          const mode = previewMode[sub.id] ?? 'desktop'
          const desktopImg = sub.preview_image_urls?.[0] ?? null
          const mobileImg = sub.preview_image_urls?.[1] ?? desktopImg

          return (
            <div key={sub.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
              {/* Header */}
              <button
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : sub.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{sub.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{sub.category}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {sub.freelancers?.name} · {new Date(sub.submitted_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                {report && (
                  <SecurityBadge report={report} />
                )}
                {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
              </button>

              {/* Detail */}
              {isOpen && (
                <div className="border-t p-5 space-y-5" style={{ borderColor: BORDER }}>
                  {/* Preview images */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
                      {(desktopImg || mobileImg) && (
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                          <button onClick={() => setPreviewMode(p => ({ ...p, [sub.id]: 'desktop' }))} className={`p-1 rounded transition-colors ${mode === 'desktop' ? 'bg-white shadow-sm' : ''}`} title="Desktop">
                            <Monitor size={13} className="text-gray-600" />
                          </button>
                          <button onClick={() => setPreviewMode(p => ({ ...p, [sub.id]: 'mobile' }))} className={`p-1 rounded transition-colors ${mode === 'mobile' ? 'bg-white shadow-sm' : ''}`} title="Mobile">
                            <Smartphone size={13} className="text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(mode === 'desktop' ? [desktopImg] : [mobileImg]).filter(Boolean).map((url, i) => (
                        <img key={i} src={url!} alt="preview" className="h-40 rounded-xl border object-cover" style={{ borderColor: BORDER }} />
                      ))}
                      {sub.preview_image_urls?.slice(2).map((url, i) => (
                        <img key={i + 2} src={url} alt={`preview ${i + 3}`} className="h-40 rounded-xl border object-cover" style={{ borderColor: BORDER }} />
                      ))}
                      {!desktopImg && !mobileImg && (
                        <div className="flex items-center justify-center h-32 w-48 rounded-xl bg-gray-50 text-gray-300">
                          <Sparkles size={24} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-3">
                    <a href={sub.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <ExternalLink size={14} /> Repo
                    </a>
                    <a href={sub.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <ExternalLink size={14} /> Live Demo
                    </a>
                  </div>

                  {/* Security report */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Scan</span>
                      <button
                        onClick={() => scan(sub.id)}
                        disabled={scanning === sub.id}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                        style={{ background: `${PRIMARY}12`, color: PRIMARY }}
                      >
                        {scanning === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Scan size={11} />}
                        {report ? 'Scan Ulang' : 'Jalankan Scan'}
                      </button>
                    </div>
                    {report && <SecurityReportView report={report} />}
                  </div>

                  {/* Admin note + actions */}
                  {sub.status === 'pending' && (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Catatan untuk freelancer (wajib jika menolak)..."
                        value={notes[sub.id] ?? ''}
                        onChange={e => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                        style={{ borderColor: BORDER, minHeight: '64px' }}
                        onFocus={e => (e.target.style.borderColor = PRIMARY)}
                        onBlur={e => (e.target.style.borderColor = BORDER)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(sub.id, 'approve')}
                          disabled={!!acting}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#16a34a' }}
                        >
                          {acting === sub.id + 'approve' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Setujui
                        </button>
                        <button
                          onClick={() => act(sub.id, 'reject')}
                          disabled={!!acting || !notes[sub.id]?.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 bg-red-500"
                        >
                          {acting === sub.id + 'reject' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                          Tolak
                        </button>
                      </div>
                    </div>
                  )}
                  {sub.status !== 'pending' && sub.admin_note && (
                    <div className="rounded-xl p-3 text-sm text-gray-600 bg-gray-50 border" style={{ borderColor: BORDER }}>
                      <span className="font-semibold">Catatan admin: </span>{sub.admin_note}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    live: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  const LABELS: Record<string, string> = { pending: 'Pending', approved: 'Disetujui', live: 'Live', rejected: 'Ditolak' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${MAP[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {LABELS[status] ?? status}
    </span>
  )
}

function SecurityBadge({ report }: { report: SecurityReport }) {
  if (report.criticalCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 shrink-0">
        <ShieldAlert size={14} /> {report.criticalCount} critical
      </div>
    )
  }
  if (report.warningCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 shrink-0">
        <Shield size={14} /> {report.warningCount} warning
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 shrink-0">
      <ShieldCheck size={14} /> Aman
    </div>
  )
}

function SecurityReportView({ report }: { report: SecurityReport }) {
  if (report.error) {
    return <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 border border-red-200">{report.error}</div>
  }

  return (
    <div className="rounded-xl border overflow-hidden text-sm" style={{ borderColor: '#E5EAF0' }}>
      <div className="px-4 py-2.5 flex items-center gap-4 bg-gray-50 border-b" style={{ borderColor: '#E5EAF0' }}>
        <span className={`font-semibold ${report.criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {report.criticalCount} critical
        </span>
        <span className={`font-semibold ${report.warningCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
          {report.warningCount} warnings
        </span>
        <span className="text-gray-400">{report.scannedFiles} files scanned</span>
        <span className={`ml-auto text-xs font-semibold ${report.manifestValid ? 'text-green-600' : 'text-red-600'}`}>
          manifest.json: {report.manifestValid ? 'Valid ✓' : 'Invalid ✗'}
        </span>
      </div>
      {report.flags.length === 0 ? (
        <div className="px-4 py-3 text-green-600 flex items-center gap-2">
          <ShieldCheck size={14} /> Tidak ada flag yang ditemukan
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#E5EAF0' }}>
          {report.flags.map((flag, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
              <span className={`text-xs font-bold uppercase mt-0.5 shrink-0 ${flag.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                {flag.severity}
              </span>
              <div className="min-w-0">
                <span className="font-medium text-gray-800">{flag.pattern}</span>
                <span className="text-gray-400 ml-2 text-xs">{flag.file}{flag.line ? `:${flag.line}` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
