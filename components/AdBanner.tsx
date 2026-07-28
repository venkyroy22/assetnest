"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
    adKey: string;
    width: number;
    height: number;
}

export default function AdBanner({ adKey, width, height }: AdBannerProps) {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bannerRef.current) return;
        
        bannerRef.current.innerHTML = "";

        const scriptConfig = document.createElement("script");
        scriptConfig.innerHTML = `
            window.atOptions = {
                'key' : '${adKey}',
                'format' : 'iframe',
                'height' : ${height},
                'width' : ${width},
                'params' : {}
            };
        `;
        bannerRef.current.appendChild(scriptConfig);

        const scriptInvoke = document.createElement("script");
        scriptInvoke.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
        bannerRef.current.appendChild(scriptInvoke);
    }, [adKey, width, height]);

    return (
        <div className="no-print w-full flex justify-center py-4 bg-transparent overflow-hidden">
            <div 
                ref={bannerRef} 
                style={{ minHeight: `${height}px`, minWidth: `${width}px` }} 
                className="flex items-center justify-center" 
            />
        </div>
    );
}
