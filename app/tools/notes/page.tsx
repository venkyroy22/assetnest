"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, FileText, ImageIcon, Smile, Menu, X, MoreHorizontal, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Type, BrainCircuit, Search, Check, Timer, Tag, Download, Keyboard, Sun, CalendarDays, Copy, Hash, Pin, Star, Link2, AlignLeft, Rocket, Lightbulb, BookOpen, Code2, Layers, Users, Clipboard, BarChart2, Globe, Mail, Settings, Zap, Target, Briefcase, FlaskConical, Music, Dumbbell, ShoppingCart, Camera, Heart, MessageSquare, Cpu, Cloud, Shield, Database, Pencil, NotebookText, FolderOpen, ListTodo, Clock, Sparkles } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
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
    work: 'bg-white/20 text-white border-white/30',
    personal: 'bg-white/20 text-white border-white/30',
    ideas: 'bg-white/20 text-white border-white/30',
    todo: 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]',
    research: 'bg-white/20 text-white border-white/30',
    journal: 'bg-white/20 text-white border-white/30',
};

const TEMPLATES = [
    { id: 'blank', name: 'Blank', iconName: 'FileText', content: '' },
    { id: 'daily', name: 'Daily Note', iconName: 'CalendarDays', content: `<h2>🎯 Top 3 Priorities</h2><div class="todo-item"><input type="checkbox" /> <span>Priority 1</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 2</span></div><div class="todo-item"><input type="checkbox" /> <span>Priority 3</span></div><h2>📝 Notes</h2><p></p><h2>💡 Ideas</h2><p></p>` },
    { id: 'meeting', name: 'Meeting Notes', iconName: 'Users', content: `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Attendees:</strong> </p><p><strong>Goal:</strong> </p><h2>📋 Agenda</h2><div class="todo-item"><input type="checkbox" /> <span>Item 1</span></div><h2>💬 Discussion</h2><p></p><h2>✅ Action Items</h2><div class="todo-item"><input type="checkbox" /> <span>Action 1 — Owner</span></div>` },
    { id: 'brainstorm', name: 'Brainstorm', iconName: 'Lightbulb', content: `<p><em>Date: ${new Date().toLocaleDateString()}</em></p><div class="callout-block">What problem are we solving?</div><h2>🌊 Stream of Consciousness</h2><p>Write anything that comes to mind...</p><h2>🏆 Best Ideas</h2><ul><li>Idea 1</li><li>Idea 2</li></ul><h2>⚡ Next Steps</h2><p></p>` },
    { id: 'project', name: 'Project Plan', iconName: 'Layers', content: `<p><strong>Goal:</strong> </p><p><strong>Deadline:</strong> </p><h2>📌 Overview</h2><p></p><h2>✅ Milestones</h2><div class="todo-item"><input type="checkbox" /> <span>Milestone 1</span></div><div class="todo-item"><input type="checkbox" /> <span>Milestone 2</span></div><h2>🚧 Blockers</h2><p></p><h2>📎 Resources</h2><p></p>` },
    { id: 'article', name: 'Article Draft', iconName: 'Pencil', content: `<p><em>By [Author] · ${new Date().toLocaleDateString()}</em></p><div class="callout-block">TL;DR: One sentence summary of the article.</div><h2>Introduction</h2><p>Hook the reader here...</p><h2>Main Point 1</h2><p></p><h2>Conclusion</h2><p></p>` },
];

// Professional icon registry — maps string names to Lucide components
const PAGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    FileText, NotebookText, Pencil, BookOpen, Code2, Lightbulb, Rocket, Target,
    CalendarDays, Clock, ListTodo, BrainCircuit, Layers, Users, Clipboard, BarChart2,
    Globe, Mail, Settings, Zap, Briefcase, FlaskConical, Music, Dumbbell,
    ShoppingCart, Camera, Heart, MessageSquare, Cpu, Cloud, Shield, Database, FolderOpen,
};
const PAGE_ICON_NAMES = Object.keys(PAGE_ICONS);

// Renders a note’s stored icon name as a Lucide component
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

