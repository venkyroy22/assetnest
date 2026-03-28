"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Upload, Download, RefreshCw, PenTool, Info, X, Check, Save,
    MousePointer2, Layers, FileText, Share2, PenLine, Sparkles,
    Trash2, ShieldCheck, User, Type, Calendar, CheckSquare, PencilLine,
    Undo2, Redo2, Loader2, Stamp, Palette, Bold, Italic, Underline
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });
import { Accordion, AccordionItem } from "@/components/Accordion";
import type { Signature, LibraryItem } from "@/app/tools/pdf-signer/types";
import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";
import HelpModal from "@/components/HelpModal";

const PdfViewer = dynamic<any>(
    () => import("@/app/tools/pdf-signer/PdfViewer").then(m => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] flex flex-col items-center justify-center gap-4 bg-zinc-950 border border-zinc-900 rounded-[2rem]">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-zinc-500 font-bold uppercase tracking-[0.25em] text-[10px]">Initialising Engine…</span>
            </div>
        ),
    }
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

const TOOLS = [
    { id: "signature", icon: User,       label: "Signature",  desc: "Hand-drawn",  shortcut: "1" },
    { id: "initials",  icon: PencilLine, label: "Initials",   desc: "Paraffin",    shortcut: "2" },
    { id: "text",      icon: Type,       label: "Text Field", desc: "Typeable",    shortcut: "3" },
    { id: "date",      icon: Calendar,   label: "Date Pad",   desc: "Auto-date",   shortcut: "4" },
    { id: "checkmark", icon: CheckSquare,label: "Checkmark",  desc: "Tick box",    shortcut: "5" },
    { id: "stamp",     icon: Stamp,      label: "Stamp",      desc: "Status",      shortcut: "6" },
] as const;

type ToolId = typeof TOOLS[number]["id"];

const PRESET_COLORS = [
    { name: "Ink Black",    value: "#0a0a0a" },
    { name: "Royal Blue",   value: "#1a3fbf" },
    { name: "Crimson",      value: "#dc2626" },
    { name: "Forest Green", value: "#059669" },
];

const PRESET_STAMPS = ["APPROVED", "DRAFT", "CONFIDENTIAL", "REJECTED", "VOID"];

