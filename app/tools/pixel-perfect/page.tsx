"use client";

import { useState, useRef, useEffect } from "react";
import { Maximize, RotateCcw, ArrowRight, Play, CheckCircle2, Info } from "lucide-react";
import HelpModal from "@/components/HelpModal";

type RoundState = "intro" | "playing" | "result" | "game_over";
type GameMode = "classic" | "training";

export default function PixelPerfectPage() {
    const [gameState, setGameState] = useState<RoundState>("intro");
    const [gameMode, setGameMode] = useState<GameMode>("classic");
    const [round, setRound] = useState(1);
    const MAX_ROUNDS = 5;
    const [roundScores, setRoundScores] = useState<number[]>([]);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const getSarcasticComment = (offBy: number) => {
        const pools = {
            perfect: [
                { text: "Flawless. Are you a robot?", emoji: "🤖" },
                { text: "Pixel perfect. Impressive.", emoji: "🎯" },
                { text: "Your eyes are calibrated.", emoji: "✨" },
                { text: "Mathematical precision.", emoji: "📐" },
                { text: "You just cheated, right?", emoji: "🤨" },
                { text: "Subpixel perfection.", emoji: "🌈" },
                { text: "Teach me your ways.", emoji: "🙏" },
                { text: "Absolute legend.", emoji: "🏆" },
                { text: "Zero deviation. Wow.", emoji: "🤯" },
                { text: "I can't even be mad.", emoji: "👑" }
            ],
            great: [
                { text: "Okay, we see you.", emoji: "👀" },
                { text: "A designer's eye.", emoji: "💅" },
                { text: "Solid estimation.", emoji: "💪" },
                { text: "Almost scary accurate.", emoji: "😱" },
                { text: "You've done this before.", emoji: "🕵️‍♂️" },
                { text: "Very respectable.", emoji: "🤝" },
                { text: "Within the margin of error.", emoji: "📉" },
                { text: "Your screen is clean.", emoji: "🧼" },
                { text: "Pro status incoming.", emoji: "🔥" },
                { text: "Sharp as a needle.", emoji: "📍" },
                { text: "Laser focused.", emoji: "🔫" },
                { text: "Top-tier vision.", emoji: "🦅" }
            ],
            okay: [
                { text: "Not terrible, but not great.", emoji: "🤷‍♂️" },
                { text: "Almost there.", emoji: "🤏" },
                { text: "Acceptable... barely.", emoji: "🤨" },
                { text: "Getting the hang of it?", emoji: "🛹" },
                { text: "A bit fuzzy on the edges.", emoji: "☁️" },
                { text: "Passable for a junior.", emoji: "👶" },
                { text: "Close enough for government work.", emoji: "🏛️" },
                { text: "You missed a spot.", emoji: "🧼" },
                { text: "Middle of the road.", emoji: "🛣️" },
                { text: "Not winning any awards.", emoji: "🥉" },
                { text: "The definition of fine.", emoji: "😐" },
                { text: "At least you're consistent.", emoji: "🔄" }
            ],
            bad: [
                { text: "Did you even try?", emoji: "🤨" },
                { text: "Not even close.", emoji: "🚫" },
                { text: "Maybe use a ruler?", emoji: "📏" },
                { text: "Yikes.", emoji: "😬" },
                { text: "My toddler could do better.", emoji: "🧸" },
                { text: "Way off the map.", emoji: "🗺️" },
                { text: "Are you blinking?", emoji: "😑" },
                { text: "Total overshoot.", emoji: "🚀" },
                { text: "Calculated error?", emoji: "📱" },
                { text: "A disaster in the making.", emoji: "🌪️" },
                { text: "Nice try, but no.", emoji: "👎" },
                { text: "You might need glasses.", emoji: "👓" },
                { text: "Optical illusion, right?", emoji: "🌀" }
            ],
            terrible: [
                { text: "Great! said nobody.", emoji: "💀" },
                { text: "No. Just... no.", emoji: "🛑" },
                { text: "Try tomorrow. Or never.", emoji: "🗑️" },
                { text: "My eyes hurt.", emoji: "🙈" },
                { text: "Catastrophic failure.", emoji: "🔥" },
                { text: "Are you even looking?", emoji: "🕶️" },
                { text: "Delete your browser.", emoji: "💻" },
                { text: "A tragedy in pixels.", emoji: "🎭" },
                { text: "Wait, what happened?", emoji: "❓" },
                { text: "Is the monitor off?", emoji: "🔌" },
                { text: "Please stop.", emoji: "🛑" },
                { text: "A random guess, clearly.", emoji: "🎲" },
                { text: "You broke the scale.", emoji: "📉" },
                { text: "Embarrassing.", emoji: "😳" },
                { text: "A visual nightmare.", emoji: "👹" }
            ]
        };

        let pool;
        if (offBy === 0) pool = pools.perfect;
        else if (offBy <= 15) pool = pools.great;
        else if (offBy <= 60) pool = pools.okay;
        else if (offBy <= 150) pool = pools.bad;
        else pool = pools.terrible;

        // Use a simple hash of the current round/score to keep it stable for this specific result
        const index = (offBy + round) % pool.length;
        return pool[index];
    };

    const [targetW, setTargetW] = useState(0);
    const [targetH, setTargetH] = useState(0);

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    
    // Results
    const [drawnW, setDrawnW] = useState(0);
    const [drawnH, setDrawnH] = useState(0);
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    
    // Detailed Accuracies
    const [totalWDiff, setTotalWDiff] = useState(0);
    const [totalHDiff, setTotalHDiff] = useState(0);
    const [totalTargetW, setTotalTargetW] = useState(0);
    const [totalTargetH, setTotalTargetH] = useState(0);
    
    // For calculating the bounding box correctly
    const [boxStart, setBoxStart] = useState({ x: 0, y: 0 });

    // Best Score tracking
    const [bestScore, setBestScore] = useState<number | null>(null);

    const boardRef = useRef<HTMLDivElement>(null);

    const [isNewRecord, setIsNewRecord] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("assetnest_pixel_perfect_best");
        if (saved) setBestScore(parseInt(saved, 10));
    }, []);

    // Update best score when game is over
    useEffect(() => {
        if (gameState === "game_over") {
            const currentTotal = totalScore;
            if (bestScore === null || currentTotal < bestScore) {
                setBestScore(currentTotal);
                setIsNewRecord(true);
                localStorage.setItem("assetnest_pixel_perfect_best", currentTotal.toString());
            } else {
                setIsNewRecord(false);
            }
        }
    }, [gameState, totalScore, bestScore]);

    const generateRound = (r: number) => {
        let w, h;
        if (gameMode === "training") {
            // Foundational sizes for training
            const sizes = [50, 100, 200, 300, 400];
            const size = sizes[r - 1] || 100;
            // Mix it up slightly so it's not always square but still foundational
            w = size;
            h = r % 2 === 0 ? Math.round(size * 0.5) : size;
        } else {
            w = Math.floor(Math.random() * 250) + 50; 
            h = Math.floor(Math.random() * 250) + 50;
        }
        
        setTargetW(w);
        setTargetH(h);
        setGameState("playing");
        setDrawnW(0);
        setDrawnH(0);
        setIsDrawing(false);
    };

    const startGame = (mode: GameMode = "classic") => {
        setGameMode(mode);
        setRound(1);
        setTotalScore(0);
        setRoundScores([]);
        setTotalWDiff(0);
        setTotalHDiff(0);
        setTotalTargetW(0);
        setTotalTargetH(0);
        setIsNewRecord(false);
        generateRound(1);
        // Force scroll to top when starting to ensure header is correctly framed
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (gameState !== "playing") return;
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing) return;
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Clamp to board bounds
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        const w = Math.abs(currentPos.x - startPos.x);
        const h = Math.abs(currentPos.y - startPos.y);
        
        // Prevent accidental clicks
        if (w < 10 || h < 10) {
            return;
        }

        const finalW = Math.round(w);
        const finalH = Math.round(h);
        setDrawnW(finalW);
        setDrawnH(finalH);
        
        // Final position of user's box
        setBoxStart({
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y)
        });
        
        // Scoring logic (Integer-locked for consistency with UI labels)
        const diffW = Math.abs(targetW - finalW);
        const diffH = Math.abs(targetH - finalH);
        const penalty = diffW + diffH;

        setScore(penalty);
        setTotalScore(prev => prev + penalty);
        setRoundScores(prev => [...prev, penalty]);
        setTotalWDiff(prev => prev + diffW);
        setTotalHDiff(prev => prev + diffH);
        setTotalTargetW(prev => prev + targetW);
        setTotalTargetH(prev => prev + targetH);
        
        setGameState("result");
    };

    const rectLeft = Math.min(startPos.x, currentPos.x);
    const rectTop = Math.min(startPos.y, currentPos.y);
    const rectWidth = Math.abs(currentPos.x - startPos.x);
    const rectHeight = Math.abs(currentPos.y - startPos.y);

    return (
        <div className="h-[calc(100vh-80px)] py-4 px-4 md:px-8 max-w-full flex flex-col pt-4 overflow-hidden">
            
            {/* Pixactly-style Top Header Layer 1 */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-2">
                <div className="w-1/3 flex justify-start">
                    {gameState !== "intro" && (
                        <div className="text-zinc-400 text-sm md:text-base font-medium">
                            Round: <span className="text-white">{round}/{MAX_ROUNDS}</span>
                        </div>
                    )}
                </div>

                <div className="w-1/3 flex justify-center">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        Pixel Perfect
                    </h1>
                </div>

                <div className="w-1/3 flex justify-end gap-3 items-center">
                    <button 
                        onClick={() => setIsHelpOpen(true)}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-all border border-transparent hover:border-zinc-800"
                        title="How to play"
                    >
                        <Info size={20} />
                    </button>
                    {gameState !== "intro" && (
                        <div className="text-zinc-400 text-sm md:text-base font-medium flex items-center gap-2">
                            Total Score: <span className={`font-bold ${totalScore > 0 ? 'text-red-400' : 'text-zinc-300'}`}>{totalScore}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pixactly-style Top Header Layer 2 */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-2 pb-1">
                <div className="w-1/3 flex justify-start"></div>
                
                <div className="w-1/3 flex justify-center gap-8">
                    {gameState !== "intro" && (
                        <div className="text-zinc-300 text-sm md:text-base font-medium items-center flex gap-6 tracking-wide">
                            <span>Width: <strong className="text-white">{targetW}px</strong></span>
                            <span>Height: <strong className="text-white">{targetH}px</strong></span>
                        </div>
                    )}
                </div>

                <div className="w-1/3 flex justify-end">
                    {(gameState !== "intro" || bestScore !== null) && (
                        <div className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider text-right">
                            Best: <span className="text-white ml-1">{bestScore ?? '-'}</span>
                            <div className="text-[8px] opacity-40 mt-0.5 tracking-[0.2em]">Lower is better</div>
                        </div>
                    )}
                </div>
            </div>

            {gameState === "intro" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-700 -mt-24">
                    <div className="relative mb-8">
                        <Maximize size={64} className="text-white" strokeWidth={1} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-tight">
                        Measure by Eye. <br/> Draw by Hand.
                    </h2>
                    <p className="text-zinc-400 text-lg font-medium tracking-wide mb-12">
                        You will be given a target dimension. Draw a box perfectly matching those pixels. 
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <button 
                            onClick={() => startGame("training")}
                            className="flex-1 px-8 py-5 bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-800 transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-sm">Training Mode</span>
                            <span className="text-[10px] text-zinc-500 lowercase font-normal group-hover:text-zinc-300">Guided sizes & visual aids</span>
                        </button>

                        <button 
                            onClick={() => startGame("classic")}
                            className="flex-1 px-8 py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                        >
                            <span className="text-sm">Classic Challenge</span>
                            <span className="text-[10px] text-zinc-500 lowercase font-normal">Pure estimation. 5 rounds.</span>
                        </button>
                    </div>
                </div>
            )}

            {(gameState === "playing" || gameState === "result" || gameState === "game_over") && (
                <>
                    {/* Massive Full-Bleed Drawing Canvas */}
                    <div className="w-full flex-1 min-h-[500px] relative border-t border-zinc-900 rounded-none bg-black overflow-hidden">
                        
                        {/* Training Grid Overlay */}
                        {gameMode === "training" && gameState === "playing" && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                                 style={{ 
                                    backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                                    backgroundSize: '100px 100px'
                                 }} 
                            />
                        )}

                        <div 
                            ref={boardRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={isDrawing ? handleMouseUp : undefined}
                            className={`absolute inset-0 transition-all ${gameState === "playing" ? "cursor-crosshair" : "cursor-default pointer-events-none"}`}
                        >
                            {/* Training Reference Ghost (Shifted slightly up from center) */}
                            {gameMode === "training" && gameState === "playing" && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-1000 -translate-y-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div 
                                            className="border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] rounded-sm relative"
                                            style={{ width: targetW, height: targetH }}
                                        >
                                            <div className="absolute inset-[-1px] border border-emerald-500/10 animate-pulse rounded-sm" />
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/20">
                                            Training Guide
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* The User's Live Drawn Box */}
                            {(isDrawing || gameState === "result" || gameState === "game_over") && (
                                <div 
                                    className="absolute border border-blue-500 bg-blue-500/10 transition-none"
                                    style={{
                                        left: `${gameState === "playing" ? rectLeft : boxStart.x}px`,
                                        top:  `${gameState === "playing" ? rectTop : boxStart.y}px`,
                                        width: `${gameState === "playing" ? rectWidth : drawnW}px`,
                                        height: `${gameState === "playing" ? rectHeight : drawnH}px`,
                                    }}
                                >
                                    {/* Dimensions tag */}
                                    {gameState !== "playing" && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-blue-400 opacity-70">
                                            {drawnW}×{drawnH}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* The Overlay Correct Box (Shows After Draw) */}
                            {(gameState === "result" || gameState === "game_over") && (
                                <div 
                                    className="absolute border-[2px] border-dashed border-emerald-500 bg-emerald-500/5 animate-in zoom-in duration-500"
                                    style={{
                                        left: `${boxStart.x}px`,
                                        top: `${boxStart.y}px`,
                                        width: `${targetW}px`,
                                        height: `${targetH}px`,
                                    }}
                                >
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-emerald-500 opacity-70">
                                        TARGET: {targetW}×{targetH}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pixactly-style Centered Overlay Result Screen */}
                    {gameState === "result" && !isDrawing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-auto animate-in fade-in zoom-in duration-500">
                            
                            <div className="relative z-10 text-center flex flex-col items-center gap-1 max-w-xl mx-auto -mt-72">
                                <h3 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
                                    {getSarcasticComment(score).text}
                                </h3>
                                <div className="text-6xl md:text-7xl my-2">
                                    {getSarcasticComment(score).emoji}
                                </div>
                                
                                <div className="text-zinc-400 mt-2 mb-4 text-base font-medium">
                                    You were off by <span className="text-red-400 font-bold">{score}</span>
                                </div>
                                
                                <div className="flex gap-8 text-xs font-bold text-zinc-500 mb-8 uppercase tracking-widest">
                                    <span>
                                        Width: <strong className="text-white ml-1">{drawnW}px</strong> 
                                        <span className={`ml-2 ${drawnW - targetW === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            ({drawnW - targetW > 0 ? '+' : ''}{drawnW - targetW})
                                        </span>
                                    </span>
                                    <span>
                                        Height: <strong className="text-white ml-1">{drawnH}px</strong> 
                                        <span className={`ml-2 ${drawnW - targetW === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            ({drawnH - targetH > 0 ? '+' : ''}{drawnH - targetH})
                                        </span>
                                    </span>
                                </div>

                                <button 
                                    onClick={() => { 
                                        if (round < MAX_ROUNDS) {
                                            setRound(r => r + 1); 
                                            generateRound(round + 1); 
                                        } else {
                                            setGameState("game_over");
                                        }
                                    }}
                                    className="px-14 py-4 bg-[#1a1a1a] hover:bg-white hover:text-black border border-zinc-800 hover:border-white text-white font-black uppercase tracking-widest rounded-md transition-all"
                                >
                                    {round < MAX_ROUNDS ? "Next" : "See Results"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen matching Pixactly */}
                    {gameState === "game_over" && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in p-8 text-center">
                            <h2 className="text-xl md:text-2xl font-medium text-zinc-400 mb-2 uppercase tracking-[0.2em]">Your total score is</h2>
                            
                            <div className="relative group">
                                <div className="text-8xl md:text-[10rem] font-serif italic text-white mb-12">
                                    {totalScore}!
                                </div>
                                {isNewRecord && (
                                    <div className="absolute -top-12 -right-12 bg-white text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] animate-bounce">
                                        New Record
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-20 max-w-4xl">
                                {roundScores.map((s, i) => (
                                    <div key={i} className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
                                        Round {i + 1}: <span className="text-red-400 ml-1">{s}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 mb-16">
                                <p className="text-zinc-400 text-lg md:text-xl font-medium tracking-wide">
                                    You&apos;re more pixact in <strong className="text-white uppercase mx-1">{totalHDiff <= totalWDiff ? 'height' : 'width'}</strong> ({Math.min(totalHDiff, totalWDiff)}) 
                                    than <strong className="text-white uppercase mx-1">{totalHDiff > totalWDiff ? 'height' : 'width'}</strong> ({Math.max(totalHDiff, totalWDiff)}).
                                </p>
                                <p className="text-zinc-600 text-sm font-bold uppercase tracking-[0.3em]">
                                    Pixel practice makes perfect.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => startGame(gameMode)}
                                    className="px-12 py-5 bg-white text-black border border-white font-black uppercase tracking-[0.3em] rounded-md transition-all flex items-center gap-4 text-xs active:scale-95"
                                >
                                    Play again
                                </button>
                                <button 
                                    onClick={() => setGameState("intro")}
                                    className="px-12 py-5 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white font-black uppercase tracking-[0.3em] rounded-md transition-all flex items-center gap-4 text-xs"
                                >
                                    Home
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <HelpModal 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
                title="Pixel Perfect Guide"
            >
                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Challenge Your Eye</h3>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Pixel Perfect is a game of visual estimation. You are tasked with drawing a box that matches the exact width and height provided in pixels.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                            <h4 className="text-white font-bold mb-2">Classic Challenge</h4>
                            <p className="text-zinc-500 text-sm">Pure estimation across 5 rounds. No guides, no training wheels. Just you and the pixels.</p>
                        </div>
                        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                            <h4 className="text-white font-bold mb-2">Training Mode</h4>
                            <p className="text-zinc-500 text-sm">Includes a ghost reference and a 100px grid to help you calibrate your eyes.</p>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">How to Play</h3>
                        <ul className="space-y-4 text-zinc-400 list-none p-0">
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">1</span>
                                <span>Look at the target <strong className="text-white">Width</strong> and <strong className="text-white">Height</strong> in the header area.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">2</span>
                                <span>Click and drag on the canvas to draw your estimated box.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">3</span>
                                <span>Release to see how close you were. Lower scores (total pixels off) are better!</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
