"use client";

import Link from "next/link";
import Container from "@/components/Container";
import { assets } from "@/data/mockData";
import AssetCard from "@/components/AssetCard";
import CategoryCard from "@/components/CategoryCard";
import FireParticles from "@/components/FireParticles";
import { TrendingUp, Sparkles, Wrench, QrCode, Search, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isPlayingReverse, setIsPlayingReverse] = useState(false);
  const forwardVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleForwardEnded = () => {
    if (reverseVideoRef.current) {
      reverseVideoRef.current.currentTime = 0;
      reverseVideoRef.current.play().then(() => {
        setIsPlayingReverse(true);
      }).catch(() => {
        setIsPlayingReverse(true);
      });
    }
  };

  const handleReverseEnded = () => {
    if (forwardVideoRef.current) {
      forwardVideoRef.current.currentTime = 0;
      forwardVideoRef.current.play().then(() => {
        setIsPlayingReverse(false);
      }).catch(() => {
        setIsPlayingReverse(false);
      });
    }
  };

  const categories = [
    { title: "Pinterest Keywords", count: "Best Keywords", image: "/categories/pinterest-nest.png", href: "/keywords" },
    { title: "QR Generator", count: "Free Tool", image: "/categories/ai-tools.png", href: "/tools/qr" },
    { title: "Video Editing Assets", count: "Best Assets", image: "/categories/video-editing.png", href: "/video-editing", isDevelopment: true },
    { title: "Best Useful Websites", count: "Top Sites", image: "/categories/useful-websites.png", href: "/useful-websites", isDevelopment: true },
    { title: "Best AI Tools", count: "Smart Tools", image: "/categories/ai-tools.png", href: "/ai-tools", isDevelopment: true },
    { title: "Wallpapers", count: "Best Wallpapers", image: "/categories/ChatGPT Image Feb 24, 2026, 10_22_23 PM.png", href: "/category/wallpapers", isDevelopment: true },
    { title: "Sound Effects", count: "Best SFX", image: "/categories/sound-effects.png", href: "/category/sound-effects", isDevelopment: true },
  ];

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex flex-col">
      {/* Search-Centric Editorial Hero */}
      <section className="relative flex items-center justify-center min-h-[500px] py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Videos */}
          <video
            ref={forwardVideoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleForwardEnded}
            className={`absolute inset-0 w-full h-full object-cover ${isPlayingReverse ? 'opacity-0' : 'opacity-100'}`}
          >
            <source src="/categories/Animate_this_image_1080p_202602241544.mp4" type="video/mp4" />
          </video>

          {/* Reverse Video */}
          <video
            ref={reverseVideoRef}
            muted
            playsInline
            preload="auto"
            onEnded={handleReverseEnded}
            className={`absolute inset-0 w-full h-full object-cover ${isPlayingReverse ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="/categories/0224.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
        </div>
        <FireParticles />

        <div className="relative z-10 w-full max-w-5xl mx-auto text-center px-10">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/10 border border-foreground/20 backdrop-blur-md mb-4">
                <Sparkles size={12} className="text-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Ultimate Resource Hub</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight uppercase text-white mx-auto max-w-4xl leading-[0.85] drop-shadow-2xl">
                EVERYTHING <span className="bg-[linear-gradient(to_right,#757F9A,#D7DDE8,#757F9A,#D7DDE8,#757F9A)] bg-clip-text text-transparent">CREATORS</span> NEED.
              </h1>
              <p className="text-base md:text-xl text-zinc-300 font-medium max-w-xl mx-auto drop-shadow-md">
                Curated assets, strategic tools, and infinite inspiration for your next big project.
              </p>
            </div>


          </div>
        </div>
      </section>

      {/* Categories Grid (Replacing Asset Grid as per design request) */}
      <section className="py-8 bg-zinc-950/20">
        <div className="px-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              <TrendingUp className="text-amber-500" size={20} />
              Free assets for any project
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Tools Section */}
      <section className="py-16 px-10">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="text-white" size={20} />
            <h2 className="text-xl font-black tracking-tight text-white uppercase">Top Tools</h2>
          </div>
          <Link
            href="/tools"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            View All <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* QR Generator */}
          <Link href="/tools/qr" className="group relative overflow-hidden border border-zinc-800 bg-zinc-900/50 p-6 hover:border-white/30 hover:bg-zinc-800/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                  <QrCode size={18} className="text-white" />
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">QR Generator</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Create beautiful, customizable QR codes in seconds. Free to use, no sign-up needed.</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 w-fit">Free Tool</span>
            </div>
          </Link>

          {/* Pinterest Keywords */}
          <Link href="/keywords" className="group relative overflow-hidden border border-zinc-800 bg-zinc-900/50 p-6 hover:border-white/30 hover:bg-zinc-800/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/40 transition-all">
                  <Search size={18} className="text-red-400" />
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Pinterest Keywords</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Discover the best-performing keywords to grow your Pinterest reach and profile traffic.</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 w-fit">Free Tool</span>
            </div>
          </Link>

          {/* Coming Soon Slot */}
          <div className="group relative overflow-hidden border border-dashed border-zinc-800 bg-zinc-950/30 p-6 opacity-60">
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                  <Sparkles size={18} className="text-zinc-600" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-1">More Tools</h3>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">More powerful free tools dropping soon. Stay tuned.</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 w-fit">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
