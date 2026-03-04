import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const supabaseUrl = (rawUrl && !rawUrl.startsWith("http"))
        ? `https://${rawUrl}`
        : rawUrl;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id") || supabaseUrl.length < 10) {
        return supabaseResponse
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )
        // refreshing the auth token
        await supabase.auth.getUser()
    } catch (e) {
        console.error("Supabase session update failed:", e);
    }

    return supabaseResponse
}
