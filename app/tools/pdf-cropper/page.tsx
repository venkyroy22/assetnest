"use client";

import "@/lib/pdfjs-polyfill";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload, Download, RefreshCw, Crop, Info, X, Check,
    ChevronLeft, ChevronRight, ShieldCheck, Layout, Share2, Eye,
    Sparkles, Package, Lock as LockIcon, Zap, ChevronDown, ArrowLeft,
    HelpCircle, UploadCloud, FileText
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import HelpModal from "@/components/HelpModal";
import ShareModal from "@/components/ShareModal";
import dynamic from "next/dynamic";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });

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

// ─── Types ───────────────────────────────────────────────────────────────────
interface CropBox {
    x: number; // 0..1 relative to rendered canvas width
    y: number;
    w: number;
    h: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_CROP: CropBox = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
const MIN_SIZE = 0.05;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ─── CropPreviewCanvas ────────────────────────────────────────────────────────
interface CropCanvasProps {
    file: File;
    pageIndex: number;
    crop: CropBox;
    onCropChange: (c: CropBox) => void;
}

function CropPreviewCanvas({ file, pageIndex, crop, onCropChange }: CropCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        type: "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;
        startX: number; startY: number;
        startCrop: CropBox;
    } | null>(null);

    // Render PDF page into canvas
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const ab = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
            const page = await pdf.getPage(pageIndex + 1);
            const vp = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx as any, viewport: vp, canvas } as any).promise;
        })();
        return () => { cancelled = true; };
    }, [file, pageIndex]);

    const getRelative = (e: React.PointerEvent | PointerEvent) => {
        const rect = overlayRef.current!.getBoundingClientRect();
        return {
            rx: clamp((e.clientX - rect.left) / rect.width, 0, 1),
            ry: clamp((e.clientY - rect.top) / rect.height, 0, 1),
        };
    };

    const getHandle = (rx: number, ry: number, c: CropBox): typeof dragState.current => {
        const HIT = 0.025;
        const inX = rx > c.x && rx < c.x + c.w;
        const inY = ry > c.y && ry < c.y + c.h;
        const onL = Math.abs(rx - c.x) < HIT;
        const onR = Math.abs(rx - (c.x + c.w)) < HIT;
        const onT = Math.abs(ry - c.y) < HIT;
        const onB = Math.abs(ry - (c.y + c.h)) < HIT;

        let type: typeof dragState.current = null;
        if (onT && onL) type = { type: "nw", startX: 0, startY: 0, startCrop: c };
        else if (onT && onR) type = { type: "ne", startX: 0, startY: 0, startCrop: c };
        else if (onB && onL) type = { type: "sw", startX: 0, startY: 0, startCrop: c };
        else if (onB && onR) type = { type: "se", startX: 0, startY: 0, startCrop: c };
        else if (onT && inX) type = { type: "n", startX: 0, startY: 0, startCrop: c };
        else if (onB && inX) type = { type: "s", startX: 0, startY: 0, startCrop: c };
        else if (onL && inY) type = { type: "w", startX: 0, startY: 0, startCrop: c };
        else if (onR && inY) type = { type: "e", startX: 0, startY: 0, startCrop: c };
        else if (inX && inY) type = { type: "move", startX: 0, startY: 0, startCrop: c };
        return type;
    };

    const getCursor = (rx: number, ry: number, c: CropBox) => {
        const h = getHandle(rx, ry, c);
        if (!h) return "crosshair";
        const map: Record<string, string> = {
            nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize",
            n: "n-resize", s: "s-resize", e: "e-resize", w: "w-resize", move: "move"
        };
        return map[h.type!] ?? "crosshair";
    };

    const [cursor, setCursor] = useState("crosshair");

    const onPointerMove = useCallback((e: PointerEvent) => {
        if (!dragState.current) return;
        const { rx, ry } = getRelative(e as any);
        const { type, startX, startY, startCrop: sc } = dragState.current;
        const dx = rx - startX;
        const dy = ry - startY;

        let { x, y, w, h } = sc;

        if (type === "move") {
            x = clamp(sc.x + dx, 0, 1 - sc.w);
            y = clamp(sc.y + dy, 0, 1 - sc.h);
        } else {
            if (type === "n" || type === "nw" || type === "ne") {
                const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_SIZE);
                h = sc.h + sc.y - ny;
                y = ny;
            }
            if (type === "s" || type === "sw" || type === "se") {
                h = clamp(sc.h + dy, MIN_SIZE, 1 - sc.y);
            }
            if (type === "w" || type === "nw" || type === "sw") {
                const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_SIZE);
                w = sc.w + sc.x - nx;
                x = nx;
            }
            if (type === "e" || type === "ne" || type === "se") {
                w = clamp(sc.w + dx, MIN_SIZE, 1 - sc.x);
            }
        }
        onCropChange({ x, y, w, h });
    }, [onCropChange]);

    const onPointerUp = useCallback(() => {
        dragState.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
    }, [onPointerMove]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const { rx, ry } = getRelative(e);
        const h = getHandle(rx, ry, crop);
        if (h) {
            dragState.current = { ...h, startX: rx, startY: ry, startCrop: { ...crop } };
        } else {
            dragState.current = { type: "se", startX: rx, startY: ry, startCrop: { x: rx, y: ry, w: 0.001, h: 0.001 } };
            onCropChange({ x: rx, y: ry, w: 0.001, h: 0.001 });
        }
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragState.current) return;
        const { rx, ry } = getRelative(e as any);
        setCursor(getCursor(rx, ry, crop));
    };

    const { x, y, w, h } = crop;

    return (
        <div style={{
            position: "relative", width: "100%", userSelect: "none",
            background: "#222222", borderRadius: 4, overflow: "hidden",
            border: `1px solid ${T.border}`
        }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
            {/* Overlay */}
            <div
                ref={overlayRef}
                style={{ position: "absolute", inset: 0, touchAction: "none", cursor }}
                onPointerDown={handlePointerDown}
                onMouseMove={handleMouseMove}
            >
                {/* Darkened outer region */}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "none" }} />
                
                {/* Crop window cutout */}
                <div
                    style={{
                        position: "absolute", pointerEvents: "none",
                        border: `1.5px solid ${T.accent}`,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                        left: `${x * 100}%`,
                        top: `${y * 100}%`,
                        width: `${w * 100}%`,
                        height: `${h * 100}%`,
                    }}
                >
                    {/* Rule-of-thirds grid */}
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35 }}>
                        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                            {[0, 1].map(i => (
                                <div key={i} style={{ borderRight: `1px dashed ${T.accent}`, height: "100%", gridColumn: i + 1 }} />
                            ))}
                        </div>
                        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: "1fr 1fr 1fr" }}>
                            {[0, 1].map(i => (
                                <div key={i} style={{ borderBottom: `1px dashed ${T.accent}`, width: "100%", gridRow: i + 1 }} />
                            ))}
                        </div>
                    </div>

                    {/* Corner handles */}
                    {[
                        { top: "-4px", left: "-4px" },
                        { top: "-4px", right: "-4px" },
                        { bottom: "-4px", left: "-4px" },
                        { bottom: "-4px", right: "-4px" }
                    ].map((pos, i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute", width: 8, height: 8,
                                background: T.accent, border: "1px solid #1a1a1a",
                                borderRadius: 1, ...pos
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Numeric input ────────────────────────────────────────────────────────────
function NumInput({ label, value, min, max, step = 0.5, onChange }: {
    label: string; value: number; min: number; max: number; step?: number;
    onChange: (v: number) => void;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: T.textSec, textTransform: "uppercase" }}>{label}</span>
            <div style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "#2a2a2a", border: `1px solid ${T.border}`,
                borderRadius: 3, padding: "4px 8px"
            }}>
                <input
                    type="number"
                    value={value.toFixed(1)}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onChange(clamp(parseFloat(e.target.value) || 0, min, max))}
                    style={{
                        background: "transparent", border: "none", outline: "none",
                        fontSize: 11, fontWeight: 600, color: T.textPri, width: "100%"
                    }}
                />
                <span style={{ color: T.muted, fontSize: 10, fontWeight: 600 }}>%</span>
            </div>
        </div>
    );
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Cropper",
    description: "Visually crop and trim PDF pages in your browser. 100% private, no uploads.",
    url: "https://www.assetnest.space/tools/pdf-cropper",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PdfCropperPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [crops, setCrops] = useState<CropBox[]>([]);
    const [applyToAll, setApplyToAll] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
            setError("Please upload a valid PDF file.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setOutputUrl(null);
        setOutputBlob(null);
        setFile(f);
        setCurrentPage(0);
        try {
            const ab = await f.arrayBuffer();
            const pdf = await PDFDocument.load(ab);
            const count = pdf.getPageCount();
            setPageCount(count);
            setCrops(Array.from({ length: count }, () => ({ ...DEFAULT_CROP })));
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

    const updateCrop = useCallback((c: CropBox) => {
        if (applyToAll) {
            setCrops(prev => prev.map(() => ({ ...c })));
        } else {
            setCrops(prev => prev.map((old, i) => i === currentPage ? { ...c } : old));
        }
    }, [applyToAll, currentPage]);

    const resetCrop = () => {
        updateCrop(DEFAULT_CROP);
    };

    const currentCrop = crops[currentPage] ?? DEFAULT_CROP;

    const setField = (key: keyof CropBox, percentVal: number) => {
        const val = percentVal / 100;
        updateCrop({
            ...currentCrop,
            [key]: val
        });
    };

    const exportPdf = async () => {
        if (!file) return;
        setIsExporting(true);
        try {
            const ab = await file.arrayBuffer();
            const original = await PDFDocument.load(ab);
            const newPdf = await PDFDocument.create();
            const copied = await newPdf.copyPages(original, Array.from({ length: pageCount }, (_, i) => i));

            copied.forEach((page, i) => {
                const crop = crops[i] ?? DEFAULT_CROP;
                const { width, height } = page.getSize();
                const x1 = crop.x * width;
                const y1 = (1 - crop.y - crop.h) * height;
                const x2 = (crop.x + crop.w) * width;
                const y2 = (1 - crop.y) * height;
                page.setCropBox(x1, y1, x2 - x1, y2 - y1);
                page.setMediaBox(x1, y1, x2 - x1, y2 - y1);
                newPdf.addPage(page);
            });

            const bytes = await newPdf.save();
            const blob = new Blob([bytes as any], { type: "application/pdf" });
            setOutputBlob(blob);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const download = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = `Cropped_${file.name}`;
        a.click();
    };

    const reset = () => {
        setFile(null);
        setPageCount(0);
        setCurrentPage(0);
        setCrops([]);
        setOutputUrl(null);
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
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 2px; }
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
                        <Crop size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Cropper</span>
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
                                <Chip icon={<Package size={10} />} label="No File Upload" />
                                <Chip icon={<Sparkles size={10} />} label="Instant Margins" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Top Bar Controls */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: "12px 18px",
                            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                            gap: 12
                        }}>
                            {/* File Info */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 3, background: T.surfaceHi,
                                    border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                                    color: T.accent
                                }}>
                                    <Crop size={14} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: T.textPri, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textSec }}>
                                        {pageCount} page{pageCount !== 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>

                            {/* Batch & Reset Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                    onClick={() => setApplyToAll(!applyToAll)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        padding: "5px 10px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                                        background: applyToAll ? "rgba(77,184,212,0.15)" : T.surfaceHi,
                                        border: `1px solid ${applyToAll ? T.accent : T.border}`,
                                        color: applyToAll ? T.accent : T.textSec, fontWeight: 500
                                    }}
                                >
                                    <Check size={11} style={{ opacity: applyToAll ? 1 : 0 }} />
                                    <span>Apply crop to all pages</span>
                                </button>

                                <button 
                                    onClick={resetCrop}
                                    style={{
                                        padding: "5px 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textPri, fontSize: 11, cursor: "pointer"
                                    }}
                                >
                                    Reset Crop
                                </button>
                                <button 
                                    onClick={reset}
                                    style={{
                                        padding: "5px 8px", background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center"
                                    }}
                                    title="Exit Editor"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Main Editor 2-Column */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                            {/* Left: Canvas Crop Area */}
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", gap: 12
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>
                                        Page {currentPage + 1} of {pageCount}
                                        <span style={{ fontSize: 10, color: T.textSec, marginLeft: 8 }}>- drag handles to crop</span>
                                    </div>
                                    {/* Page navigation */}
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                            disabled={currentPage === 0}
                                            style={{
                                                width: 26, height: 26, borderRadius: 2, background: T.surfaceHi,
                                                border: `1px solid ${T.border}`, color: currentPage === 0 ? T.muted : T.textPri,
                                                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <ChevronLeft size={13} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                                            disabled={currentPage === pageCount - 1}
                                            style={{
                                                width: 26, height: 26, borderRadius: 2, background: T.surfaceHi,
                                                border: `1px solid ${T.border}`, color: currentPage === pageCount - 1 ? T.muted : T.textPri,
                                                cursor: currentPage === pageCount - 1 ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <ChevronRight size={13} />
                                        </button>
                                    </div>
                                </div>

                                <CropPreviewCanvas
                                    file={file}
                                    pageIndex={currentPage}
                                    crop={currentCrop}
                                    onCropChange={updateCrop}
                                />
                            </div>

                            {/* Right: Sidebar Controls & Thumbnails */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {/* Numeric inputs card */}
                                <div style={{
                                    background: T.surface, border: `1px solid ${T.border}`,
                                    borderRadius: 4, padding: 16
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: T.textPri, textTransform: "uppercase", marginBottom: 12 }}>
                                        Crop Region (%)
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <NumInput label="Left (X)" value={currentCrop.x * 100} min={0} max={(1 - currentCrop.w) * 100} onChange={v => setField("x", v)} />
                                        <NumInput label="Top (Y)" value={currentCrop.y * 100} min={0} max={(1 - currentCrop.h) * 100} onChange={v => setField("y", v)} />
                                        <NumInput label="Width (W)" value={currentCrop.w * 100} min={MIN_SIZE * 100} max={(1 - currentCrop.x) * 100} onChange={v => setField("w", v)} />
                                        <NumInput label="Height (H)" value={currentCrop.h * 100} min={MIN_SIZE * 100} max={(1 - currentCrop.y) * 100} onChange={v => setField("h", v)} />
                                    </div>

                                    {/* Presets */}
                                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.borderDim}` }}>
                                        <div style={{ fontSize: 10, fontWeight: 500, color: T.textSec, textTransform: "uppercase", marginBottom: 8 }}>
                                            Quick Presets
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                            {[
                                                { label: "Full page", crop: { x: 0, y: 0, w: 1, h: 1 } },
                                                { label: "Trim margins", crop: { x: 0.05, y: 0.05, w: 0.9, h: 0.9 } },
                                                { label: "Top half", crop: { x: 0, y: 0, w: 1, h: 0.5 } },
                                                { label: "Bottom half", crop: { x: 0, y: 0.5, w: 1, h: 0.5 } },
                                                { label: "Left half", crop: { x: 0, y: 0, w: 0.5, h: 1 } },
                                                { label: "Right half", crop: { x: 0.5, y: 0, w: 0.5, h: 1 } },
                                            ].map(({ label, crop }) => (
                                                <button
                                                    key={label}
                                                    onClick={() => updateCrop(crop)}
                                                    style={{
                                                        padding: "5px 8px", background: "#2a2a2a", border: `1px solid ${T.border}`,
                                                        borderRadius: 2, color: T.textPri, fontSize: 10, textAlign: "left",
                                                        cursor: "pointer", transition: "all 0.12s"
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "#333333"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#2a2a2a"; }}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Page thumbnail strip (if multiple pages) */}
                                {pageCount > 1 && (
                                    <div style={{
                                        background: T.surface, border: `1px solid ${T.border}`,
                                        borderRadius: 4, padding: 14
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: T.textPri, textTransform: "uppercase", marginBottom: 10 }}>
                                            All Pages ({pageCount})
                                        </div>
                                        <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                                            {Array.from({ length: pageCount }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    style={{
                                                        position: "relative", height: 60, borderRadius: 3,
                                                        border: `1px solid ${currentPage === i ? T.accent : T.borderDim}`,
                                                        background: currentPage === i ? "#383838" : "#2a2a2a",
                                                        overflow: "hidden", display: "flex", flexDirection: "column",
                                                        alignItems: "center", cursor: "pointer", flexShrink: 0
                                                    }}
                                                >
                                                    <PdfPageThumbnail file={file} pageIndex={i} />
                                                    <div style={{
                                                        position: "absolute", bottom: 0, insetInline: 0,
                                                        background: "#1f1f1f", color: currentPage === i ? T.accent : T.muted,
                                                        fontSize: 8, textAlign: "center", padding: "1px 0",
                                                        borderTop: `1px solid ${T.borderDim}`
                                                    }}>
                                                        Pg {i + 1}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Export Action */}
                        {!outputUrl ? (
                            <button
                                onClick={exportPdf}
                                disabled={isExporting}
                                style={{
                                    width: "100%", height: 42,
                                    background: isExporting ? T.surfaceHi : T.accent,
                                    border: `1px solid ${isExporting ? T.border : T.accent}`,
                                    borderRadius: 3, color: isExporting ? T.muted : "#1a1a1a",
                                    fontWeight: 600, fontSize: 12,
                                    cursor: isExporting ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    transition: "all 0.15s"
                                }}
                            >
                                {isExporting ? (
                                    <><RefreshCw size={14} className="animate-spin" /> Cropping PDF Pages...</>
                                ) : (
                                    <><Crop size={14} /> Crop PDF Document</>
                                )}
                            </button>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <button
                                    onClick={() => outputUrl && window.open(outputUrl, '_blank')}
                                    style={{
                                        height: 38, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textPri, fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                >
                                    <Eye size={14} /> Preview PDF
                                </button>
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
                                    onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                    style={{
                                        height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                >
                                    <RefreshCw size={13} /> Re-crop PDF
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
                            Free PDF Cropper Online - Visual Margin Trimmer
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Crop, trim, and adjust PDF viewports instantly in your web browser. Our secure client-side PDF cropper provides an interactive drag-and-resize bounding box overlay to quickly remove empty border margins, split page layouts, or isolate important grid content. Process your critical documents privately with no email signups and zero network uploads.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Crop,
                                title: "Interactive Canvas Overlay",
                                desc: "Draw and drag a custom crop window directly over page contents. Visual handles resize margins smoothly."
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Secure Local Execution",
                                desc: "All page rendering and coordinate cropping occur locally in your browser cache. No remote cloud saves are ever executed."
                            },
                            {
                                icon: Layout,
                                title: "Sync Bounding Boxes Easily",
                                desc: "Crop a single page or automatically sync identical coordinate adjustments across all pages of the document in one click."
                            },
                            {
                                icon: Eye,
                                title: "Precision Preset Coordinates",
                                desc: "Apply perfect preset cuts (like half-pages or margin-trims) or type down exact percentage values to align borders."
                            },
                            {
                                icon: LockIcon,
                                title: "Completely Watermark-Free",
                                desc: "Trimmed documents are exported cleanly without injecting promotional footers, brand stamps, or overlays."
                            },
                            {
                                icon: Zap,
                                title: "Fast WebAssembly Re-splicing",
                                desc: "Powered by client-side WebAssembly to calculate new CropBox structures immediately. Skip long network queues."
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
                            How to Crop PDF Pages Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Upload Document", desc: "Drag and drop your target PDF file into the secure viewport container or choose it from your local system drive." },
                                { step: "2", title: "Adjust Bounding Box", desc: "Drag the border handles to shape the crop area, or choose a preset. Toggle whether to apply to all pages." },
                                { step: "3", title: "Generate and Download", desc: "Click the 'Crop PDF' button to write the new page coordinates and save the optimized, cropped file immediately." }
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
                                question="How does the local browser-based PDF cropper preserve confidentiality?"
                                answer="All adjustments and rendering calculations are processed locally inside your web browser via JavaScript. Because your target documents are never sent to external servers, they remain strictly confidential."
                            />
                            <FAQItem 
                                question="Can I crop pages inside a PDF individually with different sizes?"
                                answer="Yes. Simply disable the 'Apply crop to all pages' option, select whichever page thumbnail you want to modify, and drag the handles to define its specific crop area. Repeat for other pages."
                            />
                            <FAQItem 
                                question="Will cropping my PDF reduce the quality of vector graphics or text?"
                                answer="No. AssetNest uses a lossless boundary edit (setting the native PDF CropBox metadata). This instructs PDF readers to only display the selected region without modifying or downscaling the original graphic elements, meaning text and vector designs remain perfectly sharp."
                            />
                            <FAQItem 
                                question="Are there any file size or document length restrictions?"
                                answer="No. You can upload and crop files of any size or length. Because operations run in-browser, the performance is limited only by your device's memory and CPU resources."
                            />
                            <FAQItem 
                                question="Does PDF cropping actually delete the hidden parts of the page?"
                                answer="Standard PDF cropping via CropBox masks the content outside the boundaries, meaning it is hidden from view in reader programs. If your goal is to physically delete coordinates for highly sensitive text, we recommend flattening or sanitizing the output."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Cropper Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Precision PDF Viewport Architecture
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            The PDF Cropper lets you visually define a crop rectangle on any page and export a new PDF where the visible viewport is trimmed to exactly that region. Ideal for removing white margins, isolating specific content areas, or splitting columnar layouts.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Crop size={14} style={{ color: T.accent }} /> How to Crop
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Drag to draw:</strong> Click and drag anywhere on the PDF canvas to define a new region.</li>
                                <li><strong>Resize handles:</strong> Drag corner/edge handles to resize precisely.</li>
                                <li><strong>Apply to all:</strong> Toggle 'Apply crop to all pages' to sync one crop across the entire document.</li>
                                <li><strong>Numeric control:</strong> Type exact percentage values for pixel-perfect coordinates.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy & Output
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Files never leave your device. We use standard PDF CropBox and MediaBox parameters so viewers and printers only render the cropped area.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: PDF CropBox + MediaBox • Zero Quality Loss • In-Browser Processing
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Does cropping delete page content?" 
                                answer="No. PDF cropping sets the CropBox which masks content outside the region - original data is preserved inside the file." 
                            />
                            <FAQItem 
                                question="Can I crop each page differently?" 
                                answer="Yes! Disable 'Apply crop to all pages', navigate between pages, and set a unique crop per page." 
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
                fileName={file ? `Cropped_${file.name}` : "cropped_document.pdf"}
            />
        </div>
    );
}
