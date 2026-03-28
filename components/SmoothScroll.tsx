"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    const pathname = usePathname();

    useEffect(() => {
        // Initialize Lenis with tuned parameters for that "Highly Smooth" feeling
        const lenis = new Lenis({
            duration: 1.2,      // Glide duration (higher = smoother)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1.1, // Slight boost for that responsive glided feel
            touchMultiplier: 2,
            infinite: false,
        });

        lenisRef.current = lenis;
        // Expose lenis to window for global access (e.g., back-to-top button)
        (window as any).lenis = lenis;

        // Lenis requires a requestAnimationFrame loop to work
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            (window as any).lenis = null;
        };
    }, []);

    // Force scroll to top on route change
    useEffect(() => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0, { immediate: true });
        }
    }, [pathname]);

    return <>{children}</>;
}
