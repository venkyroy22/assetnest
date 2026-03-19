"use client";

import { useState, useRef, useEffect } from "react";
import { PenTool, Download, Trash2, Undo2, GripHorizontal, Pencil } from "lucide-react";
import ReactSignatureCanvas from "react-signature-canvas";

export default function ESignaturePage() {
    const padRef = useRef<ReactSignatureCanvas>(null);
    const [penColor, setPenColor] = useState("#000000");
    const [penWidth, setPenWidth] = useState(2);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [mounted, setMounted] = useState(false);

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
        a.download = `Signature_${Date.now()}.${type}`;
        
        if (type === "png") {
            const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
            a.href = dataUrl;
        } else {
            // Generating SVG
            const svgData = padRef.current.toData() as any[];
            // Build simple SVG paths roughly based on signature points
            const canvas = padRef.current.getTrimmedCanvas();
            const originalCanvas = padRef.current.getCanvas();
            const padData = padRef.current.toData();
            
            // To be entirely accurate, react-signature-canvas draws complex splines.
            // Converting bezier curve points to SVG manually is hard without library support.
            // Best approach for SVG is to capture a high-res Canvas and encode it, OR
            // wrap the high res image in an SVG wrapper if needed, but transparent PNG usually suffices. 
            // We'll rely on generating PNG as primary, but if user requests SVG, we can fetch SVG from a dedicated path renderer or just fallback to SVG-wrapped PNG.
            // Wait, react-signature-canvas natively provides an SVG! Wait, no, but signature_pad does. 
            // `react-signature-canvas` uses `signature_pad` under the hood!
            // According to signature_pad docs, `padRef.current.toSVG()` exists!
            try {
                // @ts-ignore - reaching into the underlying signature_pad library
                const svgString = padRef.current._sigPad.toSVG({ includeBackgroundColor: false });
                const blob = new Blob([svgString], { type: "image/svg+xml" });
                a.href = URL.createObjectURL(blob);
            } catch (e) {
                // Fallback to PNG if toSVG fails
                const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
                a.href = dataUrl;
                a.download = `Signature_${Date.now()}.png`;
            }
        }
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-[70vh] py-8 px-4 md:px-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6 rounded-full">
                    <PenTool size={12} className="text-emerald-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Fast & Free Utility</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                    E-Signature <span className="text-emerald-500">Creator</span>
                </h1>
                <p className="text-zinc-400 text-sm font-medium max-w-xl mx-auto">
                    Draw your signature smoothly using your mouse or touch screen. Download instantly as a transparent PNG or SVG for your documents.
                </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-4 lg:p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 max-w-3xl mx-auto relative group">
                {/* Tools Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-900">
                    <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400 mr-1">Color:</span>
                            {["#000000", "#1d4ed8", "#b91c1c", "#ffffff"].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPenColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${penColor === color ? "border-emerald-500 scale-110" : "border-transparent hover:scale-105"} shadow-md`}
                                    style={{ backgroundColor: color }}
                                    title={`Select ${color}`}
                                />
                            ))}
                        </div>
                        <div className="w-px h-6 bg-zinc-800 mx-2"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400 mr-1">Thickness:</span>
                            {[
                                { val: 1, size: "w-2 h-2" }, 
                                { val: 2.5, size: "w-3 h-3" }, 
                                { val: 4, size: "w-4 h-4" }
                            ].map((w) => (
                                <button
                                    key={w.val}
                                    onClick={() => setPenWidth(w.val)}
                                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-800 transition-colors"
                                >
                                    <div className={`bg-white rounded-full ${w.size} ${penWidth === w.val ? "bg-emerald-400" : "bg-zinc-500"}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={undoDrawing} 
                            disabled={!hasDrawn}
                            className="h-10 px-4 flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                         >
                            <Undo2 size={14} /> Undo
                         </button>
                         <button 
                            onClick={clearCanvas} 
                            disabled={!hasDrawn}
                            className="h-10 px-4 flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                         >
                            <Trash2 size={14} /> Clear
                         </button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div 
                    className="relative w-full h-80 rounded-2xl overflow-hidden cursor-crosshair border-2 border-dashed border-zinc-800 group-hover:border-zinc-700 transition-colors"
                    style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23111'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23111'/%3E%3C/svg%3E")`, 
                        backgroundColor: "#050505" 
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30 select-none">
                        {!hasDrawn && (
                            <>
                                <Pencil size={48} className="text-zinc-600 mb-4 opacity-50" />
                                <span className="text-2xl font-black text-zinc-600 tracking-widest uppercase">Sign Here</span>
                            </>
                        )}
                        <div className="w-3/4 border-b-2 border-zinc-800/50 absolute bottom-16 border-dashed" />
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

                {/* Export Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => downloadSignature("png")}
                        disabled={!hasDrawn}
                        className="h-14 px-8 bg-emerald-500 text-black font-extrabold tracking-wide text-sm rounded-full flex flex-1 items-center justify-center gap-3 transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <Download size={18} /> Download Transparent PNG
                    </button>
                    <button 
                        onClick={() => downloadSignature("svg")}
                        disabled={!hasDrawn}
                        className="h-14 px-8 bg-zinc-900 border border-zinc-800 text-white font-bold tracking-wide text-sm rounded-full flex items-center justify-center gap-3 transition-all hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-50"
                    >
                        Download SVG
                    </button>
                </div>
            </div>
            
            <p className="mt-8 text-center text-[11px] text-zinc-500 font-medium tracking-wide">
                No data is ever stored. Processing runs securely entirely within your browser window.
            </p>
        </div>
    );
}
