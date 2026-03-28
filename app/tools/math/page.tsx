"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, RotateCcw, Trophy, Calculator, Timer, Check, X, RefreshCw } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quick Math Challenge",
    description: "Test your mental arithmetic speed with the Quick Math Challenge. Solve as many math problems as possible in 60 seconds. Improve your brain power and logic skills. Free and browser-based.",
    url: "https://www.assetnest.space/tools/math",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const DURATION = 60;

export default function MathGamePage() {
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [problem, setProblem] = useState({ q: "", a: 0 });
    const [userAnswer, setUserAnswer] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const generateProblem = useCallback(() => {
        const ops = ["+", "-", "*"];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b, q, ans;

        if (op === "+") {
            a = Math.floor(Math.random() * 50) + 1;
            b = Math.floor(Math.random() * 50) + 1;
            ans = a + b;
        } else if (op === "-") {
            a = Math.floor(Math.random() * 50) + 20;
            b = Math.floor(Math.random() * a);
            ans = a - b;
        } else {
            a = Math.floor(Math.random() * 12) + 2;
            b = Math.floor(Math.random() * 12) + 2;
            ans = a * b;
        }

        q = `${a} ${op === '*' ? '×' : op} ${b}`;
        setProblem({ q, a: ans });
        setUserAnswer("");
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("assetnest_math_highscore");
        if (saved) setHighScore(parseInt(saved));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsPlaying(false);
                        setGameOver(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

    useEffect(() => {
        if (gameOver && score > highScore) {
            setHighScore(score);
            localStorage.setItem("assetnest_math_highscore", score.toString());
        }
    }, [gameOver, score, highScore]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(DURATION);
        setIsPlaying(true);
        setGameOver(false);
        generateProblem();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        const ans = parseInt(userAnswer);
        if (ans === problem.a) {
            setScore(s => s + 1);
            setIsCorrect(true);
            setTimeout(() => setIsCorrect(null), 300);
            generateProblem();
        } else {
            setIsCorrect(false);
            setTimeout(() => setIsCorrect(null), 500);
            setUserAnswer("");
        }
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="w-full mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5 rounded-full relative group">
                    <Zap size={11} className="text-white" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Games</span>
                    <button 
                        onClick={() => setShowHelp(true)}
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                        title="Help & FAQ"
                    >
                        <Info size={10} />
                    </button>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 uppercase">
                    Quick Math
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    60 seconds. How many can you solve?
                </p>
            </div>

            <div className="flex flex-col items-center w-full max-w-md gap-6">
                <div className="flex gap-4 w-full">
                    <div className="flex-1 p-5 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Timer size={10} /> Time
                        </span>
                        <span className={`text-3xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                    <div className="flex-1 p-5 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score</span>
                        <span className="text-3xl font-black text-white tabular-nums">{score}</span>
                    </div>
                </div>

                <div className="w-full relative group">
                    <div className={`p-10 bg-zinc-950 border-4 border-zinc-900 rounded-[3rem] shadow-2xl transition-all duration-300 ${isCorrect === true ? 'border-white/50 shadow-white/20' : isCorrect === false ? 'border-red-500/50 shadow-red-500/20 animate-shake' : ''}`}>
                        {!isPlaying && !gameOver ? (
                            <div className="flex flex-col items-center text-center gap-8">
                                <Calculator size={48} className="text-zinc-800" />
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">System Ready</h2>
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">High Score: {highScore}</p>
                                </div>
                                <button 
                                    onClick={startGame}
                                    className="px-12 py-5 bg-white text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase tracking-widest"
                                >
                                    Engage Test
                                </button>
                            </div>
                        ) : gameOver ? (
                            <div className="flex flex-col items-center text-center gap-8 animate-in zoom-in duration-500">
                                <Trophy size={48} className="text-white animate-bounce" />
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Test Concluded</h2>
                                    <p className="text-sm text-zinc-500 font-medium">You identified <span className="text-white font-bold">{score}</span> problems corectly.</p>
                                </div>
                                <button 
                                    onClick={startGame}
                                    className="px-12 py-5 bg-white text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase tracking-widest flex items-center gap-2"
                                >
                                    <RefreshCw size={14} /> RE-ENGAGE
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAnswer} className="flex flex-col items-center gap-10">
                                <div className="text-5xl font-black text-white tracking-widest tabular-nums py-4">
                                    {problem.q} = ?
                                </div>
                                <input
                                    ref={inputRef}
                                    type="number"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="?"
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 text-center text-4xl font-black py-6 rounded-3xl text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-800"
                                    autoFocus
                                />
                                <button type="submit" className="hidden" />
                            </form>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Press ENTER to submit</p>
                </div>
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Quick Math Intelligence"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            <Calculator size={24} className="text-zinc-500" />
                            Quick Math Intelligence (FAQ)
                        </h3>
                        <Accordion>
                            <AccordionItem title="Why should I practice mental math?">
                                Regular mental calculation improves your brain's processing speed, enhances memory, and builds confidence in handling everyday number-based tasks without a calculator.
                            </AccordionItem>
                            <AccordionItem title="What types of problems are included?">
                                The challenge features addition, subtraction, and multiplication problems scaled for quick mental processing, testing your versatility across different operations.
                            </AccordionItem>
                            <AccordionItem title="Can children play this math game?">
                                Absolutely. The Quick Math Challenge is an excellent educational tool for students to sharpen their arithmetic skills in a fun, gamified environment.
                            </AccordionItem>
                            <AccordionItem title="Is my score saved?">
                                Yes! Your highest score is stored locally in your browser, allowing you to track your improvement and compete against your own personal best over time.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    50% { transform: translateX(8px); }
                    75% { transform: translateX(-8px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 2; }
            `}</style>
        </div>
    );
}
