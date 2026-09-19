"use client";

import "@/lib/pdfjs-polyfill";
import React, { useState, useRef } from "react";
import {
    Upload, Download, RefreshCw, Split, Info, X, Scissors,
    Undo, Redo, Share2, Layout, Check, ShieldCheck, Sparkles,
    Package, Lock as LockIcon, FileText, Grid, Zap, ChevronDown,
    ArrowLeft, HelpCircle, UploadCloud
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });

/* ─────────────────────────────────────────
   DESIGN TOKENS (Matching Tool Suite Standard)
   ───────────────────────────────────────── */
const T = {
    bg:          "#333333",
    surface:     "#3a3a3a",
    surfaceHi:   "#444444",
    surfaceHov:  "#505050",
    border:      "#555555",
    borderDim:   "#2a2a2a",
    accent:      "#4db8d4",
    accentDark:  "#2a7a8f",
    accentDim:   "rgba(77,184,212,0.15)",
    textPri:     "#cccccc",
    textSec:     "#999999",
    muted:       "#777777",
    danger:      "#cc4444",
    success:     "#7dcea0",
    font:        "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 2,
      background: T.surface, border: `1px solid ${T.border}`,
      fontSize: 10, fontWeight: 400, color: "#aaa",
    }}>{icon}{label}</span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
      padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.textPri, margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
        </h4>
        <span style={{ color: T.textSec, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
      </div>
    </div>
  );
}

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Splitter",
    description: "Split and extract pages from a PDF instantly in your browser. 100% private, no uploads.",
    url: "https://assetnest.gloyas.com/tools/pdf-splitter",
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
        if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
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
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            
            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                input[type=range] { accent-color: ${T.accent}; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666666; }
            `}</style>

            {/* ── HEADER ── */}
            <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Link href="/tools" style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
                    color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
                }}>
                    <ArrowLeft size={11} strokeWidth={2} /> Back
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                        <Scissors size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Splitter</span>
                    <button 
                        onClick={() => setShowHelp(true)} 
                        style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.muted, cursor: "pointer", display: "flex" }}
                        title="Help Guide"
                    >
                        <HelpCircle size={11} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: "10px 14px", border: `1px solid ${T.danger}`, background: "#3d2222",
                        display: "flex", alignItems: "center", gap: 10, borderRadius: 3, marginBottom: 16
                    }}>
                        <Info size={14} style={{ color: T.danger, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#ff9999", flex: 1 }}>{error}</span>
                        <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", display: "flex" }}>
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Main Workspace */}
                {!file ? (
                    /* Dropzone */
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            minHeight: 240,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            border: `1px dashed ${isDragging ? T.accent : T.border}`,
                            borderRadius: 4, background: isDragging ? T.surfaceHi : T.surface,
                            cursor: "pointer", transition: "all 0.2s", padding: 24,
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <UploadCloud size={22} />}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                Drop your PDF here
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>
                                or click to browse · 100% Client-side Processing
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                <Chip icon={<Package size={10} />} label="No Server Upload" />
                                <Chip icon={<Sparkles size={10} />} label="Instant Extraction" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Controls Toolbar */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: "14px 18px",
                            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                            gap: 12
                        }}>
                            {/* File Info */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 3, background: T.surfaceHi,
                                    border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                                    color: T.accent
                                }}>
                                    <Split size={14} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: T.textPri, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textSec }}>
                                        {pageCount} page{pageCount !== 1 ? "s" : ""} total
                                    </div>
                                </div>
                            </div>

                            {/* Range input */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 200 }}>
                                <input
                                    type="text"
                                    value={rangeInput}
                                    onChange={e => setRangeInput(e.target.value)}
                                    placeholder="e.g. 1, 3-5, 8"
                                    style={{
                                        flex: 1, background: "#2a2a2a", border: `1px solid ${T.border}`,
                                        borderRadius: 3, padding: "6px 10px", fontSize: 11, color: T.textPri,
                                        outline: "none"
                                    }}
                                />
                                <button 
                                    onClick={applyRange} 
                                    disabled={!rangeInput.trim()}
                                    style={{
                                        padding: "6px 12px", background: !rangeInput.trim() ? T.surfaceHi : T.accent,
                                        border: `1px solid ${!rangeInput.trim() ? T.border : T.accent}`,
                                        borderRadius: 3, color: !rangeInput.trim() ? T.muted : "#1a1a1a",
                                        fontWeight: 600, fontSize: 11, cursor: !rangeInput.trim() ? "not-allowed" : "pointer",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    Apply Range
                                </button>
                            </div>

                            {/* Selection actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button 
                                    onClick={selectAll}
                                    style={{
                                        padding: "5px 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textPri, fontSize: 11, cursor: "pointer"
                                    }}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={clearAll}
                                    style={{
                                        padding: "5px 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, fontSize: 11, cursor: "pointer"
                                    }}
                                >
                                    None
                                </button>
                                <button 
                                    onClick={reset}
                                    style={{
                                        padding: "5px 8px", background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center"
                                    }}
                                    title="Start Fresh"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Pages Selection Grid */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14
                        }}>
                            {/* Grid Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: `1px solid ${T.borderDim}` }}>
                                <div>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>
                                        Select Pages:
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginLeft: 6 }}>
                                        {selectedCount} / {pageCount} selected
                                    </span>
                                    <span style={{ fontSize: 10, color: T.textSec, marginLeft: 10 }}>
                                        (click to toggle)
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#2e2e2e", padding: 2, borderRadius: 3, border: `1px solid ${T.borderDim}` }}>
                                    <Tooltip content="Undo (Ctrl+Z)">
                                        <button 
                                            onClick={undo} 
                                            disabled={!canUndo}
                                            style={{
                                                padding: "3px 6px", background: "transparent", border: "none",
                                                color: canUndo ? T.textPri : T.muted, cursor: canUndo ? "pointer" : "not-allowed",
                                                borderRadius: 2, display: "flex"
                                            }}
                                        >
                                            <Undo size={12} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Redo (Ctrl+Y)">
                                        <button 
                                            onClick={redo} 
                                            disabled={!canRedo}
                                            style={{
                                                padding: "3px 6px", background: "transparent", border: "none",
                                                color: canRedo ? T.textPri : T.muted, cursor: canRedo ? "pointer" : "not-allowed",
                                                borderRadius: 2, display: "flex"
                                            }}
                                        >
                                            <Redo size={12} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Page Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                                {pages.map((p) => (
                                    <button
                                        key={p.index}
                                        type="button"
                                        onClick={() => togglePage(p.index)}
                                        style={{
                                            position: "relative", height: 140, borderRadius: 3,
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            padding: 6, cursor: "pointer", transition: "all 0.15s",
                                            background: p.selected ? "#383838" : "#2a2a2a",
                                            border: `1px solid ${p.selected ? T.accent : T.borderDim}`,
                                            opacity: p.selected ? 1 : 0.65
                                        }}
                                    >
                                        {/* Check Indicator Top-Left */}
                                        <div style={{
                                            position: "absolute", top: 6, left: 6, width: 18, height: 18,
                                            borderRadius: 2, border: `1px solid ${p.selected ? T.accent : T.border}`,
                                            background: p.selected ? T.accent : "#222222",
                                            color: p.selected ? "#1a1a1a" : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            zIndex: 10
                                        }}>
                                            <Check size={11} strokeWidth={3} />
                                        </div>

                                        {/* Thumbnail container */}
                                        <div style={{
                                            flex: 1, width: "100%", position: "relative", overflow: "hidden",
                                            background: "#222222", borderRadius: 2, border: `1px solid ${T.borderDim}`,
                                            marginTop: 2
                                        }}>
                                            <PdfPageThumbnail file={file} pageIndex={p.index} />
                                            <div style={{
                                                position: "absolute", top: 3, right: 3,
                                                background: "#2a2a2a", border: `1px solid ${T.border}`,
                                                color: T.accent, fontSize: 8, fontFamily: "monospace",
                                                padding: "1px 4px", borderRadius: 2
                                            }}>
                                                P.{p.index + 1}
                                            </div>
                                        </div>

                                        {/* Bottom label */}
                                        <span style={{ fontSize: 10, fontWeight: 500, color: p.selected ? T.textPri : T.muted, marginTop: 4 }}>
                                            Page {p.index + 1}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export / Actions button */}
                        {!outputUrl ? (
                            <button
                                onClick={exportPdf}
                                disabled={selectedCount === 0 || isExporting}
                                style={{
                                    width: "100%", height: 42,
                                    background: selectedCount === 0 ? T.surfaceHi : T.accent,
                                    border: `1px solid ${selectedCount === 0 ? T.border : T.accent}`,
                                    borderRadius: 3, color: selectedCount === 0 ? T.muted : "#1a1a1a",
                                    fontWeight: 600, fontSize: 12,
                                    cursor: selectedCount === 0 || isExporting ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "all 0.15s"
                                }}
                            >
                                {isExporting ? (
                                    <><RefreshCw size={14} className="animate-spin" /> Exporting Selected Pages...</>
                                ) : (
                                    <><Download size={14} /> Export {selectedCount} Selected Page{selectedCount !== 1 ? "s" : ""} as PDF</>
                                )}
                            </button>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <button
                                    onClick={downloadPdf}
                                    style={{
                                        height: 38, background: T.accent, border: `1px solid ${T.accent}`,
                                        borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                >
                                    <Download size={14} /> Download Split PDF
                                </button>
                                <button
                                    onClick={() => setIsSharing(true)}
                                    style={{
                                        height: 38, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textPri, fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                >
                                    <Share2 size={14} /> Share to Mobile
                                </button>
                                <button
                                    onClick={reset}
                                    style={{
                                        height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        gridColumn: "1 / -1", transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                >
                                    <RefreshCw size={13} /> Split Another PDF
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── SEO RICH CONTENT SECTION ─── */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderDim}`, paddingTop: 36 }}>
                    {/* Top Badges */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                        <Chip icon={<ShieldCheck size={10} />} label="100% In-Browser Privacy" />
                        <Chip icon={<Sparkles size={10} />} label="Free & Unlimited" />
                        <Chip icon={<Package size={10} />} label="No Server Uploads" />
                    </div>

                    {/* Section Header */}
                    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 36px" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 500, color: T.textPri, marginBottom: 8 }}>
                            Free PDF Splitter Online - Extract PDF Pages Privately
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Split, extract, and re-compile PDF pages instantly in your web browser. Our client-side PDF splitter lets you visually select specific pages or define exact range arrays (e.g. 1-3, 5, 8). Keep your highly confidential files entirely safe - all operations are processed in-memory with absolutely no cloud uploads.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Grid,
                                title: "Visual Page Selection Map",
                                desc: "See clear rendered thumbnails of every single page. Toggle selections manually or input quick numeric range arrays."
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Private Client Execution",
                                desc: "Your documents are processed locally via browser scripts. They are never transmitted, stored, or reviewed remotely."
                            },
                            {
                                icon: Scissors,
                                title: "Lossless PDF Page Extraction",
                                desc: "Extract structural nodes while preserving native vectors, image layers, active hyperlinks, and font properties."
                            },
                            {
                                icon: Zap,
                                title: "Blazing Fast Page Compiles",
                                desc: "No internet upload queue delay. The engine extracts pages and compiles the target PDF instantly in browser cache."
                            },
                            {
                                icon: Package,
                                title: "No File Upload Size Caps",
                                desc: "Split simple double-page contracts or massive multi-megabyte handbooks. Capacity is only restricted by your browser memory."
                            },
                            {
                                icon: LockIcon,
                                title: "Completely Free & Clean",
                                desc: "Export unlimited documents without watermarks, sign-up constraints, credit cards, or subscription blocks."
                            }
                        ].map(f => (
                            <div key={f.title} style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ color: T.accent }}>
                                        <f.icon size={15} />
                                    </div>
                                    <h3 style={{ fontSize: 12, fontWeight: 500, margin: 0, color: T.textPri }}>{f.title}</h3>
                                </div>
                                <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Step Timeline */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 44 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 20 }}>
                            How to Split PDF Files Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select PDF Document", desc: "Drag and drop your target PDF file into the secure extraction dropbox or browse files." },
                                { step: "2", title: "Choose Target Pages", desc: "Click page thumbnails or input custom range patterns like '1-3, 5' to configure extraction." },
                                { step: "3", title: "Download Split PDF", desc: "Click 'Export Selected Pages' and download your newly compiled custom PDF instantly." }
                            ].map(s => (
                                <div key={s.step} style={{ padding: 14, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 3, position: "relative", paddingTop: 20 }}>
                                    <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {s.step}
                                    </div>
                                    <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 6px" }}>{s.title}</h4>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Accordion Section */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 16 }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="How does client-side PDF splitting ensure privacy?"
                                answer="Our engine runs WebAssembly and local JavaScript directly in your browser. Since your PDF data is never uploaded to any remote server, your confidential files never leave your device."
                            />
                            <FAQItem 
                                question="Can I extract non-consecutive pages?"
                                answer="Yes! You can either click on the exact thumbnails you want, or type ranges like '1-3, 5, 8-10' in the range input bar."
                            />
                            <FAQItem 
                                question="Will hyperlinks or embedded text be damaged?"
                                answer="No. Page extraction is structural and lossless. Vector text, font tables, and embedded media are copied with original resolution intact."
                            />
                            <FAQItem 
                                question="Are there any fees or watermarks?"
                                answer="None. The tool is 100% free with unlimited usage and zero watermark injections."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Splitter Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Visual Page Extraction Architecture
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            AssetNest Visual PDF Splitter provides a clean, visual canvas where you can extract specific pages or prune unneeded sections. Designed for legal briefs, financial reports, academic papers, and portfolios.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Scissors size={14} style={{ color: T.accent }} /> Splitting Modes
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Visual Card Click:</strong> Click individual page cards to toggle them on or off.</li>
                                <li><strong>Range Input:</strong> Type expressions like '1-3, 5' to instantly select blocks.</li>
                                <li><strong>Quick All / None:</strong> Quick buttons to batch-select or clear pages.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Compliance
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Files remain strictly in your local device RAM. No server uploads or cloud caches are involved.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: Local Buffer Partitioning • Zero-Server Footprint • Clean Vector Preservation
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Is it completely free?" 
                                answer="Yes. No page limits, hidden subscription tiers, or fees." 
                            />
                            <FAQItem 
                                question="Can I undo or redo page selections?" 
                                answer="Yes. Built-in Undo and Redo buttons track your selection changes." 
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>

            {/* Share Modal */}
            <ShareModal 
                isOpen={isSharing} 
                onClose={() => setIsSharing(false)} 
                file={outputBlob} 
                fileName={`Split_${selectedCount}pages_${file?.name ?? "document.pdf"}`} 
            />
        </div>
    );
}
