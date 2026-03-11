"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

interface PdfPageThumbnailProps {
    file: File;
    pageIndex: number;
}

export default function PdfPageThumbnail({ file, pageIndex }: PdfPageThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const renderPage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Dynamically import pdfjs so it only runs client-side
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                if (cancelled) return;

                const page = await pdf.getPage(pageIndex + 1);
                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const desiredHeight = 90;
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = desiredHeight / unscaledViewport.height;
                const viewport = page.getViewport({ scale });

                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                await page.render({ canvasContext: ctx, viewport, canvas }).promise;

                if (!cancelled) setLoading(false);
            } catch (e) {
                if (!cancelled) {
                    console.error("Thumbnail render error:", e);
                    setError(true);
                    setLoading(false);
                }
            }
        };

        renderPage();

        return () => {
            cancelled = true;
        };
    }, [file, pageIndex]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
                <FileText size={18} className="text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-red-400 rounded-full animate-spin" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-sm shadow"
                style={{ opacity: loading ? 0 : 1, transition: "opacity 0.3s" }}
            />
        </div>
    );
}
