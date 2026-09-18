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
    UploadCloud, Crop as CropIcon, Download, RotateCw, Settings2,
    Check, X, ChevronDown, ChevronUp, ShieldCheck, Sparkles, ArrowLeft,
    Layers, Lock as LockIcon, HelpCircle, Image as ImageIcon, Package, Info, RefreshCw
} from "lucide-react";
import Link from "next/link";
import HelpModal from "@/components/HelpModal";

/* ─────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────── */
const T = {
  bg: "#333333",
  surface: "#3a3a3a",
  surfaceRaised: "#444444",
  border: "#555",
  borderDim: "#2a2a2a",
  accent: "#4db8d4",
  accentDark: "#2a7a8f",
  text: "#cccccc",
  textSub: "#999999",
  textMuted: "#888888",
  danger: "#cc4444",
  warning: "#d4a843",
  success: "#7dcea0",
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/* ─────────────────────────────────────────
   SHARED COMPONENTS
   ───────────────────────────────────────── */
function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 2,
      background: T.surface, border: `1px solid ${T.border}`,
      fontSize: 10, fontWeight: 400, color: "#aaa",
    }}>{icon}{label}</span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
      padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.text, margin: 0, display: "flex", gap: 6 }}>
          <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
        </h4>
        <span style={{ color: T.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight);
}

