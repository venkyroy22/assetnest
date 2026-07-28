"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
    Download, CreditCard, Upload, MapPin, Phone, Mail, Globe, Briefcase, Hash,
    Cpu, Monitor, Zap, Palette, PenTool, Camera, Building2, TrendingUp, Handshake, 
    ShieldCheck, Truck, ShoppingBag, Globe2, Leaf, Rocket, Heart, User,
    LayoutDashboard, Paintbrush, Info, Move, RotateCcw, Plus, Trash2, Layers,
    Maximize2, Minimize2, Type, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff, Lock, Unlock,
    Smartphone, Search, MousePointer2, Settings, Sparkles, SlidersHorizontal, Undo2, Redo2,
    ChevronDown, ChevronUp, GripVertical, X, ArrowLeft
} from "lucide-react";
import html2canvas from "html2canvas";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";

type TextureType = "none" | "linen" | "paper" | "noise" | "mesh" | "hexagons" | "carbon" | "waves" | "diamonds" | "grid";

interface DragElement {
  id: string;
  type: "text" | "logo" | "icon" | "image";
  content: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  color?: string;
  fontWeight?: string;
  letterSpacing?: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

const DEFAULT_ELEMENTS: DragElement[] = [
    { id: "company", type: "text", content: "ACME STUDIO", x: 60, y: 60, size: 20, rotation: 0, opacity: 1, fontWeight: "900", letterSpacing: 5, visible: true, locked: false, zIndex: 10 },
    { id: "name", type: "text", content: "ALEX RIVERS", x: 60, y: 160, size: 54, rotation: 0, opacity: 1, fontWeight: "900", letterSpacing: -2, visible: true, locked: false, zIndex: 11 },
    { id: "title", type: "text", content: "LEAD PRODUCT DESIGNER", x: 60, y: 230, size: 14, rotation: 0, opacity: 0.6, fontWeight: "700", letterSpacing: 6, visible: true, locked: false, zIndex: 12 },
    { id: "brand-icon", type: "icon", content: "Zap", x: 500, y: 150, size: 120, rotation: 0, opacity: 0.1, visible: true, locked: false, zIndex: 5 }
];

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=DM+Sans:wght@500;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(1px, 1px) !important;
  box-shadow: none !important;
}

