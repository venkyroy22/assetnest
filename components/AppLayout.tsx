"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/SidebarProvider";
import { PinProvider } from "@/components/PinProvider";
import { MusicProvider } from "@/components/MusicProvider";

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
                    {!isBillingView && <Navbar />}
                    <div className="flex flex-1">
                        {!isBillingView && <Sidebar />}
                        <main className="flex-grow flex flex-col">
                            <div className="flex-grow">
                                {isBillingView && <Navbar className="no-print" />}
                                {children}
                            </div>
                            {!isBillingView ? <Footer /> : <Footer className="no-print" />}
                        </main>
                    </div>
                </PinProvider>
            </SidebarProvider>
        </MusicProvider>
    );
}
