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
            className={`group relative flex items-center justify-between rounded-2xl overflow-hidden h-28 bg-white border border-black/[0.06] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
                isDevelopment
                    ? "cursor-not-allowed grayscale-[0.5] opacity-80"
                    : "hover:bg-zinc-50 hover:border-black/[0.12] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            }`}
        >
            <div className="pl-8 z-10 py-5">
                <h3 className="text-base font-bold tracking-tight mb-1 transition-colors"
                    style={{ color: "#71381d" }}
                >
                    {title}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em]"
                   style={{ color: "#71381d" }}
                >
                    {isDevelopment ? "Ongoing Development" : count}
                </p>
                {isDevelopment && (
                    <div className="mt-2 text-[9px] font-semibold tracking-wide text-zinc-800 animate-pulse">
                        Stay Updated
                    </div>
                )}
            </div>

            <div 
                className="relative h-full w-[45%] flex items-center justify-center overflow-hidden pr-4"
            >
                {Icon ? (
                    <div className={`relative z-20 transition-all duration-700 ${!isDevelopment && 'group-hover:scale-125 group-hover:rotate-[15deg]'}`}>
                        <div className="absolute inset-0 blur-3xl rounded-full scale-[2.5]" style={{ background: "rgba(57,174,102,0.08)" }} />
                        <Icon size={52} strokeWidth={1.25} className="transition-colors text-[#39ae66]/30 group-hover:text-[#39ae66]/50 duration-300" />
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
