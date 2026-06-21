"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Upload, Download, Sparkles, X, RefreshCw,
    Eraser, Info, ArrowLeft, CheckCircle2, Copy, Pipette, Plus, Minus, Maximize2, Check, ShieldCheck, ChevronDown
} from "lucide-react";
import HelpModal from "@/components/HelpModal";

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

export default function BgRemoverPage() {
    const router = useRouter();
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressMap = useRef(new Map<string, number>());

    const processImage = async (file: File) => {
        setIsLoading(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);
        progressMap.current.clear();

        let progressInterval: any = null;

        try {
            setProgress(5);

            progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 70) {
                        return prev + 1;
                    }
                    if (prev >= 70 && prev < 98) {
                        return prev + 1;
                    }
                    return prev;
                });
            }, 250);

            const { removeBackground } = await import("@imgly/background-removal");
            const resultBlob = await removeBackground(file, {
                debug: false,
                model: "isnet_quint8",
                proxyToWorker: true,
                progress: (item, current, total) => {
                    if (total === 0) return;
                    progressMap.current.set(item, current / total);
                    
                    const size = progressMap.current.size;
                    if (size === 0) return;

                    let sum = 0;
                    progressMap.current.forEach(val => { sum += val; });
                    
                    const downloadProgress = sum / size;
                    const p = Math.round(downloadProgress * 70);
                    
                    setProgress(prev => Math.max(prev, Math.min(70, p)));
                },
                output: { format: "image/png", quality: 0.95 }
            });
            const url = URL.createObjectURL(resultBlob);
            setOutputUrl(url);
            setProgress(100);
        } catch (err) {
            console.error(err);
            setError("Failed to remove background. Try an image with a clear subject.");
        } finally {
            if (progressInterval) {
                clearInterval(progressInterval);
            }
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

    const CHECKER = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23e4e4e7'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e4e4e7'/%3E%3C/svg%3E")`;

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-55"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-pink-400 border-2 border-black flex items-center justify-center text-black font-black shadow-[2.5px_2.5px_0_#000]">
                        <Eraser size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        AI Background Remover
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

            <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
                {error && (
                    <div className="mb-6 p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl animate-in fade-in">
                        <Info size={16} className="text-red-650" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!image ? (
                    <div className="space-y-12">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`min-h-[300px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? "bg-pink-50" : "bg-white hover:bg-zinc-50 shadow-[5px_5px_0_#000]"}`}
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <div className="p-12 text-center space-y-6">
                                <div className="w-20 h-20 bg-white border-2 border-black rounded-3xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000]">
                                    <Upload size={32} className="text-black" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-black tracking-tight ig-display mb-2">Drag & Drop or Click Here</h2>
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <ShieldCheck size={10} className="text-emerald-600" />
                                            <span className="text-[10px] font-semibold text-zinc-700">100% Private</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <Sparkles size={10} className="text-purple-600" />
                                            <span className="text-[10px] font-semibold text-zinc-700">No Server Upload</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                                            <Check size={10} className="text-blue-650" />
                                            <span className="text-[10px] font-semibold text-zinc-700">Free Forever</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-550 text-[10px] font-bold mt-3 uppercase tracking-wider">AI Subject Isolation</p>
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-6 text-center text-xs text-zinc-650 font-bold uppercase tracking-wider">
                            For best results, choose images with a high contrast between the subject and background.
                        </p>

                        {/* SEO RICH TEXT SECTION */}
                        <div className="p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000] text-zinc-700">
                            <div className="relative z-10 space-y-12">
                                <div className="flex flex-wrap justify-center gap-2.5">
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fbcfe8] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <ShieldCheck size={11} className="text-black" /> 100% Private & Local
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#a7f3d0] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <Sparkles size={11} className="text-black" /> AI Subject Isolation
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#fde047] text-[10px] font-bold text-black uppercase tracking-widest shadow-[1.5px_1.5px_0_#000]">
                                        <Check size={11} className="text-black" /> Free PNG Cutouts
                                    </span>
                                </div>

                                <div className="text-center space-y-4 max-w-3xl mx-auto">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight ig-display">
                                        The Best Free Background Remover Online with Local AI
                                    </h2>
                                    <p className="text-sm text-zinc-650 leading-relaxed">
                                        Instantly remove backgrounds from photos and graphics with our free background remover. Powered by advanced client-side AI, our image background remover lets you isolate subjects and export transparent PNGs entirely on your device with 100% privacy.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                                    {[
                                        {
                                            title: "Advanced AI Subject Isolation",
                                            desc: "Our state-of-the-art background remover intelligently detects the main subject, delivering high-precision cutouts for portraits, products, and graphics.",
                                            icon: <Sparkles size={16} />
                                        },
                                        {
                                            title: "100% Free Tool",
                                            desc: "No subscriptions, no tokens, and no hidden fees. Use our background remover free as much as you need, with no output watermarks.",
                                            icon: <Check size={16} />
                                        },
                                        {
                                            title: "Private Browser Processing",
                                            desc: "We care about privacy. Your source files are processed locally in your browser cache and are never uploaded to any remote servers.",
                                            icon: <ShieldCheck size={16} />
                                        },
                                        {
                                            title: "High-Res Transparent PNGs",
                                            desc: "Export your clean cutouts in lossless PNG format with transparency preserved, ready for web design, slides, or social media posts.",
                                            icon: <Download size={16} />
                                        },
                                        {
                                            title: "Intricate Edge Detection",
                                            desc: "Our AI model is trained to handle complex visual structures such as fine hair, animal fur, clothing folds, and semi-transparent objects.",
                                            icon: <Eraser size={16} />
                                        },
                                        {
                                            title: "Zero Clicks Required",
                                            desc: "Simply drag and drop your image, and let the AI background remover online do the rest in seconds. No manual mask painting needed.",
                                            icon: <Upload size={16} />
                                        }
                                    ].map((f, i) => (
                                        <div key={i} className="p-6 bg-zinc-55 border-2 border-black rounded-2xl transition-all duration-300 shadow-[3px_3px_0_#000] hover:bg-zinc-100">
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
                                        How to Remove Image Backgrounds in Seconds
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { step: "1", title: "Upload Your Photo", desc: "Drag and drop your JPG, PNG, or WebP photo into the workspace, or click to browse files on your device." },
                                            { step: "2", title: "AI Automatic Processing", desc: "Our client-side neural network processes the image locally in your browser to detect edges and isolate the main subject." },
                                            { step: "3", title: "Download transparent PNG", desc: "Once complete, preview the result on a checkerboard background and download the lossless PNG cutout instantly." }
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
                                        <LocalAccordionItem title="Is this background remover free for commercial use?">
                                            Yes, it is a completely free background remover. You can use it to create product listings, marketing images, presentations, or design templates without any cost, attribution, or licenses.
                                        </LocalAccordionItem>
                                        <LocalAccordionItem title="How does this background remover online protect my privacy?">
                                            Unlike other tools that upload your files to external cloud servers, our image background remover utilizes WebAssembly to run the AI model directly in your browser. Your photos never leave your device.
                                        </LocalAccordionItem>
                                        <LocalAccordionItem title="Why does it take a few seconds to load the first time?">
                                            On your first visit, the app loads the client-side AI model files into your browser memory. Subsequent image cleanups are much faster as the models are cached locally.
                                        </LocalAccordionItem>
                                    </LocalAccordion>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <div className="relative group rounded-[2rem] overflow-hidden border-2 border-black bg-white shadow-[6px_6px_0_#000]">
                             <div className="absolute top-6 left-6 z-20 flex gap-2">
                                <div className="px-3 py-1.5 bg-white border-2 border-black rounded-full flex items-center gap-2 shadow-[2px_2px_0_#000]">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-black animate-pulse' : 'bg-black'}`} />
                                    <span className="text-[10px] font-bold tracking-wide text-black uppercase ig-label">
                                        {isLoading ? `Removing Background ${progress}%` : "Success"}
                                    </span>
                                </div>
                             </div>

                             {outputUrl && (
                                 <div className="absolute top-6 right-6 z-20 flex gap-2">
                                     <button 
                                         onClick={reset}
                                         className="w-9 h-9 bg-white border-2 border-black rounded-full flex items-center justify-center text-black hover:bg-zinc-50 transition-all shadow-[2px_2px_0_#000] ig-btn"
                                         title="Reset"
                                     >
                                         <RefreshCw size={16} />
                                     </button>
                                 </div>
                             )}

                            <div className="min-h-[350px] flex items-center justify-center p-8 relative" style={{ backgroundImage: outputUrl ? CHECKER : "none", backgroundColor: "#fff" }}>
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_#000]">
                                            <RefreshCw size={24} className="text-black animate-spin" />
                                        </div>
                                        {progress < 10 ? (
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 animate-pulse ig-label">Initializing AI Models...</p>
                                        ) : (
                                            <p className="text-[11px] font-semibold tracking-wider text-zinc-700 ig-label">Subject isolation in progress...</p>
                                        )}
                                    </div>
                                ) : (
                                    <img 
                                        src={outputUrl || previewUrl || ""} 
                                        alt="Result" 
                                        className="max-w-full max-h-[400px] object-contain border-2 border-black shadow-[3px_3px_0_#000] rounded-xl animate-in zoom-in-95 duration-500" 
                                    />
                                )}
                            </div>
                        </div>

                        {outputUrl && !isLoading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                                <button 
                                    onClick={handleDownload}
                                    className="h-12 px-6 bg-[#fde047] border-2 border-black text-black text-xs sm:text-sm font-bold tracking-wide hover:bg-yellow-350 transition-all rounded-full flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] active:scale-[0.98] ig-btn"
                                >
                                    <Download size={18} /> Download PNG
                                </button>
                                <button 
                                    onClick={reset}
                                    className="h-12 px-6 bg-white border-2 border-black text-black hover:bg-zinc-50 text-xs sm:text-sm font-bold tracking-wide transition-all rounded-full flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] active:scale-[0.98] ig-btn"
                                >
                                    <RefreshCw size={14} /> Remove Another
                                </button>
                                
                                <div className="sm:col-span-2 text-center bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0_#000]">
                                    <p className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider leading-relaxed">
                                        Note: AI runs in-browser. For best results, use sharp images with high contrast. Intricate borders may occasionally require manual cleanup.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="AI Background Removal"
            >
                <div className="space-y-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[4px_4px_0_#000] space-y-6 text-zinc-700">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Subject Isolation Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for background removal. AssetNest <strong>AI Background Remover</strong> transcends basic image masking—it provides a high-performance engine where you can isolate subjects from their backgrounds with pixel-perfect precision and absolute data privacy. Whether you are generating clean e-commerce assets, professional headshots, or creative marketing collateral, our tool gives you the power to create transparent PNGs with industry-leading edge detection and zero server dependency.
                        </p>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
