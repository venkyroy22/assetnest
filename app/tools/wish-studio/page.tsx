"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Gift, Heart, Send, Copy, Volume2, VolumeX, CheckCircle, RotateCcw, Link2, Share2, Music } from "lucide-react";
import JSConfetti from "js-confetti";
import GiftBoxVisual from "@/components/wish-studio/GiftBoxVisual";
import ScratchCard from "@/components/wish-studio/ScratchCard";

const STOCK_PHOTOS = [
    { id: "cake", name: "Birthday Cake", url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=500&auto=format&fit=crop" },
    { id: "hearts", name: "Loving Hearts", url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop" },
    { id: "champagne", name: "Cheer Toast", url: "https://images.unsplash.com/photo-1594145061876-b63381a4d642?q=80&w=500&auto=format&fit=crop" },
    { id: "balloons", name: "Balloons Sparkle", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=500&auto=format&fit=crop" },
    { id: "stars", name: "Night Sparks", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=500&auto=format&fit=crop" },
];

const COLORS = [
    "#10b981", // Emerald Green
    "#34d399", // Mint Green
    "#60a5fa", // Electric Blue
    "#f59e0b", // Warm Yellow
    "#f43f5e", // Rose Pink
    "#8b5cf6", // Violet Purple
    "#06b6d4"  // Cyan
];

export default function WishStudioPage() {
    // Shared configurations
    const [theme, setTheme] = useState<"gold" | "cyber" | "pastel" | "holo">("gold");
    const [occasion, setOccasion] = useState<"birthday" | "anniversary" | "congrats" | "love">("birthday");
    const [sender, setSender] = useState("");
    const [recipient, setRecipient] = useState("");
    const [note, setNote] = useState("");
    const [scratchMessage, setScratchMessage] = useState("");
    const [photoUrl, setPhotoUrl] = useState(STOCK_PHOTOS[0].url);
    const [audioMelody, setAudioMelody] = useState<"birthday" | "anniversary">("birthday");

    // Creator State
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Recipient State
    const [isRecipientMode, setIsRecipientMode] = useState(false);
    const [isUnwrapped, setIsUnwrapped] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [scratchCleared, setScratchCleared] = useState(false);

    // References
    const jsConfettiRef = useRef<JSConfetti | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const celebrationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        jsConfettiRef.current = new JSConfetti();
        return () => {
            celebrationTimeoutsRef.current.forEach(clearTimeout);
        };
    }, []);

    // Decode URL safe compression on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const data = params.get("wish");
        if (data) {
            try {
                const decryptedStr = decodeURIComponent(escape(atob(data)));
                const config = JSON.parse(decryptedStr);
                setTheme(config.theme || "gold");
                setOccasion(config.occasion || "birthday");
                setSender(config.sender || "");
                setRecipient(config.recipient || "");
                setNote(config.note || "");
                setScratchMessage(config.scratchMessage || "");
                setPhotoUrl(config.photoUrl || STOCK_PHOTOS[0].url);
                setAudioMelody(config.audioMelody || "birthday");
                setIsRecipientMode(true);
            } catch (e) {
                console.error("Wish decryption error", e);
            }
        }
    }, []);

    // Encrypt selections into sharing base64 URL
    const generateWishLink = () => {
        const config = {
            theme,
            occasion,
            sender,
            recipient,
            note,
            scratchMessage,
            photoUrl,
            audioMelody
        };
        try {
            const jsonStr = JSON.stringify(config);
            const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
            const origin = window.location.origin;
            const link = `${origin}/tools/wish-studio?wish=${encodeURIComponent(base64Str)}`;
            setShareLink(link);
            setShowShareModal(true);
        } catch (e) {
            console.error("Link encryption failed", e);
        }
    };

    // Synthesize procedural note melodies (Web Audio API)
    const playSynthesizedMelody = () => {
        if (audioMuted) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        let notes: { note: number; dur: number; gap: number }[] = [];

        if (audioMelody === "anniversary") {
            // Sweet harmonious chime theme
            notes = [
                { note: 329.63, dur: 0.4, gap: 0.05 }, // E4
                { note: 349.23, dur: 0.2, gap: 0.05 }, // F4
                { note: 392.00, dur: 0.6, gap: 0.1 },  // G4
                { note: 523.25, dur: 0.6, gap: 0.1 },  // C5
                { note: 523.25, dur: 0.3, gap: 0.05 }, // C5
                { note: 493.88, dur: 0.3, gap: 0.05 }, // B4
                { note: 440.00, dur: 0.3, gap: 0.05 }, // A4
                { note: 392.00, dur: 0.8, gap: 0.1 },  // G4
            ];
        } else {
            // Happy Birthday chime notes
            notes = [
                { note: 261.63, dur: 0.3, gap: 0.05 }, // C4
                { note: 261.63, dur: 0.1, gap: 0.05 }, // C4
                { note: 293.66, dur: 0.4, gap: 0.05 }, // D4
                { note: 261.63, dur: 0.4, gap: 0.05 }, // C4
                { note: 349.23, dur: 0.4, gap: 0.05 }, // F4
                { note: 329.63, dur: 0.8, gap: 0.1 },  // E4
                
                { note: 261.63, dur: 0.3, gap: 0.05 }, // C4
                { note: 261.63, dur: 0.1, gap: 0.05 }, // C4
                { note: 293.66, dur: 0.4, gap: 0.05 }, // D4
                { note: 261.63, dur: 0.4, gap: 0.05 }, // C4
                { note: 392.00, dur: 0.4, gap: 0.05 }, // G4
                { note: 349.23, dur: 0.8, gap: 0.1 },  // F4
            ];
        }

        let time = ctx.currentTime + 0.1;
        notes.forEach((n) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(n.note, time);

            // Envelope to mimic soft organic chimes
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.18, time + 0.03); // Attack
            gain.gain.exponentialRampToValueAtTime(0.001, time + n.dur); // Decay

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + n.dur);

            time += n.dur + n.gap;
        });
    };

    // Staggered celebration pops (Runs for exactly 20 seconds!)
    const trigger20sCelebration = () => {
        // Clear any previous timeouts
        celebrationTimeoutsRef.current.forEach(clearTimeout);
        celebrationTimeoutsRef.current = [];

        const schedulePop = (delayMs: number, config: Parameters<JSConfetti["addConfetti"]>[0]) => {
            const timer = setTimeout(() => {
                jsConfettiRef.current?.addConfetti(config);
            }, delayMs);
            celebrationTimeoutsRef.current.push(timer);
        };

        // 20s staggered popping cycle
        schedulePop(0, { confettiColors: COLORS, confettiRadius: 6, confettiNumber: 120 });
        schedulePop(1500, { confettiColors: ["#10b981", "#34d399", "#ffffff"], confettiRadius: 5, confettiNumber: 80 });
        schedulePop(3500, { emojis: ["🎉", "✨", "🎈", "🥳", "💫"], emojiSize: 30, confettiNumber: 30 });
        schedulePop(5500, { confettiColors: ["#06b6d4", "#f59e0b"], confettiRadius: 6, confettiNumber: 90 });
        schedulePop(7500, { emojis: ["⭐", "✨", "💚", "🌟"], emojiSize: 26, confettiNumber: 35 });
        schedulePop(9500, { confettiColors: COLORS, confettiRadius: 5, confettiNumber: 100 });
        schedulePop(12000, { confettiColors: ["#ff7849", "#8b5cf6"], confettiRadius: 6, confettiNumber: 80 });
        schedulePop(14500, { emojis: ["✨", "💫", "🌟"], emojiSize: 24, confettiNumber: 40 });
        schedulePop(17000, { confettiColors: COLORS, confettiRadius: 6, confettiNumber: 110 });
        
        // Finale explosion at 19.5s
        schedulePop(19500, { confettiColors: COLORS, confettiRadius: 7, confettiNumber: 150 });
        schedulePop(19800, { emojis: ["🎉", "💚", "✨", "🥳"], emojiSize: 32, confettiNumber: 40 });
    };

    // Unwrapping flow
    const handleUnwrap = () => {
        setIsUnwrapped(true);
        trigger20sCelebration();
        playSynthesizedMelody();
    };

    // Copy link helper
    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Get envelope colors
    const getEnvelopeBg = () => {
        switch (theme) {
            case "cyber": return "bg-zinc-950/90 border-fuchsia-500/20";
            case "pastel": return "bg-white/10 backdrop-blur-md border-white/20";
            case "holo": return "bg-gradient-to-tr from-cyan-950/40 via-zinc-900/90 to-pink-950/40 border-white/[0.08]";
            case "gold":
            default: return "bg-zinc-900 border-amber-500/20";
        }
    };

    // Recipient Page Mode
    if (isRecipientMode) {
        return (
            <div className="min-h-screen bg-[#080809] text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
                
                {/* CSS Ambient Embers Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                
                {/* Audio volume controller */}
                <button
                    onClick={() => {
                        setAudioMuted(!audioMuted);
                        if (audioCtxRef.current) audioCtxRef.current.close();
                    }}
                    className="absolute top-6 right-6 p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all z-40 active:scale-95 shadow-md flex items-center gap-2"
                >
                    {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{audioMuted ? "Unmute Melody" : "Mute Melody"}</span>
                </button>

                {/* THE UNWRAPPING STAGE */}
                <div className="w-full max-w-[480px] flex flex-col items-center relative z-25">
                    
                    {!isUnwrapped ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            {/* Special header intro */}
                            <div className="space-y-1 animate-pulse">
                                <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-[0.2em] block">Asset Nest Surprise</span>
                                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#f0eff5]">A Special Gift For You</h2>
                            </div>
                            
                            {/* Visual glowing gift box */}
                            <GiftBoxVisual theme={theme} isOpen={isUnwrapped} onOpen={handleUnwrap} />
                        </div>
                    ) : (
                        /* THE UNFOLDED Surprises */
                        <div className="w-full flex flex-col items-center gap-6 animate-slide-up">
                            
                            {/* Polaroid Wish Card */}
                            <div className={`w-full rounded-[24px] p-6 shadow-2xl border ${getEnvelopeBg()} overflow-hidden relative`}>
                                
                                {/* Top corner sparkles */}
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                                </div>

                                {/* Polaris Image Wrapper */}
                                <div className="bg-white p-3 pb-6 rounded-lg shadow-lg rotate-[-2deg] mb-6 relative border border-zinc-200">
                                    <div className="absolute inset-x-0 top-3 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                    <img 
                                        src={photoUrl} 
                                        alt="Wish illustration" 
                                        className="w-full h-56 object-cover rounded shadow-inner"
                                    />
                                    <div className="mt-4 text-center font-serif text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                                        For {recipient || "Someone Special"} 💚
                                    </div>
                                </div>

                                {/* Custom Text Envelope details */}
                                <div className="space-y-4 text-left">
                                    <div>
                                        <span className="text-[9.5px] font-extrabold uppercase text-emerald-400 tracking-wider block mb-1">Occasion</span>
                                        <h3 className="text-lg font-black text-[#f0eff5] capitalize">{occasion} Wish</h3>
                                    </div>

                                    <div className="border-t border-white/[0.05] pt-3">
                                        <span className="text-[9.5px] font-extrabold uppercase text-zinc-500 tracking-wider block mb-2">Personal Message</span>
                                        <p className="text-sm text-zinc-300 font-serif italic leading-relaxed whitespace-pre-wrap">
                                            "{note || "Wishing you absolute happiness, health, and joy on this special day!"}"
                                        </p>
                                    </div>

                                    {/* Sender signature */}
                                    <div className="text-right border-t border-white/[0.05] pt-3">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Warmly,</span>
                                        <span className="font-extrabold text-sm text-emerald-400 font-serif">{sender || "Your Friend"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Scratch off surprise */}
                            {scratchMessage && (
                                <div className="w-full text-center">
                                    <span className="text-[9.5px] font-extrabold uppercase text-zinc-400 tracking-[0.15em] block mb-3">Scratch below to reveal a secret note</span>
                                    <div className="flex justify-center">
                                        <ScratchCard 
                                            width={340} 
                                            height={150} 
                                            onComplete={() => {
                                                setScratchCleared(true);
                                                jsConfettiRef.current?.addConfetti({
                                                    emojis: ["💚", "✨", "💫"],
                                                    confettiNumber: 15
                                                });
                                            }}
                                        >
                                            <div className="space-y-1">
                                                <Heart size={20} className="text-rose-500 fill-rose-500 animate-bounce mx-auto" />
                                                <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-widest block">Secret Note</span>
                                                <p className="text-[12.5px] font-bold text-zinc-200 px-3 font-serif leading-relaxed">
                                                    {scratchMessage}
                                                </p>
                                            </div>
                                        </ScratchCard>
                                    </div>
                                </div>
                            )}

                            {/* Reset CTA */}
                            <button
                                onClick={() => {
                                    setIsUnwrapped(false);
                                    setScratchCleared(false);
                                    if (audioCtxRef.current) audioCtxRef.current.close();
                                }}
                                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 active:scale-95 shadow-md mt-4"
                            >
                                <RotateCcw size={12} /> Re-open Gift
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(60px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up {
                        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
            </div>
        );
    }

    // Creator / Design Mode Page Layout
    return (
        <div className="min-h-screen bg-[#080809] text-zinc-100 p-4 sm:p-8 font-sans relative overflow-hidden select-none">
            
            {/* Visual background glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-20 space-y-6">
                
                {/* Header navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/[0.06]">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9.5px] font-black uppercase tracking-wider rounded border border-emerald-500/20">Studio Mode</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f0eff5] flex items-center gap-2">
                            Interactive Wish Studio <Gift className="text-emerald-400 animate-bounce" size={24} />
                        </h1>
                        <p className="text-zinc-500 text-xs mt-1 max-w-xl font-medium">
                            Create digital, fully animated wish packages wrapped inside 3D boxes. Generate a database-free URL to share privately.
                        </p>
                    </div>
                </div>

                {/* Main Creation Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: OPTIONS WIZARD */}
                    <div className="lg:col-span-5 bg-zinc-900/90 border border-white/[0.08] p-5 sm:p-6 rounded-[24px] backdrop-blur-xl shadow-xl space-y-5">
                        <h2 className="text-sm font-black text-zinc-300 uppercase tracking-widest border-b border-white/[0.04] pb-3 flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-400" /> Customize Wish Card
                        </h2>

                        {/* Occasion Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Occasion</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "birthday", label: "🎂 Birthday" },
                                    { id: "anniversary", label: "🥂 Anniversary" },
                                    { id: "congrats", label: "🎉 Congrats" },
                                    { id: "love", label: "💚 Surprise" }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setOccasion(item.id as any)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                                            occasion === item.id 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                                : "bg-zinc-950/40 border-white/5 hover:border-white/10 text-zinc-400"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme wrapping styles */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">3D Box Wrapper style</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                    { id: "gold", label: "Gold" },
                                    { id: "cyber", label: "Neon" },
                                    { id: "pastel", label: "Glass" },
                                    { id: "holo", label: "Holo" }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id as any)}
                                        className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all border uppercase tracking-wider ${
                                            theme === t.id 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                                : "bg-zinc-950/40 border-white/5 hover:border-white/10 text-zinc-500"
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* From & To Names */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Recipient Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alex"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full bg-zinc-950/60 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Sender Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jordan"
                                    value={sender}
                                    onChange={(e) => setSender(e.target.value)}
                                    className="w-full bg-zinc-950/60 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Custom Wish message */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Wish message</label>
                            <textarea
                                rows={2.5}
                                placeholder="Wishing you a phenomenal year filled with love, laughter, and adventure!"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all resize-none leading-relaxed font-serif"
                            />
                        </div>

                        {/* Interactive Sound presetting */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                                <Music size={11} className="text-emerald-400" /> Interactive Chime Melody
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { id: "birthday", label: "Happy Birthday" },
                                    { id: "anniversary", label: "Celebration March" }
                                ].map((melody) => (
                                    <button
                                        key={melody.id}
                                        onClick={() => setAudioMelody(melody.id as any)}
                                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                            audioMelody === melody.id 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                                : "bg-zinc-950/40 border-white/5 hover:border-white/10 text-zinc-500"
                                        }`}
                                    >
                                        {melody.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Polaroid Illustrations list */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Select Polaroid Picture</label>
                            <div className="flex gap-2 overflow-x-auto pb-1.5">
                                {STOCK_PHOTOS.map((pic) => (
                                    <button
                                        key={pic.id}
                                        onClick={() => setPhotoUrl(pic.url)}
                                        className={`w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition-all ${
                                            photoUrl === pic.url ? "border-emerald-400 scale-95 shadow-md shadow-emerald-500/10" : "border-white/5 hover:border-white/15"
                                        }`}
                                    >
                                        <img src={pic.url} alt={pic.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scratch-off secret note */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Scratch off secret note (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Look under your pillow for your real gift! 🤫"
                                value={scratchMessage}
                                onChange={(e) => setScratchMessage(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={generateWishLink}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
                        >
                            <Send size={13} className="text-zinc-950" /> Generate Wish Link
                        </button>
                    </div>

                    {/* RIGHT COLUMN: WORKSPACE REAL-TIME PREVIEW */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-zinc-900/40 border border-white/[0.04] rounded-[24px] h-[550px] relative overflow-hidden">
                        
                        {/* Shimmer backdrop dots */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                        <div className="absolute top-4 left-4 flex items-center gap-2 text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-time Designer Preview
                        </div>

                        {/* Center Box floating mockup */}
                        <div className="flex flex-col items-center gap-4 text-center mt-6">
                            <GiftBoxVisual theme={theme} isOpen={false} onOpen={() => {}} />
                            <div className="max-w-xs space-y-1 mt-6">
                                <h3 className="text-xs font-bold text-zinc-400">Box Preview ({theme})</h3>
                                <p className="text-[10px] text-zinc-600 font-semibold tracking-tight">Your recipient will click and unwrap this glowing box to reveal the customized card inside.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL / DRAWER SHARING LINK POPUP */}
                {showShareModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[300] animate-fade-in">
                        <div className="bg-zinc-900 border border-white/[0.08] w-full max-w-[440px] rounded-[24px] p-6 shadow-2xl space-y-5 relative text-left">
                            
                            <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                                <CheckCircle size={15} className="text-emerald-400 animate-pulse" /> Wish Link Ready!
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                                We have packed your custom wishes, pictures, themes, and secret scratch codes directly into this URL safe compressed hash. Copy and send it to your friend!
                            </p>

                            {/* Share Link input section */}
                            <div className="flex bg-zinc-950/60 border border-white/5 rounded-xl p-1.5 items-center gap-2">
                                <span className="text-[10.5px] font-bold text-zinc-400 truncate flex-1 pl-2 select-all">{shareLink}</span>
                                <button
                                    onClick={copyToClipboard}
                                    className={`py-2 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                                        copied 
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                            : "bg-zinc-800 text-white hover:bg-zinc-700"
                                    }`}
                                >
                                    {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>

                            {/* Social quick shares */}
                            <div className="border-t border-white/[0.04] pt-4 flex gap-2">
                                <a
                                    href={`https://api.whatsapp.com/send?text=I%2520created%2520a%2520special%2520gift%2520box%2520for%2520you!%2520Open%2520it%2520here%2520at%2520${encodeURIComponent(shareLink)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white rounded-xl border border-white/5 transition-all text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 shadow"
                                >
                                    <Share2 size={12} /> Share on WhatsApp
                                </a>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="py-2 px-4 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all text-[10.5px] font-bold uppercase tracking-wider active:scale-95"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            .animate-fade-in {
                                animation: fadeIn 0.3s ease-out forwards;
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
}
