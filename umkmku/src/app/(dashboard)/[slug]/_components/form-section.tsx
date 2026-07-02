export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-black/5 pb-10 mb-10 last:border-0 last:mb-0 last:pb-0">
      <div className="mb-6">
        <h2 className="text-headline-md italic">{title}</h2>
        {description && <p className="text-body-md text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-label-caps text-[10px] text-gray-600">{children}</label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export function StatusMessage({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null
  if (state.error) return <p className="text-sm text-red-500 border border-red-200 bg-red-50 px-4 py-3 rounded">{state.error}</p>
  if (state.success) return <p className="text-sm text-green-700 border border-green-200 bg-green-50 px-4 py-3 rounded">Perubahan berhasil disimpan.</p>
  return null
}
