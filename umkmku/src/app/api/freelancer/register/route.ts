import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, bio, portfolio_url, user_id } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi.' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('freelancers').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      bio: bio?.trim() || null,
      portfolio_url: portfolio_url?.trim() || null,
      user_id: user_id ?? null,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email ini sudah terdaftar.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Freelancer register error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
