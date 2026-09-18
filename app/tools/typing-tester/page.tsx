"use client";

import React, {
    useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import Link from "next/link";
import {
    Timer, Keyboard, RotateCcw, MousePointer2, ArrowRight,
    Copy, Check, Settings2, X, Palette, ArrowLeft, HelpCircle,
    Zap, Clock, Sparkles, BarChart2, Shield, Users, Trophy,
    ShieldCheck, Package
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Themes ───────────────────────────────────────────────────────────────────
interface Theme {
    name: string;
    bg: string;
    surface: string;
    surfaceHi?: string;
    border: string;
    borderDim?: string;
    text: string;
    textPri?: string;
    textSec?: string;
    muted: string;
    dim: string;
    accent: string;        // caret + correct chars
    accentHex: string;     // raw hex for SVG / glow
    error: string;
}

const THEMES: Theme[] = [
    {
        name: "dark",
        bg: "#333333", surface: "#3a3a3a", border: "#555555",
        text: "#cccccc", muted: "#999999", dim: "#2a2a2a",
        accent: "#4db8d4", accentHex: "#4db8d4", error: "#e06c75",
    },
    {
        name: "neobrutalist",
        bg: "#F4ECD8", surface: "#ffffff", border: "#000000",
        text: "#000000", muted: "#7f735f", dim: "#f3ede2",
        accent: "#f59e0b", accentHex: "#f59e0b", error: "#dc2626",
    },
    {
        name: "midnight",
        bg: "#0e0e10", surface: "#2c2e31", border: "#4c4f52",
        text: "#d1d0c5", muted: "#646669", dim: "#3a3a3a",
        accent: "#e2b714", accentHex: "#e2b714", error: "#ca4754",
    },
    {
        name: "ocean",
        bg: "#0d1b2a", surface: "#1b2d3e", border: "#2e4057",
        text: "#e0f0ff", muted: "#6b8fa8", dim: "#1e3347",
        accent: "#00c8ff", accentHex: "#00c8ff", error: "#ff5555",
    },
    {
        name: "forest",
        bg: "#0f1a0f", surface: "#1a2e1a", border: "#2d4a2d",
        text: "#d4e8d4", muted: "#5a8a5a", dim: "#1e301e",
        accent: "#5dde5d", accentHex: "#5dde5d", error: "#e05252",
    },
    {
        name: "rose",
        bg: "#1a0d0d", surface: "#2e1a1a", border: "#4a2d2d",
        text: "#f5dada", muted: "#8a5a5a", dim: "#301e1e",
        accent: "#ff7eb3", accentHex: "#ff7eb3", error: "#ff4444",
    },
    {
        name: "lavender",
        bg: "#0f0d1a", surface: "#1e1a2e", border: "#362d4a",
        text: "#e0d8f5", muted: "#7a6fa0", dim: "#231e30",
        accent: "#b894f7", accentHex: "#b894f7", error: "#f76e6e",
    },
    {
        name: "ember",
        bg: "#12080a", surface: "#251114", border: "#3e1a1f",
        text: "#f5d8c0", muted: "#8a5a44", dim: "#2a1518",
        accent: "#ff6b35", accentHex: "#ff6b35", error: "#ff3366",
    },
    {
        name: "arctic",
        bg: "#0d1117", surface: "#161b22", border: "#21262d",
        text: "#c9d1d9", muted: "#484f58", dim: "#1c2128",
        accent: "#58a6ff", accentHex: "#58a6ff", error: "#f85149",
    },
    {
        name: "cream",
        bg: "#f5f0e8", surface: "#ede7d9", border: "#cec6b4",
        text: "#2d2416", muted: "#8a7a62", dim: "#ddd6c8",
        accent: "#c07a1e", accentHex: "#c07a1e", error: "#c0392b",
    },
    {
        name: "noir",
        bg: "#080808", surface: "#181818", border: "#303030",
        text: "#e8e8e8", muted: "#555555", dim: "#222222",
        accent: "#ffffff", accentHex: "#ffffff", error: "#e05252",
    },
    {
        name: "candy",
        bg: "#1a0f24", surface: "#2d1a40", border: "#4a2e66",
        text: "#f8e8ff", muted: "#9a72b8", dim: "#251535",
        accent: "#ff6dd3", accentHex: "#ff6dd3", error: "#ff4444",
    },
    {
        name: "tokyo",
        bg: "#0a0a12", surface: "#13131f", border: "#1f1f33",
        text: "#f0f0ff", muted: "#5c5c8a", dim: "#16162a",
        accent: "#ff2d78", accentHex: "#ff2d78", error: "#ff9900",
    },
    {
        name: "matrix",
        bg: "#000d00", surface: "#001a00", border: "#003300",
        text: "#ccffcc", muted: "#2e7d32", dim: "#002200",
        accent: "#00ff41", accentHex: "#00ff41", error: "#ff4444",
    },
    {
        name: "nebula",
        bg: "#07030f", surface: "#130a24", border: "#220f3d",
        text: "#e8d5ff", muted: "#6a3fa0", dim: "#180d2e",
        accent: "#a78bfa", accentHex: "#a78bfa", error: "#f43f5e",
    },
    {
        name: "copper",
        bg: "#0f0a06", surface: "#1e1509", border: "#33230f",
        text: "#f7e8d4", muted: "#8a6535", dim: "#261b0d",
        accent: "#e8935a", accentHex: "#e8935a", error: "#e05050",
    },
    {
        name: "glacier",
        bg: "#07111a", surface: "#0e1e2c", border: "#163040",
        text: "#daf6ff", muted: "#4a7d99", dim: "#111e2a",
        accent: "#4dd9e8", accentHex: "#4dd9e8", error: "#f96060",
    },
    {
        name: "mint",
        bg: "#06100d", surface: "#0e1f1a", border: "#17332c",
        text: "#d6f5ee", muted: "#3d8070", dim: "#0e1e1a",
        accent: "#2effc3", accentHex: "#2effc3", error: "#ff5470",
    },
    {
        name: "blood",
        bg: "#0f0000", surface: "#200000", border: "#3a0000",
        text: "#ffd5d5", muted: "#7a3030", dim: "#1a0000",
        accent: "#ff2222", accentHex: "#ff2222", error: "#ff9000",
    },
    {
        name: "cyber",
        bg: "#030d0a", surface: "#071a14", border: "#0d2e22",
        text: "#e2fff5", muted: "#2e7a5c", dim: "#091a12",
        accent: "#c6ff00", accentHex: "#c6ff00", error: "#ff4060",
    },
    {
        name: "dusk",
        bg: "#100b18", surface: "#1c1428", border: "#2e2040",
        text: "#f5deed", muted: "#806070", dim: "#180f22",
        accent: "#f0a0d0", accentHex: "#f0a0d0", error: "#ff6060",
    },
    {
        name: "solar",
        bg: "#fdfbf6", surface: "#f0ebe0", border: "#d8cebc",
        text: "#2c1e0e", muted: "#9a8060", dim: "#e8e0d0",
        accent: "#d95700", accentHex: "#d95700", error: "#c0202a",
    },
];

const WORD_BANK = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
    "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
    "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
    "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know",
    "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come",
    "its", "over", "think", "also", "back", "after", "use", "two", "how",
    "our", "work", "first", "well", "way", "even", "new", "want", "because",
    "any", "these", "give", "day", "most", "us", "more", "create", "build",
    "future", "simple", "power", "great", "change", "digital", "modern",
    "world", "growth", "cloud", "server", "design", "code", "logic", "run",
    "data", "type", "speed", "write", "read", "fast", "slow", "system",
    "open", "close", "start", "stop", "find", "keep", "need", "place",
    "large", "public", "high", "between", "long", "big", "down", "side",
];

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

const PUNCTUATION = [",", ".", "!", "?", ";", ":", "-", "'"];
const NUMBERS_BANK = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "12", "15", "20", "25", "30", "42", "50", "64", "100", "256", "1024"
];

