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
        <Link href={tool.href} className="block h-full group" tabIndex={-1}>
            <div
                ref={cardRef}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1), background-color 0.3s ease, border-color 0.3s ease",
                    backgroundColor: "#1e1e1e",
                }}
                className="relative overflow-hidden rounded-[1.8rem] sm:rounded-[2rem] p-4 sm:p-5 h-full border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
                style2-ignore="true"
            >
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-3 sm:gap-4">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] flex items-center justify-center transition-all duration-300"
                            style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)" }}
                        >
                            <Icon size={16} className="transition-colors duration-300 sm:w-[18px] sm:h-[18px]" style={{ color: "#ffffff" }} />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[9px] sm:text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full group-hover:text-white transition-colors"
                                style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                            >
                                {tool.category}
                            </span>
                            <ArrowUpRight
                                size={14}
                                className="text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 mt-auto">
                        <h3 className="text-[12px] sm:text-xs font-bold tracking-tight leading-tight" style={{ color: "#ffffff" }}>
                            {tool.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.7)" }}>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4">
                {showcasedTools.map((tool, i) => (
                    <HomeToolCard key={tool.id} tool={tool} index={i} />
                ))}
            </div>

            {/* CTA row */}
            <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)" }} />
                <Link
                    href="/tools"
                    className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl group transition-all duration-300 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#f4f3ef] border border-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)] active:translate-y-0"
                >
                    <span className="flex items-center gap-3">
                        Explore All {ALL_TOOLS.length} Tools <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
                <div className="h-px flex-1 max-w-[120px]" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.1), transparent)" }} />
            </div>
        </div>
    );
}
