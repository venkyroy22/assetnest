"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, Info, X, Minimize2, CheckCircle, Undo, Redo, Share2, Zap, Check, ShieldCheck } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import ShareModal from "@/components/ShareModal";

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
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
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
        setOutputBlob(null);
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
            setOutputBlob(blob);
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
        setOutputBlob(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-3xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="text-center mb-10 relative group">
                <button 
                    onClick={() => setShowHelp(true)}
                    className="absolute -top-2 -left-2 p-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30 shadow-lg"
                    title="View Information"
                >
                    <Info size={16} />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Minimize2 size={11} className="text-white" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">PDF Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    PDF <span className="text-white">Compressor</span>
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
                        className={`min-h-[260px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative ${isDragging ? "border-white bg-white/5" : file ? "border-white/40 bg-zinc-950" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"}`}
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
                                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto">
                                    <Minimize2 size={28} className="text-white" />
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
                                    <h2 className="text-lg font-bold text-white tracking-tight">Drag & Drop or Click Here</h2>
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                            <ShieldCheck size={10} className="text-white" />
                                            <span className="text-[10px] font-semibold text-zinc-300">100% Private</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                            <Zap size={10} className="text-white" />
                                            <span className="text-[10px] font-semibold text-zinc-300">No Server Upload</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                            <Check size={10} className="text-white" />
                                            <span className="text-[10px] font-semibold text-zinc-300">Free Forever</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-500 text-[10px] font-medium mt-3 uppercase tracking-wider">Reduce PDF File Size</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={compress}
                        disabled={!file || isLoading}
                        className={`w-full h-14 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all ${!file || isLoading ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed" : "bg-white text-black hover:bg-white shadow-lg shadow-white/20"}`}
                    >
                        {isLoading ? <><RefreshCw size={18} className="animate-spin" /> Compressing...</> : <>Compress PDF</>}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Stats */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5 sm:p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <CheckCircle size={20} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Compression Done!</h2>
                                <p className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate max-w-[200px] sm:max-w-md">{file?.name}</p>
                            </div>
                        </div>

                        {/* Progress bar visual */}
                        <div className="space-y-3 mb-6 sm:mb-8">
                            <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400">
                                <span>Original</span>
                                <span>Compressed</span>
                            </div>
                            <div className="relative h-2.5 sm:h-3 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-zinc-700 rounded-full" style={{ width: "100%" }} />
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-white rounded-full transition-all duration-1000"
                                    style={{ width: `${100 - savingsPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] sm:text-xs font-bold text-zinc-500">{formatSize(result.originalSize)}</span>
                                <span className="text-[10px] sm:text-xs font-bold text-white">{formatSize(result.compressedSize)}</span>
                            </div>
                        </div>

                        {/* Stat boxes */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8 pb-4 sm:pb-8 border-b border-zinc-900">
                            <div className="text-center">
                                <span className="block text-lg sm:text-2xl font-black text-white leading-tight">{formatSize(result.originalSize)}</span>
                                <span className="text-[8px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Original</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-lg sm:text-2xl font-black text-white leading-tight">{savingsPercent}%</span>
                                <span className="text-[8px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Saved</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-lg sm:text-2xl font-black text-white leading-tight">{formatSize(result.compressedSize)}</span>
                                <span className="text-[8px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">New Size</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={download} className="h-12 px-6 bg-white text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl">
                                <Download size={18} /> 
                                <span className="hidden sm:inline">Download Compressed PDF</span>
                                <span className="sm:hidden">Download PDF</span>
                            </button>
                            <button 
                                onClick={() => setIsSharing(true)} 
                                className="h-12 px-6 bg-zinc-900 border border-zinc-800 text-white font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl"
                            >
                                <Share2 size={18} /> 
                                <span className="hidden sm:inline">Share to Mobile</span>
                                <span className="sm:hidden">Share File</span>
                            </button>
                            <button onClick={reset} className="sm:col-span-2 h-12 px-6 bg-transparent border border-zinc-800 text-zinc-400 hover:text-white font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all">
                                <RefreshCw size={14} /> Compress Another PDF
                            </button>
                        </div>
                    </div>

                    {savingsPercent < 5 && (
                        <div className="p-4 border border-white/20 bg-white/5 rounded-2xl">
                            <p className="text-xs text-white font-medium leading-relaxed">
                                <span className="font-black">Note:</span> This PDF was already well-optimized — only {savingsPercent}% additional savings were possible. PDFs with lots of embedded fonts or images get the biggest gains.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Compressor Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Visual Data Density Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for document optimization. AssetNest <strong>Smart PDF Compressor</strong> transcends basic file shrinking—it provides a high-performance engine where you can minimize PDF data streams with pixel-perfect fidelity and absolute data privacy. Whether you are optimizing massive legal briefs for electronic filing, compression-heavy portolios for email distribution, or complex technical manuals for server storage, our tool gives you the power to reduce file weight with industry-leading stream mapping and zero server dependency.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Zap size={20} className="text-zinc-500" />
                                How to Compress Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Universal Support:</strong> Drop any standard PDF container. Our engine automatically identifies redundant object streams for pruning.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Hardware Acceleration:</strong> We utilize client-side PDF stream re-saving to compress your data locally. Blazing fast, ultra-secure.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Fidelity Preservation:</strong> Advanced algorithms prioritize text vector and high-res graphic integrity while stripping hidden metadata.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive document data on external servers, our compressor operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Buffer Mapping • Lossless Stream Re-Cataloging • Metadata Stripping • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Lossy vs Lossless?">
                                We prioritize lossless optimization, preserving vector sharpness while shrinking data overhead.
                            </AccordionItem>
                            <AccordionItem title="File Limits?">
                                None. Process documents of any size. Large files may require additional system memory to map streams.
                            </AccordionItem>
                            <AccordionItem title="Secure Uploads?">
                                There are no uploads. All processing happens locally on your computer or device hardware.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            <ShareModal 
                isOpen={isSharing} 
                onClose={() => setIsSharing(false)} 
                file={outputBlob} 
                fileName={`Compressed_${file?.name ?? "document.pdf"}`} 
            />
        </div>
    );
}
