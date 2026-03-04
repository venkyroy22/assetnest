"use client";

import React, {
    useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
    Timer, Keyboard, RotateCcw, MousePointer2, ArrowRight,
    Copy, Check, Settings2, X, Palette,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Themes ───────────────────────────────────────────────────────────────────
interface Theme {
    name: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    dim: string;
    accent: string;        // caret + correct chars
    accentHex: string;     // raw hex for SVG / glow
    error: string;
}

const THEMES: Theme[] = [
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
    // ── 10 new themes ────────────────────────────────────────────────────────
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

// ─── Word Bank ────────────────────────────────────────────────────────────────
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
        // Occasionally insert a number
        if (withNums && i > 0 && Math.random() < 0.15) {
            arr.push(NUMBERS_BANK[Math.floor(Math.random() * NUMBERS_BANK.length)]);
        }
        let word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
        // Occasionally wrap with punctuation
        if (withPunct && i > 0 && Math.random() < 0.2) {
            const p = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
            // append or prepend
            word = Math.random() > 0.5 ? word + p : p + word;
        }
        arr.push(word);
    }
    return arr.join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TestMode = "time" | "words";
type CharState = "pending" | "correct" | "incorrect";

interface WordData {
    word: string;
    chars: { char: string; state: CharState }[];
    isComplete: boolean;
    hasError: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TypingTesterPage() {
    // --- Theme ---
    const [themeIdx, setThemeIdx] = useState(0);
    const [themeOpen, setThemeOpen] = useState(false);
    const T = THEMES[themeIdx];

    // --- Config ---
    const [testMode, setTestMode] = useState<TestMode>("time");
    const [timeConfig, setTimeConfig] = useState(30);
    const [wordConfig, setWordConfig] = useState(25);
    const [usePunctuation, setUsePunctuation] = useState(false);
    const [useNumbers, setUseNumbers] = useState(false);

    // --- Game state ---
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

    // --- Stats ---
    const [wpm, setWpm] = useState(0);
    const [rawWpm, setRawWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [wpmHistory, setWpmHistory] = useState<{ t: number; wpm: number }[]>([]);

    // --- UI ---
    const [isFocused, setIsFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

    // --- Custom modal ---
    const [customModalOpen, setCustomModalOpen] = useState(false);
    const [customInput, setCustomInput] = useState("");

    // --- Duel ---
    const [duelMode, setDuelMode] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [sessionCode, setSessionCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [opponentProgress, setOpponentProgress] = useState(0);
    const [opponentWpm, setOpponentWpm] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);
    const [supabaseOnline, setSupabaseOnline] = useState(false);
    // duelStatus: idle | connecting | connected | error
    const [duelStatus, setDuelStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

    // --- Refs ---
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const wordsRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedRef = useRef<NodeJS.Timeout | null>(null);
    const historyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<ReturnType<typeof createClient> extends { channel: (...a: any[]) => infer R } ? R : any>(null);
    const supabase = useMemo(() => createClient(), []);
    // Live refs (avoids stale closures in timer callbacks)
    const wpmRef = useRef(0);
    const wordsDataRef = useRef<WordData[]>([]);
    const currentWordIdxRef = useRef(0);
    // Punctuation/numbers refs — updated synchronously so buildWords always reads the latest value
    const punctRef = useRef(false);
    const numsRef = useRef(false);

    // ─── Sync live refs ───────────────────────────────────────────────────────
    useEffect(() => { wordsDataRef.current = words; }, [words]);
    useEffect(() => { currentWordIdxRef.current = currentWordIdx; }, [currentWordIdx]);

    // ─── Build word list ──────────────────────────────────────────────────────
    const buildWords = useCallback((count: number): WordData[] => {
        // Read from refs (always up-to-date, even mid-render)
        const raw = generateText(count, punctRef.current, numsRef.current).split(" ");
        return raw.map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false,
            hasError: false,
        }));
    }, []); // no state deps needed — refs are always current

    // ─── Reset ────────────────────────────────────────────────────────────────
    const resetTest = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (historyTimerRef.current) clearInterval(historyTimerRef.current);

        const count = testMode === "words" ? wordConfig : 80;
        const newWords = buildWords(count);

        setWords(newWords);
        setCurrentWordIdx(0);
        setCurrentInput("");
        setCompletedWords([]);
        setIsActive(false);
        setIsFinished(false);
        setStartTime(null);
        setEndTime(null);
        setTimeLeft(testMode === "time" ? timeConfig : 0);
        setElapsed(0);
        setWpm(0);
        setRawWpm(0);
        setAccuracy(100);
        setWpmHistory([]);
        wpmRef.current = 0;

        if (wordsRef.current) wordsRef.current.style.transform = "translateY(0)";
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [testMode, timeConfig, wordConfig, buildWords]);

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
        resetTest();
        if (supabase) setSupabaseOnline(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab → restart
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Tab") { e.preventDefault(); resetTest(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [resetTest]);

    // ─── Caret positioning (RAF for smooth, pixel-accurate updates) ──────────
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

            // Auto-scroll: push words up when current word drifts below visible area
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const wordTop = currentWordEl.getBoundingClientRect().top - wrapperRect.top;
            if (wordTop > 80) {
                const cur = parseInt(wordsRef.current.style.transform.replace(/[^-\d]/g, "") || "0");
                wordsRef.current.style.transform = `translateY(${cur - wordTop + 35}px)`;
            }
        });
    }, [currentWordIdx, currentInput]);

    useEffect(() => { updateCaret(); }, [currentInput, currentWordIdx, words, updateCaret]);

    // Cleanup RAF on unmount
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);


    // ─── Stats ────────────────────────────────────────────────────────────────
    const calcStats = useCallback((allCompleted: WordData[], currentTyped: string, elapsedSec: number) => {
        if (elapsedSec < 0.1) return;
        const elapsedMin = elapsedSec / 60;
        let correctChars = 0, totalChars = 0;

        allCompleted.forEach(w => {
            w.chars.forEach(c => {
                totalChars++;
                if (c.state === "correct") correctChars++;
            });
        });

        const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
        currentTyped.split("").forEach((c, i) => {
            totalChars++;
            if (c === currentWord[i]) correctChars++;
        });

        const currentWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMin));
        const currentRaw = Math.max(0, Math.round((totalChars / 5) / elapsedMin));
        const acc = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

        wpmRef.current = currentWpm;
        setWpm(currentWpm);
        setRawWpm(currentRaw);
        setAccuracy(acc);
    }, []);

    // ─── Finish ───────────────────────────────────────────────────────────────
    const finishTest = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (historyTimerRef.current) clearInterval(historyTimerRef.current);
        setEndTime(Date.now());
        setIsActive(false);
        setIsFinished(true);
    }, []);

    // ─── Start timers ─────────────────────────────────────────────────────────
    const startTimers = useCallback(() => {
        const start = Date.now();
        setStartTime(start);

        elapsedRef.current = setInterval(() => {
            setElapsed((Date.now() - start) / 1000);
        }, 200);

        // 1s tick for WPM history
        let tick = 0;
        historyTimerRef.current = setInterval(() => {
            tick++;
            setWpmHistory(prev => [...prev, { t: tick, wpm: wpmRef.current }]);
        }, 1000);

        if (testMode === "time") {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { finishTest(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [testMode, finishTest]);

    // ─── Input handling ───────────────────────────────────────────────────────
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;
        const val = e.target.value;

        if (!isActive && val.length > 0) {
            setIsActive(true);
            startTimers();
        }

        if (val.endsWith(" ")) {
            const typed = val.trimEnd();
            const wordData = words[currentWordIdx];
            if (!wordData) return;

            const updatedChars: { char: string; state: CharState }[] = wordData.word.split("").map((c, i) => ({
                char: c,
                state: (typed[i] === c ? "correct" : "incorrect") as CharState,
            }));

            const hasError = typed !== wordData.word;
            const completedWord: WordData = { ...wordData, chars: updatedChars, isComplete: true, hasError };
            const newCompleted = [...completedWords, completedWord];
            setCompletedWords(newCompleted);

            const nextIdx = currentWordIdx + 1;
            if (testMode === "words" && nextIdx >= words.length) { finishTest(); return; }

            setCurrentWordIdx(nextIdx);
            setCurrentInput("");
            calcStats(newCompleted, "", elapsed);
            return;
        }

        const currentWord = words[currentWordIdx]?.word || "";
        if (val.length > currentWord.length + 8) return;
        setCurrentInput(val);
        calcStats(completedWords, val, elapsed);
    }, [isFinished, isActive, words, currentWordIdx, completedWords, testMode, startTimers, finishTest, calcStats, elapsed]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Backspace" && currentInput === "" && currentWordIdx > 0) {
            e.preventDefault();
            const prevCompleted = completedWords.slice(0, -1);
            const prevWord = completedWords[completedWords.length - 1];
            if (!prevWord) return;
            setCurrentWordIdx(prev => prev - 1);
            setCompletedWords(prevCompleted);
            setCurrentInput(prevWord.word);
        }
    }, [currentInput, currentWordIdx, completedWords]);

    // ─── Display words (live merge of completed + current) ────────────────────
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

    // ─── Duel ─────────────────────────────────────────────────────────────────
    const createDuel = () => {
        if (!supabase) return;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSessionCode(code);
        setIsHost(true);
        setDuelStatus("connecting");
        const ch = supabase.channel(`duel_${code}`, { config: { broadcast: { self: false } } });
        ch.on("broadcast", { event: "progress" }, ({ payload }: any) => {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "joined" }, () => {
            setDuelStatus("connected");
        });
        ch.subscribe((status: string) => {
            if (status === "SUBSCRIBED") setDuelStatus("connected");
            else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setDuelStatus("error");
        });
        channelRef.current = ch;
    };

    const joinDuel = () => {
        if (!supabase || joinCode.length !== 6) return;
        setDuelStatus("connecting");
        setIsHost(false);
        const ch = supabase.channel(`duel_${joinCode}`, { config: { broadcast: { self: false } } });
        ch.on("broadcast", { event: "progress" }, ({ payload }: any) => {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
        });
        ch.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
                setSessionCode(joinCode);
                setDuelStatus("connected");
                // Announce to host that a guest joined
                ch.send({ type: "broadcast", event: "joined", payload: { joined: true } });
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                setDuelStatus("error");
            }
        });
        channelRef.current = ch;
    };

    const leaveDuel = () => {
        channelRef.current?.unsubscribe();
        setDuelMode(false);
        setSessionCode("");
        setJoinCode("");
        setOpponentProgress(0);
        setDuelStatus("idle");
        resetTest();
    };


    useEffect(() => {
        if (duelMode && isActive && channelRef.current) {
            const progress = Math.round((currentWordIdx / words.length) * 100);
            channelRef.current.send({ type: "broadcast", event: "progress", payload: { progress, wpm } });
        }
    }, [currentWordIdx, wpm, duelMode, isActive, words.length]);

    // ─── Final stats ──────────────────────────────────────────────────────────
    const finalStats = useMemo(() => {
        const correct = completedWords.reduce((a, w) => a + w.chars.filter(c => c.state === "correct").length, 0);
        const incorrect = completedWords.reduce((a, w) => a + w.chars.filter(c => c.state === "incorrect").length, 0);
        const total = correct + incorrect;
        const timeTaken = endTime && startTime ? Math.round((endTime - startTime) / 1000) : 0;
        const mins = timeTaken > 0 ? timeTaken / 60 : (testMode === "time" ? timeConfig / 60 : 1);
        const finalWpm = total > 0 ? Math.round((correct / 5) / mins) : 0;
        const finalRaw = total > 0 ? Math.round((total / 5) / mins) : 0;
        const finalAcc = total > 0 ? Math.round((correct / total) * 100) : 100;
        const mm = Math.floor(timeTaken / 60).toString().padStart(2, "0");
        const ss = (timeTaken % 60).toString().padStart(2, "0");
        return { correct, incorrect, total, finalWpm, finalRaw, finalAcc, mm, ss };
    }, [completedWords, endTime, startTime, testMode, timeConfig]);

    const isPresetTime = TIME_OPTIONS.includes(timeConfig);
    const isPresetWords = WORD_OPTIONS.includes(wordConfig);
    const activeConfig = testMode === "time" ? timeConfig : wordConfig;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen transition-colors duration-300"
            style={{ background: T.bg, color: T.muted, fontFamily: "'Roboto Mono', 'Fira Code', monospace" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
                @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="max-w-5xl mx-auto px-8 pt-10 flex items-center justify-between">
                <button onClick={resetTest} className="flex items-center gap-3 group">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-black text-xs font-black transition-all"
                        style={{ background: T.accent, boxShadow: `0 0 20px ${T.accentHex}44` }}
                    >AN</div>
                    <span className="text-lg font-bold tracking-tight uppercase transition-colors" style={{ color: T.text }}>
                        Type Test
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    {isActive && (
                        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                            {testMode === "time" ? `${timeLeft}s` : `${currentWordIdx}/${wordConfig}`}
                        </div>
                    )}
                    {/* Theme picker */}
                    <div className="relative">
                        <button
                            onClick={() => setThemeOpen(o => !o)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: T.muted, background: themeOpen ? T.surface : "transparent" }}
                            title="Change theme"
                        >
                            <Palette size={16} />
                        </button>
                        {themeOpen && (
                            <div
                                className="absolute right-0 top-10 z-50 rounded-xl p-4 shadow-2xl border"
                                style={{ background: T.surface, borderColor: T.border, minWidth: 300 }}
                            >
                                <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.muted }}>Theme</div>
                                <div className="grid grid-cols-5 gap-3">
                                    {THEMES.map((th, i) => (
                                        <button
                                            key={th.name}
                                            onClick={() => { setThemeIdx(i); setThemeOpen(false); }}
                                            className="flex flex-col items-center gap-1.5 group"
                                            title={th.name}
                                        >
                                            {/* Color swatch */}
                                            <div
                                                className="w-10 h-10 rounded-xl border-2 transition-all duration-200"
                                                style={{
                                                    background: th.bg,
                                                    borderColor: i === themeIdx ? th.accent : th.border,
                                                    boxShadow: i === themeIdx ? `0 0 12px ${th.accentHex}80` : "none",
                                                    transform: i === themeIdx ? "scale(1.12)" : "scale(1)",
                                                }}
                                            >
                                                <div className="w-full h-full rounded-lg flex items-end p-1">
                                                    <div className="w-full h-2 rounded-sm" style={{ background: th.accent }} />
                                                </div>
                                            </div>
                                            <span className="text-[8px] leading-tight font-bold" style={{ color: i === themeIdx ? T.accent : T.muted }}>
                                                {th.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        )}
                    </div>
                </div>
            </header>

            <main className={`max-w-5xl mx-auto px-8 mt-12 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>

                {/* ── Mode toolbar ───────────────────────────────────────────── */}
                {!isActive && !isFinished && (
                    <div className="flex justify-center mb-10">
                        <div
                            className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider"
                            style={{ background: T.surface }}
                        >
                            {/* Mode toggles */}
                            <div className="flex items-center gap-1 pr-3" style={{ borderRight: `1px solid ${T.border}` }}>
                                {(["time", "words"] as TestMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setTestMode(m); setTimeout(resetTest, 0); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                            color: testMode === m ? T.accent : T.muted,
                                            background: testMode === m ? `${T.accentHex}18` : "transparent",
                                        }}
                                    >
                                        {m === "time" ? <Timer size={12} /> : <Keyboard size={12} />}
                                        {m}
                                    </button>
                                ))}
                            </div>

                            <div className="h-4 w-px mx-1" style={{ background: T.border }} />

                            {/* Punctuation / Numbers toggles */}
                            <div className="flex items-center gap-1 px-2">
                                <button
                                    onClick={() => {
                                        const next = !usePunctuation;
                                        punctRef.current = next;   // update ref synchronously FIRST
                                        setUsePunctuation(next);   // then update state for UI
                                        resetTest();               // resetTest reads from ref — always correct
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-mono"
                                    style={{
                                        color: usePunctuation ? T.accent : T.muted,
                                        background: usePunctuation ? `${T.accentHex}18` : "transparent",
                                    }}
                                    title="Toggle punctuation"
                                >
                                    <span className="text-sm">@</span>
                                    <span>punctuation</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const next = !useNumbers;
                                        numsRef.current = next;    // update ref synchronously FIRST
                                        setUseNumbers(next);       // then update state for UI
                                        resetTest();               // resetTest reads from ref — always correct
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-mono"
                                    style={{
                                        color: useNumbers ? T.accent : T.muted,
                                        background: useNumbers ? `${T.accentHex}18` : "transparent",
                                    }}
                                    title="Toggle numbers"
                                >
                                    <span className="text-sm">#</span>
                                    <span>numbers</span>
                                </button>
                            </div>

                            <div className="h-4 w-px mx-1" style={{ background: T.border }} />

                            {/* Config presets */}
                            <div className="flex items-center gap-1 px-3">
                                {(testMode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            if (testMode === "time") setTimeConfig(v);
                                            else setWordConfig(v);
                                            setTimeout(resetTest, 0);
                                        }}
                                        className="px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                            color: activeConfig === v ? T.accent : T.muted,
                                            background: activeConfig === v ? `${T.accentHex}18` : "transparent",
                                        }}
                                    >
                                        {v}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setCustomInput(activeConfig.toString()); setCustomModalOpen(true); }}
                                    className="px-2 py-1.5 rounded-lg transition-all"
                                    style={{
                                        color: (testMode === "time" ? !isPresetTime : !isPresetWords) ? T.accent : T.muted,
                                    }}
                                    title="Custom"
                                >
                                    <Settings2 size={12} />
                                </button>
                            </div>

                            <div className="h-4 w-px mx-1" style={{ background: T.border }} />

                            {/* Duel */}
                            <div className="flex items-center gap-1 pl-3">
                                <button
                                    onClick={leaveDuel}
                                    className="px-3 py-1.5 rounded-lg transition-all"
                                    style={{
                                        color: !duelMode ? T.accent : T.muted,
                                        background: !duelMode ? `${T.accentHex}18` : "transparent",
                                    }}
                                >solo</button>
                                <button
                                    onClick={() => {
                                        if (!duelMode) setDuelMode(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg transition-all"
                                    style={{
                                        color: duelMode ? T.accent : T.muted,
                                        background: duelMode ? `${T.accentHex}18` : "transparent",
                                    }}
                                >duel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Duel panel ─────────────────────────────────────────────── */}
                {duelMode && !isActive && !isFinished && (
                    <div
                        className="max-w-xl mx-auto mb-8 rounded-2xl border overflow-hidden"
                        style={{ background: T.surface, borderColor: T.border }}
                    >
                        {/* Status bar */}
                        {duelStatus !== "idle" && (
                            <div
                                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b"
                                style={{
                                    borderColor: T.border,
                                    background: duelStatus === "connected" ? `${T.accentHex}18`
                                        : duelStatus === "error" ? `${T.error}18`
                                            : T.dim,
                                    color: duelStatus === "connected" ? T.accent
                                        : duelStatus === "error" ? T.error
                                            : T.muted,
                                }}
                            >
                                {duelStatus === "connecting" && (
                                    <><span className="animate-spin inline-block">◌</span> Connecting to lobby…</>
                                )}
                                {duelStatus === "connected" && (
                                    <><Check size={12} /> Connected — start typing to begin the race!</>
                                )}
                                {duelStatus === "error" && (
                                    <>✕ Connection failed — check the code and try again</>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2" style={{ borderColor: T.border }}>

                            {/* ── Create side ── */}
                            <div className="p-5 space-y-4 border-r" style={{ borderColor: T.border }}>
                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.muted }}>
                                    Create Room
                                </div>
                                {sessionCode && isHost ? (
                                    <>
                                        <div className="text-3xl font-black tracking-[0.3em]" style={{ color: T.text }}>
                                            {sessionCode}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(sessionCode);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg w-full justify-center transition-all"
                                            style={{ background: `${T.accentHex}18`, color: T.accent }}
                                        >
                                            {copiedCode ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                                        </button>
                                        <p className="text-[10px] leading-relaxed" style={{ color: T.muted }}>
                                            Share this code with your opponent. The race starts when both players begin typing.
                                        </p>
                                    </>
                                ) : (
                                    <button
                                        onClick={createDuel}
                                        disabled={!supabaseOnline || duelStatus === "connecting"}
                                        className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-all disabled:opacity-50"
                                        style={{ background: T.accent }}
                                    >
                                        {duelStatus === "connecting" ? "Connecting…" : supabaseOnline ? "Generate Code" : "Unavailable"}
                                    </button>
                                )}
                            </div>

                            {/* ── Join side ── */}
                            <div className="p-5 space-y-4">
                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.muted }}>
                                    Join Room
                                </div>
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    onKeyDown={e => e.key === "Enter" && joinCode.length === 6 && joinDuel()}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    disabled={duelStatus === "connecting" || duelStatus === "connected"}
                                    className="w-full rounded-xl px-4 py-3 text-xl font-black tracking-[0.25em] text-center focus:outline-none border-2 transition-colors disabled:opacity-40"
                                    style={{
                                        background: T.bg,
                                        borderColor: duelStatus === "connected" && !isHost ? T.accent
                                            : duelStatus === "error" ? T.error
                                                : joinCode.length === 6 ? T.accent
                                                    : T.border,
                                        color: T.text,
                                    }}
                                />
                                <button
                                    onClick={joinDuel}
                                    disabled={!supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting" || duelStatus === "connected"}
                                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-all disabled:opacity-50"
                                    style={{ background: T.accent }}
                                >
                                    {duelStatus === "connecting" ? "Joining…"
                                        : duelStatus === "connected" && !isHost ? "✓ Joined!"
                                            : supabaseOnline ? "Join Game" : "Unavailable"}
                                </button>
                                {duelStatus === "error" && (
                                    <p className="text-[10px]" style={{ color: T.error }}>
                                        Could not join. Make sure the code is correct and the host is online.
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
                            {testMode === "time" ? timeLeft : `${elapsed.toFixed(0)}s`}
                        </div>
                        <div className="flex gap-6 text-sm">
                            {[
                                { label: "wpm", val: wpm },
                                { label: "acc", val: `${accuracy}%` },
                                ...(duelMode ? [{ label: "opponent", val: `${opponentWpm} wpm` }] : []),
                            ].map(({ label, val }) => (
                                <div key={label}>
                                    <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: T.muted }}>{label}</div>
                                    <div className="text-xl font-bold" style={{ color: label === "opponent" ? T.error : T.text }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opponent bar */}
                {duelMode && isActive && (
                    <div className="h-1 w-full rounded-full mb-4 overflow-hidden" style={{ background: T.surface }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${opponentProgress}%`, background: T.error }} />
                    </div>
                )}

                {/* ── Typing arena ────────────────────────────────────────────── */}
                <div className="relative cursor-text" onClick={() => inputRef.current?.focus()}>

                    {/* Blur overlay */}
                    {!isFocused && !isFinished && (
                        <div
                            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
                            style={{ background: `${T.bg}cc`, backdropFilter: "blur(2px)" }}
                        >
                            <div className="flex items-center gap-2" style={{ color: T.accent }}>
                                <MousePointer2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-[0.3em]">Click to focus</span>
                            </div>
                        </div>
                    )}

                    {/* Words wrapper */}
                    <div
                        ref={wrapperRef}
                        className="h-[160px] overflow-hidden relative"
                        style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
                    >
                        <div
                            ref={wordsRef}
                            className="flex flex-wrap gap-x-[0.6em] gap-y-[0.75em] relative transition-transform duration-150"
                            style={{ fontSize: "1.6rem" }}
                        >
                            {/* Animated caret */}
                            <div
                                className="absolute z-10 w-[2px] rounded-full pointer-events-none"
                                style={{
                                    top: caretPos.top,
                                    left: caretPos.left,
                                    height: "1.2em",
                                    background: T.accent,
                                    boxShadow: `0 0 8px ${T.accentHex}99`,
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
                                        className="word-el relative inline-flex"
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
                                                        ? T.accent          // ← typed correctly = accent color
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
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        autoFocus
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-center gap-8 mt-8 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.muted }}>
                    <button
                        onClick={resetTest}
                        className="flex items-center gap-2 transition-colors hover:opacity-100"
                        style={{ color: T.muted }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                    >
                        <RotateCcw size={14} /> restart
                    </button>
                    <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: T.border, background: T.surface }}>tab</span>
                        to restart
                    </span>
                </div>
            </main>

            {/* ── Results Screen ─────────────────────────────────────────────── */}
            {isFinished && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-8"
                    style={{ background: T.bg }}
                >
                    <div className="w-full max-w-5xl">
                        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 mb-12 items-center">
                            <div className="space-y-6">
                                <div>
                                    <div className="text-base font-black lowercase mb-1" style={{ color: T.muted }}>wpm</div>
                                    <div className="text-9xl font-black leading-none tracking-tight" style={{ color: T.accent }}>
                                        {finalStats.finalWpm}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-base font-black lowercase mb-1" style={{ color: T.muted }}>acc</div>
                                    <div className="text-6xl font-black leading-none" style={{ color: T.text }}>
                                        {finalStats.finalAcc}%
                                    </div>
                                </div>
                            </div>

                            {/* WPM Chart */}
                            <div className="h-[220px] w-full relative">
                                {wpmHistory.length > 1 ? (() => {
                                    const maxWpm = Math.max(...wpmHistory.map(h => h.wpm), 1);
                                    const w = wpmHistory.length * 10;
                                    const pts = wpmHistory.map((h, i) => `${i * 10},${100 - (h.wpm / maxWpm) * 95}`).join(" ");
                                    return (
                                        <svg className="w-full h-full" viewBox={`0 0 ${w} 100`} preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={T.accentHex} stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor={T.accentHex} stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {[25, 50, 75].map(y => (
                                                <line key={y} x1="0" y1={y} x2={w} y2={y} stroke={T.surface} strokeWidth="0.5" />
                                            ))}
                                            <polygon
                                                points={`${pts} ${(wpmHistory.length - 1) * 10},100 0,100`}
                                                fill="url(#cg)"
                                            />
                                            <polyline
                                                points={pts}
                                                fill="none"
                                                stroke={T.accentHex}
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{ filter: `drop-shadow(0 0 6px ${T.accentHex}88)` }}
                                            />
                                            {wpmHistory.map((h, i) => (
                                                <circle key={i} cx={i * 10} cy={100 - (h.wpm / maxWpm) * 95} r="1.5" fill={T.accentHex} />
                                            ))}
                                        </svg>
                                    );
                                })() : (
                                    <div className="flex items-center justify-center h-full text-xs" style={{ color: T.muted }}>
                                        Not enough data for chart
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detail row */}
                        <div className="flex flex-wrap gap-10 pt-8 border-t" style={{ borderColor: T.surface }}>
                            {[
                                { label: "raw", value: finalStats.finalRaw },
                                { label: "characters", value: `${finalStats.correct}/${finalStats.incorrect}/0/0` },
                                { label: "time", value: `${finalStats.mm}:${finalStats.ss}` },
                                { label: "mode", value: `${testMode} ${testMode === "time" ? timeConfig : wordConfig}` },
                                { label: "theme", value: T.name },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col gap-1 min-w-[80px]">
                                    <div className="text-[10px] font-black lowercase tracking-wider" style={{ color: T.muted }}>{label}</div>
                                    <div className="text-2xl font-bold tabular-nums" style={{ color: T.text }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 mt-10">
                            <button
                                onClick={resetTest}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all group"
                                style={{ background: T.surface, color: T.text }}
                            >
                                <RotateCcw size={16} /> next test
                            </button>
                            <button
                                onClick={resetTest}
                                className="p-3 rounded-xl transition-all"
                                style={{ background: T.surface, color: T.muted }}
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Custom Modal ────────────────────────────────────────────────── */}
            {customModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-2xl p-8 w-full max-w-sm shadow-2xl border" style={{ background: T.surface, borderColor: T.border }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-lg" style={{ color: T.accent }}>
                                custom {testMode === "time" ? "time" : "word"} count
                            </h3>
                            <button onClick={() => setCustomModalOpen(false)} style={{ color: T.muted }}>
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            autoFocus
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
                                        setCustomModalOpen(false);
                                        setTimeout(resetTest, 0);
                                    }
                                }
                                if (e.key === "Escape") setCustomModalOpen(false);
                            }}
                            className="w-full rounded-xl px-5 py-4 text-2xl font-bold text-center outline-none mb-4 border-2 transition-colors"
                            style={{ background: T.bg, borderColor: T.border, color: T.text }}
                        />
                        <button
                            onClick={() => {
                                const v = parseInt(customInput);
                                if (!isNaN(v) && v > 0) {
                                    if (testMode === "time") setTimeConfig(v);
                                    else setWordConfig(v);
                                    setCustomModalOpen(false);
                                    setTimeout(resetTest, 0);
                                }
                            }}
                            className="w-full font-black py-3 rounded-xl text-sm uppercase tracking-wider text-black"
                            style={{ background: T.accent }}
                        >ok</button>
                    </div>
                </div>
            )}
        </div>
    );
}
