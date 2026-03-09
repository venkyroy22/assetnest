"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Sparkles, Search, X, ArrowUpRight,
    MessageSquare, PenTool, Image as ImageIcon, Video, Music, Code, Microscope, Palette, Zap, Megaphone,
    ExternalLink, Bot
} from "lucide-react";
import { aiTools, AITool } from "@/data/aiToolsData";

// ── Icons Mapping ─────────────────────────────────────────────────────────────
const iconMap: Record<string, any> = {
    chatbot: Bot,
    writing: PenTool,
    image: ImageIcon,
    video: Video,
    audio: Music,
    code: Code,
    research: Microscope,
    design: Palette,
    productivity: Zap,
    marketing: Megaphone,
};

const labelMap: Record<string, string> = {
    chatbot: "AI Assistant",
    writing: "Writing",
    image: "Image",
    video: "Video",
    audio: "Audio",
    code: "Coding",
    research: "Research",
    design: "Design",
    productivity: "Productivity",
    marketing: "Marketing",
};

const accentMap: Record<string, string> = {
    chatbot: "#93c5fd",
    writing: "#a78bfa",
    image: "#e05fff",
    video: "#f87171",
    audio: "#fbbf24",
    code: "#22d3ee",
    research: "#00d4aa",
    design: "#f472b6",
    productivity: "#6bc96b",
    marketing: "#fb923c",
};

// ── Tool Card Component ──────────────────────────────────────────────────────
function AIToolCard({ tool, index }: { tool: AITool; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10 + Math.min(index * 20, 400));
        return () => clearTimeout(t);
    }, [index]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMouse({ x, y });
        setTilt({
            x: ((y / rect.height) - 0.5) * -8,
            y: ((x / rect.width) - 0.5) * 8,
        });
    }, []);

    const Icon = iconMap[tool.cat] || Sparkles;
    const accent = accentMap[tool.cat] || "#ffffff";
    const label = labelMap[tool.cat] || tool.cat;

    return (
        <a 
            href={tool.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block h-full outline-none"
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? hovered
                            ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale(1.01)`
                            : "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
                        : "translateY(20px)",
                    transition: visible
                        ? hovered
                            ? "transform 0.1s ease-out, box-shadow 0.2s ease-out"
                            : "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.5s ease"
                        : "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                    boxShadow: hovered
                        ? `0 20px 40px -10px ${accent}25, 0 0 0 1px ${accent}20`
                        : "0 0 0 1px rgba(63,63,70,0.4)",
                    willChange: "transform, opacity",
                }}
                className="relative overflow-hidden rounded-2xl bg-zinc-900/60 p-4 sm:p-5 cursor-pointer h-full border border-transparent"
            >
                {/* Spotlight radial */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(240px circle at ${mouse.x}px ${mouse.y}px, ${accent}15, transparent 70%)`
                            : "none",
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-4">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
                            style={{
                                background: hovered ? `${accent}15` : "rgba(39,39,42,0.6)",
                                borderColor: hovered ? `${accent}40` : "rgba(63,63,70,0.6)",
                            }}
                        >
                            <Icon
                                size={18}
                                style={{ color: hovered ? accent : "#71717a", transition: "color 0.3s" }}
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0 max-w-[60%]">
                             <span
                                className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] px-2 py-0.5 border truncate"
                                style={{
                                    color: accent,
                                    borderColor: `${accent}30`,
                                    background: `${accent}05`,
                                }}
                            >
                                {label}
                            </span>
                            <ExternalLink size={10} className="text-zinc-700 shrink-0" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-zinc-600">#{tool.n}</span>
                            <h3
                                className="text-xs font-black uppercase tracking-widest transition-colors duration-300"
                                style={{ color: hovered ? accent : "#fff" }}
                            >
                                {tool.name}
                            </h3>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed line-clamp-4 break-words overflow-hidden">
                            {tool.desc}
                        </p>
                    </div>

                    <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                        {tool.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-800/50">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </a>
    );
}

