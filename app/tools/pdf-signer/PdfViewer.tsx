"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Plus, Globe, ArrowRight, X, Loader2, Maximize2 } from "lucide-react";

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { Signature } from "@/app/tools/pdf-signer/types";

interface PdfViewerProps {
    file: File;
    signatures: Signature[];
    setSignatures: (sigs: Signature[]) => void;
    onBoxSelected: (box: { pageIndex: number; x: number; y: number; w: number; h: number }) => void;
    applyToAllPages: (sig: Signature) => void;
}

export default function PdfViewer({ file, signatures, setSignatures, onBoxSelected, applyToAllPages }: PdfViewerProps) {
    const [pageCount, setPageCount] = useState(0);
    const [pdf, setPdf] = useState<any>(null);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const loadedPdf = await loadingTask.promise;
                setPdf(loadedPdf);
                setPageCount(loadedPdf.numPages);
            } catch (err) {
                console.error("Error loading PDF for viewer:", err);
            }
        };
        loadPdf();
    }, [file]);

    return (
        <div className="flex flex-col gap-16 p-12 max-h-[85vh] overflow-y-auto custom-scrollbar-wide bg-zinc-950/40 rounded-[3rem] border border-zinc-900 shadow-2xl backdrop-blur-md">
            {Array.from({ length: pageCount }, (_, i) => (
                <PdfPage 
                    key={`${file.name}-${i}`} 
                    pdf={pdf} 
                    index={i} 
                    signatures={signatures} 
                    setSignatures={setSignatures}
                    onBoxSelected={onBoxSelected}
                    applyToAllPages={applyToAllPages}
                />
            ))}
            
            {/* Final workspace padding */}
            <div className="h-10" />
        </div>
    );
}

// Memoized Background with Paper Texture & Elite Rendering
const PdfBackground = React.memo(({ pdf, index, onDimensions }: { pdf: any; index: number; onDimensions: (d: {w: number, h: number}) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        const render = async () => {
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch (e) {}
            }

            try {
                const page = await pdf.getPage(index + 1);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for sharp text on high-res displays
                
                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext("2d");
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Set CSS display size for crispness
                canvas.style.width = `${viewport.width / 2}px`;
                canvas.style.height = `${viewport.height / 2}px`;
                onDimensions({ w: viewport.width / 2, h: viewport.height / 2 });

                const renderContext = { 
                    canvasContext: context, 
                    viewport: viewport,
                    enableWebGL: true,
                    intent: 'print' // Professional print-quality rendering
                };
                const task = page.render(renderContext);
                renderTaskRef.current = task;
                await task.promise;
            } catch (err: any) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('PDF Render error:', err);
                }
            }
        };

        const timer = setTimeout(render, 50);
        return () => {
            clearTimeout(timer);
            if (renderTaskRef.current) renderTaskRef.current.cancel();
        };
    }, [pdf, index]);

    return (
        <canvas 
            key={`${index}-${pdf?.numPages}`} 
            ref={canvasRef} 
            className="block opacity-95 transition-opacity hover:opacity-100 duration-500" 
        />
    );
}, (prev, next) => prev.pdf === next.pdf && prev.index === next.index);

PdfBackground.displayName = "PdfBackground";

