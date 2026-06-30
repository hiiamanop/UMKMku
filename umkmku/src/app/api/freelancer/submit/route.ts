import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_REPO_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org']
const VALID_CATEGORIES = ['skincare', 'parfum', 'fashion', 'fdb']

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login terlebih dahulu.' }, { status: 401 })

    const { name, description, category, repo_url, demo_url, preview_image_urls } = await request.json()

    if (!name?.trim() || !category || !repo_url?.trim() || !demo_url?.trim()) {
      return NextResponse.json({ error: 'Nama, kategori, repo URL, dan demo URL wajib diisi.' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid.' }, { status: 400 })
    }

    // Validate repo URL host
    let repoHost: string
    try {
      repoHost = new URL(repo_url).hostname.replace('www.', '')
    } catch {
      return NextResponse.json({ error: 'Repo URL tidak valid.' }, { status: 400 })
    }
    if (!ALLOWED_REPO_HOSTS.includes(repoHost)) {
      return NextResponse.json({ error: 'Repo harus dari GitHub, GitLab, atau Bitbucket.' }, { status: 400 })
    }

    // Validate demo URL
    try { new URL(demo_url) } catch {
      return NextResponse.json({ error: 'Demo URL tidak valid.' }, { status: 400 })
    }

    const service = createServiceClient()

    // Get freelancer
    const { data: freelancer } = await service
      .from('freelancers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!freelancer) {
      return NextResponse.json({ error: 'Daftar sebagai freelancer terlebih dahulu.' }, { status: 403 })
    }

    const { error } = await service.from('template_submissions').insert({
      freelancer_id: freelancer.id,
      name: name.trim(),
      description: description?.trim() || null,
      category,
      repo_url: repo_url.trim(),
      demo_url: demo_url.trim(),
      preview_image_urls: Array.isArray(preview_image_urls) ? preview_image_urls : [],
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Freelancer submit error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