const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const num = parseInt(hex, 16);
    return rgb((num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
};

export default function PdfSignerPage() {
    const [file,        setFile]        = useState<File | null>(null);
    const [pageCount,   setPageCount]   = useState(0);
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
    
    // Annotation settings
    const [selectedColor, setSelectedColor] = useState("#0a0a0a");
    const [selectedStamp, setSelectedStamp] = useState("APPROVED");
    const [selectedFont, setSelectedFont] = useState("Helvetica");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [activeSigId, setActiveSigId] = useState<string | null>(null);

    // Sync styles when a different annotation is selected
    useEffect(() => {
        const sig = signatures.find(s => s.id === activeSigId);
        if (sig && (sig.type === "text" || sig.type === "date")) {
            setSelectedFont(sig.fontFamily || "Helvetica");
            setIsBold(sig.fontWeight === "bold");
            setIsItalic(sig.fontStyle === "italic" || sig.fontStyle === "oblique");
            setIsUnderline(sig.textDecoration === "underline");
            if (sig.color) setSelectedColor(sig.color);
        }
    }, [activeSigId]);

    const applyToActiveSig = (updates: Partial<Signature>) => {
        if (!activeSigId) return;
        pushSignatures(signatures.map((s) => s.id === activeSigId ? { ...s, ...updates } : s));
    };

    const handleFontChange = (val: string) => {
        setSelectedFont(val);
        applyToActiveSig({ fontFamily: val });
    };
    const handleBoldClick = () => {
        const val = !isBold; setIsBold(val);
        applyToActiveSig({ fontWeight: val ? "bold" : "normal" });
    };
    const handleItalicClick = () => {
        const val = !isItalic; setIsItalic(val);
        applyToActiveSig({ fontStyle: val ? "italic" : "normal" });
    };
    const handleUnderlineClick = () => {
        const val = !isUnderline; setIsUnderline(val);
        applyToActiveSig({ textDecoration: val ? "underline" : "none" });
    };
    const handleColorClick = (val: string) => {
        setSelectedColor(val);
        applyToActiveSig({ color: val });
    };

    // Signature Library
    const [savedSignatures, setSavedSignatures] = useState<LibraryItem[]>([]);

    // Undo/Redo
    const historyRef      = useRef<Signature[][]>([]);
    const historyIdxRef   = useRef(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("pdf_signer_library");
            if (saved) setSavedSignatures(JSON.parse(saved));
        } catch (e) {}
    }, []);

    const saveToLibrary = (dataUrl: string, type: "signature" | "initials") => {
        const newItem: LibraryItem = {
            id: crypto.randomUUID(),
            dataUrl,
            label: type === "signature" ? "Signature" : "Initials",
            createdAt: Date.now()
        };
        const updated = [newItem, ...savedSignatures].slice(0, 10);
        setSavedSignatures(updated);
        try { localStorage.setItem("pdf_signer_library", JSON.stringify(updated)); } catch (e) {}
    };

    const deleteFromLibrary = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedSignatures.filter(s => s.id !== id);
        setSavedSignatures(updated);
        try { localStorage.setItem("pdf_signer_library", JSON.stringify(updated)); } catch (e) {}
    };

    const syncUndoRedoState = useCallback(() => {
        setCanUndo(historyIdxRef.current >= 0);
        setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const pushSignatures = useCallback((newSigs: Signature[]) => {
        setSignatures(newSigs);
        const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
        trimmed.push([...newSigs]);
        if (trimmed.length > 50) trimmed.shift();
        historyRef.current = trimmed;
        historyIdxRef.current = trimmed.length - 1;
        syncUndoRedoState();
    }, [syncUndoRedoState]);

    const setSigsNoHistory = useCallback((newSigs: Signature[]) => {
        setSignatures(newSigs);
    }, []);

    const undo = useCallback(() => {
        if (historyIdxRef.current <= 0) {
            if (historyIdxRef.current === 0) {
                historyIdxRef.current = -1;
                setSignatures([]);
                syncUndoRedoState();
            }
            return;
        }
        historyIdxRef.current--;
        setSignatures([...historyRef.current[historyIdxRef.current]]);
        syncUndoRedoState();
    }, [syncUndoRedoState]);

    const redo = useCallback(() => {
        if (historyIdxRef.current >= historyRef.current.length - 1) return;
        historyIdxRef.current++;
        setSignatures([...historyRef.current[historyIdxRef.current]]);
        syncUndoRedoState();
    }, [syncUndoRedoState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = document.activeElement?.tagName || "";
            if (["TEXTAREA", "INPUT"].includes(tag)) return;

            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }

            const num = parseInt(e.key);
            if (num >= 1 && num <= 6 && !e.ctrlKey && !e.metaKey) {
                setActiveTool(TOOLS[num - 1].id as ToolId);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
        setError(null);
        setFile(f);
        setSignatures([]);
        setOutputUrl(null);
        setOutputBlob(null);
        historyRef.current = [];
        historyIdxRef.current = -1;
        syncUndoRedoState();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const handleBoxSelected = (box: typeof activeBox) => {
        if (!box) return;

        if (activeTool === "signature" || activeTool === "initials") {
            setActiveBox(box);
            setIsPadOpen(true);
        } else if (activeTool === "text") {
            addAnnotation("text", box, "");
        } else if (activeTool === "date") {
            const date = new Date().toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
            });
            addAnnotation("date", box, date);
        } else if (activeTool === "checkmark") {
            addAnnotation("checkmark", box);
        } else if (activeTool === "stamp") {
            addAnnotation("stamp", box, selectedStamp);
        }
    };

    const addAnnotation = (type: any, box: any, content?: string) => {
        const newSig: Signature = {
            id: crypto.randomUUID(),
            type,
            content,
            color: selectedColor,
            fontFamily: selectedFont,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
            pageIndex: box.pageIndex,
            x: box.x, y: box.y,
            width: box.w, height: box.h,
            allPages: false,
        };
        pushSignatures([...signatures, newSig]);
        setActiveBox(null);
    };

    const onSignatureSaved = (dataUrl: string, color?: string, boxOverride?: typeof activeBox) => {
        const box = boxOverride || activeBox;
        if (!box) return;

        const newSig: Signature = {
            id: crypto.randomUUID(),
            type: activeTool === "initials" ? "initials" : "signature",
            dataUrl,
            pageIndex: box.pageIndex,
            x: box.x, y: box.y,
            width: box.w, height: box.h,
            allPages: false,
        };
        pushSignatures([...signatures, newSig]);

        if (!boxOverride) {
            saveToLibrary(dataUrl, activeTool === "initials" ? "initials" : "signature");
        }

        setIsPadOpen(false);
        setActiveBox(null);
    };

    const placeFromLibrary = (item: LibraryItem) => {
        // Find visible center of viewport to place the signature
        const viewer = document.querySelector('[data-lenis-prevent]');
        if (viewer) {
            // Very roughly placed center of first page for now if just clicked without box,
            // but instead we instruct user to select a box, or place default box.
            // Let's rely on Box override since they click a box then they use library? 
            // Wait, if they just click the library item, drop it on page 0 at center.
            const box = {
                pageIndex: 0,
                x: 0.4, y: 0.4,
                w: 0.22, h: 0.1
            };
            onSignatureSaved(item.dataUrl, undefined, box);
        }
    };

    const toggleAllPages = (id: string) =>
        pushSignatures(signatures.map((s) => s.id === id ? { ...s, allPages: !s.allPages } : s));

    const removeSignature = (id: string) =>
        pushSignatures(signatures.filter((s) => s.id !== id));

    const reset = () => {
        setFile(null);
        setSignatures([]);
        historyRef.current = [];
        historyIdxRef.current = -1;
        syncUndoRedoState();
        setPageCount(0);
        setError(null); setOutputUrl(null); setOutputBlob(null); setIsSharing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    /* ── Export ── */
    const exportSignedPdf = async () => {
        if (!file || signatures.length === 0) return;
        setIsExporting(true);
        setError(null);
        try {
            const buf    = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const pages  = pdfDoc.getPages();
            
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
                "Courier-BoldOblique": await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)
            };
            const helveticaFont = fonts["Helvetica-Bold"];

            for (const sig of signatures) {
                const applyTo = async (idx: number) => {
                    if (idx < 0 || idx >= pages.length) return;
                    const page = pages[idx];
                    const { width: pW, height: pH } = page.getSize();
                    const colorVal = hexToRgb(sig.color || "#000000");

                    if (sig.type === "signature" || sig.type === "initials") {
                        const b64 = sig.dataUrl!.split(",")[1];
                        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                        const img = await pdfDoc.embedPng(bytes);
                        page.drawImage(img, {
                            x: sig.x * pW,
                            y: (1 - sig.y - sig.height) * pH,
                            width: sig.width * pW,
                            height: sig.height * pH,
                        });
                    } else if (sig.type === "text" || sig.type === "date") {
                        const text = sig.content || "";
                        if (!text.trim()) return;
                        const getCalculatedFontSize = (content: string, w: number, h: number) => {
                            if (!content) return Math.max(3, h * 0.65);
                            const lines = content.split('\n');
                            const numLines = Math.max(1, lines.length);
                            const maxChars = Math.max(1, ...lines.map(l => l.length));
                            const maxH = h / (numLines * 1.15);
                            const maxW = w / (maxChars * 0.55);
                            return Math.max(3, Math.min(maxH, maxW));
                        };
                        const ptW = sig.width * pW;
                        const ptH = sig.height * pH;
                        const fontSize = getCalculatedFontSize(text, ptW, ptH);
                        let fKey = "Helvetica";
                        const ff = sig.fontFamily || "Helvetica";
                        const isB = sig.fontWeight === "bold";
                        const isI = sig.fontStyle === "italic" || sig.fontStyle === "oblique";
                        
                        if (ff === "Times-Roman" || ff.includes("Georgia") || ff.includes("Times")) {
                            if (isB && isI) fKey = "Times-BoldItalic";
                            else if (isB) fKey = "Times-Bold";
                            else if (isI) fKey = "Times-Italic";
                            else fKey = "Times-Roman";
                        } else if (ff === "Courier" || ff.includes("Courier") || ff.includes("mono")) {
                            if (isB && isI) fKey = "Courier-BoldOblique";
                            else if (isB) fKey = "Courier-Bold";
                            else if (isI) fKey = "Courier-Oblique";
                            else fKey = "Courier";
                        } else {
                            if (isB && isI) fKey = "Helvetica-BoldOblique";
                            else if (isB) fKey = "Helvetica-Bold";
                            else if (isI) fKey = "Helvetica-Oblique";
                            else fKey = "Helvetica";
                        }
                        
                        const activeFont = fonts[fKey as keyof typeof fonts] || helveticaFont;

                        page.drawText(text, {
                            x: sig.x * pW + 4,
                            y: (1 - sig.y - sig.height * 0.75) * pH,
                            size: fontSize,
                            font: activeFont,
                            color: colorVal,
                        });
                        
                        if (sig.textDecoration === "underline") {
                            const textW = activeFont.widthOfTextAtSize(text, fontSize);
                            page.drawLine({
                                start: { x: sig.x * pW + 4, y: (1 - sig.y - sig.height * 0.75) * pH - 2 },
                                end: { x: sig.x * pW + 4 + textW, y: (1 - sig.y - sig.height * 0.75) * pH - 2 },
                                thickness: Math.max(1, fontSize * 0.05),
                                color: colorVal
                            });
                        }
                    } else if (sig.type === "checkmark") {
                        const x = sig.x * pW;
                        const y = (1 - sig.y - sig.height) * pH;
                        const w = sig.width * pW;
                        const h = sig.height * pH;
                        
                        const sqSize = Math.min(w, h) * 0.85;
                        const bx = x + (w - sqSize) / 2;
                        const by = y + (h - sqSize) / 2;

                        // Draw bounding box
                        page.drawRectangle({
                            x: bx, y: by,
                            width: sqSize, height: sqSize,
                            borderColor: colorVal,
                            borderWidth: Math.max(1.5, sqSize * 0.05)
                        });

                        const thickness = Math.max(2, sqSize * 0.1);
                        // Check lines
                        const startX = bx + sqSize * 0.2;
                        const startY = by + sqSize * 0.45;
                        const midX = bx + sqSize * 0.45;
                        const midY = by + sqSize * 0.25;
                        const endX = bx + sqSize * 0.8;
                        const endY = by + sqSize * 0.75;
                        
                        page.drawLine({
                            start: { x: bx + sqSize * 0.22, y: by + sqSize * 0.48 },
                            end:   { x: midX,  y: midY + sqSize * 0.05 },
                            thickness, color: colorVal
                        });
                        page.drawLine({
                            start: { x: midX,  y: midY + sqSize * 0.05 },
                            end:   { x: endX - sqSize * 0.05, y: endY },
                            thickness, color: colorVal
                        });
                    } else if (sig.type === "stamp") {
                        const x = sig.x * pW;
                        const y = (1 - sig.y - sig.height) * pH;
                        const w = sig.width * pW;
                        const h = sig.height * pH;
                        const text = sig.content || "APPROVED";
                        
                        const cx = x + w / 2;
                        const cy = y + h / 2;
                        
                        const fontSize = Math.max(8, Math.min(w * 0.12, h * 0.55));
                        const textW = helveticaFont.widthOfTextAtSize(text, fontSize);
                        
                        // We do a simple unrotated stamp export for exact bound fits without clipping issues
                        page.drawText(text, {
                            x: cx - textW / 2,
                            y: cy - fontSize / 2.5,
                            size: fontSize,
                            font: helveticaFont,
                            color: colorVal,
                        });
                        
                        const padX = fontSize * 0.8;
                        const padY = fontSize * 0.4;
                        page.drawRectangle({
                            x: cx - textW / 2 - padX / 2,
                            y: cy - fontSize / 2.5 - padY / 2,
                            width: textW + padX,
                            height: fontSize + padY,
                            borderColor: colorVal,
                            borderWidth: Math.max(2, fontSize * 0.1)
                        });
                    }
                };

                if (sig.allPages) {
                    for (let i = 0; i < pages.length; i++) await applyTo(i);
                } else {
                    await applyTo(sig.pageIndex);
                }
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

    /* ── Render ── */
    if (isMobile) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 rounded-full bg-zinc-950/50 border border-zinc-800 flex items-center justify-center mb-8 relative">
                    <MonitorSmartphone size={32} className="text-zinc-500 relative z-10" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <X size={14} className="text-red-400" />
                    </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                    Desktop Required
                </h2>

                <p className="text-zinc-400 text-sm md:text-base max-w-sm mb-10 leading-relaxed font-medium">
                    The Smart PDF Signer handles complex vector documents natively in your device's memory for absolute privacy. For a stable, high-performance experience, please access this tool on a Desktop or Laptop computer.
                </p>

                <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black hover:bg-zinc-200 transition-all text-xs font-black uppercase tracking-[0.15em] rounded-full active:scale-95"
                >
                    Explore Other Tools
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] py-8 px-4 max-w-[1400px] mx-auto overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* ══ HERO ══ */}
            <div className="text-center mb-8 px-2 relative group">
                <button
                    onClick={() => setShowHelp(true)}
                    className="absolute -top-2 -right-2 p-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="View Information"
                >
                    <Info size={14} />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.03] mb-5 rounded-full max-w-full overflow-hidden">
                    <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase text-zinc-400 truncate">100% Browser-Based · Private</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-3 leading-none">
                    Smart PDF <span className="text-zinc-500">Signer</span>
                </h1>
                <p className="text-zinc-600 text-[11px] font-medium max-w-[260px] sm:max-w-sm mx-auto leading-relaxed">
                    Draw · Place · Sign · Export — all in your browser
                </p>
            </div>

            {/* ══ ERROR BANNER ══ */}
            {error && (
                <div className="mb-6 max-w-4xl mx-auto flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                    <Info size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-semibold text-red-200 flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-500 hover:text-white transition-all">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ══ UPLOAD ZONE ══ */}
            {!file && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative max-w-3xl mx-auto mb-16 p-12 sm:p-16 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer group
                        ${isDragging
                            ? "border-white/40 bg-white/[0.06] scale-[1.01]"
                            : "border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]"
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center text-center gap-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white text-black flex items-center justify-center relative z-10 group-hover:rotate-3 transition-transform duration-500">
                            <Upload size={36} strokeWidth={2.5} />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter leading-none">
                                Drop your <span className="text-zinc-600">PDF</span>
                            </h2>
                            <p className="text-zinc-600 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                                or click to browse · Secure local processing
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {file && (
                <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ── LEFT SIDEBAR ── */}
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
                        <div className="bg-zinc-950/60 border border-white/[0.04] p-5 rounded-2xl space-y-6 sticky top-24">

                            {/* Tools */}
                            <div>
                                <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-1 flex items-center gap-2">
                                    <PenTool size={10} /> Annotation Tools
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 pb-1">
                                    {TOOLS.map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id as ToolId)}
                                            className={`
                                                flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all relative
                                                ${activeTool === tool.id
                                                    ? "bg-white border-white text-black"
                                                    : "bg-transparent border-white/[0.04] text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-300"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <tool.icon size={15} strokeWidth={activeTool === tool.id ? 2.5 : 1.8} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{tool.label}</span>
                                            </div>
                                            <span className={`text-[8px] font-bold hidden lg:block ${activeTool === tool.id ? "text-black/30" : "text-zinc-700"}`}>
                                                {tool.shortcut}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Options specific to active tool */}
                            <div className="space-y-4">
                                {(activeTool === "text" || activeTool === "date" || activeTool === "checkmark") && (
                                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col gap-3 animate-in fade-in">
                                        {(activeTool === "text" || activeTool === "date") && (
                                            <div className="flex flex-col gap-2 pb-2 border-b border-white/5">
                                                <select 
                                                    value={selectedFont} 
                                                    onChange={(e) => handleFontChange(e.target.value)}
                                                    className="w-full bg-zinc-950/50 border border-white/10 text-xs px-2 py-1.5 rounded-lg text-zinc-300 outline-none hover:border-white/20 transition-all font-bold focus:border-white/30"
                                                    style={{ fontFamily: selectedFont === "Times-Roman" ? "Times New Roman" : selectedFont === "Courier" ? "Courier New" : selectedFont }}
                                                >
                                                    <option value="Helvetica" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Helvetica</option>
                                                    <option value="Times-Roman" style={{ fontFamily: "Times New Roman, serif" }}>Times New Roman</option>
                                                    <option value="Courier" style={{ fontFamily: "Courier New, monospace" }}>Courier</option>
                                                    <option value="Georgia, serif" style={{ fontFamily: "Georgia, serif" }}>Georgia</option>
                                                    <option value="Verdana, sans-serif" style={{ fontFamily: "Verdana, sans-serif" }}>Verdana</option>
                                                    <option value="Impact, sans-serif" style={{ fontFamily: "Impact, sans-serif" }}>Impact</option>
                                                    <option value="Comic Sans MS, sans-serif" style={{ fontFamily: "Comic Sans MS, sans-serif" }}>Comic Sans MS</option>
                                                </select>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={handleBoldClick} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isBold ? "bg-white text-black" : "text-zinc-500 hover:text-white hover:bg-white/10"} `}><Bold size={14} strokeWidth={3} /></button>
                                                    <button onClick={handleItalicClick} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isItalic ? "bg-white text-black" : "text-zinc-500 hover:text-white hover:bg-white/10"} `}><Italic size={14} strokeWidth={3} /></button>
                                                    <button onClick={handleUnderlineClick} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isUnderline ? "bg-white text-black" : "text-zinc-500 hover:text-white hover:bg-white/10"} `}><Underline size={14} strokeWidth={3} /></button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center gap-2 pt-1">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => handleColorClick(c.value)}
                                                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center shrink-0 ${selectedColor === c.value ? "scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-[#09090b]" : "opacity-50 hover:opacity-100"}`}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {activeTool === "stamp" && (
                                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col gap-3 animate-in fade-in">
                                        <div className="flex flex-wrap gap-1.5">
                                            {PRESET_STAMPS.map(stamp => (
                                                <button
                                                    key={stamp}
                                                    onClick={() => setSelectedStamp(stamp)}
                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border transition-colors ${selectedStamp === stamp ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-800 hover:text-zinc-300"}`}
                                                >
                                                    {stamp}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 justify-center pt-2 border-t border-white/5">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setSelectedColor(c.value)}
                                                    className={`w-5 h-5 rounded-full transition-all shrink-0 ${selectedColor === c.value ? "scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-[#09090b]" : "opacity-50 hover:opacity-100"}`}
                                                    style={{ backgroundColor: c.value }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signature Library */}
                            {savedSignatures.length > 0 && (
                                <div className="pt-2">
                                    <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                                        <Save size={10} /> Library
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {savedSignatures.slice(0, 3).map((sig) => (
                                            <div key={sig.id} className="group relative flex items-center p-2 bg-white/[0.02] border border-white/[0.05] hover:border-white/15 rounded-xl transition-all cursor-pointer overflow-hidden" onClick={() => placeFromLibrary(sig)}>
                                                <div className="h-10 w-full bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                                                    <img src={sig.dataUrl} alt="template" className="h-full w-full object-contain" />
                                                </div>
                                                <button onClick={(e) => deleteFromLibrary(sig.id, e)} className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider mt-2 text-center">Click a template to place on Page 1</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 border-t border-white/[0.04] space-y-2">
                                <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                                    <Layers size={10} /> Actions
                                </h3>

                                {/* Undo/Redo */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="h-9 rounded-lg bg-white/[0.02] border border-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-15 disabled:pointer-events-none"
                                    >
                                        <Undo2 size={12} /> Undo
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={!canRedo}
                                        className="h-9 rounded-lg bg-white/[0.02] border border-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-15 disabled:pointer-events-none"
                                    >
                                        <Redo2 size={12} /> Redo
                                    </button>
                                </div>

                                {/* Export */}
                                <button
                                    onClick={exportSignedPdf}
                                    disabled={signatures.length === 0 || isExporting}
                                    className="w-full h-11 rounded-xl bg-white text-black flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-15 disabled:pointer-events-none font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Exporting…
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} strokeWidth={2.5} /> Finalise PDF
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={reset}
                                    className="w-full h-9 rounded-lg bg-transparent border border-white/[0.04] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={11} /> Reset
                                </button>
                            </div>

                        </div>
                    </aside>

                    {/* ── MAIN VIEWER AREA ── */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">

                        {/* ── TOP NAV (FILE INFO) ── */}
                        <div className="flex items-center justify-between bg-zinc-950/60 border border-white/[0.04] p-3.5 rounded-xl gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white/[0.06] border border-white/10 rounded-lg flex items-center justify-center">
                                    <FileText size={16} className="text-zinc-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-md">{file.name}</p>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{pageCount} pages · {signatures.length} annotations</p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <div className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg flex items-center gap-2">
                                    <ShieldCheck size={10} className="text-emerald-500" />
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Client-Side</span>
                                </div>
                            </div>
                        </div>

                        {/* ── SUCCESS CARD ── */}
                        {outputUrl && (
                            <div className="bg-zinc-950/60 border border-white/[0.04] p-10 rounded-2xl flex flex-col items-center gap-6 text-center animate-in zoom-in-95 duration-500">
                                <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center">
                                    <Check size={28} strokeWidth={3.5} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-3xl font-black text-white tracking-tighter">Document Signed</h3>
                                    <p className="text-zinc-500 text-sm font-medium">Your finalized PDF is ready for download.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                                    <a
                                        href={outputUrl}
                                        download={`signed_${file?.name || "document.pdf"}`}
                                        className="w-full h-12 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.97]"
                                    >
                                        <Download size={16} /> Download PDF
                                    </a>
                                    <button
                                        onClick={() => setIsSharing(true)}
                                        className="w-full sm:w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white flex items-center justify-center transition-all hover:bg-white/[0.08]"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setOutputUrl(null); setOutputBlob(null); }}
                                    className="text-[9px] font-bold text-zinc-600 hover:text-zinc-300 uppercase tracking-wider transition-colors"
                                >
                                    ← Back to Editor
                                </button>
                            </div>
                        )}

                        {/* ── DOCUMENT VIEWER ── */}
                        {!outputUrl && (
                            <div className="bg-zinc-950/30 border border-white/[0.04] rounded-2xl p-1 relative">
                                {/* Instructions Overlay Hint */}
                                {signatures.length === 0 && !dismissHint && (
                                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                                        <div className="pl-4 pr-1.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-3 animate-bounce shadow-xl pointer-events-auto">
                                            <div className="flex items-center gap-2">
                                                <MousePointer2 size={11} />
                                                Click or drag on the document to place {activeTool}
                                            </div>
                                            <button 
                                                onClick={() => setDismissHint(true)} 
                                                className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                                                title="Dismiss"
                                            >
                                                <X size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <PdfViewer
                                    file={file}
                                    signatures={signatures}
                                    setSignatures={setSigsNoHistory}
                                    onBoxSelected={handleBoxSelected}
                                    applyToAllPages={(sig: any) => toggleAllPages(sig.id)}
                                    onLoadSuccess={setPageCount}
                                    activeTool={activeTool}
                                    activeSigId={activeSigId}
                                    setActiveSigId={setActiveSigId}
                                />
                            </div>
                        )}

                        {/* ── ANNOTATIONS LOG ── */}
                        {!outputUrl && signatures.length > 0 && (
                            <div className="p-4 bg-zinc-950/30 border border-white/[0.04] rounded-xl flex items-center gap-4 overflow-x-auto">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em] flex items-center gap-2 shrink-0">
                                    <Layers size={10} /> Log ({signatures.length})
                                </p>
                                <div className="flex gap-1.5 flex-1 w-max">
                                    {signatures.map(sig => (
                                        <div
                                            key={sig.id}
                                            className="group flex items-center gap-2.5 h-10 pl-1.5 pr-2 bg-white/[0.03] border border-white/[0.06] hover:border-white/15 rounded-xl transition-all shrink-0"
                                        >
                                            <div className="w-8 h-6 bg-white rounded-md flex items-center justify-center shrink-0">
                                                {sig.type === "signature" || sig.type === "initials" ? (
                                                    <img src={sig.dataUrl} alt="sig" className="h-[90%] w-[90%] object-contain" />
                                                ) : sig.type === "text" ? (
                                                    <Type size={11} className="text-black" />
                                                ) : sig.type === "date" ? (
                                                    <Calendar size={11} className="text-black" />
                                                ) : sig.type === "stamp" ? (
                                                    <Stamp size={11} className="text-black" />
                                                ) : (
                                                    <CheckSquare size={11} className="text-black" />
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase">
                                                {sig.allPages ? "All" : `P${sig.pageIndex + 1}`}
                                            </span>
                                            <button
                                                onClick={() => removeSignature(sig.id)}
                                                className="w-6 h-6 rounded flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══ FEATURE GRID (shown before upload) ══ */}
            {!file && (
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/[0.04] pt-8">
                    {[
                        { icon: MousePointer2, title: "Precision Placement", desc: "Drag a rectangle anywhere on any page to define exactly where your signature appears." },
                        { icon: Layers,        title: "Multi-Page Sync",     desc: "Toggle any signature to stamp every page simultaneously — perfect for contracts." },
                        { icon: Shield,        title: "100% Private",        desc: "Everything runs in your browser. Your PDF never touches a server." },
                    ].map((f, i) => (
                        <div key={i} className="group text-center flex flex-col items-center gap-4 py-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/[0.06] bg-white/[0.02] group-hover:bg-white/[0.05] group-hover:border-white/15 transition-all duration-300">
                                <f.icon size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1.5">{f.title}</h4>
                                <p className="text-[11px] text-zinc-600 font-medium leading-relaxed max-w-[200px] mx-auto">{f.desc}</p>
                            </div>
                        </div>
                    ))}

                    <div className="col-span-1 md:col-span-3 text-center pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-full">
                            <Sparkles size={10} className="text-zinc-500" />
                            <span className="text-[8px] font-black tracking-widest text-zinc-600 uppercase">
                                Free · No login · No watermarks
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Signer Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Smart PDF Signature Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Elevate your document workflow with AssetNest <strong>Professional PDF Signer</strong>. In an era of digital-first business, the ability to execute agreements instantly and securely is critical. Our Smart Signer engine allows you to place high-fidelity digital signatures across multi-page documents with pixel-perfect precision. By utilizing advanced client-side processing, we eliminate the need for third-party servers, ensuring your sensitive legal, financial, and corporate documents never leave the safety of your local environment.
                        </p>
                    </section>
                </div>
            </HelpModal>

            {/* ══ SIGNATURE PAD MODAL ══ */}
            {isPadOpen && (
                <SignaturePad
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

/* ── Inline Shield SVG ── */
const Shield = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
);
