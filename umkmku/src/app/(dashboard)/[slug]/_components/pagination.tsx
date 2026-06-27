import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  total: number
  pageSize: number
  basePath: string   // e.g. "/myslug/orders"
  searchParams?: Record<string, string>
}

export function Pagination({ page, total, pageSize, basePath, searchParams = {} }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  function href(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) })
    return `${basePath}?${params}`
  }

  const btnCls = 'flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border border-black/15 hover:bg-black/5 transition-colors disabled:opacity-40 disabled:pointer-events-none text-[var(--color-accent)]'

  return (
    <div className="flex items-center justify-between pt-4 border-t border-black/8">
      <p className="text-[11px] text-[var(--color-accent)]/40">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1
          ? <Link href={href(page - 1)} className={btnCls}><ChevronLeft size={12} />Sebelumnya</Link>
          : <span className={`${btnCls} opacity-30 pointer-events-none`}><ChevronLeft size={12} />Sebelumnya</span>
        }
        <span className="text-[11px] text-[var(--color-accent)]/50 px-1">{page} / {totalPages}</span>
        {page < totalPages
          ? <Link href={href(page + 1)} className={btnCls}>Berikutnya<ChevronRight size={12} /></Link>
          : <span className={`${btnCls} opacity-30 pointer-events-none`}>Berikutnya<ChevronRight size={12} /></span>
        }
      </div>
    </div>
  )
}
