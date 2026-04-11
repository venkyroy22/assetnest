"use client";

import { useLayoutEffect } from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.1 } }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed inset-0 z-[1000] overflow-y-auto overscroll-behavior-contain bg-black/60 backdrop-blur-3xl py-10 md:py-20 px-4 md:px-0"
                    onWheel={(e) => e.stopPropagation()}
                    onClick={onClose}
                >
                    {/* Modal Wrapper */}
                    <div className="flex flex-col items-center justify-start min-h-full pointer-events-none">
                        <div className="flex-1 min-h-[2rem]" />
                        
                        {/* Modal Container */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ 
                                opacity: 0, 
                                scale: 0.94, 
                                y: 15,
                                transition: { duration: 0.2, ease: "easeIn" }
                            }}
                            transition={{ 
                                type: "spring",
                                damping: 25,
                                stiffness: 400,
                                mass: 0.8
                            }}
                            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            {/* Background watermark icon */}
                            <motion.div 
                                initial={{ opacity: 0, rotate: -5 }}
                                animate={{ opacity: 0.15, rotate: 12 }}
                                exit={{ opacity: 0, rotate: 0, scale: 0.8 }}
                                transition={{ delay: 0, duration: 0.3 }}
                                className="absolute -top-12 -right-12 text-zinc-800 pointer-events-none"
                            >
                                <Info size={280} strokeWidth={1} />
                            </motion.div>

                            {/* Simple Close Button */}
                            <button 
                                onClick={onClose} 
                                className="absolute top-6 right-6 md:top-8 md:right-8 p-3 text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-all z-50 border border-zinc-800/50 hover:scale-110 active:scale-95"
                                title="Close"
                            >
                                <X size={20} />
                            </button>

                            {/* Standardized Header */}
                            <div className="relative z-10 w-full">
                                <motion.div 
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-8 shadow-inner"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Documentation</span>
                                </motion.div>

                                <motion.h1 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-14 text-white leading-tight"
                                >
                                    {title}
                                </motion.h1>

                                {/* Content Area */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 25 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-left w-full relative"
                                >
                                    {children}
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="flex-1 min-h-[4rem]" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
