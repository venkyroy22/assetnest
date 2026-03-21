"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider, useSidebar } from "@/components/SidebarProvider";
import { PinProvider } from "@/components/PinProvider";
import { MusicProvider } from "@/components/MusicProvider";

function AppLayoutContent({ children, isBillingView }: { children: React.ReactNode; isBillingView: boolean }) {
    const { isOpen } = useSidebar();
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [showScrollTop, setShowScrollTop] = useState(false);

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

    useEffect(() => {
        // Enforce scroll-to-top on navigation to prevent the layout from preserving
        // scroll state and accidentally hiding top portions of pages under the fixed Navbar.
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    return (
        <div className="flex flex-1 flex-col min-h-screen">
            {!isBillingView && <Navbar />}
            <div className="flex flex-1 relative">
                {!isBillingView && <Sidebar />}
                <main 
                    className={`flex-grow flex flex-col pt-20 transition-[padding] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                        ${isBillingView ? "pl-0" : 
                          isHome ? "pl-0" : 
                          isOpen ? "lg:pl-64" : "lg:pl-16"}`}
                >
                    <div className="flex-grow">
                        {isBillingView && <Navbar className="no-print" />}
                        {children}
                    </div>
                    {!isBillingView ? <Footer /> : <Footer className="no-print" />}
                </main>
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
            <SidebarProvider>
                <PinProvider>
                    <AppLayoutContent isBillingView={isBillingView}>
                        {children}
                    </AppLayoutContent>
                </PinProvider>
            </SidebarProvider>
        </MusicProvider>
    );
}
