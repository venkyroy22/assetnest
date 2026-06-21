"use client";

import React, { useState, useEffect, useRef } from "react";

interface GiftBoxVisualProps {
    theme: "gold" | "cyber" | "pastel" | "holo";
    isOpen: boolean;
    onOpen: () => void;
    customBoxColor?: string;
    customRibbonColor?: string;
    customLockColor?: string;
}

const THEME_MAP = {
    gold: { chest: "#FDE047", band: "#F97316", lock: "#3B82F6", particles: ["#F97316", "#FDE047", "#3B82F6", "#EF4444", "#10B981"] },
    cyber: { chest: "#F472B6", band: "#3B82F6", lock: "#10B981", particles: ["#F472B6", "#3B82F6", "#10B981", "#A855F7", "#FBBF24"] },
    pastel: { chest: "#C4B5FD", band: "#FDE047", lock: "#F472B6", particles: ["#C4B5FD", "#FDE047", "#F472B6", "#6EE7B7", "#3B82F6"] },
    holo: { chest: "#22D3EE", band: "#FBBF24", lock: "#A855F7", particles: ["#22D3EE", "#FBBF24", "#A855F7", "#EC4899", "#10B981"] },
};

type ParticleShape = "circle" | "star" | "diamond";
interface Particle { id: number; x: number; y: number; r: number; a: number; d: number; shape: ParticleShape; }

