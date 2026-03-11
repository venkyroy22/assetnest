"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
    title: string;
    count: string;
    image: string;
    href: string;
    isDevelopment?: boolean;
    priority?: boolean;
}

const CategoryCard = ({ title, count, image, href, isDevelopment, priority }: CategoryCardProps) => {
    return (
        <Link
            href={isDevelopment ? "#" : href}
            className={`group relative flex items-center justify-between bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-sm overflow-hidden h-28 transition-all duration-300 ${isDevelopment
                    ? "cursor-not-allowed grayscale-[0.5] opacity-80"
                    : "hover:border-white/10 hover:bg-zinc-900/60"
                }`}
        >
            <div className="pl-6 z-10 py-5">
                <h3 className="text-zinc-100 text-sm font-semibold tracking-tight mb-0.5">
                    {title}
                </h3>
                <p className="text-secondary text-[10px] font-medium">
                    {isDevelopment ? "Ongoing Development" : count}
                </p>
                {isDevelopment && (
                    <div className="mt-2 text-[9px] font-semibold tracking-wide text-amber-500/80 animate-pulse">
                        Stay Updated
                    </div>
                )}
            </div>

            <div 
                className="relative h-full w-[45%] overflow-hidden"
                style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 25%)", maskImage: "linear-gradient(to right, transparent, black 25%)" }}
            >
                <div className={`absolute top-2 -right-4 w-full h-[110%] rotate-6 transform transition-transform duration-500 ${!isDevelopment && 'group-hover:scale-110 group-hover:rotate-0'}`}>
                    <Image
                        src={image}
                        alt={title}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover rounded-tl-2xl"
                    />
                </div>
            </div>
        </Link>
    );
};

export default CategoryCard;
