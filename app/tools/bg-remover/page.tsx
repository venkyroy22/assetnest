"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Upload, Download, Sparkles, X, RefreshCw,
    Eraser, Info, ArrowLeft, CheckCircle2, Copy, Pipette, Plus, Minus, Maximize2
} from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Background Remover",
    description: "Remove backgrounds from your images instantly and for free. 100% private, browser-based processing.",
    url: "https://www.assetnest.space/tools/bg-remover",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function BgRemoverPage() {
    const router = useRouter();
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressMap = useRef(new Map<string, number>());

    const processImage = async (file: File) => {
        setIsLoading(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);
        progressMap.current.clear();

        try {
            const { removeBackground } = await import("@imgly/background-removal");
            const resultBlob = await removeBackground(file, {
                debug: false,
                progress: (item, current, total) => {
                    if (total === 0) return;
                    progressMap.current.set(item, current / total);
                    
                    let sum = 0;
                    progressMap.current.forEach(val => { sum += val; });
                    
                    // Imgly downloads multiple models and computes inference, typically up to 5 steps.
                    const p = Math.round((sum / Math.max(5, progressMap.current.size)) * 100);
                    
                    // Prevent the progress from decreasing
                    setProgress(prev => Math.max(prev, Math.min(99, p))); // Cap at 99% until fully done
                },
                output: { format: "image/png", quality: 0.95 }
            });
            const url = URL.createObjectURL(resultBlob);
            setOutputUrl(url);
        } catch (err) {
            console.error(err);
            setError("Failed to remove background. Try an image with a clear subject.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            processImage(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            processImage(file);
        }
    };

    const handleDownload = () => {
        if (!outputUrl) return;
        const link = document.createElement("a");
        link.download = `removed-bg_${Date.now()}.png`;
        link.href = outputUrl;
        link.click();
    };



    const reset = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (outputUrl) URL.revokeObjectURL(outputUrl);
        setImage(null);
        setPreviewUrl(null);
        setOutputUrl(null);
        setProgress(0);
        setError(null);
    };

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23111'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23111'/%3E%3C/svg%3E")`;

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-3xl mx-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Sparkles size={11} className="text-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pure Background Removal</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-white mb-4">
                    BG <span className="text-purple-500">Remover</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium max-w-xl mx-auto">
                    Professional AI background removal in one click. 100% free, private, and runs entirely in your browser.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 rounded-2xl animate-in fade-in">
                    <Info size={16} className="text-red-400" />
                    <span className="text-xs font-medium text-red-100">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                {!image ? (
                    <>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`min-h-[300px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 cursor-pointer ${isDragging ? "border-purple-500 bg-purple-500/5" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50 hover:border-zinc-800 shadow-2xl shadow-purple-500/0 hover:shadow-purple-500/5"}`}
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <div className="p-12 text-center space-y-6">
                                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                                    <Upload size={32} className="text-zinc-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Select an image</h2>
                                    <p className="text-zinc-500 text-sm font-medium">Drag & drop or click to browse</p>
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-6 text-center text-xs text-zinc-500 font-medium">
                            For best results, choose images with a high contrast between the subject and background.
                        </p>
                    </>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <div className="relative group rounded-[2rem] overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="absolute top-6 left-6 z-20 flex gap-2">
                                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/90">
                                        {isLoading ? `Removing Background ${progress}%` : "Success"}
                                    </span>
                                </div>
                             </div>

                             {outputUrl && (
                                <div className="absolute top-6 right-6 z-20 flex gap-2">
                                    <button 
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="w-9 h-9 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
                                        title="Full Preview"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                    <button 
                                        onClick={reset}
                                        className="w-9 h-9 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
                                        title="Reset"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                             )}

                            <div className="min-h-[350px] flex items-center justify-center p-8 relative" style={{ backgroundImage: outputUrl ? CHECKER : "none", backgroundColor: "#020202" }}>
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-16 h-16">
                                            <RefreshCw size={64} className="text-purple-500/20 animate-spin absolute inset-0" />
                                            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold">{progress}%</div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject isolation in progress...</p>
                                    </div>
                                ) : (
                                    <img 
                                        src={outputUrl || previewUrl || ""} 
                                        alt="Result" 
                                        className="max-w-full max-h-[400px] object-contain shadow-2xl rounded-xl animate-in zoom-in-95 duration-500" 
                                    />
                                )}
                            </div>
                        </div>

                        {outputUrl && !isLoading && (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-6">
                                <button 
                                    onClick={handleDownload}
                                    className="group relative h-16 w-full md:w-auto px-8 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-2xl flex items-center justify-center gap-3 overflow-hidden whitespace-nowrap"
                                >
                                    <Download size={18} /> Download Transparent PNG
                                </button>
                                
                                <div className="max-w-xs text-left bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4">
                                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                        <strong className="text-zinc-300">Note:</strong> AI runs in-browser. For best results, use sharp images with high contrast. Intricate borders may occasionally require cleanup.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Features */}
            {!image && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-900 pt-12">
                    {[
                        { title: "Privacy First", desc: "No images ever leave your device. All processing happens in your browser." },
                        { title: "High Quality", desc: "Export high-resolution PNGs with perfect transparency around hair and edges." }
                    ].map((f, i) => (
                        <div key={i} className="space-y-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{f.title}</h4>
                             <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
            {/* Fullscreen Preview Modal */}
            {isPreviewOpen && outputUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
                    <button 
                        onClick={() => setIsPreviewOpen(false)}
                        className="absolute top-6 right-6 z-[60] w-12 h-12 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full flex items-center justify-center border border-white/10 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div 
                        className="w-full h-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden relative border border-zinc-800 flex items-center justify-center shadow-2xl"
                        style={{ backgroundImage: CHECKER, backgroundColor: "#020202" }}
                    >
                        <img 
                            src={outputUrl} 
                            alt="Full Preview" 
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const RotateCcw = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
);
