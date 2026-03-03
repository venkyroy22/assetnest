"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ChevronRight, Video, Globe, Sparkles, Volume2,
    Image as ImageIcon, QrCode, Wrench,
} from "lucide-react";
import { useSidebar } from "./SidebarProvider";

// ── Pinterest icon ────────────────────────────────────────────────────────────
const PinterestIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="3 3 18 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M12.017 4.5c-4.138 0-7.5 3.362-7.5 7.5 0 3.174 1.974 5.886 4.761 6.976-.065-.593-.124-1.502.026-2.15l.879-3.729s-.224-.45-.224-1.114c0-1.043.604-1.821 1.357-1.821.64 0 .949.48.949 1.056 0 .643-.409 1.605-.621 2.497-.177.746.374 1.356 1.111 1.356 1.333 0 2.357-1.405 2.357-3.434 0-1.795-1.29-3.051-3.132-3.051-2.134 0-3.386 1.6-3.386 3.255 0 .644.248 1.336.558 1.711.061.074.07.14.052.216l-.208.85c-.033.138-.109.167-.251.101-.937-.436-1.523-1.805-1.523-2.906 0-2.365 1.719-4.538 4.956-4.538 2.601 0 4.624 1.854 4.624 4.332 0 2.585-1.63 4.665-3.892 4.665-.76 0-1.474-.394-1.719-.861l-.467 1.783c-.169.652-.626 1.469-.933 1.966.702.217 1.448.334 2.221.334 4.138 0 7.5-3.362 7.5-7.5s-3.362-7.5-7.5-7.5z" />
    </svg>
);

// ── Menu config ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
    { name: "Top Tools", href: "/tools", icon: Wrench, accent: "#10b981", dev: false },
    { name: "Pinterest Keywords", href: "/keywords", icon: PinterestIcon, accent: "#e11d48", dev: false },
    { name: "QR Generator", href: "/tools/qr", icon: QrCode, accent: "#6366f1", dev: false },
    { name: "Video Edit Assets", href: "/video-editing", icon: Video, accent: "#f59e0b", dev: true },
    { name: "Useful Websites", href: "/useful-websites", icon: Globe, accent: "#06b6d4", dev: true },
    { name: "AI Tools", href: "/ai-tools", icon: Sparkles, accent: "#a855f7", dev: true },
    { name: "Wallpapers", href: "/category/wallpapers", icon: ImageIcon, accent: "#ec4899", dev: true },
    { name: "Sound Effects", href: "/category/sound-effects", icon: Volume2, accent: "#16a34a", dev: true },
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
        const t = setTimeout(() => setVisible(true), 50 + index * 40);
        return () => clearTimeout(t);
    }, [index]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const accent = item.accent;
    const disabled = item.dev;

    return (
        <Link
            ref={rowRef}
            href={disabled ? "#" : item.href}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => !disabled && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={!isOpen ? `${item.name}${disabled ? " (Coming Soon)" : ""}` : ""}
            style={{
                opacity: visible ? (disabled ? 0.4 : 1) : 0,
                transform: visible ? "translateX(0)" : "translateX(-8px)",
                transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.23,1,0.32,1)",
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
                    className={`text-[13px] font-bold tracking-tight leading-tight transition-all duration-300
                        ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 h-0 overflow-hidden"}`}
                    style={{
                        color: isActive ? "inherit" : hovered ? accent : undefined,
                        transition: "color 0.25s",
                    }}
                >
                    {item.name}
                    {disabled && isOpen && (
                        <div className="text-[8px] font-black uppercase text-amber-500 mt-0.5 tracking-[0.1em]">Stay Updated</div>
                    )}
                </span>
            </div>

            {/* Chevron (open only) */}
            {isOpen && !disabled && (
                <ChevronRight
                    size={13}
                    className="relative z-10 shrink-0 transition-all duration-300"
                    style={{
                        color: isActive ? "currentColor" : hovered ? accent : "transparent",
                        transform: hovered || isActive ? "translateX(2px)" : "translateX(0)",
                    }}
                />
            )}
        </Link>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
    const { isOpen } = useSidebar();
    const pathname = usePathname();
    const isHome = pathname === "/";

    return (
        <aside
            className={`h-[calc(100vh-5rem)] sticky top-20 hidden lg:block bg-zinc-900/50 transition-all duration-300 ease-in-out
                ${isOpen ? "w-64" : isHome ? "w-0 opacity-0 overflow-hidden" : "w-16"}`}
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
            <div className={`relative z-10 flex flex-col h-full transition-all duration-300 ${isOpen ? "p-6" : "p-2"}`}>
                <div className="flex-grow">
                    <div className="mb-6">
                        <p className={`text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 px-2 transition-all duration-300
                            ${isOpen ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"}`}>
                            Discover
                        </p>

                        <nav className={`flex flex-col ${isOpen ? "gap-0.5" : "gap-1.5"}`}>
                            {MENU_ITEMS.map((item, i) => (
                                <NavItem
                                    key={item.href}
                                    item={item}
                                    isOpen={isOpen}
                                    isActive={pathname === item.href}
                                    index={i}
                                />
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
