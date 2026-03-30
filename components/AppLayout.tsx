"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider, useSidebar } from "@/components/SidebarProvider";
import { PinProvider } from "@/components/PinProvider";
import { MusicProvider } from "@/components/MusicProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import SettingsModal from "@/components/SettingsModal";

function AppLayoutContent({ children, isBillingView }: { children: React.ReactNode; isBillingView: boolean }) {
    const { isOpen, isNavigating } = useSidebar();
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        if (typeof window !== 'undefined') {
            const lenis = (window as any).lenis;
            if (lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    useLayoutEffect(() => {
        // Next.js Layout hydration bug brute-force fallback:
        // Layout components sometimes freeze their render cycles or mis-compute 
        // derived state from usePathname() during soft navigations.
        // We bypass React state completely and enforce the true layout here.
        if (typeof window === 'undefined') return;
        
        const mainEl = document.getElementById('main-layout-content');
        if (!mainEl) return;

        const path = window.location.pathname;
        const currentIsHome = path === "/";
        const isDesktop = window.innerWidth >= 1024;

        if (isBillingView || currentIsHome || !isDesktop) {
            mainEl.style.paddingLeft = '0px';
        } else {
            mainEl.style.paddingLeft = isOpen ? '256px' : '64px';
        }
    });

    useEffect(() => {
        // Enforce scroll-to-top on navigation to prevent the layout from preserving
        // scroll state and accidentally hiding top portions of pages under the fixed Navbar.
        if (typeof window !== 'undefined') {
            const lenis = (window as any).lenis;
            if (lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(0, { immediate: true });
            } else {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        }
    }, [pathname]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const link = (e.target as HTMLElement).closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // Fix: ignore empty hrefs or hash links (like #section)
            if (!href || href.startsWith('#')) return;

            // Strip trailing slashes to prevent false negatives (e.g. /tools/ vs /tools)
            const cleanHref = href.replace(/\/$/, '') || '/';
            const cleanPathname = window.location.pathname.replace(/\/$/, '') || '/';

            if (cleanHref === cleanPathname) {
                e.preventDefault();
                setToastMessage("You're already on this page.");
                
                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = setTimeout(() => {
                    setToastMessage(null);
                }, 3000);
            }
        };

        // Use capture mode to intercept the click before it potentially bubbles away
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, []);

    return (
        <div className="flex flex-1 flex-col min-h-screen">
            {!isBillingView && <Navbar />}
            <div className="flex flex-1 relative">
                {!isBillingView && <Sidebar />}
                <main 
                    id="main-layout-content"
                    className={`flex-grow flex flex-col pt-20 transition-[padding-left] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                        ${isNavigating ? "!transition-none" : ""}`}
                    style={{
                        paddingLeft: typeof window !== 'undefined' && window.innerWidth < 1024 
                            ? '0px' 
                            : (isBillingView || isHome ? '0px' : (isOpen ? '256px' : '64px'))
                    }}
                >
                    <div className="flex-grow">
                        {isBillingView && <Navbar className="no-print" />}
                        {children}
                    </div>
                    {!isBillingView ? <Footer /> : <Footer className="no-print" />}
                </main>
            </div>

            {/* ── Global Already On Page Toast ── */}
            <div 
                className={`fixed top-24 right-6 md:right-10 z-[2147483647] flex items-center gap-3 px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[14px] font-medium tracking-wide text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-400 pointer-events-none transform
                ${toastMessage ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-6 opacity-0 scale-95'}`}
            >
                <div className="w-2 h-2 rounded-full bg-zinc-500/50 animate-pulse" />
                {toastMessage}
            </div>

            {/* ── Global Back to Top ── */}
            <button
                onClick={(e) => { e.preventDefault(); scrollToTop(); }}
                className={`fixed bottom-10 right-8 md:bottom-14 md:right-14 z-[2147483647] w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/90 backdrop-blur-3xl border border-white/20 text-white shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-500 active:scale-90 group hover:border-emerald-500 hover:bg-zinc-950 pointer-events-auto cursor-pointer
                    ${showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-75 pointer-events-none'}`}
                aria-label="Back to Top"
            >
                <div className="absolute inset-0 rounded-full bg-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ArrowUp size={24} className="relative z-10 group-hover:-translate-y-2 transition-transform duration-500" />
            </button>
        </div>
    );
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/signin" || pathname === "/signup";
    const isBillingView = pathname === "/tools/billing/view";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <MusicProvider>
            <SettingsProvider>
                <SidebarProvider>
                    <PinProvider>
                        <AppLayoutContent isBillingView={isBillingView}>
                            {children}
                        </AppLayoutContent>
                        <SettingsModal />
                    </PinProvider>
                </SidebarProvider>
            </SettingsProvider>
        </MusicProvider>
    );
}
