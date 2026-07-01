import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Clock, CheckCircle2, XCircle, Sparkles, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Dashboard Freelancer, UMKMu' }

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Review', icon: Clock, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Disetujui', icon: CheckCircle2, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  live: { label: 'Live', icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Ditolak', icon: XCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function FreelancerDashboardPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/freelancer/register')

  const service = createServiceClient()

  // Try by user_id first, fallback to email (for accounts registered before auth link)
  let { data: freelancer } = await service
    .from('freelancers')
    .select('id, name, total_earnings, user_id')
    .eq('user_id', user.id)
    .single()

  if (!freelancer && user.email) {
    const { data: byEmail } = await service
      .from('freelancers')
      .select('id, name, total_earnings, user_id')
      .eq('email', user.email)
      .single()

    if (byEmail) {
      freelancer = byEmail
      // Auto-link user_id for future logins
      if (!byEmail.user_id) {
        await service.from('freelancers').update({ user_id: user.id }).eq('id', byEmail.id)
      }
    }
  }

  if (!freelancer) redirect('/freelancer/register?reason=not_registered')

  const { data: submissions } = await service
    .from('template_submissions')
    .select('id, name, category, status, submitted_at, admin_note, preview_image_urls')
    .eq('freelancer_id', freelancer.id)
    .order('submitted_at', { ascending: false })

  const liveCount = submissions?.filter(s => s.status === 'live').length ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Halo, {freelancer.name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{liveCount} template live</p>
        </div>
        <Link
          href="/freelancer/submit"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0A2F73' }}
        >
          <Plus size={15} /> Submit Template
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E5EAF0' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Template Live</p>
          <p className="text-3xl font-bold text-gray-900">{liveCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E5EAF0' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Komisi</p>
          <p className="text-3xl font-bold text-gray-900">
            Rp {(freelancer.total_earnings ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Submissions list */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Template Kamu</h2>
        {!submissions?.length ? (
          <div className="rounded-2xl border bg-white p-10 text-center flex flex-col items-center gap-3" style={{ borderColor: '#E5EAF0' }}>
            <Sparkles size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500">Belum ada template yang disubmit.</p>
            <Link
              href="/freelancer/submit"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background: '#0A2F73' }}
            >
              Submit Template Pertama <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              const preview = (s.preview_image_urls as string[])?.[0] ?? null
              return (
                <div key={s.id} className="rounded-2xl border bg-white p-4 flex items-center gap-4" style={{ borderColor: '#E5EAF0' }}>
                  {preview ? (
                    <img src={preview} alt={s.name} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Sparkles size={18} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">{s.category}</div>
                    {s.admin_note && s.status === 'rejected' && (
                      <div className="text-xs text-red-600 mt-1 line-clamp-1">Catatan admin: {s.admin_note}</div>
                    )}
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