export default function SmartNotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [mobileView, setMobileView] = useState<"sidebar" | "editor">("sidebar"); // mobile nav
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const [showCoverPicker, setShowCoverPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showProperties, setShowProperties] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [newTag, setNewTag] = useState("");

    // Command Menu & Selection State
    const [slashMenu, setSlashMenu] = useState<{ x: number, y: number } | null>(null);
    const [bubbleMenu, setBubbleMenu] = useState<{ x: number, y: number, text: string } | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLTextAreaElement>(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("assetnest_notes");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotes(parsed);
                if (parsed.length > 0) setActiveId(parsed[0].id);
            } catch (e) { console.error(e); }
        } else {
            setNotes([]);
            setActiveId(null);
        }
        setIsLoaded(true);
    }, []);

    // Save with visual indicator
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
        setMobileView("editor"); // go to editor on mobile after creating
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
        
        // Handle markdown shortcuts on content change
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const node = selection.focusNode;
        if (node?.nodeType === 3) { // Text node
            const text = node.textContent || "";
            const cursorPath = text.slice(0, selection.focusOffset);
            
            // Trigger slash menu
            if (cursorPath.endsWith("/")) {
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                setSlashMenu({ x: rect.left, y: rect.top + 20 });
            } else if (!text.includes("/")) {
                setSlashMenu(null);
            }

            // Quick Markdown transformation
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
        
        // Remove the slash
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
                document.execCommand('insertHTML', false, '<div class="todo-item"><input type="checkbox" /> <span>&nbsp;</span></div>'); 
                break;
            case 'quote': document.execCommand('formatBlock', false, 'BLOCKQUOTE'); break;
            case 'callout': 
                document.execCommand('insertHTML', false, '<div class="callout-block">💡 <span>&nbsp;</span></div>'); 
                break;
            case 'h3': document.execCommand('formatBlock', false, 'H3'); break;
            case 'numbered': document.execCommand('insertOrderedList'); break;
            case 'divider': document.execCommand('insertHTML', false, '<hr class="divider-line" />'); break;
            case 'code': document.execCommand('formatBlock', false, 'PRE'); break;
            case 'table': document.execCommand('insertHTML', false, '<table class="note-table"><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody></table>'); break;
            case 'link': { const url = prompt('Enter URL:'); if (url) document.execCommand('createLink', false, url); break; }
        }
        setSlashMenu(null);
    };

    const applyStyle = (cmd: string, val: string | undefined = undefined) => {
        document.execCommand(cmd, false, val);
        handleSelectionChange(); // Refresh menu
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

    if (!isLoaded) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-sans text-zinc-400">Loading Workspace...</div>;

    return (
        <div className={`flex h-[calc(100vh-64px)] bg-[#09090b] text-zinc-200 overflow-hidden font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[1000] h-screen bg-[#09090b]' : ''}`}>
            
            {/* SIDEBAR — full-screen drawer on mobile, collapsible panel on desktop */}
            <div className={[
                "flex flex-col border-r border-[#1d1d20] bg-[#0c0c0e]/95 backdrop-blur-3xl",
                "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
                // Mobile: fixed full-screen overlay
                "fixed inset-y-0 left-0 z-50 w-screen",
                // Desktop: part of the flex row
                "sm:relative sm:inset-auto sm:z-auto sm:h-full",
                // Mobile slide: open = visible, closed = slid off left
                mobileView === "sidebar" ? "translate-x-0" : "-translate-x-full",
                // Desktop collapse — STATIC strings so Tailwind JIT includes them
                isSidebarOpen
                    ? "sm:w-80 sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto"
                    : "sm:w-0 sm:translate-x-0 sm:opacity-0 sm:pointer-events-none",
            ].join(" ")}>
                <div className="p-4 sm:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5 font-bold text-white tracking-tight">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-zinc-400 to-zinc-700 flex items-center justify-center text-[10px] text-black">AN</div>
                        <span className="text-sm">Workspace</span>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileView("editor")}
                        className="sm:hidden p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 mb-4 shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => createNote()} className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white hover:bg-zinc-100 text-black text-[10px] font-black rounded-2xl transition-all active:scale-95">
                            <Plus size={16} strokeWidth={3} /> New
                        </button>
                        <button onClick={createDailyNote} className="flex flex-col items-center gap-1.5 px-2 py-3 bg-[#161618] hover:bg-[#1d1d20] text-zinc-400 hover:text-white text-[10px] font-black rounded-2xl transition-all border border-white/5">
                            <CalendarDays size={16} /> Daily
                        </button>
                        <button onClick={() => setShowTemplates(true)} className="flex flex-col items-center gap-1.5 px-2 py-3 bg-[#161618] hover:bg-[#1d1d20] text-zinc-400 hover:text-white text-[10px] font-black rounded-2xl transition-all border border-white/5">
                            <FileText size={16} /> Templates
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#161618] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-white/10 text-zinc-300 placeholder:text-zinc-700 font-medium" />
                    </div>
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {[null, ...allTags].map(tag => (
                                <button key={tag ?? 'all'} onClick={() => setActiveTag(tag)} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${ activeTag === tag ? (tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : 'bg-white/10 text-white border-white/20') : 'text-zinc-600 border-white/5 hover:text-zinc-400' }`}>
                                    {tag ? `#${tag}` : 'all'}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex bg-[#161618] p-0.5 rounded-xl">
                        <button onClick={() => setFavoritesOnly(false)} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${ !favoritesOnly ? 'bg-white/10 text-white' : 'text-zinc-600' }`}>All</button>
                        <button onClick={() => setFavoritesOnly(true)} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${ favoritesOnly ? 'bg-white/10 text-white' : 'text-zinc-600' }`}>Starred</button>
                    </div>
                </div>

                <div data-lenis-prevent className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar pb-10">
                    {pinnedNotes.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em] flex items-center gap-1.5"><Pin size={9} /> Pinned</div>
                            {pinnedNotes.map(note => (
                                <NoteItem key={note.id} note={note} activeId={activeId}
                                    setActiveId={(id) => { setActiveId(id); setMobileView("editor"); }}
                                    deleteNote={deleteNote}
                                    updateNote={(id, updates) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))} />
                            ))}
                            <div className="px-4 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.25em] mt-2">Pages</div>
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
                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center"><Search size={18} className="text-zinc-700" /></div>
                            <p className="text-xs font-medium text-zinc-600">No pages found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative h-full">
                {/* TOOLBAR */}
                <div className="h-14 flex items-center justify-between px-3 sm:px-6 z-40 border-b border-white/[0.02]">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile: back to sidebar button */}
                        <button
                            onClick={() => setMobileView("sidebar")}
                            className="sm:hidden p-2 hover:bg-white/[0.05] rounded-lg transition-all text-zinc-400"
                        >
                            <Menu size={18} />
                        </button>
                        {/* Desktop: sidebar toggle */}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`hidden sm:flex p-2 hover:bg-white/[0.05] rounded-lg transition-all ${isSidebarOpen ? 'text-zinc-500' : 'text-white bg-white/5'}`}
                        >
                            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="hidden sm:flex p-2 hover:bg-white/[0.05] rounded-lg transition-all text-zinc-500"
                            title="Help & Details"
                        >
                            <Info size={18} />
                        </button>
                        <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                             <span className="text-zinc-600 hidden sm:inline">Workspace</span>
                             <span className="text-zinc-800 hidden sm:inline">/</span>
                             <span className="text-white truncate max-w-[130px] sm:max-w-[200px]">{activeNote?.title || 'Untitled'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-500 bg-white/5 text-white/40 border border-white/5`}>
                            <div className={`w-1 h-1 rounded-full bg-current ${isSaving ? 'animate-pulse' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{isSaving ? 'Syncing' : 'Saved'}</span>
                        </div>
                        {activeNote && (
                            <div className="relative group/export">
                                <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Download size={15} /></button>
                                <div className="absolute right-0 top-full mt-1 w-44 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 hidden group-hover/export:block">
                                    <div className="px-3 py-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Export As</div>
                                    <button onClick={() => exportNote('md')} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all">.md Markdown</button>
                                    <button onClick={() => exportNote('html')} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all">.html File</button>
                                    <button onClick={() => exportNote('txt')} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all">.txt Plain Text</button>
                                    <div className="my-1 border-t border-white/5" />
                                    <button onClick={() => copyToClipboard('html')} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"><Copy size={13} /> Copy HTML</button>
                                    <button onClick={() => copyToClipboard('plain')} className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"><Copy size={13} /> Copy Plain</button>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowShortcuts(true)} className="hidden sm:flex p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Keyboard size={15} /></button>
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="hidden sm:flex p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                </div>

                {activeNote ? (
                    <div data-lenis-prevent className="flex-1 overflow-y-auto custom-scrollbar relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-transparent to-transparent">
                        {/* COVER IMAGE */}
                        <div className="group relative w-full h-56 md:h-72 bg-zinc-900/50 shrink-0">
                            <div className="absolute inset-0 overflow-hidden">
                                {activeNote.coverImage ? (
                                    <img src={activeNote.coverImage} alt="Cover" className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" />
                                ) : (
                                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none opacity-80" />
                                )}
                            </div>
                            
                            <div className="absolute bottom-6 right-8 z-20 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex gap-2">
                                <button 
                                    onClick={() => setShowCoverPicker(!showCoverPicker)}
                                    className="px-4 py-2 bg-black/60 hover:bg-black/90 backdrop-blur-xl text-[11px] font-black text-white rounded-xl flex items-center gap-2 border border-white/5 transition-all shadow-2xl"
                                >
                                    <ImageIcon size={14} /> RE-STYLE COVER
                                </button>
                                {activeNote.coverImage && (
                                    <button 
                                        onClick={() => updateActiveNote({ coverImage: null })}
                                        className="p-2 bg-black/60 hover:bg-red-500/80 backdrop-blur-xl text-white rounded-xl border border-white/5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {showCoverPicker && (
                                <div className="absolute top-calc-100 right-8 w-72 p-4 bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-4 duration-300 mt-2"
                                     style={{ top: 'calc(100% - 1.5rem)' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Atmospheres</span>
                                        <button onClick={() => setShowCoverPicker(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {COVERS.map((url, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => { updateActiveNote({ coverImage: url }); setShowCoverPicker(false); }}
                                                className="w-full h-20 rounded-xl overflow-hidden hover:ring-2 hover:ring-white transition-all scale-100 hover:scale-[1.02] shadow-lg"
                                            >
                                                <img src={url} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DOCUMENT CONTENT */}
                        <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16 lg:px-24">
                            
                            {/* ICON */}
                            <div className="relative group -mt-12 sm:-mt-16 md:-mt-20 mb-8 sm:mb-10 z-20">
                                <div className="relative inline-block">
                                    <button 
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className="bg-[#0f0f11] border-[3px] border-[#09090b] text-white rounded-3xl w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:bg-[#161618] hover:border-white/10 transition-all overflow-hidden group/btn"
                                    >
                                        <span className="transition-transform duration-300 group-hover/btn:scale-110 text-zinc-300">
                                            <NoteIcon name={activeNote.icon} size={38} />
                                        </span>
                                    </button>
                                    
                                    {activeNote.icon && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); updateActiveNote({ icon: null }); }}
                                            className="absolute -top-3 -right-3 p-2 bg-zinc-900 border border-white/5 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {showIconPicker && (
                                    <div className="absolute top-full left-0 mt-4 p-5 bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page Icon</span>
                                            <button onClick={() => setShowIconPicker(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {PAGE_ICON_NAMES.map((iconName) => {
                                                const Icon = PAGE_ICONS[iconName];
                                                return (
                                                    <button
                                                        key={iconName}
                                                        onClick={() => { updateActiveNote({ icon: iconName }); setShowIconPicker(false); }}
                                                        title={iconName}
                                                        className={`w-10 h-10 flex items-center justify-center hover:bg-white/8 rounded-xl transition-all hover:scale-110 active:scale-90 ${ activeNote.icon === iconName ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-zinc-500 hover:text-white' }`}
                                                    >
                                                        <Icon size={18} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TITLE */}
                            <div className="mb-12 group">
                                <textarea
                                    ref={titleRef}
                                    value={activeNote.title}
                                    onChange={handleTitleInput}
                                    placeholder="Page Title"
                                    className="w-full bg-transparent text-3xl sm:text-5xl md:text-6xl font-black text-white placeholder:text-zinc-800 resize-none focus:outline-none overflow-hidden block py-3 leading-[1.1] tracking-tight transition-all"
                                    rows={1}
                                />
                                <div className="flex items-center gap-3 sm:gap-6 mt-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-t border-white/[0.03] pt-4 flex-wrap">
                                    <span className="flex items-center gap-1.5"><BrainCircuit size={12} /> {stats.words} Words</span>
                                    <span className="flex items-center gap-1.5"><Timer size={12} /> {stats.readTime} Min Read</span>
                                    <button 
                                        onClick={() => updateActiveNote({ isFavorite: !activeNote.isFavorite })}
                                        className={`ml-auto flex items-center gap-1.5 transition-all ${activeNote.isFavorite ? 'text-white' : 'hover:text-zinc-400'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${activeNote.isFavorite ? 'bg-white shadow-[0_0_10px_rgba(255, 255, 255,0.8)]' : 'bg-transparent border border-zinc-700'}`} />
                                        {activeNote.isFavorite ? 'FAVORITE' : 'MARK FAVORITE'}
                                    </button>
                                </div>
                            </div>

                            {/* RICH TEXT CONTENT EDITOR */}
                            <div 
                                className="styled-editor w-full text-[#c7c7cf] text-lg md:text-xl leading-relaxed focus:outline-none min-h-[60vh] pb-64"
                                contentEditable
                                onInput={handleContentInput}
                                onBlur={() => setTimeout(() => setSlashMenu(null), 200)}
                                suppressContentEditableWarning
                                ref={contentRef}
                                data-placeholder="Type '/' for powerful commands..."
                            />

                            {/* BUBBLE MENU */}
                            {bubbleMenu && (
                                <div 
                                    className="fixed z-[110] bg-[#111113] border border-white/10 rounded-xl shadow-2xl flex items-center p-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    style={{ left: bubbleMenu.x, top: bubbleMenu.y, transform: 'translateX(-50%)' }}
                                >
                                    <button onClick={() => applyStyle('bold')} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors"><Type size={14} className="font-bold" /></button>
                                    <button onClick={() => applyStyle('italic')} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors italic">I</button>
                                    <button onClick={() => applyStyle('strikeThrough')} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors line-through">S</button>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                    <button onClick={() => applyStyle('createLink', prompt('URL:') || undefined)} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold">LINK</button>
                                </div>
                            )}

                        </div>

                        {/* Styles */}
                        <style jsx global>{`
                            .styled-editor:empty:before { content: attr(data-placeholder); color: #27272a; pointer-events: none; }
                            .styled-editor h1 { font-size: 2.5em; font-weight: 900; color: white; margin: 1.5em 0 0.5em; letter-spacing: -0.03em; line-height: 1.1; }
                            .styled-editor h2 { font-size: 1.8em; font-weight: 800; color: white; margin: 1.4em 0 0.5em; letter-spacing: -0.02em; }
                            .styled-editor h3 { font-size: 1.35em; font-weight: 700; color: #e4e4e7; margin: 1.2em 0 0.4em; }
                            .styled-editor p { margin-bottom: 1.2em; font-weight: 400; line-height: 1.75; }
                            .styled-editor a { color: #ffffff; text-decoration: underline; text-underline-offset: 3px; }
                            .styled-editor ul { list-style-type: none; margin-bottom: 1.5em; }
                            .styled-editor ul li { position: relative; padding-left: 1.8em; margin-bottom: 0.6em; }
                            .styled-editor ul li:before { content: "•"; color: #ffffff; position: absolute; left: 0.2em; font-weight: 900; font-size: 1.2em; }
                            .styled-editor ol { margin-left: 1.8em; margin-bottom: 1.5em; }
                            .styled-editor ol li { margin-bottom: 0.6em; padding-left: 0.3em; }
                            .styled-editor blockquote { border-left: 3px solid #ffffff; padding: 1rem 1.5rem; font-style: italic; color: #a1a1aa; margin: 2.5rem 0; font-size: 1.15em; background: rgba(255, 255, 255,0.03); border-radius: 0.75rem; }
                            .styled-editor pre { background: #0c0c0e; padding: 1.8rem; border-radius: 1.25rem; margin: 2.5rem 0; border: 1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 0.9em; overflow-x: auto; }
                            .styled-editor code { font-family: monospace; background: #161618; padding: 0.2em 0.5em; border-radius: 6px; color: #ffffff; font-size: 0.85em; border: 1px solid rgba(255, 255, 255,0.1); }
                            .todo-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 4px 0; }
                            .todo-item input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; accent-color: #ffffff; flex-shrink: 0; }
                            .callout-block { background: rgba(255, 255, 255,0.04); border: 1px solid rgba(255, 255, 255,0.1); border-left: 4px solid #ffffff; padding: 1.25rem 1.5rem; border-radius: 1rem; margin: 2rem 0; display: flex; align-items: flex-start; gap: 1rem; font-size: 1em; color: #e4e4e7; }
                            .callout-block:before { content: ""; width: 22px; height: 22px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5'/%3E%3Cpath d='M9 18h6'/%3E%3Cpath d='M10 22h4'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; flex-shrink: 0; margin-top: 2px; }
                            .divider-line { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 3.5rem 0; }
                            .note-table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
                            .note-table th { background: rgba(255,255,255,0.05); color: white; font-weight: 800; font-size: 0.85em; text-transform: uppercase; padding: 12px 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
                            .note-table td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #c7c7cf; }
                            .note-table tr:hover td { background: rgba(255,255,255,0.02); }
                            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
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
    return (
        <div onClick={() => setActiveId(note.id)} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${ activeId === note.id ? 'bg-white/5 text-white ring-1 ring-white/8' : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300' }`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <span className={`shrink-0 transition-all duration-300 p-2 rounded-xl ${ activeId === note.id ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-zinc-500 group-hover:text-zinc-300' }`}>
                    <NoteIcon name={note.icon} size={16} /></span>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate">{note.title || "Untitled"}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {note.isFavorite && <div className="w-1 h-1 rounded-full bg-white" />}
                        {note.isPinned && <div className="w-1 h-1 rounded-full bg-white" />}
                        <span className="text-[9px] font-bold text-zinc-700">{new Date(note.updatedAt).toLocaleDateString([],{month:'short',day:'numeric'})}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isPinned: !note.isPinned }); }} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-700 hover:text-white transition-all"><Pin size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); updateNote(note.id, { isFavorite: !note.isFavorite }); }} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-700 hover:text-white transition-all"><Star size={11} /></button>
                <button onClick={(e) => deleteNote(note.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
            </div>
        </div>
    );
}

function TemplatesModal({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void; }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative bg-[#111113] border border-white/10 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-8 w-full max-w-lg z-10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-white">Templates</h2>
                        <p className="text-sm text-zinc-500 mt-1">Start with a pre-built page structure</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map(tpl => (
                        <button key={tpl.id} onClick={() => onSelect(tpl.id)} className="flex items-start gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl text-left transition-all group">
                            <span className="p-2 rounded-xl bg-white/5 text-zinc-300 group-hover:text-white group-hover:bg-white/10 transition-all mt-0.5">
                                <NoteIcon name={tpl.iconName} size={20} />
                            </span>
                            <div>
                                <div className="text-sm font-black text-white">{tpl.name}</div>
                                <div className="text-[11px] text-zinc-600 mt-0.5">Pre-filled structure</div>
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
        { key: 'Select + Bubble menu', desc: 'Format selected text' },
    ];
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative bg-[#111113] border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md z-10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white">Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                    {shortcuts.map(s => (
                        <div key={s.key} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                            <span className="text-sm text-zinc-400">{s.desc}</span>
                            <kbd className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-black text-zinc-300 font-mono">{s.key}</kbd>
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
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const recents = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
    
    return (
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 sm:px-8 py-10 sm:py-16 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-transparent to-transparent">
            <div className="max-w-5xl mx-auto space-y-10 sm:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-3 mt-4 sm:mt-10">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">{greeting}</h1>
                </div>
                
                {recents.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400 font-medium mb-4 px-2">
                            <Clock size={16} /> <span className="text-sm">Recently visited</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recents.map(note => (
                                <div key={note.id} onClick={() => setActiveId(note.id)} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-3xl p-4 cursor-pointer transition-all hover:-translate-y-1">
                                    <div className="h-28 rounded-2xl bg-[#0c0c0e] border border-white/5 overflow-hidden mb-4 relative flex items-center justify-center">
                                        {note.coverImage ? (
                                            <img src={note.coverImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                                        ) : (
                                            <NoteIcon name={note.icon} size={32} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{note.title || "Untitled"}</h3>
                                    <p className="text-[11px] text-zinc-500 mt-1.5">{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-zinc-400 font-medium mb-4 px-2">
                        <Sparkles size={16} /> <span className="text-sm">Create & Learn</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div onClick={() => createNote()} className="bg-gradient-to-br from-white/10 to-transparent border border-white/20 hover:border-white/40 rounded-[2rem] p-6 cursor-pointer group transition-all">
                             <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                             <h3 className="text-lg font-bold text-white mb-2">New Blank Page</h3>
                             <p className="text-sm text-zinc-400">Start fresh with a clean slate for your ideas.</p>
                         </div>
                         <div onClick={() => createNote('daily')} className="bg-gradient-to-br from-white/10 to-transparent border border-white/20 hover:border-white/40 rounded-[2rem] p-6 cursor-pointer group transition-all">
                             <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><CalendarDays size={24} /></div>
                             <h3 className="text-lg font-bold text-white mb-2">Today's Note</h3>
                             <p className="text-sm text-zinc-400">Jump right into capturing today's tasks and thoughts.</p>
                         </div>
                         <div onClick={() => setShowTemplates(true)} className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 rounded-[2rem] p-6 cursor-pointer group transition-all">
                             <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Layers size={24} /></div>
                             <h3 className="text-lg font-bold text-white mb-2">Explore Templates</h3>
                             <p className="text-sm text-zinc-400">Use pre-built page structures created for you.</p>
                         </div>
                    </div>
                </div>

                <HelpModal 
                    isOpen={showHelp} 
                    onClose={() => setShowHelp(false)} 
                    title="Smart Notes Workspace"
                >
                <div className="space-y-16">
                    <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">
                            <Sparkles className="text-zinc-500" size={32} />
                            Your Private Workspace
                        </h3>
                        <p className="text-lg leading-relaxed text-zinc-400 max-w-4xl font-medium">
                            Smart Notes is a powerful, privacy-first alternative to bloated note-taking apps. Built for speed and focus, our workspace combines the simplicity of markdown with the power of rich media, cover images, and template-based productivity. Whether you are drafting a project plan, tracking daily tasks, or brainstorming the next big thing, Smart Notes provides a fluid, dark-themed environment that lives entirely in your browser. No accounts required, no data tracking, and zero latency—just your thoughts, organized.
                        </p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-4 p-8 bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] hover:border-zinc-700 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Zap size={22} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Slash Commands</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-semibold">Type <code className="text-white bg-zinc-800 px-1.5 py-0.5 rounded">/</code> to trigger the block menu. Instantly insert headings, to-do lists, tables, code blocks, and callouts without touching your mouse.</p>
                        </div>
                        <div className="space-y-4 p-8 bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] hover:border-zinc-700 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Shield size={22} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Local-First Privacy</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-semibold">Your notes never leave your device. We use browser LocalStorage to keep your database private and accessible even while offline.</p>
                        </div>
                        <div className="space-y-4 p-8 bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] hover:border-zinc-700 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Rocket size={22} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Smart Templates</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-semibold">Jumpstart your workflow with Daily Note, Project Plan, or Article Draft templates designed by productivity experts.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-950/30 border border-zinc-900 rounded-[3.5rem] p-12 md:p-16">
                        <div className="flex flex-col md:flex-row gap-16">
                            <div className="flex-1 space-y-8">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Productivity Tips</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 border border-zinc-700 rounded-full flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                                        <p className="text-sm font-medium text-zinc-400"><strong className="text-white">Pin your active goals.</strong> Use the pin icon to keep high-priority projects at the top of your sidebar for instant access.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 border border-zinc-700 rounded-full flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                                        <p className="text-sm font-medium text-zinc-400"><strong className="text-white">Style with Covers.</strong> Add high-resolution cover images to create a visual organization system that makes each page distinct.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 border border-zinc-700 rounded-full flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                                        <p className="text-sm font-medium text-zinc-400"><strong className="text-white">Markdown Mastery.</strong> Use keyboard shortcuts like <code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-[10px]">#</code> for headers and <code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-[10px]">-</code> for lists for the fastest editing experience.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-8 border-t md:border-t-0 md:border-l border-zinc-900 pt-16 md:pt-0 md:pl-16">
                                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Workspace FAQ</h3>
                                <Accordion>
                                    <AccordionItem title="Where is my data stored?">
                                        Technically, in your browser&apos;s LocalStorage. This means your data is persistent on this specific browser and device but never touches our servers.
                                    </AccordionItem>
                                    <AccordionItem title="Can I export my notes?">
                                        Yes! Use the download icon in the top toolbar to export any page as Markdown (.md), Plain Text (.txt), or HTML.
                                    </AccordionItem>
                                    <AccordionItem title="Is there a mobile app?">
                                        Smart Notes is a Progressive Web App (PWA). You can &quot;Add to Home Screen&quot; on your phone for a full-screen, app-like experience on iOS and Android.
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    </div>
                </div>
            </HelpModal>
            </div>
        </div>
    );
}
