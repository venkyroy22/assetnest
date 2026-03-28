"use client";

import { X, Moon, Sun, Monitor, MousePointer2, PaintBucket, EyeOff, LayoutTemplate } from "lucide-react";
import { useSettings } from "./SettingsProvider";
import { useEffect, useState } from "react";

export default function SettingsModal() {
  const { settings, updateSettings, resetAllData, isSettingsOpen, setSettingsOpen } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setSettingsOpen(false)}
      />
      
      {/* Modal Content */}
      <div 
        data-lenis-prevent
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/50">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <LayoutTemplate size={20} className="text-zinc-400" /> Platform Settings
          </h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
          
          {/* Section: Eye Protect */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <EyeOff size={22} className="text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-100">Eye Protection Filter</h4>
                        <p className="text-xs text-amber-500/60 mt-1 pr-4 leading-relaxed font-medium">Applies a warm, sepia-toned filter globally to reduce blue light exposure during late-night work sessions.</p>
                    </div>
                </div>
                
                {/* Toggle Switch */}
                <button 
                    onClick={() => updateSettings({ eyeProtectEnabled: !settings.eyeProtectEnabled })}
                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${settings.eyeProtectEnabled ? "bg-amber-500" : "bg-zinc-800"}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.eyeProtectEnabled ? "translate-x-6" : ""}`} />
                </button>
            </div>
          </section>

          {/* Section: Motion */}
          <section className="space-y-4 pt-2">
             <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30">
                 <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                         <MousePointer2 size={20} className="text-zinc-400" />
                     </div>
                     <div>
                         <h4 className="text-sm font-bold text-white">Reduce Motion</h4>
                         <p className="text-xs text-zinc-500 mt-1 pr-4 leading-relaxed font-medium">Disable heavy interface animations and spotlight effects for a faster layout.</p>
                     </div>
                 </div>
                 
                 <button 
                     onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
                     className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${settings.reduceMotion ? "bg-white" : "bg-zinc-800"}`}
                 >
                     <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 ${settings.reduceMotion ? "translate-x-6 bg-black" : "bg-white"}`} />
                 </button>
             </div>
          </section>

          {/* Section: Sidebar Mode */}
          <section className="space-y-4 pt-2">
             <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30">
                 <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                         <LayoutTemplate size={20} className="text-zinc-400" />
                     </div>
                     <div>
                         <h4 className="text-sm font-bold text-white">Default Sidebar Expanded</h4>
                         <p className="text-xs text-zinc-500 mt-1 pr-4 leading-relaxed font-medium">Keep the navigation menu open by default for easier access to tools.</p>
                     </div>
                 </div>
                 
                 <button 
                     onClick={() => updateSettings({ defaultSidebarOpen: !settings.defaultSidebarOpen })}
                     className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${settings.defaultSidebarOpen ? "bg-emerald-500" : "bg-zinc-800"}`}
                 >
                     <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.defaultSidebarOpen ? "translate-x-6" : ""}`} />
                 </button>
             </div>
          </section>

          {/* Section: Sticky Navbar */}
          <section className="space-y-4 pt-2">
             <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-800 bg-zinc-900/30">
                 <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                         <Monitor size={20} className="text-zinc-400" />
                     </div>
                     <div>
                         <h4 className="text-sm font-bold text-white">Sticky Navigation Bar</h4>
                         <p className="text-xs text-zinc-500 mt-1 pr-4 leading-relaxed font-medium">Keep the top header visible at all times while scrolling down the page.</p>
                     </div>
                 </div>
                 
                 <button 
                     onClick={() => updateSettings({ fixedNavbar: !settings.fixedNavbar })}
                     className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${settings.fixedNavbar ? "bg-white" : "bg-zinc-800"}`}
                 >
                     <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 ${settings.fixedNavbar ? "translate-x-6 bg-black" : "bg-white"}`} />
                 </button>
             </div>
          </section>

          {/* Section: Data Wipe */}
          <section className="space-y-4 pt-4 border-t border-red-500/10">
            <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h4 className="text-sm font-bold text-red-500 flex items-center gap-2">
                            <X size={16} /> Danger Zone
                        </h4>
                        <p className="text-xs text-zinc-500 mt-2 pr-4 leading-relaxed font-medium">Wipe all local storage, pins, and platform settings. This action is permanent and will refresh the application.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear all data and reset the platform?")) {
                                resetAllData();
                            }
                        }}
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-xs font-black transition-all active:scale-95"
                    >
                        Reset All Data
                    </button>
                </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
