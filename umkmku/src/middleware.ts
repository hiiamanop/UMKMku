import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PATHS = ['/profile', '/orders', '/checkout', '/order']

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const slug = extractSlug(hostname, rootDomain)

  if (!slug) {
    const pathname = request.nextUrl.pathname

    // Admin auth guard, proteksi semua /admin/* kecuali /admin/login
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }
      // Role check, hanya super_admin yang boleh akses /admin/*
      const serviceDb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      )
      const { data: profile } = await serviceDb.from('user_profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'super_admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const url = request.nextUrl.clone()

  if (url.pathname.startsWith('/api/')) return NextResponse.next()
  if (url.pathname.startsWith('/store/')) return NextResponse.next()

  const originalPath = url.pathname

  // Auth guard for protected store paths
  if (PROTECTED_PATHS.some(p => originalPath === p || originalPath.startsWith(p + '/'))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      url.pathname = `/store/${slug}/login`
      return NextResponse.redirect(url)
    }
  }

  url.pathname = `/store/${slug}${originalPath}`
  return NextResponse.rewrite(url)
}

export function extractSlug(hostname: string, rootDomain: string): string | null {
  const host = hostname.split(':')[0]
  const root = rootDomain.split(':')[0]

  if (host === root || host === `www.${root}`) return null
  if (host === `dashboard.${root}`) return null

  if (host.endsWith(`.${root}`)) {
    const subdomain = host.slice(0, -(root.length + 1))
    if (subdomain && !subdomain.includes('.')) return subdomain
  }

  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
