"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PenTool, RotateCcw, Trash2, Check, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";

const PRESET_COLORS = [
    { name: "Ink Black",    value: "#0a0a0a" },
    { name: "Royal Blue",   value: "#1a3fbf" },
    { name: "Crimson",      value: "#c0172b" },
];

export default function MobileSignPage() {
    return (
        <React.Suspense fallback={
            <div style={{
                minHeight: "100vh",
                background: "#080809",
                color: "#f0eff5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Inter, system-ui, sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid rgba(124, 106, 255, 0.1)",
                        borderTopColor: "#7c6aff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 16px auto",
                    }} />
                    <p style={{ fontSize: "14px", color: "#8b8a97" }}>Loading mobile workspace...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        }>
            <MobileSignContent />
        </React.Suspense>
    );
}

function MobileSignContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    const [color, setColor] = useState("#0a0a0a");
    const [lineWidth, setLineWidth] = useState(3);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Bootstrap and resize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;

            // Save state
            const tmp = document.createElement("canvas");
            tmp.width = canvas.width;
            tmp.height = canvas.height;
            const tmpCtx = tmp.getContext("2d");
            if (tmpCtx && canvas.width > 0 && canvas.height > 0) {
                tmpCtx.drawImage(canvas, 0, 0);
            }

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            const ctx = canvas.getContext("2d")!;
            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            if (canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(tmp, 0, 0, w, h);
            }
            ctxRef.current = ctx;
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [isCompleted]);

    const getXY = (e: React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const setupCtx = (ctx: CanvasRenderingContext2D) => {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    };

    const onPointerDown = (e: React.PointerEvent) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        isDrawingRef.current = true;
        const pos = getXY(e);
        setupCtx(ctx);

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y + 0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        lastPosRef.current = pos;
        setIsEmpty(false);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawingRef.current || !ctxRef.current || !lastPosRef.current) return;
        const pos = getXY(e);
        const last = lastPosRef.current;

        const midX = (last.x + pos.x) / 2;
        const midY = (last.y + pos.y) / 2;

        ctxRef.current.quadraticCurveTo(last.x, last.y, midX, midY);
        ctxRef.current.stroke();

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(midX, midY);

        lastPosRef.current = pos;
    };

    const onPointerUp = () => {
        if (!ctxRef.current || !lastPosRef.current) return;
        isDrawingRef.current = false;

        ctxRef.current.lineTo(lastPosRef.current.x, lastPosRef.current.y);
        ctxRef.current.stroke();
        ctxRef.current.closePath();

        lastPosRef.current = null;
    };

    const clear = () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleSubmit = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty || !sessionId) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            // Autocrop signature before submitting
            const croppedDataUrl = getCroppedSignature(canvas);

            const res = await fetch("/api/mobile-sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "submit",
                    sessionId,
                    signature: croppedDataUrl,
                }),
            });

            if (res.ok) {
                setIsCompleted(true);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || "Failed to submit signature.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCroppedSignature = (canvas: HTMLCanvasElement): string => {
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const w = canvas.width;
        const h = canvas.height;
        const data = ctx.getImageData(0, 0, w, h).data;

        let minX = w, minY = h, maxX = 0, maxY = 0;
        let p = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[p + 3] > 10) {
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
                p += 4;
            }
        }

        if (maxX < minX || maxY < minY) {
            return canvas.toDataURL("image/png");
        }

        const pad = 12;
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
        const cropW = maxX - minX; const cropH = maxY - minY;

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW; cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);

        return cropCanvas.toDataURL("image/png");
    };

    if (!sessionId) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <Smartphone size={40} style={{ color: "#ef4444", marginBottom: "16px" }} />
                    <h2 style={styles.errorTitle}>Invalid Session</h2>
                    <p style={styles.errorText}>No signature pairing session was found. Please scan the QR code from the desktop editor again.</p>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.successIconWrapper}>
                        <CheckCircle2 size={42} style={{ color: "#10b981", transform: "scale(1.1)" }} />
                    </div>
                    <h2 style={styles.successTitle}>Signature Sent!</h2>
                    <p style={styles.successText}>Your handwritten signature has been transferred to your desktop web browser in real-time.</p>
                    <div style={styles.divider} />
                    <p style={styles.subSuccessText}>You can safely close this browser tab now and continue working on your document.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLogo}>
                    <Sparkles size={16} style={{ color: "#7c6aff" }} />
                    <span>AssetNest Signature Studio</span>
                </div>
                <h1 style={styles.title}>Handwrite Signature</h1>
                <p style={styles.subtitle}>Draw inside the bounds using your finger or stylus.</p>
            </header>

            {/* Canvas Workspace */}
            <div style={styles.canvasContainer}>
                <div ref={wrapperRef} style={styles.canvasWrapper}>
                    {/* Baseline */}
                    <div style={styles.baseline} />
                    
                    <canvas
                        ref={canvasRef}
                        style={styles.canvas}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    />

                    {isEmpty && (
                        <div style={styles.emptyHint}>
                            <p style={styles.emptyHintText}>Draw your signature here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Control Panel */}
            <footer style={styles.footer}>
                {errorMsg && <p style={styles.errorMessage}>{errorMsg}</p>}

                <div style={styles.controlsRow}>
                    {/* Color choices */}
                    <div style={styles.colorsStrip}>
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setColor(c.value)}
                                style={{
                                    ...styles.colorBtn,
                                    background: c.value,
                                    borderColor: color === c.value ? "#7c6aff" : "rgba(255,255,255,0.1)",
                                    transform: color === c.value ? "scale(1.15)" : "scale(1)",
                                }}
                            />
                        ))}
                    </div>

                    {/* Stroke width */}
                    <div style={styles.strokeSelector}>
                        {[3, 5, 8, 12].map(w => (
                            <button
                                key={w}
                                onClick={() => setLineWidth(w)}
                                style={{
                                    ...styles.strokeBtn,
                                    borderColor: lineWidth === w ? "#7c6aff" : "rgba(255,255,255,0.06)",
                                    background: lineWidth === w ? "rgba(124, 106, 255, 0.12)" : "rgba(255,255,255,0.02)",
                                    color: lineWidth === w ? "#7c6aff" : "#8b8a97",
                                }}
                            >
                                <PenTool size={w === 3 ? 13 : w === 5 ? 15 : w === 8 ? 17 : 19} />
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.actionButtons}>
                    <button
                        onClick={clear}
                        disabled={isEmpty || isSubmitting}
                        style={{
                            ...styles.btnSecondary,
                            opacity: isEmpty || isSubmitting ? 0.3 : 1,
                        }}
                    >
                        <RotateCcw size={16} />
                        <span>Clear</span>
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isEmpty || isSubmitting}
                        style={{
                            ...styles.btnPrimary,
                            opacity: isEmpty || isSubmitting ? 0.35 : 1,
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div style={styles.spinner} />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                <span>Submit Signature</span>
                            </>
                        )}
                    </button>
                </div>
            </footer>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: "100vh",
        background: "#080809",
        color: "#f0eff5",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "16px",
        overflow: "hidden",
    },
    header: {
        marginBottom: "12px",
        textAlign: "center",
    },
    headerLogo: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 800,
        color: "#8b8a97",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "6px",
    },
    title: {
        fontSize: "18px",
        fontWeight: 700,
        margin: "0 0 4px 0",
        color: "#ffffff",
        letterSpacing: "-0.01em",
    },
    subtitle: {
        fontSize: "12px",
        color: "#8b8a97",
        margin: 0,
    },
    canvasContainer: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        marginBottom: "16px",
    },
    canvasWrapper: {
        position: "relative",
        flex: 1,
        background: "#fafafa",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.05)",
        touchAction: "none",
    },
    baseline: {
        position: "absolute",
        bottom: "30%",
        left: "20px",
        right: "20px",
        borderBottom: "1.5px dashed #cbd5e1",
        pointerEvents: "none",
    },
    canvas: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: "crosshair",
    },
    emptyHint: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    },
    emptyHintText: {
        color: "#94a3b8",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        margin: 0,
        opacity: 0.8,
    },
    footer: {
        marginTop: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    controlsRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "10px",
        padding: "10px 14px",
    },
    colorsStrip: {
        display: "flex",
        gap: "10px",
    },
    colorBtn: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: "2.5px solid transparent",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    strokeSelector: {
        display: "flex",
        gap: "8px",
    },
    strokeBtn: {
        width: "32px",
        height: "32px",
        borderRadius: "6px",
        border: "1px solid transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
    },
    btnSecondary: {
        flex: 1,
        padding: "12px 16px",
        borderRadius: "8px",
        background: "transparent",
        color: "#8b8a97",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s",
    },
    btnPrimary: {
        flex: 2,
        padding: "12px 16px",
        borderRadius: "8px",
        background: "#7c6aff",
        color: "#ffffff",
        border: "none",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s",
    },
    errorMessage: {
        color: "#ef4444",
        fontSize: "12px",
        textAlign: "center",
        margin: "0 0 4px 0",
        fontWeight: 600,
    },
    spinner: {
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.2)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    errorCard: {
        background: "rgba(239, 68, 68, 0.03)",
        border: "1px solid rgba(239, 68, 68, 0.15)",
        borderRadius: "14px",
        padding: "32px 24px",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
        margin: "auto",
        boxSizing: "border-box",
    },
    errorTitle: {
        fontSize: "18px",
        fontWeight: 700,
        color: "#ef4444",
        margin: "0 0 10px 0",
    },
    errorText: {
        fontSize: "13px",
        color: "#8b8a97",
        lineHeight: 1.5,
        margin: 0,
    },
    successCard: {
        background: "rgba(16, 185, 129, 0.03)",
        border: "1px solid rgba(16, 185, 129, 0.15)",
        borderRadius: "16px",
        padding: "40px 24px",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
        margin: "auto",
        boxSizing: "border-box",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    },
    successIconWrapper: {
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px auto",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
    },
    successTitle: {
        fontSize: "20px",
        fontWeight: 800,
        color: "#10b981",
        margin: "0 0 12px 0",
        letterSpacing: "-0.01em",
    },
    successText: {
        fontSize: "13.5px",
        color: "#e2e8f0",
        lineHeight: 1.6,
        margin: "0 0 20px 0",
    },
    divider: {
        height: "1px",
        background: "rgba(255, 255, 255, 0.08)",
        margin: "20px 0",
    },
    subSuccessText: {
        fontSize: "11.5px",
        color: "#8b8a97",
        lineHeight: 1.5,
        margin: 0,
    },
};
