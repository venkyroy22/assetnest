"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ScratchCard from "./ScratchCard";

interface WishCardBookProps {
    theme: "gold" | "cyber" | "pastel" | "holo";
    recipient: string;
    sender: string;
    images: { url: string; message: string }[];
    scratchMessage?: string;
    occasionLabel: string;
    occasionEmoji: string;
    audioMuted: boolean;
    onScratchComplete?: () => void;
}

/* ── THEME TOKENS ─────────────────────────────────────────── */
const THEMES = {
    gold: {
        coverBg: "#FDE047", accent: "#F97316", illumination: "#3B82F6",
        spineLeft:  "linear-gradient(to right, rgba(0,0,0,0.13) 0%, transparent 100%)",
        spineRight: "linear-gradient(to left,  rgba(0,0,0,0.09) 0%, transparent 100%)",
        shadow: "8px 8px 0px rgba(0,0,0,1)",
    },
    cyber: {
        coverBg: "#F472B6", accent: "#3B82F6", illumination: "#10B981",
        spineLeft:  "linear-gradient(to right, rgba(0,0,0,0.13) 0%, transparent 100%)",
        spineRight: "linear-gradient(to left,  rgba(0,0,0,0.09) 0%, transparent 100%)",
        shadow: "8px 8px 0px rgba(0,0,0,1)",
    },
    pastel: {
        coverBg: "#C4B5FD", accent: "#F472B6", illumination: "#FDE047",
        spineLeft:  "linear-gradient(to right, rgba(0,0,0,0.13) 0%, transparent 100%)",
        spineRight: "linear-gradient(to left,  rgba(0,0,0,0.09) 0%, transparent 100%)",
        shadow: "8px 8px 0px rgba(0,0,0,1)",
    },
    holo: {
        coverBg: "#22D3EE", accent: "#A855F7", illumination: "#FBBF24",
        spineLeft:  "linear-gradient(to right, rgba(0,0,0,0.13) 0%, transparent 100%)",
        spineRight: "linear-gradient(to left,  rgba(0,0,0,0.09) 0%, transparent 100%)",
        shadow: "8px 8px 0px rgba(0,0,0,1)",
    },
};

type TTheme = typeof THEMES[keyof typeof THEMES];

/* ── GLOBAL STYLES (injected once) ───────────────────────── */
const BOOK_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.book-stage { perspective: 2600px; perspective-origin: 50% 46%; }

