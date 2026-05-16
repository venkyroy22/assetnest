"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer2, Hand, StickyNote as StickyIcon, Type, Minus, Plus,
  RotateCcw, Trash2, Link as LinkIcon, Pencil, Eraser, Lock,
  Unlock, ArrowUp, ArrowDown, FileJson, Upload, Image as ImageIcon,
  Sparkles, Eye, EyeOff, X, CornerUpLeft, CornerUpRight, Grid3x3,
  Copy, Square, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Magnet, ChevronRight, ChevronDown,
  Download, Maximize2, Minimize2, Check, Layout, Search as SearchIcon,
  PanelRightClose, PanelRightOpen, Scan, Move
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import html2canvas from "html2canvas";
import { useSidebar } from "@/components/SidebarProvider";
import { ALL_TOOLS } from "@/lib/tools";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasElement {
  id: string; type: "note" | "text" | "shape" | "widget"; shapeType?: "rect" | "circle" | "diamond";
  x: number; y: number; width: number; height: number;
  content: string; color: string; rotate?: number; isLocked?: boolean; zIndex: number;
  fontSize?: number; fontStyle?: "normal" | "bold" | "italic"; textAlign?: "left" | "center" | "right";
  opacity?: number; toolId?: string;
}
interface Connection { id: string; fromId: string; toId: string; }
interface DrawPath { id: string; points: { x: number; y: number }[]; color: string; width: number; }
interface ViewState { x: number; y: number; scale: number; }

// ─── PS Color Palette ─────────────────────────────────────────────────────────

// PS UI tokens
const PS = {
  bg:        "#1A1A1A",
  panel:     "#252525",
  sidebar:   "#2B2B2B",
  toolbar:   "rgba(42,42,42,0.97)",
  border:    "rgba(255,255,255,0.09)",
  borderMid: "rgba(255,255,255,0.13)",
  hover:     "rgba(255,255,255,0.06)",
  active:    "rgba(74,144,217,0.22)",
  accent:    "#4A90D9",
  accentDim: "rgba(74,144,217,0.55)",
  accentBg:  "rgba(74,144,217,0.15)",
  text:      "#C8C8C8",
  textDim:   "#888888",
  textMuted: "#555555",
  red:       "#E05252",
  redBg:     "rgba(224,82,82,0.12)",
  shadow:    "0 8px 32px rgba(0,0,0,0.6)",
};

