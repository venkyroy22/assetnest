"use client";

import "./polyfill";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Upload, Download, RefreshCw, PenTool, Info, X, Check, Save,
    MousePointer2, Layers, FileText, Share2, PencilLine, Sparkles,
    Trash2, ShieldCheck, User, Type, Calendar, CheckSquare,
    Undo2, Redo2, Stamp, Palette, Bold, Italic, Underline,
    Zap, Lock, Globe, ChevronDown, ChevronUp
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });
import type { Signature, LibraryItem } from "@/app/tools/pdf-signer/types";
import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";
import HelpModal from "@/components/HelpModal";

/* ─── Page Thumbnail Renderer ─── */
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
                const fitScale = 64 / naturalVp.width;
                const vp = page.getViewport({ scale: fitScale * 1.5 });
                const canvas = canvasRef.current;
                canvas.width = vp.width;
                canvas.height = vp.height;
                canvas.style.width = "64px";
                canvas.style.height = `${64 * (naturalVp.height / naturalVp.width)}px`;
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
                gap: 8,
                padding: "8px",
                width: "100%",
                borderRadius: 8,
                background: isActive ? "rgba(124,106,255,0.06)" : "transparent",
                border: `1.5px solid ${isActive ? "#7c6aff" : "transparent"}`,
                boxSizing: "border-box",
                transition: "all 0.2s ease-in-out",
            }}
        >
            <div
                style={{
                    width: 64,
                    minHeight: 80,
                    background: "#fff",
                    borderRadius: 4,
                    boxShadow: isActive ? "0 4px 12px rgba(124,106,255,0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    borderLeft: isActive ? "3px solid #7c6aff" : "none",
                }}
            >
                <canvas ref={canvasRef} style={{ display: "block" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#7c6aff" : "#8b8a97" }}>
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
                alignItems: "center", justifyContent: "center", gap: 16,
                background: T.surface, borderRadius: 24,
                border: `1px solid ${T.border}`,
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: `3px solid ${T.borderHover}`,
                    borderTopColor: T.accent,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Loading PDF Engine…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        ),
    }
);

/* ─── Design System ─── */
const T = {
    bg:          "#080809",
    surface:     "#101012",
    surfaceHi:   "#161618",
    surfaceHov:  "#1c1c1f",
    border:      "rgba(255,255,255,0.055)",
    borderHover: "rgba(255,255,255,0.12)",
    accent:      "#7c6aff",       // violet — trust, legal, authority
    accentDim:   "#5b4bd4",
    accentGlow:  "rgba(124,106,255,0.15)",
    success:     "#22c55e",
    danger:      "#ef4444",
    textPri:     "#f0eff5",
    textSec:     "#8b8a97",
    muted:       "#42414d",
};

const TOOLS = [
    { id: "signature", icon: User,        label: "Signature",  desc: "Hand-drawn",  shortcut: "1", color: "#7c6aff" },
    { id: "initials",  icon: PencilLine,  label: "Initials",   desc: "Monogram",    shortcut: "2", color: "#06b6d4" },
    { id: "text",      icon: Type,        label: "Text",       desc: "Typeable",    shortcut: "3", color: "#f59e0b" },
    { id: "date",      icon: Calendar,    label: "Date",       desc: "Auto-fill",   shortcut: "4", color: "#10b981" },
    { id: "checkmark", icon: CheckSquare, label: "Checkmark",  desc: "Tick box",    shortcut: "5", color: "#ef4444" },
    { id: "stamp",     icon: Stamp,       label: "Stamp",      desc: "Status",      shortcut: "6", color: "#f97316" },
] as const;

type ToolId = typeof TOOLS[number]["id"];

const PRESET_COLORS = [
    { name: "Ink",    value: "#0a0a0a" },
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

/* ─── Micro-components ─── */
const Kbd = ({ k }: { k: string }) => (
    <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: 4,
        background: T.surfaceHov, border: `1px solid ${T.border}`,
        fontSize: 9, fontWeight: 800, color: T.muted,
        letterSpacing: 0, lineHeight: 1,
    }}>{k}</span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        fontSize: 9, fontWeight: 800, color: T.muted,
        letterSpacing: "0.2em", textTransform: "uppercase",
        marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
    }}>
        {children}
    </div>
);

