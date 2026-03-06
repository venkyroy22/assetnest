"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Image as ImageIcon, UploadCloud, GripHorizontal,
    X, Download, Trash2, Maximize2, Camera, Scissors, Grid3X3,
    Info, DownloadCloud, Package, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JSZip from "jszip";

interface GridImage {
    id: string;
    url: string;
    file?: File;
}

export default function IGGridPlannerPage() {
    const [images, setImages] = useState<GridImage[]>([]);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Split Image State
    const [splitModalOpen, setSplitModalOpen] = useState(false);
    const [splitImageSrc, setSplitImageSrc] = useState<string | null>(null);
    const [splitCols, setSplitCols] = useState(3);
    const [splitRows, setSplitRows] = useState(3);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitResults, setSplitResults] = useState<GridImage[]>([]);
    const [isZipping, setIsZipping] = useState(false);
    const splitInputRef = useRef<HTMLInputElement>(null);

    // Profile Mock State
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [username, setUsername] = useState("your.username");
    const [bio, setBio] = useState("Welcome to my awesome Instagram grid planner! 🎉\nPlanning my next big posts right here.");
    const profileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: GridImage[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            url: URL.createObjectURL(file),
            file
        }));

        // Insert at the beginning so they appear at the "top" of the feed
        setImages((prev) => [...newImages, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePic(URL.createObjectURL(file));
    };

    const handleSplitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSplitImageSrc(URL.createObjectURL(file));
        setSplitResults([]);
        setSplitModalOpen(true);
        if (splitInputRef.current) splitInputRef.current.value = "";
    };

    const confirmSplit = async () => {
        if (!splitImageSrc) return;
        setIsSplitting(true);

        try {
            const img = new Image();
            img.src = splitImageSrc;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            const targetRatio = splitCols / splitRows;
            const imgRatio = img.width / img.height;

            let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height;

            if (imgRatio > targetRatio) {
                // Image is wider than target
                sourceW = img.height * targetRatio;
                sourceX = (img.width - sourceW) / 2;
            } else {
                // Image is taller than target
                sourceH = img.width / targetRatio;
                sourceY = (img.height - sourceH) / 2;
            }

            const sliceW = sourceW / splitCols;
            const sliceH = sourceH / splitRows;

            canvas.width = sliceW;
            canvas.height = sliceH;

            const newImages: GridImage[] = [];

            for (let r = 0; r < splitRows; r++) {
                for (let c = 0; c < splitCols; c++) {
                    ctx.clearRect(0, 0, sliceW, sliceH);
                    ctx.drawImage(
                        img,
                        sourceX + c * sliceW, sourceY + r * sliceH, sliceW, sliceH,
                        0, 0, sliceW, sliceH
                    );

                    const blob = await new Promise<Blob | null>(req => canvas.toBlob(req, "image/jpeg", 0.9));
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
        } finally {
            setIsSplitting(false);
        }
    };

    const handleDownloadZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const total = splitResults.length;

            const promises = splitResults.map(async (res, i) => {
                const response = await fetch(res.url);
                const blob = await response.blob();
                // Numbering sequentially, but post order physically follows reverse.
                // It helps organizing by adding the posting order number.
                const postOrder = total - i;
                zip.file(`slice_${String(i + 1).padStart(2, '0')}_post_order_${String(postOrder).padStart(2, '0')}.jpg`, blob);
            });

            await Promise.all(promises);
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `instagram_grid_${splitCols}x${splitRows}.zip`;
            a.click();
        } catch (err) {
            console.error(err);
        } finally {
            setIsZipping(false);
        }
    };

    const addSplitImagesToGrid = () => {
        setImages(prev => [...splitResults, ...prev]);
        setSplitModalOpen(false);
        setSplitResults([]);
        setSplitImageSrc(null);
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const clearAll = () => {
        if (confirm("Are you sure you want to clear your entire grid?")) {
            setImages([]);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Slightly delay hiding the dragged element so the drag ghost is visible
        setTimeout(() => {
            const el = document.getElementById(`grid-item-${index}`);
            if (el) el.style.opacity = "0.4";
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setHoveredIdx(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null) return;

        const newImages = [...images];
        const draggedImage = newImages[draggedIdx];

        // Remove from old pos
        newImages.splice(draggedIdx, 1);
        // Insert at new pos
        newImages.splice(index, 0, draggedImage);

        setImages(newImages);
        setHoveredIdx(null);
        setDraggedIdx(null);
    };

    const handleDragEnd = (index: number) => {
        setDraggedIdx(null);
        setHoveredIdx(null);
        const el = document.getElementById(`grid-item-${index}`);
        if (el) el.style.opacity = "1";
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-400 font-sans pb-24">
            {/* Header */}
            <header className="max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
                <Link
                    href="/tools"
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> back to tools
                </Link>
                <div className="flex items-center gap-3 relative mr-8 sm:mr-0 z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-[0_0_20px_rgba(236,72,153,0.4)]" style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
                        AN
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
                        IG Grid Planner
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start mt-8">

                {/* ── Left Side: Planner Workspace ── */}
                <div className="w-full max-w-[450px] mx-auto lg:mx-0 bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    {/* Fake phone notch area */}
                    <div className="h-14 w-full bg-black border-b border-zinc-900 flex justify-between items-center px-8 z-20 relative">
                        <div className="text-[11px] font-bold text-white">9:41</div>
                        <div className="w-32 h-6 bg-zinc-900 rounded-full"></div>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                        </div>
                    </div>

                    {/* App Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
                        <div className="flex items-center gap-1 font-bold text-white tracking-tight">
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-transparent outline-none w-32 border-none focus:bg-zinc-900 focus:px-2 focus:rounded transition-all"
                                spellCheck={false}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-5 h-5 border-2 border-white rounded-[6px] flex items-center justify-center">
                                <div className="w-2.5 h-0.5 bg-white relative">
                                    <div className="w-0.5 h-2.5 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                </div>
                            </div>
                            <div className="w-5 h-[3px] bg-white rounded-full relative shadow-[0_6px_0_white,0_-6px_0_white]"></div>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                                <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900 flex items-center justify-center relative">
                                        {profilePic ? (
                                            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={24} className="text-zinc-600" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={handleProfileUpload} />
                            </div>

                            <div className="flex-1 flex items-center justify-around">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">{images.length}</span>
                                    <span className="text-[11px] text-zinc-400">posts</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">1.2M</span>
                                    <span className="text-[11px] text-zinc-400">followers</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-white text-lg">42</span>
                                    <span className="text-[11px] text-zinc-400">following</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-transparent text-sm text-zinc-200 outline-none resize-none border-none focus:bg-zinc-900 focus:p-2 focus:rounded transition-all break-words"
                                rows={3}
                                spellCheck={false}
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition-colors text-white font-semibold text-sm rounded-lg border border-zinc-800">
                                Edit profile
                            </button>
                            <button className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition-colors text-white font-semibold text-sm rounded-lg border border-zinc-800">
                                Share profile
                            </button>
                        </div>
                    </div>

                    {/* Grid Tabs */}
                    <div className="flex border-t border-zinc-900 mt-2">
                        <div className="flex-1 flex justify-center py-3 border-t border-white text-white">
                            <svg aria-label="Posts" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21.008" x2="2.992" y1="21.008" y2="2.992"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21.008" x2="2.992" y1="2.992" y2="21.008"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21.008" x2="2.992" y1="9.008" y2="9.008"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21.008" x2="2.992" y1="14.992" y2="14.992"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.008" x2="9.008" y1="21.008" y2="2.992"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.992" x2="14.992" y1="21.008" y2="2.992"></line></svg>
                        </div>
                        <div className="flex-1 flex justify-center py-3 text-zinc-600">
                            <svg aria-label="Reels" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="2.049" x2="21.95" y1="7.002" y2="7.002"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="13.504" x2="16.362" y1="2.001" y2="7.002"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="7.207" x2="10.002" y1="2.11" y2="7.002"></line><path d="M2 12.001v3.449c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.89c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.703 2 8.552z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.13a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>
                        <div className="flex-1 flex justify-center py-3 text-zinc-600">
                            <svg aria-label="Tagged" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h5.259A1.818 1.818 0 0 1 22 6.08v14.104a1.818 1.818 0 0 1-1.818 1.818H3.818A1.818 1.818 0 0 1 2 20.184V6.08a1.818 1.818 0 0 1 1.818-1.818h5.26a1.59 1.59 0 0 0 1.123-.465Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M18.598 22.002V21.4a3.949 3.949 0 0 0-3.948-3.949H9.495A3.949 3.949 0 0 0 5.546 21.4v.603" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><circle cx="12.072" cy="11.075" fill="none" r="3.556" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle></svg>
                        </div>
                    </div>

                    {/* The Grid Workspace */}
                    <div className="bg-black min-h-[300px]">
                        {images.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-4">
                                    <ImageIcon size={24} className="text-zinc-600" />
                                </div>
                                <h3 className="text-white font-bold mb-2">No Posts Yet</h3>
                                <p className="text-xs text-zinc-500 max-w-[250px]">
                                    Use the controls on the right to upload images and start planning your perfect grid.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-[2px]">
                                {images.map((img, idx) => (
                                    <div
                                        key={img.id}
                                        id={`grid-item-${idx}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragEnter={(e) => handleDragEnter(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onDragEnd={() => handleDragEnd(idx)}
                                        className={`aspect-square relative group cursor-grab active:cursor-grabbing transition-transform duration-200 ${hoveredIdx === idx && draggedIdx !== idx
                                            ? "scale-[0.95] z-10 rounded-lg overflow-hidden shadow-2xl ring-2 ring-pink-500"
                                            : "scale-100"
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt=""
                                            className="w-full h-full object-cover pointer-events-none"
                                        />

                                        {/* Hover Controls */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                                            <div className="pointer-events-auto flex items-center gap-2">
                                                <button
                                                    onClick={() => removeImage(img.id)}
                                                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-white/50">
                                                <GripHorizontal size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty padding to let users scroll over the bottom rounded corners */}
                        <div className="h-12 w-full"></div>
                    </div>
                </div>

                {/* ── Right Side: Controls ── */}
                <div className="sticky top-10 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
                                <UploadCloud size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight">Add Photos</h2>
                                <p className="text-xs text-zinc-500">Upload single or multiple images</p>
                            </div>
                        </div>

                        <label className="block w-full h-32 border-2 border-dashed border-zinc-700 hover:border-pink-500 hover:bg-zinc-900/50 rounded-2xl cursor-pointer transition-colors relative flex flex-col items-center justify-center group overflow-hidden bg-zinc-950">
                            <UploadCloud className="text-zinc-600 group-hover:text-pink-500 transition-colors mb-2" size={28} />
                            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Click to upload</span>
                            <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">JPG, PNG, HEIC</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
                                <Scissors size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight">Giant Image Splitter</h2>
                                <p className="text-xs text-zinc-500">Slice a large image into multiple posts</p>
                            </div>
                        </div>

                        <label className="block w-full h-16 border border-zinc-700 hover:border-purple-500 bg-black hover:bg-purple-500/10 rounded-2xl cursor-pointer transition-colors relative flex items-center justify-center group overflow-hidden">
                            <span className="text-sm font-bold text-zinc-400 group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                <Grid3X3 size={16} /> Choose Image to Split
                            </span>
                            <input
                                ref={splitInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleSplitUpload}
                            />
                        </label>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                                <GripHorizontal size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight">Instructions</h2>
                                <p className="text-xs text-zinc-500">How to use the planner</p>
                            </div>
                        </div>

                        <ul className="space-y-4 text-sm text-zinc-400">
                            <li className="flex gap-3 items-start">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 mt-0.5">1</span>
                                <span>Upload multiple photos at once using the area above.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 mt-0.5">2</span>
                                <span>Drag and drop images in the mock phone viewer to reorder them perfectly.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 mt-0.5">3</span>
                                <span>Click on your username, bio, or profile picture to customize the preview.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 mt-0.5">4</span>
                                <span>Hover over any image and click the red trash can to remove it.</span>
                            </li>
                        </ul>
                    </div>

                    {images.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20"
                        >
                            Clear All Images
                        </button>
                    )}
                </div>
            </main>

            {/* ── Split Image Modal ── */}
            {splitModalOpen && splitImageSrc && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-2xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden bg-zinc-950 border-zinc-800">

                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="font-black text-xl uppercase tracking-widest text-purple-500">
                                {splitResults.length > 0 ? "Grid Split Successful!" : "Split Giant Image"}
                            </h3>
                            <button onClick={() => {
                                setSplitModalOpen(false);
                                setSplitResults([]);
                            }} className="text-zinc-500 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-6 pb-4">
                            {splitResults.length === 0 ? (
                                /* Configuration View */
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1 flex flex-col items-center gap-4">
                                        <div className="relative w-full aspect-square border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center bg-black">
                                            <img src={splitImageSrc} className="absolute inset-0 w-full h-full object-contain opacity-50" />

                                            {/* Overlay Grid based on cols/rows */}
                                            <div className="absolute inset-0 flex flex-col">
                                                {Array.from({ length: splitRows }).map((_, r) => (
                                                    <div key={r} className="flex-1 flex border-b border-white/20 last:border-0">
                                                        {Array.from({ length: splitCols }).map((_, c) => (
                                                            <div key={c} className="flex-1 border-r border-white/20 last:border-0" />
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 text-center">
                                            The image will be center-cropped to fit a perfect {splitCols}x{splitRows} aspect ratio, then split into {splitCols * splitRows} squares.
                                        </p>
                                    </div>

                                    <div className="sm:w-64 space-y-6 shrink-0">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-zinc-400">
                                                Columns (Width)
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3, 4].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setSplitCols(v)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${splitCols === v ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"}`}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-zinc-400">
                                                Rows (Height)
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setSplitRows(v)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${splitRows === v ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"}`}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={confirmSplit}
                                            disabled={isSplitting}
                                            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider text-white transition-all bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                                        >
                                            {isSplitting ? "Splitting..." : `Split into ${splitCols * splitRows} Images`}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Success View */
                                <div className="space-y-8">
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 sm:p-5 rounded-xl flex items-start gap-4">
                                        <Info size={24} className="text-purple-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-white font-bold mb-1">How to post to Instagram</h4>
                                            <p className="text-sm text-purple-200">
                                                To make these images assemble perfectly on your Instagram timeline, you must post them in <strong>reverse order</strong>. Download the images, and begin posting from the last file to the first file.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                                        <div
                                            className="grid gap-1 bg-zinc-900 p-2 rounded-lg border border-zinc-800 mx-auto w-[250px] shrink-0"
                                            style={{
                                                gridTemplateColumns: `repeat(${splitCols}, minmax(0, 1fr))`
                                            }}
                                        >
                                            {splitResults.map((img, i) => (
                                                <div key={img.id} className="aspect-square relative group">
                                                    <img src={img.url} className="w-full h-full object-cover rounded shadow-md" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">Post Order</span>
                                                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-xs">
                                                            {splitResults.length - i}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex-1 space-y-4 w-full">
                                            <button
                                                onClick={handleDownloadZip}
                                                disabled={isZipping}
                                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black uppercase tracking-wider text-white transition-all bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                {isZipping ? <span className="animate-spin">◌</span> : <Package size={18} />}
                                                Download all as .ZIP
                                            </button>

                                            <button
                                                onClick={addSplitImagesToGrid}
                                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black uppercase tracking-wider text-white transition-all bg-purple-600 hover:bg-purple-500 border border-purple-500"
                                            >
                                                <CheckCircle size={18} />
                                                Add to Grid Planner
                                            </button>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center">
                                                Or view them in the mock profile to see how it looks.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

