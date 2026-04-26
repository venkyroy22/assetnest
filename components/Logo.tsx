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
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drljj29ua'}/image/upload/f_auto,q_auto/assetnest/logo`}
                alt="AssetNest Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
}
