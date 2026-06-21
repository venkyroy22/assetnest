"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, Search, ArrowRight, Wrench, Sparkles, ChevronRight, ChevronLeft, ChevronDown, Home, Info, ZoomIn, Check, RotateCcw, FileText, Settings, BookOpen, ImageIcon, Timer, Briefcase, Gamepad2, Ruler, PanelLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import Logo from "./Logo";
import { useSidebar } from "./SidebarProvider";
import { ALL_TOOLS, ToolCategory } from "@/lib/tools";
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
    Tool: "text-[#f0ede8]",
    Article: "text-amber-400",
    Guide: "text-emerald-400",
    Prompts: "text-[#f0ede8]",
    Page: "text-zinc-400",
};

const TOOL_CATEGORIES: ToolCategory[] = ["Images", "PDF", "Generate", "Productivity", "Business"];

const CATEGORY_ICONS: Record<ToolCategory, any> = {
    "Images": ImageIcon,
    "PDF": FileText,
    "Generate": Sparkles,
    "Productivity": Timer,
    "Business": Briefcase,
};

const TOOLS_BY_CATEGORY = TOOL_CATEGORIES.map(cat => ({
    category: cat,
    icon: CATEGORY_ICONS[cat],
    tools: ALL_TOOLS.filter(t => t.category === cat),
}));

const NAV_LINKS = [
    { name: "Tools", href: "/tools", hasMega: true },
    { name: "Prompts", href: "/prompts", hasMega: false },
    { name: "Articles", href: "/articles", hasMega: false },
    { name: "Guides", href: "/guides", hasMega: false },
    { name: "About", href: "/about", hasMega: false },
];

