'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export function useAuthProfile() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    // Get initial session ONCE
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            setState({ user: null, isLoading: false, error: error.message })
          } else {
            setState({ user: session?.user || null, isLoading: false, error: null })
          }
        }
      } catch {
        if (mounted) {
          setState({ user: null, isLoading: false, error: 'Session error' })
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with minimal processing
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) {
        setState({ user: session?.user || null, isLoading: false, error: null })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // EMPTY dependency array to prevent loops

  return {
    user: state.user,
    profile: state.user ? { email: state.user.email, is_admin: false } : null,
    loading: state.isLoading,
    profileError: state.error,
    isAdmin: false,
    signOut: () => {
      return supabase.auth.signOut()
    }
  }
}