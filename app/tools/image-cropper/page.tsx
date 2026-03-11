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
} from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
        <div className="min-h-screen bg-zinc-950 text-zinc-400 font-sans pb-24">
            {/* Header */}
            <header className="max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
                <Link
                    href="/tools"
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold"
                >
                    <ArrowLeft size={16} /> back to tools
                </Link>
                <div className="flex items-center gap-3 relative mr-8 sm:mr-0 z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-[0_0_20px_rgba(59,130,246,0.4)]" style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" }}>
                        <CropIcon size={16} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
                        Advanced Image Cropper
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start mt-8">

                {/* ── Left Side: Canvas Area ── */}
                <div className="w-full flex justify-center bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[400px]">

                    {!imgSrc ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full min-h-[500px]">
                            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border-2 border-dashed border-blue-500/30 flex items-center justify-center mb-6 text-blue-500 group-hover:border-blue-500/60 transition-colors">
                                <CropIcon size={32} />
                            </div>
                            <h2 className="text-white font-black text-2xl tracking-tight mb-3">
                                Upload an image to crop
                            </h2>
                            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-8">
                                Drag and drop your photo, or click the button below to browse. We support ultra-high resolution images.
                            </p>
                            <label className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/20">
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
                                    className="p-2 sm:px-4 sm:py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-lg text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/10"
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
                    <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-all ${!imgSrc && "opacity-50 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setDimensionsOpen(!dimensionsOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-500/20" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                                    <Settings2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg leading-tight">Dimensions</h2>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Crop Settings</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-white transition-colors">
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
                                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                                    }`}
                                            >
                                                {ratio.label.split(" ")[0]}
                                                <div className="text-[9px] font-medium opacity-50 block mt-0.5">{ratio.label.split(" ")[1] || "Aspect"}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Manual Dimensions */}
                                <div className="mt-6 pt-6 border-t border-zinc-800">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setExactSizeOpen(!exactSizeOpen)}
                                    >
                                        <label className="text-[10px] font-semibold text-zinc-500 cursor-pointer group-hover:text-white transition-colors">
                                            Exact Size (px)
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-white transition-colors">
                                            {exactSizeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {exactSizeOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center px-3 focus-within:border-blue-500 transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        id="customW"
                                                        value={customWidth}
                                                        onChange={(e) => setCustomWidth(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Width"
                                                        className="w-full bg-transparent text-white font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <X size={14} className="text-zinc-700 shrink-0" />
                                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center px-3 focus-within:border-blue-500 transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        id="customH"
                                                        value={customHeight}
                                                        onChange={(e) => setCustomHeight(e.target.value)}
                                                        onBlur={enforceCustomDimensions}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomDimensions()}
                                                        placeholder="Height"
                                                        className="w-full bg-transparent text-white font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomDimensions} className="mt-3 w-full py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all border border-zinc-700">
                                                Apply Size
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Aspect Ratio */}
                                <div className="mt-6 pt-6 border-t border-zinc-800">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setCustomRatioOpen(!customRatioOpen)}
                                    >
                                        <label className="text-[10px] font-semibold text-zinc-500 cursor-pointer group-hover:text-white transition-colors">
                                            Custom Ratio
                                        </label>
                                        <button className="text-zinc-500 group-hover:text-white transition-colors">
                                            {customRatioOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {customRatioOpen && (
                                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center px-3 focus-within:border-blue-500 transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">W</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectX}
                                                        onChange={(e) => setCustomAspectX(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 5"
                                                        className="w-full bg-transparent text-white font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                                <span className="text-zinc-500 font-bold">:</span>
                                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center px-3 focus-within:border-blue-500 transition-colors">
                                                    <span className="text-xs text-zinc-600 font-bold mr-2">H</span>
                                                    <input
                                                        type="number"
                                                        value={customAspectY}
                                                        onChange={(e) => setCustomAspectY(e.target.value)}
                                                        onBlur={enforceCustomAspect}
                                                        onKeyDown={(e) => e.key === "Enter" && enforceCustomAspect()}
                                                        placeholder="e.g. 4"
                                                        className="w-full bg-transparent text-white font-bold text-sm py-3 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={enforceCustomAspect} className="mt-3 w-full py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all border border-zinc-700">
                                                Apply Ratio
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transform Controls */}
                    <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-all ${!imgSrc && "opacity-50 pointer-events-none grayscale"}`}>
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setTweaksOpen(!tweaksOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-purple-500/20" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
                                    <RotateCw size={20} />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg leading-tight">Tweaks</h2>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Scale &amp; Rotate</p>
                                </div>
                            </div>
                            <button className="text-zinc-500 group-hover:text-white transition-colors">
                                {tweaksOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        {tweaksOpen && (
                            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Scale */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400">Scale / Zoom</label>
                                        <span className="text-xs text-white bg-zinc-800 px-2 py-1 rounded">{scale.toFixed(2)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={3}
                                        step={0.1}
                                        value={scale}
                                        onChange={(e) => setScale(Number(e.target.value))}
                                        className="w-full accent-purple-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Rotate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400">Rotation</label>
                                        <span className="text-xs text-white bg-zinc-800 px-2 py-1 rounded">{rotate}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        value={rotate}
                                        onChange={(e) => setRotate(Number(e.target.value))}
                                        className="w-full accent-purple-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Block */}
                    <button
                        onClick={generatePreview}
                        disabled={!crop || !imgSrc}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-full text-sm font-bold tracking-wide text-white transition-all bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 border border-emerald-500"
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

            {/* ── Preview Modal ── */}
            {previewModalOpen && previewUrl && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-2xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden bg-zinc-950 border-zinc-800">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="font-black text-xl text-emerald-500 flex items-center gap-3">
                                <Check size={24} /> Crop Successful
                            </h3>
                            <button onClick={() => {
                                setPreviewModalOpen(false);
                            }} className="text-zinc-500 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-6 pb-4">
                            <div className="flex flex-col items-center">
                                <div className="max-w-full rounded-lg overflow-hidden border border-zinc-800 bg-black flex items-center justify-center p-2">
                                    <img src={previewUrl} alt="Cropped Preview" className="max-h-[50vh] object-contain shadow-md rounded" />
                                </div>
                                <p className="text-xs text-zinc-500 mt-4 text-center">Looking good! This is your final high-resolution crop preview.</p>
                            </div>

                            <button
                                onClick={downloadFinalImage}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-full text-sm font-bold tracking-wide text-white transition-all bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-xl"
                            >
                                <Download size={18} />
                                Download Final Image
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

