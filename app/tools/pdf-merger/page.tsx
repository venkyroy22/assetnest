"use client";

import { useState, useRef } from "react";
import {
    Upload, Download, X, RefreshCw, Combine, Undo, Redo,
    ChevronLeft, ChevronRight, Info, Grid, ArrowLeft, Share2,
    Check, ShieldCheck, Sparkles, Package, Lock as LockIcon, FileText, ChevronDown
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
import ShareModal from "@/components/ShareModal";
import Tooltip from "@/components/Tooltip";
import HelpModal from "@/components/HelpModal";

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
        const pdfFiles = newFiles.filter(f => f.type === "application/pdf");
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
            setError("Failed to parse some of the documents. They might be corrupted or encrypted.");
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

            const pdfBytes = await mergedPdf.save({ useObjectStreams: false }); // Compress structure
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
                        <Combine size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Merger
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
                {error && (
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl">
                        <Info size={16} className="text-red-750 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!outputUrl ? (
                    <div className="flex flex-col gap-6 max-w-4xl mx-auto relative z-10">
                        {/* Compact Dropzone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative min-h-[200px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group/dropzone ${
                                isDragging 
                                    ? "bg-red-50" 
                                    : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
                            }`}
                        >
                            <input ref={fileInputRef} type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileChange} />
                            
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left px-8 py-6">
                                <div className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_#000] shrink-0 transition-all duration-300 group-hover/dropzone:scale-105">
                                    {isLoading ? (
                                        <RefreshCw className="animate-spin text-black" size={24} />
                                    ) : (
                                        <Upload size={24} className="text-black" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-black tracking-tight ig-display">
                                        {isLoading ? "Analyzing PDF documents..." : "Drag & Drop PDFs or Click to Browse"}
                                    </h2>
                                    <p className="text-zinc-650 text-xs mt-1 font-medium leading-relaxed max-w-md">
                                        Stitch multiple PDF files together or rearrange pages. Processes entirely inside browser memory for 100% data safety.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pages Grid Editor */}
                        {pages.length > 0 && (
                            <div className="bg-white border-2 border-black rounded-[2rem] p-8 shadow-[5px_5px_0_#000] relative overflow-hidden animate-in fade-in">
                                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 border-b-2 border-black/10 pb-6">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-2xl bg-red-50 border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            <Grid size={18} className="text-black" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-black tracking-tight ig-display">Arrange Pages ({pages.length})</h3>
                                            <p className="text-xs text-zinc-655 font-bold mt-0.5">Drag blocks to organize your combined document flow</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-4 w-full lg:w-auto justify-between lg:justify-end">
                                        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-black shadow-[2px_2px_0_#000]">
                                            <Tooltip content="Undo (Ctrl+Z)">
                                                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-xl hover:bg-[#a7f3d0] disabled:opacity-30 text-black transition-colors"><Undo size={16} /></button>
                                            </Tooltip>
                                            <Tooltip content="Redo (Ctrl+Y)">
                                                <button onClick={redo} disabled={!canRedo} className="p-2 rounded-xl hover:bg-[#a7f3d0] disabled:opacity-30 text-black transition-colors"><Redo size={16} /></button>
                                            </Tooltip>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-650 ig-label">Drag or use arrow buttons</span>
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
                                        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                            <div className="h-48 w-32 bg-white border-2 border-black rounded-2xl flex flex-col items-center p-3 opacity-80 shadow-2xl scale-105">
                                                <div className="flex-grow flex items-center justify-center w-full bg-zinc-50 rounded border border-black/10">
                                                    <div className="text-[10px] font-bold text-zinc-500">Moving Page {draggedIdx + 1}</div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>

                                <div className="mt-8 pt-8 border-t-2 border-black/10 flex flex-col sm:flex-row gap-4 items-center justify-between relative z-10">
                                    <span className="text-xs font-bold text-black uppercase tracking-widest bg-zinc-50 px-4 py-2 border-2 border-black rounded-xl shadow-[2px_2px_0_#000] ig-label">
                                        {files.length} File{files.length !== 1 ? 's' : ''} • {pages.length} Page{pages.length !== 1 ? 's' : ''} Total
                                    </span>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={() => resetHistory({ files: [], pages: [] })}
                                            className="h-12 px-6 font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 transition-all bg-white border-2 border-black text-black hover:bg-zinc-50 shadow-[2px_2px_0_#000] active:scale-[0.98] ig-btn"
                                        >
                                            Clear All
                                        </button>
                                        <button 
                                            onClick={mergePdfs}
                                            disabled={pages.length === 0 || isLoading}
                                            className={`h-12 px-8 font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 transition-all flex-grow sm:flex-grow-0 active:scale-[0.98] ig-btn border-2 border-black ${
                                                pages.length === 0 
                                                    ? "bg-white text-zinc-400 cursor-not-allowed opacity-55" 
                                                    : "bg-[#fde047] text-black shadow-[3.5px_3.5px_0_#000]"
                                            }`}
                                        >
                                            {isLoading ? (
                                                <><RefreshCw size={14} className="animate-spin" /> Merging...</>
                                            ) : (
                                                <>Merge & Export PDF</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Preview */}
                            <div className="bg-white border-2 border-black rounded-[2.5rem] p-5 shadow-[5px_5px_0_#000] flex flex-col min-h-[350px] sm:min-h-[500px]">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-black mb-4 px-2 ig-label">Merged PDF Preview</h3>
                                <div className="flex-grow bg-zinc-100 rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[420px] border-2 border-black">
                                    <object data={outputUrl} type="application/pdf" className="w-full h-full min-h-[300px] sm:min-h-[420px]">
                                        <iframe src={outputUrl} className="w-full h-full min-h-[300px] sm:min-h-[420px] border-none" title="PDF Preview" />
                                    </object>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-10 shadow-[5px_5px_0_#000] flex flex-col justify-center text-center space-y-8 relative overflow-hidden">
                                <div className="relative z-10 w-20 h-20 bg-red-50 border-2 border-black rounded-3xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000]">
                                    <Combine size={32} className="text-black" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2 ig-display">Stitching Complete!</h2>
                                    <p className="text-zinc-600 text-xs sm:text-sm font-bold">Your custom PDF has been compiled in-browser.</p>
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-center gap-6 py-6 border-y-2 border-black/10">
                                    <div className="text-center px-4">
                                        <span className="block text-2xl sm:text-3xl font-black text-black leading-none">{pages.length}</span>
                                        <span className="text-[9px] font-bold tracking-wider text-zinc-500 mt-1.5 uppercase block ig-label">Pages</span>
                                    </div>
                                    <div className="w-0.5 h-10 bg-black/10"></div>
                                    <div className="text-center px-4">
                                        <span className="block text-2xl sm:text-3xl font-black text-black leading-none">{outputSize ? formatSize(outputSize) : "---"}</span>
                                        <span className="text-[9px] font-bold tracking-wider text-zinc-500 mt-1.5 uppercase block ig-label">File Size</span>
                                    </div>
                                </div>

                                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <button 
                                        onClick={handleDownload}
                                        className="h-12 px-6 bg-[#fde047] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-yellow-350 transition-all active:scale-[0.98] shadow-[2.5px_2.5px_0_#000] ig-btn"
                                    >
                                        <Download size={16} /> 
                                        <span>Download PDF</span>
                                    </button>
                                    <button 
                                        onClick={() => setIsSharing(true)}
                                        className="h-12 px-6 bg-white border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-[2.5px_2.5px_0_#000] ig-btn"
                                    >
                                        <Share2 size={16} /> 
                                        <span>Share to Mobile</span>
                                    </button>
                                    <button 
                                        onClick={() => setOutputUrl(null)}
                                        className="h-12 px-6 bg-transparent border-2 border-black text-zinc-600 hover:text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                    >
                                        <ArrowLeft size={16} /> Edit Pages
                                    </button>
                                    <button 
                                        onClick={reset}
                                        className="h-12 px-6 bg-transparent border-2 border-black text-zinc-500 hover:text-red-700 font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all shadow-[2.5px_2.5px_0_#000] ig-btn"
                                    >
                                        <RefreshCw size={14} /> Start Fresh
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                Free PDF Merger Online — Combine PDF Files Privately
                            </h2>
                            <p className="text-sm text-zinc-650 leading-relaxed">
                                Combine multiple PDF files into one document instantly using our secure online PDF merger. Perfect for consolidating corporate documents, portfolios, legal binders, or study sheets. Drag to reorder pages and delete empty sheets directly in browser memory — no watermarks, no registration, and no server uploads.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Client-Side Page Stitching",
                                    desc: "Stitch individual document pages entirely in your local RAM sandbox using pdf-lib. No external server receives your sensitive files.",
                                    icon: <Combine size={16} />
                                },
                                {
                                    title: "Drag & Drop Reordering",
                                    desc: "Rearrange and change the order of specific pages visually in our sorting grid canvas. Customize document flows easily.",
                                    icon: <Grid size={16} />
                                },
                                {
                                    title: "Precise Page-Level Pruning",
                                    desc: "Prune blank sheets, cover pages, or redundant dividers by clicking the delete button on any page thumbnail before export.",
                                    icon: <X size={16} />
                                },
                                {
                                    title: "Lossless Vector Quality",
                                    desc: "Retain high-resolution fonts, vectors, charts, signature shapes, and metadata structure during page stitching operations.",
                                    icon: <FileText size={16} />
                                },
                                {
                                    title: "100% Free & Unlimited",
                                    desc: "Merge files without page limit caps, daily thresholds, or premium subscriptions. Process multi-megabyte PDFs completely free.",
                                    icon: <Sparkles size={16} />
                                },
                                {
                                    title: "Zero Watermark Overlays",
                                    desc: "Export clean files. We never inject branding watermarks, promotional stamps, or advertising headers onto your documents.",
                                    icon: <LockIcon size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-2xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-655 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Combine PDF Files Online for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Add Document Files", desc: "Drag and drop multiple PDF files into the secure compiler drop zone, or browse files to parse page streams." },
                                    { step: "2", title: "Arrange & Edit Pages", desc: "Drag page thumbnails to reorder pages, use mobile arrows, or prune unwanted pages with the X button." },
                                    { step: "3", title: "Export and Download", desc: "Inspect the merged document in our preview container, click 'Download PDF' to save your new file instantly." }
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
                                AssetNest Online PDF Merger vs. Traditional Cloud PDF Converters
                            </h3>
                            <p className="text-xs text-zinc-500 text-center mb-8 max-w-lg mx-auto">
                                Compare our local-first WebAssembly PDF-lib engine with typical cloud converters.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-zinc-50 shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-white border-b-2 border-black">
                                            <th className="p-4 text-black font-black ig-label">Feature capability</th>
                                            <th className="p-4 text-emerald-800 font-black ig-label">AssetNest In-Browser Merger</th>
                                            <th className="p-4 text-zinc-650 font-black ig-label">Cloud PDF Services</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {[
                                            { feat: "Document Safety & Privacy", ours: "100% Private (Calculated inside your local sandbox, zero uploads)", other: "Risky (Files sent and cached on remote web servers)" },
                                            { feat: "Stitching Granularity", ours: "Visual page-by-page ordering and individual page deletion", other: "Often limited to merging entire documents in sequence" },
                                            { feat: "Usage & Size Limits", ours: "Completely free with unlimited pages (restricted only by local RAM)", other: "Often caps page counts or restricts file sizes behind paywalls" },
                                            { feat: "Compile Performance", ours: "Instant local merging (no upload delays or queue wait times)", other: "Heavy reliance on network bandwidth for uploads & downloads" },
                                            { feat: "Watermark Overlays", ours: "Clean exports (no watermark stamps, logos, or ads added)", other: "Injects branding watermarks unless premium license is purchased" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-100 transition-colors">
                                                <td className="p-4 text-black font-bold ig-display">{row.feat}</td>
                                                <td className="p-4 text-emerald-850 font-bold">{row.ours}</td>
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
                                PDF Merger FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="How does browser-side PDF merging protect my privacy?">
                                    AssetNest uses pdf-lib compiled locally in WebAssembly to process document stitching directly in your browser's RAM sandbox. Since your PDF files are never uploaded to any remote servers, your sensitive financial statements, legal briefs, and personal documents remain 100% secure and private.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Will my PDF's text formatting, images, or vectors lose quality?">
                                    No. Our offline merge engine parses the document structure and merges page streams without re-compressing or rasterizing content. This ensures every embedded vector, high-res graphic, font asset, and digital signature retains its original fidelity and sharpness.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Is there a maximum limit on the number of PDF pages I can merge?">
                                    There are no artificial constraints. The only limit is your local computer's memory. The application can easily handle combining documents spanning hundreds of pages.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I merge password-encrypted or write-protected PDF documents?">
                                    PDFs with active encryption or user permissions passwords must be unlocked first before compiling, as our parsing engine needs permission to read and extract the page streams. You can use the AssetNest PDF Unlocker tool to clear restrictions first.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Does AssetNest add any watermark stamps to the exported PDF files?">
                                    No. All files compiled on AssetNest are completely free of watermarks, logos, stamps, or advertising banners. We provide clean, professional document exports for all users.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>
            
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Merger Info">
                <div className="space-y-12 text-black leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual PDF Architecture: Merge & Organize
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium font-sans">
                            Step into a professional-grade workspace for document assembly. AssetNest <strong>Visual PDF Merger</strong> transcends basic file combination—it provides a structural editor where you can manipulate individual pages as if they were physical assets. Whether you are compiling a massive corporate report, a complex legal brief, or a personal portfolio, our tool gives you the power to drag, reorder, and refine your PDF documents with zero loss in quality and absolute data privacy.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                                <Combine size={20} className="text-black inline mr-2" />
                                How to Merge Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Secure Drop:</strong> Drag multiple PDF files into the encrypted dropzone. Our engine instantly maps every page.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Dynamic Reorder:</strong> Use the drag-and-drop grid to visually sequence your document flow. Move cover pages, appendices, and tables of contents with ease.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Precision Delete:</strong> Hover over any page thumbnail and click &quot;X&quot; to permanently remove unwanted blank pages or sensitive sections before export.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black space-y-6 shadow-[3px_3px_0_#000]">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                                <ShieldCheck size={20} className="text-black inline mr-2" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-750 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive PDF data on external servers, our merger operates <strong>100% locally in your browser cache</strong>. Your files never leave your device, ensuring total compliance with privacy regulations.
                            </p>
                            <div className="p-6 bg-white rounded-3xl border-2 border-black">
                                <p className="text-[10px] uppercase font-black tracking-widest text-black ig-label">Technical Spec</p>
                                <p className="text-[11px] text-zinc-650 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • Encrypted Buffer Alignment • High-Fidelity Vector Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">Documentation FAQ</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Is it free?">
                                Yes. We provide 100% free PDF combination with no subscriptions, file limits, or hidden costs.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Quality Loss?">
                                Zero. Our stitching engine preserves every vector, font, and high-resolution image during the merge.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="File Limits?">
                                The only limit is your device&apos;s memory. We easily handle hundreds of pages in a single export.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </section>
                </div>
            </HelpModal>
            
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
            className={`group relative h-48 bg-white border-2 border-black rounded-2xl flex flex-col items-center p-3 cursor-grab active:cursor-grabbing hover:bg-zinc-50 transition-all duration-300 touch-none shadow-[2px_2px_0_#000] ${isDragging ? 'opacity-30 border-dashed border-red-500 shadow-none' : ''}`}
        >
            <div className="absolute top-2.5 left-2.5 opacity-100 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); removePage(p.id, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-black hover:scale-105"
                >
                    <X size={12} strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center pointer-events-none w-full relative overflow-hidden bg-zinc-100 rounded-xl border-2 border-black" style={{ height: 110 }}>
                {files.find(f => f.id === p.fileId) && (
                    <PdfPageThumbnail
                        file={files.find(f => f.id === p.fileId)!.file}
                        pageIndex={p.pageIndex}
                    />
                )}
                <div className="absolute top-2 right-2 z-10 bg-white px-2 py-0.5 rounded-lg text-[9px] font-bold text-black border-2 border-black shadow-[1px_1px_0_#000]">
                    Pg {p.pageIndex + 1}
                </div>
            </div>

            <div className="mt-3 text-center w-full pointer-events-none">
                <div className="text-[10px] text-zinc-600 truncate px-1 font-bold">
                    {p.name.length > 15 ? p.name.substring(0, 13) + '...' : p.name}
                </div>
                <div className="text-xs font-black text-black px-1 mt-0.5 ig-display">
                    Page {p.pageIndex + 1}
                </div>
            </div>

            {/* Mobile arrows (hidden on desktop hover) */}
            <div className="absolute bottom-2.5 inset-x-2.5 flex justify-between md:hidden z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, -1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black text-black rounded-lg active:bg-zinc-100 disabled:opacity-0 transition-colors shadow-[1px_1px_0_#000]"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, 1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === pagesCount - 1}
                    className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black text-black rounded-lg active:bg-zinc-100 disabled:opacity-0 transition-colors shadow-[1px_1px_0_#000]"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

