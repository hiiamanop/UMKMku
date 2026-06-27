import type { Product } from '@/lib/supabase/types'
import { parseRecommendations } from '@/lib/ai/chatbot'
import { ChatbotProductCard } from './chatbot-product-card'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  messages: Message[]
  products: Product[]
  slug: string
}

function renderWithLinks(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlPattern)
  return parts.map((part, i) =>
    urlPattern.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
        {part}
      </a>
    ) : part
  )
}

export function ChatbotMessages({ messages, products, slug }: Props) {
  const productMap = new Map(products.map(p => [p.id, p]))

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
                {message.content}
              </div>
            </div>
          )
        }

        const { cleanText, productIds } = parseRecommendations(message.content)
        const recommendedProducts = productIds
          .map(id => productMap.get(id))
          .filter((p): p is Product => p !== undefined)

        return (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[85%] space-y-1">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                {renderWithLinks(cleanText)}
              </div>
              {recommendedProducts.map(product => (
                <ChatbotProductCard key={product.id} product={product} slug={slug} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
