"use client";

import { useEffect, useRef } from "react";

export default function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: { x: number; y: number; size: number; speedY: number; speedX: number; life: number; maxLife: number; opacity: number }[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        size: Math.random() * 2.5 + 0.5,
        speedY: Math.random() * -1.5 - 0.5,
        speedX: Math.random() * 1.5 - 0.75,
        life: 0,
        maxLife: Math.random() * 200 + 100,
        opacity: Math.random() * 0.6 + 0.2
      };
    };

    // Initialize based on screen size to maintain performance
    const initialParticleCount = window.innerWidth > 768 ? 60 : 30;
    for (let i = 0; i < initialParticleCount; i++) {
      particles.push({ ...createParticle(), y: Math.random() * canvas.height });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const targetCount = window.innerWidth > 768 ? 80 : 40;
      if (particles.length < targetCount && Math.random() < 0.1) {
        particles.push(createParticle());
      }

      particles.forEach((p, index) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.life++;

        if (p.life >= p.maxLife || p.y < -10) {
          particles[index] = createParticle();
        }

        const fade = Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 69, 0, ${p.opacity * fade})`; // Ember Orange #FF4500

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF4500";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // visibility change pause to save resources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        render();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
