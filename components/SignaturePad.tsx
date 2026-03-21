"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Eraser, RotateCcw, Check, PenTool, Palette, PenLine, Droplets, Minus } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

const PRESET_COLORS = [
    { name: "Ink Black",     value: "#0a0a0a" },
    { name: "Royal Blue",    value: "#1a3fbf" },
    { name: "Crimson",       value: "#c0172b" },
    { name: "Forest Green",  value: "#047857" },
    { name: "Deep Violet",   value: "#5b21b6" },
];

type PenStyle = "ballpoint" | "fountain" | "marker";

const PEN_STYLES: { id: PenStyle; label: string; desc: string }[] = [
    { id: "ballpoint", label: "Ballpoint", desc: "Sharp & precise" },
    { id: "fountain",  label: "Fountain",  desc: "Flowing elegance" },
    { id: "marker",    label: "Marker",    desc: "Bold & visible"  },
];

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const wrapperRef     = useRef<HTMLDivElement>(null);
    const colorInputRef  = useRef<HTMLInputElement>(null);
    const ctxRef         = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef   = useRef(false);
    const lastPos        = useRef({ x: 0, y: 0 });

    const [color,     setColor]     = useState("#0a0a0a");
    const [penStyle,  setPenStyle]  = useState<PenStyle>("ballpoint");
    const [lineWidth, setLineWidth] = useState(3);
    const [mode,      setMode]      = useState<"pen" | "eraser">("pen");
    const [isEmpty,   setIsEmpty]   = useState(true);

    /* ── Canvas bootstrap ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w   = wrapper.clientWidth;
            const h   = wrapper.clientHeight;
            // Save current drawing
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width  = canvas.width;
            tempCanvas.height = canvas.height;
            tempCanvas.getContext("2d")?.drawImage(canvas, 0, 0);

            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width  = `${w}px`;
            canvas.style.height = `${h}px`;

            const ctx = canvas.getContext("2d")!;
            ctx.scale(dpr, dpr);
            ctx.lineCap  = "round";
            ctx.lineJoin = "round";
            ctx.drawImage(tempCanvas, 0, 0, w, h);
            ctxRef.current = ctx;
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    /* ── Coordinate helper ── */
    const getXY = (e: React.PointerEvent): { x: number; y: number } => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    /* ── Apply pen style to context ── */
    const setupCtx = (ctx: CanvasRenderingContext2D) => {
        if (mode === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = lineWidth * 8;
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
                default: // ballpoint
                    ctx.lineWidth   = lineWidth;
                    ctx.shadowBlur  = 0;
                    ctx.globalAlpha = 1;
            }
        }
    };

    /* ── Drawing handlers ── */
    const onPointerDown = (e: React.PointerEvent) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        isDrawingRef.current = true;
        const pos = getXY(e);
        lastPos.current = pos;
        setupCtx(ctx);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsEmpty(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawingRef.current || !ctxRef.current) return;
        const ctx = ctxRef.current;
        const pos = getXY(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const onPointerUp = () => {
        if (!ctxRef.current) return;
        isDrawingRef.current = false;
        ctxRef.current.closePath();
        ctxRef.current.shadowBlur = 0;
        ctxRef.current.globalAlpha = 1;
    };

    /* ── Clear ── */
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

    /* ── Save ── */
    const handleSave = () => {
        if (!canvasRef.current) return;
        onSave(canvasRef.current.toDataURL("image/png"));
    };

    const isCustomColor = !PRESET_COLORS.find(c => c.value === color);

    return (
        <div className="fixed inset-0 z-[200] flex items-stretch justify-stretch animate-in fade-in duration-300">
            {/* ── Backdrop ── */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
                onClick={onCancel}
            />

            {/* ── Studio Shell ── */}
            <div className="relative m-auto w-full max-w-[1100px] h-[90vh] max-h-[780px] bg-[#0d0d0f] rounded-[3rem] border border-white/[0.06] shadow-[0_60px_120px_rgba(0,0,0,0.9)] flex overflow-hidden">

                {/* ════════════════════════
                    LEFT DOCK — Tool Switcher
                ════════════════════════ */}
                <aside className="w-28 bg-black/50 border-r border-white/[0.05] flex flex-col items-center py-8 gap-3 shrink-0">
                    {/* Brand icon */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                        <PenLine size={20} className="text-black" strokeWidth={2.5} />
                    </div>

                    {/* Pen styles */}
                    {PEN_STYLES.map(s => {
                        const active = mode === "pen" && penStyle === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => { setPenStyle(s.id); setMode("pen"); }}
                                title={s.desc}
                                className={`
                                    relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5
                                    transition-all duration-300 group overflow-hidden
                                    ${active
                                        ? "bg-emerald-500 text-black scale-105 shadow-xl shadow-emerald-500/40"
                                        : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white"
                                    }
                                `}
                            >
                                {active && <div className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent pointer-events-none" />}
                                <PenTool size={18} strokeWidth={active ? 2.5 : 1.8} />
                                <span className="text-[9px] font-extrabold uppercase tracking-tight leading-none z-10">
                                    {s.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div className="w-8 h-px bg-white/10 my-2" />

                    {/* Eraser */}
                    <button
                        onClick={() => setMode("eraser")}
                        title="Eraser"
                        className={`
                            w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5
                            transition-all duration-300
                            ${mode === "eraser"
                                ? "bg-white text-black scale-105 shadow-xl"
                                : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white"
                            }
                        `}
                    >
                        <Eraser size={18} strokeWidth={1.8} />
                        <span className="text-[9px] font-extrabold uppercase tracking-tight leading-none">Erase</span>
                    </button>
                </aside>

                {/* ════════════════════════
                    MAIN — Canvas + Controls
                ════════════════════════ */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Top bar */}
                    <header className="flex items-center justify-between px-10 py-6 border-b border-white/[0.05] shrink-0">
                        <div>
                            <h2 className="text-[1.65rem] font-black text-white tracking-tighter leading-none">
                                Signature Studio
                            </h2>
                            <p className="mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {PEN_STYLES.find(s => s.id === penStyle)?.desc ?? "Drawing"} · {mode === "eraser" ? "Eraser active" : `${lineWidth}px stroke`}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={clear}
                                disabled={isEmpty}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-white/[0.06] hover:border-red-500/20 transition-all text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none group"
                            >
                                <RotateCcw size={13} className="group-hover:rotate-180 transition-transform duration-700" />
                                Clear
                            </button>

                            <button
                                onClick={onCancel}
                                className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </header>

                    {/* ── Canvas Area ── */}
                    <div className="flex-1 p-6 min-h-0">
                        <div
                            ref={wrapperRef}
                            className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] cursor-crosshair"
                            style={{ touchAction: "none" }}
                        >
                            {/* Subtle paper grid */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-[0.035]"
                                style={{
                                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                                    backgroundSize: "40px 40px"
                                }}
                            />

                            {/* Signature baseline */}
                            <div className="absolute bottom-[28%] left-10 right-10 h-px border-b border-dashed border-zinc-300 pointer-events-none" />
                            <span className="absolute bottom-[22%] left-10 text-[10px] text-zinc-300 font-semibold tracking-widest uppercase pointer-events-none select-none">Sign here</span>

                            {/* Canvas */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0"
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerLeave={onPointerUp}
                            />

                            {/* Empty-state hint */}
                            {isEmpty && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                                    <p className="text-zinc-300 text-base font-semibold tracking-wide">Draw your signature above</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Control Hub ── */}
                    <footer className="px-6 pb-6 shrink-0">
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-[2rem] px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-6">

                            {/* Left: Colors + Thickness */}
                            <div className="flex flex-wrap items-center gap-6">

                                {/* Color palette */}
                                <div className="flex items-center gap-2 bg-black/40 px-3 py-2.5 rounded-2xl border border-white/[0.06]">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            title={c.name}
                                            onClick={() => { setColor(c.value); setMode("pen"); }}
                                            className="relative transition-all duration-300 group"
                                        >
                                            <span
                                                className={`block w-8 h-8 rounded-full transition-all duration-300
                                                    ${color === c.value && mode === "pen"
                                                        ? "scale-125 ring-2 ring-white/80 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                                                        : "opacity-50 hover:opacity-90 hover:scale-110"
                                                    }`}
                                                style={{ background: c.value }}
                                            />
                                        </button>
                                    ))}

                                    {/* Custom picker */}
                                    <button
                                        title="Custom Color"
                                        onClick={() => colorInputRef.current?.click()}
                                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                            bg-gradient-to-tr from-violet-500 via-pink-500 to-orange-400
                                            ${isCustomColor && mode === "pen"
                                                ? "scale-125 ring-2 ring-white/80 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                                                : "opacity-50 hover:opacity-90 hover:scale-110"
                                            }`}
                                    >
                                        <Palette size={14} className="text-white drop-shadow" />
                                    </button>
                                    <input
                                        ref={colorInputRef}
                                        type="color"
                                        className="hidden"
                                        value={color}
                                        onChange={e => { setColor(e.target.value); setMode("pen"); }}
                                    />

                                    {/* Current color swatch */}
                                    {isCustomColor && mode === "pen" && (
                                        <span
                                            className="w-3 h-3 rounded-full border-2 border-white/50 shadow ml-1"
                                            style={{ background: color }}
                                        />
                                    )}
                                </div>

                                {/* Thickness */}
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em]">Thickness</span>
                                        <span className="text-[11px] font-black text-emerald-400 tabular-nums">{lineWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="16" step="0.5"
                                        value={lineWidth}
                                        onChange={e => setLineWidth(parseFloat(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-white/10"
                                    />
                                    <div className="flex justify-between text-[8px] text-zinc-600 font-bold">
                                        <span>Fine</span><span>Bold</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Confirm */}
                            <button
                                onClick={handleSave}
                                disabled={isEmpty}
                                className="
                                    flex items-center gap-3 px-10 py-4 rounded-2xl
                                    bg-emerald-500 hover:bg-emerald-400
                                    text-black text-sm font-extrabold uppercase tracking-widest
                                    shadow-[0_16px_40px_rgba(16,185,129,0.35)]
                                    hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)]
                                    active:scale-95 transition-all duration-200
                                    disabled:opacity-40 disabled:pointer-events-none
                                "
                            >
                                <Check size={20} strokeWidth={3} />
                                Confirm Signature
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
