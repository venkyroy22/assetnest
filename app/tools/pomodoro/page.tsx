"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Trophy, Flame, Star, Zap, Coffee, Brain, Settings, X, Check, Music, Volume2, VolumeX, CloudRain, Trees, Wind, Moon, Search, Link as LinkIcon, ArrowLeft, ExternalLink, RefreshCw, Trash2, Droplets, Gamepad2 } from "lucide-react";
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

const FOCUS_Q_COLORS = ["#60a5fa", "#ffffff", "#ffffff", "#c084fc"];

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
            color: ["#fff", "#ffffff", "#ffffff", "#ffffff", "#f87171"][i % 5],
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

function WaterReminderAnimation({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [isHydrating, setIsHydrating] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsHydrating(false);
            // Play gentle droplet appear sound
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
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now); osc.stop(now + 0.3);
            } catch (e) {}
        }
    }, [visible]);

    if (!visible) return null;

    const handleHydrated = () => {
        setIsHydrating(true);
        
        // Play sipping / draining sound
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            
            // Pouring/swoosh (lowpass noise)
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 1.2);
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.3);
            
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start();
            
            // Glugging bubbles
            for(let i=0; i<6; i++) {
                const osc = ctx.createOscillator();
                const oscGain = ctx.createGain();
                osc.type = 'sine';
                osc.connect(oscGain); oscGain.connect(ctx.destination);
                
                const startStr = ctx.currentTime + (i * 0.2) + 0.1;
                osc.frequency.setValueAtTime(250 + Math.random()*150, startStr);
                osc.frequency.exponentialRampToValueAtTime(450 + Math.random()*200, startStr + 0.1);
                
                oscGain.gain.setValueAtTime(0, startStr);
                oscGain.gain.linearRampToValueAtTime(0.15, startStr + 0.02);
                oscGain.gain.exponentialRampToValueAtTime(0.01, startStr + 0.1);
                
                osc.start(startStr); osc.stop(startStr + 0.15);
            }
        } catch (e) {}

        setTimeout(() => {
            onClose();
        }, 1600); // Wait for water-empty animation to finish
    };

    return (
        <div className={`fixed inset-0 z-[500] flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-white/80 to-zinc-950/90 backdrop-blur-xl transition-opacity duration-1000 ${isHydrating ? 'opacity-0 delay-500' : 'animate-in fade-in duration-700'}`}>
            <div className={`relative w-full max-w-lg mx-auto flex flex-col items-center transition-transform duration-1000 ${isHydrating ? 'scale-95' : ''}`}>
                {/* Magic Aura */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/20 blur-[100px] rounded-full animate-pulse z-0 transition-opacity duration-1000 ${isHydrating ? 'opacity-0' : 'opacity-100'}`} style={{ animationDuration: '4s' }} />

                {/* Floating Ambient Droplets */}
                <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isHydrating ? 'opacity-0' : 'opacity-100'}`}>
                    {[...Array(15)].map((_, i) => (
                        <Droplets 
                            key={i} 
                            className="absolute text-white/20 animate-float-up" 
                            size={12 + Math.random() * 24}
                            style={{
                                left: `${Math.random() * 100}%`,
                                bottom: '-10%',
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${5 + Math.random() * 5}s`
                            }}
                        />
                    ))}
                </div>

                {/* Glass visualization */}
                <div className={`relative z-10 ${isHydrating ? '' : 'animate-in slide-in-from-bottom-10 fade-in duration-1000 ease-out delay-150 fill-mode-both'} mt-8`}>
                    <div className="w-36 h-48 bg-white/[0.02] border-x-[3px] border-b-[4px] border-t border-white/20 rounded-b-[40px] rounded-t-sm shadow-2xl relative overflow-hidden backdrop-blur-md">
                        
                        {/* Highlight/Reflections on glass */}
                        <div className="absolute inset-y-2 left-2 w-3 bg-gradient-to-b from-white/30 to-transparent rounded-full opacity-60 backdrop-blur-sm z-20" />
                        <div className="absolute inset-y-4 right-1.5 w-1 bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-40 z-20" />

                        {/* Water Container */}
                        <div className={`absolute bottom-0 w-full origin-bottom rounded-b-[36px] overflow-hidden`} style={{ height: '75%', animation: isHydrating ? 'water-empty 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'water-fill 2s ease-out forwards' }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-white" />
                            
                            {/* Waves - properly positioned above water */}
                            <div className="absolute top-0 w-[200%] h-6 bg-white/40 rounded-[100%] animate-wave-front opacity-90 -translate-x-1/4 -translate-y-1/2" />
                            <div className="absolute top-0 w-[200%] h-8 bg-white/50 rounded-[100%] animate-wave-back -translate-x-1/2 -translate-y-1/2" />
                            
                            {/* Bubbles in water */}
                            {[...Array(8)].map((_, i) => (
                                <div key={`b-${i}`} className="absolute bg-white/50 rounded-full animate-bubble" 
                                     style={{ 
                                         width: Math.random() * 5 + 3 + 'px', 
                                         height: Math.random() * 5 + 3 + 'px',
                                         left: Math.random() * 80 + 10 + '%',
                                         bottom: '-20px',
                                         animationDelay: Math.random() * 2 + 's',
                                         animationDuration: Math.random() * 2 + 1.5 + 's'
                                     }} 
                                />
                            ))}
                        </div>
                    </div>
                    {/* Base shadow */}
                    <div className={`w-24 h-4 bg-white/50 blur-[10px] rounded-[100%] mx-auto mt-4 transition-opacity duration-1000 ${isHydrating ? 'opacity-20' : 'opacity-100'}`} />
                </div>

                {/* Text and Button */}
                <div className={`mt-12 text-center space-y-5 relative z-10 transition-all duration-700 ${isHydrating ? 'opacity-0 translate-y-8 pointer-events-none' : 'animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out delay-300 fill-mode-both'}`}>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent drop-shadow-sm">
                        Hydration Time
                    </h2>
                    <p className="text-white/80 font-semibold tracking-wider text-sm sm:text-base">
                        Take a quick sip and recharge your focus.
                    </p>
                    
                    <button 
                        onClick={handleHydrated}
                        disabled={isHydrating}
                        className="mt-8 px-10 py-4 bg-gradient-to-r from-white to-white hover:from-white hover:to-white text-white text-sm font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255, 255, 255,0.6)] border border-white/50 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 min-w-[200px]"
                    >
                        <Check size={18} strokeWidth={3} />
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
                        100% { transform: translateY(-120px) scale(1.5); opacity: 0; }
                    }
                    @keyframes float-up {
                        0% { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
                        20% { opacity: 0.8; }
                        80% { opacity: 0.6; }
                        100% { transform: translateY(-100vh) rotate(180deg) scale(1.2); opacity: 0; }
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
            <label className="text-[10px] font-semibold text-zinc-400">{label}</label>
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
                    <h2 className="text-sm font-bold text-white">Timer Settings</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-6">
                    <NumInput label="Focus Duration" value={f} onChange={setF} min={1} max={120} />
                    <NumInput label="Short Break" value={s} onChange={setS} min={1} max={60} />
                    <NumInput label="Long Break" value={l} onChange={setL} min={1} max={60} />
                    
                    <div className="pt-4 border-t border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-white">Drink Water Reminder</span>
                                <span className="text-[10px] text-zinc-500">Get notified to stay hydrated</span>
                            </div>
                            <button 
                                onClick={() => setWr(!wr)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${wr ? 'bg-white' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${wr ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        {wr && (
                            <NumInput label="Reminder Every" value={wi} onChange={setWi} min={1} max={120} />
                        )}
                    </div>
                </div>
                <button onClick={() => { onSave(f, s, l, wr, wi); onClose(); }}
                    className="mt-8 w-full py-4 bg-white text-black text-sm font-bold tracking-wide rounded-full hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xl">
                    <Check size={14} /> Save & Apply
                </button>
            </div>
        </div>
    );
}

// ─── Break Recommendation Dialog ───────────────────────────────────────────
function BreakDialog({ isOpen, onClose, onOpenGames }: { isOpen: boolean; onClose: () => void; onOpenGames: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 text-center overflow-hidden">
                 <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 blur-[80px]" />
                 <div className="relative z-10">
                    <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-inner group">
                        <Gamepad2 size={36} className="group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Time for a Break!</h2>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-10 px-4">
                        Great work. Your mind needs a quick recharge. How about a mini-game to stay sharp?
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => { onOpenGames(); onClose(); }}
                            className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all shadow-xl"
                        >
                            Play Mini Games
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                        >
                            Maybe Later
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
}

export default function PomodoroPage() {
    const [focusMins, setFocusMins] = useState(25);
    const [shortMins, setShortMins] = useState(5);
    const [longMins, setLongMins] = useState(15);
    const [waterReminder, setWaterReminder] = useState(false);
    const [waterInterval, setWaterInterval] = useState(30);
    const durations = { focus: focusMins * 60, short: shortMins * 60, long: longMins * 60 };

    const COLORS: Record<Mode, string> = { focus: "#ffffff", short: "#ffffff", long: "#ffffff" };
    const BG: Record<Mode, string> = { focus: "from-zinc-900 to-zinc-950", short: "from-white to-zinc-950", long: "from-white to-zinc-950" };
    const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };

    const CYCLE_COLORS = ["#60a5fa", "#ffffff", "#ffffff", "#c084fc"] as const;
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

    // PERSISTENCE: Save to localStorage on changes
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

    // PERSISTENCE: Load from localStorage on mount
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
                
                // Don't trigger water instantly if the user has been away for a long time
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
                const strokeColor = modeRef.current === "focus" ? getFocusColor(p) : modeRef.current === "short" ? "#ffffff" : "#ffffff";
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

    // Water Reminder Logic
    useEffect(() => {
        if (!waterReminder) {
            setShowWaterReminder(false);
            return;
        }

        const checkInterval = setInterval(() => {
            const now = Date.now();
            const elapsedMins = (now - lastWaterTime) / (1000 * 60);
            
            if (elapsedMins >= waterInterval) {
                setShowWaterReminder(true);
            }
        }, 10000);

        return () => clearInterval(checkInterval);
    }, [waterReminder, waterInterval, lastWaterTime]);

    const handleWaterDone = () => {
        setShowWaterReminder(false);
        setLastWaterTime(Date.now());
    };

    const switchMode = (m: Mode) => {
        setRunning(false); setMode(m);
        setSecondsLeft(durations[m]); setTotalSecs(durations[m]);
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
        <div className={`relative min-h-[80vh] py-16 px-6 md:px-10 bg-gradient-to-b ${BG[mode]} transition-all duration-1000 overflow-hidden`}>
            {/* Dynamic Music Background */}
            <RainEffect active={isMusicPlaying || (currentYoutubeEmbed && isYTPlaying)} />

            {/* ── Header (Centered & Balanced) ── */}
            <div className="max-w-5xl mx-auto mb-10 flex flex-col items-center justify-center gap-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-black/30 w-fit relative group">
                    <Brain size={11} className="text-zinc-400" />
                    <span className="text-xs font-semibold tracking-wide text-zinc-300">Productivity Tool</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                        title="What is Pomodoro?"
                    >
                        <Info size={10} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <h1 className="text-5xl font-black tracking-tight text-white">Pomodoro Timer</h1>

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
                                            <span className="text-[10px] font-semibold tracking-wider text-zinc-500">Active Viewport</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 py-1 w-full sm:w-auto">
                                        <div className="flex items-center justify-between gap-3 mb-2 px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                                                    <div className="relative h-2 w-2 rounded-full bg-red-500" />
                                                </div>
                                                <span className="text-xs font-bold tracking-wide text-white">Live</span>
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
                                                <button onClick={() => toggleYT()} className={`flex-[2] flex items-center justify-center gap-2 text-xs font-bold transition-all px-3 py-1.5 rounded-lg border ${isYTPlaying ? "bg-white/5 text-zinc-400 border-zinc-800 hover:text-white" : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"}`} title={isYTPlaying ? "Pause Session" : "Resume Session"}>
                                                    {isYTPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                                    <span>{isYTPlaying ? "Pause" : "Resume"}</span>
                                                </button>
                                                <button onClick={() => skipYoutubeTrack()} className="flex-1 flex items-center justify-center p-1.5 bg-white/5 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all hover:bg-white/10" title="Next Track"><SkipForward size={12} /></button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => window.open(youtubeUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-red-400 transition-all bg-white/5 px-2 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700" title="Open on YouTube"><ExternalLink size={10} className="text-zinc-500" /><span>Source</span></button>
                                                <button onClick={() => resetPlayer()} className="flex-1 flex items-center justify-center gap-2 text-[11px] font-bold text-red-500 hover:text-red-400 transition-all bg-red-500/5 px-2 py-1.5 rounded-lg border border-red-500/10 hover:border-red-500/20" title="Clear URL & Reset"><Trash2 size={10} /><span>Reset</span></button>
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
                                                className="bg-transparent border-none text-xs font-semibold tracking-wider text-zinc-400 focus:outline-none w-44 placeholder:text-zinc-700" />
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
                            <span className="text-[10px] font-semibold text-zinc-400">Current Cycle</span>
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
                            <span className="text-[10px] font-semibold text-zinc-400">Total Sessions</span>
                            <div className="flex items-center gap-1.5"><Flame size={13} className={sessions >= 3 ? "text-white" : "text-zinc-600"} /><span className="text-sm font-black text-white">{sessions}</span></div>
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
                            <button key={m} onClick={() => switchMode(m)} className={`px-5 py-2 text-xs font-semibold tracking-wide border rounded-full transition-all duration-300 ${mode === m ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>{LABELS[m]}</button>
                        ))}
                    </div>

                    <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
                        <Ring color={color} ringRef={ringRef} dotRef={dotRef} glowRef={glowRef} />
                        <Particles active={burst} />
                        <div className="relative z-10 flex flex-col items-center gap-1 select-none">
                            <div className="text-7xl font-black tracking-tighter tabular-nums" style={{ color, textShadow: `0 0 24px ${color}44` }}>{mins}:{secs}</div>
                            <span className="text-xs font-bold tracking-wide" style={{ color, opacity: running ? 1 : 0.4 }}>{running ? LABELS[mode] : "Paused"}</span>
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
                <div className="lg:pt-14 space-y-8">
                    <div>
                        <p className="text-[10px] font-semibold text-zinc-500 mb-4">Achievements</p>
                        <div className="grid grid-cols-2 gap-3">
                            {ACHIEVEMENTS.map(a => {
                                const done = unlocked.includes(a.id);
                                return (
                                    <div key={a.id} className={`p-4 border flex flex-col gap-3 transition-all duration-500 ${done ? "border-white/50 bg-white/10" : "border-zinc-800 bg-zinc-950/30 opacity-40 grayscale"}`}>
                                        <div className={done ? "text-white" : "text-zinc-600"}>{a.icon}</div>
                                        <div><p className="text-[10px] font-bold text-white leading-tight">{a.title}</p><p className="text-[9px] text-zinc-500 font-medium mt-1 leading-relaxed">{a.desc}</p></div>
                                        {done && <span className="text-[10px] font-bold tracking-wide text-white border border-white/30 bg-white/10 px-2 py-0.5 rounded-full w-fit">Unlocked</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Game Break Suggestion */}
                    <div className={`p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4 transition-all duration-700 ${mode !== 'focus' ? 'opacity-100 scale-100' : 'opacity-40 grayscale shadow-inner'}`}>
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                             <Gamepad2 size={24} />
                        </div>
                        <div>
                             <h3 className="text-xs font-bold text-white mb-1 uppercase tracking-widest">Gamer Break</h3>
                             <p className="text-[10px] text-zinc-500 font-medium">Relax your mind with a quick game during your break.</p>
                        </div>
                        <button 
                            onClick={() => setGamesOpen(true)}
                            disabled={mode === 'focus'}
                            className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-zinc-200 active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Open Game Mini
                        </button>
                    </div>
                </div>
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="The Ultimate Pomodoro Guide"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">The Ultimate Pomodoro Focus Timer</h3>
                        <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                            <p>
                                Supercharge your studying, coding, or reading sessions with the AssetNest Productivity Pomodoro Timer. Based on the proven Pomodoro Technique, this tool alternates defined blocks of intense focus with automated short breaks to maximize your brain's endurance and prevent burnout.
                            </p>
                            <p>
                                <strong>More than just a timer:</strong> We've built in gamified achievements, dynamic lo-fi ambient backgrounds (like gentle rain or a bustling coffee shop), strict hydration reminders, and embedded mini-games for when your mind needs a genuine reset.
                            </p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Brain size={18} className="text-zinc-500" />
                                How the Method Works
                            </h3>
                            <ol className="space-y-3 text-sm text-zinc-400">
                                <li className="flex gap-3">
                                    <span className="font-black text-white bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
                                    <span><strong>Deep Focus:</strong> Work uninterrupted for 25 minutes. No phones, no emails. Just the task at hand.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-white bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
                                    <span><strong>Short Break:</strong> Take a 5-minute breather. Stand up, stretch, and step away from the screen entirely.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-white bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
                                    <span><strong>Repeat the Cycle:</strong> Perform 4 focus cycles consecutively (amounting to approx. 2 hours).</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-white bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]">4</span>
                                    <span><strong>Long Break:</strong> Reward yourself with a 15-30 minute deep break to recharge neurologically before starting again.</span>
                                </li>
                            </ol>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Settings size={18} className="text-zinc-500" />
                                Advanced Customization
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>Tailored Intervals:</strong> Not an avid fan of 25 minutes? Click the settings gear to change your exact time variables for Focus, Short Break, and Long Break configurations.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>YouTube Music Built-In:</strong> Don't leave the page. Click the music player icon in the bottom left corner to paste any public YouTube playlist of your choice to get into the flow zone seamlessly.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>Water Reminders:</strong> Activate the hydration setting to receive an immersive overlay, guaranteeing you drink water routinely.</span>
                                </li>
                            </ul>
                        </section>
                    </div>

                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 pt-12 border-t border-zinc-900 font-sans">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Pomodoro Intelligence (FAQ)</h3>
                        <Accordion>
                            <AccordionItem title="Can I customize the timer durations?">
                                Absolutely. Click the settings gear icon to adjust your Focus, Short Break, and Long Break durations to fit your personal productivity rhythm.
                            </AccordionItem>
                            <AccordionItem title="Is my data saved between sessions?">
                                Yes! Your achievement progress, custom settings, and total session count are all stored locally in your browser so you can pick up exactly where you left off.
                            </AccordionItem>
                            <AccordionItem title="How do the hydration reminders work?">
                                When enabled, a full-screen immersive reminder will appear after your set interval, encouraging you to step away and hydrate before resuming your work.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            {/* Achievement Toast */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
                {toast && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900 border border-white/50 shadow-2xl shadow-white/10 min-w-[300px]">
                        <div className="text-white shrink-0">{toast.icon}</div>
                        <div><p className="text-[11px] font-bold tracking-wide text-white mb-1">Achievement Unlocked!</p><p className="text-sm font-black text-white">{toast.title}</p><p className="text-[11px] text-zinc-400 font-medium">{toast.desc}</p></div>
                        <Trophy size={18} className="text-white shrink-0 ml-2 animate-bounce" />
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

