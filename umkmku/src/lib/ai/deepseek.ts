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

export async function deepseekVision(prompt: string, imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  const res = await fetch(DEEPSEEK_BASE, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek vision error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
