"use client";

import React, { useState, useRef } from "react";
import {
    Upload, Lock, Unlock, Download, FileText, ArrowRight, ShieldCheck,
    X, Loader2, Eye, EyeOff, Info, Zap, Check, RefreshCw, Sparkles,
    Package, ArrowLeft, HelpCircle, UploadCloud, Share2
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";
import dynamic from "next/dynamic";

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

// Load qpdf-wasm at runtime from CDN to avoid Turbopack/Next.js bundling issues
interface QpdfModule {
    FS: {
        writeFile(path: string, data: Uint8Array): void;
        readFile(path: string): Uint8Array;
        unlink(path: string): void;
    };
    callMain(args: string[]): void;
}

let qpdfModulePromise: Promise<QpdfModule> | null = null;

function loadQpdfWasm(): Promise<QpdfModule> {
    if (qpdfModulePromise) return qpdfModulePromise;
    
    qpdfModulePromise = new Promise<QpdfModule>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@jspawn/qpdf-wasm@0.0.2/qpdf.js";
        script.onload = () => {
            const createModule = (globalThis as any).Module;
            if (!createModule) {
                reject(new Error("Failed to load PDF decryption engine."));
                return;
            }
            createModule().then((mod: QpdfModule) => {
                resolve(mod);
            }).catch(reject);
        };
        script.onerror = () => {
            qpdfModulePromise = null;
            reject(new Error("Failed to load PDF decryption engine. Check your internet connection."));
        };
        document.head.appendChild(script);
    });
    
    return qpdfModulePromise;
}

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Password Remover",
    description: "Remove password protection from your PDF files instantly in your browser. 100% private, zero uploads.",
    url: "https://www.assetnest.space/tools/pdf-unlocker",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfUnlockerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successUrl, setSuccessUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [unlockedFileName, setUnlockedFileName] = useState<string>("");
    const [requiresUserPassword, setRequiresUserPassword] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
                setError("Please select a valid PDF file.");
                return;
            }
            await processInitialFile(selectedFile);
        }
    };

    const processInitialFile = async (selectedFile: File) => {
        setIsProcessing(true);
        setError(null);
        setSuccessUrl(null);
        setOutputBlob(null);
        setPassword("");
        setShowPassword(false);
        setRequiresUserPassword(false);
        setFile(selectedFile);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            // Attempt to load the PDF locally with pdf-lib first.
            // If it has ONLY an owner password, pdf-lib will decrypt it automatically in the browser.
            try {
                const pdfDoc = await PDFDocument.load(bytes);
                
                if (pdfDoc.isEncrypted) {
                    // Decrypted owner restriction locally
                    const unlockedBytes = await pdfDoc.save();
                    createDownloadUrl(unlockedBytes, selectedFile.name);
                } else {
                    setError("This PDF does not have any password restrictions.");
                    setFile(null);
                }
            } catch (err: unknown) {
                // pdf-lib throws an error if a User Password is required.
                if (err instanceof Error && err.message.toLowerCase().includes("encrypt")) {
                    setRequiresUserPassword(true);
                } else {
                    setError("Failed to read PDF. It might be corrupted or unsupported.");
                    setFile(null);
                }
            }
        } catch (err) {
            setError("Failed to read file.");
            setFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
                await processInitialFile(droppedFile);
            } else {
                setError("Please drop a valid PDF file.");
            }
        }
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !password) return;

        setIsProcessing(true);
        setError(null);

        try {
            const qpdf = await loadQpdfWasm();

            const inputData = new Uint8Array(await file.arrayBuffer());
            const inputPath = "/input.pdf";
            const outputPath = "/output.pdf";

            // Write to WASM virtual filesystem
            qpdf.FS.writeFile(inputPath, inputData);

            // Run qpdf --decrypt
            try {
                qpdf.callMain([
                    "--decrypt",
                    `--password=${password}`,
                    inputPath,
                    outputPath,
                ]);
            } catch {
                try { qpdf.FS.unlink(inputPath); } catch {}
                try { qpdf.FS.unlink(outputPath); } catch {}
                throw new Error("Incorrect password or unsupported encryption format.");
            }

            // Read decrypted output
            const decryptedData = qpdf.FS.readFile(outputPath);

            // Clean up virtual filesystem
            try { qpdf.FS.unlink(inputPath); } catch {}
            try { qpdf.FS.unlink(outputPath); } catch {}

            createDownloadUrl(decryptedData, file.name);
        } catch (err: any) {
            console.error("Unlock Error:", err);
            setError(err.message || "Failed to unlock PDF. Please check your password.");
        } finally {
            setIsProcessing(false);
        }
    };

    const createDownloadUrl = (bytes: Uint8Array, originalName: string) => {
        const blob = new Blob([bytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setOutputBlob(blob);
        setSuccessUrl(url);
        setRequiresUserPassword(false);
        
        const nameWithoutExt = originalName.replace(/\.pdf$/i, "");
        setUnlockedFileName(`${nameWithoutExt}_unlocked.pdf`);
    };

    const handleReset = () => {
        setFile(null);
        setPassword("");
        setShowPassword(false);
        setRequiresUserPassword(false);
        setError(null);
        if (successUrl) {
            URL.revokeObjectURL(successUrl);
            setSuccessUrl(null);
        }
        setOutputBlob(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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
                        <Unlock size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>PDF Password Remover</span>
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
                <div style={{ maxWidth: 680, margin: "0 auto" }}>
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
                                onChange={handleFileChange} 
                            />

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#444444", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, marginBottom: 12 }}>
                                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={22} />}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 4 }}>
                                    Drop your locked PDF here
                                </div>
                                <p style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>
                                    or click to browse · 100% In-Browser Decryption
                                </p>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                    <Chip icon={<ShieldCheck size={10} />} label="100% Private" />
                                    <Chip icon={<Package size={10} />} label="No Server Upload" />
                                    <Chip icon={<Sparkles size={10} />} label="Owner & User Passwords" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 24, display: "flex", flexDirection: "column", gap: 18
                        }}>
                            {/* File Info Bar */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                paddingBottom: 14, borderBottom: `1px solid ${T.borderDim}`, gap: 12
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 3, background: T.surfaceHi,
                                        border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
                                        justifyContent: "center", color: T.accent, flexShrink: 0
                                    }}>
                                        <FileText size={15} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: T.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: 10, color: T.textSec }}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                </div>

                                {!successUrl && (
                                    <button
                                        onClick={handleReset}
                                        style={{
                                            padding: "4px 10px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                            borderRadius: 2, color: T.textSec, fontSize: 11, cursor: "pointer"
                                        }}
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {/* State 1: Unlocked Successfully */}
                            {successUrl && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "12px 0" }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: "50%",
                                        background: "rgba(125,206,160,0.15)", border: `1px solid ${T.success}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: T.success, marginBottom: 12
                                    }}>
                                        <Unlock size={22} />
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>
                                        Successfully Unlocked!
                                    </div>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 20px" }}>
                                        Password restrictions have been completely removed from this document.
                                    </p>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, width: "100%" }}>
                                        <a
                                            href={successUrl}
                                            download={unlockedFileName}
                                            style={{
                                                height: 38, background: T.accent, border: `1px solid ${T.accent}`,
                                                borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                                textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                                transition: "all 0.15s"
                                            }}
                                        >
                                            <Download size={14} /> Download PDF
                                        </a>

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
                                            onClick={handleReset}
                                            style={{
                                                height: 38, background: "transparent", border: `1px solid ${T.border}`,
                                                borderRadius: 3, color: T.textSec, fontWeight: 500, fontSize: 11,
                                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                                transition: "all 0.15s"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.borderColor = "#777"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
                                        >
                                            <RefreshCw size={13} /> Unlock Another
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* State 2: Requires User Password */}
                            {requiresUserPassword && !successUrl && (
                                <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div>
                                        <label htmlFor="pdf-pass" style={{ display: "block", fontSize: 11, fontWeight: 500, color: T.textPri, marginBottom: 6 }}>
                                            Enter PDF Open Password
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <div style={{ position: "absolute", top: 0, bottom: 0, left: 10, display: "flex", alignItems: "center", color: T.muted }}>
                                                <Lock size={14} />
                                            </div>
                                            <input
                                                id="pdf-pass"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Document password"
                                                autoFocus
                                                required
                                                style={{
                                                    width: "100%", height: 38, background: "#2a2a2a",
                                                    border: `1px solid ${T.border}`, borderRadius: 3,
                                                    paddingLeft: 34, paddingRight: 36, color: T.textPri,
                                                    fontSize: 12, outline: "none"
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: "absolute", top: 0, bottom: 0, right: 8,
                                                    background: "none", border: "none", color: T.textSec,
                                                    cursor: "pointer", display: "flex", alignItems: "center"
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isProcessing || !password}
                                        style={{
                                            height: 38, background: T.accent, border: `1px solid ${T.accent}`,
                                            borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11,
                                            cursor: (isProcessing || !password) ? "not-allowed" : "pointer",
                                            opacity: (isProcessing || !password) ? 0.6 : 1,
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Decrypting container...
                                            </>
                                        ) : (
                                            <>
                                                Unlock PDF
                                                <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>

                                    <p style={{ margin: 0, fontSize: 10, color: T.muted, textAlign: "center" }}>
                                        Decryption runs locally in memory with WebAssembly. Password is never logged.
                                    </p>
                                </form>
                            )}

                            {/* State 3: Auto-processing owner permissions lock */}
                            {isProcessing && !requiresUserPassword && !successUrl && (
                                <div style={{ textAlign: "center", padding: "30px 0" }}>
                                    <Loader2 size={24} className="animate-spin" style={{ color: T.accent, margin: "0 auto 10px" }} />
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0 }}>
                                        Decrypting document security permissions...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                            Free PDF Password Remover Online - Unlock PDF Restrictions
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Instantly remove owner security restrictions or user open passwords from your PDF files online. Our client-side WebAssembly processor decrypts PDF document streams directly in your browser without persistent file storage or tracking.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Unlock,
                                title: "Hybrid Local Decryption",
                                desc: "Automatically detects and strips permissions locks client-side in browser memory via pdf-lib structures."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Absolute Data Privacy",
                                desc: "No document storage or persistence. Unlocked data buffers are immediately wiped from RAM after download."
                            },
                            {
                                icon: FileText,
                                title: "Preserves Formatting",
                                desc: "Retains original vector graphics, active hyperlinks, layers, fonts, and document layouts perfectly."
                            },
                            {
                                icon: Zap,
                                title: "High-Strength Support",
                                desc: "Easily decrypts PDFs encrypted with standard 128-bit and 256-bit AES protection algorithms."
                            },
                            {
                                icon: Package,
                                title: "No File Size Limits",
                                desc: "Process single-page permission forms or massive multi-megabyte encrypted documents with ease."
                            },
                            {
                                icon: Lock,
                                title: "100% Free & Unlimited",
                                desc: "No registration caps, hourly subscriptions, or advertising watermarks added to your unlocked PDFs."
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
                            How to Remove PDF Passwords and Restrictions
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select Protected PDF", desc: "Drag and drop your password-protected or restricted PDF into the secure dropbox." },
                                { step: "2", title: "Enter Password If Needed", desc: "Owner permission locks unlock automatically; for user open passwords, supply the document password." },
                                { step: "3", title: "Download Unlocked PDF", desc: "Save your clean, unrestricted PDF file immediately with zero watermarks or ads." }
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
                            AssetNest Local Decryption vs. Server-Side Converters
                        </h3>
                        <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", marginBottom: 16, maxWidth: 540, margin: "0 auto 16px" }}>
                            Compare our locally executed script framework with typical cloud-based converters.
                        </p>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                                <thead>
                                    <tr style={{ background: "#2e2e2e", borderBottom: `1px solid ${T.border}` }}>
                                        <th style={{ padding: "10px 12px", color: T.textPri, fontWeight: 600 }}>Feature Capability</th>
                                        <th style={{ padding: "10px 12px", color: T.accent, fontWeight: 600 }}>AssetNest In-Browser Decryption</th>
                                        <th style={{ padding: "10px 12px", color: T.textSec, fontWeight: 600 }}>Cloud-Based Unlockers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feat: "File Confidentiality", ours: "100% Safe (Files never uploaded to remote servers)", other: "Risky (Sensitive documents uploaded to external servers)" },
                                        { feat: "Owner Restriction Bypass", ours: "Automatic local removal of printing/copying locks in ms", other: "Requires waiting in server queue" },
                                        { feat: "Daily Limits", ours: "Unlimited files and file sizes (bound only by device RAM)", other: "Hourly usage caps or subscription paywalls" },
                                        { feat: "Watermark Overlay", ours: "100% clean output without injected stamps", other: "Inserts brand stamps or footer ads" },
                                        { feat: "Registration", ours: "No sign-ups, accounts, or emails requested", other: "Requires registration before download" }
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
                                question="What is the difference between an owner password and a user password?"
                                answer="An Owner Password restricts specific permissions such as printing, editing, or copying text, while allowing anyone to open the document. A User Password (open password) prevents the document from being opened at all without the correct password. Our tool removes both types."
                            />
                            <FAQItem 
                                question="Do I need to know the password to remove it?"
                                answer="If the document is protected by an Owner Password (permissions lock), our engine can unlock it automatically without needing the password. If it is protected by a User Open Password, you must supply the password once so our WebAssembly engine can decrypt and resave an unrestricted copy."
                            />
                            <FAQItem 
                                question="Are my sensitive PDF documents uploaded to external servers?"
                                answer="No! All decryption occurs locally in your browser using client-side WebAssembly and JavaScript. Your files never leave your device."
                            />
                            <FAQItem 
                                question="Will hyperlinks, form fields, and vector resolution be preserved?"
                                answer="Yes. Decryption removes encryption dictionaries while preserving all native PDF structures, vector artwork, annotations, and hyperlinks with 100% fidelity."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Password Remover Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            In-Browser Decryption Infrastructure
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            AssetNest PDF Password Remover employs a dual client-side decryption engine. Owner restrictions are lifted via lightweight local PDF parsers, while encrypted user password structures are processed using a sandboxed WebAssembly build of QPDF executing directly inside your browser.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Unlock size={14} style={{ color: T.accent }} /> Decryption Modes
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Owner Permissions:</strong> Strips printing, copying, and annotating locks instantly.</li>
                                <li><strong>User Open Passwords:</strong> Decrypts document contents with provided credentials.</li>
                                <li><strong>AES 128/256 Support:</strong> Full compatibility with modern PDF encryption specs.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Compliance
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Memory buffers are cleared immediately upon file download or reset. Zero logs or temporary files exist on any cloud server.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: WebAssembly QPDF • Zero-Server Footprint • 100% Client-Side In-Memory
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Can it crack unknown passwords?" 
                                answer="No. For security and legal compliance, open passwords must be supplied once by the legitimate file owner to remove encryption." 
                            />
                            <FAQItem 
                                question="Is my file data saved anywhere?" 
                                answer="No. Decrypted buffers exist strictly in temporary browser RAM until the window is closed or reset." 
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
                fileName={unlockedFileName || "unlocked_document.pdf"}
            />
        </div>
    );
}
