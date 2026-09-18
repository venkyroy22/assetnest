"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Eraser, RotateCcw, Check, PenTool, Palette, PenLine, Type, Image as ImageIcon, Upload as UploadIcon, Trash2, Smartphone, ShieldCheck } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string, color?: string) => void;
    onCancel: () => void;
    defaultTab?: "signature" | "initials" | "stamp";
}

const SIGNATURE_FONTS = [
    { name: "Brussels",   family: "'Alex Brush', cursive" },
    { name: "Classic",    family: "'Dancing Script', cursive" },
    { name: "Script",     family: "'Pacifico', cursive" },
    { name: "Elegant",    family: "'Great Vibes', cursive" },
    { name: "Modern",     family: "'Satisfy', cursive" },
    { name: "Signature",  family: "'Homemade Apple', cursive" },
];

const PRESET_COLORS = [
    { name: "Ink Black",    value: "#0a0a0a" },
    { name: "Royal Blue",   value: "#1a3fbf" },
    { name: "Deep Violet",  value: "#7c6aff" },
    { name: "Crimson",      value: "#c0172b" },
    { name: "Forest Green", value: "#047857" },
];

type PenStyle = "ballpoint" | "fountain" | "marker";

const PEN_STYLES: { id: PenStyle; label: string; desc: string }[] = [
    { id: "ballpoint", label: "Ball",     desc: "Sharp & precise"  },
    { id: "fountain",  label: "Fountain", desc: "Flowing elegance" },
    { id: "marker",    label: "Marker",   desc: "Bold & visible"   },
];

