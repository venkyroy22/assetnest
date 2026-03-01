"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Trophy, Flame, Star, Zap, Coffee, Brain, Settings, X, Check } from "lucide-react";

type Mode = "focus" | "short" | "long";
interface Achievement { id: string; title: string; desc: string; icon: React.ReactNode; sessions: number; }

const ACHIEVEMENTS: Achievement[] = [
    { id: "first", title: "First Focus!", desc: "Completed your first Pomodoro", icon: <Star size={16} />, sessions: 1 },
    { id: "streak3", title: "On Fire! 🔥", desc: "3 sessions — you're rolling!", icon: <Flame size={16} />, sessions: 3 },
    { id: "streak5", title: "Flow State", desc: "5 sessions — deep focus achieved", icon: <Zap size={16} />, sessions: 5 },
    { id: "streak10", title: "Legendary", desc: "10 sessions — productivity god", icon: <Trophy size={16} />, sessions: 10 },
];

// ── SVG Ring constants ────────────────────────────────────────────────────────
const RADIUS = 130;
const CX = 160;
const CY = 160;
const CIRC = 2 * Math.PI * RADIUS;

// Quarter colors for the focus ring: blue → emerald → amber → violet
const FOCUS_Q_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#c084fc"];

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

// Returns the focus-ring color for a given progress (1=start, 0=end),
// blending smoothly across the last 15% of each quarter.
function getFocusColor(progress: number): string {
    const consumed = Math.min(1, Math.max(0, 1 - progress)); // 0→1 as timer drains
    const qF = Math.min(consumed * 4, 3.9999);               // 0–4 range
    const qi = Math.floor(qF);                               // which quarter: 0,1,2,3
    const qt = qF - qi;                                      // 0–1 within that quarter
    const BLEND = 0.85;
    if (qt > BLEND && qi < 3) {
        return lerpColor(FOCUS_Q_COLORS[qi], FOCUS_Q_COLORS[qi + 1], (qt - BLEND) / (1 - BLEND));
    }
    return FOCUS_Q_COLORS[qi];
}

// Writes ring + dot position AND color directly to DOM (called from RAF loop)
function applyProgress(
    progress: number,
    ringEl: SVGCircleElement | null,
    dotEl: SVGCircleElement | null,
    glowEl: SVGCircleElement | null,
    strokeColor?: string,
) {
    const p = Math.max(0, Math.min(1, progress));
    const offset = CIRC * (1 - p);
    // No -π/2 offset: the SVG is CSS -rotate-90°, so angle=0 → 12 o'clock visually
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
            dotEl.style.filter = `drop-shadow(0 0 8px ${strokeColor})`;
        }
    }
}

// ── SVG Ring — rendered once, animated at 60fps via DOM refs ─────────────────
function Ring({
    color, ringRef, dotRef, glowRef,
}: {
    color: string;
    ringRef: React.RefObject<SVGCircleElement | null>;
    dotRef: React.RefObject<SVGCircleElement | null>;
    glowRef: React.RefObject<SVGCircleElement | null>;
}) {
    return (
        <svg width="320" height="320" className="absolute inset-0 -rotate-90">
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#27272a" strokeWidth="10" />
            <circle ref={glowRef} cx={CX} cy={CY} r={RADIUS + 6}
                fill="none" stroke={color} strokeWidth="1.5" opacity="0"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} />
            <circle ref={ringRef} cx={CX} cy={CY} r={RADIUS}
                fill="none" stroke={color} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} />
            <circle ref={dotRef} cx={CX + RADIUS} cy={CY} r="7"
                fill={color} opacity="0"
                style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
    );
}

