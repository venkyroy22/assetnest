"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import HelpModal from "@/components/HelpModal";

// Curated list of 72 essential premium icons
const ICON_NAMES = [
  "Activity", "Anchor", "Award", "Bell", "Book", "Box", "Camera", "Check",
  "Cloud", "Code", "Cpu", "CreditCard", "Database", "Download", "Eye", "File",
  "Flame", "Folder", "Gift", "Globe", "Heart", "Home", "Image", "Inbox",
  "Key", "Layers", "Layout", "Link", "Lock", "Mail", "Map", "MessageCircle",
  "MessageSquare", "Mic", "Monitor", "Moon", "MousePointer", "Music", "Navigation",
  "Package", "Paperclip", "Phone", "Play", "Plus", "Power", "Printer", "Radio",
  "RefreshCw", "Search", "Send", "Settings", "Share", "Shield", "ShoppingBag",
  "ShoppingCart", "Smartphone", "Speaker", "Star", "Sun", "Tag", "Terminal",
  "ThumbsUp", "Trash", "Truck", "Tv", "Twitter", "Umbrella", "Unlock", "Upload",
  "User", "Users", "Video", "Volume", "Wifi", "Zap", "ZoomIn"
];

export default function IconLibrary() {
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const copyCode = (iconName: string) => {
    const rawCode = `<${iconName} className="w-6 h-6" />`;
    navigator.clipboard.writeText(rawCode);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-1 relative group w-max">
              <LucideIcons.ImagePlus size={11} className="text-white" />
              <span className="text-xs font-semibold tracking-wide text-zinc-300">Asset Library</span>
              <button 
                  onClick={() => setShowHelp(true)}
                  className="ml-3 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl"
                  title="What is this?"
              >
                  <LucideIcons.Info size={10} />
              </button>
          </div>
          <div className="flex items-center justify-between mt-2">
              <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-2 tracking-tight">
                <LucideIcons.Images size={32} className="text-zinc-400" /> Essential Icon Library
              </h1>
              <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 uppercase tracking-widest">Lucide Outline</span>
          </div>
          <p className="text-zinc-500 text-sm font-medium mt-1">A beautifully curated list of 72 premium vector icons. Click any card to instantly copy the React component code.</p>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {ICON_NAMES.map((name) => {
            // @ts-ignore
            const IconRenderer = LucideIcons[name];
            if (!IconRenderer) return null;

            const isCopied = copiedIcon === name;

            return (
              <button
                key={name}
                onClick={() => copyCode(name)}
                className={`group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300
                  ${isCopied 
                    ? "bg-green-500/10 border-green-500/50 scale-[0.98]" 
                    : "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-500/50 hover:bg-zinc-800/30 hover:-translate-y-1 shadow-2xl"
                  }
                `}
                title={`Copy <${name} />`}
              >
                <div className="relative">
                  {isCopied ? (
                    <LucideIcons.CheckCircle2 size={26} className="text-green-500" />
                  ) : (
                    <IconRenderer size={26} className="text-white group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                  )}
                  {/* Subtle top-down glow on hover */}
                  <div className="absolute inset-x-0 -top-2 h-6 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 mix-blend-screen transition-opacity" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 tracking-wide mt-1 group-hover:text-zinc-300 transition-colors">{name}</span>
                
                {/* Floating "Copied" badge */}
                {isCopied && (
                   <div className="absolute -top-3 inset-x-0 flex justify-center animate-in slide-in-from-bottom-2 fade-in">
                       <span className="bg-green-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-lg">Copied!</span>
                   </div>
                )}
              </button>
            );
          })}
        </div>

         {/* Alert Banner / Usage instructions */}
         <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
             <div className="p-3 bg-blue-500/20 rounded-xl">
                 <LucideIcons.Info size={20} className="text-blue-400" />
             </div>
             <div className="flex flex-col gap-1.5">
                 <h3 className="text-white text-sm font-bold tracking-tight">How to use these icons</h3>
                 <p className="text-xs text-blue-200/60 leading-relaxed">
                     These icons are natively sourced from the <code>lucide-react</code> package. When you click an icon, it copies the exact JSX component (e.g. <code>&lt;Shield className="w-6 h-6" /&gt;</code>). You must have <code>lucide-react</code> installed in your project to render them directly.
                 </p>
             </div>
         </div>

      </div>

      <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          title="Icon Library Infrastructure"
      >
          <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
              <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                      Vector Icon Dashboard
                  </h3>
                  <p className="text-base leading-relaxed text-zinc-400 font-medium">
                      A fast, beautiful dashboard displaying a curated selection of commonly required premium icons. Designed for strict consistency, all icons follow a 24x24 grid with a 2px stroke width, matching elite industry standards.
                  </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <LucideIcons.Paintbrush size={20} className="text-zinc-500" />
                          Features
                      </h3>
                      <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><LucideIcons.Check size={16} className="text-white" /></div>
                              <span><strong>Perfect Consistency:</strong> Same stroke widths, rounded edges, and padding format across the board.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><LucideIcons.Check size={16} className="text-white" /></div>
                              <span><strong>1-Click Copy:</strong> Automatically writes the React Component syntax `&lt;IconName /&gt;` straight to your clipboard.</span>
                          </li>
                          <li className="flex gap-4 items-start">
                              <div className="mt-1 shrink-0"><LucideIcons.Check size={16} className="text-white" /></div>
                              <span><strong>Zero Load Time:</strong> Pre-rendered elements bypass layout shift.</span>
                          </li>
                      </ul>
                  </section>

                  <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                          <LucideIcons.ShieldCheck size={20} className="text-zinc-500" />
                          Implementation
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed font-bold">
                          These icons are sourced from the open-source <strong>Lucide</strong> library. To use them, ensure your project relies on `lucide-react` or identical primitive packages.
                      </p>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Technical Spec</p>
                          <p className="text-[11px] text-zinc-600 mt-2 font-bold tracking-tight uppercase leading-relaxed">
                              SVGO Optimized • Viewbox 0 0 24 24 • Inherits CurrentColor
                          </p>
                      </div>
                  </section>
              </div>
          </div>
      </HelpModal>
    </div>
  );
}
