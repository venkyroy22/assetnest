"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Coffee, Play, Pause, RotateCcw, SkipForward, Star, Flame, Zap,
    Trophy, Settings2, X, Check, Gamepad2, HelpCircle, CloudRain,
    Music, Trees, ArrowLeft, ShieldCheck, Sparkles, Package, Volume2,
    VolumeX, Bell, Timer
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { useMusic } from "@/components/MusicProvider";
import { MiniGames } from "./games";

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

type Mode = "focus" | "short" | "long";
interface Achievement { id: string; title: string; desc: string; icon: React.ReactNode; sessions: number; }

const ACHIEVEMENTS: Achievement[] = [
    { id: "first", title: "First Focus!", desc: "Completed 1st Pomodoro", icon: <Star size={14} />, sessions: 1 },
    { id: "streak3", title: "On Fire! 🔥", desc: "3 sessions completed", icon: <Flame size={14} />, sessions: 3 },
    { id: "streak5", title: "Flow State", desc: "5 sessions deep focus", icon: <Zap size={14} />, sessions: 5 },
    { id: "streak10", title: "Legendary", desc: "10 productivity blocks", icon: <Trophy size={14} />, sessions: 10 },
];

const AMBIENCE_TRACKS = [
    { id: "lofi", name: "Lofi Beats", icon: <Music size={13} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "rain", name: "Rainy Night", icon: <CloudRain size={13} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "coffee", name: "Coffee Shop", icon: <Coffee size={13} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "forest", name: "Deep Forest", icon: <Trees size={13} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const RADIUS = 125;
const CX = 150;
const CY = 150;
const CIRC = 2 * Math.PI * RADIUS;

const FOCUS_Q_COLORS = ["#4db8d4", "#7dcea0", "#d4a843", "#e06c75"];

function lerpColor(a: string, b: string, t: number): string {
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const [ar, ag, ab] = [(ah >> 16) & 0xff, (ah >> 8) & 0xff, ah & 0xff];
    const [br, bg, bb] = [(bh >> 16) & 0xff, (bh >> 8) & 0xff, bh & 0xff];
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${bl})`;
}

function getFocusColor(progress: number): string {
    const consumed = Math.min(1, Math.max(0, 1 - progress));
    const qF = Math.min(consumed * 4, 3.9999);
    const qi = Math.floor(qF);
    const qt = qF - qi;
    const BLEND = 0.85;
    if (qt > BLEND && qi < 3) {
        return lerpColor(FOCUS_Q_COLORS[qi], FOCUS_Q_COLORS[qi + 1], (qt - BLEND) / (1 - BLEND));
    }
    return FOCUS_Q_COLORS[qi];
}

function applyProgress(
    progress: number,
    ringEl: SVGCircleElement | null,
    dotEl: SVGCircleElement | null,
    glowEl: SVGCircleElement | null,
    strokeColor?: string,
) {
    const p = Math.max(0, Math.min(1, progress));
    const offset = CIRC * (1 - p);
    const angle = 2 * Math.PI * p;
    const dotX = CX + RADIUS * Math.cos(angle);
    const dotY = CY + RADIUS * Math.sin(angle);

    if (ringEl) {
        ringEl.style.strokeDashoffset = String(offset);
        if (strokeColor) ringEl.style.stroke = strokeColor;
    }
    if (glowEl) {
        glowEl.style.strokeDashoffset = String(offset);
        if (strokeColor) glowEl.style.stroke = strokeColor;
    }
    if (dotEl) {
        dotEl.setAttribute("cx", String(dotX));
        dotEl.setAttribute("cy", String(dotY));
        dotEl.style.opacity = p > 0.005 ? "1" : "0";
        if (strokeColor) {
            dotEl.style.fill = strokeColor;
        }
    }
}

function Ring({
    color, ringRef, dotRef, glowRef,
}: {
    color: string;
    ringRef: React.RefObject<SVGCircleElement | null>;
    dotRef: React.RefObject<SVGCircleElement | null>;
    glowRef: React.RefObject<SVGCircleElement | null>;
}) {
    return (
        <svg width="300" height="300" className="absolute inset-0 -rotate-90">
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth="8" />
            <circle ref={glowRef} cx={CX} cy={CY} r={RADIUS}
                fill="none" stroke={color} strokeWidth="12" opacity="0.15"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} />
            <circle ref={ringRef} cx={CX} cy={CY} r={RADIUS}
                fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} />
            <circle ref={dotRef} cx={CX + RADIUS} cy={CY} r="6"
                fill={color} opacity="0" />
        </svg>
    );
}

function RainEffect({ active }: { active: boolean | string | null }) {
    const [drops] = useState(() =>
        Array.from({ length: 36 }, (_, i) => ({
            left: Math.random() * 100,
            top: -20 - (Math.random() * 80),
            size: 1 + Math.random() * 1.5,
            dur: 15 + Math.random() * 15,
            delay: -Math.random() * 30,
            opacity: 0.08 + Math.random() * 0.12,
            blur: 0.5 + Math.random() * 1,
        }))
    );

    if (!active) return null;

    return (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
            {drops.map((d, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: `${d.left}%`,
                        width: `${d.size}px`,
                        height: `${d.size * 14}px`,
                        borderRadius: "9999px",
                        background: "rgba(77, 184, 212, 0.4)",
                        opacity: d.opacity,
                        filter: `blur(${d.blur}px)`,
                        animation: `rain-slide ${d.dur}s linear infinite`,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes rain-slide {
                    0% { transform: translateY(-10vh) scaleY(1); opacity: 0; }
                    5% { opacity: 0.3; }
                    95% { opacity: 0.2; }
                    100% { transform: translateY(110vh) scaleY(1.3); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function Particles({ active }: { active: boolean }) {
    const [particles] = useState(() =>
        Array.from({ length: 16 }, (_, i) => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            color: ["#4db8d4", "#7dcea0", "#d4a843", "#e06c75", "#bb86fc"][i % 5],
            delay: Math.random() * 0.3,
            dur: 0.6 + Math.random() * 0.4,
        }))
    );
    if (!active) return null;
    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "50%" }}>
            {particles.map((p, i) => (
                <div key={i} className="animate-ping"
                    style={{
                        position: "absolute", width: 6, height: 6, borderRadius: "50%",
                        left: `${p.left}%`, top: `${p.top}%`, backgroundColor: p.color,
                        animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`
                    }} />
            ))}
        </div>
    );
}

