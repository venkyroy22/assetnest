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
        <div className="min-h-screen bg-zinc-950 text-white py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-7">

                {/* ── Header ── */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-4 relative group">
                        <FileImage size={11} className="text-zinc-400" />
                        <span className="text-xs font-semibold tracking-wide text-zinc-400">Image Converter</span>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                            title="What is this?"
                        >
                            <Info size={10} />
                        </button>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                        Convert Images
                    </h1>
                    <p className="text-zinc-400 text-sm font-medium max-w-lg leading-relaxed">
                        Convert JPG ↔ PNG ↔ WebP instantly in your browser. 100% private — no uploads, no servers.
                    </p>
                </div>

                {/* ── Mode & Quality ── */}
                <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 space-y-5">

                    {/* Mode selector */}
                    <div>
                        <p className="text-[10px] font-semibold text-zinc-500 mb-3">Conversion Mode</p>
                        <div className="grid grid-cols-3 gap-2">
                            {MODES.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => changeMode(m.value)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-black transition-all ${mode === m.value
                                        ? "bg-white border-white text-black"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                        }`}
                                >
                                    <span className="text-xs">{m.from}</span>
                                    <ArrowRight size={12} className="inline mx-1.5" />
                                    <span className="text-xs">{m.to}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* JPG→PNG size notice */}
                    {mode === "jpg-to-png" && (
                        <div className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                            <span className="text-white text-base leading-none mt-0.5">⚠️</span>
                            <div>
                                <p className="text-[11px] font-black text-white mb-0.5">File size will be larger than the original</p>
                                <p className="text-[11px] text-white/70 font-medium leading-relaxed">
                                    PNG is <strong>lossless</strong> — it preserves every pixel without discarding data, so it&apos;s always larger than a JPG.
                                    If you need a <em>smaller</em> file, switch to <strong>JPG → WebP</strong> instead.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quality slider — only for WebP output */}
                    {mode !== "jpg-to-png" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold tracking-wide text-zinc-500">
                                    WebP Quality
                                </p>
                                <span className="text-sm font-black text-white">{quality}%</span>
                            </div>
                            <input
                                type="range" min={10} max={100} step={5}
                                value={quality}
                                onChange={e => setQuality(Number(e.target.value))}
                                className="w-full white h-1.5 rounded-full"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                                <span>Smallest file</span>
                                <span>Best quality</span>
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
                    className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-14 cursor-pointer transition-all ${dragging
                        ? "border-white bg-white/5"
                        : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/50"
                        }`}
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${dragging ? "bg-white/20 border border-white/30" : "bg-zinc-800 border border-zinc-700"
                        }`}>
                        <Upload size={24} className={dragging ? "text-white" : "text-zinc-400"} />
                    </div>
                    <p className="text-sm font-black text-zinc-300 mb-1">
                        Drop {currentMode.from} files here
                    </p>
                    <p className="text-xs text-zinc-600 font-medium">
                        or click to browse — multiple files supported
                    </p>
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
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/30 text-white rounded-full text-xs font-semibold tracking-wide hover:bg-white/20 transition-all"
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
                                <div key={entry.id} className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-4 flex items-center gap-4">
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
                                                    <span className="text-[10px] text-white font-bold">{fmtBytes(entry.outputSize)}</span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.outputSize < entry.originalSize
                                                        ? "bg-white/10 text-white border border-white/20"
                                                        : "bg-white/10 text-white border border-white/20"
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
                                                <CheckCircle2 size={16} className="text-white" />
                                                <button
                                                    onClick={() => downloadOne(entry)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-full text-xs font-semibold tracking-wide hover:bg-white transition-all"
                                                >
                                                    <Download size={12} />
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
                                            className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
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
                                className="w-full py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-white active:scale-[0.98] transition-all shadow-lg shadow-white/20"
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
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                High-Definition Image Transformation
                            </h3>
                            <p className="text-base leading-relaxed text-zinc-400 font-medium">
                                Step into a professional-grade workspace for asset conversion. AssetNest <strong>Image Converter</strong> transcends basic file transformation—it provides a high-performance engine where you can manipulate image containers with zero loss in quality and absolute data privacy. Whether you are optimizing WebP assets for a global storefront, converting heavy PNGs into web-ready JPEGs, or preparing high-res photography for distribution, our tool gives you the power to batch-process your creative assets with industry-leading efficiency.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                    <Zap size={20} className="text-zinc-500" />
                                    How to Convert Safely
                                </h3>
                                <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                        <span><strong>Multi-Format Engine:</strong> Instantly pivot between JPG, PNG, and WebP containers. Batch support is built-in.</span>
                                    </li>
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                        <span><strong>Hardware Acceleration:</strong> We utilize your browser&apos;s native Canvas API for lightning-fast, zero-server processing.</span>
                                    </li>
                                    <li className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                        <span><strong>Precision Output:</strong> Fine-tune quality sliders to achieve the perfect balance of file weight and visual clarity.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
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

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Documentation FAQ</h3>
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

