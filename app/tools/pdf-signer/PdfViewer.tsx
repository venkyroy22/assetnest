"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Plus, X, Maximize2 } from "lucide-react";

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
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!file) return;
        setLoadError(null);
        let objectUrl: string | null = null;
        
        (async () => {
            try {
                objectUrl = URL.createObjectURL(file);
                // Use URL string rather than arrayBuffer to stream the PDF efficiently
                // and avoid hitting mobile Safari RAM limits with huge files.
                const loaded = await pdfjsLib.getDocument(objectUrl).promise;
                setPdf(loaded);
                setPageCount(loaded.numPages);
            } catch (err: any) {
                console.error("PDF load error:", err);
                setLoadError(err?.message?.includes("password") || err?.name === "PasswordException" 
                    ? "This PDF requires a password to open. Please unlock it first." 
                    : "This PDF couldn't be loaded. It might be corrupted or unsupported.");
            }
        })();

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return (
        <div
            className="flex flex-col gap-8 p-3 sm:p-6 md:p-10 max-h-[85vh] overflow-y-auto overscroll-contain custom-scrollbar-wide bg-zinc-950/40 rounded-[2rem] sm:rounded-[3rem] border border-zinc-900 backdrop-blur-md"
            style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
            {loadError && (
                <div className="flex flex-col items-center justify-center p-10 text-center gap-4 py-20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                        <X size={24} />
                    </div>
                    <p className="text-zinc-300 font-semibold">{loadError}</p>
                </div>
            )}
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
            <div className="h-4" />
            <style jsx global>{`
                .custom-scrollbar-wide::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar-wide::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-wide::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 99px; }
            `}</style>
        </div>
    );
}

