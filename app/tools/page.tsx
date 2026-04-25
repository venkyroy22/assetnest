"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Wrench, Search, X, Sparkles,
    ArrowUpRight, Pin,
} from "lucide-react";
import Link from "next/link";
import { ALL_TOOLS, Tool, ToolCategory } from "@/lib/tools";
import { usePins } from "@/components/PinProvider";

// ─── Short name helper ────────────────────────────────────────────────────────
function shortName(name: string): string {
    return name
        .replace(/^Smart\s+/i, "")
        .replace(/^Advanced\s+/i, "")
        .replace(/^Professional\s+/i, "")
        .replace(/^Free\s+/i, "")
        .trim();
}

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: Tool; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
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
    }, []);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [preventClick, setPreventClick] = useState(false);

    const handleTouchStart = () => {
        setPreventClick(false);
        timerRef.current = setTimeout(() => {
            setShowMobileMenu(true);
            setPreventClick(true);
            if (navigator.vibrate) navigator.vibrate([40]);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handlePinToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(tool.id);
        setShowMobileMenu(false);
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        if (preventClick) {
            e.preventDefault();
            setPreventClick(false);
        }
    };

    const handlePinClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(tool.id);
    };

    const Icon = tool.icon;

    return (
        <Link 
            href={tool.href} 
            className="block group" 
            tabIndex={-1}
            onClick={handleLinkClick}
        >

            {/* ════════════════════════════════
                DESKTOP — full spotlight card
                (hidden on mobile)
            ════════════════════════════════ */}
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(28px)",
                    transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                }}
                className="hidden sm:flex flex-col relative overflow-hidden rounded-[2.2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md p-6 h-full transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/60"
            >
                {/* Pin Button */}
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

                {/* Spotlight */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.06), transparent 80%)`,
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-4 pt-2">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center border border-zinc-800 bg-zinc-900 transition-all duration-300 group-hover:bg-zinc-800 group-hover:border-zinc-700">
                            <Icon size={20} className="text-zinc-500 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            {pinned && <Pin size={8} fill="currentColor" className="text-zinc-500" />}
                            <span className="text-[10px] font-semibold tracking-wide px-2.5 py-0.5 border border-white/10 bg-white/5 text-zinc-400 rounded-full group-hover:text-white transition-colors whitespace-nowrap">
                                {tool.badge}
                            </span>
                            <ArrowUpRight size={15} className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                        </div>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <h3 className="text-sm font-bold tracking-tight text-white">{tool.name}</h3>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors duration-300 line-clamp-3">
                            {tool.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════
                MOBILE — app icon style
                (Long-press to pin)
            ════════════════════════════════ */}
            <div
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1)" : "scale(0.85)",
                    transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.23,1,0.32,1)",
                }}
                className="sm:hidden flex flex-col items-center gap-2 relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* App Icon */}
                <div className={`relative w-16 h-16 rounded-[18px] bg-zinc-900 border border-white/8 flex items-center justify-center shadow-lg transition-all duration-200 ${showMobileMenu ? "scale-90 brightness-75" : "active:scale-95"}`}>
                    <Icon size={28} className="text-zinc-400" />

                    {/* Pinned status dot (Top Right) */}
                    {pinned && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow">
                            <Pin size={7} fill="black" className="rotate-45" />
                        </div>
                    )}

                    {/* Pop-up Pin Option */}
                    {showMobileMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileMenu(false); }}
                            />
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200">
                                <button
                                    onClick={handlePinToggle}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full shadow-2xl font-black text-[11px] uppercase tracking-wider whitespace-nowrap active:scale-95 transition-transform"
                                >
                                    <Pin size={12} fill={pinned ? "black" : "none"} className={pinned ? "rotate-45" : ""} />
                                    {pinned ? "Unpin Tool" : "Pin Tool"}
                                </button>
                                {/* Triangle arrow */}
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white mx-auto mt-[-1px]" />
                            </div>
                        </>
                    )}
                </div>

                {/* Short label */}
                <span className="text-[10px] font-semibold text-zinc-400 text-center leading-tight line-clamp-2 w-16 px-0.5">
                    {shortName(tool.name)}
                </span>
            </div>

        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ToolsPage() {
    const [query, setQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const { pinnedToolIds } = usePins();
    const [activeCategory, setActiveCategory] = useState<ToolCategory | "All">("All");

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(ALL_TOOLS.map(t => t.category)));
        cats.sort((a, b) => {
            const order: Record<string, number> = { "Productivity": 0, "Images": 1, "PDF": 2, "Generate": 3, "Business": 4, "Games": 5 };
            return (order[a] ?? 99) - (order[b] ?? 99);
        });
        return ["All", ...cats] as const;
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = ALL_TOOLS;
        if (activeCategory !== "All") list = list.filter(t => t.category === activeCategory);
        if (!q) return list;
        return list.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }, [query, activeCategory]);

    const categoriesList = useMemo(() => {
        const groups: { name: string; tools: Tool[] }[] = [];
        const pinnedTools = filtered.filter(t => pinnedToolIds.includes(t.id));
        if (pinnedTools.length > 0) {
            const pinOrderMap = new Map<string, number>();
            pinnedToolIds.forEach((id, i) => pinOrderMap.set(id, i));
            pinnedTools.sort((a, b) => pinOrderMap.get(a.id)! - pinOrderMap.get(b.id)!);
            groups.push({ name: "Pinned Tools", tools: pinnedTools });
        }
        const regularCategories = Array.from(new Set(filtered.map(t => t.category)));
        regularCategories.sort((a, b) => {
            const order: Record<string, number> = { "Productivity": 0, "Images": 1, "PDF": 2, "Generate": 3, "Business": 4, "Games": 5 };
            return (order[a] ?? 99) - (order[b] ?? 99);
        });
        regularCategories.forEach(cat => {
            groups.push({ name: cat, tools: filtered.filter(t => t.category === cat) });
        });
        return groups;
    }, [filtered, pinnedToolIds]);

    return (
        <>
            {/* Background grid */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                }}
            />

            {/* Wrench — desktop only, hard clipped */}
            <div className="hidden lg:block absolute top-0 right-0 overflow-hidden pointer-events-none z-0" style={{ width: "420px", height: "420px" }}>
                <Wrench size={500} strokeWidth={0.5} className="text-white/5 rotate-12 translate-x-28 -translate-y-14" />
            </div>

            <div
                className="relative z-10 min-h-[80vh] py-10 sm:py-16 px-4 sm:px-6 md:px-10 overflow-x-hidden"
                style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.25s ease" }}
            >
                <div className="max-w-[1400px] mx-auto">

                    {/* Header */}
                    <div className="mb-10 sm:mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/[0.03] mb-4 rounded-full">
                            <Sparkles size={11} className="text-zinc-100" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">Tool Directory</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white mb-3 leading-none">
                            Smart <span className="text-zinc-500">Tools</span>
                        </h1>
                        <p className="text-zinc-500 text-sm md:text-base font-medium max-w-lg leading-relaxed">
                            Powerful, secure, and private utilities that run 100% in your browser. No sign-up, no server uploads, forever free.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-6 sm:mb-8">
                        <div className={`flex items-center bg-zinc-950/80 backdrop-blur-xl rounded-2xl border px-4 sm:px-5 py-3 sm:py-3.5 w-full transition-all duration-300 hover:border-zinc-700 focus-within:border-white/50 shadow-2xl ${query ? "border-zinc-600" : "border-zinc-800"}`}>
                            <Search size={15} className="text-zinc-500 mr-3 shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search tools…"
                                className="bg-transparent text-sm w-full min-w-0 focus:outline-none placeholder:text-zinc-600 font-medium text-white"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                            {query && (
                                <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white ml-2 shrink-0 touch-manipulation p-1">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category pills — horizontal scroll on mobile */}
                    <div className="-mx-4 sm:mx-0 mb-10 sm:mb-12">
                        <div
                            className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 sm:flex-wrap sm:overflow-x-visible"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
                        >
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat as ToolCategory | "All")}
                                    className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 border touch-manipulation
                                        ${activeCategory === cat
                                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* No results */}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 bg-zinc-950/30 rounded-2xl px-4">
                            <Search size={26} className="text-zinc-700 mb-4" />
                            <h2 className="text-base font-semibold text-zinc-400 mb-2">No tools found</h2>
                            <p className="text-sm text-zinc-500 text-center max-w-xs">
                                Nothing matches &ldquo;{query}&rdquo;. Try a different keyword.
                            </p>
                            <button
                                onClick={() => setQuery("")}
                                className="mt-5 px-5 py-2.5 rounded-full border border-zinc-700 text-xs font-semibold text-zinc-300 hover:border-white/40 hover:text-white transition-all touch-manipulation"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}

                    {/* Tool groups */}
                    {filtered.length > 0 && (
                        <div className="space-y-14 sm:space-y-16">
                            {categoriesList.map((group) => (
                                <div key={group.name} id={group.name.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-24">

                                    {/* Section heading */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-px bg-zinc-800 flex-1 min-w-0" />
                                        <h2 className="text-xs sm:text-sm font-semibold text-zinc-300 px-3 whitespace-nowrap">
                                            {group.name}
                                        </h2>
                                        <div className="h-px bg-zinc-800 flex-1 min-w-0" />
                                    </div>

                                    {/*
                                        MOBILE:  4 columns — app icon grid (icon + label)
                                        DESKTOP: 2→3→4 column full cards
                                        The sm: breakpoint switches between the two layouts.
                                    */}
                                    <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-2 gap-y-6 sm:gap-5">
                                        {group.tools.map((tool, i) => (
                                            <ToolCard key={tool.id} tool={tool} index={i} />
                                        ))}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}