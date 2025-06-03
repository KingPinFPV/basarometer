import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if available (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if needed
  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )

  return supabaseInstance
}

export type SupabaseClient = ReturnType<typeof createClient>