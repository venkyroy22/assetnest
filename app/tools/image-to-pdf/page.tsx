"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    Upload, X, Share2, Download, RefreshCw, Undo, Redo, Info,
    ImagePlus, FileImage, Settings2, ShieldCheck, Sparkles, Package,
    Zap, ChevronLeft, ChevronRight, Trash2, ArrowLeft, HelpCircle,
    UploadCloud, Check, Eye
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument, PageSizes } from "pdf-lib";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dynamic from "next/dynamic";

const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });

/* ─────────────────────────────────────────
   DESIGN TOKENS (Standard Dark System)
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
        }}>
            {icon}{label}
        </span>
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
    name: "Image to PDF Converter",
    description: "Convert JPG, PNG, WebP images into a PDF instantly in your browser. 100% private.",
    url: "https://assetnest.gloyas.com/tools/image-to-pdf",
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
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [pageSize, setPageSize] = useState<PageSize>("A4");
    const [orientation, setOrientation] = useState<Orientation>("portrait");
    const [imageFit, setImageFit] = useState<ImageFit>("fit");
    const [margin, setMargin] = useState(20);
    const [quality, setQuality] = useState(0.85);
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const additionalInputRef = useRef<HTMLInputElement>(null);
    const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    const addImages = useCallback((files: File[]) => {
        const valid = files.filter(f => ACCEPTED.includes(f.type));
        if (valid.length !== files.length) setError("Some files were skipped - only image formats supported.");
        const newItems: ImageItem[] = valid.map(file => ({
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
        }));
        setImages(prev => [...prev, ...newItems]);
        setPreviewUrl(null);
        setOutputBlob(null);
        setOutputSize(null);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addImages(files);
        if (e.target) e.target.value = "";
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
        setPreviewUrl(null);
        setOutputBlob(null);
        setOutputSize(null);
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
                canvas.toBlob(blob => {
                    URL.revokeObjectURL(objectUrl);
                    if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
                    blob.arrayBuffer().then(resolve).catch(reject);
                }, "image/jpeg", quality);
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

    const onDragStartAction = (event: DragStartEvent) => setDraggedIdx(images.findIndex(img => img.id === event.active.id));
    const onDragEndAction = (event: DragEndEvent) => {
        setDraggedIdx(null);
        if (event.over && event.active.id !== event.over.id) {
            setImages(prev => {
                const oldIndex = prev.findIndex(img => img.id === event.active.id);
                const newIndex = prev.findIndex(img => img.id === event.over!.id);
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
                const [pageW, pageH] = pageSize === "FitImage"
                    ? [pdfImage.width, pdfImage.height]
                    : (orientation === "landscape"
                        ? [PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES][1], PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES][0]]
                        : PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES]);
                
                const page = pdf.addPage([pageW, pageH]);
                const safeW = Math.max(10, pageW - margin * 2);
                const safeH = Math.max(10, pageH - margin * 2);
                const scale = imageFit === "original"
                    ? 1
                    : (imageFit === "fill"
                        ? Math.max(safeW / pdfImage.width, safeH / pdfImage.height)
                        : Math.min(safeW / pdfImage.width, safeH / pdfImage.height));
                
                const [drawW, drawH] = [pdfImage.width * scale, pdfImage.height * scale];
                page.drawImage(pdfImage, {
                    x: (pageW - drawW) / 2,
                    y: (pageH - drawH) / 2,
                    width: drawW,
                    height: drawH
                });
            }
            const bytes = await pdf.save();
            const blob = new Blob([bytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setOutputBlob(blob);
            setOutputSize(blob.size);
        } catch (err) {
            console.error("Convert error:", err);
            setError("Conversion failed. Some image data could not be parsed.");
        } finally {
            setIsConverting(false);
        }
    };

    const download = () => {
        if (!previewUrl) return;
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = `Images_${images.length}pages_${Date.now()}.pdf`;
        a.click();
    };

    const resetAll = () => {
        images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        resetHistory([]);
        setPreviewUrl(null);
        setOutputBlob(null);
        setOutputSize(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatBytes = (b: number) => b < 1024 ? `${b} B` : (b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
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
                        <FileImage size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>Image to PDF</span>
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
                {images.length === 0 ? (
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
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            multiple 
                            accept="image/jpeg,image/png,image/webp,image/gif" 
                            style={{ display: "none" }} 
                            onChange={handleFileChange} 
                        />

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                {isConverting ? <RefreshCw className="animate-spin" size={20} /> : <UploadCloud size={22} />}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                Drop your images here
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>
                                JPG, PNG, WebP or GIF · 100% In-Browser Conversion
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                <Chip icon={<Package size={10} />} label="No Server Upload" />
                                <Chip icon={<Sparkles size={10} />} label="Instant Compile" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Control Toolbar */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: "12px 16px",
                            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                            gap: 12
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>
                                    {images.length} image{images.length !== 1 ? "s" : ""} selected
                                </span>
                                <div style={{ display: "flex", gap: 4 }}>
                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        style={{
                                            padding: "4px 8px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                            borderRadius: 2, color: canUndo ? T.textPri : T.muted, cursor: canUndo ? "pointer" : "not-allowed",
                                            display: "flex", alignItems: "center"
                                        }}
                                        title="Undo reorder"
                                    >
                                        <Undo size={12} />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={!canRedo}
                                        style={{
                                            padding: "4px 8px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                            borderRadius: 2, color: canRedo ? T.textPri : T.muted, cursor: canRedo ? "pointer" : "not-allowed",
                                            display: "flex", alignItems: "center"
                                        }}
                                        title="Redo reorder"
                                    >
                                        <Redo size={12} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <input 
                                    ref={additionalInputRef} 
                                    type="file" 
                                    multiple 
                                    accept="image/jpeg,image/png,image/webp,image/gif" 
                                    style={{ display: "none" }} 
                                    onChange={handleFileChange} 
                                />
                                <button
                                    onClick={() => additionalInputRef.current?.click()}
                                    style={{
                                        height: 30, padding: "0 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 2, color: T.textPri, fontSize: 11, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 5
                                    }}
                                >
                                    <ImagePlus size={12} /> Add More
                                </button>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    style={{
                                        height: 30, padding: "0 10px", background: showSettings ? T.accentDim : T.surfaceHi,
                                        border: `1px solid ${showSettings ? T.accent : T.border}`,
                                        borderRadius: 2, color: showSettings ? T.accent : T.textPri, fontSize: 11, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 5
                                    }}
                                >
                                    <Settings2 size={12} /> Page Settings
                                </button>
                                <button
                                    onClick={resetAll}
                                    style={{
                                        height: 30, padding: "0 10px", background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 2, color: T.textSec, fontSize: 11, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 5
                                    }}
                                >
                                    <RefreshCw size={12} /> Clear All
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Page Settings Panel */}
                        {showSettings && (
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: "14px 16px",
                                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: 14
                            }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 4 }}>Page Format</label>
                                    <select
                                        value={pageSize}
                                        onChange={e => setPageSize(e.target.value as PageSize)}
                                        style={{
                                            width: "100%", background: "#2a2a2a", border: `1px solid ${T.border}`,
                                            borderRadius: 2, padding: "5px 8px", fontSize: 11, color: T.textPri, outline: "none"
                                        }}
                                    >
                                        <option value="A4">A4 (Standard)</option>
                                        <option value="A3">A3 (Poster)</option>
                                        <option value="Letter">Letter (US)</option>
                                        <option value="FitImage">Fit to Image</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 4 }}>Orientation</label>
                                    <select
                                        value={orientation}
                                        disabled={pageSize === "FitImage"}
                                        onChange={e => setOrientation(e.target.value as Orientation)}
                                        style={{
                                            width: "100%", background: "#2a2a2a", border: `1px solid ${T.border}`,
                                            borderRadius: 2, padding: "5px 8px", fontSize: 11, color: T.textPri, outline: "none",
                                            opacity: pageSize === "FitImage" ? 0.5 : 1
                                        }}
                                    >
                                        <option value="portrait">Portrait (Vertical)</option>
                                        <option value="landscape">Landscape (Horizontal)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 4 }}>Image Fit</label>
                                    <select
                                        value={imageFit}
                                        disabled={pageSize === "FitImage"}
                                        onChange={e => setImageFit(e.target.value as ImageFit)}
                                        style={{
                                            width: "100%", background: "#2a2a2a", border: `1px solid ${T.border}`,
                                            borderRadius: 2, padding: "5px 8px", fontSize: 11, color: T.textPri, outline: "none",
                                            opacity: pageSize === "FitImage" ? 0.5 : 1
                                        }}
                                    >
                                        <option value="fit">Fit inside margins</option>
                                        <option value="fill">Fill entire page</option>
                                        <option value="original">Original resolution</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 4 }}>Margin ({margin}px)</label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={60}
                                        value={margin}
                                        disabled={pageSize === "FitImage"}
                                        onChange={e => setMargin(Number(e.target.value))}
                                        style={{ width: "100%", accentColor: T.accent }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 10, color: T.textSec, marginBottom: 4 }}>Quality ({Math.round(quality * 100)}%)</label>
                                    <input
                                        type="range"
                                        min={0.4}
                                        max={1.0}
                                        step={0.05}
                                        value={quality}
                                        onChange={e => setQuality(Number(e.target.value))}
                                        style={{ width: "100%", accentColor: T.accent }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Sortable Image Grid */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16
                        }}>
                            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStartAction} onDragEnd={onDragEndAction}>
                                <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                        gap: 12
                                    }}>
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
                            </DndContext>
                        </div>

                        {/* Compile & Action Bar */}
                        {!previewUrl ? (
                            <button
                                onClick={convert}
                                disabled={images.length === 0 || isConverting}
                                style={{
                                    height: 42, background: T.accent, border: `1px solid ${T.accent}`,
                                    borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 12,
                                    cursor: isConverting ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "all 0.15s"
                                }}
                            >
                                {isConverting ? <RefreshCw className="animate-spin" size={14} /> : <FileImage size={15} />}
                                {isConverting ? "Compiling PDF Document..." : "Generate PDF Document"}
                            </button>
                        ) : (
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: 18, display: "flex", flexDirection: "column", gap: 14
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 5,
                                            padding: "3px 8px", background: "rgba(125,206,160,0.12)",
                                            border: `1px solid ${T.success}`, borderRadius: 2,
                                            fontSize: 11, color: T.success, fontWeight: 500
                                        }}>
                                            <Check size={12} /> PDF Created Successfully
                                        </div>
                                        <span style={{ fontSize: 11, color: T.textSec }}>
                                            {images.length} page{images.length !== 1 ? "s" : ""} • {outputSize ? formatBytes(outputSize) : ""}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
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
                                        onClick={() => setShowPreviewModal(true)}
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
                                        onClick={resetAll}
                                        style={{
                                            height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                            borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                    >
                                        <RefreshCw size={13} /> Start Fresh
                                    </button>
                                </div>
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
                            Free Image to PDF Converter Online - Combine Photos Privately
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Convert JPG, PNG, and WebP images into a single organized PDF file directly in your browser. Rearrange pages easily with drag-and-drop, customize page dimensions (A4, A3, Letter, or Fit), and save your multi-page document instantly without server uploads.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: UploadCloud,
                                title: "Multiple Image Formats",
                                desc: "Combine JPG, PNG, WebP, and GIF images effortlessly into a unified, high-definition PDF document."
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% In-Browser Processing",
                                desc: "Images are processed locally inside browser RAM using pdf-lib. No files are transmitted to remote servers."
                            },
                            {
                                icon: Settings2,
                                title: "Custom Page Dimensions",
                                desc: "Select between A4, A3, US Letter, or auto-fit image bounds with custom orientation and margins."
                            },
                            {
                                icon: Zap,
                                title: "Lossless / Fast Compression",
                                desc: "Adjust export compression quality to produce lightweight files suitable for email attachments or printing."
                            },
                            {
                                icon: Package,
                                title: "Drag & Drop Reordering",
                                desc: "Reorder pages smoothly with intuitive drag-and-drop or nudge buttons before compiling your PDF."
                            },
                            {
                                icon: Sparkles,
                                title: "Completely Free & Clean",
                                desc: "No registration, no daily quotas, and zero watermark injections into your final documents."
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
                            How to Convert Images to PDF Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select or Drop Images", desc: "Drag and drop your JPG, PNG, or WebP images into the upload area or browse your device." },
                                { step: "2", title: "Arrange & Configure", desc: "Drag items to reorder pages, configure page format (A4, Letter), orientation, and margins." },
                                { step: "3", title: "Generate & Download", desc: "Click 'Generate PDF Document' to bundle your images into a single file and download immediately." }
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
                                question="Are my images uploaded to any server during conversion?"
                                answer="No. The conversion runs 100% in your browser using JavaScript and HTML5 Canvas. Your images are never transmitted across the network."
                            />
                            <FAQItem 
                                question="Can I change the order of images before creating the PDF?"
                                answer="Yes! You can simply drag and drop the image cards into any sequence or use the arrow buttons to position them."
                            />
                            <FAQItem 
                                question="What page sizes are supported?"
                                answer="We support standard A4, A3, US Letter, as well as an 'Auto-Fit' mode that scales each PDF page to match the exact aspect ratio of each individual image."
                            />
                            <FAQItem 
                                question="Is there a limit on how many images I can convert?"
                                answer="No artificial limits. You can combine dozens of photos. Processing speed depends entirely on your device's memory and processor."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* In-Browser PDF Preview Modal */}
            {showPreviewModal && previewUrl && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 16
                }}>
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
                        width: "100%", maxWidth: 850, height: "85vh", display: "flex", flexDirection: "column",
                        overflow: "hidden"
                    }}>
                        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>Generated PDF Preview</span>
                            <button onClick={() => setShowPreviewModal(false)} style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", display: "flex" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <iframe src={previewUrl} style={{ flex: 1, border: "none", width: "100%", height: "100%", background: "#fff" }} />
                        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button
                                onClick={download}
                                style={{
                                    height: 32, padding: "0 14px", background: T.accent, border: `1px solid ${T.accent}`,
                                    borderRadius: 2, color: "#1a1a1a", fontWeight: 600, fontSize: 11, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 5
                                }}
                            >
                                <Download size={13} /> Download PDF
                            </button>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{
                                    height: 32, padding: "0 12px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                    borderRadius: 2, color: T.textPri, fontSize: 11, cursor: "pointer"
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Image to PDF Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Client-Side Image Compilation
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            AssetNest Image to PDF Converter compiles image buffers directly into standard PDF container objects using WebAssembly and canvas compression. Ideal for preparing receipts, porting photos to document packages, and digitizing paperwork.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <FileImage size={14} style={{ color: T.accent }} /> Customization Options
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Page Sizing:</strong> Standard A4, A3, US Letter, or auto-fit image dimensions.</li>
                                <li><strong>Orientation:</strong> Vertical Portrait or Horizontal Landscape layout.</li>
                                <li><strong>Margins & Quality:</strong> Granular control over padding and JPEG compression ratios.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Absolute Privacy
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Files are compiled strictly in your local device RAM. No server uploads or cloud processing is involved.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: Local Buffer Encoding • Clean Vector Embedding • Watermark Free
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Can I drag to reorder?" 
                                answer="Yes. Pick up any image card to drag and drop it into a different page position." 
                            />
                            <FAQItem 
                                question="Are multiple images combined into one file?" 
                                answer="Yes. All images are merged in sequential order into a single downloadable PDF." 
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
                fileName={`Images_${images.length}pages_${Date.now()}.pdf`}
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
            style={{
                ...style,
                background: "#2e2e2e",
                border: `1px solid ${isDragging ? T.accent : T.border}`,
                borderRadius: 3,
                overflow: "hidden",
                opacity: isDragging ? 0.35 : 1,
                cursor: "grab",
                position: "relative",
            }}
            {...attributes}
            {...listeners}
        >
            <div style={{ width: "100%", aspectRatio: "3 / 4", background: "#1f1f1f", position: "relative", overflow: "hidden" }}>
                <img
                    src={img.previewUrl}
                    alt={img.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                
                {/* Page Index Badge */}
                <div style={{
                    position: "absolute", top: 4, right: 4,
                    background: T.accent, color: "#1a1a1a",
                    fontSize: 9, fontWeight: 700, padding: "1px 5px",
                    borderRadius: 2
                }}>
                    {index + 1}
                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute", top: 4, left: 4,
                        width: 22, height: 22, background: "rgba(30,30,30,0.85)",
                        border: `1px solid ${T.border}`, borderRadius: 2,
                        color: "#ff7777", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer"
                    }}
                    title="Remove image"
                >
                    <Trash2 size={11} />
                </button>

                {/* Move Left / Right Controls */}
                <div style={{
                    position: "absolute", bottom: 4, left: 0, right: 0,
                    display: "flex", justifyContent: "center", gap: 3
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); moveImage(index, -1); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={index === 0}
                        style={{
                            padding: "2px 5px", background: "rgba(30,30,30,0.85)",
                            border: `1px solid ${T.border}`, borderRadius: 2,
                            color: index === 0 ? T.muted : T.textPri, cursor: index === 0 ? "not-allowed" : "pointer"
                        }}
                    >
                        <ChevronLeft size={11} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); moveImage(index, 1); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={index === imagesCount - 1}
                        style={{
                            padding: "2px 5px", background: "rgba(30,30,30,0.85)",
                            border: `1px solid ${T.border}`, borderRadius: 2,
                            color: index === imagesCount - 1 ? T.muted : T.textPri, cursor: index === imagesCount - 1 ? "not-allowed" : "pointer"
                        }}
                    >
                        <ChevronRight size={11} />
                    </button>
                </div>
            </div>

            <div style={{ padding: "6px 8px", background: "#2e2e2e", borderTop: `1px solid ${T.borderDim}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 500, color: T.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {img.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 9, color: T.textSec }}>
                    {formatBytes(img.file.size)}
                </p>
            </div>
        </div>
    );
}
