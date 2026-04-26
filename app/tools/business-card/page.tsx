"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
    Download, CreditCard, Upload, MapPin, Phone, Mail, Globe, Briefcase, Hash,
    Cpu, Monitor, Zap, Palette, PenTool, Camera, Building2, TrendingUp, Handshake, 
    ShieldCheck, Truck, ShoppingBag, Globe2, Leaf, Rocket, Heart, User,
    LayoutDashboard, Paintbrush, Info, Move, RotateCcw, Plus, Trash2, Layers,
    Maximize2, Minimize2, Type, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff, Lock, Unlock,
    Smartphone, Search, MousePointer2, Settings, Sparkles, SlidersHorizontal, Undo2, Redo2,
    ChevronDown, ChevronUp, GripVertical, X, Home
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
        
        // Use setPointerCapture to ensure move/up events are caught even if finger leaves the element
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
            // Release capture
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
        <div className="relative flex flex-col bg-black text-white font-sans select-none overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
            
            {/* STICKY TOOL HEADER */}
            <div className="h-16 border-b border-white/5 px-3 sm:px-6 flex items-center justify-between bg-black/80 backdrop-blur-3xl shrink-0 z-40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* MOBILE LEFT TOGGLE */}
                    <button 
                        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white shrink-0"
                    >
                        <SlidersHorizontal size={14} />
                    </button>

                    <button 
                        onClick={() => setShowHelp(true)}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-all shrink-0"
                        title="Information"
                    >
                        <Info size={14} />
                    </button>

                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black tracking-widest text-zinc-600 uppercase leading-none mb-1 truncate hidden xs:block">StudioMaster</span>
                        <h1 className="text-[10px] font-black text-white uppercase leading-none tracking-[0.1em] truncate">Studio</h1>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-1 bg-zinc-900/40 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={undo} 
                            disabled={history.length === 0} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white disabled:opacity-20 transition-all hover:bg-white/5"
                            title="Undo"
                        >
                            <Undo2 size={14} />
                        </button>
                        <button 
                            onClick={redo} 
                            disabled={redoStack.length === 0} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white disabled:opacity-20 transition-all hover:bg-white/5"
                            title="Redo"
                        >
                            <Redo2 size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => addElement("text", "New Layer")} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all" title="Add Element">
                            <Plus size={14} />
                        </button>
                        <label className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer" title="Upload Image">
                            <Upload size={14} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} />
                        </label>
                    </div>

                    <div className="h-6 w-px bg-white/5 hidden sm:block" />

                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        className="h-9 px-3 sm:px-4 bg-white text-black rounded-full flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-20 active:scale-95 shadow-xl shadow-white/10 shrink-0"
                    >
                        {isGenerating ? <RotateCcw size={12} className="animate-spin" /> : <Download size={12} />}
                        <span className="text-[9px] font-black uppercase tracking-widest hidden xs:inline">
                            {isGenerating ? "Wait" : "Save"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative min-h-0 w-full">
                
                {/* MOBILE BACKDROP */}
                {(leftPanelOpen || rightPanelOpen) && (
                    <div 
                        className="lg:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm animate-in fade-in"
                        onClick={() => { setLeftPanelOpen(false); setRightPanelOpen(false); }}
                    />
                )}
                
                {/* LEFT DRAWER (Responsive) */}
                <div className={`
                    absolute lg:relative top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col z-50 transition-transform duration-300
                    ${leftPanelOpen ? "translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.8)]" : "-translate-x-full lg:translate-x-0"}
                `}>
                    <div className="flex items-center justify-between border-b border-white/5 p-2 bg-white/[0.02]">
                        <div className="flex flex-1 gap-1">
                            {["design", "layers"].map((t) => (
                                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === t ? "text-white bg-white/10" : "text-zinc-500 hover:text-white"}`}>{t}</button>
                            ))}
                        </div>
                        <button onClick={() => setLeftPanelOpen(false)} className="lg:hidden p-2 text-zinc-500"><X size={16}/></button>
                    </div>

                    <div data-lenis-prevent className="flex-grow overflow-y-auto p-6 custom-scrollbar space-y-10 pb-32 bg-black">
                        {activeTab === "design" && (
                            <>
                                <section>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Palette size={14}/> Appearance</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-white/30 transition-all">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Surface</span>
                                            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-white/30 transition-all">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Pattern</span>
                                            <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none" />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Layers size={14}/> Textures</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {["none", "hexagons", "waves", "grid", "carbon", "diamonds", "noise"].map(t => (
                                            <button key={t} onClick={() => setActiveTexture(t as any)} className={`w-12 h-12 rounded-xl border transition-all flex items-center justify-center ${activeTexture === t ? "bg-white border-white text-black shadow-lg" : "bg-white/5 border-white/10 text-zinc-600 hover:border-white/50 hover:text-white"}`}>
                                                <Layers size={16} />
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Briefcase size={14}/> Metadata</h3>
                                    <div className="space-y-4">
                                        {[ {v: phone, s: setPhone, p: "Phone Number"}, {v: email, s: setEmail, p: "Email Address"}, {v: website, s: setWebsite, p: "Personal Website"}, {v: address, s: setAddress, p: "Corporate Location"} ].map((f, i) => (
                                             <input key={i} type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-[11px] text-zinc-400 focus:border-white focus:bg-white/5 outline-none transition-all shadow-inner tracking-wide" />
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === "layers" && (
                            <div className="space-y-2">
                                {[...elements].reverse().map((el) => (
                                    <div key={el.id} onClick={() => setSelectedId(el.id)} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group cursor-pointer ${selectedId === el.id ? "bg-white/10 border-white/30 shadow-inner" : "bg-zinc-900 border-zinc-900 hover:border-zinc-800"}`}>
                                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-zinc-600 group-hover:text-white transition-colors">
                                            <GripVertical size={14} />
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase truncate">{el.type === "text" ? el.content : el.id}</p>
                                            <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">{el.type}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }, true); }} className="text-zinc-600 hover:text-white transition-colors">
                                            {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* WORKSPACE */}
                <div ref={canvasContainerRef} className="flex-grow bg-[#0c0c0e] relative flex flex-col items-center justify-center overflow-hidden h-full">
                    
                    {/* Zoom Info */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-zinc-950/80 backdrop-blur-3xl border border-zinc-900 rounded-full shadow-2xl z-20 flex items-center gap-3">
                         <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Studio Fit: {Math.round(canvasScale * 100)}%</span>
                    </div>

                    <div 
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                        className="relative group/canvas flex items-center justify-center touch-none"
                        style={{ 
                            width: `${1050 * canvasScale}px`,
                            height: `${600 * canvasScale}px`,
                        }}
                    >
                        <div className="absolute inset-0 bg-white/10 blur-[200px] rounded-full scale-150 opacity-40 group-hover/canvas:opacity-60 transition-opacity" />

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
                                className="rounded-[3rem] shadow-[0_100px_300px_rgba(0,0,0,1)] ring-1 ring-white/10 shrink-0 select-none animate-in fade-in duration-700"
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
                                        outline: selectedId === el.id ? "3px solid #ffffff" : "none",
                                        outlineOffset: "8px",
                                        minWidth: "max-content",
                                        display: "inline-block"
                                    }}
                                    className="transition-all duration-75 group/item"
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
                                        <img src={el.content} style={{ height: el.size }} className="w-auto pointer-events-none block object-contain" alt="asset" />
                                    )}
                                </div>
                            ))}

                             {/* Metadata Overlay */}
                             <div className="absolute bottom-16 right-16 flex flex-col items-end gap-3 pointer-events-none opacity-40 z-10 transition-opacity group-hover/canvas:opacity-60">
                                {phone && <div className="text-[13px] font-black tracking-[0.3em] uppercase flex items-center gap-3">{phone} <Phone size={11} className="text-zinc-500" /></div>}
                                {email && <div className="text-[13px] font-black tracking-[0.3em] uppercase flex items-center gap-3">{email} <Mail size={11} className="text-zinc-500" /></div>}
                                {website && <div className="text-[13px] font-black tracking-[0.3em] uppercase flex items-center gap-3">{website} <Globe size={11} className="text-zinc-500" /></div>}
                                {address && <div className="text-[13px] font-black tracking-[0.3em] uppercase flex items-center gap-3">{address} <MapPin size={11} className="text-zinc-500" /></div>}
                             </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PROPERTY INSPECTOR (Responsive) */}
                <div className={`
                    absolute lg:relative top-0 bottom-0 right-0 w-80 bg-zinc-950 border-l border-zinc-900 flex flex-col z-50 transition-transform duration-300
                    ${rightPanelOpen ? "translate-x-0 shadow-[-20px_0_60px_rgba(0,0,0,0.8)]" : "translate-x-full lg:translate-x-0"}
                `}>
                    {selectedElement ? (
                        <div className="flex flex-col h-full overflow-hidden">
                             <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50">
                                <div className="flex items-center gap-3">
                                     <button onClick={() => setRightPanelOpen(false)} className="lg:hidden p-1 text-zinc-500"><X size={18}/></button>
                                     <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Properties</h3>
                                </div>
                                <button onClick={() => { saveToHistory(elements.filter(el => el.id !== selectedId)); setSelectedId(null); setRightPanelOpen(false); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors bg-red-500/5 rounded-lg border border-red-500/10"><Trash2 size={16} /></button>
                             </div>

                              <div data-lenis-prevent className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-12 pb-32 bg-black">
                                <section className="space-y-10">
                                    <div>
                                        <div className="flex justify-between mb-5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Master Scale</span>
                                            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">{selectedElement.size}px</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => updateElement(selectedElement.id, { size: Math.max(4, selectedElement.size - 5) }, true)} className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-white/50 text-zinc-500 hover:text-white transition-all shadow-inner"><Minimize2 size={16} /></button>
                                             <input type="range" min="4" max="1000" value={selectedElement.size} onChange={e => updateElement(selectedElement.id, { size: parseInt(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="flex-grow scrollbar-indigo white" />
                                             <button onClick={() => updateElement(selectedElement.id, { size: selectedElement.size + 5 }, true)} className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-white/50 text-zinc-500 hover:text-white transition-all shadow-inner"><Maximize2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Transparency</span>
                                             <span className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded-md">{Math.round(selectedElement.opacity * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity} onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="w-full white" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Orientation</span>
                                            <div className="flex items-center gap-3">
                                                 <button onClick={() => updateElement(selectedElement.id, { rotation: 0 }, true)} className="text-[9px] font-black text-white hover:text-white transition-colors tracking-widest">RESET</button>
                                                 <span className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded-md">{selectedElement.rotation}°</span>
                                            </div>
                                        </div>
                                        <input type="range" min="-180" max="180" value={selectedElement.rotation} onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })} onMouseUp={() => saveToHistory(elements)} className="w-full white" />
                                    </div>
                                </section>

                                {selectedElement.type === "text" && (
                                    <section className="space-y-10 pt-12 border-t border-white/5">
                                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3"><Type size={14}/> Typography</h3>
                                         <div>
                                            <label className="text-[9px] font-black text-zinc-600 uppercase mb-5 block tracking-[0.2em]">Ink Swatch</label>
                                            <div className="flex gap-4">
                                                <input type="color" value={selectedElement.color || "#ffffff"} onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 cursor-pointer p-1.5 transition-transform active:scale-95 shadow-lg" />
                                                 <input type="text" value={selectedElement.color || "#ffffff"} onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)} className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-mono uppercase text-zinc-400 outline-none focus:border-white shadow-inner" />
                                            </div>
                                         </div>
                                         <div>
                                            <label className="text-[9px] font-black text-zinc-600 uppercase mb-5 block tracking-[0.2em]">Live Layer Content</label>
                                             <textarea value={selectedElement.content} onChange={e => updateElement(selectedElement.id, { content: e.target.value })} onBlur={() => saveToHistory(elements)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-[11px] text-white focus:border-white outline-none h-32 resize-none leading-relaxed transition-all shadow-inner" />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                            {[ {l: "Black", w: "900"}, {l: "Bold", w: "700"}, {l: "Medium", w: "400"}, {l: "Light", w: "200"} ].map(w => (
                                                <button key={w.w} onClick={() => updateElement(selectedElement.id, { fontWeight: w.w }, true)} className={`py-4 text-[9px] font-black uppercase rounded-2xl border transition-all tracking-[0.1em] ${selectedElement.fontWeight === w.w ? "bg-white text-black border-white shadow-2xl scale-[1.03]" : "bg-white/5 text-zinc-500 border-white/10 hover:text-white hover:bg-white/10"}`}>
                                                    {w.l}
                                                </button>
                                            ))}
                                         </div>
                                    </section>
                                )}

                                <section className="pt-12 border-t border-white/5">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><AlignLeft size={14}/> Studio Align</h3>                                     <div className="space-y-3">
                                        <button onClick={() => updateElement(selectedElement.id, { x: 525 - (elWidth(selectedElement)/2) }, true)} className="w-full h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3">
                                            <AlignCenter size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Align Horizontal</span>
                                        </button>
                                        <button onClick={() => updateElement(selectedElement.id, { y: 300 - (selectedElement.size/2) }, true)} className="w-full h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3">
                                            <AlignLeft size={14} className="rotate-90" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Align Vertical</span>
                                        </button>
                                    </div>

                                </section>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-8">
                            <div className="relative">
                                <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-zinc-600 border border-white/10 shadow-2xl relative backdrop-blur-3xl">
                                    <Sparkles size={32} strokeWidth={1} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Perspective Stage</h3>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase leading-[2.5] tracking-widest max-w-[200px] mx-auto">Select a layer element to access professional-grade property controllers.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255,0.3); }
                
                input[type='range'] {
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.05);
                    height: 2px;
                    border-radius: 10px;
                }

                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                    border: 2px solid #000;
                    transition: all 0.2s ease;
                }

                input[type='range']::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
                }
            `}</style>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Professional Design Infrastructure"
            >
                <div className="max-w-6xl mx-auto space-y-12 sm:space-y-24 text-left pb-12 sm:pb-24 px-2 sm:px-0">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-[2rem] sm:rounded-3xl border border-zinc-800/50 text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto animate-in fade-in duration-1000">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6">
                            The Future of Networking: Professional Business Card Studio
                        </h3>
                        <p className="text-sm sm:text-lg md:text-xl leading-relaxed text-zinc-500 font-medium">
                            Welcome to the AssetNest <strong>Business Card Design Studio</strong>—the world&apos;s most intuitive, browser-based professional design environment. Stop relying on generic templates and static creators. Our StudioMaster engine provides an interactive, layer-based workflow that allows you to drag, rotate, and scale every element with pixel perfection. Whether you are a corporate executive or a creative freelancer, our tool ensures your first impression is not just a card, but a piece of modern art.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                        <div className="p-6 sm:p-10 bg-zinc-950/50 border border-zinc-900 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-6 group hover:border-zinc-700 transition-all">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                <PenTool size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6">Layer-Based Workflow</h3>
                            <p className="text-[11px] sm:text-sm text-zinc-600 leading-relaxed font-bold uppercase tracking-tight">Full control over z-index and visibility. Manage your design like a pro in Photoshop, but without the complexity.</p>
                        </div>
                        <div className="p-6 sm:p-10 bg-zinc-950/50 border border-zinc-900 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-6 group hover:border-zinc-700 transition-all">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                <Palette size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6">Texture Synthesis</h3>
                            <p className="text-[11px] sm:text-sm text-zinc-600 leading-relaxed font-bold uppercase tracking-tight">Apply organic textures like Linen, Mesh, and Carbon Fiber to your card surface for a premium physical feel.</p>
                        </div>
                        <div className="p-6 sm:p-10 bg-zinc-950/50 border border-zinc-900 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-6 group hover:border-zinc-700 transition-all">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                <ShieldCheck size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6">100% Private Export</h3>
                            <p className="text-[11px] sm:text-sm text-zinc-600 leading-relaxed font-bold uppercase tracking-tight">We never store your contact data. Everything is processed locally in your browser for absolute security.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-950/30 border border-zinc-900 rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-12 md:p-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
                            <div className="space-y-6 sm:space-y-10">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6">Design Briefing & FAQ</h3>
                                <Accordion>
                                    <AccordionItem title="What is the export resolution?">
                                        Our StudioMaster engine exports in Ultra-High Resolution (4x Scale), making it ready for professional offset or digital printing without loss of quality.
                                    </AccordionItem>
                                    <AccordionItem title="Can I upload my own logo?">
                                        Yes! Use the &quot;Image&quot; upload button in the top toolbar to import your brand assets. We support PNG, JPG, and SVG formats.
                                    </AccordionItem>
                                    <AccordionItem title="How do I align elements to the center?">
                                        Select any element and use the &quot;Studio Align&quot; buttons in the right panel to perfectly center them horizontally or vertically.
                                    </AccordionItem>
                                </Accordion>
                            </div>
                            <div className="space-y-6 sm:space-y-10 flex flex-col justify-center bg-zinc-900/40 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/5">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-2 sm:mb-6 flex items-center gap-2">
                                    <Sparkles className="text-zinc-500" size={24} />
                                    Pro Tip: Studio Shortcuts
                                </h3>
                                <div className="space-y-2 sm:space-y-4">
                                     <div className="flex items-center justify-between py-2 sm:py-3 border-b border-white/5">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap mr-2">Undo Change</span>
                                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white font-mono uppercase tracking-tighter whitespace-nowrap">Ctrl + Z</kbd>
                                     </div>
                                     <div className="flex items-center justify-between py-2 sm:py-3 border-b border-white/5">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap mr-2">Redo Change</span>
                                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white font-mono uppercase tracking-tighter whitespace-nowrap">Ctrl + Y</kbd>
                                     </div>
                                     <div className="flex items-center justify-between py-2 sm:py-3">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap mr-2">Delete Layer</span>
                                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white font-mono uppercase tracking-tighter whitespace-nowrap">Delete</kbd>
                                     </div>
                                </div>
                                <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest text-center mt-4 sm:mt-6 italic">© 2026 AssetNest Studio Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </HelpModal>
        </div>
    );
}

function elWidth(el: DragElement) {
    if (el.type === "text") return el.content.length * (el.size * 0.55);
    return el.size;
}
