"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, Download, Linkedin, Link2, Star, Sparkles } from "lucide-react";
import JSConfetti from "js-confetti";

const COLORS = [
    "#10b981", // Emerald Green
    "#34d399", // Mint Green
    "#60a5fa", // Electric Blue
    "#f59e0b", // Warm Yellow
    "#f43f5e", // Rose Pink
    "#8b5cf6", // Violet Purple
    "#06b6d4", // Cyan
    "#ff7849"  // Coral
];

export default function CelebrationPortal() {
    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [filename, setFilename] = useState("");
    const [filesize, setFilesize] = useState("");
    const [rating, setRating] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    // References
    const jsConfettiRef = useRef<JSConfetti | null>(null);
    const ratingSuccessTimerRef = useRef<NodeJS.Timeout | null>(null);
    const celebrationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

    const clearCelebrationSchedules = () => {
        celebrationTimeoutsRef.current.forEach(clearTimeout);
        celebrationTimeoutsRef.current = [];
    };

    // Initialize JSConfetti
    useEffect(() => {
        jsConfettiRef.current = new JSConfetti();
        return () => {
            clearCelebrationSchedules();
        };
    }, []);

    // Handle Star Clicks (Interactive Popper Easter Egg)
    const handleStarClick = (index: number, e: React.MouseEvent) => {
        setRating(index + 1);
        
        // Blast star and sparkles confetti from the rating card
        jsConfettiRef.current?.addConfetti({
            emojis: ["⭐", "✨", "💫", "💚"],
            emojiSize: 28,
            confettiNumber: 25
        });
    };

    // Copy Link Action
    const copyLink = () => {
        navigator.clipboard.writeText("https://assetnest.gloyas.com");
        setCopied(true);
        if (ratingSuccessTimerRef.current) clearTimeout(ratingSuccessTimerRef.current);
        ratingSuccessTimerRef.current = setTimeout(() => setCopied(false), 2000);
    };

    // Main event handler listener
    useEffect(() => {
        const handleDownloadCelebration = (e: Event) => {
            const customEvent = e as CustomEvent;
            const file = customEvent.detail?.filename || "Optimized File";
            const size = customEvent.detail?.size || "Completed";

            setFilename(file);
            setFilesize(size);
            setRating(null);
            setIsOpen(true);
            setCopied(false);

            // Reset any active timelines
            clearCelebrationSchedules();

            const schedulePop = (delayMs: number, config: Parameters<JSConfetti["addConfetti"]>[0]) => {
                const timer = setTimeout(() => {
                    jsConfettiRef.current?.addConfetti(config);
                }, delayMs);
                celebrationTimeoutsRef.current.push(timer);
            };

            // ---- 20-SECOND CELEBRATION TIMELINE (DIVERSE STAGGERED POPS) ----

            // 0.0s: Main Opening Splash (All colors)
            schedulePop(0, {
                confettiColors: COLORS,
                confettiRadius: 6,
                confettiNumber: 120
            });

            // 1.5s: Emerald Brand Burst (Green themed)
            schedulePop(1500, {
                confettiColors: ["#10b981", "#34d399", "#a7f3d0", "#ffffff"],
                confettiRadius: 5,
                confettiNumber: 80
            });

            // 3.5s: Party Celebrations Emojis Pop!
            schedulePop(3500, {
                emojis: ["🎉", "✨", "🎈", "🥳", "💫"],
                emojiSize: 30,
                confettiNumber: 30
            });

            // 5.5s: Electric Cyan & Amber Sparkles
            schedulePop(5500, {
                confettiColors: ["#06b6d4", "#f59e0b", "#ffffff"],
                confettiRadius: 6,
                confettiNumber: 90
            });

            // 7.5s: Emerald Starfield Pop (Brand focus)
            schedulePop(7500, {
                emojis: ["⭐", "✨", "💚", "🌟"],
                emojiSize: 26,
                confettiNumber: 35
            });

            // 9.5s: Dense Coral & Violet Cascade
            schedulePop(9500, {
                confettiColors: ["#ff7849", "#8b5cf6", "#f43f5e"],
                confettiRadius: 5,
                confettiNumber: 100
            });

            // 12.0s: Rainbow Magic Pop
            schedulePop(12000, {
                confettiColors: COLORS,
                confettiRadius: 6,
                confettiNumber: 80
            });

            // 14.5s: Sparkler Emoji Cascade
            schedulePop(14500, {
                emojis: ["✨", "💫", "🌟", "💛"],
                emojiSize: 24,
                confettiNumber: 40
            });

            // 17.0s: Massive Pre-Finale Burst
            schedulePop(17000, {
                confettiColors: ["#10b981", "#06b6d4", "#34d399", "#ffffff"],
                confettiRadius: 6,
                confettiNumber: 120
            });

            // 19.5s: GRAND FINALE (Huge explosion of flakes and emojis combined!)
            schedulePop(19500, {
                confettiColors: COLORS,
                confettiRadius: 7,
                confettiNumber: 150
            });
            schedulePop(19800, {
                emojis: ["🎉", "💚", "✨", "🥳", "⭐", "🌟"],
                emojiSize: 32,
                confettiNumber: 45
            });
        };

        window.addEventListener("assetnest-download", handleDownloadCelebration);

        return () => {
            window.removeEventListener("assetnest-download", handleDownloadCelebration);
            clearCelebrationSchedules();
            if (ratingSuccessTimerRef.current) clearTimeout(ratingSuccessTimerRef.current);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <>

            {/* THANK YOU CARD (SLIDE-UP SCREEN BOTTOM MODAL) */}
            <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-[420px] z-[210] select-none animate-slide-up-modal">
                <style>{`
                    @keyframes slideUpModal {
                        from { transform: translateY(150px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up-modal {
                        animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>

                {/* Card Container (Obsidian Glassmorphism) */}
                <div className="relative bg-zinc-900/90 border border-white/[0.08] rounded-[24px] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
                    
                    {/* Ambient Glow Backing */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Header Row */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Asset Nest Portal</h4>
                                <h3 className="text-sm font-extrabold text-[#f0eff5] tracking-tight flex items-center gap-1">
                                    Download Complete <Sparkles size={12} className="text-emerald-400" />
                                </h3>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 bg-zinc-800/40 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Details Container */}
                    <div className="bg-zinc-950/40 border border-white/[0.04] p-3 rounded-xl mb-4 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2 min-w-0">
                            <Download size={13} className="text-zinc-500 shrink-0" />
                            <span className="text-[11.5px] font-bold text-zinc-300 truncate max-w-[200px]" title={filename}>{filename}</span>
                        </div>
                        <span className="text-[9.5px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">{filesize}</span>
                    </div>

                    {/* Delightful micro-rating Stars widget */}
                    <div className="border-t border-white/[0.04] pt-4 mb-4 text-center">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">Rate your experience</p>
                        <div className="flex gap-2 justify-center">
                            {[0, 1, 2, 3, 4].map((index) => {
                                const starValue = index + 1;
                                const isGlow = rating !== null && starValue <= rating;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={(e) => handleStarClick(index, e)}
                                        className="transition-all active:scale-90 hover:scale-110"
                                    >
                                        <Star 
                                            size={20} 
                                            className={`transition-all duration-300 ${
                                                isGlow 
                                                    ? "fill-emerald-400 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" 
                                                    : "text-zinc-600 hover:text-zinc-400"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        {rating !== null && (
                            <p className="text-[10.5px] text-emerald-400 font-bold tracking-tight mt-2 animate-bounce">
                                Thank you for your feedback! 💚
                            </p>
                        )}
                    </div>

                    {/* Social Share & growth Actions */}
                    <div className="border-t border-white/[0.04] pt-4 flex items-center justify-between gap-3 text-left">
                        <div className="min-w-0">
                            <p className="text-[10.5px] font-bold text-zinc-300 leading-tight">Help us grow</p>
                            <p className="text-[8.5px] text-zinc-500 font-semibold tracking-tight">Share this tool with your peers</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            {/* Copy Link button */}
                            <button
                                onClick={copyLink}
                                className={`p-2 border rounded-lg transition-all ${
                                    copied 
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
                                        : "bg-zinc-800/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                                }`}
                                title="Copy Share Link"
                            >
                                <Link2 size={13} />
                            </button>
                            {/* Share on X */}
                            <a
                                href={`https://twitter.com/intent/tweet?text=I%20just%20used%20AssetNest%20to%20optimize%20my%20creative%2520assets%20locally%20and%20securely%20in%20my%20browser!%20Check%20it%20out%20at%20https%3A%2F%2Fassetnest.gloyas.com`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-zinc-800/40 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                                title="Share on X"
                            >
                                <svg 
                                    viewBox="0 0 24 24" 
                                    width="13" 
                                    height="13" 
                                    fill="currentColor" 
                                    className="w-[13px] h-[13px] shrink-0"
                                >
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            {/* LinkedIn Share */}
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fassetnest.gloyas.com`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-zinc-800/40 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition-all"
                                title="Share on LinkedIn"
                            >
                                <Linkedin size={13} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
