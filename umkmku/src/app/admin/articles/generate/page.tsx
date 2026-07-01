'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, CheckCircle2 } from 'lucide-react'

export default function GenerateArticlePage() {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<{ id: string; title: string }[]>([])
  const [error, setError]       = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res  = await fetch('/api/admin/articles/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.articles ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal generate artikel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0A2F73] mb-2">Generate Artikel</h1>
      <p className="text-sm text-[#5E6B85] mb-8">
        AI mengambil berita terbaru per kategori produk aktif + berita UMKM Indonesia,
        lalu menyusun satu artikel draft per topik sekaligus.
      </p>

      <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm text-[#5E6B85]">
          <div><strong>Sumber:</strong> Google News RSS per kategori aktif</div>
          <div><strong>Topik tambahan:</strong> Cara UMKM berkembang & mandiri</div>
          <div><strong>Output:</strong> 1 artikel draft per kategori aktif + 1 artikel UMKM umum</div>
          <div><strong>Format:</strong> HTML terstruktur + prompt gambar ChatGPT</div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#0A2F73] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating semua kategori... (1–3 menit)
            </>
          ) : (
            <>
              <FileText size={16} />
              Generate Semua Artikel
            </>
          )}
        </button>

        {loading && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            AI sedang mengambil berita dan menulis artikel untuk setiap kategori secara paralel.
            Harap tunggu, proses ini memakan waktu 1–3 menit.
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        {results.length > 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
              <CheckCircle2 size={16} />
              {results.length} artikel berhasil dibuat sebagai draft
            </div>
            <ul className="flex flex-col gap-1">
              {results.map(a => (
                <li key={a.id} className="text-sm text-gray-700">• {a.title}</li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/admin/articles')}
              className="mt-1 text-sm font-medium text-[#0A2F73] underline w-fit"
            >
              Lihat semua draft artikel →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
