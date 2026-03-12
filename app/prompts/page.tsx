"use client";

import { aiPrompts } from "@/data/mockData";
import { Copy, Check, Terminal, Sparkles, ZoomIn } from "lucide-react";
import { useState, useEffect } from "react";
import Container from "@/components/Container";

export default function PromptsPage() {
    const [headerVisible, setHeaderVisible] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="py-20 min-h-screen bg-black px-4 md:px-10">
            <div className="max-w-[95rem] mx-auto space-y-16">
                
                {/* ── Header ── */}
                <div 
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "opacity-800ms ease",
                    }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full backdrop-blur-sm">
                        <Sparkles size={11} className="text-purple-500" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Premium AI Prompts</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        AI Image <span className="text-zinc-700">Prompts</span>
                    </h1>
                </div>

                {/* ── Compact Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {aiPrompts.map((item, idx) => (
                        <div key={item.slug} className="group relative">
                            
                            {/* The Compact Poster Container */}
                            <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-2xl transition-all duration-500 hover:border-zinc-500 hover:scale-[1.02] bg-zinc-950">
                                
                                {/* Base Image */}
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[1.1] contrast-[1.05]"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
                                    }}
                                />

                                {/* Overlays (Lightened for brightness) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                
                                {/* Labels (Condensed) */}
                                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">#{idx + 1} Made with {item.author}</span>
                                    
                                    <div className="relative">
                                        {/* Tooltip Bubble */}
                                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.3)] pointer-events-none">
                                            Copy the prompt
                                            <div className="absolute top-1/2 -translate-y-1/2 right-[-4px] w-2 h-2 bg-white rotate-45" />
                                        </div>

                                        <button 
                                            onClick={() => copyToClipboard(item.sections.map(s => `${s.label.toUpperCase()}:\n${s.content}`).join('\n\n'), idx)}
                                            className="p-3 bg-white/10 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white hover:text-black hover:scale-110 transition-all duration-300 active:scale-90 shadow-2xl relative overflow-hidden group/btn"
                                            title="Copy Prompt"
                                        >
                                            {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                                            {/* Pulse effect */}
                                            <div className="absolute inset-0 bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
                                        </button>
                                    </div>
                                </div>

                                {/* Prompt Text (Scaled Down) */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="space-y-4">
                                        {/* Prompt Sections (Max 3 seen in preview) */}
                                        <div className={`grid ${item.sections.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                            {item.sections.slice(0, 4).map((section, sIdx) => (
                                                <div key={sIdx} className="space-y-1">
                                                    {section.label !== "FULL PROMPT" && (
                                                        <h4 className="text-white/40 text-[7px] font-black uppercase tracking-wider truncate mb-1 border-b border-white/5 pb-0.5">
                                                            {section.label.split('(')[0]}
                                                        </h4>
                                                    )}
                                                    <p className={`text-white/80 ${item.sections.length > 1 ? 'text-[10px]' : 'text-[11px]'} leading-[1.4] line-clamp-6 font-medium`}>
                                                        {section.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Reveal "Full View" (Optional Aesthetic) */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
                                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                                        <ZoomIn size={20} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- SEO & HIGH VALUE CONTENT SECTION --- */}
                <div className="mt-40 space-y-24">
                    <Container>
                        <div className="max-w-4xl mx-auto space-y-20">
                            <section className="bg-zinc-950 border border-zinc-900 p-8 sm:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Sparkles size={120} />
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">Mastering the Art of <span className="text-zinc-600">AI Prompting</span></h2>
                                <div className="space-y-8 text-zinc-400 leading-relaxed text-[17px]">
                                    <p>
                                        In the rapidly evolving landscape of generative AI, the difference between a generic output and a professional masterpiece often lies in the precision of the prompt. Our **AI Image Prompts** gallery is more than just a list—it's a curated archive designed to provide creators with high-fidelity starting points for tools like Midjourney, DALL-E 3, and Stable Diffusion.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 py-12 border-y border-zinc-900/50">
                                        <div className="space-y-3">
                                            <h4 className="text-white font-bold text-xl">Style Consistency</h4>
                                            <p className="text-sm">Achieve a uniform visual language across entire projects by utilizing our tested stylistic keywords and established lighting parameters.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-white font-bold text-xl">Cinematic Precision</h4>
                                            <p className="text-sm">We focus on professional terminology—from *chiaroscuro* to *volumetric fog*—ensuring the AI understands complex physics and textures.</p>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mt-12 mb-6">Why Use Structured Prompts?</h3>
                                    <p>
                                        AI models are trained on billions of images, but they require specific linguistic cues to narrow down their output. By using structured prompts like those in our "Editorial Style" or "Cinematic Portrait" series, you control critical variables:
                                    </p>
                                    <ul className="grid grid-cols-1 gap-4 text-sm font-medium">
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-purple-500" /> Lighting: Low-key, Golden Hour, Rim Lighting</li>
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-blue-500" /> Composition: Dutch Tilt, Close-up Profile, 35mm Lens</li>
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Detail: Pores, fabric texture, metallic reflections</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="px-4">
                                <h2 className="text-3xl font-black text-white mb-12 tracking-tight">Pro Tips for Best Results</h2>
                                <div className="grid grid-cols-1 gap-12">
                                    <div className="flex gap-8 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-white font-black text-xl group-hover:bg-white group-hover:text-black transition-all duration-500">01</div>
                                        <div>
                                            <h4 className="text-white font-bold text-xl mb-3">Lighting Defines the Mood</h4>
                                            <p className="text-zinc-500 text-[15px] leading-relaxed">Don't just describe the subject. Describe the light hitting the subject. Terms like "saturated deep-green monochromatic lighting" instantly transform a flat image into a high-fashion music video aesthetic.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-white font-black text-xl group-hover:bg-white group-hover:text-black transition-all duration-500">02</div>
                                        <div>
                                            <h4 className="text-white font-bold text-xl mb-3">Lens & Camera Specs Matter</h4>
                                            <p className="text-zinc-500 text-[15px] leading-relaxed">Adding "captured on 35mm film" or "85mm f/1.8 lens" signals to the AI to apply realistic depth of field and color grain common in photography and cinema.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-white font-black text-xl group-hover:bg-white group-hover:text-black transition-all duration-500">03</div>
                                        <div>
                                            <h4 className="text-white font-bold text-xl mb-3">Iterative Refining</h4>
                                            <p className="text-zinc-500 text-[15px] leading-relaxed">Use our prompts as a base, then swap one keyword at a time. Change "emerald" to "cyberpunk red" to see how the lighting physics react to different color wavelengths.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </Container>

                    <footer className="pt-20 border-t border-zinc-900 text-center pb-20">
                        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Part of the AssetNest Creator Ecosystem • Free to Use • 2026</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
