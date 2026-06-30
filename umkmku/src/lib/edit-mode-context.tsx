'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface EditModeContextType {
  editMode: boolean
  pendingChanges: Record<string, unknown>
  setField: (key: string, value: unknown) => void
  save: () => Promise<void>
  saveAndRedirect: (url: string) => Promise<void>
  saving: boolean
  hasChanges: boolean
}

const EditModeContext = createContext<EditModeContextType | null>(null)

export function useEditMode() {
  return useContext(EditModeContext)
}

interface Props {
  slug: string
  children: React.ReactNode
}

export function EditModeProvider({ slug, children }: Props) {
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  const setField = useCallback((key: string, value: unknown) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }))
  }, [])

  const persist = useCallback(async (redirectUrl?: string) => {
    setSaving(true)
    try {
      if (Object.keys(pendingChanges).length > 0) {
        await fetch(`/api/tenant/${slug}/content`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingChanges),
        })
        setPendingChanges({})
      }
      window.location.href = redirectUrl ?? window.location.href.split('?')[0] + '?edit=1'
    } finally {
      setSaving(false)
    }
  }, [slug, pendingChanges])

  const save = useCallback(() => persist(), [persist])
  const saveAndRedirect = useCallback((url: string) => persist(url), [persist])

  return (
    <EditModeContext.Provider value={{
      editMode: true,
      pendingChanges,
      setField,
      save,
      saveAndRedirect,
      saving,
      hasChanges: Object.keys(pendingChanges).length > 0,
    }}>
      {children}
    </EditModeContext.Provider>
  )
}
