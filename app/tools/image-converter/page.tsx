"use client";

import { useState, useCallback, useRef } from "react";
import {
    FileImage, Download, Trash2, Upload, ArrowRight,
    CheckCircle2, Image as ImageIcon, ChevronDown
} from "lucide-react";

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
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-4">
                        <FileImage size={11} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Image Converter</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase text-white mb-2">
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Conversion Mode</p>
                        <div className="grid grid-cols-3 gap-2">
                            {MODES.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => changeMode(m.value)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-black transition-all ${mode === m.value
                                        ? "bg-emerald-500 border-emerald-500 text-black"
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
                        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                            <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
                            <div>
                                <p className="text-[11px] font-black text-amber-400 mb-0.5">File size will be larger than the original</p>
                                <p className="text-[11px] text-amber-300/70 font-medium leading-relaxed">
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    WebP Quality
                                </p>
                                <span className="text-sm font-black text-emerald-400">{quality}%</span>
                            </div>
                            <input
                                type="range" min={10} max={100} step={5}
                                value={quality}
                                onChange={e => setQuality(Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1.5 rounded-full"
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
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/50"
                        }`}
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${dragging ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-zinc-800 border border-zinc-700"
                        }`}>
                        <Upload size={24} className={dragging ? "text-emerald-400" : "text-zinc-400"} />
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {files.length} file{files.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {doneCount} converted
                            </p>
                            <div className="flex items-center gap-2">
                                {doneCount > 1 && (
                                    <button
                                        onClick={downloadAll}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
                                    >
                                        <Download size={12} />
                                        Download All
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:border-zinc-500 hover:text-zinc-300 transition-all"
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
                                                    <span className="text-[10px] text-emerald-400 font-bold">{fmtBytes(entry.outputSize)}</span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${entry.outputSize < entry.originalSize
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                                <button
                                                    onClick={() => downloadOne(entry)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-400 transition-all"
                                                >
                                                    <Download size={12} />
                                                    Save
                                                </button>
                                            </>
                                        )}
                                        {entry.status === "converting" && (
                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                                className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Convert {pendingCount} File{pendingCount !== 1 ? "s" : ""} to {currentMode.to}
                            </button>
                        )}
                    </div>
                )}

                {/* ── Info cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {[
                        { icon: "🔒", title: "100% Private", desc: "All processing happens in your browser. No files are ever uploaded." },
                        { icon: "⚡", title: "Instant", desc: "Canvas-based conversion. No waiting, no queues — convert in milliseconds." },
                        { icon: "📦", title: "Batch Support", desc: "Drop multiple files at once and convert them all in one click." },
                    ].map(c => (
                        <div key={c.title} className="border border-zinc-800 bg-zinc-900/30 rounded-2xl p-4">
                            <div className="text-2xl mb-2">{c.icon}</div>
                            <p className="text-xs font-black text-white mb-1">{c.title}</p>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{c.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Format tips */}
                <div className="border border-zinc-800 bg-zinc-900/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ChevronDown size={14} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">When to use which format?</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400 font-medium leading-relaxed">
                        <div>
                            <p className="text-white font-black mb-1">JPG / JPEG</p>
                            Best for photos. Lossy compression, small file size. Not ideal for logos or transparent backgrounds.
                        </div>
                        <div>
                            <p className="text-white font-black mb-1">PNG</p>
                            Lossless. Great for graphics, logos, screenshots. Supports transparency. Larger file size than JPG.
                        </div>
                        <div>
                            <p className="text-white font-black mb-1">WebP</p>
                            Modern format by Google. Up to 30% smaller than JPG/PNG at same quality. Best for web use.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
