"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Download, Copy, Check, FileText, Info, X, Camera, RefreshCw, Scan } from "lucide-react";
import { createWorker } from "tesseract.js";

export default function ImageToTextPage() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
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
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6 rounded-full">
                    <Scan size={12} className="text-amber-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">OCR Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    Image to <span className="text-amber-500">Text</span>
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
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>
            )}

            {!image ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`min-h-[350px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                        isDragging ? "border-amber-500 bg-amber-500/5 scale-[0.99]" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"
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
                        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                            <Camera size={32} className="text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Select an Image</h2>
                            <p className="text-zinc-500 text-sm font-medium mt-1">Drag high-resolution images for better accuracy</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                            {['JPEG', 'PNG', 'WebP'].map(format => (
                                <span key={format} className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg">{format}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Left side: Image Preview */}
                    <div className="bg-zinc-950 border border-zinc-900 p-4 lg:p-6 rounded-[2.5rem] flex flex-col gap-6 h-fit sticky top-24">
                        <div className="relative aspect-auto min-h-[200px] max-h-[500px] w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-inner group">
                            <img 
                                src={previewUrl!} 
                                alt="Preview" 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="flex items-center justify-between px-2">
                           <div className="space-y-1">
                                <h3 className="text-sm font-bold text-white truncate max-w-[200px]">{image.name}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{(image.size / 1024 / 1024).toFixed(2)} MB • IMAGE</p>
                           </div>
                           <button onClick={reset} className="p-2.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors">
                                <RefreshCw size={18} />
                           </button>
                        </div>

                        {!extractedText && (
                            <button
                                onClick={extractText}
                                disabled={isProcessing}
                                className="w-full h-14 bg-amber-500 text-black font-black tracking-wide text-sm rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-amber-400 shadow-xl shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <><RefreshCw size={18} className="animate-spin" /> Processing {progress > 0 ? `${progress}%` : ''}</>
                                ) : (
                                    <>Extract Text <FileText size={18} /></>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Right side: Result */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-zinc-950 border border-zinc-900 p-6 lg:p-8 rounded-[2.5rem] flex flex-col min-h-[400px] h-full relative overflow-hidden">
                           
                            <div className="relative flex-grow flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                        Extracted <span className="text-amber-500">Result</span>
                                    </h3>
                                    {extractedText && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={copyToClipboard}
                                                className={`p-2 rounded-lg border transition-all ${
                                                    copied ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                                }`}
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow w-full bg-black/40 border border-zinc-900 rounded-3xl p-6 font-mono text-sm leading-relaxed text-zinc-300 overflow-y-auto max-h-[500px] scrollbar-hide">
                                    {isProcessing ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                                            <Scan size={40} className="text-amber-500/20" />
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
                                <div className="mt-8 animate-in fade-in duration-700">
                                    <button
                                        onClick={downloadText}
                                        className="w-full h-14 px-8 bg-zinc-100 text-black font-black tracking-wide text-xs rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white shadow-xl active:scale-[0.98]"
                                    >
                                        <Download size={18} /> Download TXT File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!image && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
                    {[
                        { title: "Browser OCR", desc: "Our engine runs directly in your browser. No data ever hits our servers." },
                        { title: ".TXT Export", desc: "Easily export your text results to a standard text file for your projects." },
                        { title: "Fast Analysis", desc: "Processes dense documents and complex fonts with high-precision Tesseract technology." }
                    ].map((f, i) => (
                        <div key={i} className="text-center space-y-2">
                            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">{f.title}</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-[220px] mx-auto">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
