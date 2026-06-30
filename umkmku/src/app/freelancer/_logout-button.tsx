'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/freelancer/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-red-500"
      style={{ color: '#5E6B85' }}
    >
      <LogOut size={14} /> Logout
    </button>
  )
}
