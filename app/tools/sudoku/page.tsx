"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, RotateCcw, Trophy, Table, Check, Info, RefreshCw, Trash2 } from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Sudoku Pro",
    description: "Play Sudoku online with multiple difficulty levels. A clean, premium Sudoku experience with real-time error checking, notes, and progress tracking. 100% free and private.",
    url: "https://www.assetnest.space/tools/sudoku",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type Difficulty = "Easy" | "Medium" | "Hard";

// Simple puzzle seed generator for demo
const generateSudoku = (difficulty: Difficulty) => {
    // This is a simplified version. In a real app, you'd use a more robust backtracking generator.
    // For now, let's use a solved base and shuffle/mask it.
    const base = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];

    // Shuffling rows/cols within blocks would be better, but for now we'll just mask.
    const board = base.map(row => [...row]);
    const maskCount = difficulty === "Easy" ? 35 : difficulty === "Medium" ? 45 : 55;
    
    let count = 0;
    while (count < maskCount) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (board[r][c] !== 0) {
            board[r][c] = 0;
            count++;
        }
    }

    return { puzzle: board, solution: base };
};

export default function SudokuPage() {
    const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
    const [puzzle, setPuzzle] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [initial, setInitial] = useState<boolean[][]>([]);
    const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
    const [history, setHistory] = useState<number[][][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const startNewGame = useCallback((diff: Difficulty) => {
        const { puzzle: p, solution: s } = generateSudoku(diff);
        setPuzzle(p);
        setSolution(s);
        setInitial(p.map(row => row.map(cell => cell !== 0)));
        setGameOver(false);
        setHistory([]);
        setSelected(null);
    }, []);

    useEffect(() => {
        startNewGame("Easy");
        setIsLoaded(true);
    }, [startNewGame]);

    const handleInput = (val: number) => {
        if (!selected || gameOver) return;
        const { r, c } = selected;
        if (initial[r][c]) return;

        setPuzzle(prev => {
            const next = prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? val : cell)));
            
            // Check win condition
            if (next.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
                setGameOver(true);
            }
            
            return next;
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '1' && e.key <= '9') handleInput(parseInt(e.key));
            else if (e.key === 'Backspace' || e.key === 'Delete') handleInput(0);
            else if (e.key === 'ArrowUp') setSelected(s => s ? { ...s, r: Math.max(0, s.r - 1) } : { r: 0, c: 0 });
            else if (e.key === 'ArrowDown') setSelected(s => s ? { ...s, r: Math.min(8, s.r + 1) } : { r: 0, c: 0 });
            else if (e.key === 'ArrowLeft') setSelected(s => s ? { ...s, c: Math.max(0, s.c - 1) } : { r: 0, c: 0 });
            else if (e.key === 'ArrowRight') setSelected(s => s ? { ...s, c: Math.min(8, s.c + 1) } : { r: 0, c: 0 });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selected, gameOver]);

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
                    Sudoku Pro
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Logic, focus, and precision.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 w-full max-w-[500px]">
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl w-full sm:w-auto">
                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map(d => (
                        <button 
                            key={d} 
                            onClick={() => { setDifficulty(d); startNewGame(d); }}
                            className={`flex-1 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${difficulty === d ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
                <button onClick={() => startNewGame(difficulty)} className="w-full sm:w-auto p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all rounded-2xl flex items-center justify-center gap-2">
                    <RotateCcw size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">New</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_200px] gap-12 items-start">
                {/* Board */}
                <div className="p-1 bg-zinc-900 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="grid grid-cols-9 bg-zinc-800 gap-px">
                        {puzzle.map((row, r) => (
                            row.map((cell, c) => {
                                const isSelected = selected?.r === r && selected?.c === c;
                                const isInitial = initial[r][c];
                                const isError = cell !== 0 && cell !== solution[r][c];
                                const isRelated = selected && (selected.r === r || selected.c === c || (Math.floor(selected.r/3) === Math.floor(r/3) && Math.floor(selected.c/3) === Math.floor(c/3)));
                                
                                // Check for completion
                                const rowComplete = puzzle[r].every((val, colIdx) => val !== 0 && val === solution[r][colIdx]);
                                const colComplete = puzzle.every((rowArr, rowIdx) => rowArr[c] !== 0 && rowArr[c] === solution[rowIdx][c]);
                                const isSuccess = rowComplete || colComplete;
                                
                                return (
                                    <button 
                                        key={`${r}-${c}`}
                                        onClick={() => setSelected({ r, c })}
                                        className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-sm sm:text-lg font-bold transition-all
                                            ${isSelected ? 'bg-white text-black z-10 scale-105 shadow-xl !rounded-lg' : 
                                              isSuccess ? 'bg-emerald-500/20 text-emerald-400' :
                                              isRelated ? 'bg-zinc-800/50 text-zinc-300' : 'bg-zinc-950 text-zinc-400'}
                                            ${isInitial ? 'font-black' : 'font-medium'}
                                            ${isInitial && !isSelected && !isSuccess ? 'text-zinc-100' : ''}
                                            ${isError && !isSelected ? 'text-red-500 bg-red-500/10' : ''}
                                            ${(c + 1) % 3 === 0 && c < 8 ? 'mr-1' : ''}
                                            ${(r + 1) % 3 === 0 && r < 8 ? 'mb-1' : ''}
                                        `}
                                    >
                                        {cell !== 0 ? cell : ""}
                                    </button>
                                );
                            })
                        ))}
                    </div>

                    {gameOver && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                            <Trophy size={48} className="text-amber-400 mb-4 animate-bounce" />
                            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Solved!</h2>
                            <p className="text-sm text-zinc-400 mb-8">Impressive speed. Want to try a harder one?</p>
                            <button onClick={() => startNewGame(difficulty)} className="px-10 py-4 bg-white text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest">
                                <RefreshCw size={14} /> NEW GAME
                            </button>
                        </div>
                    )}
                </div>

                {/* Numpad */}
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button 
                                key={n}
                                onClick={() => handleInput(n)}
                                className="w-12 h-12 flex items-center justify-center bg-zinc-950 border border-zinc-800 text-white font-black rounded-xl hover:border-white hover:scale-105 active:scale-95 transition-all"
                            >
                                {n}
                            </button>
                        ))}
                        <button 
                            onClick={() => handleInput(0)}
                            className="col-span-3 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-500/20 transition-all"
                        >
                            <Trash2 size={12} /> Clear Cell
                        </button>
                    </div>

                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hints</span>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-[10px] text-zinc-500 font-medium leading-relaxed">
                                <span className="text-white">•</span> Use keyboard numbers 1-9 to fill cells.
                            </li>
                            <li className="flex gap-2 text-[10px] text-zinc-500 font-medium leading-relaxed">
                                <span className="text-white">•</span> Arrows to navigate the grid.
                            </li>
                            <li className="flex gap-2 text-[10px] text-zinc-500 font-medium leading-relaxed">
                                <span className="text-white">•</span> Highlighted cells share the same row, col, or block.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
