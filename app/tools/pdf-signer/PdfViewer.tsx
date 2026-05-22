"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
    X, Maximize2, Type, Calendar, CheckSquare, Check as CheckIcon,
    Copy, Trash2, ZoomIn, ZoomOut, ChevronUp, ChevronDown, RotateCcw,
    Stamp as StampIcon
} from "lucide-react";

import type { Signature } from "./types";

if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    if (typeof (Promise as any).withResolvers === "undefined") {
        (Promise as any).withResolvers = function <T>() {
            let resolve!: (value: T | PromiseLike<T>) => void;
            let reject!: (reason?: any) => void;
            const promise = new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }
}

interface PdfViewerProps {
    file: File;
    signatures: Signature[];
    setSignatures: (sigs: Signature[]) => void;
    pushSignatures: (sigs: Signature[]) => void;
    onBoxSelected: (box: { pageIndex: number; x: number; y: number; w: number; h: number }) => void;
    applyToAllPages: (sig: Signature) => void;
    onLoadSuccess?: (numPages: number) => void;
    activeTool?: string;
    activeSigId: string | null;
    setActiveSigId: (id: string | null) => void;
}

export default function PdfViewer({ file, signatures, setSignatures, pushSignatures, onBoxSelected, applyToAllPages, onLoadSuccess, activeTool, activeSigId, setActiveSigId }: PdfViewerProps) {
    const [pageCount, setPageCount] = useState(0);
    const [pdf, setPdf] = useState<any>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [visiblePage, setVisiblePage] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const onLoadSuccessRef = useRef(onLoadSuccess);
    onLoadSuccessRef.current = onLoadSuccess;

    useEffect(() => {
        if (!file) return;
        setLoadError(null);
        setPdf(null);
        setPageCount(0);
        setZoom(1);

        (async () => {
            try {
                const buf = await file.arrayBuffer();
                const data = new Uint8Array(buf);
                const loaded = await pdfjsLib.getDocument({
                    data,
                    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
                }).promise;
                setPdf(loaded);
                setPageCount(loaded.numPages);
                onLoadSuccessRef.current?.(loaded.numPages);
            } catch (err: any) {
                console.error("PDF load error:", err);
                setLoadError(
                    err?.message?.includes("password") || err?.name === "PasswordException"
                        ? "This PDF requires a password to open. Please unlock it first."
                        : "This PDF couldn't be loaded. It might be corrupted or unsupported."
                );
            }
        })();
    }, [file]);

    // Track visible page with IntersectionObserver
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || pageCount === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let best = { ratio: 0, page: 0 };
                entries.forEach(entry => {
                    const idx = parseInt(entry.target.getAttribute("data-page-idx") || "0");
                    if (entry.intersectionRatio > best.ratio) {
                        best = { ratio: entry.intersectionRatio, page: idx };
                    }
                });
                if (best.ratio > 0) setVisiblePage(best.page);
            },
            { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        // Small delay to let pages mount
        const timer = setTimeout(() => {
            pageRefs.current.forEach(ref => ref && observer.observe(ref));
        }, 500);

        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [pageCount]);

    const scrollToPage = (idx: number) => {
        const target = pageRefs.current[idx];
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const zoomIn = () => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)));
    const zoomOut = () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
    const zoomReset = () => setZoom(1);

    return (
        <div
            ref={scrollRef}
            data-lenis-prevent
            data-lenis-prevent-touch
            className="flex flex-col max-h-[78vh] overflow-y-auto overflow-x-auto overscroll-contain bg-[#1c1c1c]/20 rounded-xl border border-white/[0.05]/50 relative"
            style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
            {/* ── Zoom Controls ── */}
            <div className="sticky top-0 z-30 flex justify-center py-2 pointer-events-none">
                <style>{`
                    textarea[data-sig-text]::selection {
                        background-color: #0066ff !important;
                        color: white !important;
                    }
                `}</style>
                <div className="pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/40 rounded-xl px-2 py-1.5 flex items-center gap-1.5 shadow-2xl">
                    <button onClick={zoomOut} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all disabled:opacity-20" disabled={zoom <= 0.5}>
                        <ZoomOut size={13} />
                    </button>
                    <span className="text-[10px] font-black text-zinc-300 w-11 text-center tabular-nums tracking-tight">{Math.round(zoom * 100)}%</span>
                    <button onClick={zoomIn} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all disabled:opacity-20" disabled={zoom >= 3}>
                        <ZoomIn size={13} />
                    </button>
                    <div className="w-px h-4 bg-zinc-700/60" />
                    <button onClick={zoomReset} className="h-7 px-2 rounded-lg text-[9px] font-black text-zinc-500 hover:text-[#f0ede8] hover:bg-white/10 transition-all uppercase tracking-wider">Fit</button>
                    
                    {/* Floating Undo/Redo */}
                    <div className="w-px h-4 bg-zinc-700/60" />
                    <div className="flex items-center gap-0.5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); (window as any).undo?.(); }}
                            title="Undo (Ctrl+Z)"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all active:scale-95"
                        >
                            <RotateCcw size={13} className="scale-x-[-1]" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); (window as any).redo?.(); }}
                            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all active:scale-95"
                        >
                            <RotateCcw size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {loadError && (
                <div className="flex flex-col items-center justify-center p-10 text-center gap-4 py-20">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                        <X size={20} />
                    </div>
                    <p className="text-zinc-300 font-semibold text-sm">{loadError}</p>
                </div>
            )}

            {/* Pages container */}
            <div className="flex flex-col gap-6 p-3 sm:p-5" style={{ zoom }}>
                {Array.from({ length: pageCount }, (_, i) => (
                    <div key={`${file.name}-${i}`} ref={el => { pageRefs.current[i] = el; }} data-page-idx={i}>
                        <PdfPage
                            pdf={pdf}
                            index={i}
                            zoom={zoom}
                            signatures={signatures}
                            setSignatures={setSignatures}
                            pushSignatures={pushSignatures}
                            onBoxSelected={onBoxSelected}
                            applyToAllPages={applyToAllPages}
                            activeTool={activeTool}
                            activeSigId={activeSigId}
                            setActiveSigId={setActiveSigId}
                        />
                    </div>
                ))}
            </div>

            {/* ── Page Navigation ── */}
            {pageCount > 1 && (
                <div className="sticky bottom-2 z-30 flex justify-center pointer-events-none pb-1">
                    <div className="pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/40 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl">
                        <button
                            onClick={() => scrollToPage(Math.max(0, visiblePage - 1))}
                            disabled={visiblePage === 0}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all disabled:opacity-20"
                        >
                            <ChevronUp size={13} />
                        </button>
                        <span className="text-[10px] font-black text-zinc-300 tabular-nums w-14 text-center tracking-tight">
                            {visiblePage + 1} / {pageCount}
                        </span>
                        <button
                            onClick={() => scrollToPage(Math.min(pageCount - 1, visiblePage + 1))}
                            disabled={visiblePage === pageCount - 1}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-[#f0ede8] hover:bg-white/10 transition-all disabled:opacity-20"
                        >
                            <ChevronDown size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Single page ─── */
function PdfPage({ pdf, index, zoom, signatures, setSignatures, pushSignatures, onBoxSelected, applyToAllPages, activeTool, activeSigId, setActiveSigId }: any) {
    const wrapperRef    = useRef<HTMLDivElement>(null);
    const containerRef  = useRef<HTMLDivElement>(null);
    const canvasRef     = useRef<HTMLCanvasElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [dimensions,     setDimensions]     = useState({ w: 0, h: 0 });
    const [isSelecting,    setIsSelecting]    = useState(false);
    const [startPos,       setStartPos]       = useState({ x: 0, y: 0 });
    const [currentRect,    setCurrentRect]    = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const intentLocked     = useRef<"select" | "scroll" | null>(null);
    const [renderError,    setRenderError]    = useState<string | null>(null);

    const getCursorStyle = () => {
        if (isSelecting) return "crosshair";
        switch (activeTool) {
            case "text": return "text";
            case "date": return "cell";
            case "stamp": return "alias";
            case "checkmark": return "pointer";
            case "signature": 
            case "initials": 
            default: return "crosshair";
        }
    };

    /* ── Measure wrapper width ── */
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const measure = () => {
            const w = el.clientWidth;
            if (w > 0 && Math.abs(w - containerWidth) > 10) {
                setContainerWidth(w);
            }
        };

        measure();
        let timeout: any;
        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(measure, 150);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [containerWidth]);

    /* ── Render PDF page ── */
    useEffect(() => {
        if (!pdf || !canvasRef.current || containerWidth === 0) return;
        setRenderError(null);
        let isMounted = true;

        const render = async () => {
            try {
                const page      = await pdf.getPage(index + 1);
                if (!isMounted) return;
                const naturalVp = page.getViewport({ scale: 1.0 });
                const dpr       = window.devicePixelRatio || 1;
                const fitScale  = containerWidth / naturalVp.width;
                const safeDpr   = Math.min(dpr, window.innerWidth < 768 ? 1.5 : 2);
                const renderScale = fitScale * safeDpr;
                const viewport  = page.getViewport({ scale: renderScale });

                const canvas = canvasRef.current;
                if (!canvas || !isMounted) return;

                const ctx    = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
                if (!ctx) return;

                canvas.width  = viewport.width;
                canvas.height = viewport.height;

                const displayW = Math.round(containerWidth);
                const displayH = Math.round(naturalVp.height * fitScale);
                canvas.style.width  = `${displayW}px`;
                canvas.style.height = `${displayH}px`;
                if (isMounted) setDimensions({ w: displayW, h: displayH });

                const task = page.render({ canvasContext: ctx, viewport });
                await task.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException" && isMounted) {
                    console.error("PDF render:", err);
                    setRenderError(err.toString());
                }
            }
        };

        render();
        return () => { isMounted = false; };
    }, [pdf, index, containerWidth]);

    /* ── Selection logic ── */
    const getPos = (e: React.PointerEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, dimensions.w)),
            y: Math.max(0, Math.min((e.clientY - rect.top) / zoom, dimensions.h))
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest("[data-sig]")) return;
        setActiveSigId(null);
        intentLocked.current = null;

        if (e.pointerType === "touch") {
            const pos = getPos(e);
            setStartPos(pos);
            setCurrentRect(null);
            return;
        }

        setIsSelecting(true);
        const pos = getPos(e);
        setStartPos(pos);
        setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const pos = getPos(e);

        if (e.pointerType === "touch" && intentLocked.current === null) {
            const dx = Math.abs(pos.x - startPos.x);
            const dy = Math.abs(pos.y - startPos.y);
            if (dx < 6 && dy < 6) return;

            if (dy > dx * 1.5) {
                intentLocked.current = "scroll";
                return;
            } else {
                intentLocked.current = "select";
                setIsSelecting(true);
                setCurrentRect({ x: startPos.x, y: startPos.y, w: 0, h: 0 });
                try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            }
        }

        if (intentLocked.current === "scroll" || (!isSelecting && e.pointerType === "touch")) return;
        if (!isSelecting) return;

        const dw = pos.x - startPos.x;
        const dh = pos.y - startPos.y;
        setCurrentRect({
            x: dw > 0 ? startPos.x : pos.x,
            y: dh > 0 ? startPos.y : pos.y,
            w: Math.abs(dw), h: Math.abs(dh),
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        intentLocked.current = null;
        if (!isSelecting) return;
        setIsSelecting(false);

        const pos = getPos(e);
        const dx = Math.abs(pos.x - startPos.x);
        const dy = Math.abs(pos.y - startPos.y);

        // Click placement
        if (dx < 10 && dy < 10 && dimensions.w > 0) {
            if (activeTool === "text" || activeTool === "date") {
                setCurrentRect(null);
                return; // Enforce drag-to-draw for custom text areas
            }
            let defW = 0.18, defH = 0.06;
            if (activeTool === "checkmark")  { defW = 0.035; defH = 0.035; }
            else if (activeTool === "initials")  { defW = 0.1;  defH = 0.06; }
            else if (activeTool === "signature") { defW = 0.22; defH = 0.1; }
            else if (activeTool === "date")      { defW = 0.15; defH = 0.035; }
            else if (activeTool === "stamp")     { defW = 0.2;  defH = 0.06; }

            const cx = pos.x / dimensions.w;
            const cy = pos.y / dimensions.h;

            onBoxSelected({
                pageIndex: index,
                x: Math.max(0, Math.min(cx - defW / 2, 1 - defW)),
                y: Math.max(0, Math.min(cy - defH / 2, 1 - defH)),
                w: defW,
                h: defH,
            });
        }
        // Drag selection
        else if (currentRect && currentRect.w > 12 && currentRect.h > 12 && dimensions.w > 0) {
            onBoxSelected({
                pageIndex: index,
                x: currentRect.x / dimensions.w,
                y: currentRect.y / dimensions.h,
                w: currentRect.w / dimensions.w,
                h: currentRect.h / dimensions.h,
            });
        }
        setCurrentRect(null);
    };

    const pageSignatures = signatures.filter((s: Signature) => s.pageIndex === index || s.allPages);

    return (
        <div className="flex flex-col items-stretch gap-2">
            {/* Page header */}
            <div className="flex items-center gap-2 px-1">
                <span className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center text-[9px] font-black text-zinc-400 shrink-0">
                    {index + 1}
                </span>
                <div className="h-px bg-white/[0.06] flex-1" />
                <span className="text-[8px] font-bold text-zinc-700 flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c1c1c]/30 border border-white/[0.07]/30 transition-all">
                    <Maximize2 size={8} /> 
                    {activeTool === "text" || activeTool === "date" ? "Drag to draw box" : "Click or drag to place"}
                </span>
            </div>

            {/* Full-width measured wrapper */}
            <div ref={wrapperRef} className="w-full">
                <div
                    ref={containerRef}
                    className="relative bg-white select-none rounded-sm overflow-hidden"
                    style={{
                        width: "100%",
                        height: dimensions.h || "auto",
                        minHeight: 200,
                        touchAction: isSelecting ? "none" : "pan-y",
                        cursor: getCursorStyle(),
                        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <canvas ref={canvasRef} className="block w-full" />

                    {/* Render error fallback */}
                    {renderError && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-zinc-900/80 overflow-auto z-50">
                            <p className="text-red-400 font-mono text-xs whitespace-pre-wrap text-center font-bold">
                                Failed to render page {index + 1}:<br />{renderError}
                            </p>
                        </div>
                    )}

                    {/* Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                        {pageSignatures.map((sig: Signature) => (
                            <AnnotationOverlay
                                key={sig.id}
                                sig={sig}
                                dimensions={dimensions}
                                zoom={zoom}
                                signatures={signatures}
                                setSignatures={setSignatures}
                                pushSignatures={pushSignatures}
                                applyToAllPages={applyToAllPages}
                                activeSigId={activeSigId}
                                setActiveSigId={setActiveSigId}
                            />
                        ))}

                        {/* Selection dimming overlay */}
                        {isSelecting && <div className="absolute inset-0 bg-black/10" />}

                        {/* Selection rectangle */}
                        {currentRect && currentRect.w > 0 && (
                            <div
                                className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none flex items-center justify-center"
                                style={{ left: currentRect.x, top: currentRect.y, width: currentRect.w, height: currentRect.h }}
                            >
                                {currentRect.w > 60 && currentRect.h > 24 && (
                                    <div className="bg-blue-600 text-[#f0ede8] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight">
                                        {activeTool}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {!dimensions.h && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                            <div className="w-7 h-7 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Annotation overlay ─── */
function AnnotationOverlay({ sig, dimensions, zoom, signatures, setSignatures, pushSignatures, applyToAllPages, activeSigId, setActiveSigId }: {
    sig: Signature; dimensions: { w: number; h: number }; zoom: number;
    signatures: Signature[]; setSignatures: (s: Signature[]) => void;
    pushSignatures: (s: Signature[]) => void;
    applyToAllPages: (s: Signature) => void;
    activeSigId: string | null; setActiveSigId: (id: string | null) => void;
}) {
    const isActive = activeSigId === sig.id;
    const textRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragData = useRef({ dx: 0, dy: 0 });
    const [resizeOffset, setResizeOffset] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (isActive && (sig.type === "text" || sig.type === "date") && textRef.current) {
            textRef.current.focus();
            textRef.current.select();
        }
    }, [isActive, sig.type]);

    const startDrag = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveSigId(sig.id);
        
        const el = containerRef.current;
        if (!el) return;
        
        el.setPointerCapture(e.pointerId);
        const sp = { x: e.clientX, y: e.clientY };
        
        const onMove = (me: PointerEvent) => {
            dragData.current.dx = me.clientX - sp.x;
            dragData.current.dy = me.clientY - sp.y;
            el.style.transform = `translate(${Math.round(dragData.current.dx)}px, ${Math.round(dragData.current.dy)}px)`;
        };
        
        const onUp = (me: PointerEvent) => {
            el.releasePointerCapture(me.pointerId);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onUp);
            el.style.transform = "";
            
            const dxPct = dragData.current.dx / (dimensions.w * zoom);
            const dyPct = dragData.current.dy / (dimensions.h * zoom);
            
            if (dxPct !== 0 || dyPct !== 0) {
                pushSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                    ...s,
                    x: Math.max(0, Math.min(s.x + dxPct, 1 - sig.width)),
                    y: Math.max(0, Math.min(s.y + dyPct, 1 - sig.height)),
                }));
            }
            dragData.current.dx = 0;
            dragData.current.dy = 0;
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
    };

    const startResize = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        const el = containerRef.current;
        if (!el) return;
        
        el.setPointerCapture(e.pointerId);
        const sp = { x: e.clientX, y: e.clientY };
        
        const onMove = (me: PointerEvent) => {
            const dwPct = (me.clientX - sp.x) / (dimensions.w * zoom);
            const dhPct = (me.clientY - sp.y) / (dimensions.h * zoom);
            setResizeOffset({ w: dwPct, h: dhPct });
        };
        
        const onUp = (me: PointerEvent) => {
            el.releasePointerCapture(me.pointerId);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onUp);
            
            setResizeOffset(curr => {
                const finalW = curr.w;
                const finalH = curr.h;
                
                if (finalW !== 0 || finalH !== 0) {
                    // Use a small timeout or requestAnimationFrame to defer the parent state update
                    // or simply call it outside the functional update of the local state.
                    setTimeout(() => {
                        pushSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                            ...s,
                            width:  Math.max(0.005, Math.min(sig.width + finalW, 1 - sig.x)),
                            height: Math.max(0.005, Math.min(sig.height + finalH, 1 - sig.y)),
                        }));
                    }, 0);
                }
                return { w: 0, h: 0 };
            });
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
    };

    const displayW = Math.max(0.005, Math.min(sig.width + resizeOffset.w, 1 - sig.x));
    const displayH = Math.max(0.005, Math.min(sig.height + resizeOffset.h, 1 - sig.y));
    const pxW = displayW * dimensions.w * zoom;
    const pxH = displayH * dimensions.h * zoom;
    const annotColor = sig.color || "#000000";

    const getCalculatedFontSize = (content: string, w: number, h: number) => {
        if (!content) return Math.max(3, h * 0.65);
        const lines = content.split('\n');
        const numLines = Math.max(1, lines.length);
        const maxChars = Math.max(1, ...lines.map(l => l.length));
        const maxH = h / (numLines * 1.15);
        const maxW = w / (maxChars * 0.55);
        return Math.max(3, Math.min(maxH, maxW));
    };
    const textFontSize = getCalculatedFontSize(sig.content || "", pxW, pxH);

    return (
        <div
            ref={containerRef}
            data-sig="true"
            className={`absolute pointer-events-auto group/sig transition-colors cursor-move flex items-center justify-center overflow-visible
                ${isActive
                    ? "ring-2 ring-blue-500 ring-offset-0 bg-blue-50/20 z-40"
                    : "border border-dashed border-zinc-300/60 hover:border-zinc-400 hover:bg-blue-50/5"
                }
            `}
            style={{ left: `${sig.x * 100}%`, top: `${sig.y * 100}%`, width: `${displayW * 100}%`, height: `${displayH * 100}%`, touchAction: "none" }}
            onPointerDown={startDrag}
            onClick={(e) => { e.stopPropagation(); setActiveSigId(sig.id); }}
        >
            {sig.type === "signature" || sig.type === "initials" ? (
                <img src={sig.dataUrl} alt="sig" className="w-full h-full object-contain pointer-events-none select-none" />
            ) : sig.type === "checkmark" ? (
                /* Boxed checkmark */
                <div className="w-full h-full flex items-center justify-center" style={{ color: annotColor }}>
                    <div className="relative flex items-center justify-center" style={{ width: `${Math.min(pxW, pxH) * 0.85}px`, height: `${Math.min(pxW, pxH) * 0.85}px` }}>
                        <div className="absolute inset-0 border-[2.5px] border-current rounded-[3px]" />
                        <CheckIcon size={Math.min(pxW, pxH) * 0.55} strokeWidth={3.5} className="relative" />
                    </div>
                </div>
            ) : sig.type === "stamp" ? (
                /* Stamp overlay */
                <div className="w-full h-full flex items-center justify-center p-0.5" style={{ color: sig.color || "#dc2626" }}>
                    <div className="border-[3px] border-current rounded-md px-2 py-0.5 flex items-center justify-center transform -rotate-6 opacity-90 w-full h-full">
                        <span
                            className="font-black uppercase tracking-[0.15em] text-center leading-none"
                            style={{ fontSize: `${Math.max(8, Math.min(pxW * 0.12, pxH * 0.55))}px` }}
                        >
                            {sig.content}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex items-center p-0.5">
                    <textarea
                        ref={textRef}
                        value={sig.content || ""}
                        onChange={e => {
                            setSignatures(signatures.map((s: Signature) => s.id === sig.id ? { ...s, content: e.target.value } : s));
                        }}
                        onBlur={e => {
                            pushSignatures(signatures.map((s: Signature) => s.id === sig.id ? { ...s, content: e.target.value } : s));
                        }}
                        onPointerDown={(e) => {
                            if (isActive) e.stopPropagation();
                        }}
                        data-sig-text="true"
                        className="w-full h-full bg-transparent text-left outline-none resize-none overflow-hidden leading-tight whitespace-pre"
                        wrap="off"
                        style={{
                            fontSize: `${textFontSize}px`,
                            lineHeight: 1.15,
                            cursor: isActive ? "text" : "move",
                            pointerEvents: isActive ? "auto" : "none",
                            color: annotColor,
                            fontFamily: sig.fontFamily === "Times-Roman" ? "Times New Roman" : sig.fontFamily === "Courier" ? "Courier New" : sig.fontFamily && sig.fontFamily !== "Helvetica" ? sig.fontFamily : "Arial, Helvetica, sans-serif",
                            fontWeight: sig.fontWeight || "bold",
                            fontStyle: sig.fontStyle || "normal",
                            textDecoration: sig.textDecoration || "none",
                        }}
                        placeholder={sig.type === "date" ? "Date" : "Type here..."}
                    />
                </div>
            )}

            {/* Action bar */}
            <div 
                className={`
                    absolute ${sig.y < 0.12 ? "top-full mt-1" : "bottom-full mb-1"} left-1/2 -translate-x-1/2 z-50
                    flex items-center pointer-events-auto whitespace-nowrap
                    transition-all duration-150
                    ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover/sig:opacity-100 group-hover/sig:scale-100"}
                `}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="bg-[#1c1c1c] border border-zinc-700 text-[#f0ede8] px-1.5 py-1 rounded-lg shadow-xl flex items-center gap-1" style={{ fontSize: 0 }}>
                    <span className="text-[9px] font-bold uppercase tracking-tight px-1.5 text-zinc-300">
                        {sig.allPages ? "All" : `P${sig.pageIndex + 1}`}
                    </span>
                    {!sig.allPages && (
                        <button onClick={e => { e.stopPropagation(); applyToAllPages(sig); }}
                            className="h-6 px-2 bg-white/[0.06] hover:bg-zinc-700 text-zinc-300 hover:text-[#f0ede8] rounded text-[8px] font-bold uppercase transition-colors"
                            title="Apply to all pages">
                            <Copy size={10} />
                        </button>
                    )}
                    {sig.allPages && (
                        <button onClick={e => { e.stopPropagation(); applyToAllPages(sig); }}
                            className="h-6 px-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-[8px] font-bold uppercase transition-colors"
                            title="Remove from all pages">
                            All ✓
                        </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); pushSignatures(signatures.filter((s: Signature) => s.id !== sig.id)); setActiveSigId(null); }}
                        className="h-6 w-6 flex items-center justify-center hover:bg-red-600/30 hover:text-red-400 text-zinc-400 rounded transition-colors"
                        title="Delete">
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* Resize handle */}
            <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nwse-resize z-[60] transition-opacity
                    ${isActive ? "opacity-100" : "opacity-0 group-hover/sig:opacity-100"}`}
                onPointerDown={startResize}
            />
        </div>
    );
}
