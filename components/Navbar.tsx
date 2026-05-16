"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, ArrowRight, Wrench, Sparkles, ChevronRight, ChevronLeft, Home, ZoomIn, Check, RotateCcw, FileText, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import Logo from "./Logo";
import { useSidebar } from "./SidebarProvider";
import { ALL_TOOLS } from "@/lib/tools";
import { ALL_ARTICLE_POSTS } from "@/data/articles";
import { ALL_GUIDE_POSTS } from "@/data/guidePosts";
import Tooltip from "./Tooltip";
import { useSettings } from "./SettingsProvider";

type SearchItem = { title: string; desc: string; href: string; tag: string; keywords?: string[] };

const TOOL_ENTRIES: SearchItem[] = ALL_TOOLS.map(t => ({
    title: t.name, desc: t.description, href: t.href, tag: "Tool", keywords: t.tags,
}));
const ARTICLE_ENTRIES: SearchItem[] = ALL_ARTICLE_POSTS.map(a => ({
    title: a.title, desc: a.description, href: `/articles/${a.slug}`, tag: "Article", keywords: a.tags,
}));
const GUIDE_ENTRIES: SearchItem[] = ALL_GUIDE_POSTS.map(g => ({
    title: g.title, desc: g.description, href: `/guides/${g.slug}`, tag: "Guide", keywords: g.tags,
}));

const SEARCH_INDEX: SearchItem[] = [
    ...TOOL_ENTRIES, ...ARTICLE_ENTRIES, ...GUIDE_ENTRIES,
    { title: "AI Image Prompts", desc: "Curated prompt lists for leading image generation models", href: "/prompts", tag: "Prompts" },
    { title: "Articles", desc: "Deep dives into business strategy, growth, and entrepreneurship", href: "/articles", tag: "Page" },
    { title: "Guides", desc: "Creator tips, AI guides, and productivity methods", href: "/guides", tag: "Page" },
    { title: "Privacy Policy", desc: "AssetNest privacy policy", href: "/privacy", tag: "Page" },
    { title: "Terms of Service", desc: "AssetNest terms of service", href: "/terms", tag: "Page" },
    { title: "About AssetNest", desc: "Learn about our mission", href: "/about", tag: "Page" },
    { title: "Contact Us", desc: "Get in touch for support", href: "/contact", tag: "Page" },
];

const TAG_COLORS: Record<string, string> = {
    Tool: "text-white",
    Article: "text-amber-400",
    Guide: "text-emerald-400",
    Prompts: "text-white",
    Page: "text-zinc-400",
};

const NAV_LINKS = [
    { name: "Tools", href: "/tools", icon: Wrench },
    { name: "AI Prompts", href: "/prompts", icon: Sparkles },
    { name: "Articles", href: "/articles", icon: FileText },
];

