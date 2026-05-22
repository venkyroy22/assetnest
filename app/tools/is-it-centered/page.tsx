"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Play, Maximize2, Info } from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { motion, AnimatePresence } from "framer-motion";

type RoundState = "intro" | "playing" | "result" | "game_over" | "fail_splat";

const SHAPES = [
    { name: "Square", color: "#38bdf8", elements: [{ css: "w-48 h-48 sm:w-56 sm:h-56 bg-sky-400" }] },
    { name: "Rectangle", color: "#2dd4bf", elements: [{ css: "w-64 h-36 sm:w-72 sm:h-40 bg-teal-400" }] },
    { name: "Diamond", color: "#e879f9", elements: [{ css: "w-48 h-48 sm:w-56 sm:h-56 bg-fuchsia-400 rotate-45" }] },
    { name: "Circle", color: "#34d399", elements: [{ css: "w-48 h-48 sm:w-56 sm:h-56 bg-emerald-400 rounded-full" }] },
    { name: "Cross", color: "#60a5fa", elements: [
        { css: "w-64 h-16 sm:w-72 sm:h-20 bg-blue-400/80 absolute rotate-45" },
        { css: "w-64 h-16 sm:w-72 sm:h-20 bg-blue-400/80 absolute -rotate-45" }
    ]},
    { name: "Offset", color: "#2dd4bf", elements: [
        { css: "w-36 h-56 sm:w-40 sm:h-64 bg-teal-400/70 absolute -translate-x-10 translate-y-3" },
        { css: "w-36 h-56 sm:w-40 sm:h-64 bg-teal-400/70 absolute translate-x-10 -translate-y-3" }
    ]},
    { name: "Tri-Combo", color: "#fbbf24", elements: [
        { css: "w-48 h-48 sm:w-56 sm:h-56 bg-amber-400/90 rounded-full absolute" },
        { css: "w-64 h-16 sm:w-72 sm:h-18 bg-amber-400/50 absolute -translate-y-24 sm:-translate-y-32" },
        { css: "w-16 h-64 sm:w-18 sm:h-72 bg-amber-400/50 absolute translate-x-24 sm:translate-x-32" }
    ]},
    { name: "Intersect", color: "#818cf8", elements: [
        { css: "w-56 h-28 sm:w-64 sm:h-32 bg-indigo-400 absolute" },
        { css: "w-28 h-56 sm:w-32 sm:h-64 bg-indigo-400/60 absolute" }
    ]},
    { name: "T-Shape", color: "#fb7185", elements: [
        { css: "w-48 h-18 sm:w-56 sm:h-20 bg-rose-400 absolute" },
        { css: "w-18 h-48 sm:w-20 sm:h-56 bg-rose-400/60 absolute translate-y-16 sm:translate-y-20 scale-x-110" }
    ]},
];

const PoopIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <defs>
            <linearGradient id="poopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8D6E63" />
                <stop offset="50%" stopColor="#5D4037" />
                <stop offset="100%" stopColor="#3E2723" />
            </linearGradient>
            <filter id="poopGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <motion.g
            animate={{ 
                rotate: [0, -4, 4, -4, 0],
                scale: [1, 1.05, 1, 1.05, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* The main swirl */}
            <path fill="url(#poopGradient)" filter="url(#poopGlow)" d="M79.783,50.325C79.099,54.719,76.759,58.17,72.79,60.602C67.962,63.561,60.507,65,50,65S32.038,63.561,27.21,60.602C23.242,58.17,20.902,54.719,20.217,50.325C13.107,53.978,10,59.199,10,65C10,76.046,21.242,85,50,85S90,76.046,90,65C90,59.199,86.893,53.978,79.783,50.325Z"/>
            <path fill="url(#poopGradient)" d="M25,47.5C25,54.404,29.526,60,50,60S75,54.404,75,47.5C75,42.582,72.697,38.329,63.972,36.288C61.916,42.475,56.922,47.333,50.649,49.186C47.833,50.019,45,47.937,45,45L45,45C53.284,45,60,38.284,60,30C60,21.716,53.284,15,45,15C45,30,25,35,25,47.5Z"/>
            
            {/* Highlights */}
            <path d="M45,20 C35,22 30,30 30,40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.2" fill="none" />
            <path d="M15,65 C15,75 25,80 50,80" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.1" fill="none" />

            {/* Face */}
            <circle cx="40" cy="65" r="4" fill="white" />
            <circle cx="60" cy="65" r="4" fill="white" />
            <motion.path 
                animate={{ d: ["M42,75 Q50,80 58,75", "M42,76 Q50,82 58,76", "M42,75 Q50,80 58,75"] }}
                transition={{ duration: 2, repeat: Infinity }}
                stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" 
            />
        </motion.g>
    </svg>
);

const HappyIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none">
        <defs>
            <radialGradient id="faceGradientHappy" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFECB3" />
                <stop offset="70%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FFB300" />
            </radialGradient>
            <filter id="eyeGlow">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#faceGradientHappy)" stroke="#FF8F00" strokeWidth="1" />
        
        {/* Shine */}
        <circle cx="35" cy="30" r="15" fill="white" fillOpacity="0.2" />

        <motion.g 
            animate={{ 
                x: [0, 0, -5, -5, 0, 0, 5, 5, 0], 
                y: [0, 0, -8, -8, 0, 0, 8, 8, 0] 
            }} 
            transition={{ 
                duration: 6, 
                repeat: Infinity, 
                times: [0, 0.1, 0.25, 0.35, 0.5, 0.6, 0.75, 0.85, 1],
                ease: "easeInOut" 
            }}
        >
            <g filter="url(#eyeGlow)">
                <circle cx="38" cy="46" r="6" fill="#4E342E" />
                <circle cx="62" cy="46" r="6" fill="#4E342E" />
                <circle cx="36" cy="44" r="2" fill="white" />
                <circle cx="60" cy="44" r="2" fill="white" />
            </g>
            <motion.path 
                animate={{ scaleY: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                d="M30,65 Q50,90 70,65 Q50,75 30,65 Z" 
                fill="white" 
            />
        </motion.g>
    </svg>
);

const SadIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none">
        <defs>
            <radialGradient id="faceGradientSad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="100%" stopColor="#E65100" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#faceGradientSad)" stroke="#BF360C" strokeWidth="1" />
        
        {/* Sweat drop? Or just shine */}
        <circle cx="65" cy="30" r="10" fill="white" fillOpacity="0.1" />

        <motion.g 
            animate={{ 
                x: [0, 0, 5, 5, 0, 0, -5, -5, 0], 
                y: [0, 0, -8, -8, 0, 0, 8, 8, 0] 
            }} 
            transition={{ 
                duration: 6, 
                repeat: Infinity, 
                times: [0, 0.1, 0.25, 0.35, 0.5, 0.6, 0.75, 0.85, 1],
                ease: "easeInOut" 
            }}
        >
            <circle cx="38" cy="46" r="6" fill="#311B92" />
            <circle cx="62" cy="46" r="6" fill="#311B92" />
            
            <motion.path 
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                d="M35,75 Q50,60 65,75" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round" 
                fill="none" 
            />
        </motion.g>
    </svg>
);

const Confetti = () => {
    const particles = Array.from({ length: 40 });
    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ 
                        x: "50%", 
                        y: "100%", 
                        opacity: 1, 
                        scale: Math.random() * 0.5 + 0.5,
                        rotate: 0 
                    }}
                    animate={{ 
                        x: `${Math.random() * 100}%`,
                        y: ["100%", "-20%"],
                        opacity: [1, 1, 0],
                        rotate: Math.random() * 360 + 360
                    }}
                    transition={{ 
                        duration: Math.random() * 2 + 1, 
                        delay: Math.random() * 0.5,
                        ease: "easeOut"
                    }}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{ 
                        backgroundColor: ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#e879f9"][Math.floor(Math.random() * 5)]
                    }}
                />
            ))}
        </div>
    );
};

