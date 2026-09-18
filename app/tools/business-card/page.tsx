"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Download, CreditCard, Upload, MapPin, Phone, Mail, Globe, Briefcase,
  Zap, Palette, PenTool, ShieldCheck, Plus, Trash2, Layers,
  Maximize2, Minimize2, Type, AlignLeft, AlignCenter, Eye, EyeOff,
  SlidersHorizontal, Undo2, Redo2, RotateCcw, X, ArrowLeft, HelpCircle,
  Sparkles, Check, ChevronDown, Move, Copy
} from "lucide-react";
import html2canvas from "html2canvas";
import HelpModal from "@/components/HelpModal";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#333333",
  surface:     "#3a3a3a",
  surfaceHi:   "#444444",
  surfaceHov:  "#505050",
  border:      "#555555",
  borderDim:   "#2a2a2a",
  accent:      "#4db8d4",
  accentDark:  "#2a7a8f",
  accentDim:   "rgba(77,184,212,0.15)",
  textPri:     "#cccccc",
  textSec:     "#999999",
  muted:       "#777777",
  danger:      "#cc4444",
  success:     "#7dcea0",
  font:        "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

type TextureType = "none" | "hexagons" | "waves" | "grid" | "carbon" | "diamonds" | "noise";

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
  { id: "name", type: "text", content: "ALEX RIVERS", x: 60, y: 160, size: 52, rotation: 0, opacity: 1, fontWeight: "900", letterSpacing: -1, visible: true, locked: false, zIndex: 11 },
  { id: "title", type: "text", content: "LEAD PRODUCT DESIGNER", x: 60, y: 226, size: 14, rotation: 0, opacity: 0.6, fontWeight: "700", letterSpacing: 5, visible: true, locked: false, zIndex: 12 },
  { id: "brand-icon", type: "icon", content: "Zap", x: 520, y: 140, size: 130, rotation: 0, opacity: 0.12, visible: true, locked: false, zIndex: 5 }
];

const PRESET_THEMES = [
  { name: "Executive Dark", bg: "#1e1e1e", pattern: "#ffffff", texture: "hexagons" as TextureType },
  { name: "Slate Minimal",  bg: "#252830", pattern: "#4db8d4", texture: "grid" as TextureType },
  { name: "Deep Cyan",      bg: "#0d2b33", pattern: "#4db8d4", texture: "waves" as TextureType },
  { name: "Carbon Tech",    bg: "#141414", pattern: "#666666", texture: "carbon" as TextureType },
  { name: "Monochrome Pro", bg: "#2a2a2a", pattern: "#aaaaaa", texture: "diamonds" as TextureType },
  { name: "Midnight Navy",  bg: "#0f172a", pattern: "#94a3b8", texture: "none" as TextureType },
];

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 2,
      background: T.surface, border: `1px solid ${T.border}`,
      fontSize: 10, fontWeight: 400, color: "#aaa",
    }}>
      {icon}{label}
    </span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
      padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.textPri, margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
        </h4>
        <span style={{ color: T.textSec, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
      </div>
    </div>
  );
}

