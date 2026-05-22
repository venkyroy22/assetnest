"use client";

import { useState, useCallback, useRef } from "react";
import {
    FileImage, Download, Trash2, Upload, ArrowRight,
    CheckCircle2, Image as ImageIcon, ChevronDown, Zap, Check, ShieldCheck
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ConversionMode = "jpg-to-png" | "png-to-webp" | "jpg-to-webp";
type ConvStatus = "idle" | "converting" | "done" | "error";

interface FileEntry {
    id: string;
    file: File;
    originalSize: number;
    preview: string;
    status: ConvStatus;
    outputUrl?: string;
    outputSize?: number;
    outputName?: string;
    error?: string;
}

const MODES: { value: ConversionMode; label: string; from: string; to: string; accept: string }[] = [
    { value: "jpg-to-png", label: "JPG → PNG", from: "JPG/JPEG", to: "PNG", accept: "image/jpeg,image/jpg" },
    { value: "png-to-webp", label: "PNG → WebP", from: "PNG", to: "WebP", accept: "image/png" },
    { value: "jpg-to-webp", label: "JPG → WebP", from: "JPG/JPEG", to: "WebP", accept: "image/jpeg,image/jpg" },
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

async function convertImage(
    file: File,
    mode: ConversionMode,
    quality: number,
): Promise<{ url: string; size: number; name: string }> {
    const mimeOut = mode === "jpg-to-png" ? "image/png" : "image/webp";
    const extOut = mode === "jpg-to-png" ? "png" : "webp";
    const q = mode === "jpg-to-png" ? 1 : quality / 100;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            // White background for PNG output (preserves transparency)
            if (mode !== "jpg-to-png") {
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function ImageConverterPage() {
    const [mode, setMode] = useState<ConversionMode>("jpg-to-png");
    const [quality, setQuality] = useState(85);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentMode = MODES.find(m => m.value === mode)!;

    // ── File handling ─────────────────────────────────────────────────────────
    const addFiles = useCallback((incoming: File[]) => {
        const accepted = incoming.filter(f => {
            if (mode === "png-to-webp") return f.type === "image/png";
            return f.type === "image/jpeg" || f.type === "image/jpg";
        });
        if (!accepted.length) return;
        const entries: FileEntry[] = accepted.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            originalSize: f.size,
            preview: URL.createObjectURL(f),
            status: "idle",
        }));
        setFiles(prev => [...prev, ...entries]);
    }, [mode]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const removeFile = (id: string) =>
        setFiles(prev => prev.filter(f => f.id !== id));

    const clearAll = () => setFiles([]);

    // ── Conversion ────────────────────────────────────────────────────────────
    const convertAll = async () => {
        const toConvert = files.filter(f => f.status === "idle" || f.status === "error");
        if (!toConvert.length) return;

        setFiles(prev => prev.map(f =>
            toConvert.some(c => c.id === f.id) ? { ...f, status: "converting" } : f
        ));

        await Promise.all(toConvert.map(async (entry) => {
            try {
                const result = await convertImage(entry.file, mode, quality);
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

    const changeMode = (m: ConversionMode) => {
        setMode(m);
        setFiles([]);
    };

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-[#f0ede8] py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-7">

                {/* ── Header ── */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 mb-4 relative group">
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="absolute -top-2 -left-2 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-[#f0ede8] transition-all shadow-xl z-10"
                            title="What is this?"
                        >
                            <Info size={10} />
                        </button>
                        <FileImage size={11} className="text-zinc-400 ml-4" />
                        <span className="text-xs font-semibold tracking-wide text-zinc-400">Image Converter</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-[#f0ede8] mb-2">
                        Convert Images
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium max-w-lg leading-relaxed">
                        Convert JPG ↔ PNG ↔ WebP instantly in your browser. 100% private — no uploads, no servers.
                    </p>
                </div>

                {/* ── Mode & Quality ── */}
                <div className="border border-white/[0.07] bg-[#1c1c1c]/40 rounded-2xl p-5 space-y-5">

                    {/* Mode selector */}
                    <div>
                        <p className="text-[10px] font-semibold text-zinc-500 mb-3">Conversion Mode</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MODES.map(m => (
                                 <button
                                     key={m.value}
                                     onClick={() => changeMode(m.value)}
                                     className={`py-3 px-3 sm:px-4 rounded-xl border text-[10px] sm:text-sm font-black transition-all ${mode === m.value
                                         ? "bg-white border-white text-black shadow-lg shadow-white/10"
                                         : "bg-white/[0.06] border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                         }`}
                                 >
                                     <span className="text-[10px]">{m.from}</span>
                                     <ArrowRight size={10} className="inline mx-1" />
                                     <span className="text-[10px]">{m.to}</span>
                                 </button>
                            ))}
                        </div>
                    </div>

                    {/* JPG→PNG size notice */}
                    {mode === "jpg-to-png" && (
                        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                            <span className="text-[#f0ede8] text-sm leading-none mt-0.5">⚠️</span>
                            <div>
                                <p className="text-[10px] font-black text-[#f0ede8] mb-0.5">File size will increase</p>
                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                    PNG is lossless and usually larger than JPG. For <em>smaller</em> files, use <strong>JPG → WebP</strong>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quality slider — only for WebP output */}
                    {mode !== "jpg-to-png" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                                    WebP Quality
                                </p>
                                <span className="text-xs font-black text-[#f0ede8]">{quality}%</span>
                            </div>
                            <input
                                type="range" min={10} max={100} step={5}
                                value={quality}
                                onChange={e => setQuality(Number(e.target.value))}
                                className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-white"
                            />
                            <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                                <span>Smallest</span>
                                <span>Highest</span>
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
                    className={`border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center py-10 sm:py-14 cursor-pointer transition-all ${dragging
                        ? "border-white bg-white/5"
                        : "border-white/[0.07] bg-[#1c1c1c] hover:border-zinc-500 hover:bg-[#1e1e1e]/50"
                        }`}
                >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${dragging ? "bg-white/20 border border-white/30" : "bg-[#1c1c1c] border border-white/[0.07] shadow-xl"
                        }`}>
                        <Upload size={22} className={dragging ? "text-[#f0ede8]" : "text-zinc-500"} />
                    </div>
                    <p className="text-lg sm:text-xl font-black text-[#f0ede8] mb-2">
                        Drag & Drop or Click Here
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-5">
                        Multiple files supported • 100% Private Browser Conversion
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold tracking-wide text-zinc-500">
                        <span className="px-2 py-1 border border-white/[0.07]">100% Private</span>
                        <span className="px-2 py-1 border border-white/[0.07]">No Server Upload</span>
                        <span className="px-2 py-1 border border-white/[0.07]">Free Forever</span>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={currentMode.accept}
                        className="hidden"
                        onChange={handlePick}
                    />
                </div>

                {/* ── File list ── */}
                {files.length > 0 && (
                    <div className="space-y-4">

                        {/* Actions bar */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-wide text-zinc-500">
                                {files.length} file{files.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {doneCount} converted
                            </p>
                            <div className="flex items-center gap-2">
                                {doneCount > 1 && (
                                    <button
                                        onClick={downloadAll}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/30 text-[#f0ede8] rounded-full text-xs font-semibold tracking-wide hover:bg-white/20 transition-all"
                                    >
                                        <Download size={12} />
                                        Download All
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-500 rounded-full text-xs font-semibold tracking-wide hover:border-zinc-500 hover:text-zinc-300 transition-all"
                                >
                                    <Trash2 size={12} />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* File cards */}
                        <div className="space-y-3">
                            {files.map(entry => (
                                <div key={entry.id} className="border border-white/[0.07] bg-[#1c1c1c]/40 rounded-2xl p-4 flex items-center gap-4">
                                    {/* Thumbnail */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={entry.preview}
                                        alt={entry.file.name}
                                        className="w-14 h-14 object-cover rounded-xl border border-zinc-700 shrink-0"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-200 truncate">{entry.file.name}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-[10px] text-zinc-500 font-medium">{fmtBytes(entry.originalSize)}</span>
                                            {entry.status === "done" && entry.outputSize && (
                                                <>
                                                    <ArrowRight size={10} className="text-zinc-600" />
                                                    <span className="text-[10px] text-[#f0ede8] font-bold">{fmtBytes(entry.outputSize)}</span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.outputSize < entry.originalSize
                                                        ? "bg-white/10 text-[#f0ede8] border border-white/20"
                                                        : "bg-white/10 text-[#f0ede8] border border-white/20"
                                                        }`}>
                                                        {savingPct(entry.originalSize, entry.outputSize)}
                                                    </span>
                                                </>
                                            )}
                                            {entry.status === "converting" && (
                                                <span className="text-[10px] text-zinc-400 animate-pulse">Converting…</span>
                                            )}
                                            {entry.status === "error" && (
                                                <span className="text-[10px] text-red-400">{entry.error}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status / Actions */}
                                    <div className="shrink-0 flex items-center gap-2">
                                        {entry.status === "done" && (
                                            <>
                                                <CheckCircle2 size={16} className="text-[#f0ede8]" />
                                                <button
                                                    onClick={() => downloadOne(entry)}
                                                    className="h-10 px-4 bg-[#f0ede8] text-[#141414] rounded-full text-xs font-bold hover:bg-[#e8e5e0] transition-all active:scale-95"
                                                >
                                                    <Download size={14} className="inline mr-1" />
                                                    Save
                                                </button>
                                            </>
                                        )}
                                        {entry.status === "converting" && (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        {(entry.status === "idle" || entry.status === "error") && (
                                            <ImageIcon size={16} className="text-zinc-600" />
                                        )}
                                        <button
                                            onClick={() => removeFile(entry.id)}
                                            className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/[0.06]"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Convert button */}
                        {pendingCount > 0 && (
                            <button
                                onClick={convertAll}
                                className="w-full h-12 bg-[#f0ede8] text-[#141414] rounded-full font-black text-xs sm:text-sm tracking-widest uppercase hover:bg-[#e8e5e0] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
                            >
                                Convert {pendingCount} File{pendingCount !== 1 ? "s" : ""} to {currentMode.to}
                            </button>
                        )}
                    </div>
                )}

                <HelpModal 
                    isOpen={showHelp} 
                    onClose={() => setShowHelp(false)} 
                    title="High-Definition Transformation"
                >
                    <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                High-Definition Image Transformation
                            </h3>
                            <p className="text-base leading-relaxed text-zinc-400 font-medium">
                                Step into a professional-grade workspace for asset conversion. AssetNest <strong>Image Converter</strong> transcends basic file transformation—it provides a high-performance engine where you can manipulate image containers with zero loss in quality and absolute data privacy. Whether you are optimizing WebP assets for a global storefront, converting heavy PNGs into web-ready JPEGs, or preparing high-res photography for distribution, our tool gives you the power to batch-process your creative assets with industry-leading efficiency.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                    <Zap size={20} className="text-zinc-500" />
                                    How to Convert Safely
                                </h3>
                                <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                        <span><strong>Multi-Format Engine:</strong> Instantly pivot between JPG, PNG, and WebP containers. Batch support is built-in.</span>
                                    </li>
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                        <span><strong>Hardware Acceleration:</strong> We utilize your browser&apos;s native Canvas API for lightning-fast, zero-server processing.</span>
                                    </li>
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                        <span><strong>Precision Output:</strong> Fine-tune quality sliders to achieve the perfect balance of file weight and visual clarity.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                    <ShieldCheck size={20} className="text-zinc-500" />
                                    Privacy Infrastructure
                                </h3>
                                <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                    Unlike traditional cloud-based tools that store your sensitive photo data on external servers, our converter operates <strong>100% locally in your browser cache</strong>.
                                </p>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                    <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                        Zero-Server Buffer Mapping • Lossless Color Preservation • Encrypted Temporary Storage • No Watermarks
                                    </p>
                                </div>
                            </section>
                        </div>

                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] border-t border-white/[0.05] pt-12">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Documentation FAQ</h3>
                            <Accordion>
                                <AccordionItem title="Why WebP?">
                                    WebP provides superior compression, saving up to 30% file size compared to JPG with identical quality.
                                </AccordionItem>
                                <AccordionItem title="File Limits?">
                                    There are no artificial limits. Convert as many files as your device&apos;s memory can realistically handle.
                                </AccordionItem>
                                <AccordionItem title="Quality Loss?">
                                    Zero. When converting to lossless formats like PNG, we preserve every pixel of the original source asset.
                                </AccordionItem>
                            </Accordion>
                        </section>
                    </div>
                </HelpModal>

            </div>
        </div>
    );
}

