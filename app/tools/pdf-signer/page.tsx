"use client";

import React, { useState, useRef } from "react";
import {
    Upload, Download, RefreshCw, PenTool, Info, X, Check, Save,
    MousePointer2, Layers, FileText, Share2, PenLine, Sparkles,
    Trash2, Globe, ChevronRight, Zap
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
import SignaturePad from "@/components/SignaturePad";
import ShareModal from "@/components/ShareModal";
import { Signature } from "@/app/tools/pdf-signer/types";

const PdfViewer = dynamic<any>(
    () => import("@/app/tools/pdf-signer/PdfViewer").then(m => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] flex flex-col items-center justify-center gap-4 bg-zinc-950 border border-zinc-900 rounded-[2.5rem]">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-zinc-500 font-bold uppercase tracking-[0.25em] text-[10px]">Initialising Engine…</span>
            </div>
        ),
    }
);

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Smart PDF Signer",
    description: "Sign PDF documents professionally. Select an area, draw your signature, and apply it to one or all pages instantly. 100% private, browser-based.",
    url: "https://www.assetnest.space/tools/pdf-signer",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* ─── Reusable button variants ─────────────────────────────────── */
const btn = {
    primary:   "inline-flex items-center justify-center gap-2.5 px-8 h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-black text-[11px] font-extrabold uppercase tracking-[0.18em] shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
    secondary: "inline-flex items-center justify-center gap-2.5 px-7 h-13 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.97] border border-white/[0.08] hover:border-white/[0.16] text-white text-[11px] font-extrabold uppercase tracking-[0.18em] transition-all duration-200",
    ghost:     "inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.05] active:scale-95 text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200",
    danger:    "inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] active:scale-95 text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200",
    icon:      "w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14] text-zinc-500 hover:text-white active:scale-90 transition-all duration-200",
};

