"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Container from "@/components/Container";
import { Copy, Download, QrCode, Sparkles, Wand2, Upload, Trash2, Image as ImageIcon, Smile, Star, ChevronDown, Maximize, ImagePlus, Square } from "lucide-react";

const FG_PRESETS = ['#000000', '#27272a', '#1e3a8a', '#4c1d95', '#be123c', '#047857'];
const BG_PRESETS = ['#ffffff', '#f4f4f5', '#fffbeb', '#f0fdf4', '#eff6ff', '#faf5ff'];

type PatternType = 'square' | 'dots' | 'rounded' | 'star' | 'emoji' | 'logo';
type CornerType = 'square' | 'dots' | 'rounded' | 'heart';

export default function QRGeneratorPage() {
    const [url, setUrl] = useState("");
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");

    const [patternType, setPatternType] = useState<PatternType>("square");
    const [cornerType, setCornerType] = useState<CornerType>("square");
    const [openSection, setOpenSection] = useState<string>("pattern");

    const [emojiChar, setEmojiChar] = useState("🔥");
    const [patternLogo, setPatternLogo] = useState<string | null>(null);

    const [cornerEmojiChar, setCornerEmojiChar] = useState("💎");
    const [cornerLogo, setCornerLogo] = useState<string | null>(null);

    const [centerLogo, setCenterLogo] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const patternInputRef = useRef<HTMLInputElement>(null);
    const cornerInputRef = useRef<HTMLInputElement>(null);
    const centerInputRef = useRef<HTMLInputElement>(null);

    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        const d = Math.min(w, h);
        const k = x + w / 2;
        ctx.beginPath();
        ctx.moveTo(k, y + d / 4);
        ctx.quadraticCurveTo(k, y, x + w / 4, y);
        ctx.quadraticCurveTo(x, y, x, y + d / 2.25);
        ctx.quadraticCurveTo(x, y + d * 0.65, k, y + d);
        ctx.quadraticCurveTo(x + w, y + d * 0.65, x + w, y + d / 2.25);
        ctx.quadraticCurveTo(x + w, y, x + w * 0.75, y);
        ctx.quadraticCurveTo(k, y, k, y + d / 4);
        ctx.fill();
    };

    const renderQR = useCallback(async (isDownload = false) => {
        const canvas = isDownload ? document.createElement('canvas') : canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Force native high-res render; 2048 for download, 1024 for on-screen (CSS handles scale-down)
        const size = isDownload ? 2048 : 1024;
        canvas.width = size;
        canvas.height = size;

        let matrix;
        try {
            const qr = QRCode.create(url || "https://assetnest.design", { errorCorrectionLevel: 'H' });
            matrix = qr.modules;
        } catch (e) {
            return; // invalid URL data
        }

        const margin = size * 0.05; // 5% Quiet Zone minimum
        const innerSize = size - margin * 2;
        const moduleCount = matrix.size;
        const cellSize = innerSize / moduleCount;

        // Preload images if needed
        let pImg: HTMLImageElement | null = null;
        if (patternType === 'logo' && patternLogo) {
            try { pImg = await loadImage(patternLogo); } catch (e) { console.error(e); }
        }

        let cImg: HTMLImageElement | null = null;
        if (centerLogo) {
            try { cImg = await loadImage(centerLogo); } catch (e) { console.error(e); }
        }

        // Fill Base Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        // Prepare colors and fonts
        ctx.fillStyle = fgColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const drawFinder = (startX: number, startY: number) => {
            const x = margin + startX * cellSize;
            const y = margin + startY * cellSize;
            const s7 = 7 * cellSize;
            const s5 = 5 * cellSize;
            const s3 = 3 * cellSize;

            ctx.fillStyle = fgColor;
            // STEP 1: Always draw a strictly scannable Outer Ring (7x7 Dark, 5x5 Light)
            // This prevents custom shapes like hearts from breaking scanner bounds
            ctx.fillStyle = fgColor;
            if (cornerType === 'rounded') {
                const r = cellSize * 2;
                ctx.beginPath();
                ctx.roundRect(x, y, s7, s7, r);
                ctx.fill();
                ctx.fillStyle = bgColor;
                ctx.beginPath();
                ctx.roundRect(x + cellSize, y + cellSize, s5, s5, r - cellSize);
                ctx.fill();
            } else if (cornerType === 'dots') {
                const cx = x + s7 / 2;
                const cy = y + s7 / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, s7 / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = bgColor;
                ctx.beginPath();
                ctx.arc(cx, cy, s5 / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // For square, heart, emoji, and logo -> Fallback to a safe standard frame
                // We add a subtle rounding to custom shapes for aesthetics, but keep it sharp enough to scan reliably
                const isCustom = cornerType === 'heart';
                const r = isCustom ? cellSize * 0.5 : 0;
                ctx.beginPath();
                ctx.roundRect(x, y, s7, s7, r);
                ctx.fill();
                ctx.fillStyle = bgColor;
                ctx.beginPath();
                ctx.roundRect(x + cellSize, y + cellSize, s5, s5, Math.max(0, r - cellSize));
                ctx.fill();
            }

            // STEP 2: Draw the Inner Core (3x3 area) with the custom styling
            if (cornerType === 'rounded') {
                ctx.fillStyle = fgColor;
                ctx.beginPath();
                ctx.roundRect(x + cellSize * 2, y + cellSize * 2, s3, s3, cellSize);
                ctx.fill();
            } else if (cornerType === 'dots') {
                ctx.fillStyle = fgColor;
                const cx = x + s7 / 2;
                const cy = y + s7 / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, s3 / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (cornerType === 'heart') {
                ctx.fillStyle = fgColor;
                // Expanded shape to act as a solid 3x3 dark-mass block for the scanner
                drawHeart(ctx, x + s7 / 2 - (s3 * 1.15) / 2, y + s7 / 2 - (s3 * 1.15) / 2, s3 * 1.15, s3 * 1.15);
            } else {
                ctx.fillStyle = fgColor;
                ctx.fillRect(x + cellSize * 2, y + cellSize * 2, s3, s3);
            }
        };

        // Calculate center logo bounds to avoid drawing modules underneath it
        let logoBounds: { xMin: number, xMax: number, yMin: number, yMax: number, cWidth: number, cHeight: number, isCircle: boolean, cx: number, cy: number, radius: number } | null = null;
        if (cImg) {
            const maxLogoSize = innerSize * 0.22;

            // Preserve Center Logo Aspect Ratio
            const cRatio = cImg.width / cImg.height;
            let cWidth = maxLogoSize;
            let cHeight = maxLogoSize;
            if (cRatio > 1) {
                cHeight = maxLogoSize / cRatio;
            } else {
                cWidth = maxLogoSize * cRatio;
            }

            const padding = margin * 0.6;
            const lx = (size - cWidth) / 2;
            const ly = (size - cHeight) / 2;

            logoBounds = {
                xMin: lx - padding,
                xMax: lx + cWidth + padding,
                yMin: ly - padding,
                yMax: ly + cHeight + padding,
                cWidth,
                cHeight,
                isCircle: true,
                cx: size / 2,
                cy: size / 2,
                radius: Math.max(cWidth, cHeight) / 2 + padding
            };
        }

        // Iterating over QR matrix
        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                const isDark = matrix.data[r * moduleCount + c];
                if (!isDark) continue;

                const cx = margin + c * cellSize + cellSize / 2;
                const cy = margin + r * cellSize + cellSize / 2;
                const x = margin + c * cellSize;
                const y = margin + r * cellSize;

                // Skip rendering individual finder modules, we draw them cleanly later
                const inFinder = (r <= 6 && c <= 6) || (r <= 6 && c >= moduleCount - 7) || (r >= moduleCount - 7 && c <= 6);
                if (inFinder) continue;

                // Skip rendering modules that fall inside the center logo box
                if (logoBounds) {
                    if (logoBounds.isCircle) {
                        // Calculate distance from center of QR to center of this module
                        const dist = Math.sqrt(Math.pow(cx - logoBounds.cx, 2) + Math.pow(cy - logoBounds.cy, 2));
                        // Give it a tiny bit of buffer based on cellSize so squares don't clip the pure circle
                        if (dist < logoBounds.radius + cellSize * 0.4) {
                            continue;
                        }
                    } else {
                        if (
                            x + cellSize > logoBounds.xMin &&
                            x < logoBounds.xMax &&
                            y + cellSize > logoBounds.yMin &&
                            y < logoBounds.yMax
                        ) {
                            continue;
                        }
                    }
                }

                ctx.fillStyle = fgColor;
                if (patternType === 'square') {
                    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
                } else if (patternType === 'rounded') {
                    ctx.beginPath();
                    ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.4);
                    ctx.fill();
                } else if (patternType === 'dots') {
                    ctx.beginPath();
                    ctx.arc(cx, cy, (cellSize / 2) * 0.9, 0, Math.PI * 2);
                    ctx.fill();
                } else if (patternType === 'star') {
                    drawStar(ctx, cx, cy, 5, cellSize / 1.8, cellSize / 3.8);
                } else if (patternType === 'emoji') {
                    ctx.font = `${cellSize * 1.0}px Arial`;
                    ctx.fillText(emojiChar || "🔥", cx, cy + cellSize * 0.1);
                } else if (patternType === 'logo' && pImg) {
                    // Preserve Pattern Logo Aspect Ratio
                    const pRatio = pImg.width / pImg.height;
                    let pWidth = cellSize;
                    let pHeight = cellSize;
                    if (pRatio > 1) {
                        pHeight = cellSize / pRatio;
                    } else {
                        pWidth = cellSize * pRatio;
                    }
                    const px = x + (cellSize - pWidth) / 2;
                    const py = y + (cellSize - pHeight) / 2;
                    ctx.drawImage(pImg, px, py, pWidth, pHeight);
                } else {
                    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
                }
            }
        }

        // Draw the 3 Finders High-Res
        drawFinder(0, 0);
        drawFinder(moduleCount - 7, 0);
        drawFinder(0, moduleCount - 7);

        // Draw Center Logo over the QR Code
        if (cImg && logoBounds) {
            // Thick protective border around logo for clean scanning
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            if (logoBounds.isCircle) {
                ctx.arc(logoBounds.cx, logoBounds.cy, logoBounds.radius, 0, Math.PI * 2);
            } else {
                ctx.roundRect(logoBounds.xMin, logoBounds.yMin, logoBounds.xMax - logoBounds.xMin, logoBounds.yMax - logoBounds.yMin, size * 0.02);
            }
            ctx.fill();

            const lx = logoBounds.xMin + margin * 0.6;
            const ly = logoBounds.yMin + margin * 0.6;
            ctx.drawImage(cImg, lx, ly, logoBounds.cWidth, logoBounds.cHeight);
        }

        if (isDownload) {
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = "assetnest-custom-qr.png";
            a.click();
        }
    }, [url, fgColor, bgColor, patternType, emojiChar, patternLogo, centerLogo, cornerType, cornerEmojiChar, cornerLogo]);

    // Re-render when dependencies change
    useEffect(() => {
        renderQR(false);
    }, [renderQR]);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(url);
    };

    const handlePatternLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setPatternLogo(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCornerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setCornerLogo(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCenterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setCenterLogo(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="py-8 lg:py-24 min-h-screen bg-black">
            <Container>
                <header className="mb-8 lg:mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                        <QrCode size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Pro Utilities</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 text-white leading-none">
                        Custom <span className="italic text-zinc-700">QR Engine</span>
                    </h1>
                    <p className="text-sm text-zinc-500 max-w-xl mx-auto font-medium leading-relaxed">
                        The fully unrestricted QR generator. Build QRs out of stars, emojis, embedded brand patterns, and custom overlays.
                    </p>
                </header>

                <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 relative">
                    {/* Controls (Spans 7 cols) */}
                    <div className="lg:col-span-7 space-y-4 lg:space-y-6 order-2 lg:order-1 flex-1">
                        <div className="p-5 lg:p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 lg:mb-6 flex items-center gap-2">
                                <Wand2 size={12} /> Configuration Options
                            </h3>

                            <div className="space-y-5 lg:space-y-8">
                                {/* Destination URL */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Destination URL</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 focus:border-white transition-all px-5 py-3 lg:py-4 rounded-2xl text-sm font-medium outline-none text-zinc-200"
                                            placeholder="Enter your link here..."
                                        />
                                        <button
                                            onClick={handleCopyUrl}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-white transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* ACCORDIONS */}
                                <div className="space-y-4 pt-3 lg:pt-4 border-t border-zinc-800">

                                    {/* SECTION 1: Master Pattern Style */}
                                    <div className={`bg-zinc-900 border ${openSection === 'pattern' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`}>
                                        <button
                                            onClick={() => setOpenSection(openSection === 'pattern' ? '' : 'pattern')}
                                            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl border ${openSection === 'pattern' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`}>
                                                    <QrCode size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-0.5">QR Code Pattern & Colors</h4>
                                                    <p className="text-[11px] font-medium text-zinc-500 hidden sm:block">Choose a pattern for your QR code and select colors.</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${openSection === 'pattern' ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'pattern' ? 'max-h-[2000px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                            <div className="space-y-6 pt-4 border-t border-zinc-800/50">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Pattern Style</label>
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                        {[
                                                            { id: 'square', label: 'Classic', icon: <div className="w-4 h-4 bg-current" /> },
                                                            { id: 'rounded', label: 'Rounded', icon: <div className="w-4 h-4 bg-current rounded-[4px]" /> },
                                                            { id: 'dots', label: 'Dots', icon: <div className="w-4 h-4 bg-current rounded-full" /> },
                                                            { id: 'star', label: 'Stars', icon: <Star size={16} fill="currentColor" /> },
                                                            { id: 'emoji', label: 'Emoji', icon: <Smile size={16} /> },
                                                            { id: 'logo', label: 'Logo', icon: <ImageIcon size={16} /> }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setPatternType(opt.id as PatternType)}
                                                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-[10px] font-bold ${patternType === opt.id ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white bg-black'}`}
                                                            >
                                                                {opt.icon} <span className={patternType === opt.id ? 'text-black' : 'text-zinc-400'}>{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Conditional Inputs */}
                                                    {patternType === 'emoji' && (
                                                        <div className="mt-4 p-4 bg-black rounded-xl border border-zinc-800 flex items-center justify-between sm:justify-start gap-4">
                                                            <span className="text-xs font-bold text-zinc-500 uppercase">Input Emoji:</span>
                                                            <input
                                                                type="text"
                                                                value={emojiChar}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const chars = Array.from(val);
                                                                    if (chars.length > 0) {
                                                                        setEmojiChar(chars[chars.length - 1]);
                                                                    } else {
                                                                        setEmojiChar("");
                                                                    }
                                                                }}
                                                                className="bg-zinc-900 border border-zinc-700 w-16 md:w-24 text-center py-2 rounded-lg text-lg focus:border-white transition-all outline-none"
                                                            />
                                                        </div>
                                                    )}

                                                    {patternType === 'logo' && (
                                                        <div className="mt-4 p-4 bg-black rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                            <span className="text-xs font-bold text-zinc-500 uppercase">Upload Dots Logo:</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                ref={patternInputRef}
                                                                onChange={handlePatternLogoUpload}
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => patternInputRef.current?.click()}
                                                                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 px-4 rounded-lg text-xs font-bold transition-all border border-zinc-700"
                                                                >
                                                                    <Upload size={14} /> Choose Image
                                                                </button>
                                                                {patternLogo && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setPatternLogo(null);
                                                                            if (patternInputRef.current) patternInputRef.current.value = '';
                                                                        }}
                                                                        className="flex items-center justify-center w-8 h-8 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                                                                        title="Remove Logo"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-4 pt-3 lg:pt-4 border-t border-zinc-800/50">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Color Palette</label>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 bg-black border border-zinc-800 p-4 lg:p-5 rounded-[1.5rem]">
                                                        {/* Foreground */}
                                                        <div className="space-y-3 lg:space-y-4">
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Foreground Filter</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {FG_PRESETS.map(color => (
                                                                    <button
                                                                        key={color}
                                                                        onClick={() => setFgColor(color)}
                                                                        className={`w-6 h-6 rounded-full border-2 transition-all ${fgColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`}
                                                                        style={{ backgroundColor: color }}
                                                                        title={color}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-inner">
                                                                    <input
                                                                        type="color"
                                                                        value={fgColor}
                                                                        onChange={(e) => setFgColor(e.target.value)}
                                                                        className="absolute -inset-4 w-16 h-16 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={fgColor.toUpperCase()}
                                                                    onChange={(e) => setFgColor(e.target.value)}
                                                                    className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono text-zinc-300 w-24 focus:border-white transition-all outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Background */}
                                                        <div className="space-y-3 lg:space-y-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Background</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {BG_PRESETS.map(color => (
                                                                    <button
                                                                        key={color}
                                                                        onClick={() => setBgColor(color)}
                                                                        className={`w-6 h-6 rounded-full border-2 transition-all ${bgColor === color ? 'border-zinc-400 scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-zinc-200 hover:scale-105 shadow-sm'}`}
                                                                        style={{ backgroundColor: color }}
                                                                        title={color}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-inner">
                                                                    <input
                                                                        type="color"
                                                                        value={bgColor}
                                                                        onChange={(e) => setBgColor(e.target.value)}
                                                                        className="absolute -inset-4 w-16 h-16 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={bgColor.toUpperCase()}
                                                                    onChange={(e) => setBgColor(e.target.value)}
                                                                    className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono text-zinc-300 w-24 focus:border-white transition-all outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: QR Code Corners */}
                                    <div className={`bg-zinc-900 border ${openSection === 'corners' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`}>
                                        <button
                                            onClick={() => setOpenSection(openSection === 'corners' ? '' : 'corners')}
                                            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl border ${openSection === 'corners' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`}>
                                                    <Maximize size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-0.5">QR Code Corners</h4>
                                                    <p className="text-[11px] font-medium text-zinc-500 hidden sm:block">Select your QR code's corner frame style</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${openSection === 'corners' ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'corners' ? 'max-h-[1000px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                            <div className="space-y-6 pt-4 border-t border-zinc-800/50">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Frame Style</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        {[
                                                            { id: 'square', label: 'Classic', icon: <Square size={16} /> },
                                                            { id: 'rounded', label: 'Rounded', icon: <Square size={16} rx={4} /> },
                                                            { id: 'dots', label: 'Circular', icon: <div className="w-4 h-4 border-2 border-current rounded-full" /> },
                                                            { id: 'heart', label: 'Heart', icon: <div className="text-[14px]">♥</div> }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setCornerType(opt.id as CornerType)}
                                                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-[10px] font-bold ${cornerType === opt.id ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white bg-black'}`}
                                                            >
                                                                {opt.icon} <span className={cornerType === opt.id ? 'text-black' : 'text-zinc-400'}>{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: Add Logo Header */}
                                    <div className={`bg-zinc-900 border ${openSection === 'logo' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`}>
                                        <button
                                            onClick={() => setOpenSection(openSection === 'logo' ? '' : 'logo')}
                                            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl border ${openSection === 'logo' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`}>
                                                    <ImagePlus size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-0.5">Add Logo</h4>
                                                    <p className="text-[11px] font-medium text-zinc-500 hidden sm:block">Make your QR code unique by adding your logo or image</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${openSection === 'logo' ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'logo' ? 'max-h-[500px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                            <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Center Overlay Branding</label>

                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        ref={centerInputRef}
                                                        onChange={handleCenterLogoUpload}
                                                    />
                                                    <button
                                                        onClick={() => centerInputRef.current?.click()}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-300 py-3 lg:py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                                                    >
                                                        <Upload size={16} /> Upload Main Logo
                                                    </button>

                                                    {centerLogo && (
                                                        <button
                                                            onClick={() => {
                                                                setCenterLogo(null);
                                                                if (centerInputRef.current) centerInputRef.current.value = '';
                                                            }}
                                                            className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                                                            title="Remove Main Logo"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="p-6 border border-zinc-900 rounded-3xl bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-zinc-900 rounded-2xl shrink-0">
                                    <Sparkles size={16} className="text-zinc-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Scannability Warning</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                        Using custom emojis, heavy star patterns, or detailed custom logos as the actual QR code dots may trigger scanner failures on older devices. Ensure there is strong contrast. The three corner square Finders are automatically protected for stability.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview (Spans 5 cols) */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-start pointer-events-none lg:pointer-events-auto lg:pt-4 order-1 lg:order-2 sticky top-[80px] lg:top-24 z-40 self-start w-full">
                        <div className="relative group w-full pointer-events-auto">
                            <div className="hidden lg:block absolute inset-0 bg-white/5 blur-[80px] rounded-[3rem] lg:rounded-[4rem] group-hover:bg-white/10 transition-all duration-700" />

                            <div className="relative flex flex-row lg:flex-col items-center gap-4 lg:gap-0 p-3 sm:p-4 lg:p-10 bg-zinc-950/90 lg:bg-zinc-900 border border-zinc-700/50 lg:border-zinc-800 rounded-[1.5rem] lg:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] lg:shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:backdrop-blur-none">

                                <div className="flex items-center justify-center bg-white p-2 lg:p-4 rounded-[1rem] lg:rounded-[1.5rem] overflow-hidden shadow-inner shrink-0 w-[90px] h-[90px] lg:w-full lg:h-auto">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full max-w-full h-auto rounded-md lg:rounded-lg"
                                    />
                                </div>

                                <div className="flex-1 lg:w-full lg:mt-10 flex flex-col justify-center">
                                    <div className="lg:hidden text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Live Preview</div>
                                    <button
                                        onClick={() => renderQR(true)}
                                        className="w-full flex items-center justify-center gap-2 lg:gap-3 bg-white text-black py-2.5 lg:py-4 rounded-lg lg:rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl"
                                    >
                                        <Download size={14} className="shrink-0" /> <span className="hidden sm:inline">Export PNG</span><span className="sm:hidden">Export</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
