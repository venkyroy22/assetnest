"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Eraser, RotateCcw, Check, PenTool, Palette, PenLine, Type, Image as ImageIcon, Upload as UploadIcon, Trash2 } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string, color?: string) => void;
    onCancel: () => void;
}

const SIGNATURE_FONTS = [
    { name: "Brussels",   family: "'Alex Brush', cursive" },
    { name: "Classic",    family: "'Dancing Script', cursive" },
    { name: "Script",     family: "'Pacifico', cursive" },
    { name: "Elegant",    family: "'Great Vibes', cursive" },
    { name: "Modern",     family: "'Satisfy', cursive" },
    { name: "Signature",  family: "'Homemade Apple', cursive" },
];

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
    const lastPosRef    = useRef<{x: number, y: number} | null>(null);

    const [activeTab, setTab] = useState<"type" | "draw" | "upload">("draw");
    const [color,     setColor]     = useState("#0a0a0a");
    const [penStyle,  setPenStyle]  = useState<PenStyle>("ballpoint");
    const [lineWidth, setLineWidth] = useState(3);
    const [mode,      setMode]      = useState<"pen" | "eraser">("pen");
    const [isEmpty,   setIsEmpty]   = useState(true);

    // Type tab state
    const [typedName, setTypedName] = useState("");
    const [fontIdx,   setFontIdx]   = useState(0);

    // Upload tab state
    const [uploadedImg, setUploadedImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Undo/Redo history
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);

    const saveSnapshot = useCallback(() => {
        if (!ctxRef.current || !canvasRef.current) return;
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            const next = prev.slice(0, historyIdx + 1);
            next.push(snapshot);
            if (next.length > 30) next.shift(); // Max 30 undo steps
            return next;
        });
        setHistoryIdx(prev => Math.min(prev + 1, 29));
    }, [historyIdx]);

    const undo = useCallback(() => {
        if (historyIdx < 0 || !ctxRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        
        const nextIdx = historyIdx - 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (nextIdx >= 0) {
            ctx.putImageData(history[nextIdx], 0, 0);
            setIsEmpty(false);
        } else {
            setIsEmpty(true);
        }
        setHistoryIdx(nextIdx);
    }, [history, historyIdx]);

    const redo = useCallback(() => {
        if (historyIdx >= history.length - 1 || !ctxRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        
        const nextIdx = historyIdx + 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(history[nextIdx], 0, 0);
        
        setHistoryIdx(nextIdx);
        setIsEmpty(false);
    }, [history, historyIdx]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (activeTab !== "draw") return;
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, [activeTab, undo, redo]);

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
        
        // Draw a tiny dot instantly
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y + 0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        lastPosRef.current = pos;
        setIsEmpty(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawingRef.current || !ctxRef.current || !lastPosRef.current) return;
        const pos = getXY(e);
        const last = lastPosRef.current;
        
        const midX = (last.x + pos.x) / 2;
        const midY = (last.y + pos.y) / 2;
        
        ctxRef.current.quadraticCurveTo(last.x, last.y, midX, midY);
        ctxRef.current.stroke();
        
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(midX, midY);
        
        lastPosRef.current = pos;
    };

    const onPointerUp = () => {
        if (!ctxRef.current || !lastPosRef.current) return;
        isDrawingRef.current = false;
        
        ctxRef.current.lineTo(lastPosRef.current.x, lastPosRef.current.y);
        ctxRef.current.stroke();
        ctxRef.current.closePath();
        
        ctxRef.current.shadowBlur  = 0;
        ctxRef.current.globalAlpha = 1;
        lastPosRef.current = null;
        saveSnapshot();
    };

    const clear = () => {
        if (activeTab === "draw") {
            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            setIsEmpty(true);
            setHistory([]);
            setHistoryIdx(-1);
        } else if (activeTab === "type") {
            setTypedName("");
        } else {
            setUploadedImg(null);
        }
    };

    const handleSave = async () => {
        if (activeTab === "type" && typedName) {
            // Render text to a temporary canvas for cropping
            const canvas = document.createElement("canvas");
            canvas.width = 1200; canvas.height = 400;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = color;
            ctx.font = `120px ${SIGNATURE_FONTS[fontIdx].family}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(typedName, 600, 200);
            cropAndSave(canvas);
        } else if (activeTab === "upload" && uploadedImg) {
            // Load image and crop it
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width; canvas.height = img.height;
                canvas.getContext("2d")?.drawImage(img, 0, 0);
                cropAndSave(canvas);
            };
            img.src = uploadedImg;
        } else if (activeTab === "draw") {
            const canvas = canvasRef.current;
            if (!canvas || isEmpty) return;
            cropAndSave(canvas);
        }
    };

    const cropAndSave = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const w = canvas.width;
        const h = canvas.height;
        const data = ctx.getImageData(0, 0, w, h).data;
        
        let minX = w, minY = h, maxX = 0, maxY = 0;
        let p = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[p + 3] > 10) { // Slight alpha threshold for fonts/anti-aliasing
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
                p += 4;
            }
        }
        
        if (maxX < minX || maxY < minY) {
            onSave(canvas.toDataURL("image/png"), color); return;
        }
        
        const pad = 20;
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
        const cropW = maxX - minX; const cropH = maxY - minY;
        
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW; cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
        onSave(cropCanvas.toDataURL("image/png"), color);
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
                <header className="px-5 sm:px-8 pt-4 sm:pt-6 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                                <PenLine size={17} className="text-black" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-xl font-black text-white tracking-tighter leading-none">Signature Studio</h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={onCancel}
                                className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-inner"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1">
                        {[
                            { id: "type",  icon: Type,       label: "Type"   },
                            { id: "draw",  icon: PenTool,    label: "Draw"   },
                            { id: "upload", icon: UploadIcon, label: "Upload" }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id as any)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
                                    ${activeTab === t.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
                                `}
                            >
                                <t.icon size={13} />
                                {t.label}
                                {activeTab === t.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                    {/* TYPE TAB */}
                    {activeTab === "type" && (
                        <div className="p-6 sm:p-10 flex flex-col gap-8 max-w-4xl mx-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={typedName}
                                    onChange={e => setTypedName(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="w-full bg-transparent border-b-2 border-white/10 focus:border-white text-3xl sm:text-5xl py-6 px-1 text-center outline-none transition-all placeholder:text-zinc-800"
                                    style={{ fontFamily: SIGNATURE_FONTS[fontIdx].family, color }}
                                />
                                <div className="absolute top-1 right-0 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                    Full Name
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {SIGNATURE_FONTS.map((font, idx) => (
                                    <button
                                        key={font.name}
                                        onClick={() => setFontIdx(idx)}
                                        className={`
                                            p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden group
                                            ${fontIdx === idx ? "border-white bg-white/5" : "border-white/5 bg-white/[0.02] hover:border-white/20"}
                                        `}
                                    >
                                        <span className="text-3xl text-center truncate w-full" style={{ fontFamily: font.family, color }}>
                                            {typedName || "Name"}
                                        </span>
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{font.name}</span>
                                        {fontIdx === idx && (
                                            <div className="absolute top-2 right-2">
                                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                                    <Check size={10} className="text-black" strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DRAW TAB */}
                    {activeTab === "draw" && (
                        <div className="flex h-full min-h-[400px]">
                            {/* Left tool dock */}
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
                                                    ? "bg-white text-black scale-105"
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
                                            ? "bg-white text-black scale-105"
                                            : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white"
                                        }
                                    `}
                                >
                                    <Eraser size={16} strokeWidth={1.8} />
                                    <span className="text-[8px] font-extrabold uppercase tracking-tight">Erase</span>
                                </button>
                                <div className="mt-auto flex flex-col items-center gap-1">
                                    <div className="flex flex-col items-center border border-white/5 bg-white/[0.02] rounded-xl p-1 mb-2">
                                        <button
                                            onClick={undo}
                                            disabled={historyIdx < 0}
                                            title="Undo (Ctrl+Z)"
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-10 transition-all active:scale-90"
                                        >
                                            <RotateCcw size={16} className="scale-x-[-1]" />
                                        </button>
                                        <button
                                            onClick={redo}
                                            disabled={historyIdx >= history.length - 1}
                                            title="Redo (Ctrl+Shift+Z)"
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-10 transition-all active:scale-90"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={clear}
                                        disabled={isEmpty}
                                        title="Clear All"
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </aside>

                            {/* Canvas area */}
                            <div className="flex-1 p-3 sm:p-5 min-h-0 flex flex-col min-w-0">
                                <div
                                    ref={wrapperRef}
                                    className="relative flex-1 bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] cursor-crosshair"
                                    style={{ touchAction: "none" }}
                                >
                                    {/* Paper grid */}
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                        style={{
                                            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                                            backgroundSize: "36px 36px"
                                        }}
                                    />
                                    <div className="absolute bottom-[28%] left-6 right-6 border-b border-dashed border-zinc-300 pointer-events-none" />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0"
                                        onPointerDown={onPointerDown}
                                        onPointerMove={onPointerMove}
                                        onPointerUp={onPointerUp}
                                        onPointerLeave={onPointerUp}
                                    />
                                    {isEmpty && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none pb-16">
                                            <p className="text-zinc-300 text-sm font-semibold tracking-wide">Draw your signature</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UPLOAD TAB */}
                    {activeTab === "upload" && (
                        <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[400px] gap-6">
                            {!uploadedImg ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full max-w-lg aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (re) => setUploadedImg(re.target?.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <UploadIcon size={28} className="text-zinc-500 group-hover:text-white" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black text-sm uppercase tracking-widest">Select Image</p>
                                        <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1">PNG or JPG work best</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 w-full max-w-lg">
                                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-8">
                                        <img src={uploadedImg} alt="uploaded" className="max-h-full max-w-full object-contain filter grayscale contrast-125" />
                                        <button
                                            onClick={() => setUploadedImg(null)}
                                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-red-500/80 text-white transition-all flex items-center justify-center backdrop-blur-md"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                            Tip: Dark ink on a white background yields the best results
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <footer className="px-4 sm:px-6 pb-5 sm:pb-8 pt-3 sm:pt-6 border-t border-white/[0.05] shrink-0">
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between gap-6 flex-wrap">
                            {/* Color palette */}
                            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-2.5 rounded-2xl border border-white/[0.06]">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        title={c.name}
                                        onClick={() => { setColor(c.value); setMode("pen"); }}
                                        className="shrink-0"
                                    >
                                        <span
                                            className={`block w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-200
                                                ${color === c.value && mode === "pen"
                                                    ? "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-black"
                                                    : "opacity-40 hover:opacity-100 hover:scale-110"
                                                }`}
                                            style={{ background: c.value }}
                                        />
                                    </button>
                                ))}
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button
                                    title="Custom color"
                                    onClick={() => colorInputRef.current?.click()}
                                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-white via-zinc-400 to-zinc-800 transition-all shrink-0
                                        ${isCustomColor && mode === "pen" ? "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-black" : "opacity-40 hover:opacity-100"}`}
                                >
                                    <Palette size={13} className="text-white" />
                                </button>
                                <input ref={colorInputRef} type="color" className="hidden" value={color}
                                    onChange={e => { setColor(e.target.value); setMode("pen"); }} />
                            </div>

                            {/* Thickness (only for DRAW) */}
                            {activeTab === "draw" && (
                                <div className="hidden sm:flex flex-1 max-w-xs flex-col gap-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ink Flow</span>
                                        <span className="text-[10px] font-black text-white tabular-nums">{lineWidth}px</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="16" step="0.5"
                                        value={lineWidth}
                                        onChange={e => setLineWidth(parseFloat(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-white"
                                    />
                                </div>
                            )}


                            {/* Confirm */}
                            <button
                                onClick={handleSave}
                                disabled={
                                    (activeTab === "draw" && isEmpty) ||
                                    (activeTab === "type" && !typedName) ||
                                    (activeTab === "upload" && !uploadedImg)
                                }
                                className="
                                    flex items-center gap-3 px-10 py-4 rounded-full
                                    bg-white hover:bg-zinc-200 active:scale-95
                                    text-black text-[11px] font-black uppercase tracking-[0.2em]
                                    transition-all duration-300
                                    disabled:opacity-20 disabled:pointer-events-none disabled:grayscale
                                "
                            >
                                <Check size={16} strokeWidth={3} />
                                <span>Sign Document</span>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
