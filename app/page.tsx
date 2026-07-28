"use client";

import Link from "next/link";
import {
  Sparkles, Wrench, ArrowRight, Shield, Zap,
  Lock, Globe, Star, Play, Crown, Keyboard,
  Palette, Shapes, Images, QrCode,
  FileImage, Crop, Eraser, NotebookPen, ScanLine, PenTool
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import FadeReveal from "@/components/FadeReveal";
import AdBanner from "@/components/AdBanner";



// ── Why card ──────────────────────────────────────────────────────────────────
function WhyCard({ icon: Icon, title, desc, index, image }: { icon: any; title: string; desc: string; accent: string; index: number; image?: string }) {
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
        background: image ? "#141414" : "#ffffff", 
        border: image ? "none" : "1px solid rgba(0,0,0,0.05)",
      }}
      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 w-full shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-h-[220px] flex flex-col group justify-between"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-transform duration-500 ease-out"
          style={{
            transform: hovered ? "scale(1.08)" : "scale(1.02)",
          }}
        />
      )}
      <div className="relative z-10 flex flex-col h-full justify-between w-full">
        {!image && (
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 transition-all duration-300"
            style={{ border: "1px solid rgba(113,56,29,0.12)", background: "rgba(113,56,29,0.02)" }}>
            <Icon size={18} style={{ color: "#39ae66" }} />
          </div>
        )}
        <div className={image ? "mt-auto" : ""}>
          <h3 className="text-sm font-bold mb-2 tracking-tight transition-colors duration-300" style={{ color: image ? "#ffffff" : "#71381d" }}>
            {title}
          </h3>
          <p className="text-xs leading-relaxed font-medium transition-colors duration-300" style={{ color: image ? "rgba(255,255,255,0.75)" : "#71381d" }}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Vertical Highlight List (right-side, Magnific style) ──────────────────────
