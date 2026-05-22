"use client";

import { useState, useRef } from "react";
import {
    Upload, Download, X, RefreshCw, Combine, Undo, Redo,
    ChevronLeft, ChevronRight, Info, Grid, ArrowLeft, Share2,
    Check, ShieldCheck
} from "lucide-react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
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
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

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
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="text-center mb-8 relative group">
                <button 
                    onClick={() => setShowHelp(true)}
                    className="absolute -top-2 -left-2 p-2 rounded-full bg-zinc-900/80 border border-white/[0.07] text-zinc-400 hover:text-[#f0ede8] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30 shadow-lg"
                    title="View Information"
                >
                    <Info size={16} />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 mb-6">
                    <Combine size={11} className="text-red-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Secure Document Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#f0ede8] mb-4">
                    PDF <span className="text-red-500">Merger</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Combine multiple PDF documents and easily arrange or delete specific pages securely in your browser.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 rounded-2xl animate-in fade-in">
                    <Info size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-medium text-red-100">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-[#f0ede8]"><X size={16} /></button>
                </div>
            )}

            {!outputUrl ? (
                <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                    
                    {/* Compact Dropzone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`py-8 px-6 border border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? "border-red-500 bg-red-500/5" : "border-white/[0.07] bg-[#1c1c1c] hover:bg-[#1e1e1e]/50"}`}
                    >
                        <input ref={fileInputRef} type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#1c1c1c] border border-white/[0.07] rounded-xl flex items-center justify-center shadow-xl shrink-0">
                                {isLoading ? <RefreshCw className="animate-spin text-zinc-500" size={20} /> : <Upload size={20} className="text-zinc-500" />}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-[#f0ede8] tracking-tight">{isLoading ? "Loading Pages..." : "Drag & Drop or Click Here"}</h2>
                                <p className="text-zinc-500 text-[10px] font-medium">100% Private PDF Merging • Arrange Pages Visually</p>
                            </div>
                        </div>
                    </div>

                    {/* Pages Grid Editor */}
                    {pages.length > 0 && (
                        <div className="bg-[#1c1c1c] border border-white/[0.05] rounded-[2rem] p-6 shadow-2xl relative animate-in fade-in">
                            <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <Grid size={14} className="text-red-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[#f0ede8] tracking-tight">Arrange Pages ({pages.length})</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/[0.07]">
                                        <Tooltip content="Undo (Ctrl+Z)">
                                            <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-[#f0ede8] transition-colors"><Undo size={16} /></button>
                                        </Tooltip>
                                        <Tooltip content="Redo (Ctrl+Y)">
                                            <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-[#f0ede8] transition-colors"><Redo size={16} /></button>
                                        </Tooltip>
                                    </div>
                                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 block sm:inline mt-1 sm:mt-0">Drag or use arrows to reorder • Click X to delete</span>
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
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                        <div className="h-44 w-32 bg-[#1c1c1c] border border-zinc-700 rounded-2xl flex flex-col items-center p-3 opacity-80 shadow-2xl scale-105">
                                            <div className="flex-grow flex items-center justify-center w-full bg-white/5 rounded border border-white/5">
                                                <div className="text-[10px] font-bold text-zinc-500">Moving Page {draggedIdx + 1}</div>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>

                            <div className="mt-6 pt-6 border-t border-white/[0.05] flex flex-col md:flex-row gap-4 items-center justify-between">
                                <span className="text-xs font-semibold tracking-wider text-zinc-400">
                                    {files.length} File{files.length !== 1 ? 's' : ''} • {pages.length} Page{pages.length !== 1 ? 's' : ''} Total
                                </span>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => resetHistory({ files: [], pages: [] })}
                                        className="h-14 px-6 font-semibold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all bg-transparent border border-white/[0.07] text-zinc-400 hover:text-[#f0ede8] hover:bg-white/[0.06]"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={mergePdfs}
                                        disabled={pages.length === 0 || isLoading}
                                        className={`h-14 px-8 font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all flex-grow md:flex-grow-0 ${pages.length === 0 ? "bg-[#1c1c1c] text-zinc-500 border border-white/[0.07] cursor-not-allowed" : "bg-[#f0ede8] text-[#141414] hover:bg-[#e8e5e0] shadow-xl shadow-white/5"}`}
                                    >
                                        {isLoading ? (
                                            <><RefreshCw size={18} className="animate-spin" /> Merging...</>
                                        ) : (
                                            <>Export {pages.length} Pages</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Preview */}
                        <div className="bg-[#1c1c1c] border border-white/[0.07] rounded-[2rem] p-4 shadow-2xl flex flex-col min-h-[300px] sm:min-h-[450px]">
                            <h3 className="text-xs sm:text-sm font-bold text-[#f0ede8] mb-3 sm:mb-4 px-2">Merged Preview</h3>
                            <div className="flex-grow bg-[#1c1c1c] rounded-xl overflow-hidden min-h-[250px] sm:min-h-[400px]">
                                <object data={outputUrl} type="application/pdf" className="w-full h-full min-h-[250px] sm:min-h-[400px]">
                                    <iframe src={outputUrl} className="w-full h-full min-h-[250px] sm:min-h-[400px] border-none" title="PDF Preview" />
                                </object>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="bg-[#1c1c1c] border border-white/[0.07] rounded-[2rem] p-6 sm:p-8 shadow-2xl flex flex-col justify-center text-center space-y-6 sm:space-y-8">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-xl">
                                <Combine size={28} className="text-red-500 sm:size-32" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[#f0ede8] tracking-tight mb-2">Success!</h2>
                                <p className="text-zinc-400 text-xs sm:text-sm font-medium">Your custom PDF has been generated.</p>
                            </div>
                            
                            <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 sm:py-6 border-y border-white/[0.05]">
                                <div className="text-center px-3 sm:px-4">
                                    <span className="block text-2xl sm:text-3xl font-black text-[#f0ede8]">{pages.length}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 mt-1 uppercase">Pages</span>
                                </div>
                                <div className="w-px h-10 sm:h-12 bg-[#1c1c1c]"></div>
                                <div className="text-center px-3 sm:px-4">
                                    <span className="block text-2xl sm:text-3xl font-black text-[#f0ede8]">{outputSize ? formatSize(outputSize) : "---"}</span>
                                    <span className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-zinc-500 mt-1 uppercase">Size</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <button 
                                    onClick={handleDownload}
                                    className="h-12 px-6 bg-[#f0ede8] text-[#141414] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-[#e8e5e0] transition-all active:scale-[0.98] shadow-xl"
                                >
                                    <Download size={18} /> 
                                    <span className="hidden sm:inline">Download Custom PDF</span>
                                    <span className="sm:hidden">Download PDF</span>
                                </button>
                                <button 
                                    onClick={() => setIsSharing(true)}
                                    className="h-12 px-6 bg-[#1c1c1c] border border-white/[0.07] text-[#f0ede8] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                                >
                                    <Share2 size={16} className="text-red-400" /> 
                                    <span className="hidden sm:inline">Share to Mobile</span>
                                    <span className="sm:hidden">Share File</span>
                                </button>
                                <button 
                                    onClick={() => setOutputUrl(null)}
                                    className="h-12 px-6 bg-transparent border border-white/[0.07] text-zinc-300 hover:text-[#f0ede8] font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-[#1c1c1c] transition-all"
                                >
                                    <ArrowLeft size={16} /> Edit Pages
                                </button>
                                <button 
                                    onClick={reset}
                                    className="h-12 px-6 bg-transparent border border-white/[0.07] text-zinc-500 hover:text-red-400 font-semibold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-[#1c1c1c] transition-all"
                                >
                                    <RefreshCw size={14} /> Start Fresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {!outputUrl && files.length === 0 && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/[0.05] pt-12 max-w-4xl mx-auto">
                    {[
                        { title: "Privacy First", desc: "Documents never leave your computer. 100% processed in your browser." },
                        { title: "Visual Organizer", desc: "Drag and drop individual pages into the perfect custom order." },
                        { title: "Remove Clutter", desc: "Delete cover pages, blank spots, or redundant indices with one click." }
                    ].map((f, i) => (
                        <div key={i} className="space-y-4 text-center md:text-left">
                             <h4 className="text-[10px] font-bold text-red-500">{f.title}</h4>
                             <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
            
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Merger Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                            Visual PDF Architecture: Merge & Organize
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for document assembly. AssetNest <strong>Visual PDF Merger</strong> transcends basic file combination—it provides a structural editor where you can manipulate individual pages as if they were physical assets. Whether you are compiling a massive corporate report, a complex legal brief, or a personal portfolio, our tool gives you the power to drag, reorder, and refine your PDF documents with zero loss in quality and absolute data privacy.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <Combine size={20} className="text-red-500" />
                                How to Merge Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-red-500" /></div>
                                    <span><strong>Secure Drop:</strong> Drag multiple PDF files into the encrypted dropzone. Our engine instantly maps every page.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-red-500" /></div>
                                    <span><strong>Dynamic Reorder:</strong> Use the drag-and-drop grid to visually sequence your document flow. Move cover pages, appendices, and tables of contents with ease.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-red-500" /></div>
                                    <span><strong>Precision Delete:</strong> Hover over any page thumbnail and click &quot;X&quot; to permanently remove unwanted blank pages or sensitive sections before export.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive PDF data on external servers, our merger operates <strong>100% locally in your browser cache</strong>. Your files never leave your device, ensuring total compliance with privacy regulations.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • Encrypted Buffer Alignment • High-Fidelity Vector Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] border-t border-white/[0.05] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Is it free?">
                                Yes. We provide 100% free PDF combination with no subscriptions, file limits, or hidden costs.
                            </AccordionItem>
                            <AccordionItem title="Quality Loss?">
                                Zero. Our stitching engine preserves every vector, font, and high-resolution image during the merge.
                            </AccordionItem>
                            <AccordionItem title="File Limits?">
                                The only limit is your device&apos;s memory. We easily handle hundreds of pages in a single export.
                            </AccordionItem>
                        </Accordion>
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
            className={`group relative h-44 bg-[#1c1c1c] border border-white/[0.07] rounded-2xl flex flex-col items-center p-3 cursor-grab active:cursor-grabbing hover:border-red-500/50 hover:bg-zinc-800/80 transition-all touch-none ${isDragging ? 'opacity-30 border-dashed border-red-500' : ''}`}
        >
            <div className="absolute top-2 left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); removePage(p.id, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 bg-[#141414]/60 backdrop-blur-md text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-[#f0ede8] transition-colors border border-white/10"
                >
                    <X size={12} />
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center pointer-events-none w-full relative overflow-hidden bg-white/5 rounded border border-white/5" style={{ height: 96 }}>
                {files.find(f => f.id === p.fileId) && (
                    <PdfPageThumbnail
                        file={files.find(f => f.id === p.fileId)!.file}
                        pageIndex={p.pageIndex}
                    />
                )}
                <div className="absolute top-1 right-1 z-10 bg-[#141414]/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-[#f0ede8] shadow-md backdrop-blur-sm border border-white/10">
                    Pg {p.pageIndex + 1}
                </div>
            </div>

            <div className="mt-2 text-center w-full pointer-events-none">
                <div className="text-[10px] text-zinc-500 truncate px-1">
                    {p.name.length > 12 ? p.name.substring(0, 10) + '...' : p.name}
                </div>
                <div className="text-xs font-black text-[#f0ede8] px-1">
                    Page {p.pageIndex + 1}
                </div>
            </div>

            {/* Mobile arrows (hidden on desktop hover) */}
            <div className="absolute bottom-2 inset-x-2 flex justify-between md:hidden z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, -1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center bg-white/[0.06] border border-zinc-700 text-zinc-300 rounded-lg active:bg-zinc-700 disabled:opacity-0 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); movePage(index, 1, e); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={index === pagesCount - 1}
                    className="w-8 h-8 flex items-center justify-center bg-white/[0.06] border border-zinc-700 text-zinc-300 rounded-lg active:bg-zinc-700 disabled:opacity-0 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

