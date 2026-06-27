import { NextRequest } from 'next/server'
import { buildChatbotSystemPrompt } from '@/lib/ai/chatbot'
import { createServiceClient } from '@/lib/supabase/server'
import { geminiChat } from '@/lib/ai/gemini'

const MAX_MESSAGES = 10
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.replace('/v1', '') ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:12b'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!tenant) {
    return new Response('Toko tidak ditemukan', { status: 404 })
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  // Cek kuota token subscription
  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('id, ai_tokens_used, plan_id')
    .eq('tenant_id', tenant.id)
    .in('status', ['trial', 'active'])
    .maybeSingle()

  if (sub) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('ai_token_limit, ai_token_hard_cap')
      .eq('id', sub.plan_id)
      .single()

    if (plan) {
      const limit = plan.ai_token_limit === -1 ? (plan.ai_token_hard_cap ?? Infinity) : plan.ai_token_limit
      if (sub.ai_tokens_used >= limit) {
        return new Response(
          JSON.stringify({ error: 'Kuota AI chatbot bulan ini sudah habis. Upgrade plan untuk melanjutkan.' }),
          { status: 429 }
        )
      }
    }
  }

  const body = await request.json()
  const messages: { role: string; content: string }[] = body.messages ?? []

  if (messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: 'Sesi chat sudah mencapai batas.' }),
      { status: 429 }
    )
  }

  const systemPrompt = buildChatbotSystemPrompt(tenant, products ?? [])

  // Estimasi kasar: 1 token ≈ 4 karakter
  const estimateTokens = (text: string) => Math.ceil(text.length / 4)

  const incrementTokens = async (tokensUsed: number) => {
    if (!sub) return
    await supabase
      .from('tenant_subscriptions')
      .update({ ai_tokens_used: sub.ai_tokens_used + tokensUsed })
      .eq('id', sub.id)
  }

  const inputTokens = estimateTokens(systemPrompt + messages.map(m => m.content).join(''))
  const encoder = new TextEncoder()

  // Coba Ollama dulu
  try {
    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
        think: false,
        options: { num_predict: 500 },
      }),
    })

    if (ollamaRes.ok && ollamaRes.body) {
      const ollamaReader = ollamaRes.body.getReader()
      const decoder = new TextDecoder()
      let outputTokens = 0
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await ollamaReader.read()
              if (done) break
              const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
              for (const line of lines) {
                try {
                  const json = JSON.parse(line)
                  const token = json?.message?.content ?? ''
                  if (token) { controller.enqueue(encoder.encode(token)); outputTokens += estimateTokens(token) }
                  if (json?.done) {
                    // Ollama memberi eval_count yang lebih akurat jika tersedia
                    const actualOutput = json.eval_count ?? outputTokens
                    const actualInput = json.prompt_eval_count ?? inputTokens
                    await incrementTokens(actualInput + actualOutput)
                    controller.close()
                    return
                  }
                } catch { /* skip incomplete chunk */ }
              }
            }
            controller.close()
          } catch (err) { controller.error(err) }
        },
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
  } catch { /* Ollama tidak tersedia, lanjut ke fallback */ }

  // Fallback: Gemini 2.0 Flash
  try {
    const text = await geminiChat(messages, systemPrompt)
    await incrementTokens(inputTokens + estimateTokens(text))
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(encoder.encode(text)); controller.close() },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch {
    return new Response('AI tidak tersedia saat ini.', { status: 502 })
  }
}
