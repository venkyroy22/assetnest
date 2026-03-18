import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
    const supabase = createClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
        .from("prompt_likes")
        .select("slug, likes");

    if (error) {
        // If table doesn't exist, we'll return an empty array for now
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
            return NextResponse.json([]);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(req: Request) {
    const supabase = createClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    try {
        const { slug, increment } = await req.json();

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        // We use a simple select then update since we don't have an RPC function for atomic increment yet
        const { data: current, error: getError } = await supabase
            .from("prompt_likes")
            .select("likes")
            .eq("slug", slug)
            .single();

        if (getError && getError.code !== 'PGRST116') {
             return NextResponse.json({ error: getError.message }, { status: 500 });
        }

        const newCount = (current?.likes || 0) + (increment || 1);

        const { data, error } = await supabase
            .from("prompt_likes")
            .upsert({ slug, likes: newCount, updated_at: new Date() })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
