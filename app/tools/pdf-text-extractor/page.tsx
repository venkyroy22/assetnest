"use client";

import { useState, useRef } from "react";
import { Upload, Download, RefreshCw, FileText, Info, X, FileEdit } from "lucide-react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import dynamic from "next/dynamic";
const PdfPageThumbnail = dynamic(() => import("../pdf-merger/PdfPreviewThumbnail"), { ssr: false });


export default function PdfTextExtractorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
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
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6 rounded-full">
                    <FileText size={12} className="text-blue-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Text Extraction Tool</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    PDF Text <span className="text-blue-500">Extractor</span>
                </h1>
                <p className="text-zinc-400 text-sm font-medium max-w-xl mx-auto leading-relaxed">
                    Extract paragraphs and un-selectable text from any PDF directly into a raw Word Document (DOCX). Keeps text secure, offline, and private.
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

            {!file ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                        isDragging ? "border-blue-500 bg-blue-500/5" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50"
                    }`}
                >
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
                    />
                    <div className="text-center px-8 space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                            <Upload size={24} className="text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Drop PDF Here</h2>
                            <p className="text-zinc-500 text-xs font-medium mt-1">Or click to select a file for text extraction</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {/* Active File Card */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        
                        {/* Status Backdrop Blur */}
                        <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />

                        {/* Thumbnail View */}
                        <div className="w-40 h-52 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex items-center justify-center">
                             <PdfPageThumbnail file={file} pageIndex={0} />
                             <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black text-white/90 border border-white/10 uppercase tracking-widest">
                                 PDF Preview
                             </div>
                        </div>

                        {/* File details & Conversion panel */}
                        <div className="flex-grow w-full flex flex-col items-start justify-center">
                            <div className="flex items-center gap-3 mb-1.5 w-full">
                                <FileText size={18} className="text-blue-400" />
                                <h3 className="text-xl font-bold text-white truncate max-w-[80%]">{file.name}</h3>
                            </div>
                            <p className="text-xs text-zinc-500 font-semibold tracking-wider mb-6">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {!outputUrl ? (
                                <div className="w-full space-y-4">
                                    {/* Progress Area */}
                                    {isConverting ? (
                                        <div className="w-full space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-xs font-bold text-blue-400">Extracting...</span>
                                                <span className="text-xs font-bold text-blue-400">{progress}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-medium pt-1 px-1">
                                                Extracting structured text objects and generating paragraphs...
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={convertToWord}
                                            className="w-full sm:w-auto h-12 px-8 bg-blue-500 text-white font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                        >
                                            Extract Text <FileText size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full space-y-4 animate-in fade-in duration-700">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">
                                        ✓ Extraction Complete
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={downloadWord}
                                            className="h-12 px-8 bg-blue-500 text-white font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                        >
                                            <Download size={16} /> Download DOCX
                                        </button>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reset Button */}
                        <button 
                            onClick={reset} 
                            disabled={isConverting}
                            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-0"
                            title="Start Over"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {!file && (
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
                    {[
                        { title: "Browser Magic", desc: "Instantly extracts text algorithms using your device compute. Secure and fast." },
                        { title: "Universal Output", desc: "Generates proper DOCX standard files containing just your text, perfect for essays." },
                        { title: "No Subscription", desc: "Extract unbounded text from PDFs instantly. No hidden queues or processing limits." }
                    ].map((f, i) => (
                        <div key={i} className="text-center space-y-2">
                            <h4 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">{f.title}</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-[200px] mx-auto">{f.desc}</p>
                        </div>
                    ))}
                </div>
            )}
            

        </div>
    );
}