export default function IsItCenteredPage() {
    const [gameState, setGameState] = useState<RoundState>("intro");
    const [level, setLevel] = useState(1);
    const MAX_LEVELS = 10;

    const [isActuallyCentered, setIsActuallyCentered] = useState(true);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [score, setScore] = useState(0);
    const [levelOrder, setLevelOrder] = useState<number[]>([]);
    const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const startGame = () => {
        setScore(0);
        setLevel(1);
        const order = Array.from({ length: SHAPES.length }, (_, i) => i)
            .sort(() => Math.random() - 0.5);
        setLevelOrder(order);
        generateRound(1, order[0]);
    };

    const generateRound = (lvl: number, shapeIdx: number) => {
        const isCentered = Math.random() > 0.5;
        setIsActuallyCentered(isCentered);
        
        const difficultyFactor = Math.max(0.1, 1 - (lvl / MAX_LEVELS));
        const baseOffset = 12 * difficultyFactor;
        
        if (isCentered) {
            setOffsetX(0);
            setOffsetY(0);
        } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = baseOffset + (Math.random() * 2);
            setOffsetX(Math.cos(angle) * dist);
            setOffsetY(Math.sin(angle) * dist);
        }

        setGameState("playing");
        setLastGuessCorrect(null);
    };

    const handleGuess = (guessIsCentered: boolean) => {
        if (gameState !== "playing") return;

        const correct = guessIsCentered === isActuallyCentered;
        setLastGuessCorrect(correct);

        if (correct) {
            const newScore = score + 1;
            setScore(newScore);
            if (level === MAX_LEVELS) {
                setGameState("result");
            } else {
                setGameState("result");
            }
        } else {
            setGameState("fail_splat");
            setTimeout(() => {
                setGameState("game_over");
            }, 2500);
        }
    };

    const handleNextRound = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        generateRound(nextLevel, levelOrder[(nextLevel - 1) % levelOrder.length]);
    };

    const currentShape = (levelOrder.length > 0 && level <= levelOrder.length) 
        ? SHAPES[levelOrder[(level - 1) % levelOrder.length]] 
        : SHAPES[0];

    const getSarcasticRemark = (s: number) => {
        if (s === 0) return "Did you even open your eyes?";
        if (s < 3) return "Wow. Even a blind pigeon could do better.";
        if (s < 6) return "Average. The word you're looking for is 'mediocre'.";
        if (s < 9) return "Almost a designer. Almost.";
        if (s === 9) return "So close. Yet so far. Absolutely heartbreaking.";
        return "Impossible. You must be cheating, or you're a god.";
    };

    const [isYesHovered, setIsYesHovered] = useState(false);
    const [isNoHovered, setIsNoHovered] = useState(false);

    const getBgColor = (color: string) => color + "20";

    const isSuccess = score === MAX_LEVELS;

    return (
        <div 
            className="h-[calc(100vh-80px)] flex flex-col items-center p-4 sm:p-6 pb-20 sm:pb-28 font-sans overflow-hidden relative transition-colors duration-1000"
            style={{ backgroundColor: (gameState === "playing" || gameState === "result") ? getBgColor(currentShape.color) : "#09090b" }}
        >
            {gameState === "game_over" && isSuccess && <Confetti />}
            
            <div className="w-full max-w-6xl flex items-center justify-between mb-4 sm:mb-6 relative z-50">
                <div className="flex flex-col">
                    <div className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 mb-1">AssetNest</div>
                    <div className="text-2xl font-black text-[#f0ede8] leading-none tracking-tighter">Is It Centered?</div>
                </div>

                {gameState !== "intro" && gameState !== "game_over" && (
                    <div className="flex gap-8 items-center">
                        <button 
                            onClick={() => setIsHelpOpen(true)}
                            className="p-2 text-zinc-500 hover:text-[#f0ede8] hover:bg-white/[0.06] rounded-full transition-all border border-transparent hover:border-white/[0.12]"
                            title="How to play"
                        >
                            <Info size={20} />
                        </button>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Score</span>
                            <span className="text-xl font-black text-[#f0ede8]">{score} / {MAX_LEVELS}</span>
                        </div>
                    </div>
                )}

                {gameState === "intro" && (
                    <div className="flex items-center">
                        <button 
                            onClick={() => setIsHelpOpen(true)}
                            className="p-3 text-zinc-500 hover:text-[#f0ede8] hover:bg-white/[0.06] rounded-full transition-all border border-transparent hover:border-white/[0.12]"
                            title="How to play"
                        >
                            <Info size={24} />
                        </button>
                    </div>
                )}
            </div>

            {gameState === "intro" && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-xl text-center animate-in fade-in zoom-in">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10">
                        <Maximize2 size={32} className="text-emerald-500" strokeWidth={1.5} />
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-[#f0ede8] tracking-tighter mb-6">Master your eye.</h1>
                    <p className="text-zinc-500 font-medium mb-12 text-lg tracking-wide">
                        The dot is either perfectly centered algebraically, or slightly off. <br/>Trust your vision. One mistake and you're out.
                    </p>
                    <button 
                        onClick={startGame}
                        className="px-14 py-5 bg-[#f0ede8] text-[#141414] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
                    >
                        Begin Training <Play size={18} fill="currentColor" />
                    </button>
                </div>
            )}

            {(gameState === "playing" || gameState === "result" || gameState === "game_over" || gameState === "fail_splat") && (
                <>
                    {(gameState === "playing" || gameState === "result" || gameState === "fail_splat") && (
                        <div className="flex-1 w-full flex items-center justify-between gap-4 max-w-6xl mx-auto">
                            
                            <div className="w-1/4 flex flex-col items-center">
                                <button 
                                    onClick={() => handleGuess(true)}
                                    onMouseEnter={() => setIsYesHovered(true)}
                                    onMouseLeave={() => setIsYesHovered(false)}
                                    disabled={gameState !== "playing"}
                                    className={`group flex flex-col items-center gap-4 transition-all ${gameState === "playing" ? "hover:scale-110 active:scale-90" : "opacity-0 pointer-events-none cursor-default"}`}
                                >
                                    <div className={`w-20 h-20 sm:w-28 sm:h-28 bg-[#1c1c1c] rounded-[2rem] flex items-center justify-center border border-white/[0.07] shadow-2xl transition-all group-hover:bg-white/[0.06] group-hover:border-white/[0.12] p-5 overflow-hidden relative ${isYesHovered ? 'shadow-[0_0_40px_rgba(52,211,153,0.15)]' : ''}`}>
                                        <HappyIcon className="w-full h-full" />
                                    </div>
                                    <span className={`text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] transition-opacity ${isYesHovered ? 'opacity-100' : 'opacity-40'}`}>Yes</span>
                                </button>
                            </div>

                            <div className="flex-1 w-full flex flex-col items-center justify-center relative">
                                <div className={`relative w-[20rem] h-[20rem] sm:w-[24rem] sm:h-[24rem] flex items-center justify-center transition-all duration-700 ${gameState === "result" ? "scale-90" : "scale-100"}`}>
                                    <div className="relative flex items-center justify-center transition-transform duration-300">
                                        {currentShape.elements.map((el, i) => (
                                            <div 
                                                key={i}
                                                className={`${el.css} shadow-[0_0_80px_rgba(0,0,0,0.15)] flex items-center justify-center`}
                                            />
                                        ))}

                                        <div 
                                            className="w-1.5 h-1.5 bg-[#141414] rounded-full absolute z-20"
                                            style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                                        />

                                        {(gameState === "result" || gameState === "fail_splat") && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[30] animate-in fade-in duration-500 min-w-full min-h-full">
                                                <div className="absolute w-[120%] h-[1px] bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                                                <div className="absolute h-[120%] w-[1px] bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_white]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/4 flex flex-col items-center">
                                <button 
                                    onClick={() => handleGuess(false)}
                                    onMouseEnter={() => setIsNoHovered(true)}
                                    onMouseLeave={() => setIsNoHovered(false)}
                                    disabled={gameState !== "playing"}
                                    className={`group flex flex-col items-center gap-4 transition-all ${gameState === "playing" ? "hover:scale-110 active:scale-90" : "opacity-0 pointer-events-none cursor-default"}`}
                                >
                                    <div className={`w-20 h-20 sm:w-28 sm:h-28 bg-[#1c1c1c] rounded-[2rem] flex items-center justify-center border border-white/[0.07] shadow-2xl transition-all group-hover:bg-white/[0.06] group-hover:border-white/[0.12] p-5 relative ${isNoHovered ? 'shadow-[0_0_40px_rgba(239,68,68,0.15)]' : ''}`}>
                                        <SadIcon className="w-full h-full" />
                                    </div>
                                    <span className={`text-red-500 font-black uppercase tracking-[0.2em] text-[10px] transition-opacity ${isNoHovered ? 'opacity-100' : 'opacity-40'}`}>No</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mb-auto pb-4 flex flex-col items-center gap-4">
                        
                        {gameState === "playing" && (
                            <h2 className="text-2xl md:text-3xl font-black text-[#f0ede8] tracking-widest uppercase animate-in fade-in slide-in-from-bottom-2 text-center opacity-70">
                                Is it centered?
                            </h2>
                        )}

                        {gameState === "result" && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="text-xs font-black uppercase tracking-[0.5em] text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Target Secured</div>
                                <button 
                                    onClick={level === MAX_LEVELS ? () => setGameState("game_over") : handleNextRound}
                                    className="px-20 py-6 bg-[#f0ede8] text-[#141414] font-black uppercase tracking-[0.2em] text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
                                >
                                    {level === MAX_LEVELS ? "Finish Training" : `Proceed to Level ${level + 1}`}
                                </button>
                            </div>
                        )}

                        {gameState === "game_over" && (
                            <div className="flex-1 flex flex-col items-center justify-center max-w-lg text-center animate-in fade-in zoom-in duration-500">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 mb-6 ${isSuccess ? "text-emerald-400" : "text-red-500"}`}>
                                    {isSuccess ? <HappyIcon className="w-full h-full" /> : <SadIcon className="w-full h-full" />}
                                </div>
                                <div className={`text-[9px] uppercase tracking-[0.4em] font-black ${isSuccess ? "text-emerald-500" : "text-zinc-500"} mb-2`}>
                                    {isSuccess ? "Calibration Complete" : "Training Terminated"}
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#f0ede8] tracking-tighter mb-2">
                                    {isSuccess ? "Absolute Perfection." : "You Failed."}
                                </h2>
                                <p className="text-zinc-500 font-medium mb-5 sm:mb-8 text-sm sm:text-base italic px-4">
                                    "{getSarcasticRemark(score)}"
                                </p>
                                
                                <div className={`bg-[#1c1c1c]/40 border ${isSuccess ? "border-emerald-500/30" : "border-white/[0.06]"} rounded-2xl p-4 sm:p-8 w-full max-w-sm mb-6 sm:mb-8 flex flex-col items-center shadow-2xl`}>
                                    <div className={`text-4xl sm:text-5xl font-black ${isSuccess ? "text-emerald-400" : "text-[#f0ede8]"} mb-1`}>{score}</div>
                                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-zinc-500">Final Precision Score</div>
                                </div>

                                <button 
                                    onClick={startGame}
                                    className="px-10 py-4 bg-[#f0ede8] text-[#141414] font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3"
                                >
                                    {isSuccess ? "Train Again" : "Try Again"} <RotateCcw size={16} />
                                </button>
                                <button 
                                    onClick={() => setGameState("intro")}
                                    className="mt-6 text-zinc-600 font-bold uppercase text-[10px] tracking-widest hover:text-zinc-400 transition-colors"
                                >
                                    Back to Menu
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Cinematic Background Branding */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-[0.02] scale-75 md:scale-100">
                <span className="text-[12vw] font-black text-[#f0ede8] whitespace-nowrap uppercase tracking-tighter italic leading-none">
                    Is It Centered?
                </span>
            </div>

            <AnimatePresence>
                {gameState === "fail_splat" && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141414]/40 backdrop-blur-[2px]"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -20, y: -400 }}
                            animate={{ 
                                scale: [0, 1.2, 1],
                                rotate: [-20, 15, -5, 0],
                                y: [ -400, 0, 0, 1000 ], 
                            }}
                            transition={{
                                y: {
                                    duration: 2.5,
                                    times: [0, 0.12, 0.4, 1],
                                    ease: ["easeOut", "linear", "easeIn"],
                                },
                                scale: {
                                    duration: 0.4,
                                    times: [0, 0.6, 1],
                                    ease: "easeOut"
                                },
                                rotate: {
                                    duration: 0.8,
                                    ease: "easeOut"
                                }
                            }}
                            className="w-[30rem] h-[30rem] sm:w-[40rem] sm:h-[40rem] flex items-center justify-center relative"
                        >
                            <PoopIcon className="w-full h-full drop-shadow-[0_20px_100px_rgba(0,0,0,0.9)]" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <HelpModal 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
                title="Is It Centered? Guide"
            >
                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-bold text-[#f0ede8] mb-3 tracking-tight">The Ultimate Design Test</h3>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            A single black dot is placed within a geometric shape. Is it perfectly centered, or is it off by a few pixels?
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                            <h4 className="text-emerald-400 font-bold mb-2">Perfect Balance</h4>
                            <p className="text-zinc-500 text-sm">Mathematically calculated to sit at the exact center point of the primary shape.</p>
                        </div>
                        <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20">
                            <h4 className="text-red-400 font-bold mb-2">Deceptive Offset</h4>
                            <p className="text-zinc-500 text-sm">Shifted slightly using randomized vectors to trick your optical perception.</p>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xl font-bold text-[#f0ede8] mb-3 tracking-tight">Rules of Engagement</h3>
                        <ul className="space-y-4 text-zinc-400 list-none p-0">
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#f0ede8] font-bold text-sm">1</span>
                                <span>Observe the shape and the dot carefully.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#f0ede8] font-bold text-sm">2</span>
                                <span>Click the <strong className="text-[#f0ede8]">Happy</strong> face (Yes) if you think it's centered.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-none w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#f0ede8] font-bold text-sm">3</span>
                                <span>Click the <strong className="text-[#f0ede8]">Sad</strong> face (No) if you think it's off.</span>
                            </li>
                            <li className="flex gap-4 italic text-zinc-500 border-l-2 border-white/[0.07] pl-4 ml-4">
                                One wrong move and the game ends immediately. Precision is everything.
                            </li>
                        </ul>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
