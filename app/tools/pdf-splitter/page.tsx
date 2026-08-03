"use client";

import "@/lib/pdfjs-polyfill";
import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, Split, Info, X, Scissors, Undo, Redo, Share2, Layout, Check, ShieldCheck, Sparkles, Package, Lock as LockIcon, FileText, Grid, Zap, ChevronDown, ArrowLeft } from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
import Link from "next/link";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });
import ShareModal from "@/components/ShareModal";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Splitter",
    description: "Split and extract pages from a PDF instantly in your browser. 100% private, no uploads.",
    url: "https://www.assetnest.space/tools/pdf-splitter",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type PageSlot = {
    index: number;
    selected: boolean;
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

export default function PdfSplitterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pages, setPages, undo, redo, canUndo, canRedo, resetHistory] = useUndoRedo<PageSlot[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rangeInput, setRangeInput] = useState("");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a valid PDF file.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFile(f);
        resetHistory([]);
        setRangeInput("");
        setOutputUrl(null);
        setOutputBlob(null);

        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const count = pdf.getPageCount();
            setPageCount(count);
            resetHistory(Array.from({ length: count }, (_, i) => ({ index: i, selected: true })));
        } catch {
            setError("Could not read this PDF. It may be corrupted or password-protected.");
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const togglePage = (index: number) => {
        setPages(prev => prev.map(p => p.index === index ? { ...p, selected: !p.selected } : p));
    };

    const selectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
    const clearAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));

    const applyRange = () => {
        const newPages = [...pages].map(p => ({ ...p, selected: false }));
        const parts = rangeInput.split(",").map(s => s.trim());
        for (const part of parts) {
            if (part.includes("-")) {
                const [s, e] = part.split("-").map(n => parseInt(n) - 1);
                for (let i = s; i <= e && i < pageCount; i++) {
                    if (newPages[i]) newPages[i].selected = true;
                }
            } else {
                const n = parseInt(part) - 1;
                if (n >= 0 && n < pageCount && newPages[n]) newPages[n].selected = true;
            }
        }
        setPages(newPages);
    };

    const selectedCount = pages.filter(p => p.selected).length;

    const exportPdf = async () => {
        if (!file || selectedCount === 0) return;
        setIsExporting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const original = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const selectedIndices = pages.filter(p => p.selected).map(p => p.index);
            const copied = await newPdf.copyPages(original, selectedIndices);
            copied.forEach(pg => newPdf.addPage(pg));

            const bytes = await newPdf.save();
            const blob = new Blob([bytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setOutputBlob(blob);
            setOutputUrl(url);
        } catch (err) {
            console.error(err);
            setError("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        resetHistory([]);
        setPageCount(0);
        setError(null);
        setRangeInput("");
        setOutputUrl(null);
        setOutputBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const downloadPdf = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = `Split_${selectedCount}pages_${file.name}`;
        a.click();
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
                        <Scissors size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Splitter
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

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10 space-y-6">
                {/* Error */}
                {error && (
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl">
                        <Info size={16} className="text-red-700 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!file ? (
                    /* Upload Zone */
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative min-h-[260px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group/dropzone ${
                            isDragging 
                                ? "bg-red-50" 
                                : "bg-white hover:bg-zinc-55 shadow-[5px_5px_0_#000]"
                        }`}
                    >
                        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                        <div className="text-center px-8 py-6 space-y-6 relative z-10">
                            <div className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000] transition-all duration-300 group-hover/dropzone:scale-105">
                                {isLoading ? <RefreshCw size={24} className="animate-spin text-black" /> : <Upload size={24} className="text-black" />}
                            </div>
                            <div>
                                <h2 className="text-base font-black text-black tracking-tight ig-display">Drag & Drop PDF or Click to Browse</h2>
                                <p className="text-xs text-zinc-600 mt-1 font-medium leading-relaxed max-w-sm mx-auto">
                                    100% Private PDF Splitting • Extract Pages Securely in your browser cache.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500 relative z-10">
                        {/* Controls bar */}
                        <div className="bg-white border-2 border-black rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-[4px_4px_0_#000] relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 bg-red-500/10 border-2 border-black rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                    <Split size={16} className="text-black" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black truncate max-w-[200px] ig-display">{file.name}</p>
                                    <p className="text-[10px] text-zinc-550 font-bold">{pageCount} pages total</p>
                                </div>
                            </div>

                            <div className="h-px md:h-8 md:w-px bg-black/10 w-full md:w-auto relative z-10" />

                            {/* Range input */}
                            <div className="relative z-10 flex items-center gap-2 flex-grow w-full md:w-auto">
                                <input
                                    type="text"
                                    value={rangeInput}
                                    onChange={e => setRangeInput(e.target.value)}
                                    placeholder="e.g. 1, 3-5, 8"
                                    className="bg-zinc-50 border-2 border-black rounded-xl text-xs font-bold text-black px-4 py-2.5 placeholder:text-zinc-400 focus:outline-none focus:bg-white flex-grow shadow-[2px_2px_0_#000]"
                                />
                                <button onClick={applyRange} disabled={!rangeInput.trim()} className="ig-btn h-10 px-4 bg-[#fde047] border-2 border-black text-black text-xs font-black tracking-wide rounded-xl disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-[2.5px_2.5px_0_#000] transition-all">
                                    Apply Range
                                </button>
                            </div>

                            <div className="relative z-10 flex gap-2 shrink-0 border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-4 w-full md:w-auto justify-end">
                                <button onClick={reset} className="ig-btn h-9 w-9 flex items-center justify-center text-zinc-600 hover:text-black border-2 border-black bg-white rounded-full shadow-[2px_2px_0_#000]" title="Start Fresh">
                                    <X size={14} />
                                </button>
                                <button onClick={selectAll} className="ig-btn h-9 px-4 text-xs font-bold text-black border-2 border-black bg-white rounded-full shadow-[2px_2px_0_#000]">All</button>
                                <button onClick={clearAll} className="ig-btn h-9 px-4 text-xs font-bold text-zinc-650 hover:text-black border-2 border-black bg-white rounded-full shadow-[2px_2px_0_#000]">None</button>
                            </div>
                        </div>

                        {/* Pages Grid */}
                        <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[5px_5px_0_#000] relative overflow-hidden">
                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b-2 border-black/5 pb-4">
                                <div>
                                    <h3 className="text-sm font-black text-black ig-display">
                                        Select Pages <span className="text-red-500">({selectedCount} / {pageCount} selected)</span>
                                    </h3>
                                    <span className="text-[11px] tracking-wider text-zinc-600 font-bold block mt-1">Click cards to toggle selection</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]">
                                    <button onClick={undo} disabled={!canUndo} className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-30 text-black transition-colors" title="Undo (Ctrl+Z)"><Undo size={14} /></button>
                                    <button onClick={redo} disabled={!canRedo} className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-30 text-black transition-colors" title="Redo (Ctrl+Y)"><Redo size={14} /></button>
                                </div>
                            </div>

                            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                                {pages.map((p) => (
                                    <button
                                        key={p.index}
                                        onClick={() => togglePage(p.index)}
                                        className={`ig-btn group relative h-36 rounded-2xl flex flex-col items-center p-2 transition-all duration-200 border-2 ${
                                            p.selected
                                                ? "border-black bg-red-50 shadow-[3.5px_3.5px_0_#000]"
                                                : "border-black/45 bg-zinc-50/50 hover:border-black opacity-75 hover:opacity-100 shadow-[1.5px_1.5px_0_#000]"
                                        }`}
                                    >
                                        {/* Selection indicator (Top Left) */}
                                        <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${p.selected ? "bg-red-500 border-black text-white" : "bg-white/60 border-black/40 text-transparent"}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        
                                        {/* Cross symbol to deselect/remove (Top Right) */}
                                        {p.selected && (
                                            <div 
                                                className="absolute top-2 right-2 w-5 h-5 bg-white text-black rounded-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-10 border-2 border-black"
                                                onClick={(e) => { e.stopPropagation(); togglePage(p.index); }}
                                            >
                                                <X size={10} />
                                            </div>
                                        )}

                                        {/* Thumbnail */}
                                        <div className="flex-grow w-full relative overflow-hidden bg-white rounded border border-black/10 mt-1">
                                            <PdfPageThumbnail file={file} pageIndex={p.index} />
                                            <div className="absolute top-1 right-1 bg-black text-[8px] font-black text-white px-1.5 py-0.5 rounded border border-black">
                                                {p.index + 1}
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-black text-black mt-1.5">Pg {p.index + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export / Actions button */}
                        {!outputUrl ? (
                            <button
                                onClick={exportPdf}
                                disabled={selectedCount === 0 || isExporting}
                                className={`w-full h-14 font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-3 transition-all border-2 border-black ig-btn ${selectedCount === 0 ? "bg-zinc-200 text-zinc-550 cursor-not-allowed opacity-50 shadow-none" : "bg-[#fde047] text-black shadow-[4px_4px_0_#000]"}`}
                            >
                                {isExporting
                                    ? <><RefreshCw size={18} className="animate-spin" /> Exporting...</>
                                    : <>
                                        <Download size={18} /> 
                                        <span className="hidden sm:inline">Export {selectedCount} Page{selectedCount !== 1 ? "s" : ""} as PDF</span>
                                        <span className="sm:hidden">Export {selectedCount} Page{selectedCount !== 1 ? "s" : ""}</span>
                                      </>
                                }
                            </button>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={downloadPdf}
                                    className="ig-btn h-12 px-6 bg-[#fde047] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <Download size={16} /> 
                                    <span className="hidden sm:inline">Download Split PDF</span>
                                    <span className="sm:hidden">Download PDF</span>
                                </button>
                                <button
                                    onClick={() => setIsSharing(true)}
                                    className="ig-btn h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 shadow-[3px_3px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <Share2 size={16} /> 
                                    <span className="hidden sm:inline">Share to Mobile</span>
                                    <span className="sm:hidden">Share File</span>
                                </button>
                                <button
                                    onClick={reset}
                                    className="sm:col-span-2 ig-btn h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 shadow-[3px_3px_0_#000] transition-all"
                                >
                                    <RefreshCw size={14} /> Split Another PDF
                                </button>
                            </div>
                        )}
                    </div>
                )}

    
                <div className="flex justify-center py-4">
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
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight text-center ig-display">
                                Free PDF Splitter Online — Extract PDF Pages Privately
                            </h2>
                            <p className="text-sm text-zinc-600 leading-relaxed text-center font-medium">
                                Split, extract, and re-compile PDF pages instantly in your web browser. Our client-side PDF splitter lets you visually select specific pages or define exact range arrays (e.g. 1-3, 5, 8). Keep your highly confidential files entirely safe — all operations are processed in-memory with absolutely no cloud uploads.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Visual Page Selection Map",
                                    desc: "See clear rendered thumbnails of every single page. Toggle selections manually or input quick numeric range arrays.",
                                    icon: <Grid size={16} />
                                },
                                {
                                    title: "100% Private Client Execution",
                                    desc: "Your documents are processed locally via browser scripts. They are never transmitted, stored, or reviewed remotely.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "Lossless PDF Page Extraction",
                                    desc: "Extract structural nodes while preserving native vectors, image layers, active hyperlinks, and font properties.",
                                    icon: <Scissors size={16} />
                                },
                                {
                                    title: "Blazing Fast Page Compiles",
                                    desc: "No internet upload queue delay. The engine extracts pages and compiles the target PDF instantly in browser cache.",
                                    icon: <Zap size={16} />
                                },
                                {
                                    title: "No File Upload Size Caps",
                                    desc: "Split simple double-page contracts or massive multi-megabyte handbooks. Capacity is only restricted by your browser memory.",
                                    icon: <Package size={16} />
                                },
                                {
                                    title: "Completely Free & Clean",
                                    desc: "Export unlimited documents without watermarks, sign-up constraints, credit cards, or subscription blocks.",
                                    icon: <LockIcon size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-2xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-650 leading-relaxed font-medium">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Split a PDF and Extract Pages for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Upload Your PDF", desc: "Drag and drop your document into the local parsing area or browse from your desktop directory securely." },
                                    { step: "2", title: "Select Target Pages", desc: "Click individual page cards to select/deselect them, or define ranges like '1-3, 5' to instantly capture specific pages." },
                                    { step: "3", title: "Export and Save", desc: "Click the 'Export Pages' button to execute the compiler and download the new split PDF instantly." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-55 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-650 leading-relaxed font-medium">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-4 tracking-tight ig-display">
                                AssetNest In-Browser Splitter vs. Cloud PDF Editors
                            </h3>
                            <p className="text-xs text-zinc-600 text-center mb-8 max-w-lg mx-auto font-medium">
                                See how our local-first WebAssembly PDF re-splicing engine compares to online editors.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b-2 border-black">
                                            <th className="p-4 text-black font-black uppercase tracking-wider">Capability</th>
                                            <th className="p-4 text-black font-black uppercase tracking-wider bg-yellow-50">AssetNest In-Browser Splitter</th>
                                            <th className="p-4 text-zinc-600 font-bold uppercase tracking-wider">Cloud-Based Splitters</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {[
                                            { feat: "File Confidentiality", ours: "100% Secure (Processing happens locally; files are never uploaded)", other: "Unsecured (Files are stored, cached, and analyzed on remote cloud servers)" },
                                            { feat: "Visual Splicing", ours: "Interactive visual thumbnails grid + quick custom ranges selector", other: "Often lack visual preview grids or require paid plans for thumbnail generation" },
                                            { feat: "Size & Page Limitations", ours: "Completely unlimited (Calculates ranges on any size file based on system RAM)", other: "Limits files to 10-50MB or limits the number of extracted pages" },
                                            { feat: "Quality & Metadata", ours: "Lossless vector copying (Preserves links, annotations, and original fonts)", other: "May rasterize pages or strip vector coordinates during rebuilds" },
                                            { feat: "Account Registration", ours: "No signups, subscriptions, or credit cards required", other: "Demands email signup to download files or restricts splits per hour" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-4 text-black font-bold">{row.feat}</td>
                                                <td className="p-4 text-black font-semibold bg-yellow-50/50">{row.ours}</td>
                                                <td className="p-4 text-zinc-600 font-medium">{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                PDF Splitter FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="Is my document data secure when I split PDFs on this site?">
                                    Yes. Unlike conventional tools that upload your files to remote servers, AssetNest utilizes client-side scripts to run splitting computations inside your browser's local memory. The PDF file never leaves your computer, ensuring total confidentiality for legal, private, and business documents.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I split a PDF into individual pages or extract custom ranges?">
                                    Yes. You can click on the pages in the visual layout grid to select exactly which ones you want to extract. Alternatively, you can use the range input field to define custom pages or blocks, such as '1, 3-5, 8', to compile them instantly into a new file.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Does extracting pages degrade the resolution of text, vector maps, or images?">
                                    No. AssetNest uses precision object copying to create the new PDF container. This process copies the selected page nodes without decoding or re-compressing the graphics or fonts, meaning your vectors, images, and text objects remain identical to the original file.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Are there page count or file size limits for splitting?">
                                    No. There are no arbitrary limits enforced on the number of pages or file size. The process runs locally, meaning its performance is determined solely by your computer's RAM and processing power.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I split password-protected files?">
                                    For security reasons, the browser engine cannot read or split an encrypted or password-protected PDF file without the proper password. You can use our PDF Unlocker tool to decrypt the file first before splitting.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Splitter Info">
                <div className="space-y-12 text-zinc-800 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Document Extraction Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for document decomposition. AssetNest <strong>Advanced PDF Splitter</strong> transcends basic page range extraction—it provides a structural editor where you can manipulate PDF page maps with zero loss in quality and absolute data privacy. Whether you are extracting a single signature page from a massive legal transcript, splitting complex architectural blueprints, or distilling a personal portfolio into targeted assets, our tool gives you the power to slice and compile your documents with industry-leading precision and zero server dependency.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <Layout size={20} className="text-black" />
                                How to Split Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Universal Support:</strong> Drop any standard PDF container. Our engine renders every page thumbnail for physical verification.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Visual Page Selector:</strong> Click to include or exclude specific pages, or use range syntax (e.g., 1-5, 8, 12) for fast batching.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Lossless Re-Cataloging:</strong> We preserve every vector, font, and high-res asset in the extracted container. Zero quality degradation.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <ShieldCheck size={20} className="text-black" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-700 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive document data on external servers, our splitter operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-black shadow-[2px_2px_0_#000]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-black">Technical Spec</p>
                                <p className="text-[11px] text-zinc-650 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • Internal Vector Map Re-Splicing • Metadata Integrity Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">Documentation FAQ</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Multiple Splits?">
                                Yes. You can extract as many independent page sets as you need by resetting the selection map.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Quality Loss?">
                                Zero. We use surgical stream-splitting technology that leaves the original data objects untouched.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Secure Uploads?">
                                There are no uploads. Your file resides entirely in your computer&apos;s memory during the entire process.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </section>
                </div>
            </HelpModal>

            <ShareModal 
                isOpen={isSharing} 
                onClose={() => setIsSharing(false)} 
                file={outputBlob} 
                fileName={file ? `Split_${selectedCount}pages_${file.name}` : "split_document.pdf"} 
            />
        </div>
    );
}
