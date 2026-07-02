'use client'

import { useEffect, useState } from 'react'
import { Zap, ShoppingBag, RefreshCw } from 'lucide-react'

interface Props {
  tenantId: string
  initialTokensUsed: number
  initialTxUsed: number
  tokenLimit: number | null
  txLimit: number | null
  overage: number
  initialAddon?: number
}

export function UsageCard({ tenantId, initialTokensUsed, initialTxUsed, tokenLimit, txLimit, overage: initialOverage, initialAddon = 0 }: Props) {
  const [tokensUsed, setTokensUsed] = useState(initialTokensUsed)
  const [txUsed, setTxUsed] = useState(initialTxUsed)
  const [overageTx, setOverageTx] = useState(initialOverage)
  const [addon, setAddon] = useState(initialAddon)
  const [addonUsed, setAddonUsed] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    const res = await fetch(`/api/dashboard/usage?tenantId=${tenantId}`).then(r => r.json()).catch(() => null)
    if (res) {
      setTokensUsed(res.ai_tokens_used ?? tokensUsed)
      setTxUsed(res.transactions_used ?? txUsed)
      setOverageTx(res.overage_transactions ?? overageTx)
      setAddon(res.transactions_addon ?? addon)
      setAddonUsed(res.transactions_addon_used ?? addonUsed)
    }
    setRefreshing(false)
  }

  // auto-refresh tiap 30 detik
  useEffect(() => {
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [tenantId])

  const tokenPct = tokenLimit ? Math.min(Math.round(tokensUsed / tokenLimit * 100), 100) : 0
  const txPct = txLimit ? Math.min(Math.round(txUsed / txLimit * 100), 100) : 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Penggunaan Bulan Ini</div>
        <button onClick={refresh} disabled={refreshing} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 disabled:opacity-40">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* AI Token */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
            <Zap size={14} style={{ color: '#6b7280' }} />
            AI Chatbot Token
          </div>
          <div className="text-xs text-gray-400">
            {(tokensUsed / 1000).toFixed(1)}k
            {tokenLimit ? ` / ${(tokenLimit / 1000).toFixed(0)}k` : ' / ∞'}
          </div>
        </div>
        {tokenLimit ? (
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${tokenPct}%`,
              background: tokenPct >= 90 ? '#ef4444' : tokenPct >= 70 ? '#f59e0b' : 'var(--color-primary)',
            }} />
          </div>
        ) : (
          <div className="text-xs text-gray-400">Tidak terbatas (cap internal 50 juta)</div>
        )}
        {tokenPct >= 80 && tokenLimit && (
          <p className="text-xs text-amber-600">⚠️ Token hampir habis, pertimbangkan upgrade plan.</p>
        )}
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
            <ShoppingBag size={14} style={{ color: '#6b7280' }} />
            Pesanan
          </div>
          <div className="text-xs text-gray-400">
            {txUsed}{txLimit ? ` / ${txLimit}` : ' / ∞'}
          </div>
        </div>
        {txLimit ? (
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${txPct}%`,
              background: txPct >= 90 ? '#ef4444' : txPct >= 70 ? '#f59e0b' : 'var(--color-primary)',
            }} />
          </div>
        ) : (
          <div className="text-xs text-gray-400">Tidak terbatas</div>
        )}
        {txLimit && txPct >= 80 && (
          <p className="text-xs text-amber-600">⚠️ Kuota pesanan tinggal {txLimit - txUsed}, segera top-up.</p>
        )}
        {addon > 0 && (() => {
          const addonPct = Math.min(Math.round(addonUsed / addon * 100), 100)
          return (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Add-on</span>
                <span>{addonUsed} / {addon}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${addonPct}%`,
                  background: addonPct >= 90 ? '#ef4444' : addonPct >= 70 ? '#f59e0b' : '#0A2F73',
                }} />
              </div>
            </div>
          )
        })()}
      </div>

      {overageTx > 0 && (
        <div className="rounded-xl p-4 border border-orange-100 bg-orange-50 text-sm">
          <div className="font-semibold text-orange-800">Pesanan overage: {overageTx} pesanan</div>
          <div className="text-orange-700 mt-0.5">Biaya tambahan: Rp {(overageTx * 1000).toLocaleString('id-ID')}, akan ditagih bulan depan.</div>
        </div>
      )}
    </div>
  )
}
