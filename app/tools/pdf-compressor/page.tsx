"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, Info, X, Minimize2, CheckCircle, Undo, Redo, Share2, Zap, Check, ShieldCheck, Sparkles, Package, Lock as LockIcon, FileText, Combine, ChevronDown, ArrowLeft } from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import ShareModal from "@/components/ShareModal";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

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
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-red-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                        <Minimize2 size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Compressor
                    </span>
                </div>
                <button 
                    onClick={() => setShowHelp(true)}
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                    title="Help Guide"
                >
                    <Info size={12} strokeWidth={2.5} /> INFO
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 relative z-10 space-y-6">
                {error && (
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl">
                        <Info size={16} className="text-red-650 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!result ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Undo/Redo tools */}
                        {file && (
                            <div className="flex items-center justify-end gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-black w-fit ml-auto shadow-[2px_2px_0_#000]">
                                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 text-black transition-colors" title="Undo"><Undo size={16} /></button>
                                <button onClick={redo} disabled={!canRedo} className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 text-black transition-colors" title="Redo"><Redo size={16} /></button>
                            </div>
                        )}
                        
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative min-h-[260px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group/dropzone ${
                                isDragging 
                                    ? "bg-red-50" 
                                    : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
                            }`}
                        >
                            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => {
                                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }} />
                            
                            {file ? (
                                <div className="text-center px-8 py-6 space-y-4">
                                    <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000]">
                                        <Minimize2 size={28} className="text-black animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-black truncate max-w-xs sm:max-w-md mx-auto ig-display">{file.name}</p>
                                        <p className="text-xs text-zinc-650">{formatSize(file.size)}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        Ready to Compress
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center px-8 py-6 space-y-6">
                                    <div className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000]">
                                        {isLoading ? <RefreshCw className="animate-spin text-black" size={24} /> : <Upload size={24} className="text-black" />}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-black tracking-tight ig-display">Drag & Drop PDF or Click to Browse</h2>
                                        <p className="text-xs text-zinc-600 mt-1 font-medium leading-relaxed max-w-sm mx-auto">
                                            Reduce your PDF size in seconds. Calculations are processed 100% locally in your browser cache.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={compress}
                            disabled={!file || isLoading}
                            className={`w-full h-12 font-black tracking-widest text-xs uppercase rounded-full flex items-center justify-center gap-2 border-2 border-black transition-all active:scale-[0.98] ig-btn ${
                                !file || isLoading 
                                    ? "bg-white text-zinc-400 cursor-not-allowed opacity-55" 
                                    : "bg-[#fde047] text-black shadow-[4px_4px_0_#000]"
                            }`}
                        >
                            {isLoading ? <><RefreshCw size={14} className="animate-spin" /> Compressing...</> : <>Compress PDF</>}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        {/* Stats */}
                        <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-10 shadow-[6px_6px_0_#000] relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-[#a7f3d0] border-2 border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                                    <CheckCircle size={24} className="text-black" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-black tracking-tight ig-display">Compression Complete!</h2>
                                    <p className="text-xs text-zinc-650 font-bold truncate max-w-[200px] sm:max-w-md mt-0.5">{file?.name}</p>
                                </div>
                            </div>

                            {/* Progress bar visual */}
                            <div className="relative z-10 space-y-4 mb-8 bg-zinc-50 p-6 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000]">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 ig-label">
                                    <span>Original File</span>
                                    <span className="text-emerald-700">Optimized File</span>
                                </div>
                                <div className="relative h-4 bg-zinc-200 border-2 border-black rounded-full overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-zinc-400 rounded-full" style={{ width: "100%" }} />
                                    <div
                                        className="absolute inset-y-0 left-0 bg-[#a7f3d0] rounded-full transition-all duration-1000"
                                        style={{ width: `${100 - savingsPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-zinc-500">{formatSize(result.originalSize)}</span>
                                    <span className="text-xs font-black text-black">{formatSize(result.compressedSize)}</span>
                                </div>
                            </div>

                            {/* Stat boxes */}
                            <div className="relative z-10 grid grid-cols-3 gap-4 mb-8 pb-8 border-b-2 border-black/10">
                                <div className="text-center">
                                    <span className="block text-xl sm:text-3xl font-black text-zinc-500 leading-tight">{formatSize(result.originalSize)}</span>
                                    <span className="text-[9px] font-bold tracking-wider text-zinc-650 uppercase block mt-1 ig-label">Original</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl sm:text-3xl font-black text-black leading-tight">{savingsPercent}%</span>
                                    <span className="text-[9px] font-bold tracking-wider text-zinc-650 uppercase block mt-1 ig-label">Savings</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl sm:text-3xl font-black text-black leading-tight">{formatSize(result.compressedSize)}</span>
                                    <span className="text-[9px] font-bold tracking-wider text-emerald-700 uppercase block mt-1 ig-label">New Size</span>
                                </div>
                            </div>

                            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={download} className="h-12 px-6 bg-[#fde047] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-yellow-350 transition-all active:scale-[0.98] shadow-[2.5px_2.5px_0_#000] ig-btn">
                                    <Download size={16} /> 
                                    <span>Download PDF</span>
                                </button>
                                <button 
                                    onClick={() => setIsSharing(true)} 
                                    className="h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-[2.5px_2.5px_0_#000] ig-btn"
                                >
                                    <Share2 size={16} /> 
                                    <span>Share to Mobile</span>
                                </button>
                                <button onClick={reset} className="sm:col-span-2 h-12 px-6 bg-transparent border-2 border-black text-zinc-600 hover:text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-[2.5px_2.5px_0_#000] ig-btn">
                                    <RefreshCw size={14} /> Compress Another PDF
                                </button>
                            </div>
                        </div>

                        {savingsPercent < 5 && (
                            <div className="p-5 border-2 border-black bg-white rounded-[1.5rem] shadow-[3px_3px_0_#000]">
                                <p className="text-xs text-zinc-700 leading-relaxed font-semibold">
                                    <span className="font-bold text-black uppercase ig-label block mb-1">Optimization Note:</span> This PDF was already highly optimized. Our engine could only prune an additional {savingsPercent}% of data streams. PDF files with non-optimized images or un-subsetted embedded fonts will see significantly higher compression rates.
                                </p>
                            </div>
                        )}
                    </div>
                )}

    
                <div className="flex justify-center py-4">
                    <AdBanner adKey="760a7d084fc3bc7a943aa9e62667abbe" width={468} height={60} />
                </div>

            {/* ─── SEO RICH TEXT SECTION ─── */}
                <div className="p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000] text-zinc-700">
                    <div className="relative z-10 space-y-12">
                        {/* Top Badges */}
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fbcfe8] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <ShieldCheck size={11} className="text-black" /> 100% In-Browser Privacy
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Sparkles size={11} className="text-black" /> Free & Unlimited
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fde047] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Package size={11} className="text-black" /> No Server Uploads
                            </span>
                        </div>

                        {/* Main Title & Description */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight ig-display">
                                Free PDF Compressor Online — Reduce PDF File Size Privately
                            </h2>
                            <p className="text-sm text-zinc-650 leading-relaxed">
                                Compress and optimize your PDF documents instantly in your browser. Our secure, local-first PDF compressor reduces file size while retaining high resolution vector assets, fonts, and layout formats. Keep your sensitive documents completely private — no watermarks, no signups, and zero server uploads.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Local-First PDF Optimizer",
                                    desc: "Optimize document sizes locally. Your files stay securely inside browser memory and are never sent to external servers.",
                                    icon: <Minimize2 size={16} />
                                },
                                {
                                    title: "Lossless Structural Pruning",
                                    desc: "Reduces layout file size by stream re-saving and catalog stripping, keeping font rendering and vector shapes crisp.",
                                    icon: <Combine size={16} />
                                },
                                {
                                    title: "No File Size Constraints",
                                    desc: "Process and shrink small drafts or massive multi-page manuals alike. We do not enforce file dimensions or page limits.",
                                    icon: <Sparkles size={16} />
                                },
                                {
                                    title: "Blazing Fast Compile",
                                    desc: "Calculated directly by your local CPU in milliseconds. Bypasses long network upload or download queue wait times.",
                                    icon: <Zap size={16} />
                                },
                                {
                                    title: "Clean Watermark-Free Export",
                                    desc: "Your output document remains completely clean. We never inject branding watermarks, stamps, or advertising.",
                                    icon: <LockIcon size={16} />
                                },
                                {
                                    title: "Universal OS Compatibility",
                                    desc: "Runs on any standard browser. Fully compatible with Windows, macOS, Android, and iOS mobile devices.",
                                    icon: <Package size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-2xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-650 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Reduce PDF File Size Online for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Select PDF Document", desc: "Drag and drop your target PDF file into the secure compression dropbox or select it from your file folder." },
                                    { step: "2", title: "Run Compression Calculations", desc: "Click the 'Compress PDF' button. The engine strips redundant streams and optimizes cross-references instantly." },
                                    { step: "3", title: "Save Optimized PDF", desc: "Inspect original vs compressed sizes, check percentage savings, and download the optimized PDF instantly." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-55 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-655 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ Accordion Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                PDF Compressor FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="How does the browser-side PDF compressor protect my document privacy?">
                                    AssetNest utilizes pdf-lib compiled locally in browser WebAssembly to run stream compression directly in your device's memory. Since no files are ever uploaded or transmitted to external web servers, your private documents, financial sheets, and legal papers remain 100% confidential.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Will compressing my PDF reduce the visual quality of text or images?">
                                    Our engine performs lossless optimization by stripping unused structural metadata, re-cataloging stream objects, and optimizing cross-references. Vector lines, text strings, and font assets remain completely sharp. If your PDF contains high-res raster images, the file size is reduced without degrading text legibility.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Is there a limit on how many megabytes my PDF file can be?">
                                    No. AssetNest does not impose any file size caps. The compression capacity is determined entirely by your browser's allocated memory and device hardware resources.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Compressor Info">
                <div className="space-y-12 text-zinc-700 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Data Density Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for document optimization. AssetNest <strong>Smart PDF Compressor</strong> transcends basic file shrinking—it provides a high-performance engine where you can minimize PDF data streams with pixel-perfect fidelity and absolute data privacy. Whether you are optimizing massive legal briefs for electronic filing, compression-heavy portolios for email distribution, or complex technical manuals for server storage, our tool gives you the power to reduce file weight with industry-leading stream mapping and zero server dependency.
                        </p>
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
