"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, Split, Info, X, Scissors, Undo, Redo, Share2, Layout, Check, ShieldCheck } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";

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
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
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
                    <Scissors size={11} className="text-white" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">PDF Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    PDF <span className="text-white">Splitter</span>
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
                    className={`min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? "border-white bg-white/5" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"}`}
                >
                    <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    <div className="text-center px-8 space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
                            {isLoading ? <RefreshCw size={24} className="animate-spin text-zinc-500" /> : <Upload size={24} className="text-zinc-500" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Drag & Drop or Click Here</h2>
                            <p className="text-zinc-500 text-xs font-medium mt-1">100% Private PDF Splitting • Extract Pages Securely</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Controls bar */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                                <Split size={16} className="text-white" />
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
                                className="bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 px-4 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-white/50 flex-grow"
                            />
                            <button onClick={applyRange} disabled={!rangeInput.trim()} className="h-10 px-4 bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wide rounded-full hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                                Apply Range
                            </button>
                        </div>

                        <div className="flex gap-2 shrink-0 border-r border-zinc-800 pr-4 mr-2">
                            <button onClick={reset} className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-white border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors" title="Start Fresh">
                                <X size={14} />
                            </button>
                            <button onClick={selectAll} className="h-9 px-4 text-xs font-semibold tracking-wide text-zinc-400 hover:text-white border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">All</button>
                            <button onClick={clearAll} className="h-9 px-4 text-xs font-semibold tracking-wide text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">None</button>
                        </div>
                    </div>

                    {/* Pages Grid */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-zinc-900 pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    Select Pages <span className="text-white">({selectedCount} / {pageCount} selected)</span>
                                </h3>
                                <span className="text-[11px] tracking-wider text-zinc-500 font-semibold block mt-1">Click to toggle • Green = included</span>
                            </div>
                            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                                <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)"><Undo size={14} /></button>
                                <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Redo (Ctrl+Y)"><Redo size={14} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                            {pages.map((p) => (
                                <button
                                    key={p.index}
                                    onClick={() => togglePage(p.index)}
                                    className={`group relative h-36 rounded-2xl flex flex-col items-center p-2 transition-all duration-200 border-2 ${
                                        p.selected
                                            ? "border-white bg-white/10 hover:bg-white/20"
                                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 opacity-50 hover:opacity-70"
                                    }`}
                                >
                                    {/* Selection indicator (Top Left) */}
                                    <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${p.selected ? "bg-white border-white text-black" : "bg-zinc-800 border-zinc-700 text-transparent"}`}>
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                    
                                    {/* Cross symbol to deselect/remove (Top Right) */}
                                    {p.selected && (
                                        <div 
                                            className="absolute top-2 right-2 w-5 h-5 bg-black/60 backdrop-blur-md text-white rounded-md flex items-center justify-center hover:bg-red-500 transition-colors z-10 border border-white/10"
                                            onClick={(e) => { e.stopPropagation(); togglePage(p.index); }}
                                        >
                                            <X size={12} />
                                        </div>
                                    )}

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

                    {/* Export / Actions button */}
                    {!outputUrl ? (
                        <button
                            onClick={exportPdf}
                            disabled={selectedCount === 0 || isExporting}
                            className={`w-full h-14 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all ${selectedCount === 0 ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed" : "bg-white text-black hover:bg-white shadow-lg shadow-white/20"}`}
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
                                className="h-12 px-6 bg-white text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
                            >
                                <Download size={18} /> 
                                <span className="hidden sm:inline">Download Split PDF</span>
                                <span className="sm:hidden">Download PDF</span>
                            </button>
                            <button
                                onClick={() => setIsSharing(true)}
                                className="h-12 px-6 bg-zinc-900 border border-zinc-800 text-white font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-zinc-800"
                            >
                                <Share2 size={18} /> 
                                <span className="hidden sm:inline">Share to Mobile</span>
                                <span className="sm:hidden">Share File</span>
                            </button>
                            <button
                                onClick={reset}
                                className="sm:col-span-2 h-12 px-6 bg-transparent border border-zinc-800 text-zinc-400 hover:text-white font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all"
                            >
                                <RefreshCw size={14} /> Split Another PDF
                            </button>
                        </div>
                    )}
                </div>
            )}

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Splitter Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Visual Document Extraction Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for document decomposition. AssetNest <strong>Advanced PDF Splitter</strong> transcends basic page range extraction—it provides a structural editor where you can manipulate PDF page maps with zero loss in quality and absolute data privacy. Whether you are extracting a single signature page from a massive legal transcript, splitting complex architectural blueprints, or distilling a personal portfolio into targeted assets, our tool gives you the power to slice and compile your documents with industry-leading precision and zero server dependency.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Layout size={20} className="text-zinc-500" />
                                How to Split Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Universal Support:</strong> Drop any standard PDF container. Our engine renders every page thumbnail for physical verification.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Visual Page Selector:</strong> Click to include or exclude specific pages, or use range syntax (e.g., 1-5, 8, 12) for fast batching.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Lossless Re-Cataloging:</strong> We preserve every vector, font, and high-res asset in the extracted container. Zero quality degradation.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive document data on external servers, our splitter operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • Internal Vector Map Re-Splicing • Metadata Integrity Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Multiple Splits?">
                                Yes. You can extract as many independent page sets as you need by resetting the selection map.
                            </AccordionItem>
                            <AccordionItem title="Quality Loss?">
                                Zero. We use surgical stream-splitting technology that leaves the original data objects untouched.
                            </AccordionItem>
                            <AccordionItem title="Secure Uploads?">
                                There are no uploads. Your file resides entirely in your computer&apos;s memory during the entire process.
                            </AccordionItem>
                        </Accordion>
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