@keyframes bk-reveal {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes bk-page-right {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes bk-page-left {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes bk-cue {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-4px); }
}
@keyframes bk-flip-next {
    0% {
        transform: rotateY(0deg);
        box-shadow: inset 10px 0 20px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.1);
    }
    50% {
        transform: rotateY(-90deg) skewY(2deg) scale(1.02);
        box-shadow: inset 0px 0 30px rgba(0,0,0,0.25), 0 0 20px rgba(0,0,0,0.2);
    }
    100% {
        transform: rotateY(-180deg);
        box-shadow: inset -10px 0 20px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.1);
    }
}
@keyframes bk-flip-prev {
    0% {
        transform: rotateY(-180deg);
        box-shadow: inset -10px 0 20px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.1);
    }
    50% {
        transform: rotateY(-90deg) skewY(-2deg) scale(1.02);
        box-shadow: inset 0px 0 30px rgba(0,0,0,0.25), 0 0 20px rgba(0,0,0,0.2);
    }
    100% {
        transform: rotateY(0deg);
        box-shadow: inset 10px 0 20px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.1);
    }
}
.bk-flipping-page {
    position: absolute;
    top: 0;
    left: 420px;
    width: 420px;
    height: 580px;
    transform-origin: left center;
    transform-style: preserve-3d;
    z-index: 35;
    will-change: transform;
}
.bk-flipping-page-next {
    animation: bk-flip-next 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
.bk-flipping-page-prev {
    animation: bk-flip-prev 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.bk-reveal      { animation: bk-reveal     0.45s cubic-bezier(0.22,1,0.36,1) both; }
.bk-page-right  { animation: bk-page-right 0.32s cubic-bezier(0.22,1,0.36,1) both; }
.bk-page-left   { animation: bk-page-left  0.32s cubic-bezier(0.22,1,0.36,1) both; }
.bk-cue         { animation: bk-cue 2.2s ease-in-out infinite; }

.bk-nav-btn {
    cursor: pointer;
    transition: box-shadow 0.12s ease, transform 0.12s ease, background 0.15s;
}
.bk-nav-btn:not(:disabled):active {
    transform: translate(2px, 2px) !important;
    box-shadow: none !important;
}
.bk-nav-btn:disabled { cursor: default; }
`;

/* ── PAGE TURN AUDIO ──────────────────────────────────────── */
function useAudio(muted: boolean) {
    const playPageTurn = useCallback(() => {
        if (muted) return;
        try {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            const ctx = new AC();
            const t = ctx.currentTime;
            const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                const env = i < 0.06 * ctx.sampleRate
                    ? i / (0.06 * ctx.sampleRate)
                    : Math.exp(-5 * (i / ctx.sampleRate - 0.06));
                data[i] = (Math.random() * 2 - 1) * 0.45 * env;
            }
            const src  = ctx.createBufferSource();
            src.buffer = buf;
            const filt = ctx.createBiquadFilter();
            filt.type = "bandpass";
            filt.frequency.setValueAtTime(2200, t);
            filt.frequency.exponentialRampToValueAtTime(380, t + 0.45);
            filt.Q.value = 0.9;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.22, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
            src.start(t); src.stop(t + 0.5);
        } catch {}
    }, [muted]);

    const playChime = useCallback(() => {
        if (muted) return;
        try {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            const ctx = new AC();
            const t = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g   = ctx.createGain();
                osc.type = "sine"; osc.frequency.value = freq;
                g.gain.setValueAtTime(0, t + i * 0.1);
                g.gain.linearRampToValueAtTime(0.09, t + i * 0.1 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.6);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.65);
            });
        } catch {}
    }, [muted]);

    return { playPageTurn, playChime };
}

/* ── SHARED STYLE HELPERS ─────────────────────────────────── */
const DISPLAY: React.CSSProperties = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };
const BODY: React.CSSProperties    = { fontFamily: "'DM Sans', system-ui, sans-serif" };

const Tag = ({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) => (
    <span style={{
        display: "inline-block",
        padding: "4px 12px",
        background: accent || "#fff",
        border: "2px solid #000",
        borderRadius: 8,
        ...DISPLAY,
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#000",
        boxShadow: "2px 2px 0 #000",
        ...style,
    }}>{children}</span>
);

const Divider = () => (
    <div style={{ width: "100%", height: 2, background: "#000", margin: "12px 0", borderRadius: 2 }} />
);

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function WishCardBook({
    theme = "gold", recipient, sender, images, scratchMessage,
    occasionLabel, occasionEmoji, audioMuted, onScratchComplete,
}: WishCardBookProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpened,       setIsOpened]       = useState(false);
    const [isAnimating,    setIsAnimating]    = useState(false);
    const [currentSpread,  setCurrentSpread]  = useState(0);
    const [pageTransition, setPageTransition] = useState<"none"|"next"|"prev">("none");
    const [scale,          setScale]          = useState(1);
    const [activeSubPage,  setActiveSubPage]  = useState(0);
    const [isMobile,       setIsMobile]       = useState(false);
    const [touchStart,     setTouchStart]     = useState<number|null>(null);
    const { playPageTurn, playChime } = useAudio(audioMuted);

    const PAGE_W = 420;
    const PAGE_H = 580;
    const OPEN_W = PAGE_W * 2;

    const totalSpreads = images.length + (scratchMessage ? 1 : 0);
    const T = THEMES[theme];

    /* Responsive scale */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const recalc = () => {
            const mob = window.innerWidth < 640;
            setIsMobile(mob);
            const w      = el.clientWidth || window.innerWidth;
            const target = mob ? PAGE_W : OPEN_W;
            const pad    = mob ? 8 : 20;
            const rawScale = w < target + pad ? Math.max(0.24, (w - pad) / target) : 1;
            setScale(mob ? rawScale : rawScale * 0.75);
        };
        recalc();
        const ro = new ResizeObserver(recalc);
        ro.observe(el);
        window.addEventListener("resize", recalc);
        return () => { ro.disconnect(); window.removeEventListener("resize", recalc); };
    }, []);

    const handleOpen = useCallback(() => {
        if (isOpened || isAnimating) return;
        playPageTurn();
        setIsOpened(true); setIsAnimating(true); setCurrentSpread(0); setActiveSubPage(0);
        setTimeout(() => { setIsAnimating(false); playChime(); }, 1050);
    }, [isOpened, isAnimating, playPageTurn, playChime]);

    const handleClose = useCallback(() => {
        if (!isOpened || isAnimating) return;
        playPageTurn();
        setIsOpened(false); setIsAnimating(true); setCurrentSpread(0); setActiveSubPage(0);
        setTimeout(() => setIsAnimating(false), 1050);
    }, [isOpened, isAnimating, playPageTurn]);

    const goNext = useCallback(() => {
        if (isMobile) {
            if (activeSubPage === 0) {
                playPageTurn();
                setActiveSubPage(1);
                return;
            }
            if (currentSpread >= totalSpreads - 1 || pageTransition !== "none") return;
            playPageTurn();
            setPageTransition("next");
            setTimeout(() => { setCurrentSpread(p => p + 1); setActiveSubPage(0); setPageTransition("none"); }, 380);
        } else {
            if (currentSpread >= totalSpreads - 1 || pageTransition !== "none") return;
            playPageTurn();
            setPageTransition("next");
            setTimeout(() => { setCurrentSpread(p => p + 1); setPageTransition("none"); }, 750);
        }
    }, [currentSpread, totalSpreads, pageTransition, playPageTurn, isMobile, activeSubPage]);

    const goPrev = useCallback(() => {
        if (isMobile) {
            if (activeSubPage === 1) {
                playPageTurn();
                setActiveSubPage(0);
                return;
            }
            if (currentSpread <= 0 || pageTransition !== "none") {
                if (currentSpread === 0 && activeSubPage === 0) {
                    handleClose();
                }
                return;
            }
            playPageTurn();
            setPageTransition("prev");
            setTimeout(() => { setCurrentSpread(p => p - 1); setActiveSubPage(1); setPageTransition("none"); }, 380);
        } else {
            if (currentSpread <= 0 || pageTransition !== "none") {
                if (currentSpread === 0) {
                    handleClose();
                }
                return;
            }
            playPageTurn();
            setPageTransition("prev");
            setTimeout(() => { setCurrentSpread(p => p - 1); setPageTransition("none"); }, 750);
        }
    }, [currentSpread, pageTransition, playPageTurn, isMobile, activeSubPage, handleClose]);

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd   = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const dx = e.changedTouches[0].clientX - touchStart;
        if (Math.abs(dx) > 44) { dx < 0 ? goNext() : goPrev(); }
        setTouchStart(null);
    };

    const isImageSpread   = currentSpread < images.length;
    const isScratchSpread = scratchMessage && currentSpread === images.length;
    const currentImage    = isImageSpread ? images[currentSpread] : null;

    const bookOffsetX = isMobile
        ? (isOpened ? (activeSubPage === 0 ? 0 : -PAGE_W * scale) : 0)
        : (isOpened ? 0 : -(PAGE_W / 2) * scale);

    const pageClass = (dir: "left"|"right") =>
        pageTransition === "next"
            ? dir === "right" ? "bk-page-right" : "bk-page-left"
            : pageTransition === "prev"
                ? dir === "right" ? "bk-page-left" : "bk-page-right"
                : "";

    /* ── render ── */
    if (isMobile) {
        const activePage = isOpened ? (currentSpread * 2 + activeSubPage + 1) : 0;
        const totalMobilePages = totalSpreads * 2;
        const pageIdx = activePage - 1;
        const isRightPage = pageIdx % 2 === 1;

        const cardStyle: React.CSSProperties = !isOpened
            ? {
                background: T.coverBg,
                borderTop: "3.5px solid #000",
                borderBottom: "3.5px solid #000",
                borderRight: "3.5px solid #000",
                borderLeft: "12px solid #000",
                borderRadius: "4px 18px 18px 4px",
                boxShadow: "6px 6px 0px rgba(0,0,0,1)",
              }
            : isRightPage
                ? {
                    background: "#fff",
                    borderTop: "3.5px solid #000",
                    borderBottom: "3.5px solid #000",
                    borderRight: "3.5px solid #000",
                    borderLeft: "10px solid #000",
                    borderRadius: "0 18px 18px 0",
                    boxShadow: "6px 6px 0px rgba(0,0,0,1)",
                  }
                : {
                    background: "#fff",
                    borderTop: "3.5px solid #000",
                    borderBottom: "3.5px solid #000",
                    borderLeft: "3.5px solid #000",
                    borderRight: "10px solid #000",
                    borderRadius: "18px 0 0 18px",
                    boxShadow: "6px 6px 0px rgba(0,0,0,1)",
                  };

        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 14 }}>
                <style>{BOOK_STYLES}</style>

                {/* Flat Card Frame */}
                <div style={{
                    width: "100%",
                    maxWidth: 420,
                    height: 520,
                    overflow: "hidden",
                    position: "relative",
                    transition: "background 0.3s, border-radius 0.3s",
                    ...cardStyle,
                }}>
                    <div key={activePage} className="bk-reveal" style={{ width: "100%", height: "100%" }}>
                        {!isOpened ? (
                            <div onClick={handleOpen} style={{ width: "100%", height: "100%" }}>
                                <CoverFront T={T} recipient={recipient} occasionLabel={occasionLabel} occasionEmoji={occasionEmoji} isOpened={false} />
                            </div>
                        ) : (
                            /* Open pages */
                            (() => {
                                const pageIdx = activePage - 1;
                                const spreadIdx = Math.floor(pageIdx / 2);
                                const isRightPage = pageIdx % 2 === 1;

                                if (spreadIdx < images.length) {
                                    const img = images[spreadIdx];
                                    if (!isRightPage) {
                                        return <LeftPage T={T} photoUrl={img.url} recipient={recipient} occasionLabel={occasionLabel} occasionEmoji={occasionEmoji} isOpened={true} />;
                                    } else {
                                        return <RightPage T={T} note={img.message} sender={sender} recipient={recipient} occasionLabel={occasionLabel} occasionEmoji={occasionEmoji} isOpened={true} pageNum={activePage} totalPages={totalMobilePages} />;
                                    }
                                } else {
                                    // Scratch spread
                                    if (!isRightPage) {
                                        return <ScratchLeftPage T={T} sender={sender} recipient={recipient} occasionEmoji={occasionEmoji} isOpened={true} />;
                                    } else {
                                        return <ScratchSpreadPage T={T} scratchMessage={scratchMessage || ""} sender={sender} onScratchComplete={onScratchComplete} isOpened={true} pageNum={activePage} totalPages={totalMobilePages} />;
                                    }
                                }
                            })()
                        )}
                    </div>
                </div>

                {/* Mobile controls */}
                {isOpened && !isAnimating && (
                    <div style={{
                        marginTop: 10,
                        display: "flex", alignItems: "center", gap: 10,
                        transform: `scale(${Math.min(scale, 1)})`,
                        transformOrigin: "top center",
                    }}>
                        <NavBtn onClick={goPrev} disabled={currentSpread === 0 && activeSubPage === 0} accent={T.accent}>
                            ← Prev
                        </NavBtn>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                            <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 13, color: "#000", letterSpacing: "0.06em" }}>
                                {activePage} / {totalMobilePages}
                            </span>
                            {totalMobilePages > 1 && (
                                <div style={{ display: "flex", gap: 5 }}>
                                    {Array.from({ length: totalMobilePages }, (_, i) => {
                                        const dotSpread = Math.floor(i / 2);
                                        const dotSubPage = i % 2;
                                        const isCurrent = dotSpread === currentSpread && dotSubPage === activeSubPage;
                                        return (
                                            <div key={i} onClick={() => {
                                                if (isCurrent) return;
                                                playPageTurn();
                                                if (dotSpread !== currentSpread) {
                                                    setPageTransition(dotSpread > currentSpread ? "next" : "prev");
                                                    setTimeout(() => {
                                                        setCurrentSpread(dotSpread);
                                                        setActiveSubPage(dotSubPage);
                                                        setPageTransition("none");
                                                    }, 380);
                                                } else {
                                                    setActiveSubPage(dotSubPage);
                                                }
                                            }} style={{
                                                width: isCurrent ? 18 : 8, height: 8, borderRadius: 4,
                                                background: isCurrent ? T.accent : "#fff",
                                                border: "2px solid #000", cursor: !isCurrent ? "pointer" : "default",
                                                transition: "width 0.22s ease, background 0.22s ease",
                                            }} />
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <NavBtn onClick={goNext} disabled={currentSpread === totalSpreads - 1 && activeSubPage === 1} accent={T.accent}>
                            Next →
                        </NavBtn>

                        <NavBtn onClick={handleClose} disabled={false} accent={T.accent} highlight>
                            ✕ Close
                        </NavBtn>
                    </div>
                )}
            </div>
        );
    }

    const leftSpreadIdx = pageTransition === "prev" ? currentSpread - 1 : currentSpread;
    const rightSpreadIdx = pageTransition === "next" ? currentSpread + 1 : currentSpread;

    const renderLeftPageContent = (spreadIdx: number) => {
        if (spreadIdx < 0 || spreadIdx >= totalSpreads) return <div style={{ width: "100%", height: "100%", background: "#fff" }} />;
        const isImg = spreadIdx < images.length;
        const isScratch = scratchMessage && spreadIdx === images.length;
        const img = isImg ? images[spreadIdx] : null;

        if (isImg && img) {
            return <LeftPage T={T} photoUrl={img.url} recipient={recipient} occasionLabel={occasionLabel} occasionEmoji={occasionEmoji} isOpened={isOpened} />;
        } else if (isScratch) {
            return <ScratchLeftPage T={T} sender={sender} recipient={recipient} occasionEmoji={occasionEmoji} isOpened={isOpened} />;
        }
        return <div style={{ width: "100%", height: "100%", background: "#fff" }} />;
    };

    const renderRightPageContent = (spreadIdx: number) => {
        if (spreadIdx < 0 || spreadIdx >= totalSpreads) return <div style={{ width: "100%", height: "100%", background: "#fff" }} />;
        const isImg = spreadIdx < images.length;
        const isScratch = scratchMessage && spreadIdx === images.length;
        const img = isImg ? images[spreadIdx] : null;

        if (isImg && img) {
            return <RightPage T={T} note={img.message} sender={sender} recipient={recipient} occasionLabel={occasionLabel} occasionEmoji={occasionEmoji} isOpened={isOpened} pageNum={spreadIdx + 1} totalPages={totalSpreads} />;
        } else if (isScratch) {
            return <ScratchSpreadPage T={T} scratchMessage={scratchMessage || ""} sender={sender} onScratchComplete={onScratchComplete} isOpened={isOpened} pageNum={spreadIdx + 1} totalPages={totalSpreads} />;
        }
        return <div style={{ width: "100%", height: "100%", background: "#fff" }} />;
    };

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <style>{BOOK_STYLES}</style>

            {/* BOOK STAGE */}
            <div
                className="book-stage"
                onTouchStart={isOpened ? handleTouchStart : undefined}
                onTouchEnd={isOpened ? handleTouchEnd : undefined}
                style={{
                    width:  (isMobile ? PAGE_W : OPEN_W) * scale,
                    height: PAGE_H * scale,
                    transition: "transform 1.05s cubic-bezier(0.22,1,0.36,1), width 0.5s ease",
                    transform: `translateX(${bookOffsetX}px)`,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Native-size canvas, scaled down */}
                <div style={{ width: OPEN_W, height: PAGE_H, position: "relative", transformOrigin: "top left", transform: `scale(${scale})` }}>

                    {/* RIGHT PAGE (background) */}
                    <div
                        onClick={rightSpreadIdx < images.length ? goNext : undefined}
                        style={{
                            position: "absolute", top: 0, left: PAGE_W,
                            width: PAGE_W, height: PAGE_H,
                            borderRadius: "0 18px 18px 0",
                            overflow: "hidden", background: "#fff",
                            border: "3.5px solid #000", borderLeft: "none",
                            boxShadow: "inset -6px 0 10px rgba(0,0,0,0.07)", zIndex: 10,
                            cursor: rightSpreadIdx < images.length ? "pointer" : "default",
                        }}
                    >
                        <div style={{ width: "100%", height: "100%" }}>
                            {renderRightPageContent(rightSpreadIdx)}
                        </div>
                    </div>

                    {/* COVER (hinges at spine) */}
                    <div
                        onClick={!isOpened ? handleOpen : undefined}
                        style={{
                            position: "absolute", top: 0, left: PAGE_W,
                            width: PAGE_W, height: PAGE_H,
                            transformOrigin: "left center",
                            transformStyle: "preserve-3d",
                            zIndex: 30, cursor: !isOpened ? "pointer" : "default",
                            transform: isOpened ? "rotateY(-180deg)" : "rotateY(0deg)",
                            transition: "transform 1.05s cubic-bezier(0.22,1,0.36,1)",
                            willChange: "transform",
                        }}
                    >
                        {/* Cover front */}
                        <div style={{
                            position: "absolute", inset: 0,
                            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                            borderRadius: "0 18px 18px 0", overflow: "hidden",
                            background: T.coverBg, border: "3.5px solid #000",
                            boxShadow: "6px 6px 0 #000",
                        }}>
                            <CoverFront T={T} recipient={recipient} occasionLabel={occasionLabel}
                                occasionEmoji={occasionEmoji} isOpened={isOpened} />
                        </div>

                        {/* Cover back = left page */}
                        <div
                            onClick={goPrev}
                            style={{
                                position: "absolute", inset: 0,
                                backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                borderRadius: "18px 0 0 18px", overflow: "hidden",
                                background: "#fff", border: "3.5px solid #000", borderRight: "none",
                                boxShadow: "inset 6px 0 10px rgba(0,0,0,0.07)",
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ width: "100%", height: "100%" }}>
                                {renderLeftPageContent(leftSpreadIdx)}
                            </div>
                        </div>
                    </div>

                    {/* FLIPPING PAGE (desktop animation layer) */}
                    {isOpened && pageTransition !== "none" && !isMobile && (
                        <div className={`bk-flipping-page bk-flipping-page-${pageTransition}`}>
                            {/* Front of flipping page */}
                            <div style={{
                                position: "absolute", inset: 0,
                                backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                                borderRadius: "0 18px 18px 0", overflow: "hidden",
                                background: "#fff", border: "3.5px solid #000", borderLeft: "none",
                                boxShadow: "inset -6px 0 10px rgba(0,0,0,0.07)",
                            }}>
                                {pageTransition === "next" ? (
                                    renderRightPageContent(currentSpread)
                                ) : (
                                    renderRightPageContent(currentSpread - 1)
                                )}
                            </div>

                            {/* Back of flipping page */}
                            <div style={{
                                position: "absolute", inset: 0,
                                backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                borderRadius: "18px 0 0 18px", overflow: "hidden",
                                background: "#fff", border: "3.5px solid #000", borderRight: "none",
                                boxShadow: "inset 6px 0 10px rgba(0,0,0,0.07)",
                            }}>
                                {pageTransition === "next" ? (
                                    renderLeftPageContent(currentSpread + 1)
                                ) : (
                                    renderLeftPageContent(currentSpread)
                                )}
                            </div>
                        </div>
                    )}

                    {/* SPINE */}
                    {isOpened && (
                        <div style={{
                            position: "absolute", top: 0, left: PAGE_W - 8,
                            width: 16, height: PAGE_H, zIndex: 40, pointerEvents: "none",
                            background: "#000", boxShadow: "4px 0 12px rgba(0,0,0,0.28)",
                        }} />
                    )}

                    {/* DESKTOP CONTROLS BAR (inside left page) */}
                    {isOpened && !isAnimating && !isMobile && (
                        <div style={{
                            position: "absolute",
                            bottom: 24,
                            left: PAGE_W / 2,
                            transform: "translateX(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            zIndex: 50,
                        }}>
                            <NavBtn onClick={goPrev} disabled={currentSpread === 0} accent={T.accent}>
                                ← Prev
                            </NavBtn>

                            {/* Dots + counter */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 11, color: "#000", letterSpacing: "0.06em" }}>
                                    {currentSpread + 1} / {totalSpreads}
                                </span>
                                {totalSpreads > 1 && (
                                    <div style={{ display: "flex", gap: 5 }}>
                                        {Array.from({ length: totalSpreads }, (_, i) => (
                                            <div key={i} onClick={() => {
                                                if (i === currentSpread) return;
                                                playPageTurn();
                                                setPageTransition(i > currentSpread ? "next" : "prev");
                                                setTimeout(() => { setCurrentSpread(i); setPageTransition("none"); }, 380);
                                            }} style={{
                                                width: i === currentSpread ? 18 : 8, height: 8, borderRadius: 4,
                                                background: i === currentSpread ? T.accent : "#fff",
                                                border: "2px solid #000", cursor: i !== currentSpread ? "pointer" : "default",
                                                transition: "width 0.22s ease, background 0.22s ease",
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <NavBtn onClick={goNext} disabled={currentSpread >= totalSpreads - 1} accent={T.accent}>
                                Next →
                            </NavBtn>

                            <NavBtn onClick={handleClose} disabled={false} accent={T.accent} highlight>
                                ✕ Close
                            </NavBtn>
                        </div>
                    )}
                </div>
            </div>

            {/* MOBILE CONTROLS BAR (below book stage) */}
            {isOpened && !isAnimating && isMobile && (
                <div style={{
                    marginTop: 18,
                    display: "flex", alignItems: "center", gap: 10,
                    transform: `scale(${Math.min(scale, 1)})`,
                    transformOrigin: "top center",
                }}>
                    <NavBtn onClick={goPrev} disabled={currentSpread === 0 && activeSubPage === 0} accent={T.accent}>
                        ← Prev
                    </NavBtn>

                    {/* Dots + counter */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 13, color: "#000", letterSpacing: "0.06em" }}>
                            {currentSpread * 2 + activeSubPage + 1} / {totalSpreads * 2}
                        </span>
                        {totalSpreads > 0 && (
                            <div style={{ display: "flex", gap: 5 }}>
                                {Array.from({ length: totalSpreads * 2 }, (_, i) => {
                                    const dotSpread = Math.floor(i / 2);
                                    const dotSubPage = i % 2;
                                    const isCurrent = dotSpread === currentSpread && dotSubPage === activeSubPage;
                                    return (
                                        <div key={i} onClick={() => {
                                            if (isCurrent) return;
                                            playPageTurn();
                                            if (dotSpread !== currentSpread) {
                                                setPageTransition(dotSpread > currentSpread ? "next" : "prev");
                                                setTimeout(() => {
                                                    setCurrentSpread(dotSpread);
                                                    setActiveSubPage(dotSubPage);
                                                    setPageTransition("none");
                                                }, 380);
                                            } else {
                                                setActiveSubPage(dotSubPage);
                                            }
                                        }} style={{
                                            width: isCurrent ? 18 : 8, height: 8, borderRadius: 4,
                                            background: isCurrent ? T.accent : "#fff",
                                            border: "2px solid #000", cursor: !isCurrent ? "pointer" : "default",
                                            transition: "width 0.22s ease, background 0.22s ease",
                                        }} />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <NavBtn onClick={goNext} disabled={currentSpread === totalSpreads - 1 && activeSubPage === 1} accent={T.accent}>
                        Next →
                    </NavBtn>

                    <NavBtn onClick={handleClose} disabled={false} accent={T.accent} highlight>
                        ✕ Close
                    </NavBtn>
                </div>
            )}
        </div>
    );
}

/* ── NAV BUTTON ───────────────────────────────────────────── */
function NavBtn({ onClick, disabled, accent, highlight, children }: {
    onClick: () => void; disabled: boolean; accent: string; highlight?: boolean; children: React.ReactNode;
}) {
    const [hov, setHov] = useState(false);
    return (
        <button
            className="bk-nav-btn"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: disabled ? "#E4E4E7" : highlight ? accent : "#fff",
                border: "2.5px solid #000", borderRadius: 10,
                padding: "9px 16px",
                ...DISPLAY, fontWeight: 700, fontSize: 11,
                letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#000",
                opacity: disabled ? 0.45 : 1,
                boxShadow: disabled ? "none" : hov ? "1px 1px 0 #000" : "3px 3px 0 #000",
                transform: hov && !disabled ? "translate(2px,2px)" : "none",
                whiteSpace: "nowrap" as const,
            }}
        >
            {children}
        </button>
    );
}

/* ══════════════════════════════════════════════════════════
   COVER FRONT
   ══════════════════════════════════════════════════════════ */
function CoverFront({ T, recipient, occasionLabel, occasionEmoji, isOpened }: { T: TTheme; recipient: string; occasionLabel: string; occasionEmoji: string; isOpened: boolean }) {
    return (
        <div style={{ width: "100%", height: "100%", padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", textAlign: "center", userSelect: "none" }}>

            {/* Occasion stamp */}
            <div style={{
                padding: "7px 18px", background: "#fff", border: "3px solid #000",
                borderRadius: 10, boxShadow: "3px 3px 0 #000",
                ...DISPLAY, fontWeight: 700, fontSize: 11,
                letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#000",
            }}>
                ✦ {occasionLabel} ✦
            </div>

            {/* Emoji badge */}
            <div style={{
                width: 136, height: 136, borderRadius: "50%",
                background: "#fff", border: "4px solid #000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 58, boxShadow: "6px 6px 0 #000",
            }}>
                {occasionEmoji}
            </div>

            {/* Recipient name */}
            <div style={{ width: "100%" }}>
                <p style={{ ...DISPLAY, fontWeight: 700, fontSize: 11, color: "#000", letterSpacing: "0.12em", textTransform: "uppercase" as const, margin: "0 0 8px", opacity: 0.7 }}>
                    For Someone Special
                </p>
                <div style={{
                    ...DISPLAY, fontWeight: 700, fontSize: 28, color: "#000", lineHeight: 1.15,
                    background: "#fff", border: "3px solid #000", borderRadius: 12,
                    padding: "10px 14px", boxShadow: "4px 4px 0 #000", wordBreak: "break-word" as const,
                }}>
                    {recipient || "You ✨"}
                </div>
            </div>

            {/* Open prompt */}
            {!isOpened && (
                <div className="bk-cue" style={{
                    background: T.accent, border: "2.5px solid #000",
                    borderRadius: 10, padding: "9px 22px",
                    boxShadow: "3px 3px 0 #000",
                    ...DISPLAY, fontWeight: 700, fontSize: 11,
                    letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#000",
                }}>
                    Click to Open ⚡
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   LEFT PAGE — polaroid photo
   ══════════════════════════════════════════════════════════ */
function LeftPage({ T, photoUrl, recipient, occasionLabel, occasionEmoji, isOpened }: { T: TTheme; photoUrl: string; recipient: string; occasionLabel: string; occasionEmoji: string; isOpened: boolean }) {
    return (
        <div style={{
            width: "100%", height: "100%", padding: "28px 26px",
            display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center",
            position: "relative",
            animation: isOpened ? "bk-reveal 0.45s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}>
            <div style={{ position: "absolute", inset: 0, background: T.spineLeft, pointerEvents: "none" }} />

            {/* Header */}
            <div style={{ width: "100%", textAlign: "center", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: "100%" }}>
                    <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#000", opacity: 0.55 }}>
                        Captured Memory 📸
                    </span>
                    <div style={{ height: 2, background: "#000", marginTop: 8, borderRadius: 2 }} />
                </div>
                <Tag accent={T.accent}>✦ {occasionLabel} ✦</Tag>
            </div>

            {/* Polaroid */}
            <div style={{
                background: "#fff", padding: "12px 12px 32px",
                borderRadius: 10, border: "3px solid #000",
                transform: "rotate(-1.8deg)",
                boxShadow: "5px 5px 0 #000",
                width: "92%", position: "relative", zIndex: 2,
            }}>
                <img
                    src={photoUrl || "https://placehold.co/340x220/c8922a/fff?text=Photo"}
                    alt="Memory"
                    style={{ width: "100%", height: 212, objectFit: "cover", borderRadius: 6, display: "block", border: "2px solid #000" }}
                />
                <div style={{ textAlign: "center", paddingTop: 10, ...DISPLAY, fontWeight: 700, fontSize: 14, color: "#000" }}>
                    {recipient || "You"} {occasionEmoji}
                </div>
            </div>

            {/* Empty spacer where tag used to be to maintain layout padding */}
            <div style={{ height: 20 }} />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   RIGHT PAGE — greeting note
   ══════════════════════════════════════════════════════════ */
function RightPage({ T, note, sender, recipient, occasionLabel, occasionEmoji, isOpened, pageNum, totalPages }: {
    T: TTheme; note: string; sender: string; recipient: string; occasionLabel: string; occasionEmoji: string; isOpened: boolean; pageNum: number; totalPages: number;
}) {
    return (
        <div style={{
            width: "100%", height: "100%", padding: "28px 32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            position: "relative",
            animation: isOpened ? "bk-reveal 0.45s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}>
            <div style={{ position: "absolute", inset: 0, background: T.spineRight, pointerEvents: "none" }} />

            {/* Header */}
            <div style={{ position: "relative", zIndex: 2, width: "100%", textAlign: "center" }}>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#000", opacity: 0.55 }}>
                    A Special Message ✉️
                </span>
                <div style={{ height: 2, background: "#000", marginTop: 8, borderRadius: 2 }} />
            </div>

            {/* Note body */}
            <div style={{
                flex: 1, position: "relative", zIndex: 2,
                margin: "18px 0",
                background: "#fff", border: "3px solid #000", borderRadius: 14,
                padding: "20px", boxShadow: "4px 4px 0 #000",
                display: "flex", flexDirection: "column", justifyContent: "center",
                overflow: "hidden",
            }}>
                {/* Accent corner */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: T.accent, borderRadius: "10px 0 0 10px" }} />
                <p style={{
                    ...BODY, fontWeight: 600, fontSize: 15, lineHeight: 1.75,
                    color: "#000", margin: 0, paddingLeft: 12,
                    maxHeight: 220, overflowY: "auto",
                }}>
                    {note || "Wishing you absolute happiness, health, and boundless joy on this wonderful day!"}
                </p>
            </div>

            {/* Sign-off */}
            <div style={{
                position: "relative", zIndex: 2,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#F4F4F5", border: "2.5px solid #000",
                borderRadius: 10, padding: "10px 14px", boxShadow: "3px 3px 0 #000",
            }}>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#000", opacity: 0.55 }}>
                    From
                </span>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 17, color: "#000" }}>
                    {sender || "A Friend"}
                </span>
            </div>

            {/* Footer */}
            <div style={{ position: "relative", zIndex: 2, textAlign: "center", paddingTop: 10 }}>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, color: "#000", opacity: 0.35, letterSpacing: "0.08em" }}>
                    ✦ Page {pageNum} of {totalPages} ✦
                </span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   SCRATCH LEFT PAGE
   ══════════════════════════════════════════════════════════ */
function ScratchLeftPage({ T, sender, recipient, occasionEmoji, isOpened }: { T: TTheme; sender: string; recipient: string; occasionEmoji: string; isOpened: boolean }) {
    return (
        <div style={{
            width: "100%", height: "100%", padding: "32px 26px",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            position: "relative", textAlign: "center",
            animation: isOpened ? "bk-reveal 0.45s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}>
            <div style={{ position: "absolute", inset: 0, background: T.spineLeft, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

                <div style={{ fontSize: 66 }}>{occasionEmoji}</div>

                <div style={{
                    ...DISPLAY, fontWeight: 700, fontSize: 18,
                    color: "#000", letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    background: T.accent, border: "3px solid #000",
                    borderRadius: 12, padding: "10px 18px",
                    boxShadow: "4px 4px 0 #000",
                }}>
                    Secret Awaits 🔒
                </div>

                <div style={{
                    ...BODY, fontWeight: 600, fontSize: 14, color: "#000", lineHeight: 1.7,
                    background: "#fff", border: "2.5px solid #000", borderRadius: 10,
                    padding: "14px 16px", boxShadow: "3px 3px 0 #000",
                    width: "100%",
                }}>
                    Scratch the card on the right to reveal a hidden note from <strong style={{ ...DISPLAY }}>{sender || "your friend"}</strong>!
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   SCRATCH SPREAD RIGHT PAGE
   ══════════════════════════════════════════════════════════ */
function ScratchSpreadPage({ T, scratchMessage, sender, onScratchComplete, isOpened, pageNum, totalPages }: {
    T: TTheme; scratchMessage: string; sender: string; onScratchComplete?: () => void; isOpened: boolean; pageNum: number; totalPages: number;
}) {
    return (
        <div style={{
            width: "100%", height: "100%", padding: "28px 32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            position: "relative",
            animation: isOpened ? "bk-reveal 0.45s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}>
            <div style={{ position: "absolute", inset: 0, background: T.spineRight, pointerEvents: "none" }} />

            {/* Header */}
            <div style={{ position: "relative", zIndex: 2, width: "100%", textAlign: "center" }}>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#000", opacity: 0.55 }}>
                    Secret Seal 🔮
                </span>
                <div style={{ height: 2, background: "#000", marginTop: 8, borderRadius: 2 }} />
            </div>

            {/* Scratch area */}
            <div style={{ flex: 1, position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "16px 0" }}>
                <ScratchCard scratchPercentageRequired={40} onComplete={onScratchComplete}>
                    <div style={{ padding: "16px 18px", background: "#fff", minWidth: 260 }}>
                        <div style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#000", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #000" }}>
                            🔓 Revealed Note
                        </div>
                        <p style={{ ...BODY, fontWeight: 600, fontSize: 14, lineHeight: 1.7, color: "#000", margin: 0 }}>
                            {scratchMessage}
                        </p>
                    </div>
                </ScratchCard>
            </div>

            {/* Sign-off */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "flex-end" }}>
                <span style={{
                    ...DISPLAY, fontWeight: 700, fontSize: 15, color: "#000",
                    background: T.accent, border: "2px solid #000", borderRadius: 8,
                    padding: "5px 14px", boxShadow: "2px 2px 0 #000",
                }}>
                    {sender || "A Friend"}
                </span>
            </div>

            {/* Footer */}
            <div style={{ position: "relative", zIndex: 2, textAlign: "center", paddingTop: 10 }}>
                <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 10, color: "#000", opacity: 0.35, letterSpacing: "0.08em" }}>
                    ✦ Page {pageNum} of {totalPages} ✦
                </span>
            </div>
        </div>
    );
}