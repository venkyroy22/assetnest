"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, Info, X, Minimize2, CheckCircle, Undo, Redo } from "lucide-react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Compressor",
    description: "Reduce PDF file size instantly in your browser. 100% private, no uploads.",
    url: "https://www.assetnest.space/tools/pdf-compressor",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfCompressorPage() {
    const [file, setFile, undo, redo, canUndo, canRedo, resetHistory] = useUndoRedo<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ url: string; originalSize: number; compressedSize: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const savingsPercent = result
        ? Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)
        : 0;

    const handleFile = (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a valid PDF file.");
            return;
        }
        setFile(f);
        setResult(null);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const compress = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

            // pdf-lib re-saves with cross-reference streams (smaller than tables)
            // and strips redundant objects — this is the core compression
            const compressed = await pdf.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 50,
            });

            const blob = new Blob([compressed as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            setResult({
                url,
                originalSize: file.size,
                compressedSize: blob.size,
            });
        } catch (err) {
            console.error(err);
            setError("Could not compress this PDF. It may be password-protected or corrupted.");
        } finally {
            setIsLoading(false);
        }
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement("a");
        a.href = result.url;
        a.download = `Compressed_${file?.name ?? "document.pdf"}`;
        a.click();
    };

    const reset = () => {
        if (result) URL.revokeObjectURL(result.url);
        resetHistory(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-3xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Minimize2 size={11} className="text-orange-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">PDF Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    PDF <span className="text-orange-500">Compressor</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Reduce PDF file size instantly in your browser. Your documents stay 100% private — nothing is uploaded.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 rounded-2xl">
                    <Info size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-medium text-red-100">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>
            )}

            {!result ? (
                <div className="space-y-5">
                    {/* Dropzone */}
                    {!file && (
                        <div className="flex items-center gap-1 justify-end mb-2">
                            <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 bg-zinc-950 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)"><Undo size={14} /></button>
                            <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 bg-zinc-950 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Redo (Ctrl+Y)"><Redo size={14} /></button>
                        </div>
                    )}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`min-h-[260px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative ${isDragging ? "border-orange-500 bg-orange-500/5" : file ? "border-orange-500/40 bg-zinc-950" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"}`}
                    >
                        {file && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 z-10" onClick={(e) => e.stopPropagation()}>
                                <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)"><Undo size={14} /></button>
                                <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Redo (Ctrl+Y)"><Redo size={14} /></button>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => {
                            if (e.target.files?.[0]) handleFile(e.target.files[0]);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }} />
                        {file ? (
                            <div className="text-center px-8 space-y-4">
                                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                    <Minimize2 size={28} className="text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white truncate max-w-xs mx-auto">{file.name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{formatSize(file.size)}</p>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-medium tracking-wide">Click to change file</p>
                            </div>
                        ) : (
                            <div className="text-center px-8 space-y-4">
                                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
                                    <Upload size={24} className="text-zinc-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Drop PDF Here</h2>
                                    <p className="text-zinc-500 text-xs font-medium mt-1">Or click to select a file</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={compress}
                        disabled={!file || isLoading}
                        className={`w-full h-14 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all ${!file || isLoading ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"}`}
                    >
                        {isLoading ? <><RefreshCw size={18} className="animate-spin" /> Compressing...</> : <>Compress PDF</>}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Stats */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Compression Done!</h2>
                                <p className="text-xs text-zinc-500 font-medium">{file?.name}</p>
                            </div>
                        </div>

                        {/* Progress bar visual */}
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between text-[11px] font-semibold tracking-wider text-zinc-400">
                                <span>Original</span>
                                <span>Compressed</span>
                            </div>
                            <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-zinc-700 rounded-full" style={{ width: "100%" }} />
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${100 - savingsPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-zinc-500">{formatSize(result.originalSize)}</span>
                                <span className="text-xs font-bold text-orange-400">{formatSize(result.compressedSize)}</span>
                            </div>
                        </div>

                        {/* Stat boxes */}
                        <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-zinc-900">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-white">{formatSize(result.originalSize)}</span>
                                <span className="text-[11px] font-semibold tracking-wider text-zinc-500">Original</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-black text-green-400">{savingsPercent}%</span>
                                <span className="text-[11px] font-semibold tracking-wider text-zinc-500">Saved</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-black text-white">{formatSize(result.compressedSize)}</span>
                                <span className="text-[11px] font-semibold tracking-wider text-zinc-500">New Size</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={download} className="h-14 px-8 bg-white text-black font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-xl">
                                <Download size={18} /> Download Compressed PDF
                            </button>
                            <button onClick={reset} className="h-14 px-8 bg-transparent border border-zinc-800 text-zinc-300 hover:text-white font-semibold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 hover:bg-zinc-900 transition-all">
                                Compress Another PDF
                            </button>
                        </div>
                    </div>

                    {savingsPercent < 5 && (
                        <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl">
                            <p className="text-xs text-yellow-200 font-medium leading-relaxed">
                                <span className="font-black">Note:</span> This PDF was already well-optimized — only {savingsPercent}% additional savings were possible. PDFs with lots of embedded fonts or images get the biggest gains.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {!file && !result && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
                    {[
                        { title: "100% Private", desc: "Your PDF never leaves your device — processed entirely in your browser." },
                        { title: "No Limits", desc: "No file size caps, no daily limits, no account needed." },
                        { title: "Lossless", desc: "Document content, text, and vector graphics are fully preserved." }
                    ].map((f, i) => (
                        <div key={i} className="text-center space-y-2">
                            <h4 className="text-[10px] font-bold text-orange-500">{f.title}</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
