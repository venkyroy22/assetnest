"use client";

import { useState, useCallback, useRef } from "react";
import {
    FileImage, Download, Trash2, Upload, ArrowRight,
    CheckCircle2, Image as ImageIcon, Sparkles, ShieldCheck, Check, Info, RefreshCw, ChevronDown, ArrowLeft
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type ImageFormat = "png" | "jpg" | "webp";
type ConvStatus = "idle" | "converting" | "done" | "error";

interface FileEntry {
    id: string;
    file: File;
    originalSize: number;
    preview: string;
    status: ConvStatus;
    targetFormat: ImageFormat;
    outputUrl?: string;
    outputSize?: number;
    outputName?: string;
    error?: string;
}

const FORMAT_OPTIONS: { value: ImageFormat; label: string; desc: string }[] = [
    { value: "png", label: "PNG Output", desc: "Lossless quality, transparency preserved" },
    { value: "jpg", label: "JPG Output", desc: "Great compression, maximum compatibility" },
    { value: "webp", label: "WebP Output", desc: "Next-gen web format, ultra small sizes" },
];

function fmtBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function savingPct(orig: number, out: number) {
    const pct = ((orig - out) / orig) * 100;
    return pct > 0 ? `−${pct.toFixed(1)}%` : `+${Math.abs(pct).toFixed(1)}%`;
}

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

async function convertImage(
    file: File,
    targetFormat: ImageFormat,
    quality: number,
): Promise<{ url: string; size: number; name: string }> {
    const mimeOut = targetFormat === "png" ? "image/png" : targetFormat === "jpg" ? "image/jpeg" : "image/webp";
    const extOut = targetFormat;
    const q = targetFormat === "png" ? 1 : quality / 100;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            
            if (targetFormat === "jpg" || targetFormat === "webp") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(objUrl);

            canvas.toBlob(blob => {
                if (!blob) { reject(new Error("Conversion failed")); return; }
                const url = URL.createObjectURL(blob);
                const name = file.name.replace(/\.[^.]+$/, `.${extOut}`);
                resolve({ url, size: blob.size, name });
            }, mimeOut, q);
        };
        img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("Could not load image")); };
        img.src = objUrl;
    });
}

