"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface ScratchCardProps {
    scratchPercentageRequired?: number;
    onComplete?: () => void;
    children: React.ReactNode;
}

export default function ScratchCard({
    scratchPercentageRequired = 45,
    onComplete,
    children,
}: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const completedRef = useRef(false);
    const lastScratchRef = useRef<{ x: number; y: number } | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [scratched, setScratched] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 360, height: 188 });
    const [showHint, setShowHint] = useState(true);

    /* ── Responsive sizing ── */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const calc = (w: number) => ({ width: Math.floor(Math.min(w, 420)), height: Math.max(Math.floor(Math.min(w, 420) * 0.52), 150) });
        const ro = new ResizeObserver(([e]) => setDimensions(calc(e.contentRect.width)));
        ro.observe(el);
        setDimensions(calc(el.clientWidth || 360));
        return () => ro.disconnect();
    }, []);

    /* ── Draw scratch surface ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const { width, height } = dimensions;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        /* Base fill */
        ctx.fillStyle = "#7C3AED";
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 14);
        ctx.fill();

        /* Outer border */
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 5;
        ctx.stroke();

        /* Inner rule */
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(8, 8, width - 16, height - 16, 8);
        ctx.stroke();

        /* Subtle dot-grid texture */
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        const gap = 18;
        for (let gx = gap; gx < width - gap; gx += gap) {
            for (let gy = gap; gy < height - gap; gy += gap) {
                ctx.beginPath();
                ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        /* Centre badge */
        const sx = width * 0.5;
        const sy = height * 0.46;
        const sr = Math.min(width, height) * 0.21;

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(sx + 4, sy + 4, sr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${sr * 0.88}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🔒", sx, sy);

        /* Bottom label badge */
        const fs = width < 300 ? 10 : 12;
        const label = "SCRATCH TO REVEAL ⚡";
        ctx.font = `800 ${fs}px "Space Grotesk", system-ui, sans-serif`;
        const tw = ctx.measureText(label).width;
        const bw = tw + 20, bh = fs + 10;
        const bx = (width - bw) / 2;
        const by = height * 0.79;

        /* Badge shadow */
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.roundRect(bx + 3, by + 3, bw, bh, 6);
        ctx.fill();

        /* Badge body */
        ctx.fillStyle = "#FDE047";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, width / 2, by + bh / 2);

    }, [dimensions]);

    /* ── Scratch percentage check ── */
    const checkProgress = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || completedRef.current) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const data = ctx.getImageData(0, 0, dimensions.width, dimensions.height).data;
        let transparent = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] < 20) transparent++;
        const pct = Math.round((transparent / (dimensions.width * dimensions.height)) * 100);
        setProgress(pct);
        if (pct >= scratchPercentageRequired) {
            completedRef.current = true;
            setScratched(true);
            onComplete?.();
        }
    }, [dimensions, scratchPercentageRequired, onComplete]);

    /* ── Coordinate helper ── */
    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const cx = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
        const cy = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
        return {
            x: (cx - rect.left) * (dimensions.width / rect.width),
            y: (cy - rect.top) * (dimensions.height / rect.height),
        };
    };

    /* ── Draw stroke ── */
    const scratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || scratched) return;
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pos = getPos(e);
        if (showHint) setShowHint(false);

        ctx.globalCompositeOperation = "destination-out";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 26, 0, Math.PI * 2);
        ctx.fill();

        if (lastScratchRef.current) {
            ctx.lineWidth = 48;
            ctx.beginPath();
            ctx.moveTo(lastScratchRef.current.x, lastScratchRef.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        lastScratchRef.current = pos;
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        lastScratchRef.current = null;
        scratch(e);
    };
    const handleEnd = () => {
        setIsDrawing(false);
        lastScratchRef.current = null;
        checkProgress();
    };

    /* ── SVG ring ── */
    const ringR = 14, ringC = 2 * Math.PI * ringR, ringS = 38;

    return (
        <div ref={containerRef} style={{ width: "100%", maxWidth: 420, position: "relative", userSelect: "none" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap');

                @keyframes sc-reveal {
                    from { opacity: 0; transform: scale(1.04); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes sc-hint {
                    0%,100% { opacity: 0.55; transform: translate(-50%,-50%) scale(1); }
                    50%     { opacity: 0.9;  transform: translate(-50%,-50%) scale(1.1); }
                }
                @keyframes sc-pop {
                    from { transform: scale(0.5); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
                @keyframes sc-ring-in {
                    from { opacity: 0; transform: scale(0.6); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .sc-reveal   { animation: sc-reveal  0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
                .sc-pop      { animation: sc-pop     0.4s  cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
                .sc-hint     { animation: sc-hint    2s    ease-in-out infinite; }
                .sc-ring-in  { animation: sc-ring-in 0.3s  ease forwards; }
            `}</style>

            {/* Progress ring */}
            {progress > 2 && !scratched && (
                <div className="sc-ring-in" style={{ position: "absolute", top: -12, right: -12, zIndex: 30, pointerEvents: "none" }}>
                    <svg width={ringS} height={ringS} style={{ transform: "rotate(-90deg)", display: "block" }}>
                        <circle cx={ringS / 2} cy={ringS / 2} r={ringR} fill="#fff" stroke="#000" strokeWidth="3.5" />
                        <circle
                            cx={ringS / 2} cy={ringS / 2} r={ringR}
                            fill="none" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round"
                            strokeDasharray={ringC}
                            strokeDashoffset={ringC - (progress / 100) * ringC}
                            style={{ transition: "stroke-dashoffset 0.15s ease" }}
                        />
                    </svg>
                    <span style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        fontWeight: 800, fontSize: 8, color: "#000",
                    }}>
                        {progress}%
                    </span>
                </div>
            )}

            {/* Completed tick */}
            {scratched && (
                <div className="sc-pop" style={{
                    position: "absolute", top: -12, right: -12, zIndex: 30,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "#4ADE80", border: "3px solid #000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "3px 3px 0 #000",
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 800, fontSize: 14, color: "#000",
                    pointerEvents: "none",
                }}>
                    ✓
                </div>
            )}

            {/* Card */}
            <div style={{
                position: "relative", width: "100%",
                aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                borderRadius: 16, background: "#fff",
                border: "3.5px solid #000",
                overflow: "hidden",
                boxShadow: scratched ? "4px 4px 0 #000" : "6px 6px 0 #000",
                transition: "box-shadow 0.3s ease",
            }}>
                {/* Revealed content */}
                <div className={scratched ? "sc-reveal" : ""} style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: 16, textAlign: "center", zIndex: 1,
                }}>
                    {children}
                </div>

                {/* Hint ring */}
                {showHint && !scratched && (
                    <div className="sc-hint" style={{
                        position: "absolute", top: "50%", left: "50%",
                        width: 56, height: 56, borderRadius: "50%",
                        background: "rgba(255,255,255,0.28)",
                        border: "3px solid #000",
                        zIndex: 12, pointerEvents: "none",
                    }} />
                )}

                {/* Scratch canvas */}
                <canvas
                    ref={canvasRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    onMouseDown={handleStart}
                    onMouseMove={scratch}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={scratch}
                    onTouchEnd={handleEnd}
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        zIndex: 10, borderRadius: 13,
                        cursor: scratched ? "default" : "crosshair",
                        touchAction: "none",
                        opacity: scratched ? 0 : 1,
                        transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1)",
                        pointerEvents: scratched ? "none" : "auto",
                    }}
                />
            </div>
        </div>
    );
}