export default function SignaturePad({ onSave, onCancel, defaultTab }: SignaturePadProps) {
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const wrapperRef    = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const ctxRef        = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef  = useRef(false);
    const lastPosRef    = useRef<{x: number, y: number} | null>(null);
    const tabNavRef     = useRef<HTMLElement>(null);
    const tabRefs       = useRef<Record<string, HTMLButtonElement | null>>({ signature: null, initials: null, stamp: null });

    // Main tabs: "signature", "initials", "stamp"
    const [activeTab, setActiveTab] = useState<"signature" | "initials" | "stamp">(defaultTab || "signature");
    
    // Sub tabs: "text", "draw", "upload"
    const [activeSubTab, setActiveSubTab] = useState<"text" | "draw" | "upload">(defaultTab === "stamp" ? "text" : "draw");

    // Unified states
    const [color, setColor] = useState("#1a3fbf");
    
    // Inputs at top
    const [fullName, setFullName] = useState("");
    const [initials, setInitials] = useState("");

    // Drawing options
    const [penStyle,  setPenStyle]  = useState<PenStyle>("ballpoint");
    const [lineWidth, setLineWidth] = useState(3);
    const [mode,      setMode]      = useState<"pen" | "eraser">("pen");
    const [isEmpty,   setIsEmpty]   = useState(true);

    // Type tab selections
    const [fontIdx, setFontIdx] = useState(0);

    // Upload tab state
    const [uploadedImg, setUploadedImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stamp tab state
    const [stampText, setStampText] = useState("");
    const [stampStyle, setStampStyle] = useState<"circular" | "rectangular" | "minimalist">("circular");
    const stampCanvasRef = useRef<HTMLCanvasElement>(null);

    // Undo/Redo history
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);

    // Prefill initials from name if changed and initials is blank
    useEffect(() => {
        if (fullName && !initials) {
            const parts = fullName.trim().split(/\s+/);
            const ini = parts.map(p => p[0]).join("").toUpperCase().slice(0, 3);
            setInitials(ini);
        }
        if (fullName && !stampText) {
            setStampText(fullName);
        }
    }, [fullName]);

    // Mobile pairing states
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isQrZoomed, setIsQrZoomed] = useState(false);

    useEffect(() => {
        if (activeSubTab !== "draw") {
            setSessionId(null);
            setQrCodeDataUrl(null);
            setIsPolling(false);
            return;
        }

        let active = true;
        let pollInterval: NodeJS.Timeout | null = null;

        const initSession = async () => {
            try {
                const res = await fetch("/api/mobile-sign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "init" }),
                });
                if (!res.ok) throw new Error("Failed to init mobile session");
                const data = await res.json();
                if (!active) return;

                const sessId = data.sessionId;
                setSessionId(sessId);

                // Dynamically import qrcode to avoid client bundle or SSR issues
                const QRCode = (await import("qrcode")).default;
                const origin = window.location.origin;
                const mobileUrl = `${origin}/tools/pdf-signer/mobile-sign?sessionId=${sessId}`;
                const dataUrl = await QRCode.toDataURL(mobileUrl, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: "#0a0a0a",
                        light: "#ffffff",
                    },
                });
                if (!active) return;
                setQrCodeDataUrl(dataUrl);

                // Start polling
                setIsPolling(true);
                pollInterval = setInterval(async () => {
                    if (!active) return;
                    try {
                        const pollRes = await fetch(`/api/mobile-sign?sessionId=${sessId}`);
                        if (!pollRes.ok) return;
                        const pollData = await pollRes.json();
                        if (!active) return;

                        if (pollData.status === "completed" && pollData.signature) {
                            // Signature received!
                            clearInterval(pollInterval!);
                            setIsPolling(false);
                            
                            const img = new Image();
                            img.onload = () => {
                                const canvas = canvasRef.current;
                                const ctx = ctxRef.current;
                                if (canvas && ctx) {
                                    // Clear canvas first
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    
                                    // Draw the image center aligned
                                    const scale = Math.min((canvas.width / 2) / img.width, (canvas.height / 2) / img.height, 1);
                                    const w = img.width * scale;
                                    const h = img.height * scale;
                                    
                                    const rect = canvas.getBoundingClientRect();
                                    const cw = rect.width;
                                    const ch = rect.height;
                                    const clientScale = Math.min((cw * 0.8) / img.width, (ch * 0.8) / img.height, 1);
                                    const cx = (cw - img.width * clientScale) / 2;
                                    const cy = (ch - img.height * clientScale) / 2;
                                    ctx.drawImage(img, cx, cy, img.width * clientScale, img.height * clientScale);
                                    
                                    setIsEmpty(false);
                                    
                                    // Save history snapshot
                                    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                    setHistory(prev => {
                                        const next = prev.slice(0, historyIdx + 1);
                                        next.push(snapshot);
                                        if (next.length > 30) next.shift();
                                        return next;
                                    });
                                    setHistoryIdx(prev => Math.min(prev + 1, 29));
                                }
                            };
                            img.src = pollData.signature;
                        }
                    } catch (err) {
                        console.error("Polling error:", err);
                    }
                }, 1500);

            } catch (err) {
                console.error("Mobile sign init error:", err);
            }
        };

        initSession();

        return () => {
            active = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [activeSubTab]);


    const saveSnapshot = useCallback(() => {
        if (!ctxRef.current || !canvasRef.current) return;
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            const next = prev.slice(0, historyIdx + 1);
            next.push(snapshot);
            if (next.length > 30) next.shift(); // Max 30 undo steps
            return next;
        });
        setHistoryIdx(prev => Math.min(prev + 1, 29));
    }, [historyIdx]);

    const undo = useCallback(() => {
        if (historyIdx < 0 || !ctxRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        
        const nextIdx = historyIdx - 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (nextIdx >= 0) {
            ctx.putImageData(history[nextIdx], 0, 0);
            setIsEmpty(false);
        } else {
            setIsEmpty(true);
        }
        setHistoryIdx(nextIdx);
    }, [history, historyIdx]);

    const redo = useCallback(() => {
        if (historyIdx >= history.length - 1 || !ctxRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        
        const nextIdx = historyIdx + 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(history[nextIdx], 0, 0);
        
        setHistoryIdx(nextIdx);
        setIsEmpty(false);
    }, [history, historyIdx]);

    // Keyboard shortcuts for draw tab
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (activeSubTab !== "draw") return;
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, [activeSubTab, undo, redo]);

    /* ── Canvas bootstrap with ResizeObserver ── */
    useEffect(() => {
        if (activeSubTab !== "draw") return;
        const canvas  = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w   = wrapper.clientWidth;
            const h   = wrapper.clientHeight;

            // Preserve existing drawing
            const tmp = document.createElement("canvas");
            tmp.width  = canvas.width;
            tmp.height = canvas.height;
            const tmpCtx = tmp.getContext("2d");
            if (tmpCtx && canvas.width > 0 && canvas.height > 0) {
                tmpCtx.drawImage(canvas, 0, 0);
            }

            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width  = `${w}px`;
            canvas.style.height = `${h}px`;

            const ctx = canvas.getContext("2d")!;
            ctx.scale(dpr, dpr);
            ctx.lineCap  = "round";
            ctx.lineJoin = "round";
            if (canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(tmp, 0, 0, w, h);
            }
            ctxRef.current = ctx;
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);
        return () => ro.disconnect();
    }, [activeTab, activeSubTab]);

    /* ── Stamp rendering canvas ── */
    const drawStamp = useCallback(() => {
        const canvas = stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const text = stampText || "ACME CORPORATION";
        const themeColor = color || "#4db8d4";

        ctx.clearRect(0, 0, 400, 400);

        if (stampStyle === "circular") {
            ctx.save();
            ctx.strokeStyle = themeColor;
            ctx.fillStyle = themeColor;
            
            // Outer circle
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(200, 200, 160, 0, Math.PI * 2);
            ctx.stroke();

            // Inner thin circle
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(200, 200, 140, 0, Math.PI * 2);
            ctx.stroke();

            // Curved text top
            ctx.font = "bold 18px 'Montserrat', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const chars = text.toUpperCase().split("");
            const angleSpan = Math.PI * 1.25;
            const startAngle = -Math.PI / 2 - angleSpan / 2;
            const angleStep = angleSpan / Math.max(chars.length - 1, 1);

            chars.forEach((char, idx) => {
                const angle = startAngle + idx * angleStep;
                ctx.save();
                ctx.translate(200 + Math.cos(angle) * 114, 200 + Math.sin(angle) * 114);
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillText(char, 0, 0);
                ctx.restore();
            });

            // Center SEAL
            ctx.font = "bold 26px 'Montserrat', sans-serif";
            ctx.fillText("OFFICIAL SEAL", 200, 175);

            // Divider
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(90, 205);
            ctx.lineTo(310, 205);
            ctx.stroke();

            // Date
            const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
            ctx.font = "bold 16px 'Montserrat', sans-serif";
            ctx.fillText(dateStr.toUpperCase(), 200, 235);

            ctx.restore();
        } else if (stampStyle === "rectangular") {
            ctx.save();
            ctx.strokeStyle = themeColor;
            ctx.fillStyle = themeColor;
            
            // Outer thick rectangle
            ctx.lineWidth = 6;
            ctx.strokeRect(40, 100, 320, 200);

            // Inner thin rectangle
            ctx.lineWidth = 2;
            ctx.strokeRect(52, 112, 296, 176);

            // Stamp Text
            ctx.font = "bold 26px 'Montserrat', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text.toUpperCase(), 200, 160);

            // Divider
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(65, 200);
            ctx.lineTo(335, 200);
            ctx.stroke();

            // Header
            ctx.font = "bold 20px 'Montserrat', sans-serif";
            ctx.fillText("APPROVED AGREEMENT", 200, 230);

            // Date
            const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
            ctx.font = "16px 'Montserrat', sans-serif";
            ctx.fillText(dateStr.toUpperCase(), 200, 260);

            ctx.restore();
        } else {
            // Minimalist
            ctx.save();
            ctx.strokeStyle = themeColor;
            ctx.fillStyle = themeColor;

            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(50, 130);
            ctx.lineTo(350, 130);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(50, 270);
            ctx.lineTo(350, 270);
            ctx.stroke();

            ctx.font = "bold 32px 'Montserrat', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text.toUpperCase(), 200, 175);

            ctx.font = "500 18px 'Montserrat', sans-serif";
            ctx.fillText("VALIDATED STAMP", 200, 225);

            ctx.restore();
        }
    }, [stampText, stampStyle, color]);

    useEffect(() => {
        if (activeTab === "stamp" && activeSubTab === "text") {
            const timer = setTimeout(drawStamp, 50);
            return () => clearTimeout(timer);
        }
    }, [activeTab, activeSubTab, drawStamp]);

    /* ── Coordinate helpers ── */
    const getXY = (e: React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    /* ── Apply pen styles ── */
    const setupCtx = (ctx: CanvasRenderingContext2D) => {
        if (mode === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth  = lineWidth * 8;
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            switch (penStyle) {
                case "fountain":
                    ctx.lineWidth   = lineWidth;
                    ctx.shadowColor = color;
                    ctx.shadowBlur  = 3;
                    ctx.globalAlpha = 0.93;
                    break;
                case "marker":
                    ctx.lineWidth   = lineWidth * 2.2;
                    ctx.shadowBlur  = 0;
                    ctx.globalAlpha = 0.75;
                    break;
                default:
                    ctx.lineWidth   = lineWidth;
                    ctx.shadowBlur  = 0;
                    ctx.globalAlpha = 1;
            }
        }
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
        
        ctxRef.current.shadowBlur  = 0;
        ctxRef.current.globalAlpha = 1;
        lastPosRef.current = null;
        saveSnapshot();
    };

    const clear = () => {
        if (activeSubTab === "draw") {
            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
            setHistory([]);
            setHistoryIdx(-1);
        } else if (activeSubTab === "text") {
            if (activeTab === "signature") setFullName("");
            else if (activeTab === "initials") setInitials("");
            else setStampText("");
        } else {
            setUploadedImg(null);
        }
    };

    const handleSave = async () => {
        if (activeSubTab === "text") {
            if (activeTab === "signature" && fullName) {
                const canvas = document.createElement("canvas");
                canvas.width = 1200; canvas.height = 400;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = color;
                ctx.font = `120px ${SIGNATURE_FONTS[fontIdx].family}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(fullName, 600, 200);
                cropAndSave(canvas);
            } else if (activeTab === "initials" && initials) {
                const canvas = document.createElement("canvas");
                canvas.width = 1200; canvas.height = 400;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = color;
                ctx.font = `180px ${SIGNATURE_FONTS[fontIdx].family}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(initials.toUpperCase(), 600, 200);
                cropAndSave(canvas);
            } else if (activeTab === "stamp" && stampText) {
                const canvas = stampCanvasRef.current;
                if (canvas) cropAndSave(canvas);
            }
        } else if (activeSubTab === "upload" && uploadedImg) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width; canvas.height = img.height;
                canvas.getContext("2d")?.drawImage(img, 0, 0);
                cropAndSave(canvas);
            };
            img.src = uploadedImg;
        } else if (activeSubTab === "draw") {
            const canvas = canvasRef.current;
            if (!canvas || isEmpty) return;
            cropAndSave(canvas);
        }
    };

    const cropAndSave = (canvas: HTMLCanvasElement) => {
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
            onSave(canvas.toDataURL("image/png"), color); return;
        }
        
        const pad = 20;
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
        const cropW = maxX - minX; const cropH = maxY - minY;
        
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW; cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d")!;
        cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
        onSave(cropCanvas.toDataURL("image/png"), color);
    };

    const isCustomColor = !PRESET_COLORS.find(c => c.value === color);

    // Dynamic underline position from tab refs
    const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({ left: 16, width: 95 });

    useEffect(() => {
        const btn = tabRefs.current[activeTab];
        const nav = tabNavRef.current;
        if (btn && nav) {
            const navRect = nav.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            setUnderlineStyle({
                left: btnRect.left - navRect.left,
                width: btnRect.width,
            });
        }
    }, [activeTab]);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
        }}>
            {/* Backdrop */}
            <div 
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(4px)",
                }} 
                onClick={onCancel} 
            />

            {/* Local Stylesheet Injection for transitions/micro-animations */}
            <style>{`
                .modal-input {
                    width: 100%;
                    background: #2a2a2a;
                    border: 1px solid #555555;
                    border-radius: 4px;
                    padding: 8px 12px;
                    color: #cccccc;
                    font-size: 13px;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.15s ease;
                    box-shadow: none;
                }
                .modal-input:focus {
                    border-color: #4db8d4;
                    background: #2e2e2e;
                    box-shadow: none;
                }
                .modal-input::placeholder {
                    color: #666666;
                }
                .tab-button {
                    position: relative;
                    padding: 10px 16px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #888888;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: color 0.15s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .tab-button:hover {
                    color: #cccccc;
                }
                .tab-button.active {
                    color: #4db8d4;
                }
                .subtab-button {
                    width: 36px;
                    height: 36px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #888888;
                    background: #2a2a2a;
                    border: 1px solid #555555;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .subtab-button:hover {
                    color: #cccccc;
                    background: #3a3a3a;
                    border-color: #777777;
                }
                .subtab-button.active {
                    color: #1a1a1a;
                    background: #4db8d4;
                    border-color: #4db8d4;
                    box-shadow: none;
                }
                .cursive-list {
                    max-height: 240px;
                    overflow-y: auto;
                    overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    scrollbar-color: #555555 transparent;
                    display: flex;
                    flex-direction: column;
                    padding-right: 6px;
                }
                .cursive-list::-webkit-scrollbar {
                    width: 4px;
                }
                .cursive-list::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 2px;
                }
                .cursive-list::-webkit-scrollbar-thumb {
                    background: #555555;
                    border-radius: 2px;
                }
                .cursive-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    border-bottom: 1px solid #333333;
                    cursor: pointer;
                    transition: all 0.15s;
                    border-radius: 4px;
                    background: #2a2a2a;
                }
                .cursive-row:hover {
                    background: #333333;
                }
                .cursive-row.selected {
                    background: #383838;
                    border: 1px solid #4db8d4 !important;
                }
                .cancel-btn:hover {
                    color: #ffffff;
                    background: #444444;
                    border-color: #666666;
                }
                .apply-btn:hover:not(:disabled) {
                    background: #3ba2bd !important;
                    transform: none;
                    box-shadow: none !important;
                }
                .apply-btn:active:not(:disabled) {
                    transform: none;
                    box-shadow: none !important;
                }
                .apply-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    box-shadow: none !important;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes laser {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .laser-line {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #4db8d4;
                    box-shadow: 0 0 6px rgba(77,184,212,0.6);
                    animation: laser 3s infinite linear;
                    z-index: 5;
                }
                .stamp-style-card {
                    border: 1px solid #555555;
                    background: #2a2a2a;
                    border-radius: 4px;
                    padding: 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.15s;
                    color: #888888;
                    font-size: 11px;
                    font-weight: 500;
                    box-shadow: none;
                }
                .stamp-style-card:hover {
                    background: #333333;
                    color: #cccccc;
                }
                .stamp-style-card.selected {
                    border-color: #4db8d4;
                    background: #383838;
                    color: #4db8d4;
                    box-shadow: none;
                }
                @media (max-width: 768px) {
                    .modal-box {
                        padding: 16px !important;
                        height: 100vh !important;
                        max-height: 100vh !important;
                        border-radius: 0 !important;
                        border: none !important;
                    }
                    .modal-inputs-section {
                        flex-direction: column !important;
                        gap: 10px !important;
                        margin-bottom: 12px !important;
                    }
                    .modal-workspace-container {
                        gap: 12px !important;
                    }
                    .qr-dock {
                        display: none !important;
                    }
                    .tab-button {
                        padding: 10px 12px !important;
                        font-size: 12px !important;
                        gap: 4px !important;
                        flex: 1;
                        justify-content: center;
                    }
                    .subtab-button {
                        width: 38px !important;
                        height: 38px !important;
                    }
                    .stamp-workspace {
                        flex-direction: column !important;
                        gap: 16px !important;
                        overflow-y: auto !important;
                    }
                    .modal-footer {
                        flex-direction: column !important;
                        gap: 12px !important;
                        align-items: stretch !important;
                    }
                    .modal-footer-text {
                        display: none !important;
                    }
                }
                .mobile-qr-pill:hover {
                    background: #3ba2bd !important;
                    transform: none;
                }
                .mobile-qr-pill:active {
                    transform: scale(0.97);
                }
                @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@600&family=Great+Vibes&family=Homemade+Apple&family=Pacifico&family=Satisfy&family=Montserrat:wght@500;700;800&display=swap');
            `}</style>

            {/* Modal Box */}
            <div className="modal-box" style={{
                position: "relative",
                width: "100%",
                maxWidth: "920px",
                height: "620px",
                maxHeight: "90vh",
                background: "#333333",
                border: "1px solid #555555",
                borderRadius: "8px",
                padding: "24px 28px",
                boxSizing: "border-box",
                boxShadow: "0 24px 64px rgba(0, 0, 0, 0.7)",
                display: "flex",
                flexDirection: "column",
                zIndex: 100000,
                overflow: "hidden",
            }}>

                {/* ── HEADER ── */}
                <header style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}>
                    <h2 style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#cccccc",
                        letterSpacing: "normal",
                        margin: 0,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}>Set your signature details</h2>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={onCancel}
                            style={{
                                cursor: "pointer",
                                border: "1px solid #555555",
                                background: "#2a2a2a",
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                color: "#aaa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                            }}
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                {/* ── SIDE-BY-SIDE NAME INPUTS ── */}
                <section className="modal-inputs-section" style={{
                    display: "flex",
                    gap: "20px",
                    marginBottom: "20px",
                }}>
                    <div style={{ flex: 1.7, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#999999",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}>Full Name</label>
                        <input
                            type="text"
                            className="modal-input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Type your full name..."
                        />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#999999",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}>Initials</label>
                        <input
                            type="text"
                            className="modal-input"
                            value={initials}
                            onChange={(e) => setInitials(e.target.value)}
                            placeholder="e.g. JD"
                        />
                    </div>
                </section>

                {/* ── MODAL TAB BAR ── */}
                <nav ref={tabNavRef} style={{
                    position: "relative",
                    display: "flex",
                    borderBottom: "1px solid #444444",
                    marginBottom: "16px",
                    paddingBottom: "1px",
                }}>
                    <button
                        ref={el => { tabRefs.current.signature = el; }}
                        onClick={() => { setActiveTab("signature"); setActiveSubTab("draw"); }}
                        className={`tab-button ${activeTab === "signature" ? "active" : ""}`}
                    >
                        <PenLine size={14} />
                        <span>Signature</span>
                    </button>
                    <button
                        ref={el => { tabRefs.current.initials = el; }}
                        onClick={() => { setActiveTab("initials"); setActiveSubTab("draw"); }}
                        className={`tab-button ${activeTab === "initials" ? "active" : ""}`}
                    >
                        <Type size={14} />
                        <span>Initials</span>
                    </button>
                    <button
                        ref={el => { tabRefs.current.stamp = el; }}
                        onClick={() => { setActiveTab("stamp"); setActiveSubTab("text"); }}
                        className={`tab-button ${activeTab === "stamp" ? "active" : ""}`}
                    >
                        <ShieldCheck size={14} />
                        <span>Company Stamp</span>
                    </button>

                    {/* Smooth sliding underline */}
                    <div 
                        style={{
                            position: "absolute",
                            bottom: 0,
                            height: "2px",
                            background: "#4db8d4",
                            borderRadius: "2px 2px 0 0",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            left: underlineStyle.left,
                            width: underlineStyle.width,
                        }} 
                    />
                </nav>

                {/* ── SUB-VIEWS CONTAINER (WITH LEFT ICON STRIP) ── */}
                <div className="modal-workspace-container" style={{
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                    marginBottom: "20px",
                    gap: "24px",
                }}>
                    {/* LEFT VERTICAL ICON STRIP */}
                    <aside style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        borderRight: "1px solid #444444",
                        paddingRight: "16px",
                    }}>
                        <button
                            onClick={() => setActiveSubTab("text")}
                            className={`subtab-button ${activeSubTab === "text" ? "active" : ""}`}
                            title="Type Text Preset"
                        >
                            <Type size={20} />
                        </button>
                        <button
                            onClick={() => setActiveSubTab("draw")}
                            className={`subtab-button ${activeSubTab === "draw" ? "active" : ""}`}
                            title="Draw Freehand"
                        >
                            <PenTool size={20} />
                        </button>
                        <button
                            onClick={() => setActiveSubTab("upload")}
                            className={`subtab-button ${activeSubTab === "upload" ? "active" : ""}`}
                            title="Upload Image File"
                        >
                            <UploadIcon size={20} />
                        </button>
                    </aside>

                    {/* MAIN WORKSPACE CONTENT */}
                    <main style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        minHeight: 0,
                    }}>
                        {/* 1. TYPE (TEXT PRESET) SUB-VIEW */}
                        {activeSubTab === "text" && (
                            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                {activeTab === "stamp" ? (
                                    /* STAMP MAKER INNER VIEW */
                                    <div className="stamp-workspace" style={{ display: "flex", gap: "24px", flex: 1, minHeight: 0 }}>
                                        {/* Configuration */}
                                        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Stamp Text</label>
                                                <input
                                                    type="text"
                                                    className="modal-input"
                                                    value={stampText}
                                                    onChange={(e) => setStampText(e.target.value)}
                                                    placeholder="Company Name..."
                                                />
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Stamp Layout</label>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                                    <div 
                                                        className={`stamp-style-card ${stampStyle === "circular" ? "selected" : ""}`}
                                                        onClick={() => setStampStyle("circular")}
                                                    >
                                                        Circular Classic
                                                    </div>
                                                    <div 
                                                        className={`stamp-style-card ${stampStyle === "rectangular" ? "selected" : ""}`}
                                                        onClick={() => setStampStyle("rectangular")}
                                                    >
                                                        Rectangular Bold
                                                    </div>
                                                    <div 
                                                        className={`stamp-style-card ${stampStyle === "minimalist" ? "selected" : ""}`}
                                                        onClick={() => setStampStyle("minimalist")}
                                                    >
                                                        Minimal Line
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Circular Swatches Bar inside Stamp */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
                                                <label style={{ fontSize: "9px", fontWeight: 800, color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Stamp Ink Color</label>
                                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                    {PRESET_COLORS.map(c => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => setColor(c.value)}
                                                            style={{
                                                                width: "24px",
                                                                height: "24px",
                                                                borderRadius: "50%",
                                                                background: c.value,
                                                                border: color === c.value ? "2px solid #4db8d4" : "2px solid transparent",
                                                                cursor: "pointer",
                                                                transition: "all 0.2s",
                                                                transform: color === c.value ? "scale(1.15)" : "scale(1)",
                                                                boxShadow: "none",
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stamp Preview Area */}
                                        <div style={{
                                            flex: 1,
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px dashed rgba(255, 255, 255, 0.08)",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}>
                                            <div style={{
                                                position: "absolute",
                                                inset: 0,
                                                backgroundImage: "linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)",
                                                backgroundSize: "20px 20px",
                                                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
                                                opacity: 0.25,
                                            }} />
                                            <canvas
                                                ref={stampCanvasRef}
                                                width={400}
                                                height={400}
                                                style={{
                                                    width: "190px",
                                                    height: "190px",
                                                    objectFit: "contain",
                                                    zIndex: 2,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* SIGNATURE/INITIALS TEXT PRESET LIST */
                                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                        <div 
                                             className="cursive-list" 
                                             data-lenis-prevent="true"
                                             style={{ 
                                                 maxHeight: "240px", 
                                                 overflowY: "auto",
                                                 overscrollBehavior: "contain",
                                                 WebkitOverflowScrolling: "touch",
                                                 flex: 1 
                                             }}
                                         >
                                            {SIGNATURE_FONTS.map((font, idx) => {
                                                const displayText = activeTab === "initials" 
                                                    ? (initials || "Initials") 
                                                    : (fullName || "Signature");
                                                const selected = fontIdx === idx;
                                                return (
                                                    <div
                                                        key={font.name}
                                                        className={`cursive-row ${selected ? "selected" : ""}`}
                                                        style={{
                                                            border: selected ? "1px solid rgba(124,106,255,0.15)" : "none",
                                                            borderBottom: selected ? "1px solid rgba(124,106,255,0.15)" : "1px solid rgba(255,255,255,0.04)"
                                                        }}
                                                        onClick={() => setFontIdx(idx)}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                                                            {/* Radio Button */}
                                                            <div style={{
                                                                width: "18px",
                                                                height: "18px",
                                                                borderRadius: "50%",
                                                                border: `2px solid ${selected ? "#4db8d4" : "#555555"}`,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "all 0.2s",
                                                                background: "transparent",
                                                            }}>
                                                                {selected && (
                                                                    <div style={{
                                                                        width: "8px",
                                                                        height: "8px",
                                                                        borderRadius: "50%",
                                                                        background: "#4db8d4",
                                                                    }} />
                                                                )}
                                                            </div>

                                                            {/* Preview */}
                                                            <div style={{
                                                                fontSize: activeTab === "initials" ? "34px" : "28px",
                                                                color: color,
                                                                fontFamily: font.family,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                flex: 1,
                                                            }}>
                                                                {displayText}
                                                            </div>
                                                        </div>

                                                        {/* Font label */}
                                                        <span style={{
                                                            fontSize: "10px",
                                                            fontWeight: 700,
                                                            color: selected ? "#4db8d4" : "#888888",
                                                            letterSpacing: "0.05em",
                                                            background: selected ? "rgba(77,184,212,0.1)" : "#222222",
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                        }}>{font.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Presets color swatches */}
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginTop: "16px",
                                            borderTop: "1px solid rgba(255,255,255,0.05)",
                                            paddingTop: "16px",
                                        }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#999999", marginRight: "6px" }}>Ink Color:</span>
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setColor(c.value)}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        background: c.value,
                                                        border: color === c.value ? "2px solid #4db8d4" : "2px solid transparent",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s",
                                                        transform: color === c.value ? "scale(1.15)" : "scale(1)",
                                                        boxShadow: "none",
                                                    }}
                                                />
                                            ))}
                                            <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)", margin: "0 6px" }} />
                                            <div 
                                                style={{ 
                                                    position: "relative", 
                                                    width: "24px", 
                                                    height: "24px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                <button
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        borderRadius: "50%",
                                                        background: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)",
                                                        border: isCustomColor ? "2px solid #4db8d4" : "2px solid transparent",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        transform: isCustomColor ? "scale(1.15)" : "scale(1)",
                                                        pointerEvents: "none",
                                                    }}
                                                    title="Custom Color"
                                                >
                                                    <Palette size={12} style={{ color: "#fff" }} />
                                                </button>
                                                <input 
                                                    ref={colorInputRef} 
                                                    type="color" 
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        opacity: 0,
                                                        cursor: "pointer",
                                                        padding: 0,
                                                        border: "none",
                                                    }}
                                                    value={color}
                                                    onChange={e => setColor(e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. DRAW FREEHAND SUB-VIEW */}
                        {activeSubTab === "draw" && (
                            <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: 0 }}>
                                {/* Canvas Main area */}
                                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                    <div
                                        ref={wrapperRef}
                                        style={{
                                            position: "relative",
                                            flex: 1,
                                            background: "#ffffff",
                                            border: "1px solid #555555",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            cursor: "crosshair",
                                            touchAction: "none",
                                        }}
                                    >
                                        {/* Paper baseline */}
                                        <div style={{
                                            position: "absolute",
                                            bottom: "28%",
                                            left: "24px",
                                            right: "24px",
                                            borderBottom: "1px dashed #cccccc",
                                            pointerEvents: "none",
                                        }} />
                                        <canvas
                                            ref={canvasRef}
                                            style={{ position: "absolute", inset: 0 }}
                                            onPointerDown={onPointerDown}
                                            onPointerMove={onPointerMove}
                                            onPointerUp={onPointerUp}
                                            onPointerLeave={onPointerUp}
                                        />
                                        {/* Floating Mobile Sign Option */}
                                        {qrCodeDataUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setIsQrZoomed(true)}
                                                className="mobile-qr-pill"
                                                style={{
                                                    position: "absolute",
                                                    top: "12px",
                                                    right: "12px",
                                                    zIndex: 10,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "6px 12px",
                                                    background: "#4db8d4",
                                                    color: "#1a1a1a",
                                                    border: "1px solid #4db8d4",
                                                    borderRadius: "3px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <Smartphone size={12} />
                                                <span>Draw on Mobile</span>
                                            </button>
                                        )}
                                        {isEmpty && (
                                            <div style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                pointerEvents: "none",
                                                userSelect: "none",
                                            }}>
                                                <p style={{
                                                    color: "#777777",
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.15em",
                                                    margin: 0,
                                                }}>Draw your signature here</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Draw controls bar under canvas */}
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "12px 8px",
                                        marginTop: "12px",
                                    }}>
                                        {/* Styles Picker & Color Presets */}
                                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                            <div style={{ display: "flex", gap: "4px" }}>
                                                {PEN_STYLES.map(s => {
                                                    const active = mode === "pen" && penStyle === s.id;
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => { setPenStyle(s.id); setMode("pen"); }}
                                                            style={{
                                                                padding: "4px 8px",
                                                                borderRadius: "3px",
                                                                fontSize: "10px",
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                background: active ? "#3a3a3a" : "#2a2a2a",
                                                                border: `1px solid ${active ? "#4db8d4" : "#555555"}`,
                                                                color: active ? "#4db8d4" : "#999999",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setMode("eraser")}
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        background: mode === "eraser" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.02)",
                                                        border: `1px solid ${mode === "eraser" ? "#ef4444" : "rgba(255,255,255,0.06)"}`,
                                                        color: mode === "eraser" ? "#ef4444" : "#999999",
                                                        cursor: "pointer",
                                                        marginLeft: "6px",
                                                    }}
                                                >
                                                    Eraser
                                                </button>
                                            </div>

                                            <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />

                                            {/* Colors */}
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => { setColor(c.value); setMode("pen"); }}
                                                        style={{
                                                            width: "16px",
                                                            height: "16px",
                                                            borderRadius: "50%",
                                                            background: c.value,
                                                            border: color === c.value && mode === "pen" ? "2px solid #4db8d4" : "1px solid #555555",
                                                            cursor: "pointer",
                                                            transform: color === c.value && mode === "pen" ? "scale(1.1)" : "scale(1)",
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />

                                            {/* Pen Size */}
                                            <div style={{ display: "flex", gap: "4px" }}>
                                                {[2, 3, 5, 8].map(w => {
                                                    const active = mode === "pen" && lineWidth === w;
                                                    return (
                                                        <button
                                                            key={w}
                                                            onClick={() => { setLineWidth(w); setMode("pen"); }}
                                                            style={{
                                                                padding: "3px 6px",
                                                                borderRadius: "3px",
                                                                fontSize: "9px",
                                                                fontWeight: 800,
                                                                background: active ? "#3a3a3a" : "#2a2a2a",
                                                                border: `1px solid ${active ? "#4db8d4" : "#555555"}`,
                                                                color: active ? "#4db8d4" : "#999999",
                                                                cursor: "pointer",
                                                                transition: "all 0.15s",
                                                            }}
                                                            title={`Pen Size ${w}px`}
                                                        >
                                                            {w}px
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Undo/Redo & Trash */}
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            <button
                                                onClick={undo}
                                                disabled={historyIdx < 0}
                                                style={{
                                                    background: "#2a2a2a",
                                                    border: "1px solid #555555",
                                                    padding: "5px 8px",
                                                    borderRadius: "3px",
                                                    color: "#999999",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    opacity: historyIdx < 0 ? 0.3 : 1,
                                                }}
                                                title="Undo (Ctrl+Z)"
                                            >
                                                <RotateCcw size={12} style={{ transform: "scaleX(-1)" }} />
                                            </button>
                                            <button
                                                onClick={redo}
                                                disabled={historyIdx >= history.length - 1}
                                                style={{
                                                    background: "#2a2a2a",
                                                    border: "1px solid #555555",
                                                    padding: "5px 8px",
                                                    borderRadius: "3px",
                                                    color: "#999999",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    opacity: historyIdx >= history.length - 1 ? 0.3 : 1,
                                                }}
                                                title="Redo (Ctrl+Shift+Z)"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                            <button
                                                onClick={clear}
                                                disabled={isEmpty}
                                                style={{
                                                    background: "#2a2a2a",
                                                    border: "1px solid #555555",
                                                    padding: "5px 8px",
                                                    borderRadius: "3px",
                                                    color: "#cc4444",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    opacity: isEmpty ? 0.3 : 1,
                                                }}
                                                title="Clear Canvas"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code MOBILE DOCK PANEL */}
                                <div 
                                    className="qr-dock"
                                    style={{
                                        width: "180px",
                                        background: "#2a2a2a",
                                        border: "1px solid #555555",
                                        borderRadius: "4px",
                                        padding: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textAlign: "center",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <Smartphone size={18} style={{ color: "#4db8d4", marginBottom: "6px" }} />
                                    <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#cccccc", margin: "0 0 4px 0" }}>Draw on mobile</h4>
                                    <p style={{ fontSize: "9.5px", color: "#999999", margin: "0 0 14px 0", lineHeight: 1.4 }}>
                                        {qrCodeDataUrl ? "Scan this QR code to draw directly on your smartphone." : "Generating secure signature link..."}
                                    </p>
                                    
                                    {/* Masterpiece QR Code */}
                                    <div 
                                        onClick={() => qrCodeDataUrl && setIsQrZoomed(true)}
                                        style={{
                                            position: "relative",
                                            width: "110px",
                                            height: "110px",
                                            background: "#ffffff",
                                            borderRadius: "8px",
                                            padding: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                            overflow: "hidden",
                                            boxSizing: "border-box",
                                            cursor: qrCodeDataUrl ? "pointer" : "default",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={e => { if (qrCodeDataUrl) e.currentTarget.style.transform = "scale(1.05)"; }}
                                        onMouseLeave={e => { if (qrCodeDataUrl) e.currentTarget.style.transform = "scale(1)"; }}
                                        title="Click to enlarge"
                                    >
                                        {qrCodeDataUrl ? (
                                            <>
                                                {/* Scanner Laser effect */}
                                                <div className="laser-line" />
                                                <img 
                                                    src={qrCodeDataUrl} 
                                                    alt="Scan to sign"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "contain",
                                                        zIndex: 2,
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <div style={{
                                                width: "24px",
                                                height: "24px",
                                                border: "2px solid rgba(124, 106, 255, 0.1)",
                                                borderTopColor: "#4db8d4",
                                                borderRadius: "50%",
                                                animation: "spin 1.5s linear infinite",
                                            }} />
                                        )}
                                    </div>

                                    {qrCodeDataUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setIsQrZoomed(true)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#4db8d4",
                                                fontSize: "9px",
                                                fontWeight: 800,
                                                letterSpacing: "0.04em",
                                                textTransform: "uppercase",
                                                marginTop: "8px",
                                                cursor: "pointer",
                                                transition: "opacity 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                        >
                                            🔍 View Full Size
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. UPLOAD IMAGE FILE SUB-VIEW */}
                        {activeSubTab === "upload" && (
                            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifySelf: "center", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                                {!uploadedImg ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: "100%",
                                            maxWidth: "500px",
                                            height: "220px",
                                            borderRadius: "8px",
                                            border: "2px dashed rgba(255, 255, 255, 0.12)",
                                            background: "rgba(255, 255, 255, 0.008)",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "14px",
                                            transition: "all 0.2s",
                                            boxSizing: "border-box",
                                            padding: "24px",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "rgba(124, 106, 255, 0.4)";
                                            e.currentTarget.style.background = "rgba(124, 106, 255, 0.01)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.008)";
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (re) => setUploadedImg(re.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "10px",
                                            background: "rgba(255, 255, 255, 0.04)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#999999",
                                        }}>
                                            <UploadIcon size={22} />
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#cccccc", display: "block", marginBottom: "4px" }}>Select Signature Image</span>
                                            <span style={{ fontSize: "10.5px", color: "#999999", display: "block", lineHeight: 1.4 }}>Supports PNG, JPG, or SVG up to 5MB. For best results, use a clean image with high contrast.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "12px", minHeight: 0 }}>
                                        <div style={{
                                            position: "relative",
                                            height: "200px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(255, 255, 255, 0.06)",
                                            background: "rgba(255, 255, 255, 0.015)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "24px",
                                            boxSizing: "border-box",
                                        }}>
                                            <img 
                                                src={uploadedImg} 
                                                alt="uploaded signature preview" 
                                                style={{
                                                    maxHeight: "100%",
                                                    maxWidth: "100%",
                                                    objectFit: "contain",
                                                    filter: "contrast(1.1)",
                                                }} 
                                            />
                                            <button
                                                onClick={() => setUploadedImg(null)}
                                                style={{
                                                    position: "absolute",
                                                    top: "12px",
                                                    right: "12px",
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "50%",
                                                    background: "rgba(239, 68, 68, 0.15)",
                                                    border: "1px solid rgba(239, 68, 68, 0.25)",
                                                    color: "#ef4444",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <span style={{ fontSize: "10px", color: "#999999", textAlign: "center", lineHeight: 1.4 }}>
                                            Tip: Transparent background PNG with dark ink yields optimal vector overlays.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>

                {/* ── STICKY FOOTER ── */}
                <footer className="modal-footer" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #444444",
                    paddingTop: "16px",
                    marginTop: "auto",
                }}>
                    <span className="modal-footer-text" style={{ fontSize: "11.5px", color: "#999999", display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} style={{ color: "#4db8d4" }} />
                        {activeTab === "signature" && "Legally binding electronic signature"}
                        {activeTab === "initials" && "Personalized initials verification block"}
                        {activeTab === "stamp" && "Corporate stamp validation template"}
                    </span>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={onCancel}
                            className="cancel-btn"
                            style={{
                                padding: "7px 16px",
                                borderRadius: "3px",
                                background: "transparent",
                                color: "#cccccc",
                                border: "1px solid #555555",
                                fontSize: "11px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="apply-btn"
                            disabled={
                                (activeSubTab === "draw" && isEmpty) ||
                                (activeSubTab === "upload" && !uploadedImg) ||
                                (activeSubTab === "text" && activeTab === "signature" && !fullName) ||
                                (activeSubTab === "text" && activeTab === "initials" && !initials) ||
                                (activeSubTab === "text" && activeTab === "stamp" && !stampText)
                            }
                            style={{
                                padding: "7px 20px",
                                borderRadius: "3px",
                                background: "#4db8d4",
                                color: "#1a1a1a",
                                border: "1px solid #4db8d4",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Check size={15} strokeWidth={2.5} />
                            <span>Apply</span>
                        </button>
                    </div>
                </footer>
            </div>

            {/* ══ ZOOMED QR CODE MODAL OVERLAY ══ */}
            {isQrZoomed && qrCodeDataUrl && (
                <div 
                    onClick={() => setIsQrZoomed(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 999999,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(8, 8, 9, 0.85)",
                        backdropFilter: "blur(16px)",
                        padding: "24px",
                        boxSizing: "border-box",
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            gap: "16px", 
                            width: "100%", 
                            maxWidth: "340px",
                        }}
                    >
                        <div 
                            style={{ 
                                background: "#ffffff", 
                                padding: "16px", 
                                borderRadius: "20px", 
                                width: "100%", 
                                boxSizing: "border-box",
                                boxShadow: "0 32px 80px rgba(0, 0, 0, 0.75)",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Scanner Laser effect */}
                            <div className="laser-line" style={{ animationDuration: "2s" }} />
                            <img 
                                src={qrCodeDataUrl} 
                                alt="Scan QR Code" 
                                style={{ 
                                    width: "100%", 
                                    height: "auto", 
                                    display: "block", 
                                    borderRadius: "8px",
                                    zIndex: 2,
                                }} 
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "center" }}>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const origin = window.location.origin;
                                        const mobileUrl = `${origin}/tools/pdf-signer/mobile-sign?sessionId=${sessionId}`;
                                        await navigator.clipboard.writeText(mobileUrl);
                                        alert("Secure pairing link copied to clipboard!");
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    background: "#3a3a3a",
                                    border: "1px solid #555555",
                                    borderRadius: "3px",
                                    color: "#cccccc",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                            >
                                🔗 Copy Pairing Link
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsQrZoomed(false)}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    background: "#4db8d4",
                                    border: "1px solid #4db8d4",
                                    borderRadius: "3px",
                                    color: "#1a1a1a",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(124, 106, 255, 0.4)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#3ba2bd"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#4db8d4"; }}
                            >
                                Close Preview
                            </button>
                        </div>
                        <span style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.02em" }}>
                            Click outside to close
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
