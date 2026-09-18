"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Image as ImageIcon, UploadCloud, GripVertical,
    X, Trash2, Camera, Scissors, Grid3X3,
    Info, Package, CheckCircle, ShieldCheck,
    Sparkles, Lock, Globe, Layers, ArrowLeft,
    AlertTriangle, RotateCcw, ChevronDown, Download,
    HelpCircle, Zap, Check, Shield
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";
import JSZip from "jszip";

/* ─────────────────────────────────────────
   DESIGN TOKENS (matches QR tool)
   ───────────────────────────────────────── */
const T = {
  bg: "#333333",
  surface: "#3a3a3a",
  surfaceRaised: "#444444",
  surfaceHigh: "#4a4a4a",
  border: "#555",
  borderDim: "#2a2a2a",
  accent: "#4db8d4",
  accentDim: "rgba(77,184,212,0.15)",
  text: "#cccccc",
  textSub: "#999999",
  textMuted: "#888888",
  textDim: "#777777",
  danger: "#cc4444",
  dangerDim: "rgba(204,68,68,0.15)",
  warning: "#d4a843",
  success: "#7dcea0",
  successDim: "rgba(77,184,120,0.15)",
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/* ─────────────────────────────────────────
   SMALL SHARED COMPONENTS (matches QR tool)
   ───────────────────────────────────────── */
function Chip({ icon, label, small = false }: { icon: React.ReactNode; label: string; small?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 6px" : "3px 8px",
      borderRadius: 2, background: T.surface,
      border: `1px solid ${T.border}`,
      fontSize: small ? 10 : 10, fontWeight: 400, color: "#aaa", letterSpacing: "normal",
    }}>
      {icon}{label}
    </span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
        padding: "8px 10px", cursor: "pointer", transition: "all 0.15s ease",
        display: "flex", flexDirection: "column", textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.text, margin: 0, display: "flex", gap: 6, textAlign: "left", alignItems: "flex-start" }}>
          <span style={{ color: T.accent }}>Q:</span>
          <span>{question}</span>
        </h4>
        <div style={{ color: T.textMuted, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease", flexShrink: 0, display: "flex", fontWeight: 400, fontSize: 9 }}>▼</div>
      </div>
      <div style={{ maxHeight: isOpen ? 500 : 0, opacity: isOpen ? 1 : 0, overflow: "hidden", transition: "all 0.2s ease", pointerEvents: isOpen ? "auto" : "none", marginTop: isOpen ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, margin: 0, paddingLeft: 18, textAlign: "left", fontWeight: 400 }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TYPES & CONSTANTS
   ───────────────────────────────────────── */
interface GridImage {
    id: string;
    url: string;
    file?: File;
}

interface ConfirmState {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
}

// The mobile app always renders a profile's posts in exactly 3 fixed
// columns. Desktop web is responsive and commonly shows 4 (sometimes up to
// 6 on very wide windows). There's no single number that's "correct" for
// every viewer, so both the splitter and the preview mockup let people pick
// 3 (optimized for mobile) or 4 (optimized for a typical desktop width)
// rather than locking to one.
const COLUMN_OPTIONS = [3, 4] as const;
const DEFAULT_SPLIT_COLUMNS = 3;
const MOBILE_PREVIEW_COLUMNS = 3;
// Instagram's grid crop moved from a square (1:1) to a taller portrait
// crop (3:4) in 2025. Tiles are exported at this ratio so they fill the
// grid cell cleanly instead of getting padded.
const EXPORT_TILE_W = 1080;
const EXPORT_TILE_H = 1440;
const MAX_SPLIT_ROWS = 6;


/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function IGGridPlannerPage() {
    const [images, setImages] = useState<GridImage[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview Device Toggle: 'mobile' | 'desktop'
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
    const [desktopPreviewCols, setDesktopPreviewCols] = useState<3 | 4>(4);

    // Which tool is active.
    const [viewMode, setViewMode] = useState<"feed" | "splitter">("splitter");

    // Lightweight toast + confirm dialog
    const [toast, setToast] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2400);
        return () => clearTimeout(t);
    }, [toast]);

    // Split Image State
    const [splitImageSrc, setSplitImageSrc] = useState<string | null>(null);
    const [splitImageDims, setSplitImageDims] = useState<{ w: number; h: number } | null>(null);
    const [splitCols, setSplitCols] = useState<3 | 4>(DEFAULT_SPLIT_COLUMNS);
    const [splitRows, setSplitRows] = useState(3);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitResults, setSplitResults] = useState<GridImage[]>([]);
    const [isZipping, setIsZipping] = useState(false);
    const [hasAddedToFeed, setHasAddedToFeed] = useState(false);
    const splitInputRef = useRef<HTMLInputElement>(null);

    // Profile Mock State
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [username, setUsername] = useState("your.username");
    const [bio, setBio] = useState("Welcome to my awesome Instagram grid planner! 🎉\nPlanning my next big posts right here.");
    const profileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newImages: GridImage[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            url: URL.createObjectURL(file),
            file
        }));
        setImages((prev) => [...newImages, ...prev]);
        setViewMode("feed");
        setToast(`Added ${newImages.length} photo${newImages.length === 1 ? "" : "s"}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePic(URL.createObjectURL(file));
    };

    const handleSplitSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (splitImageSrc) URL.revokeObjectURL(splitImageSrc);
        splitResults.forEach((r) => URL.revokeObjectURL(r.url));
        const url = URL.createObjectURL(file);
        const probe = new Image();
        probe.onload = () => setSplitImageDims({ w: probe.width, h: probe.height });
        probe.src = url;
        setSplitImageSrc(url);
        setSplitImageDims(null);
        setSplitResults([]);
        setViewMode("splitter");
        if (splitInputRef.current) splitInputRef.current.value = "";
    };

    const choosePhotoAgain = () => {
        if (splitImageSrc) URL.revokeObjectURL(splitImageSrc);
        splitResults.forEach((r) => URL.revokeObjectURL(r.url));
        setSplitImageSrc(null);
        setSplitImageDims(null);
        setSplitResults([]);
        setHasAddedToFeed(false);
    };

    const confirmSplit = async () => {
        if (!splitImageSrc) return;
        setIsSplitting(true);
        try {
            const img = new Image();
            img.src = splitImageSrc;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const cols = splitCols;
            const rows = splitRows;
            const tileAspect = EXPORT_TILE_W / EXPORT_TILE_H;
            const targetRatio = (cols / rows) * tileAspect;
            const imgRatio = img.width / img.height;
            let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height;
            if (imgRatio > targetRatio) { sourceW = img.height * targetRatio; sourceX = (img.width - sourceW) / 2; }
            else { sourceH = img.width / targetRatio; sourceY = (img.height - sourceH) / 2; }
            const sliceW = sourceW / cols;
            const sliceH = sourceH / rows;
            const canvas = document.createElement("canvas");
            canvas.width = EXPORT_TILE_W;
            canvas.height = EXPORT_TILE_H;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            const newImages: GridImage[] = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    ctx.clearRect(0, 0, EXPORT_TILE_W, EXPORT_TILE_H);
                    ctx.drawImage(img, sourceX + c * sliceW, sourceY + r * sliceH, sliceW, sliceH, 0, 0, EXPORT_TILE_W, EXPORT_TILE_H);
                    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
                    if (blob) { newImages.push({ id: Math.random().toString(36).substring(2, 9), url: URL.createObjectURL(blob) }); }
                }
            }
            setSplitResults(newImages);
        } catch (err) {
            console.error(err);
            setToast("Couldn't split that image - try a different file");
        } finally { setIsSplitting(false); }
    };

    const handleDownloadZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const total = splitResults.length;
            const cols = splitCols;
            await Promise.all(splitResults.map(async (res, i) => {
                const response = await fetch(res.url);
                const blob = await response.blob();
                const uploadOrder = total - i;
                const row = Math.floor(i / cols) + 1;
                const col = (i % cols) + 1;
                zip.file(`${String(uploadOrder).padStart(2, "0")}-of-${total}_row${row}-col${col}.jpg`, blob);
            }));
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `instagram-grid-${cols}x${splitRows}.zip`;
            a.click();
            setToast("ZIP downloaded");
        } catch (err) { console.error(err); setToast("Download failed - please try again"); }
        finally { setIsZipping(false); }
    };

    const handleDownloadFeedZip = async () => {
        if (images.length === 0) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const total = images.length;
            await Promise.all(images.map(async (img, i) => {
                const response = await fetch(img.url);
                const blob = await response.blob();
                const uploadOrder = total - i;
                zip.file(`${String(uploadOrder).padStart(2, "0")}-feed-post.jpg`, blob);
            }));
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `instagram-feed-planner.zip`;
            a.click();
            setToast("Feed ZIP downloaded");
        } catch (err) { console.error(err); setToast("Download failed - please try again"); }
        finally { setIsZipping(false); }
    };

    const addSplitImagesToGrid = () => {
        setImages(prev => [...splitResults, ...prev]);
        setToast(`Added ${splitResults.length} tiles to your feed`);
        setViewMode("feed");
        setSplitImageSrc(null);
        setSplitImageDims(null);
        setSplitResults([]);
        setHasAddedToFeed(true);
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter((img) => img.id !== id);
        });
    };

    const clearAll = () => {
        if (images.length === 0) return;
        setConfirmState({
            title: "Clear your feed?",
            message: `This removes all ${images.length} photo${images.length === 1 ? "" : "s"} from the planner. This can't be undone.`,
            confirmLabel: "Clear feed",
            onConfirm: () => {
                images.forEach((img) => URL.revokeObjectURL(img.url));
                setImages([]);
                setToast("Feed cleared");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    };

    // ── Reordering, via Pointer Events ──────────────────────────────────
    const dragInfo = useRef<{ idx: number; pointerId: number } | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const handleHandlePointerDown = (e: React.PointerEvent, idx: number) => {
        e.preventDefault();
        dragInfo.current = { idx, pointerId: e.pointerId };
        setDraggedIdx(idx);
        setOverIdx(idx);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleHandlePointerMove = (e: React.PointerEvent) => {
        const info = dragInfo.current;
        if (!info || info.pointerId !== e.pointerId) return;
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const tile = el?.closest("[data-tile-idx]") as HTMLElement | null;
        if (tile) {
            const idx = Number(tile.dataset.tileIdx);
            if (!Number.isNaN(idx)) setOverIdx(idx);
        }
    };

    const finishDrag = (e: React.PointerEvent) => {
        const info = dragInfo.current;
        if (!info || info.pointerId !== e.pointerId) return;
        const from = info.idx;
        const to = overIdx;
        if (to !== null && to !== from) {
            setImages((prev) => {
                const next = [...prev];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        }
        dragInfo.current = null;
        setDraggedIdx(null);
        setOverIdx(null);
    };

    const renderOrderOverlay = () => {
        const total = splitCols * splitRows;
        return (
            <div style={{ position: "absolute", inset: 0, display: "grid", pointerEvents: "none", gridTemplateColumns: `repeat(${splitCols}, 1fr)`, gridTemplateRows: `repeat(${splitRows}, 1fr)` }}>
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} style={{ border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4 }}>
                        <span style={{ color: "#fff", fontSize: 9, fontWeight: 900, background: "rgba(0,0,0,0.65)", borderRadius: 2, padding: "0 4px", lineHeight: 1.4 }}>
                            {total - i}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const feedCols = previewDevice === "desktop" ? desktopPreviewCols : MOBILE_PREVIEW_COLUMNS;
    const remainder = images.length % feedCols;
    const padCount = images.length === 0 ? 0 : (remainder === 0 ? 0 : feedCols - remainder);

    /* ── Hidden file inputs ── */
    const hiddenInputs = (
        <>
            <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={handleFileUpload} />
            <input type="file" ref={splitInputRef} accept="image/*" style={{ display: "none" }} onChange={handleSplitSourceChange} />
            <input type="file" ref={profileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleProfileUpload} />
        </>
    );

    /* ── Button style helpers ── */
    const pillBtn = (active: boolean): React.CSSProperties => ({
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 3,
        background: active ? T.accent : T.surface,
        border: `1px solid ${active ? T.accent : T.border}`,
        color: active ? "#1a1a1a" : T.textSub,
        fontSize: 11, fontWeight: 500, cursor: "pointer",
        transition: "all 0.15s", fontFamily: T.font,
    });

    const smallToggleBtn = (active: boolean): React.CSSProperties => ({
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer",
        background: active ? T.accent : T.surfaceRaised,
        color: active ? "#1a1a1a" : T.textSub,
        border: `1px solid ${active ? T.accent : T.border}`,
        transition: "all 0.12s", fontFamily: T.font,
    });

    const accentBtn = (disabled = false): React.CSSProperties => ({
        width: "100%", padding: "10px 12px",
        background: disabled ? T.surfaceRaised : T.accent,
        border: "none", borderRadius: 3,
        color: disabled ? T.textSub : "#1a1a1a",
        fontSize: 11, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: T.font, transition: "all 0.12s", opacity: disabled ? 0.5 : 1,
    });

    const surfaceBtn = (danger = false): React.CSSProperties => ({
        padding: "8px 12px", borderRadius: 3,
        background: danger ? T.dangerDim : T.surfaceRaised,
        border: `1px solid ${T.border}`,
        color: danger ? "#cc6666" : T.text,
        fontSize: 11, fontWeight: 400, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        fontFamily: T.font, transition: "all 0.12s",
    });

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, paddingBottom: 80 }}>
          <style>{`
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            ::-webkit-scrollbar { display: none; }
            .ig-tile:active { transform: scale(0.97); }
          `}</style>

          {hiddenInputs}

          {/* ── HEADER ── */}
          <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/tools" style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
              color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
              transition: "background 0.12s",
            }}>
              <ArrowLeft size={11} strokeWidth={2} /> Back
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                <Grid3X3 size={12} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>IG Grid Planner</span>
              <button onClick={() => setShowHelp(true)} style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textMuted, cursor: "pointer", display: "flex" }}>
                <HelpCircle size={11} />
              </button>
            </div>
          </header>

          {/* ── MAIN CONTENT ── */}
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

            {/* Description + Chips */}
            <div style={{ marginBottom: 16, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip icon={<Shield size={10} />} label="100% Private" />
                <Chip icon={<Zap size={10} />} label="Client-side" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: T.text }}>
                Instagram Grid Planner & Image Splitter
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Preview your feed layout, slice panoramic images into perfect grid tiles, and plan your visual feed - all processed locally.
              </p>
            </div>

            {/* ── DEVICE SWITCHER ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={() => setPreviewDevice("mobile")} style={pillBtn(previewDevice === "mobile")}>
                <ImageIcon size={12} /> Mobile
              </button>
              <button onClick={() => setPreviewDevice("desktop")} style={pillBtn(previewDevice === "desktop")}>
                <Globe size={12} /> Desktop
              </button>
              {previewDevice === "desktop" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: T.textMuted }}>Cols</span>
                  {COLUMN_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setDesktopPreviewCols(n)} style={smallToggleBtn(desktopPreviewCols === n)}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── PHONE / DESKTOP MOCKUP ── */}
            <div style={{
              maxWidth: previewDevice === "mobile" ? 390 : 700,
              margin: "0 auto",
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: previewDevice === "mobile" ? 24 : 12,
              overflow: "hidden", transition: "all 0.3s",
            }}>

              {/* Status bar (mobile) */}
              {previewDevice === "mobile" && (
                <div style={{ height: 44, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", borderBottom: `1px solid ${T.borderDim}` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>9:41</span>
                  <div style={{
                    position: "absolute", left: "50%", transform: "translateX(-50%)",
                    width: 84, height: 18, background: "#1a1a1a", borderRadius: 99,
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#333" }} />
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#222" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.text }}>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h.01M5 13a11 11 0 0 1 14 0M8.5 16.5a6 6 0 0 1 7 0" /></svg>
                    <div style={{ width: 15, height: 8, border: `1px solid ${T.text}`, borderRadius: 2, padding: 1, display: "flex", alignItems: "center" }}>
                      <div style={{ width: "100%", height: "100%", background: T.text, borderRadius: 1 }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Browser chrome (desktop) */}
              {previewDevice === "desktop" && (
                <div style={{ display: "flex", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                  <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 12, fontFamily: "monospace" }}>instagram.com/{username}</span>
                </div>
              )}

              {/* IG Header (mobile) */}
              {previewDevice === "mobile" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.borderDim}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: T.textSub, fontSize: 12, fontWeight: 600 }}>@</span>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} spellCheck={false}
                      style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, fontWeight: 600, width: 140, fontFamily: T.font }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", color: T.text }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                  </div>
                </div>
              )}

              {/* ── Profile Section ── */}
              <div style={{ padding: previewDevice === "desktop" ? "20px 32px" : "16px 14px", borderBottom: `1px solid ${T.borderDim}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: previewDevice === "desktop" ? 32 : 16 }}>
                  {/* Avatar */}
                  <div onClick={() => profileInputRef.current?.click()} style={{ cursor: "pointer", flexShrink: 0 }}>
                    <div style={{
                      width: previewDevice === "desktop" ? 80 : 64, height: previewDevice === "desktop" ? 80 : 64,
                      borderRadius: "50%", padding: 2,
                      background: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)",
                    }}>
                      <div style={{
                        width: "100%", height: "100%", borderRadius: "50%",
                        border: `2px solid ${T.surface}`, overflow: "hidden",
                        background: T.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {profilePic ? (
                          <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Camera size={previewDevice === "desktop" ? 20 : 16} style={{ color: T.textMuted }} />
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                    {[
                      { val: String(images.length), label: "posts" },
                      { val: "1.2K", label: "followers" },
                      { val: "248", label: "following" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: T.textSub, marginTop: 3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bio */}
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} spellCheck={false} placeholder="Edit biography..."
                  style={{
                    width: "100%", marginTop: 10, background: "none", border: "none", outline: "none",
                    color: T.text, fontSize: 11, fontFamily: T.font, resize: "none", lineHeight: 1.5,
                  }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button style={{ flex: 1, padding: "6px 0", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: T.font }}>Edit Profile</button>
                  <button style={{ flex: 1, padding: "6px 0", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: T.font }}>Share Profile</button>
                </div>
              </div>

              {/* ── Tab Bar (Feed / Splitter) ── */}
              <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDim}` }}>
                {[
                  { id: "feed" as const, icon: <Grid3X3 size={13} />, label: `Feed${images.length > 0 ? ` (${images.length})` : ""}` },
                  { id: "splitter" as const, icon: <Scissors size={13} />, label: "Splitter" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setViewMode(tab.id)} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                    borderBottom: viewMode === tab.id ? `2px solid ${T.text}` : "2px solid transparent",
                    color: viewMode === tab.id ? T.text : T.textMuted,
                    fontSize: 11, fontWeight: 500, transition: "all 0.12s", fontFamily: T.font,
                    position: "relative",
                  }}>
                    {tab.icon} {tab.label}
                    {tab.id === "splitter" && splitImageSrc && (
                      <span style={{ position: "absolute", top: 6, right: "28%", width: 6, height: 6, borderRadius: "50%", background: T.accent }} />
                    )}
                  </button>
                ))}
              </div>

              {/* ── SPLITTER CONTENT ── */}
              {viewMode === "splitter" && (
                <div style={{ minHeight: 220 }}>
                  {!splitImageSrc ? (
                    /* Upload prompt */
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", minHeight: 220 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4 }}>Choose a photo to split</div>
                      <p style={{ fontSize: 11, color: T.textSub, marginBottom: 16, maxWidth: 260, lineHeight: 1.5 }}>
                        Pick a wide, high-resolution landscape photo - it'll be cropped and sliced into {splitCols}-column grid tiles.
                      </p>
                      <div onClick={() => splitInputRef.current?.click()} style={{
                        width: "100%", maxWidth: 260, height: 120,
                        border: `1px dashed ${T.border}`, borderRadius: 8,
                        background: T.bg, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "border-color 0.15s",
                      }}>
                        <UploadCloud size={22} style={{ color: T.textMuted }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: T.textSub }}>Select Image</span>
                      </div>
                    </div>
                  ) : splitResults.length === 0 ? (
                    /* Configure grid */
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14, minHeight: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDim}`, paddingBottom: 8 }}>
                        <button onClick={choosePhotoAgain} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: T.textSub, fontSize: 11, fontWeight: 400, cursor: "pointer", fontFamily: T.font }}>
                          <RotateCcw size={12} /> Change photo
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 16, flexDirection: previewDevice === "mobile" ? "column" : "row" }}>
                        {/* Preview */}
                        <div style={{ flex: previewDevice === "mobile" ? undefined : 1 }}>
                          <div style={{ borderRadius: 8, overflow: "hidden", background: T.bg, position: "relative", border: `1px solid ${T.border}`, aspectRatio: `${splitCols * 3} / ${splitRows * 4}` }}>
                            <img src={splitImageSrc} alt="Source" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}>
                              {renderOrderOverlay()}
                            </div>
                          </div>
                          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6, textAlign: "center", lineHeight: 1.4 }}>
                            Numbers = upload order. Post #1 first, last number goes up last.
                          </p>
                        </div>
                        {/* Controls */}
                        <div style={{ flex: previewDevice === "mobile" ? undefined : 1, display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Columns</span>
                            <div style={{ display: "flex", gap: 4 }}>
                              {COLUMN_OPTIONS.map(n => (
                                <button key={n} onClick={() => setSplitCols(n)} style={smallToggleBtn(splitCols === n)}>{n}</button>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 400, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rows</span>
                            <div style={{ display: "flex", gap: 4 }}>
                              {Array.from({ length: MAX_SPLIT_ROWS }, (_, i) => i + 1).map(v => (
                                <button key={v} onClick={() => setSplitRows(v)} style={smallToggleBtn(splitRows === v)}>{v}</button>
                              ))}
                            </div>
                          </div>
                          <p style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
                            Tiles export at {EXPORT_TILE_W}×{EXPORT_TILE_H}px portrait crops.
                          </p>
                        </div>
                      </div>

                      <button onClick={confirmSplit} disabled={isSplitting} style={accentBtn(isSplitting)}>
                        {isSplitting ? "Splitting…" : `Split into ${splitCols * splitRows} Images`}
                      </button>
                    </div>
                  ) : (
                    /* Success */
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14, minHeight: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDim}`, paddingBottom: 8 }}>
                        <button onClick={() => setSplitResults([])} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: T.textSub, fontSize: 11, fontWeight: 400, cursor: "pointer", fontFamily: T.font }}>
                          <ArrowLeft size={12} /> Adjust rows
                        </button>
                        <span style={{ fontSize: 11, fontWeight: 500, color: T.success, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={12} /> Split complete
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 16, flexDirection: previewDevice === "mobile" ? "column" : "row", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "grid", gap: 3, background: T.surfaceRaised, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, width: "100%", maxWidth: 200, gridTemplateColumns: `repeat(${splitCols}, 1fr)` }}>
                          {splitResults.map((img, i) => (
                            <div key={img.id} style={{ aspectRatio: "3/4", position: "relative", borderRadius: 3, overflow: "hidden", border: `1px solid ${T.border}` }}>
                              <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="" />
                              <div style={{ position: "absolute", top: 2, left: 2, padding: "0 4px", background: "rgba(0,0,0,0.75)", borderRadius: 2, fontSize: 7, fontWeight: 700, color: "#fff" }}>
                                #{splitResults.length - i}
                              </div>
                              <a href={img.url} download={`${splitResults.length - i}-of-${splitResults.length}.jpg`}
                                style={{ position: "absolute", bottom: 2, right: 2, padding: 3, background: "rgba(0,0,0,0.7)", borderRadius: 2, color: "#fff", display: "flex", cursor: "pointer" }}>
                                <Download size={8} />
                              </a>
                            </div>
                          ))}
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <p style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5 }}>
                            Upload starting from <strong style={{ color: T.text }}>#1</strong>. Each new post pushes older ones down.
                          </p>
                          <button onClick={handleDownloadZip} disabled={isZipping} style={surfaceBtn()}>
                            {isZipping ? "Zipping…" : <><Package size={13} /> Download ZIP</>}
                          </button>
                          <button onClick={addSplitImagesToGrid} style={accentBtn()}>
                            <CheckCircle size={13} /> Add to Feed Planner
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── FEED CONTENT ── */}
              {viewMode === "feed" && (
                <div>
                  {images.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32, minHeight: 220 }}>
                      <UploadCloud size={24} style={{ color: T.textMuted, marginBottom: 10 }} />
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4 }}>No posts yet</div>
                      <p style={{ fontSize: 11, color: T.textSub, maxWidth: 260, marginBottom: 16, lineHeight: 1.5 }}>
                        Upload the photos you're planning to post, then drag the grip handle on each tile to reorder.
                      </p>
                      <button onClick={() => fileInputRef.current?.click()} style={accentBtn()}>
                        <UploadCloud size={14} /> Upload Photos
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${feedCols}, 1fr)`, gap: 2, background: T.borderDim }}>
                        {images.map((img, idx) => (
                          <div key={img.id} data-tile-idx={idx} className="ig-tile"
                            style={{
                              aspectRatio: "3/4", position: "relative", transition: "all 0.15s",
                              opacity: draggedIdx === idx ? 0.4 : 1,
                              transform: draggedIdx === idx ? "scale(0.95)" : "none",
                              outline: overIdx === idx && draggedIdx !== null && draggedIdx !== idx ? `2px solid ${T.accent}` : "none",
                              outlineOffset: -2,
                            }}>
                            <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", userSelect: "none", display: "block" }} />
                            {/* Index badge */}
                            <div style={{ position: "absolute", top: 4, left: 4, padding: "1px 5px", background: "rgba(0,0,0,0.7)", borderRadius: 2, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                              {idx + 1}
                            </div>
                            {/* Remove */}
                            <button onClick={() => removeImage(img.id)} title="Remove"
                              style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", transition: "background 0.12s" }}>
                              <X size={11} strokeWidth={2.5} />
                            </button>
                            {/* Download */}
                            <a href={img.url} download={`feed-post-${idx + 1}.jpg`} title="Download"
                              style={{ position: "absolute", bottom: 4, left: 4, width: 24, height: 24, borderRadius: 4, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", textDecoration: "none" }}>
                              <Download size={11} />
                            </a>
                            {/* Drag handle */}
                            <div style={{ position: "absolute", bottom: 4, right: 4, width: 24, height: 24, borderRadius: 4, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "grab", touchAction: "none" }}
                              onPointerDown={(e) => handleHandlePointerDown(e, idx)}
                              onPointerMove={handleHandlePointerMove}
                              onPointerUp={finishDrag}
                              onPointerCancel={finishDrag}
                              title="Drag to reorder">
                              <GripVertical size={13} />
                            </div>
                          </div>
                        ))}
                        {/* Empty pad cells */}
                        {Array.from({ length: padCount }).map((_, i) => (
                          <div key={`empty-${i}`} onClick={() => fileInputRef.current?.click()}
                            style={{ aspectRatio: "3/4", background: T.bg, border: `1px dashed ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: T.textMuted, cursor: "pointer", transition: "all 0.12s" }}>
                            <UploadCloud size={14} />
                            <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase" }}>Add Post</span>
                          </div>
                        ))}
                      </div>

                      <p style={{ textAlign: "center", fontSize: 10, color: T.textMuted, padding: "8px 12px", lineHeight: 1.4 }}>
                        Position 1 (top-left) is what visitors see first - drag the <GripVertical size={9} style={{ display: "inline", verticalAlign: "middle" }} /> handle to reorder.
                      </p>

                      {/* Action bar */}
                      <div style={{ display: "flex", gap: 6, padding: 10, background: T.bg, borderTop: `1px solid ${T.borderDim}` }}>
                        <button onClick={() => { choosePhotoAgain(); setViewMode("splitter"); }} style={{ ...surfaceBtn(), flex: 1 }}>
                          <Scissors size={12} /> Split Another
                        </button>
                        <button onClick={handleDownloadFeedZip} disabled={isZipping} style={{ ...accentBtn(isZipping), flex: 1 }}>
                          {isZipping ? "Zipping…" : <><Package size={12} /> Download All ZIP</>}
                        </button>
                        <button onClick={clearAll} style={surfaceBtn(true)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── RECOMMENDED DIMENSIONS ── */}
            <div style={{ marginTop: 48, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, textAlign: "center" }}>
              <h3 style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 4 }}>
                Best Grid Dimensions & Image Sizes
              </h3>
              <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 20, lineHeight: 1.5, maxWidth: 520, margin: "4px auto 20px" }}>
                Recommended resolutions for high-quality, crisp posts:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
                {[
                  { label: "3×1", dims: "3240 × 1440", cols: 3, rows: 1 },
                  { label: "3×2", dims: "3240 × 2880", cols: 3, rows: 2 },
                  { label: "3×3", dims: "3240 × 4320", cols: 3, rows: 3 },
                  { label: "3×4", dims: "3240 × 5760", cols: 3, rows: 4 },
                  { label: "3×5", dims: "3240 × 7200", cols: 3, rows: 5 },
                  { label: "3×6", dims: "3240 × 8640", cols: 3, rows: 6 },
                ].map((grid, i) => (
                  <button key={i} onClick={() => { setSplitCols(grid.cols as 3 | 4); setSplitRows(grid.rows); setViewMode("splitter"); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      padding: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
                      cursor: "pointer", transition: "all 0.12s", minWidth: 80,
                    }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{grid.label}</span>
                    <span style={{ fontSize: 9, color: T.textMuted }}>{grid.dims}px</span>
                    <div style={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, width: 48, marginTop: 4 }}>
                      {Array.from({ length: grid.cols * grid.rows }).map((_, idx) => (
                        <div key={idx} style={{ aspectRatio: "3/4", background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 2 }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── SEO RICH TEXT SECTION ── */}
            <div style={{ marginTop: 48, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
              {/* Top Badges */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <Chip icon={<Shield size={11} />} label="100% Private" />
                <Chip icon={<Zap size={11} />} label="Browser-Side" />
                <Chip icon={<Check size={11} />} label="No Watermarks" />
              </div>

              {/* Title */}
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 16px", lineHeight: 1.2 }}>
                  Free Instagram Grid Planner & Profile Simulator
                </h2>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, maxWidth: 720, margin: "0 auto", fontWeight: 400 }}>
                  Organize your social feed layout visually with AssetNest's private, browser-based instagram grid planner. Drag, drop, and rearrange individual posts or slice landscape images into perfect grids. No accounts or password connections required.
                </p>
              </div>

              {/* Feature Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 48 }}>
                {[
                  { title: "Interactive Feed Layout Planner", desc: "Design a visually balanced grid in real-time. Drag tiles to organize themes, color palettes, and photo flows.", icon: <Layers size={16} /> },
                  { title: "Mobile & Desktop Grid Splitter", desc: "Slice wide landscapes into 3-column or 4-column templates optimized for Instagram's grid.", icon: <Scissors size={16} /> },
                  { title: "Live Bio & Profile Mockup", desc: "Test custom usernames and bio text locally. Preview exactly how new posts appear alongside your header.", icon: <Camera size={16} /> },
                  { title: "100% Safe Browser Sandbox", desc: "Your photos are processed locally using HTML5 canvas. Nothing is uploaded to servers.", icon: <ShieldCheck size={16} /> },
                  { title: "Numbered ZIP Exports", desc: "Download sorted grid ZIP files with correct upload sequence for a stress-free posting experience.", icon: <Package size={16} /> },
                  { title: "Free with Zero Account Linkage", desc: "No credential sharing or third-party app linking. Completely free with no subscription limits.", icon: <Lock size={16} /> },
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
                  How to Plan & Split Your Instagram Feed
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {[
                    { step: "1", title: "Add Your Media Assets", desc: "Drag and drop photos or choose a high-resolution landscape to slice." },
                    { step: "2", title: "Design Feed & Profile Layout", desc: "Rearrange tiles until your grid is cohesive. Test username and bio text." },
                    { step: "3", title: "Export & Post", desc: "Download the sorted ZIP and upload the numbered photos in order." },
                  ].map(s => (
                    <div key={s.step} style={{ padding: 12, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 20 }}>
                      <div style={{
                        position: "absolute", top: -10, left: 12,
                        width: 22, height: 22, borderRadius: "50%",
                        background: T.accent, color: "#1a1a1a",
                        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{s.step}</div>
                      <h4 style={{ fontSize: 12, fontWeight: 500, color: T.text, margin: "0 0 6px" }}>{s.title}</h4>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <h3 style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: T.text, marginBottom: 20 }}>
                  Frequently Asked Questions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FAQItem question="How does the free instagram grid planner keep my images private?" answer="Our layout tool runs completely client-side in your browser cache. All image adjustments, slicing, and profile customizations are handled inside your local RAM and canvas space. No data is sent to external servers or logged anywhere." />
                  <FAQItem question="Can I use this as a desktop instagram grid planner?" answer="Yes! This tool is optimized to serve as a desktop instagram feed planner. It runs seamlessly on any browser, making it the perfect planning tool for desktop creators." />
                  <FAQItem question="Is this really a free instagram feed planner?" answer="Yes. AssetNest offers this tool with absolutely no premium paywalls, watermarks, or account signups. Unlimited planning and zero watermark exports, free forever." />
                  <FAQItem question="Should I split into 3 or 4 columns?" answer="Instagram's mobile app always displays posts in 3 fixed columns, making it the safest choice. However, this tool also supports 4-column desktop simulations for full preview control." />
                  <FAQItem question="How does the ordering work?" answer="Because Instagram displays uploaded posts starting from the bottom right, your split grid slices must be uploaded in reverse. The ZIP export numbers files sequentially for correct upload order." />
                </div>
              </div>
            </div>
          </div>

          {/* ── CONFIRM DIALOG ── */}
          {confirmState && (
            <div onClick={() => setConfirmState(null)} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, maxWidth: 380, width: "100%", padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 8 }}>{confirmState.title}</div>
                <p style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: 16 }}>{confirmState.message}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmState(null)} style={{ ...surfaceBtn(), flex: 1 }}>Cancel</button>
                  <button onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 3, background: T.danger, border: "none", color: "#fff", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: T.font }}>
                    {confirmState.confirmLabel ?? "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TOAST ── */}
          {toast && (
            <div style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 100,
              padding: "8px 16px", background: T.surfaceRaised, border: `1px solid ${T.border}`,
              borderRadius: 99, color: T.text, fontSize: 11, fontWeight: 400,
              maxWidth: "90vw", textAlign: "center",
            }}>
              {toast}
            </div>
          )}

          {/* ── HELP MODAL ── */}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Instagram Grid Planner">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#dcdcdc]">Instagram Grid Planner</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                The Instagram Grid Planner helps you preview your grid layout before publishing. Add photos, drag them around, customize your bio, and design beautiful grid spreads using the built-in image splitter.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                All files and edits are processed locally in your browser. No login, no servers, 100% private.
              </p>
            </div>
          </HelpModal>
        </div>
    );
}
