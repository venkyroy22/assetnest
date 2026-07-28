"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PenTool, Download, Trash2, Undo2, Pencil, Check, Shield, Info, ArrowLeft, HelpCircle } from "lucide-react";
import HelpModal from "@/components/HelpModal";
import ReactSignatureCanvas from "react-signature-canvas";

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
                <span className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                </span>
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

export default function ESignaturePage() {
    const padRef = useRef<ReactSignatureCanvas>(null);
    const [penColor, setPenColor] = useState("#000000");
    const [penWidth, setPenWidth] = useState(2.5);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const clearCanvas = () => {
        padRef.current?.clear();
        setHasDrawn(false);
    };

    const undoDrawing = () => {
        if (!padRef.current) return;
        const data = padRef.current.toData();
        if (data && data.length > 0) {
            data.pop();
            padRef.current.fromData(data);
            if (data.length === 0) {
                setHasDrawn(false);
            }
        }
    };

    const downloadSignature = (type: "png" | "svg") => {
        if (!padRef.current || padRef.current.isEmpty()) return;
        
        const a = document.createElement("a");
        const filename = `signature-${Date.now()}.${type}`;
        a.download = filename;
        
        let sizeText = "";
        if (type === "png") {
            const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
            a.href = dataUrl;
            sizeText = "Transparent PNG";
        } else {
            try {
                // @ts-ignore
                const svgString = padRef.current._sigPad.toSVG({ includeBackgroundColor: false });
                const blob = new Blob([svgString], { type: "image/svg+xml" });
                a.href = URL.createObjectURL(blob);
                sizeText = "Scalable Vector SVG";
            } catch (e) {
                const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
                a.href = dataUrl;
                a.download = `signature-${Date.now()}.png`;
                sizeText = "Transparent PNG (SVG fallback)";
            }
        }
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.dispatchEvent(new CustomEvent("assetnest-download", {
            detail: {
                filename: filename,
                size: sizeText
            }
        }));
    };

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>

            {/* Header */}
            <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0_#000] bg-orange-500">
                        <PenTool size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        E-Signature Creator
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <HelpCircle size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
                <div className="bg-white border-2 sm:border-4 border-black rounded-[2.5rem] p-5 lg:p-8 shadow-[8px_8px_0_#000] max-w-3xl mx-auto">
                    {/* Controls Panel */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b-2 border-dashed border-black">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            {/* Color Selector */}
                            <div className="flex items-center gap-2.5 bg-zinc-50 border-2 border-black px-4 py-2 rounded-2xl w-full sm:w-auto justify-between">
                                <span className="ig-label text-zinc-500">Color</span>
                                <div className="flex items-center gap-2">
                                    {["#000000", "#1d4ed8", "#b91c1c", "#16a34a"].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setPenColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                penColor === color 
                                                    ? "border-black scale-110 ring-2 ring-black/20" 
                                                    : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
                                            }`}
                                            style={{ backgroundColor: color }}
                                            title={`Select ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Weight Selector */}
                            <div className="flex items-center gap-2.5 bg-zinc-50 border-2 border-black px-4 py-2 rounded-2xl w-full sm:w-auto justify-between">
                                <span className="ig-label text-zinc-500">Weight</span>
                                <div className="flex items-center gap-1.5">
                                    {[
                                        { val: 1.5, size: "w-2 h-2" }, 
                                        { val: 2.5, size: "w-3 h-3" }, 
                                        { val: 4.5, size: "w-4 h-4" }
                                    ].map((w) => (
                                        <button
                                            key={w.val}
                                            onClick={() => setPenWidth(w.val)}
                                            className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all ${
                                                penWidth === w.val 
                                                    ? "bg-black border-black text-white" 
                                                    : "bg-white border-transparent hover:bg-zinc-100"
                                            }`}
                                        >
                                            <div className={`rounded-full ${w.size} ${penWidth === w.val ? "bg-white" : "bg-black"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Undo & Clear */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                             <button 
                                onClick={undoDrawing} 
                                disabled={!hasDrawn}
                                className="ig-btn h-10 px-4 flex items-center gap-1.5 text-xs font-bold bg-white border-2 border-black rounded-xl shadow-[2px_2px_0_#000] text-black hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-white disabled:pointer-events-none"
                             >
                                <Undo2 size={13} /> Undo
                             </button>
                             <button 
                                onClick={clearCanvas} 
                                disabled={!hasDrawn}
                                className="ig-btn h-10 px-4 flex items-center gap-1.5 text-xs font-bold bg-rose-50 border-2 border-black rounded-xl shadow-[2px_2px_0_#000] text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:hover:bg-rose-50 disabled:pointer-events-none"
                             >
                                <Trash2 size={13} /> Clear
                             </button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div 
                        className="relative w-full h-80 rounded-[1.5rem] overflow-hidden cursor-crosshair border-2 border-black transition-colors"
                        style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23f1f1f3'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23f1f1f3'/%3E%3C/svg%3E")`, 
                            backgroundColor: "#ffffff" 
                        }}
                    >
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30 select-none">
                            {!hasDrawn && (
                                <>
                                    <Pencil size={40} className="text-zinc-400 mb-2" />
                                    <span className="ig-display text-xl font-bold text-zinc-400 tracking-wider uppercase">Sign Here</span>
                                </>
                            )}
                            <div className="w-4/5 border-b-2 border-zinc-300 absolute bottom-16 border-dashed" />
                        </div>
                        
                        {mounted && (
                            <ReactSignatureCanvas
                                ref={padRef}
                                canvasProps={{ className: "w-full h-full absolute inset-0 touch-none" }}
                                penColor={penColor}
                                dotSize={penWidth * 0.5}
                                minWidth={penWidth * 0.5}
                                maxWidth={penWidth * 1.5}
                                velocityFilterWeight={0.7}
                                onBegin={() => setHasDrawn(true)}
                            />
                        )}
                    </div>

                    {/* Download/Export Actions */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => downloadSignature("png")}
                            disabled={!hasDrawn}
                            className="ig-btn h-12 px-8 bg-emerald-400 text-black font-black uppercase tracking-widest text-xs border-2 border-black rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] hover:bg-emerald-300 disabled:opacity-30 disabled:hover:bg-emerald-400 disabled:pointer-events-none"
                        >
                            <Download size={14} /> Export transparent PNG
                        </button>
                        <button 
                            onClick={() => downloadSignature("svg")}
                            disabled={!hasDrawn}
                            className="ig-btn h-12 px-8 bg-white text-black font-black uppercase tracking-widest text-xs border-2 border-black rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-white disabled:pointer-events-none"
                        >
                            <Download size={14} /> Export scalable SVG
                        </button>
                    </div>
                </div>

                {/* SEO Info Cards Section */}
                <div className="mt-16 bg-white border-2 sm:border-4 border-black rounded-[2.5rem] p-6 sm:p-10 text-left relative overflow-hidden shadow-[8px_8px_0_#000]">
                    <div className="flex justify-center gap-2.5 mb-6 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fde047] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                            <Shield size={11} className="text-black shrink-0" /> 100% Private
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#a7f3d0] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                            <Info size={11} className="text-black shrink-0" /> Browser-Side
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fbcfe8] border-2 border-black text-[10px] font-bold tracking-widest text-black uppercase shadow-[2px_2px_0_#000]">
                            <Check size={11} className="text-black shrink-0" /> Free Forever
                        </span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight mb-4 ig-display">
                            Free High-Fidelity E-Signature Creator
                        </h2>
                        <p className="text-sm text-zinc-700 leading-relaxed max-w-2xl mx-auto font-medium">
                            Create, customize, and export professional digital signatures instantly from your browser. AssetNest runs entirely locally with zero server logs, maintaining your absolute identity privacy.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 border-2 border-black p-6 rounded-2xl shadow-[3px_3px_0_#000]">
                            <h3 className="text-lg font-bold tracking-tight text-black mb-3 ig-display">How to use</h3>
                            <ul className="space-y-3.5 text-xs text-zinc-700 font-medium">
                                <li className="flex gap-3">
                                    <span className="font-bold text-emerald-600">✓</span>
                                    <span><strong>Draw Naturally:</strong> Draw with specialized pen weight configurations using your mouse, trackpad, or smartphone.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-emerald-600">✓</span>
                                    <span><strong>Color Adjustments:</strong> Switch between Black, Royal Blue, Ruby Red, and Kelly Green presets to match official document standard requirements.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-emerald-600">✓</span>
                                    <span><strong>Lossless Formats:</strong> Export transparent PNGs for signature stamping or vector SVGs for infinite clean scaling.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-zinc-50 border-2 border-black p-6 rounded-2xl shadow-[3px_3px_0_#000] flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold tracking-tight text-black mb-3 ig-display">Security Spec</h3>
                                <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                                    Unlike traditional signature capture platforms that log IP data and store signing strokes on remote database clouds, AssetNest executes 100% locally in your client environment.
                                </p>
                            </div>
                            <div className="mt-4 p-4 bg-zinc-200/50 border border-zinc-300 rounded-xl">
                                <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Signature Standard Specs</p>
                                <p className="text-[10px] text-zinc-800 font-bold mt-1 tracking-tight uppercase">
                                    Zero-Server Transmission • Canvas Alpha Channel Preservation • High-Fidelity Stroke Spline Renderer
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FAQ Help Modal */}
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="E-Signature Technical Architecture"
            >
                <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">
                            How E-Signature Creator Works
                        </h3>
                        <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                            Step into a professional-grade workspace for signature creation. The E-Signature Creator provides a high-fidelity ink canvas where you can draw your signature, adjust pen thickness, select core colors, and download instantly without signing up or uploading any data to external servers.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="Are these signatures legally binding?">
                                Yes. Electronic signatures are legally recognized in many countries under regulations like the US ESIGN Act and the European Union's eIDAS regulation, provided they are intent-verified and consent-consented.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Where are my files and signature data uploaded?">
                                Nowhere. All canvas drawing, spline calculations, and export files are processed entirely locally inside your browser container. No data is ever transmitted, logged, or saved to the cloud.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Why choose SVG over PNG?">
                                PNG files are high-resolution pixel maps with transparency, making them perfect for embedding in PDFs or Word documents. SVG files are scalable vector graphics, meaning they contain instructions on how to draw the curves, enabling them to scale infinitely to any size without becoming pixelated or blurry.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
