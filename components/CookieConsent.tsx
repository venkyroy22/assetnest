"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

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
            <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl p-5 rounded-2xl max-w-2xl w-full pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 translate-y-0 opacity-100 transition-all duration-500">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 hidden sm:flex">
                    <Cookie className="text-emerald-400" size={20} />
                </div>
                <div className="flex-1 text-sm text-zinc-300">
                    <p className="font-medium text-white mb-1 flex items-center gap-2">
                        <Cookie className="text-emerald-400 sm:hidden" size={16} />
                        We value your privacy
                    </p>
                    <p className="text-xs leading-relaxed">
                        We use minimal local storage and cookies to ensure you get the best experience on our website, such as remembering your pinned tools.
                    </p>
                    <div className="mt-2 flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <Link href="/privacy" className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-zinc-500 hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={dismissCookies}
                        className="p-2 text-zinc-500 hover:text-white transition-colors absolute sm:relative top-2 right-2 sm:top-0 sm:right-0"
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>
                    <button
                        onClick={acceptCookies}
                        className="bg-white hover:bg-zinc-200 text-black text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 w-full sm:w-auto"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
