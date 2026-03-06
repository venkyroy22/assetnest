"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    driftX: number;
    driftY: number;
    driftPhase: number;
    driftSpeed: number;
}

const COLORS = [
    "#D7DDE8", // bright silver
    "#C4CAD6", // light silver
    "#A8B0C0", // mid silver
    "#9198AA", // blue-grey
    "#757F9A", // deep blue-grey
    "#E8ECF2", // near white silver
    "#B0B8C8", // cool grey
];

const PARTICLE_COUNT = 150;

function createParticle(w: number, h: number): Particle {
    const depth = Math.random();
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + depth * 3.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.15 + depth * 0.55,
        driftX: (Math.random() - 0.5) * 0.35,
        driftY: -(0.2 + Math.random() * 0.55),
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.004 + Math.random() * 0.006,
    };
}

export default function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Optimization: Disable particles on mobile to improve performance scores
        if (typeof window !== "undefined" && window.innerWidth < 768) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let particles: Particle[] = [];
        let w = 0;
        let h = 0;
        let t = 0;
        let isVisible = true;

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
            },
            { threshold: 0 }
        );
        observer.observe(canvas);

        const resize = () => {
            const parent = canvas.parentElement;
            w = parent ? parent.offsetWidth : window.innerWidth;
            h = parent ? parent.offsetHeight : window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        };

        const init = () => {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const p = createParticle(w, h);
                p.driftPhase = Math.random() * Math.PI * 2;
                particles.push(p);
            }
        };

        const animate = () => {
            if (isVisible) {
                t++;
                ctx.clearRect(0, 0, w, h);

                for (const p of particles) {
                    const wobble = Math.sin(t * p.driftSpeed + p.driftPhase) * 1.1;
                    p.x += p.driftX + wobble * 0.04;
                    p.y += p.driftY;

                    if (p.y < -10) {
                        p.y = h + 10;
                        p.x = Math.random() * w;
                    }
                    if (p.x < -20) p.x = w + 20;
                    if (p.x > w + 20) p.x = -20;

                    const len = p.size * (1.4 + Math.random() * 0.2);
                    const halfLen = len / 2;
                    const halfW = p.size / 2;

                    ctx.save();
                    ctx.globalAlpha = p.opacity;

                    const angle = Math.atan2(p.driftY, p.driftX + wobble * 0.04) + Math.PI / 2;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);

                    const grad = ctx.createLinearGradient(-halfW, -halfLen, halfW, halfLen);
                    grad.addColorStop(0, "#757F9A");
                    grad.addColorStop(0.5, "#D7DDE8");
                    grad.addColorStop(1, "#A8B0C0");

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.roundRect(-halfW, -halfLen, p.size, len, p.size / 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            animId = requestAnimationFrame(animate);
        };

        const handleResize = () => { resize(); init(); };
        window.addEventListener("resize", handleResize);

        resize();
        init();
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", handleResize);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ opacity: 1 }}
        />
    );
}
