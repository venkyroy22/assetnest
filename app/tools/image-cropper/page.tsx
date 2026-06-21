"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
    convertToPixelCrop
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    UploadCloud,
    Crop as CropIcon,
    Download,
    RotateCw,
    Image as ImageIcon,
    Settings2,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    RefreshCw,
    Sparkles,
    ArrowLeft,
    Info,
    Package,
    Globe,
    Layers,
    Eye,
    Zap,
    Eraser,
    Lock as LockIcon
} from "lucide-react";
import Link from "next/link";
import HelpModal from "@/components/HelpModal";

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

const ASPECT_RATIOS = [
    { label: "Free", value: undefined },
    { label: "1:1 Square", value: 1 },
    { label: "16:9 Landscape", value: 16 / 9 },
    { label: "9:16 Portrait", value: 9 / 16 },
    { label: "4:3 Classic", value: 4 / 3 },
    { label: "3:2 Standard", value: 3 / 2 },
];

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

export default function ImageCropperPage() {
    const [imgSrc, setImgSrc] = useState("");
    const imgRef = useRef<HTMLImageElement>(null);
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    // Transforms
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);

    // Settings
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    // Manual inputs
    const [customWidth, setCustomWidth] = useState<string>("");
    const [customHeight, setCustomHeight] = useState<string>("");

    // Custom Aspect
    const [customAspectX, setCustomAspectX] = useState<string>("");
    const [customAspectY, setCustomAspectY] = useState<string>("");

    // Preview Modal
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    // Accordions
    const [dimensionsOpen, setDimensionsOpen] = useState(true);
    const [tweaksOpen, setTweaksOpen] = useState(false);
    const [exactSizeOpen, setExactSizeOpen] = useState(false);
    const [customRatioOpen, setCustomRatioOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                setScale(1);
                setRotate(0);
                setCustomWidth("");
                setCustomHeight("");
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleClear = () => {
        setImgSrc("");
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
        setRotate(0);
        setCustomWidth("");
        setCustomHeight("");
        setCustomAspectX("");
        setCustomAspectY("");
        setPreviewUrl(null);
        setPreviewModalOpen(false);
        if (hiddenFileInput.current) hiddenFileInput.current.value = "";
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
        if (aspect) {
            setCrop(centerAspectCrop(width, height, aspect));
        } else {
            setCrop(
                centerCrop(
                    makeAspectCrop(
                        { unit: "%", width: 90 },
                        naturalWidth / naturalHeight,
                        width,
                        height
                    ),
                    width,
                    height
                )
            );
        }
    };

    const handleAspectChange = (newAspect: number | undefined) => {
        setAspect(newAspect);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (newAspect) {
                setCrop(centerAspectCrop(width, height, newAspect));
            } else {
                setCrop(
                    centerCrop(
                        makeAspectCrop({ unit: "%", width: 90 }, imgRef.current.naturalWidth / imgRef.current.naturalHeight, width, height),
                        width,
                        height
                    )
                );
            }
        }
    };

    useEffect(() => {
        if (crop && imgRef.current) {
            const pixelCrop = convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height);
            const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
            const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
            const finalW = Math.round(pixelCrop.width * scaleX);
            const finalH = Math.round(pixelCrop.height * scaleY);

            if (document.activeElement?.id !== "customW") setCustomWidth(finalW.toString());
            if (document.activeElement?.id !== "customH") setCustomHeight(finalH.toString());
        }
    }, [crop]);

    const enforceCustomDimensions = () => {
        const w = parseInt(customWidth);
        const h = parseInt(customHeight);
        if (w > 0 && h > 0 && imgRef.current) {
            const scaleX = imgRef.current.width / imgRef.current.naturalWidth;
            const scaleY = imgRef.current.height / imgRef.current.naturalHeight;

            setAspect(w / h);

            const displayW = w * scaleX;
            const displayH = h * scaleY;

            const newCrop: Crop = {
                unit: "px",
                width: displayW,
                height: displayH,
                x: (imgRef.current.width - displayW) / 2,
                y: (imgRef.current.height - displayH) / 2
            };
            setCrop(newCrop);
        }
    };

    const enforceCustomAspect = () => {
        const x = parseFloat(customAspectX);
        const y = parseFloat(customAspectY);
        if (x > 0 && y > 0) {
            handleAspectChange(x / y);
        }
    };

    const generatePreview = async () => {
        if (!crop || !imgRef.current) return;

        const pixelCrop = convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height);
        if (!pixelCrop.width || !pixelCrop.height) return;

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const outputWidth = Math.round(pixelCrop.width * scaleX);
        const outputHeight = Math.round(pixelCrop.height * scaleY);

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.imageSmoothingQuality = "high";

        const cropX = pixelCrop.x * scaleX;
        const cropY = pixelCrop.y * scaleY;

        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();
        ctx.translate(-cropX, -cropY);
        ctx.translate(centerX, centerY);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
        );

        ctx.restore();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.95)
        );

        if (!blob) return;

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewModalOpen(true);
    };

    const downloadFinalImage = () => {
        if (!previewUrl) return;
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = `cropped_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23e4e4e7'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e4e4e7'/%3E%3C/svg%3E")`;

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                        <CropIcon size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Image Cropper
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <Info size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start mt-6 relative z-10">

                {/* ── Left Side: Canvas Area ── */}
                <div className="w-full flex justify-center bg-white border-2 sm:border-4 border-black rounded-[2rem] overflow-hidden shadow-[6px_6px_0_#000] relative min-h-[400px]">

                    {!imgSrc ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full min-h-[500px]">
                            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-black flex items-center justify-center mb-6 text-black shadow-[3px_3px_0_#000]">
                                <CropIcon size={32} className="text-black animate-pulse" />
                            </div>
                            <h2 className="text-black font-black text-2xl tracking-tight mb-2 ig-display">
                                Drag & Drop or Click Here
                            </h2>
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                    <ShieldCheck size={10} className="text-emerald-600" />
                                    <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-700">100% Private</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                    <ImageIcon size={10} className="text-indigo-650" />
                                    <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-700">Local Only</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                    <Check size={10} className="text-green-650" />
                                    <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-700">Free & Instant</span>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-[10px] font-bold mt-5 uppercase tracking-wider">Professional Grade Local Cropper</p>
                            
                            <label className="mt-6 flex items-center gap-2 px-8 py-4 bg-[#fde047] border-2 border-black hover:bg-yellow-300 active:scale-95 transition-all text-black font-bold rounded-xl cursor-pointer shadow-[3px_3px_0_#000] select-none ig-btn">
                                <UploadCloud size={20} />
                                Browse Files
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onSelectFile}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-6 sm:p-12 overflow-hidden" style={{ backgroundImage: CHECKER }}>
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspect}
                                className="max-h-[70vh]"
                                style={{ maxHeight: "70vh" }}
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop Workspace"
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                    style={{
                                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                                        transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                        maxHeight: "70vh",
                                        objectFit: "contain"
                                    }}
                                />
                            </ReactCrop>

                            {/* Overlay Controls */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={handleClear}
                                    className="px-4 py-2 bg-white border-2 border-black rounded-xl text-black font-bold text-xs flex items-center gap-2 transition-all shadow-[2px_2px_0_#000] ig-btn"
                                >
                                    <X size={14} /> <span>Clear Workspace</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right Side: Controls ── */}
                <div className="space-y-6 w-full">

                    {/* Size / Aspect Controls */}
                    <div className={`bg-white border-2 border-black rounded-3xl p-6 shadow-[5px_5px_0_#000] transition-all ${!imgSrc && "opacity-40 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setDimensionsOpen(!dimensionsOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-black flex items-center justify-center shrink-0">
                                    <Settings2 size={20} className="text-black" />
                                </div>
                                <div>
                                    <h2 className="text-black font-bold text-base leading-tight ig-display">Dimensions</h2>
                                    <p className="text-[11px] text-zinc-550 mt-0.5">Presets & Ratios</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-black transition-colors">
                                {dimensionsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        </div>

                        {dimensionsOpen && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Presets */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ig-label">
                                        Aspect Ratios
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.label}
                                                onClick={() => handleAspectChange(ratio.value)}
                                                className={`py-2 text-[11px] font-bold rounded-xl border-2 transition-all ig-btn ${aspect === ratio.value
                                                    ? "bg-[#fde047] border-black text-black shadow-[1.5px_1.5px_0_#000]"
                                                    : "bg-white border-zinc-200 text-zinc-650 hover:border-black"
                                                    }`}
                                            >
                                                {ratio.label.split(" ")[0]}
                                                <div className="text-[9px] font-medium opacity-70 block mt-0.5">{ratio.label.split(" ")[1] || "Aspect"}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Manual Dimensions */}
                                <div className="mt-6 pt-5 border-t border-zinc-200">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setExactSizeOpen(!exactSizeOpen)}
                                    >
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 cursor-pointer group-hover:text-black transition-colors ig-label">
                                            Exact Size (pixels)
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-black transition-colors">
                                            {exactSizeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {exactSizeOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-50 border-2 border-black rounded-xl overflow-hidden flex items-center px-3 focus-within:bg-white transition-colors">
                                                    <span className="text-xs text-zinc-500 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        id="customW"
                                                        value={customWidth}
                                                        onChange={(e) => setCustomWidth(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Width"
                                                        className="w-full bg-transparent text-black font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <X size={12} className="text-zinc-400 shrink-0" />
                                                <div className="flex-1 bg-zinc-50 border-2 border-black rounded-xl overflow-hidden flex items-center px-3 focus-within:bg-white transition-colors">
                                                    <span className="text-xs text-zinc-500 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        id="customH"
                                                        value={customHeight}
                                                        onChange={(e) => setCustomHeight(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Height"
                                                        className="w-full bg-transparent text-black font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomDimensions} className="w-full py-2.5 bg-white border-2 border-black hover:bg-zinc-50 text-black text-xs font-bold rounded-xl transition-all shadow-[2px_2px_0_#000] ig-btn">
                                                Apply Size
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Aspect Ratio */}
                                <div className="mt-4 pt-4 border-t border-zinc-200">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setCustomRatioOpen(!customRatioOpen)}
                                    >
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 cursor-pointer group-hover:text-black transition-colors ig-label">
                                            Custom Ratio
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-black transition-colors">
                                            {customRatioOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {customRatioOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-50 border-2 border-black rounded-xl overflow-hidden flex items-center px-3 focus-within:bg-white transition-colors">
                                                    <span className="text-xs text-zinc-500 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectX}
                                                        onChange={(e) => setCustomAspectX(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 5"
                                                        className="w-full bg-transparent text-black font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <span className="text-black font-bold">:</span>
                                                <div className="flex-1 bg-zinc-50 border-2 border-black rounded-xl overflow-hidden flex items-center px-3 focus-within:bg-white transition-colors">
                                                    <span className="text-xs text-zinc-500 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectY}
                                                        onChange={(e) => setCustomAspectY(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 4"
                                                        className="w-full bg-transparent text-black font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomAspect} className="w-full py-2.5 bg-white border-2 border-black hover:bg-zinc-50 text-black text-xs font-bold rounded-xl transition-all shadow-[2px_2px_0_#000] ig-btn">
                                                Apply Ratio
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transform Controls */}
                    <div className={`bg-white border-2 border-black rounded-3xl p-6 shadow-[5px_5px_0_#000] transition-all ${!imgSrc && "opacity-40 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setTweaksOpen(!tweaksOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border-2 border-black flex items-center justify-center shrink-0">
                                    <RotateCw size={20} className="text-black" />
                                </div>
                                <div>
                                    <h2 className="text-black font-bold text-base leading-tight ig-display">Image Tweaks</h2>
                                    <p className="text-[11px] text-zinc-550 mt-0.5">Scale &amp; Rotate</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-black transition-colors">
                                {tweaksOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        </div>

                        {tweaksOpen && (
                            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Scale */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-700">Scale / Zoom</label>
                                        <span className="text-[11px] text-black font-bold bg-[#a7f3d0] border-2 border-black px-2 py-0.5 rounded-md">{scale.toFixed(2)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={3}
                                        step={0.05}
                                        value={scale}
                                        onChange={(e) => setScale(Number(e.target.value))}
                                        className="w-full accent-black h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Rotate */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-zinc-700">Rotation Angle</label>
                                        <span className="text-[11px] text-black font-bold bg-[#a7f3d0] border-2 border-black px-2 py-0.5 rounded-md">{rotate}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        value={rotate}
                                        onChange={(e) => setRotate(Number(e.target.value))}
                                        className="w-full accent-black h-2 bg-zinc-200 border-2 border-black rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Block */}
                    <button
                        onClick={generatePreview}
                        disabled={!crop || !imgSrc}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-full text-xs font-bold tracking-widest uppercase text-black transition-all bg-[#fde047] border-2 border-black shadow-[4px_4px_0_#000] disabled:opacity-50 ig-btn"
                    >
                        <CropIcon size={16} />
                        Crop Image
                    </button>

                    {imgSrc && (
                        <p className="text-center text-[10px] font-bold text-zinc-650 tracking-wide uppercase">
                            Cropping is computed natively at original resolution
                        </p>
                    )}

                </div>
            </main>

            {/* ─── SEO RICH TEXT SECTION ─── */}
            <div className="max-w-5xl mx-auto mt-24 px-4 sm:px-6">
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
                                Free Image Cropper Online with Precision Aspect Ratios
                            </h2>
                            <p className="text-sm text-zinc-650 leading-relaxed">
                                Crop images and photos online with custom ratios, fixed pixel dimensions, scale zoom, and rotation adjustments. Powered by 100% client-side rendering, our free image cropper lets you edit visual assets entirely in your browser with no file uploads and absolute privacy.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Fixed & Free Aspect Presets",
                                    desc: "Snap instantly to standard proportions (1:1 square, 16:9 widescreen, 9:16 portrait, 4:3 classic, 3:2 standard) or crop freely using the interactive cropping handles.",
                                    icon: <Layers size={16} />
                                },
                                {
                                    title: "Exact Pixel Dimensions",
                                    desc: "Specify exact target output width and height in pixels (e.g. 1200x630) to crop image online for social media layouts, slides, or graphics headers.",
                                    icon: <Settings2 size={16} />
                                },
                                {
                                    title: "Rotate & Zoom Tweaks",
                                    desc: "Zoom in on details or rotate the canvas dynamically from -180° to 180° to fix tilted horizons and ensure the perfect alignment.",
                                    icon: <RotateCw size={16} />
                                },
                                {
                                    title: "100% Client-Side Privacy",
                                    desc: "We care about privacy. Your source files are processed locally inside your browser's RAM and are never uploaded to any remote servers.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "High-Res Lossless Exports",
                                    desc: "Export your cropped assets in crisp JPG format mapped directly to the original natural resolution of the source photo. No watermarks, ever.",
                                    icon: <Download size={16} />
                                },
                                {
                                    title: "Free with No Registrations",
                                    desc: "No email verification, passwords, or credit card requirements. Use our free image cropper tool as much as you need with zero limits.",
                                    icon: <LockIcon size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-50 border-2 border-black rounded-3xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-650 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Crop Photo Online in 3 Simple Steps
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Select or Drop Image", desc: "Drag and drop your JPG, PNG, WebP, SVG, or BMP file into the workspace, or click to upload from your local drive." },
                                    { step: "2", title: "Frame Your Selection", desc: "Adjust the handles of the cropping container. Choose an aspect ratio preset or type custom pixel values." },
                                    { step: "3", title: "Apply Tweaks & Download", desc: "Use zoom/rotation sliders to align. Click 'Crop Image' to open the preview modal and download the final high-resolution file." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-50 border-2 border-black rounded-3xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-650 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ Accordion Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                Frequently Asked Questions
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="Can I crop transparent PNG files?">
                                    Yes! The cropper works perfectly on transparent PNGs, and the output transparency is fully preserved if you export in PNG container types.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="What formats does this tool output?">
                                    By default, it outputs optimized JPEG containers. You can also save directly back to PNG or converter formats based on your workspace setup.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Are my graphics uploaded to remote databases?">
                                    No. All rendering and crop matrix calculations run inside browser RAM sandbox buffers. Nothing is sent online.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewModalOpen && previewUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black rounded-3xl max-w-lg w-full overflow-hidden shadow-[8px_8px_0_#000] p-6 space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="text-lg font-black text-black ig-display">Crop Preview</h3>
                            <button onClick={() => setPreviewModalOpen(false)} className="p-1 bg-white border-2 border-black rounded-full hover:bg-zinc-100 text-black transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex justify-center bg-zinc-50 border-2 border-black rounded-2xl p-4 overflow-hidden" style={{ backgroundImage: CHECKER }}>
                            <img src={previewUrl} alt="Cropped Preview" className="max-h-[50vh] object-contain border-2 border-black rounded-lg shadow-[3px_3px_0_#000]" />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setPreviewModalOpen(false)} className="px-5 py-2.5 bg-white border-2 border-black rounded-xl text-black font-bold text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50 ig-btn">
                                Cancel
                            </button>
                            <button onClick={downloadFinalImage} className="px-5 py-2.5 bg-[#fde047] border-2 border-black rounded-xl text-black font-bold text-xs shadow-[2px_2px_0_#000] hover:bg-yellow-300 flex items-center gap-1.5 ig-btn">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Image Cropper Details"
            >
                <div className="space-y-6">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6 text-zinc-700">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Precision Visual Trimming Engine
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for precise visual boundary adjustment. AssetNest <strong>Image Cropper</strong> runs locally to trim and scale visual elements inside browser GPU buffers. Choose presets or key in specific target pixel widths and heights for e-commerce, web development, or print layouts.
                        </p>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
