"use client";

import React, {
    useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import Link from "next/link";
import {
    Timer, Keyboard, RotateCcw, MousePointer2, ArrowRight,
    Copy, Check, Settings2, X, Palette, ArrowLeft, HelpCircle
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
        name: "neobrutalist",
        bg: "#F4ECD8", surface: "#ffffff", border: "#000000",
        text: "#000000", muted: "#4b5563", dim: "#f3f4f6",
        accent: "#f59e0b", accentHex: "#f59e0b", error: "#ef4444",
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

export default function TypingTesterPage() {
    const [themeIdx, setThemeIdx] = useState(() => Math.max(0, THEMES.findIndex(t => t.name === "neobrutalist")));
    const T = THEMES[themeIdx];

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
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            if (historyTimerRef.current) clearInterval(historyTimerRef.current);
            channelRef.current?.unsubscribe();
        };
    }, []);

    const updateCaret = useCallback(() => {
        if (!isFocused || isFinished || countdown !== null) return;
        const container = wordsRef.current;
        if (!container) return;

        const activeWordEl = container.querySelector(".word-el.relative") as HTMLElement;
        if (!activeWordEl) return;

        const charEls = activeWordEl.querySelectorAll(".char-el");
        const typedLen = currentInput.length;
        let targetEl = charEls[typedLen] as HTMLElement;

        if (!targetEl && charEls.length > 0) {
            targetEl = charEls[charEls.length - 1] as HTMLElement;
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setCaretPos({
                    top: targetEl.offsetTop,
                    left: targetEl.offsetLeft + rect.width,
                });
                return;
            }
        }

        if (targetEl) {
            setCaretPos({
                top: targetEl.offsetTop,
                left: targetEl.offsetLeft,
            });
        } else {
            setCaretPos({
                top: activeWordEl.offsetTop,
                left: activeWordEl.offsetLeft,
            });
        }
    }, [currentInput, currentWordIdx, isFocused, isFinished, countdown]);

    useEffect(() => {
        updateCaret();
    }, [currentInput, currentWordIdx, isFocused, isFinished, countdown, updateCaret]);

    useEffect(() => {
        const handleResize = () => updateCaret();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [updateCaret]);

    const scrollWordsIfNeeded = useCallback(() => {
        const container = wordsRef.current;
        const wrapper = wrapperRef.current;
        if (!container || !wrapper) return;

        const activeWordEl = container.querySelector(".word-el.relative") as HTMLElement;
        if (!activeWordEl) return;

        const wordTop = activeWordEl.offsetTop;
        const wrapperHeight = wrapper.clientHeight;
        const lineOffset = 36;

        if (wordTop > wrapperHeight / 2) {
            const shift = -(wordTop - lineOffset);
            container.style.transform = `translateY(${shift}px)`;
        } else {
            container.style.transform = "translateY(0)";
        }
    }, [currentWordIdx]);

    useEffect(() => {
        scrollWordsIfNeeded();
    }, [currentWordIdx, scrollWordsIfNeeded]);

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
            style={{ background: T.bg, color: T.text, fontFamily: "'Roboto Mono', 'Fira Code', monospace" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Space+Grotesk:wght@700;900&family=DM+Sans:wght@500;750&display=swap');
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
            <header className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/tools"
                        className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                    >
                        <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                    </Link>
                    <button onClick={resetTest} className="flex items-center gap-2 group ml-2">
                        <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-xs font-black border-2 border-black shadow-[2px_2px_0_#000] bg-orange-500"
                        >T</div>
                        <span className="text-base sm:text-lg font-black tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Typing Tester
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {isActive && (
                        <div className="text-sm font-black tracking-wider uppercase bg-white border-2 border-black px-3 py-1 rounded-xl shadow-[1.5px_1.5px_0_#000]">
                            {testMode === "time" ? `${timeLeft}s` : testMode === "words" ? `${currentWordIdx}/${wordConfig}` : `${timeLeft}s • ${currentWordIdx}/${wordConfig}`}
                        </div>
                    )}
                    <button
                        onClick={() => { setCustomInput(activeConfig.toString()); setSettingsModalOpen(true); }}
                        className="p-2 bg-white border-2 border-black rounded-xl text-black hover:bg-zinc-50 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Settings"
                    >
                        <Settings2 size={15} />
                    </button>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-1.5 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                        title="Help"
                    >
                        <HelpCircle size={14} />
                    </button>
                </div>
            </header>

            <main className={`max-w-5xl mx-auto px-4 sm:px-8 mt-6 sm:mt-12 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>

                {/* ── Mode toolbar ───────────────────────────────────────────── */}
                {!isActive && !isFinished && (
                    <div className="flex justify-center mb-6 sm:mb-10 px-2">
                        <div
                            className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1 rounded-2xl p-2.5 text-xs font-bold tracking-wide w-full sm:w-auto shadow-[4px_4px_0_#000] border-2 border-black"
                            style={{ background: "#ffffff", color: "#000000" }}
                        >
                            {/* Group 1: Modes & Modifiers */}
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                <div className="flex items-center gap-1 pr-1.5 sm:pr-3 border-b sm:border-b-0 sm:border-r-2 border-black pb-1 sm:pb-0">
                                    {(["time", "words", "both"] as TestMode[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setTestMode(m)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent transition-all hover:bg-zinc-150"
                                            style={{
                                                fontWeight: testMode === m ? 900 : 500,
                                                color: testMode === m ? "#000000" : "#6b7280",
                                                background: testMode === m ? "#f3f4f6" : "transparent",
                                                border: testMode === m ? "1.5px solid #000000" : "1.5px solid transparent"
                                            }}
                                        >
                                            {m === "time" ? <Timer size={12} /> : m === "words" ? <Keyboard size={12} /> : <div className="flex gap-0.5"><Timer size={11}/><Keyboard size={11}/></div>}
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1 px-1.5">
                                    <button
                                        onClick={() => {
                                            const next = !usePunctuation;
                                            punctRef.current = next;
                                            setUsePunctuation(next);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-mono"
                                        style={{
                                            fontWeight: usePunctuation ? 900 : 550,
                                            color: usePunctuation ? "#000000" : "#6b7280",
                                            background: usePunctuation ? "#f3f4f6" : "transparent",
                                            border: usePunctuation ? "1.5px solid #000000" : "1.5px solid transparent"
                                        }}
                                        title="Toggle punctuation"
                                    >
                                        <span className="text-sm">@</span>
                                        <span>punct</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const next = !useNumbers;
                                            numsRef.current = next;
                                            setUseNumbers(next);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-mono"
                                        style={{
                                            fontWeight: useNumbers ? 900 : 550,
                                            color: useNumbers ? "#000000" : "#6b7280",
                                            background: useNumbers ? "#f3f4f6" : "transparent",
                                            border: useNumbers ? "1.5px solid #000000" : "1.5px solid transparent"
                                        }}
                                        title="Toggle numbers"
                                    >
                                        <span className="text-sm">#</span>
                                        <span>nums</span>
                                    </button>
                                </div>
                            </div>

                            <div className="hidden sm:block h-5 w-[2px] bg-black mx-1" />

                            {/* Group 2: Presets & Duel */}
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                <div className="flex items-center gap-1 px-1.5 sm:px-3 border-r-2 border-black">
                                    {testMode !== "both" && (testMode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => {
                                                if (testMode === "time") setTimeConfig(v);
                                                else setWordConfig(v);
                                            }}
                                            className="px-2.5 py-1 rounded-lg transition-all"
                                            style={{
                                                fontWeight: activeConfig === v ? 900 : 500,
                                                color: activeConfig === v ? "#000000" : "#6b7280",
                                                background: activeConfig === v ? "#f3f4f6" : "transparent",
                                                border: activeConfig === v ? "1.5px solid #000000" : "1.5px solid transparent"
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
                                        className="px-2 py-1 rounded-lg transition-all text-zinc-500 hover:text-black"
                                        title="Custom Settings"
                                    >
                                        <Settings2 size={12} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 pl-1.5 sm:pl-3">
                                    <button
                                        onClick={leaveDuel}
                                        className="px-2.5 py-1 rounded-lg transition-all"
                                        style={{
                                            fontWeight: !duelMode ? 900 : 500,
                                            color: !duelMode ? "#000000" : "#6b7280",
                                            background: !duelMode ? "#f3f4f6" : "transparent",
                                            border: !duelMode ? "1.5px solid #000000" : "1.5px solid transparent"
                                        }}
                                    >solo</button>
                                    <button
                                        onClick={() => {
                                            if (!duelMode) setDuelMode(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg transition-all"
                                        style={{
                                            fontWeight: duelMode ? 900 : 500,
                                            color: duelMode ? "#000000" : "#6b7280",
                                            background: duelMode ? "#f3f4f6" : "transparent",
                                            border: duelMode ? "1.5px solid #000000" : "1.5px solid transparent"
                                        }}
                                    >duel</button>
                                </div>
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
                        className="max-w-xl mx-auto mb-8 rounded-2xl border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden"
                        style={{ background: "#ffffff" }}
                    >
                        {/* Status bar */}
                        {duelStatus !== "idle" && (
                            <div
                                className="px-5 py-2.5 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 border-black"
                                style={{
                                    background: duelStatus === "connected" ? "#ecfdf5"
                                        : duelStatus === "error" ? "#fef2f2"
                                            : "#f9fafb",
                                    color: duelStatus === "connected" ? "#065f46"
                                        : duelStatus === "error" ? "#991b1b"
                                            : "#374151",
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">

                            {/* ── Create side ── */}
                            <div className="p-4 sm:p-5 space-y-4">
                                <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">
                                    Race Settings
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                                        {testMode === "time" ? <Timer size={12} /> : testMode === "words" ? <Keyboard size={12} /> : <div className="flex gap-0.5"><Timer size={12}/><Keyboard size={12}/></div>}
                                        {testMode}
                                    </div>
                                    <div className="h-3 w-px bg-zinc-300" />
                                    <div className="text-xs font-bold text-black">
                                        {testMode === "time" ? `${timeConfig}s` : testMode === "words" ? `${wordConfig} words` : `${timeConfig}s & ${wordConfig}w`}
                                    </div>
                                </div>
                                <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500 mt-4">
                                    Create Room
                                </div>
                                {sessionCode && isHost ? (
                                    <div className="space-y-2">
                                        <div className="text-3xl font-black tracking-[0.25em] text-black">
                                            {sessionCode}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(sessionCode);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            className="ig-btn flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-white border-2 border-black rounded-lg w-full justify-center transition-all shadow-[2px_2px_0_#000]"
                                        >
                                            {copiedCode ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                                        </button>
                                        <p className="text-[10px] leading-relaxed text-zinc-500 font-semibold">
                                            Share this code with your opponent. The race starts when both players begin typing.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={createDuel}
                                        disabled={!supabaseOnline || duelStatus === "connecting"}
                                        className="ig-btn w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all disabled:opacity-50 border-2 border-black shadow-[3px_3px_0_#000]"
                                        style={{ background: "#fde047" }}
                                    >
                                        {duelStatus === "connecting" ? "Connecting…" : supabaseOnline ? "Generate Code" : "Unavailable"}
                                    </button>
                                )}
                            </div>

                            {/* ── Join side ── */}
                            <div className="p-4 sm:p-5 space-y-4">
                                <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">
                                    Join Room
                                </div>
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    onKeyDown={e => e.key === "Enter" && joinCode.length === 6 && joinDuel()}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    disabled={duelStatus === "connecting"}
                                    className="w-full rounded-xl px-4 py-2.5 text-xl font-bold tracking-[0.2em] text-center focus:outline-none border-2 border-black text-black bg-white shadow-[2px_2px_0_#000] placeholder:tracking-normal placeholder:font-medium placeholder:text-zinc-300"
                                />
                                <button
                                    onClick={joinDuel}
                                    disabled={!supabaseOnline || joinCode.length !== 6 || duelStatus === "connecting"}
                                    className="ig-btn w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all disabled:opacity-50 border-2 border-black shadow-[3px_3px_0_#000]"
                                    style={{ background: "#fde047" }}
                                >
                                    {duelStatus === "connecting" ? "Joining…"
                                        : supabaseOnline ? "Join Game" : "Unavailable"}
                                </button>
                                {duelStatus === "error" && (
                                    <p className="text-[10px] text-rose-650 font-bold">
                                        Could not join. Make sure the code is correct.
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* ── Live stats (while typing) ──────────────────────────────── */}
                {isActive && (
                    <div className="flex items-center gap-8 mb-6 bg-white border-2 border-black p-4 rounded-2xl shadow-[3px_3px_0_#000] text-black">
                        <div className="text-4xl font-black tabular-nums leading-none">
                            {testMode === "words" ? `${elapsed.toFixed(0)}s` : timeLeft}
                        </div>
                        <div className="flex gap-6 text-xs uppercase tracking-wider font-bold">
                            {[
                                { label: "wpm", val: wpm },
                                { label: "acc", val: `${accuracy}%` },
                                ...(duelMode ? [{ label: "opponent", val: `${opponentWpm} wpm` }] : []),
                            ].map(({ label, val }) => (
                                <div key={label} className="flex flex-col">
                                    <div className="text-[9px] font-black text-zinc-500 mb-0.5">{label}</div>
                                    <div className="text-lg font-black text-black">{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opponent progress bar */}
                {duelMode && isActive && (
                    <div className="h-2 w-full rounded-full mb-4 overflow-hidden border-2 border-black bg-white">
                        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${opponentProgress}%` }} />
                    </div>
                )}

                {/* ── Typing arena ────────────────────────────────────────────── */}
                <div className="relative cursor-text bg-white border-2 border-black rounded-[2rem] p-6 sm:p-10 shadow-[6px_6px_0_#000] text-black" onClick={() => inputRef.current?.focus()}>

                    {/* Blur overlay */}
                    {!isFocused && !isFinished && countdown === null && (!duelMode || duelStatus !== "connected") && (
                        <div
                            className="absolute inset-0 z-40 flex items-center justify-center rounded-[1.85rem] pointer-events-none"
                            style={{ background: `rgba(255,255,255,0.9)`, backdropFilter: "blur(2px)" }}
                        >
                            <div className="flex items-center gap-2 text-black bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0_#000] font-black uppercase text-xs tracking-wider">
                                <MousePointer2 size={14} strokeWidth={2.5} />
                                <span>Click here to start typing</span>
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
                            style={{ fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)", fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}
                        >
                            {/* Animated caret */}
                            <div
                                className="absolute z-10 w-[3px] rounded-full pointer-events-none"
                                style={{
                                    top: caretPos.top + 2,
                                    left: caretPos.left,
                                    height: "1.3em",
                                    background: "#000000",
                                    boxShadow: `0 0 8px rgba(0,0,0,0.2)`,
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
                                            opacity: isCurrent ? 1 : isPast ? 1 : 0.4,
                                            textDecorationLine: isCurrent && wordData.hasError ? "underline" : "none",
                                            textDecorationColor: "#ef4444",
                                            textUnderlineOffset: "4px",
                                        }}
                                    >
                                        {wordData.chars.map((ch, cIdx) => (
                                            <span
                                                key={cIdx}
                                                className="char-el"
                                                style={{
                                                    color: ch.state === "correct"
                                                        ? "#059669"
                                                        : ch.state === "incorrect"
                                                            ? "#dc2626"
                                                            : isCurrent
                                                                ? "#000000"
                                                                : "#9ca3af",
                                                    fontWeight: ch.state === "correct" || ch.state === "incorrect" ? 700 : 500,
                                                    background: ch.state === "incorrect" ? "#fef2f2" : "transparent",
                                                    borderRadius: "2px"
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
                <div className="flex items-center justify-center gap-6 mt-6 text-xs font-bold tracking-wider uppercase text-zinc-500">
                    <button
                        onClick={duelMode && duelStatus === "connected" ? restartDuel : resetTest}
                        className="flex items-center gap-1.5 transition-all text-black bg-white border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0_#000] ig-btn hover:bg-zinc-50"
                    >
                        <RotateCcw size={13} strokeWidth={2.5} /> restart
                    </button>
                    <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] border-2 border-black bg-white shadow-[1px_1px_0_#000] text-black font-black">tab</span>
                        to restart
                    </span>
                </div>
            </main>

            {/* ── Results Screen ─────────────────────────────────────────────── */}
            {isFinished && (
                <div
                    className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 sm:px-8 overflow-y-auto py-6 sm:py-0"
                    style={{ background: "#F4ECD8" }}
                >
                    <div className="w-full max-w-4xl bg-white border-2 border-black p-6 sm:p-10 rounded-[2.5rem] shadow-[8px_8px_0_#000] text-black">

                        {/* ── Duel Result Banner ── */}
                        {duelMode && opponentFinished && (
                            <div
                                className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-5 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0_#000]"
                                style={{
                                    background: finalStats.finalWpm >= opponentFinishWpm ? "#ecfdf5" : "#fef2f2",
                                }}
                            >
                                <div>
                                    <div
                                        className="text-2xl font-black mb-0.5"
                                        style={{ color: finalStats.finalWpm >= opponentFinishWpm ? "#059669" : "#dc2626" }}
                                    >
                                        {finalStats.finalWpm >= opponentFinishWpm ? "🏆 You Won!" : "😔 You Lost"}
                                    </div>
                                    <div className="text-xs tracking-wider font-bold uppercase text-zinc-500">
                                        {finalStats.finalWpm >= opponentFinishWpm
                                            ? `You were faster by ${finalStats.finalWpm - opponentFinishWpm} WPM`
                                            : `Opponent was faster by ${opponentFinishWpm - finalStats.finalWpm} WPM`}
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 text-center">
                                    <div>
                                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">You</div>
                                        <div className="text-3xl font-black text-emerald-600">{finalStats.finalWpm}</div>
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase">wpm</div>
                                    </div>
                                    <div className="text-xl font-black text-zinc-400">vs</div>
                                    <div>
                                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Opponent</div>
                                        <div className="text-3xl font-black text-rose-500">{opponentFinishWpm}</div>
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase">wpm</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show waiting banner if opponent hasn't finished yet */}
                        {duelMode && !opponentFinished && (
                            <div
                                className="mb-8 rounded-2xl px-5 py-3 border-2 border-black bg-zinc-50 flex items-center gap-3 shadow-[2px_2px_0_#000]"
                            >
                                <span className="animate-spin text-lg">◌</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Waiting for opponent to finish… ({opponentProgress}% done)
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 sm:gap-12 mb-8 items-center">
                            <div className="flex flex-row sm:flex-col gap-6 sm:gap-6">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-0.5">wpm</div>
                                    <div className="text-6xl sm:text-8xl font-black leading-none tracking-tight text-black">
                                        {finalStats.finalWpm}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-0.5">accuracy</div>
                                    <div className="text-3xl sm:text-5xl font-black leading-none text-black">
                                        {finalStats.finalAcc}%
                                    </div>
                                </div>
                            </div>

                            {/* WPM Chart */}
                            <div className="h-[200px] w-full relative border-2 border-black rounded-2xl bg-zinc-50 p-4 shadow-[3px_3px_0_#000]">
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
                                            <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] font-bold pointer-events-none opacity-40 py-2 z-10 text-zinc-500">
                                                <span>{maxWpm}</span>
                                                <span>{Math.round(maxWpm * 0.5)}</span>
                                                <span>0</span>
                                            </div>

                                            <svg className="w-full h-full pl-6" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>

                                                {[0, 25, 50, 75, 100].map(y => (
                                                    <line key={y} x1="0" y1={y} x2={VIEWBOX_W} y2={y} stroke="#000" strokeWidth="0.5" strokeDasharray="3,3" strokeOpacity="0.2" />
                                                ))}

                                                <polygon points={fillPoints} fill="url(#chartFill)" />

                                                <polyline
                                                    points={polylinePoints}
                                                    fill="none"
                                                    stroke="#f59e0b"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />

                                                {errorPoints.map((p, i) => (
                                                    <g key={`err-${i}`} transform={`translate(${p.x},${p.y})`}>
                                                        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                                        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                                    </g>
                                                ))}

                                                {points.map((p, i) => (
                                                    <line
                                                        key={i}
                                                        x1={p.x}
                                                        y1={p.y}
                                                        x2={p.x}
                                                        y2={p.y}
                                                        stroke="#000000"
                                                        strokeWidth={points.length > 50 ? "4" : "6"}
                                                        strokeLinecap="round"
                                                        vectorEffect="non-scaling-stroke"
                                                    />
                                                ))}
                                            </svg>
                                        </div>
                                    );
                                })() : (
                                    <div className="flex items-center justify-center h-full text-xs font-bold text-zinc-400">
                                        Not enough data for chart
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detail row */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6 border-t-2 border-black">
                            {[
                                { label: "raw wpm", value: finalStats.finalRaw },
                                { label: "characters", value: `${finalStats.correct}/${finalStats.incorrect}` },
                                { label: "time taken", value: `${finalStats.mm}:${finalStats.ss}` },
                                { label: "mode preset", value: `${testMode} (${testMode === "time" ? timeConfig : wordConfig})` },
                                { label: "active style", value: T.name },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col bg-zinc-50 p-3 border-2 border-black rounded-xl shadow-[2px_2px_0_#000]">
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">{label}</div>
                                    <div className="text-sm font-black text-black truncate">{value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 mt-8">
                            <button
                                onClick={resetTest}
                                className="ig-btn flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-black border-2 border-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-[3px_3px_0_#000]"
                            >
                                <RotateCcw size={14} strokeWidth={2.5} /> next test
                            </button>
                            <button
                                onClick={resetTest}
                                className="ig-btn p-3 bg-zinc-50 hover:bg-zinc-100 text-black border-2 border-black rounded-xl shadow-[3px_3px_0_#000]"
                            >
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings Modal ────────────────────────────────────────────────── */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setSettingsModalOpen(false)}>
                    <div className="absolute inset-0 bg-[#000]/40 backdrop-blur-sm" />
                    <div className="relative bg-white border-2 border-black rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl shadow-[8px_8px_0_#000] flex flex-col max-h-[90vh] text-black overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="font-black text-xl lg:text-3xl tracking-tight ig-display text-black">
                                Workspace Settings
                            </h3>
                            <button onClick={() => setSettingsModalOpen(false)} className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Modal Content container (scrollable) */}
                        <div data-lenis-prevent className="overflow-y-auto pr-2 space-y-8 pb-4 scrollbar-thin overflow-x-hidden">

                            {/* Theme Grid */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Palette size={14} />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-black">Color theme preset</h4>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {THEMES.map((th, i) => (
                                        <button
                                            key={th.name}
                                            onClick={() => setThemeIdx(i)}
                                            className="flex flex-col items-center gap-1.5 border-2 border-black p-2.5 rounded-xl transition-all shadow-[2.5px_2.5px_0_#000] hover:bg-zinc-50"
                                            style={{
                                                background: th.bg === "#F4ECD8" ? "#ffffff" : th.bg,
                                                transform: i === themeIdx ? "scale(1.02)" : "scale(1)",
                                                borderWidth: i === themeIdx ? "3px" : "2px",
                                            }}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                                {th.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <hr className="border-t-2 border-dashed border-zinc-200" />

                            {/* Custom Values */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Settings2 size={14} />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-black">
                                        Custom limits
                                    </h4>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {testMode === "both" ? (
                                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
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
                                                    className="w-full rounded-xl px-4 py-2 text-sm font-bold border-2 border-black text-black bg-white"
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
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
                                                    className="w-full rounded-xl px-4 py-2 text-sm font-bold border-2 border-black text-black bg-white"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSettingsModalOpen(false)}
                                                className="ig-btn px-6 py-2.5 font-bold rounded-xl text-xs uppercase tracking-widest text-black border-2 border-black bg-yellow-350 shadow-[2px_2px_0_#000]"
                                            >Apply</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
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
                                                    className="w-full rounded-xl px-4 py-2 text-sm font-bold border-2 border-black text-black bg-white"
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
                                                className="ig-btn px-6 py-2.5 font-bold rounded-xl text-xs uppercase tracking-widest text-black border-2 border-black bg-yellow-350 shadow-[2px_2px_0_#000]"
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
                <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Minimalist Core Mechanics</h3>
                        <p className="text-sm text-zinc-650 leading-relaxed font-medium">
                            The Typing Speed Tester evaluates pure keyboarding velocity, character coordination, and accuracy metrics. Calculating statistics locally at high frequency ensures zero-lag rendering.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="How is WPM calculated?">
                                Words Per Minute (WPM) takes your total correct characters, divides by 5 (standard word length unit), and then divides by elapsed minutes.
                            </AccordionItem>
                            <AccordionItem title="What is WPM vs Raw WPM?">
                                WPM strictly checks correctly typed characters, penalizing typos. Raw WPM evaluates total keystrokes without penalties, representing your total motor speed.
                            </AccordionItem>
                            <AccordionItem title="How does the Multiplayer Duel work?">
                                Utilizing Supabase realtime channels, duels allow you to race synchronously. Both players get the exact same text seed and track opponent progress in real time.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
