"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Download, Copy, Check, FileText, Info, X, Camera, RefreshCw, Scan, ShieldCheck } from "lucide-react";
import { createWorker } from "tesseract.js";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

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
        setTimeout(() => setCopied(null as any), 2000);
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

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 mb-6 rounded-full relative">
                    <Scan size={12} className="text-[#f0ede8]" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">OCR Utility</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="absolute -top-2 -left-2 p-1.5 bg-zinc-900/80 hover:bg-white/[0.06] border border-white/[0.07] rounded-full text-zinc-400 hover:text-[#f0ede8] transition-all shadow-xl z-20"
                        title="What is this?"
                    >
                        <Info size={10} />
                    </button>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#f0ede8] mb-4">
                    Image to <span className="text-[#f0ede8]">Text</span>
                </h1>
                <p className="text-zinc-400 text-sm font-medium max-w-xl mx-auto leading-relaxed">
                    Instantly extract text from screenshots, documents, and photos. Fast, zero-logs, and processed locally for complete privacy.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 rounded-2xl animate-in fade-in">
                    <Info size={16} className="text-red-400 shrink-0" />
                    <span className="text-xs font-medium text-red-100">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-[#f0ede8]"><X size={16} /></button>
                </div>
            )}

            {!image ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`min-h-[350px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                        isDragging ? "border-white bg-white/5 scale-[0.99]" : "border-white/[0.07] bg-[#1c1c1c] hover:bg-[#1e1e1e]/50"
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
                        <div className="w-20 h-20 bg-[#1c1c1c] border border-white/[0.07] rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                            <Camera size={32} className="text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#f0ede8] tracking-tight">Drag & Drop or Click Here</h2>
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <ShieldCheck size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">100% Private</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <Scan size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">No Server Upload</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1c1c1c] border border-white/[0.07]">
                                    <Check size={10} className="text-[#f0ede8]" />
                                    <span className="text-[10px] font-semibold text-zinc-300">Free Forever</span>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-[10px] font-medium mt-3 uppercase tracking-wider">High-Resolution Extraction</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                            {['JPEG', 'PNG', 'WebP'].map(format => (
                                <span key={format} className="px-3 py-1 bg-[#1c1c1c] border border-white/[0.07] text-zinc-400 text-[10px] font-bold rounded-lg">{format}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Left side: Image Preview */}
                    <div className="bg-[#1c1c1c] border border-white/[0.05] p-4 lg:p-6 rounded-[2.5rem] flex flex-col gap-6 h-fit sticky top-24">
                        <div className="relative aspect-auto min-h-[200px] max-h-[500px] w-full bg-[#1c1c1c] rounded-3xl overflow-hidden border border-white/[0.07] shadow-inner group">
                            <img 
                                src={previewUrl!} 
                                alt="Preview" 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="flex items-center justify-between px-2">
                           <div className="space-y-1">
                                <h3 className="text-sm font-bold text-[#f0ede8] truncate max-w-[200px]">{image.name}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{(image.size / 1024 / 1024).toFixed(2)} MB • IMAGE</p>
                           </div>
                           <button onClick={reset} className="p-2.5 bg-[#1c1c1c] text-zinc-400 hover:text-[#f0ede8] rounded-xl border border-white/[0.07] transition-colors">
                                <RefreshCw size={18} />
                           </button>
                        </div>

                                <button
                                    onClick={extractText}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-[#f0ede8] text-[#141414] font-black tracking-wide text-sm rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-zinc-100 shadow-xl shadow-white/10 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <><RefreshCw size={18} className="animate-spin" /> Processing {progress > 0 ? `${progress}%` : ''}</>
                                    ) : (
                                        <>Extract Text <FileText size={18} /></>
                                    )}
                                </button>
                    </div>

                    {/* Right side: Result */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#1c1c1c] border border-white/[0.05] p-6 lg:p-8 rounded-[2.5rem] flex flex-col min-h-[400px] h-full relative overflow-hidden">
                           
                            <div className="relative flex-grow flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-[#f0ede8] tracking-tight flex items-center gap-2">
                                        Extracted <span className="text-[#f0ede8]">Result</span>
                                    </h3>
                                    {extractedText && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={copyToClipboard}
                                                className={`p-2 rounded-lg border transition-all ${
                                                    copied ? "bg-white/20 border-white/40 text-[#f0ede8]" : "bg-[#1c1c1c] border-white/[0.07] text-zinc-400 hover:text-[#f0ede8]"
                                                }`}
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow w-full bg-[#141414]/40 border border-white/[0.05] rounded-3xl p-6 font-mono text-sm leading-relaxed text-zinc-300 overflow-y-auto max-h-[500px] scrollbar-hide">
                                    {isProcessing ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                                            <Scan size={40} className="text-white/20" />
                                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Analyzing characters...</p>
                                        </div>
                                    ) : extractedText ? (
                                        <div className="whitespace-pre-wrap">{extractedText}</div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                                            <FileText size={32} />
                                            <p className="text-[11px] font-medium max-w-[150px]">Click 'Extract Text' to see the magic happen here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {extractedText && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                                        <button
                                            onClick={downloadText}
                                            className="h-12 px-6 bg-[#f0ede8] text-[#141414] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-[#e8e5e0] transition-all active:scale-[0.98] shadow-xl"
                                        >
                                            <Download size={18} /> Download TXT
                                        </button>
                                        <button
                                            onClick={reset}
                                            className="h-12 px-6 bg-[#1c1c1c] border border-white/[0.07] text-zinc-400 hover:text-[#f0ede8] font-bold tracking-wide text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                                        >
                                            <RefreshCw size={14} /> Scan Another
                                        </button>
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Visual Character Infrastructure"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                            Visual Optical Character Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-400 font-medium">
                            Step into a professional-grade workspace for text extraction. AssetNest <strong>Image-to-Text Converter</strong> transcends basic character recognition—it provides a high-performance OCR engine where you can digitize printed or handwritten assets with zero data privacy risk. Whether you are extracting tabular data from a high-res scan, digitizing long-form legal documentation, or scraping text from a protected UI screenshot, our tool gives you the power to transform visual pixels into editable strings with industry-leading character mapping.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <Scan size={20} className="text-zinc-500" />
                                How to Extract Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>Universal Support:</strong> Drop JPG, PNG, and WebP files. Our engine automatically handles noise reduction for cleaner scans.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>Client-Side Engine:</strong> We utilize Tesseract.js to run character recognition entirely in your browser memory.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-[#f0ede8]" /></div>
                                    <span><strong>One-Click Export:</strong> Instantly copy results to your clipboard or download as a raw .txt container for further processing.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <ShieldCheck size={20} className="text-zinc-500" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                                Unlike traditional cloud-based OCR tools that store your sensitive document data on external servers, our extractor operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                                <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Buffer Mapping • Tesseract Engine Virtualization • Lossless Character Preservation • No Watermarks
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] border-t border-white/[0.05] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Documentation FAQ</h3>
                        <Accordion>
                            <AccordionItem title="Portrait vs Landscape?">
                                Our engine handles all orientations. Straightening your photo yields the highest character accuracy.
                            </AccordionItem>
                            <AccordionItem title="Handwriting Support?">
                                Printed text is perfectly mapped. Clear handwriting is supported, though accuracy varies by script style.
                            </AccordionItem>
                            <AccordionItem title="Secure Memory?">
                                Zero data persistence. Your text results reside in RAM and are cleared the moment you refresh the tool.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