export default function ImageConverterPage() {
    const [globalFormat, setGlobalFormat] = useState<ImageFormat>("png");
    const [quality, setQuality] = useState(85);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((incoming: File[]) => {
        const accepted = incoming.filter(f => f.type.startsWith("image/"));
        if (!accepted.length) return;
        const entries: FileEntry[] = accepted.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            originalSize: f.size,
            preview: URL.createObjectURL(f),
            status: "idle",
            targetFormat: globalFormat,
        }));
        setFiles(prev => [...prev, ...entries]);
    }, [globalFormat]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const match = prev.find(f => f.id === id);
            if (match) {
                URL.revokeObjectURL(match.preview);
                if (match.outputUrl) URL.revokeObjectURL(match.outputUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const clearAll = () => {
        files.forEach(f => {
            URL.revokeObjectURL(f.preview);
            if (f.outputUrl) URL.revokeObjectURL(f.outputUrl);
        });
        setFiles([]);
    };

    const changeGlobalFormat = (fmt: ImageFormat) => {
        setGlobalFormat(fmt);
        setFiles(prev => prev.map(f => f.status === "idle" || f.status === "error" ? { ...f, targetFormat: fmt } : f));
    };

    const changeFileTargetFormat = (id: string, fmt: ImageFormat) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: fmt, status: "idle" } : f));
    };

    const convertAll = async () => {
        const toConvert = files.filter(f => f.status === "idle" || f.status === "error");
        if (!toConvert.length) return;

        setFiles(prev => prev.map(f =>
            toConvert.some(c => c.id === f.id) ? { ...f, status: "converting" } : f
        ));

        await Promise.all(toConvert.map(async (entry) => {
            try {
                const result = await convertImage(entry.file, entry.targetFormat, quality);
                setFiles(prev => prev.map(f =>
                    f.id === entry.id
                        ? { ...f, status: "done", outputUrl: result.url, outputSize: result.size, outputName: result.name }
                        : f
                ));
            } catch (e) {
                setFiles(prev => prev.map(f =>
                    f.id === entry.id
                        ? { ...f, status: "error", error: e instanceof Error ? e.message : "Failed" }
                        : f
                ));
            }
        }));
    };

    const downloadOne = (entry: FileEntry) => {
        if (!entry.outputUrl || !entry.outputName) return;
        const a = document.createElement("a");
        a.href = entry.outputUrl;
        a.download = entry.outputName;
        a.click();
    };

    const downloadAll = () => {
        files.filter(f => f.status === "done").forEach(f => downloadOne(f));
    };

    const doneCount = files.filter(f => f.status === "done").length;
    const pendingCount = files.filter(f => f.status === "idle" || f.status === "error").length;

    const hasLossyTarget = globalFormat !== "png" || files.some(f => f.targetFormat !== "png");

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-55"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-yellow-400 border-2 border-black flex items-center justify-center text-black font-black shadow-[2.5px_2.5px_0_#000]">
                        <FileImage size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Image Converter
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <Info size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10 space-y-6">
                
                {/* ── Global Options ── */}
                <div className="border-2 border-black bg-white rounded-3xl p-6 shadow-[5px_5px_0_#000]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 ig-label">Global Conversion Target</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {FORMAT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => changeGlobalFormat(opt.value)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all duration-305 relative overflow-hidden ig-btn ${
                                    globalFormat === opt.value
                                        ? "bg-[#fde047] border-black text-black shadow-[2px_2px_0_#000]"
                                        : "bg-white border-zinc-200 text-zinc-700 hover:border-black"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-black tracking-tight ig-display">{opt.label}</span>
                                    {globalFormat === opt.value && <CheckCircle2 size={16} className="text-black shrink-0" />}
                                </div>
                                <p className={`text-[10px] leading-relaxed font-semibold ${globalFormat === opt.value ? "text-zinc-800" : "text-zinc-500"}`}>
                                    {opt.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Quality Slider (for lossy conversions) */}
                    {hasLossyTarget && (
                        <div className="mt-6 pt-6 border-t-2 border-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ig-label">Output Quality</span>
                                <span className="text-xs font-black text-black bg-[#a7f3d0] border-2 border-black px-2 py-0.5 rounded-md">{quality}%</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={105}
                                step={5}
                                value={quality}
                                onChange={e => setQuality(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                            />
                            <div className="flex justify-between text-[9px] font-semibold text-zinc-650 mt-2">
                                <span>MAX COMPRESSION</span>
                                <span>BEST QUALITY</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Drop Zone ── */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 sm:border-4 border-black border-dashed rounded-[2rem] flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer ${
                        dragging
                            ? "bg-yellow-50"
                            : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePick}
                    />
                    <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mb-6 shadow-[3px_3px_0_#000]">
                        <Upload size={24} className="text-black" />
                    </div>
                    <h2 className="text-xl font-black text-black tracking-tight mb-2 ig-display">Drag & Drop or Click Here</h2>
                    <p className="text-[10px] sm:text-xs text-zinc-600 font-medium mb-6">
                        Supports JPEG, PNG, WebP, SVG, BMP, GIF • Batch conversion supported
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                            <ShieldCheck size={10} className="text-emerald-600" />
                            <span className="text-[10px] font-semibold text-zinc-700">100% In-Browser</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                            <Sparkles size={10} className="text-purple-600" />
                            <span className="text-[10px] font-semibold text-zinc-700">Zero Server Uploads</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                            <Check size={10} className="text-blue-600" />
                            <span className="text-[10px] font-semibold text-zinc-700">Unlimited Free Files</span>
                        </div>
                    </div>
                </div>

                {/* ── Files Queue ── */}
                {files.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* Queue Header Actions */}
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-zinc-700">
                                {files.length} Image{files.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {doneCount} Converted
                            </span>
                            <div className="flex gap-2">
                                {doneCount > 1 && (
                                    <button
                                        onClick={downloadAll}
                                        className="h-9 px-4 bg-[#a7f3d0] border-2 border-black text-black rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-[2px_2px_0_#000] ig-btn"
                                    >
                                        <Download size={11} /> Download All
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="h-9 px-4 border-2 border-black bg-white text-zinc-700 hover:text-black rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[2px_2px_0_#000] ig-btn"
                                >
                                    <Trash2 size={11} /> Clear All
                                </button>
                            </div>
                        </div>

                        {/* File Cards List */}
                        <div className="space-y-3">
                            {files.map(entry => (
                                <div key={entry.id} className="border-2 border-black bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[3px_3px_0_#000]">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <img
                                            src={entry.preview}
                                            alt={entry.file.name}
                                            className="w-12 h-12 object-cover rounded-xl border-2 border-black shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-black truncate">{entry.file.name}</p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="text-[10px] text-zinc-500 font-semibold">{fmtBytes(entry.originalSize)}</span>
                                                {entry.status === "done" && entry.outputSize && (
                                                    <>
                                                        <ArrowRight size={10} className="text-zinc-650" />
                                                        <span className="text-[10px] text-black font-bold">{fmtBytes(entry.outputSize)}</span>
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-350 text-zinc-700">
                                                            {savingPct(entry.originalSize, entry.outputSize)}
                                                        </span>
                                                    </>
                                                )}
                                                {entry.status === "converting" && (
                                                    <span className="text-[10px] text-zinc-650 animate-pulse font-medium">Processing…</span>
                                                )}
                                                {entry.status === "error" && (
                                                    <span className="text-[10px] text-red-650 font-medium">{entry.error}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions & Format Config */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-zinc-200 pt-3 sm:pt-0 shrink-0">
                                        {/* Per-File Format Selector */}
                                        {entry.status !== "converting" && entry.status !== "done" && (
                                            <div className="relative">
                                                <select
                                                    value={entry.targetFormat}
                                                    onChange={e => changeFileTargetFormat(entry.id, e.target.value as ImageFormat)}
                                                    className="appearance-none bg-white border-2 border-black rounded-xl pl-3 pr-8 py-1.5 text-[10px] font-bold tracking-wider text-black uppercase focus:outline-none hover:bg-zinc-50 transition-colors cursor-pointer"
                                                >
                                                    <option value="png" className="bg-white text-black">PNG</option>
                                                    <option value="jpg" className="bg-white text-black">JPG</option>
                                                    <option value="webp" className="bg-white text-black">WebP</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-zinc-500">
                                                    <Check size={10} />
                                                </div>
                                            </div>
                                        )}

                                        {entry.status === "done" && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                <span className="text-[9px] uppercase font-black tracking-wider text-zinc-600 bg-zinc-100 px-2 py-1 border border-zinc-300 rounded-md">
                                                    {entry.targetFormat}
                                                </span>
                                                <button
                                                    onClick={() => downloadOne(entry)}
                                                    className="h-9 px-3.5 bg-[#fde047] border-2 border-black text-black rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-yellow-350 transition-all flex items-center gap-1 active:scale-95 shadow-[1.5px_1.5px_0_#000] ig-btn"
                                                >
                                                    <Download size={11} /> Save
                                                </button>
                                            </div>
                                        )}

                                        {entry.status === "converting" && (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
                                        )}

                                        <button
                                            onClick={() => removeFile(entry.id)}
                                            className="p-1.5 text-zinc-500 hover:text-red-600 transition-colors rounded-lg hover:bg-zinc-100"
                                            title="Remove file"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Batch Convert Trigger */}
                        {pendingCount > 0 && (
                            <button
                                onClick={convertAll}
                                className="w-full h-12 bg-[#fde047] border-2 border-black text-black rounded-full font-black text-xs sm:text-sm tracking-widest uppercase hover:bg-yellow-350 active:scale-[0.98] transition-all shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 ig-btn"
                            >
                                <RefreshCw size={14} className="animate-spin-slow" />
                                Convert {pendingCount} Queue File{pendingCount !== 1 ? "s" : ""}
                            </button>
                        )}
                    </div>
                )}

                {/* ─── SEO RICH TEXT SECTION ─── */}
                <div className="px-6 py-12 bg-white border-2 border-black rounded-[2rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000]">
                    <div className="relative z-10 space-y-12">
                        {/* Top Badges */}
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fbcfe8] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <ShieldCheck size={11} className="text-black" /> 100% Safe & Local
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Sparkles size={11} className="text-black" /> Dynamic Conversion
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fde047] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Check size={11} className="text-black" /> Bulk Processing
                            </span>
                        </div>

                        {/* Main Title & Subtitle */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight ig-display">
                                The Complete Free Image Converter Online
                            </h2>
                            <p className="text-sm text-zinc-700 leading-relaxed">
                                Instantly transform your photos, vectors, and layouts with our free image converter. Runs entirely locally in your browser to convert JPG, PNG, and WebP assets with no uploads, absolute data security, and customizable compression.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Dynamic Multi-Format Engine",
                                    desc: "Convert images to JPG, PNG, or WebP. Choose formats globally or configure individual formats file-by-file for custom workflows.",
                                    icon: <Sparkles size={16} />
                                },
                                {
                                    title: "Batch Processing Support",
                                    desc: "Upload multiple photos at once. Convert all queue items and download the completed files with one click.",
                                    icon: <Download size={16} />
                                },
                                {
                                    title: "100% Secure & Private",
                                    desc: "Your images never touch our servers. All processing is executed locally in your browser cache, protecting your sensitive content.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "Custom Quality Optimization",
                                    desc: "Fine-tune output parameters with a custom slider. Control compression density to reduce file weight while maintaining resolution.",
                                    icon: <RefreshCw size={16} />
                                },
                                {
                                    title: "No Watermarks or Subscriptions",
                                    desc: "Use our image converter free without signup, token limits, or watermarks. Export full-resolution files instantly.",
                                    icon: <Check size={16} />
                                },
                                {
                                    title: "Lossless Transparency",
                                    desc: "Convert files while fully preserving PNG alpha channels. White background backdrops are applied safely to prevent blank spaces.",
                                    icon: <FileImage size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-50 border-2 border-black rounded-2xl shadow-[3px_3px_0_#000] hover:bg-zinc-100 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-650 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* How to Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Convert Images in Three Simple Steps
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Select or Drop Images", desc: "Drag and drop your JPEG, PNG, WebP, GIF, SVG, or BMP files directly into the workspace dropzone." },
                                    { step: "2", title: "Configure Format & Quality", desc: "Select the target format globally or configure per-file targets. Adjust the quality slider for size optimization." },
                                    { step: "3", title: "Convert and Download", desc: "Click Convert to run local processing. Once done, download individual files or download all cutouts as a batch." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-50 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-650 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-4 tracking-tight ig-display">
                                AssetNest Local Image Converter vs. Cloud Converters
                            </h3>
                            <p className="text-xs text-zinc-650 text-center mb-8 max-w-lg mx-auto">
                                See how our local-first web-converter compares to traditional server-side conversion services.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-zinc-150 border-b-2 border-black">
                                            <th className="p-4 text-black font-bold">Feature</th>
                                            <th className="p-4 text-emerald-800 font-bold">AssetNest Local Converter</th>
                                            <th className="p-4 text-zinc-700 font-bold">Cloud Image Converters</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-black">
                                        {[
                                            { feat: "File Security", ours: "100% Private (files never upload or leave your browser)", other: "Risky (source files are uploaded to third-party databases)" },
                                            { feat: "Processing Latency", ours: "Instant local conversion using browser Canvas buffers", other: "Subject to network speeds, queue limits, and internet congestion" },
                                            { feat: "Daily Constraints", ours: "Unlimited conversions, free forever, no limits", other: "Limits on file amounts, files sizes, or mandatory paid plans" },
                                            { feat: "Batch Management", ours: "Individual file output controls and global batch settings", other: "Strict single-mode outputs or complicated setup configurations" },
                                            { feat: "Internet Dependency", ours: "Works offline once initial pages are loaded", other: "Completely unusable without a stable internet connection" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                                <td className="p-4 text-black font-semibold border-b border-black/10">{row.feat}</td>
                                                <td className="p-4 text-emerald-850 font-medium border-b border-black/10">{row.ours}</td>
                                                <td className="p-4 text-zinc-600 border-b border-black/10">{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                Frequently Asked Questions
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="Is this image converter free for commercial assets?">
                                    Yes. The image converter free engine is completely unlimited. You can convert graphic layouts, design templates, and e-commerce assets without any costs or attribution requirements.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I convert multiple formats in a single batch?">
                                    Yes! You can upload a mix of JPEG, PNG, WebP, and other images together. Our tool lets you select the output format dynamically for each file in the queue before converting.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Why does converting JPG to PNG sometimes make files larger?">
                                    PNG is a lossless format, whereas JPG is highly compressed and lossy. Converting JPG to PNG reconstructs the image pixels in a lossless container, which naturally increases the size. For optimization, we recommend using WebP output.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="How secure are my uploaded files?">
                                    They are completely secure. Since our tool runs local JavaScript inside your browser, no images are uploaded to any servers. All operations happen entirely on your computer or device.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Image Converter Infrastructure"
            >
                <div className="space-y-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Asset Portability Engine
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for visual container modifications. AssetNest <strong>Image Converter</strong> transcends basic file extension adjustments—it provides a local web-engine to pivot between common media formats (PNG, JPG, WebP) with precise quality control and absolute containment. Whether you are generating highly optimized WebP assets for quick browser loads or isolating assets into transparent PNG containers, our tools allow safe processing with zero network latency.
                        </p>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
