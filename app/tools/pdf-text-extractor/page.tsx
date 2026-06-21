"use client";

import "@/lib/pdfjs-polyfill";
import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, FileText, Info, X, FileEdit, Check, ShieldCheck, Sparkles, Package, Lock as LockIcon, Zap, ChevronDown, ArrowLeft } from "lucide-react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import HelpModal from "@/components/HelpModal";
import dynamic from "next/dynamic";
import Link from "next/link";
const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });

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

export default function PdfTextExtractorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (f: File) => {
        if (f.type !== "application/pdf") {
            setError("Please upload a valid PDF file.");
            return;
        }
        setError(null);
        setFile(f);
        setOutputUrl(null);
        setOutputBlob(null);
        setProgress(0);
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
            // Dynamically load pdfjs specifically when requested
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            const numPages = pdf.numPages;
            const paragraphs: Paragraph[] = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                const items = textContent.items as any[];
                const styles = textContent.styles as any;

                // Sort items vertically (top to bottom), then horizontally (left to right)
                // In PDF coordinates, origin (0,0) is bottom-left. y increases upwards.
                items.sort((a, b) => {
                    const yA = a.transform[5];
                    const yB = b.transform[5];
                    if (Math.abs(yA - yB) > 5) {
                        return yB - yA; // Sort top-to-bottom
                    }
                    return a.transform[4] - b.transform[4]; // Sort left-to-right
                });

                let currentParagraphRuns: TextRun[] = [];
                let lastY = -1;
                let lastX = -1;
                let currentIndent = 0;

                for (const item of items) {
                    const str = item.str;
                    if (!str.trim() && str.length > 0 && currentParagraphRuns.length > 0) {
                        // It's just a space block, insert space
                        currentParagraphRuns.push(new TextRun({ text: " " }));
                        continue;
                    }
                    if (!str) continue;

                    const style = styles[item.fontName];
                    const x = item.transform[4];
                    const y = item.transform[5];
                    // transform[3] is roughly font size 
                    const fontSize = Math.abs(item.transform[3]);

                    const fontNameLower = (item.fontName || "").toLowerCase();
                    const fontFamilyLower = (style && style.fontFamily ? style.fontFamily : "").toLowerCase();

                    const isBold = fontNameLower.includes("bold") || fontFamilyLower.includes("bold");
                    const isItalic = fontNameLower.includes("italic") || fontNameLower.includes("oblique") || fontFamilyLower.includes("italic");

                    // Determine if we need a new paragraph based on vertical Y drop
                    const yDiff = lastY !== -1 ? lastY - y : 0;
                    
                    if (yDiff > (fontSize || 12) * 1.5 && currentParagraphRuns.length > 0) {
                        paragraphs.push(new Paragraph({
                            children: currentParagraphRuns,
                            indent: { left: currentIndent > 50 ? currentIndent * 15 : 0 },
                            spacing: { after: 120 }
                        }));
                        currentParagraphRuns = [];
                        lastX = -1;
                    }

                    if (currentParagraphRuns.length === 0) {
                        currentIndent = x;
                    }

                    // Add horizontal spacing if there's a horizontal gap on the same line
                    if (lastX !== -1 && (x - lastX) > (fontSize || 12) * 0.4) {
                        currentParagraphRuns.push(new TextRun({ text: " " }));
                    }

                    currentParagraphRuns.push(new TextRun({
                        text: str,
                        bold: isBold,
                        italics: isItalic,
                        size: fontSize ? Math.max(16, Math.round(fontSize * 2)) : 24, // docx uses half-points
                        font: style && style.fontFamily ? style.fontFamily : "Helvetica"
                    }));

                    lastY = y;
                    lastX = x + item.width;
                }

                if (currentParagraphRuns.length > 0) {
                    paragraphs.push(new Paragraph({
                        children: currentParagraphRuns,
                        indent: { left: currentIndent > 50 ? currentIndent * 15 : 0 },
                        spacing: { after: 120 }
                    }));
                }

                // Add document page break representation
                if (i !== numPages) {
                     paragraphs.push(new Paragraph({ 
                         pageBreakBefore: true,
                         children: [new TextRun("")]
                     }));
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
            
            setProgress(100);
            setOutputUrl(url);
            setOutputBlob(blob);

        } catch (e) {
            console.error("Conversion error:", e);
            setError("Failed to convert PDF. It may be heavily image-based, corrupted, or encrypted.");
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

    const reset = () => {
        setFile(null);
        setError(null);
        setOutputUrl(null);
        setOutputBlob(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        <FileText size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        PDF Text Extractor
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
                    <div className="p-4 border-2 border-black bg-red-50 flex items-center gap-3 rounded-2xl animate-in fade-in">
                        <Info size={16} className="text-red-700 shrink-0" />
                        <span className="text-xs font-bold text-black">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-zinc-550 hover:text-black"><X size={16} /></button>
                    </div>
                )}

                {!file ? (
                    /* Upload Zone */
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative min-h-[260px] border-2 sm:border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group/dropzone ${
                            isDragging 
                                ? "bg-red-50" 
                                : "bg-white hover:bg-zinc-55 shadow-[5px_5px_0_#000]"
                        }`}
                    >
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
                        />
                        
                        <div className="text-center px-8 py-6 space-y-6 relative z-10">
                            <div className="w-14 h-14 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0_#000] transition-all duration-300 group-hover/dropzone:scale-105">
                                <Upload size={24} className="text-black" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-black tracking-tight ig-display">Drag & Drop PDF or Click to Browse</h2>
                                <p className="text-xs text-zinc-650 mt-1 font-medium leading-relaxed max-w-sm mx-auto">
                                    100% Private PDF Text Extraction • Secure Local Parsing in browser memory.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500 relative z-10">
                        {/* Active File Card */}
                        <div className="bg-white border-2 border-black rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-[5px_5px_0_#000] relative overflow-hidden group">
                            
                            {/* Thumbnail View */}
                            <div className="relative z-10 w-32 h-44 sm:w-40 sm:h-52 shrink-0 bg-zinc-50 border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0_#000] flex items-center justify-center">
                                 <PdfPageThumbnail file={file} pageIndex={0} />
                                 <div className="absolute bottom-2 right-2 bg-black text-[8px] font-black text-white px-1.5 py-0.5 rounded border border-black uppercase tracking-widest">
                                     Preview
                                 </div>
                            </div>

                            {/* File details & Conversion panel */}
                            <div className="relative z-10 flex-grow w-full flex flex-col items-center md:items-start justify-center text-center md:text-left">
                                <div className="flex items-center gap-2 mb-1 w-full justify-center md:justify-start">
                                    <FileText size={16} className="text-red-500 shrink-0" />
                                    <h3 className="text-lg sm:text-xl font-bold text-black truncate max-w-[200px] sm:max-w-none ig-display">{file.name}</h3>
                                </div>
                                <p className="text-[10px] sm:text-xs text-zinc-600 font-bold tracking-wider mb-5 sm:mb-6">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>

                                {!outputUrl ? (
                                    <div className="w-full space-y-4">
                                        {/* Progress Area */}
                                        {isConverting ? (
                                            <div className="w-full space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black text-black uppercase ig-label">Extracting...</span>
                                                    <span className="text-[10px] font-black text-black">{progress}%</span>
                                                </div>
                                                <div className="h-4 w-full bg-white border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0_#000]">
                                                    <div 
                                                        className="h-full bg-red-400 border-r-2 border-black transition-all duration-300 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-zinc-550 font-bold pt-1 px-1">
                                                    Generating structured paragraphs...
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={convertToWord}
                                                className="ig-btn w-full sm:w-auto h-12 px-8 bg-[#fde047] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] transition-all active:scale-[0.98]"
                                            >
                                                <span>Extract Text</span> <FileText size={16} />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full space-y-4 animate-in fade-in duration-700">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border-2 border-black text-black rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#000]">
                                            <Check size={12} className="text-emerald-600" /> Extraction Complete
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                            <button
                                                onClick={downloadWord}
                                                className="ig-btn h-12 px-8 bg-[#a7f3d0] border-2 border-black text-black font-black tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] active:scale-[0.98] w-full sm:w-auto transition-all"
                                            >
                                                <Download size={16} /> 
                                                <span>Download DOCX</span>
                                            </button>
                                            <button 
                                                onClick={reset}
                                                className="ig-btn h-12 px-6 bg-white border-2 border-black text-zinc-650 hover:text-black font-bold tracking-wider text-xs uppercase rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-full sm:w-auto shadow-[3px_3px_0_#000]"
                                            >
                                                <RefreshCw size={14} /> <span>Start Fresh</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reset Button */}
                            <button 
                                onClick={reset} 
                                disabled={isConverting}
                                className="absolute top-4 right-4 p-2 text-zinc-555 hover:text-red-500 hover:bg-zinc-100 rounded-full transition-colors disabled:opacity-0 z-20 border-2 border-transparent hover:border-black"
                                title="Start Over"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── SEO RICH TEXT SECTION ─── */}
                <div className="p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden shadow-[5px_5px_0_#000] text-zinc-700">
                    <div className="relative z-10 space-y-12">
                        {/* Top Badges */}
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

                        {/* Main Title & Description */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight text-center ig-display">
                                Free PDF Text Extractor — Export PDF to Word
                            </h2>
                            <p className="text-sm text-zinc-600 leading-relaxed text-center font-medium">
                                Extract text layers and paragraph blocks from PDF documents into editable Word files (DOCX) instantly. Our offline-first engine processes characters directly in your device's browser memory, ensuring that legal forms, financial records, and private documents remain completely protected.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {[
                                {
                                    title: "Client-Side Content Parsing",
                                    desc: "Extract strings locally. We utilize JavaScript structures to map character coordinates with zero external tracking.",
                                    icon: <FileText size={16} />
                                },
                                {
                                    title: "Retain Font and Paragraph Styling",
                                    desc: "Our layout mapping preserves line spaces, indentation gaps, font families, bold weights, and italic slants.",
                                    icon: <FileEdit size={16} />
                                },
                                {
                                    title: "Perfect DOCX Compilation",
                                    desc: "Exports parsed vector characters immediately into structured Word formats (.docx) that open flawlessly in MS Word.",
                                    icon: <Download size={16} />
                                },
                                {
                                    title: "Bypasses Network Bandwidth",
                                    desc: "Saves you from waiting for cloud upload streams. Process heavy documents instantly on your local CPU.",
                                    icon: <Zap size={16} />
                                },
                                {
                                    title: "Clean, Watermark-Free Export",
                                    desc: "The output file remains completely clean. We do not inject promotional footnotes, page stamps, or headers.",
                                    icon: <LockIcon size={16} />
                                },
                                {
                                    title: "100% Free & Uncapped Usage",
                                    desc: "Extract content from multi-page documents unlimited times without registration walls or size constraints.",
                                    icon: <Sparkles size={16} />
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
                                How to Extract PDF Text to Word Online for Free
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { step: "1", title: "Select PDF Document", desc: "Drag and drop your PDF into the secure local dropbox zone or click to navigate directories locally." },
                                    { step: "2", title: "Run Structured Extraction", desc: "Click the 'Extract Text' button. The script parses vector coordinate mapping in milliseconds." },
                                    { step: "3", title: "Save Editable DOCX", desc: "Click the 'Download DOCX' button to compile the extracted paragraphs and save the file directly." }
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
                                AssetNest Local Parser vs. Server-Side Converters
                            </h3>
                            <p className="text-xs text-zinc-600 text-center mb-8 max-w-lg mx-auto font-medium">
                                Compare our locally executed script framework with typical cloud-based converters.
                            </p>
                            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]">
                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                    <thead>
                                        <tr className="bg-zinc-50 border-b-2 border-black">
                                            <th className="p-4 text-black font-black uppercase tracking-wider">Feature capability</th>
                                            <th className="p-4 text-black font-black uppercase tracking-wider bg-yellow-50">AssetNest In-Browser Extractor</th>
                                            <th className="p-4 text-zinc-600 font-bold uppercase tracking-wider">Cloud-Based Converters</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {[
                                            { feat: "File Confidentiality", ours: "100% Safe (Local processing guarantees files are never uploaded or logged)", other: "Risky (Files reside in remote database caches for rendering)" },
                                            { feat: "Paragraph Formatting", ours: "Rebuilds paragraphs using relative horizontal and vertical coords spacing", other: "Appends messy breaks or outputs simple unformatted txt blocks" },
                                            { feat: "Daily Size Limits", ours: "Completely unlimited size processing (restricted only by local device memory)", other: "Enforces strict document count limitations or gates features behind pricing tiers" },
                                            { feat: "Watermark Overlay", ours: "Clean Word exports (no promotional stamps or headers are injected)", other: "Inserts footer advertisements or restrictions in the output document" },
                                            { feat: "Registration constraints", ours: "No signups, memberships, or payments required", other: "Forces account registration before delivering download files" }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-4 text-black font-bold">{row.feat}</td>
                                                <td className="p-4 text-black font-semibold bg-yellow-50/50">{row.ours}</td>
                                                <td className="p-4 text-zinc-600 font-medium">{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="border-t-2 border-black pt-10">
                            <h3 className="text-xl sm:text-2xl font-bold text-black text-center mb-8 tracking-tight ig-display">
                                PDF Text Extractor FAQ
                            </h3>
                            <LocalAccordion>
                                <LocalAccordionItem title="How does the local PDF text extractor protect document security?">
                                    AssetNest runs pdfjs-dist structures inside a local Web Worker environment. All text analysis, sorting, and docx packing take place directly inside your device's memory. No files are uploaded to our servers.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Can this tool extract text from scanned, image-only PDF documents?">
                                    This tool scans digital text layers in vector PDFs. It does not perform Optical Character Recognition (OCR). If your PDF consists of raw flat photos or scans with no selectable text layers, the parser will return an empty page warning.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Will the formatting, bold headers, and fonts be preserved in Word?">
                                    Yes. The algorithm reads font item styles, checks bold/italic tags, estimates font sizes, and measures line drops (Y-axis distance) to reconstruct natural paragraphs, indentation, and styled runs.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Is there a page limit on the size of files I can extract?">
                                    No. You can process documents of any length. Large books or multi-hundred-page transcripts may take several seconds to process depending on your local CPU.
                                </LocalAccordionItem>
                                <LocalAccordionItem title="Why does my extracted DOCX file have double spaces or layout shifts?">
                                    PDFs are designed as rigid absolute coordinate grids rather than reflowable text pages. The parser does its best to sort characters top-to-bottom and left-to-right, but complex multi-column charts or floating frames may occasionally require light manual adjustments.
                                </LocalAccordionItem>
                            </LocalAccordion>
                        </div>
                    </div>
                </div>
            </main>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="PDF Text Extractor Info">
                <div className="space-y-12 text-zinc-800 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">
                            Visual Text Extraction Infrastructure
                        </h3>
                        <p className="text-base leading-relaxed text-zinc-700 font-medium">
                            Step into a professional-grade workspace for document digitizing. AssetNest <strong>Advanced PDF Text Extractor</strong> transcends basic copy-pasting—it provides a structural parser where you can mine raw text from PDF containers with zero data exposure and absolute data privacy. Whether you are stripping text from a high-res legal brief, extracting data blocks from research papers, or scraping strings from protected UI documentation, our tool gives you the power to transform PDF objects into editable DOCX containers with industry-leading character preservation and zero server dependency.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <FileText size={20} className="text-black" />
                                How to Extract Safely
                            </h3>
                            <ul className="space-y-4 text-sm text-zinc-700 font-medium">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Universal Support:</strong> Drop any standard PDF container. Our engine automatically identifies underlying text layers for extraction.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>Internal Mapping:</strong> We utilize client-side PDF parsing to scan document structures locally. Blazing fast, ultra-secure.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 shrink-0"><Check size={16} className="text-black" /></div>
                                    <span><strong>DOCX Reconstruction:</strong> Automatically compile extracted strings into professional Word documents while retaining paragraph flow.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display flex items-center gap-2">
                                <ShieldCheck size={20} className="text-black" />
                                Privacy Infrastructure
                            </h3>
                            <p className="text-sm text-zinc-700 leading-relaxed font-bold">
                                Unlike traditional cloud-based tools that store your sensitive document data on external servers, our text extractor operates <strong>100% locally in your browser cache</strong>.
                            </p>
                            <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-black shadow-[2px_2px_0_#000]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-black">Technical Spec</p>
                                <p className="text-[11px] text-zinc-650 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                                    Zero-Server Processing • Internal Stream Scraper • Metadata Integrity • Clean DOCX Output
                                </p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-black shadow-[3px_3px_0_#000] pt-12">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-black mb-6 ig-display">Documentation FAQ</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Scanned PDFs?">
                                No. This tool extracts from digital text layers. For image-based scans, use our dedicated OCR tools.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Table Extraction?">
                                Pure text extraction focuses on string data. Tables may require manual formatting after export.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Secure Memory?">
                                Zero data persistence. Your extracted text persists in RAM only until the current tool context is cleared.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </section>
                </div>
            </HelpModal>

        </div>
    );
}
