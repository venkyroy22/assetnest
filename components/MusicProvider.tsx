"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Maximize2, Minimize2, Music2 } from "lucide-react";

interface MusicContextType {
    youtubeUrl: string;
    setYoutubeUrl: (url: string) => void;
    currentYoutubeEmbed: string | null;
    playYoutube: (url?: string) => void;
    isYTPlaying: boolean;
    toggleYT: () => void;
    skipYoutubeTrack: () => void;
    prevYoutubeTrack: () => void;
    ytVolume: number;
    adjustYTVolume: (val: number) => void;
    resetPlayer: () => void;
    isMiniPlayerVisible: boolean;
    setIsMiniPlayerVisible: (val: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPomodoro = pathname === "/tools/pomodoro";

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [currentYoutubeEmbed, setCurrentYoutubeEmbed] = useState<string | null>(null);
    const [isYTPlaying, setIsYTPlaying] = useState(false);
    const [ytVolume, setYTVolume] = useState(50);
    const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // PERSISTENCE: Load from localStorage on mount
    React.useEffect(() => {
        const savedUrl = localStorage.getItem("assetnest_yt_url");
        const savedEmbed = localStorage.getItem("assetnest_yt_embed");
        const savedVolume = localStorage.getItem("assetnest_yt_volume");

        if (savedUrl) setYoutubeUrl(savedUrl);
        if (savedEmbed) {
            setCurrentYoutubeEmbed(savedEmbed);
            setIsYTPlaying(true);
        }
        if (savedVolume) setYTVolume(Number(savedVolume));

        setIsLoaded(true);
    }, []);

    // PERSISTENCE: Save to localStorage on changes
    React.useEffect(() => {
        if (!isLoaded) return;
        if (youtubeUrl) localStorage.setItem("assetnest_yt_url", youtubeUrl);
        else localStorage.removeItem("assetnest_yt_url");
    }, [youtubeUrl, isLoaded]);

    React.useEffect(() => {
        if (!isLoaded) return;
        if (currentYoutubeEmbed) localStorage.setItem("assetnest_yt_embed", currentYoutubeEmbed);
        else localStorage.removeItem("assetnest_yt_embed");
    }, [currentYoutubeEmbed, isLoaded]);

    React.useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("assetnest_yt_volume", String(ytVolume));
    }, [ytVolume, isLoaded]);


    const iframeRef = useRef<HTMLIFrameElement>(null);

    const playYoutube = (inputUrl?: string) => {
        const rawUrl = inputUrl || youtubeUrl;
        if (!rawUrl) return;

        try {
            const trimmedUrl = rawUrl.trim();
            let finalId = '';

            const urlObj = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);

            if (urlObj.hostname.includes('youtube.com')) {
                const v = urlObj.searchParams.get('v');
                const list = urlObj.searchParams.get('list');
                if (v) {
                    finalId = v + (list ? `?list=${list}` : '');
                } else if (list) {
                    finalId = `?listType=playlist&list=${list}`;
                } else if (urlObj.pathname.includes('/embed/')) {
                    finalId = urlObj.pathname.split('/embed/')[1].split('/')[0];
                }
            } else if (urlObj.hostname.includes('youtu.be')) {
                finalId = urlObj.pathname.slice(1);
            } else {
                finalId = trimmedUrl;
            }

            if (finalId) {
                const baseUrl = `https://www.youtube.com/embed/${finalId}`;
                const connector = baseUrl.includes('?') ? '&' : '?';
                setCurrentYoutubeEmbed(`${baseUrl}${connector}enablejsapi=1&autoplay=1`);
                setIsYTPlaying(true);
                setIsMiniPlayerVisible(true);
            }
        } catch (e) {
            console.error("YouTube link failed:", e);
        }
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [dockBounds, setDockBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    const isDockMode = isPomodoro;

    React.useEffect(() => {
        if (!isDockMode || !currentYoutubeEmbed) {
            setDockBounds(null);
            return;
        }

        const update = () => {
            const dock = document.getElementById("music-player-dock");
            const container = containerRef.current;
            if (dock && container) {
                const rect = dock.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setDockBounds({
                    top: rect.top - containerRect.top,
                    left: rect.left - containerRect.left,
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        const observer = new ResizeObserver(update);
        const dock = document.getElementById("music-player-dock");
        if (dock) observer.observe(dock);

        window.addEventListener("resize", update);
        update();

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [isDockMode, currentYoutubeEmbed, pathname]);

    const toggleYT = () => {
        if (iframeRef.current) {
            const command = isYTPlaying ? 'pauseVideo' : 'playVideo';
            iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: command, args: '' }),
                '*'
            );
            setIsYTPlaying(!isYTPlaying);
        }
    };

    const skipYoutubeTrack = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'nextVideo', args: '' }), '*');
            setIsYTPlaying(true);
        }
    };

    const prevYoutubeTrack = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'previousVideo', args: '' }), '*');
            setIsYTPlaying(true);
        }
    };

    const adjustYTVolume = (value: number) => {
        setYTVolume(value);
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [value] }), '*');
        }
    };

    const resetPlayer = () => {
        setCurrentYoutubeEmbed(null);
        setYoutubeUrl("");
        setIsYTPlaying(false);
    };

    return (
        <MusicContext.Provider value={{
            youtubeUrl, setYoutubeUrl,
            currentYoutubeEmbed, playYoutube,
            isYTPlaying, toggleYT,
            skipYoutubeTrack, prevYoutubeTrack,
            ytVolume, adjustYTVolume,
            resetPlayer, isMiniPlayerVisible, setIsMiniPlayerVisible
        }}>
            <div ref={containerRef} className="relative flex flex-col min-h-screen">
                {children}

                {/* The Persistent Master Player Component */}
                {currentYoutubeEmbed && (
                    <div
                        className={`
                            transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                            ${isDockMode && dockBounds ? "absolute transition-none z-10" : "fixed z-[999]"}
                            ${!isDockMode ? (isMiniPlayerVisible ? "bottom-10 right-10 w-64 h-40 scale-100 opacity-100" : "bottom-10 right-10 w-10 h-10 scale-0 opacity-0 pointer-events-none") : ""}
                        `}
                        style={isDockMode && dockBounds ? {
                            top: dockBounds.top,
                            left: dockBounds.left,
                            width: dockBounds.width,
                            height: dockBounds.height,
                            borderRadius: '0.75rem',
                            overflow: 'hidden'
                        } : {}}
                    >
                        <div className="relative group w-full h-full bg-[#141414] rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl">
                            <iframe
                                ref={iframeRef}
                                src={currentYoutubeEmbed}
                                className="w-full h-full pointer-events-auto"
                                frameBorder="0"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                            />

                            {/* Always visible Close/Hide control on MiniPlayer */}
                            {!isDockMode && (
                                <button
                                    onClick={() => setIsMiniPlayerVisible(false)}
                                    className="absolute top-2 right-2 p-1.5 bg-[#141414]/60 text-[#f0ede8] rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Persistence Toggle Button (Invisible toggle when hidden) */}
                {!isDockMode && currentYoutubeEmbed && !isMiniPlayerVisible && (
                    <button
                        onClick={() => setIsMiniPlayerVisible(true)}
                        className="fixed bottom-10 right-10 z-[999] p-4 bg-[#1c1c1c] border border-white/[0.07] rounded-full text-zinc-400 hover:text-[#f0ede8] shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
                        title="Restore Music View"
                    >
                        <Music2 size={20} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    </button>
                )}
            </div>
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const context = useContext(MusicContext);
    if (!context) throw new Error("useMusic must be used within MusicProvider");
    return context;
}
