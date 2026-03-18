"use client";

import Link from "next/link";
import Container from "@/components/Container";
import CategoryCard from "@/components/CategoryCard";
import FireParticles from "@/components/FireParticles";
import { TrendingUp, Sparkles, Wrench, ArrowRight } from "lucide-react";
import HomeToolsGrid from "@/components/HomeToolsGrid";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPlayingReverse, setIsPlayingReverse] = useState(false);
  const forwardVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkIsDesktop = () => setIsDesktop(window.innerWidth > 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
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
    { title: "AI Image Prompts", count: "Best Prompts", image: "/promptsimg/Gemini_Generated_Image_l454rnl454rnl454.png", href: "/prompts" },
    { title: "QR Generator", count: "Free Tool", image: "/categories/qr-generator-cover.png", href: "/tools/qr" },
  ];

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex flex-col">
      {/* Search-Centric Editorial Hero */}
      <section className="relative flex items-center justify-center min-h-[500px] py-20 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 bg-black">
          {/* Static Background for Mobile to avoid 37MB payload */}
          {!isDesktop && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: 'url("https://res.cloudinary.com/drljj29ua/video/upload/f_auto,q_auto,so_0/assetnest/categories/Animate_this_image_1080p_202602241544.jpg")' }}
            />
          )}

          {/* Videos - Desktop Only */}
          {isDesktop && (
            <>
              <video
                ref={forwardVideoRef}
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={handleForwardEnded}
                poster="https://res.cloudinary.com/drljj29ua/video/upload/f_auto,q_auto,so_0/assetnest/categories/Animate_this_image_1080p_202602241544.jpg"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isPlayingReverse ? 'opacity-0' : 'opacity-100'}`}
              >
                <source src="https://res.cloudinary.com/drljj29ua/video/upload/f_auto,q_auto/assetnest/categories/Animate_this_image_1080p_202602241544.mp4" type="video/mp4" />
              </video>

              <video
                ref={reverseVideoRef}
                muted
                playsInline
                preload="none"
                onEnded={handleReverseEnded}
                poster="https://res.cloudinary.com/drljj29ua/video/upload/f_auto,q_auto,so_0/assetnest/categories/0224.jpg"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isPlayingReverse ? 'opacity-100' : 'opacity-0'}`}
              >
                <source src="https://res.cloudinary.com/drljj29ua/video/upload/f_auto,q_auto/assetnest/categories/0224.mp4" type="video/mp4" />
              </video>
            </>
          )}

          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

          {/* Bottom Dissolve Edge (Downward Fade) */}
          <div className="absolute -bottom-1 left-0 right-0 h-48 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none" />
        </div>
        <FireParticles />

        <div className="relative z-10 w-full max-w-5xl mx-auto text-center px-10">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-[0_4px_24px_rgba(255,255,255,0.02)]">
                <Sparkles size={12} className="text-zinc-400" />
                <span className="text-[10px] font-semibold tracking-wider text-zinc-300">Ultimate Resource Hub</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mx-auto max-w-4xl leading-[0.9] drop-shadow-2xl">
                Your Ultimate <span className="bg-[linear-gradient(to_right,#757F9A,#D7DDE8,#757F9A,#D7DDE8,#757F9A)] bg-clip-text text-transparent">Power</span> Nest.
              </h1>
              <p className="text-base md:text-xl text-zinc-400 font-medium max-w-xl mx-auto drop-shadow-md">
                Precision utilities, professional AI prompts, and essential tools for your next big project.
              </p>
            </div>


          </div>
        </div>
      </section>

      {/* Categories Grid (Replacing Asset Grid as per design request) */}
      <section className="py-8 bg-black">
        <div className="px-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
              <TrendingUp className="text-amber-500" size={20} />
              Assets
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <CategoryCard key={category.title} {...category} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Tools Section ── */}
      <section className="py-16 px-10 bg-black">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 shadow-inner border border-zinc-800 flex items-center justify-center">
              <Wrench size={16} className="text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">Smart Tools</h2>
              <p className="text-sm text-zinc-500 font-medium mt-0.5">No installs, no sign-up — runs entirely in your browser.</p>
            </div>
          </div>
          <Link
            href="/tools"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 text-xs font-semibold text-zinc-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-all custom-shadow"
          >
            All Tools <ArrowRight size={14} />
          </Link>
        </div>

        {/* Tool cards grid */}
        <HomeToolsGrid />
      </section>

    </div>
  );
}

