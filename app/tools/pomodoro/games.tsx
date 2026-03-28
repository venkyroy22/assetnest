"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Trophy, RefreshCw, ChevronLeft, Gamepad2, Timer, Zap, Brain, Star } from "lucide-react";

type GameType = "snake" | "memory" | "clicker" | null;

// --- SNAKE GAME ---
function SnakeGame({ onExit }: { onExit: () => void }) {
    const CANVAS_SIZE = 280;
    const GRID_SIZE = 14;
    const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
    
    const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
    const [food, setFood] = useState({ x: 3, y: 3 });
    const [dir, setDir] = useState({ x: 0, y: -1 });
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);
    
    // Use ref to track current direction to prevent 180-degree turns
    const dirRef = useRef(dir);

    useEffect(() => {
        const saved = localStorage.getItem("snake_high_score");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnFood = useCallback(() => {
        return {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }, []);

    const reset = () => {
        setSnake([{ x: 7, y: 7 }]);
        setDir({ x: 0, y: -1 });
        dirRef.current = { x: 0, y: -1 };
        setFood(spawnFood());
        setScore(0);
        setGameOver(false);
    };

    useEffect(() => {
        if (gameOver) return;
        
        const move = setInterval(() => {
            setSnake(prev => {
                const head = { x: prev[0].x + dirRef.current.x, y: prev[0].y + dirRef.current.y };
                
                // Wall collision
                if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                    setGameOver(true);
                    return prev;
                }
                
                // Self collision
                if (prev.some(s => s.x === head.x && s.y === head.y)) {
                    setGameOver(true);
                    return prev;
                }
                
                const newSnake = [head, ...prev];
                
                // Food collision
                if (head.x === food.x && head.y === food.y) {
                    setScore(s => {
                        const newScore = s + 10;
                        if (newScore > highScore) {
                            setHighScore(newScore);
                            localStorage.setItem("snake_high_score", newScore.toString());
                        }
                        return newScore;
                    });
                    setFood(spawnFood());
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        }, 220);

        return () => clearInterval(move);
    }, [food, gameOver, highScore, spawnFood]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            switch(e.key) {
                case "ArrowUp": if (dirRef.current.y === 0) { setDir({ x: 0, y: -1 }); dirRef.current = { x: 0, y: -1 }; } break;
                case "ArrowDown": if (dirRef.current.y === 0) { setDir({ x: 0, y: 1 }); dirRef.current = { x: 0, y: 1 }; } break;
                case "ArrowLeft": if (dirRef.current.x === 0) { setDir({ x: -1, y: 0 }); dirRef.current = { x: -1, y: 0 }; } break;
                case "ArrowRight": if (dirRef.current.x === 0) { setDir({ x: 1, y: 0 }); dirRef.current = { x: 1, y: 0 }; } break;
            }
        };
        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hi-Score</span>
                    <span className="text-2xl font-black text-white">{highScore}</span>
                </div>
            </div>

            <div 
                className="relative bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            >
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-5" 
                    style={{ 
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
                    }} 
                />
                
                {/* Food */}
                <div 
                    className="absolute bg-white rounded-sm animate-pulse shadow-[0_0_10px_rgba(255, 255, 255,0.5)]"
                    style={{ 
                        left: food.x * CELL_SIZE + 2, 
                        top: food.y * CELL_SIZE + 2, 
                        width: CELL_SIZE - 4, 
                        height: CELL_SIZE - 4 
                    }}
                />

                {/* Snake */}
                {snake.map((s, i) => (
                    <div 
                        key={i}
                        className="absolute bg-white rounded-sm transition-all duration-150"
                        style={{ 
                            left: s.x * CELL_SIZE + 1, 
                            top: s.y * CELL_SIZE + 1, 
                            width: CELL_SIZE - 2, 
                            height: CELL_SIZE - 2,
                            opacity: 1 - (i / snake.length) * 0.5,
                            zIndex: 10 - i
                        }}
                    />
                ))}

                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                        <Trophy size={40} className="text-white mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Game Over!</h3>
                        <p className="text-sm text-zinc-400 mb-6">You scored {score} points. Ready to beat your high score?</p>
                        <button 
                            onClick={reset}
                            className="bg-white text-black text-xs font-black py-3 px-8 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        >
                            <RefreshCw size={14} /> PLAY AGAIN
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 w-full max-w-[180px]">
                <div />
                <button onMouseDown={() => { if (dirRef.current.y === 0) { setDir({ x: 0, y: -1 }); dirRef.current = { x: 0, y: -1 }; } }} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:scale-90 transition-all font-bold">↑</button>
                <div />
                <button onMouseDown={() => { if (dirRef.current.x === 0) { setDir({ x: -1, y: 0 }); dirRef.current = { x: -1, y: 0 }; } }} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:scale-90 transition-all font-bold">←</button>
                <button onMouseDown={() => { if (dirRef.current.y === 0) { setDir({ x: 0, y: 1 }); dirRef.current = { x: 0, y: 1 }; } }} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:scale-90 transition-all font-bold">↓</button>
                <button onMouseDown={() => { if (dirRef.current.x === 0) { setDir({ x: 1, y: 0 }); dirRef.current = { x: 1, y: 0 }; } }} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:scale-90 transition-all font-bold">→</button>
            </div>
        </div>
    );
}

// --- MEMORY MATCH ---
const ICONS = [Zap, Brain, Timer, Trophy, Star, Gamepad2];
function MemoryGame({ onExit }: { onExit: () => void }) {
    const [cards, setCards] = useState(() => {
        const pool = [...ICONS, ...ICONS];
        return pool.sort(() => Math.random() - 0.5).map((Icon, i) => ({ id: i, Icon, flipped: false, matched: false }));
    });
    const [flipped, setFlipped] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [win, setWin] = useState(false);

    useEffect(() => {
        if (flipped.length === 2) {
            setMoves(m => m + 1);
            const [a, b] = flipped;
            if (cards[a].Icon === cards[b].Icon) {
                setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 800);
            }
        }
    }, [flipped, cards]);

    useEffect(() => {
        if (cards.every(c => c.matched)) setWin(true);
    }, [cards]);

    const reset = () => {
        const pool = [...ICONS, ...ICONS];
        setCards(pool.sort(() => Math.random() - 0.5).map((Icon, i) => ({ id: i, Icon, flipped: false, matched: false })));
        setFlipped([]);
        setMoves(0);
        setWin(false);
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4">
             <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Moves</span>
                    <span className="text-2xl font-black text-white">{moves}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {cards.map((card, i) => {
                    const isOpen = card.matched || flipped.includes(i);
                    return (
                        <button 
                            key={i}
                            disabled={isOpen || flipped.length >= 2}
                            onClick={() => setFlipped(f => [...f, i])}
                            className={`w-16 h-16 rounded-xl border-2 transition-all duration-300 relative preserve-3d ${isOpen ? 'rotate-y-180 border-white/50 bg-white/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                        >
                            <div className={`absolute inset-0 flex items-center justify-center transition-all ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                <card.Icon size={24} className="text-white" />
                            </div>
                            <div className={`absolute inset-0 flex items-center justify-center transition-all ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                            </div>
                        </button>
                    );
                })}
            </div>

             {win && (
                <div className="mt-6 animate-in fade-in zoom-in flex flex-col items-center gap-4">
                    <p className="text-white font-bold">Puzzle Solved! ✨</p>
                    <button 
                        onClick={reset}
                        className="bg-white text-black text-[10px] font-black py-2.5 px-6 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                        <RefreshCw size={12} /> PLAY AGAIN
                    </button>
                </div>
            )}
        </div>
    );
}

// --- CLICKER / REACTION GAME ---
function ReactionGame({ onExit }: { onExit: () => void }) {
    const [state, setState] = useState<"idle" | "waiting" | "ready" | "result">("idle");
    const [startTime, setStartTime] = useState(0);
    const [result, setResult] = useState(0);
    const timeoutRef = useRef<any>(null);

    const start = () => {
        setState("waiting");
        const delay = 1500 + Math.random() * 3000;
        timeoutRef.current = setTimeout(() => {
            setState("ready");
            setStartTime(Date.now());
        }, delay);
    };

    const handleClickRoute = () => {
        if (state === "waiting") {
            clearTimeout(timeoutRef.current);
            setState("result");
            setResult(-1); // Too early
        } else if (state === "ready") {
            const time = Date.now() - startTime;
            setResult(time);
            setState("result");
        }
    };

    const reset = () => {
        setState("idle");
        setResult(0);
    };

    return (
        <div className="flex flex-col items-center gap-8 p-4 w-full">
            <div className="text-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Reaction Test</h3>
                <p className="text-[10px] text-zinc-500">Tap when the screen turns emerald</p>
            </div>

            <div 
                onClick={handleClickRoute}
                className={`w-full aspect-[4/3] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 shadow-2xl ${
                    state === "idle" ? "bg-zinc-950 border-zinc-900" :
                    state === "waiting" ? "bg-red-500/10 border-red-500/20" :
                    state === "ready" ? "bg-white border-white scale-[1.02]" :
                    "bg-zinc-900 border-zinc-800"
                }`}
            >
                {state === "idle" && (
                    <button onClick={(e) => { e.stopPropagation(); start(); }} className="bg-white text-black text-xs font-black px-10 py-4 rounded-full shadow-2xl hover:scale-105 transition-all outline-none">
                        START TEST
                    </button>
                )}
                {state === "waiting" && <span className="text-2xl animate-pulse font-black text-red-500/50">WAIT...</span>}
                {state === "ready" && <span className="text-4xl font-black text-white">TAP!</span>}
                {state === "result" && (
                    <div className="text-center space-y-4">
                        {result === -1 ? (
                            <>
                                <X size={40} className="text-red-500 mx-auto" />
                                <h4 className="text-xl font-black text-white">TOO EARLY!</h4>
                                <p className="text-[10px] text-zinc-500">Wait for the color change.</p>
                            </>
                        ) : (
                            <>
                                <Zap size={40} className="text-white mx-auto" strokeWidth={3} />
                                <h4 className="text-4xl font-black text-white tabular-nums">{result}ms</h4>
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                                    {result < 200 ? "SUPERHUMAN! ⚡" : result < 300 ? "Fast! 🔥" : "Classic ☕"}
                                </p>
                            </>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-[10px] font-black text-white flex items-center gap-2 mx-auto pt-4 group">
                           <RefreshCw size={12} className="group-hover:rotate-180 transition-all duration-500" /> TRY AGAIN
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MAIN MINIGAMES OVERLAY ---
export function MiniGames({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeGame, setActiveGame] = useState<GameType>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[3rem] shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <div className="p-8 pb-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {activeGame && (
                            <button 
                                onClick={() => setActiveGame(null)}
                                className="p-2 text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-black text-white tracking-widest uppercase">
                                {activeGame ? activeGame : "Break Games"}
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                {activeGame ? "Mini Session" : "Select an Activity"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all shadow-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    {!activeGame ? (
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: "snake", title: "Snake Pro", desc: "The classic arcade survival game. Beat your records.", icon: <Gamepad2 className="text-white" /> },
                                { id: "memory", title: "Recall", desc: "A fast-paced memory matching puzzle.", icon: <Brain className="text-white" /> },
                                { id: "clicker", title: "Reflex", desc: "Test your reaction time with millisecond precision.", icon: <Zap className="text-white" /> },
                            ].map((g) => (
                                <button 
                                    key={g.id}
                                    onClick={() => setActiveGame(g.id as GameType)}
                                    className="group relative flex items-center gap-6 p-6 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] text-left hover:bg-zinc-900 hover:border-zinc-500 transition-all duration-300"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {g.icon}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-white text-lg">{g.title}</h3>
                                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">{g.desc}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-white group-hover:border-zinc-500 transition-all">
                                        →
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            {activeGame === "snake" && <SnakeGame onExit={() => setActiveGame(null)} />}
                            {activeGame === "memory" && <MemoryGame onExit={() => setActiveGame(null)} />}
                            {activeGame === "clicker" && <ReactionGame onExit={() => setActiveGame(null)} />}
                        </div>
                    )}
                </div>

                {!activeGame && (
                    <div className="p-8 pt-0 text-center">
                        <div className="inline-flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-full">
                            ✨ Take a short breather
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
