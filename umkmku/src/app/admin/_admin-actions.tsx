'use client'

import { useState } from 'react'

interface Props {
  tenantId: string
  subscriptionId?: string
  currentStatus?: string
  isActive: boolean
}

export function AdminActions({ tenantId, subscriptionId, currentStatus, isActive }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const act = async (action: string, planId?: string) => {
    setLoading(true)
    try {
      await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, subscriptionId, action, planId }),
      })
      setDone(true)
      setTimeout(() => { setDone(false); window.location.reload() }, 800)
    } finally {
      setLoading(false)
    }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Tersimpan</span>
  if (loading) return <span className="text-xs text-[#5E6B85]">...</span>

  const isSuspended = !isActive || currentStatus === 'suspended' || currentStatus === 'expired'

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      {isSuspended ? (
        <>
          <button
            onClick={() => act('activate', 'business')}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium text-center"
            style={{ background: '#0A2F73' }}
          >
            Aktifkan Business
          </button>
          <button
            onClick={() => act('activate', 'enterprise')}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium text-center"
            style={{ color: '#0A2F73', borderColor: '#E5EAF0' }}
          >
            Aktifkan Enterprise
          </button>
        </>
      ) : (
        <>
          {currentStatus === 'trial' && (
            <button
              onClick={() => act('activate', 'business')}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium text-center"
              style={{ background: '#F4B400', color: '#1a1a1a' }}
            >
              Upgrade Business
            </button>
          )}
          {currentStatus === 'active' && (
            <select
              onChange={(e) => e.target.value && act('change-plan', e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border text-[#0A2F73] cursor-pointer"
              style={{ borderColor: '#E5EAF0' }}
              defaultValue=""
            >
              <option value="" disabled>Ganti plan...</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          )}
          <button
            onClick={() => act('suspend')}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium text-center text-red-600"
            style={{ borderColor: '#fecaca' }}
          >
            Suspend
          </button>
        </>
      )}
    </div>
  )
}