/* ─── Single page ─── */
function PdfPage({ pdf, index, signatures, setSignatures, onBoxSelected, applyToAllPages }: any) {
    const wrapperRef    = useRef<HTMLDivElement>(null); // the measured width container
    const containerRef  = useRef<HTMLDivElement>(null); // the actual clickable page div
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [dimensions,     setDimensions]     = useState({ w: 0, h: 0 });
    const [isSelecting,    setIsSelecting]    = useState(false);
    const [startPos,       setStartPos]       = useState({ x: 0, y: 0 });
    const [currentRect,    setCurrentRect]    = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [activeSigId,    setActiveSigId]    = useState<string | null>(null);
    const intentLocked     = useRef<"select" | "scroll" | null>(null); // touch intent

    /* ── Measure wrapper width ── */
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            if (w > 0) setContainerWidth(w);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /* ── Render PDF page — always scaled to fit container width ── */
    useEffect(() => {
        if (!pdf || !canvasRef.current || containerWidth === 0) return;

        const render = async () => {
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch {}
            }
            try {
                const page          = await pdf.getPage(index + 1);
                const naturalVp     = page.getViewport({ scale: 1.0 });
                const dpr           = window.devicePixelRatio || 1;

                // Scale so the PDF fits exactly in containerWidth (cap DPR to 1.5 on mobile to prevent memory limits)
                const fitScale      = containerWidth / naturalVp.width;
                const safeDpr       = Math.min(dpr, window.innerWidth < 768 ? 1.5 : 2);
                const renderScale   = fitScale * safeDpr;
                const viewport      = page.getViewport({ scale: renderScale });

                const canvas        = canvasRef.current!;
                const ctx           = canvas.getContext("2d")!;
                canvas.width        = viewport.width;
                canvas.height       = viewport.height;

                // CSS display size = container fill
                const displayW      = containerWidth;
                const displayH      = (naturalVp.height * fitScale);
                canvas.style.width  = `${displayW}px`;
                canvas.style.height = `${displayH}px`;
                setDimensions({ w: displayW, h: displayH });

                // Render at display fidelity, NOT 'print' (print crashes mobile canvas RAM limits)
                const task = page.render({ canvasContext: ctx, viewport });
                renderTaskRef.current = task;
                await task.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") console.error("PDF render:", err);
            }
        };

        const t = setTimeout(render, 40);
        return () => { clearTimeout(t); renderTaskRef.current?.cancel(); };
    }, [pdf, index, containerWidth]);

    /* ── Selection logic ── */
    const getPos = (e: React.PointerEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest("[data-sig]")) return;
        setActiveSigId(null);
        intentLocked.current = null;

        // On touch, don't immediately capture — wait to see direction
        if (e.pointerType === "touch") {
            const pos = getPos(e);
            setStartPos(pos);
            setCurrentRect(null);
            // Don't setPointerCapture yet — let the scroll container handle vertical swipes
            return;
        }

        // Mouse: start selection immediately
        setIsSelecting(true);
        const pos = getPos(e);
        setStartPos(pos);
        setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const pos = getPos(e);

        // Touch: determine intent on first significant movement
        if (e.pointerType === "touch" && intentLocked.current === null) {
            const dx = Math.abs(pos.x - startPos.x);
            const dy = Math.abs(pos.y - startPos.y);
            if (dx < 6 && dy < 6) return; // not enough movement yet

            if (dy > dx * 1.5) {
                // Predominantly vertical — this is a scroll, let it pass through
                intentLocked.current = "scroll";
                return;
            } else {
                // Horizontal/diagonal — this is a selection drag
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

    const handlePointerUp = () => {
        intentLocked.current = null;
        if (!isSelecting || !currentRect) { setIsSelecting(false); return; }
        setIsSelecting(false);
        if (currentRect.w > 12 && currentRect.h > 12 && dimensions.w > 0) {
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
        <div className="flex flex-col items-stretch gap-3">
            {/* Page header */}
            <div className="flex items-center gap-2 px-1">
                <span className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-emerald-400 shrink-0">
                    {index + 1}
                </span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Page</span>
                <div className="h-px bg-gradient-to-r from-zinc-900/0 via-zinc-800 to-zinc-900/0 flex-1" />
                <span className="text-[9px] font-bold text-zinc-600 flex items-center gap-1 bg-zinc-900/30 px-2 py-1 rounded-full border border-zinc-800/50">
                    <Maximize2 size={9} /> Drag to sign
                </span>
            </div>

            {/* Full-width measured wrapper */}
            <div ref={wrapperRef} className="w-full">
                <div
                    ref={containerRef}
                    className="relative bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] select-none cursor-crosshair"
                    style={{
                        width: "100%",
                        height: dimensions.h || "auto",
                        minHeight: 200,
                        // Allow vertical scroll to pass through when not in selection mode
                        touchAction: isSelecting ? "none" : "pan-y",
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {/* PDF canvas — always fills full container width */}
                    <canvas ref={canvasRef} className="block w-full" />

                    {/* Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                        {pageSignatures.map((sig: Signature) => (
                            <SigOverlay
                                key={sig.id}
                                sig={sig}
                                dimensions={dimensions}
                                signatures={signatures}
                                setSignatures={setSignatures}
                                applyToAllPages={applyToAllPages}
                                activeSigId={activeSigId}
                                setActiveSigId={setActiveSigId}
                            />
                        ))}

                        {isSelecting && <div className="absolute inset-0 bg-black/15" />}

                        {currentRect && currentRect.w > 4 && (
                            <div
                                className="absolute border-2 border-emerald-500 bg-emerald-500/10 pointer-events-none flex items-center justify-center"
                                style={{ left: currentRect.x, top: currentRect.y, width: currentRect.w, height: currentRect.h }}
                            >
                                {currentRect.w > 60 && currentRect.h > 30 && (
                                    <div className="bg-emerald-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Plus size={10} strokeWidth={3} />
                                        <span className="text-[9px] font-black uppercase">Sign Here</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {!dimensions.h && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <div className="w-7 h-7 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Signature overlay ─── */
function SigOverlay({ sig, dimensions, signatures, setSignatures, applyToAllPages, activeSigId, setActiveSigId }: {
    sig: Signature; dimensions: { w: number; h: number };
    signatures: Signature[]; setSignatures: (s: Signature[]) => void;
    applyToAllPages: (s: Signature) => void;
    activeSigId: string | null; setActiveSigId: (id: string | null) => void;
}) {
    const isActive = activeSigId === sig.id;

    const startDrag = (e: React.PointerEvent) => {
        e.stopPropagation();
        if (e.pointerType === "touch") setActiveSigId(sig.id);
        const sp = { x: e.clientX, y: e.clientY };
        const ss = { x: sig.x, y: sig.y };
        const onMove = (me: PointerEvent) => {
            setSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                ...s,
                x: ss.x + (me.clientX - sp.x) / dimensions.w,
                y: ss.y + (me.clientY - sp.y) / dimensions.h,
            }));
        };
        const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const startResize = (e: React.PointerEvent) => {
        e.stopPropagation();
        const sp = { x: e.clientX, y: e.clientY };
        const ss = { w: sig.width, h: sig.height };
        const onMove = (me: PointerEvent) => {
            setSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                ...s,
                width:  Math.max(0.05, ss.w + (me.clientX - sp.x) / dimensions.w),
                height: Math.max(0.05, ss.h + (me.clientY - sp.y) / dimensions.h),
            }));
        };
        const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <div
            data-sig="true"
            className="absolute pointer-events-auto group/sig border-2 border-dashed border-emerald-500 hover:bg-emerald-500/5 transition-colors cursor-move"
            style={{ left: `${sig.x * 100}%`, top: `${sig.y * 100}%`, width: `${sig.width * 100}%`, height: `${sig.height * 100}%` }}
            onPointerDown={startDrag}
        >
            <img src={sig.dataUrl} alt="sig" className="w-full h-full object-contain opacity-90 pointer-events-none select-none" />

            {/* Action bar */}
            <div className={`
                absolute ${sig.y < 0.15 ? "-bottom-11 top-auto" : "-top-10"} left-1/2 -translate-x-1/2 z-50
                flex items-center gap-1.5 pointer-events-auto whitespace-nowrap
                transition-all duration-200
                ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover/sig:opacity-100 group-hover/sig:scale-100"}
            `}>
                <div className="bg-emerald-500 text-black px-2.5 py-1.5 rounded-full shadow-xl flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-tight">
                        {sig.allPages ? "All Pages" : `Pg ${sig.pageIndex + 1}`}
                    </span>
                    {!sig.allPages && (
                        <button onClick={e => { e.stopPropagation(); applyToAllPages(sig); }}
                            className="px-2 py-0.5 bg-black/30 hover:bg-black/50 text-white rounded-full text-[8px] font-black uppercase transition-colors">
                            All Pages
                        </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setSignatures(signatures.filter((s: Signature) => s.id !== sig.id)); setActiveSigId(null); }}
                        className="hover:text-red-900 transition-colors">
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Resize handle */}
            <div
                className={`absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-emerald-500 rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center z-[60] transition-opacity
                    ${isActive ? "opacity-100" : "opacity-0 group-hover/sig:opacity-100"}`}
                onPointerDown={startResize}
            >
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
        </div>
    );
}
