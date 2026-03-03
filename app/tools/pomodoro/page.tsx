"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Trophy, Flame, Star, Zap, Coffee, Brain, Settings, X, Check, Music, Volume2, VolumeX, CloudRain, Trees, Wind, Moon, Search, Link as LinkIcon, ArrowLeft, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useMusic } from "@/components/MusicProvider";

type Mode = "focus" | "short" | "long";
interface Achievement { id: string; title: string; desc: string; icon: React.ReactNode; sessions: number; }

const ACHIEVEMENTS: Achievement[] = [
    { id: "first", title: "First Focus!", desc: "Completed your first Pomodoro", icon: <Star size={16} />, sessions: 1 },
    { id: "streak3", title: "On Fire! 🔥", desc: "3 sessions — you're rolling!", icon: <Flame size={16} />, sessions: 3 },
    { id: "streak5", title: "Flow State", desc: "5 sessions — deep focus achieved", icon: <Zap size={16} />, sessions: 5 },
    { id: "streak10", title: "Legendary", desc: "10 sessions — productivity god", icon: <Trophy size={16} />, sessions: 10 },
];

const AMBIENCE_TRACKS = [
    { id: "lofi", name: "Lofi Beats", icon: <Music size={14} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "rain", name: "Rainy Night", icon: <CloudRain size={14} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "coffee", name: "Coffee Shop", icon: <Coffee size={14} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "forest", name: "Deep Forest", icon: <Trees size={14} />, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const RADIUS = 130;
const CX = 160;
const CY = 160;
const CIRC = 2 * Math.PI * RADIUS;

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
            dotEl.style.filter = `drop-shadow(0 0 8px ${strokeColor})`;
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

function RainEffect({ active }: { active: boolean | string | null }) {
    const [drops] = useState(() =>
        Array.from({ length: 50 }, (_, i) => ({
            left: Math.random() * 100,
            top: -20 - (Math.random() * 80),
            size: 1 + Math.random() * 2,
            dur: 15 + Math.random() * 20,
            delay: -Math.random() * 40,
            opacity: 0.1 + Math.random() * 0.3,
            blur: 0.5 + Math.random() * 1,
        }))
    );

    if (!active) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {drops.map((d, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-white/30"
                    style={{
                        left: `${d.left}%`,
                        width: `${d.size}px`,
                        height: `${d.size * 18}px`,
                        opacity: d.opacity,
                        filter: `blur(${d.blur}px)`,
                        boxShadow: '0 0 10px rgba(255,255,255,0.05)',
                        animation: `rain-slide ${d.dur}s linear infinite`,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}
            <style jsx global>{`
                @keyframes rain-slide {
                    0% { transform: translateY(-10vh) scaleY(1); opacity: 0; }
                    5% { opacity: 0.6; }
                    95% { opacity: 0.4; }
                    100% { transform: translateY(110vh) scaleY(1.5); opacity: 0; }
                }
            `}</style>
            <div className="absolute inset-0 bg-black/5" />
        </div>
    );
}

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

export default function PomodoroPage() {
    const [focusMins, setFocusMins] = useState(25);
    const [shortMins, setShortMins] = useState(5);
    const [longMins, setLongMins] = useState(15);
    const durations = { focus: focusMins * 60, short: shortMins * 60, long: longMins * 60 };

    const COLORS: Record<Mode, string> = { focus: "#ffffff", short: "#34d399", long: "#818cf8" };
    const BG: Record<Mode, string> = { focus: "from-zinc-900 to-zinc-950", short: "from-emerald-950 to-zinc-950", long: "from-indigo-950 to-zinc-950" };
    const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };

    const CYCLE_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#c084fc"] as const;
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

    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [musicVolume, setMusicVolume] = useState(0.4);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [playerMode, setPlayerMode] = useState<"ambient" | "youtube">("ambient");

    const {
        youtubeUrl, setYoutubeUrl, currentYoutubeEmbed, playYoutube,
        isYTPlaying, toggleYT, skipYoutubeTrack, prevYoutubeTrack,
        ytVolume, adjustYTVolume, resetPlayer
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
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { totalSecsRef.current = totalSecs; }, [totalSecs]);

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
        const frame = () => {
            if (endTimeMsRef.current !== null) {
                const remaining = Math.max(0, (endTimeMsRef.current - Date.now()) / 1000);
                const p = totalSecsRef.current > 0 ? remaining / totalSecsRef.current : 0;
                const strokeColor = modeRef.current === "focus" ? getFocusColor(p) : modeRef.current === "short" ? "#34d399" : "#818cf8";
                applyProgress(p, ringRef.current, dotRef.current, glowRef.current, strokeColor);
                if (glowRef.current) glowRef.current.setAttribute("opacity", "0.12");
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
        } catch { /* ignored */ }
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
            setTimeout(() => { setMode(nextMode); setSecondsLeft(durations[nextMode]); setTotalSecs(durations[nextMode]); }, 500);
        } else {
            setTimeout(() => { setMode("focus"); setSecondsLeft(durations.focus); setTotalSecs(durations.focus); }, 500);
        }
    }, [mode, sessions, pomodoroInCycle, beep, tryUnlock, durations]);

    useEffect(() => {
        if (running) {
            endTimeMsRef.current = Date.now() + secondsLeft * 1000;
            intervalRef.current = setInterval(() => {
                setSecondsLeft(s => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!);
                        endTimeMsRef.current = null;
                        onComplete();
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        } else {
            endTimeMsRef.current = null;
            const p = totalSecsRef.current > 0 ? secondsLeft / totalSecsRef.current : 0;
            applyProgress(p, ringRef.current, dotRef.current, glowRef.current);
            clearInterval(intervalRef.current!);
        }
        return () => clearInterval(intervalRef.current!);
    }, [running, onComplete, secondsLeft]);

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
        <div className={`relative min-h-[80vh] py-16 px-6 md:px-10 bg-gradient-to-b ${BG[mode]} transition-all duration-1000 overflow-hidden`}>
            {/* Dynamic Music Background */}
            <RainEffect active={isMusicPlaying || (currentYoutubeEmbed && isYTPlaying)} />

            {/* ── Header (Centered & Balanced) ── */}
            <div className="max-w-5xl mx-auto mb-10 flex flex-col items-center justify-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-black/30 w-fit">
                    <Brain size={11} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Productivity Tool</span>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <h1 className="text-5xl font-black tracking-tighter uppercase text-white">Pomodoro Timer</h1>

                    <div className="flex flex-col items-center gap-6">
                        {/* Functional Mini Player Bar */}
                        <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-2 pr-5 rounded-2xl shadow-2xl relative backdrop-blur-xl border-t-zinc-700/30">
                            {currentYoutubeEmbed ? (
                                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
                                    <div id="music-player-dock" className="w-full sm:w-56 h-32 rounded-xl bg-black/40 border border-zinc-800/50 shadow-inner relative shrink-0 overflow-hidden flex flex-col items-center justify-center gap-2 group/placeholder">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                                        <div className="relative flex flex-col items-center gap-2 px-6 text-center">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30 group-hover/placeholder:scale-110 transition-transform duration-500">
                                                <Music size={16} className="text-zinc-500" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Active Viewport</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 py-1 w-full sm:w-auto">
                                        <div className="flex items-center justify-between gap-3 mb-2 px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                                                    <div className="relative h-2 w-2 rounded-full bg-red-500" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Live</span>
                                            </div>
                                            <div className="flex items-center gap-2 group/vol bg-white/5 px-2 py-1 rounded-md border border-zinc-800">
                                                <Volume2 size={10} className="text-zinc-500" />
                                                <input type="range" min="0" max="100" value={ytVolume} onChange={(e) => adjustYTVolume(Number(e.target.value))}
                                                    className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => prevYoutubeTrack()} className="flex-1 flex items-center justify-center p-1.5 bg-white/5 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all hover:bg-white/10" title="Previous Track"><SkipBack size={12} /></button>
                                                <button onClick={() => toggleYT()} className={`flex-[2] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all px-3 py-1.5 rounded-lg border ${isYTPlaying ? "bg-white/5 text-zinc-400 border-zinc-800 hover:text-white" : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"}`} title={isYTPlaying ? "Pause Session" : "Resume Session"}>
                                                    {isYTPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                                    <span>{isYTPlaying ? "Pause" : "Resume"}</span>
                                                </button>
                                                <button onClick={() => skipYoutubeTrack()} className="flex-1 flex items-center justify-center p-1.5 bg-white/5 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all hover:bg-white/10" title="Next Track"><SkipForward size={12} /></button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => window.open(youtubeUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-red-400 transition-all bg-white/5 px-2 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700" title="Open on YouTube"><ExternalLink size={10} className="text-zinc-500" /><span>Source</span></button>
                                                <button onClick={() => resetPlayer()} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-red-500/80 hover:text-red-400 transition-all bg-red-500/5 px-2 py-1.5 rounded-lg border border-red-500/10 hover:border-red-500/20" title="Clear URL & Reset"><Trash2 size={10} /><span>Reset</span></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 h-12 px-2">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 shrink-0 border border-zinc-700/30">
                                        <Music size={16} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="relative flex items-center gap-3">
                                            <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="PASTE YOUTUBE URL..."
                                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 focus:outline-none w-44 placeholder:text-zinc-700" />
                                            <button onClick={() => playYoutube()} className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all hover:scale-105 active:scale-95" title="Start Playing"><Play size={12} fill="currentColor" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setSettingsOpen(true)} className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all rounded-xl shadow-xl hover:shadow-white/5" title="Timer Settings"><Settings size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_auto_280px] gap-8 lg:gap-10 items-start">
                {/* ── LEFT: Cycle + Sessions ── */}
                <div className="flex flex-col gap-6 lg:pt-14">
                    <div className="p-5 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Cycle</span>
                            <div className="flex items-center gap-1.5">
                                <Coffee size={12} className="text-zinc-500" />
                                <span className="text-[9px] font-black text-zinc-500">{4 - pomodoroInCycle} to long break</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex-1 flex flex-col gap-1.5">
                                    <div className={`h-4 w-full rounded-sm transition-all duration-700 ${i === pomodoroInCycle && mode === "focus" ? "animate-pulse" : ""}`}
                                        style={{ backgroundColor: i < pomodoroInCycle ? CYCLE_COLORS[i] : (i === pomodoroInCycle && mode === "focus" ? CYCLE_COLORS[i] : "#27272a"), boxShadow: i < pomodoroInCycle ? `0 0 8px ${CYCLE_COLORS[i]}66` : (i === pomodoroInCycle && mode === "focus" ? `0 0 12px ${CYCLE_COLORS[i]}99` : "none") }} />
                                    <span className="text-[8px] font-black text-center block transition-all duration-700" style={{ color: i <= pomodoroInCycle ? CYCLE_COLORS[i] : "#3f3f46" }}>{QUARTER_LABELS[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Sessions</span>
                            <div className="flex items-center gap-1.5"><Flame size={13} className={sessions >= 3 ? "text-orange-400" : "text-zinc-600"} /><span className="text-sm font-black text-white">{sessions}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.max(8, sessions + 2) }).map((_, i) => (
                                <div key={i} className={`h-2.5 w-2.5 rounded-sm transition-all duration-500 ${i < sessions ? "bg-white" : "bg-zinc-800"}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Mode + Ring + Controls ── */}
                <div className="flex flex-col items-center max-w-xl mx-auto w-full">
                    <div className="flex gap-2 mb-8">
                        {(["focus", "short", "long"] as Mode[]).map(m => (
                            <button key={m} onClick={() => switchMode(m)} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${mode === m ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>{LABELS[m]}</button>
                        ))}
                    </div>

                    <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
                        <Ring color={color} ringRef={ringRef} dotRef={dotRef} glowRef={glowRef} />
                        <Particles active={burst} />
                        <div className="relative z-10 flex flex-col items-center gap-1 select-none">
                            <div className="text-7xl font-black tracking-tighter tabular-nums" style={{ color, textShadow: `0 0 24px ${color}44` }}>{mins}:{secs}</div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color, opacity: running ? 1 : 0.4 }}>{running ? LABELS[mode] : "Paused"}</span>
                            <span className="text-[9px] text-zinc-600 font-medium mt-1">{LABELS[mode]} · {mode === "focus" ? focusMins : mode === "short" ? shortMins : longMins} min</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={reset} title="Reset" className="p-3 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all active:scale-95"><RotateCcw size={18} /></button>
                        <button onClick={() => setRunning(r => !r)} className="w-20 h-20 flex items-center justify-center border-2 transition-all duration-300 active:scale-95 relative overflow-hidden group" style={{ borderColor: color, boxShadow: running ? `0 0 28px ${color}44` : "none" }}>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `${color}15` }} />
                            {running ? <Pause size={28} style={{ color }} /> : <Play size={28} style={{ color }} className="translate-x-0.5" />}
                        </button>
                        <button onClick={skip} title="Skip" className="p-3 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white transition-all active:scale-95"><SkipForward size={18} /></button>
                    </div>
                </div>

                {/* ── RIGHT: Achievements ── */}
                <div className="lg:pt-14">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Achievements</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {ACHIEVEMENTS.map(a => {
                            const done = unlocked.includes(a.id);
                            return (
                                <div key={a.id} className={`p-4 border flex flex-col gap-3 transition-all duration-500 ${done ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950/30 opacity-40 grayscale"}`}>
                                    <div className={done ? "text-amber-400" : "text-zinc-600"}>{a.icon}</div>
                                    <div><p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">{a.title}</p><p className="text-[9px] text-zinc-500 font-medium mt-1 leading-relaxed">{a.desc}</p></div>
                                    {done && <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 w-fit">Unlocked</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Achievement Toast */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
                {toast && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900 border border-amber-500/50 shadow-2xl shadow-amber-500/10 min-w-[300px]">
                        <div className="text-amber-400 shrink-0">{toast.icon}</div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Achievement Unlocked!</p><p className="text-sm font-black text-white">{toast.title}</p><p className="text-[11px] text-zinc-400 font-medium">{toast.desc}</p></div>
                        <Trophy size={18} className="text-amber-400 shrink-0 ml-2 animate-bounce" />
                    </div>
                )}
            </div>

            <SettingsPanel visible={settingsOpen} onClose={() => setSettingsOpen(false)} focusMins={focusMins} shortMins={shortMins} longMins={longMins} onSave={saveSettings} />
        </div>
    );
}
