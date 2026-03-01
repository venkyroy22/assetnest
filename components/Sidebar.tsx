"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Video, Globe, Sparkles, Volume2, Image as ImageIcon, QrCode } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

const PinterestIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="3 3 18 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path
            d="M12.017 4.5c-4.138 0-7.5 3.362-7.5 7.5 0 3.174 1.974 5.886 4.761 6.976-.065-.593-.124-1.502.026-2.15l.879-3.729s-.224-.45-.224-1.114c0-1.043.604-1.821 1.357-1.821.64 0 .949.48.949 1.056 0 .643-.409 1.605-.621 2.497-.177.746.374 1.356 1.111 1.356 1.333 0 2.357-1.405 2.357-3.434 0-1.795-1.29-3.051-3.132-3.051-2.134 0-3.386 1.6-3.386 3.255 0 .644.248 1.336.558 1.711.061.074.07.14.052.216l-.208.85c-.033.138-.109.167-.251.101-.937-.436-1.523-1.805-1.523-2.906 0-2.365 1.719-4.538 4.956-4.538 2.601 0 4.624 1.854 4.624 4.332 0 2.585-1.63 4.665-3.892 4.665-.76 0-1.474-.394-1.719-.861l-.467 1.783c-.169.652-.626 1.469-.933 1.966.702.217 1.448.334 2.221.334 4.138 0 7.5-3.362 7.5-7.5s-3.362-7.5-7.5-7.5z"
        />
    </svg>
);

const Sidebar = () => {
    const { isOpen } = useSidebar();
    const pathname = usePathname();

    const menuItems = [
        {
            name: "Pinterest Keywords",
            href: "/keywords",
            icon: PinterestIcon,
        },
        {
            name: "QR Generator",
            href: "/tools/qr",
            icon: QrCode,
        },
        {
            name: "Video Edit Assets",
            href: "/video-editing",
            icon: Video,
            isDevelopment: true,
        },
        {
            name: "Useful Websites",
            href: "/useful-websites",
            icon: Globe,
            isDevelopment: true,
        },
        {
            name: "AI Tools",
            href: "/ai-tools",
            icon: Sparkles,
            isDevelopment: true,
        },
        {
            name: "Wallpapers",
            href: "/category/wallpapers",
            icon: ImageIcon,
            isDevelopment: true,
        },
        {
            name: "Sound Effects",
            href: "/category/sound-effects",
            icon: Volume2,
            isDevelopment: true,
        },
    ];

    const isHome = pathname === "/";

    return (
        <aside
            className={`h-[calc(100vh-5rem)] sticky top-20 hidden lg:block bg-zinc-900/50 transition-all duration-300 ease-in-out ${isOpen ? "w-64" : (isHome ? "w-0 opacity-0 overflow-hidden" : "w-16")
                }`}
        >
            <div className={`flex flex-col h-full transition-all duration-300 ${isOpen ? "p-6" : "p-0"}`}>
                <div className="flex-grow">
                    <div className="mb-10">
                        <p className={`text-[11px] font-bold tracking-tight text-secondary/40 mb-6 px-2 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                            Discover
                        </p>
                        <nav className={`${isOpen ? "space-y-1 p-2" : "space-y-2"}`}>
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.isDevelopment ? "#" : item.href}
                                        className={`group flex items-center transition-all duration-300 border ${isOpen
                                            ? "justify-between px-4 py-2 rounded-lg"
                                            : "justify-center h-12 w-full border-transparent"
                                            } ${isActive
                                                ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/10"
                                                : "hover:bg-zinc-100/10 dark:hover:bg-zinc-800/50 border-transparent"
                                            } ${item.isDevelopment ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                                        title={!isOpen ? `${item.name}${item.isDevelopment ? ' (Under Development)' : ''}` : ""}
                                    >
                                        <div className={`flex items-center ${isOpen ? "gap-3" : "gap-0"}`}>
                                            <div className="shrink-0 flex items-center justify-center relative">
                                                <Icon size={24} />
                                                {item.isDevelopment && !isOpen && (
                                                    <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full border border-black animate-pulse" />
                                                )}
                                            </div>
                                            <span className={`text-[13px] font-bold tracking-tight leading-tight transition-all duration-300 ${isOpen ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 h-0 overflow-hidden"}`}>
                                                {item.name}
                                                {item.isDevelopment && isOpen && (
                                                    <div className="text-[8px] font-black uppercase text-amber-500 mt-0.5 tracking-[0.1em]">Stay Updated</div>
                                                )}
                                            </span>
                                        </div>
                                        {isOpen && !item.isDevelopment && (
                                            <ChevronRight
                                                size={14}
                                                className={`shrink-0 transition-transform duration-300 ${isActive ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
