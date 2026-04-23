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
                    transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                }}
                className="relative overflow-hidden rounded-[1.8rem] sm:rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md p-4 sm:p-5 h-full transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/60"
            >
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full gap-3 sm:gap-4">
                    <div className="flex items-start justify-between">
                        <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] flex items-center justify-center border border-zinc-800 bg-zinc-900 transition-all duration-300 group-hover:bg-zinc-800 group-hover:border-zinc-700"
                        >
                            <Icon size={16} className="text-zinc-500 group-hover:text-white transition-colors duration-300 sm:w-[18px] sm:h-[18px]" />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[9px] sm:text-[10px] font-bold tracking-wide px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-400 rounded-full group-hover:text-white transition-colors"
                            >
                                {tool.category}
                            </span>
                            <ArrowUpRight
                                size={14}
                                className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 mt-auto">
                        <h3 className="text-[12px] sm:text-xs font-bold tracking-tight text-white leading-tight">
                            {tool.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2">
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
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800/70 to-transparent max-w-[120px]" />
                <Link
                    href="/tools"
                    className="btn-pan px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-white/5 group"
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