function elWidth(el: DragElement) {
  if (el.type === "text") return el.content.length * (el.size * 0.55);
  return el.size;
}

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
  const [isClient, setIsClient] = useState(false);

  // Style State
  const [themeColor, setThemeColor] = useState("#1e1e1e");
  const [activeTexture, setActiveTexture] = useState<TextureType>("hexagons");
  const [patternColor, setPatternColor] = useState("#ffffff");

  // Mobile Drawer State
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Contact Data
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [email, setEmail] = useState("alex@acmestudio.design");
  const [website, setWebsite] = useState("www.acmestudio.design");
  const [address, setAddress] = useState("San Francisco, CA");

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        const availableH = container.clientHeight - 60;
        const scale = Math.min(availableW / 1050, availableH / 600, 1.0);
        setCanvasScale(Math.max(scale, 0.25));
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
      x: 525 - 70,
      y: 300 - 25,
      size: type === "text" ? 24 : 100,
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
    e.target.value = "";
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
        const cardName = elements.find(el => el.id === "name")?.content || "BusinessCard";
        const link = document.createElement("a");
        link.download = `${cardName.replace(/\s+/g, "_")}_BusinessCard.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Card generation failed:", err);
      } finally { 
        setIsGenerating(false); 
      }
    }, 400);
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
      const x = (e.clientX - cardRect.left) / canvasScale - dragOffset.x;
      const y = (e.clientY - cardRect.top) / canvasScale - dragOffset.y;
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
      case "hexagons": return `data:image/svg+xml,%3Csvg width='40' height='70' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5z' fill='${c}' fill-opacity='0.08'/%3E%3C/svg%3E`;
      case "waves": return `data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 20 50 10 T 100 10' fill='none' stroke='${c}' stroke-opacity='0.08' stroke-width='2'/%3E%3C/svg%3E`;
      case "grid": return `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40h40V0H0v40zM39 39H1V1h38v38z' fill='${c}' fill-opacity='0.06'/%3E%3C/svg%3E`;
      case "diamonds": return `data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l15 15-15 15L0 15z' fill='${c}' fill-opacity='0.08'/%3E%3C/svg%3E`;
      case "carbon": return `data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='${c}' fill-opacity='0.05'/%3E%3Crect x='8' y='8' width='8' height='8' fill='${c}' fill-opacity='0.05'/%3E%3C/svg%3E`;
      default: return "";
    }
  };

  if (!isClient) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${T.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.textPri, display: "flex", flexDirection: "column" }}>
      
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header style={{
        height: 48, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", position: "sticky", top: 0, zIndex: 40, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/tools" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            color: T.textSec, textDecoration: "none", fontSize: 12,
            padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
            border: `1px solid ${T.border}`, transition: "color 0.15s",
          }}>
            <ArrowLeft size={13} /> Back
          </Link>

          {/* Mobile Drawers Toggles */}
          <button 
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="mobile-only-btn"
            style={{
              padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11, cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={13} />
          </button>

          <div style={{ width: 1, height: 16, background: T.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 4, background: T.accentDim,
              border: `1px solid ${T.accent}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.accent,
            }}>
              <CreditCard size={13} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>Business Card Studio</span>
              <span style={{ fontSize: 10, color: T.textSec, marginLeft: 8 }}>4K Print Ready</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", background: T.surfaceHi, borderRadius: 3, border: `1px solid ${T.border}`, padding: 2 }}>
            <button 
              onClick={undo} 
              disabled={history.length === 0} 
              title="Undo (Ctrl+Z)"
              style={{
                width: 26, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", color: history.length === 0 ? T.muted : T.textPri,
                cursor: history.length === 0 ? "not-allowed" : "pointer", borderRadius: 2,
              }}
            >
              <Undo2 size={12} />
            </button>
            <button 
              onClick={redo} 
              disabled={redoStack.length === 0} 
              title="Redo (Ctrl+Y)"
              style={{
                width: 26, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", color: redoStack.length === 0 ? T.muted : T.textPri,
                cursor: redoStack.length === 0 ? "not-allowed" : "pointer", borderRadius: 2,
              }}
            >
              <Redo2 size={12} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button 
              onClick={() => addElement("text", "New Layer")} 
              title="Add text layer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
                border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11, cursor: "pointer",
              }}
            >
              <Plus size={12} /> Text
            </button>

            <label 
              title="Upload image / logo"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
                border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11, cursor: "pointer",
              }}
            >
              <Upload size={12} /> Logo
              <input type="file" style={{ display: "none" }} accept="image/*" onChange={(e) => handleFileUpload(e, "logo")} />
            </label>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 3, background: T.accent,
              border: "none", color: "#111", fontSize: 11, fontWeight: 600,
              cursor: isGenerating ? "not-allowed" : "pointer", transition: "opacity 0.15s",
            }}
          >
            {isGenerating ? <RotateCcw size={12} className="animate-spin" /> : <Download size={12} />}
            <span>{isGenerating ? "Rendering…" : "Export 4K PNG"}</span>
          </button>

          <button
            onClick={() => setShowHelp(true)}
            title="Help & Specs"
            style={{
              width: 28, height: 28, borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.textSec, cursor: "pointer",
            }}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </header>

      {/* ── Studio Canvas & Sidebars ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", height: "calc(100vh - 48px)", overflow: "hidden", position: "relative" }}>
        
        {/* ── LEFT DRAWER: Design & Layers ── */}
        <aside style={{
          width: 280, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", zIndex: 30,
        }}>
          {/* Tab Switcher */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surfaceHi, padding: 3 }}>
            <button
              onClick={() => setActiveTab("design")}
              style={{
                flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600,
                background: activeTab === "design" ? T.surface : "transparent",
                color: activeTab === "design" ? T.accent : T.textSec,
                border: "none", borderRadius: 2, cursor: "pointer",
              }}
            >
              Design & Colors
            </button>
            <button
              onClick={() => setActiveTab("layers")}
              style={{
                flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600,
                background: activeTab === "layers" ? T.surface : "transparent",
                color: activeTab === "layers" ? T.accent : T.textSec,
                border: "none", borderRadius: 2, cursor: "pointer",
              }}
            >
              Layers ({elements.length})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
            {activeTab === "design" ? (
              <>
                {/* Theme Presets */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                    Preset Palettes
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                    {PRESET_THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => {
                          setThemeColor(theme.bg);
                          setPatternColor(theme.pattern);
                          setActiveTexture(theme.texture);
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "5px 6px", borderRadius: 3, background: T.surfaceHi,
                          border: `1px solid ${themeColor === theme.bg ? T.accent : T.border}`,
                          color: themeColor === theme.bg ? T.accent : T.textPri,
                          fontSize: 10, cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <span style={{ width: 12, height: 12, borderRadius: 2, background: theme.bg, border: `1px solid ${T.border}` }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Surface Colors */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Card Appearance
                  </label>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surfaceHi, padding: "6px 8px", borderRadius: 3, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 11, color: T.textPri }}>Card Background</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: T.textSec }}>{themeColor}</span>
                      <input 
                        type="color" 
                        value={themeColor} 
                        onChange={e => setThemeColor(e.target.value)} 
                        style={{ width: 22, height: 22, border: `1px solid ${T.border}`, borderRadius: 3, background: "none", cursor: "pointer", padding: 0 }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surfaceHi, padding: "6px 8px", borderRadius: 3, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 11, color: T.textPri }}>Pattern Overlay Tint</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: T.textSec }}>{patternColor}</span>
                      <input 
                        type="color" 
                        value={patternColor} 
                        onChange={e => setPatternColor(e.target.value)} 
                        style={{ width: 22, height: 22, border: `1px solid ${T.border}`, borderRadius: 3, background: "none", cursor: "pointer", padding: 0 }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Texture Overlays */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                    Surface Pattern Texture
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                    {(["none", "hexagons", "waves", "grid", "carbon", "diamonds"] as TextureType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTexture(t)}
                        style={{
                          padding: "5px 4px", borderRadius: 3,
                          background: activeTexture === t ? T.accentDim : T.surfaceHi,
                          border: `1px solid ${activeTexture === t ? T.accent : T.border}`,
                          color: activeTexture === t ? T.accent : T.textPri,
                          fontSize: 10, textTransform: "capitalize", cursor: "pointer",
                        }}
                      >
                        {t === "none" ? "None" : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Overlay Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Corner Contact Details
                  </label>
                  {[
                    { v: phone, s: setPhone, p: "Phone number", icon: <Phone size={11} /> },
                    { v: email, s: setEmail, p: "Email address", icon: <Mail size={11} /> },
                    { v: website, s: setWebsite, p: "Website URL", icon: <Globe size={11} /> },
                    { v: address, s: setAddress, p: "Address / City", icon: <MapPin size={11} /> }
                  ].map((field, i) => (
                    <div key={i} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: 8, color: T.textSec }}>{field.icon}</span>
                      <input
                        type="text"
                        placeholder={field.p}
                        value={field.v}
                        onChange={e => field.s(e.target.value)}
                        style={{
                          width: "100%", padding: "5px 8px 5px 26px", background: T.surfaceHi,
                          border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                          fontSize: 11, outline: "none", boxSizing: "border-box",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = T.accent}
                        onBlur={e => e.currentTarget.style.borderColor = T.border}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Layers View */
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...elements].reverse().map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 8px", borderRadius: 3,
                      background: selectedId === el.id ? T.accentDim : T.surfaceHi,
                      border: `1px solid ${selectedId === el.id ? T.accent : T.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: 8, textTransform: "uppercase", padding: "1px 4px",
                        borderRadius: 2, background: T.surface, color: T.textSec, border: `1px solid ${T.border}`,
                      }}>
                        {el.type}
                      </span>
                      <span style={{
                        fontSize: 11, color: selectedId === el.id ? T.accent : T.textPri,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {el.type === "text" ? el.content : el.id}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { visible: !el.visible }, true);
                        }}
                        style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", padding: 2 }}
                      >
                        {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveToHistory(elements.filter(item => item.id !== el.id));
                          if (selectedId === el.id) setSelectedId(null);
                        }}
                        style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", padding: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = T.danger}
                        onMouseLeave={e => e.currentTarget.style.color = T.textSec}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER WORKSPACE: Card Canvas ── */}
        <main 
          ref={canvasContainerRef}
          style={{
            flex: 1, background: T.bg, position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            backgroundImage: `radial-gradient(${T.borderDim} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        >
          {/* Zoom floating pill */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: "2px 10px", fontSize: 10, color: T.textSec, zIndex: 10,
          }}>
            Canvas Scale: {Math.round(canvasScale * 100)}%
          </div>

          <div 
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ 
              width: `${1050 * canvasScale}px`,
              height: `${600 * canvasScale}px`,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
          >
            <div 
              style={{ 
                transform: `scale(${canvasScale})`,
                transformOrigin: "center center",
                width: "1050px",
                height: "600px",
                flexShrink: 0,
              }}
            >
              <div 
                ref={cardRef}
                id="business-card-canvas"
                style={{ 
                  width: "1050px", height: "600px", 
                  background: themeColor, overflow: "hidden", 
                  position: "relative",
                  borderRadius: "28px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  border: `2px solid ${T.border}`,
                  userSelect: "none",
                }}
              >
                {/* Texture Pattern Background */}
                {activeTexture !== "none" && (
                  <div 
                    style={{ 
                      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
                      backgroundImage: `url("${getPatternSvg(activeTexture, patternColor)}")`,
                      backgroundRepeat: "repeat",
                      opacity: 0.85,
                    }} 
                  />
                )}

                {/* Draggable & Editable Elements */}
                {elements.filter(el => el.visible).sort((a, b) => a.zIndex - b.zIndex).map((el) => (
                  <div 
                    key={el.id}
                    onPointerDown={(e) => onPointerDown(e, el.id)}
                    style={{ 
                      left: el.x, top: el.y, opacity: el.opacity,
                      transform: `rotate(${el.rotation}deg)`,
                      zIndex: el.zIndex,
                      position: "absolute",
                      cursor: el.locked ? "default" : "move",
                      padding: "6px 8px",
                      outline: selectedId === el.id ? `2px solid ${T.accent}` : "none",
                      outlineOffset: "2px",
                      minWidth: "max-content",
                      display: "inline-block",
                      borderRadius: 2,
                      transition: "outline 0.1s",
                    }}
                  >
                    {el.type === "text" && (
                      <div style={{ 
                        fontSize: el.size, 
                        fontWeight: el.fontWeight as any, 
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined, 
                        color: el.color || "#ffffff",
                        lineHeight: 1.1,
                        whiteSpace: "nowrap",
                      }}>
                        {el.content}
                      </div>
                    )}
                    {el.type === "icon" && (
                      <Zap size={el.size} strokeWidth={1.5} style={{ color: el.color || "#ffffff" }} />
                    )}
                    {(el.type === "logo" || el.type === "image") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={el.content} style={{ height: el.size }} className="pointer-events-none block object-contain" alt="brand asset" />
                    )}
                  </div>
                ))}

                {/* Corner Contact Details Overlay */}
                <div style={{
                  position: "absolute", bottom: 40, right: 45,
                  display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
                  pointerEvents: "none", opacity: 0.7, zIndex: 15,
                }}>
                  {phone && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>{phone} <Phone size={11} style={{ opacity: 0.6 }} /></div>}
                  {email && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>{email} <Mail size={11} style={{ opacity: 0.6 }} /></div>}
                  {website && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>{website} <Globe size={11} style={{ opacity: 0.6 }} /></div>}
                  {address && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>{address} <MapPin size={11} style={{ opacity: 0.6 }} /></div>}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT DRAWER: Inspector ── */}
        <aside style={{
          width: 280, flexShrink: 0, background: T.surface, borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", zIndex: 30,
        }}>
          {selectedElement ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div style={{
                padding: "8px 12px", borderBottom: `1px solid ${T.border}`,
                background: T.surfaceHi, display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SlidersHorizontal size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri, textTransform: "uppercase" }}>
                    {selectedElement.type} Inspector
                  </span>
                </div>
                <button 
                  onClick={() => {
                    saveToHistory(elements.filter(el => el.id !== selectedId));
                    setSelectedId(null);
                  }}
                  title="Delete element"
                  style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", padding: 2 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Size slider */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textSec, marginBottom: 4 }}>
                    <span>Element Size</span>
                    <span style={{ fontFamily: "monospace", color: T.accent }}>{selectedElement.size}px</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button 
                      onClick={() => updateElement(selectedElement.id, { size: Math.max(8, selectedElement.size - 4) }, true)}
                      style={{ padding: "3px 6px", background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textPri, cursor: "pointer" }}
                    >
                      -
                    </button>
                    <input 
                      type="range" min="8" max="400" value={selectedElement.size} 
                      onChange={e => updateElement(selectedElement.id, { size: parseInt(e.target.value) })}
                      onMouseUp={() => saveToHistory(elements)}
                      style={{ flex: 1, accentColor: T.accent }} 
                    />
                    <button 
                      onClick={() => updateElement(selectedElement.id, { size: selectedElement.size + 4 }, true)}
                      style={{ padding: "3px 6px", background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 2, color: T.textPri, cursor: "pointer" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textSec, marginBottom: 4 }}>
                    <span>Opacity</span>
                    <span style={{ fontFamily: "monospace", color: T.accent }}>{Math.round(selectedElement.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="1" step="0.05" value={selectedElement.opacity} 
                    onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                    onMouseUp={() => saveToHistory(elements)}
                    style={{ width: "100%", accentColor: T.accent }} 
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textSec, marginBottom: 4 }}>
                    <span>Rotation</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => updateElement(selectedElement.id, { rotation: 0 }, true)} style={{ fontSize: 9, color: T.accent, background: "none", border: "none", cursor: "pointer" }}>Reset</button>
                      <span style={{ fontFamily: "monospace", color: T.textPri }}>{selectedElement.rotation}°</span>
                    </div>
                  </div>
                  <input 
                    type="range" min="-180" max="180" value={selectedElement.rotation} 
                    onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                    onMouseUp={() => saveToHistory(elements)}
                    style={{ width: "100%", accentColor: T.accent }} 
                  />
                </div>

                {/* Text specific controls */}
                {selectedElement.type === "text" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: `1px solid ${T.borderDim}` }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                        Text Color
                      </label>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input 
                          type="color" 
                          value={selectedElement.color || "#ffffff"} 
                          onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)}
                          style={{ width: 26, height: 26, border: `1px solid ${T.border}`, borderRadius: 3, background: "none", cursor: "pointer", padding: 0 }} 
                        />
                        <input 
                          type="text" 
                          value={selectedElement.color || "#ffffff"} 
                          onChange={e => updateElement(selectedElement.id, { color: e.target.value }, true)}
                          style={{ flex: 1, padding: "4px 8px", background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri, fontSize: 11, fontFamily: "monospace", outline: "none" }} 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                        Content
                      </label>
                      <textarea
                        value={selectedElement.content}
                        onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                        onBlur={() => saveToHistory(elements)}
                        style={{
                          width: "100%", padding: "6px 8px", background: T.surfaceHi,
                          border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                          fontSize: 11, outline: "none", resize: "none", height: 60, boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 4 }}>
                        Font Weight
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        {[
                          { l: "Black (900)", w: "900" },
                          { l: "Bold (700)", w: "700" },
                          { l: "Medium (500)", w: "500" },
                          { l: "Light (300)", w: "300" }
                        ].map(wt => (
                          <button
                            key={wt.w}
                            onClick={() => updateElement(selectedElement.id, { fontWeight: wt.w }, true)}
                            style={{
                              padding: "4px 6px", borderRadius: 2,
                              background: selectedElement.fontWeight === wt.w ? T.accentDim : T.surfaceHi,
                              border: `1px solid ${selectedElement.fontWeight === wt.w ? T.accent : T.border}`,
                              color: selectedElement.fontWeight === wt.w ? T.accent : T.textPri,
                              fontSize: 10, cursor: "pointer",
                            }}
                          >
                            {wt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alignment */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: `1px solid ${T.borderDim}` }}>
                  <label style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase" }}>
                    Center Alignment
                  </label>
                  <button
                    onClick={() => updateElement(selectedElement.id, { x: 525 - (elWidth(selectedElement) / 2) }, true)}
                    style={{
                      padding: "6px 8px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                      borderRadius: 3, color: T.textPri, fontSize: 10, display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer",
                    }}
                  >
                    <AlignCenter size={12} /> Align Center Horizontally
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { y: 300 - (selectedElement.size / 2) }, true)}
                    style={{
                      padding: "6px 8px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                      borderRadius: 3, color: T.textPri, fontSize: 10, display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer",
                    }}
                  >
                    <AlignLeft size={12} style={{ transform: "rotate(90deg)" }} /> Align Center Vertically
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: T.surfaceHi,
                border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
                justifyContent: "center", color: T.textSec, marginBottom: 8,
              }}>
                <Sparkles size={16} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri }}>No Layer Selected</span>
              <p style={{ fontSize: 10, color: T.textSec, margin: "4px 0 0", lineHeight: 1.4 }}>
                Click on any text or graphic element in the card canvas to customize its typography, scale, rotation, and colors.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── SEO & Specs Documentation Section ──────────────────────────────── */}
      <section style={{
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: "24px 20px",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Chip icon={<CreditCard size={11} style={{ color: T.accent }} />} label="Standard 3.5 × 2 Inch Aspect Ratio" />
            <Chip icon={<Download size={11} style={{ color: T.accent }} />} label="Ultra High-Res 4X PNG Export" />
            <Chip icon={<Layers size={11} style={{ color: T.accent }} />} label="Multi-Layer Drag & Drop Positioning" />
            <Chip icon={<ShieldCheck size={11} style={{ color: T.accent }} />} label="100% Client-Side Private Rendering" />
          </div>

          {/* 6 Features Grid */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              Professional Card Studio Capabilities
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Download size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>4X Print-Ready Resolution</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Renders the 1050×600 canvas at a 4× pixel multiplier, outputting razor-sharp 4200×2400 PNG images ready for professional print houses.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Move size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Drag & Drop Layer Engine</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Position elements anywhere on the canvas with pointer capture. Auto-scales coordinates regardless of browser window dimensions.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Palette size={13} style={{ color: T.success }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Procedural Geometric Textures</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Overlay procedural vector textures including Hexagons, Waves, Technical Grids, Carbon fiber, and Diamonds with custom color tinting.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Zero Cloud & Total Privacy</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Your business names, contact details, and uploaded brand assets never upload to external servers. All generation runs in client RAM.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Type size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Full Typography Controls</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Customize font weights from Light (300) to Black (900), letter spacing tracking, color palettes, and rotation angles.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Undo2 size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Undo / Redo History Stack</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Standard keyboard shortcuts (Ctrl+Z / Ctrl+Y) and top bar controls let you experiment freely without losing previous designs.
                </p>
              </div>
            </div>
          </div>

          {/* 3-Step Timeline */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              How to Create Your Business Card
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 1</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Pick Palette & Texture</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Select one of our preset palettes or customize the surface color and vector texture overlay from the left sidebar.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 2</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Edit Details & Upload Logo</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Drag your name and title into position. Enter phone, email, and website details. Upload your company emblem or logo.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 3</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Export High-Res PNG</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Click "Export 4K PNG" to generate a high-density, print-ready file for physical card printing or digital networking.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              AssetNest Card Studio vs Online Card Makers
            </h3>
            <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "8px 10px", color: T.textPri, fontWeight: 600 }}>Feature</th>
                    <th style={{ padding: "8px 10px", color: T.accent, fontWeight: 600 }}>AssetNest Card Studio</th>
                    <th style={{ padding: "8px 10px", color: T.textSec, fontWeight: 600 }}>Commercial Card Generators (Canva, etc.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Resolution & Pricing</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Free 4X Density Export</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>High-res locked behind Pro subscription</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Sign-Up / Account</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>No account required</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Mandatory account creation</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Data Privacy</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>100% In-browser (No tracking)</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Personal contact info stored on cloud servers</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Watermarks</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Zero watermarks</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Watermarked on free plans</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Undo / History</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Unlimited local undo/redo stack</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Varies by tier</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive FAQs */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <FAQItem 
                question="What are the dimensions of the exported business card?" 
                answer="The canvas uses the standard 3.5 × 2 inch ratio (1050 × 600 px). When exported with the 4x density multiplier, the resulting PNG is 4200 × 2400 pixels at 300+ DPI, ensuring zero pixelation when sent to physical print services." 
              />
              <FAQItem 
                question="Can I upload transparent PNG logos?" 
                answer="Yes! Click the 'Logo' button in the top toolbar to upload any PNG or JPG. Transparent PNGs blend seamlessly over your selected background and texture pattern." 
              />
              <FAQItem 
                question="How do I change text properties like font weight or color?" 
                answer="Click directly on any text layer on the card canvas. The right Inspector drawer will automatically open with controls for font weight (Black, Bold, Medium, Light), letter spacing, text color, size slider, and horizontal/vertical centering." 
              />
              <FAQItem 
                question="Is my business information kept private?" 
                answer="Yes! AssetNest operates on a 100% client-side privacy model. Your names, phone numbers, and uploaded brand assets are rendered purely in your browser's local memory and are never uploaded to any remote server." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Help / Technical Specs Modal ────────────────────────────────────── */}
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Business Card Studio Technical Specs"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, color: T.textPri, fontSize: 12, lineHeight: 1.5 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 4px 0" }}>Print-Ready Business Card Generator</h4>
            <p style={{ margin: 0, color: T.textSec }}>
              AssetNest Business Card Studio provides an in-browser vector and raster composite studio optimized for rapid corporate brand asset creation.
            </p>
          </div>

          <div style={{ background: T.surfaceHi, padding: 10, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <h5 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: "0 0 6px 0" }}>Keyboard & Canvas Shortcuts</h5>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.textSec, display: "flex", flexDirection: "column", gap: 4 }}>
              <li><strong>Ctrl + Z</strong>: Undo last card modification</li>
              <li><strong>Ctrl + Y</strong> (or Ctrl + Shift + Z): Redo undone action</li>
              <li><strong>Delete / Backspace</strong>: Remove selected layer</li>
              <li><strong>Click on canvas element</strong>: Open right inspector to configure typography and alignment</li>
              <li><strong>Drag any element</strong>: Fluid position realignment with pointer capture</li>
            </ul>
          </div>
        </div>
      </HelpModal>
    </div>
  );
}
