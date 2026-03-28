"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, RotateCcw, Trophy, Gamepad2, Timer, RefreshCw } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dino Run",
    description: "Play an infinite runner Dino game online. Jump over obstacles, survive speed increases, and compete for the high score in this browser-based arcade adventure. Free and private.",
    url: "https://www.assetnest.space/tools/dino",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = 250;
const DINO_WIDTH = 40;
const DINO_HEIGHT = 40;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 50;

export default function DinoRunPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const stateRef = useRef({
        dinoY: GROUND_Y - DINO_HEIGHT,
        dinoVY: 0,
        obstacles: [] as { x: number; h: number }[],
        distance: 0,
        speed: 5,
    });

    useEffect(() => {
        const saved = localStorage.getItem("assetnest_dino_highscore");
        if (saved) setHighScore(parseInt(saved));
        setIsLoaded(true);
    }, []);

    const reset = useCallback(() => {
        stateRef.current = {
            dinoY: GROUND_Y - DINO_HEIGHT,
            dinoVY: 0,
            obstacles: [],
            distance: 0,
            speed: 5,
        };
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    }, []);

    const jump = useCallback(() => {
        if (gameOver) {
            reset();
            return;
        }
        if (!isPlaying) {
            setIsPlaying(true);
            return;
        }
        if (stateRef.current.dinoY === GROUND_Y - DINO_HEIGHT) {
            stateRef.current.dinoVY = JUMP_FORCE;
        }
    }, [gameOver, isPlaying, reset]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [jump]);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        let raf: number;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const update = () => {
            const state = stateRef.current;
            
            // Physics
            state.dinoVY += GRAVITY;
            state.dinoY += state.dinoVY;
            if (state.dinoY > GROUND_Y - DINO_HEIGHT) {
                state.dinoY = GROUND_Y - DINO_HEIGHT;
                state.dinoVY = 0;
            }

            // Move & Spawn Obstacles
            state.distance += state.speed;
            state.speed = 5 + Math.floor(state.distance / 2000) * 0.5;

            if (state.obstacles.length === 0 || state.obstacles[state.obstacles.length - 1].x < 500) {
                if (Math.random() < 0.02) {
                    state.obstacles.push({ x: 800, h: OBSTACLE_HEIGHT + Math.random() * 20 });
                }
            }

            state.obstacles = state.obstacles.filter(o => {
                o.x -= state.speed;
                
                // Collision Detection
                const dinoBox = { x: 50, y: state.dinoY, w: DINO_WIDTH, h: DINO_HEIGHT };
                const obsBox = { x: o.x + 5, y: GROUND_Y - o.h, w: OBSTACLE_WIDTH - 10, h: o.h };

                if (
                    dinoBox.x < obsBox.x + obsBox.w &&
                    dinoBox.x + dinoBox.w > obsBox.x &&
                    dinoBox.y < obsBox.y + obsBox.h &&
                    dinoBox.h + dinoBox.y > obsBox.y
                ) {
                    setGameOver(true);
                    if (Math.floor(state.distance/10) > highScore) {
                        setHighScore(Math.floor(state.distance/10));
                        localStorage.setItem("assetnest_dino_highscore", Math.floor(state.distance/10).toString());
                    }
                }

                return o.x > -OBSTACLE_WIDTH;
            });

            setScore(Math.floor(state.distance / 10));

            // Draw
            ctx.clearRect(0, 0, 800, 400);
            
            // Ground
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(800, GROUND_Y);
            ctx.stroke();

            // Dino
            ctx.save();
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(50 + DINO_WIDTH / 2, state.dinoY + DINO_HEIGHT / 2);
            ctx.scale(-1, 1); // Flip horizontally to face right
            ctx.fillText('🦖', 0, 0);
            ctx.restore();
            
            // Obstacles
            state.obstacles.forEach(o => {
                ctx.font = '30px serif';
                ctx.fillText('🔥', o.x + OBSTACLE_WIDTH / 2, GROUND_Y - o.h / 2);
            });

            if (!gameOver) raf = requestAnimationFrame(update);
        };

        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, gameOver, highScore]);

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
                        className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all"
                        title="Help & FAQ"
                    >
                        <Info size={10} />
                    </button>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 uppercase">
                    Dino Run
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Survival is the only mission.
                </p>
            </div>

            <div className="flex items-center gap-6 mb-8 w-full max-w-[500px]">
                <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score</span>
                    <span className="text-2xl font-black text-white tabular-nums">{score}</span>
                </div>
                <div className="flex-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">High</span>
                    <span className="text-2xl font-black text-white tabular-nums">{highScore}</span>
                </div>
            </div>

            <div className="relative group p-4 border-8 border-zinc-900 bg-zinc-950 rounded-[2.5rem] shadow-2xl">
                <canvas 
                    ref={canvasRef} 
                    width={800} height={300} 
                    onClick={jump}
                    className="w-full max-w-[800px] h-auto rounded-xl bg-zinc-950/50 cursor-pointer"
                />

                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[2.2rem]">
                        <button 
                            onClick={reset}
                            className="bg-white text-black text-xs font-black px-12 py-5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                        >
                            <Gamepad2 size={16} /> START ADVENTURE
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-[2.2rem] p-8 text-center animate-in fade-in zoom-in duration-500">
                        <Trophy size={48} className="text-red-500 mb-4 animate-pulse" />
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Grounded!</h2>
                        <p className="text-sm text-zinc-500 mb-10 uppercase font-black tracking-widest">Score: {score}</p>
                        <button 
                            onClick={reset}
                            className="bg-white text-black text-xs font-black px-12 py-5 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={16} /> REBOOT SYSTEM
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800 bg-zinc-900/40 rounded-full">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">Controls</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-black rounded uppercase">SPACE</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-black rounded uppercase">CLICK</span>
               </div>
               <p className="text-xs text-zinc-600 font-medium">Avoid the crimson pillars. Speed increases over distance.</p>
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Dino Run Strategy Briefing"
            >
                <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Edge of Extinction: The Dino Run Experience</h3>
                        <p className="text-base leading-relaxed text-zinc-400 max-w-3xl font-medium">
                            Welcome to <strong>Dino Run</strong>, a high-octane, infinite runner inspired by the classic arcade era. In a world where speed is your only ally, take control of the last surviving dinosaur and navigate a treacherous landscape filled with pillars of flame and rising difficulty. Our browser-based game is built for minimal latency, ensuring your jumps are pixel-perfect every time. Whether you are looking for a quick five-minute break or aim to dominate the high-score leaderboard, Dino Run offers an addictive, rhythmic challenge that is 100% free and private.
                        </p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-4">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black italic">!</span>
                                Game Mechanics
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                    <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide">Dynamic Speed Scaling</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">The further you run, the faster the world moves. Every 2000 distance units, the scroll speed increases, testing your reflexes to their absolute limit.</p>
                                </div>
                                <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                    <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide">Pixel-Perfect Collision</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">We use specialized bounding-box detection to ensure that your survival depends entirely on your timing—not random glitches.</p>
                                </div>
                            </div>
                        </section>
                        
                        <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                                <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black italic">?</span>
                                How to Surpass your Best
                            </h3>
                            <ul className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                                <li className="flex gap-3">
                                    <span className="text-red-500 shrink-0">»</span>
                                    <div><strong className="text-zinc-200">The Space Advantage:</strong> Use the spacebar for more tactical jumps. Tapping for shorter hops can sometimes be safer than long leaps when obstacles are bunched together.</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 shrink-0">»</span>
                                    <div><strong className="text-zinc-200">Rhythm Mastery:</strong> Dino Run is as much about sound and rhythm as it is about sight. Get into a flow state to predict obstacle spawns naturally.</div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 shrink-0">»</span>
                                    <div><strong className="text-zinc-200">Visual Focus:</strong> Try soft-focusing on the middle of the screen rather than looking directly at the dino or the far right edge. This helps track incoming threats more effectively at high speeds.</div>
                                </li>
                            </ul>
                        </section>
                    </div>
                    
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 bg-zinc-950/30 border border-zinc-900 rounded-[3rem] p-10 md:p-14">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Strategic Briefing (FAQ)</h3>
                        <Accordion>
                            <AccordionItem title="Is this game free forever?">
                                Yes. Dino Run is a part of the AssetNest free utility suite. No ads, no tracking, and no cost to play, ever.
                            </AccordionItem>
                            <AccordionItem title="Does speed ever stop increasing?">
                                The speed continues to scale based on your total distance, meaning there is no theoretical ceiling to the difficulty—only your own skill.
                            </AccordionItem>
                            <AccordionItem title="Is my progress saved?">
                                Your highest score is stored in your local browser storage. This ensures your legacy remains intact between sessions without needing an account.
                            </AccordionItem>
                            <AccordionItem title="Does it work on mobile?">
                                Absolutely. Simply tap the canvas area on your smartphone to jump. The game is optimized for smooth performance on both iOS and Android browsers.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}
