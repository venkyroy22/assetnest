import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const url = (rawUrl && !rawUrl.startsWith("http"))
        ? `https://${rawUrl}`
        : rawUrl;

    if (!url || !anonKey || url.includes("your-project-id") || url.length < 10) {
        return null as any;
    }

    const cookieStore = await cookies()

    try {
        return createServerClient(
            url,
            anonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // This can be ignored if you have middleware refreshing user sessions.
                        }
                    },
                },
            }
        )
    } catch (e) {
        console.error("Supabase server client init failed:", e);
        return null as any;
    }
}
