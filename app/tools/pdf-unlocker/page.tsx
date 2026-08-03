"use client";

import React, { useState, useRef } from "react";
import { Upload, Lock, Unlock, Download, FileText, ArrowRight, ShieldCheck, FileCheck, X, Loader2, Eye, EyeOff, Info, Zap, Check, RefreshCw, Sparkles, Package, ChevronDown, ArrowLeft } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

// Load qpdf-wasm at runtime from CDN to avoid Turbopack/Next.js bundling issues
// with Emscripten modules that require('fs') and require('module')
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
            // The script sets a global `Module` factory
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
    description: "Remove password protection from your PDF files instantly. Processed using a hybrid secure approach.",
    url: "https://www.assetnest.space/tools/pdf-unlocker",
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

export default function PdfUnlockerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successUrl, setSuccessUrl] = useState<string | null>(null);
    const [unlockedFileName, setUnlockedFileName] = useState<string>("");
    const [requiresUserPassword, setRequiresUserPassword] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
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
                    // It was encrypted with an owner password, and pdf-lib successfully decrypted it locally.
                    const unlockedBytes = await pdfDoc.save();
                    createDownloadUrl(unlockedBytes, selectedFile.name);
                } else {
                    setError("This PDF does not have any password restrictions.");
                    setFile(null);
                }
            } catch (err: unknown) {
                // pdf-lib throws an error if a User Password is required.
                if (err instanceof Error && err.message.toLowerCase().includes("encrypt")) {
                    // Document requires a User Password. We will prompt the user and process securely via API.
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
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
            // Load qpdf-wasm from CDN at runtime (avoids Turbopack bundling issues)
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
                throw new Error("Incorrect password or unsupported encryption.");
            }

            // Read decrypted output
            const decryptedData = qpdf.FS.readFile(outputPath);

            // Clean up virtual filesystem
            try { qpdf.FS.unlink(inputPath); } catch {}
            try { qpdf.FS.unlink(outputPath); } catch {}

            createDownloadUrl(decryptedData, file.name);
        } catch (err: any) {
            console.error("Unlock Error:", err);
            setError(err.message || "Failed to unlock PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const createDownloadUrl = (bytes: Uint8Array, originalName: string) => {
        const blob = new Blob([bytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
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
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-red-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                        <Unlock size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Unlocker
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

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10 space-y-6">
                {/* Error */}
                {error && (
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl">
                        <Info size={16} className="text-red-700 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                <div className="max-w-xl mx-auto relative z-10">
                    {/* Step 1: Upload */}
                    {!file && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="relative min-h-[260px] border-2 sm:border-4 border-dashed border-black bg-white hover:bg-zinc-55 shadow-[5px_5px_0_#000] rounded-[2rem] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-305 group/dropzone"
                        >
                            <div className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000] transition-all duration-300 group-hover/dropzone:scale-105 mb-6">
                                <Upload size={24} className="text-black" />
                            </div>
                            <h3 className="text-base font-black text-black tracking-tight mb-2 ig-display">Drag & Drop or Click Here</h3>
                            <p className="text-xs text-zinc-600 font-medium max-w-sm mx-auto leading-relaxed">
                                100% Private PDF Decryption • Instant Unlock
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="application/pdf"
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Step 2: Password Input or Success */}
                    {file && (
                        <div className="bg-white border-2 border-black rounded-[2rem] p-8 shadow-[5px_5px_0_#000] relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-4 mb-6 pb-6 border-b-2 border-black/10">
                                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center border-2 border-black shrink-0 shadow-[1.5px_1.5px_0_#000]">
                                    <FileText size={20} className="text-black" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-black font-black text-sm truncate ig-display">{file.name}</h3>
                                    <p className="text-zinc-600 text-xs font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                {!successUrl && (
                                    <button 
                                        onClick={handleReset}
                                        className="text-zinc-650 hover:text-black transition-colors text-xs font-black whitespace-nowrap border-2 border-black bg-white rounded-lg px-2.5 py-1.5 shadow-[1.5px_1.5px_0_#000] ig-btn"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {successUrl && (
                                <div className="relative z-10 text-center py-6">
                                    <div className="w-16 h-16 bg-emerald-55 rounded-full flex items-center justify-center mb-6 mx-auto border-2 border-black shadow-[3px_3px_0_#000]">
                                        <Unlock size={24} className="text-black" />
                                    </div>
                                    <h3 className="text-xl font-black text-black tracking-tight mb-2 ig-display">Successfully Unlocked!</h3>
                                    <p className="text-zinc-600 text-xs font-bold mb-8">Password protection has been removed from this PDF.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <a
                                            href={successUrl}
                                            download={unlockedFileName}
                                            className="ig-btn h-12 px-6 bg-[#a7f3d0] text-black rounded-full border-2 border-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_#000] transition-all active:scale-[0.98]"
                                        >
                                            <Download size={16} />
                                            Download PDF
                                        </a>
                                        <button
                                            onClick={handleReset}
                                            className="ig-btn h-12 px-6 bg-white hover:bg-zinc-50 text-black rounded-full border-2 border-black font-bold text-xs sm:text-sm shadow-[2.5px_2.5px_0_#000] transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={14} /> Unlock Another
                                        </button>
                                    </div>
                                </div>
                            )}

                            {requiresUserPassword && !successUrl && (
                                <form onSubmit={handleUnlock} className="relative z-10">
                                    <div className="mb-6">
                                        <label htmlFor="password" className="block text-xs font-black text-black mb-2 uppercase tracking-wider ig-label">
                                            Enter PDF Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black">
                                                <Lock size={16} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full h-12 bg-zinc-50 border-2 border-black focus:bg-white rounded-xl pl-11 pr-11 text-sm text-black font-bold placeholder:text-zinc-400 focus:outline-none transition-all shadow-[2px_2px_0_#000]"
                                                placeholder="Document password"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-black transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isProcessing || !password}
                                        className="ig-btn w-full h-12 bg-[#fde047] text-black border-2 border-black rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0_#000]"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Decryption processing...
                                            </>
                                        ) : (
                                            <>
                                                Unlock PDF
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-zinc-650 text-[10px] text-center font-bold mt-4 uppercase tracking-wide">
                                        Calculations happen securely in memory.
                                    </p>
                                </form>
                            )}

                            {isProcessing && !requiresUserPassword && !successUrl && (
                                <div className="relative z-10 text-center py-12">
                                    <Loader2 size={24} className="text-black animate-spin mx-auto mb-4" />
                                    <p className="text-zinc-600 text-xs font-bold">Decrypting container elements...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-center py-4">
                </div>

                {/* ─── SEO RICH TEXT SECTION ─── */}
                <div className="p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000] text-zinc-700">
                    <div className="relative z-10 space-y-12">
                        {/* Top Badges */}
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fbcfe8] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <ShieldCheck size={11} className="text-black" /> 100% Secure & Private
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Sparkles size={11} className="text-black" /> Free & Unlimited
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fde047] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                <Package size={11} className="text-black" /> Instant Decryption
                            </span>
                        </div>

                        {/* Main Title & Description */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight text-center ig-display">
                                Free PDF Password Remover Online — Unlock PDF Files Privately
                            </h2>
                            <p className="text-sm text-zinc-655 leading-relaxed text-center font-medium">
                                Instantly remove owner security restrict permissions or user open passwords from your PDF files online. Our hybrid WebAssembly and secure memory processor lets you decrypt PDF document streams directly in your browser or securely in memory without persistent file storage or log trails.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Hybrid Local Decryption",
                                    desc: "Automatically detects and strips permissions locks client-side in browser memory via pdf-lib structures.",
                                    icon: <Unlock size={16} />
                                },
                                {
                                    title: "Absolute Data Privacy",
                                    desc: "No document storage or persistence. Unlocked data buffers are immediately wiped from RAM after download.",
                                    icon: <ShieldCheck size={16} />
                                },
                                {
                                    title: "Preserves Formatting",
                                    desc: "Retains original vector graphics, active hyperlinks, layers, fonts, and document layouts perfectly.",
                                    icon: <FileText size={16} />
                                },
                                {
                                    title: "High-Strength Support",
                                    desc: "Easily decrypts PDFs encrypted with standard 128-bit/256-bit AES protection algorithms.",
                                    icon: <Zap size={16} />
                                },
                                {
                                    title: "No File Size Limits",
                                    desc: "Process single-page permission forms or massive multi-megabyte encrypted documents with ease.",
                                    icon: <Package size={16} />
                                },
                                {
                                    title: "100% Free & Unlimited",
                                    desc: "No registration caps, hourly subscriptions, or advertising watermarks added to your unlocked PDFs.",
                                    icon: <Lock size={16} />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-2xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                    <p className="text-xs text-zinc-650 leading-relaxed font-medium">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                How to Remove PDF Passwords and Restrictions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Upload Encrypted PDF", desc: "Drag and drop your password-protected PDF or select it from your device folder securely." },
                                    { step: "2", title: "Input Document Password", desc: "If your file requires a user open password, type it into our secure decryption input." },
                                    { step: "3", title: "Decrypt and Save", desc: "Click the 'Unlock PDF' button to decrypt the file container and download your unlocked document." }
                                ].map((s) => (
                                    <div key={s.step} className="relative p-6 bg-zinc-55 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                        <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                            {s.step}
                                        </div>
                                        <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                        <p className="text-xs text-zinc-650 leading-relaxed font-medium">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-4 tracking-tight ig-display">
                                AssetNest In-Browser Decryptor vs. Cloud PDF Editors
                            </h3>
                            <p className="text-xs text-zinc-605 text-center mb-8 max-w-lg mx-auto font-medium">
                                Compare our secure browser-based decryption features with standard online PDF unlocking platforms.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b-2 border-black">
                                            <th className="p-4 text-black font-black uppercase tracking-wider">Capability</th>
                                            <th className="p-4 text-black font-black uppercase tracking-wider bg-yellow-50">AssetNest Hybrid Decryptor</th>
                                            <th className="p-4 text-zinc-650 font-bold uppercase tracking-wider">Cloud-Based Unlocking Tools</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {[
                                            { feat: "Security Architecture", ours: "Hybrid local + WASM decryption keeps files secure", other: "Always uploads private docs to remote servers, raising leaks risk" },
                                            { feat: "Permissions Unlocking", ours: "Instant client-side stripping of owner/printing blocks", other: "Requires files to be sent to external web servers" },
                                            { feat: "Quality Retention", ours: "Lossless vector extraction (original streams remain pristine)", other: "Can degrade resolution or strip font mappings during re-compression" },
                                            { feat: "Usage Limits", ours: "Completely free with unlimited file size processing", other: "Imposes strict file size caps or asks for premium upgrades" },
                                            { feat: "Ad Watermarks", ours: "Zero watermarks or stamps added to document footers", other: "Inserts promotional banners or leaves stamp annotations" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-4 text-black font-bold">{row.feat}</td>
                                                <td className="p-4 text-black font-semibold bg-yellow-50/50">{row.ours}</td>
                                                <td className="p-4 text-zinc-650 font-medium">{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                PDF Unlocker FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="Is my document safe when I unlock PDFs on this site?">
                                    Yes. AssetNest prioritizes absolute security. Owner permissions are stripped locally in browser RAM via script calculations. If your document requires backend processing for decryption, the file is held strictly in volatile memory and permanently erased the instant the buffer compiles.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="What is the difference between User passwords and Owner passwords?">
                                    User passwords (open passwords) restrict anyone from opening and reading the file content at all. Owner passwords (permissions passwords) restrict specific features like printing, editing text, or extracting pages, while still letting people view the document.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can I unlock a PDF if I completely forgot the User password?">
                                    No. This is a secure decryption utility, not a cracking tool. You must input the valid user open password to allow the engine to compute the correct decryption key and build the unlocked file structure.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Will unlocking my PDF file affect its digital signatures or certificates?">
                                    Yes. Removing encryption alters the structural signature metadata of the document, which invalidates any attached digital signatures or cryptographic certificates for safety verification.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Are there file size limits or page restrictions for decryption?">
                                    No. You can unlock files of any size or length. Decryption computations are highly efficient and are only capped by your hardware and browser capabilities.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Unlocker Info">
                <div className="space-y-12 text-zinc-800 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Security Abstraction Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-705 font-medium">
                            Step into a professional-grade workspace for document security management. AssetNest <strong>Smart PDF Unlocker</strong> utilizes a hybrid local/server processing engine to strip rigid password protections with absolute data privacy. Our dual-phase system detects the specific encryption type and applies the exact decryption logic required without unnecessary data transmission.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <Zap size={20} className="text-black" />
                                How Encryption is Stripped
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Owner Passwords (Permissions):</strong> If your PDF restricts printing, copying, or editing, it has an Owner Password. Our tool strips this instantly in your local browser cache without server intervention.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>User Passwords (Viewing):</strong> If your PDF asks for a password to open, it has a User Password. You must provide the password. We securely process the decryption using our ultra-fast backend engine.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <ShieldCheck size={20} className="text-black" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-700 leading-relaxed font-bold">
                                <strong>Zero Data Retention.</strong> When a User Password is processed via our secure backend engine, both the encrypted upload and the decrypted output are permanently erased from our server memory within milliseconds of completion.
                            </p>
                            <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-black shadow-[2px_2px_0_#000]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-black">Technical Spec</p>
                                <p className="text-[11px] text-zinc-650 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    In-Memory Decryption • Ephemeral Buffers • Local-First Evaluation • Zero Log Retention
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">Documentation FAQ</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Can this hack a forgotten password?">
                                Absolutely not. This is not a hacking or brute-force tool. We cannot recover lost or forgotten User Passwords. You must know the password to remove the protection.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Why do Owner Passwords not require input?">
                                Owner Passwords simply restrict permissions (like printing) and do not encrypt the actual document streams. Standard PDF libraries can read the streams and save them to a new, unrestricted document.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Will this invalidate Digital Signatures?">
                                Yes. Stripping the encryption layer fundamentally alters the file signature, which will invalidate any cryptographic digital signatures or advanced DRM attached to the document.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}


