"use client";

import React, {
    useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
    Timer, Keyboard, RotateCcw, MousePointer2, ArrowRight,
    Copy, Check, Settings2, X, Palette,
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
        accent: "#a78bfa", accentHex: "#a78bfa", error: "#ffffff",
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
type TestMode = "time" | "words" | "both";
type CharState = "pending" | "correct" | "incorrect";

interface WordData {
    word: string;
    chars: { char: string; state: CharState }[];
    isComplete: boolean;
    hasError: boolean;
    typed: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TypingTesterPage() {
    // --- Theme ---
    const [themeIdx, setThemeIdx] = useState(() => Math.max(0, THEMES.findIndex(t => t.name === "arctic")));
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
    const [errorHistory, setErrorHistory] = useState<{ t: number; count: number }[]>([]);

    // --- UI ---
    const [isFocused, setIsFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

    // --- Settings Modal ---
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [customInput, setCustomInput] = useState("");

    // --- Duel ---
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
    // duelStatus: idle | connecting | connected | error
    const [duelStatus, setDuelStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    // countdown: null = no countdown, 5..1 = ticking, 0 = GO!
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showHelp, setShowHelp] = useState(false);

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
    const startTimeRef = useRef<number | null>(null);
    const completedWordsRef = useRef<WordData[]>([]);
    const currentInputRef = useRef("");
    const isFinishedRef = useRef(false);

    // ─── Sync live refs ───────────────────────────────────────────────────────
    useEffect(() => { wordsDataRef.current = words; }, [words]);
    useEffect(() => { currentWordIdxRef.current = currentWordIdx; }, [currentWordIdx]);
    useEffect(() => { completedWordsRef.current = completedWords; }, [completedWords]);
    useEffect(() => { currentInputRef.current = currentInput; }, [currentInput]);
    useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);

    // ─── Build word list ──────────────────────────────────────────────────────
    const buildWords = useCallback((count: number): WordData[] => {
        // Read from refs (always up-to-date, even mid-render)
        const raw = generateText(count, punctRef.current, numsRef.current).split(" ");
        return raw.map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false,
            hasError: false,
            typed: "",
        }));
    }, []); // no state deps needed — refs are always current

    // ─── Reset ────────────────────────────────────────────────────────────────
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

        // If in duel mode, inform the opponent that we've restarted
        setTimeout(() => inputRef.current?.focus(), 50);

        return newWords; // Return the generated words for potential reuse
    }, [testMode, timeConfig, wordConfig, buildWords]);

    // ─── Sync config changes ──────────────────────────────────────────────────
    useEffect(() => {
        if (duelMode && duelStatus === "connected") return; // Don't reset if syncing with host
        resetTest();
    }, [testMode, timeConfig, wordConfig, usePunctuation, useNumbers, resetTest, duelMode, duelStatus]);

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        window.scrollTo(0, 0);
        setTimeout(() => setVisible(true), 100);
        if (supabase) setSupabaseOnline(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab → restart
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                e.preventDefault();
                if (duelMode && duelStatus === "connected") {
                    restartDuel();
                } else {
                    resetTest();
                }
            }
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

    useEffect(() => { updateCaret(); }, [currentInput, currentWordIdx, words, updateCaret]);

    // Cleanup RAF on unmount
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);


    // ─── Stats ────────────────────────────────────────────────────────────────
    const calcStats = useCallback((allCompleted: WordData[], currentTyped: string, elapsedSec: number) => {
        if (elapsedSec < 0.1) {
            setWpm(0);
            setRawWpm(0);
            setAccuracy(100);
            return;
        }
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

        // Use precise floating point calculation then round at the very end
        const currentWpm = totalChars > 0 ? Math.max(0, Math.round((correctChars / 5) / elapsedMin)) : 0;
        const currentRaw = totalChars > 0 ? Math.max(0, Math.round((totalChars / 5) / elapsedMin)) : 0;
        const acc = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

        wpmRef.current = currentWpm;
        setWpm(currentWpm);
        setRawWpm(currentRaw);
        setAccuracy(acc);
    }, []);

    // ─── Finish ───────────────────────────────────────────────────────────────
    const finishTest = useCallback(() => {
        const now = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (historyTimerRef.current) clearInterval(historyTimerRef.current);

        setEndTime(now);
        setIsActive(false);
        setIsFinished(true);

        // Calculate absolute final stats using REFS to ensure we have the very latest data
        const start = startTimeRef.current || now;
        const finalElapsedSec = (now - start) / 1000;

        let correctChars = 0, totalChars = 0;
        completedWordsRef.current.forEach(w => {
            w.chars.forEach(c => {
                totalChars++;
                if (c.state === "correct") correctChars++;
            });
        });
        const currentInput = currentInputRef.current;
        const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
        currentInput.split("").forEach((c, i) => {
            totalChars++;
            if (c === currentWord[i]) correctChars++;
        });

        const elapsedMin = Math.max(0.001, finalElapsedSec / 60);
        const finalWpm = Math.round((correctChars / 5) / elapsedMin);
        wpmRef.current = finalWpm;

        if (channelRef.current) {
            channelRef.current.send({
                type: "broadcast", event: "finish",
                payload: { wpm: finalWpm },
            });
        }
    }, []);

    // ─── Start timers ─────────────────────────────────────────────────────────
    const startTimers = useCallback(() => {
        const start = Date.now();
        setStartTime(start);
        startTimeRef.current = start;

        elapsedRef.current = setInterval(() => {
            const sec = (Date.now() - start) / 1000;
            setElapsed(sec);
            calcStats(completedWordsRef.current, currentInputRef.current, sec);
        }, 200);

        // 0.5s tick for WPM & Error history
        let tick = 0;
        let lastErrorCount = 0;
        historyTimerRef.current = setInterval(() => {
            tick += 0.5;

            // Calculate current total errors for history
            let currentTotalErrors = completedWordsRef.current.reduce((acc, w) => acc + w.chars.filter(c => c.state === "incorrect").length, 0);
            const currentWord = wordsDataRef.current[currentWordIdxRef.current]?.word || "";
            const currentTyped = currentInputRef.current;
            currentTyped.split("").forEach((c, i) => {
                if (c !== currentWord[i]) currentTotalErrors++;
            });

            setWpmHistory(prev => [...prev, { t: tick, wpm: wpmRef.current }]);

            // Only record if errors increased
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
    }, [testMode, finishTest]);

    // ─── Countdown ticker ─────────────────────────────────────────────────────
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            // When countdown hits 0, auto-focus input for the race
            inputRef.current?.focus();
            // Small delay so user sees "GO!" then it fades
            const t = setTimeout(() => setCountdown(null), 700);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // ─── Input handling ───────────────────────────────────────────────────────
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isFinished) return;
        if (countdown !== null) return;  // Block typing during countdown
        const val = e.target.value;

        if (!isActive && val.length > 0) {
            setIsActive(true);
            startTimers();
        }

        // Allow Space or Enter to complete a word
        if (val.endsWith(" ") || val.endsWith("\n")) {
            const typed = val.slice(0, -1);
            const wordData = words[currentWordIdx];
            if (!wordData) return;

            const updatedChars: { char: string; state: CharState }[] = wordData.word.split("").map((c, i) => ({
                char: c,
                state: (typed[i] === c ? "correct" : "incorrect") as CharState,
            }));

            // Handle extra characters
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

            // Reposition scroll/words if near end in Time Mode
            if (testMode === "time" && nextIdx >= words.length - 10) {
                const moreWords = buildWords(50);
                setWords(prev => [...prev, ...moreWords]);
            }

            // Check for test completion
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

        // AUTO-FINISH on last word in "words" or "both" mode when length matches
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

            // Sync refs and call finish
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
            // Prevent going back to a completely correct word to prevent WPM farming and mimic professional testers
            if (!prevWord.hasError && prevWord.chars.every(c => c.state === "correct")) return;
            
            setCurrentWordIdx(prev => prev - 1);
            setCompletedWords(prevCompleted);
            const typed = prevWord.typed || prevWord.chars.map(c => c.char).join("");
            setCurrentInput(typed);
            currentInputRef.current = typed;
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
        // Generate enough words to prevent running out during time trial
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
        ch.on("broadcast", { event: "restart_duel" }, () => {
            resetTest();
        });
        ch.on("broadcast", { event: "joined" }, () => {
            setDuelStatus("connected");
            // Wait a small beat to ensure the joiner's listeners are fully active
            setTimeout(() => {
                // Send the shared word list and CONFIG to the joiner
                ch.send({
                    type: "broadcast",
                    event: "words",
                    payload: {
                        text: sharedWords,
                        mode: testMode,
                        wordConfig: wordConfig,
                        timeConfig: timeConfig
                    }
                });
                // Start countdown for both players simultaneously
                ch.send({ type: "broadcast", event: "countdown_start" });
            }, 500);
            setCountdown(5);
        });
        ch.subscribe((status: string) => {
            if (status === "SUBSCRIBED") setDuelStatus("connected");
            else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setDuelStatus("error");
        });
        channelRef.current = ch;
        // Load the shared words into the host's state
        const wordList = sharedWords.split(" ").map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false, hasError: false, typed: "",
        }));
        setWords(wordList);
        setCurrentWordIdx(0);
        setCurrentInput("");
        setCompletedWords([]);
        setIsActive(false);
        setIsFinished(false);
        setOpponentFinished(false);
        setOpponentFinishWpm(0);
    };

    const joinDuel = () => {
        if (!supabase || joinCode.length !== 6) return;
        setDuelStatus("connecting");
        setIsHost(false);
        setOpponentFinished(false);
        setOpponentFinishWpm(0);
        const ch = supabase.channel(`duel_${joinCode}`, { config: { broadcast: { self: false } } });
        ch.on("broadcast", { event: "progress" }, ({ payload }: any) => {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "finish" }, ({ payload }: any) => {
            setOpponentFinished(true);
            setOpponentFinishWpm(payload.wpm);
        });
        ch.on("broadcast", { event: "restart_duel" }, () => {
            resetTest();
        });
        // Receive the shared word list and config from the host
        ch.on("broadcast", { event: "words" }, ({ payload }: any) => {
            // Apply host's race configuration
            if (payload.mode) setTestMode(payload.mode);
            if (payload.wordConfig) setWordConfig(payload.wordConfig);
            if (payload.timeConfig) setTimeConfig(payload.timeConfig);
            if (payload.mode === "time" && payload.timeConfig) setTimeLeft(payload.timeConfig);

            const wordList = (payload.text as string).split(" ").map((w: string) => ({
                word: w,
                chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
                isComplete: false, hasError: false, typed: "",
            }));
            setWords(wordList);
            setCurrentWordIdx(0);
            setCurrentInput("");
            setCompletedWords([]);
            setIsActive(false);
            setIsFinished(false);
            setElapsed(0);
        });
        // Host signals countdown start
        ch.on("broadcast", { event: "countdown_start" }, () => {
            setCountdown(5);
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

    const restartDuel = useCallback(() => {
        if (!channelRef.current) return;

        if (!isHost) {
            // Guest requests restart from host
            channelRef.current.send({ type: "broadcast", event: "request_restart" });
            return;
        }

        // Host handles the restart logic
        const sharedWords = generateText(testMode === "words" ? wordConfig : 600, punctRef.current, numsRef.current);

        // Broadcast new words and countdown to everyone
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

        // Local Host reset
        resetTest();
        const wordList = sharedWords.split(" ").map(w => ({
            word: w,
            chars: w.split("").map(c => ({ char: c, state: "pending" as CharState })),
            isComplete: false, hasError: false, typed: ""
        }));
        setWords(wordList);
        setCountdown(5);
    }, [isHost, testMode, wordConfig, timeConfig, resetTest]);

    // Update createDuel listeners to handle restart requests
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

    // ─── Final stats ──────────────────────────────────────────────────────────
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

        // Ensure this logic matches finishTest exactly
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
            <header className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 flex items-center justify-between">
                <button onClick={resetTest} className="flex items-center gap-2 sm:gap-3 group">
                    <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-black text-xs font-black transition-all"
                        style={{ background: T.accent, boxShadow: `0 0 20px ${T.accentHex}44` }}
                    >AN</div>
                    <span className="text-base sm:text-lg font-bold tracking-tight transition-colors" style={{ color: T.text }}>
                        Typing Speed Tester
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    {isActive && (
                        <div className="text-sm font-semibold tracking-wide" style={{ color: T.muted }}>
                            {testMode === "time" ? `${timeLeft}s` : testMode === "words" ? `${currentWordIdx}/${wordConfig}` : `${timeLeft}s • ${currentWordIdx}/${wordConfig}`}
                        </div>
                    )}
                    {/* Settings Button */}
                    <button
                        onClick={() => { setCustomInput(activeConfig.toString()); setSettingsModalOpen(true); }}
                        className="p-2 sm:p-2.5 rounded-lg transition-colors"
                        style={{ color: T.muted, background: settingsModalOpen ? T.surface : "transparent" }}
                        title="Settings"
                    >
                        <Settings2 size={18} />
                    </button>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 sm:p-2.5 rounded-lg transition-colors"
                        style={{ color: T.muted }}
                        title="What is this?"
                    >
                        <Info size={18} />
                    </button>
                </div>
            </header>

            <main className={`max-w-5xl mx-auto px-4 sm:px-8 mt-6 sm:mt-12 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>

                {/* ── Mode toolbar ───────────────────────────────────────────── */}
                {!isActive && !isFinished && (
                    <div className="flex justify-center mb-6 sm:mb-10">
                        <div
                            className="flex flex-wrap items-center justify-center gap-1 rounded-xl px-2 sm:px-3 py-2 text-sm font-semibold tracking-wide"
                            style={{ background: T.surface }}
                        >
                            {/* Mode toggles */}
                            <div className="flex items-center gap-1 pr-3" style={{ borderRight: `1px solid ${T.border}` }}>
                                {(["time", "words", "both"] as TestMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setTestMode(m)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                            color: testMode === m ? T.accent : T.muted,
                                            background: testMode === m ? `${T.accentHex}18` : "transparent",
                                        }}
                                    >
                                        {m === "time" ? <Timer size={12} /> : m === "words" ? <Keyboard size={12} /> : <div className="flex gap-0.5"><Timer size={12}/><Keyboard size={12}/></div>}
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
                                        punctRef.current = next;
                                        setUsePunctuation(next);
                                    }}
                                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-all font-mono"
                                    style={{
                                        color: usePunctuation ? T.accent : T.muted,
                                        background: usePunctuation ? `${T.accentHex}18` : "transparent",
                                    }}
                                    title="Toggle punctuation"
                                >
                                    <span className="text-sm">@</span>
                                    <span className="hidden sm:inline">punctuation</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const next = !useNumbers;
                                        numsRef.current = next;
                                        setUseNumbers(next);
                                    }}
                                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg transition-all font-mono"
                                    style={{
                                        color: useNumbers ? T.accent : T.muted,
                                        background: useNumbers ? `${T.accentHex}18` : "transparent",
                                    }}
                                    title="Toggle numbers"
                                >
                                    <span className="text-sm">#</span>
                                    <span className="hidden sm:inline">numbers</span>
                                </button>
                            </div>

                            <div className="h-4 w-px mx-1" style={{ background: T.border }} />

                            {/* Config presets */}
                            <div className="flex items-center gap-1 px-3">
                                {testMode !== "both" && (testMode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            if (testMode === "time") setTimeConfig(v);
                                            else setWordConfig(v);
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
                                    onClick={() => { 
                                        if (testMode === "both") {
                                            setCustomInput(""); // We don't populate for 'both' since it requires two values, let custom modal handle it separately or just open it
                                        } else {
                                            setCustomInput(activeConfig.toString()); 
                                        }
                                        setSettingsModalOpen(true); 
                                    }}
                                    className="px-2 py-1.5 rounded-lg transition-all"
                                    style={{
                                        color: testMode === "both" ? T.accent : (testMode === "time" ? !isPresetTime : !isPresetWords) ? T.accent : T.muted,
                                    }}
                                    title="Custom Settings"
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

                {/* ── Countdown overlay ──────────────────────────────────────── */}
                {countdown !== null && (
                    <div
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
                        style={{ background: `${T.bg}ee`, backdropFilter: "blur(6px)" }}
                    >
                        <div
                            key={countdown}
                            className="font-black leading-none tabular-nums"
                            style={{
                                color: countdown === 0 ? T.accent : T.text,
                                fontSize: "clamp(6rem, 25vw, 14rem)",
                                textShadow: countdown === 0
                                    ? `0 0 60px ${T.accentHex}99`
                                    : `0 0 40px ${T.accentHex}44`,
                                animation: "countPop 0.35s cubic-bezier(0.22,1,0.36,1)",
                            }}
                        >
                            {countdown === 0 ? "GO!" : countdown}
                        </div>
                        <div
                            className="mt-6 text-sm font-bold tracking-widest"
                            style={{ color: T.muted }}
                        >
                            {countdown === 0 ? "Type now!" : "Get ready…"}
                        </div>
                        <style>{`
                            @keyframes countPop {
                                from { opacity: 0; transform: scale(0.6); }
                                to   { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                    </div>
                )}

                {/* ── Duel panel ─────────────────────────────────────────────── */}
                {duelMode && !isActive && !isFinished && countdown === null && (duelStatus !== "connected" || isHost) && (
                    <div
                        className="max-w-xl mx-auto mb-8 rounded-2xl border overflow-hidden"
                        style={{ background: T.surface, borderColor: T.border }}
                    >
                        {/* Status bar */}
                        {duelStatus !== "idle" && (
                            <div
                                className="px-5 py-2.5 text-sm font-semibold tracking-wide flex items-center gap-2 border-b"
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
                                    <><Check size={12} /> Room ready! Waiting for opponent…</>
                                )}
                                {duelStatus === "error" && (
                                    <>✕ Connection failed — check the code and try again</>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderColor: T.border }}>

                            {/* ── Create side ── */}
                            <div className="p-4 sm:p-5 space-y-4 border-b sm:border-b-0 sm:border-r" style={{ borderColor: T.border }}>
                                <div className="text-xs font-bold tracking-wide" style={{ color: T.muted }}>
                                    Race Settings
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.accent }}>
                                        {testMode === "time" ? <Timer size={12} /> : testMode === "words" ? <Keyboard size={12} /> : <div className="flex gap-0.5"><Timer size={12}/><Keyboard size={12}/></div>}
                                        {testMode}
                                    </div>
                                    <div className="h-3 w-px bg-zinc-800" />
                                    <div className="text-xs font-bold text-white">
                                        {testMode === "time" ? `${timeConfig}s` : testMode === "words" ? `${wordConfig} words` : `${timeConfig}s & ${wordConfig}w`}
                                    </div>
                                </div>
                                <div className="text-xs font-bold tracking-wide mt-4" style={{ color: T.muted }}>
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
                                        className="w-full py-4 rounded-full text-sm font-bold tracking-wide text-black transition-all disabled:opacity-50"
                                        style={{ background: T.accent }}
                                    >
                                        {duelStatus === "connecting" ? "Connecting…" : supabaseOnline ? "Generate Code" : "Unavailable"}
                                    </button>
                                )}
                            </div>

                            {/* ── Join side ── */}
                            <div className="p-4 sm:p-5 space-y-4">
                                <div className="text-xs font-bold tracking-wide" style={{ color: T.muted }}>
                                    Join Room
                                </div>
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    onKeyDown={e => e.key === "Enter" && joinCode.length === 6 && joinDuel()}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    disabled={duelStatus === "connecting"}
                                    className="w-full rounded-xl px-4 py-3 text-xl font-black tracking-[0.25em] text-center focus:outline-none border-2 transition-colors disabled:opacity-40"
                                    style={{
                                        background: T.bg,
                                        borderColor: duelStatus === "error" ? T.error
                                            : joinCode.length === 6 ? T.accent
                                                : T.border,
                                        color: T.text,
                                    }}
                                />
                                <button
                                    onClick={joinDuel}
                                    disabled={!supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting"}
                                    className="w-full py-4 rounded-full text-sm font-bold tracking-wide text-black transition-all disabled:opacity-50"
                                    style={{ background: T.accent }}
                                >
                                    {duelStatus === "connecting" ? "Joining…"
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

                {/* Opponent bar */}
                {duelMode && isActive && (
                    <div className="h-1 w-full rounded-full mb-4 overflow-hidden" style={{ background: T.surface }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${opponentProgress}%`, background: T.error }} />
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
                            style={{ fontSize: "clamp(1rem, 4vw, 1.6rem)" }}
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
                        className="absolute inset-0 opacity-0 z-30 resize-none overflow-hidden caret-transparent"
                        autoFocus
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-center gap-8 mt-8 text-xs font-semibold tracking-wide" style={{ color: T.muted }}>
                    <button
                        onClick={duelMode && duelStatus === "connected" ? restartDuel : resetTest}
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
                    className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 sm:px-8 overflow-y-auto py-6 sm:py-0"
                    style={{ background: T.bg }}
                >
                    <div className="w-full max-w-5xl">


                        {/* ── Duel Result Banner ── */}
                        {duelMode && opponentFinished && (
                            <div
                                className="mb-6 sm:mb-10 rounded-2xl p-4 sm:p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                style={{
                                    background: finalStats.finalWpm >= opponentFinishWpm ? `${T.accentHex}18` : `${T.error}18`,
                                    borderColor: finalStats.finalWpm >= opponentFinishWpm ? T.accent : T.error,
                                }}
                            >
                                <div>
                                    <div
                                        className="text-3xl font-black mb-1"
                                        style={{ color: finalStats.finalWpm >= opponentFinishWpm ? T.accent : T.error }}
                                    >
                                        {finalStats.finalWpm >= opponentFinishWpm ? "🏆 You Won!" : "😔 You Lost"}
                                    </div>
                                    <div className="text-sm tracking-wide font-semibold" style={{ color: T.muted }}>
                                        {finalStats.finalWpm >= opponentFinishWpm
                                            ? `You were faster by ${finalStats.finalWpm - opponentFinishWpm} WPM`
                                            : `Opponent was faster by ${opponentFinishWpm - finalStats.finalWpm} WPM`}
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 text-center">
                                    <div>
                                        <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: T.muted }}>You</div>
                                        <div className="text-4xl font-black" style={{ color: T.accent }}>{finalStats.finalWpm}</div>
                                        <div className="text-[10px]" style={{ color: T.muted }}>wpm</div>
                                    </div>
                                    <div className="text-2xl font-black" style={{ color: T.muted }}>vs</div>
                                    <div>
                                        <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: T.muted }}>Opponent</div>
                                        <div className="text-4xl font-black" style={{ color: T.error }}>{opponentFinishWpm}</div>
                                        <div className="text-[10px]" style={{ color: T.muted }}>wpm</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show waiting banner if opponent hasn't finished yet */}
                        {duelMode && !opponentFinished && (
                            <div
                                className="mb-10 rounded-2xl px-6 py-4 border flex items-center gap-3"
                                style={{ background: T.surface, borderColor: T.border }}
                            >
                                <span className="animate-spin text-lg">◌</span>
                                <span className="text-sm font-bold" style={{ color: T.muted }}>
                                    Waiting for opponent to finish… ({opponentProgress}% done)
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 sm:gap-16 mb-8 sm:mb-12 items-center">
                            <div className="flex flex-row sm:flex-col gap-6 sm:gap-6">
                                <div>
                                    <div className="text-sm font-black lowercase mb-1" style={{ color: T.muted }}>wpm</div>
                                    <div className="text-6xl sm:text-9xl font-black leading-none tracking-tight" style={{ color: T.accent }}>
                                        {finalStats.finalWpm}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-black lowercase mb-1" style={{ color: T.muted }}>acc</div>
                                    <div className="text-4xl sm:text-6xl font-black leading-none" style={{ color: T.text }}>
                                        {finalStats.finalAcc}%
                                    </div>
                                </div>
                            </div>

                            {/* WPM Chart */}
                            <div className="h-[220px] w-full relative">
                                {wpmHistory.length > 0 ? (() => {
                                    // Always start from 0
                                    const data = [{ t: 0, wpm: 0 }, ...wpmHistory];
                                    const maxWpmValue = Math.max(...data.map(h => h.wpm));
                                    const maxWpm = Math.max(maxWpmValue, 40); // Min scale of 40 for stability

                                    // SVG coordinate system: y increases downwards, so we flip it
                                    // x is based on data index or time. Let's use index for uniform spacing
                                    // but we'll cap the width so it doesn't stretch too much for 2 points
                                    // Always use a fixed width coordinate system to keep stroke widths consistent
                                    const VIEWBOX_W = 1000;
                                    const VIEWBOX_H = 100;

                                    const points = data.map((h, i) => ({
                                        x: (i / Math.max(1, data.length - 1)) * VIEWBOX_W,
                                        y: VIEWBOX_H - (h.wpm / maxWpm) * 85,
                                        t: h.t
                                    }));

                                    const errorPoints = errorHistory.map(eh => {
                                        // Find corresponding X by interpolating time safely
                                        const totalTime = data[data.length - 1].t;
                                        const x = totalTime > 0 ? (eh.t / totalTime) * VIEWBOX_W : 0;
                                        // Find Y by interpolating WPM at that time
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
                                            <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs font-bold pointer-events-none opacity-40 py-2 z-10" style={{ color: T.muted }}>
                                                <span>{maxWpm}</span>
                                                <span>{Math.round(maxWpm * 0.75)}</span>
                                                <span>{Math.round(maxWpm * 0.5)}</span>
                                                <span>{Math.round(maxWpm * 0.25)}</span>
                                                <span>0</span>
                                            </div>

                                            <svg className="w-full h-full pl-8" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={T.accentHex} stopOpacity="0.15" />
                                                        <stop offset="100%" stopColor={T.accentHex} stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Horizontal Grid Lines */}
                                                {[0, 25, 50, 75, 100].map(y => (
                                                    <line key={y} x1="0" y1={y} x2={VIEWBOX_W} y2={y} stroke={T.surface} strokeWidth="1" strokeOpacity="0.2" />
                                                ))}

                                                {/* Vertical Grid Lines (limit count for clarity) */}
                                                {points.length <= 20 && points.map((p, i) => (
                                                    <line key={i} x1={p.x} y1="0" x2={p.x} y2={VIEWBOX_H} stroke={T.surface} strokeWidth="1" strokeOpacity="0.1" />
                                                ))}

                                                {/* Gradient Fill */}
                                                <polygon
                                                    points={fillPoints}
                                                    fill="url(#chartFill)"
                                                />

                                                {/* Polyline Path */}
                                                <polyline
                                                    points={polylinePoints}
                                                    fill="none"
                                                    stroke={T.accent}
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />

                                                {/* Error Plots (X marks) */}
                                                {errorPoints.map((p, i) => (
                                                    <g key={`err-${i}`} transform={`translate(${p.x},${p.y})`}>
                                                        <line x1="-3" y1="-3" x2="3" y2="3" stroke={T.error} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                                        <line x1="3" y1="-3" x2="-3" y2="3" stroke={T.error} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                                    </g>
                                                ))}

                                                {/* Dot Plots (using zero-length lines with round caps and non-scaling-stroke for perfect circles) */}
                                                {points.map((p, i) => (
                                                    <line
                                                        key={i}
                                                        x1={p.x}
                                                        y1={p.y}
                                                        x2={p.x}
                                                        y2={p.y}
                                                        stroke={T.accentHex}
                                                        strokeWidth={points.length > 50 ? "4" : "6"}
                                                        strokeLinecap="round"
                                                        vectorEffect="non-scaling-stroke"
                                                        style={{ filter: `drop-shadow(0 0 4px ${T.accentHex}44)` }}
                                                    />
                                                ))}
                                            </svg>
                                        </div>
                                    );
                                })() : (
                                    <div className="flex items-center justify-center h-full text-sm font-semibold tracking-wide opacity-30" style={{ color: T.muted }}>
                                        Not enough data for chart
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detail row */}
                        <div className="flex flex-wrap gap-6 sm:gap-10 pt-6 sm:pt-8 border-t" style={{ borderColor: T.surface }}>
                            {[
                                { label: "raw", value: finalStats.finalRaw },
                                { label: "characters", value: `${finalStats.correct}/${finalStats.incorrect}/0/0` },
                                { label: "time", value: `${finalStats.mm}:${finalStats.ss}` },
                                { label: "mode", value: `${testMode} ${testMode === "time" ? timeConfig : testMode === "words" ? wordConfig : `${timeConfig}s/${wordConfig}w`}` },
                                { label: "theme", value: T.name },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col gap-1 min-w-[80px]">
                                    <div className="text-xs font-semibold tracking-wide capitalize" style={{ color: T.muted }}>{label}</div>
                                    <div className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: T.text }}>{value}</div>
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

            {/* ── Settings Modal ────────────────────────────────────────────────── */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden" style={{ background: T.surface, borderColor: T.border }}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="font-bold text-xl lg:text-3xl tracking-wide" style={{ color: T.accent }}>
                                Settings
                            </h3>
                            <button onClick={() => setSettingsModalOpen(false)} style={{ color: T.muted }} className="p-2 hover:opacity-70 transition-opacity">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content container (scrollable) */}
                        <div data-lenis-prevent className="overflow-y-auto pr-2 sm:pr-4 space-y-12 pb-4 scrollbar-thin overflow-x-hidden">

                            {/* Theme Grid */}
                            <section>
                                <div className="flex items-center gap-2 mb-5">
                                    <Palette size={16} style={{ color: T.accent }} />
                                    <h4 className="text-sm font-semibold tracking-wide" style={{ color: T.text }}>Appearance / Theme</h4>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
                                    {THEMES.map((th, i) => (
                                        <button
                                            key={th.name}
                                            onClick={() => setThemeIdx(i)}
                                            className="flex flex-col items-center gap-2.5 group"
                                            title={th.name}
                                        >
                                            <div
                                                className="w-full aspect-video rounded-xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col"
                                                style={{
                                                    background: th.bg,
                                                    borderColor: i === themeIdx ? th.accent : th.border,
                                                    boxShadow: i === themeIdx ? `0 0 20px ${th.accentHex}40` : "none",
                                                    transform: i === themeIdx ? "scale(1.05)" : "scale(1)",
                                                }}
                                            >
                                                {/* Mini UI Mockup */}
                                                <div className="flex-1 w-full p-2 flex flex-col gap-1.5 justify-center">
                                                    <div className="flex items-center gap-1">
                                                        <div className="h-1.5 w-8 rounded-full" style={{ background: th.muted }} />
                                                    </div>
                                                    <div className="flex items-center gap-1 leading-none">
                                                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: th.accent }}>a</span>
                                                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: th.error }}>x</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1 sm:h-1.5" style={{ background: th.accent }} />
                                            </div>
                                            <span className="text-[11px] sm:text-xs leading-tight font-semibold tracking-wide" style={{ color: i === themeIdx ? T.accent : T.muted }}>
                                                {th.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <hr style={{ borderColor: T.border }} className="opacity-50" />

                            {/* Custom Values */}
                            <section>
                                <div className="flex items-center gap-2 mb-5">
                                    <Settings2 size={16} style={{ color: T.accent }} />
                                    <h4 className="text-sm font-semibold tracking-wide" style={{ color: T.text }}>
                                        Custom Behavior
                                    </h4>
                                </div>
                                <div className="flex flex-col gap-6">
                                    {/* Separate inputs for Time and Words if we are in 'both' mode, otherwise unified */}
                                    {testMode === "both" ? (
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold tracking-wide mb-2" style={{ color: T.muted }}>
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
                                                    className="w-full rounded-xl px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold max-w-[200px] outline-none border-2 transition-colors"
                                                    style={{ background: T.bg, borderColor: T.border, color: T.text }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold tracking-wide mb-2" style={{ color: T.muted }}>
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
                                                    className="w-full rounded-xl px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold max-w-[200px] outline-none border-2 transition-colors"
                                                    style={{ background: T.bg, borderColor: T.border, color: T.text }}
                                                />
                                            </div>
                                            <div className="flex items-end mt-4 sm:mt-0">
                                                <button
                                                    onClick={() => setSettingsModalOpen(false)}
                                                    className="w-full sm:w-auto px-8 py-4 font-bold rounded-full text-sm tracking-wide text-black transition-transform active:scale-95"
                                                    style={{ background: T.accent }}
                                                >Apply settings</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold tracking-wide mb-2" style={{ color: T.muted }}>
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
                                                        if (e.key === "Escape") setSettingsModalOpen(false);
                                                    }}
                                                    className="w-full rounded-xl px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold max-w-[200px] outline-none border-2 transition-colors"
                                                    style={{ background: T.bg, borderColor: T.border, color: T.text }}
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => {
                                                        const v = parseInt(customInput);
                                                        if (!isNaN(v) && v > 0) {
                                                            if (testMode === "time") setTimeConfig(v);
                                                            else setWordConfig(v);
                                                            setSettingsModalOpen(false);
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto px-8 py-4 font-bold rounded-full text-sm tracking-wide text-black transition-transform active:scale-95"
                                                    style={{ background: T.accent }}
                                                >Apply settings</button>
                                            </div>
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
                title="Master Your Speed"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Master Your Typing Speed</h3>
                        <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                            <p>
                                Elevate your typing proficiency with our professional-grade Typing Tester. Whether you're a developer, writer, or student, speed and accuracy are the pillars of productivity. This tool provides a minimalist, focus-oriented environment inspired by modern typing benchmarks.
                            </p>
                            <p>
                                <strong>Track every keystroke:</strong> We calculate your WPM (Words Per Minute), Raw WPM, and Accuracy in real-time. Use the detailed history charts to visualize where you stutter and how your speed fluctuates during the test duration.
                            </p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Keyboard size={18} className="text-zinc-500" />
                                Custom Practice Modes
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>Time Mode:</strong> Push your stamina with 15, 30, 60, or 120-second sprints.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>Word Mode:</strong> Focus on precision by finishing a fixed set of 10, 25, 50, or 100 words.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1 shrink-0"><Check size={14} className="text-zinc-500" /></div>
                                    <span><strong>Punctuation & Numbers:</strong> Toggle advanced characters to simulate real coding and writing scenarios.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <Palette size={18} className="text-zinc-500" />
                                Aesthetic Personalization
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                Productivity is better when it looks good. Choose from over 20+ carefully curated themes—from "Midnight" and "Forest" to high-contrast "Noir" and retro "Cream"—to match your desk setup.
                            </p>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Pro Tip</p>
                                <p className="text-xs text-zinc-400 mt-1 italic">Hit "Tab" to quickly restart a test at any time, just like the pros.</p>
                            </div>
                        </section>
                    </div>
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 pt-12 border-t border-zinc-900/50">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Typing Intelligence (FAQ)</h3>
                        <Accordion>
                            <AccordionItem title="How is WPM calculated?">
                                Words Per Minute (WPM) is calculated by taking the total number of correctly typed characters, dividing by 5 (the average word length), and then dividing by the time elapsed in minutes.
                            </AccordionItem>
                            <AccordionItem title="What is the difference between WPM and Raw WPM?">
                                WPM only counts correctly typed words, penalizing you for errors. Raw WPM counts all characters typed, including mistakes, giving you a sense of your pure motor speed.
                            </AccordionItem>
                            <AccordionItem title="Can I use this for coding practice?">
                                Yes! By enabling the Numbers and Punctuation toggles in the settings, you can simulate the complex character sequences common in programming languages.
                            </AccordionItem>
                            <AccordionItem title="Does my progress get saved?">
                                Currently, your high scores and theme preferences are stored locally in your browser. We are working on a cloud-sync feature for registered users soon!
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}

