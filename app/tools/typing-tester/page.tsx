"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    Signal
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

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const channelRef = useRef<any>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = useMemo(() => createClient(), []);

    // --- Core Actions ---

    const pickSentence = useCallback(() => {
        let nextSentence = targetText;
        while (nextSentence === targetText || !nextSentence) {
            nextSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
        }
        return nextSentence;
    }, [targetText]);

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

        // Broadcast new task if in duel and we are the host
        if (mode === "duel" && isHost && channelRef.current && isNewTask) {
            channelRef.current.send({
                type: "broadcast",
                event: "new_match",
                payload: { sentence: nextSentence }
            }).then((status) => {
                if (status === "error") console.error("Broadcast: Send match error");
            });
        }

        const focusInput = () => {
            if (inputRef.current) inputRef.current.focus();
        };
        setTimeout(focusInput, 50);
        setTimeout(focusInput, 200);
    }, [targetText, mode, isHost, pickSentence]);

    // --- Dual Mode Handshake Logic ---

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const joinChannel = useCallback((code: string, amIHost: boolean, hostSentence?: string) => {
        stopHeartbeat();
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        console.log(`Duel: Joining room:duel-${code} as ${amIHost ? "Host" : "Joiner"}`);

        // Use a more unique room prefix
        const channel = supabase.channel(`room:duel-${code}`, {
            config: {
                broadcast: { self: false },
                presence: { key: amIHost ? "host" : "joiner" }
            }
        });

        channel
            .on("broadcast", { event: "ping_init" }, ({ payload }) => {
                if (!amIHost) {
                    console.log("Duel: Handshake: Recv PING_INIT from Host");
                    setTargetText(payload.sentence);
                    setDuelStatus("ready");
                    // Response: joined
                    channel.send({ type: "broadcast", event: "ping_joined", payload: {} });
                }
            })
            .on("broadcast", { event: "ping_joined" }, () => {
                if (amIHost) {
                    console.log("Duel: Handshake: Recv PING_JOINED from Joiner");
                    setDuelStatus("ready");
                }
            })
            .on("broadcast", { event: "new_match" }, ({ payload }) => {
                console.log("Duel: Broadcast: Recv NEW_MATCH");
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
            .on("broadcast", { event: "progress" }, ({ payload }) => {
                setOpponentData({
                    wpm: payload.wpm,
                    progress: payload.progress,
                    name: "Opponent"
                });
            })
            .subscribe(async (status) => {
                console.log(`Duel: Channel Status: ${status}`);
                if (status === "SUBSCRIBED") {
                    setIsConnecting(false);

                    // Reliability Heartbeat: Loop until ready
                    heartbeatRef.current = setInterval(() => {
                        if (amIHost) {
                            channel.send({
                                type: "broadcast",
                                event: "ping_init",
                                payload: { sentence: hostSentence }
                            }).then((status) => {
                                if (status === "error") console.error("Pulse error: init");
                            });
                        } else {
                            channel.send({
                                type: "broadcast",
                                event: "ping_joined",
                                payload: {}
                            }).then((status) => {
                                if (status === "error") console.error("Pulse error: joined");
                            });
                        }
                    }, 1000); // 1s frequency for faster locking
                }
            });

        channelRef.current = channel;
    }, [supabase, stopHeartbeat]);

    // Force stop heartbeat once connection locks
    useEffect(() => {
        if (duelStatus === "ready") {
            console.log("Duel: Handshake Complete. Ready to race.");
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

        inputChars.forEach((char, i) => {
            if (char !== targetChars[i]) currentErrors++;
        });

        const currentAccuracy = input.length > 0
            ? Math.round(((input.length - currentErrors) / input.length) * 100)
            : 0;

        setErrors(currentErrors);
        setAccuracy(currentAccuracy);

        if (mode === "duel" && channelRef.current) {
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
    }, [startTime, targetText, mode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        return targetText.split(" ").map((word, wordIdx, array) => {
            const chars = word.split("").map(char => ({ char, index: globalIdx++ }));
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

    const syncStatusLabel = () => {
        if (!channelRef.current) return null;
        if (duelStatus === "ready") return (
            <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <Check size={10} /> Live Hooked
            </div>
        );
        return (
            <div className="flex items-center gap-2 text-amber-400 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                <Signal size={10} className="animate-pulse" /> Syncing...
            </div>
        );
    };

    return (
        <div className="relative min-h-screen py-16 px-6 md:px-10 bg-[#09090b] overflow-hidden text-zinc-100">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
                maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
            }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/60 w-fit mb-4 rounded-full backdrop-blur-md text-sky-400 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                <Zap size={12} className="fill-sky-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Tool</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">
                                Speed <span className="text-sky-500">Typist</span>
                            </h1>
                        </div>

                        {/* Mode Switchers */}
                        <div className="flex bg-zinc-900/50 backdrop-blur-xl ring-1 ring-zinc-800 p-1.5 rounded-2xl shadow-2xl">
                            <button
                                onClick={leaveDuel}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "solo" ? "bg-zinc-800 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                <Play size={14} /> Solo
                            </button>
                            <button
                                onClick={() => setMode("duel")}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "duel" ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30" : "text-zinc-500 hover:text-zinc-200"}`}
                            >
                                <Users size={14} /> Dual Duel
                            </button>
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
                                    onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ""))}
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
                            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                                {duelStatus === "waiting" ? <RefreshCcw size={22} className="animate-spin" /> : <Globe size={22} className="animate-pulse" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Arena Established</div>
                                    {syncStatusLabel()}
                                </div>
                                <div className="text-sm font-bold">
                                    {duelStatus === "waiting" ? "Seeking Combatant..." : "Combatant connected. Ready to race!"}
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
                        {words.map((wordChars, wordIdx) => (
                            <div key={wordIdx} className="inline-flex whitespace-nowrap">
                                {wordChars.map(({ char, index }) => renderChar(char, index))}
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

                {/* --- Results Section --- */}
                {isFinished && (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both ease-out">
                        <div className="bg-gradient-to-br from-zinc-900/90 to-black/90 border border-zinc-800 rounded-[4rem] p-12 md:p-20 flex flex-col lg:flex-row items-center gap-16 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />

                            <div className="shrink-0 relative group">
                                <div className="absolute inset-0 bg-sky-500/30 rounded-full blur-3xl group-hover:blur-[60px] transition-all duration-1000" />
                                <div className="relative w-48 h-48 rounded-full border-2 border-sky-500/30 bg-black flex items-center justify-center shadow-inner">
                                    <div className="text-center">
                                        <div className="text-6xl font-black text-white tracking-tighter leading-none">{wpm}</div>
                                        <div className="text-xs font-black uppercase text-sky-500 tracking-widest mt-2">WPM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                                    <Trophy size={28} className="text-amber-400" />
                                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                                        {mode === "duel" && opponentData ? (wpm > opponentData.wpm ? "Mission Complete - Won" : "Mission Complete - Lost") : "Stats Logged"}
                                    </h3>
                                </div>
                                <p className="text-zinc-500 text-lg mb-10 leading-relaxed max-w-xl font-medium">
                                    Maintained <span className="text-white font-bold">{accuracy}% precision</span> with {errors} anomalies over {targetText.length} characters in {Math.floor(((endTime || Date.now()) - (startTime || Date.now())) / 1000)} seconds.
                                </p>

                                <button
                                    onClick={() => resetTest(true)}
                                    className="group w-full lg:w-fit flex items-center justify-center gap-4 px-12 py-5 bg-sky-500 text-white font-black text-xs uppercase tracking-[0.25em] hover:bg-sky-400 rounded-2xl shadow-2xl shadow-sky-500/40 transition-all active:scale-[0.98]"
                                >
                                    <span>Proceed to Next Task</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, unit, icon, active, accentClass }: {
    label: string,
    value: number | string,
    unit: string,
    icon: React.ReactNode,
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
