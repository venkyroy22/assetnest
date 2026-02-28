"use client";

import React, { useState } from 'react';
import Container from '@/components/Container';
import { Download, Instagram, Loader2, Link2, AlertCircle, Video, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function IgDownloaderPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [media, setMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

    const handleFetch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMedia(null);

        if (!url || !url.includes('instagram.com')) {
            setError("Please enter a valid Instagram URL (e.g., instagram.com/p/...)");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/ig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch media');
            }

            setMedia({ url: data.mediaUrl, isVideo: data.isVideo });
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Instagram may be blocking access.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!media) return;

        try {
            // Because of CORS, we sometimes have to fetch the URL as a blob and force download
            // If CORS fails (likely with IG), we open in new tab as fallback
            const response = await fetch(media.url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `instagram-${Date.now()}.${media.isVideo ? 'mp4' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
            console.error("Direct download failed due to CORS, opening in new tab instead.", e);
            window.open(media.url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800 flex flex-col font-sans relative overflow-hidden">
            {/* Dark Mode Background Splashes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-purple-900/10 via-pink-900/5 to-transparent blur-[100px] pointer-events-none rounded-full" />

            <div className="flex-1 relative z-10 py-20 lg:py-32">
                <Container>
                    {/* Header */}
                    <header className="text-center w-full max-w-2xl mx-auto mb-16 px-4">
                        <div className="inline-flex items-center justify-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-6 shadow-2xl backdrop-blur-xl">
                            <Instagram size={32} className="text-pink-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 leading-tight">
                            InstaFetch
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base lg:text-lg max-w-lg mx-auto leading-relaxed font-medium">
                            Paste an Instagram Reel, Post, or IGTV URL below to instantly extract and download the raw high-quality media file.
                        </p>
                    </header>

                    <div className="max-w-3xl mx-auto flex flex-col gap-8 lg:gap-12 relative">
                        {/* Input Box */}
                        <div className="p-5 lg:p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                            <form onSubmit={handleFetch} className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-full flex-1">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                        <Link2 size={24} />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://www.instagram.com/p/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full bg-black/50 border-2 border-zinc-800 rounded-[2rem] pl-16 pr-6 py-6 text-base lg:text-lg focus:outline-none focus:border-pink-500/50 focus:bg-zinc-900/80 transition-all font-medium text-white placeholder:text-zinc-600"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-10 py-6 rounded-[2rem] text-sm lg:text-base font-black uppercase tracking-[0.2em] hover:bg-zinc-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl disabled:cursor-not-allowed shrink-0"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Fetch Media'}
                                </button>
                            </form>

                            {error && (
                                <div className="mt-6 flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <div className="text-sm font-medium leading-relaxed">{error}</div>
                                </div>
                            )}
                        </div>

                        {/* Results Preview Card */}
                        <div className={`transition-all duration-700 w-full ${media ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none absolute'}`}>
                            {media && (
                                <div className="p-5 md:p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col items-center">

                                    <div className="w-full bg-black border border-zinc-800/80 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden mb-8 relative group flex items-center justify-center min-h-[300px] max-h-[600px] shadow-inner">
                                        {media.isVideo ? (
                                            <video
                                                src={media.url}
                                                controls
                                                autoPlay
                                                loop
                                                muted
                                                className="w-full h-full object-contain max-h-[600px]"
                                            />
                                        ) : (
                                            <img
                                                src={media.url}
                                                alt="Instagram Downloader Result"
                                                className="w-full h-full object-contain max-h-[600px]"
                                            />
                                        )}

                                        {/* Overlay gradient for style */}
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                    </div>

                                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-2">
                                        <div className="flex items-center gap-3 text-zinc-400">
                                            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                                                {media.isVideo ? <Video size={20} className="text-purple-400" /> : <ImageIcon size={20} className="text-pink-400" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-0.5">High Quality {media.isVideo ? 'Video' : 'Image'}</h4>
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Ready for download</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleDownload}
                                            className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:scale-[1.02] transition-all active:scale-[0.98]"
                                        >
                                            <Download size={16} /> Download File
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </Container>
            </div>
        </div>
    );
}
