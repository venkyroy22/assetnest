"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  Copy, Download, QrCode, Sparkles, Wand2, Upload, Trash2,
  Image as ImageIcon, Smile, Star, ChevronDown, Maximize,
  ImagePlus, Square, Check, ShieldCheck, Info, Zap, Lock, Globe
} from "lucide-react";

/* ─── Design Tokens ─── */
const PALETTE = {
  bg: "#0a0a0b",
  surface: "#111113",
  surfaceHover: "#18181b",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  accent: "#c8f135",        // vivid lime — the one bold accent
  accentDim: "#8fb320",
  textPrimary: "#f5f5f4",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
};

const FG_PRESETS = ["#0a0a0b", "#1e293b", "#1e3a8a", "#581c87", "#881337", "#064e3b"];
const BG_PRESETS = ["#ffffff", "#f8fafc", "#fffbeb", "#f0fdf4", "#eff6ff", "#fdf4ff"];

type PatternType = "square" | "dots" | "rounded" | "star" | "emoji" | "logo";
type CornerType  = "square" | "dots" | "rounded" | "heart";

/* ─── Tiny helpers ─── */
const Tag = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 10px", borderRadius: 99,
    background: "rgba(200,241,53,0.07)",
    border: "1px solid rgba(200,241,53,0.15)",
    fontSize: 11, fontWeight: 600, color: PALETTE.accent,
    letterSpacing: "0.04em",
  }}>
    {icon}{label}
  </span>
);

const SectionCard = ({
  id, open, onToggle, icon, title, subtitle, children,
}: {
  id: string; open: boolean; onToggle: () => void;
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) => (
  <div style={{
    borderRadius: 20,
    border: `1px solid ${open ? "rgba(200,241,53,0.2)" : PALETTE.border}`,
    background: open ? "rgba(200,241,53,0.025)" : PALETTE.surface,
    overflow: "hidden",
    transition: "border-color 0.25s, background 0.25s",
  }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 22px", cursor: "pointer",
        background: "none", border: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: open ? "rgba(200,241,53,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(200,241,53,0.25)" : PALETTE.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: open ? PALETTE.accent : PALETTE.textMuted,
          transition: "all 0.25s", flexShrink: 0,
        }}>{icon}</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE.textPrimary, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 11, color: PALETTE.textMuted, marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
      <ChevronDown size={16} style={{
        color: PALETTE.textMuted,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s",
        flexShrink: 0,
      }} />
    </button>

    <div style={{
      maxHeight: open ? 2000 : 0,
      overflow: "hidden",
      opacity: open ? 1 : 0,
      transition: "max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
    }}>
      <div style={{
        padding: "0 22px 22px",
        borderTop: `1px solid rgba(255,255,255,0.05)`,
        paddingTop: 20,
      }}>
        {children}
      </div>
    </div>
  </div>
);

const PatternBtn = ({ id, label, icon, active, onClick }: {
  id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8,
    padding: "14px 8px", borderRadius: 14,
    border: `1px solid ${active ? PALETTE.accent : PALETTE.border}`,
    background: active ? "rgba(200,241,53,0.08)" : PALETTE.bg,
    color: active ? PALETTE.accent : PALETTE.textMuted,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
    cursor: "pointer", transition: "all 0.2s",
    textTransform: "uppercase",
  }}>
    <div style={{ opacity: active ? 1 : 0.6 }}>{icon}</div>
    <span style={{ color: active ? PALETTE.accent : PALETTE.textSecondary }}>{label}</span>
  </button>
);

