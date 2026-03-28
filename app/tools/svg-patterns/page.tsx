"use client";

import { useState } from "react";
import { Shapes, Copy, CheckCircle2, Info, Check, ShieldCheck, ImagePlus } from "lucide-react";
import HelpModal from "@/components/HelpModal";

export default function SvgPatterns() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const patterns = [
    {
      id: 1,
      name: "Minimal Grid",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L0 0 0 40' fill='none' stroke='%23ffffff' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L0 0 0 40' fill='none' stroke='%23ffffff' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E");`
    },
    {
      id: 2,
      name: "Subtle Dots",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%23ffffff' fill-opacity='0.12'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%23ffffff' fill-opacity='0.12'/%3E%3C/svg%3E");`
    },
    {
      id: 3,
      name: "Diagonal Stripes",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-3 15L15 -3M-3 3L3 -3M9 15L15 9' stroke='%23ffffff' stroke-width='2' stroke-opacity='0.08'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-3 15L15 -3M-3 3L3 -3M9 15L15 9' stroke='%23ffffff' stroke-width='2' stroke-opacity='0.08'/%3E%3C/svg%3E");`
    },
    {
      id: 4,
      name: "Crosses",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 14h2v2h-2v-2z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 14h2v2h-2v-2z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E");`
    },
    {
      id: 5,
      name: "Polka Matrix",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3Ccircle cx='0' cy='0' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3Ccircle cx='0' cy='0' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E");`
    },
    {
      id: 6,
      name: "Topography",
      svgUrl: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5-5 15-5 20 0s15 5 20 0' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3C/svg%3E\")",
      css: `background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5-5 15-5 20 0s15 5 20 0' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3C/svg%3E");`
    }
  ];

  const copyCode = (id: number, cssString: string) => {
    navigator.clipboard.writeText(cssString);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-3 relative group w-max">
              <ImagePlus size={11} className="text-white" />
              <span className="text-xs font-semibold tracking-wide text-zinc-300">Asset Library</span>
              <button 
                  onClick={() => setShowHelp(true)}
                  className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                  title="What is this?"
              >
                  <Info size={10} />
              </button>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Shapes size={24} className="text-zinc-400" /> SVG Pattern Backgrounds
          </h1>
          <p className="text-zinc-500 text-sm mt-3 font-medium">A curated library of beautiful, seamless geometric SVG backgrounds ready to copy.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patterns.map((pattern) => (
            <div 
                key={pattern.id} 
                className="group flex flex-col bg-zinc-900/40 rounded-3xl border border-zinc-800/60 overflow-hidden hover:border-zinc-700 hover:shadow-2xl transition-all"
            >
              {/* Pattern Canvas */}
              <div 
                className="w-full h-48 bg-[#09090b] relative"
                style={{ backgroundImage: pattern.svgUrl }}
              >
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                     <button
                        onClick={() => copyCode(pattern.id, pattern.css)}
                        className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                     >
                        {copiedId === pattern.id ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />} 
                        {copiedId === pattern.id ? "Copied!" : "Copy CSS"}
                     </button>
                  </div>
              </div>
              
              {/* Card Footer */}
              <div className="p-5 flex items-center justify-between border-t border-zinc-800/60">
                <span className="text-sm font-bold text-white tracking-wide">{pattern.name}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          title="SVG Pattern Infrastructure"
      >
          <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
              <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                      SVG Pattern Backgrounds
                  </h3>
                  <p className="text-base leading-relaxed text-zinc-400 font-medium">
                      A high-performance library of seamless, infinitely scalable geometric patterns. Unlike heavy image sprites, these backgrounds are generated mathematically using scalable vector graphics encoded safely as pure CSS data URIs.
                  </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <ImagePlus size={20} className="text-zinc-500" />
                          Features
                      </h3>
                      <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>Ultra-Lightweight:</strong> Encoded directly in CSS, bypassing network requests entirely.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>Infinite Scale:</strong> Mathematical shapes retain perfect clarity at any retina resolution.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><Check size={16} className="text-white" /></div>
                              <span><strong>Seamless Tiles:</strong> Expert-crafted bounds ensure a perfect wrapping edge.</span>
                          </li>
                      </ul>
                  </section>

                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <ShieldCheck size={20} className="text-zinc-500" />
                          Implementation
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                          All copied snippets utilize pure `background-image` declarations. They are universally compatible across modern web browsers.
                      </p>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                          <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                              Zero Latency Load • Encoded svg+xml • Retina Display Native
                          </p>
                      </div>
                  </section>
              </div>
          </div>
      </HelpModal>
    </div>
  );
}
