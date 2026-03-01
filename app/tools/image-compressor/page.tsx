"use client";

import { useState, useRef, useCallback } from "react";
import {
    Upload, Download, ImageIcon, Zap, X, RefreshCw,
    Scissors, AlertTriangle, Info, Maximize2,
} from "lucide-react";

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

            {/* Header */}
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Free Tool</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-white mb-3">
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
                            <p className="text-white font-black uppercase tracking-widest text-sm mb-1">Drop your image here</p>
                            <p className="text-zinc-500 text-xs font-medium">or click to browse — JPEG, PNG, WebP supported</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-0.5">
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
                        <div className="flex items-start gap-3 px-4 py-3 border border-blue-500/20 bg-blue-500/5">
                            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                <span className="text-blue-400 font-black">PNG is lossless</span> — browsers ignore the quality slider for PNG.
                                Resize (Max Width) is the only way to reduce PNG file size. Switch to <strong>JPEG</strong> or <strong>WebP</strong> for significant compression.
                            </p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-zinc-900/50 border border-zinc-800">

                        {/* Quality */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Width / Height</label>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Output Format</label>
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
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCompressing
                                    ? <><RefreshCw size={13} className="animate-spin" /> Compressing…</>
                                    : <><Scissors size={13} /> Compress Image</>}
                            </button>
                        </div>
                    </div>

                    {/* Increased size warning */}
                    {increased && (
                        <div className="flex items-start gap-3 px-4 py-3 border border-amber-500/30 bg-amber-500/5">
                            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                <span className="text-amber-400 font-black">Output is larger than original.</span>{" "}
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
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Original</span>
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
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Compressed</span>
                                <div className="flex items-center gap-3">
                                    {hasCompressed && compressedDims && (
                                        <span className="text-[10px] text-zinc-600 font-medium">
                                            {compressedDims.w}×{compressedDims.h}
                                        </span>
                                    )}
                                    {hasCompressed && compressedSize > 0 && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 ${savings > 0
                                                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                                : "text-amber-400 border-amber-400/30 bg-amber-400/10"
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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Compressing…</span>
                                    </div>
                                ) : hasCompressed && compressedUrl ? (
                                    <img src={compressedUrl} alt="Compressed" className="max-h-[250px] max-w-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-zinc-700 text-center px-6">
                                        <Scissors size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
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
                            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all"
                        >
                            <Download size={16} />
                            Download ({formatBytes(compressedSize)}{savings > 0 ? ` — ${savings}% smaller` : " — same size"})
                        </button>
                    )}

                    <button onClick={reset}
                        className="w-full py-3 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-all">
                        ← Upload a Different Image
                    </button>
                </div>
            )}

            {/* Tips */}
            <div className="mt-16 pt-10 border-t border-zinc-800">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Compression Tips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: "🎯", title: "JPEG/WebP", tip: "Use quality 60–80% for photos. Best file-size reduction." },
                        { icon: "🖼️", title: "PNG files", tip: "PNG is lossless — only resize reduces size. Switch to WebP for photos." },
                        { icon: "📐", title: "Resize first", tip: "Cutting max dimension in half reduces file size by ~75%." },
                        { icon: "🔄", title: "Format swap", tip: "Converting a PNG photo to JPEG or WebP often saves 60–90%." },
                    ].map(item => (
                        <div key={item.title} className="flex gap-3 p-4 border border-zinc-800/50 bg-zinc-950/20">
                            <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{item.title}</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.tip}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
