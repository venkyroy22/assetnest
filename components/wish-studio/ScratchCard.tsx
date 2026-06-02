"use client";

import React, { useRef, useEffect, useState } from "react";

interface ScratchCardProps {
    width?: number;
    height?: number;
    scratchPercentageRequired?: number; // E.g. 60 for 60%
    onComplete?: () => void;
    children: React.ReactNode;
}

export default function ScratchCard({
    width = 320,
    height = 160,
    scratchPercentageRequired = 65,
    onComplete,
    children
}: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [scratched, setScratched] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Draw initial metallic overlay
        ctx.clearRect(0, 0, width, height);
        
        // Background color (Metallic dark silver gradient)
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#a1a1aa"); // Zinc 400
        gradient.addColorStop(0.5, "#d4d4d8"); // Zinc 300
        gradient.addColorStop(1, "#71717a"); // Zinc 500
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add visual speckles/noise texture to make it look like a real scratch card!
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Write beautiful instruction text on the scratch card
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillStyle = "#18181b"; // Zinc 900
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✨ SCRATCH WITH MOUSE/FINGER ✨", width / 2, height / 2);
    }, [width, height]);

    // Calculate how much area has been scratched
    const checkScratchPercentage = () => {
        const canvas = canvasRef.current;
        if (!canvas || scratched) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        let transparentPixels = 0;

        // Loop over alpha channel (every 4th value)
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        const totalPixels = width * height;
        const currentPercentage = Math.round((transparentPixels / totalPixels) * 100);

        if (currentPercentage >= scratchPercentageRequired) {
            setScratched(true);
            onComplete?.();
        }
    };

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX = 0;
        let clientY = 0;
        
        if ("touches" in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const scratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || scratched) return;
        
        // Prevent screen scrolling on touch moves
        if (e.cancelable) e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const pos = getMousePos(e);
        if (!pos) return;

        // Set scratching brush (clears destination pixels)
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
        ctx.fill();
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        scratch(e);
    };

    const handleEnd = () => {
        setIsDrawing(false);
        checkScratchPercentage();
    };

    return (
        <div 
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-2xl border border-white/10 shadow-lg bg-zinc-950/60"
            style={{ width, height }}
        >
            {/* The hidden surprise message underneath */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                {children}
            </div>

            {/* The overlay canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={handleStart}
                onMouseMove={scratch}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={scratch}
                onTouchEnd={handleEnd}
                className={`absolute inset-0 cursor-crosshair transition-opacity duration-700 z-10 ${
                    scratched ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
                style={{ touchAction: "none" }}
            />
        </div>
    );
}
