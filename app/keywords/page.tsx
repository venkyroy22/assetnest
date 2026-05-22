"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeywordsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/tools");
    }, [router]);

    return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
}

