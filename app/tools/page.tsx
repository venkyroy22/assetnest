"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Wrench, Search, X, Sparkles,
    ArrowUpRight, Pin
} from "lucide-react";
import Link from "next/link";
import { ALL_TOOLS, Tool } from "@/lib/tools";
import { usePins } from "@/components/PinProvider";

// ─── Spotlight card ───────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: Tool; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);
    const { togglePin, isPinned } = usePins();
    const pinned = isPinned(tool.id);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80 + index * 70);
        return () => clearTimeout(t);
    }, [index]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMouse({ x, y });
        setTilt({
            x: ((y / rect.height) - 0.5) * -12,
            y: ((x / rect.width) - 0.5) * 12,
        });
    }, []);

    const handlePinClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(tool.id);
    };

    const Icon = tool.icon;
    const accent = tool.accent;

    return (
        <Link href={tool.href} className="block" tabIndex={-1}>
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? hovered
                            ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale(1.015)`
                            : "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
                        : "translateY(28px) scale(0.97)",
                    transition: visible
                        ? hovered
                            ? "transform 0.12s ease-out, box-shadow 0.2s ease-out"
                            : "transform 0.45s cubic-bezier(0.23,1,0.32,1), opacity 0.45s ease, box-shadow 0.35s ease-out"
                        : "opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1)",
                    boxShadow: hovered
                        ? `0 20px 60px -10px ${accent}30, 0 0 0 1px ${accent}25`
                        : pinned
                            ? `0 0 0 1px ${accent}40, 0 4px 12px ${accent}10`
                            : "0 0 0 1px rgba(63,63,70,0.5)",
                    willChange: "transform, opacity",
                }}
                className={`relative overflow-hidden rounded-2xl bg-zinc-900/80 p-6 cursor-pointer h-full transition-shadow duration-300`}
            >
                {/* ── Pin Button ── */}
                <button
                    onClick={handlePinClick}
                    className={`absolute top-4 left-4 z-20 p-2 rounded-lg border transition-all duration-300 active:scale-95
                        ${pinned
                            ? "bg-white text-black border-white shadow-lg"
                            : "bg-black/40 text-zinc-600 border-zinc-800 hover:border-zinc-500 hover:text-white backdrop-blur-md"}`}
                    style={{ opacity: pinned || hovered ? 1 : 0 }}
                    title={pinned ? "Unpin tool" : "Pin tool"}
                >
                    <Pin size={12} className={`transition-transform duration-300 ${pinned ? "rotate-45" : ""}`} fill={pinned ? "black" : "none"} />
                </button>

                {/* ── Dot-grid texture ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
                        backgroundSize: "22px 22px",
                    }}
                />

                {/* ── Spotlight radial ── */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(280px circle at ${mouse.x}px ${mouse.y}px, ${accent}22, transparent 70%)`
                            : "none",
                    }}
                />

                {/* ── Glowing border ring (mouse-tracked) ── */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(200px circle at ${mouse.x}px ${mouse.y}px, ${accent}55, transparent 60%)`
                            : "none",
                        WebkitMask: "linear-gradient(#fff,#fff) content-box, linear-gradient(#fff,#fff)",
                        WebkitMaskComposite: "xor" as React.CSSProperties["WebkitMaskComposite"],
                        maskComposite: "exclude" as React.CSSProperties["maskComposite"],
                        padding: "1px",
                    }}
                />

                {/* ── Corner accent glow ── */}
                <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
                    style={{ background: accent, opacity: hovered ? 0.12 : 0.04 }}
                />

                {/* ── Content ── */}
                <div className="relative z-10 flex flex-col h-full gap-4 pt-2">
                    <div className="flex items-start justify-between">
                        {/* Icon box */}
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300"
                            style={{
                                background: hovered ? `${accent}18` : "rgba(39,39,42,0.8)",
                                borderColor: hovered ? `${accent}50` : "rgba(63,63,70,0.8)",
                                boxShadow: hovered ? `0 0 16px ${accent}30` : "none",
                            }}
                        >
                            <Icon
                                size={20}
                                style={{ color: hovered ? accent : "#71717a", transition: "color 0.3s" }}
                            />
                        </div>

                        {/* Badge + arrow */}
                        <div className="flex items-center gap-2">
                            {pinned && (
                                <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 mr-1 flex items-center gap-1">
                                    <Pin size={8} fill="currentColor" /> Pinned
                                </span>
                            )}
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border"
                                style={{
                                    color: accent,
                                    borderColor: `${accent}40`,
                                    background: `${accent}12`,
                                }}
                            >
                                {tool.badge}
                            </span>
                            <ArrowUpRight
                                size={15}
                                className="transition-all duration-300"
                                style={{
                                    color: hovered ? accent : "#3f3f46",
                                    transform: hovered ? "translate(2px,-2px)" : "translate(0,0)",
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <h3
                            className="text-sm font-black uppercase tracking-widest mb-2 transition-colors duration-300"
                            style={{ color: hovered ? accent : "#fff" }}
                        >
                            {tool.name}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed transition-colors duration-300 group-hover:text-zinc-400">
                            {tool.description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── Coming-soon placeholder ──────────────────────────────────────────────────
function ComingSoonCard({ index }: { index: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80 + index * 70);
        return () => clearTimeout(t);
    }, [index]);

    return (
        <div
            style={{
                opacity: visible ? 0.4 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
                transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1)",
            }}
            className="relative overflow-hidden rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6"
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                    backgroundSize: "22px 22px",
                }}
            />
            <div className="relative z-10 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900/50">
                    <Sparkles size={18} className="text-zinc-700" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-600 mb-1">More Coming</h3>
                    <p className="text-xs text-zinc-700 font-medium leading-relaxed">New tools dropping regularly. Check back soon.</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 w-fit">
                    Coming Soon
                </span>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ToolsPage() {
    const [query, setQuery] = useState("");
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 30);
        return () => clearTimeout(t);
    }, []);

    const { pinnedToolIds } = usePins();

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        // 1. Filter based on search query
        let baseList = ALL_TOOLS;
        if (q) {
            baseList = ALL_TOOLS.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.includes(q))
            );
        }

        // 2. Sort pinned items to the top based on pinned order
        // We create a map of tool ID to its index in the pinnedToolIds array for O(1) lookup
        const pinOrderMap = new Map<string, number>();
        pinnedToolIds.forEach((id, index) => pinOrderMap.set(id, index));

        return [...baseList].sort((a, b) => {
            const aPinnedIndex = pinOrderMap.has(a.id) ? pinOrderMap.get(a.id)! : Infinity;
            const bPinnedIndex = pinOrderMap.has(b.id) ? pinOrderMap.get(b.id)! : Infinity;

            // If both are pinned, sort by their pin order
            if (aPinnedIndex !== Infinity && bPinnedIndex !== Infinity) {
                return aPinnedIndex - bPinnedIndex;
            }

            // If only one is pinned, it goes to the top
            return aPinnedIndex - bPinnedIndex;
        });
    }, [query, pinnedToolIds]);

    return (
        <>
            {/* ── Page-wide background grid ── */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                }}
            />

            <div className="relative z-10 min-h-[80vh] py-16 px-6 md:px-10">

                {/* ── Header ── */}
                <div className="mb-12">
                    <div
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(-14px)",
                            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/60 mb-5 backdrop-blur-sm"
                    >
                        <Wrench size={11} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AssetNest Tools</span>
                    </div>

                    <h1
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                            transition: "opacity 0.55s ease 0.06s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.06s",
                        }}
                        className="text-4xl md:text-6xl font-black tracking-tight uppercase text-white mb-3"
                    >
                        Top Tools
                    </h1>

                    <p
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(14px)",
                            transition: "opacity 0.55s ease 0.12s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.12s",
                        }}
                        className="text-zinc-400 max-w-lg text-sm font-medium leading-relaxed"
                    >
                        A growing collection of powerful, free tools built for creators, designers, and marketers.
                        New tools launching regularly.
                    </p>
                </div>

                {/* ── Search ── */}
                <div
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(14px)",
                        transition: "opacity 0.55s ease 0.18s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.18s",
                    }}
                    className="relative mb-12 max-w-lg"
                >
                    <div className={`flex items-center bg-zinc-900/80 backdrop-blur-sm border px-4 py-3 w-full transition-all duration-300 hover:border-zinc-600 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_24px_rgba(16,185,129,0.08)] ${query ? "border-zinc-600" : "border-zinc-800"}`}>
                        <Search size={16} className="text-zinc-500 mr-3 shrink-0" />
                        <input
                            type="text"
                            id="tools-search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
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

                {/* ── No results ── */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 bg-zinc-950/30 rounded-2xl">
                        <Search size={28} className="text-zinc-700 mb-4" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2">No tools found</h2>
                        <p className="text-xs text-zinc-600 font-medium text-center max-w-xs">
                            No tools match &ldquo;{query}&rdquo;. Try a different keyword or clear the search.
                        </p>
                        <button
                            onClick={() => setQuery("")}
                            className="mt-5 px-4 py-2 border border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                        >
                            Clear Search
                        </button>
                    </div>
                )}

                {/* ── Tools grid ── */}
                {filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((tool, i) => (
                            <ToolCard key={tool.id} tool={tool} index={i} />
                        ))}

                        {/* Coming soon */}
                        {!query && <ComingSoonCard index={filtered.length} />}
                    </div>
                )}
            </div>
        </>
    );
}
