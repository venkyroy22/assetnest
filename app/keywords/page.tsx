"use client";

import { pinterestKeywords } from "@/data/mockData";
import { Copy, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";


export default function KeywordsPage() {
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="py-16 min-h-screen bg-black px-6 md:px-10 relative">
            {/* Page-wide background grid to match Tools page */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
                }}
            />

            <div className="relative z-10 pt-10">
                {/* ── Header ── */}
                <div
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)",
                    }}
                    className="mb-12 max-w-[90rem] mx-auto"
                >
                    <div
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(-14px)",
                            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/60 mb-5 backdrop-blur-sm"
                    >
                        <Sparkles size={11} className="text-[#e11d48]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pinterest Strategy</span>
                    </div>

                    <h1
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                            transition: "opacity 0.55s ease 0.06s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.06s",
                        }}
                        className="text-4xl md:text-6xl font-black tracking-tight uppercase text-white mb-3"
                    >
                        Pinterest Keywords
                    </h1>

                    <p
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(14px)",
                            transition: "opacity 0.55s ease 0.12s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.12s",
                        }}
                        className="text-zinc-400 max-w-2xl text-sm font-medium leading-relaxed"
                    >
                        Boost your reach with curated keyword lists.
                        <span className="text-[#e11d48] font-bold mx-1">Click on any poster</span>
                        to jump directly to the relevant category and trending keywords on Pinterest.
                    </p>
                </div>

                <div
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "opacity 0.6s ease 0.2s, transform 0.6s cubic-bezier(0.23,1,0.32,1) 0.2s",
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[90rem] mx-auto"
                >
                    {pinterestKeywords.map((list, i) => {
                        const CardContent = (
                            <div
                                className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.01] border border-zinc-900 cursor-pointer"
                            >
                                <img
                                    src={list.image}
                                    alt={list.title}
                                    className="w-full h-auto block"
                                />
                                {/* Overlay for hover feedback */}
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
                            </div>
                        );

                        if (list.externalUrl) {
                            return (
                                <a
                                    key={list.slug}
                                    href={list.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    {CardContent}
                                </a>
                            );
                        }

                        return <div key={list.slug}>{CardContent}</div>;
                    })}
                </div>
            </div>
        </div>
    );
}

