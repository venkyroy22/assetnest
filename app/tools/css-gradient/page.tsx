"use client";

import { useState } from "react";
import { Copy, RefreshCw, Palette, Info, Check, ShieldCheck, Paintbrush } from "lucide-react";
import HelpModal from "@/components/HelpModal";

export default function CssGradientMaker() {
  const [color1, setColor1] = useState("#8b5cf6");
  const [color2, setColor2] = useState("#3b82f6");
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const cssValue = type === "linear" 
    ? `linear-gradient(${angle}deg, ${color1}, ${color2})` 
    : `radial-gradient(circle, ${color1}, ${color2})`;
    
  const exactCssCode = `background: ${cssValue};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exactCssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const randomize = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setColor1(randomHex());
    setColor2(randomHex());
    if (type === "linear") setAngle(Math.floor(Math.random() * 360));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-3 relative group">
                <Paintbrush size={11} className="text-white" />
                <span className="text-xs font-semibold tracking-wide text-zinc-300">Design Tool</span>
                <button 
                    onClick={() => setShowHelp(true)}
                    className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                    title="What is this?"
                >
                    <Info size={10} />
                </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-2 tracking-tight">
              <Palette size={32} className="text-zinc-400" /> CSS Gradient Maker
            </h1>
            <p className="text-zinc-500 text-sm mt-3 font-medium">Mix beautiful gradients and instantly copy the pure CSS for your stylesheets.</p>
          </div>
          <button 
            onClick={randomize} 
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-semibold"
          >
            <RefreshCw size={14} /> Randomize
          </button>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          
          {/* Canvas Preview */}
          <div 
            className="w-full rounded-3xl border border-zinc-800/50 shadow-2xl relative overflow-hidden min-h-[400px] lg:min-h-[500px]"
            style={{ background: cssValue }}
          >
             <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full text-white text-sm font-bold shadow-2xl drop-shadow-2xl flex items-center gap-2 select-none">
                   Previewing Gradient
                 </span>
             </div>
          </div>

          {/* Controls Sidebar */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6">
            
            {/* Type Selector */}
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setType("linear")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "linear" ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                LINEAR
              </button>
              <button 
                onClick={() => setType("radial")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "radial" ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                RADIAL
              </button>
            </div>

            <hr className="border-t border-zinc-800/50" />

            {/* Color Pickers */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Colors</label>
              <div className="flex items-center gap-4">
                <div className="relative group w-12 h-12 rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer">
                  <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer" />
                </div>
                <div className="flex-1 font-mono text-xs uppercase bg-black px-4 py-3 rounded-xl border border-zinc-800">
                  {color1}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group w-12 h-12 rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer">
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer" />
                </div>
                <div className="flex-1 font-mono text-xs uppercase bg-black px-4 py-3 rounded-xl border border-zinc-800">
                  {color2}
                </div>
              </div>
            </div>

            <hr className="border-t border-zinc-800/50" />

            {/* Angle Slider (only for linear) */}
            <div className={`flex flex-col gap-4 transition-opacity duration-300 ${type === "radial" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Angle</label>
                <span className="text-xs font-mono bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">{angle}°</span>
              </div>
              <input 
                type="range" 
                min="0" max="360" 
                value={angle} 
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <div className="flex-1" />

            {/* Output Box */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">CSS Output</label>
              <div className="relative">
                <div className="bg-black text-[11px] font-mono text-zinc-300 p-4 rounded-xl border border-zinc-800 break-all leading-relaxed">
                  {exactCssCode}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            
            {copied && (
                <div className="text-center text-xs text-green-400 font-bold bg-green-400/10 py-2 rounded-lg">
                    Copied to clipboard! 🚀
                </div>
            )}

          </div>
        </div>

      </div>

      <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          title="Gradient Generation Infrastructure"
      >
          <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
              <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                      CSS Gradient Maker
                  </h3>
                  <p className="text-base leading-relaxed text-zinc-400 font-medium">
                      A visual engine for generating production-ready CSS background patterns. Fine-tune your colors, angle, and spread, and instantly copy cross-browser compliant CSS data.
                  </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <Paintbrush size={20} className="text-zinc-500" />
                          Features
                      </h3>
                      <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>Real-time Preview:</strong> See your styling instantly applied to the main render canvas.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>Radial & Linear:</strong> Support for multi-directional and center-weighted gradient spreads.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>1-Click Export:</strong> Automatically wraps outputs in standard `background: ...` syntax.</span>
                          </li>
                      </ul>
                  </section>

                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <ShieldCheck size={20} className="text-zinc-500" />
                          Privacy Infrastructure
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                          Like all AssetNest utilities, this tool executes <strong>100% locally in your browser memory</strong>.
                      </p>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                          <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                              Zero-Server Processing • State-Based Rendering • No External API Limits
                          </p>
                      </div>
                  </section>
              </div>
          </div>
      </HelpModal>
    </div>
  );
}
