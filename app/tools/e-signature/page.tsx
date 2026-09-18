"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    PenTool, Download, Trash2, Undo2, Pencil, Check, ShieldCheck,
    Info, ArrowLeft, HelpCircle, Sparkles, Package, Zap, Share2
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import ReactSignatureCanvas from "react-signature-canvas";
import dynamic from "next/dynamic";

const ShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });

/* ─────────────────────────────────────────
   DESIGN TOKENS (Standard Dark System)
   ───────────────────────────────────────── */
const T = {
    bg:          "#333333",
    surface:     "#3a3a3a",
    surfaceHi:   "#444444",
    surfaceHov:  "#505050",
    border:      "#555555",
    borderDim:   "#2a2a2a",
    accent:      "#4db8d4",
    accentDark:  "#2a7a8f",
    accentDim:   "rgba(77,184,212,0.15)",
    textPri:     "#cccccc",
    textSec:     "#999999",
    muted:       "#777777",
    danger:      "#cc4444",
    success:     "#7dcea0",
    font:        "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 2,
            background: T.surface, border: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 400, color: "#aaa",
        }}>
            {icon}{label}
        </span>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div onClick={() => setOpen(!open)} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
            padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <h4 style={{ fontSize: 11, fontWeight: 400, color: T.textPri, margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
                </h4>
                <span style={{ color: T.textSec, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
            </div>
            <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
            </div>
        </div>
    );
}

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "E-Signature Creator",
    description: "Draw and download digital signatures as transparent PNG or scalable SVG in your browser. 100% private, zero uploads.",
    url: "https://www.assetnest.space/tools/e-signature",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ESignaturePage() {
    const padRef = useRef<ReactSignatureCanvas>(null);
    const [penColor, setPenColor] = useState("#000000");
    const [penWidth, setPenWidth] = useState(2.5);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareBlob, setShareBlob] = useState<Blob | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const clearCanvas = () => {
        padRef.current?.clear();
        setHasDrawn(false);
        setShareBlob(null);
    };

    const undoDrawing = () => {
        if (!padRef.current) return;
        const data = padRef.current.toData();
        if (data && data.length > 0) {
            data.pop();
            padRef.current.fromData(data);
            if (data.length === 0) {
                setHasDrawn(false);
                setShareBlob(null);
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

    const handleOpenShare = () => {
        if (!padRef.current || padRef.current.isEmpty()) return;
        const canvas = padRef.current.getTrimmedCanvas();
        canvas.toBlob(blob => {
            if (blob) {
                setShareBlob(blob);
                setIsSharing(true);
            }
        }, "image/png");
    };

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666666; }
            `}</style>

            {/* ── HEADER ── */}
            <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Link href="/tools" style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
                    color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
                }}>
                    <ArrowLeft size={11} strokeWidth={2} /> Back
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                        <PenTool size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>E-Signature Creator</span>
                    <button 
                        onClick={() => setShowHelp(true)} 
                        style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.muted, cursor: "pointer", display: "flex" }}
                        title="Help Guide"
                    >
                        <HelpCircle size={11} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

                {/* Main Signature Workspace */}
                <div style={{ maxWidth: 740, margin: "0 auto" }}>
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: 4, padding: 18, display: "flex", flexDirection: "column", gap: 16
                    }}>
                        {/* Control Toolbar */}
                        <div style={{
                            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                            gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.borderDim}`
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                                {/* Color Selector */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        {[
                                            { hex: "#000000", label: "Black" },
                                            { hex: "#1d4ed8", label: "Royal Blue" },
                                            { hex: "#b91c1c", label: "Ruby Red" },
                                            { hex: "#16a34a", label: "Kelly Green" },
                                        ].map(c => (
                                            <button
                                                key={c.hex}
                                                onClick={() => setPenColor(c.hex)}
                                                style={{
                                                    width: 20, height: 20, borderRadius: "50%",
                                                    backgroundColor: c.hex, border: penColor === c.hex ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                                                    boxShadow: penColor === c.hex ? `0 0 0 2px ${T.accentDim}` : "none",
                                                    cursor: "pointer", transition: "all 0.15s", transform: penColor === c.hex ? "scale(1.15)" : "scale(1)"
                                                }}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Weight Selector */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weight</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {[
                                            { val: 1.5, dot: 4, label: "Fine" },
                                            { val: 2.5, dot: 6, label: "Medium" },
                                            { val: 4.5, dot: 9, label: "Bold" },
                                        ].map(w => (
                                            <button
                                                key={w.val}
                                                onClick={() => setPenWidth(w.val)}
                                                style={{
                                                    width: 24, height: 24, borderRadius: 2,
                                                    background: penWidth === w.val ? T.surfaceHi : "#2a2a2a",
                                                    border: `1px solid ${penWidth === w.val ? T.accent : T.border}`,
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.15s"
                                                }}
                                                title={w.label}
                                            >
                                                <div style={{
                                                    width: w.dot, height: w.dot, borderRadius: "50%",
                                                    background: penWidth === w.val ? T.accent : "#aaa"
                                                }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Undo & Clear */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button
                                    onClick={undoDrawing}
                                    disabled={!hasDrawn}
                                    style={{
                                        height: 28, padding: "0 10px", background: T.surfaceHi,
                                        border: `1px solid ${T.border}`, borderRadius: 2,
                                        color: hasDrawn ? T.textPri : T.muted, fontSize: 11,
                                        cursor: hasDrawn ? "pointer" : "not-allowed",
                                        display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s"
                                    }}
                                    title="Undo last stroke"
                                >
                                    <Undo2 size={12} /> Undo
                                </button>
                                <button
                                    onClick={clearCanvas}
                                    disabled={!hasDrawn}
                                    style={{
                                        height: 28, padding: "0 10px", background: "transparent",
                                        border: `1px solid ${hasDrawn ? T.danger : T.border}`, borderRadius: 2,
                                        color: hasDrawn ? "#ff8888" : T.muted, fontSize: 11,
                                        cursor: hasDrawn ? "pointer" : "not-allowed",
                                        display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s"
                                    }}
                                    title="Clear canvas"
                                >
                                    <Trash2 size={12} /> Clear
                                </button>
                            </div>
                        </div>

                        {/* Interactive Drawing Canvas */}
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                height: 280,
                                borderRadius: 3,
                                overflow: "hidden",
                                cursor: "crosshair",
                                border: `1px solid ${T.border}`,
                                backgroundColor: "#ffffff",
                                backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
                                backgroundSize: "16px 16px"
                            }}
                        >
                            {!hasDrawn && (
                                <div style={{
                                    position: "absolute", inset: 0, pointerEvents: "none",
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    opacity: 0.35, userSelect: "none"
                                }}>
                                    <Pencil size={32} color="#888" style={{ marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                        Sign Here
                                    </span>
                                </div>
                            )}

                            {/* Signature Baseline */}
                            <div style={{
                                position: "absolute", bottom: 50, left: "10%", right: "10%",
                                borderBottom: "1px dashed #cccccc", pointerEvents: "none"
                            }} />

                            {mounted && (
                                <ReactSignatureCanvas
                                    ref={padRef}
                                    canvasProps={{
                                        style: { width: "100%", height: "100%", position: "absolute", inset: 0, touchAction: "none" }
                                    }}
                                    penColor={penColor}
                                    dotSize={penWidth * 0.5}
                                    minWidth={penWidth * 0.5}
                                    maxWidth={penWidth * 1.5}
                                    velocityFilterWeight={0.7}
                                    onBegin={() => setHasDrawn(true)}
                                />
                            )}
                        </div>

                        {/* Download & Export Actions */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, paddingTop: 4 }}>
                            <button
                                onClick={() => downloadSignature("png")}
                                disabled={!hasDrawn}
                                style={{
                                    height: 38, background: hasDrawn ? T.accent : T.surfaceHi,
                                    border: `1px solid ${hasDrawn ? T.accent : T.border}`,
                                    borderRadius: 3, color: hasDrawn ? "#1a1a1a" : T.muted,
                                    fontWeight: 600, fontSize: 11,
                                    cursor: hasDrawn ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    transition: "all 0.15s"
                                }}
                            >
                                <Download size={14} /> Export Transparent PNG
                            </button>

                            <button
                                onClick={() => downloadSignature("svg")}
                                disabled={!hasDrawn}
                                style={{
                                    height: 38, background: T.surfaceHi,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: hasDrawn ? T.textPri : T.muted,
                                    fontWeight: 500, fontSize: 11,
                                    cursor: hasDrawn ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    transition: "all 0.15s"
                                }}
                            >
                                <Download size={14} /> Export Scalable SVG
                            </button>

                            <button
                                onClick={handleOpenShare}
                                disabled={!hasDrawn}
                                style={{
                                    height: 38, background: T.surfaceHi,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: hasDrawn ? T.textPri : T.muted,
                                    fontWeight: 500, fontSize: 11,
                                    cursor: hasDrawn ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    transition: "all 0.15s"
                                }}
                            >
                                <Share2 size={14} /> Share to Mobile
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── SEO RICH CONTENT SECTION ─── */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderDim}`, paddingTop: 36 }}>
                    {/* Top Badges */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                        <Chip icon={<ShieldCheck size={10} />} label="100% In-Browser Privacy" />
                        <Chip icon={<Sparkles size={10} />} label="Free & Unlimited" />
                        <Chip icon={<Package size={10} />} label="No Server Uploads" />
                    </div>

                    {/* Section Header */}
                    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 36px" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 500, color: T.textPri, marginBottom: 8 }}>
                            Free High-Fidelity E-Signature Creator - Draw & Export
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Create, customize, and export professional digital signatures directly from your browser. AssetNest runs entirely locally with zero server logs, maintaining absolute privacy for your personal signature.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: PenTool,
                                title: "Natural Smooth Strokes",
                                desc: "High-precision spline interpolation renders smooth signature curves without jagged pixel stepping."
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Client-Side Privacy",
                                desc: "No database saves or cloud tracking. Your signature never leaves your local device memory."
                            },
                            {
                                icon: Zap,
                                title: "Dual Format Export",
                                desc: "Download transparent alpha PNGs for immediate document stamping or resolution-free vector SVGs."
                            },
                            {
                                icon: Sparkles,
                                title: "Color & Weight Presets",
                                desc: "Switch instantly between standard black, legal blue, red, and green ink, with fine, medium, and bold pens."
                            },
                            {
                                icon: Package,
                                title: "Mobile & Touch Optimized",
                                desc: "Fully responsive touch support for precision fingertip and stylus signing on smartphones and tablets."
                            },
                            {
                                icon: Check,
                                title: "100% Free & Clean",
                                desc: "Export unlimited signatures with zero fees, no registration barriers, and no injected watermarks."
                            }
                        ].map(f => (
                            <div key={f.title} style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ color: T.accent }}>
                                        <f.icon size={15} />
                                    </div>
                                    <h3 style={{ fontSize: 12, fontWeight: 500, margin: 0, color: T.textPri }}>{f.title}</h3>
                                </div>
                                <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Step Timeline */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 44 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 20 }}>
                            How to Create an E-Signature Online for Free
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select Ink & Stroke", desc: "Choose your desired ink color (Black, Blue, Red, Green) and pick a pen weight." },
                                { step: "2", title: "Draw on Canvas", desc: "Sign smoothly using your mouse, trackpad, finger, or stylus pen on the designated pad." },
                                { step: "3", title: "Export PNG or SVG", desc: "Download your trimmed transparent PNG or scalable vector SVG instantly for your documents." }
                            ].map(s => (
                                <div key={s.step} style={{ padding: 14, background: "#323232", border: `1px solid ${T.border}`, borderRadius: 3, position: "relative", paddingTop: 20 }}>
                                    <div style={{ position: "absolute", top: -10, left: 12, width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {s.step}
                                    </div>
                                    <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 6px" }}>{s.title}</h4>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Accordion Section */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, textAlign: "center", color: T.textPri, marginBottom: 16 }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Are these electronic signatures legally binding?"
                                answer="Yes. Electronic signatures are legally recognized in many jurisdictions under regulations like the US ESIGN Act and the EU eIDAS regulation, provided there is demonstrable intent and consent."
                            />
                            <FAQItem 
                                question="Where are my signatures stored?"
                                answer="Nowhere. All canvas drawing, spline calculations, and export operations are processed entirely locally in your browser RAM. No signature data is ever logged or saved to the cloud."
                            />
                            <FAQItem 
                                question="Should I choose PNG or SVG?"
                                answer="Choose PNG if you want a transparent background image ready to insert into Word, Google Docs, or PDF files. Choose SVG if you need vector resolution that can scale up infinitely without blurring."
                            />
                            <FAQItem 
                                question="Can I use this on a mobile phone or tablet?"
                                answer="Yes! The canvas has dedicated touch event listeners, making it easy to sign with your fingertip or an Apple Pencil / stylus on any touch-enabled device."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Help / Documentation Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="E-Signature Technical Documentation">
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            In-Browser Signature Engine
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            AssetNest E-Signature Creator provides a high-fidelity ink canvas where you can draw your signature, adjust pen thickness, select core colors, and download instantly without signing up or transmitting any data to external servers.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <PenTool size={14} style={{ color: T.accent }} /> Stroke Interpolation
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Velocity Filtering:</strong> Adjusts stroke width dynamically based on drawing speed.</li>
                                <li><strong>Bézier Splines:</strong> Smooths out hand tremors and raw input jitter.</li>
                                <li><strong>Auto-Trim:</strong> Exports crop tightly to the bounding box of your signature.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Compliance
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                Absolute client-side isolation. No biometrics, stroke arrays, or rendered images are uploaded to any server.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: HTML5 Canvas Alpha • Zero-Server Footprint • Client Memory Execution
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Is my signature saved anywhere?" 
                                answer="No. The signature exists strictly in your active browser session RAM until cleared or navigated away." 
                            />
                            <FAQItem 
                                question="Can I embed this in PDFs?" 
                                answer="Yes. The transparent PNG format can be placed directly into any PDF using our PDF Signer tool." 
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>

            {/* Share Modal */}
            <ShareModal
                isOpen={isSharing}
                onClose={() => setIsSharing(false)}
                file={shareBlob}
                fileName={`signature-${Date.now()}.png`}
            />
        </div>
    );
}
