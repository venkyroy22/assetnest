"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Upload, Download, ImageIcon, Zap, X, RefreshCw,
    Scissors, AlertTriangle, Info, Maximize2, Check
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


export default function ImageCompressorPage() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [compressedDims, setCompressedDims] = useState<{ w: number; h: number } | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [quality, setQuality] = useState<number>(80);
    const [maxDim, setMaxDim] = useState<number>(1920);
    const [outputFormat, setOutputFormat] = useState<string>("image/jpeg");
    const [isCompressing, setIsCompressing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hasCompressed, setHasCompressed] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    // For PNG, quality is ignored by browsers — resize is the only lever.
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
        const a = document.createElement("a");
        a.href = compressedUrl;
        a.download = `${originalFile.name.replace(/\.[^.]+$/, "")}_compressed.${ext}`;
        a.click();
    };

    const reset = () => {
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        setOriginalFile(null); setOriginalPreview(null); setOriginalDims(null);
        setCompressedUrl(null); setOriginalSize(0);
        setCompressedSize(0); setCompressedDims(null); setHasCompressed(false);
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23222'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23222'/%3E%3C/svg%3E")`;
    const savings = getSavings();
    const increased = hasCompressed && compressedSize > originalSize;

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10 max-w-5xl mx-auto">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header */}
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5 relative group">
                    <Zap size={11} className="text-white" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Free Tool</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                        title="What is this?"
                    >
                        <Info size={10} />
                    </button>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
                    Image Compressor
                </h1>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-lg">
                    Compress JPEG, PNG, and WebP images in your browser. Resize + quality controls.
                    No server upload — 100% private.
                </p>
            </div>

            {/* ── Upload Drop Zone ── */}
            {!originalFile && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center min-h-[360px] border-2 border-dashed cursor-pointer transition-all duration-300 ${isDragging
                        ? "border-white bg-white/5"
                        : "border-zinc-700 bg-zinc-950/50 hover:border-zinc-500 hover:bg-zinc-900/50"
                        }`}
                >
                    <input
                        ref={fileInputRef} type="file"
                        accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center gap-5 p-10 text-center">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                            <Upload size={28} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold tracking-tight text-sm mb-1">Drop your image here</p>
                            <p className="text-zinc-500 text-xs font-medium">or click to browse — JPEG, PNG, WebP supported</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold tracking-wide text-zinc-500">
                            <span className="px-2 py-1 border border-zinc-800">100% Private</span>
                            <span className="px-2 py-1 border border-zinc-800">No Server Upload</span>
                            <span className="px-2 py-1 border border-zinc-800">Free Forever</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings + Compress ── */}
            {originalFile && (
                <div className="space-y-5">

                    {/* File info */}
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <ImageIcon size={16} className="text-zinc-400" />
                            <span className="text-xs font-black text-white truncate max-w-[200px]">{originalFile.name}</span>
                            <span className="text-[10px] font-semibold tracking-wider text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                                {formatBytes(originalSize)}
                            </span>
                            {originalDims && (
                                <span className="text-[10px] font-black text-zinc-600 hidden sm:inline">
                                    {originalDims.w} × {originalDims.h}px
                                </span>
                            )}
                        </div>
                        <button onClick={reset} className="text-zinc-500 hover:text-red-400 transition-colors ml-4">
                            <X size={16} />
                        </button>
                    </div>

                    {/* PNG note */}
                    {outputFormat === "image/png" && (
                        <div className="flex items-start gap-3 px-4 py-3 border border-white/20 bg-white/5">
                            <Info size={14} className="text-white mt-0.5 shrink-0" />
                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                <span className="text-white font-black">PNG is lossless</span> — browsers ignore the quality slider for PNG.
                                Resize (Max Width) is the only way to reduce PNG file size. Switch to <strong>JPEG</strong> or <strong>WebP</strong> for significant compression.
                            </p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-zinc-900/50 border border-zinc-800">

                        {/* Quality */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-semibold text-zinc-400">
                                    Quality {outputFormat === "image/png" && <span className="text-zinc-700 normal-case font-medium">(PNG: no effect)</span>}
                                </label>
                                <span className="text-xs font-black text-white">{quality}%</span>
                            </div>
                            <input type="range" min={1} max={100} value={quality}
                                onChange={(e) => { setQuality(Number(e.target.value)); setHasCompressed(false); }}
                                disabled={outputFormat === "image/png"}
                                className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-white disabled:opacity-30 disabled:cursor-not-allowed" />
                            <div className="flex justify-between text-[9px] font-bold text-zinc-600 mt-1">
                                <span>Smaller file</span><span>Better quality</span>
                            </div>
                        </div>

                        {/* Max dimension */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Maximize2 size={10} className="text-zinc-500" />
                                    <label className="text-[10px] font-semibold text-zinc-400">Max Width / Height</label>
                                </div>
                                <span className="text-xs font-black text-white">{maxDim}px</span>
                            </div>
                            <input type="range" min={320} max={4096} step={64} value={maxDim}
                                onChange={(e) => { setMaxDim(Number(e.target.value)); setHasCompressed(false); }}
                                className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-white" />
                            <div className="flex justify-between text-[9px] font-bold text-zinc-600 mt-1">
                                <span>Smaller / faster</span><span>Full resolution</span>
                            </div>
                        </div>

                        {/* Format */}
                        <div className="flex items-end gap-4">
                            <div>
                                <label className="text-[10px] font-semibold text-zinc-400 block mb-2">Output Format</label>
                                <select
                                    value={outputFormat}
                                    onChange={(e) => { setOutputFormat(e.target.value); setHasCompressed(false); }}
                                    className="bg-zinc-800 border border-zinc-700 text-white text-xs font-bold px-3 py-2.5 focus:outline-none focus:border-white cursor-pointer"
                                >
                                    <option value="image/jpeg">JPEG — best compression</option>
                                    <option value="image/webp">WebP — modern + small</option>
                                    <option value="image/png">PNG — lossless only</option>
                                </select>
                            </div>
                        </div>

                        {/* Compress button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)}
                                disabled={isCompressing}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold tracking-wide rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCompressing
                                    ? <><RefreshCw size={13} className="animate-spin" /> Compressing…</>
                                    : <><Scissors size={13} /> Compress Image</>}
                            </button>
                        </div>
                    </div>

                    {/* Increased size warning */}
                    {increased && (
                        <div className="flex items-start gap-3 px-4 py-3 border border-white/30 bg-white/5">
                            <AlertTriangle size={14} className="text-white mt-0.5 shrink-0" />
                            <div className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                <span className="text-white font-black">Output is larger than original.</span>{" "}
                                Try: switching to <strong>JPEG or WebP</strong> format, lowering quality, or reducing max width.
                                PNG files can increase in size when re-encoded if the original was already optimised.
                            </div>
                        </div>
                    )}

                    {/* Before / After */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Original */}
                        <div className="border border-zinc-800 bg-zinc-950/30">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                                <span className="text-xs font-semibold tracking-wide text-zinc-400">Original</span>
                                <div className="flex items-center gap-3">
                                    {originalDims && (
                                        <span className="text-[10px] text-zinc-600 font-medium">
                                            {originalDims.w}×{originalDims.h}
                                        </span>
                                    )}
                                    <span className="text-xs font-black text-white">{formatBytes(originalSize)}</span>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-center min-h-[250px]" style={{ background: CHECKER }}>
                                {originalPreview && (
                                    <img src={originalPreview} alt="Original" className="max-h-[250px] max-w-full object-contain" />
                                )}
                            </div>
                        </div>

                        {/* Compressed */}
                        <div className="border border-zinc-800 bg-zinc-950/30">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                                <span className="text-xs font-semibold tracking-wide text-zinc-400">Compressed</span>
                                <div className="flex items-center gap-3">
                                    {hasCompressed && compressedDims && (
                                        <span className="text-[10px] text-zinc-600 font-medium">
                                            {compressedDims.w}×{compressedDims.h}
                                        </span>
                                    )}
                                    {hasCompressed && compressedSize > 0 && (
                                        <span className={`text-[11px] font-bold tracking-wider border px-2 py-0.5 rounded-full ${savings > 0
                                            ? "text-white border-white/30 bg-white/10"
                                            : "text-white border-white/30 bg-white/10"
                                            }`}>
                                            {savings > 0 ? `-${savings}%` : "+size"}
                                        </span>
                                    )}
                                    <span className="text-xs font-black text-white">
                                        {hasCompressed ? formatBytes(compressedSize) : "—"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-center min-h-[250px]" style={{ background: CHECKER }}>
                                {isCompressing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <RefreshCw size={24} className="text-zinc-500 animate-spin" />
                                        <span className="text-xs font-semibold tracking-wide text-zinc-500">Compressing…</span>
                                    </div>
                                ) : hasCompressed && compressedUrl ? (
                                    <img src={compressedUrl} alt="Compressed" className="max-h-[250px] max-w-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-zinc-700 text-center px-6">
                                        <Scissors size={24} />
                                        <span className="text-xs font-semibold tracking-wide">
                                            Adjust settings &amp; click<br />"Compress Image"
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Download — only when we actually saved bytes */}
                    {hasCompressed && compressedUrl && !isCompressing && (
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black text-sm font-bold tracking-wide rounded-full hover:opacity-90 active:scale-[0.99] transition-all shadow-xl mt-4"
                        >
                            <Download size={16} />
                            Download ({formatBytes(compressedSize)}{savings > 0 ? ` — ${savings}% smaller` : " — same size"})
                        </button>
                    )}

                    <button onClick={reset}
                        className="w-full py-4 border border-zinc-800 rounded-full text-xs font-semibold tracking-wide text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all mt-3">
                        ← Upload a Different Image
                    </button>
                </div>
            )}

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Ultra-Efficient Optimization"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Ultra-Efficient Image Minification
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Optimize your digital footprint with the AssetNest <strong>Professional Image Compressor</strong>. High-resolution photography shouldn&apos;t compromise your website&apos;s performance. Our browser-native engine allows you to shrink JPEG, PNG, and WebP assets by up to 90% without losing the visual clarity your audience expects. By processing every pixel locally, we ensure your high-value creative assets stay secure while achieving industry-leading compression ratios for faster load times and better SEO.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Scissors size={20} className="text-zinc-500" />
                                Smart Optimization
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-zinc-500" /></div>
                                    <span><strong>Targeted quality:</strong> Fine-tune the balance between file size and visual fidelity with our precision quality slider.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-zinc-500" /></div>
                                    <span><strong>Dimension Capping:</strong> Massive camera photos are often larger than needed. Cap the width or height to reduce weight exponentially.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-zinc-500" /></div>
                                    <span><strong>Format Evolution:</strong> Instantly convert heavy PNGs into modern WebP containers for the ultimate web-ready performance.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Zap size={20} className="text-zinc-500" />
                                Pro Compression Tips
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Sweet Spot</p>
                                    <p className="text-xs text-zinc-500 mt-1">Aim for 70-80% quality. It typically cuts file size in half with zero visible artifacts.</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">WebP Advantage</p>
                                    <p className="text-xs text-zinc-500 mt-1">WebP files are consistently 25-30% smaller than JPEGs at equivalent visual quality.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Frequently Asked Questions</h3>
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
        </div>
    );
}

