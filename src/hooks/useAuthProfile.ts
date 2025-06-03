'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthProfileState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  profileError: string | null
}

export function useAuthProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Ensure user has a profile using the RPC function
  const ensureProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
    try {
      setProfileError(null)
      
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (existingProfile && !fetchError) {
        console.log('✅ Profile found:', existingProfile.email)
        return existingProfile
      }

      console.log('🔄 No profile found, creating via RPC...')
      
      // If no profile, create one via RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('ensure_my_profile')
      
      if (rpcError) {
        console.error('❌ RPC error:', rpcError)
        setProfileError(`Profile creation failed: ${rpcError.message}`)
        return null
      }

      if (!rpcResult?.success) {
        console.error('❌ RPC failed:', rpcResult?.error)
        setProfileError(`Profile creation failed: ${rpcResult?.error || 'Unknown error'}`)
        return null
      }

      console.log('✅ Profile creation result:', rpcResult)
      
      // Fetch the newly created profile
      const { data: newProfile, error: newFetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      if (newFetchError) {
        console.error('❌ Error fetching new profile:', newFetchError)
        setProfileError(`Could not fetch new profile: ${newFetchError.message}`)
        return null
      }

      console.log('✅ New profile fetched:', newProfile?.email)
      return newProfile
      
    } catch (error) {
      console.error('❌ Unexpected error in ensureProfile:', error)
      setProfileError('Unexpected error creating profile')
      return null
    }
  }, [supabase])

  // Load user profile
  const loadProfile = useCallback(async (currentUser: User) => {
    console.log('🔄 Loading profile for:', currentUser.email)
    const profileData = await ensureProfile(currentUser)
    setProfile(profileData)
    setLoading(false)
  }, [ensureProfile])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setLoading(false)
          return
        }

        if (session?.user && mounted) {
          console.log('✅ Initial session found:', session.user.email)
          setUser(session.user)
          await loadProfile(session.user)
        } else {
          console.log('ℹ️ No initial session')
          if (mounted) {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ Initialize auth error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        if (!mounted) return

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            setProfileError(null)
            await loadProfile(session.user)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
            setProfileError(null)
            setLoading(false)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user)
            // Don't reload profile on token refresh if we already have it
            if (!profile) {
              await loadProfile(session.user)
            }
          }
        } catch (error) {
          console.error('❌ Auth state change error:', error)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, loadProfile, profile])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
      } else {
        console.log('✅ Signed out successfully')
      }
      
      setUser(null)
      setProfile(null)
      setProfileError(null)
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user logged in')
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setProfile(data)
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      return { data: null, error }
    }
  }, [user, profile, supabase])

  return {
    user,
    profile,
    loading,
    profileError,
    isAdmin: profile?.is_admin || false,
    signOut,
    updateProfile,
    refreshProfile: user ? () => loadProfile(user) : () => Promise.resolve()
  }
}