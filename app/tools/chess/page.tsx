"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Crown, RotateCcw, Copy, Play, SkipForward, Swords, History, Maximize, Minimize } from "lucide-react";

// --- Simple AI logic ---
const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function evaluateBoard(game: Chess, color: "w" | "b") {
  let value = 0;
  const fen = game.fen().split(" ")[0];
  for (let i = 0; i < fen.length; i++) {
    const char = fen[i];
    if (char !== "/" && isNaN(parseInt(char))) {
      const isWhite = char === char.toUpperCase();
      const pieceVal = pieceValues[char.toLowerCase()] || 0;
      value += isWhite ? pieceVal : -pieceVal;
    }
  }
  return color === "w" ? value : -value;
}

function getBestMove(game: Chess, depth: number): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;
  
  if (depth === 0) {
    const rIdx = Math.floor(Math.random() * moves.length);
    return moves[rIdx];
  }

  let bestMove = null;
  let bestValue = -9999;
  const color = game.turn();

  for (const move of moves) {
    game.move(move);
    let boardValue = 0;
    
    // Evaluate if checkmate/draw
    if (game.isCheckmate()) {
        boardValue = 9999;
    } else if (game.isDraw()) {
        boardValue = 0;
    } else {
        boardValue = evaluateBoard(game, color);
    }

    // Add slight randomness to break ties naturally
    boardValue += (Math.random() * 2) - 1;

    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }
  return bestMove || moves[0];
}

