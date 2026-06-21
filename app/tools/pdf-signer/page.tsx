"use client";

import "./polyfill";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Upload, Download, RefreshCw, PenTool, Info, X, Check, Save,
    MousePointer2, Layers, FileText, Share2, PencilLine, Sparkles,
    Trash2, ShieldCheck, User, Type, Calendar, CheckSquare,
    Undo2, Redo2, Stamp, Palette, Bold, Italic, Underline,
    Zap, Lock, Globe, ChevronDown, ChevronUp, ArrowLeft
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
    bg:          "#F4ECD8",
    surface:     "#ffffff",
    surfaceHi:   "#f4ecd8",
    surfaceHov:  "#f9f5eb",
    border:      "#000000",
    borderHover: "#000000",
    accent:      "#7c6aff",       // violet — trust, legal, authority
    accentDim:   "#5b4bd4",
    accentGlow:  "rgba(124,106,255,0.15)",
    success:     "#a7f3d0",
    danger:      "#fca5a5",
    textPri:     "#000000",
    textSec:     "#1f2937",
    muted:       "#4b5563",
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

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(2px, 2px) !important;
  box-shadow: none !important;
}
`;

function LocalAccordion({ children }: { children: React.ReactNode }) {
    return <div className="space-y-4 w-full">{children}</div>;
}

interface LocalAccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function LocalAccordionItem({ title, children }: LocalAccordionItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-2 border-black rounded-2xl bg-zinc-50 overflow-hidden shadow-[3px_3px_0_#000] transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left transition-all hover:bg-zinc-100/80"
            >
                <span className="font-bold text-sm sm:text-base text-black pr-4">
                    {title}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[800px] border-t-2 border-black bg-white" : "max-h-0"
                }`}
            >
                <div className="p-5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                    {children}
                </div>
            </div>
        </div>
    );
}

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
        <div className={`w-full min-h-screen bg-[#F4ECD8] text-black font-sans relative overflow-hidden ig-root flex flex-col ${file ? "h-[calc(100vh-var(--header-height))] min-h-[calc(100vh-var(--header-height))] overflow-hidden pb-0" : "pb-24"}`}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <style>{GLOBAL_STYLES}</style>
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

            {/* Background grid */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

            {/* LANDING PAGE / UPLOAD STATE */}
            {!file && (
                <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6">
                    <header className="max-w-5xl mx-auto pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                        <Link
                            href="/tools"
                            className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                        >
                            <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-lg bg-red-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                                <PenTool size={14} />
                            </div>
                            <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                                PDF Signer
                            </span>
                        </div>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                            title="Help Guide"
                        >
                            <Info size={12} strokeWidth={2.5} /> INFO
                        </button>
                    </header>

                    <div className="text-center mt-6 mb-12 relative z-10">
                        <div className="flex justify-center gap-2 mb-6 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-full text-[10px] font-black text-black shadow-[1.5px_1.5px_0_#000] uppercase tracking-wider">
                                <Lock size={10} /> 100% Private
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border-2 border-black rounded-full text-[10px] font-black text-black shadow-[1.5px_1.5px_0_#000] uppercase tracking-wider">
                                <Zap size={10} /> Browser-Side Only
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 border-2 border-black rounded-full text-[10px] font-black text-black shadow-[1.5px_1.5px_0_#000] uppercase tracking-wider">
                                <Globe size={10} /> No Watermarks
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-none mb-4 ig-display">
                            Free PDF <span className="bg-yellow-300 px-2 py-0.5 border-2 border-black inline-block transform -rotate-1 shadow-[2px_2px_0_#000]">Signer Online</span>
                        </h1>
                        <p className="text-sm sm:text-base text-zinc-800 max-w-xl mx-auto leading-relaxed font-bold">
                            Fill and sign PDF online free. Create your digital signature on PDF documents instantly and securely. Processed entirely inside your browser — <strong>no sign-up</strong>, <strong>no server uploads</strong>, and <strong>no watermarks</strong>.
                        </p>
                    </div>

                    {/* Upload zone */}
                    <div style={fadeIn(0.1)}>
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`max-w-[680px] mx-auto p-10 bg-white border-2 border-black rounded-[2rem] shadow-[4px_4px_0_#000] text-center cursor-pointer hover:bg-zinc-50 transition-all ${isDragging ? "bg-emerald-50 border-emerald-500 shadow-none scale-[0.99]" : ""}`}
                        >
                            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />
                            <div className="w-16 h-16 bg-red-500 border-2 border-black rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-[2px_2px_0_#000]">
                                <Upload size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-black text-black tracking-tight mb-2 ig-display">
                                Drop your PDF here
                            </h2>
                            <p className="text-xs text-zinc-650 font-bold mb-6">or click to browse your files</p>
                            <div className="flex justify-center gap-2 flex-wrap">
                                {[
                                    { icon: <ShieldCheck size={11} />, label: "100% Private", c: "bg-emerald-100" },
                                    { icon: <Zap size={11} />, label: "No Server Upload", c: "bg-yellow-100" },
                                    { icon: <Check size={11} />, label: "Free Forever", c: "bg-blue-100" },
                                ].map(item => (
                                    <div key={item.label} className={`flex items-center gap-1.5 px-3 py-1 border-2 border-black rounded-full text-[10px] font-black text-black shadow-[1.5px_1.5px_0_#000] uppercase tracking-wider ${item.c}`}>
                                        {item.icon}{item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feature grid */}
                        <div className="max-w-[780px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-black/10 pt-12 mt-12">
                            {[
                                { icon: ShieldCheck, title: "Security & Privacy First", desc: "Your documents remain strictly confidential. With zero data tracking and no storage, we ensure your sensitive information stays private and secure." },
                                { icon: Zap, title: "Local Process, No File Upload", desc: "Sign PDF directly in your browser. Since files are processed locally, your documents never leave your device, offering maximum security without server uploads." },
                                { icon: Globe, title: "100% Free & No Registration", desc: "Truly free with no sign-up or credit card required. No usage limits, watermark stamps, or surprise fees. Just select, sign, and download your file." },
                                { icon: MousePointer2, title: "Legally Binding eSignatures", desc: "Create simple electronic signatures and place initials that support legally compliant workflows under UETA and the federal ESIGN Act." },
                                { icon: Palette, title: "Define Your Signature Style", desc: "Draw or type signature overlays with customizable colors (Royal Blue) and elegant fonts to make every signed document fit your brand style." },
                                { icon: MonitorSmartphone, title: "Sign Anywhere, on Any Device", desc: "Access our secure online tool on Mac, Windows, iOS, or Android. Sign your PDF documents anytime, anywhere, with just a web browser." },
                            ].map(f => (
                                <div key={f.title} className="flex gap-4 p-5 bg-white border-2 border-black rounded-3xl text-left shadow-[3px_3px_0_#000]">
                                    <div className="w-10 h-10 rounded-xl bg-[#F4ECD8] border-2 border-black flex items-center justify-center text-red-500 flex-shrink-0 shadow-[1.5px_1.5px_0_#000]">
                                        <f.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-black mb-1.5 ig-display">{f.title}</div>
                                        <div className="text-[11px] text-zinc-650 font-bold leading-relaxed">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* How to Timeline Section */}
                        <div className="max-w-[780px] mx-auto border-t-2 border-black/10 pt-12 mt-16 text-left">
                            <h2 className="text-xl sm:text-2xl font-black text-black text-center mb-10 ig-display">
                                How to eSign PDF Online for Free
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Upload PDF File", desc: "Click 'Select PDF File' or drag and drop your document into our secure browser-side signer upload zone." },
                                    { step: "2", title: "Sign & Annotate", desc: "Draw your signature, place initials, add text, select dates, or place checkbox checkmarks on the canvas." },
                                    { step: "3", title: "Download File", desc: "Click 'Finalise & Sign' to compile and download your signed digital PDF document in seconds." }
                                ].map((item) => (
                                    <div key={item.step} className="bg-white border-2 border-black p-6 rounded-3xl relative shadow-[3.5px_3.5px_0_#000] pt-8">
                                        <div className="absolute -top-3.5 left-4 w-7 h-7 rounded-full bg-yellow-300 border-2 border-black flex items-center justify-center text-xs font-black shadow-[1.5px_1.5px_0_#000] text-black">
                                            {item.step}
                                        </div>
                                        <h4 className="text-xs font-black text-black mb-2 ig-display">{item.title}</h4>
                                        <p className="text-[11px] text-zinc-650 font-bold leading-relaxed m-0">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contrast Table Section */}
                        <div className="max-w-[780px] mx-auto border-t-2 border-black/10 pt-12 mt-16 text-left">
                            <h2 className="text-xl sm:text-2xl font-black text-black text-center mb-2 ig-display">
                                Electronic vs. Digital Signatures: Which Do You Need?
                            </h2>
                            <p className="text-xs text-zinc-600 text-center mb-8 max-w-lg mx-auto leading-relaxed font-bold">
                                Discover the differences between visual electronic overlays and certificate-backed cryptographic digital signatures.
                            </p>
                            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b-2 border-black">
                                            <th className="p-4 font-black text-black text-[11px] uppercase tracking-wider ig-label">Capability</th>
                                            <th className="p-4 font-black text-red-500 text-[11px] uppercase tracking-wider ig-label">PDF Electronic Signature (This Tool)</th>
                                            <th className="p-4 font-black text-zinc-600 text-[11px] uppercase tracking-wider ig-label">PDF Digital Signature</th>
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
                                            <tr key={idx} className="border-b-2 border-black/10 last:border-b-0">
                                                <td className="p-4 font-bold text-black border-r border-black/10 bg-zinc-50/50">{row.cap}</td>
                                                <td className="p-4 text-zinc-700 font-bold border-r border-black/10">{row.es}</td>
                                                <td className="p-4 text-zinc-700 font-bold">{row.ds}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SEO FAQ Accordion */}
                        <div className="max-w-[780px] mx-auto border-t-2 border-black/10 pt-12 mt-16 mb-8 text-left">
                            <h3 className="text-xl sm:text-2xl font-black text-black text-center mb-10 ig-display">
                                Frequently Asked Questions — PDF Signature Online
                            </h3>
                            <LocalAccordion>
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
                                    <LocalAccordionItem key={idx} title={faq.q}>
                                        {faq.a}
                                    </LocalAccordionItem>
                                ))}
                            </LocalAccordion>
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
                    <header className="h-16 border-b-2 border-black bg-white px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 relative">
                        {/* Filename dropdown */}
                        <div 
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border-2 border-black rounded-xl cursor-pointer hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                            onClick={() => setShowHelp(true)}
                        >
                            <div className="w-6 h-6 rounded-lg bg-red-500 border border-black flex items-center justify-center text-white">
                                <FileText size={12} />
                            </div>
                            {!isMobile && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-black max-w-[180px] truncate">{file.name}</span>
                                    <ChevronDown size={14} className="text-zinc-650" />
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
                                className="ig-btn w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-black hover:bg-zinc-100 disabled:opacity-30 shadow-[1.5px_1.5px_0_#000] transition-all"
                            >
                                <ChevronUp size={14} strokeWidth={2.5} />
                            </button>
                            <span className="text-xs font-black text-black w-16 text-center tabular-nums ig-display">
                                {activePage + 1} / {pageCount}
                            </span>
                            <button
                                onClick={() => {
                                    const next = Math.min(pageCount - 1, activePage + 1);
                                    setActivePage(next);
                                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                disabled={activePage === pageCount - 1}
                                className="ig-btn w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-black hover:bg-zinc-100 disabled:opacity-30 shadow-[1.5px_1.5px_0_#000] transition-all"
                            >
                                <ChevronDown size={14} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Action buttons (Undo/Redo/Reset) */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex gap-1.5 pr-2.5 border-r-2 border-black/10">
                                <button
                                    onClick={undo}
                                    disabled={!canUndo}
                                    title="Undo (⌘Z)"
                                    className="ig-btn w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center text-black hover:bg-zinc-100 disabled:opacity-30 shadow-[1.5px_1.5px_0_#000] transition-all"
                                >
                                    <Undo2 size={13} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={!canRedo}
                                    title="Redo (⌘Y)"
                                    className="ig-btn w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center text-black hover:bg-zinc-100 disabled:opacity-30 shadow-[1.5px_1.5px_0_#000] transition-all"
                                >
                                    <Redo2 size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                            <button
                                onClick={reset}
                                className="ig-btn h-8 px-3 rounded-lg border-2 border-black bg-red-100 hover:bg-red-200 text-black text-xs font-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#000] transition-all"
                            >
                                <RefreshCw size={11} strokeWidth={2.5} />{!isMobile && " Reset"}
                            </button>
                        </div>
                    </header>

                    {/* 2. BODY CONTENT (3 COLUMNS) */}
                    <div className="flex flex-1 overflow-hidden w-full min-h-0">
                        {/* COLUMN 1: LEFT SIDEBAR (~100px) */}
                        <aside 
                            data-lenis-prevent="true"
                            className="w-24 border-r-2 border-black bg-white overflow-y-auto overscroll-contain flex flex-col items-center py-4 gap-3 shrink-0 hidden md:flex"
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
                            className="flex-1 bg-[#F4ECD8] p-3 sm:p-6 pb-24 flex flex-col gap-4 overflow-y-auto overscroll-contain relative min-w-0"
                        >


                            {/* Success Card */}
                            {outputUrl && (
                                <div className="bg-white border-2 border-black p-8 sm:p-12 rounded-[2rem] shadow-[5px_5px_0_#000] flex flex-col items-center gap-6 text-center max-w-xl mx-auto my-10 relative overflow-hidden">
                                    <div className="w-16 h-16 bg-emerald-100 border-2 border-black rounded-2xl flex items-center justify-center text-black shadow-[2.5px_2.5px_0_#000] mb-2">
                                        <Check size={28} strokeWidth={3.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-black tracking-tight ig-display">Document Signed</h3>
                                        <p className="text-xs text-zinc-650 font-bold mt-1">Your finalized PDF is ready for download.</p>
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
                                            className="ig-btn h-11 rounded-xl bg-emerald-305 border-2 border-black text-black text-xs font-black flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_#000] hover:bg-emerald-300 hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-wider bg-[#a7f3d0]"
                                        >
                                            <Download size={16} /> Download PDF
                                        </a>
                                        <button
                                            onClick={() => setIsSharing(true)}
                                            className="ig-btn h-11 rounded-xl bg-white border-2 border-black text-black text-xs font-black flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_#000] hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-wider"
                                        >
                                            <Share2 size={16} /> Share File
                                        </button>
                                        <button
                                            onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                            className="col-span-1 sm:col-span-2 ig-btn h-10 rounded-xl bg-white border-2 border-black text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#000] hover:bg-zinc-50 transition-all uppercase tracking-wider mt-2"
                                        >
                                            ← Back to Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Document Viewer Canvas */}
                            {!outputUrl && (
                                <div className="flex-1 bg-white border-2 border-black rounded-3xl p-2 relative shadow-[4px_4px_0_#000]">
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
                        <aside className="w-80 border-l-2 border-black bg-white flex flex-col h-full min-h-0 shrink-0 relative hidden md:flex">
                            {/* Scrollable contents */}
                            <div 
                                data-lenis-prevent="true"
                                className="flex-1 overflow-y-auto overscroll-contain p-5 flex flex-col gap-6 pb-24"
                            >
                                <div>
                                    <h2 className="text-sm font-black text-black ig-display uppercase tracking-wider">Signing options</h2>
                                    <p className="text-[10px] text-zinc-650 font-bold mt-0.5">Configure your signature types and place elements.</p>
                                </div>



                                {/* Required fields */}
                                <div className="flex flex-col gap-2.5">
                                    <SectionLabel><User size={9} />Required fields</SectionLabel>
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
                                                    className={`p-3 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-between ${activeTool === "signature" ? "bg-emerald-50" : "bg-zinc-50"}`}
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-black flex items-center justify-center text-black shadow-[1px_1px_0_#000]">
                                                            <User size={13} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[11px] font-black text-black">Signature</div>
                                                            <div className="text-[9px] text-zinc-655 font-bold mt-0.5 leading-none">
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
                                                    className={`p-3 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-between ${activeTool === "initials" ? "bg-[#e0f7fa]" : "bg-zinc-50"}`}
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-[#b2ebf2] border border-black flex items-center justify-center text-cyan-700 shadow-[1px_1px_0_#000]">
                                                            <PencilLine size={13} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[11px] font-black text-black">Initials</div>
                                                            <div className="text-[9px] text-zinc-655 font-bold mt-0.5 leading-none">
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
                                <div className="flex flex-col gap-2.5">
                                    <SectionLabel><Layers size={9} />Optional fields</SectionLabel>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { id: "text", icon: Type, label: "Text Field", desc: "Typeable standard textbox", color: "text-[#f59e0b] bg-[#fef3c7]" },
                                            { id: "date", icon: Calendar, label: "Date Placer", desc: "Auto-populates current date", color: "text-[#10b981] bg-[#d1fae5]" },
                                            { id: "checkmark", icon: CheckSquare, label: "Checkbox", desc: "Interactive verification box", color: "text-[#ef4444] bg-[#fee2e2]" },
                                            { id: "stamp", icon: Stamp, label: "Company Stamp", desc: "Custom seal status mark", color: "text-[#f97316] bg-[#ffedd5]" }
                                        ].map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTool(item.id as ToolId);
                                                }}
                                                className={`p-2.5 border-2 border-black rounded-xl cursor-pointer shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2.5 ${activeTool === item.id ? "bg-yellow-50" : "bg-zinc-50"}`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center shadow-[0.5px_0.5px_0_#000] ${item.color}`}>
                                                    <item.icon size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black text-black">{item.label}</div>
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
                                        <div className="p-4 bg-yellow-50/50 border-2 border-black rounded-2xl flex flex-col gap-3.5 shadow-[2px_2px_0_#000] animate-in fade-in zoom-in-95 duration-150">
                                            <div className="text-[10px] font-black text-black uppercase tracking-wider ig-label">Field Properties</div>

                                            {(activeSig.type === "text" || activeSig.type === "date") && (
                                                <div className="flex flex-col gap-2.5">
                                                    <select value={selectedFont} onChange={e => handleFontChange(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-bold text-black outline-none cursor-pointer">
                                                        <option value="Helvetica">Helvetica</option>
                                                        <option value="Times-Roman">Times New Roman</option>
                                                        <option value="Courier">Courier</option>
                                                    </select>
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { label: <Bold size={12} strokeWidth={3} />, active: isBold, onClick: handleBoldClick },
                                                            { label: <Italic size={12} strokeWidth={3} />, active: isItalic, onClick: handleItalicClick },
                                                            { label: <Underline size={12} strokeWidth={3} />, active: isUnderline, onClick: handleUnderlineClick },
                                                        ].map((btn, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={btn.onClick} 
                                                                className={`flex-grow h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all ${btn.active ? "bg-yellow-300 text-black shadow-[1.5px_1.5px_0_#000] font-black" : "bg-white text-zinc-650 font-bold hover:bg-zinc-55 shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"}`}
                                                            >
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeSig.type === "stamp" && (
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {PRESET_STAMPS.map(s => (
                                                            <button 
                                                                key={s} 
                                                                onClick={() => { setSelectedStamp(s); applyToActiveSig({ content: s }); }} 
                                                                className={`px-2 py-1 rounded-md border-2 border-black text-[9px] font-black uppercase tracking-wider transition-all ${selectedStamp === s ? "bg-yellow-300 text-black shadow-[1.5px_1.5px_0_#000]" : "bg-white text-zinc-650 hover:bg-zinc-55 shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"}`}
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
                                                        placeholder="Custom stamp text…"
                                                        className="w-full px-2.5 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-bold text-black outline-none placeholder-zinc-400 uppercase tracking-wider"
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
                                                        className="w-5.5 h-5.5 rounded-full cursor-pointer transition-all border border-black/20"
                                                        style={{ 
                                                            background: c.value, 
                                                            border: selectedColor === c.value ? "2px solid black" : "1px solid rgba(0,0,0,0.2)", 
                                                            transform: selectedColor === c.value ? "scale(1.25)" : "scale(1)", 
                                                            boxShadow: selectedColor === c.value ? "0 0 0 1.5px #fff, 0 0 0 3px #000" : "none" 
                                                        }} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Saved signatures library list */}
                                {savedSignatures.length > 0 && (
                                    <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[3px_3px_0_#000]">
                                        <SectionLabel><Save size={9} />My Signatures</SectionLabel>
                                        <div className="flex flex-col gap-2">
                                            {savedSignatures.slice(0, 3).map(sig => {
                                                const isSelected = selectedLibraryItem?.id === sig.id;
                                                return (
                                                    <div 
                                                        key={sig.id} 
                                                        onClick={() => placeFromLibrary(sig)} 
                                                        className={`relative h-12 bg-white rounded-lg p-1.5 cursor-pointer border-2 border-black transition-all ${isSelected ? "border-yellow-500 scale-[1.02] shadow-[2px_2px_0_#000]" : "shadow-[1.5px_1.5px_0_#000]"}`}
                                                    >
                                                        <img src={sig.dataUrl} alt="saved sig" className="w-full h-full object-contain" />
                                                        <button onClick={e => deleteFromLibrary(sig.id, e)} className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 border border-black rounded-md flex items-center justify-center text-white cursor-pointer transition-colors shadow-[0.5px_0.5px_0_#000]">
                                                            <Trash2 size={8} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className={`text-[9px] text-center mt-2.5 font-bold ${selectedLibraryItem ? "text-yellow-600" : "text-zinc-650 italic"}`}>
                                            {selectedLibraryItem ? "Signature loaded! Drag on PDF to place." : "Select signature then drag on PDF to place"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky sign action footer in Right Column */}
                            <footer className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t-2 border-black z-10">
                                <button
                                    onClick={exportSignedPdf}
                                    disabled={signatures.length === 0 || isExporting}
                                    className={`w-full h-12 rounded-xl border-2 border-black text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-wider ${
                                        signatures.length === 0 || isExporting
                                            ? "bg-zinc-100 border-black/40 text-zinc-400 cursor-not-allowed opacity-60"
                                            : "bg-yellow-300 text-black shadow-[2.5px_2.5px_0_#000] hover:bg-yellow-400 hover:scale-[1.02] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none"
                                    }`}
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t-2 border-black pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                            {(() => {
                                const activeSig = signatures.find(s => s.id === activeSigId);
                                const showProps = activeSig && ["text", "date", "stamp", "checkmark"].includes(activeSig.type);

                                if (showProps && activeSig) {
                                    /* ── Properties panel for the selected annotation ── */
                                    return (
                                        <div className="p-3.5 flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-black uppercase tracking-wider ig-label">Field Properties</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { removeSignature(activeSig.id); setActiveSigId(null); }}
                                                        className="w-8 h-8 rounded-lg bg-red-105 border-2 border-black text-black flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all bg-[#fee2e2]"
                                                    >
                                                        <Trash2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAllPages(activeSig.id)}
                                                        className={`h-8 px-3 rounded-lg border-2 border-black text-[9px] font-black uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${activeSig.allPages ? "bg-yellow-300 text-black" : "bg-white text-black"}`}
                                                    >
                                                        All Pages
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveSigId(null)}
                                                        className="h-8 px-3.5 rounded-lg border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Color swatches + formatting row */}
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[9px] font-black text-zinc-650 uppercase tracking-wider">Color</span>
                                                <div className="flex gap-2">
                                                    {PRESET_COLORS.map(c => (
                                                        <button 
                                                            key={c.value} 
                                                            onClick={() => handleColorClick(c.value)} 
                                                            title={c.name} 
                                                            className="w-6 h-6 rounded-full cursor-pointer transition-all border border-black/20"
                                                            style={{ 
                                                                background: c.value, 
                                                                border: selectedColor === c.value ? "2px solid black" : "1px solid rgba(0,0,0,0.2)",
                                                                transform: selectedColor === c.value ? "scale(1.15)" : "scale(1)"
                                                            }} 
                                                        />
                                                    ))}
                                                </div>
                                                {(activeSig.type === "text" || activeSig.type === "date") && (
                                                    <div className="flex gap-1 ml-auto">
                                                        {[
                                                            { label: <Bold size={12} strokeWidth={3} />, active: isBold, onClick: handleBoldClick },
                                                            { label: <Italic size={12} strokeWidth={3} />, active: isItalic, onClick: handleItalicClick },
                                                            { label: <Underline size={12} strokeWidth={3} />, active: isUnderline, onClick: handleUnderlineClick },
                                                        ].map((btn, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={btn.onClick} 
                                                                className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center cursor-pointer transition-all ${btn.active ? "bg-yellow-300 text-black shadow-[1px_1px_0_#000]" : "bg-white text-zinc-650 hover:bg-zinc-50 shadow-[1px_1px_0_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"}`}
                                                            >
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {activeSig.type === "stamp" && (
                                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                                    {PRESET_STAMPS.map(s => (
                                                        <button 
                                                            key={s} 
                                                            onClick={() => { setSelectedStamp(s); applyToActiveSig({ content: s }); }} 
                                                            className={`px-2 py-1 rounded-md border-2 border-black text-[9px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap shrink-0 transition-all ${selectedStamp === s ? "bg-yellow-300 text-black shadow-[1px_1px_0_#000]" : "bg-white text-zinc-650 shadow-[1px_1px_0_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"}`}
                                                        >
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
                                    <div className="p-3 flex flex-col gap-2.5">
                                        {/* Finalise button */}
                                        <button
                                            onClick={exportSignedPdf}
                                            disabled={signatures.length === 0 || isExporting}
                                            className={`w-full h-11 rounded-xl border-2 border-black text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-wider ${
                                                signatures.length === 0 || isExporting
                                                    ? "bg-zinc-100 border-black/40 text-zinc-400 cursor-not-allowed opacity-60"
                                                    : "bg-yellow-300 text-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                            }`}
                                        >
                                            {isExporting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
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
                                                        className={`shrink-0 flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border-2 border-black transition-all min-w-[60px] cursor-pointer ${
                                                            isActive 
                                                                ? "bg-yellow-105 text-black shadow-[1.5px_1.5px_0_#000] bg-yellow-100" 
                                                                : "bg-white text-zinc-650 hover:bg-zinc-50 shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                        }`}
                                                    >
                                                        <Icon size={14} />
                                                        <span className="text-[8px] font-black uppercase tracking-wider whitespace-nowrap">{tool.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Saved signatures strip (if any) */}
                                        {savedSignatures.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                                {savedSignatures.slice(0, 5).map(sig => {
                                                    const isSel = selectedLibraryItem?.id === sig.id;
                                                    return (
                                                        <div
                                                            key={sig.id}
                                                            onClick={() => placeFromLibrary(sig)}
                                                            className={`shrink-0 w-12 h-8 bg-white rounded-lg border-2 border-black overflow-hidden cursor-pointer flex items-center justify-center p-1 transition-all ${
                                                                isSel ? "border-yellow-500 scale-[1.02] shadow-[1.5px_1.5px_0_#000]" : "shadow-[1px_1px_0_#000]"
                                                            }`}
                                                        >
                                                            <img src={sig.dataUrl} alt="saved" className="w-full h-full object-contain" />
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
                <div className="space-y-12 text-zinc-700 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Smart PDF Signature Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Elevate your document workflow with AssetNest <strong>Professional PDF Signer</strong>. In an era of digital-first business, the ability to execute agreements instantly and securely is critical. Our Smart Signer engine allows you to place high-fidelity digital signatures across multi-page documents with pixel-perfect precision. By utilizing advanced client-side processing, we eliminate the need for third-party servers, ensuring your sensitive legal, financial, and corporate documents never leave the safety of your local environment.
                        </p>
                    </section>
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
