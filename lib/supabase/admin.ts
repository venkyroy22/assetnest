import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * ADVISORY: Only use this on the server.
 * This client uses the Service Role Key and bypasses Row Level Security (RLS).
 */
export function createAdminClient() {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    const url = (rawUrl && !rawUrl.startsWith("http"))
        ? `https://${rawUrl}`
        : rawUrl;

    if (!url || !adminKey || url.includes("your-project-id") || url.length < 10) {
        return null as any;
    }

    try {
        return createSupabaseClient(
            url,
            adminKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
    } catch (e) {
        console.error("Supabase admin client init failed:", e);
        return null as any;
    }
}
