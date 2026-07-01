import { describe, it, expect } from 'vitest'

// Extract slug dari hostname, pure function, mudah di-test
function extractSlug(hostname: string, rootDomain: string): string | null {
  // Hapus port jika ada
  const host = hostname.split(':')[0]
  const root = rootDomain.split(':')[0]

  if (host === root || host === `www.${root}`) return null
  if (host === `dashboard.${root}`) return null

  const parts = host.split('.')
  if (parts.length >= 2 && host.endsWith(root)) {
    return parts[0]
  }

  return null
}

describe('extractSlug', () => {
  it('returns null for root domain', () => {
    expect(extractSlug('umkmku.com', 'umkmku.com')).toBeNull()
  })

  it('returns null for www subdomain', () => {
    expect(extractSlug('www.umkmku.com', 'umkmku.com')).toBeNull()
  })

  it('returns null for dashboard subdomain', () => {
    expect(extractSlug('dashboard.umkmku.com', 'umkmku.com')).toBeNull()
  })

  it('returns slug for merchant subdomain', () => {
    expect(extractSlug('glow-id.umkmku.com', 'umkmku.com')).toBe('glow-id')
  })

  it('returns null for localhost', () => {
    expect(extractSlug('localhost', 'localhost:3000')).toBeNull()
  })
})