// ── Particle Burst ────────────────────────────────────────────────────────────
function Particles({ active }: { active: boolean }) {
    const [particles] = useState(() =>
        Array.from({ length: 18 }, (_, i) => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            color: ["#fff", "#34d399", "#818cf8", "#fbbf24", "#f87171"][i % 5],
            delay: Math.random() * 0.4,
            dur: 0.5 + Math.random() * 0.7,
        }))
    );
    if (!active) return null;
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            {particles.map((p, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full animate-ping"
                    style={{
                        left: `${p.left}%`, top: `${p.top}%`, backgroundColor: p.color,
                        animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`
                    }} />
            ))}
        </div>
    );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ visible, onClose, focusMins, shortMins, longMins, onSave }: {
    visible: boolean; onClose: () => void;
    focusMins: number; shortMins: number; longMins: number;
    onSave: (f: number, s: number, l: number) => void;
}) {
    const [f, setF] = useState(focusMins);
    const [s, setS] = useState(shortMins);
    const [l, setL] = useState(longMins);
    useEffect(() => { setF(focusMins); setS(shortMins); setL(longMins); }, [focusMins, shortMins, longMins]);
    if (!visible) return null;

    const NumInput = ({ label, value, onChange, min, max }: {
        label: string; value: number; onChange: (v: number) => void; min: number; max: number;
    }) => (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
            <div className="flex items-center gap-2">
                <button onClick={() => onChange(Math.max(min, value - 1))}
                    className="w-8 h-8 border border-zinc-700 text-white hover:border-white transition-all font-black text-lg flex items-center justify-center">−</button>
                <input type="number" min={min} max={max} value={value}
                    onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
                    className="w-16 text-center bg-zinc-800 border border-zinc-700 text-white font-black text-sm py-1.5 focus:outline-none focus:border-white" />
                <button onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-8 h-8 border border-zinc-700 text-white hover:border-white transition-all font-black text-lg flex items-center justify-center">+</button>
                <span className="text-[10px] text-zinc-500 font-medium">min</span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Timer Settings</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-6">
                    <NumInput label="Focus Duration" value={f} onChange={setF} min={1} max={120} />
                    <NumInput label="Short Break" value={s} onChange={setS} min={1} max={60} />
                    <NumInput label="Long Break" value={l} onChange={setL} min={1} max={60} />
                </div>
                <button onClick={() => { onSave(f, s, l); onClose(); }}
                    className="mt-8 w-full py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <Check size={14} /> Save & Apply
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PomodoroPage() {
    const [focusMins, setFocusMins] = useState(25);
    const [shortMins, setShortMins] = useState(5);
    const [longMins, setLongMins] = useState(15);

    const durations = { focus: focusMins * 60, short: shortMins * 60, long: longMins * 60 };

    const COLORS: Record<Mode, string> = { focus: "#ffffff", short: "#34d399", long: "#818cf8" };
    const BG: Record<Mode, string> = { focus: "from-zinc-900 to-zinc-950", short: "from-emerald-950 to-zinc-950", long: "from-indigo-950 to-zinc-950" };
    const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };

    // One distinct color per quarter of the Pomodoro cycle
    const CYCLE_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#c084fc"] as const;
    // Quarter labels
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
    useEffect(() => { modeRef.current = mode; }, [mode]);

    // Keep totalSecsRef in sync
    useEffect(() => { totalSecsRef.current = totalSecs; }, [totalSecs]);

    // RAF loop — drives ring + dot at 60fps, with quarter-color blending
    useEffect(() => {
        const frame = () => {
            if (endTimeMsRef.current !== null) {
                const remaining = Math.max(0, (endTimeMsRef.current - Date.now()) / 1000);
                const p = totalSecsRef.current > 0 ? remaining / totalSecsRef.current : 0;
                // Pick stroke color: quarter-blend during focus, static during breaks
                const strokeColor = modeRef.current === "focus"
                    ? getFocusColor(p)
                    : modeRef.current === "short" ? "#34d399" : "#818cf8";
                applyProgress(p, ringRef.current, dotRef.current, glowRef.current, strokeColor);
                if (glowRef.current) glowRef.current.setAttribute("opacity", "0.12");
            }
            rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Beep
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
        } catch { /* blocked */ }
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
        setRunning(false);
        beep();
        setBurst(true);
        setTimeout(() => setBurst(false), 1500);
        if (mode === "focus") {
            const next = sessions + 1;
            const cycleNext = (pomodoroInCycle + 1) % 4;
            setSessions(next);
            setPomodoroInCycle(cycleNext);
            tryUnlock(next);
            const nextMode: Mode = cycleNext === 0 ? "long" : "short";
            setTimeout(() => { setMode(nextMode); setSecondsLeft(durations[nextMode]); setTotalSecs(durations[nextMode]); }, 500);
        } else {
            setTimeout(() => { setMode("focus"); setSecondsLeft(durations.focus); setTotalSecs(durations.focus); }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, sessions, pomodoroInCycle, beep, tryUnlock, durations.focus, durations.short, durations.long]);

    // 1-second interval — display text + completion
    useEffect(() => {
        if (running) {
            endTimeMsRef.current = Date.now() + secondsLeft * 1000;
            if (glowRef.current) glowRef.current.setAttribute("opacity", "0.12");
            intervalRef.current = setInterval(() => {
                setSecondsLeft(s => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!);
                        endTimeMsRef.current = null;
                        if (glowRef.current) glowRef.current.setAttribute("opacity", "0");
                        onComplete();
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        } else {
            endTimeMsRef.current = null;
            if (glowRef.current) glowRef.current.setAttribute("opacity", "0");
            const p = totalSecsRef.current > 0 ? secondsLeft / totalSecsRef.current : 0;
            applyProgress(p, ringRef.current, dotRef.current, glowRef.current);
            clearInterval(intervalRef.current!);
        }
        return () => clearInterval(intervalRef.current!);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, onComplete]);

    const switchMode = (m: Mode) => {
        setRunning(false); setMode(m);
        setSecondsLeft(durations[m]); setTotalSecs(durations[m]);
    };
    const reset = () => { setRunning(false); setSecondsLeft(totalSecs); };
    const skip = () => {
        const next: Mode = mode === "focus" ? ((pomodoroInCycle + 1) % 4 === 0 ? "long" : "short") : "focus";
        switchMode(next);
    };
    const saveSettings = (f: number, s: number, l: number) => {
        setFocusMins(f); setShortMins(s); setLongMins(l);
        setRunning(false);
        const newSecs = mode === "focus" ? f * 60 : mode === "short" ? s * 60 : l * 60;
        setSecondsLeft(newSecs); setTotalSecs(newSecs);
    };

    return (
        <div className={`min-h-[80vh] py-16 px-6 md:px-10 bg-gradient-to-b ${BG[mode]} transition-all duration-1000`}>

            {/* ── Header (full width) ── */}
            <div className="max-w-7xl mx-auto mb-10 flex items-start justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-black/30 mb-4">
                        <Brain size={11} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Productivity Tool</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase text-white mb-1">Pomodoro Timer</h1>
                    <p className="text-zinc-400 text-sm font-medium">Stay focused. Build habits. Achieve more.</p>
                </div>
                <button onClick={() => setSettingsOpen(true)}
                    className="mt-2 p-2.5 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all"
                    title="Timer Settings">
                    <Settings size={18} />
                </button>
            </div>

            {/* ── 3-column grid ── */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_auto_280px] gap-8 lg:gap-10 items-start">

                {/* ── LEFT: Cycle + Sessions ── */}
                <div className="flex flex-col gap-6 lg:pt-14">

                    {/* Current cycle */}
                    <div className="p-5 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Cycle</span>
                            <div className="flex items-center gap-1.5">
                                <Coffee size={12} className="text-zinc-500" />
                                <span className="text-[9px] font-black text-zinc-500">
                                    {4 - pomodoroInCycle} to long break
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            {[0, 1, 2, 3].map(i => {
                                const qColor = CYCLE_COLORS[i];
                                const isDone = i < pomodoroInCycle;
                                const isCurrent = i === pomodoroInCycle && mode === "focus";
                                const isEmpty = !isDone && !isCurrent;
                                return (
                                    <div key={i} className="flex-1 flex flex-col gap-1.5">
                                        <div
                                            className={`h-4 w-full rounded-sm transition-all duration-700 ${isCurrent ? "animate-pulse" : ""
                                                }`}
                                            style={{
                                                backgroundColor: isEmpty ? "#27272a" : qColor,
                                                boxShadow: isDone
                                                    ? `0 0 8px ${qColor}66`
                                                    : isCurrent
                                                        ? `0 0 12px ${qColor}99`
                                                        : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[8px] font-black text-center block transition-all duration-700"
                                            style={{ color: isEmpty ? "#3f3f46" : qColor }}
                                        >
                                            {QUARTER_LABELS[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total sessions */}
                    <div className="p-5 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Sessions</span>
                            <div className="flex items-center gap-1.5">
                                <Flame size={13} className={sessions >= 3 ? "text-orange-400" : "text-zinc-600"} />
                                <span className="text-sm font-black text-white">{sessions}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.max(8, sessions + 2) }).map((_, i) => (
                                <div key={i}
                                    className={`h-2.5 w-2.5 rounded-sm transition-all duration-500 ${i < sessions ? "bg-white" : "bg-zinc-800"
                                        }`}
                                />
                            ))}
                        </div>
                        {sessions === 0 && (
                            <p className="text-[10px] text-zinc-600 font-medium mt-3">Complete your first session!</p>
                        )}
                    </div>
                </div>

                {/* ── CENTER: Mode + Ring + Controls ── */}
                <div className="flex flex-col items-center">
                    {/* Mode selector */}
                    <div className="flex gap-2 mb-8">
                        {(["focus", "short", "long"] as Mode[]).map(m => (
                            <button key={m} onClick={() => switchMode(m)}
                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${mode === m ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                                    }`}>
                                {LABELS[m]}
                            </button>
                        ))}
                    </div>

                    {/* Ring */}
                    <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
                        <Ring color={color} ringRef={ringRef} dotRef={dotRef} glowRef={glowRef} />
                        <Particles active={burst} />
                        <div className="relative z-10 flex flex-col items-center gap-1 select-none">
                            <div className="text-7xl font-black tracking-tighter tabular-nums"
                                style={{ color, textShadow: `0 0 24px ${color}44` }}>
                                {mins}:{secs}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]"
                                style={{ color, opacity: running ? 1 : 0.4 }}>
                                {running ? LABELS[mode] : "Paused"}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-medium mt-1">
                                {LABELS[mode]} · {mode === "focus" ? focusMins : mode === "short" ? shortMins : longMins} min
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button onClick={reset} title="Reset"
                            className="p-3 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all active:scale-95">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={() => setRunning(r => !r)}
                            className="w-20 h-20 flex items-center justify-center border-2 transition-all duration-300 active:scale-95 relative overflow-hidden group"
                            style={{ borderColor: color, boxShadow: running ? `0 0 28px ${color}44` : "none" }}>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: `${color}15` }} />
                            {running
                                ? <Pause size={28} style={{ color }} />
                                : <Play size={28} style={{ color }} className="translate-x-0.5" />}
                        </button>
                        <button onClick={skip} title="Skip"
                            className="p-3 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all active:scale-95">
                            <SkipForward size={18} />
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Achievements ── */}
                <div className="lg:pt-14">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Achievements</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {ACHIEVEMENTS.map(a => {
                            const done = unlocked.includes(a.id);
                            return (
                                <div key={a.id}
                                    className={`p-4 border flex flex-col gap-3 transition-all duration-500 ${done ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950/30 opacity-40 grayscale"
                                        }`}>
                                    <div className={done ? "text-amber-400" : "text-zinc-600"}>{a.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">{a.title}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium mt-1 leading-relaxed">{a.desc}</p>
                                    </div>
                                    {done && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 w-fit">Unlocked</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Unlock progress */}
                    <div className="p-4 border border-zinc-800/50 bg-zinc-950/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3">Unlock Progress</p>
                        <div className="space-y-2.5">
                            {ACHIEVEMENTS.map(a => {
                                const done = unlocked.includes(a.id);
                                const pct = Math.min(100, sessions > 0 ? Math.round((sessions / a.sessions) * 100) : 0);
                                return (
                                    <div key={a.id} className="flex items-center gap-2">
                                        <span className="text-[8px] text-zinc-600 w-16 shrink-0 truncate">{a.title}</span>
                                        <div className="flex-1 h-1 bg-zinc-800 overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${done ? "bg-amber-400" : "bg-zinc-600"}`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[8px] text-zinc-600 w-8 text-right shrink-0">
                                            {done ? "✓" : `${sessions}/${a.sessions}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievement Toast */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
                {toast && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900 border border-amber-500/50 shadow-2xl shadow-amber-500/10 min-w-[300px]">
                        <div className="text-amber-400 shrink-0">{toast.icon}</div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Achievement Unlocked!</p>
                            <p className="text-sm font-black text-white">{toast.title}</p>
                            <p className="text-[11px] text-zinc-400 font-medium">{toast.desc}</p>
                        </div>
                        <Trophy size={18} className="text-amber-400 shrink-0 ml-2 animate-bounce" />
                    </div>
                )}
            </div>

            <SettingsPanel
                visible={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                focusMins={focusMins} shortMins={shortMins} longMins={longMins}
                onSave={saveSettings}
            />
        </div>
    );
}
