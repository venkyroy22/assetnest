"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload, Download, RefreshCw, Crop, Info, X, Check,
    ChevronLeft, ChevronRight, ShieldCheck, Layout, Share2, Eye, Sparkles
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import ShareModal from "@/components/ShareModal";
import dynamic from "next/dynamic";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });

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
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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

    // Pointer events
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
            // Start fresh crop draw
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
        <div className="relative w-full select-none bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <canvas ref={canvasRef} className="w-full h-auto block" />
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0 touch-none"
                style={{ cursor }}
                onPointerDown={handlePointerDown}
                onMouseMove={handleMouseMove}
            >
                {/* Darkened regions */}
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                {/* Crop window cutout (simulate) */}
                <div
                    className="absolute pointer-events-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                    style={{
                        left: `${x * 100}%`,
                        top: `${y * 100}%`,
                        width: `${w * 100}%`,
                        height: `${h * 100}%`,
                    }}
                >
                    {/* Rule-of-thirds grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                            {[0, 1].map(i => (
                                <div key={i} className="border-r border-white/40 h-full" style={{ gridColumn: i + 1 }} />
                            ))}
                        </div>
                        <div className="absolute inset-0 grid" style={{ gridTemplateRows: "1fr 1fr 1fr" }}>
                            {[0, 1].map(i => (
                                <div key={i} className="border-b border-white/40 w-full" style={{ gridRow: i + 1 }} />
                            ))}
                        </div>
                    </div>
                    {/* Corner handles */}
                    {(["top-0 left-0 cursor-nw-resize", "top-0 right-0 cursor-ne-resize", "bottom-0 left-0 cursor-sw-resize", "bottom-0 right-0 cursor-se-resize"] as const).map((cls, i) => (
                        <div key={i} className={`absolute w-4 h-4 bg-white rounded-sm shadow-sm ${cls}`}
                            style={{ 
                                [i % 2 === 0 ? "left" : "right"]: "-8px", 
                                [i < 2 ? "top" : "bottom"]: "-8px" 
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
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                <input
                    type="number"
                    value={value.toFixed(1)}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onChange(clamp(parseFloat(e.target.value) || 0, min, max))}
                    className="bg-transparent text-xs font-bold text-white w-16 focus:outline-none"
                />
                <span className="text-zinc-600 text-[10px]">%</span>
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
        if (f.type !== "application/pdf") {
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

    const currentCrop = crops[currentPage] ?? DEFAULT_CROP;

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
        setError(null);
        setOutputUrl(null);
        setOutputBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const resetCrop = () => {
        if (applyToAll) {
            setCrops(prev => prev.map(() => ({ ...DEFAULT_CROP })));
        } else {
            setCrops(prev => prev.map((old, i) => i === currentPage ? { ...DEFAULT_CROP } : old));
        }
    };

    // Numeric controls (percent)
    const c = currentCrop;
    const setField = (field: keyof CropBox, pct: number) => {
        const val = pct / 100;
        const next = { ...c };
        if (field === "x") next.x = clamp(val, 0, 1 - c.w);
        else if (field === "y") next.y = clamp(val, 0, 1 - c.h);
        else if (field === "w") next.w = clamp(val, MIN_SIZE, 1 - c.x);
        else if (field === "h") next.h = clamp(val, MIN_SIZE, 1 - c.y);
        updateCrop(next);
    };

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="text-center mb-10 relative group">
                <button
                    onClick={() => setShowHelp(true)}
                    className="absolute -top-2 -left-2 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all shadow-xl z-20"
                    title="View Information"
                >
                    <Info size={12} />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Crop size={11} className="text-white" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">PDF Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    PDF <span className="text-white">Cropper</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Upload a PDF, drag to define the crop area on any page, and export a perfectly trimmed document — entirely in your browser.
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
                /* Upload Zone */
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
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                    <ShieldCheck size={10} className="text-white" />
                                    <span className="text-[10px] font-semibold text-zinc-300">100% Private</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                    <Sparkles size={10} className="text-white" />
                                    <span className="text-[10px] font-semibold text-zinc-300">No Server Upload</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                    <Check size={10} className="text-white" />
                                    <span className="text-[10px] font-semibold text-zinc-300">Free Forever</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Top bar */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                                <Crop size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white truncate max-w-[180px]">{file.name}</p>
                                <p className="text-[10px] text-zinc-500">{pageCount} page{pageCount !== 1 ? "s" : ""}</p>
                            </div>
                        </div>

                        <div className="h-px sm:h-8 sm:w-px bg-zinc-800 w-full sm:w-auto" />

                        {/* Apply to all toggle */}
                        <button
                            onClick={() => setApplyToAll(!applyToAll)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${applyToAll ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}
                        >
                            <Check size={12} className={applyToAll ? "opacity-100" : "opacity-0"} />
                            Apply crop to all pages
                        </button>

                        <div className="flex gap-2">
                            <button onClick={reset} className="h-9 px-3 text-zinc-500 hover:text-white border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors" title="Exit Editor"><X size={14} /></button>
                            <button onClick={resetCrop} className="h-9 px-4 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">Reset Crop</button>
                        </div>
                    </div>

                    {/* Main editor */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        {/* Crop preview */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white">
                                    Page {currentPage + 1} of {pageCount}
                                    <span className="text-zinc-500 font-medium ml-2">— drag handles to crop</span>
                                </h2>
                                {/* Page nav */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        className="h-8 w-8 flex items-center justify-center rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                                        disabled={currentPage === pageCount - 1}
                                        className="h-8 w-8 flex items-center justify-center rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 transition-all"
                                    >
                                        <ChevronRight size={14} />
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

                        {/* Sidebar: numeric controls + page strip */}
                        <div className="flex flex-col gap-5">
                            {/* Numeric crop inputs */}
                            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-5">Crop Region (%)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumInput label="Left (X)" value={c.x * 100} min={0} max={(1 - c.w) * 100} onChange={v => setField("x", v)} />
                                    <NumInput label="Top (Y)" value={c.y * 100} min={0} max={(1 - c.h) * 100} onChange={v => setField("y", v)} />
                                    <NumInput label="Width (W)" value={c.w * 100} min={MIN_SIZE * 100} max={(1 - c.x) * 100} onChange={v => setField("w", v)} />
                                    <NumInput label="Height (H)" value={c.h * 100} min={MIN_SIZE * 100} max={(1 - c.y) * 100} onChange={v => setField("h", v)} />
                                </div>

                                {/* Quick presets */}
                                <div className="mt-5 border-t border-zinc-900 pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Quick Presets</p>
                                    <div className="grid grid-cols-2 gap-2">
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
                                                className="text-[10px] font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg px-2 py-1.5 transition-all hover:bg-zinc-900 text-left"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Page thumbnails strip */}
                            {pageCount > 1 && (
                                <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Pages</h3>
                                    <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                                        {Array.from({ length: pageCount }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i)}
                                                className={`relative h-20 rounded-xl border-2 overflow-hidden flex flex-col items-center transition-all duration-200 ${currentPage === i ? "border-white bg-white/10" : "border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-90"}`}
                                            >
                                                <PdfPageThumbnail file={file} pageIndex={i} />
                                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-black text-white/70 text-center py-0.5">
                                                    Pg {i + 1}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export button */}
                    {!outputUrl ? (
                        <button
                            onClick={exportPdf}
                            disabled={isExporting}
                            className="w-full h-14 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all bg-white text-black hover:bg-zinc-100 shadow-lg shadow-white/10 disabled:opacity-60"
                        >
                            {isExporting
                                ? <><RefreshCw size={18} className="animate-spin" /> Cropping...</>
                                : <><Crop size={18} /> Crop PDF</>
                            }
                        </button>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => outputUrl && window.open(outputUrl, '_blank')}
                                className="h-12 px-6 bg-white text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-100 shadow-lg shadow-white/10 transition-all active:scale-[0.98]"
                            >
                                <Eye size={16} /> <span className="hidden sm:inline">Preview PDF</span><span className="sm:hidden">Preview</span>
                            </button>
                            <button
                                onClick={download}
                                className="h-12 px-6 bg-zinc-900 border border-zinc-800 text-white font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98]"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                            <button
                                onClick={() => setIsSharing(true)}
                                className="h-12 px-6 bg-zinc-900 border border-zinc-800 text-white font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98]"
                            >
                                <Share2 size={16} /> Share to Mobile
                            </button>
                            <button
                                onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                className="h-12 px-6 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
                            >
                                <RefreshCw size={14} /> Re-crop PDF
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!file && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12 max-w-4xl mx-auto">
                    {[
                        { title: "Privacy First", desc: "Your file never leaves your device. 100% processed securely in your browser's local memory." },
                        { title: "Precision Control", desc: "Draw intuitively with your cursor or type exact percentage values for perfect margin alignment." },
                        { title: "Universal Output", desc: "No watermarks. We adjust the standard PDF CropBox to ensure universal compatibility everywhere." }
                    ].map((f, i) => (
                        <div key={i} className="space-y-4 text-center md:text-left">
                             <h4 className="text-[10px] font-bold text-white tracking-widest uppercase">{f.title}</h4>
                             <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Cropper Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Precision PDF Viewport Editor
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            The <strong>PDF Cropper</strong> lets you visually define a crop rectangle on any page and export a new PDF where the visible viewport is trimmed to exactly that region. This is ideal for removing white margins, isolating specific content areas, or splitting columnar layouts. Everything runs 100% in your browser — zero uploads, zero privacy compromise.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Layout size={20} className="text-zinc-500" />
                                How to Crop
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Drag to draw:</strong> Click and drag anywhere on the PDF to start a new crop region.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Resize handles:</strong> Drag the white corner/edge handles to resize precisely.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Apply to all:</strong> Toggle "Apply crop to all pages" to sync one crop across the entire document.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Numeric control:</strong> Type exact percentage values for pixel-perfect positioning.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy & Output
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Your file never leaves your device. We use the PDF CropBox / MediaBox standard to define the visible region, so viewers and printers will only show the cropped area.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    PDF CropBox + MediaBox • Zero Quality Loss • In-Browser Processing • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Does cropping delete page content?">
                                No. PDF cropping sets the CropBox which hides content outside the region — the original data is preserved inside the file.
                            </AccordionItem>
                            <AccordionItem title="Can I crop each page differently?">
                                Yes! Disable "Apply crop to all pages", navigate between pages, and set a unique crop per page.
                            </AccordionItem>
                            <AccordionItem title="Is my file uploaded anywhere?">
                                Never. Every operation runs in your browser's memory. Nothing is sent to any server.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={outputBlob}
                fileName={file ? `Cropped_${file.name}` : "cropped_document.pdf"}
            />
        </div>
    );
}
