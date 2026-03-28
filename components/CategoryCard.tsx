"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
    title: string;
    count: string;
    image?: string;
    icon?: any;
    href: string;
    accent?: string;
    isDevelopment?: boolean;
    priority?: boolean;
}

const CategoryCard = ({ title, count, image, icon: Icon, href, accent = "#d4d4d8", isDevelopment, priority }: CategoryCardProps) => {
    return (
        <Link
            href={isDevelopment ? "#" : href}
            className={`group relative flex items-center justify-between bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-sm overflow-hidden h-28 transition-all duration-300 ${isDevelopment
                    ? "cursor-not-allowed grayscale-[0.5] opacity-80"
                    : "hover:border-zinc-700/50 hover:bg-zinc-900/60"
                }`}
            style={{
                boxShadow: !isDevelopment ? `0 0 0 0 ${accent}00` : undefined,
            }}
        >
            <div className="pl-8 z-10 py-5">
                <h3 className="text-zinc-100 text-base font-bold tracking-tight mb-1 group-hover:text-white transition-colors"
                    style={{ color: !isDevelopment ? undefined : undefined }}
                >
                    {title}
                </h3>
                <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.1em]"
                   style={{ color: !isDevelopment ? `${accent}cc` : undefined }}
                >
                    {isDevelopment ? "Ongoing Development" : count}
                </p>
                {isDevelopment && (
                    <div className="mt-2 text-[9px] font-semibold tracking-wide text-white/80 animate-pulse">
                        Stay Updated
                    </div>
                )}
            </div>

            <div 
                className="relative h-full w-[45%] flex items-center justify-center overflow-hidden pr-4"
            >
                {Icon ? (
                    <div className={`relative z-20 transition-all duration-700 ${!isDevelopment && 'group-hover:scale-125 group-hover:rotate-[15deg]'}`}>
                        <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-[2.5]" />
                        <Icon size={52} strokeWidth={1.25} className="text-white/40 group-hover:text-white/80 transition-colors" />
                    </div>
                ) : image && (
                    <div 
                        className="relative h-full w-full overflow-hidden"
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
                )}
            </div>
        </Link>
    );
};

export default CategoryCard;
