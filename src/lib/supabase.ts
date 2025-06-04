import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true, // Enable session persistence for authentication
        autoRefreshToken: true, // Enable auto refresh for longer sessions
        detectSessionInUrl: true, // Enable URL session detection for auth flows
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    }
  )
  
  return client
}

export type SupabaseClient = ReturnType<typeof createClient>