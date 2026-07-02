'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tenant } from '@/lib/supabase/types'
import { updateChatbot } from '../actions'
import { FormSection, FieldLabel, StatusMessage } from './form-section'

export function ChatbotForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateChatbot(tenant.slug, formData),
    null
  )

  return (
    <form action={action} className="space-y-0">
      <FormSection
        title="Pengaturan Chatbot"
        description="Chatbot ini akan membantu customer menemukan produk yang tepat di toko kamu."
      >
        <div className="grid grid-cols-1 gap-5">
          <div>
            <FieldLabel hint="Nama yang muncul di header chatbot toko">Nama Beauty Advisor</FieldLabel>
            <Input name="chatbot_name"
              defaultValue={tenant.chatbot_name ?? 'Beauty Advisor'}
              placeholder="Beauty Advisor"
              required
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel hint="Deskripsikan gaya komunikasi chatbot. Semakin detail, semakin baik rekomendasinya.">
              Kepribadian Chatbot
            </FieldLabel>
            <Textarea name="chatbot_persona"
              defaultValue={tenant.chatbot_persona ?? ''}
              placeholder="Contoh: Ramah, informatif, dan selalu memberikan rekomendasi personal. Gunakan bahasa yang hangat dan profesional. Fokus pada manfaat bahan alami."
              className="min-h-[140px] bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 h-auto">
          {pending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
