"use client";

import "./polyfill";
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
    X, Maximize2, Type, Calendar, CheckSquare, Check as CheckIcon,
    Copy, Trash2, ZoomIn, ZoomOut, ChevronUp, ChevronDown, RotateCcw,
    Stamp as StampIcon, Layers
} from "lucide-react";
import type { Signature } from "./types";

if (typeof window !== "undefined") {
    // Polyfill in main thread
    if (typeof (Promise as any).withResolvers === "undefined") {
        (Promise as any).withResolvers = function <T>() {
            let resolve!: (v: T | PromiseLike<T>) => void;
            let reject!: (r?: any) => void;
            const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
            return { promise, resolve, reject };
        };
    }

    // Set workerSrc directly to the same-origin transpiled legacy worker.
    // This supports both real workers (same-origin, no CORS/CSP restrictions)
    // and fake worker fallback on the main thread (runs full worker script without throws).
    pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + "/pdf.worker.min.mjs";
}

/* ─── Design tokens (kept local for the viewer) ─── */
const V = {
    bg:      "#080809",
    surface: "#101012",
    surfHov: "#1c1c1f",
    border:  "rgba(255,255,255,0.055)",
    accent:  "#7c6aff",
    textSec: "#8b8a97",
    muted:   "#42414d",
    textPri: "#f0eff5",
    danger:  "#ef4444",
};

interface PdfViewerProps {
    file: File;
    signatures: Signature[];
    setSignatures: (sigs: Signature[]) => void;
    pushSignatures: (sigs: Signature[]) => void;
    onBoxSelected: (box: { pageIndex: number; x: number; y: number; w: number; h: number }) => void;
    applyToAllPages: (sig: Signature) => void;
    onLoadSuccess?: (numPages: number, pdf?: any) => void;
    onPageChange?: (page: number) => void;
    activeTool?: string;
    activeSigId: string | null;
    setActiveSigId: (id: string | null) => void;
}