const Badge = ({ icon, label, color = T.accent }: { icon: React.ReactNode; label: string; color?: string }) => (
    <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 99,
        background: `${color}14`, border: `1px solid ${color}28`,
        fontSize: 10, fontWeight: 700, color,
        letterSpacing: "0.04em",
    }}>
        {icon}<span>{label}</span>
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

    const [selectedColor,  setSelectedColor]  = useState("#1a3fbf");
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
        if (file) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [file]);

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
        (window as any).undo = undo;
        (window as any).redo = redo;
        return () => { window.removeEventListener("keydown", handler); delete (window as any).undo; delete (window as any).redo; };
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
        <div style={{
            height: file ? "calc(100vh - var(--header-height))" : "auto",
            minHeight: file ? "calc(100vh - var(--header-height))" : "100vh",
            background: T.bg,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            padding: file ? 0 : "48px 20px 80px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: file ? "hidden" : "visible",
        }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <style>{`
                :root {
                    --header-height: 80px;
                }
                @media (max-width: 768px) {
                    :root {
                        --header-height: 64px;
                    }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
                @keyframes bounce-slow { 0%,100%{transform:translateY(0) translateX(-50%)} 50%{transform:translateY(-6px) translateX(-50%)} }
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
                ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
                @media (max-width: 640px) {
                    .feature-grid { grid-template-columns: 1fr !important; }
                    .timeline-grid { grid-template-columns: 1fr !important; }
                    .contrast-table { font-size: 10px !important; }
                    .contrast-table th, .contrast-table td { padding: 10px 8px !important; }
                }
            `}</style>

            {/* Background glows */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 50% 35% at 15% -5%, rgba(124,106,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 85% 100%, rgba(6,182,212,0.04) 0%, transparent 60%)` }} />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            {/* LANDING PAGE / UPLOAD STATE */}
            {!file && (
                <div style={{ position: "relative", zIndex: 1, maxWidth: 1360, margin: "0 auto", width: "100%", padding: isMobile ? "0 16px" : 0 }}>
                    {/* Hero */}
                    <header style={{ textAlign: "center", marginBottom: isMobile ? 28 : 48, ...fadeIn(0), position: "relative" }}>
                        <button
                            onClick={() => setShowHelp(true)}
                            style={{
                                position: "absolute", top: -8, left: 0,
                                padding: "8px",
                                background: "rgba(16,16,18,0.8)",
                                border: `1px solid ${T.border}`, borderRadius: "50%",
                                color: T.textSec, cursor: "pointer", transition: "all 0.2s",
                                zIndex: 20,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.color = T.textPri;
                                e.currentTarget.style.borderColor = T.borderHover;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(16,16,18,0.8)";
                                e.currentTarget.style.color = T.textSec;
                                e.currentTarget.style.borderColor = T.border;
                            }}
                            title="View Information"
                        >
                            <Info size={14} />
                        </button>

                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                            <Badge icon={<Lock size={10} />} label="100% Private" />
                            <Badge icon={<Zap size={10} />} label="Browser-Side Only" color="#06b6d4" />
                            <Badge icon={<Globe size={10} />} label="No Watermarks" color="#10b981" />
                        </div>
                        <h1 style={{ fontSize: "clamp(2.2rem,6vw,4.5rem)", fontWeight: 900, color: T.textPri, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
                            Free PDF{" "}
                            <span style={{ background: `linear-gradient(135deg, ${T.accent} 0%, #a78bfa 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                Signer Online
                            </span>
                        </h1>
                        <p style={{ fontSize: 14, color: T.textSec, maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
                            Fill and sign PDF online free. Create your digital signature on PDF documents instantly and securely. Processed entirely inside your browser — <strong>no sign-up</strong>, <strong>no server uploads</strong>, and <strong>no watermarks</strong>.
                        </p>
                    </header>

                    {/* Upload zone */}
                    <div style={fadeIn(0.1)}>
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                            maxWidth: 680, margin: isMobile ? "0 auto 40px" : "0 auto 64px",
                                padding: isMobile ? "40px 20px" : "64px 40px",
                                borderRadius: 32,
                                border: `2px dashed ${isDragging ? T.accent : T.border}`,
                                background: isDragging ? T.accentGlow : T.surface,
                                cursor: "pointer",
                                transition: "all 0.3s",
                                textAlign: "center",
                            }}
                        >
                            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />
                            <div style={{
                                width: 80, height: 80, borderRadius: 20,
                                background: T.accent, color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 28px",
                                boxShadow: `0 16px 40px ${T.accentGlow}`,
                                transition: "transform 0.3s",
                            }}>
                                <Upload size={32} strokeWidth={2} />
                            </div>
                            <h2 style={{ fontSize: 28, fontWeight: 900, color: T.textPri, letterSpacing: "-0.02em", marginBottom: 10 }}>
                                Drop your PDF here
                            </h2>
                            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 28 }}>or click to browse your files</p>
                            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                                {[
                                    { icon: <ShieldCheck size={11} />, label: "100% Private", c: T.success },
                                    { icon: <Zap size={11} />, label: "No Server Upload", c: T.accent },
                                    { icon: <Check size={11} />, label: "Free Forever", c: "#f59e0b" },
                                ].map(item => (
                                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: `${item.c}10`, border: `1px solid ${item.c}25`, fontSize: 11, fontWeight: 700, color: item.c }}>
                                        {item.icon}{item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feature grid */}
                        <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? 16 : 24, borderTop: `1px solid ${T.border}`, paddingTop: 40 }}>
                            {[
                                { icon: ShieldCheck, title: "Security & Privacy First", desc: "Your documents remain strictly confidential. With zero data tracking and no storage, we ensure your sensitive information stays private and secure." },
                                { icon: Zap, title: "Local Process, No File Upload", desc: "Sign PDF directly in your browser. Since files are processed locally, your documents never leave your device, offering maximum security without server uploads." },
                                { icon: Globe, title: "100% Free & No Registration", desc: "Truly free with no sign-up or credit card required. No usage limits, watermark stamps, or surprise fees. Just select, sign, and download your file." },
                                { icon: MousePointer2, title: "Legally Binding eSignatures", desc: "Create simple electronic signatures and place initials that support legally compliant workflows under UETA and the federal ESIGN Act." },
                                { icon: Palette, title: "Define Your Signature Style", desc: "Draw or type signature overlays with customizable colors (Royal Blue) and elegant fonts to make every signed document fit your brand style." },
                                { icon: MonitorSmartphone, title: "Sign Anywhere, on Any Device", desc: "Access our secure online tool on Mac, Windows, iOS, or Android. Sign your PDF documents anytime, anywhere, with just a web browser." },
                            ].map(f => (
                                <div key={f.title} style={{ display: "flex", gap: 16, padding: "16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, textAlign: "left" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surfaceHi, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, flexShrink: 0 }}>
                                        <f.icon size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: T.textPri, marginBottom: 6 }}>{f.title}</div>
                                        <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.6 }}>{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* How to Timeline Section */}
                        <div style={{ maxWidth: 780, margin: "64px auto 0", borderTop: `1px solid ${T.border}`, paddingTop: 40, textAlign: "left" }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: T.textPri, textAlign: "center", marginBottom: 28, letterSpacing: "-0.01em" }}>
                                How to eSign PDF Online for Free
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 16 : 20 }}>
                                {[
                                    { step: "1", title: "Upload PDF File", desc: "Click 'Select PDF File' or drag and drop your document into our secure browser-side signer upload zone." },
                                    { step: "2", title: "Sign & Annotate", desc: "Draw your signature, place initials, add text, select dates, or place checkbox checkmarks on the canvas." },
                                    { step: "3", title: "Download File", desc: "Click 'Finalise & Sign' to compile and download your signed digital PDF document in seconds." }
                                ].map((item) => (
                                    <div key={item.step} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "24px 20px 20px", borderRadius: 16, position: "relative" }}>
                                        <div style={{ position: "absolute", top: -12, left: 16, width: 26, height: 26, borderRadius: "50%", background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, boxShadow: `0 0 10px ${T.accentGlow}` }}>
                                            {item.step}
                                        </div>
                                        <h4 style={{ fontSize: 13, fontWeight: 800, color: T.textPri, marginTop: 8, marginBottom: 8 }}>{item.title}</h4>
                                        <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contrast Table Section */}
                        <div style={{ maxWidth: 780, margin: "64px auto 0", borderTop: `1px solid ${T.border}`, paddingTop: 40, textAlign: "left" }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: T.textPri, textAlign: "center", marginBottom: 8, letterSpacing: "-0.01em" }}>
                                Electronic vs. Digital Signatures: Which Do You Need?
                            </h2>
                            <p style={{ fontSize: 13, color: T.textSec, textAlign: "center", marginBottom: 28, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
                                Discover the differences between visual electronic overlays and certificate-backed cryptographic digital signatures.
                            </p>
                            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                                            <th style={{ padding: isMobile ? "10px 8px" : "14px 18px", fontWeight: 800, color: T.textPri, fontSize: isMobile ? 10 : 12 }}>Capability</th>
                                            <th style={{ padding: isMobile ? "10px 8px" : "14px 18px", fontWeight: 800, color: T.accent, fontSize: isMobile ? 10 : 12 }}>PDF Electronic Signature (This Tool)</th>
                                            <th style={{ padding: isMobile ? "10px 8px" : "14px 18px", fontWeight: 800, color: T.textSec, fontSize: isMobile ? 10 : 12 }}>PDF Digital Signature</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { cap: "Best Use Case", es: "Personal & standard commercial documents", ds: "High-stakes legal & verified agreements" },
                                            { cap: "Signature Type", es: "Visual hand-drawn signature overlays", ds: "CA-Certified cryptographic digital ID" },
                                            { cap: "Security Focus", es: "100% on-device private browser processing", ds: "Tamper-proof encrypted certificate locks" },
                                            { cap: "Process Location", es: "Instant inside your browser (local only)", ds: "Requires third-party servers / key managers" },
                                            { cap: "Ease of Use", es: "Extremely fast, free, and no sign-up", ds: "Requires registration and setup keys" },
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx < 4 ? `1px solid ${T.border}` : "none" }}>
                                                <td style={{ padding: isMobile ? "10px 8px" : "14px 18px", fontWeight: 800, color: T.textPri, fontSize: isMobile ? 10 : 12 }}>{row.cap}</td>
                                                <td style={{ padding: isMobile ? "10px 8px" : "14px 18px", color: T.textSec, fontSize: isMobile ? 10 : 12 }}>{row.es}</td>
                                                <td style={{ padding: isMobile ? "10px 8px" : "14px 18px", color: T.textSec, fontSize: isMobile ? 10 : 12 }}>{row.ds}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SEO FAQ Accordion */}
                        <div style={{ maxWidth: 780, margin: "64px auto 0", borderTop: `1px solid ${T.border}`, paddingTop: 40, textAlign: "left" }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.textPri, textAlign: "center", marginBottom: 28, letterSpacing: "-0.01em" }}>
                                Frequently Asked Questions — PDF Signature Online
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    {
                                        q: "Is it really a free PDF signature tool with no sign up?",
                                        a: "Yes! You can fill and sign PDF online free without creating any account or signing up. There are no limits, no watermarks, and no hidden subscriptions. It is a completely free online PDF signer."
                                    },
                                    {
                                        q: "How does the digital signature on PDF work privately?",
                                        a: "Unlike other online PDF signing tools, our tool runs entirely in your browser using local client-side libraries. Your PDF documents and drawn signatures are never uploaded to any server. Your private data remains 100% on your device."
                                    },
                                    {
                                        q: "How do I add a signature to a PDF and download it?",
                                        a: "Simply drop your document into the upload zone, select the Signature tool, drag a box exactly where you want it, draw your signature, and apply it. Once done, click 'Finalise & Sign' to compile and download your signed digital PDF instantly."
                                    },
                                    {
                                        q: "Can I use this as an alternative to other PDF signature tools?",
                                        a: "Absolutely. If you want a fast, free, private, and secure alternative to bulky platforms like ilovepdf signature, this lightweight, client-side signature tool is the perfect option."
                                    }
                                ].map((faq, idx) => (
                                    <details 
                                        key={idx} 
                                        style={{ 
                                            background: T.surface, 
                                            border: `1px solid ${T.border}`, 
                                            borderRadius: 12, 
                                            padding: "14px 18px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onToggle={e => {
                                            const isOpen = (e.target as HTMLDetailsElement).open;
                                            (e.target as HTMLElement).style.borderColor = isOpen ? T.accent : T.border;
                                            (e.target as HTMLElement).style.background = isOpen ? T.surfaceHi : T.surface;
                                        }}
                                    >
                                        <summary style={{ fontSize: 13, fontWeight: 800, color: T.textPri, outline: "none", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span>{faq.q}</span>
                                            <ChevronDown size={14} style={{ color: T.textSec }} />
                                        </summary>
                                        <p style={{ fontSize: 13, color: T.textSec, marginTop: 12, lineHeight: 1.6, cursor: "default" }}>
                                            {faq.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* THREE-COLUMN EDITOR STUDIO */}
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
                    {/* 1. TOP TOOLBAR */}
                    <header style={{
                        height: isMobile ? 52 : 64,
                        borderBottom: `1px solid ${T.border}`,
                        background: T.surface,
                        padding: isMobile ? "0 12px" : "0 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                        zIndex: 10
                    }}>
                        {/* Filename dropdown */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${T.accent}12`, border: `1px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FileText size={16} style={{ color: T.accent }} />
                            </div>
                            {!isMobile && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setShowHelp(true)}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.textPri, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                                    <ChevronDown size={14} style={{ color: T.textSec }} />
                                </div>
                            )}
                        </div>

                        {/* Page controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                                onClick={() => {
                                    const prev = Math.max(0, activePage - 1);
                                    setActivePage(prev);
                                    document.getElementById(`pdf-page-${prev}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                disabled={activePage === 0}
                                style={{
                                    width: 32, height: 32, borderRadius: "50%", background: "none", border: `1px solid ${T.border}`, color: activePage === 0 ? T.muted : T.textSec, cursor: activePage === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
                                }}
                            >
                                <ChevronUp size={14} />
                            </button>
                            <span style={{ fontSize: 11, fontWeight: 800, color: T.textPri, width: 64, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                                {activePage + 1} / {pageCount}
                            </span>
                            <button
                                onClick={() => {
                                    const next = Math.min(pageCount - 1, activePage + 1);
                                    setActivePage(next);
                                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                disabled={activePage === pageCount - 1}
                                style={{
                                    width: 32, height: 32, borderRadius: "50%", background: "none", border: `1px solid ${T.border}`, color: activePage === pageCount - 1 ? T.muted : T.textSec, cursor: activePage === pageCount - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
                                }}
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        {/* Action buttons (Undo/Redo/Reset) */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", gap: 4, paddingRight: 8, borderRight: `1px solid ${T.border}` }}>
                                <button
                                    onClick={undo}
                                    disabled={!canUndo}
                                    title="Undo (⌘Z)"
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, background: T.surfaceHov, border: `1px solid ${T.border}`, color: canUndo ? T.textPri : T.muted, cursor: canUndo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canUndo ? 1 : 0.4, transition: "all 0.15s"
                                    }}
                                >
                                    <Undo2 size={13} />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={!canRedo}
                                    title="Redo (⌘Y)"
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, background: T.surfaceHov, border: `1px solid ${T.border}`, color: canRedo ? T.textPri : T.muted, cursor: canRedo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canRedo ? 1 : 0.4, transition: "all 0.15s"
                                    }}
                                >
                                    <Redo2 size={13} />
                                </button>
                            </div>
                            <button
                                onClick={reset}
                                style={{
                                    height: 32, padding: isMobile ? "0 8px" : "0 12px", borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, color: T.textSec, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                            >
                                <RefreshCw size={11} />{!isMobile && " Reset"}
                            </button>
                        </div>
                    </header>

                    {/* 2. BODY CONTENT (3 COLUMNS) */}
                    <div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%", minHeight: 0 }}>
                        {/* COLUMN 1: LEFT SIDEBAR (~100px) */}
                        <aside 
                            data-lenis-prevent="true"
                            style={{
                                width: 100,
                                borderRight: `1px solid ${T.border}`,
                                background: T.surface,
                                overflowY: "auto",
                                overscrollBehavior: "contain",
                                display: isMobile ? "none" : "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "16px 0",
                                gap: 12,
                                flexShrink: 0,
                            }}
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
                            style={{
                                flex: 1,
                                background: T.bg,
                                padding: isMobile ? "12px 8px 100px" : "24px 20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                                overflowY: "auto",
                                overscrollBehavior: "contain",
                                position: "relative",
                                minWidth: 0
                            }}
                        >


                            {/* Success Card */}
                            {outputUrl && (
                                <div style={{
                                    background: T.surface, border: `1px solid ${T.border}`, padding: "40px 20px", borderRadius: 24,
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
                                    textAlign: "center", maxWidth: 640, margin: "40px auto"
                                }}>
                                    <div style={{ width: 64, height: 64, background: T.accent, color: "#fff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Check size={28} strokeWidth={3.5} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 28, fontWeight: 900, color: T.textPri, letterSpacing: "-0.02em" }}>Document Signed</h3>
                                        <p style={{ color: T.textSec, fontSize: 14, marginTop: 6 }}>Your finalized PDF is ready for download.</p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, width: "100%", maxWidth: 380 }}>
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
                                            style={{
                                                height: 48, borderRadius: 99, background: T.accent, color: "#fff",
                                                fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none",
                                            }}
                                        >
                                            <Download size={16} /> Download PDF
                                        </a>
                                        <button
                                            onClick={() => setIsSharing(true)}
                                            style={{
                                                height: 48, borderRadius: 99, background: T.surfaceHov, border: `1px solid ${T.border}`, color: T.textPri,
                                                fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
                                            }}
                                        >
                                            <Share2 size={16} /> Share File
                                        </button>
                                        <button
                                            onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                            style={{
                                                gridColumn: isMobile ? "span 1" : "span 2", background: "none", border: "none", color: T.textSec, cursor: "pointer",
                                                fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                                                marginTop: 8,
                                            }}
                                        >
                                            ← Back to Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Document Viewer Canvas */}
                            {!outputUrl && (
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: `1px solid ${T.border}`, borderRadius: 24, padding: 4, position: "relative" }}>
                                    {signatures.length === 0 && !dismissHint && (
                                        <div 
                                            style={{ 
                                                position: "absolute", 
                                                inset: 0, 
                                                zIndex: 100, 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center", 
                                                background: "rgba(8, 8, 9, 0.45)", 
                                                backdropFilter: "blur(2px)",
                                                borderRadius: 20,
                                                pointerEvents: "none", // click-through so user can drag natively on the canvas behind it
                                            }}
                                        >
                                            <div style={{ position: "relative", width: 320, height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "auto", background: T.surface, border: `1px solid ${T.border}`, padding: 24, borderRadius: 20, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}>
                                                {/* Close button top right */}
                                                <button onClick={() => setDismissHint(true)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec }} title="Dismiss Guide">
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>

                                                {/* Drag demonstration box */}
                                                <div style={{ position: "relative", width: 220, height: 110, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 10, background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", overflow: "hidden" }}>
                                                    
                                                    {/* Animated expanding box */}
                                                    <div style={{ 
                                                        position: "absolute", 
                                                        top: 16, 
                                                        left: 20, 
                                                        border: `2px dashed ${T.accent}`, 
                                                        background: `${T.accent}12`, 
                                                        borderRadius: 6,
                                                        animation: "dragBox 3.5s infinite ease-in-out",
                                                        boxSizing: "border-box",
                                                    }}>
                                                        {/* Simulated Signature placeholder inside box */}
                                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <span style={{ fontSize: 9, fontWeight: 900, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>Signature Block</span>
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
                                                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                                                        animation: "dragPointer 3.5s infinite ease-in-out",
                                                        zIndex: 10,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}>
                                                        <MousePointer2 size={16} fill="#fff" />
                                                        {/* Simulated tooltip moving with cursor */}
                                                        <div style={{
                                                            padding: "3px 6px",
                                                            background: "#fff",
                                                            color: "#000",
                                                            fontSize: 7,
                                                            fontWeight: 900,
                                                            borderRadius: 4,
                                                            whiteSpace: "nowrap",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.04em",
                                                        }}>
                                                            Drag to place
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Text guidelines below animation */}
                                                <div style={{ textAlign: "center", marginTop: 14, zIndex: 10 }}>
                                                    <h4 style={{ fontSize: 13, fontWeight: 800, color: T.textPri, margin: "0 0 4px" }}>Click & Drag on Document</h4>
                                                    <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 14px", lineHeight: 1.4, padding: "0 8px" }}>Simply press down, drag to your desired size, and release to place your signature box anywhere!</p>
                                                    <button 
                                                        onClick={() => setDismissHint(true)} 
                                                        style={{ 
                                                            padding: "6px 16px", 
                                                            borderRadius: 8, 
                                                            background: "rgba(255,255,255,0.04)", 
                                                            border: `1px solid ${T.border}`, 
                                                            color: T.textPri, 
                                                            fontSize: 10, 
                                                            fontWeight: 800, 
                                                            textTransform: "uppercase", 
                                                            letterSpacing: "0.06em",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.borderColor = T.accent; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = T.border; }}
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
                                <div style={{ padding: 16, background: "rgba(255,255,255,0.015)", border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", alignItems: "center", gap: 16, overflowX: "auto" }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                        <Layers size={10} /> Log ({signatures.length})
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flex: 1 }}>
                                        {signatures.map(sig => (
                                            <div
                                                key={sig.id}
                                                style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 8px 0 6px", background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 10, flexShrink: 0 }}
                                            >
                                                <div style={{ width: 28, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 }}>
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
                                                <span style={{ fontSize: 9, fontWeight: 800, color: T.textSec }}>
                                                    {sig.allPages ? "All" : `P${sig.pageIndex + 1}`}
                                                </span>
                                                <button
                                                    onClick={() => removeSignature(sig.id)}
                                                    style={{ width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: T.muted, cursor: "pointer" }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "none"; }}
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
                        <aside style={{
                            width: 320,
                            borderLeft: `1px solid ${T.border}`,
                            background: T.surface,
                            display: isMobile ? "none" : "flex",
                            flexDirection: "column",
                            height: "100%",
                            minHeight: 0,
                            flexShrink: 0,
                            position: "relative"
                        }}>
                            {/* Scrollable contents */}
                            <div 
                                data-lenis-prevent="true"
                                style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: 20, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 100 }}
                            >
                                <div>
                                    <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPri, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Signing options</h2>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0 }}>Configure your signature types and place elements.</p>
                                </div>



                                {/* Required fields */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <SectionLabel><User size={9} />Required fields</SectionLabel>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                                                    style={{
                                                        padding: "12px 14px", borderRadius: 12, background: activeTool === "signature" ? "rgba(124,106,255,0.04)" : T.surfaceHov, border: `1px solid ${activeTool === "signature" ? T.accent : T.border}`, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                                                            <User size={13} />
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontSize: 11, fontWeight: 800, color: T.textPri }}>Signature</div>
                                                            <div style={{ fontSize: 9, color: T.textSec, marginTop: 2 }}>
                                                                {signatureItem ? "Signature placed" : "Click to place signature"}
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
                                                    style={{
                                                        padding: "12px 14px", borderRadius: 12, background: activeTool === "initials" ? "rgba(6,182,212,0.04)" : T.surfaceHov, border: `1px solid ${activeTool === "initials" ? "#06b6d4" : T.border}`, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(6,182,212,0.12)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#06b6d4" }}>
                                                            <PencilLine size={13} />
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontSize: 11, fontWeight: 800, color: T.textPri }}>Initials</div>
                                                            <div style={{ fontSize: 9, color: T.textSec, marginTop: 2 }}>
                                                                {initialsItem ? "Initials placed" : "Click to place initials"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Optional fields */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <SectionLabel><Layers size={9} />Optional fields</SectionLabel>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {[
                                            { id: "text", icon: Type, label: "Text Field", desc: "Typeable standard textbox", color: "#f59e0b" },
                                            { id: "date", icon: Calendar, label: "Date Placer", desc: "Auto-populates current date", color: "#10b981" },
                                            { id: "checkmark", icon: CheckSquare, label: "Checkbox", desc: "Interactive verification box", color: "#ef4444" },
                                            { id: "stamp", icon: Stamp, label: "Company Stamp", desc: "Custom seal status mark", color: "#f97316" }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTool(item.id as ToolId);
                                                }}
                                                style={{
                                                    padding: "10px 12px", borderRadius: 10, background: activeTool === item.id ? `${item.color}06` : "transparent", border: `1px solid ${activeTool === item.id ? item.color + "30" : T.border}`, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10
                                                }}
                                                onMouseEnter={e => { if (activeTool !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                                onMouseLeave={e => { if (activeTool !== item.id) e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                                                    <item.icon size={12} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: T.textPri }}>{item.label}</div>
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
                                        <div style={{ padding: 16, background: "rgba(124,106,255,0.03)", border: `1px solid ${T.accent}30`, borderRadius: 16, display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
                                            <div style={{ fontSize: 9, fontWeight: 800, color: T.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>Field Properties</div>

                                            {(activeSig.type === "text" || activeSig.type === "date") && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                    <select value={selectedFont} onChange={e => handleFontChange(e.target.value)} style={{ width: "100%", padding: "7px 10px", background: T.surfaceHov, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.textSec, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                                                        <option value="Helvetica">Helvetica</option>
                                                        <option value="Times-Roman">Times New Roman</option>
                                                        <option value="Courier">Courier</option>
                                                    </select>
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        {[
                                                            { label: <Bold size={12} strokeWidth={3} />, active: isBold, onClick: handleBoldClick },
                                                            { label: <Italic size={12} strokeWidth={3} />, active: isItalic, onClick: handleItalicClick },
                                                            { label: <Underline size={12} strokeWidth={3} />, active: isUnderline, onClick: handleUnderlineClick },
                                                        ].map((btn, i) => (
                                                            <button key={i} onClick={btn.onClick} style={{ flex: 1, height: 30, borderRadius: 7, background: btn.active ? T.accent : T.surfaceHov, border: `1px solid ${btn.active ? T.accent : T.border}`, color: btn.active ? "#fff" : T.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeSig.type === "stamp" && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                        {PRESET_STAMPS.map(s => (
                                                            <button key={s} onClick={() => { setSelectedStamp(s); applyToActiveSig({ content: s }); }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", background: selectedStamp === s ? T.accent : T.surfaceHov, border: `1px solid ${selectedStamp === s ? T.accent : T.border}`, color: selectedStamp === s ? "#fff" : T.textSec, transition: "all 0.15s" }}>
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
                                                        placeholder="Custom stamp text…"
                                                        style={{ width: "100%", padding: "6px 10px", background: T.surfaceHov, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 10, color: T.textPri, outline: "none", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.08em" }}
                                                    />
                                                </div>
                                            )}

                                            {/* Color swatches */}
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4 }}>
                                                {PRESET_COLORS.map(c => (
                                                    <button key={c.value} onClick={() => handleColorClick(c.value)} title={c.name} style={{ width: 22, height: 22, borderRadius: "50%", background: c.value, cursor: "pointer", border: `2px solid ${selectedColor === c.value ? T.accent : "transparent"}`, transform: selectedColor === c.value ? "scale(1.2)" : "scale(1)", transition: "all 0.15s", boxShadow: selectedColor === c.value ? `0 0 0 2px ${T.surface}, 0 0 0 4px ${T.accent}` : "none" }} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Saved signatures library list */}
                                {savedSignatures.length > 0 && (
                                    <div style={{ padding: 16, background: T.surfaceHov, border: `1px solid ${T.border}`, borderRadius: 16 }}>
                                        <SectionLabel><Save size={9} />My Signatures</SectionLabel>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {savedSignatures.slice(0, 3).map(sig => {
                                                const isSelected = selectedLibraryItem?.id === sig.id;
                                                return (
                                                    <div 
                                                        key={sig.id} 
                                                        onClick={() => placeFromLibrary(sig)} 
                                                        style={{ 
                                                            position: "relative", 
                                                            height: 48, 
                                                            background: "#fff", 
                                                            borderRadius: 8, 
                                                            padding: 6, 
                                                            cursor: "pointer", 
                                                            border: `2px solid ${isSelected ? T.accent : T.border}`, 
                                                            boxShadow: isSelected ? `0 0 12px ${T.accentGlow}` : "none",
                                                            overflow: "hidden", 
                                                            transition: "all 0.15s" 
                                                        }}
                                                    >
                                                        <img src={sig.dataUrl} alt="saved sig" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                        <button onClick={e => deleteFromLibrary(sig.id, e)} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 4, background: "rgba(239,68,68,0.9)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ fontSize: 9, color: selectedLibraryItem ? T.accent : T.textSec, textAlign: "center", marginTop: 8, fontWeight: selectedLibraryItem ? 700 : 500, fontStyle: selectedLibraryItem ? "normal" : "italic", transition: "all 0.2s" }}>
                                            {selectedLibraryItem ? "Signature loaded! Drag on PDF to place." : "Select signature then drag on PDF to place"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky sign action footer in Right Column */}
                            <footer style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: 20,
                                background: T.surface,
                                borderTop: `1px solid ${T.border}`,
                                zIndex: 10
                            }}>
                                <button
                                    onClick={exportSignedPdf}
                                    disabled={signatures.length === 0 || isExporting}
                                    style={{
                                        width: "100%",
                                        height: 48,
                                        borderRadius: 12,
                                        background: T.accent,
                                        border: "none",
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 850,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        cursor: signatures.length === 0 || isExporting ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        opacity: signatures.length === 0 ? 0.35 : 1,
                                        transition: "all 0.2s",
                                        boxShadow: signatures.length > 0 ? `0 4px 20px ${T.accentGlow}` : "none"
                                    }}
                                >
                                    {isExporting ? (
                                        <>
                                            <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                            Exporting…
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} strokeWidth={3} />
                                            Finalise & Sign
                                        </>
                                    )}
                                </button>
                            </footer>
                        </aside>
                    </div>

                    {/* ── MOBILE BOTTOM TOOLBAR ── */}
                    {isMobile && (
                        <div style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            background: T.surface,
                            borderTop: `1px solid ${T.border}`,
                            boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
                            paddingBottom: "env(safe-area-inset-bottom, 0px)",
                        }}>
                            {(() => {
                                const activeSig = signatures.find(s => s.id === activeSigId);
                                const showProps = activeSig && ["text", "date", "stamp", "checkmark"].includes(activeSig.type);

                                if (showProps && activeSig) {
                                    /* ── Properties panel for the selected annotation ── */
                                    return (
                                        <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: T.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>Field Properties</span>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button
                                                        onClick={() => { removeSignature(activeSig.id); setActiveSigId(null); }}
                                                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAllPages(activeSig.id)}
                                                        style={{ height: 30, padding: "0 10px", borderRadius: 8, background: activeSig.allPages ? `${T.accent}20` : T.surfaceHov, border: `1px solid ${activeSig.allPages ? T.accent : T.border}`, color: activeSig.allPages ? T.accent : T.textSec, cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}
                                                    >
                                                        All Pages
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveSigId(null)}
                                                        style={{ height: 30, padding: "0 14px", borderRadius: 8, background: T.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Color swatches + formatting row */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span style={{ fontSize: 9, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Color</span>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    {PRESET_COLORS.map(c => (
                                                        <button key={c.value} onClick={() => handleColorClick(c.value)} title={c.name} style={{ width: 26, height: 26, borderRadius: "50%", background: c.value, cursor: "pointer", border: `2.5px solid ${selectedColor === c.value ? T.accent : "transparent"}`, transform: selectedColor === c.value ? "scale(1.15)" : "scale(1)", transition: "all 0.15s" }} />
                                                    ))}
                                                </div>
                                                {(activeSig.type === "text" || activeSig.type === "date") && (
                                                    <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                                                        {[
                                                            { label: <Bold size={12} strokeWidth={3} />, active: isBold, onClick: handleBoldClick },
                                                            { label: <Italic size={12} strokeWidth={3} />, active: isItalic, onClick: handleItalicClick },
                                                            { label: <Underline size={12} strokeWidth={3} />, active: isUnderline, onClick: handleUnderlineClick },
                                                        ].map((btn, i) => (
                                                            <button key={i} onClick={btn.onClick} style={{ width: 30, height: 30, borderRadius: 7, background: btn.active ? T.accent : T.surfaceHov, border: `1px solid ${btn.active ? T.accent : T.border}`, color: btn.active ? "#fff" : T.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {activeSig.type === "stamp" && (
                                                <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
                                                    {PRESET_STAMPS.map(s => (
                                                        <button key={s} onClick={() => { setSelectedStamp(s); applyToActiveSig({ content: s }); }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", background: selectedStamp === s ? T.accent : T.surfaceHov, border: `1px solid ${selectedStamp === s ? T.accent : T.border}`, color: selectedStamp === s ? "#fff" : T.textSec, whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                /* ── Default: Finalise button + tool strip ── */
                                return (
                                    <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                        {/* Finalise button */}
                                        <button
                                            onClick={exportSignedPdf}
                                            disabled={signatures.length === 0 || isExporting}
                                            style={{
                                                width: "100%", height: 44,
                                                borderRadius: 10, background: T.accent, border: "none",
                                                color: "#fff", fontSize: 12, fontWeight: 800,
                                                letterSpacing: "0.06em", textTransform: "uppercase",
                                                cursor: signatures.length === 0 || isExporting ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                                opacity: signatures.length === 0 ? 0.35 : 1,
                                                transition: "all 0.2s",
                                                boxShadow: signatures.length > 0 ? `0 4px 16px ${T.accentGlow}` : "none"
                                            }}
                                        >
                                            {isExporting ? (
                                                <>
                                                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                                    Exporting…
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={14} strokeWidth={3} />
                                                    Finalise &amp; Sign
                                                </>
                                            )}
                                        </button>

                                        {/* Tool strip */}
                                        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                                            {TOOLS.map(tool => {
                                                const Icon = tool.icon;
                                                const isActive = activeTool === tool.id;
                                                return (
                                                    <button
                                                        key={tool.id}
                                                        onClick={() => {
                                                            if (tool.id === "signature" || tool.id === "initials") {
                                                                setActiveTool(tool.id as ToolId);
                                                                setActiveBox(null);
                                                                setIsPadOpen(true);
                                                            } else {
                                                                setActiveTool(tool.id as ToolId);
                                                            }
                                                        }}
                                                        style={{
                                                            flex: "0 0 auto",
                                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                            gap: 3, padding: "6px 10px", borderRadius: 10,
                                                            background: isActive ? `${tool.color}18` : T.surfaceHov,
                                                            border: `1px solid ${isActive ? tool.color + "50" : T.border}`,
                                                            color: isActive ? tool.color : T.textSec,
                                                            cursor: "pointer", transition: "all 0.15s",
                                                            minWidth: 52,
                                                        }}
                                                    >
                                                        <Icon size={16} />
                                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{tool.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Saved signatures strip (if any) */}
                                        {savedSignatures.length > 0 && (
                                            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                                                {savedSignatures.slice(0, 5).map(sig => {
                                                    const isSel = selectedLibraryItem?.id === sig.id;
                                                    return (
                                                        <div
                                                            key={sig.id}
                                                            onClick={() => placeFromLibrary(sig)}
                                                            style={{
                                                                flex: "0 0 auto", width: 52, height: 34,
                                                                background: "#fff", borderRadius: 7,
                                                                border: `2px solid ${isSel ? T.accent : T.border}`,
                                                                overflow: "hidden", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                padding: 3, transition: "all 0.15s",
                                                                boxShadow: isSel ? `0 0 8px ${T.accentGlow}` : "none",
                                                            }}
                                                        >
                                                            <img src={sig.dataUrl} alt="saved" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Signer Info">
                <div style={{ display: "flex", flexDirection: "column", gap: 24, color: T.textSec, lineHeight: 1.7, fontSize: 14, textAlign: "left", padding: "12px 0 24px" }}>
                    <div style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${T.border}`, padding: 24, borderRadius: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPri, marginBottom: 12 }}>Smart PDF Signature Infrastructure</h3>
                        <p style={{ margin: 0 }}>
                            Elevate your document workflow with AssetNest <strong>Professional PDF Signer</strong>. In an era of digital-first business, the ability to execute agreements instantly and securely is critical. Our Smart Signer engine allows you to place high-fidelity digital signatures across multi-page documents with pixel-perfect precision. By utilizing advanced client-side processing, we eliminate the need for third-party servers, ensuring your sensitive legal, financial, and corporate documents never leave the safety of your local environment.
                        </p>
                    </div>
                </div>
            </HelpModal>

            {/* ══ SIGNATURE PAD MODAL ══ */}
            {isPadOpen && (
                <SignaturePad
                    defaultTab={activeTool === "initials" ? "initials" : "signature"}
                    onCancel={() => { setIsPadOpen(false); setActiveBox(null); }}
                    onSave={onSignatureSaved}
                />
            )}

            {/* ══ SHARE MODAL ══ */}
            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={outputBlob}
                fileName={file ? `Signed_${file.name}` : "signed_document.pdf"}
            />
        </div>
    );
}
