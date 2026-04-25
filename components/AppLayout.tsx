"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        const lenis = (window as any).lenis;
        if (lenis) {
            lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const link = (e.target as HTMLElement).closest("a");
            if (!link) return;

            const href = link.getAttribute("href");
            if (!href || href.startsWith("#")) return;

            const cleanHref = href.replace(/\/$/, "") || "/";
            const cleanPath = window.location.pathname.replace(/\/$/, "") || "/";

            if (cleanHref === cleanPath) {
                e.preventDefault();
                setToastMessage("You're already on this page.");

                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
            }
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">

            {/* Header */}
            {!isBillingView && (
                <header className="sticky top-0 z-50">
                    <Navbar />
                </header>
            )}

            {/* Body */}
            <div className="flex flex-1">

                {!isBillingView && <Sidebar />}

                <main
                    className={`flex flex-col flex-1 w-full pt-16 md:pt-20 transition-[padding-left] duration-500
                    ${isNavigating ? "!transition-none" : ""}
                    ${(isBillingView || isHome)
                        ? "pl-0"
                        : (isOpen ? "lg:pl-[256px]" : "lg:pl-[64px]")}`}
                >
                    <div className="flex-1">
                        {children}
                    </div>

                    <Footer />
                </main>
            </div>

            {/* Toast */}
            <div className={`fixed top-24 right-6 z-50 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm transition-all
                ${toastMessage ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                {toastMessage}
            </div>

            {/* Scroll Top */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-10 right-8 w-12 h-12 z-[9999] flex items-center justify-center rounded-full bg-black/80 backdrop-blur-md border border-white/20 transition-all hover:bg-white hover:text-black
                ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
                aria-label="Back to Top"
            >
                <ArrowUp size={20} />
            </button>
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/signin" || pathname === "/signup";
    const isBillingView = pathname === "/tools/billing/view";

    if (isAuthPage) return <>{children}</>;

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