export default function PdfViewer({ file, signatures, setSignatures, pushSignatures, onBoxSelected, applyToAllPages, onLoadSuccess, onPageChange, activeTool, activeSigId, setActiveSigId }: PdfViewerProps) {
    const [pageCount,  setPageCount]  = useState(0);
    const [pdf,        setPdf]        = useState<any>(null);
    const [loadError,  setLoadError]  = useState<string | null>(null);
    const [zoom,       setZoom]       = useState(1);
    const [visiblePage, setVisiblePage] = useState(0);

    const scrollRef  = useRef<HTMLDivElement>(null);
    const pageRefs   = useRef<(HTMLDivElement | null)[]>([]);
    const onLoadRef  = useRef(onLoadSuccess);
    onLoadRef.current = onLoadSuccess;

    useEffect(() => {
        if (!file) return;
        setLoadError(null); setPdf(null); setPageCount(0); setZoom(1);
        (async () => {
            try {
                if (file.size === 0) {
                    throw new Error("The PDF file is empty or inaccessible (0 bytes).");
                }
                const buf    = await file.arrayBuffer();
                const loaded = await pdfjsLib.getDocument({
                    data: new Uint8Array(buf),
                    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
                }).promise;
                setPdf(loaded); setPageCount(loaded.numPages);
                onLoadRef.current?.(loaded.numPages, loaded);
            } catch (err: any) {
                console.error("PDF loading error:", err);
                const desc = err?.message || err?.toString() || "Unknown error";
                setLoadError(
                    err?.message?.includes("password") || err?.name === "PasswordException"
                        ? "This PDF is password protected. Please unlock it first."
                        : `Could not load this PDF. It may be corrupted or unsupported. (Details: ${desc})`
                );
            }
        })();
    }, [file]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || pageCount === 0) return;
        const observer = new IntersectionObserver(
            entries => {
                let best = { ratio: 0, page: 0 };
                entries.forEach(e => {
                    const idx = parseInt(e.target.getAttribute("data-page-idx") || "0");
                    if (e.intersectionRatio > best.ratio) best = { ratio: e.intersectionRatio, page: idx };
                });
                if (best.ratio > 0) {
                    setVisiblePage(best.page);
                    onPageChange?.(best.page);
                }
            },
            { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
        );
        const t = setTimeout(() => { pageRefs.current.forEach(r => r && observer.observe(r)); }, 500);
        return () => { clearTimeout(t); observer.disconnect(); };
    }, [pageCount]);

    const scrollToPage = (idx: number) => pageRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });

    const zoomIn    = () => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)));
    const zoomOut   = () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
    const zoomReset = () => setZoom(1);

    const ZoomPill = () => (
        <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: "rgba(10,10,11,0.88)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${V.border}`,
            borderRadius: 12, padding: "5px 8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
            {[
                { icon: <ZoomOut size={12} />, onClick: zoomOut, disabled: zoom <= 0.5 },
            ].map((btn, i) => (
                <button key={i} onClick={btn.onClick} disabled={btn.disabled} style={{ width: 26, height: 26, borderRadius: 7, background: "none", border: "none", color: btn.disabled ? V.muted : V.textSec, cursor: btn.disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}>
                    {btn.icon}
                </button>
            ))}
            <span style={{ fontSize: 10, fontWeight: 800, color: V.textPri, width: 42, textAlign: "center", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(zoom * 100)}%
            </span>
            <button onClick={zoomIn} disabled={zoom >= 3} style={{ width: 26, height: 26, borderRadius: 7, background: "none", border: "none", color: zoom >= 3 ? V.muted : V.textSec, cursor: zoom >= 3 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ZoomIn size={12} />
            </button>
            <div style={{ width: 1, height: 16, background: V.border, margin: "0 4px" }} />
            <button onClick={zoomReset} style={{ padding: "0 8px", height: 26, borderRadius: 7, background: "none", border: "none", fontSize: 9, fontWeight: 800, color: V.muted, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "inherit" }}>Fit</button>
            <div style={{ width: 1, height: 16, background: V.border, margin: "0 4px" }} />
            <button onClick={() => (window as any).undo?.()} title="Undo (⌘Z)" style={{ width: 26, height: 26, borderRadius: 7, background: "none", border: "none", color: V.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={12} style={{ transform: "scaleX(-1)" }} />
            </button>
            <button onClick={() => (window as any).redo?.()} title="Redo (⌘Y)" style={{ width: 26, height: 26, borderRadius: 7, background: "none", border: "none", color: V.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={12} />
            </button>
        </div>
    );

    return (
        <div
            ref={scrollRef}
            data-lenis-prevent
            data-lenis-prevent-touch
            style={{
                display: "flex", flexDirection: "column",
                maxHeight: "78vh", overflowY: "auto", overflowX: "auto",
                overscrollBehavior: "contain",
                background: "transparent",
                borderRadius: 18,
                position: "relative",
                scrollbarWidth: "thin",
            }}
        >
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                textarea[data-sig-text]::selection { background: #7c6aff !important; color: #fff !important; }
            `}</style>

            {/* Zoom bar — sticky top */}
            <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "10px 0 6px", pointerEvents: "none" }}>
                <div style={{ pointerEvents: "auto" }}><ZoomPill /></div>
            </div>

            {loadError && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 14, textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: V.danger }}>
                        <X size={20} />
                    </div>
                    <p style={{ color: "#fca5a5", fontWeight: 600, fontSize: 14 }}>{loadError}</p>
                </div>
            )}

            {/* Pages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 12px 16px", zoom }}>
                {Array.from({ length: pageCount }, (_, i) => (
                    <div key={`${file.name}-${i}`} ref={el => { pageRefs.current[i] = el; }} data-page-idx={i} id={`pdf-page-${i}`}>
                        <PdfPage
                            pdf={pdf} index={i} zoom={zoom}
                            signatures={signatures} setSignatures={setSignatures}
                            pushSignatures={pushSignatures} onBoxSelected={onBoxSelected}
                            applyToAllPages={applyToAllPages} activeTool={activeTool}
                            activeSigId={activeSigId} setActiveSigId={setActiveSigId}
                        />
                    </div>
                ))}
            </div>


        </div>
    );
}

/* ─── Single PDF page ─── */
function PdfPage({ pdf, index, zoom, signatures, setSignatures, pushSignatures, onBoxSelected, applyToAllPages, activeTool, activeSigId, setActiveSigId }: any) {
    const wrapperRef   = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [dimensions,     setDimensions]     = useState({ w: 0, h: 0 });
    const [isSelecting,    setIsSelecting]    = useState(false);
    const [startPos,       setStartPos]       = useState({ x: 0, y: 0 });
    const [currentRect,    setCurrentRect]    = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const intentLocked     = useRef<"select" | "scroll" | null>(null);
    const [renderError,    setRenderError]    = useState<string | null>(null);
    const skipDeselectRef  = useRef(false);

    const toolCursor = () => {
        if (isSelecting) return "crosshair";
        switch (activeTool) {
            case "text":      return "text";
            case "date":      return "cell";
            case "stamp":     return "alias";
            case "checkmark": return "pointer";
            default:          return "crosshair";
        }
    };

    /* Measure width */
    useEffect(() => {
        const el = wrapperRef.current; if (!el) return;
        const measure = () => { const w = el.clientWidth; if (w > 0 && Math.abs(w - containerWidth) > 10) setContainerWidth(w); };
        measure();
        let t: any;
        const handler = () => { clearTimeout(t); t = setTimeout(measure, 150); };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [containerWidth]);

    /* Render page */
    useEffect(() => {
        if (!pdf || !canvasRef.current || containerWidth === 0) return;
        setRenderError(null);
        let mounted = true;
        let renderTask: any = null;
        (async () => {
            try {
                const page      = await pdf.getPage(index + 1);
                if (!mounted) return;
                const naturalVp = page.getViewport({ scale: 1.0 });
                const dpr       = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
                const fitScale  = containerWidth / naturalVp.width;
                const viewport  = page.getViewport({ scale: fitScale * dpr });
                const canvas    = canvasRef.current;
                if (!canvas || !mounted) return;
                const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
                if (!ctx) return;
                canvas.width  = viewport.width;
                canvas.height = viewport.height;
                const displayW = Math.round(containerWidth);
                const displayH = Math.round(naturalVp.height * fitScale);
                canvas.style.width  = `${displayW}px`;
                canvas.style.height = `${displayH}px`;
                if (mounted) setDimensions({ w: displayW, h: displayH });
                
                if (!mounted) return;
                renderTask = page.render({ canvasContext: ctx, viewport });
                await renderTask.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException" && mounted) {
                    setRenderError(err.toString());
                }
            }
        })();
        return () => {
            mounted = false;
            if (renderTask) {
                try {
                    renderTask.cancel();
                } catch (e) {}
            }
        };
    }, [pdf, index, containerWidth]);

    const getPos = (e: React.PointerEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, dimensions.w)),
            y: Math.max(0, Math.min((e.clientY - rect.top)  / zoom, dimensions.h)),
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest("[data-sig]")) return;
        if (skipDeselectRef.current) {
            skipDeselectRef.current = false;
            return;
        }
        setActiveSigId(null);
        intentLocked.current = null;
        if (e.pointerType === "touch") { setStartPos(getPos(e)); setCurrentRect(null); return; }
        setIsSelecting(true);
        const pos = getPos(e);
        setStartPos(pos);
        setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const pos = getPos(e);
        if (e.pointerType === "touch" && intentLocked.current === null) {
            const dx = Math.abs(pos.x - startPos.x), dy = Math.abs(pos.y - startPos.y);
            if (dx < 6 && dy < 6) return;
            if (dy > dx * 1.5) { intentLocked.current = "scroll"; return; }
            intentLocked.current = "select";
            setIsSelecting(true);
            setCurrentRect({ x: startPos.x, y: startPos.y, w: 0, h: 0 });
            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        }
        if (intentLocked.current === "scroll" || (!isSelecting && e.pointerType === "touch")) return;
        if (!isSelecting) return;
        const dw = pos.x - startPos.x, dh = pos.y - startPos.y;
        setCurrentRect({ x: dw > 0 ? startPos.x : pos.x, y: dh > 0 ? startPos.y : pos.y, w: Math.abs(dw), h: Math.abs(dh) });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        intentLocked.current = null;
        if (!isSelecting) return;
        setIsSelecting(false);
        const pos = getPos(e);
        const dx = Math.abs(pos.x - startPos.x), dy = Math.abs(pos.y - startPos.y);

        if (dx < 10 && dy < 10 && dimensions.w > 0) {
            if (activeTool === "text" || activeTool === "date") { setCurrentRect(null); return; }
            const defaults: Record<string, [number, number]> = { signature: [0.22, 0.1], initials: [0.1, 0.06], checkmark: [0.035, 0.035], date: [0.15, 0.035], stamp: [0.2, 0.06], text: [0.18, 0.06] };
            const [defW, defH] = defaults[activeTool || "signature"] || [0.18, 0.06];
            skipDeselectRef.current = true;
            setTimeout(() => { skipDeselectRef.current = false; }, 150);
            onBoxSelected({ pageIndex: index, x: Math.max(0, Math.min(pos.x / dimensions.w - defW / 2, 1 - defW)), y: Math.max(0, Math.min(pos.y / dimensions.h - defH / 2, 1 - defH)), w: defW, h: defH });
        } else if (currentRect && currentRect.w > 12 && currentRect.h > 12 && dimensions.w > 0) {
            skipDeselectRef.current = true;
            setTimeout(() => { skipDeselectRef.current = false; }, 150);
            onBoxSelected({ pageIndex: index, x: currentRect.x / dimensions.w, y: currentRect.y / dimensions.h, w: currentRect.w / dimensions.w, h: currentRect.h / dimensions.h });
        }
        setCurrentRect(null);
    };

    const pageSigs = signatures.filter((s: Signature) => s.pageIndex === index || s.allPages);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Page label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: V.surface, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: V.muted, flexShrink: 0 }}>
                    {index + 1}
                </span>
                <div style={{ flex: 1, height: 1, background: V.border }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: V.muted, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {activeTool === "text" || activeTool === "date" ? "Drag to draw text box" : "Click or drag to place"}
                </span>
            </div>

            <div ref={wrapperRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <div
                    ref={containerRef}
                    style={{
                        position: "relative", background: "#fff",
                        userSelect: "none", borderRadius: 8,
                        overflow: "hidden",
                        width: "100%", height: dimensions.h || "auto", minHeight: 200,
                        touchAction: isSelecting ? "none" : "pan-y",
                        cursor: toolCursor(),
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />

                    {renderError && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(8,8,9,0.8)", zIndex: 50 }}>
                            <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 12, textAlign: "center" }}>Failed to render page {index + 1}: {renderError}</p>
                        </div>
                    )}

                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                        {pageSigs.map((sig: Signature) => (
                            <AnnotationOverlay
                                key={sig.id} sig={sig} dimensions={dimensions} zoom={zoom}
                                signatures={signatures} setSignatures={setSignatures}
                                pushSignatures={pushSignatures} applyToAllPages={applyToAllPages}
                                activeSigId={activeSigId} setActiveSigId={setActiveSigId}
                            />
                        ))}

                        {isSelecting && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.04)" }} />}

                        {currentRect && currentRect.w > 0 && (
                            <div style={{
                                position: "absolute",
                                left: currentRect.x, top: currentRect.y, width: currentRect.w, height: currentRect.h,
                                border: `2px solid ${V.accent}`,
                                background: `${V.accent}14`,
                                borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {currentRect.w > 70 && currentRect.h > 26 && (
                                    <div style={{ padding: "3px 8px", background: V.accent, color: "#fff", borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                        {/* no label by default */}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!dimensions.h && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8f8" }}>
                            <div style={{ width: 28, height: 28, border: "3px solid #ddd", borderTopColor: "#999", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
    const isActive    = activeSigId === sig.id;
    const textRef     = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragData    = useRef({ dx: 0, dy: 0 });
    const [resizeOffset, setResizeOffset] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (isActive && (sig.type === "text" || sig.type === "date") && textRef.current) {
            textRef.current.focus(); textRef.current.select();
        }
    }, [isActive, sig.type]);

    const startDrag = (e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault();
        setActiveSigId(sig.id);
        const el = containerRef.current; if (!el) return;
        const sp = { x: e.clientX, y: e.clientY };
        const onMove = (me: PointerEvent) => {
            dragData.current = { dx: me.clientX - sp.x, dy: me.clientY - sp.y };
            const dragX = Math.round(dragData.current.dx / zoom);
            const dragY = Math.round(dragData.current.dy / zoom);
            el.style.transform = `translate(${dragX}px,${dragY}px)`;
        };
        const onUp = (me: PointerEvent) => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            el.style.transform = "";
            const dxP = dragData.current.dx / (dimensions.w * zoom);
            const dyP = dragData.current.dy / (dimensions.h * zoom);
            if (dxP !== 0 || dyP !== 0) {
                pushSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                    ...s,
                    x: Math.max(0, Math.min(s.x + dxP, 1 - sig.width)),
                    y: Math.max(0, Math.min(s.y + dyP, 1 - sig.height)),
                }));
            }
            dragData.current = { dx: 0, dy: 0 };
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    };

    const startResize = (e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault();
        const el = containerRef.current; if (!el) return;
        const sp = { x: e.clientX, y: e.clientY };
        const onMove = (me: PointerEvent) => setResizeOffset({ w: (me.clientX - sp.x) / (dimensions.w * zoom), h: (me.clientY - sp.y) / (dimensions.h * zoom) });
        const onUp = (me: PointerEvent) => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            setResizeOffset(curr => {
                if (curr.w !== 0 || curr.h !== 0) {
                    setTimeout(() => pushSignatures(signatures.map((s: Signature) => s.id !== sig.id ? s : {
                        ...s,
                        width:  Math.max(0.005, Math.min(sig.width + curr.w, 1 - sig.x)),
                        height: Math.max(0.005, Math.min(sig.height + curr.h, 1 - sig.y)),
                    })), 0);
                }
                return { w: 0, h: 0 };
            });
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    };

    const displayW = Math.max(0.005, Math.min(sig.width + resizeOffset.w, 1 - sig.x));
    const displayH = Math.max(0.005, Math.min(sig.height + resizeOffset.h, 1 - sig.y));
    const pxW = displayW * dimensions.w * zoom;
    const pxH = displayH * dimensions.h * zoom;
    const annotColor = sig.color || "#000000";

    const calcFontSize = (c: string, w: number, h: number) => {
        const placeholderLen = sig.type === "date" ? 10 : 12;
        if (!c) return Math.max(3, Math.min(h * 0.65, w / (placeholderLen * 0.55)));
        const lines = c.split("\n"); const nL = Math.max(1, lines.length);
        const mC = Math.max(1, ...lines.map(l => l.length));
        return Math.max(3, Math.min(h / (nL * 1.15), w / (mC * 0.55)));
    };
    const textFontSize = calcFontSize(sig.content || "", pxW, pxH);

    return (
        <div
            ref={containerRef}
            data-sig="true"
            style={{
                position: "absolute", pointerEvents: "auto",
                left: `${sig.x * 100}%`, top: `${sig.y * 100}%`,
                width: `${displayW * 100}%`, height: `${displayH * 100}%`,
                touchAction: "none", cursor: "move",
                border: isActive ? `2px solid ${V.accent}` : "1.5px dashed rgba(100,100,120,0.4)",
                borderRadius: 4,
                background: isActive ? "rgba(124,106,255,0.04)" : "transparent",
                zIndex: isActive ? 40 : 10,
                transition: "border-color 0.15s, background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "visible",
            }}
            onPointerDown={startDrag}
            onClick={e => { e.stopPropagation(); setActiveSigId(sig.id); }}
        >
            {/* Annotation content */}
            {(sig.type === "signature" || sig.type === "initials") && (
                <img src={sig.dataUrl} alt="annotation" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} />
            )}

            {sig.type === "checkmark" && (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: annotColor }}>
                    <div style={{ position: "relative", width: `${Math.min(pxW, pxH) * 0.85}px`, height: `${Math.min(pxW, pxH) * 0.85}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", inset: 0, border: "2.5px solid currentColor", borderRadius: 3 }} />
                        <CheckIcon size={Math.min(pxW, pxH) * 0.55} strokeWidth={3.5} />
                    </div>
                </div>
            )}

            {sig.type === "stamp" && (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, color: sig.color || "#dc2626" }}>
                    <div style={{ border: "3px solid currentColor", borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-6deg)", opacity: 0.88, width: "100%", height: "100%" }}>
                        <span style={{ fontSize: `${Math.max(8, Math.min(pxW * 0.12, pxH * 0.55))}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", lineHeight: 1 }}>
                            {sig.content}
                        </span>
                    </div>
                </div>
            )}

            {(sig.type === "text" || sig.type === "date") && (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 2 }}>
                    <textarea
                        ref={textRef}
                        value={sig.content || ""}
                        onChange={e => setSignatures(signatures.map((s: Signature) => s.id === sig.id ? { ...s, content: e.target.value } : s))}
                        onBlur={e => pushSignatures(signatures.map((s: Signature) => s.id === sig.id ? { ...s, content: e.target.value } : s))}
                        onPointerDown={e => { if (isActive) e.stopPropagation(); }}
                        data-sig-text="true"
                        style={{
                            width: "100%", height: "100%",
                            background: "transparent", outline: "none", resize: "none",
                            border: "none", overflow: isActive ? "auto" : "hidden", lineHeight: 1.15,
                            whiteSpace: "pre-wrap", fontSize: `${textFontSize}px`,
                            cursor: isActive ? "text" : "move",
                            pointerEvents: isActive ? "auto" : "none",
                            color: annotColor,
                            fontFamily: sig.fontFamily === "Times-Roman" ? "Times New Roman, serif" : sig.fontFamily === "Courier" ? "Courier New, monospace" : sig.fontFamily && sig.fontFamily !== "Helvetica" ? sig.fontFamily : "Arial, Helvetica, sans-serif",
                            fontWeight: sig.fontWeight || "bold",
                            fontStyle: sig.fontStyle || "normal",
                            textDecoration: sig.textDecoration || "none",
                        }}
                        placeholder={sig.type === "date" ? "Date" : "Type here…"}
                    />
                </div>
            )}

            {/* Action toolbar */}
            <div
                style={{
                    position: "absolute",
                    [sig.y < 0.12 ? "top" : "bottom"]: "calc(100% + 6px)",
                    left: "50%",
                    zIndex: 50, pointerEvents: "auto",
                    whiteSpace: "nowrap",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.95)",
                    transition: "opacity 0.15s, transform 0.15s",
                }}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 6px", background: "rgba(10,10,11,0.92)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa", padding: "0 5px", letterSpacing: "0.05em" }}>
                        {sig.allPages ? "ALL PAGES" : `P${sig.pageIndex + 1}`}
                    </span>
                    <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
                    {!sig.allPages ? (
                        <button onClick={e => { e.stopPropagation(); applyToAllPages(sig); }} title="Apply to all pages" style={{ height: 24, padding: "0 7px", background: "rgba(124,106,255,0.12)", border: "none", borderRadius: 6, color: "#a78bfa", fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}>
                            All pages
                        </button>
                    ) : (
                        <button onClick={e => { e.stopPropagation(); applyToAllPages(sig); }} style={{ height: 24, padding: "0 7px", background: "rgba(124,106,255,0.2)", border: "none", borderRadius: 6, color: "#a78bfa", fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                            ✓ All
                        </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); pushSignatures(signatures.filter((s: Signature) => s.id !== sig.id)); setActiveSigId(null); }} title="Delete" style={{ width: 24, height: 24, borderRadius: 6, background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.6)")}
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* Resize handle */}
            <div
                onPointerDown={startResize}
                style={{
                    position: "absolute", bottom: -5, right: -5,
                    width: 12, height: 12,
                    background: V.accent, border: "2px solid #fff",
                    borderRadius: 3, cursor: "nwse-resize", zIndex: 60,
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.15s",
                    boxShadow: `0 2px 8px rgba(124,106,255,0.5)`,
                }}
            />
        </div>
    );
}
