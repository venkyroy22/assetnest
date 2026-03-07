"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Sparkles, Search, X, ArrowUpRight,
    Laugh, Zap, Wind, Star, Gamepad2, Palette, Microscope, Music, Ghost, Sun,
    ExternalLink, Globe, AlertTriangle
} from "lucide-react";
import { usefulWebsites, UsefulWebsite } from "@/data/usefulWebsitesData";

// ── Icons Mapping ─────────────────────────────────────────────────────────────
const iconMap: Record<string, any> = {
    funny: Laugh,
    crazy: Zap,
    chill: Wind,
    wow: Star,
    gaming: Gamepad2,
    art: Palette,
    science: Microscope,
    music: Music,
    weird: Ghost,
    cool: Sun,
};

const labelMap: Record<string, string> = {
    funny: "Funny",
    crazy: "Crazy",
    chill: "Chill",
    wow: "Wow",
    gaming: "Gaming",
    art: "Art",
    science: "Science",
    music: "Music",
    weird: "Weird",
    cool: "Cool",
};

const accentMap: Record<string, string> = {
    funny: "#FFE600",
    crazy: "#FF2D78",
    chill: "#00F5FF",
    wow: "#39FF14",
    gaming: "#BF5FFF",
    art: "#FF6B00",
    science: "#00BFFF",
    music: "#FF69B4",
    weird: "#FF3333",
    cool: "#AAD900",
};

