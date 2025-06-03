'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['user_profiles']['Row']

interface AuthProfileState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  error: string | null
}

export function useAuthProfile() {
  const [state, setState] = useState<AuthProfileState>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    error: null
  })
  
  // Create supabase client once and memoize it
  const supabase = useMemo(() => createClient(), [])
  const profileRef = useRef(state.profile)

  // Memoized profile fetching function to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (user: User) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Profile fetch error:', error)
        
        // Try to ensure profile exists
        const { error: rpcError } = await supabase.rpc('ensure_my_profile')
        if (rpcError) {
          throw new Error(`Profile creation failed: ${rpcError.message}`)
        }
        
        // Retry profile fetch after creation
        const { data: retryProfile, error: retryError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (retryError) {
          throw new Error(`Profile retry failed: ${retryError.message}`)
        }
        
        setState(prev => ({
          ...prev,
          profile: retryProfile,
          isAdmin: retryProfile?.is_admin || false,
          isLoading: false,
          error: null
        }))
      } else if (profile) {
        setState(prev => ({
          ...prev,
          profile,
          isAdmin: profile?.is_admin || false,
          isLoading: false,
          error: null
        }))
      } else {
        // No profile found, try to create one
        const { error: rpcError } = await supabase.rpc('ensure_my_profile')
        if (rpcError) {
          throw new Error(`Profile creation failed: ${rpcError.message}`)
        }
        
        // Fetch the newly created profile
        const { data: newProfile, error: newError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (newError) {
          throw new Error(`New profile fetch failed: ${newError.message}`)
        }
        
        setState(prev => ({
          ...prev,
          profile: newProfile,
          isAdmin: newProfile?.is_admin || false,
          isLoading: false,
          error: null
        }))
      }
    } catch (error) {
      console.error('Auth profile error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      }))
    }
  }, [supabase])

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Session error'
            }))
          }
          return
        }

        if (session?.user && mounted) {
          console.log('✅ Initial session found:', session.user.email)
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: true
          }))
          await fetchProfile(session.user)
        } else if (mounted) {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            isAdmin: false,
            isLoading: false,
            error: null
          }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Initialization error'
          }))
        }
      }
    }

    // Initialize auth
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setState(prev => ({
              ...prev,
              user: session.user,
              isLoading: true,
              error: null
            }))
            await fetchProfile(session.user)
          } else if (event === 'SIGNED_OUT') {
            setState({
              user: null,
              profile: null,
              isAdmin: false,
              isLoading: false,
              error: null
            })
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setState(prev => ({
              ...prev,
              user: session.user
            }))
            // Only fetch profile if we don't have one
            if (!profileRef.current) {
              await fetchProfile(session.user)
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Auth state change error'
            }))
          }
        }
      }
    )

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchProfile]) // Removed profile dependency to prevent infinite loop
  
  // Update profile ref when state changes
  useEffect(() => {
    profileRef.current = state.profile
  }, [state.profile])

  // Memoized auth functions
  const authFunctions = useMemo(() => ({
    signOut: async () => {
      setState(prev => ({ ...prev, isLoading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        setState(prev => ({ ...prev, isLoading: false, error: 'Sign out error' }))
      }
    },
    signInWithPassword: (email: string, password: string) => 
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    updateProfile: async (updates: Partial<Profile>) => {
      if (!state.user || !state.profile) {
        throw new Error('No user logged in')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setState(prev => ({ ...prev, profile: data }))
      }

      return { data, error: null }
    }
  }), [supabase, state.user, state.profile])

  return {
    user: state.user,
    profile: state.profile,
    loading: state.isLoading,
    profileError: state.error,
    isAdmin: state.isAdmin,
    ...authFunctions
  }
}