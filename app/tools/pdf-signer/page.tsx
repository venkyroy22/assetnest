"use client";

import "./polyfill";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Upload, UploadCloud, Download, RefreshCw, PenTool, Info, X, Check, Save,
    MousePointer2, Layers, FileText, Share2, PencilLine, Sparkles,
    Trash2, ShieldCheck, User, Type, Calendar, CheckSquare,
    Undo2, Redo2, Stamp, Palette, Bold, Italic, Underline,
    Zap, Lock, Globe, ChevronDown, ChevronUp, ArrowLeft,
    HelpCircle, MonitorSmartphone, Scissors
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });
import type { Signature, LibraryItem } from "@/app/tools/pdf-signer/types";
import Link from "next/link";
import HelpModal from "@/components/HelpModal";

/* ─────────────────────────────────────────
   DESIGN TOKENS (Matching QR & Image Tools)
   ───────────────────────────────────────── */
const T = {
    bg:          "#333333",
    surface:     "#3a3a3a",
    surfaceHi:   "#444444",
    surfaceHov:  "#505050",
    border:      "#555555",
    borderDim:   "#2a2a2a",
    accent:      "#4db8d4",
    accentDark:  "#2a7a8f",
    accentDim:   "rgba(77,184,212,0.15)",
    textPri:     "#cccccc",
    textSec:     "#999999",
    muted:       "#777777",
    danger:      "#cc4444",
    success:     "#7dcea0",
    font:        "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

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
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.textPri, margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
        </h4>
        <span style={{ color: T.textSec, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
      </div>
    </div>
  );
}

/* --- Page Thumbnail Renderer --- */
const PdfThumbnail = ({ pdf, index, isActive, onClick }: { pdf: any; index: number; isActive: boolean; onClick: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;
        let active = true;
        let renderTask: any = null;
        (async () => {
            try {
                const page = await pdf.getPage(index + 1);
                if (!active || !canvasRef.current) return;
                const naturalVp = page.getViewport({ scale: 1.0 });
                const fitScale = 56 / naturalVp.width;
                const vp = page.getViewport({ scale: fitScale * 1.5 });
                const canvas = canvasRef.current;
                canvas.width = vp.width;
                canvas.height = vp.height;
                canvas.style.width = "56px";
                canvas.style.height = `${56 * (naturalVp.height / naturalVp.width)}px`;
                const ctx = canvas.getContext("2d", { alpha: false });
                if (ctx && active) {
                    renderTask = page.render({ canvasContext: ctx, viewport: vp });
                    await renderTask.promise;
                }
            } catch (e: any) {
                if (e?.name !== "RenderingCancelledException") {
                    console.error("Error rendering thumbnail", e);
                }
            }
        })();
        return () => {
            active = false;
            if (renderTask) {
                try { renderTask.cancel(); } catch {}
            }
        };
    }, [pdf, index]);

    return (
        <div
            onClick={onClick}
            style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "6px",
                width: "100%",
                borderRadius: 4,
                background: isActive ? "rgba(77,184,212,0.12)" : "transparent",
                border: `1px solid ${isActive ? T.accent : "transparent"}`,
                boxSizing: "border-box",
                transition: "all 0.15s ease-in-out",
            }}
        >
            <div
                style={{
                    width: 56,
                    minHeight: 72,
                    background: "#fff",
                    borderRadius: 2,
                    border: `1px solid ${T.border}`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                }}
            >
                <canvas ref={canvasRef} style={{ display: "block" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? T.accent : T.textSec }}>
                {index + 1}
            </span>
        </div>
    );
};

const PdfViewer = dynamic<any>(
    () => import("@/app/tools/pdf-signer/PdfViewer").then(m => m.default),
    {
        ssr: false,
        loading: () => (
            <div style={{
                height: 500, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 14,
                background: "#2a2a2a", borderRadius: 8,
                border: `1px solid ${T.border}`,
            }}>
                <div style={{
                    width: 32, height: 32,
                    border: `2px solid ${T.border}`,
                    borderTopColor: T.accent,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec }}>
                    Loading PDF Engine...
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        ),
    }
);

const TOOLS = [
    { id: "signature", icon: User,        label: "Signature",  desc: "Hand-drawn",  shortcut: "1", color: "#4db8d4" },
    { id: "initials",  icon: PencilLine,  label: "Initials",   desc: "Monogram",    shortcut: "2", color: "#38bdf8" },
    { id: "text",      icon: Type,        label: "Text",       desc: "Typeable",    shortcut: "3", color: "#f59e0b" },
    { id: "date",      icon: Calendar,    label: "Date",       desc: "Auto-fill",   shortcut: "4", color: "#10b981" },
    { id: "checkmark", icon: CheckSquare, label: "Checkmark",  desc: "Tick box",    shortcut: "5", color: "#ef4444" },
    { id: "stamp",     icon: Stamp,       label: "Stamp",      desc: "Status",      shortcut: "6", color: "#f97316" },
] as const;

type ToolId = typeof TOOLS[number]["id"];

const PRESET_COLORS = [
    { name: "Ink",    value: "#000000" },
    { name: "Blue",   value: "#1a3fbf" },
    { name: "Red",    value: "#dc2626" },
    { name: "Green",  value: "#059669" },
];
const PRESET_STAMPS = ["APPROVED", "DRAFT", "CONFIDENTIAL", "REJECTED", "VOID"];

