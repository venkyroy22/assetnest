"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Sparkles, Gift, Heart, Send, Copy, Volume2, VolumeX, CheckCircle,
    RotateCcw, Share2, Music, ChevronRight, ChevronLeft, Eye, PartyPopper,
    Cake, GraduationCap, Star, Gem, Upload, Link2, Plus, Trash2,
    Image as ImageIcon, X, Wand2, ArrowRight
} from "lucide-react";
import JSConfetti from "js-confetti";
import LZString from "lz-string";
import GiftBoxVisual from "@/components/wish-studio/GiftBoxVisual";
import WishCardBook from "@/components/wish-studio/WishCardBook";

/* ═══════════════════════════════════════════════
   CONSTANTS & DATA
   ═══════════════════════════════════════════════ */

const STOCK_PHOTOS = [
    { id: "cake", name: "Birthday Cake", url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=500&auto=format&fit=crop" },
    { id: "hearts", name: "Loving Hearts", url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop" },
    { id: "champagne", name: "Cheer Toast", url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=500&auto=format&fit=crop" },
    { id: "balloons", name: "Balloons", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=500&auto=format&fit=crop" },
    { id: "stars", name: "Night Sparks", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=500&auto=format&fit=crop" },
    { id: "grad", name: "Graduation", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=500&auto=format&fit=crop" },
    { id: "fireworks", name: "Fireworks", url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=500&auto=format&fit=crop" },
];

const OCCASIONS = [
    { id: "birthday", label: "Birthday", emoji: "🎂", icon: Cake },
    { id: "anniversary", label: "Anniversary", emoji: "🥂", icon: Gem },
    { id: "congrats", label: "Congrats", emoji: "🎉", icon: PartyPopper },
    { id: "love", label: "Surprise", emoji: "💚", icon: Heart },
    { id: "graduation", label: "Graduation", emoji: "🎓", icon: GraduationCap },
    { id: "thank-you", label: "Thank You", emoji: "🙏", icon: Star },
    { id: "new-year", label: "New Year", emoji: "🎆", icon: Sparkles },
];

const THEMES = [
    { id: "gold", label: "Yellow", color: "#FDE047" },
    { id: "cyber", label: "Pink", color: "#F472B6" },
    { id: "pastel", label: "Lavender", color: "#C4B5FD" },
    { id: "holo", label: "Cyan", color: "#22D3EE" },
];

const DEFAULT_BG_COLORS: Record<string, string> = {
    gold: "#C4B5FD",
    cyber: "#86EFAC",
    pastel: "#FDE047",
    holo: "#F472B6",
};

const MELODIES = [
    { id: "birthday", label: "Happy Birthday", desc: "Classic celebration chime" },
    { id: "anniversary", label: "Celebration March", desc: "Sweet harmonious theme" },
    { id: "gentle-chime", label: "Gentle Chime", desc: "Soft congratulatory melody" },
];

const COLORS = ["#F97316", "#FDE047", "#3B82F6", "#EF4444", "#10B981", "#A855F7", "#22D3EE"];
const STEP_LABELS = ["Occasion", "Names", "Content", "Review"];

interface WishImage { url: string; message: string; }

/* ═══════════════════════════════════════════════
   GLOBAL STYLES (injected once)
   ═══════════════════════════════════════════════ */

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.ws-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ws-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ws-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}

/* Brutalist button active press */
.ws-btn { cursor: pointer; transition: transform 0.1s ease, box-shadow 0.1s ease; }
.ws-btn:active { transform: translate(2px, 2px) !important; box-shadow: none !important; }

/* Step slide animation */
@keyframes ws-slide-right {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes ws-slide-left {
  from { opacity: 0; transform: translateX(-28px); }
  to   { opacity: 1; transform: translateX(0); }
}
.ws-slide-right { animation: ws-slide-right 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
.ws-slide-left  { animation: ws-slide-left  0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* Fade up */
@keyframes ws-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ws-fade-up { animation: ws-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* Ticker tape progress */
.ws-ticker {
  display: flex;
  overflow: hidden;
  border: 2.5px solid #000;
  border-radius: 14px;
  background: #fff;
  box-shadow: 3px 3px 0 #000;
}
.ws-ticker-item {
  flex: 1;
  padding: 10px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-right: 2px solid #000;
  transition: background 0.2s;
  position: relative;
  cursor: default;
}
.ws-ticker-item:last-child { border-right: none; }
.ws-ticker-item.active  { background: #FDE047; }
.ws-ticker-item.done    { background: #86EFAC; cursor: pointer; }
.ws-ticker-item.done:hover { background: #4ADE80; }
.ws-ticker-item.pending { background: #fff; }

/* Scrollable panel */
.ws-panel-scroll {
  overflow-y: auto;
  scrollbar-width: auto;
  scrollbar-color: #000 #f3f4f6;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.ws-panel-scroll::-webkit-scrollbar { width: 10px; }
.ws-panel-scroll::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 4px; }
.ws-panel-scroll::-webkit-scrollbar-thumb { background: #000; border-radius: 4px; border: 2px solid #f3f4f6; }

/* Input focus ring */
.ws-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(253, 224, 71, 0.7), 2px 2px 0 #000;
}

/* Modal entrance */
@keyframes ws-modal-in {
  from { opacity: 0; transform: scale(0.93) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.ws-modal-in { animation: ws-modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* Typewriter cursor */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.ws-cursor { animation: blink 1s step-end infinite; }

/* Mobile bottom nav safe area */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .ws-bottom-nav { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
}

/* Chip button */
.ws-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border: 2px solid #000;
  border-radius: 12px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 12px;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s, background 0.15s;
  box-shadow: 2px 2px 0 #000;
  white-space: nowrap;
  min-height: 44px;
}
.ws-chip:active { transform: translate(2px,2px); box-shadow: none; }
.ws-chip.selected { background: #FDE047; color: #000; }
.ws-chip:not(.selected):hover { background: #fafafa; color: #000; }
`;

/* ═══════════════════════════════════════════════
   TYPEWRITER
   ═══════════════════════════════════════════════ */

function TypewriterText({ text, className }: { text: string; className?: string }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
        setDisplayed(""); setDone(false);
        let i = 0;
        const iv = setInterval(() => {
            if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
            else { clearInterval(iv); setTimeout(() => setDone(true), 1800); }
        }, 65);
        return () => clearInterval(iv);
    }, [text]);
    return (
        <span className={className}>
            {displayed}
            {!done && <span className="ws-cursor" style={{ opacity: 1, color: "inherit" }}>|</span>}
        </span>
    );
}

/* ═══════════════════════════════════════════════
   STAGGERED REVEAL
   ═══════════════════════════════════════════════ */

function FadeUp({ children, delay = 0, className = "", style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
    const [vis, setVis] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
    return (
        <div className={className} style={{
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
            ...style
        }}>
            {children}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   STEP PROGRESS — TICKER TAPE
   ═══════════════════════════════════════════════ */

function StepTicker({ current, onNavigate }: { current: number; onNavigate: (i: number) => void }) {
    return (
        <div className="ws-ticker">
            {STEP_LABELS.map((label, i) => {
                const state = i === current ? "active" : i < current ? "done" : "pending";
                return (
                    <div
                        key={i}
                        className={`ws-ticker-item ${state}`}
                        onClick={() => state === "done" && onNavigate(i)}
                        title={state === "done" ? `Back to ${label}` : undefined}
                    >
                        <span style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: "10px",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "#000",
                            opacity: state === "pending" ? 0.55 : 1,
                        }}>
                            {state === "done" ? "✓" : String(i + 1).padStart(2, "0")} {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   FIELD LABEL
   ═══════════════════════════════════════════════ */

function Label({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
            <span className="ws-label" style={{ color: "#000" }}>{children}</span>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   TEXT INPUT
   ═══════════════════════════════════════════════ */

function WsInput({ value, onChange, placeholder, type = "text", rows }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number;
}) {
    const common: React.CSSProperties = {
        width: "100%", background: "#fff", border: "2px solid #000",
        borderRadius: 14, padding: "12px 16px", fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#000",
        boxShadow: "3px 3px 0 #000", outline: "none", resize: "none" as const,
        transition: "box-shadow 0.15s",
    };
    if (rows) {
        return <textarea className="ws-input" rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={common} />;
    }
    return <input className="ws-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={common} />;
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function WishStudioPage() {
    const [theme, setTheme] = useState<"gold" | "cyber" | "pastel" | "holo">("gold");
    const [occasion, setOccasion] = useState("birthday");
    const [sender, setSender] = useState("");
    const [recipient, setRecipient] = useState("");
    const [scratchMessage, setScratchMessage] = useState("");
    const [audioMelody, setAudioMelody] = useState("birthday");
    const [customEmoji, setCustomEmoji] = useState("");
    const [boxColor, setBoxColor] = useState("");
    const [ribbonColor, setRibbonColor] = useState("");
    const [lockColor, setLockColor] = useState("");
    const [bgColor, setBgColor] = useState("");
    const [images, setImages] = useState<WishImage[]>([{ url: STOCK_PHOTOS[0].url, message: "" }]);

    const [step, setStep] = useState(0);
    const [slideDir, setSlideDir] = useState<"right" | "left">("right");
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
    const [customImageUrl, setCustomImageUrl] = useState("");

    const [isRecipientMode, setIsRecipientMode] = useState(false);
    const [isUnwrapped, setIsUnwrapped] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [previewUnwrapped, setPreviewUnwrapped] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    const jsConfettiRef = useRef<JSConfetti | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const celebrationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        jsConfettiRef.current = new JSConfetti();
        const checkMobile = () => setIsMobileDevice(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => {
            celebrationTimeoutsRef.current.forEach(clearTimeout);
            window.removeEventListener("resize", checkMobile);
        };
    }, []);

    // Decode URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const data = params.get("wish");
        if (!data) return;
        try {
            const str = LZString.decompressFromEncodedURIComponent(data) || decodeURIComponent(escape(atob(data)));
            const c = JSON.parse(str);
            setTheme(c.theme || "gold");
            setOccasion(c.occasion || "birthday");
            setSender(c.sender || "");
            setRecipient(c.recipient || "");
            setScratchMessage(c.scratchMessage || "");
            setAudioMelody(c.audioMelody || "birthday");
            setCustomEmoji(c.customEmoji || "");
            setBoxColor(c.boxColor || "");
            setRibbonColor(c.ribbonColor || "");
            setLockColor(c.lockColor || "");
            setBgColor(c.bgColor || "");
            if (c.images && Array.isArray(c.images)) setImages(c.images);
            else if (c.photoUrl) setImages([{ url: c.photoUrl, message: c.note || "" }]);
            setIsRecipientMode(true);
        } catch (e) { console.error("Wish decryption error", e); }
    }, []);

    // Keyboard nav
    useEffect(() => {
        if (isRecipientMode) return;
        const h = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && step < 3) goToStep(step + 1);
            if (e.key === "ArrowLeft" && step > 0) goToStep(step - 1);
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [step, isRecipientMode]);

    const goToStep = (next: number) => {
        setSlideDir(next > step ? "right" : "left");
        setStep(next);
        if (next === 3) setPreviewUnwrapped(false);
    };

    const generateWishLink = () => {
        const config = { theme, occasion, sender, recipient, images, scratchMessage, audioMelody, customEmoji, boxColor, ribbonColor, lockColor, bgColor };
        try {
            const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(config));
            const link = `${window.location.origin}/tools/wish-studio?wish=${compressed}`;
            setShareLink(link);
            setShowShareModal(true);
            jsConfettiRef.current?.addConfetti({ confettiColors: COLORS, confettiRadius: 5, confettiNumber: 80 });
        } catch (e) { console.error("Link generation failed", e); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const W = 180;
                canvas.width = W; canvas.height = Math.round(W * img.height / img.width);
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                updateImage(idx, { url: canvas.toDataURL("image/jpeg", 0.35) });
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const updateImage = (idx: number, updates: Partial<WishImage>) =>
        setImages(prev => prev.map((img, i) => i === idx ? { ...img, ...updates } : img));

    const addImage = () => {
        if (images.length >= 2) return;
        setImages(prev => [...prev, { url: STOCK_PHOTOS[Math.min(prev.length, STOCK_PHOTOS.length - 1)].url, message: "" }]);
    };

    const removeImage = (idx: number) => {
        if (images.length <= 1) return;
        setImages(prev => prev.filter((_, i) => i !== idx));
        setEditingImageIdx(null);
    };

    const stopSynthesizedMelody = useCallback(() => {
        if (audioTimeoutRef.current) { clearTimeout(audioTimeoutRef.current); audioTimeoutRef.current = null; }
        const ctx = audioCtxRef.current;
        if (ctx) { audioCtxRef.current = null; try { if (ctx.state !== "closed") ctx.close(); } catch { } }
    }, []);

    const playSynthesizedMelody = useCallback(() => {
        stopSynthesizedMelody();
        if (audioMuted) return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx(); audioCtxRef.current = ctx;
        let notes: { note: number; dur: number; gap: number }[] = [];
        let loopTime = 6000;
        if (audioMelody === "anniversary") {
            notes = [
                { note: 329.63, dur: 0.4, gap: 0.05 }, { note: 349.23, dur: 0.2, gap: 0.05 },
                { note: 392.00, dur: 0.6, gap: 0.1 }, { note: 523.25, dur: 0.6, gap: 0.1 },
                { note: 523.25, dur: 0.3, gap: 0.05 }, { note: 493.88, dur: 0.3, gap: 0.05 },
                { note: 440.00, dur: 0.3, gap: 0.05 }, { note: 392.00, dur: 0.8, gap: 0.1 },
            ]; loopTime = 5500;
        } else if (audioMelody === "gentle-chime") {
            notes = [
                { note: 523.25, dur: 0.5, gap: 0.1 }, { note: 659.25, dur: 0.3, gap: 0.08 },
                { note: 783.99, dur: 0.5, gap: 0.15 }, { note: 659.25, dur: 0.3, gap: 0.08 },
                { note: 523.25, dur: 0.4, gap: 0.1 }, { note: 392.00, dur: 0.6, gap: 0.12 },
                { note: 523.25, dur: 0.8, gap: 0.1 },
            ]; loopTime = 5800;
        } else {
            notes = [
                { note: 261.63, dur: 0.3, gap: 0.05 }, { note: 261.63, dur: 0.1, gap: 0.05 },
                { note: 293.66, dur: 0.4, gap: 0.05 }, { note: 261.63, dur: 0.4, gap: 0.05 },
                { note: 349.23, dur: 0.4, gap: 0.05 }, { note: 329.63, dur: 0.8, gap: 0.1 },
                { note: 261.63, dur: 0.3, gap: 0.05 }, { note: 261.63, dur: 0.1, gap: 0.05 },
                { note: 293.66, dur: 0.4, gap: 0.05 }, { note: 261.63, dur: 0.4, gap: 0.05 },
                { note: 392.00, dur: 0.4, gap: 0.05 }, { note: 349.23, dur: 0.8, gap: 0.1 },
            ]; loopTime = 6500;
        }
        let t = ctx.currentTime + 0.1;
        notes.forEach(n => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = "sine"; osc.frequency.setValueAtTime(n.note, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t); osc.stop(t + n.dur);
            t += n.dur + n.gap;
        });
        audioTimeoutRef.current = setTimeout(() => playSynthesizedMelody(), loopTime);
    }, [audioMuted, audioMelody, stopSynthesizedMelody]);

    const previewMelody = (id: string) => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const previewNotes: Record<string, { note: number; dur: number }[]> = {
            birthday: [{ note: 261.63, dur: 0.2 }, { note: 261.63, dur: 0.1 }, { note: 293.66, dur: 0.3 }],
            anniversary: [{ note: 329.63, dur: 0.3 }, { note: 349.23, dur: 0.15 }, { note: 392.00, dur: 0.4 }],
            "gentle-chime": [{ note: 523.25, dur: 0.3 }, { note: 659.25, dur: 0.2 }, { note: 783.99, dur: 0.4 }],
        };
        let t = ctx.currentTime + 0.05;
        (previewNotes[id] || []).forEach(n => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = "sine"; osc.frequency.setValueAtTime(n.note, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(t); osc.stop(t + n.dur);
            t += n.dur + 0.05;
        });
    };

    const trigger20sCelebration = () => {
        celebrationTimeoutsRef.current.forEach(clearTimeout); celebrationTimeoutsRef.current = [];
        const pop = (d: number, cfg: Parameters<JSConfetti["addConfetti"]>[0]) => {
            celebrationTimeoutsRef.current.push(setTimeout(() => jsConfettiRef.current?.addConfetti(cfg), d));
        };
        pop(0, { confettiColors: COLORS, confettiRadius: 6, confettiNumber: 120 });
        pop(1500, { confettiColors: ["#3B82F6", "#F472B6", "#fff"], confettiRadius: 5, confettiNumber: 80 });
        pop(3500, { emojis: [getOccasionEmoji(), "✨", "🎈", "🥳", "💫"], emojiSize: 30, confettiNumber: 30 });
        pop(5500, { confettiColors: ["#22D3EE", "#FDE047"], confettiRadius: 6, confettiNumber: 90 });
        pop(7500, { emojis: ["⭐", "✨", getOccasionEmoji(), "🌟"], emojiSize: 26, confettiNumber: 35 });
        pop(9500, { confettiColors: COLORS, confettiRadius: 5, confettiNumber: 100 });
    };

    const handleUnwrap = () => { setIsUnwrapped(true); trigger20sCelebration(); };

    useEffect(() => {
        if (isUnwrapped && isRecipientMode) playSynthesizedMelody();
        else stopSynthesizedMelody();
        return () => stopSynthesizedMelody();
    }, [isUnwrapped, isRecipientMode, audioMuted, audioMelody, playSynthesizedMelody, stopSynthesizedMelody]);

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    const copyToClipboard = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareLink)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(shareLink));
        } else {
            fallbackCopy(shareLink);
        }
    };

    const getOccasionLabel = () => OCCASIONS.find(o => o.id === occasion)?.label || occasion;
    const getOccasionEmoji = () => OCCASIONS.find(o => o.id === occasion)?.emoji || "🎉";

    /* ───────────────────────────────────────────
       RECIPIENT MODE
       ─────────────────────────────────────────── */
    if (isRecipientMode) {
        return (
            <div className="ws-root" style={{ minHeight: "100svh", background: "#FFA080", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", overflowX: "hidden", position: "relative" }}>
                <style>{GLOBAL_STYLES}</style>

                {/* Mute button */}
                <button
                    className="ws-btn"
                    onClick={() => setAudioMuted(!audioMuted)}
                    style={{ position: "absolute", top: 20, right: 20, zIndex: 50, display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#fff", border: "2px solid #000", borderRadius: 12, boxShadow: "3px 3px 0 #000", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}
                >
                    {audioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{audioMuted ? "Unmute" : "Mute"}</span>
                </button>

                {/* Mockup wrapper - clean full screen on mobile, browser window on desktop */}
                <div style={{
                    width: "100%",
                    maxWidth: isMobileDevice ? "100%" : 880,
                    background: "#fff",
                    border: isMobileDevice ? "none" : "4px solid #000",
                    borderRadius: isMobileDevice ? 0 : 30,
                    boxShadow: isMobileDevice ? "none" : "10px 10px 0 #000",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {/* Header bar - desktop only */}
                    {!isMobileDevice && (
                        <div style={{ padding: "12px 20px", borderBottom: "2px solid #000", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", border: "2px solid #000" }} />
                            <span className="ws-label" style={{ opacity: 0.6 }}>Recipient View</span>
                        </div>
                    )}

                    <div style={{
                        background: bgColor || DEFAULT_BG_COLORS[theme],
                        padding: isMobileDevice ? "24px 10px" : "40px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: isMobileDevice ? "auto" : 560,
                        position: "relative",
                        color: "#000"
                    }}>

                        {!isUnwrapped ? (
                            <FadeUp className="ws-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center", width: "100%" } as any}>
                                <div>
                                    <span style={{ display: "inline-block", padding: "4px 12px", background: "#fff", border: "2px solid #000", borderRadius: 99, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", boxShadow: "2px 2px 0 #000" }}>
                                        WISH STUDIO ✦
                                    </span>
                                    <h2 className="ws-display" style={{ marginTop: 12, fontSize: "clamp(20px,5vw,26px)", fontWeight: 700, color: "#000", lineHeight: 1.2 }}>
                                        <TypewriterText text={recipient ? `Hey ${recipient}! ✨` : "A Special Gift For You ✨"} />
                                    </h2>
                                    <p style={{ marginTop: 6, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#3f3f46" }}>
                                        Tap the gift to reveal your surprise
                                    </p>
                                </div>
                                <GiftBoxVisual theme={theme} isOpen={isUnwrapped} onOpen={handleUnwrap} customBoxColor={boxColor || undefined} customRibbonColor={ribbonColor || undefined} customLockColor={lockColor || undefined} />
                            </FadeUp>
                        ) : (
                            <div className="ws-slide-right" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                                <FadeUp delay={80} style={{ width: "100%" } as any}>
                                    <WishCardBook
                                        theme={theme} recipient={recipient} sender={sender}
                                        images={images} scratchMessage={scratchMessage}
                                        occasionLabel={getOccasionLabel()} occasionEmoji={getOccasionEmoji()}
                                        audioMuted={audioMuted}
                                        onScratchComplete={() => jsConfettiRef.current?.addConfetti({ emojis: ["🧡", "✨", "💫", "🎉"], confettiNumber: 25 })}
                                    />
                                </FadeUp>
                                <FadeUp delay={500} style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center" } as any}>
                                    <button className="ws-btn" onClick={() => setIsUnwrapped(false)} style={{ flex: isMobileDevice ? "0 1 auto" : 1, padding: isMobileDevice ? "10px 20px" : "11px 0", background: "#fff", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isMobileDevice ? 10 : 11, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "3px 3px 0 #000", color: "#000" }}>
                                        <RotateCcw size={13} /> Re-open
                                    </button>
                                    <a href="/tools/wish-studio" className="ws-btn" style={{ flex: isMobileDevice ? "0 1 auto" : 1, padding: isMobileDevice ? "10px 20px" : "11px 0", background: "#F97316", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isMobileDevice ? 10 : 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "3px 3px 0 #000", textDecoration: "none" }}>
                                        <Gift size={13} /> Create Yours
                                    </a>
                                </FadeUp>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 20 }}>
                    <span style={{ padding: "5px 14px", background: "#fff", border: "2px solid #000", borderRadius: 99, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", boxShadow: "2px 2px 0 #000" }}>
                        AssetNest Wish Studio
                    </span>
                </div>
            </div>
        );
    }

    /* ───────────────────────────────────────────
       STEP CONTENT
       ─────────────────────────────────────────── */
    const slideClass = slideDir === "right" ? "ws-slide-right" : "ws-slide-left";

    const renderStep = () => {
        switch (step) {
            /* ── STEP 0: OCCASION ── */
            case 0: return (
                <div key={0} className={slideClass} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                        <Label icon={<PartyPopper size={13} />}>Choose Occasion</Label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                            {OCCASIONS.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.id} className={`ws-chip${occasion === item.id ? " selected" : ""}`} onClick={() => setOccasion(item.id)}>
                                        <Icon size={14} strokeWidth={2.5} />
                                        {item.emoji} {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom emoji */}
                    <div style={{ borderTop: "2px solid #000", paddingTop: 20 }}>
                        <Label>Custom Emoji (optional)</Label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            <input
                                type="text" maxLength={2} placeholder="💖"
                                value={customEmoji} onChange={e => setCustomEmoji(e.target.value)}
                                className="ws-input"
                                style={{ width: 60, textAlign: "center", background: "#fff", border: "2px solid #000", borderRadius: 12, padding: "10px", fontSize: 20, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, boxShadow: "2px 2px 0 #000", outline: "none" }}
                            />
                            {["🎂", "🥂", "🎉", "💖", "💝", "🎁", "🚀", "🎈", "🍰", "🌟"].map(em => (
                                <button key={em} className={`ws-chip${customEmoji === em ? " selected" : ""}`}
                                    style={{ padding: "8px 10px", fontSize: 18, minHeight: 44, minWidth: 44 }}
                                    onClick={() => setCustomEmoji(em)}>
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme */}
                    <div style={{ borderTop: "2px solid #000", paddingTop: 20 }}>
                        <Label icon={<Sparkles size={13} />}>Gift Theme</Label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {THEMES.map(t => (
                                <button key={t.id} className={`ws-chip${theme === t.id && !boxColor ? " selected" : ""}`}
                                    style={{ flexDirection: "column", gap: 8, padding: "12px 8px", justifyContent: "center" }}
                                    onClick={() => { setTheme(t.id as any); setBoxColor(""); setRibbonColor(""); setLockColor(""); setBgColor(""); }}>
                                    <div style={{ width: "100%", height: 12, background: t.color, borderRadius: 4, border: "1.5px solid #000" }} />
                                    <span style={{ fontSize: 10 }}>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Color pickers */}
                        <div style={{ marginTop: 14, background: "#F9FAFB", border: "2px solid #000", borderRadius: 16, padding: "14px 16px", boxShadow: "3px 3px 0 #000" }}>
                            <Label>Custom Paint</Label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                                {[
                                    { label: "Box", value: boxColor || "#FDE047", set: setBoxColor },
                                    { label: "Ribbon", value: ribbonColor || "#F97316", set: setRibbonColor },
                                    { label: "Flower", value: lockColor || (theme === "gold" ? "#3B82F6" : theme === "cyber" ? "#10B981" : theme === "pastel" ? "#F472B6" : "#A855F7"), set: setLockColor },
                                    { label: "Screen Bg", value: bgColor || DEFAULT_BG_COLORS[theme], set: setBgColor },
                                ].map(c => (
                                    <div key={c.label}>
                                        <span className="ws-label" style={{ display: "block", marginBottom: 6, opacity: 0.6 }}>{c.label}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
                                                style={{ width: 36, height: 36, borderRadius: 8, border: "2px solid #000", cursor: "pointer", padding: 2 }} />
                                            <code style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#000" }}>{c.value}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );

            /* ── STEP 1: NAMES ── */
            case 1: return (
                <div key={1} className={slideClass} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                            <Label>Recipient</Label>
                            <WsInput value={recipient} onChange={setRecipient} placeholder="e.g. Alex" />
                        </div>
                        <div>
                            <Label>Sender</Label>
                            <WsInput value={sender} onChange={setSender} placeholder="e.g. Jordan" />
                        </div>
                    </div>

                    <div style={{ background: "#FEF08A", border: "2px solid #000", borderRadius: 16, padding: "14px 16px", boxShadow: "3px 3px 0 #000", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Sparkles size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#000", lineHeight: 1.6, margin: 0 }}>
                            These names appear on the gift box, greeting, and cards — the whole experience is personalised for your recipient.
                        </p>
                    </div>
                </div>
            );

            /* ── STEP 2: CONTENT ── */
            case 2: return (
                <div key={2} className={slideClass} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Photos */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <Label icon={<ImageIcon size={13} />}>Photos & Messages</Label>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, padding: "3px 10px", background: "#F3F4F6", border: "2px solid #000", borderRadius: 8 }}>
                                {images.length}/2
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {images.map((img, idx) => (
                                <div key={idx} style={{ background: "#F9FAFB", border: "2px solid #000", borderRadius: 18, padding: "14px 16px", boxShadow: "3px 3px 0 #000" }}>
                                    {/* Page header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <span className="ws-label" style={{ opacity: 0.5 }}>Page {idx + 1}</span>
                                        {images.length > 1 && (
                                            <button className="ws-btn" onClick={() => removeImage(idx)}
                                                style={{ padding: "6px 8px", background: "#FEE2E2", border: "2px solid #000", borderRadius: 10, cursor: "pointer", boxShadow: "1.5px 1.5px 0 #000", display: "flex", alignItems: "center" }}>
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        {/* Thumbnail */}
                                        <div style={{ position: "relative", flexShrink: 0 }}>
                                            <img src={img.url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, border: "2px solid #000", boxShadow: "2px 2px 0 #000" }} />
                                            <button className="ws-btn" onClick={() => { setEditingImageIdx(editingImageIdx === idx ? null : idx); setCustomImageUrl(""); }}
                                                style={{ position: "absolute", bottom: -6, right: -6, width: 28, height: 28, background: "#FDE047", border: "2px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "1.5px 1.5px 0 #000" }}>
                                                <ImageIcon size={11} />
                                            </button>
                                        </div>
                                        {/* Message */}
                                        <div style={{ flex: 1 }}>
                                            <span className="ws-label" style={{ display: "block", marginBottom: 6, opacity: 0.5 }}>Message</span>
                                            <WsInput value={img.message} onChange={v => updateImage(idx, { message: v })} placeholder="Write a beautiful memory…" rows={3} />
                                        </div>
                                    </div>

                                    {/* Image picker panel */}
                                    {editingImageIdx === idx && (
                                        <div className="ws-slide-right" style={{ marginTop: 14, borderTop: "2px solid #000", paddingTop: 14 }}>
                                            <span className="ws-label" style={{ display: "block", marginBottom: 8, opacity: 0.6 }}>Quick Photos</span>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                                                {STOCK_PHOTOS.map(pic => (
                                                    <button key={pic.id} className="ws-btn" onClick={() => { updateImage(idx, { url: pic.url }); setEditingImageIdx(null); }}
                                                        style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: img.url === pic.url ? "2.5px solid #3B82F6" : "2px solid #000", cursor: "pointer" }}>
                                                        <img src={pic.url} alt={pic.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                                                {/* Upload */}
                                                <div>
                                                    <span className="ws-label" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, opacity: 0.6 }}><Upload size={10} /> Upload</span>
                                                    <label className="ws-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: "#fff", border: "2px dashed #000", borderRadius: 12, cursor: "pointer", boxShadow: "2px 2px 0 #000", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "#000" }}>
                                                        <Upload size={14} /> Browse
                                                        <input type="file" accept="image/*" className="hidden" style={{ display: "none" }} onChange={e => { handleImageUpload(e, idx); setEditingImageIdx(null); }} />
                                                    </label>
                                                </div>
                                                {/* URL */}
                                                <div>
                                                    <span className="ws-label" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, opacity: 0.6 }}><Link2 size={10} /> URL</span>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <input type="url" placeholder="https://…" value={customImageUrl} onChange={e => setCustomImageUrl(e.target.value)}
                                                            className="ws-input"
                                                            style={{ flex: 1, background: "#fff", border: "2px solid #000", borderRadius: 10, padding: "8px 10px", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, outline: "none", boxShadow: "2px 2px 0 #000", color: "#000" }} />
                                                        <button className="ws-btn" disabled={!customImageUrl.trim()} onClick={() => { if (customImageUrl.trim()) { updateImage(idx, { url: customImageUrl.trim() }); setCustomImageUrl(""); setEditingImageIdx(null); } }}
                                                            style={{ padding: "8px 12px", background: "#86EFAC", border: "2px solid #000", borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, cursor: "pointer", boxShadow: "2px 2px 0 #000", color: "#000" }}>
                                                            OK
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {images.length < 2 && (
                                <button className="ws-btn" onClick={addImage}
                                    style={{ padding: "14px", background: "#fff", border: "2px dashed #000", borderRadius: 18, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "3px 3px 0 #000", cursor: "pointer", color: "#000" }}>
                                    <Plus size={14} /> Add Page Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Melody */}
                    <div style={{ borderTop: "2px solid #000", paddingTop: 20 }}>
                        <Label icon={<Music size={13} />}>Chime Melody</Label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 8 }}>
                            {MELODIES.map(m => (
                                <button key={m.id} className={`ws-chip${audioMelody === m.id ? " selected" : ""}`}
                                    style={{ flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 14px", minHeight: 56 }}
                                    onClick={() => { setAudioMelody(m.id); previewMelody(m.id); }}>
                                    <span>{m.label} {audioMelody === m.id && "♪"}</span>
                                    <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6, fontFamily: "'DM Sans',sans-serif", textTransform: "none", letterSpacing: 0 }}>{m.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scratch note */}
                    <div style={{ borderTop: "2px solid #000", paddingTop: 20 }}>
                        <Label>Scratch-off Secret (optional)</Label>
                        <WsInput value={scratchMessage} onChange={setScratchMessage} placeholder="e.g. Look under your pillow for a surprise! 🤫" />
                    </div>
                </div>
            );

            /* ── STEP 3: REVIEW ── */
            case 3: return (
                <div key={3} className={slideClass} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Summary */}
                    <div style={{ background: "#fff", border: "3px solid #000", borderRadius: 18, padding: "18px 20px", boxShadow: "4px 4px 0 #000" }}>
                        <div className="ws-label" style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 14 }}>Wish Summary</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {[
                                { label: "Occasion", value: `${getOccasionEmoji()} ${getOccasionLabel()}` },
                                { label: "Theme", value: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Preset` },
                                { label: "Recipient", value: recipient || "Someone Special", highlight: true },
                                { label: "Sender", value: sender || "A Friend" },
                            ].map(r => (
                                <div key={r.label}>
                                    <span className="ws-label" style={{ display: "block", opacity: 0.45, marginBottom: 3 }}>{r.label}</span>
                                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: r.highlight ? "#3B82F6" : "#000" }}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                        {scratchMessage && (
                            <div style={{ marginTop: 14, borderTop: "2px solid #000", paddingTop: 12 }}>
                                <span className="ws-label" style={{ display: "block", opacity: 0.45, marginBottom: 3 }}>Secret Message</span>
                                <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, fontStyle: "italic", color: "#000" }}>"{scratchMessage}"</span>
                            </div>
                        )}
                    </div>

                    <div style={{ background: "#FEF08A", border: "2px solid #000", borderRadius: 16, padding: "14px 16px", boxShadow: "3px 3px 0 #000", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Eye size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#000", lineHeight: 1.6, margin: 0 }}>
                            Test the interactive preview on the right — tap the gift box! When ready, generate your shareable link below.
                        </p>
                    </div>

                    <button className="ws-btn" onClick={generateWishLink}
                        style={{ width: "100%", padding: "16px", background: "#EF4444", border: "3px solid #000", borderRadius: 16, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.07em", textTransform: "uppercase", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "4px 4px 0 #000", cursor: "pointer" }}>
                        <Send size={15} /> Generate Wish Link
                    </button>
                </div>
            );

            default: return null;
        }
    };

    /* ───────────────────────────────────────────
       CREATOR MODE
       ─────────────────────────────────────────── */
    return (
        <div className="ws-root" style={{ minHeight: "100svh", background: "#FFA080", padding: "20px 16px 32px", overflowX: "hidden" }}>
            <style>{GLOBAL_STYLES}</style>

            <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 20, borderBottom: "3px solid #000", marginBottom: 24 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#fff", border: "2px solid #000", borderRadius: 99, width: "fit-content", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", boxShadow: "2px 2px 0 #000", color: "#000" }}>
                        <Wand2 size={10} /> Studio Mode
                    </span>
                    <h1 className="ws-display" style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 700, color: "#000", margin: 0, lineHeight: 1.1 }}>
                        Wish Studio
                    </h1>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "#3f3f46", maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
                        Build animated digital gift packages with 3D boxes, photo books, melodies & scratch surprises.
                    </p>
                </div>

                {/* ── MAIN GRID ── */}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,5fr) minmax(0,7fr)", gap: 24, alignItems: "start" }}
                    className="ws-grid">
                    <style>{`
                        @media (max-width: 900px) { .ws-grid { grid-template-columns: 1fr !important; } }
                    `}</style>

                    {/* LEFT: WIZARD */}
                    <div style={{ display: "flex", flexDirection: "column", height: 580, background: "#fff", border: "3.5px solid #000", borderRadius: 24, boxShadow: "8px 8px 0 #000", overflow: "hidden" }}>
                        {/* Step ticker */}
                        <div style={{ flexShrink: 0, padding: "16px 20px 14px", borderBottom: "2px solid #000" }}>
                            <StepTicker current={step} onNavigate={goToStep} />
                        </div>

                        {/* Content */}
                        <div className="ws-panel-scroll" style={{ flex: 1, padding: "20px 22px", overflowY: "auto" }}>
                            {renderStep()}
                        </div>

                        {/* Nav buttons */}
                        <div style={{ flexShrink: 0, padding: "14px 22px 18px", display: "flex", gap: 10, borderTop: "2px solid #000" }} className="ws-bottom-nav">
                            {step > 0 && (
                                <button className="ws-btn" onClick={() => goToStep(step - 1)}
                                    style={{ flex: 1, padding: "13px 0", background: "#fff", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "3px 3px 0 #000", cursor: "pointer", color: "#000" }}>
                                    <ChevronLeft size={15} /> Back
                                </button>
                            )}
                            {step < 3 && (
                                <button className="ws-btn" onClick={() => goToStep(step + 1)}
                                    style={{ flex: 1, padding: "13px 0", background: "#FDE047", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "3px 3px 0 #000", cursor: "pointer", color: "#000" }}>
                                    Next <ArrowRight size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: LIVE PREVIEW */}
                    <div style={{ background: "#fff", border: "4px solid #000", borderRadius: 30, boxShadow: "8px 8px 0 #000", minHeight: 540, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
                        {/* Preview label */}
                        <div style={{ padding: "12px 20px", borderBottom: "2px solid #000", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: step === 3 ? "#EF4444" : "#FDE047", border: "2px solid #000", animation: step === 3 ? "blink 1.2s ease-in-out infinite" : "none" }} />
                            <span className="ws-label" style={{ opacity: 0.6 }}>
                                {step === 3 ? "Interactive Preview — Tap to test" : "Live Preview"}
                            </span>
                        </div>

                        {/* Screen */}
                        <div style={{ flex: 1, background: bgColor || DEFAULT_BG_COLORS[theme], margin: 12, borderRadius: 20, border: "3px solid #000", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, color: "#000" }}>
                            {step === 3 ? (
                                !previewUnwrapped ? (
                                    <div className="ws-slide-right" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
                                        <div>
                                            <span style={{ display: "inline-block", padding: "3px 10px", background: "#fff", border: "1.5px solid #000", borderRadius: 99, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", boxShadow: "1.5px 1.5px 0 #000", color: "#000" }}>Recipient View</span>
                                            <h3 className="ws-display" style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}>
                                                {recipient ? `Hey ${recipient}! ✨` : "A Special Gift For You ✨"}
                                            </h3>
                                            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: "#3f3f46", margin: "4px 0 0" }}>Tap to test the card book</p>
                                        </div>
                                        <GiftBoxVisual theme={theme} isOpen={previewUnwrapped} onOpen={() => setPreviewUnwrapped(true)} customBoxColor={boxColor || undefined} customRibbonColor={ribbonColor || undefined} customLockColor={lockColor || undefined} />
                                    </div>
                                ) : (
                                    <div className="ws-slide-right" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                                        <WishCardBook theme={theme} recipient={recipient} sender={sender} images={images} scratchMessage={scratchMessage} occasionLabel={getOccasionLabel()} occasionEmoji={getOccasionEmoji()} audioMuted={true} onScratchComplete={() => { }} />
                                        <button className="ws-btn" onClick={() => setPreviewUnwrapped(false)}
                                            style={{ padding: "9px 18px", background: "#fff", border: "2px solid #000", borderRadius: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, boxShadow: "2px 2px 0 #000", cursor: "pointer" }}>
                                            <RotateCcw size={11} /> Reset Preview
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
                                    <GiftBoxVisual theme={theme} isOpen={false} onOpen={() => { }} customBoxColor={boxColor || undefined} customRibbonColor={ribbonColor || undefined} customLockColor={lockColor || undefined} />
                                    <div style={{ maxWidth: 300 }}>
                                        <h3 className="ws-display" style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px", textTransform: "capitalize" }}>
                                            {theme} Box · {getOccasionLabel()}
                                        </h3>
                                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: "#3f3f46", lineHeight: 1.6, margin: 0 }}>
                                            Your recipient opens this animated box to reveal a personalised photo book with your message.
                                        </p>
                                        {recipient && (
                                            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: "#EF4444", marginTop: 8 }}>For: {recipient}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SHARE MODAL ── */}
            {showShareModal && (
                <div onClick={e => { if (e.target === e.currentTarget) setShowShareModal(false); }}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 300 }}>
                    <div className="ws-modal-in" style={{ background: "#fff", border: "4px solid #000", borderRadius: 24, padding: "26px 28px", width: "100%", maxWidth: 460, boxShadow: "10px 10px 0 #000" }}>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <CheckCircle size={18} color="#16a34a" />
                            <h3 className="ws-display" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Wish Link Ready!</h3>
                        </div>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "#52525b", marginBottom: 18, lineHeight: 1.6 }}>
                            Your entire wish package is packed into this link. Copy it and send it to your friend!
                        </p>

                        <div style={{ display: "flex", background: "#F9FAFB", border: "2px solid #000", borderRadius: 14, padding: 6, gap: 8, alignItems: "center", boxShadow: "2px 2px 0 #000", marginBottom: 12 }}>
                            <span style={{ flex: 1, fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#000", paddingLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</span>
                            <button className="ws-btn" onClick={copyToClipboard}
                                style={{ flexShrink: 0, padding: "8px 14px", background: copied ? "#86EFAC" : "#FDE047", border: "2px solid #000", borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: "2px 2px 0 #000" }}>
                                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>

                        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 10, color: "#a1a1aa", marginBottom: 18 }}>
                            Link size: {(shareLink.length / 1024).toFixed(1)} KB
                        </p>

                        <div style={{ borderTop: "2px solid #000", paddingTop: 18, display: "flex", gap: 10 }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent("I created a special gift box for you! Open it here: " + shareLink)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="ws-btn"
                                style={{ flex: 1, padding: "12px 0", background: "#fff", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "3px 3px 0 #000", textDecoration: "none" }}>
                                <Share2 size={13} /> WhatsApp
                            </a>
                            <button className="ws-btn" onClick={() => setShowShareModal(false)}
                                style={{ padding: "12px 22px", background: "#000", border: "2px solid #000", borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "#fff", cursor: "pointer" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}