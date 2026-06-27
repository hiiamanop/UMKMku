import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

// Hanya untuk onboarding via AI SDK (Ollama dev).
// Production pakai geminiChat() dari gemini.ts langsung.
export function getAIModel(): LanguageModel {
  const ollama = createOpenAICompatible({
    name: 'ollama',
    baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
  })
  return ollama(process.env.OLLAMA_MODEL ?? 'gemma4:12b')
}

// true = skip AI SDK, langsung geminiChat
export function useGeminiDirect(): boolean {
  return (process.env.AI_PROVIDER ?? 'ollama') === 'gemini'
}
