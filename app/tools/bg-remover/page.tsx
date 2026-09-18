"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
    Upload, Download, Sparkles, X, RefreshCw,
    Eraser, Info, ArrowLeft, CheckCircle2, Check, ShieldCheck, ChevronDown,
    HelpCircle, Shield, Zap
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
    name: "AI Background Remover",
    description: "Remove backgrounds from your images instantly and for free. 100% private, browser-based processing.",
    url: "https://www.assetnest.space/tools/bg-remover",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function BgRemoverPage() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressMap = useRef(new Map<string, number>());

    useState(() => { setTimeout(() => setMounted(true), 80); });

    const processImage = async (file: File) => {
        setIsLoading(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);
        progressMap.current.clear();

        let progressInterval: any = null;

        try {
            setProgress(5);
            progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 70) return prev + 1;
                    if (prev >= 70 && prev < 98) return prev + 1;
                    return prev;
                });
            }, 250);

            const { removeBackground } = await import("@imgly/background-removal");
            const resultBlob = await removeBackground(file, {
                debug: false,
                model: "isnet_quint8",
                proxyToWorker: true,
                progress: (item, current, total) => {
                    if (total === 0) return;
                    progressMap.current.set(item, current / total);
                    const size = progressMap.current.size;
                    if (size === 0) return;
                    let sum = 0;
                    progressMap.current.forEach(val => { sum += val; });
                    const downloadProgress = sum / size;
                    const p = Math.round(downloadProgress * 70);
                    setProgress(prev => Math.max(prev, Math.min(70, p)));
                },
                output: { format: "image/png", quality: 0.95 }
            });
            const url = URL.createObjectURL(resultBlob);
            setOutputUrl(url);
            setProgress(100);
        } catch (err) {
            console.error(err);
            setError("Failed to remove background. Try an image with a clear subject.");
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            processImage(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            processImage(file);
        }
    };

    const handleDownload = () => {
        if (!outputUrl) return;
        const link = document.createElement("a");
        link.download = `removed-bg_${Date.now()}.png`;
        link.href = outputUrl;
        link.click();
    };

    const reset = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (outputUrl) URL.revokeObjectURL(outputUrl);
        setImage(null); setPreviewUrl(null); setOutputUrl(null);
        setProgress(0); setError(null);
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3C/svg%3E")`;

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            ::-webkit-scrollbar { display: none; }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          `}</style>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
                <Eraser size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Background Remover</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>

            {/* Description + Chips */}
            <div style={{ marginBottom: 16, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip icon={<Shield size={10} />} label="100% Private" />
                <Chip icon={<Sparkles size={10} />} label="AI Powered" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>AI Background Remover</h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Remove backgrounds instantly with on-device AI. Zero uploads, free transparent PNGs.
              </p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

            {/* Error */}
            {error && (
              <div style={{ marginBottom: 16, padding: "8px 12px", background: "rgba(204,68,68,0.1)", border: `1px solid ${T.border}`, borderRadius: 3, display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.2s ease" }}>
                <Info size={14} style={{ color: T.danger, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 400, color: T.text, flex: 1 }}>{error}</span>
                <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex" }}><X size={14} /></button>
              </div>
            )}

            {/* ── UPLOAD STATE ── */}
            {!image ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: `1px dashed ${isDragging ? T.accent : T.border}`,
                    borderRadius: 4, background: isDragging ? T.surface : T.bg,
                    cursor: "pointer", transition: "all 0.2s", padding: 32,
                  }}
                >
                  <Upload size={28} style={{ color: T.textMuted, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>Drag & Drop or Click Here</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
                    <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                    <Chip icon={<Sparkles size={10} />} label="No Server Upload" />
                    <Chip icon={<Check size={10} />} label="Free Forever" />
                  </div>
                  <p style={{ fontSize: 10, color: T.textMuted, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Subject Isolation</p>
                </div>

                <p style={{ textAlign: "center", fontSize: 10, color: T.textMuted }}>
                  For best results, choose images with a high contrast between subject and background.
                </p>

                {/* ── SEO SECTION ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    <Chip icon={<ShieldCheck size={11} />} label="100% Private & Local" />
                    <Chip icon={<Sparkles size={11} />} label="AI Subject Isolation" />
                    <Chip icon={<Check size={11} />} label="Free PNG Cutouts" />
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                      The Best Free Background Remover Online with Local AI
                    </h2>
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                      Instantly remove backgrounds from photos and graphics with our free background remover. Powered by advanced client-side AI, our image background remover lets you isolate subjects and export transparent PNGs entirely on your device with 100% privacy.
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 48 }}>
                    {[
                      { title: "Advanced AI Subject Isolation", desc: "Our state-of-the-art background remover intelligently detects the main subject, delivering high-precision cutouts for portraits, products, and graphics.", icon: <Sparkles size={16} /> },
                      { title: "100% Free Tool", desc: "No subscriptions, no tokens, and no hidden fees. Use our background remover as much as you need, with no output watermarks.", icon: <Check size={16} /> },
                      { title: "Private Browser Processing", desc: "Your source files are processed locally in your browser cache and are never uploaded to any remote servers.", icon: <ShieldCheck size={16} /> },
                      { title: "High-Res Transparent PNGs", desc: "Export your clean cutouts in lossless PNG format with transparency preserved, ready for web design, slides, or social media.", icon: <Download size={16} /> },
                      { title: "Intricate Edge Detection", desc: "Our AI model handles complex visual structures such as fine hair, animal fur, clothing folds, and semi-transparent objects.", icon: <Eraser size={16} /> },
                      { title: "Zero Clicks Required", desc: "Simply drag and drop your image, and let the AI do the rest in seconds. No manual mask painting needed.", icon: <Upload size={16} /> },
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
                      How to Remove Image Backgrounds in Seconds
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      {[
                        { step: "1", title: "Upload Your Photo", desc: "Drag and drop your JPG, PNG, or WebP photo into the workspace, or click to browse files." },
                        { step: "2", title: "AI Automatic Processing", desc: "Our client-side neural network processes the image locally to detect edges and isolate the main subject." },
                        { step: "3", title: "Download Transparent PNG", desc: "Preview the result on a checkerboard background and download the lossless PNG cutout instantly." },
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
                      <FAQItem question="Is this background remover free for commercial use?" answer="Yes, it is a completely free background remover. You can use it to create product listings, marketing images, presentations, or design templates without any cost, attribution, or licenses." />
                      <FAQItem question="How does this background remover protect my privacy?" answer="Unlike other tools that upload your files to external cloud servers, our image background remover utilizes WebAssembly to run the AI model directly in your browser. Your photos never leave your device." />
                      <FAQItem question="Why does it take a few seconds to load the first time?" answer="On your first visit, the app loads the client-side AI model files into your browser memory. Subsequent image cleanups are much faster as the models are cached locally." />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── PROCESSING / RESULT STATE ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
                {/* Result workspace */}
                <div style={{ position: "relative", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
                  {/* Status pill */}
                  <div style={{ position: "absolute", top: 12, left: 12, zIndex: 20, display: "flex", gap: 6 }}>
                    <div style={{ padding: "4px 10px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isLoading ? T.accent : T.success, animation: isLoading ? "pulse 1.5s infinite" : "none" }} />
                      <span style={{ fontSize: 10, fontWeight: 500, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {isLoading ? `Removing Background ${progress}%` : "Success"}
                      </span>
                    </div>
                  </div>

                  {/* Reset button */}
                  {outputUrl && (
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 20 }}>
                      <button onClick={reset} style={{
                        width: 32, height: 32, borderRadius: "50%", background: T.surfaceRaised,
                        border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                        color: T.text, cursor: "pointer", transition: "all 0.12s",
                      }} title="Reset">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}

                  {/* Image area */}
                  <div style={{
                    minHeight: 350, display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
                    backgroundImage: outputUrl ? CHECKER : "none",
                    backgroundColor: outputUrl ? T.bg : T.bg,
                  }}>
                    {isLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.surfaceRaised, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <RefreshCw size={20} style={{ color: T.accent, animation: "spin 1s linear infinite" }} />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 500, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {progress < 10 ? "Initializing AI Models..." : "Subject isolation in progress..."}
                        </p>
                        {/* Progress bar */}
                        <div style={{ width: 200, height: 3, background: T.borderDim, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${progress}%`, height: "100%", background: T.accent, borderRadius: 2, transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={outputUrl || previewUrl || ""}
                        alt="Result"
                        style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 4, border: `1px solid ${T.border}` }}
                      />
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {outputUrl && !isLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button onClick={handleDownload} style={{
                        padding: "12px 16px", background: T.accent, border: "none", borderRadius: 3,
                        color: "#1a1a1a", fontSize: 11, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        fontFamily: T.font, transition: "all 0.12s",
                      }}>
                        <Download size={14} /> Download PNG
                      </button>
                      <button onClick={reset} style={{
                        padding: "12px 16px", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 3,
                        color: T.text, fontSize: 11, fontWeight: 400, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        fontFamily: T.font, transition: "all 0.12s",
                      }}>
                        <RefreshCw size={12} /> Remove Another
                      </button>
                    </div>
                    <div style={{ padding: "10px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3, textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>
                        AI runs in-browser. For best results, use sharp images with high contrast. Intricate borders may occasionally require manual cleanup.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="AI Background Removal">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Visual Subject Isolation</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                AssetNest AI Background Remover provides a high-performance engine for background removal with pixel-perfect precision. Whether generating clean e-commerce assets, professional headshots, or creative marketing collateral, our tool creates transparent PNGs with industry-leading edge detection.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                All processing happens locally in your browser. No login, no servers, 100% private.
              </p>
            </div>
          </HelpModal>

          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
}