const Navbar = ({ className = "" }: { className?: string }) => {
    const { isOpen, toggle } = useSidebar();
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof SEARCH_INDEX>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const megaRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { settings, updateSettings, setSettingsOpen } = useSettings();
    const isHome = pathname === "/";
    const showSolidBg = !isHome;

    const [megaOpen, setMegaOpen] = useState(false);
    const toolsLinkRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

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
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                megaOpen &&
                megaRef.current &&
                !megaRef.current.contains(e.target as Node) &&
                toolsLinkRef.current &&
                !toolsLinkRef.current.contains(e.target as Node)
            ) {
                setMegaOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [megaOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setMegaOpen(false);
    }, [pathname]);

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
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);



    if (!mounted) {
        return (
            <nav className={`${(settings.fixedNavbar && !isHome) ? "sticky" : "absolute"} top-0 z-[5000] w-full bg-background h-16 md:h-20`}>
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
            <nav
                ref={navRef}
                className={`w-full transition-[background-color,border-color,backdrop-filter] duration-500 h-16 md:h-20 transform-gpu ${showSolidBg ? "backdrop-blur-xl" : "border-b border-transparent"} ${className}`}
                style={{
                    background: showSolidBg ? "rgba(20,20,20,0.95)" : "transparent",
                    borderBottom: showSolidBg ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                }}
            >
                <div className="flex h-full items-center px-4 md:px-6 lg:px-10 gap-4">
                    {/* Back Button */}
                    {!isHome && (
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-all duration-200 flex items-center justify-center active:scale-95 touch-manipulation"
                            title="Go Back"
                            aria-label="Go Back"
                        >
                            <ChevronLeft size={20} className="shrink-0" />
                        </button>
                    )}

                    {/* Logo */}
                    <div className="flex items-center shrink-0">
                        <Link href="/" className="group active:scale-95 transition-all flex items-center gap-2.5">
                            <div className="relative">
                                <div className="absolute inset-0 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "rgba(240,237,232,0.05)" }} />
                                <Logo size={26} className="md:w-8 md:h-8 relative z-10" />
                            </div>
                            <span className="hidden md:inline text-lg font-black tracking-tight" style={{ color: "#f0ede8" }}>
                                AssetNest
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav Links — left-center */}
                    <div className="hidden md:flex items-center gap-0.5 shrink-0 ml-2">
                        {!isHome && (
                            <Link
                                href="/"
                                className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white/80 hover:text-[#39ae66] transition-colors duration-300"
                            >
                                <Home size={13} className="shrink-0" />
                                Home
                            </Link>
                        )}
                        {NAV_LINKS.filter((link) => !(link.href === "/tools" && pathname === "/tools")).map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                            const hasMega = link.hasMega;
                            return (
                                <div
                                    key={link.href}
                                    className="relative"
                                    ref={link.hasMega ? toolsLinkRef : null}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={(e) => {
                                            if (hasMega) {
                                                e.preventDefault();
                                                setMegaOpen(!megaOpen);
                                            }
                                        }}
                                        className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-300 ${
                                            isActive || (hasMega && megaOpen)
                                                ? "text-[#39ae66]"
                                                : "text-white/80 hover:text-[#39ae66]"
                                        }`}
                                    >
                                        {link.name}
                                        {hasMega && (
                                            <ChevronDown
                                                size={12}
                                                className="transition-transform duration-200"
                                                style={{ transform: megaOpen ? "rotate(180deg)" : "rotate(0)" }}
                                            />
                                        )}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Spacer pushes search + auth to the right */}
                    <div className="hidden md:flex flex-1" />

                    {/* Search — desktop */}
                    <div ref={searchRef} className="hidden md:flex items-center w-56 lg:w-72 relative shrink-0">
                        <div
                            className={`flex items-center backdrop-blur-md px-4 py-2 w-full transition-all duration-300 ${showResults ? "rounded-t-2xl rounded-b-none" : "rounded-full"}`}
                            style={{
                                background: "rgba(255,255,255,0.09)",
                                border: `1px solid ${showResults ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)"}`,
                            }}
                        >
                            <Search size={14} className="mr-2.5 shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => query.length >= 2 && setShowResults(true)}
                                placeholder="Search or create"
                                autoComplete="off"
                                className="bg-transparent text-sm w-full focus:outline-none font-medium placeholder:text-white/50"
                                style={{ color: "#ffffff" }}
                            />
                            {query && (
                                <button onClick={() => { setQuery(""); setShowResults(false); }} className="transition-colors ml-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {showResults && (
                            <div data-lenis-prevent className="absolute top-full left-0 right-0 backdrop-blur-xl border-t-0 shadow-2xl z-[200] overflow-y-auto max-h-[60vh] rounded-b-2xl p-1"
                                style={{ background: "rgba(28,28,28,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none" }}
                            >
                                {results.length > 0 ? results.map((item, i) => (
                                    <Link key={i} href={item.href}
                                        onClick={() => { setQuery(""); setShowResults(false); }}
                                        className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0 pr-4">
                                            <span className="text-xs font-semibold truncate" style={{ color: "#f0ede8" }}>{item.title}</span>
                                            <span className="text-[11px] font-medium mt-0.5 line-clamp-1" style={{ color: "#555" }}>{item.desc}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded ${TAG_COLORS[item.tag] || "text-zinc-500"}`}
                                                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)" }}
                                            >{item.tag}</span>
                                            <ArrowRight size={12} className="text-zinc-600 group-hover:text-[#f0ede8] transition-colors" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-xs font-semibold" style={{ color: "#555" }}>No results for &ldquo;{query}&rdquo;</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>



                    {/* Mobile right actions: search icon + hamburger */}
                    <div className="flex md:hidden items-center gap-1 ml-auto shrink-0">
                        {!isHome && (
                            <Link
                                href="/"
                                className="p-2 transition-colors touch-manipulation flex items-center justify-center text-zinc-400 hover:text-white"
                                style={{ color: "#888" }}
                                aria-label="Go to Homepage"
                            >
                                <Home size={20} />
                            </Link>
                        )}
                        <button
                            onClick={() => { setMobileSearchOpen(true); setMobileMenuOpen(false); }}
                            className="p-2 transition-colors touch-manipulation"
                            style={{ color: "#888" }}
                            aria-label="Open search"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileSearchOpen(false); }}
                            className="p-2 transition-colors touch-manipulation"
                            style={{ color: "#888" }}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                </div>
            </nav>

            {/* ══════════════════════ MEGA DROPDOWN ══════════════════════ */}
            <div
                ref={megaRef}
                className="hidden md:block fixed left-0 right-0 z-[999] transition-all duration-300"
                style={{
                    top: "80px",
                    opacity: megaOpen ? 1 : 0,
                    transform: megaOpen ? "translateY(0)" : "translateY(-8px)",
                    pointerEvents: megaOpen ? "auto" : "none",
                }}
            >
                <div className="mx-4 lg:mx-10 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                    <div className="p-6 lg:p-8">
                        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 lg:gap-8">
                            {TOOLS_BY_CATEGORY.map(({ category, icon: CatIcon, tools }) => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <CatIcon size={14} style={{ color: "#ffffff" }} />
                                        <span className="text-xs font-bold tracking-wide" style={{ color: "#ffffff" }}>{category}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {tools.map(tool => (
                                            <Link
                                                key={tool.id}
                                                href={tool.href}
                                                onClick={() => setMegaOpen(false)}
                                                className="block text-[13px] font-medium py-1 text-[#888] hover:text-[#39ae66] hover:translate-x-1 transition-all duration-300 ease-out transform"
                                              >
                                                {tool.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-6 lg:px-8 py-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                    >
                        <Link
                            href="/tools"
                            onClick={() => setMegaOpen(false)}
                            className="flex items-center gap-2 text-xs font-bold text-[#888] hover:text-[#39ae66] hover:translate-x-1 transition-all duration-300 ease-out transform"
                        >
                            View all {ALL_TOOLS.length} tools <ArrowRight size={12} />
                        </Link>
                        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#444" }}>
                            100% Free · Browser-Based · Private
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Mobile Search Overlay ── */}
            {mobileSearchOpen && (
                <div className="fixed inset-0 z-[200] backdrop-blur-xl flex flex-col md:hidden" style={{ background: "rgba(20,20,20,0.98)" }}>
                    <div className="flex items-center gap-3 px-4 h-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <button
                            onClick={() => { setMobileSearchOpen(false); setQuery(""); setShowResults(false); }}
                            className="p-1.5 touch-manipulation" style={{ color: "rgba(255,255,255,0.95)" }}
                        >
                            <X size={20} />
                        </button>
                        <Search size={16} className="shrink-0 ml-1" style={{ color: "rgba(255,255,255,0.7)" }} />
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
                            className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-white/50"
                            style={{ color: "#ffffff" }}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {query.length < 2 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <Search size={28} style={{ color: "#333" }} />
                                <p className="text-xs font-medium" style={{ color: "#555" }}>Type to search…</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((item, i) => (
                                    <Link key={i} href={item.href}
                                        onClick={() => { setQuery(""); setShowResults(false); setMobileSearchOpen(false); }}
                                        className="flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0 pr-3">
                                            <span className="text-sm font-semibold truncate" style={{ color: "#f0ede8" }}>{item.title}</span>
                                            <span className="text-xs mt-0.5 line-clamp-1" style={{ color: "#555" }}>{item.desc}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${TAG_COLORS[item.tag] || "text-zinc-500"}`}
                                                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)" }}
                                            >{item.tag}</span>
                                            <ArrowRight size={13} style={{ color: "#555" }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <p className="text-sm font-semibold" style={{ color: "#555" }}>No results for &ldquo;{query}&rdquo;</p>
                                <p className="text-xs" style={{ color: "#444" }}>Try a different keyword</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Mobile Menu Overlay ── */}
            <div
                className={`md:hidden fixed inset-0 top-16 z-[150] backdrop-blur-xl transition-all duration-300 flex flex-col ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                style={{ background: "rgba(20,20,20,0.98)" }}
            >
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest px-2 mb-3" style={{ color: "#555" }}>Discover</p>
                        <div className="space-y-1">
                            {[
                                ...(isHome ? [] : [{ name: "Home", href: "/", icon: Home }]),
                                ...(pathname === "/tools" ? [] : [{ name: "Smart Tools", href: "/tools", icon: Wrench }]),
                                { name: "AI Image Prompts", href: "/prompts", icon: Sparkles },
                                { name: "Articles", href: "/articles", icon: FileText },
                                { name: "Guides", href: "/guides", icon: BookOpen },
                                { name: "About", href: "/about", icon: Info },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all touch-manipulation`}
                                        style={{
                                            background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                                            color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.95)",
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={16} style={{ color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)" }} />
                                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                                        </div>
                                        <ArrowRight size={14} style={{ opacity: 0.3 }} />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>



                    <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest px-2 mb-3" style={{ color: "#555" }}>Text Size</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "compact",  label: "A-", desc: "Compact" },
                                { id: "standard", label: "A",  desc: "Standard" },
                                { id: "large",    label: "A+", desc: "Large" },
                            ].map((scale) => (
                                <button key={scale.id}
                                    onClick={() => updateSettings({ uiScale: scale.id as any })}
                                    className="flex flex-col items-center justify-center py-3 rounded-xl transition-all touch-manipulation"
                                    style={{
                                        background: settings.uiScale === scale.id ? "#f0ede8" : "rgba(255,255,255,0.04)",
                                        color: settings.uiScale === scale.id ? "#141414" : "#888",
                                        border: settings.uiScale === scale.id ? "1px solid #f0ede8" : "1px solid rgba(255,255,255,0.07)",
                                    }}
                                >
                                    <span className="text-base font-black">{scale.label}</span>
                                    <span className="text-[9px] font-bold mt-0.5" style={{ opacity: 0.6 }}>{scale.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                    <div className="pt-2">
                        <button
                            onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}
                            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-[0.98] group"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#888" }}
                        >
                            <div className="flex items-center gap-4">
                                <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" style={{ color: "#555" }} />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-black uppercase tracking-widest" style={{ color: "#f0ede8" }}>Platform Settings</span>
                                    <span className="text-[10px] font-medium" style={{ color: "#555" }}>Customize your experience</span>
                                </div>
                            </div>
                            <ChevronRight size={18} style={{ color: "#444" }} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;