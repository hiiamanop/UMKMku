const DEEPSEEK_BASE = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-v4-flash'

function headers() {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error('DEEPSEEK_API_KEY not set')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
}

export async function deepseekChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
): Promise<string> {
  const res = await fetch(DEEPSEEK_BASE, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// DeepSeek API belum support vision, pakai Gemini 2.0 Flash (free tier)
export async function deepseekVision(prompt: string, imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini vision error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
