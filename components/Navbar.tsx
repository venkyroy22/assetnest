"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useSidebar } from "./SidebarProvider";

const Navbar = () => {
    const { isOpen, toggle } = useSidebar();
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) {
        return (
            <nav className="sticky top-0 z-50 w-full bg-background h-20">
                <div className="px-10 h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="text-xl md:text-2xl font-black tracking-tighter shrink-0">ASSETNEST</div>
                        <div className="w-10 h-10" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav
            className={`sticky top-0 z-50 w-full transition-all duration-300 h-20 ${scrolled
                ? "bg-background/95 backdrop-blur-md"
                : "bg-background"
                }`}
        >
            <div className="flex h-full items-center">
                {/* Fixed Width Toggle Section to match Sidebar Icon Alignment */}
                <div className={`hidden lg:flex items-center h-full transition-all duration-300 ease-in-out ${isOpen ? "w-64 justify-start pl-[42px]" : "w-16 justify-center"}`}>
                    <button
                        onClick={toggle}
                        className="flex items-center justify-center p-2 rounded-sm border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                        title={isOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="flex-grow h-full px-10">
                    <div className="flex justify-between items-center h-full gap-8">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <Link href="/" className="group active:scale-95 transition-all">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <Logo size={40} className="relative z-10" />
                                </div>
                            </Link>
                        </div>

                        {/* Nav Search Bar */}
                        <div className="hidden lg:flex items-center flex-grow max-w-lg">
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2.5 w-full transition-all duration-300 hover:border-zinc-600 focus-within:border-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                <Search size={16} className="text-zinc-500 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    className="bg-transparent text-sm w-full focus:outline-none placeholder:text-secondary/50 font-medium"
                                />
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/premium"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-foreground text-background px-6 py-2.5 hover:opacity-90 active:scale-95 transition-all"
                            >
                                GET PRO
                            </Link>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-foreground"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu Overlay */}
                    <div className={`md:hidden absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl transition-all duration-300 ease-in-out z-[100] ${mobileMenuOpen ? 'max-h-[90vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                        <div className="p-6 space-y-8">
                            {/* Mobile Search */}
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2.5 w-full">
                                <Search size={16} className="text-zinc-500 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                                />
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 px-1">Discover</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { name: "Pinterest Keywords", href: "/keywords" },
                                        { name: "QR Generator", href: "/tools/qr" },
                                        { name: "Video Edit Assets", href: "/video-editing", isDevelopment: true },
                                        { name: "Useful Websites", href: "/useful-websites", isDevelopment: true },
                                        { name: "AI Tools", href: "/ai-tools", isDevelopment: true },
                                        { name: "Wallpapers", href: "/category/wallpapers", isDevelopment: true },
                                        { name: "Sound Effects", href: "/category/sound-effects", isDevelopment: true },
                                    ].map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.isDevelopment ? "#" : item.href}
                                            className={`flex items-center justify-between text-[13px] font-bold tracking-tight px-4 py-3 rounded-xl transition-all ${item.isDevelopment
                                                ? "text-zinc-600 cursor-not-allowed opacity-50"
                                                : "text-white/70 hover:text-white hover:bg-zinc-800/50"
                                                }`}
                                            onClick={(e) => {
                                                if (item.isDevelopment) {
                                                    e.preventDefault();
                                                } else {
                                                    setMobileMenuOpen(false);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                {item.isDevelopment && (
                                                    <span className="text-[9px] font-black uppercase text-amber-500 mt-0.5 tracking-[0.1em]">Stay Updated</span>
                                                )}
                                            </div>
                                            {!item.isDevelopment && <ChevronDown size={14} className="-rotate-90 opacity-40" />}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <Link
                                    href="/premium"
                                    className="flex items-center justify-center w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Pro Access
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
