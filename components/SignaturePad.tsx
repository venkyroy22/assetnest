"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Eraser, RotateCcw, Check, PenTool, Palette, PenLine } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

const PRESET_COLORS = [
    { name: "Ink Black",    value: "#0a0a0a" },
    { name: "Royal Blue",   value: "#1a3fbf" },
    { name: "Crimson",      value: "#c0172b" },
    { name: "Forest Green", value: "#047857" },
    { name: "Deep Violet",  value: "#5b21b6" },
];

type PenStyle = "ballpoint" | "fountain" | "marker";

const PEN_STYLES: { id: PenStyle; label: string; desc: string }[] = [
    { id: "ballpoint", label: "Ball",     desc: "Sharp & precise"  },
    { id: "fountain",  label: "Fountain", desc: "Flowing elegance" },
    { id: "marker",    label: "Marker",   desc: "Bold & visible"   },
];

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const wrapperRef    = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const ctxRef        = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef  = useRef(false);

    const [color,     setColor]     = useState("#0a0a0a");
    const [penStyle,  setPenStyle]  = useState<PenStyle>("ballpoint");
    const [lineWidth, setLineWidth] = useState(3);
    const [mode,      setMode]      = useState<"pen" | "eraser">("pen");
    const [isEmpty,   setIsEmpty]   = useState(true);

    /* ── Canvas bootstrap with ResizeObserver ── */
    useEffect(() => {
        const canvas  = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w   = wrapper.clientWidth;
            const h   = wrapper.clientHeight;

            // Preserve existing drawing
            const tmp = document.createElement("canvas");
            tmp.width  = canvas.width;
            tmp.height = canvas.height;
            tmp.getContext("2d")?.drawImage(canvas, 0, 0);

            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width  = `${w}px`;
            canvas.style.height = `${h}px`;

            const ctx = canvas.getContext("2d")!;
            ctx.scale(dpr, dpr);
            ctx.lineCap  = "round";
            ctx.lineJoin = "round";
            ctx.drawImage(tmp, 0, 0, w, h);
            ctxRef.current = ctx;
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);
        return () => ro.disconnect();
    }, []);

    /* ── Coordinate helper — works for both mouse and touch ── */
    const getXY = (e: React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    /* ── Apply pen style ── */
    const setupCtx = (ctx: CanvasRenderingContext2D) => {
        if (mode === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth  = lineWidth * 8;
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            switch (penStyle) {
                case "fountain":
                    ctx.lineWidth   = lineWidth;
                    ctx.shadowColor = color;
                    ctx.shadowBlur  = 3;
                    ctx.globalAlpha = 0.93;
                    break;
                case "marker":
                    ctx.lineWidth   = lineWidth * 2.2;
                    ctx.shadowBlur  = 0;
                    ctx.globalAlpha = 0.75;
                    break;
                default:
                    ctx.lineWidth   = lineWidth;
                    ctx.shadowBlur  = 0;
                    ctx.globalAlpha = 1;
            }
        }
    };

    const onPointerDown = (e: React.PointerEvent) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        isDrawingRef.current = true;
        const pos = getXY(e);
        setupCtx(ctx);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsEmpty(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawingRef.current || !ctxRef.current) return;
        const pos = getXY(e);
        ctxRef.current.lineTo(pos.x, pos.y);
        ctxRef.current.stroke();
    };

    const onPointerUp = () => {
        if (!ctxRef.current) return;
        isDrawingRef.current = false;
        ctxRef.current.closePath();
        ctxRef.current.shadowBlur  = 0;
        ctxRef.current.globalAlpha = 1;
    };

    const clear = () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        setIsEmpty(true);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;
        
        // Auto-Crop bounds to prevent squishing when placed onto PDF
        const w = canvas.width;
        const h = canvas.height;
        const data = ctx.getImageData(0, 0, w, h).data;
        
        let minX = w, minY = h, maxX = 0, maxY = 0;
        let p = 0;
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[p + 3] > 0) { // If pixel has opacity
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
                p += 4;
            }
        }
        
        if (maxX < minX || maxY < minY) {
            onSave(canvas.toDataURL("image/png")); return;
        }
        
        const pad = 20; // safe padding
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad);
        maxY = Math.min(h, maxY + pad);
        
        const cropW = maxX - minX;
        const cropH = maxY - minY;
        
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
        
        onSave(cropCanvas.toDataURL("image/png"));
    };

    const isCustomColor = !PRESET_COLORS.find(c => c.value === color);

    return (
        /* ── Full-screen overlay ── */
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onCancel} />

            {/* ── Sheet — slides up on mobile, centered card on desktop ── */}
            <div className="
                relative w-full sm:max-w-[960px] bg-[#0d0d0f]
                border border-white/[0.07] shadow-[0_-30px_80px_rgba(0,0,0,0.8)] sm:shadow-[0_60px_120px_rgba(0,0,0,0.9)]
                rounded-t-[2.5rem] sm:rounded-[2.5rem]
                flex flex-col
                h-[92vh] sm:h-[88vh] sm:max-h-[720px]
                overflow-hidden
            ">

                {/* ── HEADER ── */}
                <header className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <PenLine size={17} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-xl font-black text-white tracking-tighter leading-none">Signature Studio</h2>
                            <p className="mt-0.5 text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] hidden sm:flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                {mode === "eraser" ? "Eraser active" : `${PEN_STYLES.find(s => s.id === penStyle)?.desc} · ${lineWidth}px`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clear}
                            disabled={isEmpty}
                            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl bg-white/[0.04] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-white/[0.06] transition-all text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <RotateCcw size={12} /> <span className="hidden sm:inline">Clear</span>
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </header>

                {/* ── BODY: tool strip + canvas ── */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left tool dock — vertical on desktop, hidden on mobile (tools move to bottom bar) */}
                    <aside className="hidden sm:flex w-24 bg-black/40 border-r border-white/[0.05] flex-col items-center py-6 gap-3 shrink-0">
                        {PEN_STYLES.map(s => {
                            const active = mode === "pen" && penStyle === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { setPenStyle(s.id); setMode("pen"); }}
                                    title={s.desc}
                                    className={`
                                        relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 overflow-hidden
                                        transition-all duration-300
                                        ${active
                                            ? "bg-emerald-500 text-black scale-105 shadow-xl shadow-emerald-500/40"
                                            : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white"
                                        }
                                    `}
                                >
                                    {active && <div className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent pointer-events-none" />}
                                    <PenTool size={16} strokeWidth={active ? 2.5 : 1.8} />
                                    <span className="text-[8px] font-extrabold uppercase tracking-tight z-10">{s.label}</span>
                                </button>
                            );
                        })}
                        <div className="w-8 h-px bg-white/10 my-1" />
                        <button
                            onClick={() => setMode("eraser")}
                            className={`
                                w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1
                                transition-all duration-300
                                ${mode === "eraser"
                                    ? "bg-white text-black scale-105 shadow-xl"
                                    : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white"
                                }
                            `}
                        >
                            <Eraser size={16} strokeWidth={1.8} />
                            <span className="text-[8px] font-extrabold uppercase tracking-tight">Erase</span>
                        </button>
                    </aside>

                    {/* Canvas area */}
                    <div className="flex-1 p-3 sm:p-5 min-h-0 flex flex-col min-w-0">
                        <div
                            ref={wrapperRef}
                            className="relative flex-1 bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] cursor-crosshair"
                            style={{ touchAction: "none", minHeight: "180px" }}
                        >
                            {/* Paper grid */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                style={{
                                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                                    backgroundSize: "36px 36px"
                                }}
                            />

                            {/* Signature baseline */}
                            <div className="absolute bottom-[28%] left-6 right-6 border-b border-dashed border-zinc-300 pointer-events-none" />
                            <span className="absolute bottom-[20%] left-6 text-[9px] text-zinc-300 font-semibold tracking-widest uppercase pointer-events-none select-none">
                                Sign here
                            </span>

                            {/* Canvas */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0"
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerLeave={onPointerUp}
                            />

                            {/* Empty hint */}
                            {isEmpty && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none pb-16">
                                    <p className="text-zinc-300 text-sm font-semibold tracking-wide">Draw your signature</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── CONTROL HUB (always at bottom) ── */}
                <footer className="px-4 sm:px-6 pb-5 sm:pb-6 pt-3 sm:pt-4 border-t border-white/[0.05] shrink-0">
                    <div className="flex flex-col gap-3">

                        {/* Row 1: Mobile tool strip + Colors + Custom picker */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Pen style chips — visible only on mobile */}
                            <div className="flex sm:hidden items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.05]">
                                {PEN_STYLES.map(s => {
                                    const active = mode === "pen" && penStyle === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => { setPenStyle(s.id); setMode("pen"); }}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-extrabold uppercase tracking-tight transition-all ${active ? "bg-emerald-500 text-black" : "text-zinc-500"}`}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setMode("eraser")}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-extrabold uppercase tracking-tight transition-all ${mode === "eraser" ? "bg-white text-black" : "text-zinc-500"}`}
                                >
                                    <Eraser size={12} />
                                </button>
                            </div>

                            {/* Color palette */}
                            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-2 rounded-xl border border-white/[0.06] flex-1 sm:flex-none">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        title={c.name}
                                        onClick={() => { setColor(c.value); setMode("pen"); }}
                                        className="shrink-0"
                                    >
                                        <span
                                            className={`block w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200
                                                ${color === c.value && mode === "pen"
                                                    ? "scale-125 ring-2 ring-white/80"
                                                    : "opacity-50 hover:opacity-90 hover:scale-110"
                                                }`}
                                            style={{ background: c.value }}
                                        />
                                    </button>
                                ))}
                                {/* Custom */}
                                <button
                                    title="Custom color"
                                    onClick={() => colorInputRef.current?.click()}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-500 via-pink-500 to-orange-400 transition-all shrink-0
                                        ${isCustomColor && mode === "pen" ? "scale-125 ring-2 ring-white/80" : "opacity-50 hover:opacity-90"}`}
                                >
                                    <Palette size={13} className="text-white" />
                                </button>
                                <input ref={colorInputRef} type="color" className="hidden" value={color}
                                    onChange={e => { setColor(e.target.value); setMode("pen"); }} />
                            </div>
                        </div>

                        {/* Row 2: Thickness + Confirm */}
                        <div className="flex items-center gap-3 sm:gap-6">
                            {/* Thickness */}
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">Thickness</span>
                                    <span className="text-[10px] font-black text-emerald-400 tabular-nums">{lineWidth}px</span>
                                </div>
                                <input
                                    type="range" min="1" max="16" step="0.5"
                                    value={lineWidth}
                                    onChange={e => setLineWidth(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-white/10"
                                />
                            </div>

                            {/* Confirm */}
                            <button
                                onClick={handleSave}
                                disabled={isEmpty}
                                className="
                                    flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shrink-0
                                    bg-emerald-500 hover:bg-emerald-400 active:scale-95
                                    text-black text-xs sm:text-sm font-extrabold uppercase tracking-widest
                                    shadow-[0_8px_24px_rgba(16,185,129,0.35)]
                                    transition-all duration-200
                                    disabled:opacity-40 disabled:pointer-events-none
                                "
                            >
                                <Check size={18} strokeWidth={3} />
                                <span>Confirm</span>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
