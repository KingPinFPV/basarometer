import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Disable session persistence temporarily
        autoRefreshToken: false, // Disable auto refresh temporarily
        detectSessionInUrl: false // Disable URL session detection temporarily
      }
    }
  )
  
  return client
}

export type SupabaseClient = ReturnType<typeof createClient>