const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(x => x + x).join("");
    const n = parseInt(hex, 16);
    return rgb((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        fontSize: 10, fontWeight: 400, color: T.textSec,
        letterSpacing: "normal", marginBottom: 6,
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: T.font
    }}>
        {children}
    </div>
);

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Smart PDF Signer",
    description: "Sign PDF documents professionally. Select an area, draw your signature, and apply it to one or all pages instantly. 100% private, browser-based.",
    url: "https://www.assetnest.space/tools/pdf-signer",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfSignerPage() {
    const [file,        setFile]        = useState<File | null>(null);
    const [pageCount,   setPageCount]   = useState(0);
    const [pdf,         setPdf]         = useState<any>(null);
    const [activePage,  setActivePage]  = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [outputUrl,   setOutputUrl]   = useState<string | null>(null);
    const [outputBlob,  setOutputBlob]  = useState<Blob | null>(null);
    const [isSharing,   setIsSharing]   = useState(false);
    const [signatures,  setSignatures]  = useState<Signature[]>([]);
    const [activeBox,   setActiveBox]   = useState<{ pageIndex: number; x: number; y: number; w: number; h: number } | null>(null);
    const [isPadOpen,   setIsPadOpen]   = useState(false);
    const [isDragging,  setIsDragging]  = useState(false);
    const [isMobile,    setIsMobile]    = useState(false);
    const [showHelp,    setShowHelp]    = useState(false);
    const [activeTool,  setActiveTool]  = useState<ToolId>("signature");
    const [dismissHint, setDismissHint] = useState(false);
    const [mounted,     setMounted]     = useState(false);

    const [selectedColor,  setSelectedColor]  = useState("#000000");
    const [selectedStamp,  setSelectedStamp]  = useState("APPROVED");
    const [selectedFont,   setSelectedFont]   = useState("Helvetica");
    const [isBold,         setIsBold]         = useState(false);
    const [isItalic,       setIsItalic]       = useState(false);
    const [isUnderline,    setIsUnderline]    = useState(false);
    const [activeSigId,    setActiveSigId]    = useState<string | null>(null);
    const [savedSignatures, setSavedSignatures] = useState<LibraryItem[]>([]);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
    const [defaultSignature, setDefaultSignature] = useState<string | null>(null);
    const [defaultInitials, setDefaultInitials] = useState<string | null>(null);

    const historyRef    = useRef<Signature[][]>([]);
    const historyIdxRef = useRef(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const fileInputRef  = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        if (!file) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Changes you made may not be saved. Are you sure you want to leave?";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [file]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("pdf_signer_library");
            if (saved) setSavedSignatures(JSON.parse(saved));
            const savedSig = localStorage.getItem("pdf_signer_default_signature");
            if (savedSig) setDefaultSignature(savedSig);
            const savedInit = localStorage.getItem("pdf_signer_default_initials");
            if (savedInit) setDefaultInitials(savedInit);
        } catch {}
    }, []);

    useEffect(() => {
        const sig = signatures.find(s => s.id === activeSigId);
        if (sig && (sig.type === "text" || sig.type === "date")) {
            setSelectedFont(sig.fontFamily || "Helvetica");
            setIsBold(sig.fontWeight === "bold");
            setIsItalic(sig.fontStyle === "italic" || sig.fontStyle === "oblique");
            setIsUnderline(sig.textDecoration === "underline");
            if (sig.color) setSelectedColor(sig.color);
        }
    }, [activeSigId, signatures]);

    const applyToActiveSig = (updates: Partial<Signature>) => {
        if (!activeSigId) return;
        pushSignatures(signatures.map(s => s.id === activeSigId ? { ...s, ...updates } : s));
    };

    const handleFontChange    = (v: string) => { setSelectedFont(v); applyToActiveSig({ fontFamily: v }); };
    const handleBoldClick     = () => { const v = !isBold; setIsBold(v); applyToActiveSig({ fontWeight: v ? "bold" : "normal" }); };
    const handleItalicClick   = () => { const v = !isItalic; setIsItalic(v); applyToActiveSig({ fontStyle: v ? "italic" : "normal" }); };
    const handleUnderlineClick = () => { const v = !isUnderline; setIsUnderline(v); applyToActiveSig({ textDecoration: v ? "underline" : "none" }); };
    const handleColorClick    = (v: string) => { setSelectedColor(v); applyToActiveSig({ color: v }); };

    const saveToLibrary = (dataUrl: string, type: "signature" | "initials") => {
        const item: LibraryItem = { id: crypto.randomUUID(), dataUrl, label: type === "signature" ? "Signature" : "Initials", createdAt: Date.now() };
        const updated = [item, ...savedSignatures].slice(0, 10);
        setSavedSignatures(updated);
        try { localStorage.setItem("pdf_signer_library", JSON.stringify(updated)); } catch {}
    };

    const deleteFromLibrary = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedSignatures.filter(s => s.id !== id);
        setSavedSignatures(updated);
        try { localStorage.setItem("pdf_signer_library", JSON.stringify(updated)); } catch {}
    };

    const syncUndoRedo = useCallback(() => {
        setCanUndo(historyIdxRef.current >= 0);
        setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const pushSignatures = useCallback((newSigs: Signature[]) => {
        setSignatures(newSigs);
        const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
        trimmed.push([...newSigs]);
        if (trimmed.length > 50) trimmed.shift();
        historyRef.current = trimmed;
        historyIdxRef.current = trimmed.length - 1;
        syncUndoRedo();
    }, [syncUndoRedo]);

    const setSigsNoHistory = useCallback((newSigs: Signature[]) => setSignatures(newSigs), []);

    const undo = useCallback(() => {
        if (historyIdxRef.current <= 0) {
            if (historyIdxRef.current === 0) { historyIdxRef.current = -1; setSignatures([]); syncUndoRedo(); }
            return;
        }
        historyIdxRef.current--;
        setSignatures([...historyRef.current[historyIdxRef.current]]);
        syncUndoRedo();
    }, [syncUndoRedo]);

    const redo = useCallback(() => {
        if (historyIdxRef.current >= historyRef.current.length - 1) return;
        historyIdxRef.current++;
        setSignatures([...historyRef.current[historyIdxRef.current]]);
        syncUndoRedo();
    }, [syncUndoRedo]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = document.activeElement?.tagName || "";
            if (["TEXTAREA", "INPUT"].includes(tag)) return;
            if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
            else if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
            const n = parseInt(e.key);
            if (n >= 1 && n <= 6 && !e.ctrlKey && !e.metaKey) setActiveTool(TOOLS[n - 1].id as ToolId);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [undo, redo]);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
        if (f.size === 0) { setError("This PDF file is empty or inaccessible (0 bytes). Please select a valid PDF."); return; }
        setError(null); setFile(f); setSignatures([]); setOutputUrl(null); setOutputBlob(null);
        historyRef.current = []; historyIdxRef.current = -1; syncUndoRedo();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0]; if (f) handleFile(f);
    };

    const handleBoxSelected = (box: typeof activeBox, toolOverride?: ToolId) => {
        if (!box) return;
        const currentTool = toolOverride || activeTool;
        if (currentTool === "signature" || currentTool === "initials") {
            if (selectedLibraryItem && selectedLibraryItem.label.toLowerCase() === currentTool) {
                const newSig: Signature = {
                    id: crypto.randomUUID(), type: currentTool,
                    dataUrl: selectedLibraryItem.dataUrl, pageIndex: box.pageIndex, x: box.x, y: box.y, width: box.w, height: box.h, allPages: false,
                };
                pushSignatures([...signatures, newSig]);
                setActiveSigId(newSig.id);
                setSelectedLibraryItem(null);
            } else {
                setActiveBox(box);
                setIsPadOpen(true);
            }
        }
        else if (currentTool === "text") addAnnotation("text", box, "");
        else if (currentTool === "date") addAnnotation("date", box, new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));
        else if (currentTool === "checkmark") addAnnotation("checkmark", box);
        else if (currentTool === "stamp") addAnnotation("stamp", box, selectedStamp);
    };

    const addAnnotation = (type: any, box: any, content?: string) => {
        const newSig: Signature = {
            id: crypto.randomUUID(), type, content,
            color: selectedColor, fontFamily: selectedFont,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
            pageIndex: box.pageIndex, x: box.x, y: box.y, width: box.w, height: box.h, allPages: false,
        };
        pushSignatures([...signatures, newSig]);
        setActiveSigId(newSig.id);
        setActiveBox(null);
    };

    const onSignatureSaved = (dataUrl: string, color?: string, boxOverride?: typeof activeBox) => {
        const isInitials = activeTool === "initials";
        if (isInitials) {
            setDefaultInitials(dataUrl);
            try { localStorage.setItem("pdf_signer_default_initials", dataUrl); } catch {}
        } else {
            setDefaultSignature(dataUrl);
            try { localStorage.setItem("pdf_signer_default_signature", dataUrl); } catch {}
        }

        const box = boxOverride || activeBox || {
            pageIndex: activePage,
            x: 0.38,
            y: 0.45,
            w: isInitials ? 0.12 : 0.24,
            h: isInitials ? 0.07 : 0.1
        };

        const newSig: Signature = {
            id: crypto.randomUUID(), type: isInitials ? "initials" : "signature",
            dataUrl, pageIndex: box.pageIndex, x: box.x, y: box.y, width: box.w, height: box.h, allPages: false,
        };
        pushSignatures([...signatures, newSig]);
        setActiveSigId(newSig.id);

        if (!boxOverride) {
            saveToLibrary(dataUrl, isInitials ? "initials" : "signature");
        }
        setIsPadOpen(false);
        setActiveBox(null);
    };

    const placeFromLibrary = (item: LibraryItem) => {
        setSelectedLibraryItem(selectedLibraryItem?.id === item.id ? null : item);
        setActiveTool(item.label.toLowerCase() as ToolId);
    };

    const toggleAllPages = (id: string) => pushSignatures(signatures.map(s => s.id === id ? { ...s, allPages: !s.allPages } : s));
    const removeSignature = (id: string) => pushSignatures(signatures.filter(s => s.id !== id));

    const reset = () => {
        setFile(null); setSignatures([]); historyRef.current = []; historyIdxRef.current = -1;
        syncUndoRedo(); setPageCount(0); setError(null); setOutputUrl(null);
        setOutputBlob(null); setIsSharing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const exportSignedPdf = async () => {
        if (!file || signatures.length === 0) return;
        setIsExporting(true); setError(null);
        try {
            const buf = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            const fonts = {
                "Helvetica": await pdfDoc.embedFont(StandardFonts.Helvetica),
                "Helvetica-Bold": await pdfDoc.embedFont(StandardFonts.HelveticaBold),
                "Helvetica-Oblique": await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
                "Helvetica-BoldOblique": await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
                "Times-Roman": await pdfDoc.embedFont(StandardFonts.TimesRoman),
                "Times-Bold": await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
                "Times-Italic": await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
                "Times-BoldItalic": await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
                "Courier": await pdfDoc.embedFont(StandardFonts.Courier),
                "Courier-Bold": await pdfDoc.embedFont(StandardFonts.CourierBold),
                "Courier-Oblique": await pdfDoc.embedFont(StandardFonts.CourierOblique),
                "Courier-BoldOblique": await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
            };
            const hFont = fonts["Helvetica-Bold"];

            for (const sig of signatures) {
                const applyTo = async (idx: number) => {
                    if (idx < 0 || idx >= pages.length) return;
                    const page = pages[idx];
                    const { width: pW, height: pH } = page.getSize();
                    const colorVal = hexToRgb(sig.color || "#000000");

                    if (sig.type === "signature" || sig.type === "initials") {
                        const b64 = sig.dataUrl!.split(",")[1];
                        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                        const isJpeg = sig.dataUrl!.startsWith("data:image/jpeg");
                        const img = isJpeg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
                        const { width: imgW, height: imgH } = img.scale(1);
                        const targetW = sig.width * pW; const targetH = sig.height * pH;
                        const imgRatio = imgW / imgH; const boxRatio = targetW / targetH;
                        let drawW = targetW, drawH = targetH;
                        let drawX = sig.x * pW, drawY = (1 - sig.y - sig.height) * pH;
                        if (imgRatio > boxRatio) { drawH = targetW / imgRatio; drawY += (targetH - drawH) / 2; }
                        else { drawW = targetH * imgRatio; drawX += (targetW - drawW) / 2; }
                        page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH });
                    } else if (sig.type === "text" || sig.type === "date") {
                        const text = sig.content || ""; if (!text.trim()) return;
                        const calcFS = (c: string, w: number, h: number) => {
                            if (!c) return Math.max(3, h * 0.65);
                            const lines = c.split("\n"); const nL = Math.max(1, lines.length);
                            const mC = Math.max(1, ...lines.map(l => l.length));
                            return Math.max(3, Math.min(h / (nL * 1.15), w / (mC * 0.55)));
                        };
                        const ptW = sig.width * pW; const ptH = sig.height * pH;
                        const fontSize = calcFS(text, ptW, ptH);
                        const ff = sig.fontFamily || "Helvetica";
                        const isB = sig.fontWeight === "bold"; const isI = sig.fontStyle === "italic" || sig.fontStyle === "oblique";
                        let fKey = "Helvetica";
                        if (ff === "Times-Roman" || ff.includes("Times")) {
                            fKey = isB && isI ? "Times-BoldItalic" : isB ? "Times-Bold" : isI ? "Times-Italic" : "Times-Roman";
                        } else if (ff === "Courier" || ff.includes("Courier")) {
                            fKey = isB && isI ? "Courier-BoldOblique" : isB ? "Courier-Bold" : isI ? "Courier-Oblique" : "Courier";
                        } else {
                            fKey = isB && isI ? "Helvetica-BoldOblique" : isB ? "Helvetica-Bold" : isI ? "Helvetica-Oblique" : "Helvetica";
                        }
                        const activeFont = fonts[fKey as keyof typeof fonts] || hFont;
                        const textLines = text.split("\n");
                        const lineHeight = fontSize * 1.3;
                        const baseX = sig.x * pW + 4;
                        const startY = (1 - sig.y) * pH - fontSize - 2;
                        textLines.forEach((line, lineIdx) => {
                            const lineY = startY - lineIdx * lineHeight;
                            if (line.trim()) {
                                page.drawText(line, { x: baseX, y: lineY, size: fontSize, font: activeFont, color: colorVal });
                            }
                            if (sig.textDecoration === "underline" && line.trim()) {
                                const tw = activeFont.widthOfTextAtSize(line, fontSize);
                                page.drawLine({ start: { x: baseX, y: lineY - 2 }, end: { x: baseX + tw, y: lineY - 2 }, thickness: Math.max(1, fontSize * 0.05), color: colorVal });
                            }
                        });
                    } else if (sig.type === "checkmark") {
                        const x = sig.x * pW; const y = (1 - sig.y - sig.height) * pH;
                        const w = sig.width * pW; const h = sig.height * pH;
                        const sqSize = Math.min(w, h) * 0.85;
                        const bx = x + (w - sqSize) / 2; const by = y + (h - sqSize) / 2;
                        const th = Math.max(1.5, sqSize * 0.05);
                        page.drawRectangle({ x: bx, y: by, width: sqSize, height: sqSize, borderColor: colorVal, borderWidth: th });
                        const mid = { x: bx + sqSize * 0.45, y: by + sqSize * 0.3 };
                        page.drawLine({ start: { x: bx + sqSize * 0.22, y: by + sqSize * 0.48 }, end: mid, thickness: Math.max(2, sqSize * 0.1), color: colorVal });
                        page.drawLine({ start: mid, end: { x: bx + sqSize * 0.75, y: by + sqSize * 0.7 }, thickness: Math.max(2, sqSize * 0.1), color: colorVal });
                    } else if (sig.type === "stamp") {
                        const x = sig.x * pW; const y = (1 - sig.y - sig.height) * pH;
                        const w = sig.width * pW; const h = sig.height * pH;
                        const text = sig.content || "APPROVED";
                        const cx = x + w / 2; const cy = y + h / 2;
                        const fontSize = Math.max(8, Math.min(w * 0.12, h * 0.55));
                        const tw = hFont.widthOfTextAtSize(text, fontSize);
                        page.drawText(text, { x: cx - tw / 2, y: cy - fontSize / 2.5, size: fontSize, font: hFont, color: colorVal });
                        const px = fontSize * 0.8; const py = fontSize * 0.4;
                        page.drawRectangle({ x: cx - tw / 2 - px / 2, y: cy - fontSize / 2.5 - py / 2, width: tw + px, height: fontSize + py, borderColor: colorVal, borderWidth: Math.max(2, fontSize * 0.1) });
                    }
                };
                if (sig.allPages) { for (let i = 0; i < pages.length; i++) await applyTo(i); }
                else await applyTo(sig.pageIndex);
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            setOutputBlob(blob);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError("Could not generate signed PDF. Please ensure the file is not corrupted.");
        } finally { setIsExporting(false); }
    };

    const fadeIn = (delay = 0) => ({
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
    });

    return (
        <div className={`w-full min-h-screen bg-[#333333] text-[#cccccc] font-sans relative overflow-x-hidden ig-root flex flex-col ${file ? "h-screen overflow-hidden pb-0" : "pb-24"}`}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
                @keyframes dragBox {
                    0% { width: 0; height: 0; opacity: 0; }
                    15% { width: 0; height: 0; opacity: 1; }
                    70% { width: 176px; height: 76px; opacity: 1; }
                    85% { width: 176px; height: 76px; opacity: 0; }
                    100% { width: 0; height: 0; opacity: 0; }
                }
                @keyframes dragPointer {
                    0% { transform: translate(0, 0) scale(1); opacity: 0; }
                    8% { transform: translate(0, 0) scale(1); opacity: 1; }
                    12% { transform: translate(0, 0) scale(0.8); opacity: 1; }
                    16% { transform: translate(0, 0) scale(0.8); opacity: 1; }
                    70% { transform: translate(176px, 76px) scale(0.8); opacity: 1; }
                    76% { transform: translate(176px, 76px) scale(1); opacity: 1; }
                    85% { transform: translate(176px, 76px) scale(1); opacity: 0; }
                    100% { transform: translate(0, 0) scale(1); opacity: 0; }
                }
                @keyframes dragRipple {
                    0%, 100% { transform: scale(0); opacity: 0; }
                    10% { transform: scale(0); opacity: 1; }
                    22% { transform: scale(2.2); opacity: 0; }
                }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #555555; border-radius: 2px; }
            `}</style>

            {/* ─── 1. LANDING PAGE STATE (when !file) ─── */}
            {!file && (
                <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6">
                    {/* Header */}
                    <header className="max-w-5xl mx-auto pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                        <Link
                            href="/tools"
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#3a3a3a] border border-[#555555] rounded text-[#aaa] font-normal text-[11px] hover:bg-[#444444] transition-colors"
                        >
                            <ArrowLeft size={11} strokeWidth={2} /> Back
                        </Link>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] text-xs border border-[#555555] bg-[#3a3a3a]">
                                <PenTool size={12} />
                            </div>
                            <span className="text-[12px] sm:text-[14px] font-medium tracking-normal text-[#ccc]">
                                PDF Signer
                            </span>
                            <button 
                                onClick={() => setShowHelp(true)}
                                className="p-1 bg-[#3a3a3a] border border-[#555555] rounded text-[#888] hover:bg-[#444444] transition-colors ml-1"
                                title="Help Guide"
                            >
                                <HelpCircle size={11} />
                            </button>
                        </div>
                    </header>


                    {/* Upload Drop Zone */}
                    <div style={fadeIn(0.1)}>
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="application/pdf" 
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} 
                            style={{ display: "none" }} 
                        />
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                border: `1px dashed ${isDragging ? T.accent : T.border}`,
                                borderRadius: 4, background: isDragging ? T.surfaceHi : T.surface,
                                cursor: "pointer", transition: "all 0.2s", padding: 32, marginBottom: 40,
                            }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                <UploadCloud size={22} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                Drop your PDF here
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>
                                or click to browse your files · 100% Client-side Processing
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                <Chip icon={<Zap size={10} />} label="No Server Upload" />
                                <Chip icon={<Check size={10} />} label="Free Forever" />
                            </div>
                        </div>

                        {/* Feature Cards Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 48 }}>
                            {[
                                { icon: ShieldCheck, title: "Security & Privacy First", desc: "Your documents remain strictly confidential. With zero data tracking and no server storage, we ensure your sensitive files stay private." },
                                { icon: Zap, title: "Local Process, No File Upload", desc: "Sign PDF documents directly in your browser. All conversions occur locally in RAM, offering maximum security." },
                                { icon: Globe, title: "100% Free & No Registration", desc: "Truly free with no sign-up or credit card required. No usage limits, watermark stamps, or surprise subscription tiers." },
                                { icon: MousePointer2, title: "Legally Binding eSignatures", desc: "Create simple electronic signatures and place initials that support legally compliant workflows under UETA and the ESIGN Act." },
                                { icon: Palette, title: "Define Your Signature Style", desc: "Draw or type signature overlays with customizable ink colors, custom stamps, and elegant typography to match your brand." },
                                { icon: MonitorSmartphone, title: "Sign Anywhere, on Any Device", desc: "Access our secure online tool on Mac, Windows, iOS, or Android. Sign your contracts anytime with zero software installation." },
                            ].map(f => (
                                <div key={f.title} style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <div style={{ color: T.accent }}>
                                            <f.icon size={15} />
                                        </div>
                                        <h3 style={{ fontSize: 12, fontWeight: 500, margin: 0, color: T.textPri }}>{f.title}</h3>
                                    </div>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* How-to Steps Timeline */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 48 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 20 }}>
                                How to eSign PDF Online for Free
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                                {[
                                    { step: "1", title: "Upload PDF File", desc: "Click 'Drop your PDF here' or drag and drop your document into our secure browser-side signer upload zone." },
                                    { step: "2", title: "Sign & Annotate", desc: "Draw your signature, place initials, add text, select dates, or place status stamps anywhere on the document canvas." },
                                    { step: "3", title: "Download File", desc: "Click 'Finalise & Sign' to compile and download your signed digital PDF document in seconds." }
                                ].map(s => (
                                    <div key={s.step} style={{ padding: 14, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 3, position: "relative", paddingTop: 20 }}>
                                        <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {s.step}
                                        </div>
                                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 6px" }}>{s.title}</h4>
                                        <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contrast Table Section */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 48 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 4 }}>
                                Electronic vs. Digital Signatures: Which Do You Need?
                            </h3>
                            <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", marginBottom: 20 }}>
                                Discover the differences between visual electronic overlays and certificate-backed cryptographic digital signatures.
                            </p>
                            <div style={{ background: "#323232", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#2e2e2e" }}>
                                            <th style={{ padding: 10, fontWeight: 500, color: T.textPri }}>Capability</th>
                                            <th style={{ padding: 10, fontWeight: 500, color: T.accent }}>PDF Electronic Signature (This Tool)</th>
                                            <th style={{ padding: 10, fontWeight: 500, color: T.textSec }}>PDF Digital Signature</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { cap: "Best Use Case", es: "Personal & standard commercial contracts", ds: "High-stakes government & notary agreements" },
                                            { cap: "Signature Type", es: "Visual hand-drawn signature overlays", ds: "CA-Certified cryptographic digital ID" },
                                            { cap: "Security Focus", es: "100% on-device private browser processing", ds: "Tamper-proof encrypted certificate locks" },
                                            { cap: "Process Location", es: "Instant inside your browser (local memory)", ds: "Requires third-party servers / cloud keys" },
                                            { cap: "Ease of Use", es: "Extremely fast, free, and no sign-up", ds: "Requires registration and USB tokens" },
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx < 4 ? `1px solid ${T.borderDim}` : "none" }}>
                                                <td style={{ padding: 10, fontWeight: 500, color: T.textPri }}>{row.cap}</td>
                                                <td style={{ padding: 10, color: T.accent }}>{row.es}</td>
                                                <td style={{ padding: 10, color: T.textSec }}>{row.ds}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Accordion */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 20 }}>
                                Frequently Asked Questions - PDF Signature Online
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
                                <FAQItem 
                                    question="Is it really a free PDF signature tool with no sign up?" 
                                    answer="Yes! You can fill and sign PDF online free without creating any account or signing up. There are no limits, no watermarks, and no hidden subscriptions." 
                                />
                                <FAQItem 
                                    question="How does the digital signature on PDF work privately?" 
                                    answer="Unlike cloud PDF signing tools, our engine runs entirely in your browser using WebAssembly and client-side canvas. Your PDF documents and drawn signatures are never uploaded to any server." 
                                />
                                <FAQItem 
                                    question="How do I add a signature to a PDF and download it?" 
                                    answer="Simply drop your document into the upload zone, click 'Signature', draw your signature, and place it anywhere on the document. Click 'Finalise & Sign' to compile and download your signed PDF." 
                                />
                                <FAQItem 
                                    question="Can I apply signatures or initials across all pages?" 
                                    answer="Yes! Each placed annotation has an 'All Pages' toggle in the right sidebar or annotations log, allowing you to instantly duplicate initials across multi-page contracts." 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 2. THREE-COLUMN EDITOR STUDIO (when file is loaded) ─── */}
            {file && (
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    height: "100%", 
                    width: "100%", 
                    overflow: "hidden", 
                    zIndex: 1,
                    position: "relative",
                    background: T.bg
                }}>
                    {/* Top Toolbar */}
                    <header className="h-14 border-b border-[#555555] bg-[#3a3a3a] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 relative">
                        {/* Filename dropdown / tool info */}
                        <div 
                            className="flex items-center gap-2 px-2.5 py-1 bg-[#444444] border border-[#555555] rounded cursor-pointer hover:bg-[#505050] transition-all"
                            onClick={() => setShowHelp(true)}
                        >
                            <div className="w-5 h-5 rounded bg-[#4db8d4]/20 border border-[#555555] flex items-center justify-center text-[#4db8d4]">
                                <FileText size={11} />
                            </div>
                            {!isMobile && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-[#cccccc] max-w-[200px] truncate">{file.name}</span>
                                    <ChevronDown size={12} className="text-[#888888]" />
                                </div>
                            )}
                        </div>

                        {/* Page controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const prev = Math.max(0, activePage - 1);
                                    setActivePage(prev);
                                    document.getElementById(`pdf-page-${prev}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                disabled={activePage === 0}
                                className="w-7 h-7 rounded border border-[#555555] bg-[#444444] flex items-center justify-center text-[#cccccc] hover:bg-[#505050] disabled:opacity-30 transition-all cursor-pointer"
                            >
                                <ChevronUp size={13} strokeWidth={2.5} />
                            </button>
                            <span className="text-xs font-medium text-[#cccccc] w-16 text-center tabular-nums">
                                {activePage + 1} / {pageCount}
                            </span>
                            <button
                                onClick={() => {
                                    const next = Math.min(pageCount - 1, activePage + 1);
                                    setActivePage(next);
                                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                disabled={activePage === pageCount - 1}
                                className="w-7 h-7 rounded border border-[#555555] bg-[#444444] flex items-center justify-center text-[#cccccc] hover:bg-[#505050] disabled:opacity-30 transition-all cursor-pointer"
                            >
                                <ChevronDown size={13} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Action buttons (Undo/Redo/Reset) */}
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1 pr-2 border-r border-[#555555]">
                                <button
                                    onClick={undo}
                                    disabled={!canUndo}
                                    title="Undo (Ctrl+Z)"
                                    className="w-7 h-7 rounded border border-[#555555] bg-[#444444] flex items-center justify-center text-[#cccccc] hover:bg-[#505050] disabled:opacity-30 transition-all cursor-pointer"
                                >
                                    <Undo2 size={12} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={!canRedo}
                                    title="Redo (Ctrl+Y)"
                                    className="w-7 h-7 rounded border border-[#555555] bg-[#444444] flex items-center justify-center text-[#cccccc] hover:bg-[#505050] disabled:opacity-30 transition-all cursor-pointer"
                                >
                                    <Redo2 size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                            <button
                                onClick={reset}
                                className="h-7 px-2.5 rounded border border-[#555555] bg-[#3a3a3a] hover:bg-[#cc4444]/20 text-[#cccccc] text-xs font-normal flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <RefreshCw size={11} strokeWidth={2.5} />{!isMobile && " Change PDF"}
                            </button>
                        </div>
                    </header>

                    {/* 3-COLUMN BODY CONTENT */}
                    <div className="flex flex-1 overflow-hidden w-full min-h-0">
                        {/* COLUMN 1: LEFT SIDEBAR (~96px) Page Thumbnails */}
                        <aside 
                            data-lenis-prevent="true"
                            className="w-24 border-r border-[#555555] bg-[#3a3a3a] overflow-y-auto overscroll-contain flex flex-col items-center py-4 gap-3 shrink-0 hidden md:flex"
                        >
                            {Array.from({ length: pageCount }, (_, i) => (
                                <PdfThumbnail
                                    key={i}
                                    pdf={pdf}
                                    index={i}
                                    isActive={activePage === i}
                                    onClick={() => {
                                        setActivePage(i);
                                        document.getElementById(`pdf-page-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                />
                            ))}
                        </aside>

                        {/* COLUMN 2: CENTER CANVAS (flex-grow) */}
                        <main 
                            data-lenis-prevent="true"
                            className="flex-1 bg-[#2a2a2a] p-3 sm:p-6 pb-24 flex flex-col gap-4 overflow-y-auto overscroll-contain relative min-w-0"
                        >
                            {/* Success Card */}
                            {outputUrl && (
                                <div className="bg-[#3a3a3a] border border-[#555555] p-8 sm:p-12 rounded-2xl flex flex-col items-center gap-6 text-center max-w-xl mx-auto my-10 relative overflow-hidden">
                                    <div className="w-14 h-14 bg-[#4db8d4]/20 border border-[#555555] rounded-xl flex items-center justify-center text-[#4db8d4] mb-1">
                                        <Check size={28} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-semibold text-[#cccccc] tracking-tight">Document Signed</h3>
                                        <p className="text-xs text-[#888888] font-normal mt-1">Your finalized PDF is compiled and ready for download.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mt-4">
                                        <a
                                            href={outputUrl}
                                            download={`signed_${file.name}`}
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent("assetnest-download", {
                                                    detail: {
                                                        filename: `signed_${file.name}`,
                                                        size: "Finalized PDF"
                                                    }
                                                }));
                                            }}
                                            className="h-10 rounded bg-[#4db8d4] border border-[#555555] text-[#1a1a1a] text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#38bdf8] transition-all text-center"
                                        >
                                            <Download size={15} /> Download PDF
                                        </a>
                                        <button
                                            onClick={() => setIsSharing(true)}
                                            className="h-10 rounded bg-[#444444] border border-[#555555] text-[#cccccc] text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#505050] transition-all text-center"
                                        >
                                            <Share2 size={15} /> Share File
                                        </button>
                                        <button
                                            onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                            className="col-span-1 sm:col-span-2 h-9 rounded bg-[#3a3a3a] border border-[#555555] text-[#888888] hover:text-[#cccccc] text-xs font-normal flex items-center justify-center gap-1.5 hover:bg-[#444444] transition-all mt-1 cursor-pointer"
                                        >
                                            ← Back to Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Document Viewer Canvas with How-To-Sign Animation Guide */}
                            {!outputUrl && (
                                <div className="flex-1 bg-[#333333] border border-[#555555] rounded-xl p-2 relative min-h-[500px]">
                                    {/* ── THE ANIMATED GUIDE OVERLAY ── */}
                                    {signatures.length === 0 && !dismissHint && (
                                        <div 
                                            style={{ 
                                                position: "absolute", 
                                                inset: 0, 
                                                zIndex: 100, 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center", 
                                                background: "rgba(0, 0, 0, 0.65)", 
                                                backdropFilter: "blur(3px)",
                                                borderRadius: 12,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <div style={{ 
                                                position: "relative", width: 320, height: 260, 
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
                                                pointerEvents: "auto", background: T.surface, border: `1px solid ${T.border}`, 
                                                padding: 24, borderRadius: 8, boxShadow: "0 12px 32px rgba(0,0,0,0.6)" 
                                            }}>
                                                {/* Close button top right */}
                                                <button onClick={() => setDismissHint(true)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec }} title="Dismiss Guide">
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>

                                                {/* Drag demonstration box */}
                                                <div style={{ position: "relative", width: 220, height: 110, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 6, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", overflow: "hidden" }}>
                                                    
                                                    {/* Animated expanding box */}
                                                    <div style={{ 
                                                        position: "absolute", 
                                                        top: 16, 
                                                        left: 20, 
                                                        border: `2px dashed ${T.accent}`, 
                                                        background: `${T.accent}20`, 
                                                        borderRadius: 4,
                                                        animation: "dragBox 3.5s infinite ease-in-out",
                                                        boxSizing: "border-box",
                                                    }}>
                                                        {/* Simulated Signature placeholder inside box */}
                                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <span style={{ fontSize: 9, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>Signature Block</span>
                                                        </div>
                                                    </div>

                                                    {/* Click Ripple effect */}
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 16,
                                                        left: 20,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: "50%",
                                                        background: T.accent,
                                                        marginLeft: -12,
                                                        marginTop: -12,
                                                        animation: "dragRipple 3.5s infinite ease-in-out",
                                                        pointerEvents: "none",
                                                    }} />

                                                    {/* Animated Cursor */}
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 16,
                                                        left: 20,
                                                        marginLeft: -6,
                                                        marginTop: -6,
                                                        color: "#fff",
                                                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
                                                        animation: "dragPointer 3.5s infinite ease-in-out",
                                                        zIndex: 10,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}>
                                                        <MousePointer2 size={16} fill="#fff" />
                                                        <div style={{
                                                            padding: "2px 6px",
                                                            background: "#fff",
                                                            color: "#000",
                                                            fontSize: 8,
                                                            fontWeight: 700,
                                                            borderRadius: 3,
                                                            whiteSpace: "nowrap",
                                                            textTransform: "uppercase",
                                                        }}>
                                                            Drag to place
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Text guidelines below animation */}
                                                <div style={{ textAlign: "center", marginTop: 14, zIndex: 10 }}>
                                                    <h4 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: "0 0 4px" }}>Click & Drag on Document</h4>
                                                    <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 12px", lineHeight: 1.4, padding: "0 8px" }}>Simply press down, drag to your desired size, and release to place your signature anywhere!</p>
                                                    <button 
                                                        onClick={() => setDismissHint(true)} 
                                                        style={{ 
                                                            padding: "5px 16px", 
                                                            borderRadius: 3, 
                                                            background: T.accent, 
                                                            border: "none", 
                                                            color: "#1a1a1a", 
                                                            fontSize: 10, 
                                                            fontWeight: 600, 
                                                            cursor: "pointer",
                                                            transition: "all 0.15s"
                                                        }}
                                                    >
                                                        I Got It
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <PdfViewer
                                        file={file}
                                        signatures={signatures}
                                        setSignatures={setSigsNoHistory}
                                        pushSignatures={pushSignatures}
                                        onBoxSelected={handleBoxSelected}
                                        applyToAllPages={(sig: any) => toggleAllPages(sig.id)}
                                        onLoadSuccess={(numPages: number, loadedPdf?: any) => {
                                            setPageCount(numPages);
                                            if (loadedPdf) setPdf(loadedPdf);
                                        }}
                                        onPageChange={setActivePage}
                                        activeTool={activeTool}
                                        activeSigId={activeSigId}
                                        setActiveSigId={setActiveSigId}
                                    />
                                </div>
                            )}

                            {/* Annotations Log Footer inside Canvas area */}
                            {!outputUrl && signatures.length > 0 && (
                                <div style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, display: "flex", alignItems: "center", gap: 14, overflowX: "auto" }}>
                                    <div style={{ fontSize: 10, fontWeight: 500, color: T.textSec, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                        <Layers size={12} /> Log ({signatures.length})
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flex: 1 }}>
                                        {signatures.map(sig => (
                                            <div
                                                key={sig.id}
                                                style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 8px", background: "#444444", border: `1px solid ${T.border}`, borderRadius: 3, flexShrink: 0 }}
                                            >
                                                <div style={{ width: 24, height: 20, background: "#fff", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 1 }}>
                                                    {sig.type === "signature" || sig.type === "initials" ? (
                                                        <img src={sig.dataUrl} alt="sig" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                    ) : sig.type === "text" ? (
                                                        <Type size={11} style={{ color: "#000" }} />
                                                    ) : sig.type === "date" ? (
                                                        <Calendar size={11} style={{ color: "#000" }} />
                                                    ) : sig.type === "stamp" ? (
                                                        <Stamp size={11} style={{ color: "#000" }} />
                                                    ) : (
                                                        <CheckSquare size={11} style={{ color: "#000" }} />
                                                    )}
                                                </div>
                                                <span style={{ fontSize: 10, fontWeight: 500, color: T.textPri }}>
                                                    {sig.allPages ? "All Pages" : `Page ${sig.pageIndex + 1}`}
                                                </span>
                                                <button
                                                    onClick={() => removeSignature(sig.id)}
                                                    style={{ width: 18, height: 18, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: T.textSec, cursor: "pointer" }}
                                                    title="Remove element"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </main>

                        {/* COLUMN 3: RIGHT SIGNING OPTIONS PANEL (~320px) */}
                        <aside className="w-80 border-l border-[#555555] bg-[#3a3a3a] flex flex-col h-full min-h-0 shrink-0 relative hidden md:flex">
                            <div 
                                data-lenis-prevent="true"
                                className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-5 pb-24"
                            >
                                <div>
                                    <h2 className="text-xs font-semibold text-[#cccccc] uppercase tracking-wider">Signing options</h2>
                                    <p className="text-[10px] text-[#888888] font-normal mt-0.5">Select signature types or tools to place on canvas.</p>
                                </div>

                                {/* Required fields */}
                                <div className="flex flex-col gap-2">
                                    <SectionLabel><User size={12} />Required fields</SectionLabel>
                                    <div className="flex flex-col gap-2">
                                        {/* 1. Signature */}
                                        {(() => {
                                            const signatureItem = signatures.find(s => s.type === "signature");
                                            return (
                                                <div
                                                    onClick={() => {
                                                        setActiveTool("signature");
                                                        setActiveBox(null);
                                                        setIsPadOpen(true);
                                                    }}
                                                    className={`p-2.5 border border-[#555555] rounded cursor-pointer transition-all flex items-center justify-between ${activeTool === "signature" ? "bg-[#444444] border-[#4db8d4]" : "bg-[#333333] hover:bg-[#444444]"}`}
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-[#4db8d4]/20 border border-[#555555] flex items-center justify-center text-[#4db8d4]">
                                                            <User size={13} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-medium text-[#cccccc]">Signature</div>
                                                            <div className="text-[10px] text-[#888888] mt-0.5 leading-none">
                                                                {signatureItem ? "Signature placed" : "Click to draw or type"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 2. Initials */}
                                        {(() => {
                                            const initialsItem = signatures.find(s => s.type === "initials");
                                            return (
                                                <div
                                                    onClick={() => {
                                                        setActiveTool("initials");
                                                        setActiveBox(null);
                                                        setIsPadOpen(true);
                                                    }}
                                                    className={`p-2.5 border border-[#555555] rounded cursor-pointer transition-all flex items-center justify-between ${activeTool === "initials" ? "bg-[#444444] border-[#4db8d4]" : "bg-[#333333] hover:bg-[#444444]"}`}
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-[#38bdf8]/20 border border-[#555555] flex items-center justify-center text-[#38bdf8]">
                                                            <PencilLine size={13} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-medium text-[#cccccc]">Initials</div>
                                                            <div className="text-[10px] text-[#888888] mt-0.5 leading-none">
                                                                {initialsItem ? "Initials placed" : "Click to draw or type"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Optional fields */}
                                <div className="flex flex-col gap-2">
                                    <SectionLabel><Layers size={12} />Optional fields</SectionLabel>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "text", icon: Type, label: "Text", desc: "Typeable standard textbox", color: "text-[#f59e0b] bg-[#f59e0b]/15" },
                                            { id: "date", icon: Calendar, label: "Date", desc: "Auto-populates current date", color: "text-[#10b981] bg-[#10b981]/15" },
                                            { id: "checkmark", icon: CheckSquare, label: "Check", desc: "Verification mark", color: "text-[#ef4444] bg-[#ef4444]/15" },
                                            { id: "stamp", icon: Stamp, label: "Stamp", desc: "Official status mark", color: "text-[#f97316] bg-[#f97316]/15" }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTool(item.id as ToolId);
                                                }}
                                                className={`p-2 border border-[#555555] rounded cursor-pointer transition-all flex items-center gap-2 ${activeTool === item.id ? "bg-[#444444] border-[#4db8d4]" : "bg-[#333333] hover:bg-[#444444]"}`}
                                            >
                                                <div className={`w-6 h-6 rounded border border-[#555555] flex items-center justify-center ${item.color}`}>
                                                    <item.icon size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium text-[#cccccc]">{item.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Options / Property Card (Context Aware) */}
                                {(() => {
                                    const activeSig = signatures.find(s => s.id === activeSigId);
                                    const showProps = activeSig && ["text", "date", "stamp", "checkmark"].includes(activeSig.type);
                                    if (!showProps) return null;
                                    return (
                                        <div className="p-3.5 bg-[#333333] border border-[#555555] rounded flex flex-col gap-3">
                                            <div className="text-[10px] font-medium text-[#cccccc] uppercase tracking-wider">Field Properties</div>

                                            {(activeSig.type === "text" || activeSig.type === "date") && (
                                                <div className="flex flex-col gap-2">
                                                    <select value={selectedFont} onChange={e => handleFontChange(e.target.value)} className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#555555] rounded text-xs font-normal text-[#cccccc] outline-none cursor-pointer">
                                                        <option value="Helvetica">Helvetica</option>
                                                        <option value="Times-Roman">Times New Roman</option>
                                                        <option value="Courier">Courier</option>
                                                    </select>
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { label: <Bold size={12} strokeWidth={2.5} />, active: isBold, onClick: handleBoldClick },
                                                            { label: <Italic size={12} strokeWidth={2.5} />, active: isItalic, onClick: handleItalicClick },
                                                            { label: <Underline size={12} strokeWidth={2.5} />, active: isUnderline, onClick: handleUnderlineClick },
                                                        ].map((btn, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={btn.onClick} 
                                                                className={`flex-grow h-7 rounded border border-[#555555] flex items-center justify-center transition-all cursor-pointer ${btn.active ? "bg-[#4db8d4] text-[#1a1a1a] font-bold" : "bg-[#444444] text-[#888888] hover:bg-[#505050]"}`}
                                                            >
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeSig.type === "stamp" && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {PRESET_STAMPS.map(s => (
                                                            <button 
                                                                key={s} 
                                                                onClick={() => { setSelectedStamp(s); applyToActiveSig({ content: s }); }} 
                                                                className={`px-2 py-1 rounded border border-[#555555] text-[9px] font-medium uppercase tracking-wider transition-all cursor-pointer ${selectedStamp === s ? "bg-[#4db8d4] text-[#1a1a1a]" : "bg-[#444444] text-[#888888] hover:bg-[#505050]"}`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={activeSig.content || ""}
                                                        onChange={e => {
                                                            const val = e.target.value.toUpperCase();
                                                            setSignatures(signatures.map(s => s.id === activeSigId ? { ...s, content: val } : s));
                                                        }}
                                                        onBlur={e => {
                                                            const val = e.target.value.toUpperCase();
                                                            pushSignatures(signatures.map(s => s.id === activeSigId ? { ...s, content: val } : s));
                                                        }}
                                                        onPointerDown={e => e.stopPropagation()}
                                                        placeholder="Custom stamp text..."
                                                        className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#555555] rounded text-xs font-normal text-[#cccccc] outline-none placeholder-zinc-500 uppercase"
                                                    />
                                                </div>
                                            )}

                                            {/* Color swatches */}
                                            <div className="flex gap-2 justify-center mt-1">
                                                {PRESET_COLORS.map(c => (
                                                    <button 
                                                        key={c.value} 
                                                        onClick={() => handleColorClick(c.value)} 
                                                        title={c.name} 
                                                        className="w-5 h-5 rounded-full cursor-pointer transition-all border border-[#555555]"
                                                        style={{ 
                                                            background: c.value, 
                                                            border: selectedColor === c.value ? "2px solid #4db8d4" : "1px solid #555555", 
                                                            transform: selectedColor === c.value ? "scale(1.2)" : "scale(1)", 
                                                        }} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Saved signatures library list */}
                                {savedSignatures.length > 0 && (
                                    <div className="p-3 bg-[#333333] border border-[#555555] rounded">
                                        <SectionLabel><Save size={11} />My Signatures</SectionLabel>
                                        <div className="flex flex-col gap-2">
                                            {savedSignatures.slice(0, 3).map(sig => {
                                                const isSelected = selectedLibraryItem?.id === sig.id;
                                                return (
                                                    <div 
                                                        key={sig.id} 
                                                        onClick={() => placeFromLibrary(sig)} 
                                                        className={`relative h-11 bg-[#2a2a2a] rounded p-1 cursor-pointer border border-[#555555] transition-all ${isSelected ? "border-[#4db8d4] bg-[#444444]" : ""}`}
                                                    >
                                                        <img src={sig.dataUrl} alt="saved sig" className="w-full h-full object-contain" />
                                                        <button onClick={e => deleteFromLibrary(sig.id, e)} className="absolute top-1 right-1 w-4 h-4 bg-[#cc4444]/30 hover:bg-[#cc4444] border-none rounded flex items-center justify-center text-[#ff8888] hover:text-white cursor-pointer transition-colors">
                                                            <Trash2 size={8} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className={`text-[10px] text-center mt-2 ${selectedLibraryItem ? "text-[#4db8d4]" : "text-[#888888]"}`}>
                                            {selectedLibraryItem ? "Loaded! Click on PDF to place." : "Click signature to select and place on document"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky sign action footer in Right Column */}
                            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-[#3a3a3a] border-t border-[#555555] z-10">
                                <button
                                    onClick={exportSignedPdf}
                                    disabled={signatures.length === 0 || isExporting}
                                    className={`w-full h-10 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all uppercase tracking-wider cursor-pointer ${
                                        signatures.length === 0 || isExporting
                                            ? "bg-[#444444] border border-[#555555] text-[#777777] cursor-not-allowed opacity-60"
                                            : "bg-[#4db8d4] text-[#1a1a1a] hover:bg-[#38bdf8] border-none"
                                    }`}
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />
                                            Finalising...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} strokeWidth={3} />
                                            Finalise & Sign PDF
                                        </>
                                    )}
                                </button>
                            </footer>
                        </aside>
                    </div>

                    {/* MOBILE BOTTOM TOOLBAR */}
                    {isMobile && (
                        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-[#3a3a3a] border-t border-[#555555] p-2.5">
                            <button
                                onClick={exportSignedPdf}
                                disabled={signatures.length === 0 || isExporting}
                                className={`w-full h-10 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                    signatures.length === 0 || isExporting
                                        ? "bg-[#444444] text-[#777777] cursor-not-allowed"
                                        : "bg-[#4db8d4] text-[#1a1a1a]"
                                }`}
                            >
                                {isExporting ? "Finalising..." : <><Check size={14} strokeWidth={3} /> Finalise & Sign PDF</>}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Signer Technical Specs">
                <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
                    <section className="space-y-3">
                        <h3 className="text-base font-bold text-[#cccccc]">
                            Local PDF Signature Infrastructure
                        </h3>
                        <p className="text-xs text-[#999999] leading-relaxed font-normal">
                            AssetNest Professional PDF Signer utilizes client-side WebAssembly primitives and canvas buffers. All cryptographic parsing and image embeds occur strictly in browser memory, guaranteeing that sensitive legal and commercial documents never touch any server.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-bold text-[#cccccc]">
                            Guidelines for Best Results
                        </h3>
                        <ul className="space-y-2 text-xs text-[#999999] leading-relaxed font-normal">
                            <li>• <strong>Drawing vs Typing:</strong> Draw freehand with mouse or stylus, or type your name to generate a smooth cursive signature script.</li>
                            <li>• <strong>Multi-Page Support:</strong> Toggle 'All Pages' on any placed element to stamp across every sheet automatically.</li>
                            <li>• <strong>Legal Compliance:</strong> Adheres to US ESIGN and European eIDAS requirements for electronic agreements.</li>
                        </ul>
                    </section>
                </div>
            </HelpModal>

            {/* Signature Pad Modal */}
            {isPadOpen && (
                <SignaturePad
                    defaultTab={activeTool === "initials" ? "initials" : "signature"}
                    onCancel={() => { setIsPadOpen(false); setActiveBox(null); }}
                    onSave={onSignatureSaved}
                />
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={outputBlob}
                fileName={file ? `Signed_${file.name}` : "signed_document.pdf"}
            />
        </div>
    );
}
