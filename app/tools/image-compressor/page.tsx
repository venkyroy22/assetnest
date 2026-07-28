"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    Upload, Download, ImageIcon, Zap, X, RefreshCw,
    Scissors, AlertTriangle, Info, Maximize2, Check,
    Shield, Sparkles, Cpu, Eye, HelpCircle, ChevronDown, ArrowLeft
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import AdBanner from "@/components/AdBanner";

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

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(2px, 2px) !important;
  box-shadow: none !important;
}
`;

function LocalAccordion({ children }: { children: React.ReactNode }) {
    return <div className="space-y-4 w-full">{children}</div>;
}

interface LocalAccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function LocalAccordionItem({ title, children }: LocalAccordionItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-2 border-black rounded-2xl bg-zinc-50 overflow-hidden shadow-[3px_3px_0_#000] transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left transition-all hover:bg-zinc-100/80"
            >
                <span className="font-bold text-sm sm:text-base text-black pr-4">
                    {title}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[800px] border-t-2 border-black bg-white" : "max-h-0"
                }`}
            >
                <div className="p-5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                    {children}
                </div>
            </div>
        </div>
    );
}

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

    const compress = useCallback(
        (file: File, q: number, format: string, dim: number) => {
            setIsCompressing(true);
            setHasCompressed(false);

            setTimeout(() => {
                const objectUrl = URL.createObjectURL(file);
                const img = new Image();

                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);

                    let { naturalWidth: w, naturalHeight: h } = img;
                    if (w > dim || h > dim) {
                        if (w >= h) { h = Math.round(h * (dim / w)); w = dim; }
                        else { w = Math.round(w * (dim / h)); h = dim; }
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d")!;

                    if (format === "image/jpeg") {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.drawImage(img, 0, 0, w, h);

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

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23e4e4e7'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e4e4e7'/%3E%3C/svg%3E")`;
    const savings = getSavings();

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>
            
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0_#000] bg-emerald-500">
                        <Scissors size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Image Compressor
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <HelpCircle size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
                
                {/* Initial Landing State */}
                {!originalFile && (
                    <div className="space-y-12">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center min-h-[360px] border-2 sm:border-4 border-black cursor-pointer transition-all duration-300 rounded-[2rem] bg-white shadow-[6px_6px_0_#000] ${isDragging
                                ? "bg-emerald-50"
                                : "hover:bg-zinc-50"
                                }`}
                        >
                            <input
                                ref={fileInputRef} type="file"
                                accept="image/jpeg,image/png,image/webp" className="hidden"
                                onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-5 p-10 text-center">
                                <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center rounded-2xl shadow-[3px_3px_0_#000]">
                                    <Upload size={28} className="text-black" />
                                </div>
                                <div>
                                    <p className="text-black font-black tracking-tight text-xl mb-2 ig-display">Drag & Drop or Click Here</p>
                                    <p className="text-zinc-700 text-sm font-medium">JPEG, PNG, WebP supported • No Server Upload</p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold tracking-wide text-zinc-800">
                                    <span className="px-2 py-1 bg-white border-2 border-black rounded-lg flex items-center gap-1.5">
                                        <Shield size={11} className="text-emerald-600" /> 100% Private
                                    </span>
                                    <span className="px-2 py-1 bg-white border-2 border-black rounded-lg flex items-center gap-1.5">
                                        <Cpu size={11} className="text-blue-600" /> Browser-Side
                                    </span>
                                    <span className="px-2 py-1 bg-white border-2 border-black rounded-lg flex items-center gap-1.5">
                                        <Sparkles size={11} className="text-amber-500" /> Free Forever
                                    </span>
                                </div>
                            </div>
                        </div>


                <div className="flex justify-center py-4">
                    <AdBanner adKey="760a7d084fc3bc7a943aa9e62667abbe" width={468} height={60} />
                </div>

                        {/* SEO RICH TEXT SECTION */}
                        <div className="px-6 py-12 bg-white border-2 sm:border-4 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[8px_8px_0_#000]">
                            <div className="relative z-10">
                                <div className="flex justify-center gap-2.5 mb-6 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fde047] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                                        <Shield size={11} className="text-black shrink-0" /> 100% Private
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#a7f3d0] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                                        <Cpu size={11} className="text-black shrink-0" /> Browser-Side
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fbcfe8] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                                        <Sparkles size={11} className="text-black shrink-0" /> No Watermarks
                                    </span>
                                </div>

                                <div className="text-center mb-12">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black leading-tight mb-4 ig-display">
                                        Free Image Compressor with No Quality Loss
                                    </h2>
                                    <p className="text-sm text-zinc-700 leading-relaxed max-w-2xl mx-auto">
                                        Shrink JPEG, PNG, and WebP image sizes by up to 90% instantly inside your browser. AssetNest processes your assets 100% locally with zero server uploads, preserving pixel-perfect visual fidelity.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                                        <div key={i} className="flex gap-4 p-5 bg-zinc-50 border-2 border-black rounded-2xl shadow-[3px_3px_0_#000] hover:bg-zinc-100 transition-all">
                                            <div className="w-9 h-9 rounded-lg bg-[#a7f3d0] border-2 border-black flex items-center justify-center text-black shrink-0">
                                                {f.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-bold text-black mb-1.5 ig-display">{f.title}</h4>
                                                <p className="text-[12px] text-zinc-650 leading-relaxed">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-2 border-black pt-12 mb-12 text-left">
                                    <h3 className="text-xl sm:text-2xl font-black text-black text-center mb-8 tracking-tight ig-display">
                                        How to Compress Images Online for Free
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { step: "1", title: "Select Your Images", desc: "Drag & drop your files into the upload box or click to select files locally." },
                                            { step: "2", title: "Fine-Tune Settings", desc: "Adjust quality sliders, scale down dimensions, or pick your desired format." },
                                            { step: "3", title: "Download & Save", desc: "Click Compress, check size reduction, and download your optimized image." }
                                        ].map((item) => (
                                            <div key={item.step} className="bg-zinc-50 border-2 border-black p-6 rounded-2xl relative shadow-[3px_3px_0_#000]">
                                                <div className="absolute -top-3 left-6 w-6 h-6 rounded-full bg-[#fde047] border-2 border-black text-black flex items-center justify-center text-[10px] font-extrabold shadow-[2px_2px_0_#000]">
                                                    {item.step}
                                                </div>
                                                <h4 className="text-sm font-bold text-black mt-2 mb-2 ig-display">{item.title}</h4>
                                                <p className="text-[12px] text-zinc-650 leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t-2 border-black pt-12 mb-12 text-left">
                                    <h3 className="text-xl sm:text-2xl font-black text-black text-center mb-2 tracking-tight ig-display">
                                        Choosing the Right Image Format
                                    </h3>
                                    <p className="text-xs text-zinc-600 text-center mb-8 max-w-md mx-auto leading-relaxed">
                                        Different compression formats offer unique advantages for loading performance and visual detail.
                                    </p>
                                    <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0_#000]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-left text-[12.5px]">
                                                <thead>
                                                    <tr className="bg-zinc-100 border-b-2 border-black">
                                                        <th className="p-4 font-bold text-black">Capability</th>
                                                        <th className="p-4 font-bold text-emerald-700">WebP (Modern)</th>
                                                        <th className="p-4 font-bold text-black">JPEG (Classic)</th>
                                                        <th className="p-4 font-bold text-zinc-700">PNG (Lossless)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { cap: "Compression Efficiency", webp: "Highest (25-30% smaller than JPG)", jpeg: "High (Great size control)", png: "Low (Uncompressed files)" },
                                                        { cap: "Transparency Support", webp: "Yes (Full alpha support)", jpeg: "No (Preset white fill background)", png: "Yes (Full alpha support)" },
                                                        { cap: "Best Use Cases", webp: "Web-performance & fast pages", jpeg: "Standard photos & emails", png: "Screenshots, text art & logos" },
                                                        { cap: "Browser Compatibility", webp: "98% (Universal on modern devices)", jpeg: "100% (Universal compatibility)", png: "100% (Universal compatibility)" }
                                                    ].map((row, idx) => (
                                                        <tr key={idx} className={idx < 3 ? "border-b border-black/10" : ""}>
                                                            <td className="p-4 font-bold text-black">{row.cap}</td>
                                                            <td className="p-4 text-emerald-700 font-semibold">{row.webp}</td>
                                                            <td className="p-4 text-zinc-800">{row.jpeg}</td>
                                                            <td className="p-4 text-zinc-800">{row.png}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t-2 border-black pt-12 text-left">
                                    <h3 className="text-xl sm:text-2xl font-black text-black text-center mb-8 tracking-tight ig-display">
                                        Frequently Asked Questions
                                    </h3>
                                    <div className="max-w-3xl mx-auto">
                                        <LocalAccordion>
                                            <LocalAccordionItem title="Is my data secure?">
                                                Yes. We use HTML5 Canvas APIs for local processing. Your images never touch any server, providing 100% privacy.
                                            </LocalAccordionItem>
                                            <LocalAccordionItem title="Which formats are supported?">
                                                We support JPEG, PNG, and WebP. You can also convert between these formats during the compression process.
                                            </LocalAccordionItem>
                                            <LocalAccordionItem title="Is there a file size limit?">
                                                There are no server-side limits. You can process images as large as your browser&apos;s memory allows—typically up to 50MB per file.
                                            </LocalAccordionItem>
                                            <LocalAccordionItem title="Will it slow down my computer?">
                                                Compression is a CPU-intensive task, but our engine is optimized to run efficiently in the background without freezing your browser.
                                            </LocalAccordionItem>
                                        </LocalAccordion>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Settings & Compression Workspace Layout */}
                {originalFile && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column - Control Sidebar Card */}
                        <div className={`${hasCompressed ? "lg:col-span-5" : "lg:col-span-12 max-w-xl mx-auto w-full"} space-y-6 bg-white border-2 border-black rounded-3xl p-6 relative order-2 lg:order-1 shadow-[5px_5px_0_#000] transition-all duration-300`}>
                            {/* File detail header */}
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border-2 border-black rounded-xl">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border-2 border-black flex items-center justify-center text-black shrink-0">
                                        <ImageIcon size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-black truncate max-w-[130px] sm:max-w-[160px]">{originalFile.name}</p>
                                        <p className="text-[9px] text-zinc-500 font-semibold">{formatBytes(originalSize)}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={reset} 
                                    className="p-1.5 bg-white border-2 border-black rounded-full hover:bg-zinc-100 text-black transition-all"
                                    title="Remove image"
                                >
                                    <X size={12} />
                                </button>
                            </div>

                            {/* Format Selection Buttons */}
                            <div>
                                <label className="text-[10px] font-bold text-black uppercase tracking-wider block mb-2 ig-label">Output Format</label>
                                <div className="flex gap-2 p-1 bg-zinc-50 border-2 border-black rounded-xl">
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
                                                className={`flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border-2 transition-all ${
                                                    active 
                                                        ? "bg-[#fde047] border-black text-black font-bold shadow-[2px_2px_0_#000] translate-x-[-2px] translate-y-[-2px]" 
                                                        : "bg-white border-transparent text-zinc-600 hover:text-black"
                                                }`}
                                            >
                                                <span className="text-[11px] font-bold leading-none">{fmt.label}</span>
                                                <span className={`text-[8px] mt-1 font-semibold ${active ? "text-black/80" : "text-zinc-500"}`}>
                                                    {fmt.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PNG Note */}
                            {outputFormat === "image/png" && (
                                <div className="flex items-start gap-2.5 p-3.5 border-2 border-black bg-blue-50 rounded-xl">
                                    <Info size={14} className="text-blue-700 mt-0.5 shrink-0" />
                                    <p className="text-[10.5px] text-zinc-700 font-medium leading-relaxed">
                                        <span className="text-black font-bold">PNG is lossless</span>. Slider quality is disabled. Resize dimensions to compress PNG, or convert to <strong>WebP/JPEG</strong> for 90%+ savings.
                                    </p>
                                </div>
                            )}

                            {/* Quality Slider Control */}
                            <div className={`${outputFormat === "image/png" ? "opacity-30 pointer-events-none" : ""}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-black uppercase tracking-wider ig-label">Compression Quality</label>
                                    <span className="text-[11px] font-bold text-black bg-[#a7f3d0] border-2 border-black px-2.5 py-0.5 rounded-full">{quality}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={1} 
                                    max={100} 
                                    value={quality}
                                    onChange={(e) => { setQuality(Number(e.target.value)); setHasCompressed(false); }}
                                    disabled={outputFormat === "image/png"}
                                    className="w-full h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-30" 
                                />
                                <div className="flex justify-between text-[8.5px] font-bold text-zinc-600 mt-1.5">
                                    <span>Smallest File</span>
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
                                            className={`flex-1 py-1.5 text-[9px] font-bold border-2 rounded-lg transition-all ${
                                                quality === preset.val 
                                                    ? "bg-[#a7f3d0] border-black text-black font-bold shadow-[1.5px_1.5px_0_#000]" 
                                                    : "bg-white border-zinc-300 text-zinc-650 hover:text-black hover:border-black"
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
                                        <Maximize2 size={10} className="text-zinc-600" />
                                        <label className="text-[10px] font-bold text-black uppercase tracking-wider ig-label">Max Dimension</label>
                                    </div>
                                    <span className="text-[11px] font-bold text-black bg-zinc-100 border-2 border-black px-2.5 py-0.5 rounded-full">{maxDim}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={320} 
                                    max={4096} 
                                    step={64} 
                                    value={maxDim}
                                    onChange={(e) => { setMaxDim(Number(e.target.value)); setHasCompressed(false); }}
                                    className="w-full h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black" 
                                />
                                <div className="flex justify-between text-[8.5px] font-bold text-zinc-600 mt-1.5">
                                    <span>Fast / Tiny</span>
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
                                            className={`flex-1 min-w-[70px] py-1.5 text-[9px] font-bold border-2 rounded-lg transition-all ${
                                                maxDim === preset.val 
                                                    ? "bg-[#a7f3d0] border-black text-black font-bold shadow-[1.5px_1.5px_0_#000]" 
                                                    : "bg-white border-zinc-300 text-zinc-650 hover:text-black hover:border-black"
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
                                        className="w-full h-12 flex items-center justify-center gap-2 bg-[#fde047] border-2 border-black text-black text-xs font-bold tracking-wide rounded-xl hover:bg-yellow-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0_#000] ig-btn"
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
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-[#a7f3d0] border-2 border-black text-black text-xs font-bold tracking-wide rounded-xl hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-[3px_3px_0_#000] ig-btn"
                                        >
                                            <Download size={14} /> DOWNLOAD COMPRESSED ({formatBytes(compressedSize)})
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)}
                                                disabled={isCompressing}
                                                className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-white border-2 border-black text-black text-[10px] font-bold rounded-lg hover:bg-zinc-55 active:scale-[0.98] transition-all shadow-[2px_2px_0_#000] ig-btn"
                                            >
                                                <RefreshCw size={11} className={isCompressing ? "animate-spin" : ""} /> RE-COMPRESS
                                            </button>
                                            <button
                                                type="button"
                                                onClick={reset}
                                                className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-white border-2 border-black text-black text-[10px] font-bold rounded-lg hover:bg-zinc-55 active:scale-[0.98] transition-all shadow-[2px_2px_0_#000] ig-btn"
                                            >
                                                <X size={11} /> NEW IMAGE
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Savings warnings */}
                            {hasCompressed && compressedSize > originalSize && (
                                <div className="flex items-start gap-2.5 p-3.5 border-2 border-black bg-amber-50 rounded-xl text-left">
                                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-zinc-700 font-medium leading-relaxed">
                                        <span className="text-amber-600 font-bold">File size increased!</span> Re-encoding highly optimized assets can inflate sizes. Try lowering quality or converting to modern WebP format.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Visual Comparison Canvas Desk */}
                        {hasCompressed && (
                            <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
                                {/* Tab Switcher Bar */}
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex p-1 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0_#000]">
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
                                                            ? "bg-black text-[#fde047]" 
                                                            : "text-zinc-650 hover:text-black"
                                                    }`}
                                                >
                                                    {mode.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Savings Tag */}
                                    {hasCompressed && compressedSize > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-[#a7f3d0] rounded-full text-black text-[10px] font-extrabold tracking-wider shadow-[2px_2px_0_#000]">
                                            <Sparkles size={11} className="text-black animate-pulse" />
                                            <span>SAVED {savings}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Rendering Workspace Box */}
                                <div className="relative border-2 border-black bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center min-h-[360px] md:min-h-[460px] overflow-hidden shadow-[5px_5px_0_#000]">

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
                                            className="absolute top-4 right-4 z-30 p-2 bg-white border-2 border-black rounded-xl text-black hover:bg-zinc-100 transition-all flex items-center gap-1.5 shadow-[2px_2px_0_#000] backdrop-blur-md ig-btn"
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
                                            className="relative w-full h-[360px] md:h-[460px] bg-zinc-50 border-2 border-black rounded-2xl overflow-hidden select-none cursor-ew-resize"
                                        >
                                            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: CHECKER }} />

                                            {/* Background: Compressed image */}
                                            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                                                {isCompressing ? (
                                                    <div className="flex flex-col items-center gap-2 z-20">
                                                        <RefreshCw className="animate-spin text-black" size={24} />
                                                        <span className="text-xs font-bold text-zinc-650">Processing image...</span>
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
                                                        <span className="text-xs font-bold text-zinc-650">Awaiting compression...</span>
                                                    </div>
                                                )}
                                                <span className="absolute bottom-3 right-3 px-2 py-1 bg-white border-2 border-black rounded text-[8.5px] font-bold text-black tracking-wider z-20">COMPRESSED</span>
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
                                                    <span className="absolute bottom-3 left-3 px-2 py-1 bg-white border-2 border-black rounded text-[8.5px] font-bold text-zinc-600 tracking-wider z-20">ORIGINAL</span>
                                                </div>
                                            )}

                                            {/* Slider divider line and grip control */}
                                            <div 
                                                className="absolute top-0 bottom-0 w-[2px] bg-black z-10"
                                                style={{ left: `${sliderPosition}%` }}
                                            >
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000] text-black cursor-ew-resize hover:scale-110 active:scale-95 transition-all z-20">
                                                    <div className="flex gap-[2px]">
                                                        <span className="w-[1.5px] h-2.5 bg-black/80 rounded-full" />
                                                        <span className="w-[1.5px] h-2.5 bg-black/80 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Side by Side side layouts */}
                                    {viewMode === "side-by-side" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                                            {/* Original Card */}
                                            <div className="border-2 border-black bg-zinc-50 rounded-xl overflow-hidden flex flex-col">
                                                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-zinc-100">
                                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Original</span>
                                                    <span className="text-[10px] font-bold text-zinc-700">{formatBytes(originalSize)}</span>
                                                </div>
                                                <div className="flex-1 p-4 flex items-center justify-center min-h-[220px] relative">
                                                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: CHECKER }} />
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
                                            <div className="border-2 border-black bg-zinc-50 rounded-xl overflow-hidden flex flex-col">
                                                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-zinc-100">
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Compressed</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {hasCompressed && (
                                                            <span className="text-[9px] font-bold bg-[#a7f3d0] border border-black px-1.5 py-0.2 rounded">-{savings}%</span>
                                                        )}
                                                        <span className="text-[10px] font-bold text-black">{hasCompressed ? formatBytes(compressedSize) : "—"}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-4 flex items-center justify-center min-h-[220px] relative">
                                                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: CHECKER }} />
                                                    {isCompressing ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <RefreshCw className="animate-spin text-black" size={16} />
                                                            <span className="text-[10px] text-zinc-650 font-bold">Compressing...</span>
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
                                        <div className="relative w-full h-[360px] md:h-[460px] border-2 border-black bg-zinc-55 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: CHECKER }} />
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
                                            <span className="absolute bottom-3 left-3 px-2 py-1 bg-white border-2 border-black rounded text-[9px] font-bold text-black uppercase tracking-wider z-20">Original • {formatBytes(originalSize)}</span>
                                        </div>
                                    )}

                                    {/* 4. Compressed fullscreen */}
                                    {viewMode === "compressed" && (
                                        <div className="relative w-full h-[360px] md:h-[460px] border-2 border-black bg-zinc-55 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: CHECKER }} />
                                            {isCompressing ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCw className="animate-spin text-black" size={24} />
                                                    <span className="text-xs font-bold text-zinc-650">Processing...</span>
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
                                                <span className="text-xs text-zinc-600 font-bold">Awaiting compression...</span>
                                            )}
                                            <span className="absolute bottom-3 left-3 px-2 py-1 bg-white border-2 border-black rounded text-[9px] font-bold text-black uppercase tracking-wider z-20">Compressed • {hasCompressed ? formatBytes(compressedSize) : "—"}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Premium FAQ Help Modal */}
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Ultra-Efficient Optimization"
            >
                <div className="space-y-12 text-zinc-800 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Ultra-Efficient Image Minification
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Optimize your digital footprint with the AssetNest <strong>Professional Image Compressor</strong>. High-resolution photography shouldn&apos;t compromise your website&apos;s performance. Our browser-native engine allows you to shrink JPEG, PNG, and WebP assets by up to 90% without losing the visual clarity your audience expects. By processing every pixel locally, we ensure your high-value creative assets stay secure while achieving industry-leading compression ratios for faster load times and better SEO.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 flex items-center gap-2 ig-display">
                                <Scissors size={20} className="text-black shrink-0" />
                                Smart Optimization
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Targeted quality:</strong> Fine-tune the balance between file size and visual fidelity with our precision quality slider.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Dimension Capping:</strong> Massive camera photos are often larger than needed. Cap the width or height to reduce weight exponentially.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Format Evolution:</strong> Instantly convert heavy PNGs into modern WebP containers for the ultimate web-ready performance.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 flex items-center gap-2 ig-display">
                                <Zap size={20} className="text-black shrink-0" />
                                Pro Compression Tips
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">Sweet Spot</p>
                                    <p className="text-xs text-zinc-600 mt-1">Aim for 70-80% quality. It typically cuts file size in half with zero visible artifacts.</p>
                                </div>
                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">WebP Advantage</p>
                                    <p className="text-xs text-zinc-600 mt-1">WebP files are consistently 25-30% smaller JPEGs at equivalent visual quality.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">Frequently Asked Questions</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Is my data secure?">
                                Yes. We use HTML5 Canvas APIs for local processing. Your images never touch any server, providing 100% privacy.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Which formats are supported?">
                                We support JPEG, PNG, and WebP. You can also convert between these formats during the compression process.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Is there a file size limit?">
                                There are no server-side limits. You can process images as large as your browser&apos;s memory allows—typically up to 50MB per file.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Will it slow down my computer?">
                                Compression is a CPU-intensive task, but our engine is optimized to run efficiently in the background without freezing your browser.
                            </LocalAccordionItem>
                        </LocalAccordion>
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
                    
                    {/* Main Image View */}
                    <div 
                        onClick={() => setLightbox(false)}
                        className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center my-6 min-h-0 relative z-10"
                    >
                        <img 
                            src={lightboxSrc} 
                            alt="Fullscreen Preview" 
                            onClick={e => e.stopPropagation()}
                            className="max-h-[70vh] md:max-h-[75vh] max-w-full object-contain rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] cursor-default border-4 border-black" 
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
