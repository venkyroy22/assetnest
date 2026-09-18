"use client";

import "@/lib/pdfjs-polyfill";
import React, { useState, useRef } from "react";
import {
    Upload, Download, RefreshCw, FileText, Info, X, Check,
    ShieldCheck, Sparkles, Package, Lock as LockIcon, Zap,
    ArrowLeft, HelpCircle, UploadCloud, Copy, Share2, FileCheck
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import HelpModal from "@/components/HelpModal";
import dynamic from "next/dynamic";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";

const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });

/* ─────────────────────────────────────────
   DESIGN TOKENS (Standard Dark System)
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
        }}>
            {icon}{label}
        </span>
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

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Text Extractor",
    description: "Extract text from PDF files directly in your web browser. 100% private, no uploads.",
    url: "https://www.assetnest.space/tools/pdf-text-extractor",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfTextExtractorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [showHelp, setShowHelp] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [rawText, setRawText] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
            setError("Please upload a valid PDF file.");
            return;
        }
        setError(null);
        setFile(f);
        setOutputUrl(null);
        setOutputBlob(null);
        setRawText("");
        setProgress(0);
        setCopied(false);

        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            setPageCount(pdf.numPages);
        } catch {
            setPageCount(1);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const convertToWord = async () => {
        if (!file) return;
        setIsConverting(true);
        setError(null);
        setProgress(5);

        try {
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            const numPages = pdf.numPages;
            setPageCount(numPages);
            const paragraphs: Paragraph[] = [];
            let extractedStrings: string[] = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                const items = textContent.items as any[];
                const styles = textContent.styles as any;

                // Sort items top-to-bottom, then left-to-right
                items.sort((a, b) => {
                    const yA = a.transform[5];
                    const yB = b.transform[5];
                    if (Math.abs(yA - yB) > 5) {
                        return yB - yA;
                    }
                    return a.transform[4] - b.transform[4];
                });

                let currentParagraphRuns: TextRun[] = [];
                let currentParaText: string[] = [];
                let lastY = -1;
                let lastX = -1;
                let currentIndent = 0;

                for (const item of items) {
                    const str = item.str;
                    if (!str.trim() && str.length > 0 && currentParagraphRuns.length > 0) {
                        currentParagraphRuns.push(new TextRun({ text: " " }));
                        currentParaText.push(" ");
                        continue;
                    }
                    if (!str) continue;

                    const style = styles[item.fontName];
                    const x = item.transform[4];
                    const y = item.transform[5];
                    const fontSize = Math.abs(item.transform[3]);

                    const fontNameLower = (item.fontName || "").toLowerCase();
                    const fontFamilyLower = (style && style.fontFamily ? style.fontFamily : "").toLowerCase();

                    const isBold = fontNameLower.includes("bold") || fontFamilyLower.includes("bold");
                    const isItalic = fontNameLower.includes("italic") || fontNameLower.includes("oblique") || fontFamilyLower.includes("italic");

                    const yDiff = lastY !== -1 ? lastY - y : 0;
                    
                    if (yDiff > (fontSize || 12) * 1.5 && currentParagraphRuns.length > 0) {
                        paragraphs.push(new Paragraph({
                            children: currentParagraphRuns,
                            indent: { left: currentIndent > 50 ? currentIndent * 15 : 0 },
                            spacing: { after: 120 }
                        }));
                        extractedStrings.push(currentParaText.join(""));
                        currentParagraphRuns = [];
                        currentParaText = [];
                        lastX = -1;
                    }

                    if (currentParagraphRuns.length === 0) {
                        currentIndent = x;
                    }

                    if (lastX !== -1 && (x - lastX) > (fontSize || 12) * 0.4) {
                        currentParagraphRuns.push(new TextRun({ text: " " }));
                        currentParaText.push(" ");
                    }

                    currentParagraphRuns.push(new TextRun({
                        text: str,
                        bold: isBold,
                        italics: isItalic,
                        size: fontSize ? Math.max(16, Math.round(fontSize * 2)) : 24,
                        font: style && style.fontFamily ? style.fontFamily : "Helvetica"
                    }));
                    currentParaText.push(str);

                    lastY = y;
                    lastX = x + (item.width || 0);
                }

                if (currentParagraphRuns.length > 0) {
                    paragraphs.push(new Paragraph({
                        children: currentParagraphRuns,
                        indent: { left: currentIndent > 50 ? currentIndent * 15 : 0 },
                        spacing: { after: 120 }
                    }));
                    extractedStrings.push(currentParaText.join(""));
                }

                if (i !== numPages) {
                    paragraphs.push(new Paragraph({ 
                        pageBreakBefore: true,
                        children: [new TextRun("")]
                    }));
                    extractedStrings.push("\n--- Page Break ---\n");
                }

                setProgress(5 + Math.round((i / numPages) * 80));
            }

            setProgress(90);

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs.length > 0 ? paragraphs : [new Paragraph("No extractable text found.")],
                }],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            
            const fullText = extractedStrings.join("\n").trim();
            setRawText(fullText || "No text could be extracted from this PDF. It may be a scanned document without an embedded text layer.");

            setProgress(100);
            setOutputUrl(url);
            setOutputBlob(blob);

        } catch (e) {
            console.error("Conversion error:", e);
            setError("Failed to extract text. It may be heavily image-based, corrupted, or password protected.");
        } finally {
            setIsConverting(false);
        }
    };

    const downloadWord = () => {
        if (!outputUrl || !file) return;
        const a = document.createElement("a");
        a.href = outputUrl;
        a.download = file.name.replace(/\.[^/.]+$/, "") + "_Text.docx";
        a.click();
    };

    const downloadTxt = () => {
        if (!rawText || !file) return;
        const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.[^/.]+$/, "") + "_Text.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (!rawText) return;
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setFile(null);
        setError(null);
        setOutputUrl(null);
        setOutputBlob(null);
        setRawText("");
        setProgress(0);
        setCopied(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const wordCount = rawText ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
    const charCount = rawText ? rawText.length : 0;

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666666; }
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
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Text Extractor</span>
                    <button 
                        onClick={() => setShowHelp(true)} 
                        style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.muted, cursor: "pointer", display: "flex" }}
                        title="Help Guide"
                    >
                        <HelpCircle size={11} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: "10px 14px", border: `1px solid ${T.danger}`, background: "#3d2222",
                        display: "flex", alignItems: "center", gap: 10, borderRadius: 3, marginBottom: 16
                    }}>
                        <Info size={14} style={{ color: T.danger, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#ff9999", flex: 1 }}>{error}</span>
                        <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", display: "flex" }}>
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Main Workspace */}
                {!file ? (
                    /* Dropzone */
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            minHeight: 240,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            border: `1px dashed ${isDragging ? T.accent : T.border}`,
                            borderRadius: 4, background: isDragging ? T.surfaceHi : T.surface,
                            cursor: "pointer", transition: "all 0.2s", padding: 24,
                        }}
                    >
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="application/pdf" 
                            style={{ display: "none" }} 
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
                        />

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                {isConverting ? <RefreshCw className="animate-spin" size={20} /> : <UploadCloud size={22} />}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                Drop your PDF here
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>
                                or click to browse · 100% Client-side Processing
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                <Chip icon={<Package size={10} />} label="No Server Upload" />
                                <Chip icon={<Sparkles size={10} />} label="DOCX & Plain Text" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Active File Card */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: "16px 20px",
                            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                            gap: 16
                        }}>
                            {/* File Info with Thumbnail */}
                            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240, flex: 1 }}>
                                <div style={{
                                    width: 48, height: 62, borderRadius: 3, background: "#2a2a2a",
                                    border: `1px solid ${T.border}`, overflow: "hidden", display: "flex",
                                    alignItems: "center", justifyContent: "center", flexShrink: 0
                                }}>
                                    <PdfPageThumbnail file={file} pageIndex={0} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textSec, marginTop: 2, display: "flex", gap: 8 }}>
                                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        {pageCount > 0 && <span>• {pageCount} page{pageCount !== 1 ? "s" : ""}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons / Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                {!outputUrl && !isConverting && (
                                    <button
                                        onClick={convertToWord}
                                        style={{
                                            height: 34, padding: "0 16px", background: T.accent, border: `1px solid ${T.accent}`,
                                            borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <FileText size={13} /> Extract Text
                                    </button>
                                )}

                                <button
                                    onClick={reset}
                                    disabled={isConverting}
                                    style={{
                                        height: 34, padding: "0 12px", background: "transparent", border: `1px solid ${T.border}`,
                                        borderRadius: 3, color: T.textSec, fontSize: 11,
                                        cursor: isConverting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
                                        transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { if (!isConverting) { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; } }}
                                    onMouseLeave={e => { if (!isConverting) { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; } }}
                                >
                                    <RefreshCw size={12} /> Change File
                                </button>
                            </div>
                        </div>

                        {/* Conversion Progress Bar */}
                        {isConverting && (
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: 16
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 11 }}>
                                    <span style={{ color: T.accent, display: "flex", alignItems: "center", gap: 6 }}>
                                        <RefreshCw className="animate-spin" size={12} /> Parsing PDF coordinate vectors...
                                    </span>
                                    <span style={{ color: T.textSec, fontWeight: 500 }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, width: "100%", background: "#2a2a2a", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", width: `${progress}%`, background: T.accent,
                                        borderRadius: 3, transition: "width 0.3s ease-out"
                                    }} />
                                </div>
                                <p style={{ fontSize: 10, color: T.muted, margin: "8px 0 0" }}>
                                    Reconstructing paragraphs, font families, and indentations locally in memory...
                                </p>
                            </div>
                        )}

                        {/* Extracted Output Studio */}
                        {outputUrl && (
                            <div style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", gap: 16
                            }}>
                                {/* Stats & Completion Bar */}
                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${T.borderDim}`, paddingBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 5,
                                            padding: "3px 8px", background: "rgba(125,206,160,0.12)",
                                            border: `1px solid ${T.success}`, borderRadius: 2,
                                            fontSize: 11, color: T.success, fontWeight: 500
                                        }}>
                                            <Check size={12} /> Extraction Complete
                                        </div>
                                        <span style={{ fontSize: 11, color: T.textSec }}>
                                            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <button
                                            onClick={handleCopy}
                                            style={{
                                                height: 32, padding: "0 12px", background: copied ? "rgba(125,206,160,0.15)" : T.surfaceHi,
                                                border: `1px solid ${copied ? T.success : T.border}`, borderRadius: 3,
                                                color: copied ? T.success : T.textPri, fontSize: 11, cursor: "pointer",
                                                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                                            }}
                                            title="Copy extracted text to clipboard"
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                            {copied ? "Copied to Clipboard" : "Copy Text"}
                                        </button>
                                    </div>
                                </div>

                                {/* Live Text Viewer */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec }}>Extracted Content Preview</span>
                                        <span style={{ fontSize: 10, color: T.muted }}>Editable in-place</span>
                                    </div>
                                    <textarea
                                        value={rawText}
                                        onChange={e => setRawText(e.target.value)}
                                        className="custom-scrollbar"
                                        rows={12}
                                        style={{
                                            width: "100%", background: "#2a2a2a", border: `1px solid ${T.borderDim}`,
                                            borderRadius: 3, padding: 12, color: T.textPri, fontSize: 11,
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                            lineHeight: 1.6, resize: "vertical", outline: "none"
                                        }}
                                        placeholder="Extracted text will appear here..."
                                    />
                                </div>

                                {/* Download & Export Bar */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, paddingTop: 4 }}>
                                    <button
                                        onClick={downloadWord}
                                        style={{
                                            height: 38, background: T.accent, border: `1px solid ${T.accent}`,
                                            borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <Download size={14} /> Download Word (DOCX)
                                    </button>

                                    <button
                                        onClick={downloadTxt}
                                        style={{
                                            height: 38, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                            borderRadius: 3, color: T.textPri, fontWeight: 500, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <FileCheck size={14} /> Download Plain Text (TXT)
                                    </button>

                                    <button
                                        onClick={() => setIsSharing(true)}
                                        style={{
                                            height: 38, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                            borderRadius: 3, color: T.textPri, fontWeight: 500, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <Share2 size={14} /> Share to Mobile
                                    </button>

                                    <button
                                        onClick={reset}
                                        style={{
                                            height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                            borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                    >
                                        <RefreshCw size={13} /> Extract Another PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── SEO RICH CONTENT SECTION ─── */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderDim}`, paddingTop: 36 }}>
                    {/* Top Badges */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                        <Chip icon={<ShieldCheck size={10} />} label="100% In-Browser Privacy" />
                        <Chip icon={<Sparkles size={10} />} label="Free & Unlimited" />
                        <Chip icon={<Package size={10} />} label="No Server Uploads" />
                    </div>

                    {/* Section Header */}
                    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 36px" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 500, color: T.textPri, marginBottom: 8 }}>
                            Free PDF Text Extractor - Export PDF to Word & Text
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Extract text layers and paragraph blocks from PDF documents into editable Word files (DOCX) or plain text instantly. Our offline-first engine processes characters directly in your device's browser memory, ensuring that legal forms, financial records, and private documents remain completely protected.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: FileText,
                                title: "Client-Side Content Parsing",
                                desc: "Extract strings locally. We utilize JavaScript structures to map character coordinates with zero external tracking."
                            },
                            {
                                icon: Sparkles,
                                title: "Retain Font and Paragraph Styling",
                                desc: "Our layout mapping preserves line spaces, indentation gaps, font families, bold weights, and italic slants."
                            },
                            {
                                icon: Download,
                                title: "Perfect DOCX Compilation",
                                desc: "Exports parsed vector characters immediately into structured Word formats (.docx) that open flawlessly in MS Word."
                            },
                            {
                                icon: Zap,
                                title: "Bypasses Network Bandwidth",
                                desc: "Saves you from waiting for cloud upload streams. Process heavy documents instantly on your local CPU."
                            },
                            {
                                icon: LockIcon,
                                title: "Clean, Watermark-Free Export",
                                desc: "The output file remains completely clean. We do not inject promotional footnotes, page stamps, or headers."
                            },
                            {
                                icon: Package,
                                title: "100% Free & Uncapped Usage",
                                desc: "Extract content from multi-page documents unlimited times without registration walls or size constraints."
                            }
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

                    {/* Step Timeline */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 44 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 20 }}>
                            How to Extract PDF Text to Word Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select PDF Document", desc: "Drag and drop your PDF into the secure local dropzone or click to browse files locally." },
                                { step: "2", title: "Run Structured Extraction", desc: "Click the 'Extract Text' button. The script parses vector coordinate mapping in milliseconds." },
                                { step: "3", title: "Copy or Download Output", desc: "Copy text to clipboard or download structured DOCX or Plain TXT files directly to your device." }
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

                    {/* Comparison Table */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 44 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 4 }}>
                            AssetNest Local Parser vs. Server-Side Converters
                        </h3>
                        <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", marginBottom: 16, maxWidth: 540, margin: "0 auto 16px" }}>
                            Compare our locally executed script framework with typical cloud-based converters.
                        </p>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                                <thead>
                                    <tr style={{ background: "#2e2e2e", borderBottom: `1px solid ${T.border}` }}>
                                        <th style={{ padding: "10px 12px", color: T.textPri, fontWeight: 600 }}>Feature Capability</th>
                                        <th style={{ padding: "10px 12px", color: T.accent, fontWeight: 600 }}>AssetNest In-Browser Extractor</th>
                                        <th style={{ padding: "10px 12px", color: T.textSec, fontWeight: 600 }}>Cloud-Based Converters</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feat: "File Confidentiality", ours: "100% Safe (Local processing guarantees files are never uploaded or logged)", other: "Risky (Files reside in remote database caches for rendering)" },
                                        { feat: "Paragraph Formatting", ours: "Rebuilds paragraphs using relative horizontal and vertical coords spacing", other: "Appends messy breaks or outputs simple unformatted txt blocks" },
                                        { feat: "Daily Size Limits", ours: "Completely unlimited size processing (restricted only by local device memory)", other: "Enforces strict document count limitations or gates features behind pricing tiers" },
                                        { feat: "Watermark Overlay", ours: "Clean Word exports (no promotional stamps or headers are injected)", other: "Inserts footer advertisements or restrictions in the output document" },
                                        { feat: "Registration constraints", ours: "No signups, memberships, or payments required", other: "Forces account registration before delivering download files" }
                                    ].map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                                            <td style={{ padding: "10px 12px", color: T.textPri, fontWeight: 500 }}>{row.feat}</td>
                                            <td style={{ padding: "10px 12px", color: "#e0e0e0" }}>{row.ours}</td>
                                            <td style={{ padding: "10px 12px", color: T.textSec }}>{row.other}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FAQ Accordion Section */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 16 }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="How does the local PDF text extractor protect document security?"
                                answer="AssetNest runs pdfjs-dist structures inside a local Web Worker environment. All text analysis, coordinate sorting, and docx packing take place directly inside your device's memory. No files are uploaded to our servers."
                            />
                            <FAQItem 
                                question="Can this tool extract text from scanned, image-only PDF documents?"
                                answer="This tool scans digital text layers in vector PDFs. It does not perform Optical Character Recognition (OCR). If your PDF consists of raw flat photos or scans with no selectable text layers, the parser will return an empty page warning."
                            />
                            <FAQItem 
                                question="Will the formatting, bold headers, and fonts be preserved in Word?"
                                answer="Yes. The algorithm reads font item styles, checks bold/italic tags, estimates font sizes, and measures line drops (Y-axis distance) to reconstruct natural paragraphs, indentation, and styled runs."
                            />
                            <FAQItem 
                                question="Is there a page limit on the size of files I can extract?"
                                answer="No. You can process documents of any length. Large books or multi-hundred-page transcripts may take several seconds to process depending on your local CPU."
                            />
                            <FAQItem 
                                question="Why does my extracted DOCX file have double spaces or layout shifts?"
                                answer="PDFs are designed as rigid absolute coordinate grids rather than reflowable text pages. The parser does its best to sort characters top-to-bottom and left-to-right, but complex multi-column charts or floating frames may occasionally require light manual adjustments."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Text Extractor Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Visual Text Extraction Architecture
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            AssetNest Advanced PDF Text Extractor provides a structural client-side parser where you can mine raw text from PDF containers with zero data exposure. Transforms PDF text streams into structured DOCX containers and copyable plain text with character preservation and zero server dependencies.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <FileText size={14} style={{ color: T.accent }} /> Extraction Methods
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Universal Parsing:</strong> Drop any digital PDF container to scan underlying text vectors.</li>
                                <li><strong>DOCX Reconstruction:</strong> Automatically compile into professional Word documents retaining paragraph flow.</li>
                                <li><strong>Quick Copy:</strong> Copy raw parsed text to clipboard in a single click.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Compliance
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Files remain strictly in your local device RAM. No server uploads or cloud caches are involved.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: Local Buffer Parsing • Zero-Server Footprint • Direct DOCX & TXT Output
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Does this work on scanned PDFs?" 
                                answer="No, this tool extracts vector text from digital PDFs. For scanned images, use OCR." 
                            />
                            <FAQItem 
                                question="Is my file data saved anywhere?" 
                                answer="No. Extracted text persists only in browser memory until the tab is closed or reset." 
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>

            {/* Share Modal */}
            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={outputBlob}
                fileName={file ? `${file.name.replace(/\.[^/.]+$/, "")}_Text.docx` : "extracted_text.docx"}
            />
        </div>
    );
}
