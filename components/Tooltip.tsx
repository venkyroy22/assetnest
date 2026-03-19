"use client";

import React, { useState, useRef, useEffect } from "react";

type TooltipProps = {
    content: string;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
    className?: string;
};

export default function Tooltip({ 
    content, 
    children, 
    position = "top", 
    delay = 200,
    className = "" 
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsRendered(true);
            requestAnimationFrame(() => setIsVisible(true));
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
        // Wait for animation to finish before unrendering
        timeoutRef.current = setTimeout(() => {
            setIsRendered(false);
        }, 200);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const getPositionClasses = () => {
        switch (position) {
            case "top":
                return "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom";
            case "bottom":
                return "top-full left-1/2 -translate-x-1/2 mt-2 origin-top";
            case "left":
                return "right-full top-1/2 -translate-y-1/2 mr-2 origin-right";
            case "right":
                return "left-full top-1/2 -translate-y-1/2 ml-2 origin-left";
            default:
                return "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom";
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case "top":
                return "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b";
            case "bottom":
                return "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t";
            case "left":
                return "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t";
            case "right":
                return "left-[-4px] top-1/2 -translate-y-1/2 border-l border-b";
            default:
                return "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b";
        }
    };

    return (
        <div 
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            onClick={hideTooltip}
        >
            {children}
            {isRendered && (
                <div 
                    className={`absolute z-[9999] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white 
                                bg-zinc-900/90 backdrop-blur-md border border-white/10 
                                rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-none
                                transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]
                                ${getPositionClasses()}
                                ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"}
                    `}
                >
                    <span className="relative z-10">{content}</span>
                    {/* Arrow */}
                    <div 
                        className={`absolute w-1.5 h-1.5 bg-zinc-900/90 border-white/10 rotate-45
                                    ${getArrowClasses()}
                        `}
                    />
                    
                    {/* Subtle Glow */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                </div>
            )}
        </div>
    );
}
