"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeywordsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/tools");
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );
}

