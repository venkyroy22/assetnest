import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Fallback for build time / missing config
    if (!url || !anonKey || url.includes("your-project-id")) {
        return null as any;
    }

    return createBrowserClient(url, anonKey)
}
