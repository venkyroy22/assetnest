"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Wrench, Search, X, Sparkles,
    ArrowUpRight, ArrowRight, Pin,
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

// ─── Category Background Helper ────────────────────────────────────────────────
function getCategoryBg(category: ToolCategory): string {
    switch (category) {
        case "Images":
            return "linear-gradient(135deg, #0a2523 0%, #051110 100%)"; // Dark Teal
        case "PDF":
            return "linear-gradient(135deg, #2a0a10 0%, #120407 100%)"; // Ruby Burgundy
        case "Generate":
            return "linear-gradient(135deg, #180d25 0%, #0b0611 100%)";
        case "Productivity":
            return "linear-gradient(135deg, #0d1a25 0%, #060c11 100%)";
        case "Business":
            return "linear-gradient(135deg, #251b0d 0%, #110c06 100%)";
        case "Games":
            return "linear-gradient(135deg, #100d25 0%, #080611 100%)"; // Dark Indigo
        case "Design Training":
            return "linear-gradient(135deg, #250d21 0%, #11060f 100%)";
        default:
            return "linear-gradient(135deg, #161616 0%, #0a0a0a 100%)";
    }
}

// ─── Category Hover Colors Helper ──────────────────────────────────────────────
interface HoverColors {
    solid: string;
    glow: string;
}

