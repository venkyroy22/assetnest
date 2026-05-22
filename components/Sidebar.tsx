"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, Settings, Wrench, Sparkles, QrCode, Info, Mail } from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import { useSettings } from "./SettingsProvider";
import { usePins } from "./PinProvider";
import { ALL_TOOLS } from "@/lib/tools";
import Tooltip from "./Tooltip";

const MENU_ITEMS = [
    { name: "Smart Tools", href: "/tools", icon: Wrench },
    { name: "AI Image Prompts", href: "/prompts", icon: Sparkles },
    { name: "QR Generator", href: "/tools/qr", icon: QrCode },
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
];

const Sidebar = () => {
    const { isOpen, toggle, isNavigating } = useSidebar();
    const { setSettingsOpen } = useSettings();
    const { pinnedToolIds } = usePins();
    const pathname = usePathname();
    const isHome = pathname === "/";

    // Track sidebar transition state to swap overflow dynamically without visual jitter
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 500); // Matches the 500ms CSS width transition
        return () => clearTimeout(timer);
    }, [isOpen]);

    const pinnedTools = ALL_TOOLS.filter(tool => pinnedToolIds.includes(tool.id));

    const toggleButton = (
        <button
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-[#f0ede8] hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer shrink-0 active:scale-95 focus:outline-none"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
            <PanelLeft size={18} />
        </button>
    );

    const renderHeaderToggle = () => {
        if (!isOpen) {
            return (
                <Tooltip content="Open sidebar Ctrl+." position="right" delay={600}>
                    {toggleButton}
                </Tooltip>
            );
        }
        return (
            <Tooltip content="Close sidebar" position="left" delay={600}>
                {toggleButton}
            </Tooltip>
        );
    };

    const renderNavItem = ({
        name,
        href,
        icon: Icon,
        onClick,
        isActive,
        tooltip,
    }: {
        name: string;
        href?: string;
        icon: any;
        onClick?: () => void;
        isActive?: boolean;
        tooltip: string;
    }) => {
        const isButton = !!onClick;
        const iconColor = isActive 
            ? "text-[#f0ede8]" 
            : "text-zinc-400 group-hover:text-[#f0ede8]";

        const content = (
            <div className={`flex items-center w-full h-10 rounded-xl transition-all duration-200 select-none
                ${isActive 
                    ? "bg-zinc-800/60 text-[#f0ede8]" 
                    : "text-zinc-400 hover:text-[#f0ede8] hover:bg-zinc-800/30"}
            `}>
                {/* Mathematical Static Icon Bounding Wrapper (Anchor x=32px perfectly in both states) */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <Icon size={18} className={`transition-colors duration-200 ${iconColor}`} />
                </div>

                {/* Animated Label Text */}
                <div className={`flex items-center justify-between flex-grow overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isOpen ? "opacity-100 max-w-[180px] ml-3" : "opacity-0 max-w-0 ml-0 pointer-events-none"}`}
                >
                    <span className="text-[13.5px] font-medium tracking-tight whitespace-nowrap">
                        {name}
                    </span>
                </div>
            </div>
        );

        const innerElement = isButton ? (
            <button
                onClick={onClick}
                className="w-full text-left group block focus:outline-none cursor-pointer"
            >
                {content}
            </button>
        ) : (
            <Link
                href={href || "#"}
                className="w-full text-left group block focus:outline-none cursor-pointer"
            >
                {content}
            </Link>
        );

        if (!isOpen) {
            return (
                <Tooltip key={name} content={tooltip} position="right" delay={600} className="w-full">
                    {innerElement}
                </Tooltip>
            );
        }

        return <div key={name} className="w-full">{innerElement}</div>;
    };

    // When collapsed and not transitioning, use overflow-visible so tooltips do not clip
    const showOverflow = !isOpen && !isTransitioning;

    return (
        <aside
            className={`h-[calc(100vh-5rem)] fixed top-20 left-0 z-[1000] hidden lg:block bg-[#1a1a1a] border-r border-white/5 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${isNavigating ? "!transition-none" : "transition-[width,opacity,overflow] duration-500"}
                ${isOpen ? "w-64" : isHome ? "w-0 opacity-0" : "w-16"}
                ${showOverflow ? "overflow-visible" : "overflow-x-hidden"}`}
        >
            {/* Ambient Background dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Elegant top gradient glow */}
            <div
                className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.01), transparent)" }}
            />

            {/* Mathematically Locked Content Container (Constant px-3 py-4 spacing) */}
            <div className={`relative z-10 flex flex-col h-full px-3 py-4 select-none justify-between
                ${showOverflow ? "overflow-visible" : "overflow-hidden"}`}
            >
                
                <div className={showOverflow ? "overflow-visible" : "overflow-hidden"}>
                    {/* Brand / Toggle Row */}
                    <div className="flex items-center justify-between mb-6 shrink-0 h-10 w-full">
                        <span className={`font-bold text-xl text-[#f0ede8] tracking-tight whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                            ${isOpen ? "opacity-100 max-w-[150px] pl-1" : "opacity-0 max-w-0 overflow-hidden"}`}
                        >
                            AssetNest
                        </span>
                        {renderHeaderToggle()}
                    </div>

                    {/* Scrollable Navigation Block */}
                    <div className={`pr-1 -mr-1 flex flex-col gap-4 max-h-[calc(100vh-14rem)]
                        ${isOpen ? "overflow-y-auto custom-scrollbar" : "overflow-visible"}`}
                    >
                        
                        {/* Pinned Section */}
                        {pinnedTools.length > 0 && (
                            <div className={showOverflow ? "overflow-visible" : "overflow-hidden"}>
                                <p className={`text-[11px] font-bold text-zinc-500 px-3 tracking-wide uppercase select-none whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                                    ${isOpen ? "opacity-100 max-h-10 mb-2 mt-2" : "opacity-0 max-h-0 mb-0 mt-0 pointer-events-none"}`}
                                >
                                    Pinned
                                </p>
                                <nav className="flex flex-col gap-1 w-full">
                                    {pinnedTools.map((tool) => renderNavItem({
                                        name: tool.name,
                                        href: tool.href,
                                        icon: tool.icon,
                                        isActive: pathname === tool.href,
                                        tooltip: tool.name,
                                    }))}
                                </nav>
                            </div>
                        )}

                        {/* Divider between Pinned and Discover */}
                        {pinnedTools.length > 0 && (
                            <div className="border-t border-white/5 shrink-0" />
                        )}

                        {/* Discover Section */}
                        <div className={showOverflow ? "overflow-visible" : "overflow-hidden"}>
                            <p className={`text-[11px] font-bold text-zinc-500 px-3 tracking-wide uppercase select-none whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                                ${isOpen ? "opacity-100 max-h-10 mb-2 mt-2" : "opacity-0 max-h-0 mb-0 mt-0 pointer-events-none"}`}
                            >
                                Discover
                            </p>
                            <nav className="flex flex-col gap-1 w-full">
                                {MENU_ITEMS.map((item) => renderNavItem({
                                    name: item.name,
                                    href: item.href,
                                    icon: item.icon,
                                    isActive: pathname === item.href,
                                    tooltip: item.name,
                                }))}
                            </nav>
                        </div>

                    </div>
                </div>

                {/* Bottom Section: Settings */}
                <div className="shrink-0 pt-4 border-t border-white/5 mt-auto">
                    {renderNavItem({
                        name: "Platform Settings",
                        onClick: () => setSettingsOpen(true),
                        icon: Settings,
                        tooltip: "Platform Settings",
                    })}
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;