// ── Website Card Component ──────────────────────────────────────────────────
function WebsiteCard({ site, index }: { site: UsefulWebsite; index: number }) {
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

    const Icon = iconMap[site.cat] || Globe;
    const accent = accentMap[site.cat] || "#ffffff";
    const label = labelMap[site.cat] || site.cat;

    return (
        <a 
            href={site.url} 
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
                            <span className="text-[9px] font-mono text-zinc-600 font-bold">#{site.n}</span>
                            <h3
                                className="text-xs font-black uppercase tracking-widest transition-colors duration-300"
                                style={{ color: hovered ? accent : "#fff" }}
                            >
                                {site.name}
                            </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                            {site.desc}
                        </p>
                    </div>

                    <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                         <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500 mr-1">Tags:</span>
                        {site.tags.map(tag => (
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

// ── Floating Emoji ──────────────────────────────────────────────────────────
function FloatingEmoji() {
    const emojis = ['😂','🤯','🔥','💀','🎉','👾','🕹️','🌈','⚡','🎸','🦄','👽','🍕','💣','🎭','🌀','🤖','👻','🎪','🦆'];
    const [elements, setElements] = useState<{id: number, left: string, duration: string, delay: string, fontSize: string, char: string}[]>([]);

    useEffect(() => {
        const els = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}vw`,
            duration: `${15 + Math.random() * 20}s`,
            delay: `${-Math.random() * 20}s`,
            fontSize: `${16 + Math.random() * 30}px`,
            char: emojis[Math.floor(Math.random() * emojis.length)]
        }));
        setElements(els);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-black">
            {/* Grain overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")` }} />
            
            {elements.map(el => (
                <div
                    key={el.id}
                    className="absolute bottom-[-10vh] animate-float-up opacity-[0.07]"
                    style={{
                        left: el.left,
                        animationDuration: el.duration,
                        animationDelay: el.delay,
                        fontSize: el.fontSize,
                    }}
                >
                    {el.char}
                </div>
            ))}
        </div>
    );
}

// ── Page Component ───────────────────────────────────────────────────────────
export default function UsefulWebsitesPage() {
    const [query, setQuery] = useState("");
    const [activeCat, setActiveCat] = useState("all");
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const filteredWebsites = useMemo(() => {
        const q = query.trim().toLowerCase();
        return usefulWebsites.filter(s => {
            const matchesQuery = !q || 
                s.name.toLowerCase().includes(q) || 
                s.desc.toLowerCase().includes(q) ||
                s.tags.some(tag => tag.toLowerCase().includes(q));
            
            const matchesCat = activeCat === "all" || s.cat === activeCat;
            
            return matchesQuery && matchesCat;
        });
    }, [query, activeCat]);

    const categories = ["all", ...Object.keys(labelMap)];

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <FloatingEmoji />

            <div className="relative z-10 py-12 px-6 md:px-10 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <header className="text-center mb-12 relative">
                    <div 
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(-10px)",
                            transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 border border-yellow-500/20 bg-yellow-500/5 mb-6 backdrop-blur-sm rounded-full shadow-[0_0_20px_rgba(255,230,0,0.1)]"
                    >
                        <Zap size={14} className="text-yellow-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-400">Warning: Highly Addictive</span>
                    </div>

                    <div className="mb-8">
                         <h1
                            style={{
                                opacity: headerVisible ? 1 : 0,
                                transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                                transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.1s",
                            }}
                            className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 leading-[0.85] italic"
                        >
                            <span className="block text-yellow-400">100 Wild</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.1)" }}>Free</span>
                            <span className="block text-cyan-400">Websites</span>
                        </h1>

                        <p
                            style={{
                                opacity: headerVisible ? 1 : 0,
                                transform: headerVisible ? "translateY(0)" : "translateY(15px)",
                                transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s",
                            }}
                            className="text-zinc-500 max-w-2xl mx-auto text-base font-bold leading-relaxed"
                        >
                            Funny 😂 · Crazy 🤯 · Interactive 🕹️ · Awesome 🔥<br />
                            <span className="text-emerald-400/80 text-xs mt-1 block font-black uppercase tracking-widest">Zero AI. Just pure internet gold.</span>
                        </p>
                    </div>

                    <div 
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "scale(1)" : "scale(0.95)",
                            transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s",
                        }}
                        className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-xl rotate-1"
                    >
                        <AlertTriangle size={14} /> Side effects: Lost productivity & existential wonder
                    </div>
                </header>

                {/* Search & Filters */}
                <div className="max-w-4xl mx-auto mb-16 space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search size={20} className="text-zinc-600 group-focus-within:text-yellow-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find funny, crazy, or weird websites..."
                            className="w-full bg-zinc-900/40 backdrop-blur-xl border-2 border-zinc-800 px-16 py-5 text-lg rounded-2xl focus:outline-none focus:border-yellow-400/50 transition-all placeholder:text-zinc-700 font-bold"
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
                                        ? "bg-yellow-400 text-black shadow-[0_0_30px_rgba(255,230,0,0.3)] scale-105" 
                                        : "bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:border-zinc-500 hover:text-zinc-300"}`}
                            >
                                {cat === "all" ? "🌐 All 100" : `${(iconMap[cat] && " ") || ""}${labelMap[cat] || cat}`}
                            </button>
                        ))}
                    </div>

                    <div className="text-center">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">
                            Showing <span className="text-yellow-400">{filteredWebsites.length}</span> results
                        </span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredWebsites.map((site, i) => (
                        <WebsiteCard key={site.n} site={site} index={i} />
                    ))}
                </div>

                {/* Empty State */}
                {filteredWebsites.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                            <Ghost size={40} className="text-zinc-700" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-500 mb-2">Ghost Town</h2>
                        <p className="text-zinc-600 font-bold">Nothing matches your wild search. Try something else!</p>
                    </div>
                )}

                {/* Footer Section */}
                <footer className="mt-40 pt-20 border-t border-zinc-900/50 text-center">
                    <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        Curating the internet's soul since 1999
                    </p>
                    <p className="text-zinc-800 text-[10px] font-bold">
                        🤙 All websites are free to visit · Share with your bored friends
                    </p>
                </footer>
            </div>

            <style jsx global>{`
                @keyframes float-up {
                    0% { transform: translateY(110vh) rotate(0deg); }
                    100% { transform: translateY(-20vh) rotate(360deg); }
                }
                .animate-float-up {
                    animation: float-up linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