function getCategoryHoverColors(category: ToolCategory): HoverColors {
    switch (category) {
        case "Images":
            return { solid: "#0d9488", glow: "rgba(13, 148, 136, 0.16)" }; // Rich Teal
        case "PDF":
            return { solid: "#be123c", glow: "rgba(190, 18, 60, 0.16)" }; // Ruby Crimson
        case "Generate":
            return { solid: "#7c3aed", glow: "rgba(124, 58, 237, 0.16)" }; // Royal Violet
        case "Productivity":
            return { solid: "#2563eb", glow: "rgba(37, 99, 235, 0.16)" }; // Cobalt Blue
        case "Business":
            return { solid: "#d97706", glow: "rgba(217, 119, 6, 0.16)" }; // Warm Amber
        case "Games":
            return { solid: "#4f46e5", glow: "rgba(79, 70, 229, 0.16)" }; // Premium Indigo
        case "Design Training":
            return { solid: "#db2777", glow: "rgba(219, 39, 119, 0.16)" }; // Magenta Rose
        default:
            return { solid: "#475569", glow: "rgba(71, 85, 105, 0.16)" }; // Sleek Slate
    }
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
    const colors = getCategoryHoverColors(tool.category);

    return (
        <Link 
            href={tool.href} 
            className="block group h-full" 
            tabIndex={-1}
            onClick={handleLinkClick}
        >

            {/* ════════════════════════════════
                DESKTOP — premium visual card
                (hidden on mobile)
            ════════════════════════════════ */}
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible 
                        ? (hovered ? "translateY(-6px)" : "translateY(0)") 
                        : "translateY(28px)",
                    transition: "opacity 0.5s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    background: "#1c1c1c",
                    border: "none",
                    boxShadow: hovered 
                        ? `0 25px 50px rgba(0,0,0,0.85), 0 0 30px ${colors.glow}` 
                        : "0 10px 35px rgba(0,0,0,0.6)",
                }}
                className="hidden sm:flex flex-col relative overflow-hidden rounded-2xl h-full"
            >
                {/* Pin Button */}
                <button
                    onClick={handlePinClick}
                    className={`absolute top-4 left-4 z-20 p-2 rounded-lg transition-all duration-300 active:scale-95
                        ${pinned
                            ? "shadow-lg"
                            : "backdrop-blur-md"}`}
                    style={{
                        opacity: pinned || hovered ? 1 : 0,
                        background: pinned ? colors.solid : "rgba(20,20,20,0.6)",
                        color: "#ffffff",
                        border: pinned ? `1px solid ${colors.solid}` : "1px solid rgba(255,255,255,0.08)",
                    }}
                    title={pinned ? "Unpin tool" : "Pin tool"}
                >
                    <Pin size={12} className={`transition-transform duration-300 ${pinned ? "rotate-45" : ""}`} fill={pinned ? "white" : "none"} />
                </button>

                {/* Spotlight hover shimmer */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-10"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.04), transparent 80%)`,
                    }}
                />

                {/* Top visual preview slot */}
                <div className="relative w-full h-40 bg-[#161616] flex items-center justify-center overflow-hidden shrink-0">
                    {tool.image ? (
                        <img 
                            src={tool.image} 
                            alt={tool.name} 
                            className="w-full h-full object-cover transition-transform duration-500 ease-out"
                            style={{
                                transform: hovered ? "scale(1.06)" : "scale(1)",
                            }}
                        />
                    ) : (
                        <div 
                            className="w-full h-full flex items-center justify-center relative transition-all duration-500"
                            style={{
                                background: getCategoryBg(tool.category),
                            }}
                        >
                            {/* Radial/dot pattern */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />
                            
                            {/* Ghost background icon */}
                            <Icon 
                                size={72} 
                                className="absolute opacity-10 transition-transform duration-700" 
                                style={{
                                    color: "#ffffff",
                                    transform: hovered ? "scale(1.15) rotate(5deg)" : "scale(1) rotate(0deg)",
                                }}
                            />
                            
                            {/* Centered highlighted icon box */}
                            <div 
                                className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                                style={{
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    boxShadow: hovered ? "0 0 20px rgba(255,255,255,0.05)" : "none",
                                }}
                            >
                                <Icon size={22} className="text-[#f0ede8]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom dark tab footer */}
                <div 
                    className="flex items-center justify-between px-5 py-4 transition-colors duration-300 mt-auto shrink-0"
                    style={{
                        background: hovered ? colors.solid : "#1c1c1c"
                    }}
                >
                    <span className="text-sm font-bold text-white tracking-tight">{tool.name}</span>
                    <ArrowRight size={16} className="text-white transform group-hover:translate-x-1 transition-transform duration-300" />
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
                <div className={`relative w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg transition-all duration-200 ${showMobileMenu ? "scale-90 brightness-75" : "active:scale-95"}`} style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Icon size={28} style={{ color: "#707070" }} />

                    {/* Pinned status dot (Top Right) */}
                    {pinned && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow" style={{ background: "#f0ede8" }}>
                            <Pin size={7} fill="#141414" className="rotate-45" style={{ color: "#141414" }} />
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
                                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl font-black text-[11px] uppercase tracking-wider whitespace-nowrap active:scale-95 transition-transform"
                                    style={{ background: "#f0ede8", color: "#141414" }}
                                >
                                    <Pin size={12} fill={pinned ? "black" : "none"} className={pinned ? "rotate-45" : ""} />
                                    {pinned ? "Unpin Tool" : "Pin Tool"}
                                </button>
                                {/* Triangle arrow */}
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] mx-auto mt-[-1px]" style={{ borderTopColor: "#f0ede8" }} />
                            </div>
                        </>
                    )}
                </div>

                {/* Short label */}
                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-16 px-0.5" style={{ color: "#707070" }}>
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
                backgroundImage: `radial-gradient(circle, rgba(240,237,232,0.025) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                }}
            />

            {/* Wrench — desktop only, hard clipped */}
            <div className="hidden lg:block absolute top-0 right-0 overflow-hidden pointer-events-none z-0" style={{ width: "420px", height: "420px" }}>
                <Wrench size={500} strokeWidth={0.5} className="rotate-12 translate-x-28 -translate-y-14" style={{ color: "rgba(240,237,232,0.04)" }} />
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
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-3 leading-none" style={{ color: "#f0ede8" }}>
                            Smart <span style={{ color: "#555" }}>Tools</span>
                        </h1>
                        <p className="text-sm md:text-base font-medium max-w-lg leading-relaxed" style={{ color: "#707070" }}>
                            Powerful, secure, and private utilities that run 100% in your browser. No sign-up, no server uploads, forever free.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-6 sm:mb-8">
                        <div className={`flex items-center backdrop-blur-xl rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 w-full transition-all duration-300 shadow-2xl ${query ? "" : ""}`}
                            style={{ background: "rgba(28,28,28,0.8)", border: `1px solid ${query ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}` }}>
                            <Search size={15} className="text-zinc-500 mr-3 shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="bg-transparent text-sm w-full min-w-0 focus:outline-none font-medium" style={{ color: "#f0ede8" }}
                            placeholder="Search tools…"
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
                                    className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 touch-manipulation
                                        ${activeCategory === cat
                                            ? "shadow-[0_0_20px_rgba(240,237,232,0.08)]"
                                            : ""
                                        }`}
                                    style={{
                                        background: activeCategory === cat ? "#f0ede8" : "rgba(255,255,255,0.03)",
                                        color: activeCategory === cat ? "#141414" : "#666",
                                        border: activeCategory === cat ? "1px solid #f0ede8" : "1px solid rgba(255,255,255,0.07)",
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* No results */}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 rounded-2xl px-4" style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(28,28,28,0.3)" }}>
                            <Search size={26} className="mb-4" style={{ color: "#555" }} />
                            <h2 className="text-base font-semibold mb-2" style={{ color: "#a0a0a0" }}>No tools found</h2>
                            <p className="text-sm text-center max-w-xs" style={{ color: "#666" }}>
                                Nothing matches &ldquo;{query}&rdquo;. Try a different keyword.
                            </p>
                            <button
                                onClick={() => setQuery("")}
                                className="mt-5 px-5 py-2.5 rounded-full text-xs font-semibold transition-all touch-manipulation"
                                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0" }}
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
                                        <div className="h-px flex-1 min-w-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                                        <h2 className="text-xs sm:text-sm font-semibold px-3 whitespace-nowrap" style={{ color: "#a0a0a0" }}>
                                            {group.name}
                                        </h2>
                                        <div className="h-px flex-1 min-w-0" style={{ background: "rgba(255,255,255,0.06)" }} />
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