"use client";

import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import {
  TrendingUp, Sparkles, Wrench, ArrowRight, Shield, Zap,
  Lock, Globe, Star, CheckCircle, ArrowUpRight, Move, QrCode,
  Palette, Shapes, Images
} from "lucide-react";
import HomeToolsGrid from "@/components/HomeToolsGrid";
import { useState, useEffect, useRef } from "react";
import FadeReveal from "@/components/FadeReveal";

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function: outExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, shouldStart]);

  return count;
}

// ── Intersection Hook ─────────────────────────────────────────────────────────
function useInView(threshold = 0.01) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, {
      threshold,
      rootMargin: "0px 0px 100px 0px" // Trigger 100px before it fits
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, suffix, label, delay }: {
  value: number; suffix: string; label: string; delay: number;
}) {
  const { ref, isInView } = useInView(0.1);
  const count = useCountUp(value, 2000, isInView);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1 px-8 py-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl font-black tracking-tight text-white stat-number">
        {count.toLocaleString()}<span className="text-zinc-100">{suffix}</span>
      </div>
      <div className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">{label}</div>
    </div>
  );
}

// ── Feature pill ──────────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 bg-white/[0.03] backdrop-blur-md hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-default group">
      <Icon size={13} className="text-zinc-100 group-hover:scale-110 transition-all duration-300" />
      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}

