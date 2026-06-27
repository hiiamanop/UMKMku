import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Called by Vercel Cron every hour
// Cancels pending_payment orders past their 2-hour expiry
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()

  const { data: expired, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending_payment')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!expired?.length) return NextResponse.json({ cancelled: 0 })

  const ids = expired.map(o => o.id)

  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .in('id', ids)

  // Notify customers via chat
  const chatInserts = ids.map(id => ({
    order_id: id,
    role: 'assistant',
    content: '⏰ Pesananmu telah otomatis dibatalkan karena batas waktu pembayaran (2 jam) telah terlewati. Kamu bisa membuat pesanan baru kapan saja.',
  }))
  await supabase.from('order_chats').insert(chatInserts)

  return NextResponse.json({ cancelled: ids.length })
}
