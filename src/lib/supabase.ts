// lib/supabase.ts - Single Instance Pattern (תחליף את הקובץ הקיים)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ✅ Singleton pattern - רק instance אחד
let supabaseInstance: SupabaseClient | null = null

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // ← חשוב! מונע duplicate sessions
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      global: {
        headers: {
          'x-client-info': 'basarometer-v3'
        }
      }
    })
    
    console.log('🔧 Supabase client initialized (singleton)')
  }
  
  return supabaseInstance
}

// ✅ Export single instance
export const supabase = getSupabaseClient()

// ✅ Type definitions
export type Database = {
  public: {
    Tables: {
      meat_categories: {
        Row: {
          id: string
          name_hebrew: string
          name_english: string
          display_order: number
          is_active: boolean
          created_at: string
        }
      }
      meat_cuts: {
        Row: {
          id: string
          category_id: string
          name_hebrew: string
          name_english: string
          description: string | null
          typical_price_range_min: number | null
          typical_price_range_max: number | null
          is_popular: boolean
          display_order: number
          is_active: boolean
          created_at: string
        }
      }
      retailers: {
        Row: {
          id: string
          name: string
          type: string | null
          logo_url: string | null
          website_url: string | null
          is_chain: boolean
          location_coverage: Record<string, unknown>
          is_active: boolean
          created_at: string
        }
      }
      price_reports: {
        Row: {
          id: string
          meat_cut_id: string
          retailer_id: string
          price_per_kg: number
          user_id: string
          location: string | null
          notes: string | null
          purchase_date: string
          is_on_sale: boolean
          sale_price_per_kg: number | null
          confidence_score: number
          verified_at: string | null
          is_active: boolean
          expires_at: string | null
          created_at: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          is_admin: boolean
          city: string | null
          reputation_score: number
          avatar_url: string | null
          bio: string | null
          preferences: Record<string, unknown>
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

export { createClient } from '@supabase/supabase-js'