"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";
import Tooltip from "./Tooltip";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted or dismissed the cookie notice
        const hasAccepted = localStorage.getItem("cookieConsent");
        if (!hasAccepted) {
            // Show banner after a slight delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookieConsent", "true");
        setIsVisible(false);
    };

    const dismissCookies = () => {
        // We still set an item so we don't bother them again, even if they didn't explicitly accept
        localStorage.setItem("cookieConsent", "dismissed");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 pointer-events-none flex justify-center">
            <div className="backdrop-blur-md shadow-2xl p-5 rounded-2xl max-w-2xl w-full pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 translate-y-0 opacity-100 transition-all duration-500"
                style={{ background: "rgba(28,28,28,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hidden sm:flex" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Cookie style={{ color: "#f0ede8" }} size={20} />
                </div>
                <div className="flex-1 text-sm" style={{ color: "#a0a0a0" }}>
                    <p className="font-medium mb-1 flex items-center gap-2" style={{ color: "#f0ede8" }}>
                        <Cookie className="sm:hidden" style={{ color: "#f0ede8" }} size={16} />
                        We value your privacy
                    </p>
                    <p className="text-xs leading-relaxed">
                        We use minimal local storage and cookies to ensure you get the best experience on our website, such as remembering your pinned tools.
                    </p>
                    <div className="mt-2 flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-[#f0ede8] transition-colors" style={{ color: "#555" }}>Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-[#f0ede8] transition-colors" style={{ color: "#555" }}>Terms of Service</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                    <Tooltip content="Dismiss" position="top">
                        <button
                            onClick={dismissCookies}
                            className="p-2 text-zinc-500 hover:text-white transition-colors absolute sm:relative top-2 right-2 sm:top-0 sm:right-0"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </Tooltip>
                    <button
                        onClick={acceptCookies}
                        className="text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 w-full sm:w-auto"
                        style={{ background: "#f0ede8", color: "#141414" }}
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
