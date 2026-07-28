"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, ImageIcon, Smile, Menu, X, MoreHorizontal, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Type, BrainCircuit, Search, Check, Timer, Tag, Download, Keyboard, CalendarDays, Copy, Hash, Pin, Star, Link2, AlignLeft, Rocket, Lightbulb, BookOpen, Code2, Layers, Users, Clipboard, BarChart2, Globe, Mail, Settings, Zap, Target, Briefcase, FlaskConical, Music, Dumbbell, ShoppingCart, Camera, Heart, MessageSquare, Cpu, Cloud, Shield, Database, Pencil, NotebookText, FolderOpen, ListTodo, Clock, Sparkles, ArrowLeft, HelpCircle } from "lucide-react";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";

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

const TAG_COLORS: Record<string, string> = {
    work: 'bg-orange-100 text-orange-850 border-orange-200',
    personal: 'bg-blue-100 text-blue-850 border-blue-200',
    ideas: 'bg-amber-100 text-amber-850 border-amber-200',
    todo: 'bg-emerald-100 text-emerald-850 border-emerald-205 shadow-[1.5px_1.5px_0_#000]',
    research: 'bg-purple-100 text-purple-850 border-purple-200',
    journal: 'bg-rose-100 text-rose-850 border-rose-200',
};

const TEMPLATES = [
    { id: 'blank', name: 'Blank', iconName: 'FileText', content: '' },
    { id: 'daily', name: 'Daily Note', iconName: 'CalendarDays', content: `<h2>🎯 Top 3 Priorities</h2><div class="todo-item"><input type="checkbox" /> <span>Priority 1</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 2</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 3</span></div><h2>📝 Notes</h2><p></p><h2>💡 Ideas</h2><p></p>` },
    { id: 'meeting', name: 'Meeting Notes', iconName: 'Users', content: `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Attendees:</strong> </p><p><strong>Goal:</strong> </p><h2>📋 Agenda</h2><div class="todo-item"><input type="checkbox" /> <span>Item 1</span></div><h2>💬 Discussion</h2><p></p><h2>✅ Action Items</h2><div class="todo-item"><input type="checkbox" /> <span>Action 1 — Owner</span></div>` },
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

function NoteIcon({ name, size = 18, className = "" }: { name: string | null; size?: number; className?: string }) {
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
    { id: 'h1', name: 'Heading 1', icon: <Type size={16} />, detail: 'Large section title', shortcut: '# ' },
    { id: 'h2', name: 'Heading 2', icon: <Type size={14} />, detail: 'Medium sub-section', shortcut: '## ' },
    { id: 'h3', name: 'Heading 3', icon: <Type size={12} />, detail: 'Small sub-heading', shortcut: '### ' },
    { id: 'bullet', name: 'Bulleted List', icon: <Menu size={16} />, detail: 'Simple list', shortcut: '- ' },
    { id: 'numbered', name: 'Numbered List', icon: <AlignLeft size={16} />, detail: 'Ordered list', shortcut: '1. ' },
    { id: 'todo', name: 'To-do', icon: <Check size={16} />, detail: 'Track tasks with checkbox', shortcut: '[] ' },
    { id: 'quote', name: 'Quote', icon: <FileText size={16} />, detail: 'Capture a quote', shortcut: '> ' },
    { id: 'callout', name: 'Callout', icon: <BrainCircuit size={16} />, detail: 'Highlight important info', shortcut: '! ' },
    { id: 'divider', name: 'Divider', icon: <MoreHorizontal size={16} />, detail: 'Visual separator', shortcut: '---' },
    { id: 'code', name: 'Code Block', icon: <Hash size={16} />, detail: 'Syntax-highlighted code', shortcut: '```' },
    { id: 'table', name: 'Simple Table', icon: <MoreHorizontal size={16} />, detail: 'Add a data table', shortcut: '/table' },
    { id: 'link', name: 'Link', icon: <Link2 size={16} />, detail: 'Insert a hyperlink', shortcut: '/link' },
];

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(1px, 1px) !important;
  box-shadow: none !important;
}
`;

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
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [notes, isLoaded]);

    const activeNote = notes.find(n => n.id === activeId) || null;

    const createNote = (templateId?: string) => {
        const tpl = TEMPLATES.find(t => t.id === templateId);
        const now = Date.now();
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: tpl?.id === 'daily' ? `Daily Note — ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}` : "",
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
        setTimeout(() => { if (contentRef.current) contentRef.current.innerHTML = newNote.content; titleRef.current?.focus(); }, 100);
    };

    const createDailyNote = () => {
        const todayTitle = `Daily Note — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}`;
        const existing = notes.find(n => n.title === todayTitle);
        if (existing) { setActiveId(existing.id); return; }
        createNote('daily');
    };

    const exportNote = (format: 'md' | 'html' | 'txt') => {
        if (!activeNote) return;
        let content = '';
        const title = activeNote.title || 'Untitled';
        if (format === 'html') {
            content = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1>${activeNote.content}</body></html>`;
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
    };

    const copyToClipboard = (type: 'html' | 'plain') => {
        if (!activeNote) return;
        const text = type === 'html' ? activeNote.content : activeNote.content.replace(/<[^>]+>/g,'');
        navigator.clipboard.writeText(text);
    };

    const addTag = (tag: string) => {
        if (!activeNote || !tag.trim() || activeNote.tags.includes(tag)) return;
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
                y: rect.top - 50,
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
            case 'bullet': document.execCommand('insertUnorderedList'); break;
            case 'todo': 
                document.execCommand('insertHTML', false, '<div class="todo-item"><input type="checkbox" style="width:18px;height:18px;margin-right:8px" /> <span>&nbsp;</span></div>'); 
                break;
            case 'quote': document.execCommand('formatBlock', false, 'BLOCKQUOTE'); break;
            case 'callout': 
                document.execCommand('insertHTML', false, '<div class="callout-block" style="border:2px solid #000;border-left:6px solid #000;padding:12px 16px;background:#f8fafc;border-radius:12px;margin:1.5rem 0;box-shadow:2px 2px 0 #000">💡 <span>&nbsp;</span></div>'); 
                break;
            case 'h3': document.execCommand('formatBlock', false, 'H3'); break;
            case 'numbered': document.execCommand('insertOrderedList'); break;
            case 'divider': document.execCommand('insertHTML', false, '<hr style="border:none;border-top:2px dashed #000;margin:2rem 0" />'); break;
            case 'code': document.execCommand('formatBlock', false, 'PRE'); break;
            case 'table': document.execCommand('insertHTML', false, '<table class="note-table" style="width:100%;border-collapse:collapse;margin:1.5rem 0"><thead style="background:#f1f5f9"><tr><th style="border:2px solid #000;padding:8px 12px;text-align:left">Header 1</th><th style="border:2px solid #000;padding:8px 12px;text-align:left">Header 2</th></tr></thead><tbody><tr><td style="border:2px solid #000;padding:8px 12px">Cell 1</td><td style="border:2px solid #000;padding:8px 12px">Cell 2</td></tr></tbody></table>'); break;
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

    if (!isLoaded) return <div className="min-h-screen bg-[#F4ECD8] flex items-center justify-center font-sans text-black">Loading Workspace...</div>;

    return (
        <div className={`flex h-[calc(100vh-64px)] bg-[#F4ECD8] text-black overflow-hidden font-sans transition-all duration-300 ig-root ${isFullscreen ? 'fixed inset-0 z-[1000] h-screen bg-[#F4ECD8]' : ''}`}>
            <style>{GLOBAL_STYLES}</style>

            {/* SIDEBAR */}
            <div className={[
                "flex flex-col border-r-2 border-black bg-white",
                "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
                "fixed inset-y-0 left-0 z-50 w-screen",
                "sm:relative sm:inset-auto sm:z-auto sm:h-full",
                mobileView === "sidebar" ? "translate-x-0" : "-translate-x-full",
                isSidebarOpen
                    ? "sm:w-80 sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto"
                    : "sm:w-0 sm:translate-x-0 sm:opacity-0 sm:pointer-events-none",
            ].join(" ")}>
                <div className="p-4 sm:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5 font-bold text-black tracking-tight ig-display">
                        <div className="w-7 h-7 rounded-lg bg-orange-500 border-2 border-black flex items-center justify-center text-[10px] text-white shadow-[1.5px_1.5px_0_#000] font-black">N</div>
                        <span className="text-sm font-bold">Workspace Pages</span>
                    </div>
                    <button
                        onClick={() => setMobileView("editor")}
                        className="sm:hidden p-1.5 rounded-lg border-2 border-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="px-4 mb-4 shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => createNote()} className="ig-btn flex flex-col items-center gap-1 px-1 py-2 bg-white hover:bg-zinc-50 text-black text-[9px] font-black rounded-xl border-2 border-black shadow-[2px_2px_0_#000] transition-all">
                            <Plus size={14} strokeWidth={3} /> New Page
                        </button>
                        <button onClick={createDailyNote} className="ig-btn flex flex-col items-center gap-1 px-1 py-2 bg-zinc-50 hover:bg-zinc-100 text-black text-[9px] font-black rounded-xl border-2 border-black shadow-[2px_2px_0_#000] transition-all">
                            <CalendarDays size={14} /> Today
                        </button>
                        <button onClick={() => setShowTemplates(true)} className="ig-btn flex flex-col items-center gap-1 px-1 py-2 bg-zinc-50 hover:bg-zinc-100 text-black text-[9px] font-black rounded-xl border-2 border-black shadow-[2px_2px_0_#000] transition-all">
                            <FileText size={14} /> Templates
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-2 border-black rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none text-black placeholder:text-zinc-400 font-bold shadow-[1.5px_1.5px_0_#000]" />
                    </div>
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {[null, ...allTags].map(tag => (
                                <button key={tag ?? 'all'} onClick={() => setActiveTag(tag)} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border-2 border-black transition-all ${ activeTag === tag ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-50' }`}>
                                    {tag ? `#${tag}` : 'all'}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex bg-zinc-100 p-0.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                        <button onClick={() => setFavoritesOnly(false)} className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${ !favoritesOnly ? 'bg-black text-white' : 'text-zinc-650' }`}>All</button>
                        <button onClick={() => setFavoritesOnly(true)} className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${ favoritesOnly ? 'bg-black text-white' : 'text-zinc-650' }`}>Starred</button>
                    </div>
                </div>

                <div data-lenis-prevent className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-10">
                    {pinnedNotes.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><Pin size={9} /> Pinned</div>
                            {pinnedNotes.map(note => (
                                <NoteItem key={note.id} note={note} activeId={activeId}
                                    setActiveId={(id) => { setActiveId(id); setMobileView("editor"); }}
                                    deleteNote={deleteNote}
                                    updateNote={(id, updates) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))} />
                            ))}
                            <div className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">Pages</div>
                        </>
                    )}
                    {unpinnedNotes.map(note => (
                        <NoteItem key={note.id} note={note} activeId={activeId}
                            setActiveId={(id) => { setActiveId(id); setMobileView("editor"); }}
                            deleteNote={deleteNote}
                            updateNote={(id, updates) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))} />
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="px-8 py-10 text-center flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0_#000]"><Search size={16} className="text-zinc-500" /></div>
                            <p className="text-xs font-bold text-zinc-500">No notes found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#ffffff] relative h-full">
                {/* TOOLBAR */}
                <div className="h-14 flex items-center justify-between px-3 sm:px-6 z-40 border-b-2 border-black bg-white">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile: Menu button */}
                        <button
                            onClick={() => setMobileView("sidebar")}
                            className="sm:hidden p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black"
                        >
                            <Menu size={16} />
                        </button>
                        {/* Desktop: Sidebar toggle */}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden sm:flex p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black shadow-[1.5px_1.5px_0_#000]"
                        >
                            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                        </button>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="hidden sm:flex p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black shadow-[1.5px_1.5px_0_#000]"
                            title="Help & Details"
                        >
                            <HelpCircle size={15} />
                        </button>
                        <div className="hidden sm:block h-5 w-[2px] bg-black" />
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase ig-display">
                             <span className="text-zinc-500 hidden sm:inline">Workspace</span>
                             <span className="text-zinc-400 hidden sm:inline">/</span>
                             <span className="text-black truncate max-w-[130px] sm:max-w-[200px]">{activeNote?.title || 'Untitled'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 border-2 border-black text-black">
                            <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isSaving ? 'animate-pulse' : ''}`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{isSaving ? 'Syncing' : 'Saved'}</span>
                        </div>
                        {activeNote && (
                            <div className="relative group/export">
                                <button className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black shadow-[1.5px_1.5px_0_#000]"><Download size={14} /></button>
                                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_#000] py-2 z-50 hidden group-hover/export:block">
                                    <div className="px-3 py-1 text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100">Export As</div>
                                    <button onClick={() => exportNote('md')} className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all">.md Markdown</button>
                                    <button onClick={() => exportNote('html')} className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all">.html File</button>
                                    <button onClick={() => exportNote('txt')} className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all">.txt Plain Text</button>
                                    <div className="my-1 border-t border-zinc-200" />
                                    <button onClick={() => copyToClipboard('html')} className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all"><Copy size={13} /> Copy HTML</button>
                                    <button onClick={() => copyToClipboard('plain')} className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all"><Copy size={13} /> Copy Plain</button>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowShortcuts(true)} className="hidden sm:flex p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black shadow-[1.5px_1.5px_0_#000]"><Keyboard size={14} /></button>
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="hidden sm:flex p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg transition-all text-black shadow-[1.5px_1.5px_0_#000]">
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    </div>
                </div>

                {activeNote ? (
                    <div data-lenis-prevent className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                        {/* COVER IMAGE */}
                        <div className="group relative w-full h-48 md:h-64 bg-zinc-50 shrink-0 border-b-2 border-black">
                            <div className="absolute inset-0 overflow-hidden">
                                {activeNote.coverImage ? (
                                    <img src={activeNote.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#fcf9f2]" />
                                )}
                            </div>
                            
                            <div className="absolute bottom-4 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                <button 
                                    onClick={() => setShowCoverPicker(!showCoverPicker)}
                                    className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-[10px] font-black text-black rounded-lg border-2 border-black shadow-[2px_2px_0_#000] flex items-center gap-1.5 transition-all"
                                >
                                    <ImageIcon size={12} /> COVER GALLERY
                                </button>
                                {activeNote.coverImage && (
                                    <button 
                                        onClick={() => updateActiveNote({ coverImage: null })}
                                        className="p-1.5 bg-rose-100 hover:bg-rose-250 text-rose-600 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {showCoverPicker && (
                                <div className="absolute right-6 w-72 p-4 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0_#000] z-50 mt-2"
                                     style={{ top: 'calc(100% - 1.5rem)' }}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Cover</span>
                                        <button onClick={() => setShowCoverPicker(false)} className="text-zinc-500 hover:text-black"><X size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {COVERS.map((url, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => { updateActiveNote({ coverImage: url }); setShowCoverPicker(false); }}
                                                className="w-full h-16 rounded-xl overflow-hidden border-2 border-transparent hover:border-black transition-all"
                                            >
                                                <img src={url} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DOCUMENT CONTENT */}
                        <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 lg:px-20">
                            
                            {/* ICON */}
                            <div className="relative group -mt-10 sm:-mt-14 md:-mt-16 mb-6 z-20">
                                <div className="relative inline-block">
                                    <button 
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className="bg-white border-2 border-black text-black rounded-2xl w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center shadow-[3px_3px_0_#000] hover:bg-zinc-50 transition-all overflow-hidden"
                                    >
                                        <span className="text-black">
                                            <NoteIcon name={activeNote.icon} size={32} />
                                        </span>
                                    </button>
                                    
                                    {activeNote.icon && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); updateActiveNote({ icon: null }); }}
                                            className="absolute -top-2.5 -right-2.5 p-1.5 bg-rose-50 border-2 border-black hover:bg-rose-100 text-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-[1.5px_1.5px_0_#000]"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>

                                {showIconPicker && (
                                    <div className="absolute top-full left-0 mt-3 p-4 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0_#000] z-50 w-72">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page Icon</span>
                                            <button onClick={() => setShowIconPicker(false)} className="text-zinc-500 hover:text-black"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {PAGE_ICON_NAMES.map((iconName) => {
                                                const Icon = PAGE_ICONS[iconName];
                                                return (
                                                    <button
                                                        key={iconName}
                                                        onClick={() => { updateActiveNote({ icon: iconName }); setShowIconPicker(false); }}
                                                        title={iconName}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-zinc-150 border-2 ${ activeNote.icon === iconName ? 'bg-zinc-100 border-black' : 'border-transparent text-zinc-400 hover:text-black' }`}
                                                    >
                                                        <Icon size={16} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TITLE */}
                            <div className="mb-8 group">
                                <textarea
                                    ref={titleRef}
                                    value={activeNote.title}
                                    onChange={handleTitleInput}
                                    placeholder="Untitled Page"
                                    className="w-full bg-transparent text-3xl sm:text-5xl font-black text-black placeholder:text-zinc-300 resize-none focus:outline-none overflow-hidden block py-2 leading-[1.1] tracking-tight transition-all ig-display"
                                    rows={1}
                                />
                                <div className="flex items-center gap-3 sm:gap-6 mt-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest border-t-2 border-dashed border-zinc-200 pt-3 flex-wrap">
                                    <span className="flex items-center gap-1.5"><BrainCircuit size={12} /> {stats.words} Words</span>
                                    <span className="flex items-center gap-1.5"><Timer size={12} /> {stats.readTime} Min Read</span>
                                    <button 
                                        onClick={() => updateActiveNote({ isFavorite: !activeNote.isFavorite })}
                                        className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded border-2 border-black shadow-[1.5px_1.5px_0_#000] text-black ${activeNote.isFavorite ? 'bg-amber-100 font-extrabold' : 'bg-white hover:bg-zinc-50'}`}
                                    >
                                        {activeNote.isFavorite ? '★ STARRED' : '☆ STAR'}
                                    </button>
                                </div>
                            </div>

                            {/* RICH TEXT CONTENT EDITOR */}
                            <div 
                                className="styled-editor w-full text-zinc-800 text-lg leading-relaxed focus:outline-none min-h-[60vh] pb-64"
                                contentEditable
                                onInput={handleContentInput}
                                onBlur={() => setTimeout(() => setSlashMenu(null), 200)}
                                suppressContentEditableWarning
                                ref={contentRef}
                                data-placeholder="Type '/' for templates, lists, blocks..."
                            />

                            {/* BUBBLE FORMAT MENU */}
                            {bubbleMenu && (
                                <div 
                                    className="fixed z-[110] bg-white border-2 border-black rounded-xl shadow-[3px_3px_0_#000] flex items-center p-1"
                                    style={{ left: bubbleMenu.x, top: bubbleMenu.y, transform: 'translateX(-50%)' }}
                                >
                                    <button onClick={() => applyStyle('bold')} className="p-1.5 hover:bg-zinc-50 text-black rounded-lg transition-colors font-black">B</button>
                                    <button onClick={() => applyStyle('italic')} className="p-1.5 hover:bg-zinc-50 text-black rounded-lg transition-colors italic">I</button>
                                    <button onClick={() => applyStyle('strikeThrough')} className="p-1.5 hover:bg-zinc-50 text-black rounded-lg transition-colors line-through">S</button>
                                    <div className="w-[2px] h-4 bg-black mx-1.5" />
                                    <button onClick={() => applyStyle('createLink', prompt('URL:') || undefined)} className="p-1.5 hover:bg-zinc-50 text-black rounded-lg transition-colors text-[9px] font-black uppercase tracking-wider">LINK</button>
                                </div>
                            )}

                        </div>

                        {/* Styles */}
                        <style jsx global>{`
                            .styled-editor:empty:before { content: attr(data-placeholder); color: #cbd5e1; pointer-events: none; }
                            .styled-editor h1 { font-size: 2.2em; font-weight: 900; color: black; margin: 1.2em 0 0.4em; font-family: 'Space Grotesk', sans-serif; }
                            .styled-editor h2 { font-size: 1.6em; font-weight: 800; color: black; margin: 1.2em 0 0.4em; font-family: 'Space Grotesk', sans-serif; }
                            .styled-editor h3 { font-size: 1.3em; font-weight: 700; color: #27272a; margin: 1.2em 0 0.4em; }
                            .styled-editor p { margin-bottom: 1em; font-weight: 500; line-height: 1.65; color: #18181b; }
                            .styled-editor a { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; font-weight: 700; }
                            .styled-editor ul { list-style-type: none; margin-bottom: 1.5em; }
                            .styled-editor ul li { position: relative; padding-left: 1.8em; margin-bottom: 0.6em; font-weight: 500; }
                            .styled-editor ul li:before { content: "•"; color: #000; position: absolute; left: 0.4em; font-weight: 900; font-size: 1.2em; }
                            .styled-editor ol { margin-left: 1.8em; margin-bottom: 1.5em; list-style-type: decimal; }
                            .styled-editor ol li { margin-bottom: 0.6em; padding-left: 0.3em; font-weight: 500; }
                            .styled-editor blockquote { border-left: 5px solid #000000; padding: 1rem 1.5rem; font-style: italic; color: #3f3f46; margin: 2rem 0; font-size: 1.1em; background: #f8fafc; border: 2px solid #000000; border-radius: 12px; box-shadow: 2px 2px 0 #000; }
                            .styled-editor pre { background: #f8fafc; padding: 1.5rem; border-radius: 16px; margin: 2rem 0; border: 2px solid #000000; font-family: monospace; font-size: 0.9em; overflow-x: auto; color: #000; box-shadow: 2px 2px 0 #000; }
                            .styled-editor code { font-family: monospace; background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 6px; color: #b91c1c; font-size: 0.85em; border: 1px solid #cbd5e1; }
                            .todo-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 4px 0; font-weight: 500; }
                            .todo-item input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; accent-color: #000; flex-shrink: 0; }
                            .divider-line { border: none; border-top: 2px dashed #000000; margin: 2rem 0; }
                            .note-table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
                            .note-table th { background: #f1f5f9; color: black; font-weight: 800; padding: 10px 14px; border: 2px solid #000000; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; font-size: 0.85em; }
                            .note-table td { padding: 8px 14px; border: 2px solid #000000; color: #3f3f46; background: #ffffff; font-weight: 500; }
                            .note-table tr:hover td { background: #f8fafc; }
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
                        `}</style>
                    </div>
                ) : (
                    <HomeDashboard 
                        notes={notes} 
                        setActiveId={setActiveId} 
                        setShowTemplates={setShowTemplates} 
                        createNote={createNote} 
                        showHelp={showHelp}
                        setShowHelp={setShowHelp}
                    />
                )}
            </div>

            {showTemplates && <TemplatesModal onSelect={(id) => createNote(id)} onClose={() => setShowTemplates(false)} />}
            {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

        </div>
    );
}