// ── Why card ──────────────────────────────────────────────────────────────────
function WhyCard({ icon: Icon, title, desc, accent, index }: {
  icon: any; title: string; desc: string; accent: string; index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s cubic-bezier(0.23,1,0.32,1) ${index * 80}ms`,
      }}
      className="relative overflow-hidden rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-white/5 p-6 transition-all duration-300 w-full hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div className="relative z-10">
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 border transition-all duration-300 border-zinc-800 bg-zinc-900 group-hover:bg-zinc-800 group-hover:border-zinc-700"
        >
          <Icon size={18} className="text-zinc-500 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-sm font-bold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}

// ── Floating orb ──────────────────────────────────────────────────────────────
function FloatingOrb({
  size, color, x, y, duration, delay,
}: {
  size: number; color: string; x: string; y: string; duration: number; delay: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        filter: `blur(${size * 0.6}px)`,
        animation: `heroFloat ${duration}s ease-in-out ${delay}s infinite`,
        opacity: 0.55,
      }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  const [scrollY, setScrollY] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) {
      // Small delay before truly snapping back might feel better
      const t = setTimeout(() => setDragOffset({ x: 0, y: 0 }), 50);
      return () => clearTimeout(t);
    }
  }, [isDragging]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(t);
    };
  }, []);

  const scrollProgress = Math.min(Math.max(scrollY / 500, 0), 1);

  const categories = [
    { title: "AI Image Prompts", count: "Best Prompts", icon: Sparkles, href: "/prompts", accent: "#ffffff" },
    { title: "QR Generator", count: "Free Tool", icon: QrCode, href: "/tools/qr", accent: "#ffffff" },
    { title: "CSS Gradient Maker", count: "Mix & Copy", icon: Palette, href: "/tools/css-gradient", accent: "#ffffff" },
    { title: "SVG Patterns", count: "Cool Backgrounds", icon: Shapes, href: "/tools/svg-patterns", accent: "#ffffff" },
    { title: "Icon Library", count: "Click to Copy", icon: Images, href: "/tools/icons", accent: "#ffffff" },
  ];

  const whyCards = [
    { icon: Lock, title: "100% Private", desc: "All tools run entirely in your browser. Your files never leave your device.", accent: "#ffffff" },
    { icon: Zap, title: "Lightning Fast", desc: "Zero server round-trips. Instant results powered by modern browser APIs.", accent: "#ffffff" },
    { icon: Globe, title: "No Sign-Up Needed", desc: "Jump straight in. No account, no email, no credit card. Ever.", accent: "#ffffff" },
    { icon: Star, title: "Premium Quality", desc: "Professional-grade tools with clean, intuitive interfaces built for creators.", accent: "#ffffff" },
    { icon: Shield, title: "Always Free", desc: "Every tool on AssetNest is completely free — no hidden fees or paywalls.", accent: "#ffffff" },
  ];

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex flex-col">

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative flex items-center justify-center min-h-[600px] pt-12 pb-24 lg:pt-8 overflow-hidden bg-black">

        {/* ── Animated orbs in the background ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingOrb size={500} color="rgba(255,255,255,0.12)" x="-10%" y="-20%" duration={12} delay={0} />
          <FloatingOrb size={420} color="rgba(255, 255, 255,0.12)" x="68%" y="-10%" duration={15} delay={2} />
          <FloatingOrb size={360} color="rgba(255, 255, 255,0.08)" x="50%" y="50%" duration={10} delay={4} />
          <FloatingOrb size={300} color="rgba(255, 255, 255,0.1)" x="-6%" y="60%" duration={13} delay={1} />
          <FloatingOrb size={220} color="rgba(255, 255, 255,0.06)" x="38%" y="15%" duration={18} delay={6} />
        </div>

        {/* ── Grid dot pattern ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, #000 35%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, #000 35%, transparent 100%)",
          }}
        />

        {/* ── Subtle radial vignette ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 20%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* ── Bottom fade to black ── */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        {/* ── Main Content Container ── */}
        <div className="relative z-10 w-full max-w-[1500px] min-h-[750px] flex flex-col items-center justify-center px-6 md:px-16 overflow-hidden">

          {/* ── Giant Main Headline Layer (Behind Mask, then moves Front) ── */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none select-none overflow-visible"
            style={{
              opacity: heroVisible ? 0.60 + (scrollProgress * 0.40) : 0,
              transform: `translateY(-55%) scale(${1 + scrollProgress * 0.1})`,
              zIndex: scrollProgress > 0.5 ? 20 : 0,
              transition: heroVisible ? "opacity 1s ease, z-index 0s" : "none",
            }}
          >
            <h1
              className="text-[17vw] lg:text-[15vw] font-black tracking-[-0.08em] leading-none uppercase select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-75"
              style={{
                color: "transparent",
                backgroundImage: isDragging
                  ? `radial-gradient(circle at calc(50% + ${dragOffset.x * 0.5}px) calc(50% + ${dragOffset.y * 0.5}px), #fff 0%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.1) 50%)`
                  : "linear-gradient(to bottom, #fff, #fff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              AssetNest
            </h1>
          </div>

          {/* ── Focal Mask Layer (Foreground, then moves Behind) ── */}
          <div
            className={`relative w-full max-w-[650px] aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto z-10 group`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              opacity: heroVisible ? 1 - (scrollProgress * 0.4) : 0,
              transform: `translate3d(${dragOffset.x}px, ${-20 + scrollProgress * 150 + dragOffset.y}px, 0) scale(${1.1 - scrollProgress * 0.3})`,
              zIndex: scrollProgress > 0.5 ? 0 : 30,
              transition: isDragging ? "none" : (heroVisible ? "opacity 0.8s ease-out, transform 0.6s cubic-bezier(0.23,1,0.32,1)" : "none"),
              touchAction: "none"
            }}
          >
            {/* Drag Indicator Tooltip - Only on Hover */}
            <div className={`absolute top-1/4 right-[10%] lg:right-[15%] z-[100] transition-opacity duration-300 opacity-0 group-hover:opacity-100`}
              style={{ transform: "translateY(-50%)" }}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl">
                <Move size={11} className="text-zinc-400" />
                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase">Drag</span>
              </div>
            </div>

            <div className="relative w-full h-full">
              {/* Layered Glows radiating from behind the mask */}
              <div className="absolute inset-0 bg-white/20 blur-[130px] rounded-full scale-50 animate-pulse" />
              <div className="absolute inset-0 bg-white/5 blur-[160px] rounded-full scale-75" />

              <img
                src="/hero-mask.png"
                alt="AssetNest Interface"
                className="w-full h-full object-contain relative z-20 drop-shadow-[0_50px_100px_rgba(0,0,0,1)] brightness-[1.12] select-none pointer-events-none"
                style={{ animation: isDragging ? "none" : "heroFloat 18s ease-in-out infinite" }}
              />
            </div>
          </div>

          {/* ── Actions & Subtext Layer (In Front) ── */}
          <div
            className="relative z-20 flex flex-col items-center text-center gap-10 -mt-10 lg:-mt-20 px-6 max-w-2xl"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s ease 0.5s, transform 0.8s cubic-bezier(0.23,1,0.32,1) 0.5s",
            }}
          >
            {/* Subtitle */}
            <p className="text-xs md:text-sm text-zinc-400 font-black tracking-[0.4em] uppercase leading-relaxed max-w-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              The Hub for Intelligent creation
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-5">
              <Link
                href="/tools"
                className="btn-pan px-10 py-4.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-zinc-800/20 group w-[260px] max-w-full sm:w-auto"
                style={{ "--btn-bg": "#000" } as React.CSSProperties}
              >
                <span className="flex items-center justify-center gap-3">
                  Explore Tools <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/prompts"
                className="btn-pan px-10 py-4.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-full group w-full max-w-[260px] sm:max-w-none sm:w-auto"
                style={{ "--btn-bg": "#000" } as React.CSSProperties}
              >
                <span className="flex items-center justify-center gap-3">
                  AI Prompts <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════ STATS STRIP ══════════════════════════ */}
      <FadeReveal threshold={0.1}>
        <section className="py-10 bg-black border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
          <div className="px-6 md:px-10 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12 max-w-5xl mx-auto">
              <StatCard value={32} suffix="+" label="Free Tools" delay={0} />
              <StatCard value={100} suffix="%" label="Browser-Based" delay={100} />
              <StatCard value={7} suffix=" Cats" label="Tool Categories" delay={200} />
            </div>
          </div>
        </section>
      </FadeReveal>

      {/* ══════════════════════════ ASSETS / CATEGORIES ══════════════════════════ */}
      <FadeReveal distance={40}>
        <section className="py-12 bg-black">
          <div className="px-6 md:px-10">
            <div className="mb-8">
              <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
                <TrendingUp className="text-white" size={20} />
                Assets
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.map((category, index) => (
                <CategoryCard key={category.title} {...category} priority={index < 2} />
              ))}
            </div>
          </div>
        </section>
      </FadeReveal>

      {/* ══════════════════════════ SMART TOOLS ══════════════════════════ */}
      <FadeReveal distance={50} threshold={0.05}>
        <section className="py-16 px-6 md:px-10 bg-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-0 mb-10">
            <div className="flex items-center gap-3 pr-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 shadow-inner border border-zinc-800 flex items-center justify-center shrink-0">
                <Wrench size={16} className="text-zinc-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-100">Smart Tools</h2>
                <p className="text-sm text-zinc-500 font-medium mt-0.5">No installs, no sign-up — runs entirely in your browser.</p>
              </div>
            </div>
            <Link
              href="/tools"
              className="btn-pan shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full border border-zinc-800 text-xs font-semibold"
              style={{ "--btn-bg": "transparent" } as React.CSSProperties}
            >
              <span className="flex items-center gap-2">
                All Tools <ArrowRight size={14} />
              </span>
            </Link>
          </div>
          <HomeToolsGrid />
        </section>
      </FadeReveal>

      {/* ══════════════════════════ WHY ASSETNEST ══════════════════════════ */}
      <FadeReveal distance={60}>
        <section className="py-20 px-6 md:px-10 bg-black relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.03]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-5">
                <Star size={11} className="text-white" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Why AssetNest</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                Built different.{" "}
                <span className="gradient-text-silver">Designed for you.</span>
              </h2>
              <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
                We believe powerful tools should be accessible, private, and beautiful — all at the same time.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {whyCards.map((card, i) => (
                <div key={card.title} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] flex">
                  <WhyCard {...card} index={i} />
                </div>
              ))}
            </div>

            <div className="mt-14 flex flex-col items-center gap-4">
              <p className="text-xs font-semibold text-zinc-600 tracking-widest uppercase">Ready to start?</p>
              <Link
                href="/tools"
                className="btn-pan px-8 py-4 text-sm font-black uppercase tracking-widest rounded-full active:scale-95 transition-all duration-200 shadow-2xl shadow-white/10 group"
                style={{ "--btn-bg": "#000" } as React.CSSProperties}
              >
                <span className="flex items-center gap-3">
                  Explore All Tools <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </FadeReveal>
    </div>
  );
}
