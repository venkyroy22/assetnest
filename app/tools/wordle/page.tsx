"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, RotateCcw, Trophy, WholeWord, RefreshCw, X, Check, Gamepad2 } from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Wordle Clone",
    description: "Play Wordle for free online. Guess the hidden 5-letter word in 6 attempts. Each guess provides colored feedback to help you solve the daily puzzle. 100% free browser-based word game.",
    url: "https://www.assetnest.space/tools/wordle",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const WORDS = [
    "APPLE", "BEACH", "BRAIN", "CLOUD", "DREAM", "EARTH", "FLAME", "GHOST", "HEART", "INDEX",
    "JUICE", "KNOCK", "LIGHT", "MUSIC", "NIGHT", "OCEAN", "PARTY", "QUITE", "RIVER", "SMILE",
    "TABLE", "UNDER", "VOICE", "WATER", "YOUNG", "ZEBRA", "ABOVE", "ANGER", "BASIC", "CLEAN",
    "DARK", "EMPTY", "FIELD", "GRASS", "HOUSE", "IMAGE", "JOLLY", "KNIFE", "LUCKY", "MOUSE",
    "NORTH", "ORDER", "PIANO", "QUEEN", "REACH", "SPACE", "TRACK", "UPSET", "VALUE", "WHITE"
];

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

export default function WordlePage() {
    const [solution, setSolution] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [shakeEntry, setShakeEntry] = useState(false);

    const startNewGame = useCallback(() => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setSolution(word);
        setGuesses([]);
        setCurrentGuess("");
        setGameOver(false);
        setWon(false);
    }, []);

    useEffect(() => {
        startNewGame();
        setIsLoaded(true);
    }, [startNewGame]);

    const submitGuess = () => {
        if (currentGuess.length !== WORD_LENGTH || gameOver) return;

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        
        if (currentGuess === solution) {
            setWon(true);
            setGameOver(true);
        } else if (newGuesses.length >= MAX_ATTEMPTS) {
            setGameOver(true);
        }
        
        setCurrentGuess("");
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentGuess.length === WORD_LENGTH) {
                submitGuess();
            } else {
                setShakeEntry(true);
                setTimeout(() => setShakeEntry(false), 500);
            }
        } else if (e.key === 'Backspace') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
            setCurrentGuess(prev => (prev + e.key).toUpperCase());
        }
    }, [currentGuess, gameOver, solution, guesses]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const getLetterColor = (guess: string, index: number) => {
        const letter = guess[index];
        if (letter === solution[index]) return "bg-emerald-500 border-emerald-500 text-white";
        if (solution.includes(letter)) return "bg-amber-500 border-amber-500 text-white";
        return "bg-zinc-800 border-zinc-700 text-zinc-500";
    };

    if (!isLoaded) return null;

    const keyboardRows = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];

    const getKeyboardStatus = (key: string) => {
        if (key === "ENTER" || key === "⌫") return "bg-zinc-800 text-white";
        let status = "bg-zinc-900 text-zinc-400";
        for (const guess of guesses) {
            for (let i = 0; i < WORD_LENGTH; i++) {
                if (guess[i] === key) {
                    if (key === solution[i]) return "bg-emerald-500 text-white";
                    if (solution.includes(key)) status = "bg-amber-500 text-white";
                    else if (status === "bg-zinc-900 text-zinc-400") status = "bg-zinc-800 text-zinc-600";
                }
            }
        }
        return status;
    };

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="w-full mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5 rounded-full">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Games</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 uppercase">
                    Wordle
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Guess the hidden word.
                </p>
            </div>

            <div className="flex flex-col items-center gap-10">
                {/* Board */}
                <div className="grid grid-rows-6 gap-2">
                    {[...Array(MAX_ATTEMPTS)].map((_, i) => {
                        const guess = guesses[i] || (i === guesses.length ? currentGuess : "");
                        const isRevealed = i < guesses.length;

                        return (
                            <div key={i} className={`grid grid-cols-5 gap-2 ${i === guesses.length && shakeEntry ? 'animate-shake' : ''}`}>
                                {[...Array(WORD_LENGTH)].map((_, j) => (
                                    <div 
                                        key={j}
                                        className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-black transition-all duration-500
                                            ${isRevealed ? getLetterColor(guess, j) : 
                                              guess[j] ? 'border-zinc-500 text-white scale-105' : 'border-zinc-800 text-transparent'}
                                            ${isRevealed ? 'animate-flip' : ''}
                                        `}
                                        style={{ animationDelay: `${j * 100}ms` }}
                                    >
                                        {guess[j] || ""}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Keyboard */}
                <div className="flex flex-col items-center gap-2 w-full max-w-md">
                    {keyboardRows.map((row, i) => (
                        <div key={i} className="flex gap-1.5 w-full justify-center">
                            {row.map(key => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        if (key === "ENTER") submitGuess();
                                        else if (key === "⌫") setCurrentGuess(prev => prev.slice(0, -1));
                                        else if (currentGuess.length < WORD_LENGTH) setCurrentGuess(prev => prev + key);
                                    }}
                                    className={`h-14 flex items-center justify-center font-bold rounded-lg transition-all
                                        ${key === "ENTER" || key === "⌫" ? 'px-4 text-[10px]' : 'w-10 text-sm'}
                                        ${getKeyboardStatus(key)}
                                        hover:scale-105 active:scale-95
                                    `}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlays */}
            {gameOver && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500">
                        {won ? (
                            <>
                                <Trophy size={48} className="text-emerald-400 mx-auto mb-6 animate-bounce" />
                                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Brilliant!</h2>
                                <p className="text-sm text-zinc-500 mb-8">You found the word <span className="text-white font-bold">{solution}</span> in {guesses.length} tries.</p>
                            </>
                        ) : (
                            <>
                                <X size={48} className="text-red-500 mx-auto mb-6" />
                                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Close!</h2>
                                <p className="text-sm text-zinc-500 mb-8">The word was <span className="text-white font-bold">{solution}</span>. Better luck next time.</p>
                            </>
                        )}
                        <button onClick={startNewGame} className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-full tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={14} /> Play New
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes flip {
                    0% { transform: rotateX(0deg); }
                    50% { transform: rotateX(90deg); }
                    100% { transform: rotateX(0deg); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-5px); }
                    40% { transform: translateX(5px); }
                    60% { transform: translateX(-5px); }
                    80% { transform: translateX(5px); }
                }
                .animate-flip { animation: flip 0.6s ease-in-out forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
}