type NoteItemProps = { note: Note; activeId: string | null; setActiveId: (id: string) => void; deleteNote: (id: string, e: React.MouseEvent) => void; updateNote: (id: string, updates: Partial<Note>) => void; };
function NoteItem({ note, activeId, setActiveId, deleteNote, updateNote }: NoteItemProps) {
    const active = activeId === note.id;
    return (
        <div onClick={() => setActiveId(note.id)} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer border-2 transition-all duration-150 ${ active ? 'bg-[#000000] border-black text-[#ffffff] shadow-none' : 'bg-white border-transparent text-[#000000] hover:bg-zinc-50' }`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <span className={`shrink-0 p-1.5 rounded-lg border transition-all ${ active ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-600' }`}>
                    <NoteIcon name={note.icon} size={15} />
                </span>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold truncate">{note.title || "Untitled"}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {note.isFavorite && <div className={`w-1 h-1 rounded-full ${active ? 'bg-white' : 'bg-black'}`} />}
                        {note.isPinned && <div className={`w-1.5 h-1.5 ${active ? 'bg-white' : 'bg-black'} rotate-45`} />}
                        <span className={`text-[9px] font-bold ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{new Date(note.updatedAt).toLocaleDateString([],{month:'short',day:'numeric'})}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isPinned: !note.isPinned }); }} className={`p-1 rounded-md border ${active ? 'hover:bg-white/10 text-zinc-300 hover:text-white border-transparent' : 'hover:bg-zinc-150 text-zinc-500 hover:text-black border-transparent'}`}><Pin size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isFavorite: !note.isFavorite }); }} className={`p-1 rounded-md border ${active ? 'hover:bg-white/10 text-zinc-300 hover:text-white border-transparent' : 'hover:bg-zinc-150 text-zinc-500 hover:text-black border-transparent'}`}><Star size={11} /></button>
                <button onClick={(e) => deleteNote(note.id, e)} className={`p-1 rounded-md border ${active ? 'hover:bg-rose-500/20 text-zinc-300 hover:text-rose-200 border-transparent' : 'hover:bg-rose-50 text-zinc-500 hover:text-rose-600 border-transparent'}`}><Trash2 size={11} /></button>
            </div>
        </div>
    );
}

function TemplatesModal({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void; }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#141414]/50 backdrop-blur-sm" />
            <div className="relative bg-white border-2 border-black rounded-[2.5rem] shadow-[8px_8px_0_#000] p-6 sm:p-8 w-full max-w-lg z-10 text-black" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black ig-display">Workspace Templates</h2>
                        <p className="text-xs text-zinc-500 mt-1 font-bold uppercase tracking-wider">Start with a structured outline</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TEMPLATES.map(tpl => (
                        <button key={tpl.id} onClick={() => onSelect(tpl.id)} className="ig-btn flex items-start gap-3 p-4 bg-white hover:bg-zinc-50 border-2 border-black rounded-2xl text-left transition-all shadow-[3px_3px_0_#000] group">
                            <span className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-black group-hover:bg-zinc-100 transition-all mt-0.5">
                                <NoteIcon name={tpl.iconName} size={18} />
                            </span>
                            <div>
                                <div className="text-xs font-black text-black">{tpl.name}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5 font-bold uppercase">Insert outline</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ShortcutsModal({ onClose }: { onClose: () => void; }) {
    const shortcuts = [
        { key: '/', desc: 'Open block menu' },
        { key: '# + Space', desc: 'Heading 1' },
        { key: '## + Space', desc: 'Heading 2' },
        { key: '- + Space', desc: 'Bullet list' },
        { key: '! + Space', desc: 'Callout block' },
        { key: 'Ctrl+B', desc: 'Bold text' },
        { key: 'Ctrl+I', desc: 'Italic text' },
        { key: 'Ctrl+Z', desc: 'Undo' },
        { key: 'Ctrl+Y', desc: 'Redo' },
    ];
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#141414]/50 backdrop-blur-sm" />
            <div className="relative bg-white border-2 border-black rounded-[2.5rem] shadow-[8px_8px_0_#000] p-6 sm:p-8 w-full max-w-md z-10 text-black" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black ig-display">Shortcuts</h2>
                    <button onClick={onClose} className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]"><X size={14} /></button>
                </div>
                <div className="space-y-1.5">
                    {shortcuts.map(s => (
                        <div key={s.key} className="flex items-center justify-between py-2 border-b-2 border-dashed border-zinc-100">
                            <span className="text-xs text-zinc-600 font-bold">{s.desc}</span>
                            <kbd className="px-2.5 py-1 bg-zinc-50 border-2 border-black rounded-lg text-[10px] font-black text-black font-mono shadow-[1.5px_1.5px_0_#000]">{s.key}</kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function HomeDashboard({ 
    notes, 
    setActiveId, 
    setShowTemplates, 
    createNote, 
    showHelp,
    setShowHelp
}: { 
    notes: Note[]; 
    setActiveId: (id: string) => void; 
    setShowTemplates: (v: boolean) => void; 
    createNote: (tpl?: string) => void; 
    showHelp: boolean;
    setShowHelp: (v: boolean) => void;
}) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const recents = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
    
    return (
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 sm:px-8 py-10 sm:py-16 custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-none mb-2 ig-display">{greeting}!</h1>
                    <p className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-widest">Workspace Dashboard</p>
                </div>
                
                {recents.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400 font-bold mb-4 px-2 tracking-widest text-[10px] uppercase">
                            <Clock size={14} className="text-black" /> <span className="text-black">Recently Edited</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recents.map(note => (
                                <div key={note.id} onClick={() => setActiveId(note.id)} className="ig-btn bg-white hover:bg-zinc-50 border-2 border-black rounded-[2rem] p-4 cursor-pointer transition-all shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]">
                                    <div className="h-24 rounded-2xl bg-zinc-50 border-2 border-black overflow-hidden mb-3.5 relative flex items-center justify-center">
                                        {note.coverImage ? (
                                            <img src={note.coverImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <NoteIcon name={note.icon} size={28} className="text-zinc-400" />
                                        )}
                                    </div>
                                    <h3 className="font-black text-xs text-black truncate">{note.title || "Untitled Page"}</h3>
                                    <p className="text-[9px] text-zinc-500 mt-1 font-bold uppercase">{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold mb-4 px-2 tracking-widest text-[10px] uppercase">
                        <Sparkles size={14} className="text-black" /> <span className="text-black">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div onClick={() => createNote()} className="ig-btn bg-white hover:bg-zinc-50 border-2 border-black rounded-[2rem] p-6 cursor-pointer transition-all shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]">
                             <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl border-2 border-black flex items-center justify-center mb-4"><Plus size={20} /></div>
                             <h3 className="text-base font-bold text-black mb-1.5 ig-display">Blank Workspace</h3>
                             <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Start fresh with a clean slate for capturing ideas.</p>
                         </div>
                         <div onClick={() => createNote('daily')} className="ig-btn bg-white hover:bg-zinc-50 border-2 border-black rounded-[2rem] p-6 cursor-pointer transition-all shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]">
                             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl border-2 border-black flex items-center justify-center mb-4"><CalendarDays size={18} /></div>
                             <h3 className="text-base font-bold text-black mb-1.5 ig-display">Today's Note</h3>
                             <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Jump into template lists for daily task logging.</p>
                         </div>
                         <div onClick={() => setShowTemplates(true)} className="ig-btn bg-white hover:bg-zinc-50 border-2 border-black rounded-[2rem] p-6 cursor-pointer transition-all shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]">
                             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl border-2 border-black flex items-center justify-center mb-4"><Layers size={18} /></div>
                             <h3 className="text-base font-bold text-black mb-1.5 ig-display">Use Template</h3>
                             <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Choose structures pre-designed for articles and plans.</p>
                         </div>
                    </div>
                </div>

                <HelpModal 
                    isOpen={showHelp} 
                    onClose={() => setShowHelp(false)} 
                    title="Smart Notes Technical Specs"
                >
                    <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-black ig-display">
                                Zero-Server Notes Environment
                            </h3>
                            <p className="text-sm text-zinc-650 leading-relaxed font-medium">
                                Smart Notes is a professional, browser-side markdown and rich text workspace. All pages, tags, covers, and icons are saved locally in your browser storage container—meaning zero data ever goes to external servers for 100% security.
                            </p>
                        </section>
                        
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-black ig-display">Key Capabilities</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                                    <h4 className="text-sm font-bold text-black mb-1 ig-display">Slash Commands</h4>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Type "/" to insert headers, tables, callouts, lists, code containers, and checklists.</p>
                                </div>
                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                                    <h4 className="text-sm font-bold text-black mb-1 ig-display">Multiple Formats</h4>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">Export your documents to clean markdown (.md), web-ready HTML, or standard plain text (.txt).</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                            <div className="space-y-2">
                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl">
                                    <h4 className="text-xs font-bold text-black mb-1">Is it offline capable?</h4>
                                    <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">Yes. Because all scripts and data run client-side, the workspace remains fully interactive and functional even without an internet connection.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </HelpModal>
            </div>
        </div>
    );
}
