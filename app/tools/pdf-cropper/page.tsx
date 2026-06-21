"use client";

import "@/lib/pdfjs-polyfill";
import { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload, Download, RefreshCw, Crop, Info, X, Check,
    ChevronLeft, ChevronRight, ShieldCheck, Layout, Share2, Eye, Sparkles, Package, Lock as LockIcon, Zap, ChevronDown, ArrowLeft
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import HelpModal from "@/components/HelpModal";
import ShareModal from "@/components/ShareModal";
import dynamic from "next/dynamic";
import Link from "next/link";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });

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
        <div className="relative w-full select-none bg-zinc-100 rounded-2xl overflow-hidden border-2 border-black shadow-[3px_3px_0_#000]">
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
                <div className="absolute inset-0 bg-[#141414]/30 pointer-events-none" />
                {/* Crop window cutout (simulate) */}
                <div
                    className="absolute pointer-events-none border-2 border-black shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
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
                                <div key={i} className="border-r border-black h-full" style={{ gridColumn: i + 1 }} />
                            ))}
                        </div>
                        <div className="absolute inset-0 grid" style={{ gridTemplateRows: "1fr 1fr 1fr" }}>
                            {[0, 1].map(i => (
                                <div key={i} className="border-b border-black w-full" style={{ gridRow: i + 1 }} />
                            ))}
                        </div>
                    </div>
                    {/* Corner handles */}
                    {(["top-0 left-0 cursor-nw-resize", "top-0 right-0 cursor-ne-resize", "bottom-0 left-0 cursor-sw-resize", "bottom-0 right-0 cursor-se-resize"] as const).map((cls, i) => (
                        <div key={i} className={`absolute w-4 h-4 bg-yellow-400 border-2 border-black rounded-sm shadow-sm ${cls}`}
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
        <div className="flex flex-col gap-1.5">
            <span className="ig-label">{label}</span>
            <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000]">
                <input
                    type="number"
                    value={value.toFixed(1)}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onChange(clamp(parseFloat(e.target.value) || 0, min, max))}
                    className="bg-transparent text-xs font-bold text-black w-16 focus:outline-none"
                />
                <span className="text-zinc-600 text-[10px] font-black">%</span>
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
                        <Crop size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Cropper
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
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-550 hover:text-black"><X size={16} /></button>
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
                                : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
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
                                    100% Private PDF Cropping • Adjust Margins securely in browser memory.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500 relative z-10">
                        {/* Top bar */}
                        <div className="bg-white border-2 border-black rounded-[2rem] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0_#000] relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 bg-red-500/10 border-2 border-black rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                    <Crop size={16} className="text-black" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-black truncate max-w-[180px] ig-display">{file.name}</p>
                                    <p className="text-[10px] text-zinc-650 font-bold">{pageCount} page{pageCount !== 1 ? "s" : ""}</p>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-wrap items-center gap-3">
                                {/* Apply to all toggle */}
                                <button
                                    onClick={() => setApplyToAll(!applyToAll)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black text-xs font-black transition-all ig-btn ${applyToAll ? "bg-[#a7f3d0] text-black shadow-[2px_2px_0_#000]" : "bg-white text-zinc-600 shadow-[2px_2px_0_#000]"}`}
                                >
                                    <Check size={12} className={applyToAll ? "opacity-100" : "opacity-0"} />
                                    Apply crop to all pages
                                </button>

                                <div className="flex gap-2">
                                    <button onClick={reset} className="ig-btn h-9 w-9 flex items-center justify-center text-zinc-600 hover:text-black border-2 border-black bg-white rounded-full shadow-[2px_2px_0_#000]" title="Exit Editor"><X size={14} /></button>
                                    <button onClick={resetCrop} className="ig-btn h-9 px-4 text-xs font-bold text-black border-2 border-black bg-white rounded-full shadow-[2px_2px_0_#000]">Reset Crop</button>
                                </div>
                            </div>
                        </div>

                        {/* Main editor */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                            {/* Crop preview */}
                            <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[5px_5px_0_#000] relative overflow-hidden flex flex-col gap-4">
                                <div className="relative z-10 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-black ig-display">
                                        Page {currentPage + 1} of {pageCount}
                                        <span className="text-zinc-600 font-medium ml-2">— drag handles to crop</span>
                                    </h2>
                                    {/* Page nav */}
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                            disabled={currentPage === 0}
                                            className="ig-btn h-8 w-8 flex items-center justify-center rounded-full border-2 border-black bg-white text-black hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none shadow-[2px_2px_0_#000] transition-all"
                                        >
                                            <ChevronLeft size={14} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                                            disabled={currentPage === pageCount - 1}
                                            className="ig-btn h-8 w-8 flex items-center justify-center rounded-full border-2 border-black bg-white text-black hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none shadow-[2px_2px_0_#000] transition-all"
                                        >
                                            <ChevronRight size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <CropPreviewCanvas
                                        file={file}
                                        pageIndex={currentPage}
                                        crop={currentCrop}
                                        onCropChange={updateCrop}
                                    />
                                </div>
                            </div>

                            {/* Sidebar: numeric controls + page strip */}
                            <div className="flex flex-col gap-5">
                                {/* Numeric crop inputs */}
                                <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[5px_5px_0_#000] relative overflow-hidden">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-black mb-5 relative z-10 ig-label">Crop Region (%)</h3>
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <NumInput label="Left (X)" value={currentCrop.x * 100} min={0} max={(1 - currentCrop.w) * 100} onChange={v => setField("x", v)} />
                                        <NumInput label="Top (Y)" value={currentCrop.y * 100} min={0} max={(1 - currentCrop.h) * 100} onChange={v => setField("y", v)} />
                                        <NumInput label="Width (W)" value={currentCrop.w * 100} min={MIN_SIZE * 100} max={(1 - currentCrop.x) * 100} onChange={v => setField("w", v)} />
                                        <NumInput label="Height (H)" value={currentCrop.h * 100} min={MIN_SIZE * 100} max={(1 - currentCrop.y) * 100} onChange={v => setField("h", v)} />
                                    </div>

                                    {/* Quick presets */}
                                    <div className="mt-5 border-t-2 border-black/10 pt-4 relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-3 ig-label">Quick Presets</p>
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
                                                    className="ig-btn text-[10px] font-bold text-black border-2 border-black rounded-lg px-2 py-1.5 transition-all bg-white hover:bg-zinc-55 text-left shadow-[1.5px_1.5px_0_#000]"
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Page thumbnails strip */}
                                {pageCount > 1 && (
                                    <div className="bg-white border-2 border-black rounded-[2rem] p-5 shadow-[5px_5px_0_#000] relative overflow-hidden">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-black mb-4 relative z-10 ig-label">Pages</h3>
                                        <div className="relative z-10 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                            {Array.from({ length: pageCount }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`ig-btn relative h-20 rounded-xl border-2 overflow-hidden flex flex-col items-center transition-all duration-200 shrink-0 ${currentPage === i ? "border-red-500 shadow-[2px_2px_0_rgba(239,68,68,1)]" : "border-black/50 hover:border-black shadow-[1.5px_1.5px_0_#000] opacity-80 hover:opacity-100 bg-zinc-50"}`}
                                                >
                                                    <PdfPageThumbnail file={file} pageIndex={i} />
                                                    <div className="absolute bottom-0 inset-x-0 bg-black text-[8px] font-black text-white text-center py-0.5 border-t border-black">
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
                                className={`w-full h-12 font-black tracking-widest text-xs uppercase rounded-full flex items-center justify-center gap-2 border-2 border-black transition-all active:scale-[0.98] ig-btn ${
                                    isExporting 
                                        ? "bg-white text-zinc-400 cursor-not-allowed opacity-55" 
                                        : "bg-[#fde047] text-black shadow-[4px_4px_0_#000]"
                                }`}
                            >
                                {isExporting
                                    ? <><RefreshCw size={14} className="animate-spin" /> Cropping...</>
                                    : <><Crop size={14} /> Crop PDF</>
                                }
                            </button>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => outputUrl && window.open(outputUrl, '_blank')}
                                    className="ig-btn h-12 px-6 bg-[#fde047] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-yellow-350 shadow-[2.5px_2.5px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <Eye size={16} /> <span className="hidden sm:inline">Preview PDF</span><span className="sm:hidden">Preview</span>
                                </button>
                                <button
                                    onClick={download}
                                    className="ig-btn h-12 px-6 bg-[#a7f3d0] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-emerald-350 shadow-[2.5px_2.5px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                                <button
                                    onClick={() => setIsSharing(true)}
                                    className="ig-btn h-12 px-6 bg-white border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 shadow-[2.5px_2.5px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <Share2 size={16} /> Share to Mobile
                                </button>
                                <button
                                    onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                    className="ig-btn h-12 px-6 bg-transparent border-2 border-black text-zinc-600 hover:text-black font-bold text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 shadow-[2.5px_2.5px_0_#000] transition-all active:scale-[0.98]"
                                >
                                    <RefreshCw size={14} /> Re-crop PDF
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                                Free PDF Cropper Online — Visual Margin Trimmer
                            </h2>
                            <p className="text-sm text-zinc-650 leading-relaxed">
                                Crop, trim, and adjust PDF viewports instantly in your web browser. Our secure client-side PDF cropper provides an interactive drag-and-resize bounding box overlay to quickly remove empty border margins, split page layouts, or isolate important grid content. Process your critical documents privately with no email signups and zero network uploads.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Interactive Canvas Overlay",
                                    desc: "Draw and drag a custom crop window directly over page contents. Visual handles resize margins smoothly.",
                                    icon: <Crop size={16} />
                                },
                                {
                                    title: "100% Secure Local Execution",
                                    desc: "All page rendering and coordinate cropping occur locally in your browser cache. No remote cloud saves are ever executed.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "Sync Bounding Boxes Easily",
                                    desc: "Crop a single page or automatically sync identical coordinate adjustments across all pages of the document in one click.",
                                    icon: <Layout size={16} />
                                },
                                {
                                    title: "Precision Preset Coordinates",
                                    desc: "Apply perfect preset cuts (like half-pages or margin-trims) or type down exact percentage values to align borders.",
                                    icon: <Eye size={16} />
                                },
                                {
                                    title: "Completely Watermark-Free",
                                    desc: "Trimmed documents are exported cleanly without injecting promotional footers, brand stamps, or overlays.",
                                    icon: <LockIcon size={16} />
                                },
                                {
                                    title: "Fast WebAssembly Re-splicing",
                                    desc: "Powered by client-side WebAssembly to calculate new CropBox structures immediately. Skip long network queues.",
                                    icon: <Zap size={16} />
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
                                How to Crop PDF Pages Online for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Upload Your Document", desc: "Drag and drop your target PDF file into the secure viewport container or choose it from your local system drive." },
                                    { step: "2", title: "Adjust the Bounding Box", desc: "Drag the border handles to shape the crop area, or choose a preset. Toggle whether to apply to all pages." },
                                    { step: "3", title: "Generate and Download", desc: "Click the 'Crop PDF' button to write the new page coordinates and save the optimized, cropped file immediately." }
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

                        {/* Comparison Table */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-4 tracking-tight ig-display">
                                AssetNest In-Browser PDF Cropper vs. Cloud PDF Converters
                            </h3>
                            <p className="text-xs text-zinc-500 text-center mb-8 max-w-lg mx-auto">
                                Compare our client-side crop boundary logic with typical internet server tools.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-zinc-50 shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-white border-b-2 border-black">
                                            <th className="p-4 text-black font-black ig-label">Feature</th>
                                            <th className="p-4 text-emerald-800 font-black ig-label">AssetNest In-Browser Cropper</th>
                                            <th className="p-4 text-zinc-600 font-black ig-label">Cloud-Based Croppers</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {[
                                            { feat: "Privacy Protection", ours: "100% Safe (Local processing guarantees files are never uploaded or logged)", other: "Risky (Files reside in remote database caches for rendering)" },
                                            { feat: "Layout Splicing Mode", ours: "Supports independent single page crops or fast 'Apply to All' toggling", other: "Force one crop size across all pages, lacking pagination options" },
                                            { feat: "Coord Precision", ours: "Drag bounding outlines or input exact numeric box percentages", other: "Basic template cuts only without detailed numeric coordinates inputs" },
                                            { feat: "Output Resolution", ours: "Lossless vectors (No image resolution downscaling or pixel compression)", other: "Frequently rasterizes pages, reducing text clarity and increasing file size" },
                                            { feat: "Daily Page Limit", ours: "Absolutely free and unlimited for all PDF page dimensions", other: "Gated behind registration or limited to 5-10 page splits" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-100 transition-colors">
                                                <td className="p-4 text-black font-bold ig-display">{row.feat}</td>
                                                <td className="p-4 text-emerald-800 font-bold">{row.ours}</td>
                                                <td className="p-4 text-zinc-600">{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Accordion Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                PDF Cropper FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="How does the local browser-based PDF cropper preserve confidentiality?">
                                    All adjustments and rendering calculations are processed locally inside your web browser via JavaScript. Because your target documents are never sent to external servers, they remain strictly confidential.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I crop pages inside a PDF individually with different sizes?">
                                    Yes. Simply disable the 'Apply crop to all pages' option, select whichever page thumbnail you want to modify, and drag the handles to define its specific crop area. Repeat for other pages.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Will cropping my PDF reduce the quality of vector graphics or text?">
                                    No. AssetNest uses a lossless boundary edit (setting the native PDF CropBox metadata). This instructs PDF readers to only display the selected region without modifying or downscaling the original graphic elements, meaning text and vector designs remain perfectly sharp.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Are there any file size or document length restrictions?">
                                    No. You can upload and crop files of any size or length. Because operations run in-browser, the performance is limited only by your device's memory and CPU resources.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Does PDF cropping actually delete the hidden parts of the page?">
                                    Standard PDF cropping via CropBox masks the content outside the boundaries, meaning it is hidden from view in reader programs. If your goal is to physically delete coordinates for highly sensitive text, we recommend flattening or sanitizing the output.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Cropper Info">
                <div className="space-y-12 text-black leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Precision PDF Viewport Editor
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            The <strong>PDF Cropper</strong> lets you visually define a crop rectangle on any page and export a new PDF where the visible viewport is trimmed to exactly that region. This is ideal for removing white margins, isolating specific content areas, or splitting columnar layouts. Everything runs 100% in your browser — zero uploads, zero privacy compromise.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                                <Layout size={20} className="text-black inline mr-2" />
                                How to Crop
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Drag to draw:</strong> Click and drag anywhere on the PDF to start a new crop region.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Resize handles:</strong> Drag the white corner/edge handles to resize precisely.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Apply to all:</strong> Toggle "Apply crop to all pages" to sync one crop across the entire document.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Numeric control:</strong> Type exact percentage values for pixel-perfect positioning.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                                <ShieldCheck size={20} className="text-black inline mr-2" />
                                Privacy & Output
                            </h3>
                            <p className="text-sm text-zinc-700 leading-relaxed font-bold">
                                Your file never leaves your device. We use the PDF CropBox / MediaBox standard to define the visible region, so viewers and printers will only show the cropped area.
                            </p>
                            <div className="p-6 bg-white rounded-3xl border-2 border-black">
                                <p className="text-[10px] uppercase font-black tracking-widest text-black ig-label">Technical Spec</p>
                                <p className="text-[11px] text-zinc-650 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    PDF CropBox + MediaBox • Zero Quality Loss • In-Browser Processing • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000]">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">FAQ</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Does cropping delete page content?">
                                No. PDF cropping sets the CropBox which hides content outside the region — the original data is preserved inside the file.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Can I crop each page differently?">
                                Yes! Disable "Apply crop to all pages", navigate between pages, and set a unique crop per page.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Is my file uploaded anywhere?">
                                Never. Every operation runs in your browser's memory. Nothing is sent to any server.
                            </LocalAccordionItem>
                        </LocalAccordion>
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
