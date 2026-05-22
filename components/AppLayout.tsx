"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider, useSidebar } from "@/components/SidebarProvider";
import { PinProvider } from "@/components/PinProvider";
import { MusicProvider } from "@/components/MusicProvider";
import { SettingsProvider, useSettings } from "@/components/SettingsProvider";
import SettingsModal from "@/components/SettingsModal";

function AppLayoutContent({ children, isBillingView }: { children: React.ReactNode; isBillingView: boolean }) {
    const { isOpen, isNavigating, isAppFullscreen } = useSidebar();
    const { settings } = useSettings();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isEmbed = searchParams.get("embed") === "true";
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

    const hideUI = isBillingView || isAppFullscreen || isEmbed;

    return (
        <div className="flex flex-col min-h-screen" style={{ background: "#141414", color: "#f0ede8" }}>

            {/* Header Placeholder (takes space in flow) */}
            {!hideUI && (
                <div className={isHome ? "" : "h-16 md:h-20 shrink-0"}>
                    <header className={`${(settings.fixedNavbar && !isHome) ? "fixed" : "absolute"} top-0 left-0 w-full z-[5000] bg-transparent`}>
                        <Navbar />
                    </header>
                </div>
            )}

            {/* Body */}
            <div className="flex flex-1">

                {!hideUI && (
                    <div className="z-[1000]">
                        <Sidebar />
                    </div>
                )}

                <main
                    className={`flex flex-col flex-1 w-full transition-[padding-left] duration-500 
                    ${isNavigating ? "!transition-none" : ""} 
                    ${(hideUI || isHome)
                            ? "pl-0"
                            : (isOpen ? "lg:pl-[256px]" : "lg:pl-[64px]")}`}
                >
                    <div className="flex-1">
                        {children}
                    </div>

                    {isHome && <Footer />}
                </main>
            </div>

            <div className={`fixed top-24 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${toastMessage ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
                style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}>
                {toastMessage}
            </div>

            {/* Scroll Top */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-10 right-8 w-12 h-12 z-[9999] flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 border bg-[rgba(28,28,28,0.9)] hover:bg-[#f0ede8] text-[#f0ede8] hover:text-[#141414] border-[rgba(255,255,255,0.10)] hover:border-[#f0ede8] hover:scale-105 active:scale-95
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
                        <Suspense fallback={null}>
                            <AppLayoutContent isBillingView={isBillingView}>
                                {children}
                            </AppLayoutContent>
                        </Suspense>
                        <SettingsModal />
                    </PinProvider>
                </SidebarProvider>
            </SettingsProvider>
        </MusicProvider>
    );
}