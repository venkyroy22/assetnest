"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PinContextType {
    pinnedToolIds: string[];
    togglePin: (id: string) => void;
    isPinned: (id: string) => boolean;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export function PinProvider({ children }: { children: React.ReactNode }) {
    const [pinnedToolIds, setPinnedToolIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("pinned_tools");
        if (saved) {
            try {
                setPinnedToolIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse pinned tools:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("pinned_tools", JSON.stringify(pinnedToolIds));
        }
    }, [pinnedToolIds, isLoaded]);

    const togglePin = (id: string) => {
        setPinnedToolIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const isPinned = (id: string) => pinnedToolIds.includes(id);

    return (
        <PinContext.Provider value={{ pinnedToolIds, togglePin, isPinned }}>
            {children}
        </PinContext.Provider>
    );
}

export function usePins() {
    const context = useContext(PinContext);
    if (context === undefined) {
        throw new Error("usePins must be used within a PinProvider");
    }
    return context;
}
