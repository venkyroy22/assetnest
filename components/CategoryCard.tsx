"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
    title: string;
    count: string;
    image: string;
    href: string;
    isDevelopment?: boolean;
}

const CategoryCard = ({ title, count, image, href, isDevelopment }: CategoryCardProps) => {
    return (
        <Link
            href={isDevelopment ? "#" : href}
            className={`group relative flex items-center justify-between bg-zinc-900 rounded-xl border border-border/50 shadow-sm overflow-hidden h-28 transition-all duration-300 ${isDevelopment
                    ? "cursor-not-allowed grayscale-[0.5] opacity-80"
                    : "hover:border-foreground/20"
                }`}
        >
            <div className="pl-6 z-10 py-5">
                <h3 className="text-foreground text-sm font-bold tracking-tight mb-0.5">
                    {title}
                </h3>
                <p className="text-secondary text-[10px] font-medium">
                    {isDevelopment ? "Ongoing Development" : count}
                </p>
                {isDevelopment && (
                    <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-amber-500/80 animate-pulse">
                        Stay Updated
                    </div>
                )}
            </div>

            <div className="relative h-full w-[45%] overflow-hidden">
                <div className={`absolute top-2 -right-4 w-full h-[110%] rotate-6 transform transition-transform duration-500 ${!isDevelopment && 'group-hover:scale-110 group-hover:rotate-0'}`}>
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover rounded-tl-2xl"
                    />
                </div>
                {/* Masking gradient to fade the image into the dark card background */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent" />
            </div>
        </Link>
    );
};

export default CategoryCard;
