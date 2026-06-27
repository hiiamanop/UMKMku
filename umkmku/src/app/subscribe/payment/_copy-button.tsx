'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors hover:bg-white"
      style={{ color: copied ? '#16a34a' : TEXT_SEC, border: `1px solid ${BORDER}` }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Tersalin!' : 'Salin'}
    </button>
  )
}
