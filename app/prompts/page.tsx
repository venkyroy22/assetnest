"use client";

import { aiPrompts, PromptItem } from "@/data/mockData";
import { Copy, Check, Terminal, Sparkles, ZoomIn, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Container from "@/components/Container";
import Tooltip from "@/components/Tooltip";

// --- Sub-component for auto-sliding carousel images ---
function CarouselImage({ images, title }: { images: string[], title: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [images]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Sliding Container */}
            <div 
                className="flex w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <div key={img} className="min-w-full h-full relative overflow-hidden">
                        <img
                            src={img}
                            alt={`${title} - version ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 brightness-[1.1] contrast-[1.05]"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
                            }}
                        />
                    </div>
                ))}
            </div>
            
            {/* Visual indicators for multiple images */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                    {images.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PromptsPage() {
    const [headerVisible, setHeaderVisible] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [likesMap, setLikesMap] = useState<Record<string, number>>({});
    const [userLikedSlugs, setUserLikedSlugs] = useState<string[]>([]);

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 100);
        
        // Fetch global likes
        fetch('/api/likes')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const map: Record<string, number> = {};
                    data.forEach((item: any) => { map[item.slug] = item.likes; });
                    setLikesMap(map);
                }
            })
            .catch(err => console.error("Likes fetch error:", err));

        // Load local user likes
        const saved = localStorage.getItem('user_prompt_likes');
        if (saved) {
            try {
                setUserLikedSlugs(JSON.parse(saved));
            } catch(e) { /* ignore */ }
        }

        return () => clearTimeout(t);
    }, []);

    // Sort prompts by likes
    const sortedPrompts = useMemo(() => {
        return [...aiPrompts].sort((a, b) => {
            const likesA = likesMap[a.slug] || 0;
            const likesB = likesMap[b.slug] || 0;
            if (likesA === likesB) return 0;
            return likesB - likesA;
        });
    }, [likesMap]);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleLike = async (slug: string) => {
        const isLiked = userLikedSlugs.includes(slug);
        const currentLikes = likesMap[slug] || 0;
        
        // Optimistic UI update
        if (isLiked) {
            // UNLIKE
            setLikesMap(prev => ({ ...prev, [slug]: Math.max(0, currentLikes - 1) }));
            const newLikes = userLikedSlugs.filter(s => s !== slug);
            setUserLikedSlugs(newLikes);
            localStorage.setItem('user_prompt_likes', JSON.stringify(newLikes));
        } else {
            // LIKE
            setLikesMap(prev => ({ ...prev, [slug]: currentLikes + 1 }));
            const newLikes = [...userLikedSlugs, slug];
            setUserLikedSlugs(newLikes);
            localStorage.setItem('user_prompt_likes', JSON.stringify(newLikes));
        }

        try {
            await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    slug, 
                    increment: isLiked ? -1 : 1 
                })
            });
        } catch (err) {
            console.error("Failed to sync like toggle:", err);
        }
    };

    return (
        <div className="py-20 min-h-screen bg-black px-4 md:px-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-white/5 pointer-events-none rotate-12 -z-0 translate-x-32 -translate-y-20">
                <Sparkles size={700} strokeWidth={0.5} />
            </div>

            <div className="max-w-[95rem] mx-auto space-y-16 relative z-10">
                
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
                        <Sparkles size={11} className="text-white" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Premium AI Prompts</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        AI Image <span className="text-zinc-700">Prompts</span>
                    </h1>
                </div>

                {/* ── Compact Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {sortedPrompts.map((item, idx) => {
                        const isLiked = userLikedSlugs.includes(item.slug);
                        const likesCount = likesMap[item.slug] || 0;
                        
                        return (
                        <div key={item.slug} className="group relative">
                            
                            {/* The Compact Poster Container */}
                            <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-2xl transition-all duration-500 hover:border-zinc-500 hover:scale-[1.02] bg-zinc-950">
                                
                                {/* Carousel Images */}
                                <CarouselImage images={item.images} title={item.title} />

                                {/* Overlays (Lightened for brightness) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                                
                                {/* Labels (Condensed) */}
                                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">#{idx + 1} Made with {item.author}</span>
                                            {idx === 0 && likesCount > 0 && (
                                                <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-black rounded-full shadow-[0_0_15px_rgba(255, 255, 255,0.3)]">Most Popular</span>
                                            )}
                                        </div>
                                        {likesCount > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
                                                <Heart size={8} className="text-white fill-white" />
                                                <span className="text-[8px] font-black text-white/60">{likesCount} Liked</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                        <Tooltip content={copiedIndex === idx ? "Copied!" : "Copy Prompt"} position="left">
                                            <button 
                                                onClick={() => copyToClipboard(item.sections.map(s => `${s.label.toUpperCase()}:\n${s.content}`).join('\n\n'), idx)}
                                                className="p-3 bg-white/10 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white hover:text-black hover:scale-110 transition-all duration-300 active:scale-90 shadow-2xl relative overflow-hidden group/btn"
                                            >
                                                {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                                                {/* Pulse effect */}
                                                <div className="absolute inset-0 bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={isLiked ? "Unlike" : "Like this prompt"} position="left">
                                            <button 
                                                onClick={() => handleLike(item.slug)}
                                                className={`p-3 backdrop-blur-2xl border transition-all duration-300 active:scale-90 rounded-xl flex items-center justify-center hover:scale-110 ${
                                                    isLiked 
                                                    ? "bg-white/20 border-white/40 text-white" 
                                                    : "bg-white/10 border-white/10 text-white hover:bg-white hover:text-white hover:border-white"
                                                }`}
                                            >
                                                <Heart size={16} className={isLiked ? "fill-current" : ""} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>

                                {/* Prompt Text (Scaled Down) */}
                                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
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
                        );
                    })}
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
                                        In the rapidly evolving landscape of generative AI, the difference between a generic output and a professional masterpiece often lies in the precision of the prompt. Our **AI Image Prompts** gallery is more than just a list—it's a curated archive designed to provide creators with high-fidelity starting points for leading AI image generation models.
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
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-white" /> Lighting: Low-key, Golden Hour, Rim Lighting</li>
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-white" /> Composition: Dutch Tilt, Close-up Profile, 35mm Lens</li>
                                        <li className="flex items-center gap-3 py-3 px-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"><div className="w-2 h-2 rounded-full bg-white" /> Detail: Pores, fabric texture, metallic reflections</li>
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