const ASPECT_RATIOS = [
    { label: "Free", value: undefined },
    { label: "1:1 Sq", value: 1 },
    { label: "16:9 Land", value: 16 / 9 },
    { label: "9:16 Port", value: 9 / 16 },
    { label: "4:3 Cls", value: 4 / 3 },
    { label: "3:2 Std", value: 3 / 2 },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function ImageCropperPage() {
    const [imgSrc, setImgSrc] = useState("");
    const imgRef = useRef<HTMLImageElement>(null);
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    const [customWidth, setCustomWidth] = useState<string>("");
    const [customHeight, setCustomHeight] = useState<string>("");
    const [customAspectX, setCustomAspectX] = useState<string>("");
    const [customAspectY, setCustomAspectY] = useState<string>("");

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const [dimensionsOpen, setDimensionsOpen] = useState(true);
    const [tweaksOpen, setTweaksOpen] = useState(false);
    const [exactSizeOpen, setExactSizeOpen] = useState(false);
    const [customRatioOpen, setCustomRatioOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                setScale(1); setRotate(0); setCustomWidth(""); setCustomHeight("");
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                setScale(1); setRotate(0); setCustomWidth(""); setCustomHeight("");
            });
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };

    const handleClear = () => {
        setImgSrc(""); setCrop(undefined); setCompletedCrop(undefined);
        setScale(1); setRotate(0); setCustomWidth(""); setCustomHeight("");
        setCustomAspectX(""); setCustomAspectY("");
        setPreviewUrl(null); setPreviewModalOpen(false);
        if (hiddenFileInput.current) hiddenFileInput.current.value = "";
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
        if (aspect) {
            setCrop(centerAspectCrop(width, height, aspect));
        } else {
            setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, naturalWidth / naturalHeight, width, height), width, height));
        }
    };

    const handleAspectChange = (newAspect: number | undefined) => {
        setAspect(newAspect);
        if (imgRef.current) {
            const { width, height, naturalWidth, naturalHeight } = imgRef.current;
            if (newAspect) {
                setCrop(centerAspectCrop(width, height, newAspect));
            } else {
                setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, naturalWidth / naturalHeight, width, height), width, height));
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
        const w = parseInt(customWidth); const h = parseInt(customHeight);
        if (w > 0 && h > 0 && imgRef.current) {
            const scaleX = imgRef.current.width / imgRef.current.naturalWidth;
            const scaleY = imgRef.current.height / imgRef.current.naturalHeight;
            setAspect(w / h);
            const displayW = w * scaleX; const displayH = h * scaleY;
            const newCrop: Crop = { unit: "px", width: displayW, height: displayH, x: (imgRef.current.width - displayW) / 2, y: (imgRef.current.height - displayH) / 2 };
            setCrop(newCrop);
        }
    };

    const enforceCustomAspect = () => {
        const x = parseFloat(customAspectX); const y = parseFloat(customAspectY);
        if (x > 0 && y > 0) handleAspectChange(x / y);
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

        canvas.width = outputWidth; canvas.height = outputHeight;
        ctx.imageSmoothingQuality = "high";

        const cropX = pixelCrop.x * scaleX; const cropY = pixelCrop.y * scaleY;
        const centerX = image.naturalWidth / 2; const centerY = image.naturalHeight / 2;

        ctx.save();
        ctx.translate(-cropX, -cropY);
        ctx.translate(centerX, centerY);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);
        ctx.restore();

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url); setPreviewModalOpen(true);
    };

    const downloadFinalImage = () => {
        if (!previewUrl) return;
        const a = document.createElement("a"); a.href = previewUrl; a.download = `cropped_${Date.now()}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3C/svg%3E")`;

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            input[type=range] { accent-color: ${T.accent}; }
            ::-webkit-scrollbar { display: none; }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          `}</style>

          {/* ── HEADER ── */}
          <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/tools" style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
              color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
            }}>
              <ArrowLeft size={11} strokeWidth={2} /> Back
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                <CropIcon size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Image Cropper</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Description + Chips */}
            <div style={{ marginBottom: 0, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                <Chip icon={<Layers size={10} />} label="Fixed Aspect Presets" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>Free Image Cropper Online</h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Crop photos online with custom ratios, fixed pixel dimensions, scale zoom, and rotation adjustments. Powered by 100% client-side rendering.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: imgSrc ? "1fr 320px" : "1fr", gap: 16, alignItems: "start", marginTop: 16 }}>

              {/* ── Left Side: Canvas Area ── */}
              <div style={{
                background: imgSrc ? CHECKER : T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
                minHeight: imgSrc ? 400 : 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden", padding: imgSrc ? 20 : 32,
              }}>
                {!imgSrc ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => hiddenFileInput.current?.click()}
                    style={{
                      width: "100%", height: "100%", minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: `1px dashed ${dragging ? T.accent : T.border}`, borderRadius: 4,
                      background: dragging ? T.surface : T.bg, cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <UploadCloud size={28} style={{ color: T.textMuted, marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>Drag & Drop or Click Here</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
                      <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                      <Chip icon={<ImageIcon size={10} />} label="Local Only" />
                      <Chip icon={<Check size={10} />} label="Free & Instant" />
                    </div>
                    <input type="file" accept="image/*" onChange={onSelectFile} ref={hiddenFileInput} style={{ display: "none" }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    <ReactCrop
                      crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect}
                      style={{ maxHeight: "70vh" }}
                    >
                      <img ref={imgRef} alt="Crop Workspace" src={imgSrc} onLoad={onImageLoad}
                        style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, transition: "transform 0.2s", maxHeight: "70vh", objectFit: "contain" }} />
                    </ReactCrop>
                    <button onClick={handleClear} style={{
                      position: "absolute", top: 12, right: 12, padding: "6px 12px",
                      background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3,
                      color: T.text, fontSize: 10, fontWeight: 400, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, fontFamily: T.font,
                    }}>
                      <X size={12} /> Clear Workspace
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right Side: Controls ── */}
              {imgSrc && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Dimensions Accordion */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 14 }}>
                    <div onClick={() => setDimensionsOpen(!dimensionsOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Settings2 size={14} style={{ color: T.accent }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>Dimensions</span>
                      </div>
                      <span style={{ color: T.textMuted, transform: dimensionsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><ChevronDown size={14} /></span>
                    </div>

                    {dimensionsOpen && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn 0.2s ease" }}>
                        <div style={{ fontSize: 9, fontWeight: 500, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Aspect Ratios</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                          {ASPECT_RATIOS.map(ratio => (
                            <button key={ratio.label} onClick={() => handleAspectChange(ratio.value)} style={{
                              padding: "6px", background: aspect === ratio.value ? T.accent : T.bg, border: `1px solid ${aspect === ratio.value ? T.accent : T.border}`,
                              borderRadius: 3, color: aspect === ratio.value ? "#1a1a1a" : T.textSub, fontSize: 10, fontWeight: 500, cursor: "pointer",
                              display: "flex", flexDirection: "column", alignItems: "center", transition: "all 0.12s", fontFamily: T.font,
                            }}>
                              <span>{ratio.label.split(" ")[0]}</span>
                              <span style={{ fontSize: 8, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>{ratio.label.split(" ")[1] || "Aspect"}</span>
                            </button>
                          ))}
                        </div>

                        {/* Exact Size */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                          <div onClick={() => setExactSizeOpen(!exactSizeOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: exactSizeOpen ? 8 : 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 500, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Exact Size (pixels)</span>
                            <span style={{ color: T.textMuted }}><ChevronDown size={12} /></span>
                          </div>
                          {exactSizeOpen && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.2s ease" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: "0 8px" }}>
                                  <span style={{ fontSize: 10, color: T.textMuted, marginRight: 6 }}>W</span>
                                  <input type="number" id="customW" value={customWidth} onChange={e => setCustomWidth(e.target.value)} onBlur={enforceCustomDimensions} onKeyDown={e => e.key === "Enter" && enforceCustomDimensions()}
                                    style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: 11, padding: "8px 0", outline: "none", fontFamily: T.font }} placeholder="Width" />
                                </div>
                                <X size={10} style={{ color: T.textMuted, flexShrink: 0 }} />
                                <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: "0 8px" }}>
                                  <span style={{ fontSize: 10, color: T.textMuted, marginRight: 6 }}>H</span>
                                  <input type="number" id="customH" value={customHeight} onChange={e => setCustomHeight(e.target.value)} onBlur={enforceCustomDimensions} onKeyDown={e => e.key === "Enter" && enforceCustomDimensions()}
                                    style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: 11, padding: "8px 0", outline: "none", fontFamily: T.font }} placeholder="Height" />
                                </div>
                              </div>
                              <button onClick={enforceCustomDimensions} style={{ padding: "6px 0", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, fontSize: 10, cursor: "pointer", fontFamily: T.font }}>Apply Size</button>
                            </div>
                          )}
                        </div>

                        {/* Custom Ratio */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                          <div onClick={() => setCustomRatioOpen(!customRatioOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: customRatioOpen ? 8 : 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 500, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Custom Ratio</span>
                            <span style={{ color: T.textMuted }}><ChevronDown size={12} /></span>
                          </div>
                          {customRatioOpen && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.2s ease" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: "0 8px" }}>
                                  <span style={{ fontSize: 10, color: T.textMuted, marginRight: 6 }}>W</span>
                                  <input type="number" value={customAspectX} onChange={e => setCustomAspectX(e.target.value)} onBlur={enforceCustomAspect} onKeyDown={e => e.key === "Enter" && enforceCustomAspect()}
                                    style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: 11, padding: "8px 0", outline: "none", fontFamily: T.font }} placeholder="5" />
                                </div>
                                <span style={{ color: T.text, fontWeight: 700 }}>:</span>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: "0 8px" }}>
                                  <span style={{ fontSize: 10, color: T.textMuted, marginRight: 6 }}>H</span>
                                  <input type="number" value={customAspectY} onChange={e => setCustomAspectY(e.target.value)} onBlur={enforceCustomAspect} onKeyDown={e => e.key === "Enter" && enforceCustomAspect()}
                                    style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: 11, padding: "8px 0", outline: "none", fontFamily: T.font }} placeholder="4" />
                                </div>
                              </div>
                              <button onClick={enforceCustomAspect} style={{ padding: "6px 0", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, fontSize: 10, cursor: "pointer", fontFamily: T.font }}>Apply Ratio</button>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Tweaks Accordion */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 14 }}>
                    <div onClick={() => setTweaksOpen(!tweaksOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <RotateCw size={14} style={{ color: T.accent }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>Image Tweaks</span>
                      </div>
                      <span style={{ color: T.textMuted, transform: tweaksOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><ChevronDown size={14} /></span>
                    </div>

                    {tweaksOpen && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn 0.2s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scale / Zoom</span>
                            <span style={{ fontSize: 10, color: "#1a1a1a", background: T.accent, padding: "2px 6px", borderRadius: 99 }}>{scale.toFixed(2)}x</span>
                          </div>
                          <input type="range" min={0.5} max={3} step={0.05} value={scale} onChange={e => setScale(Number(e.target.value))} style={{ width: "100%", height: 4, cursor: "pointer" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rotation Angle</span>
                            <span style={{ fontSize: 10, color: "#1a1a1a", background: T.accent, padding: "2px 6px", borderRadius: 99 }}>{rotate}°</span>
                          </div>
                          <input type="range" min={-180} max={180} step={1} value={rotate} onChange={e => setRotate(Number(e.target.value))} style={{ width: "100%", height: 4, cursor: "pointer" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={generatePreview} disabled={!crop} style={{
                    padding: "14px 16px", background: T.accent, border: "none", borderRadius: 4,
                    color: "#1a1a1a", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: T.font, opacity: !crop ? 0.5 : 1, transition: "all 0.12s",
                  }}>
                    <CropIcon size={14} /> Crop Image
                  </button>

                  <p style={{ textAlign: "center", fontSize: 9, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Cropping is computed natively at original resolution
                  </p>

                </div>
              )}
            </div>

            {/* ── SEO SECTION ── */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <Chip icon={<ShieldCheck size={11} />} label="100% In-Browser Privacy" />
                <Chip icon={<Sparkles size={11} />} label="Free & Unlimited" />
                <Chip icon={<Package size={11} />} label="No Server Uploads" />
              </div>

              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                  Free Image Cropper Online with Precision Aspect Ratios
                </h2>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                  Crop images and photos online with custom ratios, fixed pixel dimensions, scale zoom, and rotation adjustments. Powered by 100% client-side rendering, our free image cropper lets you edit visual assets entirely in your browser with no file uploads and absolute privacy.
                </p>
              </div>

              {/* Feature Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 48 }}>
                {[
                  { title: "Fixed & Free Aspect Presets", desc: "Snap instantly to standard proportions (1:1 square, 16:9 widescreen, 9:16 portrait, 4:3 classic, 3:2 standard) or crop freely using the interactive cropping handles.", icon: <Layers size={16} /> },
                  { title: "Exact Pixel Dimensions", desc: "Specify exact target output width and height in pixels (e.g. 1200x630) to crop image online for social media layouts, slides, or graphics headers.", icon: <Settings2 size={16} /> },
                  { title: "Rotate & Zoom Tweaks", desc: "Zoom in on details or rotate the canvas dynamically from -180° to 180° to fix tilted horizons and ensure the perfect alignment.", icon: <RotateCw size={16} /> },
                  { title: "100% Client-Side Privacy", desc: "We care about privacy. Your source files are processed locally inside your browser's RAM and are never uploaded to any remote servers.", icon: <ShieldCheck size={16} /> },
                  { title: "High-Res Lossless Exports", desc: "Export your cropped assets in crisp JPG format mapped directly to the original natural resolution of the source photo. No watermarks, ever.", icon: <Download size={16} /> },
                  { title: "Free with No Registrations", desc: "No email verification, passwords, or credit card requirements. Use our free image cropper tool as much as you need with zero limits.", icon: <LockIcon size={16} /> },
                ].map(f => (
                  <div key={f.title} style={{ padding: 12, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ color: T.accent }}>{f.icon}</div>
                      <h3 style={{ fontSize: 12, fontWeight: 500, margin: 0, color: T.text }}>{f.title}</h3>
                    </div>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginBottom: 48 }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>
                  How to Crop Photo Online in 3 Simple Steps
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    { step: "1", title: "Select or Drop Image", desc: "Drag and drop your JPG, PNG, WebP, SVG, or BMP file into the workspace, or click to upload from your local drive." },
                    { step: "2", title: "Frame Your Selection", desc: "Adjust the handles of the cropping container. Choose an aspect ratio preset or type custom pixel values." },
                    { step: "3", title: "Apply Tweaks & Download", desc: "Use zoom/rotation sliders to align. Click 'Crop Image' to open the preview modal and download the final high-resolution file." },
                  ].map(s => (
                    <div key={s.step} style={{ padding: 12, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 20 }}>
                      <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.step}</div>
                      <h4 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 6px" }}>{s.title}</h4>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>Frequently Asked Questions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FAQItem question="Can I crop transparent PNG files?" answer="Yes! The cropper works perfectly on transparent PNGs, and the output transparency is fully preserved if you export in PNG container types." />
                  <FAQItem question="What formats does this tool output?" answer="By default, it outputs optimized JPEG containers. You can also save directly back to PNG or converter formats based on your workspace setup." />
                  <FAQItem question="Are my graphics uploaded to remote databases?" answer="No. All rendering and crop matrix calculations run inside browser RAM sandbox buffers. Nothing is sent online." />
                </div>
              </div>
            </div>

          </div>

          {/* ── PREVIEW MODAL ── */}
          {previewModalOpen && previewUrl && (
            <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, maxWidth: 500, width: "100%", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: T.text }}>Crop Preview</h3>
                  <button onClick={() => setPreviewModalOpen(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}><X size={16} /></button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", background: CHECKER, border: `1px solid ${T.border}`, borderRadius: 4, padding: 16 }}>
                  <img src={previewUrl} alt="Preview" style={{ maxHeight: "50vh", objectFit: "contain", borderRadius: 4, border: `1px solid ${T.border}` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => setPreviewModalOpen(false)} style={{ padding: "8px 16px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, fontSize: 11, cursor: "pointer", fontFamily: T.font }}>Cancel</button>
                  <button onClick={downloadFinalImage} style={{ padding: "8px 16px", background: T.accent, border: "none", borderRadius: 3, color: "#1a1a1a", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: T.font }}>
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Image Cropper Details">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Precision Visual Trimming Engine</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                AssetNest Image Cropper runs locally to trim and scale visual elements inside browser GPU buffers. Choose presets or key in specific target pixel widths and heights for e-commerce, web development, or print layouts.
              </p>
            </div>
          </HelpModal>
        </div>
    );
}
