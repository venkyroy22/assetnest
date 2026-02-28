"use client";

import { useEffect, useRef } from "react";

export default function FireParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            speedX: number;
            color: string;
            opacity: number;
            life: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = canvas!.height + 10;
                this.size = Math.random() * 3 + 1;
                this.speedY = Math.random() * -2 - 1;
                this.speedX = Math.random() * 2 - 1;
                this.opacity = 1;
                this.life = Math.random() * 100 + 50;

                // Silver/Chrome colors
                const colors = ["#C0C0C0", "#E8E8E8", "#D3D3D3", "#757F9A", "#D7DDE8"];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.opacity -= 0.008; // Slower fade for a more "misty" look
                this.life--;

                if (this.size > 0.1) this.size -= 0.005;
            }

            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Add a silver glow effect
                ctx.shadowBlur = 12;
                ctx.shadowColor = this.color;
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < 80; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (particles.length < 150 && Math.random() > 0.7) {
                particles.push(new Particle());
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                if (particles[i].opacity <= 0 || particles[i].life <= 0) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener("resize", resize);
        resize();
        init();
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ opacity: 0.6 }}
        />
    );
}
