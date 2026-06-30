import { FreelancerRegisterForm } from './_form'
import { AlertCircle } from 'lucide-react'

export const metadata = { title: 'Daftar Freelancer — UMKMu' }

interface Props {
  searchParams: Promise<{ reason?: string }>
}

export default async function FreelancerRegisterPage({ searchParams }: Props) {
  const { reason } = await searchParams

  return (
    <div className="max-w-lg mx-auto">
      {reason === 'not_registered' && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Kamu belum terdaftar sebagai Template Creator. Daftar terlebih dahulu untuk mengakses dashboard.
          </p>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar sebagai Template Creator</h1>
        <p className="text-sm text-gray-500">
          Submit design template kamu, dan dapatkan komisi setiap kali ada merchant yang menggunakannya.
        </p>
      </div>
      <FreelancerRegisterForm />
    </div>
  )
}
