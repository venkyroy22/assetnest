"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Wrench, Search, X, Sparkles,
    ArrowUpRight, Pin, ArrowUp
} from "lucide-react";
import Link from "next/link";
import { ALL_TOOLS, Tool, ToolCategory } from "@/lib/tools";
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

    return (
        <Link href={tool.href} className="block group" tabIndex={-1}>
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
                className={`relative overflow-hidden rounded-[1.8rem] sm:rounded-[2.2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md p-5 sm:p-6 h-full transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/60`}
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

                {/* ── Spotlight radial (Monochrome) ── */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.06), transparent 80%)`
                            : "none",
                    }}
                />

                {/* ── Content ── */}
                <div className="relative z-10 flex flex-col h-full gap-3 sm:gap-4 pt-1 sm:pt-2">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] flex items-center justify-center border border-zinc-800 bg-zinc-900 transition-all duration-300 group-hover:bg-zinc-800 group-hover:border-zinc-700"
                        >
                            <Icon size={18} className="text-zinc-500 group-hover:text-white transition-colors duration-300 sm:w-5 sm:h-5" />
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {pinned && (
                                <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                                    <Pin size={8} fill="currentColor" />
                                </span>
                            )}
                            <span
                                className="text-[9px] sm:text-[10px] font-semibold tracking-wide px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-400 rounded-full group-hover:text-white transition-colors"
                            >
                                {tool.badge}
                            </span>
                            <ArrowUpRight
                                size={14}
                                className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 sm:w-[15px] sm:h-[15px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 mt-auto">
                        <h3 className="text-[13px] sm:text-sm font-bold tracking-tight text-white leading-tight">
                            {tool.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-relaxed transition-colors duration-300 group-hover:text-zinc-400 line-clamp-2">
                            {tool.description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
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

    const [activeCategory, setActiveCategory] = useState<ToolCategory | "All">("All");

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
        
        if (activeCategory !== "All") {
            list = list.filter(t => t.category === activeCategory);
        }

        if (!q) return list;

        return list.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }, [query, activeCategory]);

    const categoriesList = useMemo(() => {
        const groups: { name: string; tools: Tool[] }[] = [];

        // 1. Pinned Tools Category
        const pinnedTools = filtered.filter(t => pinnedToolIds.includes(t.id));
        if (pinnedTools.length > 0) {
            const pinOrderMap = new Map<string, number>();
            pinnedToolIds.forEach((id, index) => pinOrderMap.set(id, index));
            pinnedTools.sort((a, b) => pinOrderMap.get(a.id)! - pinOrderMap.get(b.id)!);

            groups.push({ name: "Pinned Tools", tools: pinnedTools });
        }

        // 2. Regular Categories
        const regularCategories = Array.from(new Set(filtered.map(t => t.category)));
        regularCategories.sort((a, b) => {
            const order: Record<string, number> = { "Productivity": 0, "Images": 1, "PDF": 2, "Generate": 3, "Business": 4, "Games": 5 };
            return (order[a] ?? 99) - (order[b] ?? 99);
        });

        regularCategories.forEach(cat => {
            groups.push({
                name: cat,
                tools: filtered.filter(t => t.category === cat)
            });
        });

        return groups;
    }, [filtered, pinnedToolIds]);

    return (
        <>
            {/* ── Page-wide background grid ── */}
            <div
                className="fixed inset-y-0 left-0 lg:left-16 right-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                }}
            />

            <div className="fixed top-20 right-0 text-white/5 pointer-events-none rotate-12 z-0 translate-x-32 -translate-y-20 overflow-hidden">
                <Wrench size={600} strokeWidth={0.5} />
            </div>

            <div className="relative z-10 min-h-[80vh] py-16 px-6 md:px-10">
                <div className="max-w-[1400px] mx-auto">
                    {/* ── Header ── */}
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(12px)",
                        transition: "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s",
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/[0.03] mb-4 rounded-full">
                        <Sparkles size={11} className="text-zinc-100" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">Tool Directory</span>
                    </div>
                    <h1 className="text-3xl md:text-7xl font-black tracking-tight text-white mb-3">
                        Smart <span className="text-zinc-500">Tools</span>
                    </h1>
                    <p className="text-zinc-500 text-sm md:text-base font-medium max-w-lg leading-relaxed">
                        Powerful, secure, and private utilities that run 100% in your browser. No sign-up, no server uploads, forever free.
                    </p>
                </div>
            </div>

                        <p
                            style={{
                                opacity: headerVisible ? 1 : 0,
                                transform: headerVisible ? "translateY(0)" : "translateY(14px)",
                                transition: "opacity 0.55s ease 0.12s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.12s",
                            }}
                            className="text-zinc-400 max-w-lg text-sm font-medium leading-relaxed"
                        >
                            No installs, no sign-up — runs entirely in your browser.
                            New tools dropping regularly.
                        </p>
                    </div>

                    {/* ── Search (Sticky) ── */}
                    <div
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(14px)",
                            transition: "opacity 0.55s ease 0.18s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.18s",
                        }}
                        className="mb-8 -mx-2 px-2"
                    >
                        <div className={`flex items-center bg-zinc-950/80 backdrop-blur-xl rounded-2xl border px-4 py-3 md:px-5 md:py-3.5 w-full transition-all duration-300 hover:border-zinc-700 focus-within:border-white/50 shadow-2xl ${query ? "border-zinc-600" : "border-zinc-800"}`}>
                            <Search size={16} className="text-zinc-500 mr-3 shrink-0" />
                            <input
                                type="text"
                                id="tools-search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search tools… (e.g. image, QR, 2048)"
                                className="bg-transparent text-sm w-full focus:outline-none placeholder:text-zinc-600 font-medium text-white"
                                autoComplete="off"
                            />
                            {query && (
                                <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white transition-colors ml-2">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Category Filters ── */}
                    <div 
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(10px)",
                            transition: "opacity 0.5s ease 0.22s, transform 0.5s cubic-bezier(0.23,1,0.32,1) 0.22s",
                        }}
                        className="flex flex-wrap gap-2 mb-12"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat as any)}
                                className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                    activeCategory === cat 
                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105" 
                                    : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* ── No results ── */}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 bg-zinc-950/30 rounded-2xl">
                            <Search size={28} className="text-zinc-700 mb-4" />
                            <h2 className="text-base font-semibold text-zinc-400 mb-2">No tools found</h2>
                            <p className="text-sm text-zinc-500 font-medium text-center max-w-xs">
                                No tools match &ldquo;{query}&rdquo;. Try a different keyword or clear the search.
                            </p>
                            <button
                                onClick={() => setQuery("")}
                                className="mt-6 px-5 py-2.5 rounded-full border border-zinc-700 text-xs font-semibold text-zinc-300 hover:border-white/40 hover:bg-white/10 hover:text-white transition-all custom-shadow"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}

                    {/* ── Tools Categories ── */}
                    {filtered.length > 0 && (
                        <div className="space-y-16 mt-8">
                            {categoriesList.map((group) => (
                                <div key={group.name} id={group.name.toLowerCase().replace(/\s+/g, '-')} className="space-y-6 scroll-mt-24">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-zinc-800 flex-1" />
                                        <h2 className="text-sm font-semibold text-zinc-300 px-4">
                                            {group.name}
                                        </h2>
                                        <div className="h-px bg-zinc-800 flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
