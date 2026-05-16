"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Video, Globe, Sparkles, Volume2, Image as ImageIcon, QrCode, Wrench, Pin, Info, Mail, Settings, BookOpen } from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import { usePins } from "./PinProvider";
import { useSettings } from "./SettingsProvider";
import { ALL_TOOLS } from "@/lib/tools";

// ── Menu config ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
    { name: "Smart Tools", href: "/tools", icon: Wrench, accent: "#d4d4d8", dev: false },
    { name: "AI Image Prompts", href: "/prompts", icon: Sparkles, accent: "#d4d4d8", dev: false },
    { name: "QR Generator", href: "/tools/qr", icon: QrCode, accent: "#d4d4d8", dev: false },
    { name: "About", href: "/about", icon: Info, accent: "#d4d4d8", dev: false },
    { name: "Contact", href: "/contact", icon: Mail, accent: "#d4d4d8", dev: false },
];

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
    item,
    isOpen,
    isActive,
    index,
}: {
    item: typeof MENU_ITEMS[0];
    isOpen: boolean;
    isActive: boolean;
    index: number;
}) {
    const rowRef = useRef<HTMLAnchorElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100 + index * 50);
        return () => clearTimeout(t);
    }, [index]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const accent = item.accent;
    const disabled = item.dev;

    const linkContent = (
        <Link
            ref={rowRef}
            href={disabled ? "#" : item.href}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => !disabled && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                opacity: visible ? (disabled ? 0.4 : 1) : 0,
                transform: visible ? "translateX(0)" : "translateX(-12px)",
                transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)",
            }}
            className={`group relative overflow-hidden flex items-center border transition-all duration-200 rounded-lg
                ${isOpen
                    ? "justify-between px-4 py-2"
                    : "justify-center h-12 w-full border-transparent"}
                ${isOpen && isActive
                    ? "bg-foreground text-background border-foreground shadow-lg"
                    : isOpen
                        ? "border-transparent hover:bg-zinc-800/50"
                        : isActive
                            ? "border-transparent"   /* collapsed active: no big box */
                            : "border-transparent"}
                ${disabled ? "grayscale cursor-not-allowed" : "cursor-pointer"}
            `}
        >
            {/* Dot-grid texture on hover */}
            <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
                    backgroundSize: "14px 14px",
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.3s",
                }}
            />

            {/* Spotlight radial */}
            <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                    opacity: hovered ? 1 : 0,
                    background: hovered
                        ? `radial-gradient(110px circle at ${mouse.x}px ${mouse.y}px, ${accent}25, transparent 70%)`
                        : "none",
                    transition: "opacity 0.2s",
                }}
            />

            {/* Mouse-tracked glowing border (open mode only, not active) */}
            {isOpen && !isActive && (
                <div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        opacity: hovered ? 1 : 0,
                        background: hovered
                            ? `radial-gradient(110px circle at ${mouse.x}px ${mouse.y}px, ${accent}50, transparent 60%)`
                            : "none",
                        WebkitMask: "linear-gradient(#fff,#fff) content-box, linear-gradient(#fff,#fff)",
                        WebkitMaskComposite: "xor" as React.CSSProperties["WebkitMaskComposite"],
                        maskComposite: "exclude" as React.CSSProperties["maskComposite"],
                        padding: "1px",
                        transition: "opacity 0.2s",
                    }}
                />
            )}

            {/* Collapsed active: subtle left accent bar */}
            {!isOpen && isActive && (
                <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: accent }}
                />
            )}

            {/* Icon + label */}
            <div className={`relative z-10 flex items-center ${isOpen ? "gap-3" : "gap-0"}`}>
                <div className="relative shrink-0 flex items-center justify-center">
                    <div
                        style={{
                            color: isActive
                                ? isOpen ? "currentColor" : accent
                                : hovered ? accent : undefined,
                            transition: "color 0.25s",
                        }}
                    >
                        <item.icon size={isOpen ? 18 : 22} />
                    </div>

                    {/* Dev dot on collapsed */}
                    {disabled && !isOpen && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-zinc-950 animate-pulse" />
                    )}
                </div>

                <span
                    className={`text-[13px] font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                        ${isOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0 m-0"}`}
                    style={{
                        color: isActive ? "inherit" : hovered ? accent : undefined,
                        transition: "color 0.25s",
                    }}
                >
                    {item.name}
                    {disabled && isOpen && (
                        <div className="text-[9px] font-semibold text-amber-500/80 mt-0.5 tracking-wide">Stay Updated</div>
                    )}
                </span>
            </div>

            {/* Chevron (open only) */}
            {isOpen && !disabled && (
                <ChevronRight
                    size={13}
                    className="relative z-10 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{
                        color: isActive ? "currentColor" : hovered ? accent : "transparent",
                        transform: hovered || isActive ? "translateX(2px)" : "translateX(0)",
                    }}
                />
            )}
        </Link>
    );

    return linkContent;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
    const { isOpen, isNavigating } = useSidebar();
    const { setSettingsOpen } = useSettings();
    const { pinnedToolIds } = usePins();
    const pathname = usePathname();
    const isHome = pathname === "/";

    const pinnedTools = ALL_TOOLS.filter(tool => pinnedToolIds.includes(tool.id));

    return (
        <aside
            className={`h-[calc(100vh-5rem)] fixed top-20 left-0 z-[1000] hidden lg:block bg-zinc-950/60 backdrop-blur-3xl border-r border-white/5 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-x-hidden
                ${isNavigating ? "!transition-none" : "transition-[width,opacity] duration-500"}
                ${isOpen ? "w-64" : isHome ? "w-0 opacity-0" : "w-16"}`}
        >
            {/* Background dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Top glow */}
            <div
                className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(16,185,129,0.05), transparent)" }}
            />

            {/* Content */}
            <div className={`relative z-10 flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "p-6" : "p-2"}`}>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    {/* Pinned Section */}
                    {pinnedTools.length > 0 && (
                        <div className="mb-8 mt-2">
                            <p className={`text-[10px] font-semibold tracking-wider text-zinc-500 mb-3 px-3 flex items-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                                ${isOpen ? "opacity-100 max-h-[20px]" : "opacity-0 max-h-0 m-0"}`}>
                                <Pin size={10} className="text-zinc-500 shrink-0" fill="currentColor" /> Pinned
                            </p>
                            <nav className={`flex flex-col ${isOpen ? "gap-0.5" : "gap-1.5"}`}>
                                {pinnedTools.map((tool, i) => (
                                    <NavItem
                                        key={`pinned-${tool.id}`}
                                        item={{
                                            name: tool.name,
                                            href: tool.href,
                                            icon: tool.icon,
                                            accent: tool.accent,
                                            dev: false
                                        }}
                                        isOpen={isOpen}
                                        isActive={pathname === tool.href}
                                        index={i}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}

                    <div className="mb-6">
                        <p className={`text-[10px] font-semibold tracking-wider text-zinc-500 mb-3 px-3 whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                            ${isOpen ? "opacity-100 max-h-[20px]" : "opacity-0 max-h-0 m-0"}`}>
                            Discover
                        </p>

                        <nav className={`flex flex-col ${isOpen ? "gap-0.5" : "gap-1.5"}`}>
                            {MENU_ITEMS.map((item, i) => (
                                <NavItem
                                    key={item.href}
                                    item={item}
                                    isOpen={isOpen}
                                    isActive={pathname === item.href}
                                    index={i + pinnedTools.length}
                                />
                            ))}
                        </nav>
                    </div>
                </div>

                {/* ── Settings Button Bottom ── */}
                <div className={`shrink-0 pt-4 mt-2 border-t border-white/5 transition-all duration-500 ${isOpen ? "px-1" : "px-0 flex justify-center"}`}>
                   <button 
                       onClick={() => setSettingsOpen(true)} 
                       className={`flex items-center group overflow-hidden w-full text-zinc-500 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-all ${isOpen ? "gap-3 px-3 py-2" : "justify-center h-12"}`}
                       title="Platform Settings"
                   >
                      <Settings size={isOpen ? 18 : 22} className="shrink-0 group-hover:rotate-45 transition-transform duration-500 ease-in-out" />
                      <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap transition-all duration-500 ${isOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"}`}>Platform Settings</span>
                   </button>
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;
