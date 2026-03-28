"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "./SettingsProvider";

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    toggle: () => void;
    isNavigating: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = useState(settings.defaultSidebarOpen);
    
    // Sync with settings on mount/change
    useEffect(() => {
        if (pathname !== "/") {
            setIsOpen(settings.defaultSidebarOpen);
        }
    }, [settings.defaultSidebarOpen, pathname]);

    // Track layout changes to disable CSS transitions precisely during navigation
    const [prevPath, setPrevPath] = useState(pathname);
    const isNavigating = pathname !== prevPath;

    useEffect(() => {
        if (pathname !== prevPath) {
            const timer = setTimeout(() => {
                setPrevPath(pathname);
            }, 50); // Small delay to let the browser paint the "no-transition" layout
            return () => clearTimeout(timer);
        }
    }, [pathname, prevPath]);

    useEffect(() => {
        if (pathname === "/") {
            setIsOpen(false);
        }
    }, [pathname]);

    const toggle = () => setIsOpen((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle, isNavigating }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};
