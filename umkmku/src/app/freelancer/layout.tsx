import Link from 'next/link'
import { LogoutButton } from './_logout-button'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav style={{ borderBottom: `1px solid ${BORDER}` }} className="bg-white">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${PRIMARY}12`, color: PRIMARY }}>
              Freelancer Portal
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <Link href="/freelancer/dashboard" className="hover:text-[#0A2F73] transition-colors">Dashboard</Link>
            <Link href="/freelancer/submit" className="hover:text-[#0A2F73] transition-colors">Submit Template</Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
