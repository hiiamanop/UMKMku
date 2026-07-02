'use client'

import { useState } from 'react'
import Image from 'next/image'

export function ImageUploader({
  name,
  label,
  hint,
  currentUrl,
  aspectClass = 'aspect-video',
}: {
  name: string
  label: string
  hint: string
  currentUrl: string | null | undefined
  aspectClass?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const src = preview ?? currentUrl

  return (
    <div className="space-y-2">
      <label className="text-label-caps text-[10px] text-gray-600">{label}</label>

      {/* Preview */}
      <div className={`${aspectClass} bg-gray-50 border border-black/10 rounded overflow-hidden relative`}>
        {src ? (
          <Image src={src} alt={label} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
            Belum ada gambar
          </div>
        )}
      </div>

      {/* Input */}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-black/15 file:text-xs file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer file:transition-colors file:rounded-none"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setPreview(URL.createObjectURL(file))
        }}
      />
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  )
}
