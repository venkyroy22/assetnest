"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, RotateCcw, Trophy, Hash, Star, RefreshCw } from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "2048 Game",
    description: "Play the classic 2048 sliding tile puzzle game online. Merge numbers to reach the 2048 tile in this addictive, brain-teasing puzzle. 100% free and browser-based.",
    url: "https://www.assetnest.space/tools/2048",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type Board = number[][];

const GRID_SIZE = 4;

const getEmptyCells = (board: Board) => {
    const cells: { r: number; c: number }[] = [];
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell === 0) cells.push({ r, c });
        });
    });
    return cells;
};

const spawnTile = (board: Board) => {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) return board;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
};

const initBoard = () => {
    let board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    board = spawnTile(board);
    board = spawnTile(board);
    return board;
};

export default function Game2048Page() {
    const [board, setBoard] = useState<Board>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setBoard(initBoard());
        const saved = localStorage.getItem("assetnest_2048_highscore");
        if (saved) setHighScore(parseInt(saved));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("assetnest_2048_highscore", score.toString());
        }
    }, [score, highScore]);

    const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (gameOver) return;

        setBoard(prev => {
            let newBoard = prev.map(row => [...row]);
            let moved = false;
            let currentScore = score;

            const rotate = (b: Board) => {
                const res = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        res[c][GRID_SIZE - 1 - r] = b[r][c];
                    }
                }
                return res;
            };

            // Normalize move to 'left'
            let k = 0;
            if (direction === 'up') k = 3;
            else if (direction === 'right') k = 2;
            else if (direction === 'down') k = 1;

            for (let i = 0; i < k; i++) newBoard = rotate(newBoard);

            // Apply logic for 'left' move
            for (let r = 0; r < GRID_SIZE; r++) {
                let row = newBoard[r].filter(c => c !== 0);
                for (let c = 0; c < row.length - 1; c++) {
                    if (row[c] === row[c + 1]) {
                        row[c] *= 2;
                        currentScore += row[c];
                        if (row[c] === 2048) setWon(true);
                        row.splice(c + 1, 1);
                        moved = true;
                    }
                }
                const filled = row.concat(Array(GRID_SIZE - row.length).fill(0));
                if (JSON.stringify(newBoard[r]) !== JSON.stringify(filled)) moved = true;
                newBoard[r] = filled;
            }

            // Rotate back
            for (let i = 0; i < (4 - k) % 4; i++) newBoard = rotate(newBoard);

            if (moved) {
                setScore(currentScore);
                newBoard = spawnTile(newBoard);
                
                // Check game over
                const canMove = (b: Board) => {
                    for (let r = 0; r < GRID_SIZE; r++) {
                        for (let c = 0; c < GRID_SIZE; c++) {
                            if (b[r][c] === 0) return true;
                            if (c < GRID_SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
                            if (r < GRID_SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
                        }
                    }
                    return false;
                };

                if (!canMove(newBoard)) {
                    setGameOver(true);
                }

                return newBoard;
            }
            return prev;
        });
    }, [gameOver, score]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
            if (e.key === 'ArrowUp') move('up');
            else if (e.key === 'ArrowDown') move('down');
            else if (e.key === 'ArrowLeft') move('left');
            else if (e.key === 'ArrowRight') move('right');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const reset = () => {
        setBoard(initBoard());
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const getTileColor = (val: number) => {
        switch (val) {
            case 2: return "bg-zinc-800 text-zinc-100";
            case 4: return "bg-zinc-700 text-zinc-100";
            case 8: return "bg-orange-600 text-white";
            case 16: return "bg-orange-500 text-white";
            case 32: return "bg-orange-400 text-white";
            case 64: return "bg-orange-300 text-white";
            case 128: return "bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.4)]";
            case 256: return "bg-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]";
            case 512: return "bg-yellow-300 text-white shadow-[0_0_20px_rgba(234,179,8,0.6)]";
            case 1024: return "bg-yellow-200 text-zinc-900 shadow-[0_0_25px_rgba(234,179,8,0.7)] font-black";
            case 2048: return "bg-emerald-400 text-zinc-900 shadow-[0_0_30px_rgba(52,211,153,0.8)] font-black";
            default: return "bg-zinc-900/50 text-zinc-700";
        }
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-[80vh] py-16 px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <div className="w-full mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-5 rounded-full">
                    <Zap size={11} className="text-amber-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Games</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                    2048
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Merge the tiles. reach the peak.
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-8 w-full max-w-[400px]">
                <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score</span>
                    <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Best</span>
                    <span className="text-2xl font-black text-amber-400">{highScore}</span>
                </div>
                <button onClick={reset} className="p-5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all rounded-2xl">
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Game Board */}
            <div className="relative p-3 bg-zinc-950 border-4 border-zinc-900 rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(255,255,255,0.05)]">
                <div className="grid grid-cols-4 gap-3">
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div 
                                key={`${r}-${c}`}
                                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-xl sm:text-2xl font-black rounded-xl transition-all duration-150 transform ${getTileColor(cell)} ${cell !== 0 ? 'scale-100 bounce-in' : 'scale-95 opacity-20'}`}
                            >
                                {cell !== 0 ? cell : ""}
                            </div>
                        ))
                    ))}
                </div>

                {/* Overlays */}
                {(gameOver || won) && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-[2.2rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                        {won ? (
                            <>
                                <Star size={48} className="text-yellow-400 mb-4 animate-bounce" />
                                <h2 className="text-3xl font-black text-white mb-2 uppercase">You Reached 2048!</h2>
                                <p className="text-sm text-zinc-400 mb-8">Legendary focus. Keep playing to set a record?</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setWon(false)} className="px-8 py-3 bg-white text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-all">KEEP GOING</button>
                                    <button onClick={reset} className="px-8 py-3 border border-zinc-700 text-white text-xs font-black rounded-full hover:bg-zinc-800 transition-all">RESTART</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Trophy size={48} className="text-zinc-600 mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2 uppercase">Game Over</h2>
                                <p className="text-sm text-zinc-400 mb-8">You scored {score} points. Practice makes perfect.</p>
                                <button onClick={reset} className="px-10 py-4 bg-white text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                    <RefreshCw size={14} /> PLAY AGAIN
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">How to Play</p>
                <div className="flex gap-3 justify-center">
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400">ARROW KEYS</span>
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400">TOUCH SWIPE</span>
                </div>
                <p className="mt-6 text-xs text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                    Use your arrow keys to move the tiles. When two tiles with the same number touch, they <span className="text-white">merge into one!</span>
                </p>
            </div>

            <style jsx global>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .bounce-in {
                    animation: bounce-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}</style>
        </div>
    );
}
