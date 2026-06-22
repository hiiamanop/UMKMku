'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Package, Truck, Home, CheckCircle } from 'lucide-react'

const STEPS = [
  { label: 'DIPROSES', icon: CheckCircle },
  { label: 'DIKIRIM', icon: Truck },
  { label: 'DALAM PERJALANAN', icon: Package },
  { label: 'TIBA', icon: Home },
]

export default function TrackOrderPage() {
  const { slug } = useParams<{ slug: string }>()
  const [orderNumber, setOrderNumber] = useState('')
  const [searched, setSearched] = useState(false)

  // ponytail: mock state untuk sekarang, akan connect ke API orders nanti
  const currentStep = 1 // 0-indexed

  return (
    <main className="bg-[#f9f9f9] min-h-screen py-10">
      <div className="max-w-[800px] mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-[#8f6f73] mb-6">
          <Link href={`/store/${slug}`} className="hover:text-[#e91e63]">Home</Link>
          <span>/</span>
          <span className="text-[#1a1c1c]">Lacak Pesanan</span>
        </div>

        <h1 className="text-headline-lg text-[#1a1c1c] mb-8">Lacak Pesanan</h1>

        {/* Search form */}
        <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 mb-8">
          <p className="text-body-md text-[#5b3f43] mb-4">Masukkan nomor pesanan kamu</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Contoh: #NE-82941"
              className="flex-1 h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
            />
            <button
              onClick={() => setSearched(true)}
              className="px-6 h-12 bg-[#1a1c1c] text-white rounded-lg font-bold text-[14px] uppercase hover:bg-[#333] transition-colors"
            >
              Lacak
            </button>
          </div>
        </div>

        {searched && (
          <>
            {/* Horizontal stepper */}
            <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 mb-6">
              <div className="flex items-start justify-between">
                {STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isDone = i < currentStep
                  const isActive = i === currentStep
                  return (
                    <div key={step.label} className="flex-1 flex flex-col items-center relative">
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div className={`absolute top-6 left-1/2 w-full h-[2px] ${isDone ? 'bg-[#e91e63]' : 'bg-[#e2e2e2]'}`} />
                      )}
                      {/* Node */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isDone ? 'bg-[#006a34]' : isActive ? 'bg-[#e91e63]' : 'bg-[#e2e2e2]'
                      }`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase text-center ${isActive ? 'text-[#e91e63]' : 'text-[#8f6f73]'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[#e8e8e8]">
                <p className="text-label-bold text-[#8f6f73] mb-1">ESTIMASI TIBA</p>
                <p className="text-headline-md text-[#1a1c1c]">2-3 hari kerja</p>
              </div>
            </div>

            {/* Timeline updates */}
            <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 space-y-4">
              <h2 className="text-headline-md text-[#1a1c1c]">Update Status</h2>
              {[
                { time: 'Hari ini, 09:00', desc: 'Paket sedang dalam perjalanan ke kota tujuan' },
                { time: 'Kemarin, 15:30', desc: 'Paket diserahkan ke kurir pengiriman' },
                { time: 'Kemarin, 10:00', desc: 'Pesanan diproses dan dikemas' },
              ].map((update, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#e91e63] mt-2 shrink-0" />
                  <div>
                    <p className="text-body-md text-[#1a1c1c]">{update.desc}</p>
                    <p className="text-[12px] text-[#8f6f73] mt-0.5">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
