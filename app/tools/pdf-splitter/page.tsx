"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, FileText, Info, X, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });

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

export default function PdfSplitterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pages, setPages] = useState<PageSlot[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rangeInput, setRangeInput] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a valid PDF file.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFile(f);
        setPages([]);
        setRangeInput("");

        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const count = pdf.getPageCount();
            setPageCount(count);
            setPages(Array.from({ length: count }, (_, i) => ({ index: i, selected: true })));
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
            const a = document.createElement("a");
            a.href = url;
            a.download = `Split_${selectedCount}pages_${file.name}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPages([]);
        setPageCount(0);
        setError(null);
        setRangeInput("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Scissors size={11} className="text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PDF Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-white mb-4">
                    PDF <span className="text-violet-500">Splitter</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Upload a PDF, visually select the pages you want, and export them as a new PDF — entirely in your browser.
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

            {!file ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? "border-violet-500 bg-violet-500/5" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"}`}
                >
                    <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    <div className="text-center px-8 space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
                            {isLoading ? <RefreshCw size={24} className="animate-spin text-zinc-500" /> : <Upload size={24} className="text-zinc-500" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Drop PDF Here</h2>
                            <p className="text-zinc-500 text-xs font-medium mt-1">Or click to select a file</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Controls bar */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                                <FileText size={16} className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white truncate max-w-[200px]">{file.name}</p>
                                <p className="text-[10px] text-zinc-500">{pageCount} pages total</p>
                            </div>
                        </div>

                        <div className="h-px md:h-8 md:w-px bg-zinc-800 w-full md:w-auto" />

                        {/* Range input */}
                        <div className="flex items-center gap-2 flex-grow">
                            <input
                                type="text"
                                value={rangeInput}
                                onChange={e => setRangeInput(e.target.value)}
                                placeholder="e.g. 1, 3-5, 8"
                                className="bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 px-4 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 flex-grow"
                            />
                            <button onClick={applyRange} disabled={!rangeInput.trim()} className="h-10 px-4 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                                Apply Range
                            </button>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button onClick={selectAll} className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">All</button>
                            <button onClick={clearAll} className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">None</button>
                            <button onClick={reset} className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">✕</button>
                        </div>
                    </div>

                    {/* Pages Grid */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6">
                        <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                Select Pages <span className="text-violet-400">({selectedCount} / {pageCount} selected)</span>
                            </h3>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Click to toggle • Green = included</span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                            {pages.map((p) => (
                                <button
                                    key={p.index}
                                    onClick={() => togglePage(p.index)}
                                    className={`group relative h-36 rounded-2xl flex flex-col items-center p-2 transition-all duration-200 border-2 ${
                                        p.selected
                                            ? "border-violet-500 bg-violet-500/10 hover:bg-violet-500/20"
                                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 opacity-50 hover:opacity-70"
                                    }`}
                                >
                                    {/* Selected indicator */}
                                    <div className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all z-10 ${p.selected ? "bg-violet-500 border-violet-400" : "bg-zinc-800 border-zinc-700"}`}>
                                        {p.selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="flex-grow w-full relative overflow-hidden bg-white/5 rounded border border-white/5 mt-1">
                                        <PdfPageThumbnail file={file} pageIndex={p.index} />
                                        <div className="absolute top-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[7px] font-black text-white/70 backdrop-blur-sm">
                                            {p.index + 1}
                                        </div>
                                    </div>

                                    <span className="text-[10px] font-black text-zinc-400 mt-1.5">Pg {p.index + 1}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export button */}
                    <button
                        onClick={exportPdf}
                        disabled={selectedCount === 0 || isExporting}
                        className={`w-full h-14 font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 transition-all ${selectedCount === 0 ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/20"}`}
                    >
                        {isExporting
                            ? <><RefreshCw size={18} className="animate-spin" /> Exporting...</>
                            : <><Download size={18} /> Export {selectedCount} Page{selectedCount !== 1 ? "s" : ""} as PDF</>
                        }
                    </button>
                </div>
            )}

            {!file && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
                    {[
                        { title: "Visual Selection", desc: "See real page previews and click to include or exclude each page." },
                        { title: "Range Input", desc: "Quickly select pages with ranges like '1, 3-5, 8' for fast precision." },
                        { title: "Instant Export", desc: "Your custom PDF is generated and ready to download in seconds." }
                    ].map((f, i) => (
                        <div key={i} className="text-center space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500">{f.title}</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
