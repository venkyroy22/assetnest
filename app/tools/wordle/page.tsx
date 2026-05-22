"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, RotateCcw, Trophy, WholeWord, RefreshCw, X, Check, Gamepad2, Info } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

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
    const [showHelp, setShowHelp] = useState(false);

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
        if (letter === solution[index]) return "bg-emerald-500 border-emerald-500 text-[#f0ede8]";
        if (solution.includes(letter)) return "bg-amber-500 border-amber-500 text-[#f0ede8]";
        return "bg-white/[0.06] border-zinc-700 text-zinc-500";
    };

    if (!isLoaded) return null;

    const keyboardRows = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];

    const getKeyboardStatus = (key: string) => {
        if (key === "ENTER" || key === "⌫") return "bg-white/[0.06] text-[#f0ede8]";
        let status = "bg-[#1c1c1c] text-zinc-400";
        for (const guess of guesses) {
            for (let i = 0; i < WORD_LENGTH; i++) {
                if (guess[i] === key) {
                    if (key === solution[i]) return "bg-emerald-500 text-[#f0ede8]";
                    if (solution.includes(key)) status = "bg-amber-500 text-[#f0ede8]";
                    else if (status === "bg-[#1c1c1c] text-zinc-400") status = "bg-white/[0.06] text-zinc-600";
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
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 mb-5 rounded-full relative group">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Games</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-[#f0ede8] transition-all shadow-xl"
                        title="Help & FAQ"
                    >
                        <Info size={10} />
                    </button>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#f0ede8] mb-4 uppercase">
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
                                              guess[j] ? 'border-zinc-500 text-[#f0ede8] scale-105' : 'border-white/[0.07] text-transparent'}
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
                <div className="fixed inset-0 z-[100] bg-[#141414]/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="max-w-sm w-full bg-[#1c1c1c] border border-white/[0.07] p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500">
                        {won ? (
                            <>
                                <Trophy size={48} className="text-emerald-400 mx-auto mb-6 animate-bounce" />
                                <h2 className="text-3xl font-black text-[#f0ede8] mb-2 uppercase tracking-tighter">Brilliant!</h2>
                                <p className="text-sm text-zinc-500 mb-8">You found the word <span className="text-[#f0ede8] font-bold">{solution}</span> in {guesses.length} tries.</p>
                            </>
                        ) : (
                            <>
                                <X size={48} className="text-red-500 mx-auto mb-6" />
                                <h2 className="text-3xl font-black text-[#f0ede8] mb-2 uppercase tracking-tighter">Close!</h2>
                                <p className="text-sm text-zinc-500 mb-8">The word was <span className="text-[#f0ede8] font-bold">{solution}</span>. Better luck next time.</p>
                            </>
                        )}
                        <button onClick={startNewGame} className="w-full py-4 bg-[#f0ede8] text-[#141414] text-[10px] font-black uppercase rounded-full tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
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

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Linguistic Briefing"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Master the Hidden Word: Wordle Online</h3>
                        <p className="text-base leading-relaxed text-zinc-400 max-w-3xl font-medium">
                            Welcome to the AssetNest edition of <strong>Wordle</strong>, the viral word-guessing game that has taken the world by storm. Wordle is a brilliant test of vocabulary, logic, and deduction. Your goal is simple: uncover a secret five-letter word in six attempts or less. Each guess provides valuable feedback through color-coded tiles, guiding you closer to the solution. Our free, browser-based version offers a clean, dark-themed experience that focuses purely on the puzzle, with no trackers, no ads, and 100% privacy.
                        </p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-4">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <span className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center text-[10px] font-black italic">!</span>
                                Decoding the Feedback
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors flex gap-4">
                                    <div className="w-10 h-10 bg-white border border-white shrink-0 rounded flex items-center justify-center text-[#f0ede8] font-black">W</div>
                                    <div>
                                        <h4 className="text-sm font-black text-[#f0ede8] mb-1 uppercase tracking-wide">Green Tile</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed font-semibold">The letter is in the word and in the correct spot.</p>
                                    </div>
                                </div>
                                <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors flex gap-4">
                                    <div className="w-10 h-10 bg-white border border-white shrink-0 rounded flex items-center justify-center text-[#f0ede8] font-black">O</div>
                                    <div>
                                        <h4 className="text-sm font-black text-[#f0ede8] mb-1 uppercase tracking-wide">Yellow Tile</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed font-semibold">The letter is in the word but in the wrong spot.</p>
                                    </div>
                                </div>
                                <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors flex gap-4">
                                    <div className="w-10 h-10 bg-white/[0.06] border border-zinc-700 shrink-0 rounded flex items-center justify-center text-zinc-500 font-black">X</div>
                                    <div>
                                        <h4 className="text-sm font-black text-[#f0ede8] mb-1 uppercase tracking-wide">Gray Tile</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed font-semibold">The letter is not in the word at all.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">
                                <span className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center text-[10px] font-black italic">?</span>
                                Victory Strategies
                            </h3>
                            <ul className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                                <li className="flex gap-3">
                                    <span className="text-[#f0ede8] shrink-0">◇</span>
                                    <div><strong className="text-zinc-200">The Power Opener:</strong> Start with a word that uses many common vowels and consonants (like "ADIEU", "ORATE", or "ROATE") to eliminate as many possibilities as possible in your first move.</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#f0ede8] shrink-0">◇</span>
                                    <div><strong className="text-zinc-200">Letter Elimination:</strong> Pay close attention to the virtual keyboard. It tracks which letters have been used and their color status, helping you visualize remaining combinations.</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#f0ede8] shrink-0">◇</span>
                                    <div><strong className="text-zinc-200">Duplication Warning:</strong> The game doesn&apos;t explicitly tell you if a letter appears twice in the word. If a letter is yellow or green, stay open to the possibility that it might be repeated!</div>
                                </li>
                            </ul>
                        </section>
                    </div>
                    
                    <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] bg-[#1c1c1c]/30 border border-white/[0.05] rounded-[3rem] p-10 md:p-14">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Linguistic Briefing (FAQ)</h3>
                        <Accordion>
                            <AccordionItem title="How many times can I play per day?">
                                Unlike other versions that limit you to one word per day, our Wordle Clone allows you to play unlimited rounds. Just click &quot;Play New&quot; to start a fresh challenge instantly.
                            </AccordionItem>
                            <AccordionItem title="What dictionary do you use?">
                                We use a curated list of common 5-letter English words to ensure that the solutions are recognizable and the game remains fair for all players.
                            </AccordionItem>
                            <AccordionItem title="Is my progress saved to a server?">
                                No. We prioritize your privacy. The game logic happens entirely in your browser, and no data is sent to external servers.
                            </AccordionItem>
                            <AccordionItem title="Can I play on my smartphone?">
                                Yes! Wordle Pro is fully responsive. You can use the on-screen keyboard for a perfect mobile gaming experience on any device.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
