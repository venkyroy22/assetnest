import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    // Auto-prefix with https if proto is missing
    const url = (rawUrl && !rawUrl.startsWith("http"))
        ? `https://${rawUrl}`
        : rawUrl;

    // Strict check for build safety and actual connectivity
    if (!url || !anonKey || url.includes("your-project-id") || url.length < 10) {
        return null as any;
    }

    try {
        return createBrowserClient(url, anonKey)
    } catch (e) {
        console.error("Supabase client init failed:", e);
        return null as any;
    }
}
