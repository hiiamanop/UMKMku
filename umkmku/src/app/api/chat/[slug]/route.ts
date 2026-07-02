import { NextRequest } from 'next/server'
import { buildChatbotSystemPrompt } from '@/lib/ai/chatbot'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deepseekChatWithUsage } from '@/lib/ai/deepseek'
import { sendWhatsAppMessage } from '@/lib/notifications/whatsapp'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_MESSAGES = 10
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.replace('/v1', '') ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:12b'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(`chat:${ip}:${slug}`, 20, 60_000)) {
    return new Response(JSON.stringify({ error: 'Terlalu banyak permintaan' }), { status: 429 })
  }

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
    .select('id, ai_tokens_used, plan_id, ai_token_limit_override, notified_80pct_tokens')
    .eq('tenant_id', tenant.id)
    .in('status', ['trial', 'active'])
    .maybeSingle()

  let tokenLimit: number | null = null
  if (sub) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('ai_token_limit, ai_token_hard_cap')
      .eq('id', sub.plan_id)
      .single()

    if (plan) {
      const planLimit = plan.ai_token_limit === -1 ? (plan.ai_token_hard_cap ?? null) : plan.ai_token_limit
      tokenLimit = sub.ai_token_limit_override ?? planLimit
      if (tokenLimit !== null && sub.ai_tokens_used >= tokenLimit) {
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

  // Cek user yang sedang login untuk context personal
  let userContext = null
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, skin_type, skin_concerns')
        .eq('id', user.id)
        .single()
      if (profile) {
        userContext = { name: profile.full_name, skinType: profile.skin_type, skinConcerns: profile.skin_concerns }
      }
    }
  } catch { /* opsional, lanjut tanpa context user */ }

  const systemPrompt = buildChatbotSystemPrompt(tenant, products ?? [], userContext)

  // Estimasi kasar: 1 token ≈ 4 karakter
  const estimateTokens = (text: string) => Math.ceil(text.length / 4)

  const incrementTokens = async (tokensUsed: number) => {
    if (!sub) return
    // ponytail: non-atomic, upgrade ke RPC increment jika traffic tinggi / race condition terdeteksi.
    const { data: freshSub } = await supabase.from('tenant_subscriptions').select('ai_tokens_used, notified_80pct_tokens').eq('id', sub.id).single()
    const newTotal = (freshSub?.ai_tokens_used ?? sub.ai_tokens_used) + tokensUsed
    const update: Record<string, unknown> = { ai_tokens_used: newTotal }

    if (tokenLimit && !freshSub?.notified_80pct_tokens && newTotal / tokenLimit >= 0.8) {
      update.notified_80pct_tokens = true
      const pct = Math.round(newTotal / tokenLimit * 100)
      sendWhatsAppMessage(
        tenant.whatsapp_number,
        `⚠️ *Token AI chatbot hampir habis!*\n\nHalo ${tenant.brand_name}, token AI toko kamu sudah terpakai *${pct}%*.\n\nSisa: ${(tokenLimit - newTotal).toLocaleString('id-ID')} token.\n\nUpgrade plan untuk mendapatkan lebih banyak token: ${process.env.NEXT_PUBLIC_APP_URL}/store/${tenant.slug}/dashboard/subscription`,
      ).catch(() => {})
    }

    await supabase.from('tenant_subscriptions').update(update).eq('id', sub.id)

    // Catat ke daily usage history (increment)
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase.from('tenant_usage_daily').select('tokens_used').eq('tenant_id', tenant.id).eq('date', today).maybeSingle()
    await supabase.from('tenant_usage_daily').upsert(
      { tenant_id: tenant.id, date: today, tokens_used: (existing?.tokens_used ?? 0) + tokensUsed, orders_used: 0, addon_used: 0 },
      { onConflict: 'tenant_id,date' }
    )
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

  // Fallback: DeepSeek
  try {
    const { text, tokensUsed } = await deepseekChatWithUsage(messages, systemPrompt)
    await incrementTokens(tokensUsed || inputTokens + estimateTokens(text))
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(encoder.encode(text)); controller.close() },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch {
    return new Response('AI tidak tersedia saat ini.', { status: 502 })
  }
}
