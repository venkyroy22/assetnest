"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
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