export default function ChessPage() {
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [gameStatus, setGameStatus] = useState("Playing");
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<"PlayerVsComputer" | "PassAndPlay">("PlayerVsComputer");
  const [computerColor, setComputerColor] = useState<"white" | "black">("black");

  const [aiThinking, setAiThinking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show prompt if not dismissed and not in mobile view (fullscreen is best for desktop)
    if (!localStorage.getItem("chessFullscreenPromptDismissed") && window.innerWidth > 768) {
        setTimeout(() => setShowPrompt(true), 1500);
    }
  }, []);

  function handleAcceptPrompt() {
      setShowPrompt(false);
      localStorage.setItem("chessFullscreenPromptDismissed", "true");
      toggleFullscreen();
  }

  function handleDismissPrompt() {
      setShowPrompt(false);
      localStorage.setItem("chessFullscreenPromptDismissed", "true");
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
  }

  // Status Check
  useEffect(() => {
    if (game.isCheckmate()) setGameStatus("Checkmate");
    else if (game.isStalemate()) setGameStatus("Stalemate");
    else if (game.isDraw()) setGameStatus("Draw");
    else setGameStatus("Playing");
    
    setHistory(game.history());
  }, [game]);

  // AI Move triggered if it's computer's turn
  useEffect(() => {
    if (mode === "PlayerVsComputer" && gameStatus === "Playing" && !game.isGameOver()) {
        const turnColor = game.turn() === "w" ? "white" : "black";
        if (turnColor === computerColor) {
            setAiThinking(true);
            setTimeout(() => {
                const gameCopy = new Chess();
                gameCopy.loadPgn(game.pgn());
                const bestMove = getBestMove(gameCopy, 1);
                if (bestMove) {
                    gameCopy.move(bestMove);
                    setGame(gameCopy);
                }
                setAiThinking(false);
            }, 400);
        }
    }
  }, [game, mode, computerColor, gameStatus]);

  function makeMove(move: { from: string; to: string; promotion?: string }) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) {
    if (!targetSquare || game.isGameOver() || aiThinking) return false;
    
    if (mode === "PlayerVsComputer") {
        const turnColor = game.turn() === "w" ? "white" : "black";
        if (turnColor === computerColor) return false;
    }

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    return move;
  }

  function resetGame() {
    setGame(new Chess());
    setGameStatus("Playing");
    setHistory([]);
    setBoardOrientation("white");
    setComputerColor("black");
  }

  function copyFEN() {
    navigator.clipboard.writeText(game.fen());
    alert("FEN copied to clipboard");
  }

  return (
    <div ref={containerRef} className={`bg-black text-white p-6 ${isFullscreen ? 'h-screen overflow-y-auto w-screen' : 'min-h-screen pb-32'}`}>
      <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-12 mt-10">
        
        {/* Left Column: Board */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
                <Crown className="text-amber-500" strokeWidth={2.5} size={36} /> Grandmaster Chess
              </h1>
              <p className="text-zinc-400 font-medium tracking-wide text-sm flex items-center gap-4">
                <span>Focus on the board. Precision is everything.</span>
                <button 
                  onClick={toggleFullscreen} 
                  className="flex items-center gap-2 text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all uppercase tracking-widest text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm ml-2 cursor-pointer"
                >
                  {isFullscreen ? <Minimize size={14} className="text-amber-500" /> : <Maximize size={14} className="text-amber-500" />}
                  {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                </button>
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex items-center justify-center shadow-2xl relative">
             
            {(gameStatus !== "Playing") && (
                <div className="absolute inset-0 z-20 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="text-5xl font-black uppercase mb-4 text-white drop-shadow-2xl">{gameStatus}</span>
                    <button 
                        onClick={resetGame}
                        className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        <RotateCcw size={18} /> Play Again
                    </button>
                </div>
            )}

            <div className="w-full max-w-[600px] aspect-square relative">
                {aiThinking && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-xs uppercase tracking-widest animate-pulse">
                        Engine is thinking...
                    </div>
                )}
              <Chessboard 
                options={{
                    position: game.fen(),
                    onPieceDrop: onDrop,
                    boardOrientation: boardOrientation,
                    darkSquareStyle: { backgroundColor: '#27272a' },
                    lightSquareStyle: { backgroundColor: '#f4f4f5' },
                    squareStyles: (() => {
                        const styles: Record<string, React.CSSProperties> = {};
                        if (game.inCheck()) {
                            const turnColor = game.turn();
                            const board = game.board();
                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    const piece = board[row][col];
                                    if (piece && piece.type === 'k' && piece.color === turnColor) {
                                        const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][col];
                                        const square = `${file}${8 - row}`;
                                        styles[square] = {
                                            background: 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0.2) 75%, transparent 100%)',
                                            boxShadow: 'inset 0 0 20px rgba(239,68,68,0.8)'
                                        };
                                    }
                                }
                            }
                        }
                        return styles;
                    })(),
                    animationDurationInMs: 200,
                    boardStyle: {
                        borderRadius: '8px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Controls & History */}
        <div className="w-full xl:w-[380px] flex flex-col gap-6">
            
            {/* Control Panel */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Game Settings</h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setMode("PlayerVsComputer")}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === "PlayerVsComputer" ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                        >
                            <Play size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Vs Computer</span>
                        </button>
                        <button 
                            onClick={() => setMode("PassAndPlay")}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === "PassAndPlay" ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                        >
                            <Swords size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Pass & Play</span>
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => {
                                setBoardOrientation("white");
                                setComputerColor("black");
                                resetGame();
                            }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${boardOrientation === "white" ? "bg-zinc-200 text-black shadow-lg shadow-white/10" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"}`}
                        >
                            Play White
                        </button>
                        <button 
                            onClick={() => {
                                setBoardOrientation("black");
                                setComputerColor("white");
                                resetGame();
                            }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${boardOrientation === "black" ? "bg-zinc-800 text-white shadow-lg shadow-black/50" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"}`}
                        >
                            Play Black
                        </button>
                    </div>

                    <button 
                        onClick={resetGame}
                        className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={14} /> Resign & Restart
                    </button>
                </div>
            </div>

            {/* Move History */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex flex-col h-[350px] sm:h-[400px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><History size={14} /> Move History</h3>
                    <button onClick={copyFEN} className="text-zinc-600 hover:text-white transition-colors" title="Copy FEN"><Copy size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                    {history.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-700 text-xs font-bold uppercase tracking-widest">
                            No moves yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                                <div key={i} className="contents text-sm font-medium font-mono">
                                    <div className="flex bg-zinc-900/50 rounded-md">
                                        <span className="text-zinc-600 w-8 text-right pr-2 py-1 select-none">{i + 1}.</span>
                                        <span className="text-white py-1">{history[i * 2]}</span>
                                    </div>
                                    <div className="flex rounded-md">
                                        {history[i * 2 + 1] && (
                                            <span className="text-zinc-400 py-1 pl-2">{history[i * 2 + 1]}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Invisible div to scroll into view */}
                    <div style={{ float:"left", clear: "both" }}></div>
                </div>
            </div>

        </div>
      </div>

      {/* Fullscreen Recommendation Prompt */}
      {showPrompt && !isFullscreen && (
          <div className="fixed bottom-6 right-6 z-50 bg-white text-black p-6 rounded-2xl shadow-2xl max-w-sm border sm:border-4 border-black transform transition-all duration-500 hover:scale-[1.02]">
            <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                <Maximize size={20} className="text-amber-500" /> Play in Fullscreen
            </h4>
            <p className="text-sm font-medium mb-5 text-zinc-700">
                For the ultimate, distraction-free grandmaster experience, we highly recommend switching to fullscreen mode!
            </p>
            <div className="flex gap-2">
                <button 
                    onClick={handleAcceptPrompt} 
                    className="bg-black text-white px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors flex-[2]"
                >
                    Enable Fullscreen
                </button>
                <button 
                    onClick={handleDismissPrompt} 
                    className="bg-zinc-200 text-zinc-600 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-300 transition-colors flex-1"
                >
                    Dismiss
                </button>
            </div>
          </div>
      )}

    </div>
  );
}
