"use client";

import React, { useState, useRef } from "react";
import Container from "@/components/Container";
import { Upload, Lock, Unlock, Download, FileText, ArrowRight, ShieldCheck, FileCheck, X, Loader2, Eye, EyeOff, Info, Zap, Check } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import HelpModal from "@/components/HelpModal";
import { Accordion, AccordionItem } from "@/components/Accordion";

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
        <div className="min-h-screen bg-black py-10 md:py-20">
            <Container>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16 relative group">
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="absolute -top-2 left-0 md:-left-8 p-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30 shadow-lg"
                        title="View Information"
                    >
                        <Info size={16} />
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                        <Unlock size={14} className="text-zinc-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">PDF Tools</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                        PDF Password <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">Remover</span>
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
                        Remove password protection from your PDF files instantly. Processed using a hybrid secure approach that immediately deletes files from memory.
                    </p>
                </div>

                <div className="max-w-xl mx-auto">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                            <ShieldCheck size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded-lg transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Upload */}
                    {!file && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">Drag & Drop or Click Here</h3>
                            <p className="text-zinc-500 text-sm font-medium">100% Private PDF Decryption • Instant Unlock</p>
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
                        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8">
                            <div className="flex items-center gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-zinc-800/50">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 shrink-0">
                                    <FileText size={20} className="text-zinc-400 sm:size-24" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium text-sm sm:text-base truncate">{file.name}</h3>
                                    <p className="text-zinc-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                {!successUrl && (
                                    <button 
                                        onClick={handleReset}
                                        className="text-zinc-500 hover:text-white transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {successUrl && (
                                <div className="text-center py-4 sm:py-6">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto border border-green-500/20">
                                        <Unlock size={28} className="text-green-500 sm:size-32" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Unlocked!</h3>
                                    <p className="text-zinc-400 text-xs sm:text-base mb-6 sm:mb-8">Password protection has been removed.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <a
                                            href={successUrl}
                                            download={unlockedFileName}
                                            className="h-12 px-6 bg-white text-black rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-xl"
                                        >
                                            <Download size={18} />
                                            Download PDF
                                        </a>
                                        <button
                                            onClick={handleReset}
                                            className="h-12 px-6 bg-zinc-900 text-white rounded-full font-bold text-xs sm:text-sm hover:bg-zinc-800 transition-colors border border-zinc-800"
                                        >
                                            <RefreshCw size={14} /> Unlock Another
                                        </button>
                                    </div>
                                </div>
                            )}

                            {requiresUserPassword && !successUrl && (
                                <form onSubmit={handleUnlock}>
                                    <div className="mb-6">
                                        <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                                            Enter PDF Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-zinc-500" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                                                placeholder="Document password"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isProcessing || !password}
                                        className="w-full h-14 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Unlocking...
                                            </>
                                        ) : (
                                            <>
                                                Unlock PDF
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-zinc-500 text-xs text-center mt-4">
                                        Files are processed securely and instantly deleted from memory.
                                    </p>
                                </form>
                            )}

                            {isProcessing && !requiresUserPassword && !successUrl && (
                                <div className="text-center py-12">
                                    <Loader2 size={32} className="text-zinc-400 animate-spin mx-auto mb-4" />
                                    <p className="text-zinc-400 font-medium">Processing document...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Features Section */}
                <div className="max-w-4xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-20">
                    <div>
                        <div className="w-12 h-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="text-zinc-400" size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-2">Secure & Private</h4>
                        <p className="text-zinc-500 text-sm leading-relaxed">Files are processed instantly. If a server is used for decryption, the file is deleted from memory the exact millisecond it finishes.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Unlock className="text-zinc-400" size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-2">Instant Unlock</h4>
                        <p className="text-zinc-500 text-sm leading-relaxed">Remove passwords instantly using hybrid client/server processing.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileCheck className="text-zinc-400" size={24} />
                        </div>
                        <h4 className="text-white font-bold mb-2">Original Quality</h4>
                        <p className="text-zinc-500 text-sm leading-relaxed">Your PDF structure, images, and text remain exactly as they were, just without the lock.</p>
                    </div>
                </div>
            </Container>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Unlocker Info">
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            Security Abstraction Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for document security management. AssetNest <strong>Smart PDF Unlocker</strong> utilizes a hybrid local/server processing engine to strip rigid password protections with absolute data privacy. Our dual-phase system detects the specific encryption type and applies the exact decryption logic required without unnecessary data transmission.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Zap size={20} className="text-zinc-500" />
                                How Encryption is Stripped
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>Owner Passwords (Permissions):</strong> If your PDF restricts printing, copying, or editing, it has an Owner Password. Our tool strips this instantly in your local browser cache without server intervention.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                                    <span><strong>User Passwords (Viewing):</strong> If your PDF asks for a password to open, it has a User Password. You must provide the password. We securely process the decryption using our ultra-fast backend engine.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                <strong>Zero Data Retention.</strong> When a User Password is processed via our secure backend engine, both the encrypted upload and the decrypted output are permanently erased from our server memory within milliseconds of completion.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    In-Memory Decryption • Ephemeral Buffers • Local-First Evaluation • Zero Log Retention
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border-t border-zinc-900 pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Can this hack a forgotten password?">
                                Absolutely not. This is not a hacking or brute-force tool. We cannot recover lost or forgotten User Passwords. You must know the password to remove the protection.
                            </AccordionItem>
                            <AccordionItem title="Why do Owner Passwords not require input?">
                                Owner Passwords simply restrict permissions (like printing) and do not encrypt the actual document streams. Standard PDF libraries can read the streams and save them to a new, unrestricted document.
                            </AccordionItem>
                            <AccordionItem title="Will this invalidate Digital Signatures?">
                                Yes. Stripping the encryption layer fundamentally alters the file signature, which will invalidate any cryptographic digital signatures or advanced DRM attached to the document.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
