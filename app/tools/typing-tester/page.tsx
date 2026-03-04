"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, ChangeEvent, ReactNode } from "react";
import {
    Keyboard,
    RotateCcw,
    Trophy,
    Zap,
    Timer,
    Activity,
    RefreshCcw,
    Settings,
    ChevronRight,
    Play,
    CheckCircle2,
    XCircle,
    BarChart3,
    ArrowRight,
    Users,
    UserPlus,
    Share2,
    Copy,
    Check,
    Globe,
    Link as LinkIcon,
    AlertCircle,
    Signal,
    Wifi,
    WifiOff,
    Info,
    ExternalLink,
    X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const SENTENCES = [
    "The quick brown fox jumps over the lazy dog in a beautiful forest.",
    "Programming is not just about writing code, it is about solving problems creatively.",
    "Success is stumbling from failure to failure with no loss of enthusiasm.",
    "The only way to do great work is to love what you do every single day.",
    "Innovation distinguishes between a leader and a follower in the tech world.",
    "Stay hungry, stay foolish, and never stop learning about new technologies.",
    "The power of imagination makes us infinite and allows us to dream big.",
    "In the middle of every difficulty lies a great opportunity for growth.",
    "Your time is limited, so don't waste it living someone else's life.",
    "The best way to predict the future is to create it yourself today.",
    "Simplicity is the ultimate sophistication in design and architecture.",
    "Coding is the language of the future, and everyone should learn it.",
    "Data is the new oil, but information is the engine of the economy.",
    "The cloud is just someone else's computer with better management.",
    "Artificial intelligence is growing faster than we ever imagined possible.",
    "Cybersecurity is everyone's responsibility in the modern digital age.",
    "Open source software changes how we build and share digital solutions.",
    "A journey of a thousand miles begins with a single step forward.",
    "Knowledge is power, but character is the foundation of true success.",
    "Focus on being productive instead of busy throughout your work day.",
    "To be yourself in a world that is constantly trying to make us something else is the greatest accomplishment.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is not our abilities that show what we truly are; it is our choices.",
    "Do not go where the path may lead, go instead where there is no path and leave a trail."
];

// ─── Implementation ──────────────────────────────────────────────────────────

export default function TypingTesterPage() {
    // --- Core Game State ---
    const [targetText, setTargetText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [errors, setErrors] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [visible, setVisible] = useState(false);

    // --- Dual Mode State ---
    const [mode, setMode] = useState<"solo" | "duel">("solo");
    const [sessionCode, setSessionCode] = useState("");
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [opponentData, setOpponentData] = useState<{ wpm: number; progress: number; name: string } | null>(null);
    const [duelStatus, setDuelStatus] = useState<"waiting" | "ready" | "racing" | "finished">("waiting");
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [systemStatus, setSystemStatus] = useState<"offline" | "connecting" | "online">("connecting");
    const [configWarning, setConfigWarning] = useState(false);
    const [opponentFinished, setOpponentFinished] = useState(false);
    const [userFinishedFirst, setUserFinishedFirst] = useState<boolean | null>(null);


    const inputRef = useRef<HTMLTextAreaElement>(null);
    const channelRef = useRef<any>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = useMemo(() => createClient(), []);

    // --- Core Actions ---

    const pickSentence = useCallback(() => {
        let nextSentence = targetText;
        while (nextSentence === targetText || !nextSentence) {
            nextSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
        }
        return nextSentence;
    }, [targetText]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    const resetTest = useCallback((isNewTask: boolean = true) => {
        let nextSentence = targetText;
        if (isNewTask) {
            nextSentence = pickSentence();
            setTargetText(nextSentence);
        }

        setUserInput("");
        setStartTime(null);
        setEndTime(null);
        setWpm(0);
        setAccuracy(0);
        setErrors(0);
        setIsActive(false);
        setIsFinished(false);
        setOpponentFinished(false);
        setUserFinishedFirst(null);

        // Broadcast new task if in duel and we are the host
        if (mode === "duel" && isHost && channelRef.current && isNewTask) {
            channelRef.current.send({
                type: "broadcast",
                event: "new_match",
                payload: { sentence: nextSentence }
            });
        }

        const focusInput = () => {
            if (inputRef.current) inputRef.current.focus();
        };
        setTimeout(focusInput, 50);
        setTimeout(focusInput, 200);
    }, [targetText, mode, isHost, pickSentence]);

    // --- Hyper-Resilient Handshake (Presence + Broadcast Heartbeat) ---

    const joinChannel = useCallback((code: string, amIHost: boolean, hostSentence?: string) => {
        stopHeartbeat();
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes("your-project-id") || supabaseUrl === "") {
            setSystemStatus("offline");
            setConfigWarning(true);
            setIsConnecting(false);
            return;
        }

        setSystemStatus("connecting");
        setConfigWarning(false);

        // Use simpler channel name for better compatibility
        const channelName = `duel_${code}`;
        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: true },
                presence: { key: amIHost ? "host" : "joiner" }
            }
        });

        // 1. Presence Logic
        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const keys = Object.keys(state);
            if (keys.includes("host") && keys.includes("joiner")) {
                setDuelStatus("ready");
                if (amIHost && hostSentence) {
                    channel.send({ type: "broadcast", event: "force_sync", payload: { sentence: hostSentence } });
                }
            }
        });

        // 2. Broadcast Signals (Fallback Handshake)
        channel
            .on("broadcast", { event: "ping" }, ({ payload }: any) => {
                if (amIHost && payload.from === "joiner") {
                    console.log("Duel: Joiner pinged, replying with sentence.");
                    channel.send({ type: "broadcast", event: "force_sync", payload: { sentence: hostSentence } });
                    setDuelStatus("ready");
                }
            })
            .on("broadcast", { event: "force_sync" }, ({ payload }: any) => {
                console.log("Duel: Received forced sync from host.");
                setTargetText(payload.sentence);
                setDuelStatus("ready");
            })
            .on("broadcast", { event: "new_match" }, ({ payload }: any) => {
                setTargetText(payload.sentence);
                setUserInput("");
                setStartTime(null);
                setEndTime(null);
                setWpm(0);
                setAccuracy(0);
                setErrors(0);
                setIsActive(false);
                setIsFinished(false);
                setDuelStatus("ready");
                setTimeout(() => inputRef.current?.focus(), 250);
            })
            .on("broadcast", { event: "progress" }, ({ payload }: any) => {
                setOpponentData({
                    wpm: payload.wpm,
                    progress: payload.progress,
                    name: "Opponent"
                });
                if (payload.status === "finished") {
                    setOpponentFinished(true);
                    if (userFinishedFirst === null) {
                        setUserFinishedFirst(false);
                    }
                }
            });

        // 3. Subscription and Heartbeat
        channel.subscribe(async (status: any) => {
            console.log(`Duel: Channel ${channelName} status: ${status}`);
            if (status === "SUBSCRIBED") {
                setSystemStatus("online");
                setIsConnecting(false);

                await channel.track({ online_at: new Date().toISOString() });

                // Start Handshake Heartbeat loop (every 1.5s until ready)
                heartbeatIntervalRef.current = setInterval(() => {
                    if (duelStatus !== "ready") {
                        channel.send({
                            type: "broadcast",
                            event: "ping",
                            payload: { from: amIHost ? "host" : "joiner" }
                        });
                    } else {
                        // Once ready, slow down or stop handshake pings
                        stopHeartbeat();
                    }
                }, 1500);
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                setSystemStatus("offline");
                setIsConnecting(false);
            }
        });

        channelRef.current = channel;
    }, [supabase, stopHeartbeat, duelStatus]);

    // Cleanup heartbeat when ready
    useEffect(() => {
        if (duelStatus === "ready") {
            stopHeartbeat();
        }
    }, [duelStatus, stopHeartbeat]);

    const createDuel = useCallback(async () => {
        setIsConnecting(true);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const sentence = pickSentence();

        setTargetText(sentence);
        setSessionCode(code);
        setMode("duel");
        setIsHost(true);
        setDuelStatus("waiting");
        setOpponentData(null);

        joinChannel(code, true, sentence);
    }, [pickSentence, joinChannel]);

    const joinDuel = useCallback(async (codeToJoin?: string) => {
        const code = codeToJoin || joinCodeInput;
        if (!code || code.length !== 6) return;

        setIsConnecting(true);
        setMode("duel");
        setIsHost(false);
        setOpponentData(null);
        setSessionCode(code);

        joinChannel(code, false);
    }, [joinCodeInput, joinChannel]);

    const leaveDuel = useCallback(() => {
        stopHeartbeat();
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        setMode("solo");
        setIsHost(false);
        setSessionCode("");
        setJoinCodeInput("");
        setOpponentData(null);
        setDuelStatus("waiting");

        const url = new URL(window.location.href);
        url.searchParams.delete("join");
        window.history.replaceState({}, "", url.toString());

        resetTest(true);
    }, [resetTest, stopHeartbeat]);

    // Initial load and URL handling
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("join");

        if (code && code.length === 6) {
            setJoinCodeInput(code);
            joinDuel(code);
        } else {
            resetTest(true);
        }

        return () => {
            clearTimeout(t);
            stopHeartbeat();
            if (channelRef.current) channelRef.current.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const calculateStats = useCallback((input: string) => {
        if (!startTime) return;

        const now = Date.now();
        const timeElapsedMinutes = (now - startTime) / 60000;

        const charactersTyped = input.length;
        const currentWpm = Math.round((charactersTyped / 5) / (timeElapsedMinutes || 0.0001)) || 0;
        setWpm(currentWpm);

        let currentErrors = 0;
        const inputChars = input.split("");
        const targetChars = targetText.split("");

        inputChars.forEach((char: string, i: number) => {
            if (char !== targetChars[i]) currentErrors++;
        });

        const currentAccuracy = input.length > 0
            ? Math.round(((input.length - currentErrors) / input.length) * 100)
            : 0;

        setErrors(currentErrors);
        setAccuracy(currentAccuracy);

        if (mode === "duel" && channelRef.current && systemStatus === "online") {
            channelRef.current.send({
                type: "broadcast",
                event: "progress",
                payload: {
                    wpm: currentWpm,
                    progress: Math.floor((input.length / (targetText.length || 1)) * 100),
                    status: input.length === targetText.length ? "finished" : "racing"
                }
            });
        }
    }, [startTime, targetText, mode, systemStatus]);

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (isFinished) return;

        if (!isActive && val.length > 0) {
            setIsActive(true);
            setStartTime(Date.now());
        }

        if (val.length <= targetText.length) {
            setUserInput(val);
            calculateStats(val);
        }

        if (val.length === targetText.length && targetText.length > 0) {
            setEndTime(Date.now());
            setIsActive(false);
            setIsFinished(true);
            if (mode === "duel" && userFinishedFirst === null) {
                setUserFinishedFirst(true);
            }
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(sessionCode || joinCodeInput);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const copyInviteLink = () => {
        const code = sessionCode || joinCodeInput;
        const link = `${window.location.origin}${window.location.pathname}?join=${code}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
    };

    // --- UI Helpers ---

    const words = useMemo(() => {
        let globalIdx = 0;
        if (!targetText) return [];
        return targetText.split(" ").map((word: string, wordIdx: number, array: string[]) => {
            const chars = word.split("").map((char: string) => ({ char, index: globalIdx++ }));
            if (wordIdx !== array.length - 1) chars.push({ char: " ", index: globalIdx++ });
            return chars;
        });
    }, [targetText]);

    const renderChar = (char: string, index: number) => {
        let colorClass = "text-zinc-600";
        let cursorClass = "";

        if (index < userInput.length) {
            colorClass = userInput[index] === char ? "text-zinc-100" : "text-red-500 bg-red-400/10 rounded-sm";
        } else if (index === userInput.length) {
            cursorClass = "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-sky-500 after:animate-pulse after:rounded-full";
            colorClass = "text-zinc-300";
        }

        return (
            <span key={index} className={`transition-all duration-150 inline-block px-[0.5px] ${colorClass} ${cursorClass}`}>
                {char === " " ? "\u00A0" : char}
            </span>
        );
    };

    return (
        <div className="relative min-h-screen py-16 px-6 md:px-10 bg-[#09090b] overflow-hidden text-zinc-100">
            {/* Warning for unconfigured Supabase */}
            {configWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase text-red-500 tracking-widest mb-0.5">Configuration Required</p>
                            <p className="text-[10px] text-zinc-400 font-medium">Please fill in your <code className="text-zinc-100 font-bold bg-zinc-800 px-1.5 py-0.5 rounded">.env</code> keys to enable live duels.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
                maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
            }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/60 w-fit mb-4 rounded-full backdrop-blur-md text-sky-400 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                <Zap size={10} className="fill-sky-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Tool</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[0.9] text-white">
                                Typing <span className="text-sky-500">Speed Test</span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                            {/* Mode Switchers */}
                            <div className="flex bg-zinc-900/50 backdrop-blur-xl ring-1 ring-zinc-800 p-1 rounded-2xl shadow-2xl shrink-0">
                                <button
                                    onClick={leaveDuel}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "solo" ? "bg-zinc-800 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    Solo
                                </button>
                                <button
                                    onClick={() => setMode("duel")}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "duel" ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30" : "text-zinc-500 hover:text-zinc-200"}`}
                                >
                                    Dual Duel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Dual Mode Setup UI --- */}
                {mode === "duel" && !channelRef.current && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        <div className="group p-8 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] backdrop-blur-xl hover:border-sky-500/30 transition-all">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Host Encounter</h3>
                            <p className="text-zinc-500 text-xs mb-8 font-medium leading-relaxed">Start a live competition. Share your invite link or code with a friend to begin racing.</p>
                            <button
                                onClick={createDuel}
                                disabled={isConnecting}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-sky-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-[0.98]"
                            >
                                {isConnecting ? <RefreshCcw size={16} className="animate-spin" /> : <><UserPlus size={18} /> Generate Lobby</>}
                            </button>
                        </div>
                        <div className="group p-8 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] backdrop-blur-xl hover:border-zinc-600 transition-all">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Join Lobby</h3>
                            <p className="text-zinc-500 text-xs mb-8 font-medium leading-relaxed">Have a 6-digit session code? Enter it below to join your friend's arena instantly.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Encounter ID"
                                    maxLength={6}
                                    value={joinCodeInput}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinCodeInput(e.target.value.replace(/\D/g, ""))}
                                    className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold tracking-[0.3em] focus:outline-none focus:border-sky-500 transition-colors uppercase placeholder:text-zinc-700 font-mono"
                                />
                                <button
                                    onClick={() => joinDuel()}
                                    disabled={joinCodeInput.length !== 6 || isConnecting}
                                    className="px-8 bg-zinc-100 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-white active:scale-95 transition-all disabled:opacity-30 shadow-xl"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Active Duel Invite Bar --- */}
                {mode === "duel" && channelRef.current && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-gradient-to-r from-sky-500/10 to-transparent border border-sky-500/20 rounded-[2rem] mb-10 backdrop-blur-xl animate-in slide-in-from-top-4 duration-500 ease-out">
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-500 ${systemStatus === "online" ? "bg-emerald-500 shadow-emerald-500/20" : systemStatus === "connecting" ? "bg-sky-500 shadow-sky-500/20" : "bg-red-500 shadow-red-500/20"}`}>
                                {systemStatus === "online" ? <Wifi size={22} className="animate-pulse" /> : systemStatus === "connecting" ? <RefreshCcw size={22} className="animate-spin" /> : <WifiOff size={22} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Arena Established</div>
                                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${duelStatus === "ready" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
                                        {duelStatus === "ready" ? <Check size={10} /> : <Signal size={10} className="animate-pulse" />}
                                        {duelStatus === "ready" ? "Live Hooked" : "Syncing Presence"}
                                    </div>
                                </div>
                                <div className="text-sm font-bold">
                                    {systemStatus === "offline" ? "Connection Blocked" : duelStatus === "ready" ? "Combatant connected. Ready to race!" : "Seeking Combatant..."}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-black/40 p-1.5 pr-4 rounded-xl border border-zinc-800">
                                <div className="px-3 py-2 bg-zinc-900 rounded-lg text-sm font-black tracking-[0.2em] font-mono shadow-inner">
                                    {sessionCode || joinCodeInput}
                                </div>
                                <button onClick={copyCode} title="Copy Code" className="p-2 text-zinc-500 hover:text-white transition-all hover:bg-zinc-800 rounded-lg">
                                    {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                </button>
                            </div>

                            <button
                                onClick={copyInviteLink}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-zinc-100 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white active:scale-95 transition-all shadow-xl"
                            >
                                {copiedLink ? <Check size={16} /> : <LinkIcon size={16} />}
                                {copiedLink ? "Link Copied" : "Copy Invite Link"}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Stats Display --- */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-1000 delay-100 ${visible ? "opacity-100" : "opacity-0"}`}>
                    <StatCard label="Your Output" value={wpm} unit="WPM" icon={<Zap size={18} />} accentClass="text-sky-400" active={isActive} />
                    {mode === "duel" && opponentData ? (
                        <StatCard label="Opponent" value={opponentData.wpm} unit="WPM" icon={<Users size={18} />} accentClass="text-red-400" active={opponentData.progress > 0} />
                    ) : (
                        <StatCard label="Precision" value={accuracy} unit="%" icon={<CheckCircle2 size={18} />} accentClass="text-emerald-400" active={isActive} />
                    )}
                    <StatCard label="Anomalies" value={errors} unit="err" icon={<XCircle size={18} />} accentClass="text-red-400" active={isActive} />
                    <StatCard label="Time" value={startTime ? Math.floor(((endTime || Date.now()) - startTime) / 1000) : 0} unit="sec" icon={<Timer size={18} />} accentClass="text-amber-400" active={isActive} />
                </div>

                {/* --- Main Arena --- */}
                <div className={`relative bg-zinc-900/40 border border-zinc-800/80 rounded-[3rem] p-10 md:p-16 mb-8 backdrop-blur-2xl shadow-2xl transition-all duration-1000 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    {/* Progress bars for Duel */}
                    {mode === "duel" && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 flex opacity-60">
                            <div className="h-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.5)] transition-all duration-300 ease-out" style={{ width: `${(userInput.length / (targetText.length || 1)) * 100}%` }} />
                            {opponentData && <div className="h-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all duration-300 ease-out border-l border-white/20" style={{ width: `${opponentData.progress}%` }} />}
                        </div>
                    )}

                    <div className="mb-14 min-h-[160px] text-4xl md:text-5xl font-bold tracking-tight leading-[1.4] font-mono text-center flex flex-wrap justify-center content-center gap-y-3 select-none">
                        {words.map((wordChars: any[], wordIdx: number) => (
                            <div key={wordIdx} className="inline-flex whitespace-nowrap">
                                {wordChars.map(({ char, index }: { char: string, index: number }) => renderChar(char, index))}
                            </div>
                        ))}
                    </div>

                    <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={handleInputChange}
                        className="absolute inset-x-0 top-0 bottom-32 w-full opacity-0 cursor-default resize-none overflow-hidden z-0"
                        autoFocus
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                    />

                    {/* Controls Bar */}
                    <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => resetTest(false)}
                                className="group flex items-center gap-2.5 px-8 py-4 bg-zinc-800/80 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700/80 rounded-2xl border border-zinc-700 transition-all active:scale-95 backdrop-blur-md"
                            >
                                <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                                Reset
                            </button>
                            <button
                                onClick={() => resetTest(true)}
                                className="group flex items-center gap-2.5 px-8 py-4 bg-sky-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-400 rounded-2xl active:scale-95 shadow-2xl shadow-sky-500/20 transition-all"
                            >
                                Next Task
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                        </div>

                        {!isActive && !isFinished && (
                            <div className="flex items-center gap-3 animate-pulse bg-sky-500/5 px-5 py-2.5 rounded-2xl border border-sky-500/20">
                                <Keyboard size={16} className="text-sky-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Initiate Sequence</span>
                            </div>
                        )}

                        {isFinished && (
                            <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-5 py-2.5 rounded-2xl border border-emerald-500/20">
                                <CheckCircle2 size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Success</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Results Modal --- */}
                {isFinished && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="relative w-full max-w-4xl animate-in slide-in-from-bottom-12 duration-500 fill-mode-both ease-out">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsFinished(false)}
                                className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center shadow-2xl z-[101] transition-all hover:rotate-90 active:scale-90"
                            >
                                <X size={24} />
                            </button>

                            <div className="bg-gradient-to-br from-zinc-900/90 to-black/98 border border-zinc-800 rounded-[4rem] p-12 md:p-20 flex flex-col lg:flex-row items-center gap-16 shadow-[0_48px_128px_-24px_rgba(0,0,0,1)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full -ml-32 -mb-32" />

                                <div className="shrink-0 relative group">
                                    <div className="absolute inset-0 bg-sky-500/30 rounded-full blur-3xl group-hover:blur-[60px] transition-all duration-1000 animate-pulse" />
                                    <div className="relative w-48 h-48 rounded-full border-2 border-sky-500/30 bg-black flex items-center justify-center shadow-inner">
                                        <div className="text-center">
                                            <div className="text-6xl font-black text-white tracking-tighter leading-none">{wpm}</div>
                                            <div className="text-xs font-black uppercase text-sky-500 tracking-widest mt-2">WPM</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 text-center lg:text-left">
                                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                                        <div className={`p-3 rounded-2xl ${userFinishedFirst ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}`}>
                                            <Trophy size={28} />
                                        </div>
                                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                                            {mode === "duel"
                                                ? (userFinishedFirst ? "Mission Complete - Won" : "Mission Complete - Lost")
                                                : "Mission Complete"}
                                        </h3>
                                    </div>
                                    <p className="text-zinc-500 text-lg mb-10 leading-relaxed max-w-xl font-medium">
                                        Maintained <span className="text-white font-bold">{accuracy}% precision</span> with {errors} anomalies over {targetText.length} characters in {Math.floor(((endTime || Date.now()) - (startTime || Date.now())) / 1000)} seconds.
                                        {mode === "duel" && opponentData && (
                                            <span className="block mt-4 text-zinc-400">
                                                Opponent finished with <span className="text-sky-400 font-bold">{opponentData.wpm} WPM</span>.
                                            </span>
                                        )}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                        <button
                                            onClick={() => resetTest(true)}
                                            className="group flex-1 lg:flex-none flex items-center justify-center gap-4 px-12 py-5 bg-sky-500 text-white font-black text-xs uppercase tracking-[0.25em] hover:bg-sky-400 rounded-2xl shadow-2xl shadow-sky-500/40 transition-all active:scale-[0.98]"
                                        >
                                            <span>Next Task</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                                        </button>
                                        <button
                                            onClick={() => resetTest(false)}
                                            className="group flex-1 lg:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-zinc-800 text-white font-black text-xs uppercase tracking-[0.25em] hover:bg-zinc-700 rounded-2xl border border-zinc-700 transition-all active:scale-[0.98]"
                                        >
                                            <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                                            <span>Retry</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Supabase Config Instructions Overlay (Only if offline/warning) */}
            {configWarning && (
                <div className="mt-10 max-w-2xl mx-auto p-10 bg-zinc-900/60 rounded-[3rem] border border-zinc-800 backdrop-blur-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <Info size={24} className="text-sky-500" />
                        <h4 className="text-xl font-black uppercase tracking-tight">How to activate Dual Duel</h4>
                    </div>
                    <div className="space-y-6 text-sm text-zinc-400 font-medium">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-100 shrink-0">1</div>
                            <p>Go to your <span className="text-zinc-100 transition-colors">Supabase Dashboard</span> &gt; Project Settings &gt; API.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-100 shrink-0">2</div>
                            <p>Copy the <span className="text-sky-400">Project URL</span> and <span className="text-sky-400">anon public</span> key.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-100 shrink-0">3</div>
                            <div>
                                <p className="mb-3">Paste them into your <code className="text-zinc-100 bg-black px-2 py-1 rounded">.env</code> file:</p>
                                <pre className="bg-black/60 p-4 rounded-xl text-[10px] font-mono text-zinc-500 leading-relaxed border border-zinc-800">
                                    NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"<br />
                                    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-real-key-here"
                                </pre>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-100 shrink-0">4</div>
                            <p>Restart your server. The <span className="text-emerald-500">Green WiFi</span> will appear!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, unit, icon, active, accentClass }: {
    label: string,
    value: number | string,
    unit: string,
    icon: ReactNode,
    active: boolean,
    accentClass: string
}) {
    return (
        <div className={`p-8 rounded-[2.5rem] border transition-all duration-700 backdrop-blur-2xl ${active ? "border-zinc-700/50 bg-zinc-900/60 shadow-2xl" : "border-zinc-800/50 bg-zinc-900/10"}`}>
            <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{label}</span>
                <div className={`${active ? accentClass : "text-zinc-700"} transition-colors duration-500`}>{icon}</div>
            </div>
            <div className="flex items-baseline gap-2.5">
                <div className="text-5xl font-black text-zinc-100 tabular-nums tracking-tighter leading-none">{value}</div>
                <div className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em]">{unit}</div>
            </div>
        </div>
    );
}
