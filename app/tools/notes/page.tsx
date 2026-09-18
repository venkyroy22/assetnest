"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Plus, Trash2, FileText, ImageIcon, Menu, X, MoreHorizontal, Maximize2, Minimize2,
    PanelLeftClose, PanelLeftOpen, Type, BrainCircuit, Search, Check, Timer, Tag, Download,
    Keyboard, CalendarDays, Copy, Hash, Pin, Star, Link2, AlignLeft, Rocket, Lightbulb,
    BookOpen, Code2, Layers, Users, Clipboard, BarChart2, Globe, Mail, Settings, Zap,
    Target, Briefcase, FlaskConical, Music, Dumbbell, ShoppingCart, Camera, Heart,
    MessageSquare, Cpu, Cloud, Shield, Database, Pencil, NotebookText, FolderOpen,
    ListTodo, Clock, Sparkles, ArrowLeft, HelpCircle, ShieldCheck, CheckCircle2, ChevronDown
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

// ─── Data Types & Presets ──────────────────────────────────────────────────────
type Note = {
    id: string;
    title: string;
    content: string;
    coverImage: string | null;
    icon: string | null;
    isFavorite: boolean;
    tags: string[];
    createdAt: number;
    updatedAt: number;
    isPinned: boolean;
};

const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    work:     { bg: "rgba(249,115,22,0.15)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
    personal: { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
    ideas:    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
    todo:     { bg: "rgba(16,185,129,0.15)",  text: "#34d399", border: "rgba(16,185,129,0.3)" },
    research: { bg: "rgba(168,85,247,0.15)",  text: "#c084fc", border: "rgba(168,85,247,0.3)" },
    journal:  { bg: "rgba(244,63,94,0.15)",   text: "#fb7185", border: "rgba(244,63,94,0.3)" },
};

const TEMPLATES = [
    { id: 'blank', name: 'Blank Page', iconName: 'FileText', content: '' },
    { id: 'daily', name: 'Daily Note', iconName: 'CalendarDays', content: `<h2>🎯 Top 3 Priorities</h2><div class="todo-item"><input type="checkbox" /> <span>Priority 1</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 2</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 3</span></div><h2>📝 Notes</h2><p></p><h2>💡 Ideas</h2><p></p>` },
    { id: 'meeting', name: 'Meeting Notes', iconName: 'Users', content: `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Attendees:</strong> </p><p><strong>Goal:</strong> </p><h2>📋 Agenda</h2><div class="todo-item"><input type="checkbox" /> <span>Item 1</span></div><h2>💬 Discussion</h2><p></p><h2>✅ Action Items</h2><div class="todo-item"><input type="checkbox" /> <span>Action 1 - Owner</span></div>` },
    { id: 'brainstorm', name: 'Brainstorm', iconName: 'Lightbulb', content: `<p><em>Date: ${new Date().toLocaleDateString()}</em></p><div class="callout-block">What problem are we solving?</div><h2>🌊 Stream of Consciousness</h2><p>Write anything that comes to mind...</p><h2>🏆 Best Ideas</h2><ul><li>Idea 1</li><li>Idea 2</li></ul><h2>⚡ Next Steps</h2><p></p>` },
    { id: 'project', name: 'Project Plan', iconName: 'Layers', content: `<p><strong>Goal:</strong> </p><p><strong>Deadline:</strong> </p><h2>📌 Overview</h2><p></p><h2>✅ Milestones</h2><div class="todo-item"><input type="checkbox" /> <span>Milestone 1</span></div><div class="todo-item"><input type="checkbox" /> <span>Milestone 2</span></div><h2>🚧 Blockers</h2><p></p><h2>📎 Resources</h2><p></p>` },
    { id: 'article', name: 'Article Draft', iconName: 'Pencil', content: `<p><em>By [Author] · ${new Date().toLocaleDateString()}</em></p><div class="callout-block">TL;DR: One sentence summary of the article.</div><h2>Introduction</h2><p>Hook the reader here...</p><h2>Main Point 1</h2><p></p><h2>Conclusion</h2><p></p>` },
];

const PAGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    FileText, NotebookText, Pencil, BookOpen, Code2, Lightbulb, Rocket, Target,
    CalendarDays, Clock, ListTodo, BrainCircuit, Layers, Users, Clipboard, BarChart2,
    Globe, Mail, Settings, Zap, Briefcase, FlaskConical, Music, Dumbbell,
    ShoppingCart, Camera, Heart, MessageSquare, Cpu, Cloud, Shield, Database, FolderOpen,
};
const PAGE_ICON_NAMES = Object.keys(PAGE_ICONS);

function NoteIcon({ name, size = 16, className = "" }: { name: string | null; size?: number; className?: string }) {
    const Icon = name && PAGE_ICONS[name] ? PAGE_ICONS[name] : FileText;
    return <Icon size={size} className={className} />;
}

const COVERS = [
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
    "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
];

const COMMANDS = [
    { id: 'h1', name: 'Heading 1', icon: <Type size={14} />, detail: 'Large section title', shortcut: '# ' },
    { id: 'h2', name: 'Heading 2', icon: <Type size={13} />, detail: 'Medium sub-section', shortcut: '## ' },
    { id: 'h3', name: 'Heading 3', icon: <Type size={12} />, detail: 'Small sub-heading', shortcut: '### ' },
    { id: 'bullet', name: 'Bulleted List', icon: <Menu size={14} />, detail: 'Simple list', shortcut: '- ' },
    { id: 'numbered', name: 'Numbered List', icon: <AlignLeft size={14} />, detail: 'Ordered list', shortcut: '1. ' },
    { id: 'todo', name: 'To-do Item', icon: <Check size={14} />, detail: 'Track tasks with checkbox', shortcut: '[] ' },
    { id: 'quote', name: 'Quote Block', icon: <FileText size={14} />, detail: 'Capture a quote', shortcut: '> ' },
    { id: 'callout', name: 'Callout Box', icon: <BrainCircuit size={14} />, detail: 'Highlight important info', shortcut: '! ' },
    { id: 'divider', name: 'Divider Line', icon: <MoreHorizontal size={14} />, detail: 'Visual separator', shortcut: '---' },
    { id: 'code', name: 'Code Block', icon: <Hash size={14} />, detail: 'Syntax-highlighted code', shortcut: '```' },
    { id: 'table', name: 'Simple Table', icon: <MoreHorizontal size={14} />, detail: 'Add a data table', shortcut: '/table' },
    { id: 'link', name: 'Hyperlink', icon: <Link2 size={14} />, detail: 'Insert a web link', shortcut: '/link' },
];

