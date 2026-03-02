"use client";

import { useState, useMemo } from "react";
import { Wrench, Search, X, FileImage, QrCode, Sparkles, Timer, Receipt } from "lucide-react";
import Link from "next/link";

// ─── ADD NEW TOOLS HERE ───────────────────────────────────────────────────────
const ALL_TOOLS = [
    {
        id: "image-compressor",
        name: "Image Compressor",
        description: "Compress JPEG, PNG & WebP images instantly in your browser. 100% private, no uploads needed.",
        href: "/tools/image-compressor",
        badge: "Free" as const,
        icon: FileImage,
        tags: ["image", "compress", "jpeg", "png", "webp", "optimize", "resize"],
    },
    {
        id: "qr",
        name: "QR Code Generator",
        description: "Generate beautiful, customizable QR codes instantly. Download as PNG or SVG for free.",
        href: "/tools/qr",
        badge: "Free" as const,
        icon: QrCode,
        tags: ["qr", "qrcode", "barcode", "link", "generate", "scan"],
    },
    {
        id: "pomodoro",
        name: "Pomodoro Timer",
        description: "Boost your productivity with an animated focus timer, session tracking, and achievement system.",
        href: "/tools/pomodoro",
        badge: "Free" as const,
        icon: Timer,
        tags: ["pomodoro", "timer", "focus", "productivity", "study", "work", "deep work", "break"],
    },
    {
        id: "billing",
        name: "Smart Billing Tool",
        description: "Paperless billing for small merchants. Scan barcodes, add items, generate a customer QR receipt — no printing needed.",
        href: "/tools/billing",
        badge: "Free" as const,
        icon: Receipt,
        tags: ["billing", "invoice", "gst", "receipt", "barcode", "qr", "merchant", "shop", "india", "retail", "pos"],
    },
];
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_STYLES = {
    Free: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    New: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    Pro: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    "Coming Soon": "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

export default function ToolsPage() {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ALL_TOOLS;
        return ALL_TOOLS.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.tags.some((tag) => tag.includes(q))
        );
    }, [query]);

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10">
            {/* Header */}
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5">
                    <Wrench size={11} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AssetNest Tools</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase text-white mb-3">
                    Top Tools
                </h1>
                <p className="text-zinc-400 max-w-lg text-sm font-medium leading-relaxed">
                    A growing collection of powerful, free tools built for creators, designers, and marketers. New tools launching regularly.
                </p>
            </div>

            {/* ── Search Bar ── */}
            <div className="relative mb-10 max-w-lg">
                <div className={`flex items-center bg-zinc-900 border px-4 py-3 w-full transition-all duration-300 hover:border-zinc-600 focus-within:border-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)] ${query ? "border-white" : "border-zinc-800"}`}>
                    <Search size={16} className="text-zinc-500 mr-3 shrink-0" />
                    <input
                        type="text"
                        id="tools-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tools… (e.g. image, QR, compress)"
                        className="bg-transparent text-sm w-full focus:outline-none placeholder:text-zinc-600 font-medium"
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white transition-colors ml-2">
                            <X size={14} />
                        </button>
                    )}
                </div>
                {query && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-2 px-1">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                    </p>
                )}
            </div>

            {/* No results */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 bg-zinc-950/30">
                    <Search size={28} className="text-zinc-700 mb-4" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2">No tools found</h2>
                    <p className="text-xs text-zinc-600 font-medium text-center max-w-xs">
                        No tools match &ldquo;{query}&rdquo;. Try a different keyword or clear the search.
                    </p>
                    <button
                        onClick={() => setQuery("")}
                        className="mt-5 px-4 py-2 border border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition-all"
                    >
                        Clear Search
                    </button>
                </div>
            )}

            {/* Tools Grid */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <Link
                                key={tool.id}
                                href={tool.href}
                                className="group relative overflow-hidden border border-zinc-800 bg-zinc-900/50 p-6 hover:border-white/30 hover:bg-zinc-800/50 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                                            <Icon size={18} className="text-white" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${BADGE_STYLES[tool.badge] || BADGE_STYLES.Free}`}>
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">{tool.name}</h3>
                                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{tool.description}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Coming Soon placeholder — always shown at end */}
                    {!query && (
                        <div className="group relative overflow-hidden border border-dashed border-zinc-800 bg-zinc-950/30 p-6 opacity-50">
                            <div className="relative z-10 flex flex-col h-full gap-4">
                                <div className="w-10 h-10 bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                                    <Sparkles size={18} className="text-zinc-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-1">More Coming</h3>
                                    <p className="text-xs text-zinc-600 font-medium leading-relaxed">New tools dropping regularly. Check back soon.</p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 w-fit">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
