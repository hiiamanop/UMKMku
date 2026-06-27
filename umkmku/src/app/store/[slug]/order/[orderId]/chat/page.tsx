import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { OrderChatClient } from './_chat-client'

interface Props { params: Promise<{ slug: string; orderId: string }> }

export default async function OrderChatPage({ params }: Props) {
  const { slug, orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/store/${slug}/login`)

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const service = createServiceClient()
  const { data: tenant } = await service.from('tenants').select('brand_name, qris_image_url, whatsapp_number, chatbot_name').eq('slug', slug).single()
  if (!tenant) notFound()

  // If no chats yet, seed with AI greeting
  const { data: existing } = await supabase.from('order_chats').select('id').eq('order_id', orderId).limit(1)

  if (!existing || existing.length === 0) {
    const totalFmt = 'Rp ' + order.total_amount.toLocaleString('id-ID')
    const itemList = (order.order_items ?? [])
      .map((i: any) => `• ${i.product_name} (x${i.quantity}) — Rp ${(i.product_price * i.quantity).toLocaleString('id-ID')}`)
      .join('\n')

    const greeting = `Halo! 👋 Terima kasih telah berbelanja di **${tenant.brand_name}**.

Berikut detail pesananmu:
${itemList}

**Total yang harus dibayar: ${totalFmt}**

${tenant.qris_image_url
  ? `Silakan scan QRIS di atas untuk melakukan pembayaran:`
  : `Silakan lakukan pembayaran melalui transfer ke rekening kami. Tim kami akan segera menghubungimu via WhatsApp.`
}

Setelah membayar, kirimkan bukti pembayaran (screenshot) ke chat ini ya! 📸`

    await supabase.from('order_chats').insert({
      order_id: orderId,
      role: 'assistant',
      content: greeting,
      attachment_url: tenant.qris_image_url || null,
    })
  }

  const { data: messages } = await supabase
    .from('order_chats')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  return (
    <OrderChatClient
      slug={slug}
      order={order}
      tenant={tenant}
      initialMessages={messages ?? []}
    />
  )
}
