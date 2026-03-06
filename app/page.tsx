"use client";

import Link from "next/link";
import Container from "@/components/Container";
import { assets } from "@/data/mockData";
import AssetCard from "@/components/AssetCard";
import CategoryCard from "@/components/CategoryCard";
import FireParticles from "@/components/FireParticles";
import { TrendingUp, Sparkles, Wrench, ArrowRight } from "lucide-react";
import HomeToolsGrid from "@/components/HomeToolsGrid";
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
    { title: "Pinterest Keywords", count: "Best Keywords", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/pinterest-nest", href: "/keywords" },
    { title: "QR Generator", count: "Free Tool", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/ai-tools", href: "/tools/qr" },
    { title: "Video Editing Assets", count: "Best Assets", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/video-editing", href: "/video-editing", isDevelopment: true },
    { title: "Best Useful Websites", count: "Top Sites", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/useful-websites", href: "/useful-websites", isDevelopment: true },
    { title: "Best AI Tools", count: "Smart Tools", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/ai-tools", href: "/ai-tools", isDevelopment: true },
    { title: "Wallpapers", count: "Best Wallpapers", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/ChatGPT%20Image%20Feb%2024%2C%202026%2C%2010_22_23%20PM", href: "/category/wallpapers", isDevelopment: true },
    { title: "Sound Effects", count: "Best SFX", image: "https://res.cloudinary.com/drljj29ua/image/upload/assetnest/categories/sound-effects", href: "/category/sound-effects", isDevelopment: true },
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
            <source src="https://res.cloudinary.com/drljj29ua/video/upload/assetnest/categories/Animate_this_image_1080p_202602241544" type="video/mp4" />
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
            <source src="https://res.cloudinary.com/drljj29ua/video/upload/assetnest/categories/0224" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

          {/* Bottom Dissolve Edge (Downward Fade) */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background pointer-events-none" />
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
                YOUR ULTIMATE <span className="bg-[linear-gradient(to_right,#757F9A,#D7DDE8,#757F9A,#D7DDE8,#757F9A)] bg-clip-text text-transparent">ASSET</span> NEST.
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

      {/* ── Top Tools Section ── */}
      <section className="py-16 px-10">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 border border-zinc-800 flex items-center justify-center">
              <Wrench size={15} className="text-zinc-400" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-widest text-white">Top Tools</h2>
              <p className="text-xs text-zinc-600 font-medium">Free tools for creators — 100% browser-based</p>
            </div>
          </div>
          <Link
            href="/tools"
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
          >
            All Tools <ArrowRight size={11} />
          </Link>
        </div>

        {/* Tool cards grid */}
        <HomeToolsGrid />
      </section>

    </div>
  );
}