// ── Page Component ───────────────────────────────────────────────────────────
export default function AIToolsPage() {
    const [query, setQuery] = useState("");
    const [activeCat, setActiveCat] = useState("all");
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const filteredTools = useMemo(() => {
        const q = query.trim().toLowerCase();
        return aiTools.filter(t => {
            const matchesQuery = !q || 
                t.name.toLowerCase().includes(q) || 
                t.desc.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.toLowerCase().includes(q));
            
            const matchesCat = activeCat === "all" || t.cat === activeCat;
            
            return matchesQuery && matchesCat;
        });
    }, [query, activeCat]);

    const categories = ["all", ...Object.keys(labelMap)];

    return (
        <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 md:px-10 overflow-x-hidden">
            {/* Background Effects */}
            <div
                className="fixed inset-0 pointer-events-none -z-10"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(168,85,247,0.03) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 30%, transparent 100%)",
                }}
            />

            {/* Header */}
            <div className="max-w-4xl mb-12">
                <div
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(-10px)",
                        transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 border border-purple-500/20 bg-purple-500/5 mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                >
                    <Sparkles size={11} className="text-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Best AI Tools 2026</span>
                </div>

                <h1
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.7s cubic-bezier(0.23,1,0.32,1) 0.1s",
                    }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-white mb-6 leading-[0.9] sm:leading-[0.85]"
                >
                    100+ Best <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500">
                        AI Powers
                    </span>
                </h1>

                <p
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(15px)",
                        transition: "all 0.7s cubic-bezier(0.23,1,0.32,1) 0.2s",
                    }}
                    className="text-zinc-400 max-w-2xl text-base font-medium leading-relaxed"
                >
                    A hand-curated directory of the most effective, privacy-respecting, and free-to-start AI tools available today. From generative art to academic research.
                </p>
            </div>

            {/* Filters & Search Bar */}
            <div className="sticky top-[80px] md:top-24 z-30 mb-8 space-y-4 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-zinc-900 md:border-none md:bg-transparent md:backdrop-blur-none md:p-0 md:m-0 w-[calc(100%+2rem)] sm:w-auto">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:max-w-md group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find an AI tool..."
                            className="w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 px-12 py-4 text-sm rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-600 shadow-xl"
                        />
                        {query && (
                            <button 
                                onClick={() => setQuery("")}
                                className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Result Count */}
                    <div className="hidden md:block px-4 py-2 bg-zinc-900/40 rounded-lg border border-zinc-800/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Showing <span className="text-purple-400">{filteredTools.length}</span> tools
                        </p>
                    </div>
                </div>

                {/* Categories Scrollable */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCat(cat)}
                            className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeCat === cat 
                                    ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]" 
                                    : "bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"}`}
                        >
                            {cat === "all" ? "All Tools" : labelMap[cat] || cat}
                        </button>
                    ))}
                </div>
                {/* Mobile Result Count - Inline */}
                <div className="md:hidden flex items-center justify-between px-1">
                    <p className="text-[9px] font-black tracking-[0.2em] text-zinc-600 uppercase">
                        Current Library: <span className="text-purple-500">{filteredTools.length}</span> results
                    </p>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredTools.map((tool, i) => (
                    <AIToolCard key={tool.n} tool={tool} index={i} />
                ))}
            </div>

            {/* Empty State */}
            {filteredTools.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
                    <Bot size={48} className="text-zinc-800 mb-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-zinc-600 mb-2">No tools found</h2>
                    <p className="text-zinc-500 text-sm font-medium">Try adjusting your search or category filters.</p>
                </div>
            )}

            {/* Footer Note */}
            <div className="mt-20 text-center border-t border-zinc-900 pt-10">
                <p className="text-xs text-zinc-600 font-medium">
                    Curated for growth · 100% free tiers available · Verify privacy settings individually
                </p>
            </div>
        </div>
    );
}