function generateText(wordCount: number, withPunct: boolean, withNums: boolean): string {
    const arr: string[] = [];
    for (let i = 0; i < wordCount; i++) {
        if (withNums && i > 0 && Math.random() < 0.15) {
            arr.push(NUMBERS_BANK[Math.floor(Math.random() * NUMBERS_BANK.length)]);
        }
        let word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
        if (withPunct && i > 0 && Math.random() < 0.2) {
            const p = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
            word = Math.random() > 0.5 ? word + p : p + word;
        }
        arr.push(word);
    }
    return arr.join(" ");
}

type TestMode = "time" | "words" | "both";
type CharState = "pending" | "correct" | "incorrect";

interface WordData {
    word: string;
    chars: { char: string; state: CharState }[];
    isComplete: boolean;
    hasError: boolean;
    typed: string;
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 2,
            background: "#3a3a3a", border: "1px solid #555555",
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
            background: "#3a3a3a", border: "1px solid #555555", borderRadius: 3,
            padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <h4 style={{ fontSize: 11, fontWeight: 400, color: "#cccccc", margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#4db8d4" }}>Q:</span><span>{question}</span>
                </h4>
                <span style={{ color: "#999999", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
            </div>
            <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
                <p style={{ fontSize: 11, color: "#999999", lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
            </div>
        </div>
    );
}

export default function TypingTesterPage() {
    const [themeIdx, setThemeIdx] = useState(() => Math.max(0, THEMES.findIndex(t => t.name === "dark")));
    const rawTheme = THEMES[themeIdx];
    const T = useMemo(() => ({
        ...rawTheme,
        surfaceHi: rawTheme.surfaceHi || (rawTheme.name === "dark" ? "#444444" : rawTheme.surface),
        borderDim: rawTheme.borderDim || (rawTheme.name === "dark" ? "#2a2a2a" : rawTheme.dim || rawTheme.border),
        textPri: rawTheme.textPri || (rawTheme.name === "dark" ? "#cccccc" : rawTheme.text),
        textSec: rawTheme.textSec || (rawTheme.name === "dark" ? "#999999" : rawTheme.muted),
    }), [rawTheme]);

    const [testMode, setTestMode] = useState<TestMode>("time");
    const [timeConfig, setTimeConfig] = useState(30);
    const [wordConfig, setWordConfig] = useState(25);
    const [usePunctuation, setUsePunctuation] = useState(false);
    const [useNumbers, setUseNumbers] = useState(false);

    const [words, setWords] = useState<WordData[]>([]);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const [completedWords, setCompletedWords] = useState<WordData[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [elapsed, setElapsed] = useState(0);

    const [wpm, setWpm] = useState(0);
    const [rawWpm, setRawWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [wpmHistory, setWpmHistory] = useState<{ t: number; wpm: number }[]>([]);
    const [errorHistory, setErrorHistory] = useState<{ t: number; count: number }[]>([]);

    const [isFocused, setIsFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [customInput, setCustomInput] = useState("");

    const [duelMode, setDuelMode] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [sessionCode, setSessionCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [opponentProgress, setOpponentProgress] = useState(0);
    const [opponentWpm, setOpponentWpm] = useState(0);
    const [opponentFinished, setOpponentFinished] = useState(false);
    const [opponentFinishWpm, setOpponentFinishWpm] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);
    const [supabaseOnline, setSupabaseOnline] = useState(false);
    const [duelStatus, setDuelStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const wordsRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedRef = useRef<NodeJS.Timeout | null>(null);
    const historyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<ReturnType<typeof createClient> extends { channel: (...a: any[]) => infer R } ? R : any>(null);
    const supabase = useMemo(() => createClient(), []);
    const wpmRef = useRef(0);
    const wordsDataRef = useRef<WordData[]>([]);
    const currentWordIdxRef = useRef(0);
    const punctRef = useRef(false);
    const numsRef = useRef(false);
    const startTimeRef = useRef<number | null>(null);
    const completedWordsRef = useRef<WordData[]>([]);
    const currentInputRef = useRef("");
    const isFinishedRef = useRef(false);

    useEffect(() => { wordsDataRef.current = words; }, [words]);
    useEffect(() => { currentWordIdxRef.current = currentWordIdx; }, [currentWordIdx]);
    useEffect(() => { completedWordsRef.current = completedWords; }, [completedWords]);
    useEffect(() => { currentInputRef.current = currentInput; }, [currentInput]);
    useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);

    const buildWords = useCallback((count: number): WordData[] => {
        const raw = generateText(count, punctRef.current, numsRef.current).split(" ");
        return raw.map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false,
            hasError: false,
            typed: "",
        }));
    }, []);

    const resetTest = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (historyTimerRef.current) clearInterval(historyTimerRef.current);

        const count = testMode === "time" ? 80 : wordConfig;
        const newWords = buildWords(count);

        setWords(newWords);
        setCurrentWordIdx(0);
        setCurrentInput("");
        setCompletedWords([]);
        setIsActive(false);
        setIsFinished(false);
        setStartTime(null);
        setEndTime(null);
        setTimeLeft(testMode === "words" ? 0 : timeConfig);
        setElapsed(0);
        setWpm(0);
        setRawWpm(0);
        setAccuracy(100);
        setWpmHistory([]);
        setErrorHistory([]);
        wpmRef.current = 0;
        completedWordsRef.current = [];
        currentInputRef.current = "";

        if (wordsRef.current) wordsRef.current.style.transform = "translateY(0)";
        setTimeout(() => inputRef.current?.focus(), 50);

        return newWords;
    }, [testMode, timeConfig, wordConfig, buildWords]);

    useEffect(() => {
        if (duelMode && duelStatus === "connected") return;
        resetTest();
    }, [testMode, timeConfig, wordConfig, resetTest, duelMode, duelStatus]);

    useEffect(() => {
        punctRef.current = usePunctuation;
        numsRef.current = useNumbers;
        resetTest();
    }, [usePunctuation, useNumbers, resetTest]);

    useEffect(() => {
        setVisible(true);
        if (supabase) {
            setSupabaseOnline(true);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            if (historyTimerRef.current) clearInterval(historyTimerRef.current);
            channelRef.current?.unsubscribe();
        };
    }, [supabase]);

    const rafRef = useRef<number | null>(null);

    const updateCaret = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (!wordsRef.current || !wrapperRef.current) return;
            const wordEls = wordsRef.current.querySelectorAll<HTMLSpanElement>(".word-el");
            const currentWordEl = wordEls[currentWordIdx];
            if (!currentWordEl) return;

            const charEls = currentWordEl.querySelectorAll<HTMLSpanElement>(".char-el");
            const caretCharIdx = currentInput.length;
            const containerRect = wordsRef.current.getBoundingClientRect();
            let top = 0, left = 0;

            if (caretCharIdx < charEls.length) {
                const r = charEls[caretCharIdx].getBoundingClientRect();
                top = r.top - containerRect.top;
                left = r.left - containerRect.left;
            } else if (charEls.length > 0) {
                const r = charEls[charEls.length - 1].getBoundingClientRect();
                top = r.top - containerRect.top;
                left = r.left - containerRect.left + r.width;
            }
            setCaretPos({ top, left });

            // Auto-scroll: robust fixed positioning using offsetTop
            if (wrapperRef.current && wordsRef.current) {
                const wordOffsetTop = currentWordEl.offsetTop;
                if (wordOffsetTop > 35) {
                    wordsRef.current.style.transform = `translateY(-${wordOffsetTop - 35}px)`;
                } else {
                    wordsRef.current.style.transform = `translateY(0px)`;
                }
            }
        });
    }, [currentWordIdx, currentInput]);

    useEffect(() => {
        updateCaret();
    }, [currentInput, currentWordIdx, words, updateCaret]);

    useEffect(() => {
        const handleResize = () => updateCaret();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [updateCaret]);

    // Cleanup RAF on unmount
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    const calcStats = useCallback((completed: WordData[], currentTyped: string, timeSec: number) => {
        let correctChars = 0;
        let totalTypedChars = 0;

        completed.forEach(w => {
            w.chars.forEach(c => {
                totalTypedChars++;
                if (c.state === "correct") correctChars++;
            });
            if (w.typed && w.typed.length > w.word.length) {
                totalTypedChars += (w.typed.length - w.word.length);
            }
        });

        const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
        currentTyped.split("").forEach((c, i) => {
            totalTypedChars++;
            if (c === currentWord[i]) correctChars++;
        });

        const mins = timeSec > 0 ? (timeSec / 60) : 0.001;
        const computedWpm = totalTypedChars > 0 ? Math.round((correctChars / 5) / mins) : 0;
        const computedRaw = totalTypedChars > 0 ? Math.round((totalTypedChars / 5) / mins) : 0;
        const computedAcc = totalTypedChars > 0 ? Math.round((correctChars / totalTypedChars) * 100) : 100;

        setWpm(computedWpm);
        wpmRef.current = computedWpm;
        setRawWpm(computedRaw);
        setAccuracy(computedAcc);
    }, []);

    const finishTest = useCallback(() => {
        setIsFinished(true);
        setIsActive(false);
        const end = Date.now();
        setEndTime(end);

        if (timerRef.current) clearInterval(timerRef.current);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (historyTimerRef.current) clearInterval(historyTimerRef.current);

        let finalCorrect = completedWordsRef.current.reduce((a, w) => a + w.chars.filter(c => c.state === "correct").length, 0);
        let finalIncorrect = completedWordsRef.current.reduce((a, w) => a + w.chars.filter(c => c.state === "incorrect").length, 0);

        if (currentInputRef.current) {
            const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
            currentInputRef.current.split("").forEach((c, i) => {
                if (c === currentWord[i]) finalCorrect++;
                else finalIncorrect++;
            });
        }

        const totalTyped = finalCorrect + finalIncorrect;
        const elapsedSec = startTimeRef.current ? (end - startTimeRef.current) / 1000 : (testMode === "time" ? timeConfig : 1);
        const finalWpm = totalTyped > 0 ? Math.round((finalCorrect / 5) / (elapsedSec / 60)) : 0;

        if (duelMode && channelRef.current) {
            channelRef.current.send({
                type: "broadcast",
                event: "finish",
                payload: { wpm: finalWpm }
            });
        }
    }, [duelMode, testMode, timeConfig]);

    const startTimers = useCallback(() => {
        const start = Date.now();
        setStartTime(start);
        startTimeRef.current = start;

        elapsedRef.current = setInterval(() => {
            const sec = (Date.now() - start) / 1000;
            setElapsed(sec);
            calcStats(completedWordsRef.current, currentInputRef.current, sec);
        }, 200);

        let tick = 0;
        let lastErrorCount = 0;
        historyTimerRef.current = setInterval(() => {
            tick += 0.5;

            let currentTotalErrors = completedWordsRef.current.reduce((acc, w) => acc + w.chars.filter(c => c.state === "incorrect").length, 0);
            const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
            const currentTyped = currentInputRef.current;
            currentTyped.split("").forEach((c, i) => {
                if (c !== currentWord[i]) currentTotalErrors++;
            });

            setWpmHistory(prev => [...prev, { t: tick, wpm: wpmRef.current }]);

            if (currentTotalErrors > lastErrorCount) {
                setErrorHistory(prev => [...prev, { t: tick, count: currentTotalErrors - lastErrorCount }]);
                lastErrorCount = currentTotalErrors;
            }
        }, 500);

        if (testMode === "time" || testMode === "both") {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { finishTest(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [testMode, finishTest, calcStats]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            inputRef.current?.focus();
            const t = setTimeout(() => setCountdown(null), 700);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;
        if (countdown !== null) return;
        const val = e.target.value;

        if (!isActive && val.length > 0) {
            setIsActive(true);
            startTimers();
        }

        if (val.endsWith(" ") || val.endsWith("\n")) {
            const typed = val.slice(0, -1);
            const wordData = words[currentWordIdx];
            if (!wordData) return;

            const updatedChars: { char: string; state: CharState }[] = wordData.word.split("").map((c, i) => ({
                char: c,
                state: (typed[i] === c ? "correct" : "incorrect") as CharState,
            }));

            if (typed.length > wordData.word.length) {
                const extraChars = typed.slice(wordData.word.length).split("").map(c => ({
                    char: c,
                    state: "incorrect" as CharState,
                }));
                updatedChars.push(...extraChars);
            }

            const hasError = typed !== wordData.word;
            const completedWord: WordData = { ...wordData, chars: updatedChars, isComplete: true, hasError, typed };
            const newCompleted = [...completedWords, completedWord];
            setCompletedWords(newCompleted);
            completedWordsRef.current = newCompleted;

            const nextIdx = currentWordIdx + 1;

            if (testMode === "time" && nextIdx >= words.length - 10) {
                const moreWords = buildWords(50);
                setWords(prev => [...prev, ...moreWords]);
            }

            if ((testMode === "words" || testMode === "both") && nextIdx >= words.length) {
                setCurrentInput("");
                currentInputRef.current = "";
                finishTest();
                return;
            }

            setCurrentWordIdx(nextIdx);
            currentWordIdxRef.current = nextIdx;
            setCurrentInput("");
            currentInputRef.current = "";
            calcStats(newCompleted, "", elapsed);
            return;
        }

        const currentWord = words[currentWordIdx]?.word || "";

        if ((testMode === "words" || testMode === "both") && currentWordIdx === words.length - 1 && val.length === currentWord.length) {
            const wordData = words[currentWordIdx];
            const updatedChars = wordData.word.split("").map((c, i) => ({ 
                char: c, 
                state: (val[i] === c ? "correct" : "incorrect") as CharState 
            }));
            const completedWord: WordData = { 
                ...wordData, 
                chars: updatedChars, 
                isComplete: true, 
                hasError: val !== currentWord, 
                typed: val 
            };

            const newCompleted = [...completedWords, completedWord];
            setCompletedWords(newCompleted);
            completedWordsRef.current = newCompleted;
            setCurrentInput("");
            currentInputRef.current = "";
            finishTest();
            return;
        }

        if (val.length > currentWord.length + 8) return;
        setCurrentInput(val);
        currentInputRef.current = val;
        calcStats(completedWords, val, elapsed);
    }, [isFinished, isActive, words, currentWordIdx, completedWords, testMode, startTimers, finishTest, calcStats, elapsed, buildWords]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Backspace" && currentInput === "" && currentWordIdx > 0) {
            e.preventDefault();
            const prevCompleted = completedWords.slice(0, -1);
            const prevWord = completedWords[completedWords.length - 1];
            if (!prevWord) return;
            if (!prevWord.hasError && prevWord.chars.every(c => c.state === "correct")) return;
            
            setCurrentWordIdx(prev => prev - 1);
            setCompletedWords(prevCompleted);
            const typed = prevWord.typed || prevWord.chars.map(c => c.char).join("");
            setCurrentInput(typed);
            currentInputRef.current = typed;
        }
    }, [currentInput, currentWordIdx, completedWords]);

    const displayWords = useMemo(() => {
        return words.map((w, idx) => {
            if (idx < currentWordIdx) return completedWords[idx] ?? w;
            if (idx === currentWordIdx) {
                const chars = w.word.split("").map((c, ci) => {
                    const typed = currentInput[ci];
                    const state: CharState = typed === undefined ? "pending" : typed === c ? "correct" : "incorrect";
                    return { char: c, state };
                });
                const extraChars = currentInput.slice(w.word.length).split("").map(c => ({
                    char: c, state: "incorrect" as CharState,
                }));
                return { ...w, chars: [...chars, ...extraChars], hasError: currentInput !== w.word.slice(0, currentInput.length) };
            }
            return w;
        });
    }, [words, currentWordIdx, currentInput, completedWords]);

    const createDuel = () => {
        if (!supabase) return;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const sharedWords = generateText(testMode === "words" ? wordConfig : 600, punctRef.current, numsRef.current);
        setSessionCode(code);
        setIsHost(true);
        setDuelStatus("connecting");
        const ch = supabase.channel(`duel_${code}`, { config: { broadcast: { self: false } } });
        ch.on("broadcast", { event: "progress" }, ({ payload }: any) => {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "finish" }, ({ payload }: any) => {
            setOpponentFinished(true);
            setOpponentFinishWpm(payload.wpm);
        });
        ch.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
                setDuelStatus("connected");
            } else {
                setDuelStatus("error");
            }
        });
        channelRef.current = ch;
    };

    const joinDuel = () => {
        if (!supabase || joinCode.length !== 6) return;
        setIsHost(false);
        setDuelStatus("connecting");
        const ch = supabase.channel(`duel_${joinCode}`, { config: { broadcast: { self: false } } });

        ch.on("broadcast", { event: "progress" }, ({ payload }: any) => {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "finish" }, ({ payload }: any) => {
            setOpponentFinished(true);
            setOpponentFinishWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "words" }, ({ payload }: any) => {
            setTestMode(payload.mode);
            if (payload.mode === "time") setTimeConfig(payload.timeConfig);
            else setWordConfig(payload.wordConfig);

            const wordList = payload.text.split(" ").map((w: string) => ({
                word: w,
                chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
                isComplete: false, hasError: false, typed: ""
            }));
            setWords(wordList);
        });
        ch.on("broadcast", { event: "countdown_start" }, () => {
            setCountdown(5);
            resetTest();
        });

        ch.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
                setDuelStatus("connected");
            } else {
                setDuelStatus("error");
            }
        });
        channelRef.current = ch;
    };

    const restartDuel = useCallback(() => {
        if (!channelRef.current) return;

        if (!isHost) {
            channelRef.current.send({ type: "broadcast", event: "request_restart" });
            return;
        }

        const sharedWords = generateText(testMode === "words" ? wordConfig : 600, punctRef.current, numsRef.current);

        channelRef.current.send({
            type: "broadcast",
            event: "words",
            payload: {
                text: sharedWords,
                mode: testMode,
                wordConfig,
                timeConfig
            }
        });
        channelRef.current.send({ type: "broadcast", event: "countdown_start" });

        resetTest();
        const wordList = sharedWords.split(" ").map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false, hasError: false, typed: ""
        }));
        setWords(wordList);
        setCountdown(5);
    }, [isHost, testMode, wordConfig, timeConfig, resetTest]);

    useEffect(() => {
        if (duelStatus === "connected" && channelRef.current && isHost) {
            const ch = channelRef.current;
            ch.on("broadcast", { event: "request_restart" }, () => {
                restartDuel();
            });
        }
    }, [duelStatus, isHost, restartDuel]);

    const leaveDuel = () => {
        channelRef.current?.unsubscribe();
        setDuelMode(false);
        setSessionCode("");
        setJoinCode("");
        setOpponentProgress(0);
        setOpponentFinished(false);
        setOpponentFinishWpm(0);
        setDuelStatus("idle");
        setCountdown(null);
        resetTest();
    };

    useEffect(() => {
        if (duelMode && isActive && channelRef.current) {
            const progress = Math.round((currentWordIdx / words.length) * 100);
            channelRef.current.send({ type: "broadcast", event: "progress", payload: { progress, wpm } });
        }
    }, [currentWordIdx, wpm, duelMode, isActive, words.length]);

    const finalStats = useMemo(() => {
        let correct = completedWords.reduce((a, w) => a + w.chars.filter(c => c.state === "correct").length, 0);
        let incorrect = completedWords.reduce((a, w) => a + w.chars.filter(c => c.state === "incorrect").length, 0);

        if (isFinished && currentInput) {
            const currentWord = words[currentWordIdx]?.word || "";
            currentInput.split("").forEach((c, i) => {
                if (c === currentWord[i]) correct++;
                else incorrect++;
            });
        }

        const total = correct + incorrect;
        const timeTakenMs = endTime && startTime ? (endTime - startTime) : 0;
        const mins = timeTakenMs > 0 ? timeTakenMs / 60000 : (testMode === "time" ? timeConfig / 60 : 1);

        const finalWpm = total > 0 ? Math.round((correct / 5) / Math.max(0.001, mins)) : 0;
        const finalRaw = total > 0 ? Math.round((total / 5) / Math.max(0.001, mins)) : 0;
        const finalAcc = total > 0 ? Math.round((correct / total) * 100) : 100;

        const timeTakenSec = Math.round(timeTakenMs / 1000);
        const mm = Math.floor(timeTakenSec / 60).toString().padStart(2, "0");
        const ss = (timeTakenSec % 60).toString().padStart(2, "0");

        return { correct, incorrect, total, finalWpm, finalRaw, finalAcc, mm, ss };
    }, [completedWords, endTime, startTime, testMode, timeConfig, isFinished, currentInput, words, currentWordIdx]);

    const isPresetTime = TIME_OPTIONS.includes(timeConfig);
    const isPresetWords = WORD_OPTIONS.includes(wordConfig);
    const activeConfig = testMode === "time" ? timeConfig : wordConfig;

    return (
        <div
            className="min-h-screen transition-colors duration-300"
            style={{ background: T.bg, color: T.muted, fontFamily: "'Roboto Mono', 'Fira Code', monospace" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Space+Grotesk:wght@700;900&display=swap');
                @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
                
                .ig-btn {
                  cursor: pointer;
                  transition: transform 0.1s ease, box-shadow 0.1s ease;
                }
                .ig-btn:active {
                  transform: translate(1px, 1px) !important;
                  box-shadow: none !important;
                }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                        href="/tools"
                        style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2,
                            color: "#aaa", fontWeight: 400, fontSize: 11, textDecoration: "none",
                        }}
                    >
                        <ArrowLeft size={11} strokeWidth={2} /> Back
                    </Link>
                    <div style={{ width: 24, height: 24, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: `1px solid ${T.border}`, background: T.surface }}>
                        <Keyboard size={12} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: T.text }}>Typing Speed Tester</span>
                    <button
                        onClick={() => setShowHelp(true)}
                        style={{ padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 2, color: T.muted, cursor: "pointer", display: "flex" }}
                        title="Help Guide"
                    >
                        <HelpCircle size={11} />
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isActive && (
                        <div style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 2,
                            background: T.surface, border: `1px solid ${T.border}`, color: T.accent
                        }}>
                            {testMode === "time" ? `${timeLeft}s` : testMode === "words" ? `${currentWordIdx}/${wordConfig}` : `${timeLeft}s • ${currentWordIdx}/${wordConfig}`}
                        </div>
                    )}
                    <button
                        onClick={() => { setCustomInput(activeConfig.toString()); setSettingsModalOpen(true); }}
                        style={{
                            padding: "4px 8px", background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 2, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11
                        }}
                        title="Settings"
                    >
                        <Settings2 size={12} /> Config
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }} className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>


                {/* ── Mode toolbar ───────────────────────────────────────────── */}
                {!isActive && !isFinished && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                        <div
                            style={{
                                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
                                gap: 6, padding: "6px 10px", borderRadius: 4,
                                background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 11
                            }}
                        >
                            {/* Group 1: Modes & Modifiers */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8, borderRight: `1px solid ${T.borderDim}` }}>
                                {(["time", "words", "both"] as TestMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setTestMode(m)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 4,
                                            padding: "4px 8px", borderRadius: 2,
                                            background: testMode === m ? T.surfaceHi : "transparent",
                                            border: `1px solid ${testMode === m ? T.accent : "transparent"}`,
                                            color: testMode === m ? T.accent : T.muted,
                                            fontSize: 11, fontWeight: testMode === m ? 600 : 400, cursor: "pointer"
                                        }}
                                    >
                                        {m === "time" ? <Timer size={11} /> : m === "words" ? <Keyboard size={11} /> : <div style={{ display: "flex", gap: 2 }}><Timer size={10}/><Keyboard size={10}/></div>}
                                        {m}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8, borderRight: `1px solid ${T.borderDim}` }}>
                                <button
                                    onClick={() => {
                                        const next = !usePunctuation;
                                        punctRef.current = next;
                                        setUsePunctuation(next);
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 3,
                                        padding: "4px 8px", borderRadius: 2,
                                        background: usePunctuation ? T.surfaceHi : "transparent",
                                        border: `1px solid ${usePunctuation ? T.accent : "transparent"}`,
                                        color: usePunctuation ? T.accent : T.muted,
                                        fontSize: 11, fontWeight: usePunctuation ? 600 : 400, cursor: "pointer"
                                    }}
                                    title="Toggle punctuation"
                                >
                                    <span style={{ fontSize: 11 }}>@</span>
                                    <span>punct</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const next = !useNumbers;
                                        numsRef.current = next;
                                        setUseNumbers(next);
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 3,
                                        padding: "4px 8px", borderRadius: 2,
                                        background: useNumbers ? T.surfaceHi : "transparent",
                                        border: `1px solid ${useNumbers ? T.accent : "transparent"}`,
                                        color: useNumbers ? T.accent : T.muted,
                                        fontSize: 11, fontWeight: useNumbers ? 600 : 400, cursor: "pointer"
                                    }}
                                    title="Toggle numbers"
                                >
                                    <span style={{ fontSize: 11 }}>#</span>
                                    <span>nums</span>
                                </button>
                            </div>

                            {/* Group 2: Presets & Duel */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8, borderRight: `1px solid ${T.borderDim}` }}>
                                {testMode !== "both" && (testMode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            if (testMode === "time") setTimeConfig(v);
                                            else setWordConfig(v);
                                        }}
                                        style={{
                                            padding: "4px 8px", borderRadius: 2,
                                            background: activeConfig === v ? T.surfaceHi : "transparent",
                                            border: `1px solid ${activeConfig === v ? T.accent : "transparent"}`,
                                            color: activeConfig === v ? T.accent : T.muted,
                                            fontSize: 11, fontWeight: activeConfig === v ? 600 : 400, cursor: "pointer"
                                        }}
                                    >
                                        {v}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { 
                                        if (testMode === "both") {
                                            setCustomInput("");
                                        } else {
                                            setCustomInput(activeConfig.toString()); 
                                        }
                                        setSettingsModalOpen(true); 
                                    }}
                                    style={{
                                        padding: "4px 6px", borderRadius: 2,
                                        background: "transparent", border: "none",
                                        color: T.muted, cursor: "pointer"
                                    }}
                                    title="Custom Settings"
                                >
                                    <Settings2 size={12} />
                                </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <button
                                    onClick={leaveDuel}
                                    style={{
                                        padding: "4px 8px", borderRadius: 2,
                                        background: !duelMode ? T.surfaceHi : "transparent",
                                        border: `1px solid ${!duelMode ? T.accent : "transparent"}`,
                                        color: !duelMode ? T.accent : T.muted,
                                        fontSize: 11, fontWeight: !duelMode ? 600 : 400, cursor: "pointer"
                                    }}
                                >solo</button>
                                <button
                                    onClick={() => {
                                        if (!duelMode) setDuelMode(true);
                                    }}
                                    style={{
                                        padding: "4px 8px", borderRadius: 2,
                                        background: duelMode ? T.surfaceHi : "transparent",
                                        border: `1px solid ${duelMode ? T.accent : "transparent"}`,
                                        color: duelMode ? T.accent : T.muted,
                                        fontSize: 11, fontWeight: duelMode ? 600 : 400, cursor: "pointer"
                                    }}
                                >duel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Duel panel ─────────────────────────────────────────────── */}
                {duelMode && !isActive && !isFinished && countdown === null && (duelStatus !== "connected" || isHost) && (
                    <div
                        style={{
                            maxWidth: 580, margin: "0 auto 32px",
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 6, color: T.text, overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
                        }}
                    >
                        {/* Status bar */}
                        {duelStatus !== "idle" && (
                            <div
                                style={{
                                    padding: "8px 14px", fontSize: 11, fontWeight: 500,
                                    display: "flex", alignItems: "center", gap: 8,
                                    borderBottom: `1px solid ${T.border}`,
                                    background: duelStatus === "connected" ? "rgba(77,184,212,0.1)"
                                        : duelStatus === "error" ? "rgba(204,68,68,0.1)"
                                            : T.surfaceHi,
                                    color: duelStatus === "connected" ? T.accent
                                        : duelStatus === "error" ? T.error
                                            : T.muted,
                                }}
                            >
                                {duelStatus === "connecting" && (
                                    <><span className="animate-spin inline-block">◌</span> Connecting to lobby…</>
                                )}
                                {duelStatus === "connected" && (
                                    <><Check size={12} /> Room ready! Waiting for opponent…</>
                                )}
                                {duelStatus === "error" && (
                                    <>✕ Connection failed - check the code and try again</>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2">

                            {/* ── Create side ── */}
                            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, borderRight: `1px solid ${T.borderDim}` }}>
                                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>
                                    Race Settings
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 4, background: T.bg, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: T.muted }}>
                                        {testMode === "time" ? <Timer size={12} /> : testMode === "words" ? <Keyboard size={12} /> : <div style={{ display: "flex", gap: 2 }}><Timer size={11}/><Keyboard size={11}/></div>}
                                        <span>{testMode}</span>
                                    </div>
                                    <div style={{ height: 12, width: 1, background: T.border }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                                        {testMode === "time" ? `${timeConfig}s` : testMode === "words" ? `${wordConfig} words` : `${timeConfig}s & ${wordConfig}w`}
                                    </div>
                                </div>

                                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginTop: 4 }}>
                                    Create Room
                                </div>
                                {sessionCode && isHost ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.25em", color: T.accent, textAlign: "center", fontFamily: "monospace", padding: "4px 0" }}>
                                            {sessionCode}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(sessionCode);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                                width: "100%", height: 34, background: T.surfaceHi,
                                                border: `1px solid ${T.border}`, borderRadius: 4,
                                                color: T.text, fontSize: 11, cursor: "pointer", fontWeight: 500,
                                                transition: "all 0.15s"
                                            }}
                                        >
                                            {copiedCode ? <><Check size={13} style={{ color: T.accent }} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                                        </button>
                                        <p style={{ fontSize: 10, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                                            Share this code with your opponent. The race starts when both players begin typing.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={createDuel}
                                        disabled={!supabaseOnline || duelStatus === "connecting"}
                                        style={{
                                            width: "100%", height: 36, borderRadius: 4,
                                            background: T.accent, border: "none",
                                            color: "#111111", fontSize: 11, fontWeight: 600,
                                            cursor: !supabaseOnline || duelStatus === "connecting" ? "not-allowed" : "pointer",
                                            opacity: !supabaseOnline || duelStatus === "connecting" ? 0.5 : 1,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        {duelStatus === "connecting" ? "Connecting…" : supabaseOnline ? "Generate Code" : "Unavailable"}
                                    </button>
                                )}
                            </div>

                            {/* ── Join side ── */}
                            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>
                                    Join Room
                                </div>
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    onKeyDown={e => e.key === "Enter" && joinCode.length === 6 && joinDuel()}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    disabled={duelStatus === "connecting"}
                                    style={{
                                        width: "100%", height: 42, background: T.bg,
                                        border: `1px solid ${T.border}`, borderRadius: 4,
                                        color: T.text, fontSize: 18, fontWeight: 700,
                                        letterSpacing: "0.2em", textAlign: "center",
                                        outline: "none", fontFamily: "monospace"
                                    }}
                                />
                                <button
                                    onClick={joinDuel}
                                    disabled={!supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting"}
                                    style={{
                                        width: "100%", height: 36, borderRadius: 4,
                                        background: T.accent, border: "none",
                                        color: "#111111", fontSize: 11, fontWeight: 600,
                                        cursor: !supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting" ? "not-allowed" : "pointer",
                                        opacity: !supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting" ? 0.5 : 1,
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {duelStatus === "connecting" ? "Joining…"
                                        : supabaseOnline ? "Join Game" : "Unavailable"}
                                </button>
                                {duelStatus === "error" && (
                                    <p style={{ fontSize: 10, color: T.error, fontWeight: 500, margin: 0 }}>
                                        Could not join. Make sure the code is correct.
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>
                )}


                {/* ── Live stats (while typing) ──────────────────────────────── */}
                {isActive && (
                    <div className="flex items-center gap-8 mb-6">
                        <div className="text-5xl font-black tabular-nums leading-none" style={{ color: T.accent }}>
                            {testMode === "words" ? `${elapsed.toFixed(0)}s` : timeLeft}
                        </div>
                        <div className="flex gap-6 text-sm">
                            {[
                                { label: "wpm", val: wpm },
                                { label: "acc", val: `${accuracy}%` },
                                ...(duelMode ? [{ label: "opponent", val: `${opponentWpm} wpm` }] : []),
                            ].map(({ label, val }) => (
                                <div key={label}>
                                    <div className="text-xs font-semibold tracking-wide mb-0.5 capitalize" style={{ color: T.muted }}>{label}</div>
                                    <div className="text-xl font-bold" style={{ color: label === "opponent" ? T.error : T.text }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opponent progress bar */}
                {duelMode && isActive && (
                    <div className="h-1.5 w-full rounded-full mb-4 overflow-hidden" style={{ background: T.surface }}>
                        <div className="h-full transition-all duration-300" style={{ width: `${opponentProgress}%`, background: T.error }} />
                    </div>
                )}

                {/* ── Typing arena ────────────────────────────────────────────── */}
                <div className="relative cursor-text" onClick={() => inputRef.current?.focus()}>

                    {/* Blur overlay */}
                    {!isFocused && !isFinished && countdown === null && (!duelMode || duelStatus !== "connected") && (
                        <div
                            className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl pointer-events-none"
                            style={{ background: `${T.bg}cc`, backdropFilter: "blur(2px)" }}
                        >
                            <div className="flex items-center gap-2" style={{ color: T.accent }}>
                                <MousePointer2 size={16} />
                                <span className="text-sm font-semibold tracking-wide">Tap to start</span>
                            </div>
                        </div>
                    )}

                    {/* Words wrapper */}
                    <div
                        ref={wrapperRef}
                        className="h-[120px] sm:h-[160px] overflow-hidden relative"
                        style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
                    >
                        <div
                            ref={wordsRef}
                            className="flex flex-wrap gap-x-[0.5em] sm:gap-x-[0.6em] gap-y-[0.6em] sm:gap-y-[0.75em] relative transition-transform duration-150"
                            style={{ fontSize: "clamp(1.1rem, 3.8vw, 1.55rem)" }}
                        >
                            {/* Animated caret */}
                            <div
                                className="absolute z-10 w-[3px] rounded-full pointer-events-none"
                                style={{
                                    top: caretPos.top + 2,
                                    left: caretPos.left,
                                    height: "1.3em",
                                    background: T.accent,
                                    boxShadow: `0 0 12px ${T.accentHex}aa`,
                                    transition: "top 80ms ease, left 80ms ease",
                                    animation: !isActive && isFocused ? "caretBlink 1s ease-in-out infinite" : "none",
                                    opacity: isFocused ? 1 : 0,
                                }}
                            />

                            {displayWords.map((wordData, wIdx) => {
                                const isCurrent = wIdx === currentWordIdx;
                                const isPast = wIdx < currentWordIdx;

                                return (
                                    <span
                                        key={wIdx}
                                        className={`word-el inline-flex ${isCurrent ? "relative" : ""}`}
                                        style={{
                                            opacity: isCurrent ? 1 : isPast ? 1 : 0.5,
                                            textDecorationLine: isCurrent && wordData.hasError ? "underline" : "none",
                                            textDecorationColor: T.error,
                                            textUnderlineOffset: "4px",
                                        }}
                                    >
                                        {wordData.chars.map((ch, cIdx) => (
                                            <span
                                                key={cIdx}
                                                className="char-el"
                                                style={{
                                                    color: ch.state === "correct"
                                                        ? T.accent          
                                                        : ch.state === "incorrect"
                                                            ? T.error
                                                            : isCurrent
                                                                ? "#888"
                                                                : T.muted,
                                                    transition: "color 0.08s ease",
                                                }}
                                            >
                                                {ch.char}
                                            </span>
                                        ))}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hidden input */}
                    <textarea
                        ref={inputRef}
                        value={currentInput}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="absolute inset-0 opacity-0 z-30 resize-none overflow-hidden caret-transparent"
                        autoFocus
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-center gap-6 mt-6 text-xs font-semibold tracking-wide" style={{ color: T.muted }}>
                    <button
                        onClick={duelMode && duelStatus === "connected" ? restartDuel : resetTest}
                        className="flex items-center gap-2 transition-colors hover:opacity-100"
                        style={{ color: T.muted }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                    >
                        <RotateCcw size={14} /> restart
                    </button>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: T.muted }}>
                        <kbd style={{ padding: "2px 6px", borderRadius: 3, background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.text, fontFamily: "monospace", fontSize: 10 }}>tab</kbd>
                        <span>to restart</span>
                    </span>
                </div>
            </main>

            {/* ─── SEO RICH TEXT SECTION ─── */}
            {!isActive && !isFinished && (
                <div
                    style={{
                        maxWidth: 960, margin: "60px auto 40px", padding: "32px 24px",
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: 8, color: T.text, textAlign: "left"
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {/* Top Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                            <Chip icon={<Zap size={11} style={{ color: T.accent }} />} label="Free Typing Speed Tester" />
                            <Chip icon={<Keyboard size={11} style={{ color: T.accent }} />} label="Complete Alphabet Practice" />
                            <Chip icon={<Timer size={11} style={{ color: T.accent }} />} label="Custom Time Sprints" />
                        </div>

                        {/* Main Title & Subtitle */}
                        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: "0 0 10px", lineHeight: 1.3 }}>
                                Master Speed Typing Online with Real-Time Accuracy Analytics
                            </h2>
                            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                                Measure and improve your fingers' velocity with our developer-oriented, privacy-preserving speed typing test. Whether you need a quick 1-minute sprint, a 5-minute stamina test, or targeted practice with punctuation and numbers, our tester is 100% free, runs client-side, and delivers instant graphical analytics.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                            {[
                                {
                                    title: "Accurate Speed Typing Online",
                                    desc: "Track your WPM (Words Per Minute), raw keystrokes, and real-time accuracy percentages instantly with zero delay.",
                                    icon: Zap
                                },
                                {
                                    title: "Custom Typing Practice",
                                    desc: "Train muscle memory with standard lowercase mode or enable numbers and punctuation to simulate realistic programming and writing.",
                                    icon: Keyboard
                                },
                                {
                                    title: "Versatile Time Durations",
                                    desc: "Take a standard 15s or 30s sprint, a 60s benchmark test, or configure custom durations up to 10 minutes.",
                                    icon: Clock
                                },
                                {
                                    title: "Lobby Realtime Duels",
                                    desc: "Connect with friend codes to race live! Track each other's progress line in real time with synchronized Supabase channels.",
                                    icon: Users
                                },
                                {
                                    title: "100% Free & Private",
                                    desc: "No subscriptions, sign-ups, or trackers. All keystrokes and speed metrics are calculated locally inside your browser memory.",
                                    icon: Shield
                                },
                                {
                                    title: "Detailed Analytics Chart",
                                    desc: "Inspect an interactive SVG velocity curve with words-per-minute fluctuations and pinpoint markers where keystroke errors occurred.",
                                    icon: BarChart2
                                }
                            ].map((f, i) => (
                                <div key={i} style={{ padding: 14, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <div style={{ color: T.accent, display: "flex" }}>
                                            <f.icon size={14} />
                                        </div>
                                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{f.title}</h4>
                                    </div>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Step Timeline */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.text, margin: "0 0 18px" }}>
                                How to Master Speed Typing Online
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                                {[
                                    { step: "1", title: "Select Mode & Limits", desc: "Choose time, words, or both. Toggle punctuation or numbers if you are testing technical transcription." },
                                    { step: "2", title: "Alphabet & Speed Test", desc: "Start typing the highlighted characters. The smooth caret tracks your inputs with zero lag." },
                                    { step: "3", title: "Review Performance Charts", desc: "Evaluate WPM peaks, raw keystrokes, accuracy margins, and identify keys causing errors to target practice." }
                                ].map((s) => (
                                    <div key={s.step} style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 18 }}>
                                        <div style={{ position: "absolute", top: -9, left: 12, width: 20, height: 20, borderRadius: "50%", background: T.accent, color: "#111", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {s.step}
                                        </div>
                                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>{s.title}</h4>
                                        <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.text, margin: "0 0 4px" }}>
                                Why Practice with a Dedicated Speed Typing Test?
                            </h3>
                            <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", margin: "0 0 16px" }}>
                                Compare structured typing workouts with unstructured casual keyboard usage.
                            </p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                                    <thead>
                                        <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                                            <th style={{ padding: "8px 12px", color: T.text, fontWeight: 600 }}>Metrics Checked</th>
                                            <th style={{ padding: "8px 12px", color: T.accent, fontWeight: 600 }}>Structured Typing Tester</th>
                                            <th style={{ padding: "8px 12px", color: T.textSec, fontWeight: 600 }}>Regular Keyboard Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { feat: "Real-time WPM Calculation", ours: "Calculated dynamically and logged per second on interactive charts", other: "No visibility into current speed and speed fluctuations" },
                                            { feat: "Accuracy Validation", ours: "Checks every typed letter against target word list immediately", other: "Errors go unnoticed and lead to bad muscle memory habits" },
                                            { feat: "Special Character practice", ours: "Toggle options for speed typing test online alphabet, symbols, numbers", other: "Relies heavily on letters, leaving numbers/symbols slower" },
                                            { feat: "Realtime Battle Racing", ours: "Play multiplayer duels against online opponents synchronously", other: "Only solo, unmonitored typing sessions with no comparison" },
                                            { feat: "Zero-Distraction Layout", ours: "Clean, themeable viewport optimized for absolute focus", other: "Surrounded by notifications, ads, and visual clutter" }
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                                                <td style={{ padding: "8px 12px", color: T.text, fontWeight: 500 }}>{row.feat}</td>
                                                <td style={{ padding: "8px 12px", color: T.accent }}>{row.ours}</td>
                                                <td style={{ padding: "8px 12px", color: T.textSec }}>{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FAQ Accordion */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.text, margin: "0 0 16px" }}>
                                Frequently Asked Questions
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <FAQItem 
                                    question="Is this speed typing practice tool completely free?" 
                                    answer="Yes! Our speed typing test application is 100% free with no premium tiers, registration walls, or advertising interruptions." 
                                />
                                <FAQItem 
                                    question="Can I take a 5 minute or 10 minute typing test?" 
                                    answer="Yes. Click the configurations cog next to the tester toolbar to specify any custom duration in seconds (e.g. 300s for 5 minutes or 600s for 10 minutes)." 
                                />
                                <FAQItem 
                                    question="How does the alphabet practice mode work?" 
                                    answer="The practice word bank includes balanced distributions from English dictionaries, exercising all letters of the alphabet to form consistent muscle memory." 
                                />
                                <FAQItem 
                                    question="How is WPM calculated?" 
                                    answer="Words Per Minute takes your total correct characters divided by 5 (the international standard word length), divided by elapsed minutes." 
                                />
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── Results Screen ─────────────────────────────────────────────── */}
            {isFinished && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 100,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 16, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
                        overflowY: "auto"
                    }}
                >
                    <div
                        style={{
                            width: "100%", maxWidth: 880,
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 8, padding: "28px 24px", color: T.text,
                            boxShadow: "0 16px 48px rgba(0,0,0,0.5)"
                        }}
                    >

                        {/* ── Duel Result Banner ── */}
                        {duelMode && opponentFinished && (
                            <div
                                style={{
                                    marginBottom: 24, padding: "14px 18px", borderRadius: 6,
                                    border: `1px solid ${finalStats.finalWpm >= opponentFinishWpm ? T.accent : T.error}`,
                                    background: finalStats.finalWpm >= opponentFinishWpm ? "rgba(77,184,212,0.1)" : "rgba(204,68,68,0.1)",
                                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16
                                }}
                            >
                                <div>
                                    <div
                                        style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, color: finalStats.finalWpm >= opponentFinishWpm ? T.accent : T.error }}
                                    >
                                        {finalStats.finalWpm >= opponentFinishWpm ? "🏆 You Won!" : "😔 You Lost"}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        {finalStats.finalWpm >= opponentFinishWpm
                                            ? `You were faster by ${finalStats.finalWpm - opponentFinishWpm} WPM`
                                            : `Opponent was faster by ${opponentFinishWpm - finalStats.finalWpm} WPM`}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 24, textAlign: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", marginBottom: 2 }}>You</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>{finalStats.finalWpm}</div>
                                        <div style={{ fontSize: 9, fontWeight: 500, color: T.muted, textTransform: "uppercase" }}>wpm</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: T.muted }}>vs</div>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", marginBottom: 2 }}>Opponent</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: T.error }}>{opponentFinishWpm}</div>
                                        <div style={{ fontSize: 9, fontWeight: 500, color: T.muted, textTransform: "uppercase" }}>wpm</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show waiting banner if opponent hasn't finished yet */}
                        {duelMode && !opponentFinished && (
                            <div
                                style={{
                                    marginBottom: 24, padding: "10px 16px", borderRadius: 6,
                                    border: `1px solid ${T.border}`, background: T.bg,
                                    display: "flex", alignItems: "center", gap: 10
                                }}
                            >
                                <span className="animate-spin text-sm" style={{ color: T.accent }}>◌</span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Waiting for opponent to finish… ({opponentProgress}% done)
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 sm:gap-10 mb-6 items-center">
                            <div className="flex flex-row sm:flex-col gap-6 sm:gap-4">
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginBottom: 2 }}>wpm</div>
                                    <div style={{ fontSize: "clamp(3.5rem, 8vw, 5rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", color: T.accent }}>
                                        {finalStats.finalWpm}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginBottom: 2 }}>accuracy</div>
                                    <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1, color: T.text }}>
                                        {finalStats.finalAcc}%
                                    </div>
                                </div>
                            </div>

                            {/* WPM Chart */}
                            <div style={{ height: 190, width: "100%", position: "relative", border: `1px solid ${T.border}`, borderRadius: 6, background: T.bg, padding: 12 }}>
                                {wpmHistory.length > 0 ? (() => {
                                    const data = [{ t: 0, wpm: 0 }, ...wpmHistory];
                                    const maxWpmValue = Math.max(...data.map(h => h.wpm));
                                    const maxWpm = Math.max(maxWpmValue, 40);

                                    const VIEWBOX_W = 1000;
                                    const VIEWBOX_H = 100;

                                    const points = data.map((h, i) => ({
                                        x: (i / Math.max(1, data.length - 1)) * VIEWBOX_W,
                                        y: VIEWBOX_H - (h.wpm / maxWpm) * 85,
                                        t: h.t
                                    }));

                                    const errorPoints = errorHistory.map(eh => {
                                        const totalTime = data[data.length - 1].t;
                                        const x = totalTime > 0 ? (eh.t / totalTime) * VIEWBOX_W : 0;
                                        const idx = data.findIndex(h => h.t >= eh.t);
                                        let y = VIEWBOX_H;
                                        if (idx > 0) {
                                            const h1 = data[idx - 1];
                                            const h2 = data[idx];
                                            const ratio = (eh.t - h1.t) / Math.max(0.001, (h2.t - h1.t));
                                            const interpolatedWpm = h1.wpm + (h2.wpm - h1.wpm) * ratio;
                                            y = VIEWBOX_H - (interpolatedWpm / maxWpm) * 85;
                                        }
                                        return { x, y };
                                    });

                                    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
                                    const fillPoints = `${polylinePoints} ${VIEWBOX_W},${VIEWBOX_H} 0,${VIEWBOX_H}`;

                                    return (
                                        <div className="w-full h-full relative group">
                                            {/* Y-Axis Labels */}
                                            <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] font-bold pointer-events-none opacity-40 py-2 z-10" style={{ color: T.muted }}>
                                                <span>{maxWpm}</span>
                                                <span>{Math.round(maxWpm * 0.5)}</span>
                                                <span>0</span>
                                            </div>

                                            <svg className="w-full h-full pl-6" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={T.accent} stopOpacity="0.25" />
                                                        <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>

                                                {[0, 25, 50, 75, 100].map(y => (
                                                    <line key={y} x1="0" y1={y} x2={VIEWBOX_W} y2={y} stroke={T.borderDim} strokeWidth="1" strokeDasharray="3,3" />
                                                ))}

                                                <polygon points={fillPoints} fill="url(#chartFill)" />

                                                <polyline
                                                    points={polylinePoints}
                                                    fill="none"
                                                    stroke={T.accent}
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />

                                                {errorPoints.map((p, i) => (
                                                    <g key={`err-${i}`} transform={`translate(${p.x},${p.y})`}>
                                                        <line x1="-3" y1="-3" x2="3" y2="3" stroke={T.error} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                                        <line x1="3" y1="-3" x2="-3" y2="3" stroke={T.error} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                                    </g>
                                                ))}

                                                {points.map((p, i) => (
                                                    <circle
                                                        key={i}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={points.length > 40 ? 1.5 : 2.5}
                                                        fill={T.accent}
                                                    />
                                                ))}
                                            </svg>
                                        </div>
                                    );
                                })() : (
                                    <div className="flex items-center justify-center h-full text-xs font-semibold" style={{ color: T.muted }}>
                                        Not enough data for chart
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detail row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            {[
                                { label: "raw wpm", value: finalStats.finalRaw },
                                { label: "characters", value: `${finalStats.correct}/${finalStats.incorrect}` },
                                { label: "time taken", value: `${finalStats.mm}:${finalStats.ss}` },
                                { label: "mode preset", value: `${testMode} (${testMode === "time" ? timeConfig : wordConfig})` },
                                { label: "active style", value: T.name },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: "flex", flexDirection: "column", background: T.bg, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                    <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
                            <button
                                onClick={resetTest}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    height: 38, padding: "0 20px",
                                    background: T.accent, border: "none", borderRadius: 4,
                                    color: "#111111", fontSize: 11, fontWeight: 600,
                                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
                                    transition: "all 0.15s"
                                }}
                            >
                                <RotateCcw size={13} strokeWidth={2.5} /> next test
                            </button>
                            <button
                                onClick={resetTest}
                                style={{
                                    height: 38, width: 38,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 4,
                                    color: T.text, cursor: "pointer", transition: "all 0.15s"
                                }}
                                title="Next Test"
                            >
                                <ArrowRight size={15} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings Modal ────────────────────────────────────────────────── */}
            {settingsModalOpen && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 200,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 16, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)"
                    }}
                    onClick={() => setSettingsModalOpen(false)}
                >
                    <div
                        style={{
                            position: "relative", width: "100%", maxWidth: 580,
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 8, padding: "24px", color: T.text,
                            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                            display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <Settings2 size={16} style={{ color: T.accent }} /> Workspace Settings
                            </h3>
                            <button
                                onClick={() => setSettingsModalOpen(false)}
                                style={{
                                    padding: 6, background: T.surfaceHi, border: `1px solid ${T.border}`,
                                    borderRadius: 4, color: T.text, cursor: "pointer", display: "flex"
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Modal Content container (scrollable) */}
                        <div data-lenis-prevent className="overflow-y-auto pr-1 space-y-6 pb-2 scrollbar-thin">
                            {/* Theme Grid */}
                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                    <Palette size={13} style={{ color: T.accent }} />
                                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>Color Theme Preset</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {THEMES.map((th, i) => (
                                        <button
                                            key={th.name}
                                            onClick={() => setThemeIdx(i)}
                                            style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                                padding: "10px 8px", borderRadius: 4,
                                                background: th.bg, border: `1px solid ${i === themeIdx ? T.accent : T.border}`,
                                                cursor: "pointer", transition: "all 0.15s"
                                            }}
                                        >
                                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: th.text }}>
                                                {th.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <hr style={{ border: "none", borderTop: `1px solid ${T.borderDim}`, margin: "16px 0" }} />

                            {/* Custom Values */}
                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                    <Settings2 size={13} style={{ color: T.accent }} />
                                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>
                                        Custom Limits
                                    </span>
                                </div>
                                <div>
                                    {testMode === "both" ? (
                                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                                            <div className="flex-1 w-full">
                                                <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>
                                                    Time Limit (sec)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={timeConfig}
                                                    onChange={e => {
                                                        const v = parseInt(e.target.value);
                                                        if (!isNaN(v) && v > 0) setTimeConfig(v);
                                                    }}
                                                    style={{
                                                        width: "100%", height: 36, padding: "0 10px",
                                                        background: T.bg, border: `1px solid ${T.border}`,
                                                        borderRadius: 4, color: T.text, fontSize: 12, outline: "none"
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>
                                                    Word Count Limit
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={wordConfig}
                                                    onChange={e => {
                                                        const v = parseInt(e.target.value);
                                                        if (!isNaN(v) && v > 0) setWordConfig(v);
                                                    }}
                                                    style={{
                                                        width: "100%", height: 36, padding: "0 10px",
                                                        background: T.bg, border: `1px solid ${T.border}`,
                                                        borderRadius: 4, color: T.text, fontSize: 12, outline: "none"
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSettingsModalOpen(false)}
                                                style={{
                                                    height: 36, padding: "0 18px",
                                                    background: T.accent, border: "none",
                                                    borderRadius: 4, color: "#111", fontSize: 11, fontWeight: 600,
                                                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em"
                                                }}
                                            >Apply</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                                            <div className="flex-1 w-full">
                                                <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>
                                                    Custom {testMode === "time" ? "Time (sec)" : "Word Count"}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={customInput}
                                                    onChange={e => setCustomInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") {
                                                            const v = parseInt(customInput);
                                                            if (!isNaN(v) && v > 0) {
                                                                if (testMode === "time") setTimeConfig(v);
                                                                else setWordConfig(v);
                                                                setSettingsModalOpen(false);
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        width: "100%", height: 36, padding: "0 10px",
                                                        background: T.bg, border: `1px solid ${T.border}`,
                                                        borderRadius: 4, color: T.text, fontSize: 12, outline: "none"
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const v = parseInt(customInput);
                                                    if (!isNaN(v) && v > 0) {
                                                        if (testMode === "time") setTimeConfig(v);
                                                        else setWordConfig(v);
                                                        setSettingsModalOpen(false);
                                                    }
                                                }}
                                                style={{
                                                    height: 36, padding: "0 18px",
                                                    background: T.accent, border: "none",
                                                    borderRadius: 4, color: "#111", fontSize: 11, fontWeight: 600,
                                                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em"
                                                }}
                                            >Apply</button>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            )}
            
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Typing Tester Technical Details"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 20, color: T.text, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 8px" }}>
                            Minimalist Zero-Lag Core Architecture
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            The Typing Speed Tester evaluates pure keyboarding velocity, character coordination, and accuracy metrics. Calculating statistics locally at high frequency ensures zero-lag rendering.
                        </p>
                    </section>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 12px" }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="How is WPM calculated?"
                                answer="Words Per Minute (WPM) takes your total correct characters, divides by 5 (the standard word length unit), and then divides by elapsed minutes."
                            />
                            <FAQItem 
                                question="What is WPM vs Raw WPM?"
                                answer="WPM strictly checks correctly typed characters, penalizing typos. Raw WPM evaluates total keystrokes without penalties, representing your gross motor speed."
                            />
                            <FAQItem 
                                question="How does the Multiplayer Duel work?"
                                answer="Utilizing Supabase realtime channels, duels allow you to race synchronously. Both players get the exact same text seed and track opponent progress in real time."
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