function WaterReminderAnimation({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [isHydrating, setIsHydrating] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsHydrating(false);
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.connect(gain); gain.connect(ctx.destination);
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.2);
            } catch {}
        }
    }, [visible]);

    const handleHydrated = () => {
        setIsHydrating(true);
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine"; osc.connect(gain); gain.connect(ctx.destination);
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.35);
        } catch {}
        setTimeout(onClose, 900);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16
        }}>
            <div style={{
                position: "relative", width: "100%", maxWidth: 420, background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 4, padding: 24, textAlign: "center",
                overflow: "hidden"
            }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
                    <div style={{
                        width: 70, height: 100, background: "#2a2a2a", border: `1px solid ${T.border}`,
                        borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "flex-end", position: "relative"
                    }}>
                        <div style={{
                            width: "100%", background: T.accent, position: "relative",
                            transition: "all 0.8s ease",
                            height: isHydrating ? "0%" : "75%"
                        }}>
                            <div style={{ position: "absolute", top: 0, width: "100%", height: 6, background: "rgba(255,255,255,0.4)" }} />
                        </div>
                    </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: "0 0 6px" }}>
                    Hydration Break
                </h3>
                <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 20px" }}>
                    Take a quick sip of water to reset your focus and maintain cognitive sharpness.
                </p>

                <button
                    onClick={handleHydrated}
                    disabled={isHydrating}
                    style={{
                        height: 36, padding: "0 24px", background: T.accent, border: `1px solid ${T.accent}`,
                        borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                    }}
                >
                    <Check size={14} /> I'm Hydrated
                </button>
            </div>
        </div>
    );
}

