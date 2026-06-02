"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface GiftBoxVisualProps {
    theme: "gold" | "cyber" | "pastel" | "holo";
    isOpen: boolean;
    onOpen: () => void;
}

export default function GiftBoxVisual({
    theme = "gold",
    isOpen,
    onOpen
}: GiftBoxVisualProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isRattling, setIsRattling] = useState(false);

    // Trigger a rattle sound effect (visual shake) on click before open
    const handleBoxClick = () => {
        if (isOpen) return;
        setIsRattling(true);
        setTimeout(() => setIsRattling(false), 500);
        onOpen();
    };

    // Helper to get theme styles
    const getThemeStyles = () => {
        switch (theme) {
            case "cyber":
                return {
                    boxBg: "bg-zinc-900 border border-fuchsia-500/30 shadow-[0_0_35px_rgba(240,70,250,0.15)]",
                    ribbonBg: "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400",
                    glowColor: "rgba(240,70,250,0.3)",
                    lidBorder: "border-b border-fuchsia-500/20"
                };
            case "pastel":
                return {
                    boxBg: "bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_15px_35px_rgba(255,255,255,0.05)]",
                    ribbonBg: "bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400",
                    glowColor: "rgba(244,143,177,0.2)",
                    lidBorder: "border-b border-white/10"
                };
            case "holo":
                return {
                    boxBg: "bg-gradient-to-tr from-cyan-950/40 via-zinc-900/90 to-pink-950/40 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]",
                    ribbonBg: "bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-300",
                    glowColor: "rgba(34,211,238,0.25)",
                    lidBorder: "border-b border-white/5"
                };
            case "gold":
            default:
                return {
                    boxBg: "bg-zinc-950 border border-amber-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)]",
                    ribbonBg: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600",
                    glowColor: "rgba(245,158,11,0.25)",
                    lidBorder: "border-b border-amber-500/10"
                };
        }
    };

    const s = getThemeStyles();

    return (
        <div 
            className="relative flex items-center justify-center w-[300px] h-[300px] cursor-pointer perspective-[1000px] select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleBoxClick}
        >
            <style>{`
                @keyframes rattle {
                    0% { transform: rotate(0deg) scale(1); }
                    15% { transform: rotate(4deg) scale(1.02); }
                    30% { transform: rotate(-4deg) scale(1.02); }
                    45% { transform: rotate(3deg) scale(1.01); }
                    60% { transform: rotate(-3deg) scale(1.01); }
                    75% { transform: rotate(1.5deg) scale(1.005); }
                    90% { transform: rotate(-1.5deg) scale(1.005); }
                    100% { transform: rotate(0deg) scale(1); }
                }
                .rattle-anim {
                    animation: rattle 0.45s ease-in-out;
                }
            `}</style>

            {/* Glowing Ambient Halo behind the box */}
            <div 
                className={`absolute w-48 h-48 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none ${
                    isOpen ? "scale-150 opacity-0" : (isHovered ? "scale-110 opacity-60" : "scale-100")
                }`}
                style={{ backgroundColor: s.glowColor }}
            />

            {/* THE GIFT BOX WRAPPER */}
            <div 
                className={`relative w-48 h-48 transition-all duration-700 ${
                    isOpen ? "scale-90 opacity-0 pointer-events-none translate-y-12" : ""
                } ${isRattling ? "rattle-anim" : (isHovered ? "scale-105" : "scale-100")}`}
                style={{
                    transformStyle: "preserve-3d",
                    transform: isHovered && !isRattling ? "rotateY(10deg) rotateX(5deg)" : "rotateY(0deg) rotateX(0deg)"
                }}
            >
                {/* 1. LID (Lifts up on Open) */}
                <div 
                    className={`absolute -top-4 -left-2 w-[208px] h-12 rounded-t-xl z-30 transition-all duration-700 ease-out origin-bottom-left ${
                        isOpen ? "-translate-y-24 rotate-[-25deg] opacity-0" : ""
                    } ${s.boxBg} ${s.lidBorder}`}
                    style={{
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                    }}
                >
                    {/* Horizontal Ribbon on Lid */}
                    <div className={`absolute top-0 bottom-0 left-[90px] w-7 z-30 ${s.ribbonBg}`} />
                    
                    {/* Floating Bow Knots */}
                    <div className="absolute -top-6 left-[84px] w-[38px] h-6 flex items-center justify-center z-40">
                        {/* Bow Loop Left */}
                        <div className={`w-6 h-6 rounded-full border border-white/10 rotate-[-30deg] origin-right mr-[-4px] ${s.ribbonBg} shadow-md`} />
                        {/* Bow Loop Right */}
                        <div className={`w-6 h-6 rounded-full border border-white/10 rotate-[30deg] origin-left ml-[-4px] ${s.ribbonBg} shadow-md`} />
                        {/* Center Knot */}
                        <div className="absolute w-4 h-4 rounded-md bg-white border border-white/20 z-50 shadow-inner flex items-center justify-center">
                            <Sparkles size={8} className="text-amber-500 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* 2. BODY CONTAINER */}
                <div className={`absolute inset-0 rounded-b-xl z-10 overflow-hidden ${s.boxBg}`}>
                    {/* Vertical Ribbon */}
                    <div className={`absolute top-0 bottom-0 left-[88px] w-6 z-20 ${s.ribbonBg}`} />
                    {/* Horizontal Ribbon */}
                    <div className={`absolute left-0 right-0 top-[88px] h-6 z-20 ${s.ribbonBg}`} />
                    
                    {/* Geometric panel decorations (Diagonal shading lines for premium depth) */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.015)_50%,transparent_55%)] [background-size:24px_24px] pointer-events-none" />
                </div>

                {/* 3. PULL RIBBON TAB CUE */}
                <div 
                    className={`absolute -bottom-10 left-12 right-12 text-center text-[10.5px] font-extrabold uppercase tracking-widest text-zinc-400 flex items-center justify-center gap-1.5 transition-all duration-500 ${
                        isHovered ? "text-white translate-y-1" : "translate-y-0 opacity-70"
                    }`}
                >
                    <Sparkles size={11} className="text-emerald-400 animate-spin" style={{ animationDuration: "3s" }} />
                    Unwrap Gift Box
                </div>
            </div>
        </div>
    );
}