const COLORS = [
  { name: "Amber",   hex: "#f59e0b", bg: "#fef3c7", text: "#78350f", border: "#fcd34d", grad: "linear-gradient(145deg,#fef9c3,#fde68a)" },
  { name: "Sky",     hex: "#0ea5e9", bg: "#e0f2fe", text: "#0c4a6e", border: "#7dd3fc", grad: "linear-gradient(145deg,#e0f2fe,#bae6fd)" },
  { name: "Emerald", hex: "#10b981", bg: "#d1fae5", text: "#064e3b", border: "#6ee7b7", grad: "linear-gradient(145deg,#dcfce7,#a7f3d0)" },
  { name: "Rose",    hex: "#f43f5e", bg: "#ffe4e6", text: "#881337", border: "#fca5a5", grad: "linear-gradient(145deg,#ffe4e6,#fecdd3)" },
  { name: "Violet",  hex: "#8b5cf6", bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd", grad: "linear-gradient(145deg,#f3e8ff,#e9d5ff)" },
  { name: "Coral",   hex: "#f97316", bg: "#fff7ed", text: "#7c2d12", border: "#fdba74", grad: "linear-gradient(145deg,#ffedd5,#fed7aa)" },
  { name: "Teal",    hex: "#14b8a6", bg: "#ccfbf1", text: "#134e4a", border: "#5eead4", grad: "linear-gradient(145deg,#ccfbf1,#99f6e4)" },
  { name: "Slate",   hex: "#64748b", bg: "#1e293b", text: "#e2e8f0", border: "#475569", grad: "linear-gradient(145deg,#1e293b,#0f172a)" },
];
type ColorDef = typeof COLORS[0];
const getColor = (name: string): ColorDef => COLORS.find((c) => c.name === name) ?? COLORS[0];

const PEN_COLORS = ["#4A90D9","#ec4899","#10b981","#f59e0b","#ef4444","#ffffff","#888888"];

const TEMPLATES = {
  mindmap: {
    name: "Mind Map", emoji: "🧠",
    elements: [
      { id:"r", type:"note", x:350, y:240, w:200, h:100, content:"✨ Central Idea", color:"Violet" },
      { id:"a", type:"note", x:60,  y:120, w:170, h:80,  content:"Branch A", color:"Sky" },
      { id:"b", type:"note", x:640, y:120, w:170, h:80,  content:"Branch B", color:"Emerald" },
      { id:"c", type:"note", x:60,  y:360, w:170, h:80,  content:"Branch C", color:"Amber" },
      { id:"d", type:"note", x:640, y:360, w:170, h:80,  content:"Branch D", color:"Rose" },
    ],
    connections: [ {from:"r",to:"a"},{from:"r",to:"b"},{from:"r",to:"c"},{from:"r",to:"d"} ],
  },
  swot: {
    name: "SWOT Analysis", emoji: "📊",
    elements: [
      { id:"s", type:"note", x:0,   y:0,   w:260, h:240, content:"💪 STRENGTHS\n\n• Internal positive\n• What we do well", color:"Emerald" },
      { id:"w", type:"note", x:280, y:0,   w:260, h:240, content:"⚠️ WEAKNESSES\n\n• Internal negative\n• Gaps to close", color:"Amber" },
      { id:"o", type:"note", x:0,   y:260, w:260, h:240, content:"🚀 OPPORTUNITIES\n\n• External positive\n• Market openings", color:"Sky" },
      { id:"t", type:"note", x:280, y:260, w:260, h:240, content:"🔥 THREATS\n\n• External negative\n• Risks ahead", color:"Rose" },
    ],
    connections: [],
  },
  kanban: {
    name: "Kanban Board", emoji: "📋",
    elements: [
      { id:"h1", type:"note", x:0,   y:0,   w:190, h:56, content:"📥 BACKLOG",     color:"Slate" },
      { id:"h2", type:"note", x:210, y:0,   w:190, h:56, content:"⚡ IN PROGRESS", color:"Amber" },
      { id:"h3", type:"note", x:420, y:0,   w:190, h:56, content:"✅ DONE",        color:"Emerald" },
      { id:"c1", type:"note", x:0,   y:76,  w:190, h:80, content:"Design system",  color:"Sky" },
      { id:"c2", type:"note", x:0,   y:176, w:190, h:80, content:"User research",  color:"Violet" },
      { id:"c3", type:"note", x:210, y:76,  w:190, h:80, content:"API integration",color:"Coral" },
      { id:"c4", type:"note", x:420, y:76,  w:190, h:80, content:"Landing page",   color:"Teal" },
    ],
    connections: [],
  },
  userflow: {
    name: "User Flow", emoji: "🔄",
    elements: [
      { id:"s",  type:"shape", shapeType:"circle", x:0,   y:140, w:100, h:100, content:"START", color:"Emerald" },
      { id:"p1", type:"note",  x:150, y:155, w:160, h:80,  content:"Landing Page", color:"Sky" },
      { id:"p2", type:"note",  x:370, y:155, w:160, h:80,  content:"Sign Up",      color:"Violet" },
      { id:"p3", type:"note",  x:590, y:155, w:160, h:80,  content:"Dashboard",    color:"Amber" },
      { id:"e",  type:"shape", shapeType:"circle", x:810, y:140, w:100, h:100, content:"END",   color:"Rose" },
    ],
    connections: [ {from:"s",to:"p1"},{from:"p1",to:"p2"},{from:"p2",to:"p3"},{from:"p3",to:"e"} ],
  },
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const GRID = 20;
const snap = (v: number) => Math.round(v / GRID) * GRID;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrainFlow() {
  const { isAppFullscreen, setIsAppFullscreen, toggleFullscreen } = useSidebar();
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [tool, setTool] = useState<"select"|"hand"|"note"|"text"|"shape"|"connection"|"pen"|"eraser">("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ id: string; handle: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const selBoxStartRef = useRef<{ x: number; y: number } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showToolImporter, setShowToolImporter] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(3);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "canvas"|"element" } | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    transparent: false,
    scope: 'all',
    quality: 3
  });
  const [sidebarTab, setSidebarTab] = useState<"design"|"prototype">("design");
  const [layersOpen, setLayersOpen] = useState(true);

  const historyRef = useRef<{ elements: CanvasElement[]; connections: Connection[] }[]>([]);
  const historyIdxRef = useRef(-1);
  const maxZRef = useRef(1);

  // Persistence
  useEffect(() => {
    const raw = localStorage.getItem("brainflow_v3");
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setElements(d.elements || []);
        setConnections(d.connections || []);
        setPaths(d.paths || []);
        if (d.view) setView(d.view);
        if (d.elements?.length) maxZRef.current = Math.max(...d.elements.map((e: CanvasElement) => e.zIndex || 0)) + 1;
      } catch {}
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("brainflow_v3", JSON.stringify({ elements, connections, paths, view }));
  }, [elements, connections, paths, view, isInitialized]);

  // History
  const pushHistory = useCallback((els: CanvasElement[], conns: Connection[]) => {
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push({ elements: JSON.parse(JSON.stringify(els)), connections: JSON.parse(JSON.stringify(conns)) });
    historyIdxRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const s = historyRef.current[historyIdxRef.current];
    setElements(s.elements); setConnections(s.connections); setSelectedIds([]);
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const s = historyRef.current[historyIdxRef.current];
    setElements(s.elements); setConnections(s.connections); setSelectedIds([]);
  }, []);

  const screenToCanvas = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (cx - rect.left - view.x) / view.scale, y: (cy - rect.top - view.y) / view.scale };
  }, [view]);

  const updateEls = useCallback((ids: string[], updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => ids.includes(el.id) ? { ...el, ...updates } : el));
  }, []);

  const addElement = useCallback((cx: number, cy: number, type: CanvasElement["type"], extra: Partial<CanvasElement> = {}) => {
    const { x, y } = screenToCanvas(cx, cy);
    const id = uuidv4();
    const newEl: CanvasElement = {
      id, type, x: x - 100, y: y - 60,
      width: type === "shape" ? 120 : 200,
      height: type === "shape" ? 120 : 120,
      content: type === "note" ? "New Idea" : type === "text" ? "Text" : "",
      color: type === "note" ? COLORS[Math.floor(Math.random() * (COLORS.length - 1))].name : "Violet",
      rotate: type === "note" ? (Math.random() - 0.5) * 3 : 0,
      zIndex: ++maxZRef.current, fontSize: 15,
      textAlign: "center", fontStyle: "normal", opacity: 100,
      ...extra,
    };
    setElements(prev => { const next = [...prev, newEl]; pushHistory(next, connections); return next; });
    setSelectedIds([id]);
    setTool("select");
    return id;
  }, [screenToCanvas, connections, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    setElements(prev => { const next = prev.filter(el => !selectedIds.includes(el.id) || !!el.isLocked); pushHistory(next, connections); return next; });
    setConnections(prev => prev.filter(c => !selectedIds.includes(c.fromId) && !selectedIds.includes(c.toId)));
    setSelectedIds([]);
  }, [selectedIds, connections, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedIds.length) return;
    const originals = elements.filter(el => selectedIds.includes(el.id));
    const newEls = originals.map(el => ({ ...el, id: uuidv4(), x: el.x + 24, y: el.y + 24, zIndex: ++maxZRef.current }));
    setElements(prev => { const next = [...prev, ...newEls]; pushHistory(next, connections); return next; });
    setSelectedIds(newEls.map(e => e.id));
  }, [selectedIds, elements, connections, pushHistory]);

  const bringToFront = (ids: string[]) => {
    const maxZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;
    setElements(prev => prev.map(e => ids.includes(e.id) ? { ...e, zIndex: maxZ + 1 } : e));
    pushHistory(elements, connections);
  };

  const sendToBack = (ids: string[]) => {
    const minZ = elements.length > 0 ? Math.min(...elements.map(e => e.zIndex)) : 0;
    setElements(prev => prev.map(e => ids.includes(e.id) ? { ...e, zIndex: minZ - 1 } : e));
    pushHistory(elements, connections);
  };

  const bringForward = (ids: string[]) => {
    if (!ids.length) return;
    const sorted = [...elements].sort((a,b) => a.zIndex - b.zIndex);
    const nextEls = [...elements];
    ids.forEach(id => {
      const idx = sorted.findIndex(e => e.id === id);
      if (idx < sorted.length - 1) {
        const target = sorted[idx + 1];
        const elIdx = nextEls.findIndex(e => e.id === id);
        const tarIdx = nextEls.findIndex(e => e.id === target.id);
        const tempZ = nextEls[elIdx].zIndex;
        nextEls[elIdx] = { ...nextEls[elIdx], zIndex: nextEls[tarIdx].zIndex };
        nextEls[tarIdx] = { ...nextEls[tarIdx], zIndex: tempZ };
      }
    });
    setElements(nextEls);
    pushHistory(nextEls, connections);
  };

  const sendBackward = (ids: string[]) => {
    if (!ids.length) return;
    const sorted = [...elements].sort((a,b) => a.zIndex - b.zIndex);
    const nextEls = [...elements];
    ids.forEach(id => {
      const idx = sorted.findIndex(e => e.id === id);
      if (idx > 0) {
        const target = sorted[idx - 1];
        const elIdx = nextEls.findIndex(e => e.id === id);
        const tarIdx = nextEls.findIndex(e => e.id === target.id);
        const tempZ = nextEls[elIdx].zIndex;
        nextEls[elIdx] = { ...nextEls[elIdx], zIndex: nextEls[tarIdx].zIndex };
        nextEls[tarIdx] = { ...nextEls[tarIdx], zIndex: tempZ };
      }
    });
    setElements(nextEls);
    pushHistory(nextEls, connections);
  };

  const loadTemplate = useCallback((key: string) => {
    const t = TEMPLATES[key as keyof typeof TEMPLATES];
    const baseZ = ++maxZRef.current;
    const idMap: Record<string, string> = {};
    const newEls: CanvasElement[] = (t.elements as any[]).map((e, i) => {
      const newId = uuidv4(); idMap[e.id] = newId;
      return { id: newId, type: e.type as CanvasElement["type"], shapeType: e.shapeType as CanvasElement["shapeType"],
        x: e.x, y: e.y, width: e.w, height: e.h, content: e.content, color: e.color,
        rotate: e.type === "note" ? (Math.random() - 0.5) * 2 : 0,
        zIndex: baseZ + i, fontSize: 15, textAlign: "center" as const, fontStyle: "normal" as const, opacity: 100 };
    });
    const newConns = t.connections.map((c: any) => ({ id: uuidv4(), fromId: idMap[c.from], toId: idMap[c.to] }));
    setElements(newEls); setConnections(newConns); setPaths([]);
    setView({ x: 60, y: 60, scale: 1 }); setShowTemplates(false);
    pushHistory(newEls, newConns);
  }, [pushHistory]);



  const addToolWidget = (tool: any) => {
    const newEl: CanvasElement = {
      id: uuidv4(), type: "widget",
      x: -view.x/view.scale + 100, y: -view.y/view.scale + 100,
      width: 600, height: 700,
      content: tool.name, color: "Slate",
      zIndex: ++maxZRef.current,
      toolId: tool.id
    };
    setElements(prev => [...prev, newEl]);
    setShowToolImporter(false);
    setToolSearch("");
    pushHistory([...elements, newEl], connections);
  };

  // Element mouse handlers
  const handleElementMouseDown = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.isLocked) { setSelectedIds([el.id]); return; }
    if (tool === "eraser") {
      setElements(prev => { const next = prev.filter(x => x.id !== el.id); pushHistory(next, connections); return next; });
      return;
    }
    if (tool === "connection") {
      if (!connectionStart) { setConnectionStart(el.id); }
      else if (connectionStart !== el.id) {
        const newConn = { id: uuidv4(), fromId: connectionStart, toId: el.id };
        setConnections(prev => { const next = [...prev, newConn]; pushHistory(elements, next); return next; });
        setConnectionStart(null); setTool("select");
      }
      return;
    }
    if (tool !== "select") return;
    if (!selectedIds.includes(el.id)) setSelectedIds(e.shiftKey ? [...selectedIds, el.id] : [el.id]);
    const cp = screenToCanvas(e.clientX, e.clientY);
    dragRef.current = { id: el.id, offsetX: cp.x - el.x, offsetY: cp.y - el.y, moved: false };
    setEditingId(null);
    setIsOperationActive(true);
  }, [tool, connectionStart, selectedIds, screenToCanvas, elements, connections, pushHistory]);

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (tool !== "select") return;
    const cp = screenToCanvas(e.clientX, e.clientY);
    dragRef.current = { id: el.id, offsetX: cp.x - el.x, offsetY: cp.y - el.y, moved: false };
    setIsOperationActive(true);
  }, [tool, screenToCanvas]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation(); e.preventDefault();
    const cp = screenToCanvas(e.clientX, e.clientY);
    resizeRef.current = { id: el.id, handle, startX: cp.x, startY: cp.y, origW: el.width, origH: el.height, origX: el.x, origY: el.y };
    setIsOperationActive(true);
  }, [screenToCanvas]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || tool === "hand") { isPanningRef.current = true; lastPointerRef.current = { x: e.clientX, y: e.clientY }; return; }
    if (tool === "pen") { const p = screenToCanvas(e.clientX, e.clientY); setCurrentPath({ id: uuidv4(), points: [p], color: penColor, width: penWidth }); return; }
    if (tool === "note") { addElement(e.clientX, e.clientY, "note"); return; }
    if (tool === "text") { addElement(e.clientX, e.clientY, "text"); return; }
    if (tool === "shape") { addElement(e.clientX, e.clientY, "shape", { shapeType: "rect", content: "" }); return; }
    if (tool === "select") {
      setSelectedIds([]); setEditingId(null); setConnectionStart(null);
      const p = screenToCanvas(e.clientX, e.clientY);
      selBoxStartRef.current = p; setSelectionBox({ x: p.x, y: p.y, w: 0, h: 0 });
    }
    setContextMenu(null);
  }, [tool, screenToCanvas, addElement, penColor, penWidth]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - lastPointerRef.current.x, dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setView(v => ({ ...v, x: v.x + dx, y: v.y + dy })); return;
    }
    if (tool === "pen" && currentPath) {
      const p = screenToCanvas(e.clientX, e.clientY);
      setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, p] } : null); return;
    }
    if (dragRef.current) {
      dragRef.current.moved = true;
      const cp = screenToCanvas(e.clientX, e.clientY);
      let nx = cp.x - dragRef.current.offsetX, ny = cp.y - dragRef.current.offsetY;
      if (snapEnabled) { nx = snap(nx); ny = snap(ny); }
      const el = elements.find(el => el.id === dragRef.current!.id);
      if (!el) return;
      const dx = nx - el.x, dy = ny - el.y;
      const toMove = selectedIds.includes(dragRef.current.id) ? selectedIds : [dragRef.current.id];
      setElements(prev => prev.map(e => toMove.includes(e.id) && !e.isLocked ? { ...e, x: e.x + dx, y: e.y + dy } : e)); return;
    }
    if (resizeRef.current) {
      const { id, handle, startX, startY, origW, origH, origX, origY } = resizeRef.current;
      const p = screenToCanvas(e.clientX, e.clientY);
      const dx = p.x - startX, dy = p.y - startY;
      let nx = origX, ny = origY, nw = origW, nh = origH;
      if (handle.includes("e")) nw = Math.max(80, origW + dx);
      if (handle.includes("s")) nh = Math.max(60, origH + dy);
      if (handle.includes("w")) { nw = Math.max(80, origW - dx); nx = origX + dx; }
      if (handle.includes("n")) { nh = Math.max(60, origH - dy); ny = origY + dy; }
      setElements(prev => prev.map(el => el.id === id ? { ...el, x: nx, y: ny, width: nw, height: nh } : el)); return;
    }
    if (selBoxStartRef.current) {
      const p = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox({ x: selBoxStartRef.current.x, y: selBoxStartRef.current.y, w: p.x - selBoxStartRef.current.x, h: p.y - selBoxStartRef.current.y });
    }
  }, [tool, currentPath, screenToCanvas, elements, selectedIds, snapEnabled]);

  const handleCanvasMouseUp = useCallback(() => {
    isPanningRef.current = false;
    if (tool === "pen" && currentPath) { if (currentPath.points.length > 1) setPaths(prev => [...prev, currentPath]); setCurrentPath(null); }
    if (dragRef.current?.moved) pushHistory(elements, connections);
    dragRef.current = null;
    if (resizeRef.current) { pushHistory(elements, connections); resizeRef.current = null; }
    setIsOperationActive(false);
    if (selBoxStartRef.current && selectionBox) {
      const b = { x1: Math.min(selectionBox.x, selectionBox.x + selectionBox.w), y1: Math.min(selectionBox.y, selectionBox.y + selectionBox.h), x2: Math.max(selectionBox.x, selectionBox.x + selectionBox.w), y2: Math.max(selectionBox.y, selectionBox.y + selectionBox.h) };
      setSelectedIds(elements.filter(el => el.x < b.x2 && el.x + el.width > b.x1 && el.y < b.y2 && el.y + el.height > b.y1).map(el => el.id));
      setSelectionBox(null); selBoxStartRef.current = null;
    }
  }, [tool, currentPath, elements, connections, selectionBox, pushHistory]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setView(v => { const newScale = clamp(v.scale * (1 - e.deltaY * 0.001), 0.08, 6); const rect = canvas.getBoundingClientRect(); const mx = e.clientX - rect.left, my = e.clientY - rect.top; const wx = (mx - v.x) / v.scale, wy = (my - v.y) / v.scale; return { scale: newScale, x: mx - wx * newScale, y: my - wy * newScale }; });
      } else { setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (editingId || activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z") { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key === "y" || e.key === "Z")) { e.preventDefault(); redo(); return; }
      if (ctrl && e.key === "d") { e.preventDefault(); duplicateSelected(); return; }
      if (ctrl && e.key === "a") { e.preventDefault(); setSelectedIds(elements.map(e => e.id)); return; }
      switch (e.key) {
        case "v": setTool("select"); break; case "h": setTool("hand"); break;
        case "n": setTool("note"); break; case "t": setTool("text"); break;
        case "p": setTool("pen"); break; case "e": setTool("eraser"); break;
        case "l": setTool("connection"); break;
        case "Delete": case "Backspace": deleteSelected(); break;
        case "Escape": 
          if (isAppFullscreen) setIsAppFullscreen(false);
          setSelectedIds([]); setEditingId(null); setConnectionStart(null); setTool("select"); 
          break;
        case "f": setFocusMode(v => !v); break;
        case "m": toggleFullscreen(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId, elements, undo, redo, deleteSelected, duplicateSelected]);

  const exportImage = async (transparent = false, copyToClipboard = false, scope = 'all') => {
    if (!contentRef.current) return;
    try {
      const hasSelection = scope === 'selected' && selectedIds.length > 0;
      const unselectedEls: HTMLElement[] = [];
      const connectors: HTMLElement[] = [];

      if (hasSelection) {
        // Temporarily hide what we don't want
        contentRef.current.querySelectorAll('[data-element-id]').forEach(el => {
          const id = el.getAttribute('data-element-id');
          if (id && !selectedIds.includes(id)) {
            (el as HTMLElement).style.visibility = 'hidden';
            unselectedEls.push(el as HTMLElement);
          }
        });
        contentRef.current.querySelectorAll('[data-connector]').forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
          connectors.push(el as HTMLElement);
        });
      }

      const canvas = await html2canvas(contentRef.current, { 
        backgroundColor: transparent ? null : PS.bg, 
        scale: exportSettings.quality,
        useCORS: true,
        logging: false
      });
      
      // Restore visibility
      unselectedEls.forEach(el => el.style.visibility = 'visible');
      connectors.forEach(el => el.style.visibility = 'visible');

      if (copyToClipboard) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              setShowExportModal(false);
            } catch (err) {
              alert("Clipboard copy failed. Try downloading instead.");
            }
          }
        }, "image/png");
      } else {
        const a = document.createElement("a"); 
        a.download = `brainflow_${scope}_${transparent ? 'transparent' : 'export'}.png`; 
        a.href = canvas.toDataURL("image/png", 1.0); 
        a.click();
        setShowExportModal(false);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };
  const exportPNG = () => exportImage(exportSettings.transparent, false, exportSettings.scope);
  const exportJSON = () => {
    const b = new Blob([JSON.stringify({ elements, connections, paths, version: "3.0" }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "brainflow.json"; a.click();
  };
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try { const d = JSON.parse(ev.target?.result as string); setElements(d.elements||[]); setConnections(d.connections||[]); setPaths(d.paths||[]); pushHistory(d.elements||[], d.connections||[]); } catch { alert("Invalid JSON"); }
    };
    r.readAsText(f);
  };

  const sortedEls = useMemo(() => [...elements].sort((a, b) => (a.zIndex||0) - (b.zIndex||0)), [elements]);
  const selectedEl = elements.find(el => el.id === selectedIds[0]);

  const minimapBounds = useMemo(() => {
    if (!elements.length) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    return { minX: Math.min(...elements.map(e => e.x))-40, minY: Math.min(...elements.map(e => e.y))-40, maxX: Math.max(...elements.map(e => e.x+e.width))+40, maxY: Math.max(...elements.map(e => e.y+e.height))+40 };
  }, [elements]);

  const cursorMap: Record<string, string> = { hand: "grab", pen: "crosshair", eraser: "cell", note: "copy", text: "text", shape: "copy", connection: "crosshair", select: "default" };

  const SIDEBAR_W = (!focusMode && sidebarOpen) ? 256 : 0;

  return (
    <div className="relative flex w-full overflow-hidden select-none"
      style={{ height: isAppFullscreen ? "100vh" : "calc(100vh - 64px)", background: PS.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Subtle dot grid */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)`,
            backgroundSize: `${GRID * view.scale}px ${GRID * view.scale}px`,
            backgroundPosition: `${view.x % (GRID * view.scale)}px ${view.y % (GRID * view.scale)}px`,
          }} />
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="absolute inset-0 z-10"
          style={{ cursor: cursorMap[tool]||"default", overflow: "hidden" }}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}
          onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: "canvas" }); }}>

          <div ref={contentRef} style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}>
            <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: "100%", height: "100%" }}>
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0,10 3.5,0 7" fill={PS.accentDim} />
                </marker>
              </defs>
              {paths.map(path => <path key={path.id} d={`M ${path.points.map(p => `${p.x} ${p.y}`).join(" L ")}`} fill="none" stroke={path.color} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />)}
              {currentPath && <path d={`M ${currentPath.points.map(p => `${p.x} ${p.y}`).join(" L ")}`} fill="none" stroke={currentPath.color} strokeWidth={currentPath.width} strokeLinecap="round" strokeLinejoin="round" />}
              {connections.map(conn => {
                const from = elements.find(el => el.id === conn.fromId), to = elements.find(el => el.id === conn.toId);
                if (!from || !to) return null;
                const sx = from.x+from.width/2, sy = from.y+from.height/2, ex = to.x+to.width/2, ey = to.y+to.height/2, mx = (sx+ex)/2;
                return <g key={conn.id}><path d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`} fill="none" stroke="rgba(74,144,217,0.35)" strokeWidth="1.5" markerEnd="url(#arrow)" className="pointer-events-auto cursor-pointer" onClick={() => setConnections(p => p.filter(c => c.id !== conn.id))} onMouseEnter={e => (e.target as SVGElement).setAttribute("stroke","rgba(74,144,217,0.75)")} onMouseLeave={e => (e.target as SVGElement).setAttribute("stroke","rgba(74,144,217,0.35)")} /></g>;
              })}
              {connectionStart && hoveredId && hoveredId !== connectionStart && (() => {
                const from = elements.find(e => e.id === connectionStart), to = elements.find(e => e.id === hoveredId);
                if (!from || !to) return null;
                const sx=from.x+from.width/2,sy=from.y+from.height/2,ex=to.x+to.width/2,ey=to.y+to.height/2,mx=(sx+ex)/2;
                return <path d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`} fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow)" />;
              })()}
              {selectionBox && <rect x={selectionBox.w>0?selectionBox.x:selectionBox.x+selectionBox.w} y={selectionBox.h>0?selectionBox.y:selectionBox.y+selectionBox.h} width={Math.abs(selectionBox.w)} height={Math.abs(selectionBox.h)} fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.55)" strokeWidth="1" strokeDasharray="4,3" />}
            </svg>
            <AnimatePresence>
              {sortedEls.map(el => (
                <CanvasElementComp key={el.id} element={el} isSelected={selectedIds.includes(el.id)} isEditing={editingId===el.id} isConnecting={connectionStart===el.id}
                  onMouseDown={e => handleElementMouseDown(e, el)} onResizeMouseDown={(e,h) => handleResizeMouseDown(e,el,h)}
                  onDoubleClick={() => { if (!el.isLocked) setEditingId(el.id); }}
                  onUpdate={u => updateEls([el.id], u)} onEndEdit={() => setEditingId(null)}
                  onHover={h => setHoveredId(h ? el.id : null)}
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setSelectedIds([el.id]); setContextMenu({ x: e.clientX, y: e.clientY, type: "element" }); }}
                  tool={tool}
                  onDelete={() => setElements(p => p.filter(x => x.id !== el.id))}
                  onDeselect={() => setSelectedIds([])}
                  onHeaderMouseDown={(e) => handleHeaderMouseDown(e, el)} />
              ))}
            </AnimatePresence>
            {isOperationActive && (
              <div style={{ position:"absolute", inset:-10000, zIndex:10000, cursor: resizeRef.current ? "nwse-resize" : "grabbing" }} />
            )}
          </div>
        </div>


        {/* Bottom status / zoom bar */}
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-1.5">
          <button onClick={()=>setFocusMode(v=>!v)} title="Focus Mode (F)"
            className="p-2 rounded transition-all"
            style={{ background: focusMode ? PS.accentBg : PS.panel, border: `1px solid ${focusMode ? PS.accentDim : PS.border}`, color: focusMode ? PS.accent : PS.textMuted }}>
            {focusMode ? <EyeOff size={13}/> : <Eye size={13}/>}
          </button>

          <button onClick={toggleFullscreen} title={isAppFullscreen ? "Exit Workspace Fullscreen" : "Workspace Fullscreen"}
            className="p-2 rounded transition-all"
            style={{ background: isAppFullscreen ? PS.accentBg : PS.panel, border: `1px solid ${isAppFullscreen ? PS.accentDim : PS.border}`, color: isAppFullscreen ? PS.accent : PS.textMuted }}>
            {isAppFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>

          <div className="flex items-center gap-0.5 px-1 py-1 rounded"
            style={{ background: PS.panel, border: `1px solid ${PS.border}` }}>
            <button onClick={()=>setView(v=>({...v,scale:clamp(v.scale-0.1,0.08,6)}))} className="p-1.5 rounded transition-colors" style={{ color: PS.textMuted }} onMouseEnter={e=>e.currentTarget.style.color=PS.text} onMouseLeave={e=>e.currentTarget.style.color=PS.textMuted}><ZoomOut size={12}/></button>
            <button onClick={()=>setView({x:0,y:0,scale:1})} className="text-xs font-mono w-9 text-center transition-colors" style={{ color: PS.textDim }} onMouseEnter={e=>e.currentTarget.style.color=PS.text} onMouseLeave={e=>e.currentTarget.style.color=PS.textDim}>{Math.round(view.scale*100)}%</button>
            <button onClick={()=>setView(v=>({...v,scale:clamp(v.scale+0.1,0.08,6)}))} className="p-1.5 rounded transition-colors" style={{ color: PS.textMuted }} onMouseEnter={e=>e.currentTarget.style.color=PS.text} onMouseLeave={e=>e.currentTarget.style.color=PS.textMuted}><ZoomIn size={12}/></button>
            <div style={{ width:1, height:12, background: PS.border, margin:"0 2px" }} />
            <button onClick={()=>setView({x:0,y:0,scale:1})} className="p-1.5 rounded transition-colors" style={{ color: PS.textMuted }} onMouseEnter={e=>e.currentTarget.style.color=PS.text} onMouseLeave={e=>e.currentTarget.style.color=PS.textMuted}><RotateCcw size={12}/></button>
          </div>

          <button onClick={()=>setShowGrid(v=>!v)} title="Grid"
            className="p-2 rounded transition-all"
            style={{ background: showGrid ? PS.accentBg : PS.panel, border: `1px solid ${showGrid ? PS.accentDim : PS.border}`, color: showGrid ? PS.accent : PS.textMuted }}>
            <Grid3x3 size={13}/>
          </button>
          <button onClick={()=>setSnapEnabled(v=>!v)} title="Snap to Grid"
            className="p-2 rounded transition-all"
            style={{ background: snapEnabled ? PS.accentBg : PS.panel, border: `1px solid ${snapEnabled ? PS.accentDim : PS.border}`, color: snapEnabled ? PS.accent : PS.textMuted }}>
            <Magnet size={13}/>
          </button>
        </div>

        {/* Empty state */}
        {elements.length === 0 && !focusMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
            <motion.div animate={{ y: [0,-6,0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} className="text-4xl mb-3">🧠</motion.div>
            <p style={{ color: PS.textMuted, fontSize: 13, fontWeight: 500 }}>Canvas is empty — click to add a note</p>
            <p style={{ color: "#3a3a3a", fontSize: 11, marginTop: 4 }}>Or pick a template from the toolbar above</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          PHOTOSHOP-STYLE RIGHT SIDEBAR & TOGGLE
      ══════════════════════════════════════════════ */}
      
      {/* Sidebar toggle tab (fixed to the absolute right edge of the window) */}
      {!focusMode && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Open Panel"
          className="absolute top-1/2 right-0 z-50 flex items-center justify-center transition-all"
          style={{ transform: "translateY(-50%)", width: 20, height: 64, background: PS.sidebar, border: `1px solid ${PS.border}`, borderRight: "none", borderRadius: "6px 0 0 6px", color: PS.textDim, boxShadow: PS.shadow }}
          onMouseEnter={e=>{ e.currentTarget.style.color = PS.accent; e.currentTarget.style.background = PS.panel; }}
          onMouseLeave={e=>{ e.currentTarget.style.color = PS.textDim; e.currentTarget.style.background = PS.sidebar; }}>
          <PanelRightOpen size={12} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}

      {/* ── TOP TOOLBAR ── */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div
            initial={{ y: -60, x: "-50%", opacity: 0 }} animate={{ y: 0, x: "-50%", opacity: 1 }} exit={{ y: -60, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute top-3 left-1/2 z-50 flex items-center gap-0.5 pointer-events-auto"
            style={{
              background: PS.toolbar,
              backdropFilter: "blur(20px)",
              border: `1px solid ${PS.border}`,
              borderRadius: 8,
              padding: "4px 5px",
              boxShadow: `${PS.shadow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
            <TB active={tool==="select"} onClick={()=>setTool("select")} icon={<MousePointer2 size={14}/>} label="Select (V)" />
            <TB active={tool==="hand"} onClick={()=>setTool("hand")} icon={<Hand size={14}/>} label="Pan (H)" />
            <Sep/>
            <TB active={tool==="note"} onClick={()=>setTool("note")} icon={<StickyIcon size={14}/>} label="Note (N)" />
            <TB active={tool==="text"} onClick={()=>setTool("text")} icon={<Type size={14}/>} label="Text (T)" />
            <TB active={tool==="shape"} onClick={()=>setTool("shape")} icon={<Square size={14}/>} label="Shape" />
            <Sep/>
            <TB active={tool==="connection"} onClick={()=>setTool("connection")} icon={<LinkIcon size={14}/>} label="Connect (L)" />
            <TB active={tool==="pen"} onClick={()=>setTool("pen")} icon={<Pencil size={14}/>} label="Pen (P)" />
            <TB active={tool==="eraser"} onClick={()=>setTool("eraser")} icon={<Eraser size={14}/>} label="Eraser (E)" />
            <Sep/>
            <TB active={false} onClick={undo} icon={<CornerUpLeft size={14}/>} label="Undo ⌘Z" />
            <TB active={false} onClick={redo} icon={<CornerUpRight size={14}/>} label="Redo ⌘Y" />
            <Sep/>
            <TB active={showTemplates} onClick={()=>setShowTemplates(!showTemplates)} icon={<Sparkles size={14}/>} label="Templates" accent />
            <TB active={showToolImporter} onClick={()=>setShowToolImporter(!showToolImporter)} icon={<Layout size={14}/>} label="Import Tool" accent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pen Options */}
      <AnimatePresence>
        {tool === "pen" && !focusMode && (
          <motion.div initial={{ y: -20, x: "-50%", opacity: 0 }} animate={{ y: 0, x: "-50%", opacity: 1 }} exit={{ y: -20, x: "-50%", opacity: 0 }}
            className="absolute top-14 left-1/2 z-50 flex items-center gap-2 px-3 py-2 pointer-events-auto"
            style={{ background: PS.toolbar, backdropFilter: "blur(20px)", border: `1px solid ${PS.border}`, borderRadius: 7, boxShadow: PS.shadow }}>
            {PEN_COLORS.map(c => <button key={c} onClick={()=>setPenColor(c)} className="w-4 h-4 rounded-full border-2 transition-all hover:scale-125" style={{ background: c, borderColor: c===penColor?"white":"transparent" }} />)}
            <div style={{ width:1, height:14, background: PS.border, margin:"0 4px" }} />
            {[2,4,7].map(w => <button key={w} onClick={()=>setPenWidth(w)} className="w-5 h-5 flex items-center justify-center rounded" style={{ opacity: penWidth===w?1:0.35, background: penWidth===w ? PS.active : "transparent" }}><div className="bg-white rounded-full" style={{ width:w*2, height:w*2 }}/></button>)}
            <button onClick={()=>setPaths([])} className="p-1 rounded transition-colors" style={{ color: PS.red }} onMouseEnter={e=>e.currentTarget.style.background=PS.redBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><Trash2 size={12}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!focusMode && sidebarOpen && (
          <motion.aside
            initial={{ x: 256, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 256, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{ width: 256, minWidth: 256, height: "100%", background: PS.sidebar, borderLeft: `1px solid ${PS.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

            {/* ── Sidebar header with close button ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px 7px 14px", borderBottom: `1px solid ${PS.border}`, flexShrink: 0 }}>
              {/* Tab bar */}
              <div style={{ display: "flex", gap: 2 }}>
                {(["design","prototype"] as const).map(tab => (
                  <button key={tab} onClick={() => setSidebarTab(tab)}
                    style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, letterSpacing: "0.02em", borderRadius: 4,
                      color: sidebarTab===tab ? PS.text : PS.textMuted,
                      background: sidebarTab===tab ? PS.active : "transparent",
                      border: `1px solid ${sidebarTab===tab ? PS.accentDim : "transparent"}`,
                      transition: "all 0.12s", textTransform: "capitalize", cursor: "pointer" }}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Close sidebar button */}
              <button
                onClick={() => setSidebarOpen(false)}
                title="Close Panel"
                style={{ padding: "4px", borderRadius: 4, background: "transparent", color: PS.textMuted, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}
                onMouseEnter={e=>{ e.currentTarget.style.color = PS.text; e.currentTarget.style.background = PS.hover; }}
                onMouseLeave={e=>{ e.currentTarget.style.color = PS.textMuted; e.currentTarget.style.background = "transparent"; }}>
                <PanelRightClose size={13}/>
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div 
              style={{ flex: 1, height: 0, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 4, overscrollBehavior: "contain" }}
              onWheel={e => e.stopPropagation()}
            >

              {sidebarTab === "design" ? (
                <>
                  {selectedIds.length > 1 ? (
                    <>
                      <SBSection noBorder>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:11, color: PS.textMuted, fontWeight:500 }}>{selectedIds.length} elements selected</span>
                        </div>
                      </SBSection>
                      <SBSection label="Align">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
                          <PsBtn onClick={() => {
                            const minX = Math.min(...selectedIds.map(id => elements.find(e => e.id === id)?.x || 0));
                            selectedIds.forEach(id => updateEls([id], { x: minX }));
                          }}><AlignLeft size={11}/></PsBtn>
                          <PsBtn onClick={() => {
                            const valid = selectedIds.map(id => elements.find(el=>el.id===id)).filter(e=>e);
                            const avg = valid.reduce((a,b)=>a+(b!.x+b!.width/2),0)/valid.length;
                            valid.forEach(e => updateEls([e!.id], { x: avg - e!.width/2 }));
                          }}><AlignCenter size={11}/></PsBtn>
                          <PsBtn onClick={() => {
                            const valid = selectedIds.map(id => elements.find(el=>el.id===id)).filter(e=>e);
                            const maxX = Math.max(...valid.map(e => e!.x + e!.width));
                            valid.forEach(e => updateEls([e!.id], { x: maxX - e!.width }));
                          }}><AlignRight size={11}/></PsBtn>
                        </div>
                      </SBSection>
                      <SBSection label="Actions">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <button onClick={duplicateSelected} style={{ padding:"6px", borderRadius:4, background: PS.panel, color: PS.textDim, border:`1px solid ${PS.border}`, cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center" }} onMouseEnter={e=>{e.currentTarget.style.color=PS.text;e.currentTarget.style.background=PS.hover;}} onMouseLeave={e=>{e.currentTarget.style.color=PS.textDim;e.currentTarget.style.background=PS.panel;}}><Copy size={11} style={{ marginRight:4 }}/> Duplicate</button>
                          <button onClick={deleteSelected} style={{ padding:"6px", borderRadius:4, background: PS.redBg, color: PS.red, border:`1px solid rgba(224,82,82,0.2)`, cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(224,82,82,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.background=PS.redBg;}}><Trash2 size={11} style={{ marginRight:4 }}/> Delete</button>
                        </div>
                      </SBSection>
                    </>
                  ) : selectedEl ? (
                    <>
                      {/* Element type header */}
                      <SBSection noBorder>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ width:18, height:18, borderRadius:3, background: PS.panel, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {selectedEl.type === "note" ? <StickyIcon size={10} color={PS.textDim}/> : selectedEl.type === "text" ? <Type size={10} color={PS.textDim}/> : <Square size={10} color={PS.textDim}/>}
                            </div>
                            <span style={{ fontSize:11, fontWeight:600, color: PS.text, textTransform:"capitalize" }}>{selectedEl.type === "shape" ? selectedEl.shapeType || "Shape" : selectedEl.type}</span>
                          </div>
                          <div style={{ display:"flex", gap:2 }}>
                            <PsBtn onClick={()=>updateEls([selectedEl.id],{isLocked:!selectedEl.isLocked})} active={!!selectedEl.isLocked}>
                              {selectedEl.isLocked ? <Lock size={11}/> : <Unlock size={11}/>}
                            </PsBtn>
                            <PsBtn onClick={()=>setSelectedIds([])}><X size={11}/></PsBtn>
                          </div>
                        </div>
                      </SBSection>

                      {/* Position */}
                      <SBSection label="Position">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <PropInput label="X" value={Math.round(selectedEl.x)} onChange={v => updateEls([selectedEl.id], { x: Number(v) })} />
                          <PropInput label="Y" value={Math.round(selectedEl.y)} onChange={v => updateEls([selectedEl.id], { y: Number(v) })} />
                        </div>
                      </SBSection>

                      {/* Size */}
                      <SBSection label="Size">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <PropInput label="W" value={Math.round(selectedEl.width)} onChange={v => updateEls([selectedEl.id], { width: Math.max(40, Number(v)) })} />
                          <PropInput label="H" value={Math.round(selectedEl.height)} onChange={v => updateEls([selectedEl.id], { height: Math.max(30, Number(v)) })} />
                        </div>
                      </SBSection>

                      {/* Transform */}
                      <SBSection label="Transform">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <PropInput label="°" value={Math.round(selectedEl.rotate || 0)} onChange={v => updateEls([selectedEl.id], { rotate: Number(v) })} />
                          <PropInput label="%" value={selectedEl.opacity ?? 100} onChange={v => updateEls([selectedEl.id], { opacity: clamp(Number(v),0,100) })} />
                        </div>
                      </SBSection>

                      {/* Fill */}
                      <SBSection label="Fill">
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                          {COLORS.map(c => (
                            <button key={c.name} onClick={() => updateEls([selectedEl.id], { color: c.name })}
                              title={c.name}
                              style={{ width:20, height:20, borderRadius:4, background:c.hex, border:`2px solid ${selectedEl.color===c.name?"white":"rgba(255,255,255,0.12)"}`, cursor:"pointer", transition:"all 0.12s", transform: selectedEl.color===c.name?"scale(1.12)":"scale(1)" }} />
                          ))}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:5, background: PS.panel, border:`1px solid ${PS.border}` }}>
                          <div style={{ width:16, height:16, borderRadius:3, border:"1px solid rgba(255,255,255,0.15)", background: getColor(selectedEl.color).hex, flexShrink:0 }} />
                          <span style={{ fontSize:11, fontFamily:"'Roboto Mono', monospace", color: PS.textDim }}>{getColor(selectedEl.color).hex.toUpperCase()}</span>
                          <span style={{ marginLeft:"auto", fontSize:10, color: PS.textMuted }}>{selectedEl.opacity ?? 100}%</span>
                        </div>
                      </SBSection>

                      {/* Typography */}
                      {selectedEl.type !== "shape" && (
                        <SBSection label="Typography">
                          <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:8 }}>
                            {[
                              { icon:<Bold size={11}/>, active: selectedEl.fontStyle==="bold", click: ()=>updateEls([selectedEl.id],{fontStyle:selectedEl.fontStyle==="bold"?"normal":"bold"}) },
                              { icon:<Italic size={11}/>, active: selectedEl.fontStyle==="italic", click: ()=>updateEls([selectedEl.id],{fontStyle:selectedEl.fontStyle==="italic"?"normal":"italic"}) },
                              { icon:<AlignLeft size={11}/>, active: selectedEl.textAlign==="left", click: ()=>updateEls([selectedEl.id],{textAlign:"left"}) },
                              { icon:<AlignCenter size={11}/>, active: !selectedEl.textAlign||selectedEl.textAlign==="center", click: ()=>updateEls([selectedEl.id],{textAlign:"center"}) },
                              { icon:<AlignRight size={11}/>, active: selectedEl.textAlign==="right", click: ()=>updateEls([selectedEl.id],{textAlign:"right"}) },
                            ].map((b, i) => (
                              <button key={i} onClick={b.click}
                                style={{ flex:1, padding:"5px 2px", borderRadius:4, border:`1px solid ${b.active ? PS.accentDim : PS.border}`, background: b.active ? PS.accentBg : PS.panel, color: b.active ? PS.accent : PS.textDim, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.12s" }}
                                onMouseEnter={e=>{if(!b.active){e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;}}}
                                onMouseLeave={e=>{if(!b.active){e.currentTarget.style.background=PS.panel;e.currentTarget.style.color=PS.textDim;}}}>
                                {b.icon}
                              </button>
                            ))}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:10, color: PS.textMuted, width:52 }}>Font size</span>
                            <div style={{ display:"flex", alignItems:"center", flex:1, borderRadius:4, padding:2, background: PS.panel, border:`1px solid ${PS.border}` }}>
                              <button onClick={()=>updateEls([selectedEl.id],{fontSize:Math.max(9,(selectedEl.fontSize||15)-1)})}
                                style={{ padding:"2px 4px", borderRadius:3, background:"transparent", color: PS.textDim, border:"none", cursor:"pointer" }}
                                onMouseEnter={e=>e.currentTarget.style.background=PS.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <Minus size={9}/>
                              </button>
                              <span style={{ flex:1, textAlign:"center", fontSize:11, fontFamily:"'Roboto Mono', monospace", color: PS.text }}>{selectedEl.fontSize||15}</span>
                              <button onClick={()=>updateEls([selectedEl.id],{fontSize:Math.min(96,(selectedEl.fontSize||15)+1)})}
                                style={{ padding:"2px 4px", borderRadius:3, background:"transparent", color: PS.textDim, border:"none", cursor:"pointer" }}
                                onMouseEnter={e=>e.currentTarget.style.background=PS.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <Plus size={9}/>
                              </button>
                            </div>
                          </div>
                        </SBSection>
                      )}

                      {/* Layer */}
                      <SBSection label="Layer">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <PsActionBtn onClick={()=>bringForward([selectedEl.id])} icon={<ArrowUp size={11}/>} label="Forward" />
                          <PsActionBtn onClick={()=>sendBackward([selectedEl.id])} icon={<ArrowDown size={11}/>} label="Backward" />
                        </div>
                      </SBSection>

                      {/* Actions */}
                      <SBSection label="Actions">
                        <div style={{ display:"flex", gap:6 }}>
                          <PsActionBtn onClick={duplicateSelected} icon={<Copy size={11}/>} label="Duplicate" style={{ flex:1 }} />
                          <button onClick={deleteSelected}
                            style={{ padding:"6px 10px", borderRadius:5, border:`1px solid rgba(224,82,82,0.3)`, background: PS.redBg, color: PS.red, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4, transition:"all 0.12s" }}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(224,82,82,0.2)";}}
                            onMouseLeave={e=>{e.currentTarget.style.background=PS.redBg;}}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </SBSection>
                    </>
                  ) : (
                    /* No selection: Canvas info */
                    <>
                      <SBSection noBorder>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background: PS.accent }} />
                          <span style={{ fontSize:11, color: PS.textMuted, fontWeight:500 }}>Canvas</span>
                        </div>
                        <div style={{ fontSize:10, color:"#404040" }}>Select an element to edit its properties</div>
                      </SBSection>

                      <SBSection label="View">
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          <PropInput label="%" value={Math.round(view.scale*100)} onChange={v=>setView(prev=>({...prev,scale:clamp(Number(v)/100,0.08,6)}))} />
                          <div style={{ display:"flex", alignItems:"center", padding:"5px 8px", borderRadius:4, background: PS.panel, border:`1px solid ${PS.border}` }}>
                            <span style={{ fontSize:10, color: PS.textMuted }}>Elements</span>
                            <span style={{ marginLeft:"auto", fontSize:11, fontFamily:"'Roboto Mono', monospace", color: PS.text }}>{elements.length}</span>
                          </div>
                        </div>
                        <button onClick={()=>setView({x:0,y:0,scale:1})}
                          style={{ width:"100%", marginTop:8, padding:"6px", borderRadius:5, border:`1px solid ${PS.border}`, background: PS.panel, color: PS.textDim, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.12s" }}
                          onMouseEnter={e=>{e.currentTarget.style.color=PS.text;e.currentTarget.style.background=PS.hover;}}
                          onMouseLeave={e=>{e.currentTarget.style.color=PS.textDim;e.currentTarget.style.background=PS.panel;}}>
                          <RotateCcw size={11}/> Reset View
                        </button>
                      </SBSection>

                      <SBSection label="Canvas">
                        <ToggleRow label="Show Grid" active={showGrid} onClick={()=>setShowGrid(v=>!v)} />
                        <ToggleRow label="Snap to Grid" active={snapEnabled} onClick={()=>setSnapEnabled(v=>!v)} />
                      </SBSection>
                    </>
                  )}

                  {/* ── Layers ── */}
                  <div style={{ borderTop: `1px solid ${PS.border}`, marginTop: "auto" }}>
                    <button onClick={()=>setLayersOpen(v=>!v)}
                      style={{ display:"flex", alignItems:"center", gap:6, width:"100%", padding:"8px 14px", background:"transparent", border:"none", cursor:"pointer", transition:"background 0.12s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=PS.hover}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {layersOpen ? <ChevronDown size={11} color={PS.textMuted}/> : <ChevronRight size={11} color={PS.textMuted}/>}
                      <span style={{ fontSize:10, fontWeight:700, color: PS.textMuted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Layers</span>
                      <span style={{ marginLeft:"auto", fontSize:10, fontFamily:"'Roboto Mono', monospace", color: "#3a3a3a" }}>{elements.length}</span>
                    </button>
                    {layersOpen && (
                      <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {elements.length === 0 && <div style={{ padding:"4px 14px 10px", fontSize:10, color:"#3a3a3a", fontStyle:"italic" }}>No layers</div>}
                        {[...elements].reverse().map(el => {
                          const c = getColor(el.color);
                          const isSel = selectedIds.includes(el.id);
                          return (
                            <button key={el.id} onClick={()=>setSelectedIds([el.id])}
                              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"5px 14px", background: isSel ? PS.active : "transparent", borderLeft: `2px solid ${isSel ? PS.accent : "transparent"}`, borderTop:"none", borderRight:"none", borderBottom:"none", cursor:"pointer", transition:"all 0.1s" }}
                              onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=PS.hover;}}
                              onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                              <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background: c.hex }} />
                              <span style={{ fontSize:11, color: isSel ? PS.text : PS.textDim, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textAlign:"left" }}>
                                {el.content?.split("\n")[0]?.slice(0,22) || (el.type==="shape"?el.shapeType:el.type)}
                              </span>
                              {el.isLocked && <Lock size={9} color={PS.textMuted} style={{ marginLeft:"auto", flexShrink:0 }}/>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Prototype tab */
                <SBSection noBorder>
                  <div style={{ textAlign:"center", padding:"24px 8px" }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>🔗</div>
                    <p style={{ fontSize:11, color: PS.textMuted }}>Use the connection tool (L) to link elements</p>
                    <div style={{ marginTop:12, fontSize:10, color:"#3a3a3a", background: PS.panel, borderRadius:6, padding:"10px 12px", textAlign:"left", lineHeight:1.7, border:`1px solid ${PS.border}` }}>
                      <strong style={{ color: PS.textMuted }}>Connections:</strong> {connections.length}<br/>
                      Click any connector line to remove it.
                    </div>
                  </div>
                </SBSection>
              )}

              {/* ── Minimap ── */}
              {elements.length > 0 && (
                <div style={{ borderTop: `1px solid ${PS.border}`, padding: "10px 12px" }}>
                  <div style={{ fontSize:9, color: PS.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:6 }}>Minimap</div>
                  <MinimapPanel elements={elements} bounds={minimapBounds} view={view} setView={setView} canvasRef={canvasRef} />
                </div>
              )}

              {/* ── Export ── */}
              <div style={{ borderTop: `1px solid ${PS.border}`, padding: "10px 12px" }}>
                <div style={{ fontSize:9, color: PS.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>Export</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  <button onClick={exportJSON}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 4px", borderRadius:5, border:`1px solid ${PS.accentDim}`, background: PS.accentBg, color: PS.accent, cursor:"pointer", fontSize:10, fontWeight:700, transition:"all 0.12s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(74,144,217,0.25)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=PS.accentBg;}}>
                    <FileJson size={14}/> JSON
                  </button>
                  <button onClick={() => { setExportSettings(s=>({...s, scope: selectedIds.length > 0 ? 'selected' : 'all'})); setShowExportModal(true); }}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 4px", borderRadius:5, border:`1px solid ${PS.border}`, background: PS.panel, color: PS.textDim, cursor:"pointer", fontSize:10, fontWeight:700, transition:"all 0.12s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=PS.panel;e.currentTarget.style.color=PS.textDim;}}>
                    <ImageIcon size={14}/> EXPORT
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:6 }}>
                  <button onClick={() => exportImage(true, false)}
                    style={{ padding:"7px", borderRadius:5, border:`1px solid ${PS.border}`, background: "transparent", color: PS.textDim, cursor:"pointer", fontSize:9, fontWeight:600, transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}
                    onMouseEnter={e=>{e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=PS.textDim;}}>
                    Transparent
                  </button>
                  <button onClick={() => exportImage(false, true)}
                    style={{ padding:"7px", borderRadius:5, border:`1px solid ${PS.border}`, background: "transparent", color: PS.textDim, cursor:"pointer", fontSize:9, fontWeight:600, transition:"all 0.12s", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}
                    onMouseEnter={e=>{e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=PS.textDim;}}>
                    <Copy size={10}/> Copy Image
                  </button>
                </div>
                <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", marginTop:6, padding:"6px", borderRadius:5, fontSize:11, cursor:"pointer", color: PS.textMuted, border:`1px solid ${PS.border}`, background:"transparent", transition:"all 0.12s", boxSizing:"border-box" }}
                  onMouseEnter={e=>e.currentTarget.style.color=PS.textDim}
                  onMouseLeave={e=>e.currentTarget.style.color=PS.textMuted}>
                  <Upload size={11}/> Load JSON
                  <input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }} />
                </label>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Templates Modal ── */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center"
            style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)" }}
            onClick={()=>setShowTemplates(false)}>
            <motion.div initial={{ scale:0.93, opacity:0, y:12 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }}
              onClick={e=>e.stopPropagation()}
              style={{ padding:24, borderRadius:10, width:480, background:"rgba(32,32,32,0.99)", border:`1px solid ${PS.borderMid}`, boxShadow:"0 24px 64px rgba(0,0,0,0.8)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <h2 style={{ fontSize:14, fontWeight:700, color: PS.text, display:"flex", alignItems:"center", gap:8 }}><Sparkles size={15} color={PS.accent}/> Templates</h2>
                <button onClick={()=>setShowTemplates(false)} style={{ padding:4, borderRadius:4, background:"transparent", border:"none", cursor:"pointer", color: PS.textMuted, display:"flex" }}
                  onMouseEnter={e=>e.currentTarget.style.background=PS.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><X size={13}/></button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button key={key} onClick={()=>loadTemplate(key)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:7, textAlign:"left", background: PS.panel, border:`1px solid ${PS.border}`, cursor:"pointer", transition:"all 0.12s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=PS.accentBg;e.currentTarget.style.borderColor=PS.accentDim;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=PS.panel;e.currentTarget.style.borderColor=PS.border;}}>
                    <span style={{ fontSize:20 }}>{t.emoji}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color: PS.text }}>{t.name}</div>
                      <div style={{ fontSize:10, color: PS.textMuted, marginTop:2 }}>{t.elements.length} elements</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={()=>{setElements([]);setConnections([]);setPaths([]);setShowTemplates(false);}}
                style={{ marginTop:12, width:"100%", padding:"8px", borderRadius:6, fontSize:11, color: PS.textMuted, background:"transparent", border:`1px solid ${PS.border}`, cursor:"pointer", transition:"all 0.12s" }}
                onMouseEnter={e=>{e.currentTarget.style.color=PS.text;e.currentTarget.style.background=PS.hover;}}
                onMouseLeave={e=>{e.currentTarget.style.color=PS.textMuted;e.currentTarget.style.background="transparent";}}>
                Blank canvas
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Context menu ── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.92 }}
            style={{ position:"absolute", left:contextMenu.x, top:contextMenu.y, zIndex:300, padding:"4px", borderRadius:7, background:"rgba(36,36,36,0.99)", backdropFilter:"blur(16px)", border:`1px solid ${PS.borderMid}`, minWidth:156, boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>
            {contextMenu.type === "element" ? <>
              <CM label="Duplicate" icon={<Copy size={11}/>} onClick={()=>{duplicateSelected();setContextMenu(null);}} />
              <CM label="Bring to Front" icon={<ArrowUp size={11}/>} onClick={()=>{bringToFront(selectedIds);setContextMenu(null);}} />
              <CM label="Send to Back" icon={<ArrowDown size={11}/>} onClick={()=>{sendToBack(selectedIds);setContextMenu(null);}} />
              <div style={{ height:1, background: PS.border, margin:"3px 0" }}/>
              <CM label="Delete" icon={<Trash2 size={11}/>} onClick={()=>{deleteSelected();setContextMenu(null);}} danger />
            </> : <>
              <CM label="Add Note" icon={<StickyIcon size={11}/>} onClick={()=>{addElement(contextMenu.x,contextMenu.y,"note");setContextMenu(null);}} />
              <CM label="Add Text" icon={<Type size={11}/>} onClick={()=>{addElement(contextMenu.x,contextMenu.y,"text");setContextMenu(null);}} />
              <div style={{ height:1, background: PS.border, margin:"3px 0" }}/>
              <CM label="Reset View" icon={<RotateCcw size={11}/>} onClick={()=>{setView({x:0,y:0,scale:1});setContextMenu(null);}} />
            </>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export Modal ── */}
      <AnimatePresence>
        {showExportModal && (
          <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.8)", backdropFilter:"blur(5px)" }}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              style={{ width:360, background: PS.panel, border:`1px solid ${PS.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 20px 50px rgba(0,0,0,0.5)" }}>
              <div style={{ padding:"20px 24px", borderBottom:`1px solid ${PS.border}`, display:"flex", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Download size={18} color={PS.accent}/>
                  <h3 style={{ fontSize:15, fontWeight:700, color:PS.text, margin:0 }}>Export Settings</h3>
                </div>
                <button onClick={()=>setShowExportModal(false)} style={{ marginLeft:"auto", background:"transparent", border:"none", cursor:"pointer", color:PS.textMuted, display:"flex" }}>
                  <X size={18}/>
                </button>
              </div>
              
              <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
                {/* Scope Selection */}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:PS.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, display:"block" }}>Capture Area</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <button onClick={()=>setExportSettings(s=>({...s, scope:'all'}))}
                      style={{ padding:"10px", borderRadius:8, border:`1px solid ${exportSettings.scope==='all' ? PS.accent : PS.border}`, background: exportSettings.scope==='all' ? PS.accentBg : PS.panel, color: exportSettings.scope==='all' ? PS.accent : PS.textDim, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.12s" }}>
                      Entire Canvas
                    </button>
                    <button onClick={()=>setExportSettings(s=>({...s, scope:'selected'}))} disabled={selectedIds.length===0}
                      style={{ padding:"10px", borderRadius:8, border:`1px solid ${exportSettings.scope==='selected' ? PS.accent : PS.border}`, background: exportSettings.scope==='selected' ? PS.accentBg : PS.panel, color: exportSettings.scope==='selected' ? PS.accent : PS.textDim, fontSize:12, fontWeight:600, cursor: selectedIds.length===0 ? "not-allowed" : "pointer", opacity: selectedIds.length===0 ? 0.4 : 1, transition:"all 0.12s" }}>
                      Selected ({selectedIds.length})
                    </button>
                  </div>
                </div>

                {/* Background & Quality */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:PS.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, display:"block" }}>Background</label>
                    <ToggleRow label="Transparent" active={exportSettings.transparent} onClick={()=>setExportSettings(s=>({...s, transparent:!s.transparent}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:PS.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, display:"block" }}>Quality</label>
                    <select value={exportSettings.quality} onChange={e=>setExportSettings(s=>({...s, quality:Number(e.target.value)}))}
                      style={{ width:"100%", padding:"6px", borderRadius:6, background:PS.panel, border:`1px solid ${PS.border}`, color:PS.text, fontSize:12, outline:"none" }}>
                      <option value={1}>Standard (1x)</option>
                      <option value={2}>High (2x)</option>
                      <option value={3}>Ultra (3x)</option>
                    </select>
                  </div>
                </div>

                {/* Final Actions */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
                  <button onClick={() => exportImage(exportSettings.transparent, true, exportSettings.scope)}
                    style={{ padding:"12px", borderRadius:10, border:`1px solid ${PS.border}`, background: PS.hover, color: PS.text, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.12s" }}>
                    <Copy size={16}/> Copy
                  </button>
                  <button onClick={exportPNG}
                    style={{ padding:"12px", borderRadius:10, border:"none", background: PS.accent, color: "white", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.12s" }}>
                    <Download size={16}/> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── Tool Importer Modal ── */}
      <AnimatePresence>
        {showToolImporter && (
          <div style={{ position:"fixed", inset:0, zIndex:1001, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)" }}
            onClick={()=>setShowToolImporter(false)}>
            <motion.div initial={{ scale:0.94, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.94, opacity:0, y:20 }}
              onClick={e=>e.stopPropagation()}
              style={{ width:600, maxHeight:"85vh", background: PS.panel, border:`1px solid ${PS.borderMid}`, borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>
              <div style={{ padding:"24px 30px", borderBottom:`1px solid ${PS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <h3 style={{ fontSize:18, fontWeight:800, color:PS.text, margin:0, display:"flex", alignItems:"center", gap:10 }}>
                    <Layout size={20} color={PS.accent}/> Import Live Tool
                  </h3>
                  <p style={{ fontSize:12, color:PS.textMuted, margin:"4px 0 0 0" }}>Select a tool to embed as a widget on your canvas.</p>
                </div>
                <button onClick={()=>setShowToolImporter(false)} style={{ background:"rgba(255,255,255,0.05)", border:"none", borderRadius:"50%", padding:8, cursor:"pointer", color:PS.textMuted, display:"flex" }}
                  onMouseEnter={e=>e.currentTarget.style.color=PS.text} onMouseLeave={e=>e.currentTarget.style.color=PS.textMuted}>
                  <X size={20}/>
                </button>
              </div>

              <div style={{ padding:"16px 30px", background:"rgba(0,0,0,0.2)" }}>
                <div style={{ position:"relative" }}>
                  <SearchIcon size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:PS.textMuted }} />
                  <input value={toolSearch} onChange={e=>setToolSearch(e.target.value)}
                    placeholder="Search tools (e.g. Pomodoro, QR, 2048)..."
                    style={{ width:"100%", padding:"12px 12px 12px 42px", borderRadius:12, background:PS.bg, border:`1px solid ${PS.border}`, color:PS.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>

              <div data-lenis-prevent style={{ flex:1, overflowY:"auto", padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {ALL_TOOLS.filter(t => t.id !== "brainflow" && (t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(toolSearch.toLowerCase()))))
                  .map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button key={tool.id} onClick={() => addToolWidget(tool)}
                        style={{ display:"flex", gap:15, padding:16, borderRadius:15, background: PS.bg, border:`1px solid ${PS.border}`, cursor:"pointer", transition:"all 0.2s", textAlign:"left" }}
                        onMouseEnter={e=>{e.currentTarget.style.background=PS.panel;e.currentTarget.style.borderColor=PS.accentDim;e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background=PS.bg;e.currentTarget.style.borderColor=PS.border;e.currentTarget.style.transform="translateY(0)";}}>
                        <div style={{ padding:10, borderRadius:12, background:PS.panel, color:PS.accent, display:"flex" }}>
                          <Icon size={20}/>
                        </div>
                        <div style={{ overflow:"hidden" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:PS.text, marginBottom:4 }}>{tool.name}</div>
                          <div style={{ fontSize:10, color:PS.textMuted, lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{tool.description}</div>
                        </div>
                      </button>
                    );
                  })
                }
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CanvasElementComp ────────────────────────────────────────────────────────

function CanvasElementComp({ element, isSelected, isEditing, isConnecting, onMouseDown, onResizeMouseDown, onDoubleClick, onUpdate, onEndEdit, onHover, onContextMenu, tool, onDelete, onDeselect, onHeaderMouseDown }: {
  element: CanvasElement; isSelected: boolean; isEditing: boolean; isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent) => void; onResizeMouseDown: (e: React.MouseEvent, handle: string) => void;
  onDoubleClick: () => void; onUpdate: (u: Partial<CanvasElement>) => void; onEndEdit: () => void;
  onHover: (h: boolean) => void; onContextMenu: (e: React.MouseEvent) => void; tool: string; onDelete?: () => void; onDeselect?: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}) {
  const c = getColor(element.color);
  const isDark = element.color === "Slate";
  const [hovered, setHovered] = useState(false);
  const isShape = element.type === "shape";
  const isText = element.type === "text";
  const isNote = element.type === "note";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (isEditing && textareaRef.current) textareaRef.current.focus(); }, [isEditing]);

  const borderRadius = isShape ? (element.shapeType==="circle"?"50%":element.shapeType==="diamond"?"12px":"10px") : (element.type === "widget" ? "16px" : (isNote ? "10px" : "0px"));
  const diamondRot = element.shapeType === "diamond" ? 45 : 0;
  const fontWeight = element.fontStyle === "bold" ? "700" : "400";
  const fontStyle = element.fontStyle === "italic" ? "italic" : "normal";

  const bgStyle: Record<string, string | number> = isText ? {} : {
    background: isNote ? c.grad : `${c.hex}18`,
    border: `1.5px solid ${isNote ? c.border+"88" : c.hex+"44"}`,
  };
  if (isNote) bgStyle.boxShadow = `0 3px 14px ${c.hex}12, 0 1px 0 rgba(255,255,255,0.07) inset`;
  if (element.type === "widget") {
    bgStyle.background = PS.panel;
    bgStyle.color = "#fff";
  }

  const HANDLES = ["n","s","e","w","ne","nw","se","sw"];
  const handlePos: Record<string, React.CSSProperties> = {
    n:{top:-4,left:"50%",transform:"translateX(-50%)"},s:{bottom:-4,left:"50%",transform:"translateX(-50%)"},
    e:{right:-4,top:"50%",transform:"translateY(-50%)"},w:{left:-4,top:"50%",transform:"translateY(-50%)"},
    ne:{top:-4,right:-4},nw:{top:-4,left:-4},se:{bottom:-4,right:-4},sw:{bottom:-4,left:-4},
  };
  const cursorM: Record<string,string> = {n:"ns-resize",s:"ns-resize",e:"ew-resize",w:"ew-resize",ne:"ne-resize",nw:"nw-resize",se:"se-resize",sw:"sw-resize"};

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: isConnecting ? 1.05 : 1, opacity: (element.opacity??100)/100 }} exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      style={{ position:"absolute", left:element.x, top:element.y, width:element.width, height:element.height,
        transform:`rotate(${(element.rotate||0)+diamondRot}deg)`, zIndex:element.zIndex+(isSelected?500:0),
        boxSizing:"border-box", ...bgStyle as any, borderRadius, overflow: isShape ? "hidden" : "visible",
        cursor:tool==="eraser"?"cell":"pointer",
        border: isSelected ? `1.5px solid ${PS.accent}` : isConnecting ? "1.5px solid #10b981" : "none",
        boxShadow: isSelected ? `0 0 0 1px ${PS.accent}` : "none" }}
      onMouseDown={onMouseDown} onDoubleClick={onDoubleClick}
      onMouseEnter={()=>onHover(true)} onMouseLeave={()=>onHover(false)} onContextMenu={onContextMenu}
    >
      {element.isLocked && <div style={{ position:"absolute",top:4,right:4,zIndex:10 }}><Lock size={9} color={isDark?"rgba(255,255,255,0.22)":"rgba(0,0,0,0.18)"}/></div>}
      {isNote && <div style={{ position:"absolute",inset:0,borderRadius:10,pointerEvents:"none",background:"linear-gradient(180deg,rgba(255,255,255,0.09) 0%,transparent 50%)" }}/>}
      
      {/* Edge Hover Triggers for Widgets */}
      {element.type === "widget" && (
        <div style={{ position:"absolute", inset:-8, pointerEvents:"none", zIndex:15 }}>
          {/* N, S, E, W Trigger Bars */}
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", top:0, left:20, right:20, height:16, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", bottom:0, left:20, right:20, height:16, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", top:20, bottom:20, left:0, width:16, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", top:20, bottom:20, right:0, width:16, pointerEvents:"auto" }} />
          {/* Corner Triggers */}
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", top:0, left:0, width:20, height:20, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", top:0, right:0, width:20, height:20, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", bottom:0, left:0, width:20, height:20, pointerEvents:"auto" }} />
          <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ position:"absolute", bottom:0, right:0, width:20, height:20, pointerEvents:"auto" }} />
        </div>
      )}

      {element.type === "widget" && (
        <div onMouseDown={onHeaderMouseDown}
          style={{ position:"absolute", top:-32, left:0, display:"flex", alignItems:"center", gap:6, background:PS.panel, border:`1px solid ${PS.borderMid}`, padding:"6px 12px", borderRadius:20, cursor:"move", transition:"all 0.2s", boxShadow:PS.shadow, zIndex:1000 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PS.accent; e.currentTarget.style.background = PS.accentBg; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PS.borderMid; e.currentTarget.style.background = PS.panel; }}>
          <Move size={11} color={PS.accent}/>
          <span style={{ fontSize:10, fontWeight:900, color:PS.text, letterSpacing:"0.08em" }}>DRAG</span>
        </div>
      )}
      <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:isShape?4:(element.type==="widget"?0:11),transform:diamondRot?"rotate(-45deg)":"none",boxSizing:"border-box" }}>
        {element.type === "widget" ? (
          <div style={{ width:"100%", height:"100%", background:PS.bg, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", border:`1px solid ${PS.borderMid}`, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
            <div onMouseDown={onHeaderMouseDown}
              style={{ padding:"8px 12px", background:"rgba(0,0,0,0.4)", borderBottom:`1px solid ${PS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"move" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex", gap:4 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#FF5F56" }}/>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#FFBD2E" }}/>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#27C93F" }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:PS.textDim, textTransform:"uppercase", letterSpacing:"0.05em" }}>{element.content}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {!isSelected && (
                  <button onMouseDown={(e)=>{e.stopPropagation(); onMouseDown(e)}} 
                    style={{ background:"transparent", border:"none", color:PS.textMuted, cursor:"pointer", padding:2, display:"flex" }} title="Select Widget">
                    <Scan size={12}/>
                  </button>
                )}
                {isSelected && (
                  <button onMouseDown={(e)=>{e.stopPropagation(); onDeselect?.()}} 
                    style={{ background:"transparent", border:"none", color:PS.textMuted, cursor:"pointer", padding:2, display:"flex" }} title="Deselect Widget">
                    <X size={12}/>
                  </button>
                )}
                <button onMouseDown={(e)=>{e.stopPropagation(); onDelete?.()}} 
                  style={{ background:"transparent", border:"none", color:PS.red, cursor:"pointer", padding:2, display:"flex" }} title="Delete Widget">
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
            <div style={{ flex:1, position:"relative", background:"#000" }} onMouseDown={e => isSelected && e.stopPropagation()}>
              <iframe src={`/tools/${element.toolId}?embed=true`} 
                style={{ width:"100%", height:"100%", border:"none", background:"transparent" }}
                title={element.content} />
              {!isSelected && (
                <div onMouseDown={onMouseDown} style={{ position:"absolute", inset:0, cursor:"pointer", zIndex:5 }} />
              )}
            </div>
          </div>
        ) : isEditing ? (
          <textarea ref={textareaRef} value={element.content} 
            onChange={e=>{
              const val = e.target.value;
              e.target.style.height = '1px';
              const scrollH = e.target.scrollHeight;
              e.target.style.height = '100%';
              const pad = isShape ? 8 : 22;
              if (scrollH + pad > element.height) {
                onUpdate({ content: val, height: scrollH + pad });
              } else {
                onUpdate({ content: val });
              }
            }} 
            onBlur={onEndEdit}
            style={{ width:"100%",height:"100%",background:"transparent",outline:"none",resize:"none",border:"none",color:isDark?"#e2e8f0":c.text,fontSize:element.fontSize||15,fontWeight,fontStyle,textAlign:element.textAlign||"center",lineHeight:1.45,fontFamily:"inherit" }}/>
        ) : (
          <p style={{ width:"100%",height:"100%",color:isText?"rgba(220,220,220,0.85)":isDark?"#e2e8f0":c.text,fontSize:element.fontSize||15,fontWeight,fontStyle,textAlign:element.textAlign||"center",lineHeight:1.45,whiteSpace:"pre-wrap",wordBreak:"break-word",overflowY:"auto",display:"flex",alignItems:"center",justifyContent:element.textAlign==="left"?"flex-start":element.textAlign==="right"?"flex-end":"center",padding:0,margin:0 }}>
            {element.content}
          </p>
        )}
      </div>
      {(isSelected || hovered) && !element.isLocked && !isEditing && HANDLES.map(h => (
        <div key={h} style={{ position:"absolute",width:10,height:10,background:"white",border:`2px solid ${PS.accent}`,borderRadius:"50%",cursor:cursorM[h],zIndex:20,...handlePos[h], boxShadow:"0 2px 5px rgba(0,0,0,0.3)" }}
          onMouseDown={e=>{e.stopPropagation();onResizeMouseDown(e,h);}}/>
      ))}
    </motion.div>
  );
}

// ─── Minimap ──────────────────────────────────────────────────────────────────

function MinimapPanel({ elements, bounds, view, setView, canvasRef }: { elements: CanvasElement[]; bounds: any; view: ViewState; setView: React.Dispatch<React.SetStateAction<ViewState>>; canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const W = 220, H = 120;
  const bw = bounds.maxX - bounds.minX || 1, bh = bounds.maxY - bounds.minY || 1;
  const sc = Math.min(W/bw, H/bh) * 0.85;
  const toM = (x: number, y: number) => ({ x: (x-bounds.minX)*sc+(W-bw*sc)/2, y: (y-bounds.minY)*sc+(H-bh*sc)/2 });
  
  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startView = { ...view };
    
    const onMove = (me: PointerEvent) => {
      const dx = (me.clientX - startX) / sc * startView.scale;
      const dy = (me.clientY - startY) / sc * startView.scale;
      setView({ ...startView, x: startView.x - dx, y: startView.y - dy });
    };
    const onUp = (ue: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div style={{ width:W, height:H, background: PS.panel, borderRadius:6, overflow:"hidden", border:`1px solid ${PS.border}`, position:"relative" }}>
      <svg width={W} height={H}>
        {elements.map(el => { const p=toM(el.x,el.y); const c=getColor(el.color); return <rect key={el.id} x={p.x} y={p.y} width={Math.max(4,el.width*sc)} height={Math.max(3,el.height*sc)} fill={c.hex} opacity={0.45} rx={2}/>; })}
        {canvasRef.current && (() => {
          const rect = canvasRef.current!.getBoundingClientRect();
          const vp = toM(-view.x/view.scale, -view.y/view.scale);
          return <rect x={vp.x} y={vp.y} width={rect.width/view.scale*sc} height={rect.height/view.scale*sc} fill="rgba(255,255,255,0.05)" stroke={PS.accent} strokeWidth="1.5" rx={2} opacity={0.7} style={{ cursor: "grab" }} onPointerDown={handlePointerDown} />;
        })()}
      </svg>
    </div>
  );
}

// ─── Sidebar sub-components ───────────────────────────────────────────────────

function SBSection({ label, children, noBorder }: { label?: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div style={{ padding:"10px 12px", borderBottom: noBorder ? "none" : `1px solid ${PS.border}` }}>
      {label && <div style={{ fontSize:9, color: PS.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:8 }}>{label}</div>}
      {children}
    </div>
  );
}

function PropInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:4, background: PS.panel, border:`1px solid ${PS.border}` }}>
      <span style={{ fontSize:9, color: PS.textMuted, width:12, flexShrink:0, textTransform:"uppercase" }}>{label}</span>
      <input type="number" value={local}
        onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
        onBlur={() => onChange(local)}
        onKeyDown={e => { e.stopPropagation(); if(e.key==="Enter") onChange(local); }}
        style={{ width:"100%", background:"transparent", outline:"none", border:"none", fontSize:11, fontFamily:"'Roboto Mono', monospace", color: PS.text, textAlign:"right", minWidth:0 }}/>
    </div>
  );
}

function ToggleRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"5px 0", background:"transparent", border:"none", cursor:"pointer" }}>
      <span style={{ fontSize:11, color: PS.textDim }}>{label}</span>
      <div style={{ width:26, height:14, borderRadius:7, background: active ? PS.accent : "rgba(255,255,255,0.08)", position:"relative", transition:"background 0.15s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:2, width:10, height:10, borderRadius:"50%", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,0.4)", transition:"left 0.15s", left: active ? 14 : 2 }}/>
      </div>
    </button>
  );
}

function PsBtn({ onClick, active, children }: { onClick:()=>void; active?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ padding:4, borderRadius:4, background: active ? PS.accentBg : "transparent", border:`1px solid ${active ? PS.accentDim : "transparent"}`, color: active ? PS.accent : PS.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.12s" }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=PS.textMuted;}}}>
      {children}
    </button>
  );
}

function PsActionBtn({ onClick, icon, label, style: extraStyle }: { onClick:()=>void; icon: React.ReactNode; label: string; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"6px 8px", borderRadius:5, border:`1px solid ${PS.border}`, background: PS.panel, color: PS.textDim, fontSize:11, cursor:"pointer", transition:"all 0.12s", ...extraStyle }}
      onMouseEnter={e=>{e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;e.currentTarget.style.borderColor=PS.borderMid;}}
      onMouseLeave={e=>{e.currentTarget.style.background=PS.panel;e.currentTarget.style.color=PS.textDim;e.currentTarget.style.borderColor=PS.border;}}>
      {icon} {label}
    </button>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function TB({ active, onClick, icon, label, accent }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button onClick={onClick} title={label}
      className="relative group transition-all duration-100 active:scale-95"
      style={{ padding:"6px 8px", borderRadius:6,
        background: active ? (accent ? PS.accentBg : "rgba(74,144,217,0.18)") : "transparent",
        color: active ? (accent ? PS.accent : PS.accent) : accent ? "#7aaedc" : PS.textDim,
        border: active ? `1px solid ${PS.accentDim}` : "1px solid transparent",
      }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background=PS.hover;e.currentTarget.style.color=PS.text;e.currentTarget.style.borderColor=PS.border;}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=accent?"#7aaedc":PS.textDim;e.currentTarget.style.borderColor="transparent";}}}>
      {icon}
      <div style={{ position:"absolute", top:-30, left:"50%", transform:"translateX(-50%)", padding:"2px 6px", background:"rgba(0,0,0,0.85)", color:"white", fontSize:9, borderRadius:4, whiteSpace:"nowrap", fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", pointerEvents:"none", opacity:0, transition:"opacity 0.1s", border:`1px solid ${PS.border}` }} className="group-hover:opacity-100">{label}</div>
    </button>
  );
}

function Sep() {
  return <div style={{ width:1, height:14, background: PS.border, margin:"0 2px" }}/>;
}

function CM({ label, icon, onClick, danger }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"6px 10px", fontSize:11, color: danger ? PS.red : PS.text, background:"transparent", border:"none", cursor:"pointer", borderRadius:4, transition:"all 0.1s" }}
      onMouseEnter={e=>{e.currentTarget.style.background=danger?"rgba(224,82,82,0.1)":PS.hover;e.currentTarget.style.color=danger?PS.red:"#ffffff";}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=danger?PS.red:PS.text;}}>
      <span style={{ opacity:0.9, display:"flex" }}>{icon}</span>{label}
    </button>
  );
}