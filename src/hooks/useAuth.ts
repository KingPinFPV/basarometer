'use client'

import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
} {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error)
        return
      }
      
      setProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }, [supabase])
  
  useEffect(() => {
    // Get initial session and profile
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [loadUserProfile, supabase.auth])
  
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error || null }
    } catch (error) {
      return { error: error as Error }
    }
  }
  
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })
      return { error: error || null }
    } catch (error) {
      return { error: error as Error }
    }
  }
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      
      if (!error) {
        // Reload profile
        await loadUserProfile(user.id)
      }
      
      return { error: error || null }
    } catch (error) {
      return { error: error as Error }
    }
  }
  
  return {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin || false,
    signIn,
    signUp,
    signOut,
    updateProfile
  }
}