const Navbar = ({ className = "" }: { className?: string }) => {
    const { isOpen, toggle } = useSidebar();
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // FIX: separate state for mobile search overlay
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof SEARCH_INDEX>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { settings, updateSettings, setSettingsOpen } = useSettings();
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const zoomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) { setResults([]); setShowResults(false); return; }
        const words = q.split(/\s+/).filter(w => w.length > 0);
        const scored = SEARCH_INDEX.map((item) => {
            let score = 0;
            const title = item.title.toLowerCase();
            const desc = item.desc.toLowerCase();
            const tag = item.tag.toLowerCase();
            const keywords = item.keywords?.map(k => k.toLowerCase()) || [];
            for (const word of words) {
                if (title === q) score += 100;
                else if (title.startsWith(q)) score += 60;
                if (title.includes(word)) score += 30;
                if (tag.includes(word)) score += 15;
                if (keywords.some(k => k.includes(word))) score += 20;
                if (desc.includes(word)) score += 5;
            }
            return { item, score };
        }).filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(r => r.item);
        setResults(scored);
        setShowResults(true);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
            if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
                setIsZoomOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // FIX: close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
    }, [pathname]);

    // FIX: prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen || mobileSearchOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen, mobileSearchOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && results.length > 0) {
            router.push(results[0].href);
            setQuery("");
            setShowResults(false);
            setMobileSearchOpen(false);
        }
        if (e.key === "Escape") {
            setShowResults(false);
            setMobileSearchOpen(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) {
        return (
            <nav className={`${settings.fixedNavbar ? "sticky" : "absolute"} top-0 z-[1000] w-full bg-background h-16 md:h-20`}>
                <div className="px-4 md:px-10 h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="text-xl font-bold tracking-tight shrink-0">AssetNest</div>
                        <div className="w-10 h-10" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <>
            <nav className={`w-full transition-[background-color,border-color,backdrop-filter] duration-500 h-16 md:h-20 transform-gpu ${scrolled ? "bg-black/95 backdrop-blur-xl border-b border-zinc-800/50" : "bg-transparent border-b border-transparent"} ${className}`}>
                <div className="flex h-full items-center relative">

                    {/* Sidebar Toggle — desktop only */}
                    <div className="hidden lg:flex items-center justify-center h-full absolute left-0 z-10 w-16">
                        <button
                            onClick={toggle}
                            className="flex items-center justify-center p-2 rounded-sm border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                            aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            <Menu size={20} />
                        </button>
                    </div>

                    {/* Main content */}
                    <div className="flex-grow h-full px-4 lg:pl-28 lg:pr-10">
                        <div className="flex items-center justify-between h-full gap-3">

                            {/* Logo & Back Button */}
                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                {pathname !== "/" && (
                                    <button 
                                        onClick={() => router.back()}
                                        className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all active:scale-90 text-zinc-400 hover:text-white group"
                                        aria-label="Go back"
                                    >
                                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                                <Link href="/" className="group active:scale-95 transition-all">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <Logo size={26} className="md:w-9 md:h-9 relative z-10" />
                                    </div>
                                </Link>
                            </div>

                            {/* Breadcrumbs — desktop only */}
                            <div className="hidden lg:flex items-center gap-2 px-4 border-l border-zinc-800/50 h-8 shrink-0">
                                <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
                                    <Home size={16} />
                                </Link>
                                {pathname !== "/" && (
                                    <>
                                        <ChevronRight size={12} className="text-zinc-700" />
                                        {(() => {
                                            const segments = pathname?.split("/").filter(Boolean) || [];
                                            const currentTool = ALL_TOOLS.find(t => t.href === pathname);
                                            const categoryHash = currentTool ? `#${currentTool.category.toLowerCase().replace(/\s+/g, '-')}` : '';
                                            return segments.map((segment, idx, arr) => {
                                                const href = "/" + arr.slice(0, idx + 1).join("/");
                                                const isLast = idx === arr.length - 1;
                                                const tool = ALL_TOOLS.find(t => t.href === href);
                                                const label = tool ? tool.name : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
                                                let finalHref = href;
                                                if (segment === "tools" && !isLast && categoryHash) finalHref += categoryHash;
                                                return (
                                                    <div key={href} className="flex items-center gap-2">
                                                        <Link
                                                            href={finalHref}
                                                            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isLast ? "text-white cursor-default" : "text-zinc-500 hover:text-zinc-300"}`}
                                                            onClick={(e) => isLast && e.preventDefault()}
                                                        >
                                                            {label}
                                                        </Link>
                                                        {!isLast && <ChevronRight size={12} className="text-zinc-700" />}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </>
                                )}
                            </div>

                            {/* Search — desktop */}
                            <div ref={searchRef} className="hidden md:flex items-center flex-1 lg:max-w-lg relative">
                                <div className={`flex items-center bg-zinc-900/40 backdrop-blur-md border px-5 py-2.5 w-full rounded-2xl transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/60 focus-within:border-zinc-500 ${showResults ? "border-zinc-600 rounded-b-none" : "border-zinc-800"}`}>
                                    <Search size={14} className="text-zinc-500 mr-3 shrink-0" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => query.length >= 2 && setShowResults(true)}
                                        placeholder="Search..."
                                        autoComplete="off"
                                        className="bg-transparent text-sm w-full focus:outline-none placeholder:text-zinc-600 font-medium"
                                    />
                                    {query && (
                                        <button onClick={() => { setQuery(""); setShowResults(false); }} className="text-zinc-600 hover:text-white transition-colors ml-2">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                {showResults && (
                                    <div data-lenis-prevent className="absolute top-full left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 border-t-0 shadow-2xl z-[200] overflow-y-auto max-h-[60vh] rounded-b-2xl p-1">
                                        {results.length > 0 ? results.map((item, i) => (
                                            <Link key={i} href={item.href}
                                                onClick={() => { setQuery(""); setShowResults(false); }}
                                                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex flex-col flex-1 min-w-0 pr-4">
                                                    <span className="text-xs font-semibold text-white truncate">{item.title}</span>
                                                    <span className="text-[11px] text-zinc-500 font-medium mt-0.5 line-clamp-1">{item.desc}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded border border-white/5 bg-white/5 ${TAG_COLORS[item.tag] || "text-zinc-500"}`}>{item.tag}</span>
                                                    <ArrowRight size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
                                                </div>
                                            </Link>
                                        )) : (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-xs font-semibold text-zinc-500">No results for &ldquo;{query}&rdquo;</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Nav Links */}
                            <div className="hidden md:flex items-center gap-1 shrink-0">
                                {NAV_LINKS.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                                    return (
                                        <Link key={link.href} href={link.href}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                                                ${isActive ? "bg-white/8 text-white border border-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                                        >
                                            <Icon size={13} />
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Zoom — desktop only */}
                            <div ref={zoomRef} className="hidden lg:relative lg:block shrink-0">
                                <button
                                    onClick={() => setIsZoomOpen(!isZoomOpen)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-90 ${isZoomOpen ? "bg-white text-black border-white" : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"}`}
                                    title="UI Scaling"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                {isZoomOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl rounded-2xl p-1.5 z-50">
                                        <p className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-1">Text Zoom</p>
                                        {[
                                            { id: "compact",  label: "A- Compact",  desc: "90% UI Scale" },
                                            { id: "standard", label: "A Standard",  desc: "100% UI Scale" },
                                            { id: "large",    label: "A+ Large",    desc: "115% UI Scale" },
                                        ].map((scale) => (
                                            <button key={scale.id}
                                                onClick={() => { updateSettings({ uiScale: scale.id as any }); setIsZoomOpen(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${settings.uiScale === scale.id ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[11px] font-black uppercase tracking-wider">{scale.label}</span>
                                                    <span className="text-[9px] text-zinc-600 font-bold">{scale.desc}</span>
                                                </div>
                                                {settings.uiScale === scale.id && <Check size={12} className="text-white" />}
                                            </button>
                                        ))}
                                        {settings.uiScale !== "standard" && (
                                            <button
                                                onClick={() => { updateSettings({ uiScale: "standard" }); setIsZoomOpen(false); }}
                                                className="w-full flex items-center justify-center gap-2 mt-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                <RotateCcw size={10} /> Reset Zoom
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Mobile right actions: search icon + hamburger ── */}
                            <div className="flex md:hidden items-center gap-1 shrink-0">
                                <button
                                    onClick={() => { setMobileSearchOpen(true); setMobileMenuOpen(false); }}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors touch-manipulation"
                                    aria-label="Open search"
                                >
                                    <Search size={20} />
                                </button>
                                <button
                                    onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileSearchOpen(false); }}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors touch-manipulation"
                                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                                >
                                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Search Overlay ── */}
            {mobileSearchOpen && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col md:hidden">
                    <div className="flex items-center gap-3 px-4 h-16 border-b border-zinc-800">
                        <button
                            onClick={() => { setMobileSearchOpen(false); setQuery(""); setShowResults(false); }}
                            className="p-1.5 text-zinc-400 hover:text-white touch-manipulation"
                        >
                            <X size={20} />
                        </button>
                        <Search size={16} className="text-zinc-500 shrink-0 ml-1" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search tools, articles, guides…"
                            autoFocus
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 font-medium focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {query.length < 2 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <Search size={28} className="text-zinc-700" />
                                <p className="text-xs text-zinc-600 font-medium">Type to search…</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((item, i) => (
                                    <Link key={i} href={item.href}
                                        onClick={() => { setQuery(""); setShowResults(false); setMobileSearchOpen(false); }}
                                        className="flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0 pr-3">
                                            <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                                            <span className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border border-white/5 bg-white/5 ${TAG_COLORS[item.tag] || "text-zinc-500"}`}>{item.tag}</span>
                                            <ArrowRight size={13} className="text-zinc-600" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <p className="text-sm font-semibold text-zinc-500">No results for &ldquo;{query}&rdquo;</p>
                                <p className="text-xs text-zinc-700">Try a different keyword</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Mobile Menu Overlay ── */}
            <div className={`md:hidden fixed inset-0 top-16 z-[150] bg-black/98 backdrop-blur-xl transition-all duration-300 flex flex-col ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {/* Nav links */}
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-3">Discover</p>
                        <div className="space-y-1">
                            {[
                                { name: "Smart Tools", href: "/tools", icon: Wrench },
                                { name: "AI Image Prompts", href: "/prompts", icon: Sparkles },
                                { name: "Articles", href: "/articles", icon: FileText },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all touch-manipulation
                                            ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={16} className={isActive ? "text-white" : "text-zinc-600"} />
                                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-30" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800/60" />

                    {/* UI Scale on mobile */}
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-3">Text Size</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "compact",  label: "A-", desc: "Compact" },
                                { id: "standard", label: "A",  desc: "Standard" },
                                { id: "large",    label: "A+", desc: "Large" },
                            ].map((scale) => (
                                <button key={scale.id}
                                    onClick={() => updateSettings({ uiScale: scale.id as any })}
                                    className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all touch-manipulation
                                        ${settings.uiScale === scale.id
                                            ? "bg-white text-black border-white"
                                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}
                                >
                                    <span className="text-base font-black">{scale.label}</span>
                                    <span className={`text-[9px] font-bold mt-0.5 ${settings.uiScale === scale.id ? "text-black/60" : "text-zinc-600"}`}>{scale.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800/60" />

                    {/* Platform Settings Button */}
                    <div className="pt-2">
                        <button 
                            onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}
                            className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-4">
                                <Settings size={20} className="text-zinc-500 group-hover:rotate-45 transition-transform duration-500" />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-black uppercase tracking-widest text-white">Platform Settings</span>
                                    <span className="text-[10px] font-medium text-zinc-600">Customize your experience</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-700" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;