function PdfPage({ pdf, index, signatures, setSignatures, onBoxSelected, applyToAllPages }: any) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setIsSelecting(true);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setCurrentRect({ x, y, w: 0, h: 0 });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting || !startPos || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newW = x - startPos.x;
        const newH = y - startPos.y;
        
        setCurrentRect({
            x: newW > 0 ? startPos.x : x,
            y: newH > 0 ? startPos.y : y,
            w: Math.abs(newW),
            h: Math.abs(newH)
        });
    };

    const handlePointerUp = () => {
        if (!isSelecting || !currentRect) return;
        setIsSelecting(false);
        if (currentRect.w > 15 && currentRect.h > 15) {
            onBoxSelected({
                pageIndex: index,
                x: currentRect.x / dimensions.w,
                y: currentRect.y / dimensions.h,
                w: currentRect.w / dimensions.w,
                h: currentRect.h / dimensions.h
            });
        }
        setCurrentRect(null);
    };

    const pageSignatures = signatures.filter((s: Signature) => s.pageIndex === index || s.allPages);

    return (
        <div className="flex flex-col items-center gap-6 group scale-[1.001]">
            {/* Page Header Indicator */}
            <div className="flex items-center justify-between w-full max-w-2xl px-2">
                 <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-emerald-400">
                        {index + 1}
                    </span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">DOCUMENT PAGE</span>
                 </div>
                 <div className="h-px bg-gradient-to-r from-zinc-900/0 via-zinc-800 to-zinc-900/0 flex-1 mx-6" />
                 <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 opacity-60 group-hover:opacity-100 transition-all uppercase tracking-widest bg-zinc-900/20 px-3 py-1 rounded-full border border-transparent group-hover:border-zinc-800">
                    <Maximize2 size={10} /> Drag to Select Area
                 </div>
            </div>
            
            <div 
                ref={containerRef}
                className="relative bg-white border border-zinc-200/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_5px_20px_-5px_rgba(0,0,0,0.3)] rounded-sm select-none cursor-crosshair transform-gpu transition-all duration-500 group-hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_10px_30px_-10px_rgba(0,0,0,0.4)] p-0"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ width: dimensions.w ? dimensions.w : 'auto', height: dimensions.h ? dimensions.h : 'auto', minHeight: '400px' }}
            >
                {/* STATIC BACKGROUND (Memoized) */}
                <PdfBackground 
                    pdf={pdf} 
                    index={index} 
                    onDimensions={setDimensions} 
                />
                
                {/* INTERACTION OVERLAYS (Dynamic) */}
                <div className="absolute inset-0 pointer-events-none">
                    {pageSignatures.map((sig: Signature) => (
                        <div 
                            key={sig.id}
                            className="absolute pointer-events-auto border-2 border-dashed border-emerald-400 group/sig hover:border-emerald-500 hover:bg-emerald-500/5 transition-colors cursor-move"
                            style={{
                                left: `${sig.x * 100}%`,
                                top: `${sig.y * 100}%`,
                                width: `${sig.width * 100}%`,
                                height: `${sig.height * 100}%`
                            }}
                            onPointerDown={(e) => {
                                // Drag Move Logic
                                e.stopPropagation();
                                const startPos = { x: e.clientX, y: e.clientY };
                                const startSig = { ...sig };
                                
                                const onMove = (me: PointerEvent) => {
                                    const dx = (me.clientX - startPos.x) / dimensions.w;
                                    const dy = (me.clientY - startPos.y) / dimensions.h;
                                    setSignatures(signatures.map((s: Signature) => s.id === sig.id ? {
                                        ...s,
                                        x: startSig.x + dx,
                                        y: startSig.y + dy
                                    } : s));
                                };
                                const onUp = () => {
                                    window.removeEventListener('pointermove', onMove);
                                    window.removeEventListener('pointerup', onUp);
                                };
                                window.addEventListener('pointermove', onMove);
                                window.addEventListener('pointerup', onUp);
                            }}
                        >
                            <img src={sig.dataUrl} alt="signature" className="w-full h-full object-contain opacity-90 pointer-events-none select-none" />
                            
                            {/* Actions Overlay - Smart Positioned */}
                            <div className={`absolute ${sig.y < 0.15 ? '-bottom-16 top-auto' : '-top-14'} left-1/2 -translate-x-1/2 opacity-0 group-hover/sig:opacity-100 transition-all scale-75 group-hover/sig:scale-100 transform z-50 flex items-center gap-2 pointer-events-auto`}>
                                <div className="bg-emerald-500 text-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                        {sig.allPages ? "Global Signature" : "Single Page"}
                                    </span>
                                    
                                    {!sig.allPages && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); applyToAllPages(sig); }}
                                            className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                        >
                                            Apply to All
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSignatures(signatures.filter((s: Signature) => s.id !== sig.id)); }}
                                        className="p-1 hover:text-red-900 transition-colors"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Resize Handle */}
                            <div 
                                className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-emerald-500 rounded-full cursor-nwse-resize shadow-xl flex items-center justify-center z-[60] opacity-0 group-hover/sig:opacity-100 transition-opacity"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    const startPos = { x: e.clientX, y: e.clientY };
                                    const startSize = { w: sig.width, h: sig.height };
                                    
                                    const onResizeMove = (me: PointerEvent) => {
                                        const dw = (me.clientX - startPos.x) / dimensions.w;
                                        const dh = (me.clientY - startPos.y) / dimensions.h;
                                        setSignatures(signatures.map((s: Signature) => s.id === sig.id ? {
                                            ...s,
                                            width: startSize.w + dw,
                                            height: startSize.h + dh
                                        } : s));
                                    };
                                    const onResizeUp = () => {
                                        window.removeEventListener('pointermove', onResizeMove);
                                        window.removeEventListener('pointerup', onResizeUp);
                                    };
                                    window.addEventListener('pointermove', onResizeMove);
                                    window.addEventListener('pointerup', onResizeUp);
                                }}
                            >
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            </div>
                        </div>
                    ))}
                    
                    {isSelecting && <div className="absolute inset-0 bg-black/20" />}

                    {currentRect && (
                        <div 
                            className="absolute border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none"
                            style={{
                                left: currentRect.x,
                                top: currentRect.y,
                                width: currentRect.w,
                                height: currentRect.h
                            }}
                        >
                             <div className="bg-emerald-500 text-black px-2 py-1 rounded-full flex items-center gap-1 scale-75 whitespace-nowrap">
                                <Plus size={12} strokeWidth={4} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Sign Here</span>
                             </div>
                        </div>
                    )}
                </div>

                {!dimensions.w && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-zinc-500 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar-wide::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-wide::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 99px; }
                .custom-scrollbar-wide::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 99px; }
                `}</style>
        </div>
    );
}
