"use client";

import Link from "next/link";
import Image from "next/image";
import { Asset } from "@/data/mockData";
import { Heart, Plus, Download, Maximize2 } from "lucide-react";
import { useState } from "react";

interface AssetCardProps {
    asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative group overflow-hidden rounded-md border border-border aspect-[4/3] bg-zinc-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image */}
            <Image
                src={asset.previewUrl}
                alt={asset.title}
                fill
                className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            />

            {/* Persistent Tags (Simplified) */}
            <div className="absolute top-3 left-3 z-20">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border transition-colors ${asset.license === "Premium"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background/80 backdrop-blur-md text-foreground border-border"
                    }`}>
                    {asset.license}
                </span>
            </div>

            {/* Hover Overlay - Freepik Style */}
            <div className={`absolute inset-0 z-30 transition-opacity duration-300 flex flex-col justify-between p-4 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Gradient Overlay for text contrast */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                {/* Top Actions */}
                <div className="relative z-40 flex justify-end space-x-2">
                    <button className="w-9 h-9 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-sm hover:bg-foreground hover:text-background transition-colors shadow-sm">
                        <Heart size={18} fill={isHovered ? "none" : "currentColor"} />
                    </button>
                    <button className="w-9 h-9 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-sm hover:bg-foreground hover:text-background transition-colors shadow-sm">
                        <Plus size={18} />
                    </button>
                </div>

                {/* Bottom Metadata & Primary Actions */}
                <div className="relative z-40">
                    <div className="mb-3">
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">{asset.category}</p>
                        <h3 className="text-white text-base font-bold leading-tight line-clamp-1">{asset.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/assets/${asset.id}`}
                            className="flex-grow bg-white text-black py-2.5 px-4 text-[11px] font-black uppercase tracking-widest text-center rounded-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Maximize2 size={14} /> VIEW DETAILS
                        </Link>
                        <a
                            href={asset.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-foreground text-background w-11 h-11 flex items-center justify-center rounded-sm hover:scale-105 transition-transform"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetCard;
