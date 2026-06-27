const API_KEY = process.env.GEMINI_API_KEY
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Text: Gemini 2.0 Flash (cheap, fast)
export async function geminiChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
): Promise<string> {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not set')

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = { contents }
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] }

  const res = await fetch(`${BASE}/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini text error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// Vision + thinking: Gemini 2.5 Flash (payment verification)
export async function geminiVision(prompt: string, imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(`${BASE}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 8192 },
      },
    }),
  })
  if (!res.ok) throw new Error(`Gemini vision error: ${res.status}`)
  const data = await res.json()
  // Filter thinking parts, ambil hanya final answer
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? []
  return parts.filter(p => !p.thought).map(p => p.text ?? '').join('')
}
