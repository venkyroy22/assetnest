import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * ADVISORY: Only use this on the server.
 * This client uses the Service Role Key and bypasses Row Level Security (RLS).
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
