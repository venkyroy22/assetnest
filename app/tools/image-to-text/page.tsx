"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    Upload, Download, Copy, Check, FileText, Info, X, Camera, 
    RefreshCw, Scan, ShieldCheck, ArrowLeft, Package, Sparkles, Lock as LockIcon,
    Image as ImageIcon, HelpCircle
} from "lucide-react";
import { createWorker } from "tesseract.js";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

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

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function ImageToTextPage() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);
    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) { setError("Please upload a valid image file."); return; }
        setError(null); setImage(file); setPreviewUrl(URL.createObjectURL(file));
        setExtractedText(""); setProgress(0);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const extractText = async () => {
        if (!image) return;
        setIsProcessing(true); setError(null); setProgress(0);
        try {
            const worker = await createWorker('eng', 1, {
                logger: m => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)); }
            });
            const { data: { text } } = await worker.recognize(image);
            await worker.terminate();
            if (!text || text.trim().length === 0) setError("No text could be found in this image. Try an image with clearer text.");
            else setExtractedText(text);
        } catch (err) {
            console.error("OCR Error:", err);
            setError("Failed to process image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const downloadText = () => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `Extracted_Text_${Date.now()}.txt`;
        a.click(); setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const reset = () => {
        setImage(null); setPreviewUrl(null); setExtractedText("");
        setError(null); setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3C/svg%3E")`;

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
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
                <FileText size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Image to Text</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Error */}
            {error && (
              <div style={{ padding: "8px 12px", background: "rgba(204,68,68,0.1)", border: `1px solid ${T.border}`, borderRadius: 3, display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.2s ease" }}>
                <Info size={14} style={{ color: T.danger, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 400, color: T.text, flex: 1 }}>{error}</span>
                <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex" }}><X size={14} /></button>
              </div>
            )}

            {!image ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 32, animation: "fadeIn 0.3s ease" }}>
                {/* Description + Chips */}
                <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 16 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                    <Chip icon={<Scan size={10} />} label="Local OCR" />
                  </div>
                  <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>Image to Text Converter</h1>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                    Extract text from screenshots and photos instantly with our client-side OCR engine.
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: `1px dashed ${isDragging ? T.accent : T.border}`, borderRadius: 4,
                    background: isDragging ? T.surface : T.bg, cursor: "pointer", transition: "all 0.2s", padding: 32, maxWidth: 800, margin: "0 auto", width: "100%",
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <Camera size={28} style={{ color: T.textMuted, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>Drag & Drop or Click Here</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
                    <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                    <Chip icon={<Check size={10} />} label="No Server Upload" />
                  </div>
                  <p style={{ fontSize: 10, color: T.textSub, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Supports JPEG, PNG, WebP</p>
                </div>
              </div>
            ) : (
              /* Active Workspace Grid */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", animation: "fadeIn 0.3s ease" }}>
                
                {/* Left Side: Image Preview & Trigger */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: CHECKER, border: `1px solid ${T.border}`, borderRadius: 4, height: 260, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 10 }}>
                    <img src={previewUrl!} alt="OCR Source" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{image.name}</span>
                      <span style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginTop: 2 }}>{(image.size / 1024 / 1024).toFixed(2)} MB • Image</span>
                    </div>
                    <button onClick={reset} style={{ padding: "6px 10px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: T.font }}>
                      <RefreshCw size={10} /> Change
                    </button>
                  </div>
                  <button onClick={extractText} disabled={isProcessing} style={{
                    padding: "12px 16px", background: T.accent, border: "none", borderRadius: 3,
                    color: "#1a1a1a", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: T.font, opacity: isProcessing ? 0.7 : 1, transition: "all 0.12s",
                  }}>
                    {isProcessing ? (
                      <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Processing {progress > 0 ? `${progress}%` : ''}</>
                    ) : (
                      <><FileText size={12} /> Extract Text</>
                    )}
                  </button>
                </div>

                {/* Right Side: Extracted Result */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", minHeight: 350, height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: T.text }}>Extracted Result</h3>
                    {extractedText && (
                      <button onClick={copyToClipboard} style={{
                        padding: "4px 8px", background: copied ? T.success : T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3,
                        color: copied ? "#1a1a1a" : T.text, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: T.font, transition: "all 0.15s"
                      }}>
                        {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>

                  <div style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: 16, overflowY: "auto", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5, color: T.textSub }}>
                    {isProcessing ? (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                        <Scan size={24} style={{ color: T.accent, animation: "spin 2s linear infinite" }} />
                        <span style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Analyzing characters...</span>
                      </div>
                    ) : extractedText ? (
                      <div style={{ whiteSpace: "pre-wrap" }}>{extractedText}</div>
                    ) : (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5 }}>
                        <FileText size={20} />
                        <span style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Click 'Extract Text'<br/>to run OCR engine</span>
                      </div>
                    )}
                  </div>

                  {extractedText && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={downloadText} style={{ flex: 1, padding: "10px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3, color: T.text, fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: T.font }}>
                        <Download size={12} /> Download TXT
                      </button>
                      <button onClick={reset} style={{ flex: 1, padding: "10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, color: T.textSub, fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: T.font }}>
                        <RefreshCw size={12} /> Scan Another
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SEO SECTION ── */}
            {!image && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginTop: 32 }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                  <Chip icon={<ShieldCheck size={11} />} label="100% In-Browser Privacy" />
                  <Chip icon={<Sparkles size={11} />} label="Free & Unlimited" />
                  <Chip icon={<Package size={11} />} label="No Server Uploads" />
                </div>

                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                    Free Image to Text Converter Online with Private OCR
                  </h2>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                    Extract text from screenshots, documents, invoices, and photos instantly using our online OCR tool. Powered by client-side recognition models, our free image to text utility processes your characters entirely in your browser cache for absolute safety.
                  </p>
                </div>

                {/* Feature Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 48 }}>
                  {[
                    { title: "High-Accuracy OCR Engine", desc: "Powered by optimized neural networks that scan pixels and accurately map alphabets, digits, symbols, and formatting structures in seconds.", icon: <Scan size={16} /> },
                    { title: "100% Browser Processing", desc: "Your files never leave your device. Our image to text converter runs OCR calculations entirely inside your local RAM sandbox using WebAssembly.", icon: <ShieldCheck size={16} /> },
                    { title: "Universal Image Formats", desc: "Supports importing standard photo formats including JPG, JPEG, PNG, WebP, and BMP. Works perfectly with copy-pasted screenshots.", icon: <ImageIcon size={16} /> },
                    { title: "One-Click Clipboard Copy", desc: "Quickly copy the complete extracted character blocks to your device clipboard with a single click. Ideal for fast workflows.", icon: <Copy size={16} /> },
                    { title: "Lossless TXT Downloads", desc: "Save your scanned result directly as a raw text container (.txt file) on your hard drive, ready for text editing, archiving, or translations.", icon: <Download size={16} /> },
                    { title: "Free & Unlimited Transcription", desc: "Transcribe as many scanned images, legal notes, or receipts as you want without daily caps, paywalls, or watermark constraints.", icon: <LockIcon size={16} /> },
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
                    How to Extract Text from Image Online
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {[
                      { step: "1", title: "Select or Drop Image", desc: "Drag and drop your screenshot or document photo into the upload drop box, or click browse to choose a file." },
                      { step: "2", title: "Run Character Scanning", desc: "Click the 'Extract Text' action. Tesseract OCR runs client-side calculations and reports real-time progress." },
                      { step: "3", title: "Copy or Download Text", desc: "Inspect the final transcribed text layout, then copy the result to your clipboard or download it as a raw .txt file." },
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
                    <FAQItem question="How does the online image to text converter protect my data privacy?" answer="Our tool runs Tesseract.js client-side inside your browser sandbox. Since no images or document files are uploaded to remote servers, your sensitive notes, invoices, and files remain 100% private." />
                    <FAQItem question="Do I need to register or pay to use this OCR tool?" answer="No. AssetNest provides this tool as a free image to text service. You can extract text from screenshots or photos completely free with no restrictions, registrations, or watermark stamps." />
                    <FAQItem question="What type of photos work best for text extraction?" answer="High-contrast, well-lit images with clear printed text yield the best results. Straightening cropped images and reducing visual noise help the OCR engine map character strings accurately." />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Image to Text">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Visual Optical Character Infrastructure</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                AssetNest Image-to-Text Converter provides a high-performance OCR engine where you can digitize printed or handwritten assets with zero data privacy risk.
              </p>
            </div>
          </HelpModal>
        </div>
    );
}
