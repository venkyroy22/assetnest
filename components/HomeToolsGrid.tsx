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
        const t = setTimeout(() => setVisible(true), 50 + index * 70);
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
        <Link href={tool.href} className="block h-full" tabIndex={-1}>
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? hovered
                            ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-5px) scale(1.02)`
                            : "perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)"
                        : "translateY(28px) scale(0.97)",
                    transition: visible
                        ? hovered
                            ? "transform 0.12s ease-out, box-shadow 0.2s ease"
                            : `transform 0.45s cubic-bezier(0.23,1,0.32,1) ${Math.max(0, index - 2) * 50}ms, opacity 0.45s ease ${Math.max(0, index - 2) * 50}ms, box-shadow 0.3s ease ${Math.max(0, index - 2) * 50}ms`
                        : "opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1)",
                    boxShadow: hovered
                        ? `0 24px 56px -12px ${accent}35, 0 0 0 1px ${accent}28`
                        : "0 0 0 1px rgba(63,63,70,0.5)",
                    willChange: "transform, opacity",
                }}
                className="relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md p-5 cursor-pointer h-full"
            >
                {/* Dot-grid texture */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                    }}
                />

                {/* Spotlight radial */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(260px circle at ${mouse.x}px ${mouse.y}px, ${accent}22, transparent 70%)`
                            : "none",
                    }}
                />

                {/* Glowing border ring */}
                <div
                    className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(180px circle at ${mouse.x}px ${mouse.y}px, ${accent}55, transparent 60%)`
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
                    style={{ background: accent, opacity: hovered ? 0.16 : 0.05 }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-3.5">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-11 h-11 rounded-[14px] flex items-center justify-center border transition-all duration-300"
                            style={{
                                background: hovered ? `${accent}18` : "rgba(39,39,42,0.8)",
                                borderColor: hovered ? `${accent}50` : "rgba(63,63,70,0.8)",
                                boxShadow: hovered ? `0 0 14px ${accent}30` : "none",
                            }}
                        >
                            <Icon size={18} style={{ color: hovered ? accent : "#71717a", transition: "color 0.3s" }} />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[10px] font-bold tracking-wide px-2 py-0.5 border rounded-full"
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
                            className="text-xs font-bold tracking-normal mb-1.5 transition-colors duration-300"
                            style={{ color: hovered ? accent : "#fff" }}
                        >
                            {tool.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2">
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
    // Show first 9 tools — a nice 3-column display
    const showcasedTools = ALL_TOOLS.slice(0, 9);

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
                {showcasedTools.map((tool, i) => (
                    <HomeToolCard key={tool.id} tool={tool} index={i} />
                ))}
            </div>

            {/* CTA row */}
            <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800/70 to-transparent max-w-[120px]" />
                <Link
                    href="/tools"
                    className="btn-pan px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl shadow-white/5 group"
                    style={{ "--btn-bg": "#000" } as React.CSSProperties}
                >
                    <span className="flex items-center gap-3">
                        Explore All {ALL_TOOLS.length} Tools <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-800/70 to-transparent max-w-[120px]" />
            </div>
        </div>
    );
}
