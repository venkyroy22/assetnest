"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    FileImage, Download, Trash2, Upload, ArrowRight,
    CheckCircle2, Image as ImageIcon, Sparkles, ShieldCheck, Check, Info, RefreshCw, ChevronDown, ArrowLeft, HelpCircle
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

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

// ── Types ─────────────────────────────────────────────────────────────────────
type ImageFormat = "png" | "jpg" | "webp";
type ConvStatus = "idle" | "converting" | "done" | "error";

interface FileEntry {
    id: string;
    file: File;
    originalSize: number;
    preview: string;
    status: ConvStatus;
    targetFormat: ImageFormat;
    outputUrl?: string;
    outputSize?: number;
    outputName?: string;
    error?: string;
}

const FORMAT_OPTIONS: { value: ImageFormat; label: string; desc: string }[] = [
    { value: "png", label: "PNG", desc: "Lossless quality, transparency preserved" },
    { value: "jpg", label: "JPG", desc: "Great compression, max compatibility" },
    { value: "webp", label: "WebP", desc: "Next-gen web format, ultra small" },
];

function fmtBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function savingPct(orig: number, out: number) {
    const pct = ((orig - out) / orig) * 100;
    return pct > 0 ? `−${pct.toFixed(1)}%` : `+${Math.abs(pct).toFixed(1)}%`;
}

