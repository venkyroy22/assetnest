"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, RotateCcw, Trophy, Hash, Star, RefreshCw, Info } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

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
    const [showHelp, setShowHelp] = useState(false);

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

        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Check if it's a significant swipe
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal
                    if (dx > 0) move('right');
                    else move('left');
                } else {
                    // Vertical
                    if (dy > 0) move('down');
                    else move('up');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
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
            case 8: return "bg-white text-white";
            case 16: return "bg-white text-white";
            case 32: return "bg-white text-white";
            case 64: return "bg-white text-white";
            case 128: return "bg-white text-white shadow-[0_0_10px_rgba(255, 255, 255,0.4)]";
            case 256: return "bg-white text-white shadow-[0_0_15px_rgba(255, 255, 255,0.5)]";
            case 512: return "bg-white text-white shadow-[0_0_20px_rgba(255, 255, 255,0.6)]";
            case 1024: return "bg-white text-zinc-900 shadow-[0_0_25px_rgba(255, 255, 255,0.7)] font-black";
            case 2048: return "bg-white text-zinc-900 shadow-[0_0_30px_rgba(255, 255, 255,0.8)] font-black";
            default: return "bg-zinc-900/50 text-zinc-700";
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
                    <span className="text-2xl font-black text-white">{highScore}</span>
                </div>
                <button onClick={reset} className="p-5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all rounded-2xl">
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Game Board */}
            <div className="relative p-3 bg-zinc-950 border-4 border-zinc-900 rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(255,255,255,0.05)] touch-action-none" style={{ touchAction: 'none' }}>
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
                                <Star size={48} className="text-white mb-4 animate-bounce" />
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

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="2048 Strategic Briefing"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Play 2048 Online: The Ultimate Strategy Puzzle</h3>
                        <p className="text-base leading-relaxed text-zinc-400 max-w-3xl">
                            Welcome to the official AssetNest edition of <strong>2048</strong>, the world-famous sliding tile puzzle game. Since its viral debut, 2048 has captivated millions with its perfect blend of mathematical simplicity and deep strategic challenge. Whether you are a casual player looking to pass the time or a high-score enthusiast hunting for the legendary 2048 tile, our responsive, dark-themed version provides the smoothest gameplay experience directly in your browser. No downloads, no accounts, just pure 4x4 grid mastery.
                        </p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-4">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black">1</span>
                                How to Master 2048
                            </h3>
                            <ul className="space-y-4 text-sm leading-relaxed text-zinc-400">
                                <li className="flex gap-3">
                                    <span className="text-white shrink-0">•</span>
                                    <div><strong className="text-zinc-200">The Core Rule:</strong> Swipe tiles (Up, Down, Left, Right) to move all tiles in the grid. When two tiles with the same number collide, they merge into one with double the value!</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-white shrink-0">•</span>
                                    <div><strong className="text-zinc-200">Strategic Cornering:</strong> Most experts recommend picking one corner (like the bottom-left) and keeping your highest-value tile locked there to maintain grid organization.</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-white shrink-0">•</span>
                                    <div><strong className="text-zinc-200">Chain Reactions:</strong> Plan your moves to create back-to-back merges, which not only clears the board but exponentially boosts your score.</div>
                                </li>
                            </ul>
                        </section>
                        
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-4">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black">2</span>
                                Why Play Here?
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
                                    <h4 className="text-sm font-bold text-white mb-2">Zero Latency Controls</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed">Our game engine is optimized for instant response. Use your arrow keys or swipe with precision—every move is calculated in milliseconds without server lag.</p>
                                </div>
                                <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
                                    <h4 className="text-sm font-bold text-white mb-2">Local High Score Tracking</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed">Your highest score is saved directly to your browser&apos;s local storage. Close the tab and come back anytime to beat your personal record.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                    
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 bg-zinc-950/30 border border-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="Is the 2048 game free to play?">
                                Yes, 100% free. We offer the full 2048 experience without paywalls, subscriptions, or watermarks. Just open the page and start merging.
                            </AccordionItem>
                            <AccordionItem title="Can I play 2048 on my phone?">
                                Absolutely! This version of 2048 is fully responsive and supports touch gestures. Simply swipe in the direction you want the tiles to slide.
                            </AccordionItem>
                            <AccordionItem title="What happens when I reach the 2048 tile?">
                                You win! However, the game doesn&apos;t have to end there. You can choose to keep playing to reach the 4096, 8192, or even the nearly-impossible 16384 tile.
                            </AccordionItem>
                            <AccordionItem title="How is my high score saved?">
                                We use browser local storage to track your best score. As long as you don&apos;t clear your browser data, your high score will be waiting for you whenever you return to AssetNest.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
