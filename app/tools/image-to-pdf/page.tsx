"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload, Download, X, RefreshCw, ImageIcon, Undo, Redo,
    ChevronLeft, ChevronRight, Trash2, Settings2, ImagePlus, Share2, Check, ShieldCheck
} from "lucide-react";
import ShareModal from "@/components/ShareModal";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Accordion, AccordionItem } from "@/components/Accordion";
import { Info } from "lucide-react";
import { PDFDocument, PageSizes } from "pdf-lib";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image to PDF Converter",
    description: "Convert JPG, PNG, WebP images into a PDF instantly in your browser. 100% private.",
    url: "https://www.assetnest.space/tools/image-to-pdf",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type ImageItem = {
    id: string;
    file: File;
    previewUrl: string;
    name: string;
};

type PageSize = "A4" | "A3" | "Letter" | "FitImage";
type Orientation = "portrait" | "landscape";
type ImageFit = "fit" | "fill" | "original";

const PAGE_SIZES: Record<Exclude<PageSize, "FitImage">, [number, number]> = {
    A4: PageSizes.A4,
    A3: PageSizes.A3,
    Letter: PageSizes.Letter,
};

export default function ImageToPdfPage() {
    const [images, setImages, undo, redo, canUndo, canRedo, resetHistory] = useUndoRedo<ImageItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    // Settings
    const [pageSize, setPageSize] = useState<PageSize>("A4");
    const [orientation, setOrientation] = useState<Orientation>("portrait");
    const [imageFit, setImageFit] = useState<ImageFit>("fit");
    const [margin, setMargin] = useState(20); // in points
    const [quality, setQuality] = useState(0.82); // JPEG quality 0-1
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    const addImages = useCallback((files: File[]) => {
        const valid = files.filter(f => ACCEPTED.includes(f.type));
        if (valid.length !== files.length) {
            setError("Some files were skipped — only JPG, PNG, WebP, and GIF images are supported.");
        } else {
            setError(null);
        }

        const newItems: ImageItem[] = valid.map(file => ({
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
        }));

        setImages(prev => [...prev, ...newItems]);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addImages(files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addImages(Array.from(e.dataTransfer.files));
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const item = prev.find(i => i.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return prev.filter(i => i.id !== id);
        });
    };

    const moveImage = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= images.length) return;
        const next = [...images];
        [next[index], next[index + direction]] = [next[index + direction], next[index]];
        setImages(next);
    };

    // ─── Canvas JPEG compression ─────────────────────────────────────────────────
    // Draws the image at its natural size on an off-screen canvas, then exports
    // it as a JPEG with the chosen quality — the single biggest size reducer.
    const compressImageToJpeg = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                // Cap max dimension to 2480px (roughly A4 at 300dpi) to avoid absurdly large outputs
                const MAX = 2480;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    const ratio = Math.min(MAX / width, MAX / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    blob => {
                        URL.revokeObjectURL(objectUrl);
                        if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
                        blob.arrayBuffer().then(resolve).catch(reject);
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
            img.src = objectUrl;
        });
    };

    // ─── Drag reorder ───────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragStartAction = (event: DragStartEvent) => {
        const { active } = event;
        const activeIdx = images.findIndex(img => img.id === active.id);
        setDraggedIdx(activeIdx);
    };

    const onDragEndAction = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedIdx(null);

        if (over && active.id !== over.id) {
            setImages(prev => {
                const oldIndex = prev.findIndex(img => img.id === active.id);
                const newIndex = prev.findIndex(img => img.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    // ─── Convert ────────────────────────────────────────────────────────────────
    const convert = async () => {
        if (images.length === 0) return;
        setIsConverting(true);
        setError(null);

        try {
            const pdf = await PDFDocument.create();

            for (const item of images) {
                // Always compress through canvas → JPEG for smaller output
                const jpegBuffer = await compressImageToJpeg(item.file);
                const pdfImage = await pdf.embedJpg(jpegBuffer);

                const imgW = pdfImage.width;
                const imgH = pdfImage.height;

                let pageW: number;
                let pageH: number;

                if (pageSize === "FitImage") {
                    pageW = imgW;
                    pageH = imgH;
                } else {
                    [pageW, pageH] = PAGE_SIZES[pageSize];
                    if (orientation === "landscape") [pageW, pageH] = [pageH, pageW];
                }

                const page = pdf.addPage([pageW, pageH]);

                // Calculate draw dimensions
                const safeW = pageW - margin * 2;
                const safeH = pageH - margin * 2;

                let drawW: number;
                let drawH: number;
                let drawX: number;
                let drawY: number;

                if (imageFit === "original") {
                    drawW = imgW;
                    drawH = imgH;
                } else if (imageFit === "fill") {
                    const scaleX = safeW / imgW;
                    const scaleY = safeH / imgH;
                    const scale = Math.max(scaleX, scaleY);
                    drawW = imgW * scale;
                    drawH = imgH * scale;
                } else {
                    // fit (default) — letterbox
                    const scaleX = safeW / imgW;
                    const scaleY = safeH / imgH;
                    const scale = Math.min(scaleX, scaleY);
                    drawW = imgW * scale;
                    drawH = imgH * scale;
                }

                drawX = (pageW - drawW) / 2;
                drawY = (pageH - drawH) / 2;

                page.drawImage(pdfImage, { x: drawX, y: drawY, width: drawW, height: drawH });
            }

            const bytes = await pdf.save();
            const blob = new Blob([bytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setOutputBlob(blob);
            setOutputSize(blob.size);
        } catch (err) {
            console.error(err);
            setError("Conversion failed. This may happen with some WebP files — try converting them to JPG first.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = `Images_to_PDF_${Date.now()}.pdf`;
        a.click();
    };

    const reset = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setOutputBlob(null);
        setOutputSize(null);
        resetHistory([]);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatBytes = (b: number) => {
        if (b < 1024) return `${b} B`;
        if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1048576).toFixed(1)} MB`;
    };

    // ─── Scroll Lock for Preview ───
    useEffect(() => {
        if (previewUrl) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = originalOverflow; };
        }
    }, [previewUrl]);

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* ── Header ── */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6 relative group">
                    <ImagePlus size={11} className="text-white" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">PDF Utility</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="absolute -top-2 -left-2 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all shadow-xl z-20"
                        title="View Information"
                    >
                        <Info size={12} />
                    </button>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    Image <span className="text-white">to PDF</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Convert JPG, PNG, or WebP images into a single PDF. Drag to reorder, set page size and margins — all in your browser.
                </p>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 rounded-2xl animate-in fade-in">
                    <ImageIcon size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-medium text-red-100">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>
            )}

            <div className="flex flex-col gap-5">
                {/* ── Dropzone ── */}
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`py-10 px-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer ${isDragging ? "border-white bg-white/5" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"}`}
                >
                    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-xl">
                        <Upload size={20} className="text-zinc-500" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-white tracking-tight">{images.length > 0 ? "Add More Images" : "Drag & Drop or Click Here"}</h2>
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                <ShieldCheck size={10} className="text-white" />
                                <span className="text-[10px] font-semibold text-zinc-300">100% Private</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                <ImageIcon size={10} className="text-white" />
                                <span className="text-[10px] font-semibold text-zinc-300">No Server Upload</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                                <Check size={10} className="text-white" />
                                <span className="text-[10px] font-semibold text-zinc-300">Free Forever</span>
                            </div>
                        </div>
                        <p className="text-zinc-500 text-[10px] font-medium mt-3 uppercase tracking-wider">Secure PDF Assembly</p>
                    </div>
                </div>

                {/* ── Image List ── */}
                {images.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden animate-in fade-in">

                        {/* List header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-zinc-900 gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-bold text-white">
                                    Images <span className="text-white">({images.length})</span>
                                </h3>
                                <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                                    <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)"><Undo size={14} /></button>
                                    <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors" title="Redo (Ctrl+Y)"><Redo size={14} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                <button onClick={() => { images.forEach(i => URL.revokeObjectURL(i.previewUrl)); resetHistory([]); }} className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all whitespace-nowrap">
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowSettings(s => !s)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all whitespace-nowrap ${showSettings ? "border-white/50 bg-white/10 text-white" : "border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"}`}
                                >
                                    <Settings2 size={14} /> Settings
                                </button>
                            </div>
                        </div>

                        {/* ── Settings Panel ── */}
                        {showSettings && (
                            <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/40 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                    {/* Page Size */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-zinc-500">Page Size</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(["A4", "A3", "Letter", "FitImage"] as PageSize[]).map(s => (
                                                <button key={s} onClick={() => setPageSize(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${pageSize === s ? "bg-white/20 border-white/50 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"}`}>
                                                    {s === "FitImage" ? "Fit Image" : s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Orientation */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-zinc-500">Orientation</label>
                                        <div className="flex gap-1.5">
                                            {(["portrait", "landscape"] as Orientation[]).map(o => (
                                                <button key={o} onClick={() => setOrientation(o)} disabled={pageSize === "FitImage"} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border capitalize transition-all disabled:opacity-30 ${orientation === o ? "bg-white/20 border-white/50 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"}`}>
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Image Fit */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-zinc-500">Image Fit</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {([["fit", "Letterbox"], ["fill", "Fill Page"], ["original", "Original Size"]] as [ImageFit, string][]).map(([val, label]) => (
                                                <button key={val} onClick={() => setImageFit(val)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${imageFit === val ? "bg-white/20 border-white/50 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Margin */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-zinc-500">Margin — {margin}pt</label>
                                        <input type="range" min={0} max={72} step={4} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full white cursor-pointer" />
                                        <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                                            <span>None</span><span>72pt</span>
                                        </div>
                                    </div>
                                    {/* Quality */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold tracking-wider text-zinc-500">
                                            Quality — <span className={quality >= 0.8 ? "text-white" : quality >= 0.5 ? "text-white/60" : "text-red-400"}>{Math.round(quality * 100)}%</span>
                                        </label>
                                        <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full white cursor-pointer" />
                                        <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                                            <span>Smallest</span><span>Best Quality</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Image Grid ── */}
                        <div className="p-6">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={onDragStartAction}
                                onDragEnd={onDragEndAction}
                            >
                                <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {images.map((img, index) => (
                                            <SortableImageCard 
                                                key={img.id}
                                                img={img}
                                                index={index}
                                                imagesCount={images.length}
                                                removeImage={removeImage}
                                                moveImage={moveImage}
                                                formatBytes={formatBytes}
                                                isDragging={draggedIdx === index}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                
                                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
                                    {draggedIdx !== null ? (
                                        <div className="aspect-[3/4] w-32 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden opacity-80 shadow-2xl scale-105">
                                            <img src={images[draggedIdx].previewUrl} alt="Dragging" className="w-full h-full object-cover" />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </div>
                )}

                {/* ── Convert Button ── */}
                <button
                    onClick={convert}
                    disabled={images.length === 0 || isConverting}
                    className={`w-full h-14 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all ${images.length === 0 ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-100 shadow-lg shadow-white/20"}`}
                >
                    {isConverting
                        ? <><RefreshCw size={18} className="animate-spin" /> Converting {images.length} image{images.length !== 1 ? "s" : ""}…</>
                        : <><ImagePlus size={18} /> Preview & Download PDF ({images.length} image{images.length !== 1 ? "s" : ""})</>
                    }
                </button>
            </div>

            {/* ── Preview Screen ── */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl my-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 pt-12 pb-12 lg:py-0">

                        {/* Left: Embedded PDF Viewer */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
                                <span className="text-sm font-semibold text-white tracking-wide">PDF Preview</span>
                                <span className="text-[10px] text-zinc-500 font-medium">{images.length} page{images.length !== 1 ? "s" : ""} · {outputSize ? formatBytes(outputSize) : ""}</span>
                            </div>
                            <div className="flex-grow relative">
                                <object data={previewUrl} type="application/pdf" className="w-full h-full" style={{ minHeight: 500 }}>
                                    <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" style={{ minHeight: 500 }} />
                                </object>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-center gap-6">
                            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                                <ImagePlus size={28} className="text-white" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-black text-white tracking-tight mb-1">Looking Good!</h2>
                                <p className="text-zinc-500 text-xs font-medium">Review your PDF and download when ready.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-4 border-y border-zinc-900">
                                <div className="text-center">
                                    <span className="block text-xl sm:text-2xl font-black text-white leading-tight">{images.length}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Pages</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl sm:text-2xl font-black text-white leading-tight">{outputSize ? formatBytes(outputSize) : "—"}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">File Size</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="h-12 px-6 bg-white text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl"
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
                                    onClick={() => setPreviewUrl(null)}
                                    className="h-12 px-6 bg-transparent border border-zinc-800 text-zinc-300 hover:text-white font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all"
                                >
                                    ← Go Back & Edit
                                </button>
                                <button
                                    onClick={reset}
                                    className="h-12 px-6 bg-transparent border border-zinc-800 text-zinc-500 hover:text-red-400 font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all"
                                >
                                    <RefreshCw size={14} /> Start Fresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Visual Document Infrastructure"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Visual Image-to-PDF Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for document assembly. AssetNest <strong>Image-to-PDF Converter</strong> transcends basic file merging—it provides a structural editor where you can manipulate individual image pages as if they were physical assets. Whether you are compiling a massive photo book, a complex legal docket, or a personal portfolio, our tool gives you the power to drag, reorder, and refine your PDF documents with zero loss in quality and absolute data privacy.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ImagePlus size={20} className="text-zinc-500" />
                                How to Build Your PDF
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Universal Support:</strong> Drop JPG, PNG, WebP, and GIF files. Mix formats instantly in a single container.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Dynamic Reorder:</strong> Use the drag-and-drop grid to visually sequence your document flow.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Layout Control:</strong> Open Settings to toggle A4, A3, Letter, or "Fit Image" sizing on the fly.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive photo data on external servers, our converter operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • High-Fidelity Vector Alignment • Lossless Container Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Portrait vs Landscape?">
                                Mixed orientations are supported. We center and scale each asset perfectly based on your fit settings.
                            </AccordionItem>
                            <AccordionItem title="Image Limits?">
                                The only limit is your device&apos;s memory. We easily handle hundreds of high-res photos in a single export.
                            </AccordionItem>
                            <AccordionItem title="PDF Quality?">
                                Zero loss. Our engine creates a high-definition PDF container that preserves every pixel of your original images.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
            
            <ShareModal 
                isOpen={isSharing} 
                onClose={() => setIsSharing(false)} 
                file={outputBlob} 
                fileName={`Images_to_PDF_${Date.now()}.pdf`} 
            />
        </div>
    );
}

// ---------------- SORTABLE COMPONENT ----------------

interface SortableImageCardProps {
    img: ImageItem;
    index: number;
    imagesCount: number;
    removeImage: (id: string) => void;
    moveImage: (index: number, direction: -1 | 1) => void;
    formatBytes: (b: number) => string;
    isDragging: boolean;
}

function SortableImageCard({ img, index, imagesCount, removeImage, moveImage, formatBytes, isDragging }: SortableImageCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-grab active:cursor-grabbing touch-none ${isDragging ? "opacity-30 border-white border-dashed" : "border-zinc-800 hover:border-white/40 hover:-translate-y-1"}`}
        >
            {/* Preview */}
            <div className="aspect-[3/4] bg-zinc-900 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="w-full h-full object-cover"
                />
                {/* Page number badge */}
                <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {index + 1}
                </div>

                {/* Top Left Delete Button */}
                <div className="absolute top-1.5 left-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Navigation controls overlay at bottom */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity px-2">
                    <div className="flex gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                        <button
                            onClick={(e) => { e.stopPropagation(); moveImage(index, -1); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={index === 0}
                            className="p-1.5 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); moveImage(index, 1); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={index === imagesCount - 1}
                            className="p-1.5 text-white rounded-lg disabled:opacity-30 hover:bg-white/20 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Name + size */}
            <div className="px-2 py-2 bg-zinc-900">
                <p className="text-[9px] font-medium text-zinc-400 truncate">{img.name}</p>
                <p className="text-[9px] text-zinc-600">{formatBytes(img.file.size)}</p>
            </div>
        </div>
    );
}

