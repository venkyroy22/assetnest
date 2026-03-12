"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { useSidebar } from "./SidebarProvider";
import { ALL_TOOLS } from "@/lib/tools";

// ── Searchable content index ──────────────────────────────────────────────────
// Dynamically built from ALL_TOOLS so new tools are automatically searchable.
type SearchItem = { title: string; desc: string; href: string; tag: string; keywords?: string[] };

const TOOL_ENTRIES: SearchItem[] = ALL_TOOLS.map(t => ({
    title: t.name,
    desc: t.description,
    href: t.href,
    tag: "Tool",
    keywords: t.tags,
}));

const SEARCH_INDEX: SearchItem[] = [
    ...TOOL_ENTRIES,
    // Keywords pages
    { title: "AI Image Prompts", desc: "Curated prompt lists for Midjourney, ChatGPT, and more", href: "/prompts", tag: "Prompts" },
    // Static pages
    { title: "Privacy Policy", desc: "AssetNest privacy policy", href: "/privacy", tag: "Page" },
    { title: "Terms of Service", desc: "AssetNest terms of service", href: "/terms", tag: "Page" },
    { title: "About AssetNest", desc: "Learn about our mission", href: "/about", tag: "Page" },
    { title: "Contact Us", desc: "Get in touch for support", href: "/contact", tag: "Page" },
];
// ─────────────────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
    Tool: "text-emerald-400",
    Prompts: "text-purple-400",
    Page: "text-zinc-400",
};

const Navbar = ({ className = "" }: { className?: string }) => {
    const { isOpen, toggle } = useSidebar();
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof SEARCH_INDEX>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Filter results as user types
    useEffect(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) { setResults([]); setShowResults(false); return; }
        const found = SEARCH_INDEX.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.desc.toLowerCase().includes(q) ||
                item.tag.toLowerCase().includes(q) ||
                item.keywords?.some(k => k.toLowerCase().includes(q))
        ).slice(0, 8);
        setResults(found);
        setShowResults(true);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && results.length > 0) {
            router.push(results[0].href);
            setQuery("");
            setShowResults(false);
        }
        if (e.key === "Escape") {
            setShowResults(false);
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
            <nav className="sticky top-0 z-50 w-full bg-background h-20">
                <div className="px-10 h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="text-xl md:text-2xl font-bold tracking-tight shrink-0">AssetNest</div>
                        <div className="w-10 h-10" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 h-20 ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-white/5" : "bg-background"} ${className}`}>
            <div className="flex h-full items-center relative">
                {/* Sidebar Toggle - Fixed stationary position */}
                <div className="hidden lg:flex items-center justify-center h-full absolute left-0 z-10 w-16">
                    <button
                        onClick={toggle}
                        className="flex items-center justify-center p-2 rounded-sm border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                        aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
                        title={isOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Main Navbar Content */}
                <div className="flex-grow h-full px-4 lg:pl-20 lg:pr-10">
                    <div className="flex justify-between items-center h-full gap-2 md:gap-8">
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            <Link href="/" className="group active:scale-95 transition-all">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <Logo size={32} className="md:w-10 md:h-10 relative z-10" />
                                </div>
                            </Link>
                        </div>

                        {/* ── Functional Search Bar ── */}
                        <div ref={searchRef} className="flex items-center flex-1 lg:flex-grow lg:max-w-lg relative">
                            <div className={`flex items-center bg-zinc-900/40 backdrop-blur-md border px-3 md:px-5 py-2 md:py-2.5 w-full rounded-2xl transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/60 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.03)] focus-within:border-zinc-500 ${showResults ? "border-zinc-600 rounded-b-none" : "border-zinc-800"}`}>
                                <Search size={16} className="text-zinc-500 mr-2 lg:mr-3 shrink-0" />
                                <input
                                    type="text"
                                    id="global-search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => query.length >= 2 && setShowResults(true)}
                                    placeholder="Search..."
                                    autoComplete="off"
                                    className="bg-transparent text-xs lg:text-sm w-full focus:outline-none placeholder:text-zinc-600 font-medium"
                                />
                                {query && (
                                    <button onClick={() => { setQuery(""); setShowResults(false); }} className="text-zinc-600 hover:text-white transition-colors ml-2">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {showResults && (
                                <div className="fixed top-20 left-4 right-4 lg:absolute lg:top-full lg:left-0 lg:right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl z-[200] overflow-y-auto max-h-[70vh] rounded-2xl lg:rounded-t-none lg:border-t-0 p-1">
                                    {results.length > 0 ? (
                                        <>
                                            {results.map((item, i) => (
                                                <Link
                                                    key={i}
                                                    href={item.href}
                                                    target={item.href.startsWith("http") ? "_blank" : undefined}
                                                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                                    onClick={() => { setQuery(""); setShowResults(false); }}
                                                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                                                >
                                                    <div className="flex flex-col flex-1 min-w-0 pr-4">
                                                        <span className="text-xs font-semibold tracking-normal text-white group-hover:text-white truncate">{item.title}</span>
                                                        <span className="text-[11px] text-zinc-500 font-medium mt-0.5 line-clamp-2">{item.desc}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                                                        <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded border border-white/5 bg-white/5 ${TAG_COLORS[item.tag] || "text-zinc-500"}`}>{item.tag}</span>
                                                        <ArrowRight size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-xs font-semibold text-zinc-500">No results for &ldquo;{query}&rdquo;</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center space-x-6">
                            {/* Removed Get Pro link */}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="md:hidden p-2 text-foreground shrink-0" 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Mobile Menu Overlay */}
                    <div className={`md:hidden absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl transition-all duration-300 ease-in-out z-[100] ${mobileMenuOpen ? 'max-h-[90vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                        <div className="p-6 space-y-8">
                            <div className="space-y-6">
                                <p className="text-xs font-semibold text-secondary/50 px-2">Discover</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { name: "Top Tools", href: "/tools" },
                                        { name: "AI Image Prompts", href: "/prompts" },
                                        { name: "QR Generator", href: "/tools/qr" },
                                    ].map((item) => (
                                        <Link key={item.href} href={item.href}
                                            className="flex items-center justify-between text-[13px] font-bold tracking-tight px-4 py-3 rounded-xl transition-all text-white/70 hover:text-white hover:bg-zinc-800/50"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <span>{item.name}</span>
                                            <ArrowRight size={14} className="opacity-40" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
