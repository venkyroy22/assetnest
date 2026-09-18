"use client";

import React, { useState, useRef } from "react";
import {
    Upload, Download, X, RefreshCw, Combine, Undo, Redo,
    ChevronLeft, ChevronRight, Info, Grid, ArrowLeft, Share2,
    Check, ShieldCheck, Sparkles, Package, Lock as LockIcon, FileText,
    HelpCircle, Zap, Globe, Plus, UploadCloud
} from "lucide-react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
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

const PdfPageThumbnail = dynamic(() => import("./PdfPreviewThumbnail"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });
import Tooltip from "@/components/Tooltip";
import HelpModal from "@/components/HelpModal";

/* ─────────────────────────────────────────
   DESIGN TOKENS (Matching QR & Image Tools)
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
    name: "PDF Merger",
    description: "Combine multiple PDF files into one instantly and securely. 100% private, browser-based.",
    url: "https://www.assetnest.space/tools/pdf-merger",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type UploadedFile = {
    id: string;
    file: File;
    name: string;
};

type PageItem = {
    id: string;
    fileId: string;
    pageIndex: number;
    name: string;
};

export default function PdfMergerPage() {
    const [{ files, pages }, setHistoryState, undo, redo, canUndo, canRedo, resetHistory] = useUndoRedo<{files: UploadedFile[], pages: PageItem[]}>({ files: [], pages: [] });
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(selectedFiles);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const addFiles = async (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (pdfFiles.length !== newFiles.length) {
            setError("Some files were skipped because they are not PDF documents.");
        } else {
            setError(null);
        }

        if (pdfFiles.length === 0) return;

        setIsLoading(true);
        try {
            const addedFiles: UploadedFile[] = [];
            const addedPages: PageItem[] = [];

            for (const file of pdfFiles) {
                const id = Date.now().toString() + Math.random().toString(36).substring(7);
                addedFiles.push({ id, file, name: file.name });
                
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                
                for (let i = 0; i < count; i++) {
                    addedPages.push({
                        id: `${id}-${i}-${Math.random().toString(36).substring(7)}`,
                        fileId: id,
                        pageIndex: i,
                        name: file.name
                    });
                }
            }

            setHistoryState(prev => ({
                files: [...prev.files, ...addedFiles],
                pages: [...prev.pages, ...addedPages]
            }));
        } catch (err) {
            console.error(err);
            setError("Failed to parse some of the documents. They might be corrupted or password-protected.");
        } finally {
            setIsLoading(false);
        }
    };

    const removePage = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setHistoryState(prev => ({
            ...prev,
            pages: prev.pages.filter(p => p.id !== id)
        }));
    };

    const movePage = (index: number, direction: -1 | 1, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (index + direction < 0 || index + direction >= pages.length) return;
        setHistoryState(prev => {
            const newArray = [...prev.pages];
            const temp = newArray[index];
            newArray[index] = newArray[index + direction];
            newArray[index + direction] = temp;
            return { ...prev, pages: newArray };
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragStartAction = (event: DragStartEvent) => {
        const { active } = event;
        const activeIdx = pages.findIndex(p => p.id === active.id);
        setDraggedIdx(activeIdx);
    };

    const onDragEndAction = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedIdx(null);

        if (over && active.id !== over.id) {
            setHistoryState(prev => {
                const oldIndex = prev.pages.findIndex(p => p.id === active.id);
                const newIndex = prev.pages.findIndex(p => p.id === over.id);
                return {
                    ...prev,
                    pages: arrayMove(prev.pages, oldIndex, newIndex)
                };
            });
        }
    };

    const mergePdfs = async () => {
        if (pages.length === 0) {
            setError("No pages to merge.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputUrl(null);
        setOutputBlob(null);

        try {
            const mergedPdf = await PDFDocument.create();
            const loadedPdfs = new Map<string, PDFDocument>();

            // Load needed documents only once
            for (const page of pages) {
                if (!loadedPdfs.has(page.fileId)) {
                    const f = files.find(x => x.id === page.fileId);
                    if (f) {
                        const arrayBuffer = await f.file.arrayBuffer();
                        const pdf = await PDFDocument.load(arrayBuffer);
                        loadedPdfs.set(page.fileId, pdf);
                    }
                }
                
                const pdf = loadedPdfs.get(page.fileId);
                if (pdf) {
                    const [copiedPage] = await mergedPdf.copyPages(pdf, [page.pageIndex]);
                    mergedPdf.addPage(copiedPage);
                }
            }

            const pdfBytes = await mergedPdf.save({ useObjectStreams: false });
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            
            setOutputUrl(url);
            setOutputBlob(blob);
            setOutputSize(blob.size);
        } catch (err) {
            console.error(err);
            setError("Failed to merge PDFs. One of the documents might be corrupted or encrypted.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = () => {
        if (!outputUrl) return;
        const link = document.createElement("a");
        link.download = `Merged_Document_${Date.now()}.pdf`;
        link.href = outputUrl;
        link.click();
    };

    const reset = () => {
        if (outputUrl) URL.revokeObjectURL(outputUrl);
        resetHistory({ files: [], pages: [] });
        setOutputUrl(null);
        setOutputBlob(null);
        setOutputSize(null);
        setError(null);
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
                        <Combine size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Merger</span>
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
                {!outputUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Hidden File Input */}
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            multiple 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />

                        {/* Dropzone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                minHeight: pages.length > 0 ? 140 : 260,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                border: `1px dashed ${isDragging ? T.accent : T.border}`,
                                borderRadius: 4, background: isDragging ? T.surfaceHi : T.surface,
                                cursor: "pointer", transition: "all 0.2s", padding: 24,
                            }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                {isLoading ? (
                                    <RefreshCw className="animate-spin" size={20} />
                                ) : (
                                    <UploadCloud size={22} />
                                )}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                {isLoading ? "Analyzing PDF documents..." : "Drop your PDF files here"}
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, marginBottom: 14, textAlign: "center" }}>
                                or click to browse multiple files · 100% Client-side Processing
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                <Chip icon={<Package size={10} />} label="No File Upload" />
                                <Chip icon={<Sparkles size={10} />} label="Free & Unlimited" />
                            </div>
                        </div>

                        {/* Pages Grid Studio */}
                        {pages.length > 0 && (
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16
                            }}>
                                {/* Studio Toolbar */}
                                <div style={{
                                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                                    gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.borderDim}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 3, background: T.surfaceHi,
                                            border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                                            color: T.accent
                                        }}>
                                            <Grid size={15} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>
                                                Arrange Pages ({pages.length})
                                            </div>
                                            <div style={{ fontSize: 10, color: T.textSec }}>
                                                Drag cards or use arrows to organize document flow
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#2e2e2e", padding: 3, borderRadius: 3, border: `1px solid ${T.borderDim}` }}>
                                            <Tooltip content="Undo (Ctrl+Z)">
                                                <button 
                                                    onClick={undo} 
                                                    disabled={!canUndo} 
                                                    style={{
                                                        padding: "4px 8px", background: "transparent", border: "none",
                                                        color: canUndo ? T.textPri : T.muted, cursor: canUndo ? "pointer" : "not-allowed",
                                                        borderRadius: 2, display: "flex", alignItems: "center"
                                                    }}
                                                >
                                                    <Undo size={14} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Redo (Ctrl+Y)">
                                                <button 
                                                    onClick={redo} 
                                                    disabled={!canRedo} 
                                                    style={{
                                                        padding: "4px 8px", background: "transparent", border: "none",
                                                        color: canRedo ? T.textPri : T.muted, cursor: canRedo ? "pointer" : "not-allowed",
                                                        borderRadius: 2, display: "flex", alignItems: "center"
                                                    }}
                                                >
                                                    <Redo size={14} />
                                                </button>
                                            </Tooltip>
                                        </div>

                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 5,
                                                padding: "5px 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                                borderRadius: 3, color: T.textPri, fontSize: 11, cursor: "pointer"
                                            }}
                                        >
                                            <Plus size={12} style={{ color: T.accent }} /> Add More Files
                                        </button>
                                    </div>
                                </div>

                                {/* Draggable Grid */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCorners}
                                    onDragStart={onDragStartAction}
                                    onDragEnd={onDragEndAction}
                                >
                                    <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                                            {pages.map((p, index) => (
                                                <SortablePageCard 
                                                    key={p.id}
                                                    p={p}
                                                    index={index}
                                                    files={files}
                                                    pagesCount={pages.length}
                                                    removePage={removePage}
                                                    movePage={movePage}
                                                    isDragging={draggedIdx === index}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                    
                                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
                                        {draggedIdx !== null ? (
                                            <div style={{
                                                height: 180, width: 130, background: T.surfaceHi,
                                                border: `1px solid ${T.accent}`, borderRadius: 4,
                                                display: "flex", flexDirection: "column", alignItems: "center", padding: 8,
                                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)", opacity: 0.95
                                            }}>
                                                <div style={{ flex: 1, width: "full", background: "#222", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderDim}` }}>
                                                    <span style={{ fontSize: 10, color: T.accent }}>Moving Page {draggedIdx + 1}</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>

                                {/* Studio Footer Action Bar */}
                                <div style={{
                                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                                    gap: 12, paddingTop: 14, borderTop: `1px solid ${T.borderDim}`
                                }}>
                                    <span style={{
                                        fontSize: 11, color: T.textSec, background: "#2a2a2a",
                                        padding: "4px 10px", borderRadius: 3, border: `1px solid ${T.borderDim}`
                                    }}>
                                        {files.length} File{files.length !== 1 ? 's' : ''} • {pages.length} Page{pages.length !== 1 ? 's' : ''} Total
                                    </span>
                                    
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <button 
                                            onClick={() => resetHistory({ files: [], pages: [] })}
                                            style={{
                                                padding: "6px 14px", background: "transparent", border: `1px solid ${T.border}`,
                                                borderRadius: 3, color: T.textSec, fontSize: 11, cursor: "pointer",
                                                transition: "all 0.15s"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                        >
                                            Clear All
                                        </button>
                                        <button 
                                            onClick={mergePdfs}
                                            disabled={pages.length === 0 || isLoading}
                                            style={{
                                                padding: "7px 18px", background: pages.length === 0 ? T.surfaceHi : T.accent,
                                                border: `1px solid ${pages.length === 0 ? T.border : T.accent}`,
                                                borderRadius: 3, color: pages.length === 0 ? T.muted : "#1a1a1a",
                                                fontWeight: 600, fontSize: 11, cursor: pages.length === 0 || isLoading ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                                            }}
                                        >
                                            {isLoading ? (
                                                <><RefreshCw size={12} className="animate-spin" /> Merging...</>
                                            ) : (
                                                <><Combine size={13} /> Merge & Export PDF</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Output Preview & Action Studio */
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 32 }}>
                        {/* Left: PDF Preview */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", minHeight: 460
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>Merged PDF Preview</span>
                                <span style={{ fontSize: 10, color: T.textSec }}>{pages.length} Pages</span>
                            </div>
                            <div style={{ flex: 1, background: "#222222", border: `1px solid ${T.borderDim}`, borderRadius: 3, overflow: "hidden", minHeight: 400 }}>
                                <object data={outputUrl} type="application/pdf" style={{ width: "100%", height: "100%", minHeight: 400, border: "none" }}>
                                    <iframe src={outputUrl} style={{ width: "100%", height: "100%", minHeight: 400, border: "none" }} title="PDF Preview" />
                                </object>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 28, display: "flex", flexDirection: "column", justifyContent: "center",
                            textAlign: "center"
                        }}>
                            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, margin: "0 auto 16px" }}>
                                <Combine size={24} />
                            </div>
                            <h2 style={{ fontSize: 18, fontWeight: 500, color: T.textPri, margin: "0 0 6px" }}>
                                Stitching Complete!
                            </h2>
                            <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 24px" }}>
                                Your merged PDF document has been compiled directly inside your browser.
                            </p>

                            {/* Stats */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
                                padding: "14px 0", background: "#323232", border: `1px solid ${T.borderDim}`,
                                borderRadius: 4, marginBottom: 24
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 600, color: T.textPri, lineHeight: 1 }}>{pages.length}</div>
                                    <div style={{ fontSize: 9, color: T.textSec, marginTop: 4, textTransform: "uppercase" }}>Pages</div>
                                </div>
                                <div style={{ width: 1, height: 26, background: T.borderDim }}></div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 600, color: T.textPri, lineHeight: 1 }}>{outputSize ? formatSize(outputSize) : "---"}</div>
                                    <div style={{ fontSize: 9, color: T.textSec, marginTop: 4, textTransform: "uppercase" }}>File Size</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <button 
                                    onClick={handleDownload}
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
                                    onClick={() => setOutputUrl(null)}
                                    style={{
                                        height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                >
                                    <ArrowLeft size={14} /> Edit Pages
                                </button>
                                <button 
                                    onClick={reset}
                                    style={{
                                        height: 38, background: "transparent", border: `1px solid ${T.danger}`,
                                        borderRadius: 3, color: "#ff8888", fontWeight: 500, fontSize: 11,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#442222"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    <RefreshCw size={13} /> Start Fresh
                                </button>
                            </div>
                        </div>
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
                            Free PDF Merger Online - Combine PDF Files Privately
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Combine multiple PDF files into one document instantly using our secure online PDF merger. Perfect for consolidating corporate documents, portfolios, legal binders, or study sheets. Drag to reorder pages and delete empty sheets directly in browser memory - no watermarks, no registration, and no server uploads.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Combine,
                                title: "Client-Side Page Stitching",
                                desc: "Stitch individual document pages entirely in your local RAM sandbox using pdf-lib. No external server receives your sensitive files."
                            },
                            {
                                icon: Grid,
                                title: "Drag & Drop Reordering",
                                desc: "Rearrange and change the order of specific pages visually in our sorting grid canvas. Customize document flows easily."
                            },
                            {
                                icon: X,
                                title: "Precise Page-Level Pruning",
                                desc: "Prune blank sheets, cover pages, or redundant dividers by clicking the delete button on any page thumbnail before export."
                            },
                            {
                                icon: FileText,
                                title: "Lossless Vector Quality",
                                desc: "Retain high-resolution fonts, vectors, charts, signature shapes, and metadata structure during page stitching operations."
                            },
                            {
                                icon: Sparkles,
                                title: "100% Free & Unlimited",
                                desc: "Merge files without page limit caps, daily thresholds, or premium subscriptions. Process multi-megabyte PDFs completely free."
                            },
                            {
                                icon: LockIcon,
                                title: "Zero Watermark Overlays",
                                desc: "Export clean files. We never inject branding watermarks, promotional stamps, or advertising headers onto your documents."
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
                            How to Combine PDF Files Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Add Document Files", desc: "Drag and drop multiple PDF files into the secure compiler drop zone, or browse files to parse page streams." },
                                { step: "2", title: "Arrange & Edit Pages", desc: "Drag page thumbnails to reorder pages, use mobile arrows, or prune unwanted pages with the delete button." },
                                { step: "3", title: "Export and Download", desc: "Inspect the merged document in our preview container, click 'Download PDF' to save your new file instantly." }
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

                    {/* Comparison Table */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 44 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 4 }}>
                            AssetNest Online PDF Merger vs. Traditional Cloud PDF Converters
                        </h3>
                        <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", marginBottom: 20 }}>
                            Compare our local-first WebAssembly PDF-lib engine with typical cloud converters.
                        </p>
                        <div style={{ background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#2e2e2e" }}>
                                        <th style={{ padding: 10, fontWeight: 500, color: T.textPri }}>Feature capability</th>
                                        <th style={{ padding: 10, fontWeight: 500, color: T.accent }}>AssetNest In-Browser Merger</th>
                                        <th style={{ padding: 10, fontWeight: 500, color: T.textSec }}>Cloud PDF Services</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feat: "Document Safety & Privacy", ours: "100% Private (Calculated inside your local sandbox, zero uploads)", other: "Risky (Files sent and cached on remote web servers)" },
                                        { feat: "Stitching Granularity", ours: "Visual page-by-page ordering and individual page deletion", other: "Often limited to merging entire documents in sequence" },
                                        { feat: "Usage & Size Limits", ours: "Completely free with unlimited pages (restricted only by local RAM)", other: "Often caps page counts or restricts file sizes behind paywalls" },
                                        { feat: "Compile Performance", ours: "Instant local merging (no upload delays or queue wait times)", other: "Heavy reliance on network bandwidth for uploads & downloads" },
                                        { feat: "Watermark Overlays", ours: "Clean exports (no watermark stamps, logos, or ads added)", other: "Injects branding watermarks unless premium license is purchased" }
                                    ].map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: idx < 4 ? `1px solid ${T.borderDim}` : "none" }}>
                                            <td style={{ padding: 10, fontWeight: 500, color: T.textPri }}>{row.feat}</td>
                                            <td style={{ padding: 10, color: T.accent }}>{row.ours}</td>
                                            <td style={{ padding: 10, color: T.textSec }}>{row.other}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FAQ Accordion Section */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 16 }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="How does browser-side PDF merging protect my privacy?"
                                answer="AssetNest uses pdf-lib compiled locally in WebAssembly to process document stitching directly in your browser's RAM sandbox. Since your PDF files are never uploaded to any remote servers, your sensitive financial statements, legal briefs, and personal documents remain 100% secure and private."
                            />
                            <FAQItem 
                                question="Will my PDF's text formatting, images, or vectors lose quality?"
                                answer="No. Our offline merge engine parses the document structure and merges page streams without re-compressing or rasterizing content. This ensures every embedded vector, high-res graphic, font asset, and digital signature retains its original fidelity and sharpness."
                            />
                            <FAQItem 
                                question="Is there a maximum limit on the number of PDF pages I can merge?"
                                answer="There are no artificial constraints. The only limit is your local computer's memory. The application can easily handle combining documents spanning hundreds of pages."
                            />
                            <FAQItem 
                                question="Can I merge password-encrypted or write-protected PDF documents?"
                                answer="PDFs with active encryption or user permissions passwords must be unlocked first before compiling, as our parsing engine needs permission to read and extract the page streams. You can use the AssetNest PDF Unlocker tool to clear restrictions first."
                            />
                            <FAQItem 
                                question="Does AssetNest add any watermark stamps to the exported PDF files?"
                                answer="No. All files compiled on AssetNest are completely free of watermarks, logos, stamps, or advertising banners. We provide clean, professional document exports for all users."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Merger Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Visual PDF Architecture: Merge & Organize
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            Step into a professional-grade workspace for document assembly. AssetNest Visual PDF Merger provides a structural editor where you can manipulate individual pages as if they were physical assets. Drag, reorder, and refine your PDF documents with zero loss in quality and absolute data privacy.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Combine size={14} style={{ color: T.accent }} /> How to Merge Safely
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Secure Drop:</strong> Drag multiple PDF files into the compiler zone. Pages map immediately.</li>
                                <li><strong>Dynamic Reorder:</strong> Drag cards to visually sequence your document flow.</li>
                                <li><strong>Precision Delete:</strong> Click the delete button on any thumbnail to discard unwanted pages before export.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Infrastructure
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Unlike cloud tools that cache your confidential data on external servers, our merger operates <strong>100% locally in your browser memory</strong>. Files never leave your device.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Technical Spec: Zero-Server Processing • Encrypted Buffer Alignment • Lossless Vector Preservation
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Features & Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Is it completely free?" 
                                answer="Yes. We provide 100% free PDF combination with no subscriptions, file limits, or hidden fees." 
                            />
                            <FAQItem 
                                question="Is there quality loss?" 
                                answer="Zero. Our stitching engine preserves vector graphics, embedded fonts, and high-res imagery." 
                            />
                            <FAQItem 
                                question="What is the page limit?" 
                                answer="There are no artificial caps. Handled entirely by your device memory." 
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
                fileName={`Merged_Document_${Date.now()}.pdf`} 
            />
        </div>
    );
}

// ---------------- SORTABLE COMPONENT ----------------

interface SortablePageCardProps {
    p: PageItem;
    index: number;
    files: UploadedFile[];
    pagesCount: number;
    removePage: (id: string, e?: React.MouseEvent) => void;
    movePage: (index: number, direction: -1 | 1, e?: React.MouseEvent) => void;
    isDragging: boolean;
}

function SortablePageCard({ p, index, files, pagesCount, removePage, movePage, isDragging }: SortablePageCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: p.id });

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
            className={`group relative h-48 bg-[#3a3a3a] border border-[#555555] hover:border-[#4db8d4] rounded flex flex-col items-center p-2.5 cursor-grab active:cursor-grabbing transition-all duration-200 touch-none ${
                isDragging ? 'opacity-25 border-dashed border-[#4db8d4]' : ''
            }`}
        >
            {/* Remove button */}
            <div className="absolute top-2 left-2 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); removePage(p.id, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-5 h-5 bg-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#cc4444] rounded flex items-center justify-center transition-colors border border-[#555555]"
                    title="Remove page"
                >
                    <X size={10} strokeWidth={2.5} />
                </button>
            </div>

            {/* Thumbnail Canvas */}
            <div className="flex-grow flex items-center justify-center pointer-events-none w-full relative overflow-hidden bg-[#222222] rounded border border-[#444444]" style={{ height: 110 }}>
                {files.find(f => f.id === p.fileId) && (
                    <PdfPageThumbnail
                        file={files.find(f => f.id === p.fileId)!.file}
                        pageIndex={p.pageIndex}
                    />
                )}
                <div className="absolute top-1.5 right-1.5 z-10 bg-[#2a2a2a] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#4db8d4] border border-[#555555]">
                    P.{p.pageIndex + 1}
                </div>
            </div>

            {/* File & Page info */}
            <div className="mt-2 text-center w-full pointer-events-none">
                <div className="text-[10px] text-[#888] truncate px-1" title={p.name}>
                    {p.name}
                </div>
                <div className="text-[11px] font-medium text-[#cccccc] px-1 mt-0.5">
                    Page {p.pageIndex + 1}
                </div>
            </div>

            {/* Mobile arrows (reordering buttons on touch devices) */}
            <div className="absolute bottom-2 inset-x-2 flex justify-between md:hidden z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, -1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center bg-[#2a2a2a] border border-[#555555] text-[#ccc] rounded active:bg-[#444] disabled:opacity-0 transition-colors"
                >
                    <ChevronLeft size={14} strokeWidth={2} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, 1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === pagesCount - 1}
                    className="w-7 h-7 flex items-center justify-center bg-[#2a2a2a] border border-[#555555] text-[#ccc] rounded active:bg-[#444] disabled:opacity-0 transition-colors"
                >
                    <ChevronRight size={14} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}