export default function GiftBoxVisual({ theme = "gold", isOpen, onOpen, customBoxColor, customRibbonColor, customLockColor }: GiftBoxVisualProps) {
    const [hovered, setHovered] = useState(false);
    const [rattling, setRattling] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const shapes: ParticleShape[] = ["circle", "star", "diamond"];
        setParticles(Array.from({ length: 32 }, (_, i) => ({
            id: i,
            x: 38 + Math.random() * 24,
            y: 28 + Math.random() * 14,
            r: 5 + Math.random() * 8,
            a: Math.random() * 360,
            d: 55 + Math.random() * 110,
            shape: shapes[i % 3],
        })));
        const t = setTimeout(() => setParticles([]), 1600);
        return () => clearTimeout(t);
    }, [isOpen]);

    const handleClick = () => {
        if (isOpen || rattling) return;
        setRattling(true);
        setTimeout(() => { setRattling(false); onOpen(); }, 850);
    };

    const T = THEME_MAP[theme];
    const boxClr = customBoxColor || T.chest;
    const ribbonClr = customRibbonColor || T.band;
    const lockClr = customLockColor || T.lock;
    const size = isMobile ? 220 : 280;

    return (
        <div
            style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: size, height: size + 48, userSelect: "none" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClick}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

                @keyframes giftFloat {
                    0%,100% { transform: translateY(0px) rotate(0deg); }
                    50%     { transform: translateY(-9px) rotate(1.2deg); }
                }
                @keyframes giftRattle {
                    0%   { transform: rotate(0deg) translateX(0); }
                    12%  { transform: rotate(-7deg) translateX(-7px); }
                    28%  { transform: rotate(7deg) translateX(7px); }
                    44%  { transform: rotate(-5deg) translateX(-5px); }
                    60%  { transform: rotate(5deg) translateX(5px); }
                    76%  { transform: rotate(-2deg) translateX(-2px); }
                    90%  { transform: rotate(2deg) translateX(2px); }
                    100% { transform: rotate(0deg) translateX(0); }
                }
                @keyframes lidFly {
                    0%   { transform-origin: 94px 103px; transform: rotate(0deg); opacity: 1; }
                    100% { transform-origin: 94px 103px; transform: rotate(-115deg) translate(-44px,-18px); opacity: 0; }
                }
                @keyframes boxShrink {
                    0%   { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.78) translateY(28px); }
                }
                @keyframes particlePop {
                    0%   { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
                    100% { opacity: 0; transform: translate(var(--tx),var(--ty)) scale(0) rotate(var(--rot)); }
                }
                @keyframes cueBreath {
                    0%,100% { transform: translateX(-50%) translateY(0); }
                    50%     { transform: translateX(-50%) translateY(-4px); }
                }
                @keyframes shadowPulse {
                    0%,100% { transform: translateX(-50%) scaleX(1); opacity: 0.85; }
                    50%     { transform: translateX(-50%) scaleX(0.88); opacity: 0.5; }
                }
                .gift-float   { animation: giftFloat  3.6s ease-in-out infinite; }
                .gift-rattle  { animation: giftRattle 0.85s ease-in-out; }
                .gift-vanish  { animation: boxShrink  0.65s cubic-bezier(0.4,0,1,1) forwards; }
                .cue-breath   { animation: cueBreath  2.2s ease-in-out infinite; }
                .shadow-pulse { animation: shadowPulse 3.6s ease-in-out infinite; }
            `}</style>

            {/* Ground shadow */}
            {!isOpen && (
                <div
                    className="shadow-pulse"
                    style={{
                        position: "absolute",
                        bottom: isMobile ? 44 : 52,
                        left: "50%",
                        width: size * 0.58,
                        height: isMobile ? 10 : 13,
                        background: "#000",
                        borderRadius: 8,
                        transform: "translateX(-50%)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Particles */}
            {particles.map(p => {
                const color = T.particles[p.id % T.particles.length];
                const angle = (p.a * Math.PI) / 180;
                const tx = Math.cos(angle) * p.d;
                const ty = Math.sin(angle) * p.d - 44;
                const rot = (Math.random() - 0.5) * 720;
                const starPath = "M0,-5 L1.2,-1.8 L5,-1.8 L2,0.9 L3.1,4.8 L0,2.8 L-3.1,4.8 L-2,0.9 L-5,-1.8 L-1.2,-1.8 Z";
                const diamondPath = "M0,-5 L3.5,0 L0,5 L-3.5,0 Z";

                const baseStyle: React.CSSProperties = {
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    // @ts-ignore
                    "--tx": `${tx}px`,
                    "--ty": `${ty}px`,
                    "--rot": `${rot}deg`,
                    animation: "particlePop 1.25s cubic-bezier(0.15,0.85,0.35,1) forwards",
                    animationDelay: `${(p.id % 4) * 0.03}s`,
                    pointerEvents: "none",
                };

                if (p.shape === "circle") return (
                    <div key={p.id} style={{ ...baseStyle, width: p.r, height: p.r, background: color, border: "2px solid #000", borderRadius: "50%", boxShadow: "2px 2px 0 #000" }} />
                );
                return (
                    <svg key={p.id} style={{ ...baseStyle, filter: "drop-shadow(2px 2px 0 #000)" }} width={p.r * 2.5} height={p.r * 2.5} viewBox="-6 -6 12 12">
                        <path d={p.shape === "star" ? starPath : diamondPath} fill={color} stroke="#000" strokeWidth="1.2" />
                    </svg>
                );
            })}

            {/* Box wrapper */}
            <div
                className={isOpen ? "gift-vanish" : rattling ? "gift-rattle" : "gift-float"}
                style={{
                    position: "relative",
                    width: size * 0.74,
                    height: size * 0.74 * (210 / 200),
                    cursor: isOpen ? "default" : "pointer",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
                    transform: hovered && !isOpen && !rattling ? "translateY(-5px)" : undefined,
                }}
            >
                <svg viewBox="0 0 200 210" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>

                    {/* Body shadow */}
                    {!isOpen && <rect x="14" y="108" width="180" height="90" rx="10" fill="#000" />}

                    {/* Body */}
                    <rect x="10" y="104" width="180" height="90" rx="10" fill={boxClr} stroke="#000" strokeWidth="3.5" />

                    {/* Horizontal ribbon */}
                    <rect x="10" y="139" width="180" height="18" fill={ribbonClr} stroke="#000" strokeWidth="3.5" />

                    {/* Vertical ribbon */}
                    <rect x="85" y="104" width="30" height="90" fill={ribbonClr} stroke="#000" strokeWidth="3.5" />

                    {/* Lid group */}
                    <g style={{ animation: isOpen ? "lidFly 0.65s cubic-bezier(0.22,1,0.38,1) forwards" : "none" }}>
                        {/* Lid shadow */}
                        <rect x="10" y="59" width="188" height="50" rx="8" fill="#000" />

                        {/* Bow loops */}
                        <path d="M100,54 Q80,20 67,33 Q61,43 85,50 Z" fill={ribbonClr} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
                        <path d="M100,54 Q120,20 133,33 Q139,43 115,50 Z" fill={ribbonClr} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />

                        {/* Bow knot */}
                        <circle cx="100" cy="51" r="11" fill={ribbonClr} stroke="#000" strokeWidth="3.5" />

                        {/* Lid body */}
                        <rect x="6" y="54" width="188" height="50" rx="8" fill={boxClr} stroke="#000" strokeWidth="3.5" />

                        {/* Lid vertical ribbon */}
                        <rect x="85" y="54" width="30" height="50" fill={ribbonClr} stroke="#000" strokeWidth="3.5" />
                    </g>

                    {/* Lock / flower */}
                    {!isOpen && (
                        <g transform="translate(100,148)">
                            <path
                                d="M0,-22 C6,-22,10,-17,12,-12 C17,-14,22,-10,22,-5 C25,-2,25,2,22,5 C22,10,17,14,12,12 C10,17,6,22,0,22 C-6,22,-10,17,-12,12 C-17,14,-22,10,-22,5 C-25,2,-25,-2,-22,-5 C-22,-10,-17,-14,-12,-12 C-10,-17,-6,-22,0,-22 Z"
                                fill={lockClr} stroke="#000" strokeWidth="3.5" strokeLinejoin="round"
                            />
                            <circle cx="0" cy="0" r="7" fill="#000" />
                        </g>
                    )}
                </svg>
            </div>

            {/* Cue label */}
            {!isOpen && (
                <div
                    className="cue-breath"
                    style={{
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "7px 16px",
                        background: "#fff",
                        border: "2.5px solid #000",
                        borderRadius: 10,
                        boxShadow: "3px 3px 0 #000",
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#000",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    {isMobile ? "Tap to Unwrap ⚡" : "Click to Unwrap ⚡"}
                </div>
            )}
        </div>
    );
}