export default function QRGeneratorPage() {
  const [url, setUrl]           = useState("");
  const [fgColor, setFgColor]   = useState("#000000");
  const [bgColor, setBgColor]   = useState("#ffffff");
  const [patternType, setPatternType] = useState<PatternType>("rounded");
  const [cornerType, setCornerType]   = useState<CornerType>("rounded");
  const [openSection, setOpenSection] = useState<string>("pattern");
  const [mounted, setMounted]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc]   = useState<string | null>(null);
  const [urlFocused, setUrlFocused]     = useState(false);

  const [emojiChar, setEmojiChar]   = useState("✦");
  const [patternLogo, setPatternLogo] = useState<string | null>(null);
  const [centerLogo, setCenterLogo]   = useState<string | null>(null);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const patternInputRef = useRef<HTMLInputElement>(null);
  const centerInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; });

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) => {
    let rot = (Math.PI / 2) * 3, step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer); rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner); rot += step;
    }
    ctx.lineTo(cx, cy - outer); ctx.closePath(); ctx.fill();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const d = Math.min(w, h), k = x + w / 2;
    ctx.beginPath(); ctx.moveTo(k, y + d / 4);
    ctx.quadraticCurveTo(k, y, x + w / 4, y); ctx.quadraticCurveTo(x, y, x, y + d / 2.25);
    ctx.quadraticCurveTo(x, y + d * 0.65, k, y + d); ctx.quadraticCurveTo(x + w, y + d * 0.65, x + w, y + d / 2.25);
    ctx.quadraticCurveTo(x + w, y, x + w * 0.75, y); ctx.quadraticCurveTo(k, y, k, y + d / 4);
    ctx.fill();
  };

  const renderQR = useCallback(async (isDownload = false) => {
    const canvas = isDownload ? document.createElement("canvas") : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const size = isDownload ? 2048 : 1024;
    canvas.width = size; canvas.height = size;

    let matrix: any;
    try {
      const qr = (QRCode as any).create(url || "https://assetnest.design", { errorCorrectionLevel: "H" });
      matrix = qr.modules;
    } catch { return; }

    const margin = size * 0.05;
    const innerSize = size - margin * 2;
    const moduleCount = matrix.size;
    const cellSize = innerSize / moduleCount;

    let pImg: HTMLImageElement | null = null;
    if (patternType === "logo" && patternLogo) {
      try { pImg = await loadImage(patternLogo); } catch {}
    }
    let cImg: HTMLImageElement | null = null;
    if (centerLogo) { try { cImg = await loadImage(centerLogo); } catch {} }

    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fgColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";

    const drawFinder = (startX: number, startY: number) => {
      const x = margin + startX * cellSize, y = margin + startY * cellSize;
      const s7 = 7 * cellSize, s5 = 5 * cellSize, s3 = 3 * cellSize;
      ctx.fillStyle = fgColor;
      if (cornerType === "rounded") {
        const r = cellSize * 2;
        ctx.beginPath(); ctx.roundRect(x, y, s7, s7, r); ctx.fill();
        ctx.fillStyle = bgColor; ctx.beginPath(); ctx.roundRect(x + cellSize, y + cellSize, s5, s5, r - cellSize); ctx.fill();
        ctx.fillStyle = fgColor; ctx.beginPath(); ctx.roundRect(x + cellSize * 2, y + cellSize * 2, s3, s3, cellSize); ctx.fill();
      } else if (cornerType === "dots") {
        const cx = x + s7 / 2, cy = y + s7 / 2;
        ctx.beginPath(); ctx.arc(cx, cy, s7 / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = bgColor; ctx.beginPath(); ctx.arc(cx, cy, s5 / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = fgColor; ctx.beginPath(); ctx.arc(cx, cy, s3 / 2, 0, Math.PI * 2); ctx.fill();
      } else if (cornerType === "heart") {
        const r = cellSize * 0.5;
        ctx.beginPath(); ctx.roundRect(x, y, s7, s7, r); ctx.fill();
        ctx.fillStyle = bgColor; ctx.beginPath(); ctx.roundRect(x + cellSize, y + cellSize, s5, s5, 0); ctx.fill();
        ctx.fillStyle = fgColor;
        drawHeart(ctx, x + s7 / 2 - (s3 * 1.15) / 2, y + s7 / 2 - (s3 * 1.15) / 2, s3 * 1.15, s3 * 1.15);
      } else {
        ctx.fillRect(x, y, s7, s7);
        ctx.fillStyle = bgColor; ctx.fillRect(x + cellSize, y + cellSize, s5, s5);
        ctx.fillStyle = fgColor; ctx.fillRect(x + cellSize * 2, y + cellSize * 2, s3, s3);
      }
    };

    let logoBounds: any = null;
    if (cImg) {
      const maxLogoSize = innerSize * 0.22;
      const cRatio = cImg.width / cImg.height;
      let cWidth = maxLogoSize, cHeight = maxLogoSize;
      if (cRatio > 1) cHeight = maxLogoSize / cRatio;
      else cWidth = maxLogoSize * cRatio;
      const padding = margin * 0.6;
      logoBounds = {
        xMin: (size - cWidth) / 2 - padding, xMax: (size - cWidth) / 2 + cWidth + padding,
        yMin: (size - cHeight) / 2 - padding, yMax: (size - cHeight) / 2 + cHeight + padding,
        cWidth, cHeight, isCircle: true, cx: size / 2, cy: size / 2,
        radius: Math.max(cWidth, cHeight) / 2 + padding,
      };
    }

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (!matrix.data[r * moduleCount + c]) continue;
        const cx = margin + c * cellSize + cellSize / 2;
        const cy = margin + r * cellSize + cellSize / 2;
        const x  = margin + c * cellSize;
        const y  = margin + r * cellSize;
        if ((r <= 6 && c <= 6) || (r <= 6 && c >= moduleCount - 7) || (r >= moduleCount - 7 && c <= 6)) continue;
        if (logoBounds?.isCircle) {
          const dist = Math.sqrt((cx - logoBounds.cx) ** 2 + (cy - logoBounds.cy) ** 2);
          if (dist < logoBounds.radius + cellSize * 0.4) continue;
        } else if (logoBounds) {
          if (x + cellSize > logoBounds.xMin && x < logoBounds.xMax && y + cellSize > logoBounds.yMin && y < logoBounds.yMax) continue;
        }
        ctx.fillStyle = fgColor;
        if (patternType === "square") {
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
        } else if (patternType === "rounded") {
          ctx.beginPath(); ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.35); ctx.fill();
        } else if (patternType === "dots") {
          ctx.beginPath(); ctx.arc(cx, cy, (cellSize / 2) * 0.85, 0, Math.PI * 2); ctx.fill();
        } else if (patternType === "star") {
          drawStar(ctx, cx, cy, 5, cellSize / 1.8, cellSize / 3.8);
        } else if (patternType === "emoji") {
          ctx.font = `${cellSize * 0.95}px Arial`;
          ctx.fillText(emojiChar || "✦", cx, cy + cellSize * 0.1);
        } else if (patternType === "logo" && pImg) {
          const pRatio = pImg.width / pImg.height;
          let pw = cellSize, ph = cellSize;
          if (pRatio > 1) ph = cellSize / pRatio; else pw = cellSize * pRatio;
          ctx.drawImage(pImg, x + (cellSize - pw) / 2, y + (cellSize - ph) / 2, pw, ph);
        } else {
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }

    drawFinder(0, 0); drawFinder(moduleCount - 7, 0); drawFinder(0, moduleCount - 7);

    if (cImg && logoBounds) {
      ctx.fillStyle = bgColor;
      ctx.beginPath(); ctx.arc(logoBounds.cx, logoBounds.cy, logoBounds.radius, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(cImg, logoBounds.xMin + margin * 0.6, logoBounds.yMin + margin * 0.6, logoBounds.cWidth, logoBounds.cHeight);
    }

    if (isDownload) {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a"); a.href = dataUrl; a.download = "qr-code.png"; a.click();
    }
  }, [url, fgColor, bgColor, patternType, emojiChar, patternLogo, centerLogo, cornerType]);

  useEffect(() => { renderQR(false); }, [renderQR]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const openLightbox = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    setLightboxSrc(canvas.toDataURL("image/png")); setLightboxOpen(true);
  };

  const toggle = (id: string) => setOpenSection(prev => prev === id ? "" : id);

  const fileUpload = (ref: React.RefObject<HTMLInputElement | null>, setter: (v: string) => void) => {
    const file = ref.current?.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ─── Fade-in ─── */
  const fadeStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: PALETTE.bg,
      padding: "60px 24px 80px",
      fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* Background glows */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 40% at 20% -10%, rgba(200,241,53,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 30% at 80% 110%, rgba(99,102,241,0.05) 0%, transparent 60%)
        `,
      }} />

      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ textAlign: "center", marginBottom: 64, ...fadeStyle(0) }}>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            <Tag icon={<Lock size={10} />} label="100% Private" />
            <Tag icon={<Zap size={10} />} label="Client-side only" />
            <Tag icon={<Globe size={10} />} label="No watermarks" />
          </div>

          <h1 style={{
            fontSize: "clamp(2.8rem, 8vw, 6rem)",
            fontWeight: 900, lineHeight: 1,
            color: PALETTE.textPrimary,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
          }}>
            QR{" "}
            <span style={{
              background: `linear-gradient(135deg, ${PALETTE.accent} 0%, #a8e000 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Studio
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: PALETTE.textSecondary,
            maxWidth: 480, margin: "0 auto",
            lineHeight: 1.7, fontWeight: 400,
          }}>
            Craft pixel-perfect QR codes with custom patterns, brand overlays, and precision color control —
            all processed locally, never uploaded.
          </p>
        </header>

        {/* ── Main grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 380px",
          gap: 28,
          alignItems: "start",
          ...fadeStyle(0.12),
        }}>

          {/* ── LEFT: Controls ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* URL input */}
            <div style={{
              background: PALETTE.surface,
              border: `1px solid ${urlFocused ? "rgba(200,241,53,0.3)" : PALETTE.border}`,
              borderRadius: 20, padding: "20px 22px",
              transition: "border-color 0.2s",
            }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: PALETTE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Destination URL
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  placeholder="https://your-link.com"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: PALETTE.bg,
                    border: `1px solid ${PALETTE.border}`,
                    borderRadius: 12, padding: "14px 52px 14px 18px",
                    fontSize: 14, color: PALETTE.textPrimary,
                    outline: "none", transition: "border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleCopy}
                  title="Copy URL"
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: copied ? PALETTE.accent : PALETTE.textMuted,
                    transition: "color 0.2s", padding: 4,
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Section: Pattern & Colors */}
            <SectionCard
              id="pattern" open={openSection === "pattern"} onToggle={() => toggle("pattern")}
              icon={<QrCode size={18} />}
              title="Pattern & Colors"
              subtitle="Choose a dot style and your color palette"
            >
              {/* Pattern grid */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  Dot Style
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {[
                    { id: "square",  label: "Classic", icon: <div style={{ width: 16, height: 16, background: "currentColor" }} /> },
                    { id: "rounded", label: "Soft",    icon: <div style={{ width: 16, height: 16, background: "currentColor", borderRadius: 4 }} /> },
                    { id: "dots",    label: "Dots",    icon: <div style={{ width: 16, height: 16, background: "currentColor", borderRadius: "50%" }} /> },
                    { id: "star",    label: "Stars",   icon: <Star size={16} fill="currentColor" /> },
                    { id: "emoji",   label: "Emoji",   icon: <Smile size={16} /> },
                    { id: "logo",    label: "Logo",    icon: <ImageIcon size={16} /> },
                  ].map(opt => (
                    <PatternBtn key={opt.id} {...opt} active={patternType === opt.id} onClick={() => setPatternType(opt.id as PatternType)} />
                  ))}
                </div>

                {patternType === "emoji" && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: PALETTE.bg, borderRadius: 12, border: `1px solid ${PALETTE.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textMuted }}>Emoji character</span>
                    <input type="text" value={emojiChar}
                      onChange={e => { const c = Array.from(e.target.value); setEmojiChar(c.length ? c[c.length - 1] : ""); }}
                      style={{ width: 60, textAlign: "center", fontSize: 20, padding: "6px 10px", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 8, color: PALETTE.textPrimary, outline: "none", fontFamily: "inherit" }}
                    />
                  </div>
                )}

                {patternType === "logo" && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: PALETTE.bg, borderRadius: 12, border: `1px solid ${PALETTE.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textMuted }}>Pattern logo</span>
                    <input type="file" accept="image/*" ref={patternInputRef} className="hidden" style={{ display: "none" }}
                      onChange={() => fileUpload(patternInputRef, setPatternLogo)} />
                    <button onClick={() => patternInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 8, color: PALETTE.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      <Upload size={13} /> Choose image
                    </button>
                    {patternLogo && (
                      <button onClick={() => { setPatternLogo(null); if (patternInputRef.current) patternInputRef.current.value = ""; }}
                        style={{ padding: "7px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", cursor: "pointer" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Color palette */}
              <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                  Color Palette
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Foreground */}
                  <div>
                    <div style={{ fontSize: 11, color: PALETTE.textMuted, marginBottom: 10 }}>Foreground</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                      {FG_PRESETS.map(c => (
                        <button key={c} onClick={() => setFgColor(c)} style={{
                          width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                          border: `2px solid ${fgColor === c ? PALETTE.accent : "transparent"}`,
                          transition: "border-color 0.15s, transform 0.15s",
                          transform: fgColor === c ? "scale(1.15)" : "scale(1)",
                        }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: `1px solid ${PALETTE.border}`, flexShrink: 0 }}>
                        <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                          style={{ position: "absolute", inset: -8, width: 48, height: 48, cursor: "pointer" }} />
                      </div>
                      <input type="text" value={fgColor.toUpperCase()} onChange={e => setFgColor(e.target.value)}
                        style={{ width: 88, padding: "5px 10px", background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: PALETTE.textPrimary, outline: "none" }} />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <div style={{ fontSize: 11, color: PALETTE.textMuted, marginBottom: 10 }}>Background</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                      {BG_PRESETS.map(c => (
                        <button key={c} onClick={() => setBgColor(c)} style={{
                          width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                          border: `2px solid ${bgColor === c ? PALETTE.accent : "rgba(100,100,100,0.3)"}`,
                          transition: "border-color 0.15s, transform 0.15s",
                          transform: bgColor === c ? "scale(1.15)" : "scale(1)",
                        }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: `1px solid ${PALETTE.border}`, flexShrink: 0 }}>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                          style={{ position: "absolute", inset: -8, width: 48, height: 48, cursor: "pointer" }} />
                      </div>
                      <input type="text" value={bgColor.toUpperCase()} onChange={e => setBgColor(e.target.value)}
                        style={{ width: 88, padding: "5px 10px", background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: PALETTE.textPrimary, outline: "none" }} />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Section: Corners */}
            <SectionCard
              id="corners" open={openSection === "corners"} onToggle={() => toggle("corners")}
              icon={<Maximize size={18} />}
              title="Corner Style"
              subtitle="Customize the three finder markers"
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  { id: "square",  label: "Classic", icon: <Square size={16} /> },
                  { id: "rounded", label: "Rounded", icon: <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderRadius: 5 }} /> },
                  { id: "dots",    label: "Circles", icon: <div style={{ width: 16, height: 16, border: "2px solid currentColor", borderRadius: "50%" }} /> },
                  { id: "heart",   label: "Heart",   icon: <span style={{ fontSize: 15 }}>♥</span> },
                ].map(opt => (
                  <PatternBtn key={opt.id} {...opt} active={cornerType === opt.id} onClick={() => setCornerType(opt.id as CornerType)} />
                ))}
              </div>
            </SectionCard>

            {/* Section: Logo overlay */}
            <SectionCard
              id="logo" open={openSection === "logo"} onToggle={() => toggle("logo")}
              icon={<ImagePlus size={18} />}
              title="Center Logo"
              subtitle="Embed your brand mark in the center"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="file" accept="image/*" ref={centerInputRef} style={{ display: "none" }}
                  onChange={() => fileUpload(centerInputRef, setCenterLogo)} />
                <button onClick={() => centerInputRef.current?.click()} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 20px", background: "rgba(200,241,53,0.06)",
                  border: `1px dashed rgba(200,241,53,0.25)`, borderRadius: 12,
                  color: PALETTE.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.2s",
                }}>
                  <Upload size={15} /> Upload Logo
                </button>
                {centerLogo && (
                  <button onClick={() => { setCenterLogo(null); if (centerInputRef.current) centerInputRef.current.value = ""; }}
                    style={{ padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {centerLogo && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(200,241,53,0.04)", borderRadius: 8, border: `1px solid rgba(200,241,53,0.1)`, fontSize: 11, color: PALETTE.accent }}>
                  ✓ Logo uploaded — using H-level error correction for best scan rate
                </div>
              )}
            </SectionCard>

            {/* Warning card */}
            <div style={{
              padding: "16px 20px",
              background: "rgba(251,191,36,0.04)",
              border: "1px solid rgba(251,191,36,0.12)",
              borderRadius: 16,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <Sparkles size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>Scannability tip</div>
                <div style={{ fontSize: 12, color: PALETTE.textMuted, lineHeight: 1.6 }}>
                  Star and emoji patterns may struggle on older scanners. Ensure strong foreground/background contrast. Corner markers are always protected.
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Preview ── */}
          <div style={{ position: "sticky", top: 28 }}>
            {/* Preview card */}
            <div style={{
              background: PALETTE.surface,
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 28,
              padding: 24,
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
              {/* QR canvas area */}
              <div
                onClick={openLightbox}
                style={{
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: 20,
                  overflow: "hidden",
                  background: "#fff",
                  padding: 16,
                  aspectRatio: "1 / 1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.01)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }} />

                {/* Hover overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity 0.2s", borderRadius: 20,
                  backdropFilter: "blur(2px)",
                  color: "#fff", gap: 8, fontSize: 13, fontWeight: 600,
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <Maximize size={22} />
                  <span>View full size</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "16px 0" }}>
                {[
                  { label: "Error correction", value: "Level H" },
                  { label: "Resolution", value: "2048px" },
                  { label: "Format", value: "PNG" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", background: PALETTE.bg, borderRadius: 10, border: `1px solid ${PALETTE.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.textPrimary }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: PALETTE.textMuted, marginTop: 2, letterSpacing: "0.04em" }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Download button */}
              <button
                onClick={() => renderQR(true)}
                style={{
                  width: "100%", padding: "15px 20px",
                  background: PALETTE.accent,
                  border: "none", borderRadius: 14,
                  color: "#0a0a0b",
                  fontSize: 14, fontWeight: 800, letterSpacing: "0.02em",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.15s, transform 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                onMouseDown={e => e.currentTarget.style.transform = "translateY(1px)"}
                onMouseUp={e => e.currentTarget.style.transform = "translateY(-1px)"}
              >
                <Download size={17} /> Export PNG — 2048×2048
              </button>

              {/* Privacy note */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
                <ShieldCheck size={12} style={{ color: PALETTE.textMuted }} />
                <span style={{ fontSize: 11, color: PALETTE.textMuted }}>Generated entirely in your browser. Zero data sent anywhere.</span>
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ marginTop: 16, padding: "16px 20px", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Quick Presets
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Minimal B&W",   fg: "#0a0a0b", bg: "#ffffff", pattern: "rounded" as PatternType, corner: "square"  as CornerType },
                  { label: "Brand Navy",    fg: "#1e3a8a", bg: "#eff6ff", pattern: "dots"    as PatternType, corner: "rounded" as CornerType },
                  { label: "Dark Mode",     fg: "#c8f135", bg: "#0a0a0b", pattern: "rounded" as PatternType, corner: "dots"    as CornerType },
                  { label: "Rose Luxury",   fg: "#881337", bg: "#fff1f2", pattern: "dots"    as PatternType, corner: "rounded" as CornerType },
                ].map(p => (
                  <button key={p.label} onClick={() => { setFgColor(p.fg); setBgColor(p.bg); setPatternType(p.pattern); setCornerType(p.corner); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", background: PALETTE.bg,
                      border: `1px solid ${PALETTE.border}`, borderRadius: 10,
                      cursor: "pointer", transition: "border-color 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = PALETTE.border)}
                  >
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.fg, border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.bg, border: "1px solid rgba(0,0,0,0.15)" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: PALETTE.textSecondary }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && lightboxSrc && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(10,10,11,0.92)",
            backdropFilter: "blur(16px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 420 }}>
            <div style={{ background: "#fff", padding: 20, borderRadius: 24, width: "100%", boxShadow: "0 40px 100px rgba(0,0,0,0.8)" }}>
              <img src={lightboxSrc} alt="QR Code" style={{ width: "100%", height: "auto", display: "block", borderRadius: 10 }} />
            </div>
            <button
              onClick={() => { const a = document.createElement("a"); a.href = lightboxSrc!; a.download = "qr-code.png"; a.click(); }}
              style={{
                width: "100%", padding: "15px 20px",
                background: PALETTE.accent, border: "none", borderRadius: 14,
                color: "#0a0a0b", fontSize: 14, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit",
              }}
            >
              <Download size={17} /> Download QR Code
            </button>
            <span style={{ fontSize: 12, color: PALETTE.textMuted }}>Click anywhere outside to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
