"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Trophy, Flame, Star, Zap, Coffee, Brain, Settings, X, Check, Music, Volume2, VolumeX, CloudRain, Trees, Wind, Moon, Search, Link as LinkIcon, ArrowLeft, ExternalLink, RefreshCw, Trash2, Droplets, Gamepad2, HelpCircle } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";
import { useMusic } from "@/components/MusicProvider";
import { MiniGames } from "./games";

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

const FOCUS_Q_COLORS = ["#ea580c", "#16a34a", "#ca8a04", "#dc2626"];

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
        <svg width="320" height="320" className="absolute inset-0 -rotate-90">
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e4e4e7" strokeWidth="8" />
            <circle ref={glowRef} cx={CX} cy={CY} r={RADIUS}
                fill="none" stroke={color} strokeWidth="8" opacity="0.1"
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
        Array.from({ length: 40 }, (_, i) => ({
            left: Math.random() * 100,
            top: -20 - (Math.random() * 80),
            size: 1 + Math.random() * 1.5,
            dur: 15 + Math.random() * 15,
            delay: -Math.random() * 30,
            opacity: 0.08 + Math.random() * 0.15,
            blur: 0.5 + Math.random() * 1,
        }))
    );

    if (!active) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {drops.map((d, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-black"
                    style={{
                        left: `${d.left}%`,
                        width: `${d.size}px`,
                        height: `${d.size * 14}px`,
                        opacity: d.opacity,
                        filter: `blur(${d.blur}px)`,
                        animation: `rain-slide ${d.dur}s linear infinite`,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}
            <style jsx global>{`
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
        Array.from({ length: 15 }, (_, i) => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            color: ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6"][i % 5],
            delay: Math.random() * 0.3,
            dur: 0.5 + Math.random() * 0.5,
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
                osc.type = 'sine';
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
            osc.type = 'sine'; osc.connect(gain); gain.connect(ctx.destination);
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.35);
        } catch {}
        setTimeout(onClose, 1000);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#F4ECD8]">
            <div className="relative w-full max-w-xl bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-12 shadow-[8px_8px_0_#000] text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute bg-blue-300 rounded-full animate-float" 
                             style={{ 
                                 width: Math.random() * 40 + 20 + 'px', 
                                 height: Math.random() * 40 + 20 + 'px',
                                 left: Math.random() * 100 + '%',
                                 bottom: '-10%',
                                 animationDelay: Math.random() * 3 + 's',
                                 animationDuration: Math.random() * 5 + 4 + 's'
                             }} 
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="w-28 h-40 bg-zinc-50 border-2 border-black rounded-[2rem] relative shadow-[4px_4px_0_#000] overflow-hidden flex items-end">
                        <div className={`w-full bg-blue-400 relative transition-all duration-1000 origin-bottom`}
                             style={{ 
                                 height: isHydrating ? '0%' : '75%',
                                 animation: isHydrating ? 'water-empty 1s ease-out forwards' : 'water-fill 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                             }}>
                            <div className="absolute top-0 w-[200%] h-6 bg-white/40 rounded-[100%] animate-wave-front opacity-90 -translate-x-1/4 -translate-y-1/2" />
                            <div className="absolute top-0 w-[200%] h-8 bg-white/50 rounded-[100%] animate-wave-back -translate-x-1/2 -translate-y-1/2" />
                            
                            {[...Array(6)].map((_, i) => (
                                <div key={`b-${i}`} className="absolute bg-white/50 rounded-full animate-bubble" 
                                     style={{ 
                                         width: Math.random() * 4 + 2 + 'px', 
                                         height: Math.random() * 4 + 2 + 'px',
                                         left: Math.random() * 80 + 10 + '%',
                                         bottom: '-10px',
                                         animationDelay: Math.random() * 1.5 + 's',
                                         animationDuration: Math.random() * 2 + 's'
                                     }} 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`mt-8 text-center space-y-4 relative z-10 transition-all duration-550 ${isHydrating ? 'opacity-0 translate-y-4' : ''}`}>
                    <h2 className="text-3xl font-black tracking-tight text-black ig-display">
                        Hydration Break
                    </h2>
                    <p className="text-zinc-500 font-semibold tracking-wide text-xs sm:text-sm">
                        Take a quick sip of water and reset your focus.
                    </p>
                    
                    <button 
                        onClick={handleHydrated}
                        disabled={isHydrating}
                        className="ig-btn mt-6 px-8 py-3.5 bg-[#fde047] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all shadow-[3px_3px_0_#000] border-2 border-black flex items-center justify-center gap-2 mx-auto disabled:opacity-50 min-w-[180px]"
                    >
                        <Check size={14} strokeWidth={3} />
                        <span>I'M HYDRATED</span>
                    </button>
                </div>

                <style jsx>{`
                    @keyframes water-fill {
                        0% { transform: scaleY(0); }
                        100% { transform: scaleY(1); }
                    }
                    @keyframes water-empty {
                        0% { transform: scaleY(1); }
                        100% { transform: scaleY(0); }
                    }
                    @keyframes wave-front {
                        0%, 100% { transform: translateX(-25%) translateY(-50%) scaleX(1); }
                        50% { transform: translateX(-25%) translateY(-40%) scaleX(0.95); }
                    }
                    @keyframes wave-back {
                        0%, 100% { transform: translateX(-40%) translateY(-50%) scaleX(1); }
                        50% { transform: translateX(-35%) translateY(-60%) scaleX(0.9); }
                    }
                    @keyframes bubble {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-100px) scale(1.4); opacity: 0; }
                    }
                    @keyframes float {
                        0% { transform: translateY(0) scale(0.8); opacity: 0; }
                        10% { opacity: 0.5; }
                        90% { opacity: 0.4; }
                        100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
                    }
                `}</style>
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
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{label}</label>
            <div className="flex items-center gap-2">
                <button onClick={() => onChange(Math.max(min, value - 1))}
                    className="w-8 h-8 border-2 border-black text-black bg-white rounded-lg hover:bg-zinc-50 font-black text-lg flex items-center justify-center shadow-[1.5px_1.5px_0_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">−</button>
                <input type="number" min={min} max={max} value={value}
                    onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
                    className="w-16 text-center bg-white border-2 border-black rounded-lg text-black font-black text-sm py-1 focus:outline-none" />
                <button onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-8 h-8 border-2 border-black text-black bg-white rounded-lg hover:bg-zinc-50 font-black text-lg flex items-center justify-center shadow-[1.5px_1.5px_0_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">+</button>
                <span className="text-[10px] text-zinc-400 font-bold uppercase ml-1">mins</span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#000]/40 backdrop-blur-sm" />
            <div className="relative bg-white border-2 border-black p-6 sm:p-8 w-full max-w-sm shadow-[8px_8px_0_#000] rounded-[2.5rem] text-black" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-black uppercase tracking-tight ig-display">Timer Settings</h2>
                    <button onClick={onClose} className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]"><X size={14} /></button>
                </div>
                <div className="space-y-5">
                    <NumInput label="Focus Duration" value={f} onChange={setF} min={1} max={120} />
                    <NumInput label="Short Break" value={s} onChange={setS} min={1} max={60} />
                    <NumInput label="Long Break" value={l} onChange={setL} min={1} max={60} />
                    
                    <div className="pt-4 border-t-2 border-dashed border-zinc-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-black">Hydration Reminders</span>
                                <span className="text-[10px] text-zinc-500 font-medium">Drink water alerts during sessions</span>
                            </div>
                            <button 
                                onClick={() => setWr(!wr)}
                                className={`w-10 h-5 rounded-full transition-colors relative border-2 border-black ${wr ? 'bg-orange-500' : 'bg-zinc-200'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm border border-black ${wr ? 'left-5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        {wr && (
                            <NumInput label="Reminder Interval" value={wi} onChange={setWi} min={1} max={120} />
                        )}
                    </div>
                </div>
                <button onClick={() => { onSave(f, s, l, wr, wi); onClose(); }}
                    className="ig-btn mt-6 w-full py-3.5 bg-[#fde047] text-black border-2 border-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-1.5 shadow-[3px_3px_0_#000]">
                    <Check size={14} /> Save Settings
                </button>
            </div>
        </div>
    );
}

function BreakDialog({ isOpen, onClose, onOpenGames }: { isOpen: boolean; onClose: () => void; onOpenGames: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000]/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-10 shadow-[8px_8px_0_#000] text-center text-black">
                 <div className="relative z-10">
                    <div className="w-16 h-16 bg-zinc-50 border-2 border-black rounded-2xl flex items-center justify-center text-black mx-auto mb-6 shadow-[3px_3px_0_#000]">
                        <Gamepad2 size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight ig-display">Take a Break!</h2>
                    <p className="text-xs text-zinc-500 font-semibold leading-relaxed mb-8 px-2">
                        Excellent work. Your mind needs a rest. Would you like to recharge with a mini-game?
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => { onOpenGames(); onClose(); }}
                            className="ig-btn w-full py-3.5 bg-[#fde047] text-black border-2 border-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all shadow-[3px_3px_0_#000]"
                        >
                            Play Mini Games
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-2 text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                            No thanks
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
}

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=DM+Sans:wght@500;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
`;

export default function PomodoroPage() {
    const [focusMins, setFocusMins] = useState(25);
    const [shortMins, setShortMins] = useState(5);
    const [longMins, setLongMins] = useState(15);
    const [waterReminder, setWaterReminder] = useState(false);
    const [waterInterval, setWaterInterval] = useState(30);
    const durations = { focus: focusMins * 60, short: shortMins * 60, long: longMins * 60 };

    const COLORS: Record<Mode, string> = { focus: "#ea580c", short: "#16a34a", long: "#2563eb" };

    const LABELS: Record<Mode, string> = { focus: "Focus Session", short: "Short Break", long: "Long Break" };

    const CYCLE_COLORS = ["#ea580c", "#16a34a", "#ca8a04", "#dc2626"] as const;
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
        <div className="relative min-h-screen py-10 px-4 md:px-10 bg-[#F4ECD8] overflow-hidden text-black font-sans ig-root">
            <style>{GLOBAL_STYLES}</style>
            
            {isMusicPlaying && <RainEffect active={true} />}

            {/* Header */}
            <header className="max-w-[1600px] w-full mx-auto px-2 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0_#000] bg-orange-500">
                        <Coffee size={14} />
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        Pomodoro Focus
                    </span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <HelpCircle size={12} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 mt-12 items-start relative z-10 pb-20">
                
                {/* ── LEFT PANEL: Tracker Details ── */}
                <div className="flex flex-col gap-6 lg:pt-14 w-full">
                    {/* Cycle Indicators */}
                    <div className="p-5 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_#000]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Focus Loop</span>
                            <div className="flex items-center gap-1">
                                <Coffee size={11} className="text-zinc-600" />
                                <span className="text-[9px] font-black text-zinc-500 uppercase">{4 - pomodoroInCycle} to Break</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex-1 flex flex-col gap-1">
                                    <div className={`h-4 border-2 border-black rounded-md transition-all duration-300 ${i === pomodoroInCycle && mode === "focus" ? "animate-pulse" : ""}`}
                                        style={{ backgroundColor: i < pomodoroInCycle ? CYCLE_COLORS[i] : (i === pomodoroInCycle && mode === "focus" ? CYCLE_COLORS[i] : "#f3f4f6") }} />
                                    <span className="text-[8px] font-black text-center" style={{ color: i <= pomodoroInCycle ? "#000000" : "#9ca3af" }}>{QUARTER_LABELS[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Streak Tracker */}
                    <div className="p-5 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_#000]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Completed Focus</span>
                            <div className="flex items-center gap-1">
                                <Flame size={13} className={sessions >= 3 ? "text-orange-500 animate-pulse" : "text-zinc-400"} />
                                <span className="text-xs font-black text-black">{sessions} Blocks</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.max(8, sessions + 2) }).map((_, i) => (
                                <div key={i} className={`h-3.5 w-3.5 rounded border ${i < sessions ? "bg-black border-black" : "bg-zinc-50 border-zinc-200"}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CENTER PANEL: Main Ring + Control Interface ── */}
                <div className="flex flex-col items-center w-full bg-white border-2 border-black rounded-[3rem] p-6 sm:p-8 shadow-[6px_6px_0_#000]">
                    
                    {/* Mode Selector */}
                    <div className="flex bg-zinc-100 border-2 border-black p-0.5 rounded-full shadow-[2px_2px_0_#000] mb-8">
                        {(["focus", "short", "long"] as Mode[]).map(m => (
                            <button 
                                key={m} 
                                onClick={() => switchMode(m)} 
                                className={`px-4.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all ${mode === m ? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}
                            >
                                {m === "focus" ? "Focus" : m === "short" ? "Short Break" : "Long Break"}
                            </button>
                        ))}
                    </div>

                    {/* Timer SVG Ring */}
                    <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8 bg-zinc-50 rounded-full border-2 border-black shadow-inner">
                        <Ring color={color} ringRef={ringRef} dotRef={dotRef} glowRef={glowRef} />
                        <Particles active={burst} />
                        <div className="relative z-10 flex flex-col items-center gap-1 select-none">
                            <div className="text-6xl font-black tracking-tight tabular-nums ig-display">{mins}:{secs}</div>
                            <span className="text-xs font-black uppercase tracking-widest mt-1" style={{ color }}>{running ? "Active focus" : "Paused"}</span>
                        </div>
                    </div>

                    {/* Timer Actions */}
                    <div className="flex items-center gap-4">
                        <button onClick={reset} title="Reset Timer" className="ig-btn p-3 bg-white border-2 border-black rounded-2xl text-black hover:bg-zinc-50 shadow-[2px_2px_0_#000]"><RotateCcw size={16} /></button>
                        <button onClick={() => setRunning(r => !r)} className="ig-btn w-20 h-20 flex items-center justify-center border-2 border-black rounded-[2rem] bg-[#fde047] hover:bg-yellow-400 shadow-[4px_4px_0_#000]">
                            {running ? <Pause size={24} strokeWidth={3} className="text-black" /> : <Play size={24} strokeWidth={3} className="text-black translate-x-0.5" />}
                        </button>
                        <button onClick={skip} title="Skip Session" className="ig-btn p-3 bg-white border-2 border-black rounded-2xl text-black hover:bg-zinc-50 shadow-[2px_2px_0_#000]"><SkipForward size={16} /></button>
                    </div>

                    {/* Media player deck */}
                    <div className="w-full border-t-2 border-dashed border-zinc-200 mt-8 pt-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSettingsOpen(true)} className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50">
                                    <Settings size={14} /> CONFIG
                                </button>
                                
                                <div className="flex bg-zinc-150 p-0.5 border border-black rounded-lg">
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
                                            className={`p-1 text-[10px] font-bold uppercase rounded ${activeTrack === t.id ? 'bg-black text-white' : 'text-zinc-500'}`}
                                            title={t.name}
                                        >
                                            {t.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* YouTube deck player */}
                            <div className="flex items-center gap-1 border border-black rounded-xl p-1 bg-zinc-50 w-full sm:w-auto">
                                <input 
                                    type="text" 
                                    value={youtubeUrl} 
                                    onChange={(e) => setYoutubeUrl(e.target.value)} 
                                    placeholder="Paste YouTube Stream Link..."
                                    className="bg-transparent border-none text-[10px] font-bold tracking-wider text-black focus:outline-none w-36 px-2 placeholder:text-zinc-400" 
                                />
                                <button 
                                    onClick={() => playYoutube()} 
                                    className="ig-btn p-1.5 bg-[#ef4444] text-white rounded-lg border border-black shadow-[1.5px_1.5px_0_#000] hover:bg-red-600" 
                                    title="Stream Audio"
                                >
                                    <Play size={10} fill="currentColor" />
                                </button>
                                {isYTPlaying && (
                                    <button 
                                        onClick={() => toggleYT()} 
                                        className="ig-btn p-1.5 bg-white text-black rounded-lg border border-black shadow-[1.5px_1.5px_0_#000]"
                                        title="Pause Stream"
                                    >
                                        <Pause size={10} />
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Achievements + Break Games ── */}
                <div className="lg:pt-14 space-y-6 w-full">
                    {/* Game Break Card */}
                    <div className={`p-5 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_#000] flex flex-col gap-3 transition-all ${mode !== 'focus' ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className="flex items-center gap-2">
                            <Gamepad2 size={16} className="text-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Break Recharge</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">Relax your attention capacity with a quick offline mini-game during your break.</p>
                        <button 
                            onClick={() => setGamesOpen(true)}
                            disabled={mode === 'focus'}
                            className="ig-btn w-full py-2.5 bg-white hover:bg-zinc-50 text-black border-2 border-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0_#000] disabled:opacity-40"
                        >
                            Launch Break Game
                        </button>
                    </div>

                    {/* Achievements List */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 pl-2">Unlocked Badges</p>
                        <div className="grid grid-cols-2 gap-3">
                            {ACHIEVEMENTS.map(a => {
                                const done = unlocked.includes(a.id);
                                return (
                                    <div key={a.id} className={`p-3 border-2 rounded-2xl flex flex-col gap-1.5 transition-all duration-350 shadow-[2px_2px_0_#000] ${done ? "border-black bg-white" : "border-zinc-200 bg-zinc-50 opacity-40 grayscale shadow-none"}`}>
                                        <div className={done ? "text-orange-500" : "text-zinc-300"}>{a.icon}</div>
                                        <div>
                                            <p className="text-[9px] font-black text-black leading-tight">{a.title}</p>
                                            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{a.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* HelpModal */}
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Aesthetic Pomodoro Guide"
            >
                <div className="space-y-8 text-left max-w-2xl mx-auto py-4 text-black">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Scientific Time Boxing</h3>
                        <p className="text-sm text-zinc-650 leading-relaxed font-medium">
                            The Pomodoro Technique is designed to maximize mental focus by splitting cognitive blocks into 25-minute sprints accompanied by forced 5-minute break resets. This reduces fatigue and preserves long-term stamina.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="Where is my productivity state saved?">
                                All session counts, achievements, and custom timer durations are stored safely within client-side browser cookies/LocalStorage. No servers are involved.
                            </AccordionItem>
                            <AccordionItem title="How does the ambient soundtrack work?">
                                You can play soft background loops natively, or paste any YouTube live lofi stream directly into the link widget to control background tracks.
                            </AccordionItem>
                            <AccordionItem title="Why should I enable Water Reminders?">
                                Hydration directly influences concentration levels. Enforcing structured hydration intervals forces physical posture resets and keeps you alert.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            {/* Achievement toast */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
                {toast && (
                    <div className="flex items-center gap-3.5 px-5 py-3.5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_#000] min-w-[280px]">
                        <div className="text-orange-500 shrink-0">{toast.icon}</div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Achievement Earned!</p>
                            <p className="text-sm font-black text-black">{toast.title}</p>
                        </div>
                        <Trophy size={18} className="text-orange-500 shrink-0 ml-auto animate-bounce" />
                    </div>
                )}
            </div>

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
