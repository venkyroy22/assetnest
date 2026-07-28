"use client";

import { useEffect, useRef } from "react";

export default function AdBanner() {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bannerRef.current) return;
        
        bannerRef.current.innerHTML = "";

        const scriptConfig = document.createElement("script");
        scriptConfig.innerHTML = `
            window.atOptions = {
                'key' : '760a7d084fc3bc7a943aa9e62667abbe',
                'format' : 'iframe',
                'height' : 60,
                'width' : 468,
                'params' : {}
            };
        `;
        bannerRef.current.appendChild(scriptConfig);

        const scriptInvoke = document.createElement("script");
        scriptInvoke.src = "https://www.highperformanceformat.com/760a7d084fc3bc7a943aa9e62667abbe/invoke.js";
        bannerRef.current.appendChild(scriptInvoke);
    }, []);

    return (
        <div className="no-print w-full flex justify-center py-4 bg-transparent overflow-hidden">
            <div ref={bannerRef} className="min-h-[60px] min-w-[468px] flex items-center justify-center" />
        </div>
    );
}
