"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    Upload, Download, ImageIcon, Zap, X, RefreshCw,
    Scissors, AlertTriangle, Info, Maximize2, Check,
    Shield, Sparkles, Cpu, Eye, HelpCircle
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image Compressor",
    description: "Compress JPEG, PNG, and WebP images instantly in your browser. Reduce image file size with zero quality loss. No uploads, 100% private, completely free.",
    url: "https://www.assetnest.space/tools/image-compressor",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* ─────────────────────────────────────────
   DESIGN TOKENS (Obsidian & Emerald Theme)
   ───────────────────────────────────────── */
const T = {
    bg: "#080809",
    surface: "#101012",
    surfaceHi: "#161618",
    surfaceHov: "#1c1c1f",
    border: "rgba(255,255,255,0.055)",
    borderHover: "rgba(255,255,255,0.12)",
    accent: "#10b981", // Emerald green
    accentDim: "rgba(16,185,129,0.10)",
    accentGlow: "rgba(16,185,129,0.22)",
    textPri: "#f0eff5",
    textSec: "#8b8a97",
    muted: "#42414d",
    radius: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
};

export default function ImageCompressorPage() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [compressedDims, setCompressedDims] = useState<{ w: number; h: number } | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [quality, setQuality] = useState<number>(75);
    const [maxDim, setMaxDim] = useState<number>(1920);
    const [outputFormat, setOutputFormat] = useState<string>("image/jpeg");
    const [isCompressing, setIsCompressing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hasCompressed, setHasCompressed] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Draggable Split Slider states
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isSliderDragging, setIsSliderDragging] = useState(false);
    const [viewMode, setViewMode] = useState<"split" | "side-by-side" | "original" | "compressed">("side-by-side");
    const sliderContainerRef = useRef<HTMLDivElement>(null);

    // Lightbox modal states
    const [lightbox, setLightbox] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>("");

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getSavings = () => {
        if (!originalSize || !compressedSize) return 0;
        return Math.round(((originalSize - compressedSize) / originalSize) * 100);
    };

    /**
     * Core compression:
     *  1. Scale image down to `maxDim` (longest side) if it exceeds that limit.
     *  2. For JPEG/WebP: apply quality parameter (actual lossy compression).
     *  3. For PNG: quality is ignored by browsers (PNG is lossless),
     *     so only the resize matters — we warn the user if no reduction occurred.
     *  4. Pre-fill white background for JPEG to avoid inflating due to alpha channel.
     */
    const compress = useCallback(
        (file: File, q: number, format: string, dim: number) => {
            setIsCompressing(true);
            setHasCompressed(false);

            // Intentional 800ms buffer so the UX feels deliberate
            setTimeout(() => {
                const objectUrl = URL.createObjectURL(file);
                const img = new Image();

                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);

                    // ── 1. Compute target dimensions ──
                    let { naturalWidth: w, naturalHeight: h } = img;
                    if (w > dim || h > dim) {
                        if (w >= h) { h = Math.round(h * (dim / w)); w = dim; }
                        else { w = Math.round(w * (dim / h)); h = dim; }
                    }

                    // ── 2. Draw to canvas ──
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d")!;

                    // Fill white only for JPEG so alpha pixels don't become black blobs
                    if (format === "image/jpeg") {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.drawImage(img, 0, 0, w, h);

                    // ── 3. Encode ──
                    const qualityArg = format === "image/png" ? undefined : q / 100;

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                if (compressedUrl) URL.revokeObjectURL(compressedUrl);
                                const url = URL.createObjectURL(blob);
                                setCompressedUrl(url);
                                setCompressedSize(blob.size);
                                setCompressedDims({ w, h });
                                setHasCompressed(true);
                            }
                            setIsCompressing(false);
                        },
                        format,
                        qualityArg,
                    );
                };

                img.onerror = () => setIsCompressing(false);
                img.src = objectUrl;
            }, 800);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [compressedUrl],
    );

    const loadFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;

        setOriginalFile(file);
        setOriginalSize(file.size);
        setCompressedUrl(null);
        setCompressedSize(0);
        setCompressedDims(null);
        setHasCompressed(false);

        // Read preview + original dimensions
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            setOriginalPreview(src);
            const img = new Image();
            img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = src;
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    };

    const handleDownload = () => {
        if (!compressedUrl || !originalFile) return;
        const ext = outputFormat === "image/jpeg" ? "jpg" : outputFormat.split("/")[1];
        const name = `${originalFile.name.replace(/\.[^.]+$/, "")}_compressed.${ext}`;
        const a = document.createElement("a");
        a.href = compressedUrl;
        a.download = name;
        a.click();

        // Trigger global celebration popper & thank you modal!
        window.dispatchEvent(new CustomEvent("assetnest-download", {
            detail: {
                filename: name,
                size: formatBytes(compressedSize)
            }
        }));
    };

    const reset = () => {
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        setOriginalFile(null); setOriginalPreview(null); setOriginalDims(null);
        setCompressedUrl(null); setOriginalSize(0);
        setCompressedSize(0); setCompressedDims(null); setHasCompressed(false);
        setSliderPosition(50);
        setViewMode("side-by-side");
    };

    // Split slider mouse/touch tracking
    const handleSliderMove = useCallback((clientX: number) => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(pos);
    }, []);

    const handleMouseDown = () => setIsSliderDragging(true);
    const handleTouchStart = () => setIsSliderDragging(true);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsSliderDragging(false);
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isSliderDragging) return;
            handleSliderMove(e.clientX);
        };
        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!isSliderDragging) return;
            if (e.touches[0]) {
                handleSliderMove(e.touches[0].clientX);
            }
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);
        window.addEventListener("touchend", handleGlobalMouseUp);
        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("touchmove", handleGlobalTouchMove);

        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            window.removeEventListener("touchend", handleGlobalMouseUp);
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            window.removeEventListener("touchmove", handleGlobalTouchMove);
        };
    }, [isSliderDragging, handleSliderMove]);

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%2318181b'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%2318181b'/%3E%3C/svg%3E")`;
    const savings = getSavings();

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10 max-w-6xl mx-auto">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header */}
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 mb-5 relative group">
                    <Zap size={11} className="text-[#f0ede8]" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Free Tool</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-[#f0ede8] transition-all shadow-xl"
                        title="What is this?"
                    >
                        <HelpCircle size={10} />
                    </button>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#f0ede8] mb-3">
                    Image Compressor
                </h1>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
                    Compress JPEG, PNG, and WebP images locally in your browser. Fine-tune file weight 
                    vs image fidelity. No uploads, 100% offline, absolute privacy.
                </p>
            </div>

            {/* Initial Landing State */}
            {!originalFile && (
                <>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center min-h-[360px] border-2 border-dashed cursor-pointer transition-all duration-300 rounded-[32px] ${isDragging
                            ? "border-emerald-500 bg-emerald-500/[0.04]"
                            : "border-zinc-700 bg-[#1c1c1c]/50 hover:border-zinc-500 hover:bg-[#1e1e1e]/50"
                            }`}
                    >
                        <input
                            ref={fileInputRef} type="file"
                            accept="image/jpeg,image/png,image/webp" className="hidden"
                            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                        />
                        <div className="flex flex-col items-center gap-5 p-10 text-center">
                            <div className="w-16 h-16 bg-[#1a1a1c] border border-zinc-700 flex items-center justify-center rounded-2xl group-hover:scale-105 transition-all">
                                <Upload size={28} className="text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-[#f0ede8] font-black tracking-tight text-xl mb-2">Drag & Drop or Click Here</p>
                                <p className="text-zinc-500 text-sm font-medium">JPEG, PNG, WebP supported • No Server Upload</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold tracking-wide text-zinc-500">
                                <span className="px-2 py-1 border border-white/[0.07] flex items-center gap-1.5">
                                    <Shield size={11} className="text-emerald-400" /> 100% Private
                                </span>
                                <span className="px-2 py-1 border border-white/[0.07] flex items-center gap-1.5">
                                    <Cpu size={11} className="text-emerald-400" /> Browser-Side
                                </span>
                                <span className="px-2 py-1 border border-white/[0.07] flex items-center gap-1.5">
                                    <Sparkles size={11} className="text-amber-500" /> Free Forever
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SEO RICH TEXT SECTION */}
                    <div className="mt-16 px-6 py-14 bg-[#1c1c1c]/30 border border-white/[0.06] rounded-[28px] text-left relative overflow-hidden">
                        {/* Ambient section glows */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                            style={{
                                background: `radial-gradient(circle 250px at 0% 0%, rgba(16,185,129,0.035) 0%, transparent 100%),
                                             radial-gradient(circle 250px at 100% 100%, rgba(99,102,241,0.02) 0%, transparent 100%)`
                            }}
                        />

                        <div className="relative z-10">
                            {/* Top Badges (Lucide Icons, No Emojis) */}
                            <div className="flex justify-center gap-2.5 mb-6 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold tracking-widest text-[#f0ede8] uppercase">
                                    <Shield size={11} className="text-emerald-400 shrink-0" /> 100% Private
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                                    <Cpu size={11} className="text-emerald-400 shrink-0" /> Browser-Side
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                                    <Sparkles size={11} className="text-amber-500 shrink-0" /> No Watermarks
                                </span>
                            </div>

                            {/* Main Title & Subtitle */}
                            <div className="text-center mb-12">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#f0ede8] leading-tight mb-4">
                                    Free Image Compressor with <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">No Quality Loss</span>
                                </h2>
                                <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                                    Shrink JPEG, PNG, and WebP image sizes by up to 90% instantly inside your browser. AssetNest processes your assets 100% locally with zero server uploads, preserving pixel-perfect visual fidelity.
                                </p>
                            </div>

                            {/* Grid of Key Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
                                {[
                                    {
                                        title: "Security & Privacy First",
                                        desc: "Your data is strictly confidential. All compression happens locally inside your browser—no files are ever uploaded.",
                                        icon: <Shield size={16} />
                                    },
                                    {
                                        title: "Lightning Fast Speed",
                                        desc: "Instant file resizing and re-encoding powered by modern browser APIs with zero server latency.",
                                        icon: <Zap size={16} />
                                    },
                                    {
                                        title: "100% Free & Unlimited",
                                        desc: "No forced watermark stamps, registration prompts, or usage caps. Optimize as many images as you need.",
                                        icon: <Check size={16} />
                                    },
                                    {
                                        title: "Lossy & Lossless Lever",
                                        desc: "Fine-tune JPEG and WebP quality via sliders or scale down original dimensions to reduce weight exponentially.",
                                        icon: <Maximize2 size={16} />
                                    },
                                    {
                                        title: "Format Evolution",
                                        desc: "Convert heavy PNGs into modern WebP formats for faster page load times and standard web optimization.",
                                        icon: <RefreshCw size={16} />
                                    },
                                    {
                                        title: "Precision Capping",
                                        desc: "Restrict maximum dimensions to automatically scale down large phone photography for web-friendly shares.",
                                        icon: <Scissors size={16} />
                                    }
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4 p-5 bg-[#1c1c1c]/50 border border-white/[0.06] rounded-2xl transition-all duration-300 hover:border-zinc-500 hover:-translate-y-0.5">
                                        <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-white/[0.07] flex items-center justify-center text-emerald-400 shrink-0">
                                            {f.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-[#f0ede8] mb-1.5">{f.title}</h4>
                                            <p className="text-[12px] text-zinc-400 leading-relaxed">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* How to Timeline Section */}
                            <div className="border-t border-white/[0.06] pt-12 mb-14 text-left">
                                <h3 className="text-xl sm:text-2xl font-black text-[#f0ede8] text-center mb-8 tracking-tight">
                                    How to Compress Images Online for Free
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { step: "1", title: "Select Your Images", desc: "Drag & drop your files into the upload box or click to select files locally." },
                                        { step: "2", title: "Fine-Tune Settings", desc: "Adjust quality sliders, scale down dimensions, or pick your desired format." },
                                        { step: "3", title: "Download & Save", desc: "Click Compress, check size reduction, and download your optimized image." }
                                    ].map((item) => (
                                        <div key={item.step} className="bg-[#1c1c1c]/50 border border-white/[0.06] p-6 rounded-2xl relative">
                                            <div className="absolute -top-3 left-6 w-6 h-6 rounded-full bg-emerald-400 text-[#141414] flex items-center justify-center text-[10px] font-extrabold shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                                                {item.step}
                                            </div>
                                            <h4 className="text-sm font-bold text-[#f0ede8] mt-2 mb-2">{item.title}</h4>
                                            <p className="text-[12px] text-zinc-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Format Comparison Table Section */}
                            <div className="border-t border-white/[0.06] pt-12 mb-14 text-left">
                                <h3 className="text-xl sm:text-2xl font-black text-[#f0ede8] text-center mb-2 tracking-tight">
                                    Choosing the Right Image Format
                                </h3>
                                <p className="text-xs text-zinc-400 text-center mb-8 max-w-md mx-auto leading-relaxed">
                                    Different compression formats offer unique advantages for loading performance and visual detail.
                                </p>
                                <div className="bg-[#1c1c1c]/50 border border-white/[0.06] rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-[12.5px]">
                                            <thead>
                                                <tr className="bg-zinc-800/40 border-b border-white/[0.06]">
                                                    <th className="p-4 font-bold text-[#f0ede8]">Capability</th>
                                                    <th className="p-4 font-bold text-emerald-400">WebP (Modern)</th>
                                                    <th className="p-4 font-bold text-[#f0ede8]">JPEG (Classic)</th>
                                                    <th className="p-4 font-bold text-zinc-400">PNG (Lossless)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { cap: "Compression Efficiency", webp: "Highest (25-30% smaller than JPG)", jpeg: "High (Great size control)", png: "Low (Uncompressed files)" },
                                                    { cap: "Transparency Support", webp: "Yes (Full alpha support)", jpeg: "No (Preset white fill background)", png: "Yes (Full alpha support)" },
                                                    { cap: "Best Use Cases", webp: "Web-performance & fast pages", jpeg: "Standard photos & emails", png: "Screenshots, text art & logos" },
                                                    { cap: "Browser Compatibility", webp: "98% (Universal on modern devices)", jpeg: "100% (Universal compatibility)", png: "100% (Universal compatibility)" }
                                                ].map((row, idx) => (
                                                    <tr key={idx} className={idx < 3 ? "border-b border-white/[0.06]" : ""}>
                                                        <td className="p-4 font-bold text-[#f0ede8]">{row.cap}</td>
                                                        <td className="p-4 text-emerald-400 font-semibold">{row.webp}</td>
                                                        <td className="p-4 text-zinc-300">{row.jpeg}</td>
                                                        <td className="p-4 text-zinc-400">{row.png}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Accordion Section */}
                            <div className="border-t border-white/[0.06] pt-12 text-left">
                                <h3 className="text-xl sm:text-2xl font-black text-[#f0ede8] text-center mb-8 tracking-tight">
                                    Frequently Asked Questions
                                </h3>
                                <div className="max-w-3xl mx-auto bg-[#1c1c1c]/20 border border-white/[0.05] rounded-2xl p-4">
                                    <Accordion>
                                        <AccordionItem title="Is my data secure?">
                                            Yes. We use HTML5 Canvas APIs for local processing. Your images never touch any server, providing 100% privacy.
                                        </AccordionItem>
                                        <AccordionItem title="Which formats are supported?">
                                            We support JPEG, PNG, and WebP. You can also convert between these formats during the compression process.
                                        </AccordionItem>
                                        <AccordionItem title="Is there a file size limit?">
                                            There are no server-side limits. You can process images as large as your browser&apos;s memory allows—typically up to 50MB per file.
                                        </AccordionItem>
                                        <AccordionItem title="Will it slow down my computer?">
                                            Compression is a CPU-intensive task, but our engine is optimized to run efficiently in the background without freezing your browser.
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Active Settings & Compression Workspace Layout */}
            {originalFile && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column - Control Sidebar Card (Obsidian style) */}
                    <div className={`${hasCompressed ? "lg:col-span-5" : "lg:col-span-12 max-w-xl mx-auto w-full"} space-y-6 bg-zinc-900/50 border border-white/[0.06] rounded-[24px] p-6 relative order-2 lg:order-1 transition-all duration-300`}>
                        {/* File detail header */}
                        <div className="flex items-center justify-between p-3 bg-zinc-950/40 border border-white/[0.04] rounded-xl">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-emerald-400 shrink-0">
                                    <ImageIcon size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-[#f0ede8] truncate max-w-[130px] sm:max-w-[160px]">{originalFile.name}</p>
                                    <p className="text-[9px] text-zinc-500 font-semibold">{formatBytes(originalSize)}</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={reset} 
                                className="p-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-full text-zinc-400 hover:text-red-400 transition-all"
                                title="Remove image"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Format Selection Buttons */}
                        <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Output Format</label>
                            <div className="flex gap-2 p-1 bg-zinc-950/40 border border-white/[0.04] rounded-xl">
                                {[
                                    { id: "image/jpeg", label: "JPEG", desc: "Best for Photos" },
                                    { id: "image/webp", label: "WebP", desc: "Modern & Small" },
                                    { id: "image/png", label: "PNG", desc: "Lossless / Logo" }
                                ].map((fmt) => {
                                    const active = outputFormat === fmt.id;
                                    return (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => { setOutputFormat(fmt.id); setHasCompressed(false); }}
                                            className={`flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all ${
                                                active 
                                                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
                                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                                            }`}
                                        >
                                            <span className="text-[11px] font-bold leading-none">{fmt.label}</span>
                                            <span className={`text-[8px] mt-1 font-semibold ${active ? "text-zinc-950/80" : "text-zinc-500"}`}>
                                                {fmt.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* PNG Note */}
                        {outputFormat === "image/png" && (
                            <div className="flex items-start gap-2.5 p-3.5 border border-white/[0.06] bg-zinc-950/30 rounded-xl">
                                <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                <p className="text-[10.5px] text-zinc-400 font-medium leading-relaxed">
                                    <span className="text-[#f0ede8] font-bold">PNG is lossless</span>. Slider quality is disabled. Resize dimensions to compress PNG, or convert to <strong>WebP/JPEG</strong> for 90%+ savings.
                                </p>
                            </div>
                        )}

                        {/* Quality Slider Control */}
                        <div className={`${outputFormat === "image/png" ? "opacity-30 pointer-events-none" : ""}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Compression Quality</label>
                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">{quality}%</span>
                            </div>
                            <input 
                                type="range" 
                                min={1} 
                                max={100} 
                                value={quality}
                                onChange={(e) => { setQuality(Number(e.target.value)); setHasCompressed(false); }}
                                disabled={outputFormat === "image/png"}
                                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30" 
                            />
                            <div className="flex justify-between text-[8.5px] font-bold text-zinc-500 mt-1.5">
                                <span>Smallest File (Low Quality)</span>
                                <span>Original (100%)</span>
                            </div>
                            {/* Quality Quick Presets */}
                            <div className="flex gap-1.5 mt-3">
                                {[
                                    { label: "High Comp (40%)", val: 40 },
                                    { label: "Balanced (75%)", val: 75 },
                                    { label: "Vibrant (90%)", val: 90 }
                                ].map((preset) => (
                                    <button
                                        key={preset.val}
                                        type="button"
                                        onClick={() => { setQuality(preset.val); setHasCompressed(false); }}
                                        disabled={outputFormat === "image/png"}
                                        className={`flex-1 py-1.5 text-[9px] font-bold border rounded-lg transition-all ${
                                            quality === preset.val 
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
                                                : "bg-zinc-950/20 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.08]"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max dimensions Slider */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Maximize2 size={10} className="text-zinc-500" />
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Dimension</label>
                                </div>
                                <span className="text-[11px] font-bold text-[#f0ede8] bg-white/5 px-2 py-0.5 border border-white/10 rounded-full">{maxDim}px</span>
                            </div>
                            <input 
                                type="range" 
                                min={320} 
                                max={4096} 
                                step={64} 
                                value={maxDim}
                                onChange={(e) => { setMaxDim(Number(e.target.value)); setHasCompressed(false); }}
                                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500" 
                            />
                            <div className="flex justify-between text-[8.5px] font-bold text-zinc-500 mt-1.5">
                                <span>Fast / Tiny (320px)</span>
                                <span>Full Res (4096px)</span>
                            </div>
                            {/* Quick presets */}
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                {[
                                    { label: "Web Safe (800px)", val: 800 },
                                    { label: "HD (1280px)", val: 1280 },
                                    { label: "Full HD (1920px)", val: 1920 },
                                    { label: "4K UHD (3840px)", val: 3840 }
                                ].map((preset) => (
                                    <button
                                        key={preset.val}
                                        type="button"
                                        onClick={() => { setMaxDim(preset.val); setHasCompressed(false); }}
                                        className={`flex-1 min-w-[70px] py-1.5 text-[9px] font-bold border rounded-lg transition-all ${
                                            maxDim === preset.val 
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
                                                : "bg-zinc-950/20 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.08]"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2">
                            {!hasCompressed ? (
                                <button
                                    type="button"
                                    onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)}
                                    disabled={isCompressing}
                                    className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 text-xs font-bold tracking-wide rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                                >
                                    {isCompressing ? (
                                        <><RefreshCw size={13} className="animate-spin" /> COMPRESSING…</>
                                    ) : (
                                        <><Scissors size={13} /> COMPRESS IMAGE</>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="w-full h-11 flex items-center justify-center gap-2 bg-[#f0ede8] text-zinc-950 text-xs font-bold tracking-wide rounded-xl hover:bg-white active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
                                    >
                                        <Download size={14} /> DOWNLOAD COMPRESSED ({formatBytes(compressedSize)})
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)}
                                            disabled={isCompressing}
                                            className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-zinc-850 border border-white/[0.06] text-zinc-300 text-[10px] font-bold rounded-lg hover:text-white hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                        >
                                            <RefreshCw size={11} className={isCompressing ? "animate-spin" : ""} /> RE-COMPRESS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={reset}
                                            className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-zinc-950/40 border border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 text-[10px] font-bold rounded-lg active:scale-[0.98] transition-all"
                                        >
                                            <X size={11} /> NEW IMAGE
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Savings warnings */}
                        {hasCompressed && compressedSize > originalSize && (
                            <div className="flex items-start gap-2.5 p-3.5 border border-amber-500/20 bg-amber-500/[0.03] rounded-xl text-left">
                                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                    <span className="text-amber-400 font-bold">File size increased!</span> Re-encoding highly optimized assets can inflate sizes. Try lowering quality or converting to modern WebP format.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Visual Comparison Canvas Desk */}
                    {hasCompressed && (
                        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
                        {/* Tab Switcher Bar */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex p-1 bg-zinc-950/80 border border-white/[0.05] rounded-xl">
                                {[
                                    { id: "split", label: "Interactive Split" },
                                    { id: "side-by-side", label: "Side-by-Side" },
                                    { id: "original", label: "Original" },
                                    { id: "compressed", label: "Compressed" }
                                ].map((mode) => {
                                    const active = viewMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setViewMode(mode.id as any)}
                                            className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all ${
                                                active 
                                                    ? "bg-zinc-800 text-emerald-400" 
                                                    : "text-zinc-500 hover:text-zinc-300"
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Savings Tag */}
                            {hasCompressed && compressedSize > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/10 rounded-full text-emerald-400 text-[10px] font-extrabold tracking-wider">
                                    <Sparkles size={11} className="text-emerald-400 animate-pulse" />
                                    <span>SAVED {savings}%</span>
                                </div>
                            )}
                        </div>

                        {/* Rendering Workspace Box */}
                        <div className="relative border border-white/[0.06] bg-zinc-900/20 rounded-[28px] p-4 flex flex-col items-center justify-center min-h-[360px] md:min-h-[460px] overflow-hidden">
                            {/* Ambient green backing glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

                            {/* Floating Preview Full Trigger */}
                            {hasCompressed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const isOrig = viewMode === "original";
                                        setLightboxSrc(isOrig ? originalPreview : (compressedUrl || originalPreview));
                                        setLightboxTitle(isOrig ? `Original Image (${formatBytes(originalSize)})` : `Compressed Image (${formatBytes(compressedSize)})`);
                                        setLightbox(true);
                                    }}
                                    className="absolute top-4 right-4 z-30 p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 rounded-xl text-zinc-300 hover:text-emerald-400 transition-all flex items-center gap-1.5 shadow-2xl backdrop-blur-md"
                                    title="View Fullscreen"
                                >
                                    <Maximize2 size={12} className="shrink-0" />
                                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider hidden sm:inline">Preview Full</span>
                                </button>
                            )}

                            {/* 1. Interactive Split Slider Screen */}
                            {viewMode === "split" && (
                                <div 
                                    ref={sliderContainerRef}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    className="relative w-full h-[360px] md:h-[460px] bg-zinc-950 border border-white/[0.06] rounded-2xl overflow-hidden select-none cursor-ew-resize"
                                >
                                    {/* Transparent backing checker grid */}
                                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: CHECKER }} />

                                    {/* Background: Compressed image */}
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                                        {isCompressing ? (
                                            <div className="flex flex-col items-center gap-2 z-20">
                                                <RefreshCw className="animate-spin text-emerald-400" size={24} />
                                                <span className="text-xs font-bold text-zinc-500">Processing image...</span>
                                            </div>
                                        ) : hasCompressed && compressedUrl ? (
                                            <img 
                                                src={compressedUrl} 
                                                alt="Compressed" 
                                                className="relative z-10 w-full h-full object-contain pointer-events-none" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-zinc-600 z-20">
                                                <Scissors size={24} />
                                                <span className="text-xs font-bold text-zinc-500">Awaiting compression...</span>
                                            </div>
                                        )}
                                        <span className="absolute bottom-3 right-3 px-2 py-1 bg-zinc-950/80 border border-white/5 rounded text-[8.5px] font-bold text-emerald-400 tracking-wider z-20">COMPRESSED</span>
                                    </div>

                                    {/* Foreground: Original clipped image */}
                                    {originalPreview && (
                                        <div 
                                            className="absolute inset-0 w-full h-full flex items-center justify-center p-2 select-none z-10"
                                            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                                        >
                                            <img 
                                                src={originalPreview} 
                                                alt="Original" 
                                                className="relative z-10 w-full h-full object-contain pointer-events-none" 
                                            />
                                            <span className="absolute bottom-3 left-3 px-2 py-1 bg-zinc-950/80 border border-white/5 rounded text-[8.5px] font-bold text-zinc-400 tracking-wider z-20">ORIGINAL</span>
                                        </div>
                                    )}

                                    {/* Slider divider line and grip control */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-[1.5px] bg-emerald-400 z-10"
                                        style={{ left: `${sliderPosition}%` }}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 border-2 border-emerald-400 flex items-center justify-center shadow-2xl text-emerald-400 cursor-ew-resize hover:scale-110 active:scale-95 transition-all z-20">
                                            <div className="flex gap-[2px]">
                                                <span className="w-[1.5px] h-2.5 bg-emerald-400/80 rounded-full" />
                                                <span className="w-[1.5px] h-2.5 bg-emerald-400/80 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Side by Side side layouts */}
                            {viewMode === "side-by-side" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                                    {/* Original Card */}
                                    <div className="border border-white/[0.05] bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] bg-zinc-900/30">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Original</span>
                                            <span className="text-[10px] font-bold text-zinc-400">{formatBytes(originalSize)}</span>
                                        </div>
                                        <div className="flex-1 p-4 flex items-center justify-center min-h-[220px] relative">
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: CHECKER }} />
                                            {originalPreview && (
                                                <img 
                                                    src={originalPreview} 
                                                    alt="Original" 
                                                    onClick={() => {
                                                        setLightboxSrc(originalPreview);
                                                        setLightboxTitle(`Original Image (${formatBytes(originalSize)})`);
                                                        setLightbox(true);
                                                    }}
                                                    className="max-h-[220px] max-w-full object-contain relative z-10 cursor-zoom-in" 
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Compressed Card */}
                                    <div className="border border-white/[0.05] bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] bg-zinc-900/30">
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Compressed</span>
                                            <div className="flex items-center gap-1.5">
                                                {hasCompressed && (
                                                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 border border-emerald-500/20 rounded">-{savings}%</span>
                                                )}
                                                <span className="text-[10px] font-bold text-[#f0ede8]">{hasCompressed ? formatBytes(compressedSize) : "—"}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 flex items-center justify-center min-h-[220px] relative">
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: CHECKER }} />
                                            {isCompressing ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCw className="animate-spin text-emerald-400" size={16} />
                                                    <span className="text-[10px] text-zinc-500 font-bold">Compressing...</span>
                                                </div>
                                            ) : hasCompressed && compressedUrl ? (
                                                <img 
                                                    src={compressedUrl} 
                                                    alt="Compressed" 
                                                    onClick={() => {
                                                        setLightboxSrc(compressedUrl);
                                                        setLightboxTitle(`Compressed Image (${formatBytes(compressedSize)})`);
                                                        setLightbox(true);
                                                    }}
                                                    className="max-h-[220px] max-w-full object-contain relative z-10 cursor-zoom-in" 
                                                />
                                            ) : (
                                                <span className="text-[10px] text-zinc-600 font-bold">Awaiting Compression</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Original fullscreen */}
                            {viewMode === "original" && (
                                <div className="relative w-full h-[360px] md:h-[460px] border border-white/[0.05] bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: CHECKER }} />
                                    {originalPreview && (
                                        <img 
                                            src={originalPreview} 
                                            alt="Original" 
                                            onClick={() => {
                                                setLightboxSrc(originalPreview);
                                                setLightboxTitle(`Original Image (${formatBytes(originalSize)})`);
                                                setLightbox(true);
                                            }}
                                            className="max-h-[400px] max-w-full object-contain relative z-10 cursor-zoom-in" 
                                        />
                                    )}
                                    <span className="absolute bottom-3 left-3 px-2 py-1 bg-zinc-950/80 border border-white/5 rounded text-[9px] font-bold text-zinc-450 uppercase tracking-wider z-20">Original • {formatBytes(originalSize)}</span>
                                </div>
                            )}

                            {/* 4. Compressed fullscreen */}
                            {viewMode === "compressed" && (
                                <div className="relative w-full h-[360px] md:h-[460px] border border-white/[0.05] bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: CHECKER }} />
                                    {isCompressing ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin text-emerald-400" size={24} />
                                            <span className="text-xs font-bold text-zinc-500">Processing...</span>
                                        </div>
                                    ) : hasCompressed && compressedUrl ? (
                                        <img 
                                            src={compressedUrl} 
                                            alt="Compressed" 
                                            onClick={() => {
                                                setLightboxSrc(compressedUrl);
                                                setLightboxTitle(`Compressed Image (${formatBytes(compressedSize)})`);
                                                setLightbox(true);
                                            }}
                                            className="max-h-[400px] max-w-full object-contain relative z-10 cursor-zoom-in" 
                                        />
                                    ) : (
                                        <span className="text-xs text-zinc-500 font-bold">Awaiting compression...</span>
                                    )}
                                    <span className="absolute bottom-3 left-3 px-2 py-1 bg-zinc-950/80 border border-white/5 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-wider z-20">Compressed • {hasCompressed ? formatBytes(compressedSize) : "—"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            )}

            {/* Premium FAQ Help Modal */}
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Ultra-Efficient Optimization"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                            Ultra-Efficient Image Minification
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Optimize your digital footprint with the AssetNest <strong>Professional Image Compressor</strong>. High-resolution photography shouldn&apos;t compromise your website&apos;s performance. Our browser-native engine allows you to shrink JPEG, PNG, and WebP assets by up to 90% without losing the visual clarity your audience expects. By processing every pixel locally, we ensure your high-value creative assets stay secure while achieving industry-leading compression ratios for faster load times and better SEO.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6 flex items-center gap-2">
                                <Scissors size={20} className="text-emerald-400 shrink-0" />
                                Smart Optimization
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-emerald-400" /></div>
                                    <span><strong>Targeted quality:</strong> Fine-tune the balance between file size and visual fidelity with our precision quality slider.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-emerald-400" /></div>
                                    <span><strong>Dimension Capping:</strong> Massive camera photos are often larger than needed. Cap the width or height to reduce weight exponentially.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-emerald-400" /></div>
                                    <span><strong>Format Evolution:</strong> Instantly convert heavy PNGs into modern WebP containers for the ultimate web-ready performance.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6 flex items-center gap-2">
                                <Zap size={20} className="text-emerald-400 shrink-0" />
                                Pro Compression Tips
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-black text-[#f0ede8] uppercase tracking-widest text-emerald-400">Sweet Spot</p>
                                    <p className="text-xs text-zinc-500 mt-1">Aim for 70-80% quality. It typically cuts file size in half with zero visible artifacts.</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-black text-[#f0ede8] uppercase tracking-widest text-emerald-400">WebP Advantage</p>
                                    <p className="text-xs text-zinc-500 mt-1">WebP files are consistently 25-30% smaller JPEGs at equivalent visual quality.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] border-t border-white/[0.05] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="Is my data secure?">
                                Yes. We use HTML5 Canvas APIs for local processing. Your images never touch any server, providing 100% privacy.
                            </AccordionItem>
                            <AccordionItem title="Which formats are supported?">
                                We support JPEG, PNG, and WebP. You can also convert between these formats during the compression process.
                            </AccordionItem>
                            <AccordionItem title="Is there a file size limit?">
                                There are no server-side limits. You can process images as large as your browser&apos;s memory allows—typically up to 50MB per file.
                            </AccordionItem>
                            <AccordionItem title="Will it slow down my computer?">
                                Compression is a CPU-intensive task, but our engine is optimized to run efficiently in the background without freezing your browser.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            {/* ─── LIGHTBOX MODAL ─── */}
            {lightbox && lightboxSrc && (
                <div 
                    onClick={() => setLightbox(false)} 
                    className="fixed inset-0 z-[200] bg-zinc-950/98 backdrop-blur-2xl flex flex-col justify-between p-6 select-none animate-fade-in"
                >
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                    `}</style>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between w-full max-w-5xl mx-auto z-20">
                        <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">Asset Nest Preview</span>
                            <h3 className="text-sm font-extrabold text-[#f0eff5] tracking-tight">{lightboxTitle || originalFile?.name}</h3>
                        </div>
                        <button 
                            onClick={() => setLightbox(false)} 
                            className="p-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all shadow-xl"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    {/* Main Image View (Rendered directly, no backing container frame!) */}
                    <div 
                        onClick={() => setLightbox(false)}
                        className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center my-6 min-h-0 relative z-10"
                    >
                        <img 
                            src={lightboxSrc} 
                            alt="Fullscreen Preview" 
                            onClick={e => e.stopPropagation()}
                            className="max-h-[70vh] md:max-h-[75vh] max-w-full object-contain rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] cursor-default" 
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 justify-center w-full max-w-5xl mx-auto z-20">
                        <button
                            onClick={handleDownload}
                            className="px-6 h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold tracking-wide rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all active:scale-[0.97]"
                        >
                            <Download size={14} /> DOWNLOAD COMPRESSED ({formatBytes(compressedSize)})
                        </button>
                        <button
                            onClick={() => setLightbox(false)}
                            className="px-6 h-11 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-extrabold tracking-wide rounded-xl flex items-center justify-center transition-all active:scale-[0.97]"
                        >
                            CLOSE PREVIEW
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
