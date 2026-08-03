"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload, Download, X, RefreshCw, ImageIcon, Undo, Redo,
    ChevronLeft, ChevronRight, Trash2, Settings2, ImagePlus, Share2, Check, ShieldCheck, Info, Zap, Package, Lock as LockIcon, Sparkles, ChevronDown, ArrowLeft
} from "lucide-react";
import ShareModal from "@/components/ShareModal";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument, PageSizes } from "pdf-lib";
import Link from "next/link";
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

    const compressImageToJpeg = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
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

    const convert = async () => {
        if (images.length === 0) return;
        setIsConverting(true);
        setError(null);

        try {
            const pdf = await PDFDocument.create();

            for (const item of images) {
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

    useEffect(() => {
        if (previewUrl) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = originalOverflow; };
        }
    }, [previewUrl]);

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-red-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                        <ImagePlus size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Image to PDF
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <Info size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10 space-y-6">
                {/* Error Banner */}
                {error && (
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl animate-in fade-in">
                        <ImageIcon size={16} className="text-red-650 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {/* ── Dropzone ── */}
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative py-10 px-6 border-2 border-dashed rounded-[2rem] border-black flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group/dropzone ${
                        isDragging 
                            ? "bg-red-50" 
                            : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
                    }`}
                >
                    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
                    
                    <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0_#000]">
                        <Upload size={20} className="text-black" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-base font-black text-black tracking-tight ig-display">{images.length > 0 ? "Add More Images" : "Drag & Drop Images or Click to Browse"}</h2>
                        <p className="text-xs text-zinc-650 mt-1 font-medium leading-relaxed max-w-sm mx-auto">
                            100% Private Image-to-PDF Conversion • Process secure local compilations.
                        </p>
                    </div>
                </div>

                {/* ── Image List ── */}
                {images.length > 0 && (
                    <div className="bg-white border-2 border-black rounded-[2rem] overflow-hidden shadow-[5px_5px_0_#000] animate-in fade-in">

                        {/* List header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b-2 border-black gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-bold text-black ig-display">
                                    Images <span className="text-zinc-600">({images.length})</span>
                                </h3>
                                <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border-2 border-black">
                                    <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 text-black transition-colors" title="Undo"><Undo size={14} /></button>
                                    <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 text-black transition-colors" title="Redo"><Redo size={14} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                <button onClick={() => { images.forEach(i => URL.revokeObjectURL(i.previewUrl)); resetHistory([]); }} className="px-4 py-1.5 rounded-full text-xs font-bold border-2 border-black bg-white hover:bg-zinc-50 transition-all whitespace-nowrap shadow-[2px_2px_0_#000] ig-btn">
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowSettings(s => !s)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border-2 border-black transition-all whitespace-nowrap shadow-[2px_2px_0_#000] ig-btn ${showSettings ? "bg-[#fde047] text-black" : "bg-white text-zinc-600 hover:text-black"}`}
                                >
                                    <Settings2 size={14} /> Settings
                                </button>
                            </div>
                        </div>

                        {/* ── Settings Panel ── */}
                        {showSettings && (
                            <div className="px-6 py-5 border-b-2 border-black bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                                    {/* Page Size */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ig-label">Page Size</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(["A4", "A3", "Letter", "FitImage"] as PageSize[]).map(s => (
                                                <button key={s} onClick={() => setPageSize(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ig-btn ${pageSize === s ? "bg-[#fde047] border-black text-black shadow-[1.5px_1.5px_0_#000]" : "bg-white border-zinc-200 text-zinc-600 hover:border-black"}`}>
                                                    {s === "FitImage" ? "Fit Image" : s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Orientation */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ig-label">Orientation</label>
                                        <div className="flex gap-1.5">
                                            {(["portrait", "landscape"] as Orientation[]).map(o => (
                                                <button key={o} onClick={() => setOrientation(o)} disabled={pageSize === "FitImage"} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 capitalize transition-all disabled:opacity-30 ig-btn ${orientation === o ? "bg-[#fde047] border-black text-black shadow-[1.5px_1.5px_0_#000]" : "bg-white border-zinc-200 text-zinc-600 hover:border-black"}`}>
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Image Fit */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ig-label">Image Fit</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {([["fit", "Letterbox"], ["fill", "Fill Page"], ["original", "Original Size"]] as [ImageFit, string][]).map(([val, label]) => (
                                                <button key={val} onClick={() => setImageFit(val)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ig-btn ${imageFit === val ? "bg-[#fde047] border-black text-black shadow-[1.5px_1.5px_0_#000]" : "bg-white border-zinc-200 text-zinc-600 hover:border-black"}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Margin */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ig-label">Margin — {margin}pt</label>
                                        <input type="range" min={0} max={72} step={4} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black" />
                                        <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                                            <span>None</span><span>72pt</span>
                                        </div>
                                    </div>
                                    {/* Quality */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ig-label">
                                            Quality — {Math.round(quality * 100)}%
                                        </label>
                                        <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black" />
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
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                                        <div className="aspect-[3/4] w-32 bg-white border-2 border-black rounded-2xl overflow-hidden opacity-80 shadow-2xl scale-105">
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
                    className={`w-full h-14 font-black tracking-widest text-xs sm:text-sm rounded-full flex items-center justify-center gap-3 transition-all border-2 border-black ig-btn ${images.length === 0 ? "bg-white text-zinc-400 cursor-not-allowed opacity-55" : "bg-[#fde047] text-black shadow-[4px_4px_0_#000]"}`}
                >
                    {isConverting
                        ? <><RefreshCw size={18} className="animate-spin" /> Converting {images.length} image{images.length !== 1 ? "s" : ""}…</>
                        : <><ImagePlus size={18} /> Preview & Download PDF ({images.length} image{images.length !== 1 ? "s" : ""})</>
                    }
                </button>
            </main>

            {/* ── Preview Screen ── */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl my-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pt-12 pb-12 lg:py-0">

                        {/* Left: Embedded PDF Viewer */}
                        <div className="bg-white border-4 border-black rounded-[2rem] overflow-hidden flex flex-col min-h-[500px] lg:min-h-0 shadow-[6px_6px_0_#000]">
                            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-zinc-50 shrink-0">
                                <span className="text-sm font-black text-black tracking-wide ig-display">PDF Preview</span>
                                <span className="text-[10px] text-zinc-650 font-bold">{images.length} page{images.length !== 1 ? "s" : ""} · {outputSize ? formatBytes(outputSize) : ""}</span>
                            </div>
                            <div className="flex-grow relative">
                                <object data={previewUrl} type="application/pdf" className="w-full h-full" style={{ minHeight: 500 }}>
                                    <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" style={{ minHeight: 500 }} />
                                </object>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="bg-white border-4 border-black rounded-[2rem] p-6 flex flex-col justify-center gap-6 shadow-[6px_6px_0_#000]">
                            <div className="w-16 h-16 bg-[#a7f3d0] border-2 border-black rounded-full flex items-center justify-center mx-auto shadow-[2.5px_2.5px_0_#000]">
                                <ImagePlus size={28} className="text-black" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-black text-black tracking-tight mb-1 ig-display">Looking Good!</h2>
                                <p className="text-zinc-600 text-xs font-semibold">Review your PDF and download when ready.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-4 border-y-2 border-black bg-zinc-50 rounded-xl px-2">
                                <div className="text-center">
                                    <span className="block text-xl sm:text-2xl font-black text-black leading-tight">{images.length}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase ig-label">Pages</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl sm:text-2xl font-black text-black leading-tight">{outputSize ? formatBytes(outputSize) : "—"}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 uppercase ig-label">File Size</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="h-12 px-6 bg-[#a7f3d0] border-2 border-black text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-emerald-300 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                                <button
                                    onClick={() => setIsSharing(true)}
                                    className="h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                >
                                    <Share2 size={16} /> Share to Mobile
                                </button>
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="h-12 px-6 bg-white border-2 border-black text-black font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                >
                                    ← Go Back & Edit
                                </button>
                                <button
                                    onClick={reset}
                                    className="h-12 px-6 bg-white border-2 border-black text-red-650 font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                >
                                    <RefreshCw size={14} /> Start Fresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


                <div className="flex justify-center py-4">
                </div>

            {/* ─── SEO RICH TEXT SECTION ─── */}
            <div className="max-w-5xl mx-auto mt-24">
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
                                Free Image to PDF Converter Online — Convert JPG & PNG
                            </h2>
                            <p className="text-sm text-zinc-650 leading-relaxed">
                                Convert JPG, PNG, and WebP images into clean, standard PDF documents instantly. Our browser-based converter lets you sort files via simple drag-and-drop actions, adjust margins, define paper orientations, and compress image density to compile a single PDF file locally with zero server dependency.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Interactive Reorder Grid",
                                    desc: "Sequence page items dynamically with a drag-and-drop grid. Organize photo books and portfolios on the fly.",
                                    icon: <ImageIcon size={16} />
                                },
                                {
                                    title: "100% Local Conversions",
                                    desc: "All conversions and page-layout packaging happen locally in browser RAM. Your photos are never sent online.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "Adaptive Page Formatting",
                                    desc: "Choose target sheet boundaries (A4, A3, Letter) or set 'Fit Image' to automatically wrap sheets around image dimensions.",
                                    icon: <Settings2 size={16} />
                                },
                                {
                                    title: "JPEG Quality Compression",
                                    desc: "Adjust input file density on the fly. Compresses high-res photo compilations into lightweight, portable PDF sizes.",
                                    icon: <Zap size={16} />
                                },
                                {
                                    title: "No Branding Watermarks",
                                    desc: "Your final compiled PDF remains completely original. We never append advertising footers or branding stamps.",
                                    icon: <LockIcon size={16} />
                                },
                                {
                                    title: "Universal Batch Operations",
                                    desc: "Upload and merge hundreds of pictures in one go. Fully compatible with JPG, PNG, WebP, and static GIF formats.",
                                    icon: <Package size={16} />
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
                                How to Convert Images to PDF for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Upload Your Images", desc: "Select and drop batch pictures (JPG, PNG, WebP) directly into the file drag area securely." },
                                    { step: "2", title: "Sequence and Format", desc: "Drag image slots to change sequence order. Open Settings to set custom margins, page size, and quality." },
                                    { step: "3", title: "Generate and Save", desc: "Click the 'Convert' button to render the layouts and download your compiled PDF instantly." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-55 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-650 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ Accordion Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                Image to PDF FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="Are my private photos secure during the conversion process?">
                                    Yes. AssetNest compiles the document client-side via browser script models. Your photos, blueprints, or documents are never sent over the internet, keeping your personal details completely private.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="How does the drag-and-drop grid help with batch image reordering?">
                                    Once you upload your images, you can drag individual previews around the screen to dynamically swap their page sequence. This makes it simple to organize pages chronologically or swap document layouts before compiling.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="What happens to the PDF resolution when converting high-res pictures?">
                                    By default, our tool uses high-fidelity scaling. If you have extremely large photos that might bloat the file size, you can open settings and reduce the Quality slider. This compresses JPEG streams locally to export a lightweight PDF.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Visual Document Infrastructure"
            >
                <div className="space-y-12 text-zinc-700 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Image-to-PDF Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for document assembly. AssetNest <strong>Image-to-PDF Converter</strong> transcends basic file merging—it provides a structural editor where you can manipulate individual image pages as if they were physical assets. Whether you are compiling a massive photo book, a complex legal docket, or a personal portfolio, our tool gives you the power to drag, reorder, and refine your PDF documents with zero loss in quality and absolute data privacy.
                        </p>
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
            className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-grab active:cursor-grabbing touch-none ${isDragging ? "opacity-30 border-dashed border-black" : "border-black bg-white shadow-[2px_2px_0_#000] hover:-translate-y-1"}`}
        >
            <div className="aspect-[3/4] bg-zinc-50 relative">
                <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 right-1.5 bg-[#fde047] border border-black text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0_#000]">
                    {index + 1}
                </div>

                <div className="absolute top-1.5 left-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-7 h-7 bg-red-500 border border-black text-white rounded-lg flex items-center justify-center hover:bg-red-650 transition-colors shadow-[1px_1px_0_#000] ig-btn"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity px-2">
                    <div className="flex gap-1 bg-white border border-black p-1 rounded-xl shadow-[1.5px_1.5px_0_#000]">
                        <button
                            onClick={(e) => { e.stopPropagation(); moveImage(index, -1); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={index === 0}
                            className="p-1.5 text-black rounded-lg disabled:opacity-30 hover:bg-zinc-100 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); moveImage(index, 1); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={index === imagesCount - 1}
                            className="p-1.5 text-black rounded-lg disabled:opacity-30 hover:bg-zinc-100 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-2 py-2 bg-white border-t border-black">
                <p className="text-[9px] font-bold text-black truncate">{img.name}</p>
                <p className="text-[9px] text-zinc-550">{formatBytes(img.file.size)}</p>
            </div>
        </div>
    );
}
