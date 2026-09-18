"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose, title, children }: HelpModalProps) {
    useEffect(() => {
        if (isOpen) {
            const lenis = (window as any).lenis;
            lenis?.stop();

            const originalBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            
            return () => {
                lenis?.start();
                document.body.style.overflow = originalBodyOverflow || "unset";
            };
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-sm py-8 sm:py-16 px-4 flex items-center justify-center"
                    onWheel={(e) => e.stopPropagation()}
                    onClick={onClose}
                    data-lenis-prevent
                    data-lenis-prevent-touch
                >
                    <style>{`
                        .help-modal-content {
                            color: #999999;
                            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
                        }
                        .help-modal-content h2,
                        .help-modal-content h3,
                        .help-modal-content h4 {
                            color: #cccccc !important;
                            font-weight: 500 !important;
                            letter-spacing: normal !important;
                        }
                        .help-modal-content p {
                            color: #999999 !important;
                            line-height: 1.6 !important;
                        }
                        .help-modal-content strong,
                        .help-modal-content b {
                            color: #dddddd !important;
                            font-weight: 500 !important;
                        }
                        .help-modal-content ul,
                        .help-modal-content li {
                            color: #999999 !important;
                            line-height: 1.6 !important;
                        }
                        .help-modal-content section {
                            background: #323232 !important;
                            border: 1px solid #484848 !important;
                            border-radius: 4px !important;
                            padding: 14px 16px !important;
                        }
                    `}</style>

                    {/* Modal Container */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.97, 
                            y: 8,
                            transition: { duration: 0.15, ease: "easeIn" }
                        }}
                        transition={{ 
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        className="relative w-full max-w-2xl bg-[#3a3a3a] border border-[#555555] rounded-md p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-auto text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header bar */}
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#555555] bg-[#323232] rounded text-[10px] font-normal tracking-wide text-[#4db8d4]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4db8d4] animate-pulse" />
                                <span>DOCUMENTATION</span>
                            </div>

                            {/* Close Button */}
                            <button 
                                onClick={onClose} 
                                className="w-7 h-7 bg-[#323232] border border-[#555555] rounded flex items-center justify-center text-[#888888] hover:text-[#cccccc] hover:bg-[#444444] transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X size={14} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Title */}
                        <h2 
                            className="text-lg sm:text-xl font-medium tracking-normal text-[#cccccc] mb-4"
                            style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                        >
                            {title}
                        </h2>

                        {/* Divider */}
                        <div className="h-px bg-[#484848] w-full mb-6" />

                        {/* Content Area */}
                        <div className="help-modal-content w-full relative max-h-[65vh] overflow-y-auto pr-1">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