function SettingsPanel({ visible, onClose, focusMins, shortMins, longMins, waterReminder, waterInterval, onSave }: {
    visible: boolean; onClose: () => void;
    focusMins: number; shortMins: number; longMins: number;
    waterReminder: boolean; waterInterval: number;
    onSave: (f: number, s: number, l: number, wr: boolean, wi: number) => void;
}) {
    const [f, setF] = useState(focusMins);
    const [s, setS] = useState(shortMins);
    const [l, setL] = useState(longMins);
    const [wr, setWr] = useState(waterReminder);
    const [wi, setWi] = useState(waterInterval);

    useEffect(() => { 
        setF(focusMins); setS(shortMins); setL(longMins); 
        setWr(waterReminder); setWi(waterInterval);
    }, [focusMins, shortMins, longMins, waterReminder, waterInterval]);

    if (!visible) return null;

    const NumInput = ({ label, value, onChange, min, max }: {
        label: string; value: number; onChange: (v: number) => void; min: number; max: number;
    }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em" }}>{label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    style={{
                        width: 28, height: 28, background: T.surfaceHi, border: `1px solid ${T.border}`,
                        borderRadius: 2, color: T.textPri, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >−</button>
                <input
                    type="number" min={min} max={max} value={value}
                    onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
                    style={{
                        width: 56, textAlign: "center", background: "#2a2a2a", border: `1px solid ${T.border}`,
                        borderRadius: 2, color: T.textPri, fontSize: 12, padding: "4px 0", outline: "none"
                    }}
                />
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    style={{
                        width: 28, height: 28, background: T.surfaceHi, border: `1px solid ${T.border}`,
                        borderRadius: 2, color: T.textPri, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >+</button>
                <span style={{ fontSize: 10, color: T.muted, marginLeft: 2 }}>mins</span>
            </div>
        </div>
    );

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16
        }} onClick={onClose}>
            <div style={{
                position: "relative", width: "100%", maxWidth: 360, background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 4, padding: 20
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timer Settings</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", display: "flex" }}>
                        <X size={14} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <NumInput label="Focus Duration" value={f} onChange={setF} min={1} max={120} />
                    <NumInput label="Short Break" value={s} onChange={setS} min={1} max={60} />
                    <NumInput label="Long Break" value={l} onChange={setL} min={1} max={60} />
                    
                    <div style={{ paddingTop: 12, borderTop: `1px solid ${T.borderDim}`, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: T.textPri }}>Hydration Reminders</span>
                                <span style={{ fontSize: 10, color: T.muted }}>Drink water alerts during sessions</span>
                            </div>
                            <button
                                onClick={() => setWr(!wr)}
                                style={{
                                    width: 36, height: 20, borderRadius: 10,
                                    background: wr ? T.accent : "#2a2a2a", border: `1px solid ${T.border}`,
                                    position: "relative", cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                <div style={{
                                    width: 14, height: 14, borderRadius: "50%",
                                    background: wr ? "#1a1a1a" : "#888",
                                    position: "absolute", top: 2, left: wr ? 18 : 2, transition: "all 0.2s"
                                }} />
                            </button>
                        </div>
                        {wr && (
                            <NumInput label="Reminder Interval" value={wi} onChange={setWi} min={1} max={120} />
                        )}
                    </div>
                </div>

                <button
                    onClick={() => { onSave(f, s, l, wr, wi); onClose(); }}
                    style={{
                        marginTop: 18, width: "100%", height: 34, background: T.accent,
                        border: `1px solid ${T.accent}`, borderRadius: 3, color: "#1a1a1a",
                        fontWeight: 600, fontSize: 11, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                >
                    <Check size={13} /> Save Settings
                </button>
            </div>
        </div>
    );
}

function BreakDialog({ isOpen, onClose, onOpenGames }: { isOpen: boolean; onClose: () => void; onOpenGames: () => void }) {
    if (!isOpen) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16
        }}>
            <div style={{
                position: "relative", width: "100%", maxWidth: 360, background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 4, padding: 22, textAlign: "center"
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: T.surfaceHi,
                    border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.accent, margin: "0 auto 12px"
                }}>
                    <Gamepad2 size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: "0 0 6px" }}>Take a Break!</h3>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: "0 0 18px" }}>
                    Excellent work completing your focus sprint. Recharge your attention capacity with an offline mini-game.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                        onClick={() => { onOpenGames(); onClose(); }}
                        style={{
                            height: 36, background: T.accent, border: `1px solid ${T.accent}`,
                            borderRadius: 3, color: "#1a1a1a", fontWeight: 600, fontSize: 11, cursor: "pointer"
                        }}
                    >
                        Play Mini Games
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            height: 30, background: "transparent", border: "none",
                            color: T.textSec, fontSize: 10, cursor: "pointer"
                        }}
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pomodoro Focus Timer",
    description: "Scientific time-boxing pomodoro focus timer with audio ambience and break mini-games. 100% free and private.",
    url: "https://assetnest.gloyas.com/tools/pomodoro",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PomodoroPage() {
    const [focusMins, setFocusMins] = useState(25);
    const [shortMins, setShortMins] = useState(5);
    const [longMins, setLongMins] = useState(15);
    const [waterReminder, setWaterReminder] = useState(false);
    const [waterInterval, setWaterInterval] = useState(30);
    const durations = { focus: focusMins * 60, short: shortMins * 60, long: longMins * 60 };

    const COLORS: Record<Mode, string> = { focus: "#4db8d4", short: "#7dcea0", long: "#bb86fc" };
    const CYCLE_COLORS = ["#4db8d4", "#7dcea0", "#d4a843", "#e06c75"] as const;
    const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"] as const;

    const [mode, setMode] = useState<Mode>("focus");
    const [secondsLeft, setSecondsLeft] = useState(durations.focus);
    const [totalSecs, setTotalSecs] = useState(durations.focus);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [pomodoroInCycle, setPomodoroInCycle] = useState(0);
    const [unlocked, setUnlocked] = useState<string[]>([]);
    const [toast, setToast] = useState<Achievement | null>(null);
    const [burst, setBurst] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showWaterReminder, setShowWaterReminder] = useState(false);
    const [lastWaterTime, setLastWaterTime] = useState(Date.now());
    const [gamesOpen, setGamesOpen] = useState(false);
    const [showBreakDialog, setShowBreakDialog] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [musicVolume, setMusicVolume] = useState(0.4);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const {
        youtubeUrl, setYoutubeUrl, playYoutube,
        isYTPlaying, toggleYT
    } = useMusic();

    const musicAudioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<AudioContext | null>(null);
    const ringRef = useRef<SVGCircleElement>(null);
    const dotRef = useRef<SVGCircleElement>(null);
    const glowRef = useRef<SVGCircleElement>(null);
    const rafRef = useRef<number>(0);
    const endTimeMsRef = useRef<number | null>(null);
    const totalSecsRef = useRef<number>(durations.focus);

    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const secs = String(secondsLeft % 60).padStart(2, "0");
    const color = COLORS[mode];

    const modeRef = useRef<Mode>("focus");
    const pomodoroInCycleRef = useRef<number>(0);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { totalSecsRef.current = totalSecs; }, [totalSecs]);
    useEffect(() => { pomodoroInCycleRef.current = pomodoroInCycle; }, [pomodoroInCycle]);

    useEffect(() => {
        if (!musicAudioRef.current) {
            musicAudioRef.current = new Audio();
            musicAudioRef.current.loop = true;
        }
        const audio = musicAudioRef.current;
        const track = AMBIENCE_TRACKS.find(t => t.id === activeTrack);
        if (activeTrack && track) {
            if (audio.src !== track.url) audio.src = track.url;
            if (isMusicPlaying) audio.play().catch(() => setIsMusicPlaying(false));
            else audio.pause();
        } else audio.pause();
    }, [activeTrack, isMusicPlaying]);

    useEffect(() => {
        if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume;
    }, [musicVolume]);

    useEffect(() => {
        if (!isLoaded) return;
        const state = {
            focusMins, shortMins, longMins,
            mode, secondsLeft, totalSecs,
            sessions, pomodoroInCycle, unlocked,
            waterReminder, waterInterval, lastWaterTime,
            lastSaved: Date.now(),
            running
        };
        localStorage.setItem("assetnest_pomodoro_state", JSON.stringify(state));
    }, [focusMins, shortMins, longMins, mode, secondsLeft, totalSecs, sessions, pomodoroInCycle, unlocked, running, isLoaded, waterReminder, waterInterval, lastWaterTime]);

    useEffect(() => {
        const saved = localStorage.getItem("assetnest_pomodoro_state");
        if (saved) {
            try {
                const s = JSON.parse(saved);
                setFocusMins(s.focusMins);
                setShortMins(s.shortMins);
                setLongMins(s.longMins);
                setMode(s.mode);
                setTotalSecs(s.totalSecs);
                setSessions(s.sessions);
                setPomodoroInCycle(s.pomodoroInCycle);
                setUnlocked(s.unlocked || []);
                setWaterReminder(s.waterReminder || false);
                setWaterInterval(s.waterInterval || 30);
                
                const loadedWaterTime = s.lastWaterTime || Date.now();
                const minsSinceLastWater = (Date.now() - loadedWaterTime) / (1000 * 60);
                if (minsSinceLastWater >= (s.waterInterval || 30)) {
                    setLastWaterTime(Date.now());
                } else {
                    setLastWaterTime(loadedWaterTime);
                }

                if (s.running) {
                    const elapsed = Math.floor((Date.now() - s.lastSaved) / 1000);
                    const remaining = Math.max(0, s.secondsLeft - elapsed);
                    if (remaining > 0) {
                        setSecondsLeft(remaining);
                        setRunning(true);
                    } else {
                        setSecondsLeft(0);
                        setRunning(false);
                    }
                } else {
                    setSecondsLeft(s.secondsLeft);
                    setRunning(false);
                }
            } catch (e) {
                console.error("Failed to load pomodoro state", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        const frame = () => {
            if (endTimeMsRef.current !== null) {
                const remaining = Math.max(0, (endTimeMsRef.current - Date.now()) / 1000);
                const p = totalSecsRef.current > 0 ? remaining / totalSecsRef.current : 0;
                const cycleIdx = modeRef.current === "long" ? 3 : pomodoroInCycleRef.current;
                const strokeColor = modeRef.current === "focus" ? getFocusColor(p) : CYCLE_COLORS[cycleIdx];
                applyProgress(p, ringRef.current, dotRef.current, glowRef.current, strokeColor);
            }
            rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const beep = useCallback(() => {
        try {
            if (!audioRef.current) audioRef.current = new AudioContext();
            const ctx = audioRef.current;
            [[660, 0], [660, 0.15], [880, 0.3]].forEach(([freq, delay]) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.25, ctx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
                o.start(ctx.currentTime + delay);
                o.stop(ctx.currentTime + delay + 0.4);
            });
        } catch {}
    }, []);

    const tryUnlock = useCallback((total: number) => {
        ACHIEVEMENTS.forEach(a => {
            if (a.sessions === total && !unlocked.includes(a.id)) {
                setUnlocked(prev => [...prev, a.id]);
                setToast(a);
                setTimeout(() => setToast(null), 3500);
            }
        });
    }, [unlocked]);

    const onComplete = useCallback(() => {
        setRunning(false); beep(); setBurst(true);
        setTimeout(() => setBurst(false), 1500);
        if (mode === "focus") {
            const next = sessions + 1;
            const cycleNext = (pomodoroInCycle + 1) % 4;
            setSessions(next); setPomodoroInCycle(cycleNext);
            tryUnlock(next);
            const nextMode: Mode = cycleNext === 0 ? "long" : "short";
            setTimeout(() => { 
                setMode(nextMode); 
                setSecondsLeft(durations[nextMode]); 
                setTotalSecs(durations[nextMode]); 
                setShowBreakDialog(true);
            }, 500);
        } else {
            setTimeout(() => { setMode("focus"); setSecondsLeft(durations.focus); setTotalSecs(durations.focus); }, 500);
        }
    }, [mode, sessions, pomodoroInCycle, beep, tryUnlock, durations]);

    useEffect(() => {
        if (running) {
            endTimeMsRef.current = Date.now() + secondsLeft * 1000;
            intervalRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    const next = prev - 1;
                    if (next <= 0) {
                        clearInterval(intervalRef.current!);
                        onComplete();
                        return 0;
                    }
                    if (waterReminder) {
                        const minsSinceWater = (Date.now() - lastWaterTime) / (1000 * 60);
                        if (minsSinceWater >= waterInterval) {
                            setShowWaterReminder(true);
                            setRunning(false);
                        }
                    }
                    return next;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            endTimeMsRef.current = null;
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, onComplete, waterReminder, waterInterval, lastWaterTime]);

    const handleWaterDone = () => {
        setShowWaterReminder(false);
        setLastWaterTime(Date.now());
    };

    const switchMode = (m: Mode) => {
        setRunning(false);
        setMode(m);
        setSecondsLeft(durations[m]);
        setTotalSecs(durations[m]);
    };

    const reset = () => { setRunning(false); setSecondsLeft(totalSecs); };
    
    const skip = () => {
        const next: Mode = mode === "focus" ? ((pomodoroInCycle + 1) % 4 === 0 ? "long" : "short") : "focus";
        switchMode(next);
        if (next !== "focus") setShowBreakDialog(true);
    };

    const saveSettings = (f: number, s: number, l: number, wr: boolean, wi: number) => {
        setFocusMins(f); setShortMins(s); setLongMins(l);
        setWaterReminder(wr); setWaterInterval(wi);
        setRunning(false);
        const newSecs = mode === "focus" ? f * 60 : mode === "short" ? s * 60 : l * 60;
        setSecondsLeft(newSecs); setTotalSecs(newSecs);
    };

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, paddingBottom: 80, position: "relative" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {isMusicPlaying && <RainEffect active={true} />}

            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666666; }
            `}</style>

            {/* ── HEADER ── */}
            <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
                <Link href="/tools" style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
                    color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
                }}>
                    <ArrowLeft size={11} strokeWidth={2} /> Back
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                        <Timer size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.textPri }}>Pomodoro Focus</span>
                    <button 
                        onClick={() => setShowHelp(true)} 
                        style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.muted, cursor: "pointer", display: "flex" }}
                        title="Help Guide"
                    >
                        <HelpCircle size={11} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 10 }}>

                {/* Main 3-Column Workspace */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                    alignItems: "start",
                    marginBottom: 36
                }}>
                    {/* ── LEFT PANEL: Cycle & Streaks ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Focus Loop Card */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em", fontWeight: 500 }}>Focus Loop</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.accent }}>
                                    <Coffee size={11} />
                                    <span>{4 - pomodoroInCycle} to Long Break</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{
                                            height: 8, borderRadius: 2, border: `1px solid ${T.borderDim}`,
                                            background: i < pomodoroInCycle ? CYCLE_COLORS[i] : (i === pomodoroInCycle && mode === "focus" ? CYCLE_COLORS[i] : "#2a2a2a"),
                                            transition: "all 0.3s"
                                        }} />
                                        <span style={{ fontSize: 9, textAlign: "center", color: i <= pomodoroInCycle ? T.textPri : T.muted }}>
                                            {QUARTER_LABELS[i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Streak Tracker Card */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em", fontWeight: 500 }}>Completed Blocks</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: sessions >= 3 ? "#e06c75" : T.textPri }}>
                                    <Flame size={13} className={sessions >= 3 ? "animate-pulse" : ""} />
                                    <span>{sessions} Sessions</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {Array.from({ length: Math.max(10, sessions + 2) }).map((_, i) => (
                                    <div key={i} style={{
                                        width: 14, height: 14, borderRadius: 2,
                                        background: i < sessions ? T.accent : "#2a2a2a",
                                        border: `1px solid ${i < sessions ? T.accentDark : T.borderDim}`,
                                        transition: "all 0.2s"
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Ambience & YouTube Audio Bar */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", gap: 10
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em", fontWeight: 500 }}>Audio Ambience</span>
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    style={{
                                        background: T.surfaceHi, border: `1px solid ${T.border}`,
                                        borderRadius: 2, padding: "2px 6px", fontSize: 10, color: T.textPri,
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                    }}
                                >
                                    <Settings2 size={11} /> Config
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: 4 }}>
                                {AMBIENCE_TRACKS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            if (activeTrack === t.id) {
                                                setIsMusicPlaying(false);
                                                setActiveTrack(null);
                                            } else {
                                                setActiveTrack(t.id);
                                                setIsMusicPlaying(true);
                                            }
                                        }}
                                        style={{
                                            flex: 1, height: 28, background: activeTrack === t.id ? T.accent : T.surfaceHi,
                                            border: `1px solid ${activeTrack === t.id ? T.accent : T.border}`,
                                            borderRadius: 2, color: activeTrack === t.id ? "#1a1a1a" : T.textSec,
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                        }}
                                        title={t.name}
                                    >
                                        {t.icon}
                                    </button>
                                ))}
                            </div>

                            {/* YouTube stream input */}
                            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="Paste YouTube stream URL..."
                                    style={{
                                        flex: 1, height: 26, background: "#2a2a2a", border: `1px solid ${T.borderDim}`,
                                        borderRadius: 2, padding: "0 8px", fontSize: 10, color: T.textPri, outline: "none"
                                    }}
                                />
                                <button
                                    onClick={() => playYoutube()}
                                    style={{
                                        height: 26, padding: "0 8px", background: "#b91c1c",
                                        border: "none", borderRadius: 2, color: "#fff", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                    title="Play Stream"
                                >
                                    <Play size={10} fill="currentColor" />
                                </button>
                                {isYTPlaying && (
                                    <button
                                        onClick={() => toggleYT()}
                                        style={{
                                            height: 26, padding: "0 8px", background: T.surfaceHi,
                                            border: `1px solid ${T.border}`, borderRadius: 2, color: T.textPri, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}
                                        title="Pause Stream"
                                    >
                                        <Pause size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER PANEL: Main Interactive Ring ── */}
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: 4, padding: "24px 20px",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        minHeight: 460
                    }}>
                        {/* Mode Switcher Pill */}
                        <div style={{
                            display: "inline-flex", background: "#2a2a2a", border: `1px solid ${T.borderDim}`,
                            borderRadius: 20, padding: 3, gap: 3, marginBottom: 24
                        }}>
                            {(["focus", "short", "long"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    style={{
                                        padding: "4px 14px", borderRadius: 16, border: "none",
                                        background: mode === m ? T.surfaceHi : "transparent",
                                        color: mode === m ? T.textPri : T.textSec,
                                        fontSize: 11, fontWeight: 500, cursor: "pointer",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {m === "focus" ? "Focus" : m === "short" ? "Short Break" : "Long Break"}
                                </button>
                            ))}
                        </div>

                        {/* Circular SVG Ring */}
                        <div style={{
                            position: "relative", width: 300, height: 300,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "#282828", borderRadius: "50%",
                            border: `1px solid ${T.borderDim}`, marginBottom: 24
                        }}>
                            <Ring color={color} ringRef={ringRef} dotRef={dotRef} glowRef={glowRef} />
                            <Particles active={burst} />
                            <div style={{
                                position: "relative", zIndex: 10, display: "flex",
                                flexDirection: "column", alignItems: "center", userSelect: "none"
                            }}>
                                <div style={{ fontSize: 52, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.textPri, letterSpacing: "-0.03em" }}>
                                    {mins}:{secs}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color, marginTop: 2 }}>
                                    {running ? (mode === "focus" ? "Active Focus" : "Break Session") : "Paused"}
                                </span>
                            </div>
                        </div>

                        {/* Primary Control Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button
                                onClick={reset}
                                title="Reset Timer"
                                style={{
                                    width: 36, height: 36, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: T.textSec, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
                                }}
                            >
                                <RotateCcw size={15} />
                            </button>

                            <button
                                onClick={() => setRunning(r => !r)}
                                style={{
                                    width: 56, height: 56, background: T.accent, border: `1px solid ${T.accent}`,
                                    borderRadius: "50%", color: "#1a1a1a", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.15s", boxShadow: `0 0 12px ${T.accentDim}`
                                }}
                                title={running ? "Pause" : "Start"}
                            >
                                {running ? <Pause size={20} strokeWidth={2.5} /> : <Play size={20} strokeWidth={2.5} style={{ marginLeft: 2 }} />}
                            </button>

                            <button
                                onClick={skip}
                                title="Skip to Next"
                                style={{
                                    width: 36, height: 36, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: T.textSec, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
                                }}
                            >
                                <SkipForward size={15} />
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Mini Games & Badges ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Break Recharge Mini-Games Card */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16,
                            opacity: mode !== "focus" ? 1 : 0.6,
                            transition: "opacity 0.2s"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: T.accent }}>
                                <Gamepad2 size={16} />
                                <span style={{ fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em", fontWeight: 500 }}>Break Recharge</span>
                            </div>
                            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: "0 0 12px" }}>
                                Relax your attention capacity with an offline mini-game during your break.
                            </p>
                            <button
                                onClick={() => setGamesOpen(true)}
                                disabled={mode === "focus"}
                                style={{
                                    width: "100%", height: 32, background: mode !== "focus" ? T.accent : T.surfaceHi,
                                    border: `1px solid ${mode !== "focus" ? T.accent : T.border}`,
                                    borderRadius: 2, color: mode !== "focus" ? "#1a1a1a" : T.muted,
                                    fontWeight: 600, fontSize: 11, cursor: mode !== "focus" ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                                }}
                            >
                                Launch Break Games
                            </button>
                        </div>

                        {/* Unlocked Badges */}
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 16
                        }}>
                            <span style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em", fontWeight: 500, marginBottom: 10 }}>
                                Productivity Badges
                            </span>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {ACHIEVEMENTS.map(a => {
                                    const done = unlocked.includes(a.id);
                                    return (
                                        <div
                                            key={a.id}
                                            style={{
                                                padding: 10, borderRadius: 3,
                                                background: done ? "#2e2e2e" : "#2a2a2a",
                                                border: `1px solid ${done ? T.border : T.borderDim}`,
                                                opacity: done ? 1 : 0.45,
                                                display: "flex", flexDirection: "column", gap: 4
                                            }}
                                        >
                                            <div style={{ color: done ? "#d4a843" : T.muted }}>
                                                {a.icon}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 600, color: T.textPri, lineHeight: 1.2 }}>
                                                    {a.title}
                                                </div>
                                                <div style={{ fontSize: 8, color: T.muted, textTransform: "uppercase", marginTop: 2 }}>
                                                    {a.desc}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── SEO RICH CONTENT SECTION ─── */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderDim}`, paddingTop: 36 }}>
                    {/* Top Badges */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                        <Chip icon={<ShieldCheck size={10} />} label="100% In-Browser Privacy" />
                        <Chip icon={<Sparkles size={10} />} label="Free & Unlimited" />
                        <Chip icon={<Package size={10} />} label="Zero Server Uploads" />
                    </div>

                    {/* Section Header */}
                    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 36px" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 500, color: T.textPri, marginBottom: 8 }}>
                            Free Online Pomodoro Focus Timer - Maximize Productivity
                        </h2>
                        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                            Structure your workday into focused 25-minute sprints separated by structured 5-minute break intervals. Designed with audio ambience loops, hydration reminders, and local progress tracking stored entirely within your browser memory.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 44 }}>
                        {[
                            {
                                icon: Timer,
                                title: "Scientific Time-Boxing",
                                desc: "Split cognitive sessions into 25-minute sprints and 5-minute breaks to eliminate mental fatigue and burnout."
                            },
                            {
                                icon: Zap,
                                title: "Integrated Audio Ambience",
                                desc: "Listen to built-in lofi beats, rain sounds, coffee shop murmurs, or stream your favorite YouTube study radio."
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Client-Side Privacy",
                                desc: "Session records, streak counters, and custom timer durations are stored solely in local browser memory."
                            },
                            {
                                icon: Bell,
                                title: "Smart Hydration Alerts",
                                desc: "Configure periodic water reminders to preserve hydration, alertness, and physical posture during work."
                            },
                            {
                                icon: Gamepad2,
                                title: "Offline Break Mini-Games",
                                desc: "Recharge your mind during short breaks with lightweight offline games directly in your browser."
                            },
                            {
                                icon: Trophy,
                                title: "Gamified Streak Badges",
                                desc: "Unlock productivity achievements as you complete sequential focus blocks throughout your day."
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
                            How to Use the Pomodoro Technique Effectively
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                            {[
                                { step: "1", title: "Select a Focus Task", desc: "Choose one single task to work on and start the 25-minute focus countdown timer." },
                                { step: "2", title: "Work Without Distraction", desc: "Immerse in your work until the gentle completion chime rings; avoid multitasking." },
                                { step: "3", title: "Take a 5-Minute Break", desc: "Step away from the screen, drink water, or recharge with a quick mini-game before next cycle." }
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
                                question="What is the science behind the Pomodoro Technique?"
                                answer="Developed by Francesco Cirillo in the late 1980s, the technique uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. Frequent breaks bolster mental agility and prevent cognitive fatigue."
                            />
                            <FAQItem 
                                question="Is my session data saved if I close the tab?"
                                answer="Yes! All completed session counts, unlocked streak badges, and custom time durations are automatically synchronized to your browser's local storage and restored whenever you return."
                            />
                            <FAQItem 
                                question="Can I customize focus and break lengths?"
                                answer="Yes. Click the 'Config' button to set custom lengths for Focus, Short Break, and Long Break durations, as well as customize hydration intervals."
                            />
                            <FAQItem 
                                question="How does the ambient audio player work?"
                                answer="You can choose from four offline ambient tracks (Lofi, Rain, Coffee Shop, Forest) or paste any YouTube live music stream link directly into the deck player."
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Achievement Toast */}
            <div style={{
                position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
                opacity: toast ? 1 : 0, pointerEvents: toast ? "auto" : "none", transition: "all 0.3s ease"
            }}>
                {toast && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 18px",
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                    }}>
                        <div style={{ color: "#d4a843" }}>{toast.icon}</div>
                        <div>
                            <div style={{ fontSize: 9, textTransform: "uppercase", color: T.textSec, letterSpacing: "0.05em" }}>Achievement Earned!</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{toast.title}</div>
                        </div>
                        <Trophy size={16} color="#d4a843" style={{ marginLeft: 8 }} />
                    </div>
                )}
            </div>

            {/* Help / Documentation Modal */}
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Pomodoro Focus Documentation"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 500, color: T.accent, margin: "0 0 8px" }}>
                            Scientific Time-Boxing Architecture
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            The Pomodoro Technique maximizes mental focus by splitting cognitive blocks into 25-minute sprints accompanied by forced 5-minute break resets. This reduces fatigue, preserves long-term stamina, and prevents attention fragmentation.
                        </p>
                    </section>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Timer size={14} style={{ color: T.accent }} /> Work-Rest Cycles
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: 16, color: T.textSec, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                                <li><strong>Focus Sprint:</strong> 25 minutes of mono-tasking concentration.</li>
                                <li><strong>Short Break:</strong> 5 minutes of eye rest and physical stretching.</li>
                                <li><strong>Long Break:</strong> 15-30 minutes after every 4 completed sprints.</li>
                            </ul>
                        </section>

                        <section style={{ background: "#333333", padding: 14, borderRadius: 4, border: `1px solid ${T.border}` }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                                <ShieldCheck size={14} style={{ color: T.accent }} /> Privacy Compliance
                            </h4>
                            <p style={{ margin: "0 0 10px", color: T.textSec, fontSize: 11 }}>
                                All timer states, streaks, and settings are saved locally in your browser's localStorage. Zero tracking or remote server calls.
                            </p>
                            <div style={{ padding: "6px 10px", background: "#2a2a2a", border: `1px solid ${T.borderDim}`, borderRadius: 3, fontSize: 10, color: "#aaa" }}>
                                Spec: LocalStorage Persistence • AudioContext Chimes • Zero Network Overhead
                            </div>
                        </section>
                    </div>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h4 style={{ fontSize: 12, fontWeight: 500, color: T.textPri, margin: "0 0 10px" }}>
                            Key Capabilities
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Can I customize durations?" 
                                answer="Yes. Click the 'Config' button in the audio bar to adjust durations for all three modes." 
                            />
                            <FAQItem 
                                question="Does the timer work in background tabs?" 
                                answer="Yes. The timer calculates elapsed timestamps using Date.now() when the tab resumes to ensure accurate timekeeping." 
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>

            <SettingsPanel 
                visible={settingsOpen} 
                onClose={() => setSettingsOpen(false)} 
                focusMins={focusMins} 
                shortMins={shortMins} 
                longMins={longMins} 
                waterReminder={waterReminder} 
                waterInterval={waterInterval} 
                onSave={saveSettings} 
            />

            <WaterReminderAnimation 
                visible={showWaterReminder} 
                onClose={handleWaterDone} 
            />

            <MiniGames 
                isOpen={gamesOpen}
                onClose={() => setGamesOpen(false)}
            />

            <BreakDialog 
                isOpen={showBreakDialog}
                onClose={() => setShowBreakDialog(false)}
                onOpenGames={() => setGamesOpen(true)}
            />
        </div>
    );
}
