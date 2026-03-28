"use client";

import { useLayoutEffect } from "react";
import { X, Info } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose, title, children }: HelpModalProps) {
    useLayoutEffect(() => {
        if (isOpen) {
            // 1. Pause Lenis smooth scroll if it exists
            const lenis = (window as any).lenis;
            lenis?.stop();

            // 2. Lock native scrolling
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            
            // 3. Prevent touch-move for mobile
            const preventDefault = (e: TouchEvent) => e.preventDefault();
            document.addEventListener('touchmove', preventDefault, { passive: false });
            
            return () => {
                lenis?.start();
                document.body.style.overflow = originalBodyOverflow || "unset";
                document.documentElement.style.overflow = originalHtmlOverflow || "unset";
                document.removeEventListener('touchmove', preventDefault);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[1000] overflow-y-auto overscroll-behavior-contain bg-black/80 backdrop-blur-xl transition-all duration-500 py-20 px-4 md:px-0"
            onWheel={(e) => e.stopPropagation()}
            onClick={onClose}
        >
            {/* Modal Wrapper */}
            <div className="flex flex-col items-center justify-start min-h-full pointer-events-none">
                <div className="flex-1 min-h-[2rem]" />
                
                {/* Modal Container */}
                <div 
                    className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    
                    {/* Background watermark icon (like About page) */}
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <Info size={250} strokeWidth={1} />
                    </div>

                    {/* Simple Close Button */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 md:top-8 md:right-8 p-2.5 md:p-3 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all z-50 border border-zinc-800"
                        title="Close"
                    >
                        <X size={20} />
                    </button>

                    {/* Standardized Header */}
                    <div className="relative z-10 w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Documentation</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">{title}</h1>

                        {/* Content Area */}
                        <div className="text-left w-full relative">
                            {children}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[4rem]" />
            </div>
        </div>
    );
}