export default function SmartNotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [mobileView, setMobileView] = useState<"sidebar" | "editor">("sidebar");
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const [showCoverPicker, setShowCoverPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [newTag, setNewTag] = useState("");

    const [slashMenu, setSlashMenu] = useState<{ x: number, y: number } | null>(null);
    const [bubbleMenu, setBubbleMenu] = useState<{ x: number, y: number, text: string } | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("assetnest_notes");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotes(parsed);
                if (parsed.length > 0) setActiveId(parsed[0].id);
            } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            setIsSaving(true);
            const timer = setTimeout(() => {
                localStorage.setItem("assetnest_notes", JSON.stringify(notes));
                setIsSaving(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [notes, isLoaded]);

    const activeNote = notes.find(n => n.id === activeId) || null;

    const createNote = (templateId?: string) => {
        const tpl = TEMPLATES.find(t => t.id === templateId);
        const now = Date.now();
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: tpl?.id === 'daily' ? `Daily Note - ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}` : "",
            content: tpl?.content ?? "",
            coverImage: null,
            icon: tpl?.iconName ?? 'FileText',
            isFavorite: false,
            isPinned: false,
            tags: [],
            createdAt: now,
            updatedAt: now
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveId(newNote.id);
        setMobileView("editor");
        setSearchQuery("");
        setShowTemplates(false);
        setTimeout(() => { 
            if (contentRef.current) contentRef.current.innerHTML = newNote.content; 
            titleRef.current?.focus(); 
        }, 100);
    };

    const createDailyNote = () => {
        const todayTitle = `Daily Note - ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}`;
        const existing = notes.find(n => n.title === todayTitle);
        if (existing) { setActiveId(existing.id); setMobileView("editor"); return; }
        createNote('daily');
    };

    const exportNote = (format: 'md' | 'html' | 'txt') => {
        if (!activeNote) return;
        let content = '';
        const title = activeNote.title || 'Untitled';
        if (format === 'html') {
            content = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body><h1>${title}</h1>${activeNote.content}</body></html>`;
        } else if (format === 'md') {
            content = `# ${title}\n\n${activeNote.content.replace(/<h1>/g,'# ').replace(/<h2>/g,'## ').replace(/<h3>/g,'### ').replace(/<br\/>/g,'\n').replace(/<[^>]+>/g,'')}`;
        } else {
            content = `${title}\n\n${activeNote.content.replace(/<[^>]+>/g,'')}`;
        }
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${title}.${format === 'html' ? 'html' : format === 'md' ? 'md' : 'txt'}`;
        a.click();
        setShowExportMenu(false);
    };

    const copyToClipboard = (type: 'html' | 'plain') => {
        if (!activeNote) return;
        const text = type === 'html' ? activeNote.content : activeNote.content.replace(/<[^>]+>/g,'');
        navigator.clipboard.writeText(text);
        setShowExportMenu(false);
    };

    const addTag = (tag: string) => {
        if (!activeNote || !tag.trim() || activeNote.tags.includes(tag.trim().toLowerCase())) return;
        updateActiveNote({ tags: [...activeNote.tags, tag.trim().toLowerCase()] });
        setNewTag("");
    };

    const removeTag = (tag: string) => {
        if (!activeNote) return;
        updateActiveNote({ tags: activeNote.tags.filter(t => t !== tag) });
    };

    const deleteNote = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        if (activeId === id) setActiveId(updated.length > 0 ? updated[0].id : null);
    };

    const updateActiveNote = (updates: Partial<Note>) => {
        if (!activeId) return;
        setNotes(prev => prev.map(n => 
            n.id === activeId ? { ...n, ...updates, updatedAt: Date.now() } : n
        ));
    };

    const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        updateActiveNote({ content: target.innerHTML });
        
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const node = selection.focusNode;
        if (node?.nodeType === 3) {
            const text = node.textContent || "";
            const cursorPath = text.slice(0, selection.focusOffset);
            
            if (cursorPath.endsWith("/")) {
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                setSlashMenu({ x: rect.left, y: rect.top + 20 });
            } else if (!text.includes("/")) {
                setSlashMenu(null);
            }

            if (cursorPath === "# ") {
                document.execCommand('formatBlock', false, 'H1');
                node.textContent = text.slice(2);
            } else if (cursorPath === "## ") {
                document.execCommand('formatBlock', false, 'H2');
                node.textContent = text.slice(3);
            } else if (cursorPath === "### ") {
                document.execCommand('formatBlock', false, 'H3');
                node.textContent = text.slice(4);
            } else if (cursorPath === "- ") {
                document.execCommand('insertUnorderedList');
                node.textContent = text.slice(2);
            } else if (cursorPath === "! ") {
                insertCommand('callout');
                node.textContent = text.slice(2);
            }
        }
    };

    const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setBubbleMenu({
                x: rect.left + rect.width / 2,
                y: Math.max(10, rect.top - 44),
                text: selection.toString()
            });
        } else {
            setBubbleMenu(null);
        }
    };

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const insertCommand = (cmdId: string) => {
        if (!contentRef.current) return;
        contentRef.current.focus();
        
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        if (range) {
            range.setStart(selection!.focusNode!, selection!.focusOffset - 1);
            range.deleteContents();
        }

        switch (cmdId) {
            case 'h1': document.execCommand('formatBlock', false, 'H1'); break;
            case 'h2': document.execCommand('formatBlock', false, 'H2'); break;
            case 'h3': document.execCommand('formatBlock', false, 'H3'); break;
            case 'bullet': document.execCommand('insertUnorderedList'); break;
            case 'numbered': document.execCommand('insertOrderedList'); break;
            case 'todo': 
                document.execCommand('insertHTML', false, '<div class="todo-item"><input type="checkbox" style="width:16px;height:16px;margin-right:8px" /> <span>&nbsp;</span></div>'); 
                break;
            case 'quote': document.execCommand('formatBlock', false, 'BLOCKQUOTE'); break;
            case 'callout': 
                document.execCommand('insertHTML', false, '<div class="callout-block">💡 <span>&nbsp;</span></div>'); 
                break;
            case 'divider': document.execCommand('insertHTML', false, '<hr class="divider-line" />'); break;
            case 'code': document.execCommand('formatBlock', false, 'PRE'); break;
            case 'table': document.execCommand('insertHTML', false, '<table class="note-table"><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody></table>'); break;
            case 'link': { const url = prompt('Enter URL:'); if (url) document.execCommand('createLink', false, url); break; }
        }
        setSlashMenu(null);
    };

    const applyStyle = (cmd: string, val: string | undefined = undefined) => {
        document.execCommand(cmd, false, val);
        handleSelectionChange();
    };

    const handleTitleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        updateActiveNote({ title: val });
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    useEffect(() => {
        if (activeNote && contentRef.current) {
            if (contentRef.current.innerHTML !== activeNote.content) {
                contentRef.current.innerHTML = activeNote.content || "";
            }
        }
    }, [activeId]);

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
        }
    }, [activeNote?.title, activeId]);

    const filteredNotes = notes.filter(n => {
        const matchesSearch = (n.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = favoritesOnly ? n.isFavorite : true;
        const matchesTag = activeTag ? n.tags?.includes(activeTag) : true;
        return matchesSearch && matchesFavorite && matchesTag;
    }).sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);

    const allTags = [...new Set(notes.flatMap(n => n.tags || []))];
    const pinnedNotes = filteredNotes.filter(n => n.isPinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

    const stats = activeNote ? {
        words: (activeNote.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(x => x.length > 0).length),
        readTime: Math.max(1, Math.ceil(activeNote.content.replace(/<[^>]*>/g, ' ').length / 1000))
    } : { words: 0, readTime: 0 };

    if (!isLoaded) {
        return (
            <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font, fontSize: 13 }}>
                Loading Workspace...
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.textPri, fontFamily: T.font, display: "flex", flexDirection: "column" }} className={isFullscreen ? "fixed inset-0 z-[1000] h-screen" : ""}>

            {/* ── Top Navigation Header ──────────────────────────────────────── */}
            <header style={{
                position: "sticky", top: 0, zIndex: 50,
                background: T.bg, borderBottom: `1px solid ${T.borderDim}`,
                padding: "0 16px", height: 48,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
            }}>
                <Link
                    href="/tools"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        color: T.textSec, textDecoration: "none", fontSize: 11,
                        padding: "4px 8px", borderRadius: 3, border: `1px solid ${T.borderDim}`,
                        background: T.surface, transition: "all 0.15s",
                    }}
                >
                    <ArrowLeft size={13} />
                    <span>Back</span>
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: T.surfaceHi, border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: T.accent,
                    }}>
                        <FileText size={13} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.textPri }}>Smart Notes</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Sync indicator */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "3px 8px", borderRadius: 3,
                        background: T.surface, border: `1px solid ${T.borderDim}`,
                        fontSize: 10, color: isSaving ? T.accent : T.success, fontWeight: 500
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: isSaving ? T.accent : T.success }} className={isSaving ? "animate-pulse" : ""} />
                        <span className="hidden sm:inline">{isSaving ? 'Syncing' : 'Saved'}</span>
                    </div>

                    {/* Export Menu Trigger */}
                    {activeNote && (
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                style={{
                                    height: 28, padding: "0 8px", borderRadius: 3,
                                    background: T.surface, border: `1px solid ${T.borderDim}`,
                                    color: T.textSec, cursor: "pointer", fontSize: 11,
                                    display: "flex", alignItems: "center", gap: 4
                                }}
                                title="Export Note"
                            >
                                <Download size={13} />
                                <span className="hidden md:inline">Export</span>
                            </button>

                            {showExportMenu && (
                                <div
                                    style={{
                                        position: "absolute", right: 0, top: "calc(100% + 4px)",
                                        width: 170, background: T.surface, border: `1px solid ${T.border}`,
                                        borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                        padding: "4px 0", zIndex: 100
                                    }}
                                >
                                    <div style={{ padding: "4px 10px", fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Export As
                                    </div>
                                    <button onClick={() => exportNote('md')} style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", color: T.textPri, fontSize: 11, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        .md Markdown
                                    </button>
                                    <button onClick={() => exportNote('html')} style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", color: T.textPri, fontSize: 11, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        .html File
                                    </button>
                                    <button onClick={() => exportNote('txt')} style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", color: T.textPri, fontSize: 11, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        .txt Plain Text
                                    </button>
                                    <div style={{ height: 1, background: T.borderDim, margin: "4px 0" }} />
                                    <button onClick={() => copyToClipboard('html')} style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", color: T.textPri, fontSize: 11, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Copy size={12} /> Copy HTML
                                    </button>
                                    <button onClick={() => copyToClipboard('plain')} style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", color: T.textPri, fontSize: 11, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Copy size={12} /> Copy Plain
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shortcuts Trigger */}
                    <button
                        onClick={() => setShowShortcuts(true)}
                        style={{
                            width: 28, height: 28, borderRadius: 3,
                            background: T.surface, border: `1px solid ${T.borderDim}`,
                            color: T.textSec, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Keyboard Shortcuts"
                    >
                        <Keyboard size={13} />
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{
                            width: 28, height: 28, borderRadius: 3,
                            background: T.surface, border: `1px solid ${T.borderDim}`,
                            color: T.textSec, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>

                    {/* Help Documentation Modal Trigger */}
                    <button
                        onClick={() => setShowHelp(true)}
                        style={{
                            width: 28, height: 28, borderRadius: 3,
                            background: T.surface, border: `1px solid ${T.borderDim}`,
                            color: T.textSec, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Documentation"
                    >
                        <HelpCircle size={14} />
                    </button>
                </div>
            </header>

            {/* ── Main Workspace Body ────────────────────────────────────────── */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", height: "calc(100vh - 48px)" }}>

                {/* ── Sidebar ─────────────────────────────────────────────────── */}
                <aside
                    style={{
                        background: T.surface, borderRight: `1px solid ${T.border}`,
                        display: "flex", flexDirection: "column",
                        transition: "all 0.25s ease",
                        width: isSidebarOpen ? 280 : 0,
                        opacity: isSidebarOpen ? 1 : 0,
                        pointerEvents: isSidebarOpen ? "auto" : "none",
                        overflow: "hidden", zIndex: 40
                    }}
                    className={[
                        "fixed inset-y-0 left-0 sm:relative sm:inset-auto",
                        mobileView === "sidebar" ? "translate-x-0 !w-full sm:!w-[280px]" : "-translate-x-full sm:translate-x-0"
                    ].join(" ")}
                >
                    {/* Sidebar Header */}
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDim}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 3, background: T.accent, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                N
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Workspace Pages</span>
                        </div>
                        <button
                            onClick={() => setMobileView("editor")}
                            className="sm:hidden"
                            style={{ padding: 4, background: "transparent", border: "none", color: T.textSec, cursor: "pointer" }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Quick Buttons */}
                    <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, borderBottom: `1px solid ${T.borderDim}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                            <button
                                onClick={() => createNote()}
                                style={{
                                    height: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                                    background: T.accent, color: "#111", border: "none", borderRadius: 3,
                                    fontSize: 9, fontWeight: 600, cursor: "pointer"
                                }}
                            >
                                <Plus size={13} strokeWidth={2.5} />
                                <span>New</span>
                            </button>
                            <button
                                onClick={createDailyNote}
                                style={{
                                    height: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                                    background: T.surfaceHi, color: T.textPri, border: `1px solid ${T.border}`, borderRadius: 3,
                                    fontSize: 9, fontWeight: 500, cursor: "pointer"
                                }}
                            >
                                <CalendarDays size={12} />
                                <span>Today</span>
                            </button>
                            <button
                                onClick={() => setShowTemplates(true)}
                                style={{
                                    height: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                                    background: T.surfaceHi, color: T.textPri, border: `1px solid ${T.border}`, borderRadius: 3,
                                    fontSize: 9, fontWeight: 500, cursor: "pointer"
                                }}
                            >
                                <FileText size={12} />
                                <span>Templates</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div style={{ position: "relative" }}>
                            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
                            <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", height: 30, paddingLeft: 28, paddingRight: 8,
                                    background: "#2a2a2a", border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: T.textPri, fontSize: 11, outline: "none"
                                }}
                            />
                        </div>

                        {/* Tag Pills */}
                        {allTags.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 2 }}>
                                {[null, ...allTags].map(tag => (
                                    <button
                                        key={tag ?? 'all'}
                                        onClick={() => setActiveTag(tag)}
                                        style={{
                                            padding: "2px 6px", borderRadius: 2, fontSize: 9, fontWeight: 500,
                                            border: `1px solid ${activeTag === tag ? T.accent : T.borderDim}`,
                                            background: activeTag === tag ? T.accent : "#2a2a2a",
                                            color: activeTag === tag ? "#111" : T.textSec,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {tag ? `#${tag}` : 'all'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Filter Tabs: All vs Starred */}
                        <div style={{ display: "flex", background: "#2a2a2a", padding: 2, borderRadius: 3, border: `1px solid ${T.borderDim}` }}>
                            <button
                                onClick={() => setFavoritesOnly(false)}
                                style={{
                                    flex: 1, padding: "3px 0", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                                    background: !favoritesOnly ? T.surfaceHi : "transparent",
                                    color: !favoritesOnly ? T.textPri : T.muted,
                                    border: "none", borderRadius: 2, cursor: "pointer"
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFavoritesOnly(true)}
                                style={{
                                    flex: 1, padding: "3px 0", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                                    background: favoritesOnly ? T.surfaceHi : "transparent",
                                    color: favoritesOnly ? T.textPri : T.muted,
                                    border: "none", borderRadius: 2, cursor: "pointer"
                                }}
                            >
                                Starred
                            </button>
                        </div>
                    </div>

                    {/* Notes List */}
                    <div data-lenis-prevent className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
                        {pinnedNotes.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ padding: "4px 8px", fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
                                    <Pin size={9} /> Pinned
                                </div>
                                {pinnedNotes.map(note => (
                                    <NoteItem
                                        key={note.id}
                                        note={note}
                                        activeId={activeId}
                                        setActiveId={(id) => { setActiveId(id); setMobileView("editor"); }}
                                        deleteNote={deleteNote}
                                        updateNote={(id, updates) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))}
                                    />
                                ))}
                            </div>
                        )}

                        <div>
                            {pinnedNotes.length > 0 && (
                                <div style={{ padding: "4px 8px", fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Pages
                                </div>
                            )}
                            {unpinnedNotes.map(note => (
                                <NoteItem
                                    key={note.id}
                                    note={note}
                                    activeId={activeId}
                                    setActiveId={(id) => { setActiveId(id); setMobileView("editor"); }}
                                    deleteNote={deleteNote}
                                    updateNote={(id, updates) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))}
                                />
                            ))}
                        </div>

                        {filteredNotes.length === 0 && (
                            <div style={{ padding: "32px 16px", textAlign: "center", color: T.muted, fontSize: 11 }}>
                                No pages found
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── Main Canvas / Editor ────────────────────────────────────── */}
                <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: T.bg, position: "relative", overflow: "hidden" }}>

                    {/* Sub-bar / breadcrumb */}
                    <div style={{
                        height: 38, borderBottom: `1px solid ${T.borderDim}`,
                        padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: T.surface, flexShrink: 0
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                                onClick={() => setMobileView("sidebar")}
                                className="sm:hidden"
                                style={{ padding: 4, background: "transparent", border: "none", color: T.textSec, cursor: "pointer" }}
                            >
                                <Menu size={14} />
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="hidden sm:flex"
                                style={{
                                    padding: "3px 6px", background: T.surfaceHi, border: `1px solid ${T.border}`,
                                    borderRadius: 3, color: T.textSec, cursor: "pointer"
                                }}
                                title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
                            >
                                {isSidebarOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
                            </button>
                            <div style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                                <span>Workspace</span>
                                <span>/</span>
                                <span style={{ color: T.textPri, fontWeight: 500 }} className="truncate max-w-[180px] sm:max-w-[300px]">
                                    {activeNote?.title || (activeNote ? 'Untitled Page' : 'Dashboard')}
                                </span>
                            </div>
                        </div>

                        {activeNote && (
                            <button
                                onClick={() => setActiveId(null)}
                                style={{
                                    padding: "3px 8px", background: "transparent", border: `1px solid ${T.borderDim}`,
                                    borderRadius: 2, color: T.textSec, fontSize: 10, cursor: "pointer"
                                }}
                            >
                                Close Page
                            </button>
                        )}
                    </div>

                    {activeNote ? (
                        <div data-lenis-prevent className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative" }}>

                            {/* Cover Image Banner */}
                            <div style={{ position: "relative", width: "100%", height: 160, background: "#2a2a2a", borderBottom: `1px solid ${T.border}` }} className="group">
                                {activeNote.coverImage ? (
                                    <img src={activeNote.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #2c2c2c, #383838)" }} />
                                )}

                                <div style={{ position: "absolute", bottom: 12, right: 16, display: "flex", gap: 6 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setShowCoverPicker(!showCoverPicker)}
                                        style={{
                                            padding: "4px 10px", background: T.surface, border: `1px solid ${T.border}`,
                                            borderRadius: 3, color: T.textPri, fontSize: 10, fontWeight: 500,
                                            display: "flex", alignItems: "center", gap: 4, cursor: "pointer"
                                        }}
                                    >
                                        <ImageIcon size={11} /> Cover Gallery
                                    </button>
                                    {activeNote.coverImage && (
                                        <button
                                            onClick={() => updateActiveNote({ coverImage: null })}
                                            style={{
                                                padding: "4px 8px", background: "rgba(204,68,68,0.2)", border: `1px solid ${T.danger}`,
                                                borderRadius: 3, color: T.danger, cursor: "pointer"
                                            }}
                                            title="Remove Cover"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>

                                {showCoverPicker && (
                                    <div
                                        style={{
                                            position: "absolute", right: 16, bottom: -180, width: 280,
                                            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
                                            padding: 12, zIndex: 60, boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase" }}>Select Cover</span>
                                            <button onClick={() => setShowCoverPicker(false)} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer" }}><X size={12} /></button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                            {COVERS.map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { updateActiveNote({ coverImage: url }); setShowCoverPicker(false); }}
                                                    style={{ width: "100%", height: 56, borderRadius: 3, overflow: "hidden", border: `1px solid ${T.border}`, padding: 0, cursor: "pointer" }}
                                                >
                                                    <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Document Workspace Body */}
                            <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 120px" }}>

                                {/* Icon Selector Badge */}
                                <div style={{ position: "relative", marginTop: -32, marginBottom: 16, zIndex: 20 }}>
                                    <div style={{ display: "inline-block", position: "relative" }} className="group">
                                        <button
                                            onClick={() => setShowIconPicker(!showIconPicker)}
                                            style={{
                                                width: 64, height: 64, borderRadius: 6,
                                                background: T.surface, border: `1px solid ${T.border}`,
                                                color: T.accent, display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                            }}
                                        >
                                            <NoteIcon name={activeNote.icon} size={28} />
                                        </button>

                                        {activeNote.icon && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateActiveNote({ icon: null }); }}
                                                style={{
                                                    position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
                                                    background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.textSec,
                                                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>

                                    {showIconPicker && (
                                        <div
                                            style={{
                                                position: "absolute", top: "calc(100% + 8px)", left: 0, width: 280,
                                                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
                                                padding: 12, zIndex: 60, boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase" }}>Select Icon</span>
                                                <button onClick={() => setShowIconPicker(false)} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer" }}><X size={12} /></button>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                                                {PAGE_ICON_NAMES.map((iconName) => {
                                                    const Icon = PAGE_ICONS[iconName];
                                                    return (
                                                        <button
                                                            key={iconName}
                                                            onClick={() => { updateActiveNote({ icon: iconName }); setShowIconPicker(false); }}
                                                            title={iconName}
                                                            style={{
                                                                height: 34, borderRadius: 3, background: activeNote.icon === iconName ? T.surfaceHi : "transparent",
                                                                border: `1px solid ${activeNote.icon === iconName ? T.accent : "transparent"}`,
                                                                color: activeNote.icon === iconName ? T.accent : T.textSec,
                                                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                                                            }}
                                                        >
                                                            <Icon size={16} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Title Area */}
                                <div style={{ marginBottom: 16 }}>
                                    <textarea
                                        ref={titleRef}
                                        value={activeNote.title}
                                        onChange={handleTitleInput}
                                        placeholder="Untitled Page"
                                        rows={1}
                                        style={{
                                            width: "100%", background: "transparent", border: "none", outline: "none",
                                            fontSize: 28, fontWeight: 700, color: "#ffffff",
                                            resize: "none", overflow: "hidden", lineHeight: 1.2
                                        }}
                                    />
                                    {/* Meta bar */}
                                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, borderBottom: `1px solid ${T.borderDim}`, paddingBottom: 12, paddingTop: 4 }}>
                                        <span style={{ fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                                            <BrainCircuit size={11} /> {stats.words} Words
                                        </span>
                                        <span style={{ fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                                            <Timer size={11} /> {stats.readTime} Min Read
                                        </span>
                                        <button
                                            onClick={() => updateActiveNote({ isFavorite: !activeNote.isFavorite })}
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 4,
                                                padding: "2px 6px", borderRadius: 2,
                                                background: activeNote.isFavorite ? "rgba(245,158,11,0.15)" : T.surface,
                                                border: `1px solid ${activeNote.isFavorite ? "#f59e0b" : T.borderDim}`,
                                                color: activeNote.isFavorite ? "#f59e0b" : T.textSec,
                                                fontSize: 10, cursor: "pointer"
                                            }}
                                        >
                                            <Star size={10} fill={activeNote.isFavorite ? "#f59e0b" : "none"} />
                                            <span>{activeNote.isFavorite ? "Starred" : "Star"}</span>
                                        </button>

                                        {/* Tags */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                            {activeNote.tags.map(tag => {
                                                const customStyle = TAG_STYLES[tag] || { bg: "rgba(255,255,255,0.08)", text: T.textPri, border: T.borderDim };
                                                return (
                                                    <span
                                                        key={tag}
                                                        style={{
                                                            display: "inline-flex", alignItems: "center", gap: 3,
                                                            padding: "1px 6px", borderRadius: 2,
                                                            background: customStyle.bg, border: `1px solid ${customStyle.border}`,
                                                            color: customStyle.text, fontSize: 9, fontWeight: 500
                                                        }}
                                                    >
                                                        #{tag}
                                                        <button onClick={() => removeTag(tag)} style={{ background: "none", border: "none", color: customStyle.text, cursor: "pointer", padding: 0, display: "flex" }}>
                                                            <X size={9} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                            <input
                                                type="text"
                                                placeholder="+ tag"
                                                value={newTag}
                                                onChange={e => setNewTag(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" && newTag.trim()) {
                                                        addTag(newTag);
                                                    }
                                                }}
                                                style={{
                                                    width: 50, height: 18, background: "#2a2a2a", border: `1px solid ${T.borderDim}`,
                                                    borderRadius: 2, padding: "0 4px", fontSize: 9, color: T.textPri, outline: "none"
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Text ContentEditable Editor */}
                                <div
                                    ref={contentRef}
                                    contentEditable
                                    onInput={handleContentInput}
                                    onBlur={() => setTimeout(() => setSlashMenu(null), 250)}
                                    suppressContentEditableWarning
                                    className="styled-editor"
                                    data-placeholder="Type '/' for commands or markdown (# for H1, - for list, ! for callout)..."
                                    style={{
                                        minHeight: "55vh", outline: "none", fontSize: 14,
                                        lineHeight: 1.7, color: T.textPri
                                    }}
                                />

                                {/* Floating Slash Command Menu */}
                                {slashMenu && (
                                    <div
                                        style={{
                                            position: "fixed", zIndex: 120,
                                            left: slashMenu.x, top: slashMenu.y,
                                            width: 230, maxHeight: 280, overflowY: "auto",
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            borderRadius: 4, padding: "4px 0",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                                        }}
                                        className="custom-scrollbar"
                                    >
                                        <div style={{ padding: "4px 10px", fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${T.borderDim}` }}>
                                            Insert Blocks
                                        </div>
                                        {COMMANDS.map(cmd => (
                                            <button
                                                key={cmd.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    insertCommand(cmd.id);
                                                }}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                                                    padding: "6px 10px", background: "transparent", border: "none",
                                                    color: T.textPri, fontSize: 11, cursor: "pointer", textAlign: "left"
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHi)}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <span style={{ color: T.accent, display: "flex" }}>{cmd.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, fontSize: 11 }}>{cmd.name}</div>
                                                    <div style={{ fontSize: 9, color: T.muted }}>{cmd.detail}</div>
                                                </div>
                                                <span style={{ fontSize: 9, color: T.muted, fontFamily: "monospace" }}>{cmd.shortcut}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Floating Bubble Formatting Menu */}
                                {bubbleMenu && (
                                    <div
                                        style={{
                                            position: "fixed", zIndex: 110,
                                            left: bubbleMenu.x, top: bubbleMenu.y, transform: "translateX(-50%)",
                                            display: "flex", alignItems: "center", gap: 2, padding: "3px 4px",
                                            background: T.surface, border: `1px solid ${T.border}`,
                                            borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                                        }}
                                    >
                                        <button onClick={() => applyStyle('bold')} style={{ padding: "3px 6px", background: "transparent", border: "none", color: T.textPri, cursor: "pointer", fontWeight: 700, fontSize: 11 }}>B</button>
                                        <button onClick={() => applyStyle('italic')} style={{ padding: "3px 6px", background: "transparent", border: "none", color: T.textPri, cursor: "pointer", fontStyle: "italic", fontSize: 11 }}>I</button>
                                        <button onClick={() => applyStyle('strikeThrough')} style={{ padding: "3px 6px", background: "transparent", border: "none", color: T.textPri, cursor: "pointer", textDecoration: "line-through", fontSize: 11 }}>S</button>
                                        <div style={{ width: 1, height: 12, background: T.borderDim, margin: "0 2px" }} />
                                        <button onClick={() => applyStyle('createLink', prompt('URL:') || undefined)} style={{ padding: "3px 6px", background: "transparent", border: "none", color: T.accent, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>LINK</button>
                                    </div>
                                )}

                            </div>

                            {/* CSS for typography inside contentEditable */}
                            <style jsx global>{`
                                .styled-editor:empty:before { content: attr(data-placeholder); color: #777777; pointer-events: none; }
                                .styled-editor h1 { font-size: 1.9em; font-weight: 700; color: #ffffff; margin: 1.2em 0 0.4em; }
                                .styled-editor h2 { font-size: 1.45em; font-weight: 700; color: #e8e8e8; margin: 1.2em 0 0.4em; }
                                .styled-editor h3 { font-size: 1.2em; font-weight: 600; color: #d0d0d0; margin: 1.2em 0 0.4em; }
                                .styled-editor p { margin-bottom: 0.9em; font-weight: 400; line-height: 1.7; color: #cccccc; }
                                .styled-editor a { color: #4db8d4; text-decoration: underline; text-underline-offset: 3px; font-weight: 500; }
                                .styled-editor ul { list-style-type: none; margin-bottom: 1.2em; padding-left: 0; }
                                .styled-editor ul li { position: relative; padding-left: 1.5em; margin-bottom: 0.5em; font-weight: 400; color: #cccccc; }
                                .styled-editor ul li:before { content: "•"; color: #4db8d4; position: absolute; left: 0.3em; font-weight: 700; font-size: 1.2em; }
                                .styled-editor ol { margin-left: 1.5em; margin-bottom: 1.2em; list-style-type: decimal; color: #cccccc; }
                                .styled-editor ol li { margin-bottom: 0.5em; padding-left: 0.3em; font-weight: 400; color: #cccccc; }
                                .styled-editor blockquote { border-left: 3px solid #4db8d4; padding: 0.8rem 1.2rem; font-style: italic; color: #bbbbbb; margin: 1.5rem 0; font-size: 1em; background: #2a2a2a; border-radius: 4px; border: 1px solid #555555; }
                                .styled-editor pre { background: #252525; padding: 1rem 1.2rem; border-radius: 4px; margin: 1.5rem 0; border: 1px solid #555555; font-family: ui-monospace, monospace; font-size: 0.88em; overflow-x: auto; color: #4db8d4; }
                                .styled-editor code { font-family: ui-monospace, monospace; background: #2a2a2a; padding: 0.2em 0.4em; border-radius: 3px; color: #e06c75; font-size: 0.85em; border: 1px solid #444444; }
                                .todo-item { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; padding: 2px 0; font-weight: 400; color: #cccccc; }
                                .todo-item input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: #4db8d4; flex-shrink: 0; }
                                .callout-block { border: 1px solid #555555; border-left: 4px solid #4db8d4; padding: 10px 14px; background: #2a2a2a; border-radius: 4px; margin: 1.5rem 0; color: #cccccc; display: flex; align-items: center; gap: 8px; }
                                .divider-line { border: none; border-top: 1px dashed #555555; margin: 2rem 0; }
                                .note-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 12px; }
                                .note-table th { background: #444444; color: #cccccc; font-weight: 600; padding: 8px 12px; border: 1px solid #555555; text-align: left; }
                                .note-table td { padding: 8px 12px; border: 1px solid #555555; color: #cccccc; background: #3a3a3a; }
                                .note-table tr:hover td { background: #404040; }
                                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555555; border-radius: 3px; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #777777; }
                            `}</style>

                        </div>
                    ) : (
                        <HomeDashboard
                            notes={notes}
                            setActiveId={setActiveId}
                            setShowTemplates={setShowTemplates}
                            createNote={createNote}
                            createDailyNote={createDailyNote}
                        />
                    )}
                </main>
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────── */}
            {showTemplates && <TemplatesModal onSelect={(id) => createNote(id)} onClose={() => setShowTemplates(false)} />}
            {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
            
            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Smart Notes Technical Specs"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 16, color: T.textPri, fontSize: 12, lineHeight: 1.6 }}>
                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 8px" }}>
                            Zero-Server Privacy Guarantee
                        </h3>
                        <p style={{ margin: 0, color: T.textSec, fontSize: 11 }}>
                            Smart Notes is an offline-first workspace designed for speed and complete confidentiality. All notes, tags, covers, and icons are stored directly in your local browser container (`localStorage`). No tracking scripts, analytics miners, or external API relays have access to your written content.
                        </p>
                    </section>

                    <section style={{ background: "#333333", padding: 16, borderRadius: 4, border: `1px solid ${T.border}` }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 12px" }}>
                            Frequently Asked Questions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <FAQItem 
                                question="Does Smart Notes work without an internet connection?"
                                answer="Yes! All code bundles, editors, and data structures run 100% client-side. You can disconnect your network and continue writing, organizing, and exporting documents."
                            />
                            <FAQItem 
                                question="How does the '/' slash menu function?"
                                answer="Typing '/' inside any line opens the block inserter. You can immediately create headers, bulleted lists, checklists, callouts, or data tables with keyboard navigation."
                            />
                            <FAQItem 
                                question="How can I export my notes to external apps?"
                                answer="Click the Export dropdown on the top bar to instantly download Markdown (.md), clean HTML (.html), or standard plain text (.txt) files."
                            />
                        </div>
                    </section>
                </div>
            </HelpModal>
        </div>
    );
}

// ─── Sidebar Note Item ─────────────────────────────────────────────────────────
type NoteItemProps = { 
    note: Note; 
    activeId: string | null; 
    setActiveId: (id: string) => void; 
    deleteNote: (id: string, e: React.MouseEvent) => void; 
    updateNote: (id: string, updates: Partial<Note>) => void; 
};

function NoteItem({ note, activeId, setActiveId, deleteNote, updateNote }: NoteItemProps) {
    const active = activeId === note.id;
    return (
        <div
            onClick={() => setActiveId(note.id)}
            style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 8px", borderRadius: 3, cursor: "pointer",
                background: active ? T.surfaceHi : "transparent",
                border: `1px solid ${active ? T.accent : "transparent"}`,
                marginBottom: 2, transition: "background 0.1s"
            }}
            className="group"
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                <div style={{
                    width: 22, height: 22, borderRadius: 3, flexShrink: 0,
                    background: T.bg, border: `1px solid ${T.borderDim}`,
                    color: active ? T.accent : T.textSec,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <NoteIcon name={note.icon} size={12} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? T.accent : T.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {note.title || "Untitled Page"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                        {note.isFavorite && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f59e0b" }} />}
                        {note.isPinned && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent }} />}
                        <span style={{ fontSize: 9, color: T.muted }}>
                            {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 2 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isPinned: !note.isPinned }); }}
                    style={{ padding: 3, background: "transparent", border: "none", color: note.isPinned ? T.accent : T.muted, cursor: "pointer" }}
                    title={note.isPinned ? "Unpin" : "Pin"}
                >
                    <Pin size={11} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isFavorite: !note.isFavorite }); }}
                    style={{ padding: 3, background: "transparent", border: "none", color: note.isFavorite ? "#f59e0b" : T.muted, cursor: "pointer" }}
                    title={note.isFavorite ? "Unstar" : "Star"}
                >
                    <Star size={11} fill={note.isFavorite ? "#f59e0b" : "none"} />
                </button>
                <button
                    onClick={(e) => deleteNote(note.id, e)}
                    style={{ padding: 3, background: "transparent", border: "none", color: T.muted, cursor: "pointer" }}
                    title="Delete Note"
                >
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    );
}

// ─── Templates Modal ──────────────────────────────────────────────────────────
function TemplatesModal({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void; }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} onClick={onClose}>
            <div
                style={{
                    position: "relative", width: "100%", maxWidth: 520,
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: 24, color: T.textPri,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5)"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: 0 }}>Workspace Templates</h3>
                        <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>Start with a pre-configured outline</p>
                    </div>
                    <button onClick={onClose} style={{ padding: 4, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri, cursor: "pointer" }}><X size={13} /></button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {TEMPLATES.map(tpl => (
                        <button
                            key={tpl.id}
                            onClick={() => onSelect(tpl.id)}
                            style={{
                                display: "flex", alignItems: "flex-start", gap: 10, padding: 12,
                                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4,
                                textAlign: "left", cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = T.surfaceHi)}
                            onMouseLeave={e => (e.currentTarget.style.background = T.bg)}
                        >
                            <span style={{ padding: 6, borderRadius: 3, background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.accent, display: "flex" }}>
                                <NoteIcon name={tpl.iconName} size={15} />
                            </span>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: T.textPri }}>{tpl.name}</div>
                                <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>Insert outline</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void; }) {
    const shortcuts = [
        { key: '/', desc: 'Open block commands menu' },
        { key: '# + Space', desc: 'Heading 1' },
        { key: '## + Space', desc: 'Heading 2' },
        { key: '### + Space', desc: 'Heading 3' },
        { key: '- + Space', desc: 'Bulleted list' },
        { key: '! + Space', desc: 'Callout block' },
        { key: 'Ctrl+B', desc: 'Bold text' },
        { key: 'Ctrl+I', desc: 'Italic text' },
        { key: 'Ctrl+Z', desc: 'Undo changes' },
        { key: 'Ctrl+Y', desc: 'Redo changes' },
    ];
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} onClick={onClose}>
            <div
                style={{
                    position: "relative", width: "100%", maxWidth: 420,
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: 20, color: T.textPri,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5)"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <Keyboard size={15} style={{ color: T.accent }} /> Keyboard Shortcuts
                    </h3>
                    <button onClick={onClose} style={{ padding: 4, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri, cursor: "pointer" }}><X size={13} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {shortcuts.map(s => (
                        <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 3, background: T.bg, border: `1px solid ${T.borderDim}` }}>
                            <span style={{ fontSize: 11, color: T.textSec }}>{s.desc}</span>
                            <kbd style={{ padding: "2px 6px", background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 10, fontFamily: "monospace", color: T.textPri }}>
                                {s.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Home Dashboard (When No Note is Open) ────────────────────────────────────
function HomeDashboard({ 
    notes, 
    setActiveId, 
    setShowTemplates, 
    createNote,
    createDailyNote
}: { 
    notes: Note[]; 
    setActiveId: (id: string) => void; 
    setShowTemplates: (v: boolean) => void; 
    createNote: (tpl?: string) => void;
    createDailyNote: () => void;
}) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const recents = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

    return (
        <div data-lenis-prevent className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "32px 24px 60px" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

                {/* Greeting Banner */}
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#ffffff", margin: "0 0 6px" }}>
                        {greeting}!
                    </h1>
                    <p style={{ fontSize: 11, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                        Your Offline-First Markdown Workspace
                    </p>
                </div>

                {/* Quick Actions */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        <Sparkles size={12} style={{ color: T.accent }} /> Quick Start
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        <div
                            onClick={() => createNote()}
                            style={{
                                padding: 16, background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = T.accent)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 4, background: "rgba(77,184,212,0.15)", color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Plus size={16} />
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, margin: "0 0 4px" }}>Blank Workspace</h3>
                            <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.4 }}>Start fresh with a clean slate for capturing ideas.</p>
                        </div>

                        <div
                            onClick={createDailyNote}
                            style={{
                                padding: 16, background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = T.accent)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 4, background: "rgba(59,130,246,0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <CalendarDays size={16} />
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, margin: "0 0 4px" }}>Today's Note</h3>
                            <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.4 }}>Jump into template lists for daily task logging.</p>
                        </div>

                        <div
                            onClick={() => setShowTemplates(true)}
                            style={{
                                padding: 16, background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 4, cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = T.accent)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Layers size={16} />
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, margin: "0 0 4px" }}>Use Template</h3>
                            <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.4 }}>Choose structures pre-designed for articles and plans.</p>
                        </div>
                    </div>
                </div>

                {/* Recently Edited */}
                {recents.length > 0 && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            <Clock size={12} style={{ color: T.accent }} /> Recently Edited
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                            {recents.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setActiveId(note.id)}
                                    style={{
                                        background: T.surface, border: `1px solid ${T.border}`,
                                        borderRadius: 4, padding: 12, cursor: "pointer",
                                        transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.accent)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                                >
                                    <div style={{ height: 80, borderRadius: 3, background: "#2a2a2a", border: `1px solid ${T.borderDim}`, overflow: "hidden", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {note.coverImage ? (
                                            <img src={note.coverImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <NoteIcon name={note.icon} size={22} className="text-zinc-500" />
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: 11, fontWeight: 600, color: T.textPri, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {note.title || "Untitled Page"}
                                    </h4>
                                    <p style={{ fontSize: 9, color: T.muted, margin: "3px 0 0" }}>
                                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── SEO RICH DOCUMENTATION SECTION ─── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "28px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                        {/* Top Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                            <Chip icon={<ShieldCheck size={11} style={{ color: T.accent }} />} label="100% Client-Side" />
                            <Chip icon={<FileText size={11} style={{ color: T.accent }} />} label="Markdown & Rich Text" />
                            <Chip icon={<Zap size={11} style={{ color: T.accent }} />} label="Zero-Server Storage" />
                        </div>

                        {/* Title & Subtitle */}
                        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
                                Professional Offline-First Markdown & Rich Text Workspace
                            </h2>
                            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                                AssetNest Smart Notes gives you an ultra-fast, distraction-free environment to write, plan, and organize thoughts without account walls or cloud tracking. Built with slash commands, live word statistics, multi-format export, and instant local storage.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                            {[
                                {
                                    title: "Local Storage Security",
                                    desc: "All notes, covers, and tags reside purely inside your local browser container. Zero data ever leaves your device.",
                                    icon: Shield
                                },
                                {
                                    title: "Slash Commands & Shortcuts",
                                    desc: "Type '/' to insert headings, task checklists, blockquotes, callouts, and code blocks without breaking typing flow.",
                                    icon: Keyboard
                                },
                                {
                                    title: "Multi-Format Export",
                                    desc: "Export your pages to cleanly formatted Markdown (.md), web-ready HTML (.html), or standard plain text (.txt) in one click.",
                                    icon: Download
                                },
                                {
                                    title: "Visual Personalization",
                                    desc: "Customize each page with curated header cover art and library icons to visually distinguish work, personal, and study notes.",
                                    icon: ImageIcon
                                },
                                {
                                    title: "Starred & Pinned Organization",
                                    desc: "Pin critical reference pages to the top of your sidebar and mark favorites for immediate single-click access.",
                                    icon: Pin
                                },
                                {
                                    title: "100% Offline Capable",
                                    desc: "Write and edit documents anywhere without an internet connection. Changes auto-save instantly to your device.",
                                    icon: Zap
                                }
                            ].map((f, i) => (
                                <div key={i} style={{ padding: 14, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <div style={{ color: T.accent, display: "flex" }}>
                                            <f.icon size={14} />
                                        </div>
                                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: 0 }}>{f.title}</h4>
                                    </div>
                                    <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* How to Use Steps */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 18 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.textPri, margin: "0 0 16px" }}>
                                How to Organize Notes with AssetNest
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                                {[
                                    { step: "1", title: "Create or Pick a Template", desc: "Choose a Blank page, Daily Note, Meeting Notes, Project Plan, or Article Outline from the sidebar." },
                                    { step: "2", title: "Write with Markdown & Slash Menu", desc: "Type naturally with keyboard markdown shortcuts (#, ##, -, !) or type '/' to open the interactive block inserter." },
                                    { step: "3", title: "Categorize & Export", desc: "Add tags, pin important documents, star favorites, or export formatted .md and .html files to your drive." }
                                ].map((s) => (
                                    <div key={s.step} style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, position: "relative", paddingTop: 18 }}>
                                        <div style={{ position: "absolute", top: -9, left: 12, width: 20, height: 20, borderRadius: "50%", background: T.accent, color: "#111", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {s.step}
                                        </div>
                                        <h4 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: "0 0 4px" }}>{s.title}</h4>
                                        <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 18 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.textPri, margin: "0 0 4px" }}>
                                AssetNest Smart Notes vs Cloud-Based Note Apps
                            </h3>
                            <p style={{ fontSize: 11, color: T.textSec, textAlign: "center", margin: "0 0 16px" }}>
                                Compare local browser execution with typical cloud-hosted subscription platforms.
                            </p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                                    <thead>
                                        <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                                            <th style={{ padding: "8px 12px", color: T.textPri, fontWeight: 600 }}>Feature Capability</th>
                                            <th style={{ padding: "8px 12px", color: T.accent, fontWeight: 600 }}>AssetNest Smart Notes</th>
                                            <th style={{ padding: "8px 12px", color: T.textSec, fontWeight: 600 }}>Cloud-Hosted Platforms</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { feat: "Data Privacy & Security", ours: "100% Local (Saved in browser storage, zero cloud servers involved)", other: "Stored on remote corporate servers subject to breaches and tracking" },
                                            { feat: "Account Requirements", ours: "Zero signups, passwords, or emails required", other: "Mandatory account creation and email verification" },
                                            { feat: "Offline Usability", ours: "Fully accessible offline with zero network latency", other: "Requires steady connection or expensive offline sync upgrades" },
                                            { feat: "Export Options", ours: "Direct export to clean Markdown, HTML, or Plain Text", other: "Export restricted, walled behind paywalls, or locked to proprietary schemas" },
                                            { feat: "Pricing & Limits", ours: "100% Free with unlimited notes (bounded only by device disk)", other: "Tiered subscription paywalls, block limits, or advertisements" }
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                                                <td style={{ padding: "8px 12px", color: T.textPri, fontWeight: 500 }}>{row.feat}</td>
                                                <td style={{ padding: "8px 12px", color: T.accent }}>{row.ours}</td>
                                                <td style={{ padding: "8px 12px", color: T.textSec }}>{row.other}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Frequently Asked Questions */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 18 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: T.textPri, margin: "0 0 16px" }}>
                                Frequently Asked Questions
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <FAQItem 
                                    question="Are my notes stored on any server?" 
                                    answer="No. Smart Notes uses HTML5 LocalStorage to save all documents directly inside your browser. Neither AssetNest nor any third party has access to your content." 
                                />
                                <FAQItem 
                                    question="What happens if I clear my browser cookies and site data?" 
                                    answer="Because notes are stored locally in your browser cache, clearing browser site data for this domain will delete stored notes. We strongly recommend using the Export button to back up important documents as .md or .html." 
                                />
                                <FAQItem 
                                    question="Can I use markdown formatting shortcuts?" 
                                    answer="Yes! Type '# ' for H1, '## ' for H2, '### ' for H3, '- ' for bulleted lists, '! ' for callout blocks, or Ctrl+B / Ctrl+I for bold and italics." 
                                />
                                <FAQItem 
                                    question="Is there a limit on how many notes I can create?" 
                                    answer="No. Modern browsers allocate several megabytes of LocalStorage, enough to store thousands of pages of plain text, checklists, and code snippets." 
                                />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
