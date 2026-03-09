"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Sparkles, Search, X, ArrowUpRight,
    MessageSquare, PenTool, Image as ImageIcon, Video, Music, Code, Microscope, Palette, Zap, Megaphone,
    ExternalLink, Bot, AlertTriangle
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
        const t = setTimeout(() => setVisible(true), 10 + Math.min(index * 20, 600));
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
                    borderLeft: `4px solid ${accent}`,
                    boxShadow: hovered
                        ? `0 20px 40px -10px ${accent}25, 0 0 0 1px ${accent}40`
                        : "0 0 0 1px rgba(63,63,70,0.4)",
                    willChange: "transform, opacity",
                }}
                className="relative overflow-hidden rounded-2xl bg-zinc-900/60 p-5 cursor-pointer h-full border border-transparent backdrop-blur-sm"
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

                        <div className="flex items-center gap-2">
                             <span
                                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border"
                                style={{
                                    color: accent,
                                    borderColor: `${accent}30`,
                                    background: `${accent}08`,
                                }}
                            >
                                {label}
                            </span>
                            <ExternalLink size={12} className="text-zinc-700" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-mono text-zinc-600 font-bold">#{tool.n}</span>
                            <h3
                                className="text-xs font-black uppercase tracking-widest transition-colors duration-300"
                                style={{ color: hovered ? accent : "#fff" }}
                            >
                                {tool.name}
                            </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                            {tool.desc}
                        </p>
                    </div>

                    <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                         <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500 mr-1">Capabilities:</span>
                        {tool.tags.map(tag => (
                            <span key={tag} className="text-[8px] font-bold text-zinc-500 bg-zinc-800/20 px-1.5 py-0.5 rounded border border-zinc-800/50">
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
        <div className="relative min-h-screen overflow-x-hidden bg-black">
            {/* Grain overlay */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")` }} />

            <div className="relative z-10 py-12 px-6 md:px-10 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <header className="text-center mb-16 relative">
                    <div 
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(-10px)",
                            transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 border border-purple-500/20 bg-purple-500/5 mb-6 backdrop-blur-sm rounded-full shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                    >
                        <Sparkles size={14} className="text-purple-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">Best AI Tools 2026</span>
                    </div>

                    <div className="mb-8">
                         <h1
                            style={{
                                opacity: headerVisible ? 1 : 0,
                                transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                                transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.1s",
                            }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase mb-4 leading-[0.85] italic"
                        >
                            <span className="block text-white">100+ Best</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.05)" }}>AI Powers</span>
                            <span className="block text-purple-400">Curated</span>
                        </h1>

                        <p
                            style={{
                                opacity: headerVisible ? 1 : 0,
                                transform: headerVisible ? "translateY(0)" : "translateY(15px)",
                                transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s",
                            }}
                            className="text-zinc-500 max-w-2xl mx-auto text-base font-bold leading-relaxed"
                        >
                            Advanced AI Assistants 😂 · Creative Engines 🤯 · Coding Wizards 🕹️ · Data Genies 🔥<br />
                            <span className="text-purple-400/80 text-xs mt-1 block font-black uppercase tracking-widest">A hand-curated directory of the most effective AI tools.</span>
                        </p>
                    </div>

                </header>

                {/* Search & Filters */}
                <div className="max-w-4xl mx-auto mb-16 space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search size={20} className="text-zinc-600 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find AI-powered tools..."
                            className="w-full bg-zinc-900/40 backdrop-blur-xl border-2 border-zinc-800 px-16 py-5 text-lg rounded-2xl focus:outline-none focus:border-purple-400/50 transition-all placeholder:text-zinc-700 font-bold"
                        />
                        {query && (
                            <button 
                                onClick={() => setQuery("")}
                                className="absolute inset-y-0 right-6 flex items-center text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCat(cat)}
                                className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all
                                    ${activeCat === cat 
                                        ? "bg-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105" 
                                        : "bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:border-zinc-500 hover:text-zinc-300"}`}
                            >
                                {cat === "all" ? "🌐 All Tools" : labelMap[cat] || cat}
                            </button>
                        ))}
                    </div>

                    <div className="text-center">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">
                            Showing <span className="text-purple-400">{filteredTools.length}</span> results
                        </span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredTools.map((tool, i) => (
                        <AIToolCard key={tool.n} tool={tool} index={i} />
                    ))}
                </div>

                {/* Empty State */}
                {filteredTools.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                            <Bot size={40} className="text-zinc-700" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-500 mb-2">No tools found</h2>
                        <p className="text-zinc-600 font-bold">Try adjusting your search or category filters!</p>
                    </div>
                )}

                {/* Footer Section */}
                <footer className="mt-40 pt-20 border-t border-zinc-900/50 text-center">
                    <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        Empowering the future with intelligence
                    </p>
                    <p className="text-zinc-800 text-[10px] font-bold">
                        🚀 All tools have free entry tiers · Verify privacy settings individually
                    </p>
                </footer>
            </div>
        </div>
    );
}