export default function PdfSignerPage() {
    const [file,        setFile]        = useState<File | null>(null);
    const [pageCount,   setPageCount]   = useState(0);
    const [isLoading,   setIsLoading]   = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [outputUrl,   setOutputUrl]   = useState<string | null>(null);
    const [outputBlob,  setOutputBlob]  = useState<Blob | null>(null);
    const [isSharing,   setIsSharing]   = useState(false);
    const [signatures,  setSignatures]  = useState<Signature[]>([]);
    const [activeBox,   setActiveBox]   = useState<{ pageIndex: number; x: number; y: number; w: number; h: number } | null>(null);
    const [isPadOpen,   setIsPadOpen]   = useState(false);
    const [isDragging,  setIsDragging]  = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
        // We delay PDF parsing to the viewer/export stages to prevent strict 
        // pdf-lib parsing errors and mobile memory limit crashes on raw upload.
        setIsLoading(true); setError(null); setFile(f); setSignatures([]); setOutputUrl(null); setOutputBlob(null);
        setIsLoading(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    /* ── Signature flow ── */
    const handleBoxSelected = (box: typeof activeBox) => { setActiveBox(box); setIsPadOpen(true); };

    const onSignatureSaved = (dataUrl: string) => {
        if (!activeBox) return;
        setSignatures(prev => [...prev, {
            id: crypto.randomUUID(),
            dataUrl,
            pageIndex: activeBox.pageIndex,
            x: activeBox.x, y: activeBox.y,
            width: activeBox.w, height: activeBox.h,
            allPages: false,
        }]);
        setIsPadOpen(false); setActiveBox(null);
    };

    const toggleAllPages = (id: string) =>
        setSignatures(prev => prev.map((s: Signature) => s.id === id ? { ...s, allPages: !s.allPages } : s));

    const removeSignature = (id: string) =>
        setSignatures(prev => prev.filter((s: Signature) => s.id !== id));

    const reset = () => {
        setFile(null); setSignatures([]); setPageCount(0);
        setError(null); setOutputUrl(null); setOutputBlob(null); setIsSharing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    /* ── Export ── */
    const exportSignedPdf = async () => {
        if (!file || signatures.length === 0) return;
        setIsExporting(true);
        try {
            const buf    = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const pages  = pdfDoc.getPages();

            for (const sig of signatures) {
                const b64  = sig.dataUrl.split(",")[1];
                const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                const img  = await pdfDoc.embedPng(bytes);
                const applyTo = (idx: number) => {
                    if (idx < 0 || idx >= pages.length) return;
                    const page = pages[idx];
                    const { width, height } = page.getSize();
                    page.drawImage(img, {
                        x: sig.x * width,
                        y: (1 - sig.y - sig.height) * height,
                        width:  sig.width  * width,
                        height: sig.height * height,
                    });
                };
                sig.allPages ? pages.forEach((_, i) => applyTo(i)) : applyTo(sig.pageIndex);
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            setOutputBlob(blob);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError("Could not generate signed PDF. Please ensure the file is not corrupted.");
        } finally { setIsExporting(false); }
    };

    const downloadPdf = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl; a.download = `Signed_${file.name}`; a.click();
    };

    /* ── Render ── */
    return (
        <div className="min-h-[70vh] py-8 px-4 max-w-5xl mx-auto overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* ══ HERO ══ */}
            <div className="text-center mb-8 px-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5 mb-5 rounded-full max-w-full overflow-hidden">
                    <Sparkles size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase text-emerald-400 truncate">100% Browser-Based · Private</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-3 leading-none">
                    Smart PDF <span className="text-emerald-500">Signer</span>
                </h1>
                <p className="text-zinc-500 text-[11px] font-medium max-w-[260px] sm:max-w-sm mx-auto leading-relaxed">
                    Draw · Place · Sign · Export — all in your browser
                </p>
            </div>

            {/* ══ ERROR BANNER ══ */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                    <Info size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-semibold text-red-200 flex-1">{error}</span>
                    <button onClick={() => setError(null)} className={btn.icon + " w-8 h-8 rounded-lg"}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ══ UPLOAD ZONE ══ */}
            {!file ? (
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative min-h-[280px] sm:min-h-[420px] border-2 border-dashed rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center cursor-pointer
                        transition-all duration-500 group overflow-hidden
                        ${isDragging
                            ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]"
                            : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/30"
                        }
                    `}
                >
                    <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                    {/* Ambient glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="relative text-center px-8 space-y-6 z-10">
                        <div className={`
                            w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl
                            transition-all duration-500
                            ${isDragging ? "bg-emerald-500 scale-110 shadow-emerald-500/40" : "bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/40 group-hover:scale-105"}
                        `}>
                            {isLoading
                                ? <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                : <Upload size={32} className={isDragging ? "text-black" : "text-zinc-500 group-hover:text-emerald-400 transition-colors duration-300"} />
                            }
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                                {isLoading ? "Reading your PDF…" : isDragging ? "Drop it!" : "Drop your PDF here"}
                            </h2>
                            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em]">
                                {isLoading ? "Preparing signature workspace" : "or click to browse — PDF files only"}
                            </p>
                        </div>

                        {!isLoading && (
                            <div className="flex items-center gap-2 justify-center pt-2 flex-wrap">
                                {[{icon: FileText, label: "PDF"}, {icon: Zap, label: "Instant"}, {icon: Check, label: "Private"}].map(b => (
                                    <div key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-full">
                                        <b.icon size={11} className="text-emerald-400" />
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{b.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ── TOOLBAR ── */}
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl gap-3 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                <PenLine size={22} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-black text-white truncate max-w-[160px] sm:max-w-xs">{file.name}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                    {pageCount} pg · {signatures.length} sig
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={reset} className={btn.danger} title="Close document">
                                <X size={14} /> <span className="hidden sm:inline">Close</span>
                            </button>
                            {!outputUrl && (
                                <button
                                    onClick={exportSignedPdf}
                                    disabled={signatures.length === 0 || isExporting}
                                    className={btn.primary + " text-[10px] px-4 sm:px-8"}
                                >
                                    {isExporting
                                        ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> <span className="hidden sm:inline">Finalising…</span></>  
                                        : <><Save size={14} /> <span className="hidden sm:inline">Finalise</span><span className="sm:hidden">Sign PDF</span></>
                                    }
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── SUCCESS CARD ── */}
                    {outputUrl && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-zinc-950 to-zinc-950 border border-emerald-500/20 p-8 md:p-10 rounded-[3rem] flex flex-col items-center gap-8 text-center animate-in zoom-in-95 duration-500 shadow-[0_0_80px_rgba(16,185,129,0.08)]">
                            {/* Ambient */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative w-20 h-20 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-[0_16px_40px_rgba(16,185,129,0.4)]">
                                <Check size={36} strokeWidth={3} />
                            </div>

                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter">Document Signed!</h3>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em] mt-2">
                                    {signatures.length} signature{signatures.length !== 1 ? "s" : ""} embedded · ready for professional use
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 w-full max-w-sm">
                                <button
                                    onClick={downloadPdf}
                                    className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-100 active:scale-[0.97] text-black text-xs font-extrabold uppercase tracking-widest shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Download size={16} /> Download Signed PDF
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSharing(true)}
                                        className="flex-1 h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.97] border border-zinc-700/60 hover:border-emerald-500/30 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={15} className="text-emerald-400" /> Share to Mobile
                                    </button>
                                    <button
                                        onClick={() => setOutputUrl(null)}
                                        className={btn.ghost + " h-11"}
                                    >
                                        Edit More
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SIGNATURES PANEL ── */}
                    {!outputUrl && signatures.length > 0 && (
                        <div className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-[2.5rem] animate-in fade-in duration-300">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-1">
                                Active Signatures ({signatures.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {signatures.map(sig => (
                                    <div
                                        key={sig.id}
                                        className="group flex items-center gap-3 h-11 pl-2 pr-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all duration-200"
                                    >
                                        {/* Sig thumbnail */}
                                        <div className="w-10 h-6 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                            <img src={sig.dataUrl} alt="sig" className="h-full w-full object-contain" />
                                        </div>

                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tight">
                                            Pg {sig.pageIndex + 1}
                                        </span>

                                        {/* Toggle all-pages */}
                                        <button
                                            onClick={() => toggleAllPages(sig.id)}
                                            className={`flex items-center gap-1.5 px-3 h-6 rounded-full text-[8px] font-black uppercase tracking-tight transition-all duration-200 ${
                                                sig.allPages
                                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                                                    : "bg-zinc-800 text-zinc-500 hover:text-white"
                                            }`}
                                        >
                                            {sig.allPages ? <><Globe size={9} /> All Pages</> : "Single Page"}
                                        </button>

                                        {/* Remove — always visible on mobile, hover-only on desktop */}
                                        <button
                                            onClick={() => removeSignature(sig.id)}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── DOCUMENT VIEWER ── */}
                    {!outputUrl && (
                        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] sm:rounded-[3rem] p-1 shadow-2xl">
                            <PdfViewer
                                file={file}
                                signatures={signatures}
                                setSignatures={setSignatures}
                                onBoxSelected={handleBoxSelected}
                                applyToAllPages={(sig: any) => toggleAllPages(sig.id)}
                                onLoadSuccess={setPageCount}
                            />
                        </div>
                    )}

                    {/* ── HINT: no signatures yet ── */}
                    {!outputUrl && signatures.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                ↑ Drag a rectangle on the document above to place your first signature
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ══ FEATURE GRID (shown before upload) ══ */}
            {!file && (
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900/60 pt-10">
                    {[
                        {
                            icon: MousePointer2, color: "emerald",
                            title: "Precision Placement",
                            desc: "Drag a rectangle anywhere on any page to define exactly where your signature appears."
                        },
                        {
                            icon: Layers, color: "blue",
                            title: "Multi-Page Sync",
                            desc: "Toggle any signature to stamp every page simultaneously — perfect for contracts."
                        },
                        {
                            icon: Shield, color: "violet",
                            title: "100% Private",
                            desc: "Everything runs in your browser. Your PDF never touches a server."
                        },
                    ].map((f, i) => (
                        <div key={i} className="group text-center flex flex-col items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500
                                ${f.color === "emerald" ? "bg-emerald-500/5 border-emerald-500/20 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/40" :
                                  f.color === "blue"    ? "bg-blue-500/5 border-blue-500/20 group-hover:bg-blue-500/10 group-hover:border-blue-500/40" :
                                                          "bg-violet-500/5 border-violet-500/20 group-hover:bg-violet-500/10 group-hover:border-violet-500/40"}`}>
                                <f.icon size={22} className={
                                    f.color === "emerald" ? "text-emerald-500" :
                                    f.color === "blue"    ? "text-blue-500"    : "text-violet-500"
                                } />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.25em] mb-2">{f.title}</h4>
                                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-[200px] mx-auto">{f.desc}</p>
                            </div>
                        </div>
                    ))}

                    <div className="col-span-1 md:col-span-3 text-center pt-6">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                            <Sparkles size={11} className="text-emerald-400" />
                            <span className="text-[9px] font-black tracking-widest text-emerald-500/80 uppercase">
                                Free · No login · No watermarks
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ SIGNATURE PAD MODAL ══ */}
            {isPadOpen && (
                <SignaturePad
                    onCancel={() => { setIsPadOpen(false); setActiveBox(null); }}
                    onSave={onSignatureSaved}
                />
            )}

            {/* ══ SHARE MODAL ══ */}
            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={outputBlob}
                fileName={file ? `Signed_${file.name}` : "signed_document.pdf"}
            />
        </div>
    );
}

/* ── Inline Shield SVG ── */
const Shield = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
);
