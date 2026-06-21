"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    Upload, Download, Copy, Check, FileText, Info, X, Camera, 
    RefreshCw, Scan, ShieldCheck, ArrowLeft, Package, Globe, 
    Layers, Eye, Zap, Eraser, Sparkles, Lock as LockIcon,
    Image as ImageIcon, ChevronDown
} from "lucide-react";
import { createWorker } from "tesseract.js";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

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

export default function ImageToTextPage() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload a valid image file.");
            return;
        }
        setError(null);
        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setExtractedText("");
        setProgress(0);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const extractText = async () => {
        if (!image) return;
        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });
            
            const { data: { text } } = await worker.recognize(image);
            await worker.terminate();

            if (!text || text.trim().length === 0) {
                setError("No text could be found in this image. Try an image with clearer text.");
            } else {
                setExtractedText(text);
            }
        } catch (err) {
            console.error("OCR Error:", err);
            setError("Failed to process image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadText = () => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Extracted_Text_${Date.now()}.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const reset = () => {
        setImage(null);
        setPreviewUrl(null);
        setExtractedText("");
        setError(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23e4e4e7'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e4e4e7'/%3E%3C/svg%3E")`;

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-55"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 border-2 border-black flex items-center justify-center text-white text-xs font-black shadow-[2.5px_2.5px_0_#000]">
                        <FileText size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Image to Text
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <Info size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl animate-in fade-in">
                        <Info size={16} className="text-red-650 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!image ? (
                    /* Initial Upload Drop Zone */
                    <div className="space-y-12">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`min-h-[400px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                                isDragging ? "bg-blue-50" : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"
                            }`}
                        >
                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
                            />
                            <div className="text-center px-8 space-y-6">
                                <div className="w-20 h-20 bg-white border-2 border-black rounded-3xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000]">
                                    <Camera size={32} className="text-black animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-black tracking-tight ig-display">Drag & Drop or Click Here</h2>
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <ShieldCheck size={10} className="text-blue-600" />
                                            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-750">100% Private</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <Scan size={10} className="text-indigo-650" />
                                            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-750">Local OCR</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <Check size={10} className="text-green-650" />
                                            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-750">No Server Upload</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-550 text-[10px] font-bold mt-5 uppercase tracking-wider">High-Resolution Character Extraction</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 pt-4">
                                    {['JPEG', 'PNG', 'WebP'].map(format => (
                                        <span key={format} className="px-3.5 py-1 bg-white border-2 border-black text-zinc-700 text-[10px] font-bold rounded-lg shadow-[1px_1px_0_#000]">{format}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SEO RICH TEXT SECTION */}
                        <div className="p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000] text-zinc-700">
                            <div className="relative z-10 space-y-12">
                                <div className="flex flex-wrap justify-center gap-2.5">
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fbcfe8] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <ShieldCheck size={11} className="text-black" /> 100% In-Browser Privacy
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <Sparkles size={11} className="text-black" /> Free & Unlimited
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fde047] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <Package size={11} className="text-black" /> No Server Uploads
                                    </span>
                                </div>

                                <div className="text-center space-y-4 max-w-3xl mx-auto">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight ig-display">
                                        Free Image to Text Converter Online with Private OCR
                                    </h2>
                                    <p className="text-sm text-zinc-650 leading-relaxed">
                                        Extract text from screenshots, documents, invoices, and photos instantly using our online OCR tool. Powered by client-side recognition models, our free image to text utility processes your characters entirely in your browser cache for absolute safety.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                                    {[
                                        {
                                            title: "High-Accuracy OCR Engine",
                                            desc: "Powered by optimized neural networks that scan pixels and accurately map alphabets, digits, symbols, and formatting structures in seconds.",
                                            icon: <Scan size={16} />
                                        },
                                        {
                                            title: "100% Browser Processing",
                                            desc: "Your files never leave your device. Our image to text converter runs OCR calculations entirely inside your local RAM sandbox using WebAssembly.",
                                            icon: <ShieldCheck size={16} />
                                        },
                                        {
                                            title: "Universal Image Formats",
                                            desc: "Supports importing standard photo formats including JPG, JPEG, PNG, WebP, and BMP. Works perfectly with copy-pasted screenshots.",
                                            icon: <ImageIcon size={16} />
                                        },
                                        {
                                            title: "One-Click Clipboard Copy",
                                            desc: "Quickly copy the complete extracted character blocks to your device clipboard with a single click. Ideal for fast workflows.",
                                            icon: <Copy size={16} />
                                        },
                                        {
                                            title: "Lossless TXT Downloads",
                                            desc: "Save your scanned result directly as a raw text container (.txt file) on your hard drive, ready for text editing, archiving, or translations.",
                                            icon: <Download size={16} />
                                        },
                                        {
                                            title: "Free & Unlimited Transcription",
                                            desc: "Transcribe as many scanned images, legal notes, or receipts as you want without daily caps, paywalls, or watermark constraints.",
                                            icon: <LockIcon size={16} />
                                        }
                                    ].map((f, i) => (
                                        <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-3xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
                                            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                                {f.icon}
                                            </div>
                                            <h4 className="text-sm font-bold text-black mb-2 ig-display">{f.title}</h4>
                                            <p className="text-xs text-zinc-650 leading-relaxed">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-2 border-black pt-10">
                                    <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                        How to Extract Text from Image Online
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { step: "1", title: "Select or Drop Image", desc: "Drag and drop your screenshot or document photo into the upload drop box, or click browse to choose a file." },
                                            { step: "2", title: "Run Character Scanning", desc: "Click the 'Extract Text' action. Tesseract OCR runs client-side calculations and reports real-time progress." },
                                            { step: "3", title: "Copy or Download Text", desc: "Inspect the final transcribed text layout, then copy the result to your clipboard or download it as a raw .txt file." }
                                        ].map((s) => (
                                            <div key={s.step} className="relative p-6 bg-zinc-55 border-2 border-black rounded-2xl pt-8 shadow-[3px_3px_0_#000]">
                                                <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#000]">
                                                    {s.step}
                                                </div>
                                                <h4 className="text-sm font-bold text-black mb-2 ig-display">{s.title}</h4>
                                                <p className="text-xs text-zinc-650 leading-relaxed">{s.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t-2 border-black pt-10">
                                    <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                        Frequently Asked Questions
                                    </h3>
                                    <LocalAccordion>
                                        <LocalAccordionItem title="How does the online image to text converter protect my data privacy?">
                                            Our tool runs Tesseract.js client-side inside your browser sandbox. Since no images or document files are uploaded to remote servers, your sensitive notes, invoices, and files remain 100% private.
                                        </LocalAccordionItem>
                                        <LocalAccordionItem title="Do I need to register or pay to use this OCR tool?">
                                            No. AssetNest provides this tool as a free image to text service. You can extract text from screenshots or photos completely free with no restrictions, registrations, or watermark stamps.
                                        </LocalAccordionItem>
                                        <LocalAccordionItem title="What type of photos work best for text extraction?">
                                            High-contrast, well-lit images with clear printed text yield the best results. Straightening cropped images and reducing visual noise help the OCR engine map character strings accurately.
                                        </LocalAccordionItem>
                                    </LocalAccordion>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Active Workspace Grid */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom duration-500">
                        {/* Left side: Image Preview */}
                        <div className="bg-white border-2 border-black p-4 lg:p-6 rounded-[2.5rem] flex flex-col gap-6 h-fit sticky top-24 shadow-[5px_5px_0_#000]">
                            <div className="relative aspect-auto min-h-[200px] max-h-[500px] w-full bg-zinc-50 rounded-3xl overflow-hidden border-2 border-black shadow-inner" style={{ backgroundImage: CHECKER }}>
                                <img 
                                    src={previewUrl!} 
                                    alt="OCR Source" 
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div className="flex items-center justify-between px-2">
                               <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-black truncate max-w-[200px] ig-display">{image.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{(image.size / 1024 / 1024).toFixed(2)} MB • IMAGE</p>
                               </div>
                               <button onClick={reset} className="p-2.5 bg-white text-black hover:bg-zinc-50 rounded-xl border-2 border-black shadow-[2px_2px_0_#000] transition-all ig-btn" title="Scan different image">
                                    <RefreshCw size={16} />
                               </button>
                            </div>

                            <button
                                onClick={extractText}
                                disabled={isProcessing}
                                className="w-full h-12 bg-[#fde047] border-2 border-black text-black font-black tracking-widest text-xs sm:text-sm rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-yellow-300 shadow-[3px_3px_0_#000] active:scale-[0.98] disabled:opacity-50 ig-btn"
                            >
                                {isProcessing ? (
                                    <><RefreshCw size={16} className="animate-spin" /> Processing {progress > 0 ? `${progress}%` : ''}</>
                                ) : (
                                    <>Extract Text <FileText size={16} /></>
                                )}
                            </button>
                        </div>

                        {/* Right side: Extracted Result */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white border-2 border-black p-6 lg:p-8 rounded-[2.5rem] flex flex-col min-h-[400px] h-full relative overflow-hidden shadow-[5px_5px_0_#000]">
                               
                                <div className="relative flex-grow flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-base font-black text-black tracking-tight flex items-center gap-2 ig-display">
                                            Extracted Result
                                        </h3>
                                        {extractedText && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={copyToClipboard}
                                                    className={`p-2.5 rounded-xl border-2 transition-all ig-btn ${
                                                        copied ? "bg-[#a7f3d0] border-black text-black shadow-[1.5px_1.5px_0_#000]" : "bg-white border-black text-black shadow-[2px_2px_0_#000]"
                                                    }`}
                                                    title="Copy to clipboard"
                                                >
                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow w-full bg-zinc-50 border-2 border-black rounded-3xl p-6 font-mono text-xs sm:text-sm leading-relaxed text-black overflow-y-auto max-h-[500px] scrollbar-thin">
                                        {isProcessing ? (
                                            <div className="h-full min-h-[240px] flex flex-col items-center justify-center space-y-4 animate-pulse">
                                                <Scan size={36} className="text-black animate-spin" />
                                                <p className="text-zinc-650 text-[10px] font-black uppercase tracking-[0.25em]">Analyzing characters...</p>
                                            </div>
                                        ) : extractedText ? (
                                            <div className="whitespace-pre-wrap">{extractedText}</div>
                                        ) : (
                                            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                                                <FileText size={28} />
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 max-w-[180px] leading-relaxed">Click 'Extract Text' to trigger OCR engine.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {extractedText && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 shrink-0">
                                        <button
                                            onClick={downloadText}
                                            className="h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-[3px_3px_0_#000] ig-btn"
                                        >
                                            <Download size={18} /> Download TXT
                                        </button>
                                        <button
                                            onClick={reset}
                                            className="h-12 px-6 bg-white border-2 border-black text-black font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-[3px_3px_0_#000] ig-btn"
                                        >
                                            <RefreshCw size={14} /> Scan Another
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Visual Character Infrastructure"
            >
                <div className="space-y-12 text-zinc-700 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Optical Character Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for text extraction. AssetNest <strong>Image-to-Text Converter</strong> transcends basic character recognition—it provides a high-performance OCR engine where you can digitize printed or handwritten assets with zero data privacy risk. Whether you are extracting tabular data from a high-res scan, digitizing long-form legal documentation, or scraping text from a protected UI screenshot, our tool gives you the power to transform visual pixels into editable strings with industry-leading character mapping.
                        </p>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
