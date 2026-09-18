"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Plus, Trash2, GripVertical, GripHorizontal, ArrowLeft, HelpCircle, 
  KanbanSquare, Search, Download, Upload, RotateCcw, CheckCircle2, 
  ShieldCheck, Sparkles, Layers, Tag, X, Edit3, Check, Palette,
  ChevronDown, Filter, FileText, MoveRight
} from "lucide-react";
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

export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
};

export type TaskColor = 'zinc' | 'yellow' | 'blue' | 'emerald' | 'rose' | 'purple';

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  color?: TaskColor;
  createdAt?: number;
};

const COLOR_CONFIG: Record<TaskColor, { label: string; dot: string; bg: string; border: string; text: string }> = {
  zinc:   { label: 'Normal',  dot: '#888888', bg: '#333333', border: '#555555', text: '#cccccc' },
  yellow: { label: 'Medium',  dot: '#eab308', bg: 'rgba(234,179,8,0.1)', border: '#ca8a04', text: '#fef08a' },
  blue:   { label: 'Info',    dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#2563eb', text: '#bfdbfe' },
  emerald:{ label: 'Done/Low',dot: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#059669', text: '#a7f3d0' },
  rose:   { label: 'Urgent',  dot: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: '#e11d48', text: '#fecdd3' },
  purple: { label: 'Feature', dot: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: '#9333ea', text: '#e9d5ff' },
};

const generateId = () => `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const defaultCols: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Completed" },
];

const defaultTasks: Task[] = [
  { id: "task-1", columnId: "todo", content: "Review technical architecture for AssetNest tools", color: "blue", createdAt: Date.now() - 3600000 },
  { id: "task-2", columnId: "todo", content: "Implement drag-and-drop column reordering", color: "yellow", createdAt: Date.now() - 7200000 },
  { id: "task-3", columnId: "in-progress", content: "Optimize dark mode contrast and typography hierarchy", color: "purple", createdAt: Date.now() - 10800000 },
  { id: "task-4", columnId: "done", content: "Modernize Smart Notes and Typing Speed Tester UI/UX", color: "emerald", createdAt: Date.now() - 14400000 },
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

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<TaskColor | 'all'>('all');

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCols = localStorage.getItem("kanban_columns");
      const savedTasks = localStorage.getItem("kanban_tasks");

      if (savedCols && savedTasks) {
        const parsedCols = JSON.parse(savedCols);
        const parsedTasks = JSON.parse(savedTasks);
        setColumns(Array.isArray(parsedCols) && parsedCols.length > 0 ? parsedCols : defaultCols);
        setTasks(Array.isArray(parsedTasks) ? parsedTasks : defaultTasks);
      } else {
        setColumns(defaultCols);
        setTasks(defaultTasks);
      }
    } catch {
      setColumns(defaultCols);
      setTasks(defaultTasks);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem("kanban_columns", JSON.stringify(columns));
      localStorage.setItem("kanban_tasks", JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save kanban state", e);
    }
  }, [columns, tasks, isClient]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createColumn = () => {
    const newCol: Column = { id: generateId(), title: `Column ${columns.length + 1}` };
    setColumns([...columns, newCol]);
  };

  const deleteColumn = (id: Id) => {
    if (confirm("Delete this column and all its tasks?")) {
      setColumns(columns.filter((c) => c.id !== id));
      setTasks(tasks.filter((t) => t.columnId !== id));
    }
  };

  const updateColumn = (id: Id, title: string) => {
    setColumns(columns.map((c) => c.id === id ? { ...c, title } : c));
  };

  const createTask = (columnId: Id) => {
    const newTask: Task = { 
      id: generateId(), 
      columnId, 
      content: "", 
      color: 'zinc',
      createdAt: Date.now() 
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id: Id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const updateTask = (id: Id, content: string) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, content } : t));
  };

  const updateTaskColor = (id: Id, color: TaskColor) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, color } : t));
  };

  const resetDefaultBoard = () => {
    if (confirm("Reset board to default columns and sample tasks? Current tasks will be replaced.")) {
      setColumns(defaultCols);
      setTasks(defaultTasks);
      setSearchQuery("");
      setColorFilter("all");
    }
  };

  const clearAllTasks = () => {
    if (confirm("Remove all tasks across all columns? Columns will be preserved.")) {
      setTasks([]);
    }
  };

  const exportBoardJSON = () => {
    const data = {
      version: 1,
      appName: "AssetNest Kanban",
      exportedAt: new Date().toISOString(),
      columns,
      tasks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanban-board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.columns) && Array.isArray(parsed.tasks)) {
          setColumns(parsed.columns);
          setTasks(parsed.tasks);
          alert("Board successfully imported!");
        } else {
          alert("Invalid Kanban backup file format.");
        }
      } catch {
        alert("Failed to parse the imported JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        const overIndex = currentTasks.findIndex(t => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return currentTasks;
        
        if (currentTasks[activeIndex].columnId !== currentTasks[overIndex].columnId) {
          const newTasks = [...currentTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: currentTasks[overIndex].columnId };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(currentTasks, activeIndex, overIndex);
      });
    }

    if (isActiveTask && isOverColumn) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        if (activeIndex === -1) return currentTasks;
        const newTasks = [...currentTasks];
        newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: overId };
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "Column") {
      if (active.id !== over.id) {
        setColumns((cols) => {
          const activeIndex = cols.findIndex((col) => col.id === active.id);
          const overIndex = cols.findIndex((col) => col.id === over.id);
          return arrayMove(cols, activeIndex, overIndex);
        });
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = searchQuery.trim() === "" || 
        task.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchColor = colorFilter === 'all' || task.color === colorFilter;
      return matchSearch && matchColor;
    });
  }, [tasks, searchQuery, colorFilter]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/tools" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            color: T.textSec, textDecoration: "none", fontSize: 12,
            padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
            border: `1px solid ${T.border}`, transition: "color 0.15s",
          }}>
            <ArrowLeft size={13} /> Back
          </Link>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 4, background: T.accentDim,
              border: `1px solid ${T.accent}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.accent,
            }}>
              <KanbanSquare size={13} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>Kanban Workspace</span>
              <span style={{ fontSize: 10, color: T.textSec, marginLeft: 8, display: "none" }}>Offline Drag & Drop</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={createColumn}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 3, background: T.accent,
              border: "none", color: "#111", fontSize: 11, fontWeight: 600,
              cursor: "pointer", transition: "opacity 0.15s",
            }}
          >
            <Plus size={13} /> Add Column
          </button>

          <button
            onClick={exportBoardJSON}
            title="Export Board as JSON"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11,
              cursor: "pointer",
            }}
          >
            <Download size={12} /> Backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import Board from JSON"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11,
              cursor: "pointer",
            }}
          >
            <Upload size={12} /> Restore
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            accept=".json,application/json" 
            style={{ display: "none" }} 
          />

          <button
            onClick={() => setShowHelp(true)}
            title="Documentation & Shortcuts"
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

      {/* ── Sub-toolbar / Filter Ribbon ─────────────────────────────────────── */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "8px 16px", display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 10, flexShrink: 0,
      }}>
        {/* Left: Stats & Search */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: T.surfaceHi, padding: "3px 8px", borderRadius: 3, border: `1px solid ${T.border}` }}>
            <Search size={11} style={{ color: T.textSec }} />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 11, color: T.textPri, width: 140,
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Color tag filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setColorFilter('all')}
              style={{
                fontSize: 10, padding: "3px 7px", borderRadius: 3, cursor: "pointer",
                background: colorFilter === 'all' ? T.accentDim : T.surfaceHi,
                border: `1px solid ${colorFilter === 'all' ? T.accent : T.border}`,
                color: colorFilter === 'all' ? T.accent : T.textSec,
              }}
            >
              All
            </button>
            {(Object.keys(COLOR_CONFIG) as TaskColor[]).map((c) => (
              <button
                key={c}
                onClick={() => setColorFilter(colorFilter === c ? 'all' : c)}
                title={COLOR_CONFIG[c].label}
                style={{
                  width: 18, height: 18, borderRadius: "50%", cursor: "pointer",
                  background: COLOR_CONFIG[c].dot,
                  border: colorFilter === c ? "2px solid #fff" : "1px solid rgba(0,0,0,0.5)",
                  transform: colorFilter === c ? "scale(1.15)" : "none",
                  transition: "transform 0.1s",
                }}
              />
            ))}
          </div>

          <div style={{ width: 1, height: 14, background: T.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSec }}>
            <span>{columns.length} columns</span>
            <span>•</span>
            <span>{tasks.length} total tasks</span>
            {searchQuery || colorFilter !== 'all' ? (
              <>
                <span>•</span>
                <span style={{ color: T.accent }}>({filteredTasks.length} matching)</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Board Utilities */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={clearAllTasks}
            disabled={tasks.length === 0}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 7px", borderRadius: 3, background: "transparent",
              border: `1px solid ${T.border}`, color: tasks.length === 0 ? T.muted : T.danger,
              fontSize: 10, cursor: tasks.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={11} /> Clear Tasks
          </button>

          <button
            onClick={resetDefaultBoard}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 7px", borderRadius: 3, background: "transparent",
              border: `1px solid ${T.border}`, color: T.textSec,
              fontSize: 10, cursor: "pointer",
            }}
          >
            <RotateCcw size={11} /> Reset Board
          </button>
        </div>
      </div>

      {/* ── Main Kanban Canvas ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div 
            className="kanban-scroll"
            style={{
              flex: 1,
              display: "flex",
              gap: 14,
              overflowX: "auto",
              overflowY: "hidden",
              alignItems: "stretch",
              paddingBottom: 8,
            }}
          >
            <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <div key={col.id} style={{ minWidth: 280, maxWidth: 320, flex: "0 0 300px", display: "flex", flexDirection: "column" }}>
                  <ColumnContainer 
                    column={col} 
                    deleteColumn={deleteColumn}
                    updateColumn={updateColumn}
                    createTask={createTask}
                    deleteTask={deleteTask}
                    updateTask={updateTask}
                    updateTaskColor={updateTaskColor}
                    tasks={filteredTasks.filter((t) => t.columnId === col.id)}
                    totalTasksInColumn={tasks.filter((t) => t.columnId === col.id).length}
                  />
                </div>
              ))}
            </SortableContext>

            {/* Quick Add Column Button at end of horizontal list */}
            <div style={{ minWidth: 240, flex: "0 0 240px", display: "flex", alignItems: "flex-start" }}>
              <button
                onClick={createColumn}
                style={{
                  width: "100%", padding: "12px", borderRadius: 4,
                  background: "rgba(255,255,255,0.03)", border: `1px dashed ${T.border}`,
                  color: T.textSec, fontSize: 12, fontWeight: 500,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.accent;
                  e.currentTarget.style.color = T.accent;
                  e.currentTarget.style.background = T.accentDim;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.textSec;
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <Plus size={14} /> Add Another List
              </button>
            </div>
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
            {activeColumn && (
              <div style={{ width: 300 }}>
                <ColumnContainer 
                  column={activeColumn} 
                  deleteColumn={deleteColumn} 
                  updateColumn={updateColumn} 
                  createTask={createTask} 
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  updateTaskColor={updateTaskColor}
                  tasks={filteredTasks.filter((t) => t.columnId === activeColumn.id)}
                  totalTasksInColumn={tasks.filter((t) => t.columnId === activeColumn.id).length}
                  isOverlay
                />
              </div>
            )}
            {activeTask && (
              <TaskCard 
                task={activeTask} 
                deleteTask={deleteTask} 
                updateTask={updateTask} 
                updateTaskColor={updateTaskColor}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* ── SEO & Specs Documentation Section ──────────────────────────────── */}
      <section style={{
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: "24px 20px", marginTop: "auto",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Chip icon={<ShieldCheck size={11} style={{ color: T.accent }} />} label="100% Client-Side Local Storage" />
            <Chip icon={<Layers size={11} style={{ color: T.accent }} />} label="Smooth Drag & Drop Reordering" />
            <Chip icon={<Download size={11} style={{ color: T.accent }} />} label="JSON Backup & Restore" />
            <Chip icon={<Tag size={11} style={{ color: T.accent }} />} label="Priority Tag Color Schemes" />
          </div>

          {/* 6 Features Grid */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              Key Workflow & Architecture Capabilities
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <KanbanSquare size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Interactive Drag & Drop Canvas</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Reorder columns and drag task cards across stages effortlessly using fluid sensor physics with zero lag or render delay.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={13} style={{ color: T.success }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Zero Cloud & Complete Privacy</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Your tasks, columns, and notes never leave your computer. Everything is persisted locally in browser storage without account creation.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Palette size={13} style={{ color: "#fbbf24" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>6-Tier Visual Color Categorization</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Flag items by urgency, feature type, or progress with quick color chips (Normal, Medium, Info, Low, Urgent, Feature).
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Search size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Instant Real-time Filter</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Quickly locate cards in busy workspaces using instant substring filtering and single-click color category isolation.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Download size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>JSON Backup & Machine Migration</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Export full board schemas with a single click. Restore across browsers or team members with structured JSON files.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Sparkles size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Touch & Keyboard Accessible</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Engineered with touch sensitivity constraints and keyboard coordinate getters for smooth mobile, tablet, and desktop handling.
                </p>
              </div>
            </div>
          </div>

          {/* 3-Step Timeline */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              How to Manage Tasks Effectively
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 1</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Define Columns & Stages</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Click column titles to rename stages (e.g., Backlog, In Review, Released) or click "+ Add Column" to add workflow phases.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 2</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Capture & Color-Code Tasks</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Click "+ Add Task" to write action items. Use the palette icon on hover to tag cards with visual priority colors.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 3</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Drag, Filter & Export</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Move tasks across lists as work progresses. Filter by keywords and export periodic JSON backups for peace of mind.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              AssetNest Kanban vs Traditional Cloud Task Tools
            </h3>
            <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "8px 10px", color: T.textPri, fontWeight: 600 }}>Feature</th>
                    <th style={{ padding: "8px 10px", color: T.accent, fontWeight: 600 }}>AssetNest Kanban</th>
                    <th style={{ padding: "8px 10px", color: T.textSec, fontWeight: 600 }}>Cloud Task Boards (Trello / Jira)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Data Privacy</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>100% Local (Never leaves device)</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Stored on remote third-party databases</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Sign-up / Account</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Zero login, instant launch</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Mandatory account & email verification</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Speed & Latency</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>0ms latency, pure local physics</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Network dependent round trips</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Offline Usage</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Full offline functionality</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Limited or read-only offline modes</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Cost & Limits</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Free forever, unlimited boards & cards</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Free tier limits, paywalled team features</td>
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
                question="Is my board data safe if I close the browser window?" 
                answer="Yes! Every column modification, task addition, and card repositioning automatically syncs into your browser's persistent localStorage in real-time. It will be waiting for you whenever you return." 
              />
              <FAQItem 
                question="How do I change the color or priority of a task?" 
                answer="Hover over any task card (or tap it on mobile) to display the card toolbar. Click the circular color palette icon to select between 6 priority colors (Normal, Medium, Info, Low, Urgent, Feature)." 
              />
              <FAQItem 
                question="Can I transfer my board to another computer?" 
                answer="Yes! Click the 'Backup' button in the top header to download a complete JSON representation of your board. On your other computer, click 'Restore' and choose the file to import your board instantly." 
              />
              <FAQItem 
                question="How do I rename columns or delete entire lists?" 
                answer="Click directly on the column title text in the column header and edit the name. Press Enter to confirm. To delete a list and its associated tasks, click the trash icon located on the left of the column header." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Help / Technical Specs Modal ────────────────────────────────────── */}
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Kanban Board Technical Specs"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, color: T.textPri, fontSize: 12, lineHeight: 1.5 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 4px 0" }}>Local-First Task Workspace</h4>
            <p style={{ margin: 0, color: T.textSec }}>
              AssetNest Kanban is a lightweight, zero-latency task management workspace powered by @dnd-kit sensors and localStorage state serialization.
            </p>
          </div>

          <div style={{ background: T.surfaceHi, padding: 10, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <h5 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: "0 0 6px 0" }}>Keyboard & Drag Shortcuts</h5>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.textSec, display: "flex", flexDirection: "column", gap: 4 }}>
              <li><strong>Enter</strong> on task title to save edits</li>
              <li><strong>Click card text</strong> to toggle inline edit mode</li>
              <li><strong>Hover card</strong> to reveal priority color selector and delete option</li>
              <li><strong>Drag column header</strong> to reorder entire workflow columns</li>
              <li><strong>Backup / Restore</strong> in top navigation to sync across devices</li>
            </ul>
          </div>
        </div>
      </HelpModal>

      <style dangerouslySetInnerHTML={{ __html: `
        .kanban-scroll::-webkit-scrollbar { height: 8px; width: 6px; }
        .kanban-scroll::-webkit-scrollbar-track { background: ${T.bg}; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: ${T.accentDark}; }
      `}} />
    </div>
  );
}

// ─── Column Container Component ───────────────────────────────────────────────
interface ColumnProps {
  column: Column;
  tasks: Task[];
  totalTasksInColumn: number;
  deleteColumn: (id: Id) => void;
  updateColumn: (id: Id, title: string) => void;
  createTask: (id: Id) => void;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
  updateTaskColor: (id: Id, color: TaskColor) => void;
  isOverlay?: boolean;
}

function ColumnContainer({ 
  column, 
  tasks, 
  totalTasksInColumn,
  deleteColumn, 
  updateColumn, 
  createTask, 
  deleteTask, 
  updateTask, 
  updateTaskColor, 
  isOverlay 
}: ColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column }
  });

  const style: React.CSSProperties = { 
    transition, 
    transform: CSS.Transform.toString(transform),
  };

  const tasksIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={{
          ...style,
          opacity: 0.35,
          border: `1px dashed ${T.accent}`,
          background: T.accentDim,
          width: "100%",
          minHeight: 380,
          borderRadius: 4,
        }}
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        background: T.surface,
        border: `1px solid ${isOverlay ? T.accent : T.border}`,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 160px)",
        boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
        transition: "border-color 0.15s",
      }}
    >
      {/* Column Header */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surfaceHi,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          cursor: "grab",
        }}
        {...attributes}
        {...listeners}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
          <GripVertical size={13} style={{ color: T.textSec, flexShrink: 0 }} />
          
          <input 
            value={column.title}
            onChange={(e) => updateColumn(column.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            style={{
              background: "transparent",
              border: "1px solid transparent",
              outline: "none",
              color: T.textPri,
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 4px",
              borderRadius: 3,
              flex: 1,
              minWidth: 0,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.accent;
              e.currentTarget.style.background = T.bg;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "transparent";
            }}
          />

          <span style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.textSec,
            fontSize: 10,
            fontWeight: 500,
            padding: "1px 6px",
            borderRadius: 10,
            flexShrink: 0,
          }}>
            {totalTasksInColumn}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); createTask(column.id); }}
            title="Add card"
            style={{
              background: "transparent", border: "none", color: T.textSec,
              cursor: "pointer", padding: "3px", borderRadius: 3, display: "flex",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = T.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
          >
            <Plus size={13} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); deleteColumn(column.id); }}
            title="Delete column"
            style={{
              background: "transparent", border: "none", color: T.textSec,
              cursor: "pointer", padding: "3px", borderRadius: 3, display: "flex",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = T.danger}
            onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Task List container */}
      <div 
        className="kanban-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 120,
        }}
      >
        <SortableContext items={tasksIds} strategy={rectSortingStrategy}>
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              deleteTask={deleteTask} 
              updateTask={updateTask} 
              updateTaskColor={updateTaskColor}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div style={{
            padding: "20px 10px",
            textAlign: "center",
            color: T.muted,
            fontSize: 11,
            border: `1px dashed ${T.borderDim}`,
            borderRadius: 3,
            marginTop: 4,
          }}>
            No tasks in this list
          </div>
        )}
      </div>

      {/* Add Task footer */}
      <div style={{ padding: "8px", borderTop: `1px solid ${T.border}` }}>
        <button 
          onClick={() => createTask(column.id)}
          style={{
            width: "100%",
            border: `1px dashed ${T.border}`,
            background: "transparent",
            color: T.textSec,
            borderRadius: 3,
            padding: "6px 8px",
            fontSize: 11,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.accent;
            e.currentTarget.style.background = T.accentDim;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.textSec;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Plus size={12} /> Add Task
        </button>
      </div>
    </div>
  );
}