async function convertImage(
    file: File,
    targetFormat: ImageFormat,
    quality: number,
): Promise<{ url: string; size: number; name: string }> {
    const mimeOut = targetFormat === "png" ? "image/png" : targetFormat === "jpg" ? "image/jpeg" : "image/webp";
    const extOut = targetFormat;
    const q = targetFormat === "png" ? 1 : quality / 100;
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            if (targetFormat === "jpg" || targetFormat === "webp") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(objUrl);
            canvas.toBlob(blob => {
                if (!blob) { reject(new Error("Conversion failed")); return; }
                const url = URL.createObjectURL(blob);
                const name = file.name.replace(/\.[^.]+$/, `.${extOut}`);
                resolve({ url, size: blob.size, name });
            }, mimeOut, q);
        };
        img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("Could not load image")); };
        img.src = objUrl;
    });
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function ImageConverterPage() {
    const [globalFormat, setGlobalFormat] = useState<ImageFormat>("png");
    const [quality, setQuality] = useState(85);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const addFiles = useCallback((incoming: File[]) => {
        const accepted = incoming.filter(f => f.type.startsWith("image/"));
        if (!accepted.length) return;
        const entries: FileEntry[] = accepted.map(f => ({
            id: crypto.randomUUID(),
            file: f, originalSize: f.size,
            preview: URL.createObjectURL(f),
            status: "idle", targetFormat: globalFormat,
        }));
        setFiles(prev => [...prev, ...entries]);
    }, [globalFormat]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const match = prev.find(f => f.id === id);
            if (match) { URL.revokeObjectURL(match.preview); if (match.outputUrl) URL.revokeObjectURL(match.outputUrl); }
            return prev.filter(f => f.id !== id);
        });
    };

    const clearAll = () => {
        files.forEach(f => { URL.revokeObjectURL(f.preview); if (f.outputUrl) URL.revokeObjectURL(f.outputUrl); });
        setFiles([]);
    };

    const changeGlobalFormat = (fmt: ImageFormat) => {
        setGlobalFormat(fmt);
        setFiles(prev => prev.map(f => f.status === "idle" || f.status === "error" ? { ...f, targetFormat: fmt } : f));
    };

    const changeFileTargetFormat = (id: string, fmt: ImageFormat) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: fmt, status: "idle" } : f));
    };

    const convertAll = async () => {
        const toConvert = files.filter(f => f.status === "idle" || f.status === "error");
        if (!toConvert.length) return;
        setFiles(prev => prev.map(f => toConvert.some(c => c.id === f.id) ? { ...f, status: "converting" } : f));
        await Promise.all(toConvert.map(async (entry) => {
            try {
                const result = await convertImage(entry.file, entry.targetFormat, quality);
                setFiles(prev => prev.map(f =>
                    f.id === entry.id ? { ...f, status: "done", outputUrl: result.url, outputSize: result.size, outputName: result.name } : f
                ));
            } catch (e) {
                setFiles(prev => prev.map(f =>
                    f.id === entry.id ? { ...f, status: "error", error: e instanceof Error ? e.message : "Failed" } : f
                ));
            }
        }));
    };

    const downloadOne = (entry: FileEntry) => {
        if (!entry.outputUrl || !entry.outputName) return;
        const a = document.createElement("a"); a.href = entry.outputUrl; a.download = entry.outputName; a.click();
    };

    const downloadAll = () => { files.filter(f => f.status === "done").forEach(f => downloadOne(f)); };

    const doneCount = files.filter(f => f.status === "done").length;
    const pendingCount = files.filter(f => f.status === "idle" || f.status === "error").length;
    const hasLossyTarget = globalFormat !== "png" || files.some(f => f.targetFormat !== "png");

    /* ── Style helpers ── */
    const fmtBtn = (active: boolean): React.CSSProperties => ({
        flex: 1, padding: "10px 8px", borderRadius: 3, textAlign: "left" as const, cursor: "pointer",
        background: active ? T.accent : "transparent",
        border: active ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
        color: active ? "#1a1a1a" : T.textSub,
        transition: "all 0.12s", fontFamily: T.font, position: "relative" as const,
    });

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            input[type=range] { accent-color: ${T.accent}; }
            ::-webkit-scrollbar { display: none; }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          `}</style>

          {/* ── HEADER ── */}
          <header style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/tools" style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
              color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
            }}>
              <ArrowLeft size={11} strokeWidth={2} /> Back
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                <RefreshCw size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Image Converter</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Description + Chips */}
            <div style={{ marginBottom: 0, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                <Chip icon={<Sparkles size={10} />} label="Batch Convert" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>Image Converter</h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Convert between JPG, PNG, and WebP formats with custom quality control - batch processing, 100% in-browser.
              </p>
            </div>

            {/* ── Global Options ── */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Global Conversion Target</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {FORMAT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => changeGlobalFormat(opt.value)} style={fmtBtn(globalFormat === opt.value)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: globalFormat === opt.value ? 600 : 400 }}>{opt.label}</span>
                      {globalFormat === opt.value && <CheckCircle2 size={13} style={{ flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 10, lineHeight: 1.4, margin: 0, color: globalFormat === opt.value ? "#1a1a1a" : T.textMuted }}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Quality Slider */}
              {hasLossyTarget && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Output Quality</span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "#1a1a1a", background: T.accent, padding: "2px 8px", borderRadius: 99 }}>{quality}%</span>
                  </div>
                  <input type="range" min={10} max={105} step={5} value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    style={{ width: "100%", height: 4, cursor: "pointer" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textMuted, marginTop: 4 }}>
                    <span>Max Compression</span><span>Best Quality</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Drop Zone ── */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? T.accent : T.border}`,
                borderRadius: 4, padding: 32,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: 200, cursor: "pointer",
                background: dragging ? T.surface : T.bg,
                transition: "all 0.2s",
              }}
            >
              <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handlePick} />
              <Upload size={24} style={{ color: T.textMuted, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>Drag & Drop or Click Here</div>
              <p style={{ fontSize: 10, color: T.textSub, marginBottom: 12, textAlign: "center" }}>
                Supports JPEG, PNG, WebP, SVG, BMP, GIF · Batch conversion supported
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                <Chip icon={<ShieldCheck size={10} />} label="100% In-Browser" />
                <Chip icon={<Sparkles size={10} />} label="Zero Server Uploads" />
                <Chip icon={<Check size={10} />} label="Unlimited Free Files" />
              </div>
            </div>

            {/* ── Files Queue ── */}
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.3s ease" }}>
                {/* Queue Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                  <span style={{ fontSize: 11, fontWeight: 400, color: T.textSub }}>
                    {files.length} image{files.length !== 1 ? "s" : ""} · {doneCount} converted
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {doneCount > 1 && (
                      <button onClick={downloadAll} style={{
                        padding: "5px 12px", background: T.accentDark, border: "none", borderRadius: 3,
                        color: T.text, fontSize: 10, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4, fontFamily: T.font,
                      }}>
                        <Download size={10} /> Download All
                      </button>
                    )}
                    <button onClick={clearAll} style={{
                      padding: "5px 12px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3,
                      color: T.textSub, fontSize: 10, fontWeight: 400, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, fontFamily: T.font,
                    }}>
                      <Trash2 size={10} /> Clear All
                    </button>
                  </div>
                </div>

                {/* File Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {files.map(entry => (
                    <div key={entry.id} style={{
                      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
                      padding: 10, display: "flex", alignItems: "center", gap: 10,
                    }}>
                      {/* Thumbnail */}
                      <img src={entry.preview} alt={entry.file.name} style={{
                        width: 40, height: 40, objectFit: "cover", borderRadius: 3,
                        border: `1px solid ${T.border}`, flexShrink: 0,
                      }} />

                      {/* File Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.file.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: T.textSub }}>{fmtBytes(entry.originalSize)}</span>
                          {entry.status === "done" && entry.outputSize && (
                            <>
                              <ArrowRight size={9} style={{ color: T.textMuted }} />
                              <span style={{ fontSize: 10, color: T.text, fontWeight: 500 }}>{fmtBytes(entry.outputSize)}</span>
                              <span style={{ fontSize: 9, fontWeight: 500, padding: "1px 5px", borderRadius: 2, background: T.bg, border: `1px solid ${T.border}`, color: T.textSub }}>{savingPct(entry.originalSize, entry.outputSize)}</span>
                            </>
                          )}
                          {entry.status === "converting" && (
                            <span style={{ fontSize: 10, color: T.accent }}>Processing…</span>
                          )}
                          {entry.status === "error" && (
                            <span style={{ fontSize: 10, color: T.danger }}>{entry.error}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {entry.status !== "converting" && entry.status !== "done" && (
                          <select value={entry.targetFormat} onChange={e => changeFileTargetFormat(entry.id, e.target.value as ImageFormat)}
                            style={{
                              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3,
                              padding: "4px 8px", fontSize: 10, fontWeight: 500, color: T.text,
                              cursor: "pointer", fontFamily: T.font,
                            }}>
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                            <option value="webp">WebP</option>
                          </select>
                        )}
                        {entry.status === "done" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={14} style={{ color: T.success, flexShrink: 0 }} />
                            <span style={{ fontSize: 9, fontWeight: 500, color: T.textSub, padding: "2px 5px", borderRadius: 2, background: T.bg, border: `1px solid ${T.border}`, textTransform: "uppercase" }}>{entry.targetFormat}</span>
                            <button onClick={() => downloadOne(entry)} style={{
                              padding: "4px 10px", background: T.accent, border: "none", borderRadius: 3,
                              color: "#1a1a1a", fontSize: 10, fontWeight: 500, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 3, fontFamily: T.font,
                            }}>
                              <Download size={10} /> Save
                            </button>
                          </div>
                        )}
                        {entry.status === "converting" && (
                          <div style={{ width: 16, height: 16, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        )}
                        <button onClick={() => removeFile(entry.id)} style={{
                          padding: 4, background: "none", border: "none",
                          color: T.textMuted, cursor: "pointer", display: "flex",
                        }} title="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Batch Convert */}
                {pendingCount > 0 && (
                  <button onClick={convertAll} style={{
                    width: "100%", padding: "12px 16px", background: T.accent, border: "none", borderRadius: 3,
                    color: "#1a1a1a", fontSize: 11, fontWeight: 500, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: T.font, transition: "all 0.12s",
                  }}>
                    <RefreshCw size={13} /> Convert {pendingCount} File{pendingCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}

            {/* ── SEO SECTION ── */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginTop: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <Chip icon={<ShieldCheck size={11} />} label="100% Safe & Local" />
                <Chip icon={<Sparkles size={11} />} label="Dynamic Conversion" />
                <Chip icon={<Check size={11} />} label="Bulk Processing" />
              </div>

              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                  The Complete Free Image Converter Online
                </h2>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                  Instantly transform your photos, vectors, and layouts with our free image converter. Runs entirely locally in your browser to convert JPG, PNG, and WebP assets with no uploads, absolute data security, and customizable compression.
                </p>
              </div>

              {/* Feature Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 48 }}>
                {[
                  { title: "Dynamic Multi-Format Engine", desc: "Convert images to JPG, PNG, or WebP. Choose formats globally or configure individual formats file-by-file for custom workflows.", icon: <Sparkles size={16} /> },
                  { title: "Batch Processing Support", desc: "Upload multiple photos at once. Convert all queue items and download the completed files with one click.", icon: <Download size={16} /> },
                  { title: "100% Secure & Private", desc: "Your images never touch our servers. All processing is executed locally in your browser cache, protecting your sensitive content.", icon: <ShieldCheck size={16} /> },
                  { title: "Custom Quality Optimization", desc: "Fine-tune output parameters with a custom slider. Control compression density to reduce file weight while maintaining resolution.", icon: <RefreshCw size={16} /> },
                  { title: "No Watermarks or Subscriptions", desc: "Use our image converter free without signup, token limits, or watermarks. Export full-resolution files instantly.", icon: <Check size={16} /> },
                  { title: "Lossless Transparency", desc: "Convert files while fully preserving PNG alpha channels. White background backdrops are applied safely to prevent blank spaces.", icon: <FileImage size={16} /> },
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
                  How to Convert Images in Three Simple Steps
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    { step: "1", title: "Select or Drop Images", desc: "Drag and drop your JPEG, PNG, WebP, GIF, SVG, or BMP files directly into the workspace dropzone." },
                    { step: "2", title: "Configure Format & Quality", desc: "Select the target format globally or configure per-file targets. Adjust the quality slider for size optimization." },
                    { step: "3", title: "Convert and Download", desc: "Click Convert to run local processing. Once done, download individual files or download all as a batch." },
                  ].map(s => (
                    <div key={s.step} style={{ padding: 12, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 20 }}>
                      <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.step}</div>
                      <h4 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 6px" }}>{s.title}</h4>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32, marginBottom: 48 }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 8 }}>
                  AssetNest Local Converter vs. Cloud Converters
                </h3>
                <p style={{ fontSize: 10, color: T.textMuted, textAlign: "center", marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
                  See how our local-first web-converter compares to traditional server-side conversion services.
                </p>
                <div style={{ background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.text }}>Feature</th>
                        <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.accent }}>AssetNest</th>
                        <th style={{ padding: 10, textAlign: "left", fontWeight: 500, color: T.textSub }}>Cloud Converters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feat: "File Security", ours: "100% Private (never leaves browser)", other: "Risky (uploaded to third-party servers)" },
                        { feat: "Processing", ours: "Instant local Canvas conversion", other: "Subject to network speeds & queues" },
                        { feat: "Limits", ours: "Unlimited, free forever", other: "Daily caps or paid plans" },
                        { feat: "Batch Control", ours: "Per-file + global output settings", other: "Single-mode or complex setup" },
                        { feat: "Offline", ours: "Works offline once loaded", other: "Requires internet connection" },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < 4 ? `1px solid ${T.borderDim}` : "none" }}>
                          <td style={{ padding: 10, fontWeight: 500, color: T.text }}>{row.feat}</td>
                          <td style={{ padding: 10, color: T.accent }}>{row.ours}</td>
                          <td style={{ padding: 10, color: T.textSub }}>{row.other}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FAQ */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>Frequently Asked Questions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FAQItem question="Is this image converter free for commercial assets?" answer="Yes. The image converter is completely unlimited. You can convert graphic layouts, design templates, and e-commerce assets without any costs or attribution requirements." />
                  <FAQItem question="Can I convert multiple formats in a single batch?" answer="Yes! You can upload a mix of JPEG, PNG, WebP, and other images together. Our tool lets you select the output format dynamically for each file in the queue before converting." />
                  <FAQItem question="Why does converting JPG to PNG sometimes make files larger?" answer="PNG is a lossless format, whereas JPG is highly compressed and lossy. Converting JPG to PNG reconstructs the image pixels in a lossless container, which naturally increases the size. For optimization, we recommend using WebP output." />
                  <FAQItem question="How secure are my uploaded files?" answer="They are completely secure. Since our tool runs local JavaScript inside your browser, no images are uploaded to any servers. All operations happen entirely on your computer or device." />
                </div>
              </div>
            </div>
          </div>

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Image Converter">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Visual Asset Portability Engine</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                AssetNest Image Converter provides a local web-engine to pivot between common media formats (PNG, JPG, WebP) with precise quality control. Whether generating optimized WebP assets for fast browser loads or isolating assets into transparent PNG containers, all processing happens locally with zero network latency.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                All files are processed locally in your browser. No login, no servers, 100% private.
              </p>
            </div>
          </HelpModal>
        </div>
    );
}
