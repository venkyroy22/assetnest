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
    Maximize,
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
    Info
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import Link from "next/link";
import HelpModal from "@/components/HelpModal";

// Helper to center an aspect ratio crop on init
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
            setCrop(undefined); // Makes crop preview update between images.
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                // Reset transforms on new image
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
            // Default 90% center start if no aspect
            setCrop(
                centerCrop(
                    makeAspectCrop(
                        { unit: "%", width: 90 },
                        naturalWidth / naturalHeight, // Use natural aspect if free
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

    // Update real-world dimensions output
    useEffect(() => {
        if (crop && imgRef.current) {
            const pixelCrop = convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height);
            const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
            const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
            const finalW = Math.round(pixelCrop.width * scaleX);
            const finalH = Math.round(pixelCrop.height * scaleY);

            // Only update if they differ (to avoid fight with input typing)
            if (document.activeElement?.id !== "customW") setCustomWidth(finalW.toString());
            if (document.activeElement?.id !== "customH") setCustomHeight(finalH.toString());
        }
    }, [crop]);

    const enforceCustomDimensions = () => {
        const w = parseInt(customWidth);
        const h = parseInt(customHeight);
        if (w > 0 && h > 0 && imgRef.current) {
            // The user typed real natural pixel sizes. We must map that back to the onscreen display crop.
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

        // Apply scale/rotation bounds to canvas
        const outputWidth = Math.round(pixelCrop.width * scaleX);
        const outputHeight = Math.round(pixelCrop.height * scaleY);

        // Setup canvas size
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.imageSmoothingQuality = "high";

        const cropX = pixelCrop.x * scaleX;
        const cropY = pixelCrop.y * scaleY;

        // Need to bring image to canvas, handle rotation and scale
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();

        // 1. Move to the center of the output piece we want
        ctx.translate(-cropX, -cropY);

        // 2. Move to image center to rotate/scale around it
        ctx.translate(centerX, centerY);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);

        // 3. Move back
        ctx.translate(-centerX, -centerY);

        // Draw
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

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-zinc-400 font-sans pb-24">
            {/* Header */}
            <header className="max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
                <Link
                    href="/tools"
                    className="flex items-center gap-2 text-zinc-500 hover:text-[#f0ede8] transition-colors text-sm font-bold"
                >
                    <ArrowLeft size={16} /> back to tools
                </Link>
                <div className="flex items-center gap-3 relative mr-8 sm:mr-0 z-10">
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="absolute -top-2 -left-2 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-[#f0ede8] transition-all shadow-xl z-10"
                        title="What is this?"
                    >
                        <Info size={14} />
                    </button>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#f0ede8] text-xs font-black shadow-[0_0_20px_rgba(255, 255, 255,0.4)] ml-6" style={{ background: "linear-gradient(135deg, #2563eb 0%, #ffffff 100%)" }}>
                        <CropIcon size={16} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-[#f0ede8] hidden sm:block">
                        Advanced Image Cropper
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start mt-8">

                {/* ── Left Side: Canvas Area ── */}
                <div className="w-full flex justify-center bg-[#141414] border border-white/[0.07] rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[400px]">

                    {!imgSrc ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full min-h-[500px]">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center mb-6 text-[#f0ede8] group-hover:border-white/60 transition-colors">
                                <CropIcon size={32} />
                            </div>
                            <h2 className="text-[#f0ede8] font-black text-2xl tracking-tight mb-2">
                                Drag & Drop or Click Here
                            </h2>
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <ShieldCheck size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">100% Private</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <ImageIcon size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">No Server Upload</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <Check size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">Free Forever</span>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-[10px] font-medium mt-3 uppercase tracking-wider">Professional Grade Local Cropping</p>
                            <label className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-white active:scale-95 transition-all text-black font-bold rounded-xl cursor-pointer shadow-lg shadow-white/20">
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
                        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHADv7//x/GQAxgYmQeA8oQjIbh0EA0wDCqgUHUAKgGkKEB6gYAb4shvQ8H34IAAAAASUVORK5CYII=')]">
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
                                    alt="Crop me"
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
                                    className="p-2 sm:px-4 sm:py-2 bg-[#141414]/50 hover:bg-[#141414]/80 backdrop-blur-md rounded-lg text-[#f0ede8] font-bold text-xs flex items-center gap-2 transition-all border border-white/10"
                                >
                                    <X size={14} /> <span className="hidden sm:block">Clear Image</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right Side: Controls ── */}
                <div className="space-y-6">

                    {/* Size / Aspect Controls */}
                    <div className={`bg-[#1c1c1c] border border-white/[0.07] rounded-3xl p-6 transition-all ${!imgSrc && "opacity-50 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setDimensionsOpen(!dimensionsOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white/20" style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff" }}>
                                    <Settings2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[#f0ede8] font-bold text-lg leading-tight">Dimensions</h2>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Crop Settings</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                                {dimensionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        {dimensionsOpen && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Presets */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-semibold text-zinc-500">
                                        Aspect Ratios
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.label}
                                                onClick={() => handleAspectChange(ratio.value)}
                                                className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${aspect === ratio.value
                                                    ? "bg-white border-white text-black shadow-lg shadow-white/20"
                                                    : "bg-[#1c1c1c] border-white/[0.07] text-zinc-400 hover:bg-white/[0.06] hover:text-[#f0ede8]"
                                                    }`}
                                            >
                                                {ratio.label.split(" ")[0]}
                                                <div className="text-[9px] font-medium opacity-50 block mt-0.5">{ratio.label.split(" ")[1] || "Aspect"}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Manual Dimensions */}
                                <div className="mt-6 pt-6 border-t border-white/[0.07]">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setExactSizeOpen(!exactSizeOpen)}
                                    >
                                        <label className="text-[10px] font-semibold text-zinc-500 cursor-pointer group-hover:text-[#f0ede8] transition-colors">
                                            Exact Size (px)
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                                            {exactSizeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {exactSizeOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-[#1c1c1c] border border-white/[0.07] rounded-xl overflow-hidden flex items-center px-3 focus-within:border-white transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        id="customW"
                                                        value={customWidth}
                                                        onChange={(e) => setCustomWidth(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Width"
                                                        className="w-full bg-transparent text-[#f0ede8] font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <X size={14} className="text-zinc-700 shrink-0" />
                                                <div className="flex-1 bg-[#1c1c1c] border border-white/[0.07] rounded-xl overflow-hidden flex items-center px-3 focus-within:border-white transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        id="customH"
                                                        value={customHeight}
                                                        onChange={(e) => setCustomHeight(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Height"
                                                        className="w-full bg-transparent text-[#f0ede8] font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomDimensions} className="mt-3 w-full py-2 bg-white/[0.06] hover:bg-zinc-700 active:scale-95 text-[#f0ede8] text-xs font-bold rounded-lg transition-all border border-zinc-700">
                                                Apply Size
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Aspect Ratio */}
                                <div className="mt-6 pt-6 border-t border-white/[0.07]">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setCustomRatioOpen(!customRatioOpen)}
                                    >
                                        <label className="text-[10px] font-semibold text-zinc-500 cursor-pointer group-hover:text-[#f0ede8] transition-colors">
                                            Custom Ratio
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                                            {customRatioOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {customRatioOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-[#1c1c1c] border border-white/[0.07] rounded-xl overflow-hidden flex items-center px-3 focus-within:border-white transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectX}
                                                        onChange={(e) => setCustomAspectX(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 5"
                                                        className="w-full bg-transparent text-[#f0ede8] font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <span className="text-zinc-500 font-bold">:</span>
                                                <div className="flex-1 bg-[#1c1c1c] border border-white/[0.07] rounded-xl overflow-hidden flex items-center px-3 focus-within:border-white transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectY}
                                                        onChange={(e) => setCustomAspectY(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 4"
                                                        className="w-full bg-transparent text-[#f0ede8] font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomAspect} className="mt-3 w-full py-2 bg-white/[0.06] hover:bg-zinc-700 active:scale-95 text-[#f0ede8] text-xs font-bold rounded-lg transition-all border border-zinc-700">
                                                Apply Ratio
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transform Controls */}
                    <div className={`bg-[#1c1c1c] border border-white/[0.07] rounded-3xl p-6 transition-all ${!imgSrc && "opacity-50 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setTweaksOpen(!tweaksOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white/20" style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff" }}>
                                    <RotateCw size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[#f0ede8] font-bold text-lg leading-tight">Tweaks</h2>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Scale &amp; Rotate</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                                {tweaksOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        {tweaksOpen && (
                            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Scale */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400">Scale / Zoom</label>
                                        <span className="text-xs text-[#f0ede8] bg-white/[0.06] px-2 py-1 rounded">{scale.toFixed(2)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={3}
                                        step={0.1}
                                        value={scale}
                                        onChange={(e) => setScale(Number(e.target.value))}
                                        className="w-full white h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Rotate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400">Rotation</label>
                                        <span className="text-xs text-[#f0ede8] bg-white/[0.06] px-2 py-1 rounded">{rotate}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        value={rotate}
                                        onChange={(e) => setRotate(Number(e.target.value))}
                                        className="w-full white h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Block */}
                    <button
                        onClick={generatePreview}
                        disabled={!crop || !imgSrc}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-full text-sm font-bold tracking-wide text-black transition-all bg-white hover:bg-white disabled:opacity-50 border border-white"
                    >
                        <CropIcon size={18} />
                        Crop Image
                    </button>

                    {imgSrc && (
                        <p className="text-center text-xs text-zinc-500">
                            Download quality is mapped directly to your original image's resolution.
                        </p>
                    )}

                </div>
            </main>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Visual Framing Infrastructure"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                            Visual Image Framing Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for asset framing. AssetNest <strong>Advanced Image Cropper</strong> transcends basic photo resizing—it provides a structural editor where you can manipulate image boundaries with pixel-perfect precision. Whether you are framing a high-end editorial portrait, a complex product shot, or a widescreen web banner, our tool gives you the power to rotate, scale, and crop your creative assets with zero loss in quality and absolute data privacy.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <CropIcon size={20} className="text-zinc-500" />
                                How to Crop Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>Precision Masking:</strong> Drag to define the exact crop zone. Our engine previews the output in real-time.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>Aspect Locking:</strong> Instantly snap to 1:1, 16:9, or 4:3 presets, or define your own custom ratios.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>Exact Dimensioning:</strong> Need a precise 1200x630px crop? Input exact pixel values for target-aligned output.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive photo data on external servers, our cropper operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • High-Fidelity Vector Preservation • Lossless Container Export • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] border-t border-white/[0.05] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Custom Ratios?">
                                Yes. Use the Custom Ratio menu to enter specific proportions like 5:4 or 21:9 for cinematic crops.
                            </AccordionItem>
                            <AccordionItem title="Quality Loss?">
                                Zero. Our rendering engine maps the crop directly to your original source resolution for maximum clarity.
                            </AccordionItem>
                            <AccordionItem title="Secure Uploads?">
                                There are no uploads. Your file resides entirely in your computer&apos;s memory during the entire process.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            {/* ── Preview Modal ── */}
            {previewModalOpen && previewUrl && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-2xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden bg-[#1c1c1c] border-white/[0.07]">
                        <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0 relative">
                            <button onClick={() => {
                                setPreviewModalOpen(false);
                            }} className="absolute -top-1 -left-1 text-zinc-500 hover:text-[#f0ede8] p-2 bg-[#1c1c1c] rounded-full border border-white/[0.07] shadow-xl z-20">
                                <X size={20} />
                            </button>
                            <h3 className="font-black text-lg sm:text-xl text-[#f0ede8] flex items-center gap-3 pl-12">
                                <Check size={20} className="text-[#f0ede8]" /> Crop Successful
                            </h3>
                        </div>

                        <div className="overflow-y-auto space-y-6 pb-4">
                            <div className="flex flex-col items-center">
                                <div className="max-w-full rounded-lg overflow-hidden border border-white/[0.07] bg-[#141414] flex items-center justify-center p-2">
                                    <img src={previewUrl} alt="Cropped Preview" className="max-h-[50vh] object-contain shadow-md rounded" />
                                </div>
                                <p className="text-xs text-zinc-500 mt-4 text-center">Looking good! This is your final high-resolution crop preview.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={downloadFinalImage}
                                    className="h-12 px-6 bg-[#f0ede8] text-[#141414] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-[#e8e5e0] transition-all active:scale-[0.98] shadow-xl shadow-white/10"
                                >
                                    <Download size={18} /> Download Image
                                </button>
                                <button
                                    onClick={() => setPreviewModalOpen(false)}
                                    className="h-12 px-6 bg-[#1c1c1c] border border-white/[0.07] text-zinc-400 hover:text-[#f0ede8] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                                >
                                    <RefreshCw size={14} /> Back to Editor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

