"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/SidebarProvider";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/signin" || pathname === "/signup";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-grow flex flex-col">
                    <div className="flex-grow">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>
        </SidebarProvider>
    );
}
