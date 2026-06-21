"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Image as ImageIcon, UploadCloud, GripVertical,
    X, Trash2, Camera, Scissors, Grid3X3,
    Info, Package, CheckCircle, ShieldCheck,
    Sparkles, Lock, Globe, Layers, ArrowLeft,
    AlertTriangle, RotateCcw, ChevronDown, Download
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import Link from "next/link";
import JSZip from "jszip";

interface GridImage {
    id: string;
    url: string;
    file?: File;
}

interface ConfirmState {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
}

// The mobile app always renders a profile's posts in exactly 3 fixed
// columns. Desktop web is responsive and commonly shows 4 (sometimes up to
// 6 on very wide windows). There's no single number that's "correct" for
// every viewer, so both the splitter and the preview mockup let people pick
// 3 (optimized for mobile) or 4 (optimized for a typical desktop width)
// rather than locking to one.
const COLUMN_OPTIONS = [3, 4] as const;
const DEFAULT_SPLIT_COLUMNS = 3;
const MOBILE_PREVIEW_COLUMNS = 3;
// Instagram's grid crop moved from a square (1:1) to a taller portrait
// crop (3:4) in 2025. Tiles are exported at this ratio so they fill the
// grid cell cleanly instead of getting padded.
const EXPORT_TILE_W = 1080;
const EXPORT_TILE_H = 1440;
const MAX_SPLIT_ROWS = 6;

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
  transform: translate(2px, 2px) !important;
  box-shadow: none !important;
}
.ig-handle {
  touch-action: none;
}
.ig-tile {
  touch-action: pan-y;
}
@keyframes ig-toast-in {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
.ig-toast {
  animation: ig-toast-in 0.18s ease-out;
}
`;

function LocalAccordion({ children }: { children: React.ReactNode }) {
    return <div className="space-y-4 w-full">{children}</div>;
}

interface LocalAccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function LocalAccordionItem({ title, children }: LocalAccordionItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-2 border-black rounded-2xl bg-zinc-50 overflow-hidden shadow-[3px_3px_0_#000] transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left transition-all hover:bg-zinc-100/80"
            >
                <span className="font-bold text-sm sm:text-base text-black pr-4">
                    {title}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-185" : ""}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[800px] border-t-2 border-black bg-white" : "max-h-0"
                }`}
            >
                <div className="p-5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function IGGridPlannerPage() {
    const [images, setImages] = useState<GridImage[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview Device Toggle: 'mobile' | 'desktop'
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
    const [desktopPreviewCols, setDesktopPreviewCols] = useState<3 | 4>(4);

    // Which tool is active. There's no separate "choose a tool" screen
    // anymore — the tabbed workspace is visible from the very first load,
    // defaulting to the splitter, with Feed always one tap away.
    const [viewMode, setViewMode] = useState<"feed" | "splitter">("splitter");

    // Lightweight toast + confirm dialog so we never rely on the browser's
    // native confirm()/alert(), which can't be styled and reads oddly on mobile.
    const [toast, setToast] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2400);
        return () => clearTimeout(t);
    }, [toast]);

    // Split Image State
    const [splitImageSrc, setSplitImageSrc] = useState<string | null>(null);
    const [splitImageDims, setSplitImageDims] = useState<{ w: number; h: number } | null>(null);
    const [splitCols, setSplitCols] = useState<3 | 4>(DEFAULT_SPLIT_COLUMNS);
    const [splitRows, setSplitRows] = useState(3);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitResults, setSplitResults] = useState<GridImage[]>([]);
    const [isZipping, setIsZipping] = useState(false);
    const [hasAddedToFeed, setHasAddedToFeed] = useState(false);
    const splitInputRef = useRef<HTMLInputElement>(null);

    // Profile Mock State
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [username, setUsername] = useState("your.username");
    const [bio, setBio] = useState("Welcome to my awesome Instagram grid planner! 🎉\nPlanning my next big posts right here.");
    const profileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newImages: GridImage[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            url: URL.createObjectURL(file),
            file
        }));

        setImages((prev) => [...newImages, ...prev]);
        setViewMode("feed");
        setToast(`Added ${newImages.length} photo${newImages.length === 1 ? "" : "s"}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePic(URL.createObjectURL(file));
    };

    const handleSplitSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (splitImageSrc) URL.revokeObjectURL(splitImageSrc);
        splitResults.forEach((r) => URL.revokeObjectURL(r.url));

        const url = URL.createObjectURL(file);
        const probe = new Image();
        probe.onload = () => setSplitImageDims({ w: probe.width, h: probe.height });
        probe.src = url;

        setSplitImageSrc(url);
        setSplitImageDims(null);
        setSplitResults([]);
        setViewMode("splitter");
        if (splitInputRef.current) splitInputRef.current.value = "";
    };

    const choosePhotoAgain = () => {
        if (splitImageSrc) URL.revokeObjectURL(splitImageSrc);
        splitResults.forEach((r) => URL.revokeObjectURL(r.url));
        setSplitImageSrc(null);
        setSplitImageDims(null);
        setSplitResults([]);
        setHasAddedToFeed(false);
    };

    const confirmSplit = async () => {
        if (!splitImageSrc) return;
        setIsSplitting(true);

        try {
            const img = new Image();
            img.src = splitImageSrc;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const cols = splitCols;
            const rows = splitRows;
            const tileAspect = EXPORT_TILE_W / EXPORT_TILE_H; // 3:4 portrait
            // The cropped source region needs to be cols:rows in tile *count*,
            // but each tile itself is a 3:4 portrait rather than a square, so
            // the overall crop ratio is the column/row ratio scaled by the
            // tile's own aspect ratio.
            const targetRatio = (cols / rows) * tileAspect;
            const imgRatio = img.width / img.height;

            let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height;
            if (imgRatio > targetRatio) {
                sourceW = img.height * targetRatio;
                sourceX = (img.width - sourceW) / 2;
            } else {
                sourceH = img.width / targetRatio;
                sourceY = (img.height - sourceH) / 2;
            }

            const sliceW = sourceW / cols;
            const sliceH = sourceH / rows;

            const canvas = document.createElement("canvas");
            canvas.width = EXPORT_TILE_W;
            canvas.height = EXPORT_TILE_H;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            const newImages: GridImage[] = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    ctx.clearRect(0, 0, EXPORT_TILE_W, EXPORT_TILE_H);
                    ctx.drawImage(
                        img,
                        sourceX + c * sliceW, sourceY + r * sliceH, sliceW, sliceH,
                        0, 0, EXPORT_TILE_W, EXPORT_TILE_H
                    );

                    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
                    if (blob) {
                        newImages.push({
                            id: Math.random().toString(36).substring(2, 9),
                            url: URL.createObjectURL(blob),
                        });
                    }
                }
            }

            setSplitResults(newImages);
        } catch (err) {
            console.error(err);
            setToast("Couldn't split that image — try a different file");
        } finally {
            setIsSplitting(false);
        }
    };

    const handleDownloadZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const total = splitResults.length;
            const cols = splitCols;

            await Promise.all(splitResults.map(async (res, i) => {
                const response = await fetch(res.url);
                const blob = await response.blob();
                // Files are named so that sorting them alphabetically (which
                // every file browser does by default) is the exact order to
                // upload them in. Instagram shows the newest post first, so
                // the bottom-right tile has to go up first and the top-left
                // tile goes up last.
                const uploadOrder = total - i;
                const row = Math.floor(i / cols) + 1;
                const col = (i % cols) + 1;
                zip.file(`${String(uploadOrder).padStart(2, "0")}-of-${total}_row${row}-col${col}.jpg`, blob);
            }));

            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `instagram-grid-${cols}x${splitRows}.zip`;
            a.click();
            setToast("ZIP downloaded");
        } catch (err) {
            console.error(err);
            setToast("Download failed — please try again");
        } finally {
            setIsZipping(false);
        }
    };

    const handleDownloadFeedZip = async () => {
        if (images.length === 0) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const total = images.length;
            await Promise.all(images.map(async (img, i) => {
                const response = await fetch(img.url);
                const blob = await response.blob();
                const uploadOrder = total - i;
                zip.file(`${String(uploadOrder).padStart(2, "0")}-feed-post.jpg`, blob);
            }));

            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `instagram-feed-planner.zip`;
            a.click();
            setToast("Feed ZIP downloaded");
        } catch (err) {
            console.error(err);
            setToast("Download failed — please try again");
        } finally {
            setIsZipping(false);
        }
    };

    const addSplitImagesToGrid = () => {
        setImages(prev => [...splitResults, ...prev]);
        setToast(`Added ${splitResults.length} tiles to your feed`);
        setViewMode("feed");
        setSplitImageSrc(null);
        setSplitImageDims(null);
        setSplitResults([]);
        setHasAddedToFeed(true);
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter((img) => img.id !== id);
        });
    };

    const clearAll = () => {
        if (images.length === 0) return;
        setConfirmState({
            title: "Clear your feed?",
            message: `This removes all ${images.length} photo${images.length === 1 ? "" : "s"} from the planner. This can't be undone.`,
            confirmLabel: "Clear feed",
            onConfirm: () => {
                images.forEach((img) => URL.revokeObjectURL(img.url));
                setImages([]);
                setToast("Feed cleared");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    };

    // ── Reordering, via Pointer Events ──────────────────────────────────
    // Pointer Events unify mouse, touch and pen, so the same handlers work
    // for dragging on desktop and long-pressing/dragging on a phone — the
    // old HTML5 drag-and-drop API only worked with a mouse.
    const dragInfo = useRef<{ idx: number; pointerId: number } | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const handleHandlePointerDown = (e: React.PointerEvent, idx: number) => {
        e.preventDefault();
        dragInfo.current = { idx, pointerId: e.pointerId };
        setDraggedIdx(idx);
        setOverIdx(idx);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleHandlePointerMove = (e: React.PointerEvent) => {
        const info = dragInfo.current;
        if (!info || info.pointerId !== e.pointerId) return;
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const tile = el?.closest("[data-tile-idx]") as HTMLElement | null;
        if (tile) {
            const idx = Number(tile.dataset.tileIdx);
            if (!Number.isNaN(idx)) setOverIdx(idx);
        }
    };

    const finishDrag = (e: React.PointerEvent) => {
        const info = dragInfo.current;
        if (!info || info.pointerId !== e.pointerId) return;
        const from = info.idx;
        const to = overIdx;
        if (to !== null && to !== from) {
            setImages((prev) => {
                const next = [...prev];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        }
        dragInfo.current = null;
        setDraggedIdx(null);
        setOverIdx(null);
    };

    const recommendedW = splitCols * EXPORT_TILE_W;
    const recommendedH = splitRows * EXPORT_TILE_H;
    const isLowRes = !!splitImageDims && splitImageDims.w < recommendedW * 0.9;

    const renderOrderOverlay = () => {
        const total = splitCols * splitRows;
        return (
            <div
                className="absolute inset-0 grid pointer-events-none"
                style={{ gridTemplateColumns: `repeat(${splitCols}, 1fr)`, gridTemplateRows: `repeat(${splitRows}, 1fr)` }}
            >
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className="border border-white/30 flex items-end justify-end p-1">
                        <span className="text-white text-[9px] font-black bg-black/65 rounded px-1 leading-tight">
                            {total - i}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // The preview mockup simulates 3 columns on mobile and 4 on desktop web
    // (desktop is actually responsive, 4-6 depending on window width — 4 is
    // representative). This is cosmetic only: the splitter itself always
    // targets mobile's fixed 3 columns, since that's the only layout a
    // mosaic split can reliably line up against.
    const feedCols = previewDevice === "desktop" ? desktopPreviewCols : MOBILE_PREVIEW_COLUMNS;
    const remainder = images.length % feedCols;
    const padCount = images.length === 0 ? 0 : (remainder === 0 ? 0 : feedCols - remainder);

    return (
        <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
            <style>{GLOBAL_STYLES}</style>

            {/* Hidden inputs */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />
            <input
                ref={splitInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSplitSourceChange}
            />
            <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={handleProfileUpload} />

            {/* Header */}
            <header className="max-w-5xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6 flex items-center justify-between relative z-10">
                <Link
                    href="/tools"
                    className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                >
                    <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-[10px] sm:text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0_#000]" style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
                        AN
                    </div>
                    <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
                        IG Grid Planner
                    </span>
                </div>
            </header>

            {/* Device Switcher Toggle Bar */}
            <div className="max-w-5xl mx-auto px-3 sm:px-6 mb-3 flex flex-col items-center gap-3 relative z-10">
                <div className="flex justify-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setPreviewDevice("mobile")}
                        className={`ig-btn px-4 py-2 border-2 border-black rounded-xl font-bold text-[10px] sm:text-xs shadow-[2.5px_2.5px_0_#000] flex items-center gap-1.5 transition-all ${previewDevice === "mobile" ? "bg-[#fde047] text-black" : "bg-white text-zinc-500 hover:text-black"
                            }`}
                    >
                        <ImageIcon size={12} strokeWidth={2.5} /> MOBILE PREVIEW
                    </button>
                    <button
                        onClick={() => setPreviewDevice("desktop")}
                        className={`ig-btn px-4 py-2 border-2 border-black rounded-xl font-bold text-[10px] sm:text-xs shadow-[2.5px_2.5px_0_#000] flex items-center gap-1.5 transition-all ${previewDevice === "desktop" ? "bg-[#fde047] text-black" : "bg-white text-zinc-500 hover:text-black"
                            }`}
                    >
                        <Globe size={12} strokeWidth={2.5} /> DESKTOP PREVIEW
                    </button>
                </div>

                {/* Desktop web is responsive — let people preview the two most
                    common widths instead of guessing one fixed column count. */}
                {previewDevice === "desktop" && (
                    <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0_#000]">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Columns</span>
                        {COLUMN_OPTIONS.map((n) => (
                            <button
                                key={n}
                                onClick={() => setDesktopPreviewCols(n)}
                                className={`ig-btn px-3 py-1 rounded-md text-[11px] font-bold transition-all ${desktopPreviewCols === n ? "bg-black text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <main className="max-w-5xl mx-auto px-3 sm:px-6 flex flex-col items-center mt-2 relative z-10">

                {/* ── Planner Workspace Mockup ── */}
                <div className={`w-full bg-white border-2 sm:border-[4px] border-black overflow-hidden shadow-[6px_6px_0_#000] sm:shadow-[12px_12px_0_#000] relative transition-all duration-300 ${previewDevice === "mobile" ? "max-w-[390px] rounded-3xl sm:rounded-[3rem]" : "max-w-[700px] rounded-2xl sm:rounded-[2rem]"
                    }`}>

                    {/* Mobile Status Bar */}
                    {previewDevice === "mobile" && (
                        <div className="h-12 w-full bg-white flex justify-between items-center px-6 z-20 relative border-b border-zinc-100">
                            <div className="text-[11px] font-bold text-black select-none">9:41</div>
                            <div className="absolute left-1/2 -translate-x-1/2 top-3 w-[84px] h-[18px] bg-black rounded-full flex items-center justify-between px-2.5">
                                <div className="w-[5px] h-[5px] rounded-full bg-zinc-800"></div>
                                <div className="w-[4px] h-[4px] rounded-full bg-zinc-900"></div>
                            </div>
                            <div className="flex items-center gap-1.5 text-black select-none">
                                <div className="flex items-end gap-[1.5px] h-[8px] mt-[1px]">
                                    <div className="w-[2px] h-[2px] bg-black rounded-[0.5px]"></div>
                                    <div className="w-[2px] h-[4px] bg-black rounded-[0.5px]"></div>
                                    <div className="w-[2px] h-[6px] bg-black rounded-[0.5px]"></div>
                                    <div className="w-[2px] h-[8px] bg-black/40 rounded-[0.5px]"></div>
                                </div>
                                <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 20h.01M5 13a11 11 0 0 1 14 0M8.5 16.5a6 6 0 0 1 7 0" />
                                </svg>
                                <div className="w-[15px] h-[8.5px] border border-black rounded-[2.5px] p-[1px] flex items-center relative">
                                    <div className="h-full w-full bg-black rounded-[1px]"></div>
                                    <div className="absolute -right-[2.5px] top-[2.5px] w-[1px] h-[3.5px] bg-black rounded-r-[1px]"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Browser Window Controls */}
                    {previewDevice === "desktop" && (
                        <div className="flex px-6 py-3 border-b-2 border-black bg-zinc-50 items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-black" />
                            <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-black" />
                            <span className="w-3 h-3 rounded-full bg-[#10B981] border border-black" />
                            <span className="text-xs font-bold text-zinc-400 ml-4 font-mono select-none">instagram.com/{username}</span>
                        </div>
                    )}

                    {/* Instagram Header (mobile) */}
                    {previewDevice === "mobile" && (
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-white">
                            <div className="flex items-center gap-1.5 font-bold tracking-tight">
                                <span className="text-zinc-500 text-xs font-semibold">@</span>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-transparent outline-none w-36 border-b border-transparent focus:border-zinc-300 text-black font-bold text-sm tracking-tight focus:bg-zinc-50 focus:px-2 focus:py-0.5 focus:rounded transition-all"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="flex items-center gap-4 text-black">
                                <div className="w-5 h-5 border border-black rounded-[4px] flex items-center justify-center cursor-pointer hover:bg-zinc-50">
                                    <div className="w-2.5 h-0.5 bg-black relative">
                                        <div className="w-0.5 h-2.5 bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                    </div>
                                </div>
                                <div className="w-5 h-[3px] bg-black rounded-full relative shadow-[0_6px_0_black,0_-6px_0_black] cursor-pointer hover:bg-zinc-850"></div>
                            </div>
                        </div>
                    )}

                    {/* Profile Details */}
                    {previewDevice === "mobile" ? (
                        <div className="flex flex-col px-4 py-5 bg-white border-b border-zinc-100">
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer shrink-0" onClick={() => profileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-zinc-50 flex items-center justify-center relative">
                                            {profilePic ? (
                                                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-zinc-500 hover:text-black">
                                                    <Camera size={20} className="text-zinc-500" />
                                                    <span className="text-[7px] mt-0.5 font-bold uppercase tracking-wider text-zinc-500">Upload</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Camera size={18} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-around text-black">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-base leading-none text-black">{images.length}</span>
                                        <span className="text-[10px] text-zinc-500 mt-1">posts</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-base leading-none text-black">1.2K</span>
                                        <span className="text-[10px] text-zinc-500 mt-1">followers</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-base leading-none text-black">248</span>
                                        <span className="text-[10px] text-zinc-500 mt-1">following</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-transparent text-xs text-black outline-none resize-none border border-transparent focus:border-zinc-200 focus:bg-zinc-50 focus:p-2.5 focus:rounded-xl transition-all break-words leading-relaxed"
                                    rows={3}
                                    spellCheck={false}
                                    placeholder="Edit biography..."
                                />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all text-black font-semibold text-xs rounded-lg">
                                    Edit Profile
                                </button>
                                <button className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all text-black font-semibold text-xs rounded-lg">
                                    Share Profile
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-16 px-4 sm:px-16 py-6 sm:py-10 bg-white border-b border-zinc-100 items-center sm:items-start">
                            <div className="relative group cursor-pointer shrink-0" onClick={() => profileInputRef.current?.click()}>
                                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full p-[3px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                                    <div className="w-full h-full rounded-full border-2 sm:border-4 border-white overflow-hidden bg-zinc-50 flex items-center justify-center relative">
                                        {profilePic ? (
                                            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-zinc-500 hover:text-black">
                                                <Camera size={24} className="text-zinc-400 sm:w-9 sm:h-9" />
                                                <span className="text-[7px] sm:text-[9px] mt-0.5 sm:mt-1 font-bold uppercase tracking-wider text-zinc-400">Upload Photo</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera size={20} className="text-white sm:w-6 sm:h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 sm:space-y-5 text-center sm:text-left w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center justify-center sm:justify-start gap-1 font-bold tracking-tight">
                                        <span className="text-zinc-500 text-base sm:text-lg font-bold">@</span>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="bg-transparent outline-none w-32 sm:w-48 border-b border-transparent focus:border-zinc-300 text-black font-semibold text-lg sm:text-xl tracking-tight focus:bg-zinc-50 focus:px-2 focus:py-1 focus:rounded transition-all"
                                            spellCheck={false}
                                        />
                                    </div>
                                    <div className="flex justify-center gap-2">
                                        <button className="px-3 sm:px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all text-black font-semibold text-[10px] sm:text-xs rounded-lg">
                                            Edit Profile
                                        </button>
                                        <button className="px-3 sm:px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all text-black font-semibold text-[10px] sm:text-xs rounded-lg">
                                            Share Profile
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-center sm:justify-start gap-6 sm:gap-10 text-xs sm:text-sm text-black">
                                    <div><span className="font-bold">{images.length}</span> posts</div>
                                    <div><span className="font-bold">1.2K</span> followers</div>
                                    <div><span className="font-bold">248</span> following</div>
                                </div>

                                <div className="w-full">
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full bg-transparent text-sm text-black outline-none resize-none border border-transparent focus:border-zinc-200 focus:bg-zinc-50 focus:p-3 focus:rounded-xl transition-all break-words leading-relaxed"
                                        rows={3}
                                        spellCheck={false}
                                        placeholder="Edit biography..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Tool Workspace ── */}
                    <div className="bg-white min-h-[260px] relative">

                        {/* Persistent tab strip — mirrors Instagram's own Posts/Reels/Tagged
                            tab bar, letting people move freely between the two tools
                            without losing progress in either one. */}
                        <div className="flex border-b border-zinc-100 bg-white">
                            <button
                                onClick={() => setViewMode("feed")}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${viewMode === "feed" ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-black"
                                    }`}
                            >
                                <Grid3X3 size={13} /> Feed{images.length > 0 ? ` (${images.length})` : ""}
                            </button>
                            <button
                                onClick={() => setViewMode("splitter")}
                                className={`relative flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${viewMode === "splitter" ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-black"
                                    }`}
                            >
                                <Scissors size={13} /> Splitter
                                {splitImageSrc && (
                                    <span className="absolute top-2 right-[28%] w-1.5 h-1.5 rounded-full bg-[#fde047] border border-black" title="Split in progress" />
                                )}
                            </button>
                        </div>

                        {/* 2. Image Splitter */}
                        {viewMode === "splitter" && (
                            <div className="bg-white min-h-[220px]">
                                {!splitImageSrc ? (
                                    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[220px]">
                                        <h3 className="text-black font-bold text-sm mb-1">Choose a photo to split</h3>
                                        <p className="text-[11px] text-zinc-500 mb-4 max-w-[260px] leading-relaxed">
                                            Pick a wide, high-resolution landscape photo — it'll be cropped and sliced into {splitCols}-column grid tiles.
                                        </p>
                                        <label
                                            onClick={() => splitInputRef.current?.click()}
                                            className="block w-full max-w-[280px] h-36 border-2 border-dashed border-zinc-300 hover:border-black hover:bg-zinc-50/50 rounded-2xl cursor-pointer transition-all relative flex flex-col items-center justify-center group overflow-hidden bg-zinc-50"
                                        >
                                            <UploadCloud className="text-zinc-400 group-hover:text-black group-hover:scale-110 transition-all mb-2" size={24} />
                                            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black transition-colors">Select Image</span>
                                        </label>
                                    </div>
                                ) : splitResults.length === 0 ? (
                                    /* Configure rows */
                                    <div className="p-4 space-y-4 min-h-[220px] flex flex-col justify-between">
                                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                            <button onClick={choosePhotoAgain} className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-black">
                                                <RotateCcw size={12} /> Choose a different photo
                                            </button>
                                        </div>

                                        <div className={`flex gap-6 items-start justify-center ${previewDevice === "mobile" ? "flex-col" : "flex-row"}`}>
                                            {/* Live numbered preview */}
                                            <div className={`shrink-0 ${previewDevice === "mobile" ? "w-full" : "w-1/2"}`}>
                                                <div
                                                    className="rounded-xl overflow-hidden bg-zinc-50 relative shadow-inner border border-zinc-200"
                                                    style={{ aspectRatio: `${splitCols * 3} / ${splitRows * 4}` }}
                                                >
                                                    <img src={splitImageSrc} alt="Source" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/30 pointer-events-none">
                                                        {renderOrderOverlay()}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 mt-1.5 text-center leading-relaxed">
                                                    Numbers show upload order — post #1 first, the last number goes up last.
                                                </p>
                                            </div>

                                            {/* Controls */}
                                            <div className={`w-full ${previewDevice === "mobile" ? "space-y-4" : "w-1/2 space-y-4"}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Columns</span>
                                                    <div className="flex gap-1">
                                                        {COLUMN_OPTIONS.map(n => (
                                                            <button key={n} onClick={() => setSplitCols(n)} className={`w-7 h-7 rounded text-xs font-bold transition-all ${splitCols === n ? "bg-black text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>{n}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rows</span>
                                                    <div className="flex gap-1">
                                                        {Array.from({ length: MAX_SPLIT_ROWS }, (_, i) => i + 1).map(v => (
                                                            <button key={v} onClick={() => setSplitRows(v)} className={`w-7 h-7 rounded text-xs font-bold transition-all ${splitRows === v ? "bg-black text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>{v}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                                    3 matches mobile's fixed grid — the most reliable choice. 4 matches a typical desktop window, though desktop can flex up to 6 columns on very wide screens. Tiles export as {EXPORT_TILE_W}×{EXPORT_TILE_H}px portrait crops to fill each cell edge-to-edge.
                                                </p>
                                             </div>
                                        </div>

                                        <button onClick={confirmSplit} disabled={isSplitting} className="ig-btn w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#fde047] hover:bg-[#fde047]/90 border-2 border-black shadow-[2px_2px_0_#000] disabled:opacity-50">
                                            {isSplitting ? "Splitting…" : `Split into ${splitCols * splitRows} Images`}
                                        </button>
                                    </div>
                                ) : (
                                    /* Success */
                                    <div className="p-4 space-y-4 min-h-[220px] flex flex-col justify-between">
                                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                            <button onClick={() => setSplitResults([])} className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-black">
                                                <ArrowLeft size={12} /> Adjust rows
                                            </button>
                                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> Split complete</span>
                                        </div>

                                        <div className={`flex gap-6 items-center justify-center ${previewDevice === "mobile" ? "flex-col" : "flex-row"}`}>
                                            <div className="grid gap-1 bg-zinc-100 p-3 rounded-xl border border-zinc-200 w-full max-w-[200px] shrink-0" style={{ gridTemplateColumns: `repeat(${splitCols}, minmax(0, 1fr))` }}>
                                                {splitResults.map((img, i) => (
                                                    <div key={img.id} className="aspect-[3/4] relative rounded overflow-hidden border border-zinc-300">
                                                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute top-0.5 left-0.5 px-1 bg-black/75 rounded text-[7px] font-bold text-white">
                                                            #{splitResults.length - i}
                                                        </div>
                                                        <a
                                                            href={img.url}
                                                            download={`${splitResults.length - i}-of-${splitResults.length}.jpg`}
                                                            className="absolute bottom-0.5 right-0.5 p-1 bg-black/70 hover:bg-black text-white rounded transition-colors duration-150 flex items-center justify-center cursor-pointer"
                                                            title="Download individual tile"
                                                        >
                                                            <Download size={8} />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={`w-full ${previewDevice === "mobile" ? "space-y-2" : "flex-1 space-y-3"}`}>
                                                <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                                                    Upload starting from <strong className="text-black">#1</strong>. Each new post pushes older ones down, so the last number ends up top-left, posted last.
                                                </p>
                                                <button onClick={handleDownloadZip} disabled={isZipping} className="w-full py-2.5 bg-black text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                                    {isZipping ? "Zipping…" : <><Package size={14} /> Download ZIP</>}
                                                </button>
                                                <button onClick={addSplitImagesToGrid} className="w-full py-2.5 bg-[#fde047] border-black shadow-[2px_2px_0_#000] text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                                    <CheckCircle size={14} /> Add to Feed Planner
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Feed */}
                        {viewMode === "feed" && (
                            <div>
                                {images.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[220px]">
                                        <UploadCloud size={26} className="text-zinc-300 mb-3" />
                                        <h4 className="font-bold text-sm mb-1">No posts yet</h4>
                                        <p className="text-xs text-zinc-500 max-w-[260px] mb-5 leading-relaxed">
                                            Upload the photos you're planning to post, then drag the grip handle on each tile to reorder them.
                                        </p>
                                        <button onClick={() => fileInputRef.current?.click()} className="ig-btn px-5 py-2.5 bg-[#fde047] border-2 border-black rounded-xl text-xs font-bold shadow-[2px_2px_0_#000] flex items-center gap-2">
                                            <UploadCloud size={14} /> Upload Photos
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`grid gap-[2px] bg-zinc-200 p-0 ${feedCols === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                                            {images.map((img, idx) => (
                                                <div
                                                    key={img.id}
                                                    data-tile-idx={idx}
                                                    className={`ig-tile group aspect-[3/4] relative transition-all duration-150 ${draggedIdx === idx ? "opacity-40 scale-95 z-20" : ""
                                                        } ${overIdx === idx && draggedIdx !== null && draggedIdx !== idx ? "ring-2 ring-[#fde047] ring-inset scale-[0.97] z-10" : ""}`}
                                                >
                                                    <img src={img.url} alt="" className="w-full h-full object-cover pointer-events-none select-none" />

                                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white">
                                                        {idx + 1}
                                                    </div>

                                                    <button
                                                        onClick={() => removeImage(img.id)}
                                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-black flex items-center justify-center text-black hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <X size={12} strokeWidth={2.5} />
                                                    </button>

                                                    <a
                                                         href={img.url}
                                                         download={`feed-post-${idx + 1}.jpg`}
                                                         className="absolute bottom-1 left-1 w-7 h-7 rounded-md bg-black/60 hover:bg-black active:bg-black/80 flex items-center justify-center text-white cursor-pointer transition-colors"
                                                         title="Download individual photo"
                                                     >
                                                         <Download size={12} />
                                                     </a>

                                                    <div
                                                        className="ig-handle absolute bottom-1 right-1 w-7 h-7 rounded-md bg-black/60 active:bg-black/80 flex items-center justify-center text-white cursor-grab active:cursor-grabbing"
                                                        onPointerDown={(e) => handleHandlePointerDown(e, idx)}
                                                        onPointerMove={handleHandlePointerMove}
                                                        onPointerUp={finishDrag}
                                                        onPointerCancel={finishDrag}
                                                        title="Drag to reorder"
                                                    >
                                                        <GripVertical size={14} />
                                                    </div>
                                                </div>
                                            ))}

                                            {Array.from({ length: padCount }).map((_, i) => (
                                                <div
                                                    key={`empty-${i}`}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-[3/4] bg-zinc-50 border border-zinc-150 flex flex-col items-center justify-center text-zinc-300 hover:text-black hover:bg-zinc-100/50 cursor-pointer transition-all gap-1.5"
                                                >
                                                    <UploadCloud size={16} strokeWidth={2} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">Add Post</span>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-center text-[10px] text-zinc-400 px-3 pt-2.5 leading-relaxed">
                                            Position 1 (top-left) is what visitors see first — drag the <GripVertical size={9} className="inline -mt-0.5" /> handle to reorder.
                                        </p>

                                        <div className="flex gap-2 p-3 bg-zinc-50 border-t border-zinc-150">
                                            <button
                                                onClick={() => { choosePhotoAgain(); setViewMode("splitter"); }}
                                                className="flex-1 py-2.5 bg-white border-2 border-black hover:bg-zinc-50 text-black font-bold text-[9px] sm:text-xs whitespace-nowrap px-1 sm:px-2 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 shadow-[1.5px_1.5px_0_#000] ig-btn"
                                            >
                                                <Scissors size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /> SPLIT ANOTHER IMAGE
                                            </button>
                                            <button
                                                onClick={handleDownloadFeedZip}
                                                disabled={isZipping}
                                                className="flex-1 py-2.5 bg-[#fde047] border-2 border-black hover:bg-[#fde047]/90 text-black font-bold text-[9px] sm:text-xs whitespace-nowrap px-1 sm:px-2 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 shadow-[1.5px_1.5px_0_#000] ig-btn disabled:opacity-60"
                                            >
                                                {isZipping ? "Zipping…" : <><Package size={12} className="sm:w-3.5 sm:h-3.5" /> DOWNLOAD ALL AS ZIP</>}
                                            </button>
                                            <button
                                                onClick={clearAll}
                                                className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200"
                                                title="Clear All"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ─── RECOMMENDED DIMENSIONS SECTION ─── */}
            <div className="max-w-5xl mx-auto mt-16 px-6 relative z-10 w-full">
                <div className="bg-[#FAF0E6] border-2 border-black rounded-[2.5rem] p-8 md:p-12 text-center shadow-[8px_8px_0_#000]">
                    <h3 className="ig-display text-2xl sm:text-3xl font-black text-[#3B2256] mb-3">Best Grid Dimensions & Image Sizes for Instagram</h3>
                    <p className="text-xs sm:text-sm text-[#72626D] font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Looking to design a custom grid template or puzzle banner yourself? Use these recommended resolution guidelines for high-quality, crisp posts:
                    </p>

                    <div className="flex flex-wrap md:flex-nowrap justify-between gap-6 md:gap-4 items-start text-center">
                        {[
                            { label: "3x1 Grid", dims: "3240 x 1440px", cols: 3, rows: 1 },
                            { label: "3x2 Grid", dims: "3240 x 2880px", cols: 3, rows: 2 },
                            { label: "3x3 Grid", dims: "3240 x 4320px", cols: 3, rows: 3 },
                            { label: "3x4 Grid", dims: "3240 x 5760px", cols: 3, rows: 4 },
                            { label: "3x5 Grid", dims: "3240 x 7200px", cols: 3, rows: 5 },
                            { label: "3x6 Grid", dims: "3240 x 8640px", cols: 3, rows: 6 },
                        ].map((grid, i) => (
                            <button
                                key={i}
                                onClick={() => { setSplitCols(grid.cols as 3 | 4); setSplitRows(grid.rows); setViewMode("splitter"); }}
                                className="flex flex-col items-center flex-1 min-w-[120px] transition-all hover:scale-[1.02] duration-200"
                            >
                                <span className="font-bold text-base sm:text-lg text-[#3B2256] tracking-tight">{grid.label}</span>
                                <span className="text-[10px] sm:text-xs text-[#72626D] font-medium mt-1 tracking-wide">{grid.dims}</span>

                                <div
                                    className="grid gap-[3px] mt-6 w-full max-w-[80px]"
                                    style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
                                >
                                    {Array.from({ length: grid.cols * grid.rows }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-[3/4] border-2 border-black bg-white rounded-md shadow-sm"
                                        />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── SEO RICH TEXT SECTION ─── */}
            <div className="max-w-5xl mx-auto mt-24 p-8 sm:p-12 bg-white border-2 border-black rounded-[2.5rem] text-left relative overflow-hidden text-black shadow-[8px_8px_0_#000] z-10">
                <div className="relative z-10 space-y-12">
                    <div className="flex flex-wrap justify-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-white text-[10px] font-black text-black uppercase tracking-wider shadow-[2px_2px_0_#000]">
                            <ShieldCheck size={11} className="text-[#fde047]" strokeWidth={3} /> 100% In-Browser Privacy
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-white text-[10px] font-black text-black uppercase tracking-wider shadow-[2px_2px_0_#000]">
                            <Sparkles size={11} className="text-orange-400" strokeWidth={3} /> Free & Unlimited
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-white text-[10px] font-black text-black uppercase tracking-wider shadow-[2px_2px_0_#000]">
                            <Lock size={11} className="text-blue-500" strokeWidth={3} /> No Login Required
                        </span>
                    </div>

                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="ig-display text-3xl sm:text-4xl font-black tracking-tight text-black leading-tight">
                            Free <span className="bg-[#fde047] px-2 py-0.5 border border-black inline-block rounded shadow-[2px_2px_0_#000]">Instagram Grid Planner</span> Online & Profile Simulator
                        </h2>
                        <p className="text-sm text-zinc-700 leading-relaxed font-semibold">
                            Organize your social feed layout visually with AssetNest's private, browser-based <strong className="text-black">instagram-grid-planner</strong>. Drag, drop, and rearrange individual posts or slice landscape images into perfect grids to create an aesthetic layout. Use this <strong className="text-black">free instagram planner</strong> to <strong className="text-black">plan instagram feed</strong> elements effortlessly. No accounts or password connections required.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {[
                            {
                                title: "Interactive Feed Layout Planner",
                                desc: "Design a visually balanced grid in real-time. Drag tiles to organize themes, color palettes, and photo flows to perfect your instagram feed layout and ig feed layout before you publish.",
                                icon: <Layers size={16} strokeWidth={2.5} />
                            },
                            {
                                title: "Mobile & Desktop Grid Splitter",
                                desc: "Looking for an instagram grid planner desktop or instagram layout planner desktop tool? Slice wide landscapes into 3-column or 4-column templates for your instagram planning grid.",
                                icon: <Scissors size={16} strokeWidth={2.5} />
                            },
                            {
                                title: "Live Bio & Profile Mockup",
                                desc: "Test custom usernames and bio text locally. Experience a live instagram feed free simulator to preview exactly how new posts appear alongside your header elements.",
                                icon: <Camera size={16} strokeWidth={2.5} />
                            },
                            {
                                title: "100% Safe Browser Sandbox",
                                desc: "Your photos and profile configurations are processed locally inside browser RAM using HTML5 canvas. This instagram layout online tool uploads nothing to servers.",
                                icon: <ShieldCheck size={16} strokeWidth={2.5} />
                            },
                            {
                                title: "Numbered ZIP Exports",
                                desc: "Wrap split banner segments in a numbered ZIP file based on correct upload sequence. Download your instagram grid template free online instantly and upload stress-free.",
                                icon: <Package size={16} strokeWidth={2.5} />
                            },
                            {
                                title: "Free with Zero Account Linkage",
                                desc: "Forget sharing credentials or linking third-party apps. Enjoy this instagram planner free tool, plan instagram free, or utilize it as a free ig planner without subscription limits.",
                                icon: <Lock size={16} strokeWidth={2.5} />
                            }
                        ].map((f, i) => (
                            <div key={i} className="p-6 bg-zinc-50 border-2 border-black rounded-3xl transition-all duration-350 shadow-[3px_3px_0_#000] hover:shadow-[5px_5px_0_#000] hover:-translate-y-0.5">
                                <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black mb-4 shadow-[1.5px_1.5px_0_#000]">
                                    {f.icon}
                                </div>
                                <h4 className="ig-display text-sm font-black text-black mb-2">{f.title}</h4>
                                <p className="text-xs text-zinc-600 leading-relaxed font-semibold">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-black pt-10">
                        <h3 className="ig-display text-xl sm:text-2xl font-black text-black text-center mb-8 tracking-tight">
                            How to Plan & Split Your Instagram Feed
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: "1", title: "Add Your Media Assets", desc: "Drag and drop standard photo formats into the workspace. If splitting, choose a high-resolution landscape photo to slice." },
                                { step: "2", title: "Design Feed & Profile Layout", desc: "Rearrange tiles inside the mobile mock frame until your grid layout is cohesive. Test custom username and bio text." },
                                { step: "3", title: "Export Slices and Post", desc: "Download the sorted grid zip file and upload the numbered photos in order to build your perfect grid." }
                            ].map((s) => (
                                <div key={s.step} className="relative p-6 bg-zinc-50 border-2 border-black rounded-3xl pt-8 shadow-[3px_3px_0_#000]">
                                    <div className="absolute -top-3.5 left-6 w-8 h-8 rounded-full bg-[#fde047] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0_#000]">
                                        {s.step}
                                    </div>
                                    <h4 className="ig-display text-sm font-black text-black mb-2">{s.title}</h4>
                                    <p className="text-xs text-zinc-600 leading-relaxed font-semibold">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t-2 border-black pt-10">
                        <h3 className="ig-display text-xl sm:text-2xl font-black text-black text-center mb-2 tracking-tight">
                            AssetNest Grid Planner vs. Traditional Feed Apps
                        </h3>
                        <p className="text-xs text-zinc-500 font-semibold text-center mb-8 max-w-lg mx-auto">
                            See why our local-first layout tool is safer, faster, and more private than typical social planners.
                        </p>
                        <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]">
                            <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                <thead>
                                    <tr className="bg-zinc-50 border-b-2 border-black">
                                        <th className="p-4 text-black font-black uppercase tracking-wider">Feature capability</th>
                                        <th className="p-4 text-black font-black bg-[#fde047]/30 border-l-2 border-black uppercase tracking-wider">AssetNest Local Grid Planner</th>
                                        <th className="p-4 text-zinc-500 font-bold uppercase tracking-wider border-l-2 border-black">Cloud Planners / Mobile Apps</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black">
                                    {[
                                        { feat: "Privacy & Data Safety", ours: "100% Private (files processed in RAM, never stored)", other: "Risky (requires image uploads or database storage)" },
                                        { feat: "Instagram Account Link", ours: "No login or passwords needed (anonymous)", other: "Mandatory account linking or Facebook integrations" },
                                        { feat: "Desktop Optimization", ours: "Full support as a desktop instagram planner free & instagram planner free desktop tool", other: "Locked to mobile apps, lacking grid planning instagram options for browsers" },
                                        { feat: "Grid Slicing Accuracy", ours: "3 or 4-column splits sized to Instagram's actual grid shape", other: "Often allows mismatched column counts that don't line up" },
                                        { feat: "Subscription Restrictions", ours: "Unlimited planning, zero watermark exports, free forever", other: "Limited free grids, recurring fees, and ad placements" }
                                    ].map((row, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="p-4 text-black font-bold border-r-2 border-black">{row.feat}</td>
                                            <td className="p-4 text-black font-bold bg-[#fde047]/10 border-r-2 border-black">{row.ours}</td>
                                            <td className="p-4 text-zinc-500">{row.other}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border-t-2 border-black pt-10">
                        <h3 className="ig-display text-xl sm:text-2xl font-black text-black text-center mb-8 tracking-tight">
                            Instagram Grid Planner FAQ
                        </h3>
                        <LocalAccordion>
                            <LocalAccordionItem title="How does the free instagram grid planner keep my images private?">
                                Our layout tool runs completely client-side in your browser cache. All image adjustments, slicing, and profile customizations are handled inside your local RAM and canvas space. No data is sent to external servers or logged anywhere.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Can I use this as a desktop instagram grid planner or instagram planner online?">
                                Yes! This tool is optimized to serve as an instagram grid planner desktop free tool, a desktop instagram feed planner, and a free instagram feed planner desktop helper. It runs seamlessly on any browser, making it the perfect instagram feed planner for desktop creators.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Is this really a free instagram feed planner?">
                                Yes. AssetNest offers this instagram grid planner free tool with absolutely no premium paywalls, watermarks, or account signups. It is designed to be the ultimate instagram grid planner online free utility, helping creators plan instagram feed layouts without subscriptions.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="Should I split into 3 or 4 columns using the ig grid planner?">
                                Instagram's mobile app always displays posts in 3 fixed columns, making it the safest choice for mobile-optimized feeds. However, our ig feed planner free and free ig feed planner utility also supports 4-column desktop simulations, giving you full control over how you preview and organize your layouts.
                            </LocalAccordionItem>
                            <LocalAccordionItem title="How does the instagram feed preview online free ordering work?">
                                Because Instagram displays uploaded posts starting from the bottom right, your split grid slices must be uploaded in reverse. Our free instagram planning utility numbers the files inside your ZIP export sequentially based on their correct upload order, ensuring your feed preview translates perfectly to your live profile.
                            </LocalAccordionItem>
                        </LocalAccordion>
                    </div>
                </div>
            </div>

            {/* Confirm dialog */}
            {confirmState && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmState(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0_#000] max-w-sm w-full p-6">
                        <h4 className="font-black text-sm mb-2">{confirmState.title}</h4>
                        <p className="text-xs text-zinc-600 mb-5 leading-relaxed">{confirmState.message}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmState(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                {confirmState.confirmLabel ?? "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="ig-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-black text-white text-xs font-bold rounded-full shadow-lg max-w-[90vw] text-center">
                    {toast}
                </div>
            )}

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Instagram Grid Planner">
                <div className="space-y-4">
                    <h3 className="text-lg font-black ig-display text-black">Instagram Grid Planner</h3>
                    <p className="text-xs leading-relaxed text-zinc-700">
                        The Instagram Grid Planner helps you preview your grid layout before publishing it live on Instagram. Add your photos, drag them around, customize your bio, and design beautiful grid spreads using the built-in image splitter.
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-700 font-bold">
                        All files and edits are processed locally in your browser. No login, no servers, 100% private.
                    </p>
                </div>
            </HelpModal>
        </div>
    );
}