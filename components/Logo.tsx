"use client";

import Image from "next/image";

interface LogoProps {
    className?: string;
    size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <Image
                src="/categories/Logo.png"
                alt="AssetNest Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
}
