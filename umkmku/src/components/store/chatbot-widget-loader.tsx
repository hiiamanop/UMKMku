'use client'

import dynamic from 'next/dynamic'
import type { Tenant, Product } from '@/lib/supabase/types'

// Lazy load chatbot, tidak delay First Contentful Paint
const ChatbotWidget = dynamic(
  () => import('./chatbot-widget').then(m => m.ChatbotWidget),
  { ssr: false }
)

interface Props {
  tenant: Tenant
  products: Product[]
}

export function ChatbotWidgetLoader({ tenant, products }: Props) {
  return <ChatbotWidget tenant={tenant} products={products} />
}
