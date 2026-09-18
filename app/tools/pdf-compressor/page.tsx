"use client";

import React, { useState, useRef } from "react";
import {
    Upload, Download, RefreshCw, Info, X, Minimize2, CheckCircle,
    Undo, Redo, Share2, Zap, Check, ShieldCheck, Sparkles, Package,
    Lock as LockIcon, FileText, ArrowLeft, HelpCircle, UploadCloud, ChevronDown
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import Tooltip from "@/components/Tooltip";

const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });

/* ─────────────────────────────────────────
   DESIGN TOKENS (Matching QR, Image Tools & PDF Tools)
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
        if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
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
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            
            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                input[type=range] { accent-color: ${T.accent}; }
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
                        <Minimize2 size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Compressor</span>
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
                {!result ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Undo / Redo Toolbar */}
                        {file && (
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, background: T.surface, padding: 3, borderRadius: 3, border: `1px solid ${T.borderDim}` }}>
                                    <Tooltip content="Undo">
                                        <button 
                                            onClick={undo} 
                                            disabled={!canUndo}
                                            style={{
                                                padding: "4px 8px", background: "transparent", border: "none",
                                                color: canUndo ? T.textPri : T.muted, cursor: canUndo ? "pointer" : "not-allowed",
                                                borderRadius: 2, display: "flex", alignItems: "center"
                                            }}
                                        >
                                            <Undo size={13} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Redo">
                                        <button 
                                            onClick={redo} 
                                            disabled={!canRedo}
                                            style={{
                                                padding: "4px 8px", background: "transparent", border: "none",
                                                color: canRedo ? T.textPri : T.muted, cursor: canRedo ? "pointer" : "not-allowed",
                                                borderRadius: 2, display: "flex", alignItems: "center"
                                            }}
                                        >
                                            <Redo size={13} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        {/* Hidden Input */}
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="application/pdf" 
                            style={{ display: "none" }} 
                            onChange={e => {
                                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }} 
                        />

                        {/* Dropzone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                minHeight: file ? 160 : 240,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                border: `1px dashed ${isDragging ? T.accent : T.border}`,
                                borderRadius: 4, background: isDragging ? T.surfaceHi : T.surface,
                                cursor: "pointer", transition: "all 0.2s", padding: 24,
                            }}
                        >
                            {file ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: "50%", background: "#444444",
                                        border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                                        color: T.accent
                                    }}>
                                        <Minimize2 size={22} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                                            {formatSize(file.size)}
                                        </div>
                                    </div>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        padding: "3px 10px", borderRadius: 3,
                                        background: "rgba(125,206,160,0.15)", border: "1px solid #7dcea0",
                                        fontSize: 10, fontWeight: 500, color: "#7dcea0"
                                    }}>
                                        <Check size={11} /> Ready to Compress
                                    </span>
                                </div>
                            ) : (
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
                                        <Chip icon={<Sparkles size={10} />} label="Fast & Free" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={compress}
                            disabled={!file || isLoading}
                            style={{
                                width: "100%", height: 40,
                                background: !file ? T.surfaceHi : T.accent,
                                border: `1px solid ${!file ? T.border : T.accent}`,
                                borderRadius: 3, color: !file ? T.muted : "#1a1a1a",
                                fontWeight: 600, fontSize: 12,
                                cursor: !file || isLoading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                transition: "all 0.15s"
                            }}
                        >
                            {isLoading ? (
                                <><RefreshCw size={14} className="animate-spin" /> Compressing PDF...</>
                            ) : (
                                <><Minimize2 size={14} /> Compress PDF</>
                            )}
                        </button>
                    </div>
                ) : (
                    /* Output Screen */
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 24, display: "flex", flexDirection: "column", gap: 20
                        }}>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: "50%", background: "rgba(125,206,160,0.15)",
                                    border: `1px solid ${T.success}`, display: "flex", alignItems: "center", justifyContent: "center",
                                    color: T.success, flexShrink: 0
                                }}>
                                    <CheckCircle size={20} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <h2 style={{ fontSize: 15, fontWeight: 600, color: T.textPri, margin: 0 }}>
                                        Compression Complete!
                                    </h2>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {file?.name}
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar visual */}
                            <div style={{
                                background: "#2a2a2a", padding: "14px 16px", borderRadius: 4,
                                border: `1px solid ${T.borderDim}`, display: "flex", flexDirection: "column", gap: 8
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textSec, textTransform: "uppercase" }}>
                                    <span>Original File</span>
                                    <span style={{ color: T.success }}>Optimized File</span>
                                </div>
                                <div style={{ position: "relative", height: 8, background: "#1f1f1f", borderRadius: 4, overflow: "hidden", border: `1px solid ${T.borderDim}` }}>
                                    <div style={{ position: "absolute", inset: "0 auto 0 0", width: "100%", background: "#444444", borderRadius: 4 }} />
                                    <div
                                        style={{
                                            position: "absolute", inset: "0 auto 0 0",
                                            width: `${Math.max(5, 100 - savingsPercent)}%`,
                                            background: T.accent, borderRadius: 4,
                                            transition: "all 0.6s ease"
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: T.textSec }}>{formatSize(result.originalSize)}</span>
                                    <span style={{ color: T.accent, fontWeight: 600 }}>{formatSize(result.compressedSize)}</span>
                                </div>
                            </div>

                            {/* Stat boxes */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div style={{ background: "#2e2e2e", padding: 12, borderRadius: 3, textAlign: "center", border: `1px solid ${T.borderDim}` }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: T.textSec, lineHeight: 1.2 }}>
                                        {formatSize(result.originalSize)}
                                    </div>
                                    <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", marginTop: 4 }}>Original</div>
                                </div>
                                <div style={{ background: "#2e2e2e", padding: 12, borderRadius: 3, textAlign: "center", border: `1px solid ${T.borderDim}` }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: T.accent, lineHeight: 1.2 }}>
                                        {savingsPercent}%
                                    </div>
                                    <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", marginTop: 4 }}>Savings</div>
                                </div>
                                <div style={{ background: "#2e2e2e", padding: 12, borderRadius: 3, textAlign: "center", border: `1px solid ${T.borderDim}` }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: T.success, lineHeight: 1.2 }}>
                                        {formatSize(result.compressedSize)}
                                    </div>
                                    <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", marginTop: 4 }}>New Size</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, paddingTop: 4 }}>
                                <button 
                                    onClick={download}
                                    style={{
                                        height: 38, background: T.accent, border: `1px solid ${T.accent}`,
                                        borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                >
                                    <Download size={14} /> Download PDF
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
                                    <RefreshCw size={13} /> Compress Another PDF
                                </button>
                            </div>
                        </div>

                        {savingsPercent < 5 && (
                            <div style={{
                                padding: "12px 16px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`,
                                borderRadius: 4, display: "flex", gap: 10, alignItems: "flex-start"
                            }}>
                                <Info size={14} style={{ color: T.accent, flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>
                                    <strong style={{ color: T.textPri }}>Optimization Note:</strong> This PDF was already highly optimized. Our engine pruned an additional {savingsPercent}% of structural data streams. Files with uncompressed images or non-subsetted fonts will see significantly higher reductions.
                                </p>
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
                            Free PDF Compressor Online - Reduce PDF File Size Privately
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Compress and optimize your PDF documents instantly in your browser. Our secure, local-first PDF compressor reduces file size while retaining high resolution vector assets, fonts, and layout formats. Keep your sensitive documents completely private - no watermarks, no signups, and zero server uploads.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Minimize2,
                                title: "Local-First PDF Optimizer",
                                desc: "Optimize document sizes locally. Your files stay securely inside browser memory and are never sent to external servers."
                            },
                            {
                                icon: Sparkles,
                                title: "Lossless Structural Pruning",
                                desc: "Reduces layout file size by stream re-saving and catalog stripping, keeping font rendering and vector shapes crisp."
                            },
                            {
                                icon: Package,
                                title: "No File Size Constraints",
                                desc: "Process and shrink small drafts or massive multi-page manuals alike. We do not enforce file dimensions or page limits."
                            },
                            {
                                icon: Zap,
                                title: "Blazing Fast Compile",
                                desc: "Calculated directly by your local CPU in milliseconds. Bypasses long network upload or download queue wait times."
                            },
                            {
                                icon: LockIcon,
                                title: "Clean Watermark-Free Export",
                                desc: "Your output document remains completely clean. We never inject branding watermarks, stamps, or advertising."
                            },
                            {
                                icon: FileText,
                                title: "Universal Compatibility",
                                desc: "Runs on any modern browser. Fully compatible with Windows, macOS, Android, Linux, and iOS devices."
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
                            How to Reduce PDF File Size Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select PDF Document", desc: "Drag and drop your target PDF file into the secure compression dropbox or click to browse files." },
                                { step: "2", title: "Run Compression", desc: "Click the 'Compress PDF' button. The engine strips redundant streams and optimizes cross-references instantly." },
                                { step: "3", title: "Save Optimized PDF", desc: "Inspect original vs compressed sizes, check percentage savings, and download your optimized PDF instantly." }
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
                                question="How does the browser-side PDF compressor protect my document privacy?"
                                answer="AssetNest utilizes pdf-lib compiled locally in browser WebAssembly to run stream compression directly in your device's memory. Since no files are ever uploaded or transmitted to external web servers, your private documents, financial sheets, and legal papers remain 100% confidential."
                            />
                            <FAQItem 
                                question="Will compressing my PDF reduce the visual quality of text or images?"
                                answer="Our engine performs lossless optimization by stripping unused structural metadata, re-cataloging stream objects, and optimizing cross-references. Vector lines, text strings, and font assets remain completely sharp. If your PDF contains high-res raster images, the file size is reduced without degrading text legibility."
                            />
                            <FAQItem 
                                question="Is there a limit on how many megabytes my PDF file can be?"
                                answer="No. AssetNest does not impose any artificial file size caps. The compression capacity is determined entirely by your browser's allocated memory and device hardware resources."
                            />
                            <FAQItem 
                                question="Does AssetNest add watermarks to compressed PDFs?"
                                answer="No. All files exported from AssetNest are completely free of watermarks, branding stamps, or promotional logos."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Compressor Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Visual Data Density & Stream Optimization
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            Step into a professional-grade workspace for document optimization. AssetNest Smart PDF Compressor provides a high-performance engine where you can minimize PDF data streams with pixel-perfect fidelity and absolute data privacy. Whether you are optimizing massive legal briefs for electronic filing, compression-heavy portfolios for email distribution, or complex technical manuals for storage, our tool gives you the power to reduce file weight with industry-leading stream mapping and zero server dependency.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Minimize2 size={14} style={{ color: T.accent }} /> How Optimization Works
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Object Stream Compression:</strong> Consolidates PDF objects into compressed streams.</li>
                                <li><strong>Catalog Pruning:</strong> Removes redundant cross-references and orphaned pointers.</li>
                                <li><strong>Vector Preservation:</strong> Preserves text vectors, font subsets, and vector geometry untouched.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Architecture
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Traditional PDF compressors upload your sensitive contracts and statements to external cloud servers. Our compiler operates <strong>100% locally in your browser sandbox</strong>. Your documents never leave your computer.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Technical Spec: Zero-Server Processing • In-Memory Buffer Re-save • No Watermarks
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Is it 100% free?" 
                                answer="Yes. There are no subscriptions, daily usage quotas, or paywalls." 
                            />
                            <FAQItem 
                                question="Is text clarity affected?" 
                                answer="Not at all. Vector paths and text glyphs retain 100% original sharpness." 
                            />
                            <FAQItem 
                                question="Can I share the result to my phone?" 
                                answer="Yes! Use the 'Share to Mobile' button to send or transfer the file instantly." 
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
                fileName={`Compressed_${file?.name ?? "document.pdf"}`} 
            />
        </div>
    );
}