// ─── Task Card Component ──────────────────────────────────────────────────────
interface TaskProps {
  task: Task;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
  updateTaskColor: (id: Id, color: TaskColor) => void;
  isOverlay?: boolean;
}

function TaskCard({ task, deleteTask, updateTask, updateTaskColor, isOverlay }: TaskProps) {
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task }
  });

  const style: React.CSSProperties = { 
    transition, 
    transform: CSS.Transform.toString(transform),
  };

  const toggleEditMode = () => {
    setEditMode(prev => !prev);
    setMouseIsOver(false);
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={{
          ...style,
          opacity: 0.35,
          border: `1px dashed ${T.accent}`,
          background: T.accentDim,
          borderRadius: 3,
          minHeight: 64,
        }}
      />
    );
  }

  const currentColor = COLOR_CONFIG[task.color || 'zinc'];

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        background: T.bg,
        border: `1px solid ${isOverlay ? T.accent : T.border}`,
        borderLeft: `3px solid ${currentColor.dot}`,
        borderRadius: 3,
        padding: "8px 10px",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        boxShadow: isOverlay ? "0 4px 16px rgba(0,0,0,0.5)" : "none",
        transition: "border-color 0.15s, transform 0.1s",
      }}
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => {
        setMouseIsOver(false);
        setShowColorPicker(false);
      }}
      {...attributes}
      {...listeners}
    >
      {editMode ? (
        <textarea 
          autoFocus
          value={task.content}
          placeholder="Task description..."
          onBlur={toggleEditMode}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              toggleEditMode();
            }
          }}
          onChange={(e) => updateTask(task.id, e.target.value)}
          style={{
            background: T.surfaceHi,
            border: `1px solid ${T.accent}`,
            outline: "none",
            resize: "vertical",
            width: "100%",
            fontSize: 12,
            lineHeight: 1.4,
            color: T.textPri,
            borderRadius: 2,
            padding: 4,
            minHeight: 50,
            fontFamily: T.font,
          }}
        />
      ) : (
        <div 
          onClick={toggleEditMode}
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: task.content ? T.textPri : T.muted,
            wordBreak: "break-word",
            minHeight: 28,
            cursor: "pointer",
          }}
        >
          {task.content || <span style={{ fontStyle: "italic" }}>Empty card - click to edit</span>}
        </div>
      )}

      {/* Card Footer / Metadata */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: T.textSec, marginTop: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span 
            style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: currentColor.dot,
            }}
          />
          <span style={{ fontSize: 9, color: T.muted }}>{currentColor.label}</span>
        </div>

        {/* Hover Action Bar */}
        {(mouseIsOver || showColorPicker) && !editMode && (
          <div 
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              background: T.surfaceHi, border: `1px solid ${T.border}`,
              borderRadius: 3, padding: "2px 4px",
            }}
          >
            {/* Color Palette button */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Change Color Priority"
                style={{
                  background: "transparent", border: "none", color: T.textSec,
                  cursor: "pointer", padding: "1px 3px", display: "flex",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = T.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
              >
                <Palette size={11} />
              </button>

              {showColorPicker && (
                <div style={{
                  position: "absolute", bottom: "100%", right: 0, marginBottom: 4,
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 3, padding: 4, display: "flex", gap: 3, zIndex: 60,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}>
                  {(Object.keys(COLOR_CONFIG) as TaskColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        updateTaskColor(task.id, c);
                        setShowColorPicker(false);
                      }}
                      title={COLOR_CONFIG[c].label}
                      style={{
                        width: 14, height: 14, borderRadius: "50%", cursor: "pointer",
                        background: COLOR_CONFIG[c].dot,
                        border: task.color === c ? "2px solid #fff" : "none",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Edit button */}
            <button 
              onClick={toggleEditMode}
              title="Edit text"
              style={{
                background: "transparent", border: "none", color: T.textSec,
                cursor: "pointer", padding: "1px 3px", display: "flex",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.textPri}
              onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
            >
              <Edit3 size={11} />
            </button>

            {/* Delete button */}
            <button 
              onClick={() => deleteTask(task.id)}
              title="Delete task"
              style={{
                background: "transparent", border: "none", color: T.textSec,
                cursor: "pointer", padding: "1px 3px", display: "flex",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.danger}
              onMouseLeave={(e) => e.currentTarget.style.color = T.textSec}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
