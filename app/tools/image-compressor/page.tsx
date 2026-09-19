"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    Upload, Download, ImageIcon, Zap, X, RefreshCw,
    Scissors, AlertTriangle, Info, Maximize2, Check,
    Shield, Sparkles, Cpu, Eye, HelpCircle, ChevronDown, ArrowLeft
} from "lucide-react";
import HelpModal from "@/components/HelpModal";

/* ─────────────────────────────────────────
   DESIGN TOKENS (matches QR tool)
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

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image Compressor",
    description: "Compress JPEG, PNG, and WebP images instantly in your browser. Reduce image file size with zero quality loss. No uploads, 100% private, completely free.",
    url: "https://assetnest.gloyas.com/tools/image-compressor",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function ImageCompressorPage() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [compressedDims, setCompressedDims] = useState<{ w: number; h: number } | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [quality, setQuality] = useState<number>(75);
    const [maxDim, setMaxDim] = useState<number>(1920);
    const [outputFormat, setOutputFormat] = useState<string>("image/jpeg");
    const [isCompressing, setIsCompressing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hasCompressed, setHasCompressed] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sliderPosition, setSliderPosition] = useState(50);
    const [isSliderDragging, setIsSliderDragging] = useState(false);
    const [viewMode, setViewMode] = useState<"split" | "side-by-side" | "original" | "compressed">("side-by-side");
    const sliderContainerRef = useRef<HTMLDivElement>(null);

    const [lightbox, setLightbox] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>("");

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getSavings = () => {
        if (!originalSize || !compressedSize) return 0;
        return Math.round(((originalSize - compressedSize) / originalSize) * 100);
    };

    const compress = useCallback(
        (file: File, q: number, format: string, dim: number) => {
            setIsCompressing(true);
            setHasCompressed(false);
            setTimeout(() => {
                const objectUrl = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    let { naturalWidth: w, naturalHeight: h } = img;
                    if (w > dim || h > dim) {
                        if (w >= h) { h = Math.round(h * (dim / w)); w = dim; }
                        else { w = Math.round(w * (dim / h)); h = dim; }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext("2d")!;
                    if (format === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
                    ctx.drawImage(img, 0, 0, w, h);
                    const qualityArg = format === "image/png" ? undefined : q / 100;
                    canvas.toBlob((blob) => {
                        if (blob) {
                            if (compressedUrl) URL.revokeObjectURL(compressedUrl);
                            const url = URL.createObjectURL(blob);
                            setCompressedUrl(url); setCompressedSize(blob.size);
                            setCompressedDims({ w, h }); setHasCompressed(true);
                        }
                        setIsCompressing(false);
                    }, format, qualityArg);
                };
                img.onerror = () => setIsCompressing(false);
                img.src = objectUrl;
            }, 800);
        }, [compressedUrl],
    );

    const loadFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setOriginalFile(file); setOriginalSize(file.size);
        setCompressedUrl(null); setCompressedSize(0); setCompressedDims(null); setHasCompressed(false);
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            setOriginalPreview(src);
            const img = new Image();
            img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = src;
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) loadFile(file); };

    const handleDownload = () => {
        if (!compressedUrl || !originalFile) return;
        const ext = outputFormat === "image/jpeg" ? "jpg" : outputFormat.split("/")[1];
        const name = `${originalFile.name.replace(/\.[^.]+$/, "")}_compressed.${ext}`;
        const a = document.createElement("a"); a.href = compressedUrl; a.download = name; a.click();
        window.dispatchEvent(new CustomEvent("assetnest-download", { detail: { filename: name, size: formatBytes(compressedSize) } }));
    };

    const reset = () => {
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        setOriginalFile(null); setOriginalPreview(null); setOriginalDims(null);
        setCompressedUrl(null); setOriginalSize(0);
        setCompressedSize(0); setCompressedDims(null); setHasCompressed(false);
        setSliderPosition(50); setViewMode("side-by-side");
    };

    const handleSliderMove = useCallback((clientX: number) => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    }, []);

    useEffect(() => {
        const up = () => setIsSliderDragging(false);
        const mm = (e: MouseEvent) => { if (isSliderDragging) handleSliderMove(e.clientX); };
        const tm = (e: TouchEvent) => { if (isSliderDragging && e.touches[0]) handleSliderMove(e.touches[0].clientX); };
        window.addEventListener("mouseup", up); window.addEventListener("touchend", up);
        window.addEventListener("mousemove", mm); window.addEventListener("touchmove", tm);
        return () => { window.removeEventListener("mouseup", up); window.removeEventListener("touchend", up); window.removeEventListener("mousemove", mm); window.removeEventListener("touchmove", tm); };
    }, [isSliderDragging, handleSliderMove]);

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3C/svg%3E")`;
    const savings = getSavings();

    /* ── Style helpers ── */
    const accentBtn = (disabled = false): React.CSSProperties => ({
        width: "100%", padding: "10px 12px", background: disabled ? T.surfaceRaised : T.accent,
        border: "none", borderRadius: 3, color: disabled ? T.textSub : "#1a1a1a",
        fontSize: 11, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: T.font, transition: "all 0.12s", opacity: disabled ? 0.5 : 1,
    });
    const surfaceBtn: React.CSSProperties = {
        flex: 1, padding: "8px 12px", borderRadius: 3,
        background: T.surfaceRaised, border: `1px solid ${T.border}`,
        color: T.text, fontSize: 11, fontWeight: 400, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        fontFamily: T.font, transition: "all 0.12s",
    };
    const pillBtn = (active: boolean): React.CSSProperties => ({
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "8px 4px", borderRadius: 3,
        background: active ? T.accent : "transparent",
        border: active ? `1px solid ${T.accent}` : "1px solid transparent",
        color: active ? "#1a1a1a" : T.textSub,
        fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer",
        transition: "all 0.12s", fontFamily: T.font,
    });
    const tabBtn = (active: boolean): React.CSSProperties => ({
        padding: "5px 10px", borderRadius: 2,
        background: active ? "#505050" : "transparent",
        border: active ? "1px solid #666" : "1px solid transparent",
        color: active ? "#fff" : T.textMuted,
        fontSize: 10, fontWeight: 400, cursor: "pointer",
        transition: "all 0.12s", fontFamily: T.font,
    });
    const presetBtn = (active: boolean): React.CSSProperties => ({
        flex: 1, padding: "5px 4px", borderRadius: 3,
        background: active ? T.accent : T.bg,
        border: `1px solid ${active ? T.accent : T.border}`,
        color: active ? "#1a1a1a" : T.textSub,
        fontSize: 9, fontWeight: active ? 600 : 400, cursor: "pointer",
        transition: "all 0.12s", fontFamily: T.font,
    });

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            input[type=range] { accent-color: ${T.accent}; }
            ::-webkit-scrollbar { display: none; }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
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
                <Scissors size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Image Compressor</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

            {/* Description + Chips */}
            <div style={{ marginBottom: 16, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip icon={<Shield size={10} />} label="100% Private" />
                <Chip icon={<Zap size={10} />} label="Client-side" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>Image Compressor</h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Shrink JPEG, PNG, and WebP images by up to 90% - processed entirely in your browser, never uploaded.
              </p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />

            {/* ── UPLOAD STATE ── */}
            {!originalFile && (
              <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: `1px dashed ${isDragging ? T.accent : T.border}`,
                    borderRadius: 4, background: isDragging ? T.surface : T.bg,
                    cursor: "pointer", transition: "all 0.2s", padding: 32,
                  }}
                >
                  <Upload size={28} style={{ color: T.textMuted, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>Drag & Drop or Click Here</div>
                  <p style={{ fontSize: 11, color: T.textSub, marginBottom: 16 }}>JPEG, PNG, WebP supported · No Server Upload</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <Chip icon={<Shield size={10} />} label="100% Private" />
                    <Chip icon={<Cpu size={10} />} label="Browser-Side" />
                    <Chip icon={<Sparkles size={10} />} label="Free Forever" />
                  </div>
                </div>

                {/* ── SEO SECTION ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    <Chip icon={<Shield size={11} />} label="100% Private" />
                    <Chip icon={<Cpu size={11} />} label="Browser-Side" />
                    <Chip icon={<Check size={11} />} label="No Watermarks" />
                  </div>
                  <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                      Free Image Compressor with No Quality Loss
                    </h2>
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                      Shrink JPEG, PNG, and WebP image sizes by up to 90% instantly inside your browser. AssetNest processes your assets 100% locally with zero server uploads, preserving pixel-perfect visual fidelity.
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 48 }}>
                    {[
                      { title: "Security & Privacy First", desc: "Your data is strictly confidential. All compression happens locally inside your browser-no files are ever uploaded.", icon: <Shield size={16} /> },
                      { title: "Lightning Fast Speed", desc: "Instant file resizing and re-encoding powered by modern browser APIs with zero server latency.", icon: <Zap size={16} /> },
                      { title: "100% Free & Unlimited", desc: "No forced watermark stamps, registration prompts, or usage caps. Optimize as many images as you need.", icon: <Check size={16} /> },
                      { title: "Lossy & Lossless Lever", desc: "Fine-tune JPEG and WebP quality via sliders or scale down original dimensions to reduce weight exponentially.", icon: <Maximize2 size={16} /> },
                      { title: "Format Evolution", desc: "Convert heavy PNGs into modern WebP formats for faster page load times and standard web optimization.", icon: <RefreshCw size={16} /> },
                      { title: "Precision Capping", desc: "Restrict maximum dimensions to automatically scale down large phone photography for web-friendly shares.", icon: <Scissors size={16} /> },
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

                  {/* How-to Steps */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginBottom: 48 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>
                      How to Compress Images Online for Free
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                      {[
                        { step: "1", title: "Select Your Images", desc: "Drag & drop your files into the upload box or click to select files locally." },
                        { step: "2", title: "Fine-Tune Settings", desc: "Adjust quality sliders, scale down dimensions, or pick your desired format." },
                        { step: "3", title: "Download & Save", desc: "Click Compress, check size reduction, and download your optimized image." },
                      ].map(s => (
                        <div key={s.step} style={{ padding: 12, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 20 }}>
                          <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.step}</div>
                          <h4 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 6px" }}>{s.title}</h4>
                          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Format comparison */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginBottom: 48 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>Choosing the Right Image Format</h3>
                    <div style={{ background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                            <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.text }}>Capability</th>
                            <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.accent }}>WebP</th>
                            <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.text }}>JPEG</th>
                            <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.textSub }}>PNG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { cap: "Compression", webp: "Highest (25-30% < JPG)", jpeg: "High", png: "Low" },
                            { cap: "Transparency", webp: "Yes", jpeg: "No", png: "Yes" },
                            { cap: "Best Use", webp: "Web performance", jpeg: "Photos & emails", png: "Logos & text" },
                            { cap: "Browser Support", webp: "98%", jpeg: "100%", png: "100%" },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: i < 3 ? `1px solid ${T.borderDim}` : "none" }}>
                              <td style={{ padding: 10, fontWeight: 500, color: T.text }}>{row.cap}</td>
                              <td style={{ padding: 10, color: T.accent }}>{row.webp}</td>
                              <td style={{ padding: 10, color: T.textSub }}>{row.jpeg}</td>
                              <td style={{ padding: 10, color: T.textSub }}>{row.png}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>Frequently Asked Questions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
                      <FAQItem question="Is my data secure?" answer="Yes. We use HTML5 Canvas APIs for local processing. Your images never touch any server, providing 100% privacy." />
                      <FAQItem question="Which formats are supported?" answer="We support JPEG, PNG, and WebP. You can also convert between these formats during the compression process." />
                      <FAQItem question="Is there a file size limit?" answer="There are no server-side limits. You can process images as large as your browser's memory allows-typically up to 50MB per file." />
                      <FAQItem question="Will it slow down my computer?" answer="Compression is a CPU-intensive task, but our engine is optimized to run efficiently in the background without freezing your browser." />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVE WORKSPACE ── */}
            {originalFile && (
              <div style={{ display: "grid", gridTemplateColumns: hasCompressed ? "1fr 1.4fr" : "1fr", gap: 20, alignItems: "start" }}>

                {/* ── Control Panel ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 14, display: "flex", flexDirection: "column", gap: 14, order: hasCompressed ? 1 : 1 }}>
                  {/* File header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <ImageIcon size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{originalFile.name}</div>
                        <div style={{ fontSize: 9, color: T.textSub }}>{formatBytes(originalSize)}{originalDims ? ` · ${originalDims.w}×${originalDims.h}` : ""}</div>
                      </div>
                    </div>
                    <button onClick={reset} style={{ padding: 4, background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex" }} title="Remove"><X size={12} /></button>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Output Format</div>
                    <div style={{ display: "flex", gap: 0, background: T.bg, padding: 2, borderRadius: 3, border: `1px solid ${T.border}` }}>
                      {[
                        { id: "image/jpeg", label: "JPEG", desc: "Best for Photos" },
                        { id: "image/webp", label: "WebP", desc: "Modern & Small" },
                        { id: "image/png", label: "PNG", desc: "Lossless / Logo" },
                      ].map((fmt) => (
                        <button key={fmt.id} onClick={() => { setOutputFormat(fmt.id); setHasCompressed(false); }} style={pillBtn(outputFormat === fmt.id)}>
                          <span style={{ fontSize: 11, fontWeight: outputFormat === fmt.id ? 600 : 400 }}>{fmt.label}</span>
                          <span style={{ fontSize: 8, marginTop: 2, color: outputFormat === fmt.id ? "#1a1a1a" : T.textMuted }}>{fmt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PNG Note */}
                  {outputFormat === "image/png" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "rgba(77,184,212,0.1)", border: `1px solid ${T.border}`, borderRadius: 3 }}>
                      <Info size={13} style={{ color: T.accent, marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 10, color: T.textSub, lineHeight: 1.5, margin: 0 }}>
                        <span style={{ color: T.text, fontWeight: 500 }}>PNG is lossless.</span> Quality slider disabled. Resize dimensions to compress, or convert to WebP/JPEG for 90%+ savings.
                      </p>
                    </div>
                  )}

                  {/* Quality Slider */}
                  <div style={{ opacity: outputFormat === "image/png" ? 0.3 : 1, pointerEvents: outputFormat === "image/png" ? "none" : "auto", transition: "opacity 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Compression Quality</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: "#1a1a1a", background: T.accent, padding: "2px 8px", borderRadius: 99 }}>{quality}%</span>
                    </div>
                    <input type="range" min={1} max={100} value={quality}
                      onChange={(e) => { setQuality(Number(e.target.value)); setHasCompressed(false); }}
                      disabled={outputFormat === "image/png"}
                      style={{ width: "100%", height: 4, cursor: "pointer" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textMuted, marginTop: 4 }}>
                      <span>Smallest File</span><span>Original (100%)</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {[{ label: "High Comp (40%)", val: 40 }, { label: "Balanced (75%)", val: 75 }, { label: "Vibrant (90%)", val: 90 }].map(p => (
                        <button key={p.val} onClick={() => { setQuality(p.val); setHasCompressed(false); }} style={presetBtn(quality === p.val)}>{p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Max Dimensions Slider */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Maximize2 size={10} style={{ color: T.textMuted }} />
                        <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Dimension</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, color: T.text, background: T.bg, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.border}` }}>{maxDim}px</span>
                    </div>
                    <input type="range" min={320} max={4096} step={64} value={maxDim}
                      onChange={(e) => { setMaxDim(Number(e.target.value)); setHasCompressed(false); }}
                      style={{ width: "100%", height: 4, cursor: "pointer" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textMuted, marginTop: 4 }}>
                      <span>Fast / Tiny</span><span>Full Res (4096px)</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                      {[{ label: "Web (800)", val: 800 }, { label: "HD (1280)", val: 1280 }, { label: "FHD (1920)", val: 1920 }, { label: "4K (3840)", val: 3840 }].map(p => (
                        <button key={p.val} onClick={() => { setMaxDim(p.val); setHasCompressed(false); }} style={{ ...presetBtn(maxDim === p.val), minWidth: 60 }}>{p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ paddingTop: 4 }}>
                    {!hasCompressed ? (
                      <button onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)} disabled={isCompressing} style={accentBtn(isCompressing)}>
                        {isCompressing ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Compressing…</> : <><Scissors size={13} /> Compress Image</>}
                      </button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button onClick={handleDownload} style={{ ...accentBtn(), background: T.accentDark, color: T.text }}>
                          <Download size={14} /> Download ({formatBytes(compressedSize)})
                        </button>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => originalFile && compress(originalFile, quality, outputFormat, maxDim)} disabled={isCompressing} style={surfaceBtn}>
                            <RefreshCw size={11} style={isCompressing ? { animation: "spin 1s linear infinite" } : {}} /> Re-compress
                          </button>
                          <button onClick={reset} style={surfaceBtn}>
                            <X size={11} /> New Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {hasCompressed && compressedSize > originalSize && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.border}`, borderRadius: 3 }}>
                      <AlertTriangle size={13} style={{ color: T.warning, marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 10, color: T.textSub, lineHeight: 1.5, margin: 0 }}>
                        <span style={{ color: T.warning, fontWeight: 500 }}>File size increased!</span> Re-encoding highly optimized assets can inflate sizes. Try lowering quality or converting to WebP.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Comparison View ── */}
                {hasCompressed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, order: 2 }}>
                    {/* View mode tabs + savings */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", gap: 0, background: T.surface, padding: 2, borderRadius: 3, border: `1px solid ${T.border}` }}>
                        {[
                          { id: "split", label: "Split" },
                          { id: "side-by-side", label: "Side by Side" },
                          { id: "original", label: "Original" },
                          { id: "compressed", label: "Compressed" },
                        ].map(m => (
                          <button key={m.id} onClick={() => setViewMode(m.id as any)} style={tabBtn(viewMode === m.id)}>{m.label}</button>
                        ))}
                      </div>
                      {compressedSize > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(77,184,212,0.15)", borderRadius: 99, border: `1px solid ${T.border}` }}>
                          <Sparkles size={10} style={{ color: T.accent }} />
                          <span style={{ fontSize: 10, fontWeight: 500, color: T.accent }}>Saved {savings}%</span>
                        </div>
                      )}
                    </div>

                    {/* Workspace */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 10, minHeight: 360, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      {/* Fullscreen button */}
                      <button onClick={() => {
                        const isOrig = viewMode === "original";
                        setLightboxSrc(isOrig ? originalPreview : (compressedUrl || originalPreview));
                        setLightboxTitle(isOrig ? `Original (${formatBytes(originalSize)})` : `Compressed (${formatBytes(compressedSize)})`);
                        setLightbox(true);
                      }} style={{ position: "absolute", top: 8, right: 8, zIndex: 30, padding: "4px 8px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 400, fontFamily: T.font }}>
                        <Maximize2 size={11} /> Preview
                      </button>

                      {/* Split */}
                      {viewMode === "split" && (
                        <div ref={sliderContainerRef} onMouseDown={() => setIsSliderDragging(true)} onTouchStart={() => setIsSliderDragging(true)}
                          style={{ position: "relative", width: "100%", height: 400, background: T.bg, borderRadius: 3, overflow: "hidden", cursor: "ew-resize", userSelect: "none", border: `1px solid ${T.border}` }}>
                          <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: CHECKER }} />
                          {/* Compressed (background) */}
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                            {isCompressing ? <RefreshCw size={24} style={{ color: T.textMuted, animation: "spin 1s linear infinite" }} /> :
                              hasCompressed && compressedUrl ? <img src={compressedUrl} alt="Compressed" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} /> :
                              <span style={{ fontSize: 10, color: T.textMuted }}>Awaiting compression</span>}
                            <span style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 6px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 9, fontWeight: 500, color: T.text, zIndex: 20 }}>COMPRESSED</span>
                          </div>
                          {/* Original (clipped) */}
                          {originalPreview && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 8, clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`, zIndex: 10 }}>
                              <img src={originalPreview} alt="Original" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
                              <span style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 6px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 9, fontWeight: 500, color: T.textSub, zIndex: 20 }}>ORIGINAL</span>
                            </div>
                          )}
                          {/* Slider line */}
                          <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: T.text, left: `${sliderPosition}%`, zIndex: 15 }}>
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 28, height: 28, borderRadius: "50%", background: T.surfaceRaised, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", zIndex: 20 }}>
                              <div style={{ display: "flex", gap: 2 }}>
                                <span style={{ width: 1.5, height: 10, background: T.text, borderRadius: 1 }} />
                                <span style={{ width: 1.5, height: 10, background: T.text, borderRadius: 1 }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Side by Side */}
                      {viewMode === "side-by-side" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                          {/* Original */}
                          <div style={{ border: `1px solid ${T.border}`, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                              <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase" }}>Original</span>
                              <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub }}>{formatBytes(originalSize)}</span>
                            </div>
                            <div style={{ padding: 10, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                              <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: CHECKER }} />
                              {originalPreview && <img src={originalPreview} alt="Original" onClick={() => { setLightboxSrc(originalPreview); setLightboxTitle(`Original (${formatBytes(originalSize)})`); setLightbox(true); }} style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", position: "relative", zIndex: 10, cursor: "zoom-in" }} />}
                            </div>
                          </div>
                          {/* Compressed */}
                          <div style={{ border: `1px solid ${T.border}`, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                              <span style={{ fontSize: 10, fontWeight: 400, color: T.accent, textTransform: "uppercase" }}>Compressed</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {hasCompressed && <span style={{ fontSize: 9, fontWeight: 500, color: "#1a1a1a", background: T.accent, padding: "1px 5px", borderRadius: 2 }}>-{savings}%</span>}
                                <span style={{ fontSize: 10, fontWeight: 400, color: T.text }}>{hasCompressed ? formatBytes(compressedSize) : "-"}</span>
                              </div>
                            </div>
                            <div style={{ padding: 10, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                              <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: CHECKER }} />
                              {isCompressing ? <RefreshCw size={16} style={{ color: T.textMuted, animation: "spin 1s linear infinite" }} /> :
                                hasCompressed && compressedUrl ? <img src={compressedUrl} alt="Compressed" onClick={() => { setLightboxSrc(compressedUrl); setLightboxTitle(`Compressed (${formatBytes(compressedSize)})`); setLightbox(true); }} style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", position: "relative", zIndex: 10, cursor: "zoom-in" }} /> :
                                <span style={{ fontSize: 10, color: T.textMuted }}>Awaiting Compression</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Original fullscreen */}
                      {viewMode === "original" && (
                        <div style={{ width: "100%", height: 400, border: `1px solid ${T.border}`, borderRadius: 3, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 10, position: "relative" }}>
                          <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: CHECKER }} />
                          {originalPreview && <img src={originalPreview} alt="Original" onClick={() => { setLightboxSrc(originalPreview); setLightboxTitle(`Original (${formatBytes(originalSize)})`); setLightbox(true); }} style={{ maxHeight: 380, maxWidth: "100%", objectFit: "contain", position: "relative", zIndex: 10, cursor: "zoom-in" }} />}
                          <span style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 6px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 9, fontWeight: 500, color: T.textSub, zIndex: 20 }}>Original · {formatBytes(originalSize)}</span>
                        </div>
                      )}

                      {/* Compressed fullscreen */}
                      {viewMode === "compressed" && (
                        <div style={{ width: "100%", height: 400, border: `1px solid ${T.border}`, borderRadius: 3, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 10, position: "relative" }}>
                          <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: CHECKER }} />
                          {isCompressing ? <RefreshCw size={24} style={{ color: T.textMuted, animation: "spin 1s linear infinite" }} /> :
                            hasCompressed && compressedUrl ? <img src={compressedUrl} alt="Compressed" onClick={() => { setLightboxSrc(compressedUrl); setLightboxTitle(`Compressed (${formatBytes(compressedSize)})`); setLightbox(true); }} style={{ maxHeight: 380, maxWidth: "100%", objectFit: "contain", position: "relative", zIndex: 10, cursor: "zoom-in" }} /> :
                            <span style={{ fontSize: 10, color: T.textMuted }}>Awaiting compression...</span>}
                          <span style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 6px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 9, fontWeight: 500, color: T.text, zIndex: 20 }}>Compressed · {hasCompressed ? formatBytes(compressedSize) : "-"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── LIGHTBOX ── */}
          {lightbox && lightboxSrc && (
            <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: T.surface, borderRadius: 4, border: `1px solid ${T.border}`, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{lightboxTitle || originalFile?.name}</span>
                  <button onClick={() => setLightbox(false)} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", display: "flex", padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ background: T.bg, borderRadius: 4, padding: 16, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={lightboxSrc} alt="Preview" style={{ width: "100%", height: "auto", display: "block", borderRadius: 4 }} />
                </div>
                {hasCompressed && (
                  <button onClick={handleDownload} style={{ width: "100%", padding: 12, background: T.accentDark, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: T.font }}>
                    <Download size={14} /> Download Compressed ({formatBytes(compressedSize)})
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: T.textMuted }}>
                  <Shield size={12} /> Processed in your browser · Zero data sent
                </div>
              </div>
            </div>
          )}

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Image Compressor">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Ultra-Efficient Image Minification</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                Optimize your digital footprint with the AssetNest Professional Image Compressor. Shrink JPEG, PNG, and WebP assets by up to 90% without losing visual clarity. All processing is browser-native and completely private.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                All files are processed locally in your browser. No login, no servers, 100% private.
              </p>
            </div>
          </HelpModal>

          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
