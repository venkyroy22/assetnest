"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import {
    CloudUpload,
    Image as ImageIcon,
    Video,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Loader2,
    Info
} from "lucide-react";

interface UploadedAsset {
    public_id: string;
    secure_url: string;
    resource_type: string;
    format: string;
    width?: number;
    height?: number;
    created_at: string;
}

export default function MediaHubPage() {
    const [assets, setAssets] = useState<UploadedAsset[]>([]);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("an-media-assets");
        if (saved) {
            try {
                setAssets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load assets", e);
            }
        }
        setIsLoading(false);
    }, []);

    const saveAssets = (newAssets: UploadedAsset[]) => {
        setAssets(newAssets);
        localStorage.setItem("an-media-assets", JSON.stringify(newAssets));
    };

    const handleUploadSuccess = (result: any) => {
        const info = result.info;
        const newAsset: UploadedAsset = {
            public_id: info.public_id,
            secure_url: info.secure_url,
            resource_type: info.resource_type,
            format: info.format,
            width: info.width,
            height: info.height,
            created_at: new Date().toISOString()
        };
        saveAssets([newAsset, ...assets]);
    };

    const removeAsset = (publicId: string) => {
        const filtered = assets.filter(a => a.public_id !== publicId);
        saveAssets(filtered);
    };

    if (!mounted) return null;

    const accent = "#ec4899"; // Pink accent to match tools list

    return (
        <div className="min-h-screen bg-black text-white selection:bg-pink-500/30">
            {/* ── Background Grid ── */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(236,72,153,0.05) 1px, transparent 1px)`,
                    backgroundSize: "32px 32px",
                }}
            />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                {/* ── Header ── */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-pink-500/20 bg-pink-500/5 mb-6">
                        <CloudUpload size={14} className="text-pink-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Cloud Storage Integration</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4 leading-none">
                        Media <span className="text-pink-500 italic">Hub</span>
                    </h1>
                    <p className="text-zinc-400 max-w-xl text-sm font-medium leading-relaxed">
                        Securely upload and manage your images and videos with Cloudinary.
                        Files are optimized, cached, and ready for instant delivery across the web.
                    </p>
                </div>

                {/* ── Upload Area ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl">
                            <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                                <CloudUpload size={20} className="text-pink-500" />
                                Upload Files
                            </h2>

                            <CldUploadWidget
                                uploadPreset="ml_default" // Standard default, user should update this
                                onSuccess={handleUploadSuccess}
                            >
                                {({ open }) => (
                                    <button
                                        onClick={() => open()}
                                        className="group relative w-full aspect-square md:aspect-auto md:h-48 border-2 border-dashed border-zinc-800 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-500 rounded-2xl flex flex-col items-center justify-center gap-4 active:scale-95"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 group-hover:bg-pink-500/20 flex items-center justify-center transition-colors">
                                            <CloudUpload className="text-zinc-500 group-hover:text-pink-500 transition-colors" size={28} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Drop files here</p>
                                            <p className="text-[10px] font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1">Images, Videos, PDFs</p>
                                        </div>
                                    </button>
                                )}
                            </CldUploadWidget>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                                    <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                        Make sure you have configured your Cloudinary Upload Preset in the .env file for permanent storage.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl">
                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 font-mono tracking-tighter">
                                Integration Stats
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Total Assets</span>
                                    <span className="text-2xl font-black font-mono">{assets.length}</span>
                                </div>
                                <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Images</span>
                                    <span className="text-2xl font-black font-mono text-pink-500">
                                        {assets.filter(a => a.resource_type === 'image').length}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Videos</span>
                                    <span className="text-2xl font-black font-mono text-blue-500">
                                        {assets.filter(a => a.resource_type === 'video').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Asset Library ── */}
                    <div className="lg:col-span-2">
                        {isLoading ? (
                            <div className="h-96 flex items-center justify-center border border-zinc-800 bg-zinc-900/20 rounded-3xl">
                                <Loader2 size={32} className="text-pink-500 animate-spin" />
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 bg-zinc-900/20 rounded-3xl p-12 text-center group transition-colors hover:border-zinc-700">
                                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform">
                                    <ImageIcon size={32} className="text-zinc-700" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest text-zinc-500 mb-2">No assets yet</h3>
                                <p className="text-sm text-zinc-600 font-medium max-w-xs leading-relaxed">
                                    Your cloud library is empty. Upload your first media asset to see it here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.public_id}
                                        className="group relative bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden hover:border-pink-500/50 transition-all duration-500"
                                    >
                                        <div className="aspect-video relative overflow-hidden bg-black">
                                            {asset.resource_type === 'image' ? (
                                                <CldImage
                                                    width={400}
                                                    height={300}
                                                    src={asset.public_id}
                                                    alt="Uploaded asset"
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                    <Video size={32} className="text-zinc-600" />
                                                </div>
                                            )}

                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                                <a
                                                    href={asset.secure_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform active:scale-95"
                                                    title="Open Original"
                                                >
                                                    <ExternalLink size={20} />
                                                </a>
                                                <button
                                                    onClick={() => removeAsset(asset.public_id)}
                                                    className="p-3 rounded-full bg-red-500 text-white hover:scale-110 transition-transform active:scale-95"
                                                    title="Remove from List"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>

                                            <div className="absolute top-4 left-4">
                                                <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Optimized</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    {asset.public_id.split('/').pop()}
                                                </h4>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded ring-1 ring-zinc-700">
                                                    {asset.format}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-mono text-zinc-500">
                                                <span>{asset.resource_type.toUpperCase()}</span>
                                                {asset.width && <span>{asset.width}x{asset.height}</span>}
                                                <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Features Footer ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-zinc-800/50">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <CloudUpload size={18} className="text-pink-500" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Global Delivery</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">Multi-CDN delivery ensuring your assets load instantly anywhere in the world.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <ImageIcon size={18} className="text-blue-500" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest">AI Optimization</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">Automatic compression and format selection (WebP, AVIF) without losing quality.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Video size={18} className="text-emerald-500" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Video Transcoding</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">Real-time processing for adaptive bitrate streaming and video manipulation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
