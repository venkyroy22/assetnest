"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ALL_TOOLS, Tool } from "@/lib/tools";
import { ArrowUpRight, ArrowRight } from "lucide-react";


// ── Single tool card ──────────────────────────────────────────────────────────
function HomeToolCard({ tool, index }: { tool: Tool; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100 + index * 70);
        return () => clearTimeout(t);
    }, [index]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMouse({ x, y });
        setTilt({
            x: ((y / rect.height) - 0.5) * -10,
            y: ((x / rect.width) - 0.5) * 10,
        });
    }, []);

    const { accent } = tool;
    const Icon = tool.icon;

    return (
        <Link href={tool.href} className="block" tabIndex={-1}>
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? hovered
                            ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale(1.015)`
                            : "perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)"
                        : "translateY(24px) scale(0.97)",
                    transition: visible
                        ? hovered
                            ? "transform 0.12s ease-out, box-shadow 0.2s"
                            : "transform 0.45s cubic-bezier(0.23,1,0.32,1), opacity 0.45s, box-shadow 0.3s"
                        : "opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1)",
                    boxShadow: hovered
                        ? `0 20px 50px -10px ${accent}30, 0 0 0 1px ${accent}25`
                        : "0 0 0 1px rgba(63,63,70,0.5)",
                    willChange: "transform, opacity",
                }}
                className="relative overflow-hidden rounded-2xl bg-zinc-900/80 p-5 cursor-pointer h-full"
            >
                {/* Dot-grid texture */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                    }}
                />

                {/* Spotlight radial */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(260px circle at ${mouse.x}px ${mouse.y}px, ${accent}20, transparent 70%)`
                            : "none",
                    }}
                />

                {/* Glowing border ring */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(180px circle at ${mouse.x}px ${mouse.y}px, ${accent}50, transparent 60%)`
                            : "none",
                        WebkitMask: "linear-gradient(#fff,#fff) content-box, linear-gradient(#fff,#fff)",
                        WebkitMaskComposite: "xor" as React.CSSProperties["WebkitMaskComposite"],
                        maskComposite: "exclude" as React.CSSProperties["maskComposite"],
                        padding: "1px",
                    }}
                />

                {/* Corner glow */}
                <div
                    className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
                    style={{ background: accent, opacity: hovered ? 0.14 : 0.04 }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-3">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
                            style={{
                                background: hovered ? `${accent}18` : "rgba(39,39,42,0.8)",
                                borderColor: hovered ? `${accent}50` : "rgba(63,63,70,0.8)",
                                boxShadow: hovered ? `0 0 14px ${accent}28` : "none",
                            }}
                        >
                            <Icon size={18} style={{ color: hovered ? accent : "#71717a", transition: "color 0.3s" }} />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border"
                                style={{ color: accent, borderColor: `${accent}40`, background: `${accent}12` }}
                            >
                                {tool.category}
                            </span>
                            <ArrowUpRight
                                size={14}
                                style={{
                                    color: hovered ? accent : "#3f3f46",
                                    transform: hovered ? "translate(2px,-2px)" : "translate(0,0)",
                                    transition: "color 0.3s, transform 0.3s",
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <h3
                            className="text-xs font-black uppercase tracking-widest mb-1.5 transition-colors duration-300"
                            style={{ color: hovered ? accent : "#fff" }}
                        >
                            {tool.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                            {tool.description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Grid ──────────────────────────────────────────────────────────────────────
export default function HomeToolsGrid() {
    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">

                {ALL_TOOLS.slice(0, 6).map((tool, i) => (
                    <HomeToolCard key={tool.id} tool={tool} index={i} />
                ))}
            </div>

            {/* CTA row */}
            <div className="mt-6 flex items-center justify-center">
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all rounded-xl shadow-lg shadow-emerald-500/20"
                >
                    Explore All Tools <ArrowRight size={13} />
                </Link>
            </div>
        </div>
    );
}
