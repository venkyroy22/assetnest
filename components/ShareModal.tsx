"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, UploadCloud, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | Blob | null;
    fileName: string;
}

export default function ShareModal({ isOpen, onClose, file, fileName }: ShareModalProps) {
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [url, setUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setTimeout(() => {
                setStatus("idle");
                setUrl("");
                setCopied(false);
            }, 300);
        } else if (isOpen && file && status === "idle") {
            handleUpload();
        }
    }, [isOpen, file]);

    const handleUpload = async () => {
        if (!file) return;
        setStatus("uploading");
        try {
            const formData = new FormData();
            formData.append("file", file, fileName);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            
            const data = await res.json();
            if (data.url) {
                // Return secure https url
                setUrl(data.url);
                setStatus("success");
            } else {
                throw new Error("No URL returned");
            }
        } catch (e) {
            console.error(e);
            setStatus("error");
        }
    };

    const handleCopy = () => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Smartphone size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight mb-2">Share to Mobile</h2>
                    <p className="text-[13px] text-zinc-400 font-medium">Scan the QR code to open the file directly on your mobile device.</p>
                </div>

                {status === "uploading" && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 border border-zinc-800 rounded-2xl bg-zinc-900/40">
                        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold text-white tracking-wide">Generating Secure Link...</p>
                        <p className="text-xs text-zinc-500 mt-1">This will only take a moment</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 border border-red-500/20 rounded-2xl bg-red-500/5 text-center">
                        <X size={32} className="text-red-400 mb-3" />
                        <p className="text-sm font-bold text-red-200">Upload Failed</p>
                        <p className="text-xs text-red-300/70 mt-1 mb-4">Could not generate a sharing link.</p>
                        <button onClick={handleUpload} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800">Try Again</button>
                    </div>
                )}

                {status === "success" && url && (
                    <div className="flex flex-col items-center space-y-6">
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-white/5 border-4 border-zinc-800/50 relative overflow-hidden group">
                           <QRCodeSVG 
                               value={url} 
                               size={180} 
                               level="Q"
                               includeMargin={false}
                               fgColor="#000000"
                               bgColor="#FFFFFF"
                           />
                           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        {/* Copy Link */}
                        <div className="w-full relative">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-1.5 block">Download Link</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    readOnly 
                                    value={url}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                                />
                                <button 
                                    onClick={handleCopy}
                                    className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 
                                        ${copied ? 'bg-white/20 text-white px-6' : 'bg-white hover:bg-white text-white shadow-lg shadow-white/20'}`}
                                >
                                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