/* Custom range inputs */
.ig-slider {
  -webkit-appearance: none;
  background: #E5E7EB;
  height: 6px;
  border-radius: 9999px;
  outline: none;
  border: 2px solid #000000;
}
.ig-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #fde047;
  border: 2px solid #000000;
  cursor: pointer;
}
.ig-slider::-webkit-slider-thumb:hover {
  background: #facc15;
}
`;

export default function BusinessCardPage() {
    const cardRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    
    // Core State
    const [elements, setElements] = useState<DragElement[]>(DEFAULT_ELEMENTS);
    const [history, setHistory] = useState<DragElement[][]>([]);
    const [redoStack, setRedoStack] = useState<DragElement[][]>([]);
    
    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"design" | "layers">("design");
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasScale, setCanvasScale] = useState(0.85);
    const [showHelp, setShowHelp] = useState(false);

    // Style State
    const [themeColor, setThemeColor] = useState("#0f172a");
    const [activeTexture, setActiveTexture] = useState<TextureType>("none");
    const [patternColor, setPatternColor] = useState("#ffffff");

    // Responsive State
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

    // Contact Data
    const [phone, setPhone] = useState("+1 (555) 000-1234");
    const [email, setEmail] = useState("hello@studio.com");
    const [website, setWebsite] = useState("www.studio.com");
    const [address, setAddress] = useState("Silicon Valley, CA");

    const saveToHistory = useCallback((newElements: DragElement[]) => {
        setHistory(prev => [...prev, elements]);
        setRedoStack([]);
        setElements(newElements);
    }, [elements]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setRedoStack(prev => [...prev, elements]);
        setHistory(prev => prev.slice(0, -1));
        setElements(previous);
        setSelectedId(null);
    }, [history, elements]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setHistory(prev => [...prev, elements]);
        setRedoStack(prev => prev.slice(0, -1));
        setElements(next);
        setSelectedId(null);
    }, [redoStack, elements]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); }
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
                   saveToHistory(elements.filter(el => el.id !== selectedId));
                   setSelectedId(null);
                }
            }
        };
        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, [undo, redo, elements, selectedId, saveToHistory]);

    useEffect(() => {
        const updateScale = () => {
            if (canvasContainerRef.current) {
                const container = canvasContainerRef.current;
                const availableW = container.clientWidth - 40;
                const availableH = container.clientHeight - 80;
                const scale = Math.min(availableW / 1050, availableH / 600, 1.0);
                setCanvasScale(Math.max(scale, 0.2));
            }
        };
        updateScale();
        const observer = new ResizeObserver(updateScale);
        if (canvasContainerRef.current) observer.observe(canvasContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const selectedElement = elements.find(el => el.id === selectedId);

    const updateElement = (id: string, updates: Partial<DragElement>, isFinal = false) => {
        const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
        if (isFinal) {
            saveToHistory(newElements);
        } else {
            setElements(newElements);
        }
    };

    const addElement = (type: DragElement["type"], content: string) => {
        const newEl: DragElement = {
            id: `${type}-${Date.now()}`,
            type,
            content,
            x: 525 - 50,
            y: 300 - 25,
            size: type === "text" ? 28 : 100,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: elements.length + 10
        };
        saveToHistory([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "image") => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            addElement(type, url);
        }
    };

    const handleGenerate = async () => {
        if (!cardRef.current) return;
        setSelectedId(null);
        setIsGenerating(true);
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(cardRef.current!, {
                    scale: 4, 
                    backgroundColor: null, 
                    useCORS: true,
                    allowTaint: true,
                });
                const cardName = elements.find(el => el.id === "name")?.content || "StudioMaster";
                const link = document.createElement("a");
                link.download = `${cardName.replace(/\s+/g, "_")}_BusinessCard.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            } finally { setIsGenerating(false); }
        }, 500);
    };

    const onPointerDown = (e: React.PointerEvent, id: string) => {
        const el = elements.find(el => el.id === id);
        if (el?.locked) return;
        
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        
        setSelectedId(id);
        setDraggedId(id);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: (e.clientX - rect.left) / canvasScale,
            y: (e.clientY - rect.top) / canvasScale
        });
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (draggedId && cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            let x = (e.clientX - cardRect.left) / canvasScale - dragOffset.x;
            let y = (e.clientY - cardRect.top) / canvasScale - dragOffset.y;
            updateElement(draggedId, { x, y });
        }
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (draggedId) {
            saveToHistory(elements);
            try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        }
        setDraggedId(null);
    };

    const getPatternSvg = (type: TextureType, color: string) => {
        const c = color.replace("#", "%23");
        switch(type) {
            case "hexagons": return `data:image/svg+xml,%3Csvg width='40' height='70' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5z' fill='${c}' fill-opacity='0.1'/%3E%3C/svg%3E`;
            case "waves": return `data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 20 50 10 T 100 10' fill='none' stroke='${c}' stroke-opacity='0.1' stroke-width='2'/%3E%3C/svg%3E`;
            case "grid": return `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40h40V0H0v40zM39 39H1V1h38v38z' fill='${c}' fill-opacity='0.05'/%3E%3C/svg%3E`;
            case "diamonds": return `data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l15 15-15 15L0 15z' fill='${c}' fill-opacity='0.1'/%3E%3C/svg%3E`;
            default: return "";
        }
    };

    return (
        <div className="relative flex flex-col bg-[#F4ECD8] text-black font-sans select-none overflow-hidden ig-root" style={{ height: "calc(100vh - 80px)" }}>
            <style>{GLOBAL_STYLES}</style>
            
            {/* STICKY TOOL HEADER */}
            <div className="h-16 border-b-2 border-black px-3 sm:px-6 flex items-center justify-between bg-[#F4ECD8] shrink-0 z-40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link
                        href="/tools"
                        className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50 shrink-0"
                    >
                        <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                    </Link>

                    {/* MOBILE LEFT TOGGLE */}
                    <button 
                        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-white border-2 border-black text-black hover:bg-zinc-55 shrink-0 shadow-[1.5px_1.5px_0_#000] ig-btn"
                    >
                        <SlidersHorizontal size={14} />
                    </button>

                    <button 
                        onClick={() => setShowHelp(true)}
                        className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-full text-black hover:bg-zinc-55 transition-all shrink-0 shadow-[1.5px_1.5px_0_#000] ig-btn"
                        title="Information"
                    >
                        <Info size={14} />
                    </button>

                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black tracking-widest text-zinc-550 uppercase leading-none mb-1 truncate hidden xs:block">Card Studio</span>
                        <h1 className="text-[10px] font-black text-black uppercase leading-none tracking-[0.1em] truncate ig-display">Business Card Maker</h1>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]">
                        <button 
                            onClick={undo} 
                            disabled={history.length === 0} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-zinc-50 disabled:opacity-25 transition-all"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 size={13} />
                        </button>
                        <button 
                            onClick={redo} 
                            disabled={redoStack.length === 0} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-zinc-50 disabled:opacity-25 transition-all"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 size={13} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]">
                        <button onClick={() => addElement("text", "New Layer")} className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-zinc-50 transition-all" title="Add Layer Text">
                            <Plus size={14} />
                        </button>
                        <label className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-zinc-50 transition-all cursor-pointer" title="Upload Custom Logo/Image">
                            <Upload size={14} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} />
                        </label>
                    </div>

                    <div className="h-6 w-px bg-black hidden sm:block" />

                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        className="ig-btn h-9 px-3.5 bg-[#fde047] text-black border-2 border-black rounded-xl flex items-center gap-1.5 hover:bg-yellow-400 transition-all disabled:opacity-30 shadow-[2px_2px_0_#000] shrink-0"
                    >
                        {isGenerating ? <RotateCcw size={12} className="animate-spin" /> : <Download size={12} />}
                        <span className="text-[9px] font-black uppercase tracking-widest hidden xs:inline">
                            {isGenerating ? "Processing" : "Export Card"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative min-h-0 w-full">
                
                {/* MOBILE BACKDROP */}
                {(leftPanelOpen || rightPanelOpen) && (
                    <div 
                        className="lg:hidden absolute inset-0 bg-black/35 z-[45] backdrop-blur-sm"
                        onClick={() => { setLeftPanelOpen(false); setRightPanelOpen(false); }}
                    />
                )}
                
                {/* LEFT DRAWER (Responsive) */}
                <div className={`
                    absolute lg:relative top-0 bottom-0 left-0 w-72 bg-[#F4ECD8] border-r-2 border-black flex flex-col z-50 transition-transform duration-300
                    ${leftPanelOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    <div className="flex items-center justify-between border-b-2 border-black p-2 bg-white">
                        <div className="flex flex-1 gap-1.5 p-1 bg-zinc-50 border-2 border-black rounded-xl shadow-[1.5px_1.5px_0_#000]">
                            {["design", "layers"].map((t) => (
                                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === t ? "bg-[#fde047] text-black" : "text-zinc-500 hover:text-black"}`}>{t}</button>
                            ))}
                        </div>
                        <button onClick={() => setLeftPanelOpen(false)} className="lg:hidden p-2 text-black"><X size={16}/></button>
                    </div>

                    <div data-lenis-prevent className="flex-grow overflow-y-auto p-5 space-y-6 pb-20 bg-white border-r-2 border-black">
                        {activeTab === "design" && (
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 ig-display"><Palette size={14}/> Appearance</h3>
                                    
                                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Surface Fill</span>
                                        <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-2 border-black shadow-[1px_1px_0_#000]" />
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Pattern Color</span>
                                        <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-2 border-black shadow-[1px_1px_0_#000]" />
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 ig-display"><Layers size={14}/> Texture Overlay</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["none", "hexagons", "waves", "grid", "carbon", "diamonds", "noise"].map(t => (
                                            <button key={t} onClick={() => setActiveTexture(t as any)} className={`w-10 h-10 rounded-xl border-2 border-black transition-all flex items-center justify-center font-black uppercase text-[8px] tracking-tighter shadow-[1.5px_1.5px_0_#000] ig-btn ${activeTexture === t ? "bg-[#fde047] text-black" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}>
                                                {t === "none" ? "Ø" : t.slice(0,3)}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 ig-display"><Briefcase size={14}/> Contact Info</h3>
                                    <div className="space-y-3.5">
                                        {[
                                            { v: phone, s: setPhone, p: "Phone Number", icon: <Phone size={11}/> },
                                            { v: email, s: setEmail, p: "Email Address", icon: <Mail size={11}/> },
                                            { v: website, s: setWebsite, p: "Personal Website", icon: <Globe size={11}/> },
                                            { v: address, s: setAddress, p: "Corporate Location", icon: <MapPin size={11}/> }
                                        ].map((f, i) => (
                                             <div key={i} className="relative">
                                                 <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                                                     {f.icon}
                                                 </div>
                                                 <input type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)} className="w-full bg-zinc-50 border-2 border-black rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-black outline-none focus:bg-white placeholder:text-zinc-400" />
                                             </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === "layers" && (
                            <div className="space-y-2">
                                {[...elements].reverse().map((el) => (
                                    <div key={el.id} onClick={() => { setSelectedId(el.id); setRightPanelOpen(true); }} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-black transition-all group cursor-pointer shadow-[2px_2px_0_#000] ${selectedId === el.id ? "bg-[#fde047]" : "bg-white hover:bg-zinc-50"}`}>
                                        <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-black flex items-center justify-center text-black">
                                            <GripVertical size={13} />
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-[10px] font-black text-black uppercase truncate">{el.type === "text" ? el.content : el.id}</p>
                                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{el.type}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }, true); }} className="text-black hover:scale-115 transition-transform">
                                            {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* WORKSPACE */}
                <div ref={canvasContainerRef} className="flex-grow bg-[#E6DEC9] relative flex flex-col items-center justify-center overflow-hidden h-full">
                    
                    {/* Zoom Info */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white border-2 border-black rounded-full shadow-[2.5px_2.5px_0_#000] z-20 flex items-center gap-2">
                         <span className="text-[9px] font-black text-black uppercase tracking-wider">Canvas: {Math.round(canvasScale * 100)}%</span>
                    </div>

                    <div 
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                        className="relative flex items-center justify-center touch-none"
                        style={{ 
                            width: `${1050 * canvasScale}px`,
                            height: `${600 * canvasScale}px`,
                        }}
                    >
                        <div 
                            style={{ 
                                transform: `scale(${canvasScale})`,
                                transformOrigin: "center center",
                                width: "1050px",
                                height: "600px",
                                flexShrink: 0
                            }}
                        >
                            <div 
                                ref={cardRef}
                                id="card-studio-render"
                                style={{ width: "1050px", height: "600px", background: themeColor, overflow: "hidden", position: "relative" }} 
                                className="rounded-[2.5rem] shadow-[12px_12px_0_#000] border-4 border-black shrink-0 select-none"
                            >
                            {activeTexture !== "none" && (
                                <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundImage: `url("${getPatternSvg(activeTexture, patternColor)}")`, backgroundRepeat: "repeat", opacity: 0.8 }} />
                            )}

                            {elements.filter(el => el.visible).sort((a,b) => a.zIndex - b.zIndex).map((el) => (
                                <div 
                                    key={el.id}
                                    onPointerDown={(e) => onPointerDown(e, el.id)}
                                    style={{ 
                                        left: el.x, top: el.y, opacity: el.opacity,
                                        transform: `rotate(${el.rotation}deg)`,
                                        zIndex: el.zIndex,
                                        position: "absolute",
                                        cursor: el.locked ? "default" : "move",
                                        padding: "8px",
                                        outline: selectedId === el.id ? "3px solid #fde047" : "none",
                                        outlineOffset: "4px",
                                        minWidth: "max-content",
                                        display: "inline-block"
                                    }}
                                    className="transition-all duration-75"
                                >
                                    {el.type === "text" && (
                                        <div style={{ fontSize: el.size, fontWeight: el.fontWeight as any, letterSpacing: el.letterSpacing, color: el.color || "#ffffff" }} className="whitespace-nowrap leading-none">
                                            {el.content}
                                        </div>
                                    )}
                                    {el.type === "icon" && (
                                        <Zap size={el.size} strokeWidth={1} style={{ color: el.color || "#ffffff" }} />
                                    )}
                                    {(el.type === "logo" || el.type === "image") && (
                                        <img src={el.content} style={{ height: el.size }} className="w-auto pointer-events-none block object-contain" alt="brand asset" />
                                    )}
                                </div>
                            ))}

                             {/* Contact Details overlay */}
                             <div className="absolute bottom-16 right-16 flex flex-col items-end gap-3 pointer-events-none opacity-50 z-10">
                                {phone && <div className="text-[13px] font-black tracking-[0.2em] uppercase flex items-center gap-3">{phone} <Phone size={11} className="text-zinc-400" /></div>}
                                {email && <div className="text-[13px] font-black tracking-[0.2em] uppercase flex items-center gap-3">{email} <Mail size={11} className="text-zinc-400" /></div>}
                                {website && <div className="text-[13px] font-black tracking-[0.2em] uppercase flex items-center gap-3">{website} <Globe size={11} className="text-zinc-400" /></div>}
                                {address && <div className="text-[13px] font-black tracking-[0.2em] uppercase flex items-center gap-3">{address} <MapPin size={11} className="text-zinc-400" /></div>}
                             </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PROPERTY INSPECTOR (Responsive) */}
                <div className={`
                    absolute lg:relative top-0 bottom-0 right-0 w-80 bg-[#F4ECD8] border-l-2 border-black flex flex-col z-50 transition-transform duration-300
                    ${rightPanelOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                `}>
                    {selectedElement ? (
                        <div className="flex flex-col h-full overflow-hidden bg-white border-l-2 border-black">
                             <div className="p-4 border-b-2 border-black flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setRightPanelOpen(false)} className="lg:hidden p-1 text-black"><X size={16}/></button>
                                     <h3 className="text-[10px] font-black text-black uppercase tracking-wider ig-display">Inspector</h3>
                                </div>
                                <button onClick={() => { saveToHistory(elements.filter(el => el.id !== selectedId)); setSelectedId(null); setRightPanelOpen(false); }} className="ig-btn p-2 border-2 border-black hover:bg-red-50 text-red-650 bg-red-100/35 rounded-xl shadow-[1.5px_1.5px_0_#000]"><Trash2 size={14} /></button>
                             </div>

                              <div data-lenis-prevent className="flex-grow overflow-y-auto p-6 space-y-6 pb-20 bg-white">
                                <section className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Dimension Size</span>
                                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">{selectedElement.size}px</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                             <button onClick={() => updateElement(selectedElement.id, { size: Math.max(4, selectedElement.size - 5) }, true)} className="ig-btn w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center hover:bg-zinc-50 shadow-[1.5px_1.5px_0_#000]"><Minimize2 size={14} /></button>
                                             <input type="range" min="4" max="800" value={selectedElement.size} onChange={e => updateElement(selectedElement.id, { size: parseInt(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="flex-grow ig-slider" />
                                             <button onClick={() => updateElement(selectedElement.id, { size: selectedElement.size + 5 }, true)} className="ig-btn w-10 h-10 bg-[#fde047] rounded-xl border-2 border-black flex items-center justify-center hover:bg-yellow-400 shadow-[1.5px_1.5px_0_#000]"><Maximize2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Layer Opacity</span>
                                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">{Math.round(selectedElement.opacity * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity} onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="w-full ig-slider" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Rotation Angle</span>
                                            <div className="flex items-center gap-2">
                                                 <button onClick={() => updateElement(selectedElement.id, { rotation: 0 }, true)} className="text-[8px] font-black text-zinc-500 hover:text-black uppercase tracking-wider">RESET</button>
                                                 <span className="text-[9px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">{selectedElement.rotation}°</span>
                                            </div>
                                        </div>
                                        <input type="range" min="-180" max="180" value={selectedElement.rotation} onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="w-full ig-slider" />
                                    </div>
                                </section>

                                {selectedElement.type === "text" && (
                                    <section className="space-y-6 pt-6 border-t-2 border-dashed border-zinc-200">
                                        <h3 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-2 ig-display"><Type size={14}/> Typography</h3>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-wider">Ink Swatch</label>
                                            <div className="flex gap-3">
                                                <input type="color" value={selectedElement.color || "#ffffff"} onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)} className="w-10 h-10 rounded-xl bg-white border-2 border-black cursor-pointer p-1 transition-transform shadow-[1.5px_1.5px_0_#000] shrink-0" />
                                                <input type="text" value={selectedElement.color || "#ffffff"} onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)} className="flex-grow bg-zinc-50 border-2 border-black rounded-xl px-4 text-xs font-mono uppercase text-black outline-none focus:bg-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-wider">Layer Text Content</label>
                                            <textarea value={selectedElement.content} onChange={e => updateElement(selectedElement.id, { content: e.target.value })} onBlur={() => saveToHistory(elements)} className="w-full bg-zinc-50 border-2 border-black rounded-2xl p-4 text-xs text-black focus:bg-white outline-none h-24 resize-none leading-relaxed transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[ {l: "Black", w: "900"}, {l: "Bold", w: "700"}, {l: "Medium", w: "400"}, {l: "Light", w: "200"} ].map(w => (
                                                <button key={w.w} onClick={() => updateElement(selectedElement.id, { fontWeight: w.w }, true)} className={`ig-btn py-2 text-[9px] font-black uppercase rounded-xl border-2 border-black transition-all tracking-wider shadow-[1.5px_1.5px_0_#000] ${selectedElement.fontWeight === w.w ? "bg-[#fde047] text-black" : "bg-white text-zinc-550 hover:bg-zinc-50"}`}>
                                                    {w.l}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section className="pt-6 border-t-2 border-dashed border-zinc-200">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-wider mb-4 flex items-center gap-2 ig-display"><AlignLeft size={14}/> Layout Alignment</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button onClick={() => updateElement(selectedElement.id, { x: 525 - (elWidth(selectedElement)/2) }, true)} className="ig-btn w-full h-11 rounded-xl bg-white border-2 border-black hover:bg-zinc-50 text-black transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]">
                                            <AlignCenter size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-wider">Align Center Horizontally</span>
                                        </button>
                                        <button onClick={() => updateElement(selectedElement.id, { y: 300 - (selectedElement.size/2) }, true)} className="ig-btn w-full h-11 rounded-xl bg-white border-2 border-black hover:bg-zinc-50 text-black transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]">
                                            <AlignLeft size={14} className="rotate-90" />
                                            <span className="text-[9px] font-black uppercase tracking-wider">Align Center Vertically</span>
                                        </button>
                                    </div>
                                </section>
                              </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 bg-white border-l-2 border-black">
                            <div className="relative">
                                <div className="w-16 h-16 bg-[#F4ECD8] rounded-[2rem] flex items-center justify-center text-black border-2 border-black shadow-[3px_3px_0_#000]">
                                    <Sparkles size={26} />
                                </div>
                            </div>
                            <div className="space-y-2 max-w-[220px]">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-black ig-display">No Layer Selected</h3>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase leading-relaxed tracking-wider">Select an element on the canvas to customize text weight, rotate, opacity, size and alignments.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Business Card Maker Guide"
            >
                <div className="max-w-2xl mx-auto space-y-8 py-4 text-black text-left">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Interactive Corporate Brand Designer</h3>
                        <p className="text-sm text-zinc-650 leading-relaxed font-medium">
                            Create professional business cards using an intuitive, layers-based designer. With full drag-and-drop mechanics and custom texture synthesizers, you can create modern networking assets for free.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000] space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5"><PenTool size={13}/> Live Layering</h4>
                            <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                                Control depth layers with full drag alignment, customization of individual text properties, and relative sizing.
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000] space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5"><Palette size={13}/> Surface Textures</h4>
                            <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                                Overlay professional patterns onto your card structure such as hexagons, grids, waves, or carbon textures.
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000] space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5"><ShieldCheck size={13}/> Private Rendering</h4>
                            <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                                No remote database records or cookies trackers. Card assets compile inside your client browser memory securely.
                            </p>
                        </div>
                    </div>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="Can I customize the export dimensions?">
                                Yes. The exported PNG renders at 4x target print density, preventing blurred text or stutters in print-shops.
                            </AccordionItem>
                            <AccordionItem title="How do I upload brand templates/logos?">
                                Click the Upload button in the top toolbar to upload any standard image file (PNG, JPG) and position it as a card layer.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}

function elWidth(el: DragElement) {
    if (el.type === "text") return el.content.length * (el.size * 0.55);
    return el.size;
}