function VerticalHighlightList() {
  const items = [
    { name: "Background Remover", desc: "Instantly erase image backgrounds in-browser", href: "/tools/bg-remover" },
    { name: "PDF Merger", desc: "Combine multiple PDF documents securely", href: "/tools/pdf-merger" },
    { name: "QR Code Generator", desc: "Create stylized, branded QR codes", href: "/tools/qr" },
    { name: "Smart Notes Pad", desc: "Markdown-ready notes stored in your browser", href: "/tools/notes" },
    { name: "AI Image Prompts", desc: "Curated prompting guides for Midjourney & DALL-E", href: "/prompts" },
    { name: "Intelligent PDF Splitter", desc: "Extract specific pages from any PDF document", href: "/tools/pdf-splitter" },
    { name: "Smart PDF Signer", desc: "Sign documents professionally and securely online", href: "/tools/pdf-signer" },
    { name: "Kanban Board", desc: "Track tasks privately with drag-and-drop workflow", href: "/tools/kanban" },
    { name: "Pomodoro Timer", desc: "Deep work focus timer with hydration reminders", href: "/tools/pomodoro" },
    { name: "Typing Speed Tester", desc: "Challenge and improve your words-per-minute speed", href: "/tools/typing-tester" },
  ];

  const N = items.length;
  const spacing = 60; // Exact 60px height per item as specified

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full h-full flex items-center overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)",
      }}
    >
      {/* Arrow pointer — vibrant green triangle shifted 120px to the right */}
      <div className="absolute left-[120px] top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center">
        <span
          className="w-0 h-0"
          style={{
            borderTop: "12px solid transparent",
            borderBottom: "12px solid transparent",
            borderLeft: "19px solid #39ae66",
          }}
        />
      </div>

      {/* Scrolling List Container — shifted 120px to the right to maintain perfect visual gap */}
      <div className="w-full h-full relative">
        <div className="absolute inset-y-0 left-[144px] right-0">
          {items.map((item, idx) => {
            const diff = ((idx - activeIndex) % N + N) % N;
            const adjustedDiff = diff > N / 2 ? diff - N : diff;
            const isActive = idx === (activeIndex % N);
            const isNear = Math.abs(adjustedDiff) === 1;
            const isMid = Math.abs(adjustedDiff) === 2;
            const isFar = Math.abs(adjustedDiff) === 3;
            
            // Reduced opacities for non-pointed names to enhance focus on active item
            const opacity = isActive
              ? 1
              : isNear
              ? 0.20
              : isMid
              ? 0.08
              : isFar
              ? 0.03
              : 0;

            // When an item wraps from the top (-4) to the bottom (+4), its adjustedDiff becomes 4.
            // By disabling transition at the wrap boundary, it teleports instantly under the fade mask
            // instead of sliding across the center of the list and overlapping other texts.
            const isWrapping = adjustedDiff === Math.floor(N / 2);

            return (
              <Link
                key={`${item.name}-${idx}`}
                href={item.href}
                className="absolute left-0 w-full h-[60px] flex items-center select-none cursor-pointer group"
                style={{
                  top: "50%",
                  transform: `translateY(-50%) translateY(${adjustedDiff * spacing}px)`,
                  opacity: opacity,
                  paddingLeft: "20px", // Generates a perfect stable gap with the play pointer
                  transition: isWrapping
                    ? "none"
                    : "opacity 700ms ease, transform 700ms cubic-bezier(0.25, 1, 0.5, 1)",
                  pointerEvents: opacity > 0.05 ? "auto" : "none",
                }}
              >
                <span
                  className="text-2xl md:text-3xl font-black tracking-tight leading-none whitespace-nowrap transition-all duration-200 group-hover:text-[#39ae66] group-hover:translate-x-1.5 inline-block"
                  style={{ color: "#ffffff" }}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Responsive Image helper component ─────────────────────────────────────────
function ResponsiveImage({
  desktopSrc,
  mobileSrc,
  alt,
  className = "absolute inset-0 w-full h-full object-cover z-0 pointer-events-none",
  style = {}
}: {
  desktopSrc: string;
  mobileSrc?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [useMobile, setUseMobile] = useState(false);
  const [mobileError, setMobileError] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setUseMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const src = (mobileSrc && useMobile && !mobileError) ? mobileSrc : desktopSrc;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (src === mobileSrc) {
          setMobileError(true);
        }
      }}
    />
  );
}

// ── Bento Grid Section ────────────────────────────────────────────────────────
function BentoGridSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3.5">
        {/* ── Card 1: Every tool, ready to go (mobile 2x2 equal dimensions) ── */}
        <div
          className="rounded-3xl p-5 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] col-span-1 h-[220px]"
          style={{
            background: "#f0ede8",
          }}
        >
          <div className="relative z-10">
            <h3 className="text-sm font-extrabold tracking-tight mb-2 leading-tight" style={{ color: "#ffffff" }}>
              Every tool, ready to go
            </h3>
          </div>
          <ResponsiveImage
            desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/layout1-1785231434599.webp"
            mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/layout1mobile-1785231437442.webp"
            alt="Every tool layout"
          />
        </div>

        {/* ── Card 2: Your entire workflow (mobile 2x2 equal dimensions) ── */}
        <div
          className="rounded-3xl p-5 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] col-span-1 h-[220px]"
          style={{
            background: "linear-gradient(135deg, #0f0f1a 0%, #1a1028 40%, #0d0d15 100%)",
          }}
        >
          <div className="relative z-10">
            <h3 className="text-sm font-extrabold tracking-tight mb-2 leading-tight" style={{ color: "#ffffff" }}>
              Your entire workflow<br />in one powerful browser
            </h3>
          </div>
          <ResponsiveImage
            desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card2-1785231440382.webp"
            mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card2mobile-1785231443300.webp"
            alt="Workflow layout"
          />
        </div>

        {/* ── Card 3: One place, every tool (mobile 2x2 equal dimensions) ── */}
        <div
          className="rounded-3xl p-5 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] col-span-1 h-[220px]"
          style={{
            background: "linear-gradient(160deg, #0d2520 0%, #122a24 50%, #0a1f1a 100%)",
          }}
        >
          <div className="relative z-10 max-w-[200px]">
            <h3 
              className="text-sm font-extrabold tracking-tight mb-2 leading-tight" 
              style={{ 
                textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9)" 
              }}
            >
              <span style={{ color: "#ffffff" }}>One place,</span>
              <br />
              <span style={{ color: "#4ade80" }}>every tool</span>
            </h3>
          </div>
          <ResponsiveImage
            desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card3-1785231445838.webp"
            mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card3mobile-1785231448689.webp"
            alt="One place layout"
          />
        </div>

        {/* ── Card 4: Instant, no sign-up (mobile 2x2 equal dimensions) ── */}
        <div
          className="rounded-3xl p-5 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] col-span-1 h-[220px]"
          style={{
            background: "#3a9dd2",
          }}
        >
          <div className="relative z-10 max-w-[200px]">
            <h3 
              className="text-sm font-extrabold tracking-tight mb-2 leading-tight" 
              style={{ color: "#0c2540" }}
            >
              <span style={{ color: "#ffffff" }}>Instant,</span><br />
              no sign-up
            </h3>
          </div>
          <ResponsiveImage
            desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card4-1785231451811.webp"
            mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card4mobile-1785231454514.webp"
            alt="Instant layout"
          />
        </div>
      </div>
    );
  }

  // ── Desktop Layout: 100% Identical to the Original Styling ──
  return (
    <div
      className="grid gap-4 md:gap-5"
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      {/* ── Card 1: Every tool, ready to go (left, spans both rows) ── */}
      <div
        className="rounded-3xl p-7 md:p-9 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        style={{
          gridColumn: "span 4",
          gridRow: "span 2",
          background: "#f0ede8",
        }}
      >
        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight mb-3" style={{ color: "#ffffff" }}>
            Every tool, ready to go
          </h3>
          <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255, 255, 255, 0.75)" }}>
            Every tool, ready to go. Images, PDFs, design, productivity—34 tools, no setup.{" "}
            <span style={{ color: "#ffffff", textDecoration: "underline", textUnderlineOffset: "3px" }}>Open what you need</span>,{" "}
            make what you want.
          </p>
        </div>
        <ResponsiveImage
          desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/layout1-1785231434599.webp"
          mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/layout1mobile-1785231437442.webp"
          alt="Every tool layout"
        />
      </div>

      {/* ── Card 2: Your entire workflow (top-right) ── */}
      <div
        className="rounded-3xl p-7 md:p-9 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
        style={{
          gridColumn: "span 8",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1028 40%, #0d0d15 100%)",
          minHeight: "320px",
        }}
      >
        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight mb-3" style={{ color: "#ffffff" }}>
            Your entire workflow<br />in one powerful browser
          </h3>
        </div>
        <ResponsiveImage
          desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card2-1785231440382.webp"
          mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card2mobile-1785231443300.webp"
          alt="Workflow layout"
        />
      </div>

      {/* ── Card 3: One place, every tool (bottom-center) ── */}
      <div
        className="rounded-3xl p-7 md:p-9 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        style={{
          gridColumn: "span 4",
          background: "linear-gradient(160deg, #0d2520 0%, #122a24 50%, #0a1f1a 100%)",
          minHeight: "280px",
        }}
      >
        <div className="relative z-10 max-w-[200px]">
          <h3 
            className="text-lg md:text-xl font-extrabold tracking-tight mb-3 leading-tight" 
            style={{ 
              textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9)" 
            }}
          >
            <span style={{ color: "#ffffff" }}>One place,</span>
            <br />
            <span style={{ color: "#4ade80" }}>every tool</span>
          </h3>
        </div>
        <ResponsiveImage
          desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card3-1785231445838.webp"
          mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card3mobile-1785231448689.webp"
          alt="One place layout"
        />
      </div>

      {/* ── Card 4: Instant, no sign-up (bottom-right) ── */}
      <div
        className="rounded-3xl p-7 md:p-9 flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
        style={{
          gridColumn: "span 4",
          background: "#3a9dd2",
          minHeight: "280px",
        }}
      >
        <div className="relative z-10 max-w-[200px]">
          <h3 
            className="text-lg md:text-xl font-extrabold tracking-tight mb-3 leading-tight" 
            style={{ color: "#0c2540" }}
          >
            <span style={{ color: "#ffffff" }}>Instant,</span><br />
            no sign-up
          </h3>
        </div>
        <ResponsiveImage
          desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card4-1785231451811.webp"
          mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/card4mobile-1785231454514.webp"
          alt="Instant layout"
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const creativeTools = [
    { name: "AI Image Prompts", href: "/prompts", icon: Sparkles, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/aiimageprompts-1785231457182.webp" },
    { name: "Background Remover", href: "/tools/bg-remover", icon: Eraser, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/background-remover-1785231262173.webp" },
    { name: "Image Compressor", href: "/tools/image-compressor", icon: FileImage, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/imagecompressor-1785231257266.webp" },
    { name: "Smart PDF Signer", href: "/tools/pdf-signer", icon: PenTool, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/smartpdfsigner-1785231254019.webp" },
    { name: "QR Code Generator", href: "/tools/qr", icon: QrCode, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/qrcode-1785231265027.webp" },
    { name: "Smart Notes", href: "/tools/notes", icon: NotebookPen, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/smartnotes-1785231310626.webp" },
    { name: "Typing Speed Tester", href: "/tools/typing-tester", icon: Keyboard, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/typingspeedtester-1785231274872.webp" },
    { name: "All tools", href: "/tools", icon: Wrench, image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/alltools-1785231459741.webp" },
  ];

  const whyCards = [
    { icon: Lock, title: "100% Private", desc: "All tools run entirely in your browser. Your files never leave your device.", accent: "#ffffff", image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/whyprivate-1785231462388.webp" },
    { icon: Zap, title: "Lightning Fast", desc: "Zero server round-trips. Instant results powered by modern browser APIs.", accent: "#ffffff", image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/whyfast-1785231465559.webp" },
    { icon: Globe, title: "No Sign-Up Needed", desc: "Jump straight in. No account, no email, no credit card. Ever.", accent: "#ffffff", image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/whynosignup-1785231468597.webp" },
    { icon: Star, title: "Premium Quality", desc: "Professional-grade tools with clean, intuitive interfaces built for creators.", accent: "#ffffff", image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/whypremium-1785231471506.webp" },
    { icon: Shield, title: "Always Free", desc: "Every tool on AssetNest is completely free — no hidden fees or paywalls.", accent: "#ffffff", image: "https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/whyfree-1785231474471.webp" },
  ];

  if (!mounted) return <div className="min-h-screen" style={{ background: "#141414" }} />;

  return (
    <div className="flex flex-col">

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section
        className="relative flex items-center min-h-[72vh] md:min-h-screen overflow-hidden"
        style={{ background: "#141414" }}
      >
        {/* ── Premium Hero Background Image ── */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            opacity: 0.60,
          }}
        >
          <ResponsiveImage
            desktopSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/herosectionimage-1785231477555.webp"
            mobileSrc="https://cdn-img.streamletedge.com/6a6874155ad7d80e5dbcdb7b/images/herosectionimagemobile-1785231480804.webp"
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>

        {/* ── Atmospheric background layers (replaces the person image) ── */}
        {/* Large soft glow — bottom right, like Magnific's warm center-right light */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "-5%",
            bottom: "-10%",
            width: "65%",
            height: "85%",
            background: "radial-gradient(ellipse at 60% 60%, rgba(240,237,232,0.055) 0%, rgba(240,237,232,0.02) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Secondary glow — upper right */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "5%",
            top: "5%",
            width: "40%",
            height: "50%",
            background: "radial-gradient(ellipse at 50% 40%, rgba(240,237,232,0.025) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Subtle grid dot texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(240,237,232,0.025) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 100%)",
          }}
        />
        {/* ── Hero content: full two-column, like Magnific ── */}
        <div
          className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-0 items-center min-h-[72vh] md:min-h-screen"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease, transform 0.9s cubic-bezier(0.23,1,0.32,1)",
          }}
        >

          {/* ── LEFT: Badge → Headline → Subtitle → Dual CTAs ── */}
          <div className="flex flex-col justify-center items-start text-left py-12 md:py-24 lg:py-0 lg:pr-8">

            {/* Badge pill — "Ranked #1" style */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-7 text-xs font-semibold tracking-wide"
              style={{
                background: "rgba(240,237,232,0.05)",
                border: "1px solid rgba(240,237,232,0.12)",
                color: "#a0a0a0",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#39ae66] animate-pulse shrink-0" />
              The #1 Free Browser Tool Platform
              <ArrowRight size={11} style={{ color: "#666" }} />
            </div>

            {/* Headline — Magnific weight and size */}
            <h1
              className="text-[1.75rem] sm:text-[2.25rem] md:text-[3rem] lg:text-[2.6rem] xl:text-[3.2rem] font-extrabold tracking-tight leading-[1.07] mb-6"
              style={{ color: "#f0ede8" }}
            >
              The smart platform to<br />
              power your best work
            </h1>

            {/* Subtitle */}
            <p
              className="text-sm sm:text-base md:text-lg max-w-[440px] mb-9 leading-relaxed font-normal"
              style={{ color: "#888" }}
            >
              Free, browser-based tools for images, PDFs, prompts, and developer workflows. No signup, no storage, 100% secure.
            </p>

            {/* Dual CTAs — Magnific layout: solid + ghost-with-icon */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Primary: solid filled */}
              <Link
                href="/tools"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 active:scale-95 hover:bg-white"
                style={{
                  background: "#f0ede8",
                  color: "#141414",
                }}
              >
                Start exploring
              </Link>

              {/* Secondary: ghost with play icon — "Why AssetNest?" */}
              <Link
                href="/about"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 active:scale-95 group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#f0ede8",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              >
                {/* Play triangle */}
                <span
                  className="w-0 h-0 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderLeft: "8px solid #f0ede8",
                  }}
                />
                Why AssetNest?
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Vertical animated feature list (Magnific style) ── */}
          <div
            className="hidden lg:flex flex-col justify-center items-start h-full"
            style={{ minHeight: "100vh" }}
          >
            <div className="w-full" style={{ height: "480px" }}>
              <VerticalHighlightList />
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════ LIGHT SECTIONS CONTAINER ══════════════════════════ */}
      <div style={{ background: "#f4f3ef" }}>
        {/* ══════════════════════════ CREATIVE TOOLS ══════════════════════════ */}
        <FadeReveal distance={15}>
          <section className="py-16 px-6 md:px-10" style={{ background: "#f4f3ef" }}>
            <div className="max-w-[1400px] mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: "#71381d" }}>
                  Pick a tool, start creating
                </h2>
                <p className="text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed" style={{ color: "#71381d", opacity: 0.85 }}>
                  Remove backgrounds, sign PDFs, compress images, and generate assets—your secure browser-based workflow.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {creativeTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      href={tool.href}
                      key={tool.name}
                      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#71381d]/10 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(113,56,29,0.08)] hover:-translate-y-1"
                    >
                      {/* Top visual preview slot (empty space for future images) */}
                      <div className="relative w-full h-44 bg-[#fbfbfa] flex items-center justify-center overflow-hidden">
                        {tool.image ? (
                          <img 
                            src={tool.image} 
                            alt={tool.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#71381d_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="text-[#71381d]/20 group-hover:scale-110 group-hover:text-[#71381d]/30 transition-all duration-500">
                              <Icon size={32} strokeWidth={1.25} />
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Bottom dark tab footer */}
                      <div className="flex items-center justify-between px-5 py-4 bg-[#141414] group-hover:bg-[#71381d] transition-colors duration-300">
                        <span className="text-sm font-bold text-white tracking-tight">{tool.name}</span>
                        <ArrowRight size={16} className="text-white transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </FadeReveal>

        {/* ── BENTO GRID ── */}
        <FadeReveal distance={15} threshold={0.05}>
          <section className="py-16 px-6 md:px-10" style={{ background: "#f4f3ef" }}>
            <div className="max-w-[1400px] mx-auto">
              {/* Bento Grid Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4" style={{ color: "#71381d" }}>
                    Start instant.<br />
                    Create without limits
                  </h2>
                  <p className="text-sm md:text-base font-medium leading-relaxed animate-fade-in" style={{ color: "#71381d", opacity: 0.80 }}>
                    From a single quick tool to your entire creative workflow, 100% free in your browser.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 bg-[#141414] hover:bg-[#222] text-white"
                  >
                    Start creating <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
              
              <BentoGridSection />
            </div>
          </section>
        </FadeReveal>

        <div className="py-8 flex justify-center">
            <AdBanner adKey="760a7d084fc3bc7a943aa9e62667abbe" width={468} height={60} />
        </div>

        {/* ══════════════════════════ WHY ASSETNEST ══════════════════════════ */}
        <FadeReveal distance={15}>
          <section className="py-20 px-6 md:px-10 relative overflow-hidden" style={{ background: "#f4f3ef" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ border: "1px solid rgba(20,20,20,0.03)" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full" style={{ border: "1px solid rgba(20,20,20,0.03)" }} />
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(20,20,20,0.05), transparent)" }} />
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(20,20,20,0.04), transparent)" }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="text-center mb-14">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                  style={{ background: "rgba(113,56,29,0.04)", border: "1px solid rgba(113,56,29,0.08)" }}
                >
                  <Star size={11} style={{ color: "#71381d" }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#71381d" }}>Why AssetNest</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ color: "#71381d" }}>
                  Built different.{" "}
                  <span style={{ color: "#71381d" }}>Designed for you.</span>
                </h2>
                <p className="text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed" style={{ color: "#71381d" }}>
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
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#71381d" }}>Ready to start?</p>
                <Link
                  href="/tools"
                  className="px-8 py-4 text-sm font-black uppercase tracking-widest rounded-full active:scale-95 transition-all duration-200 shadow-2xl group bg-[#141414] hover:bg-[#222] text-[#f4f3ef]"
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

    </div>
  );
}
