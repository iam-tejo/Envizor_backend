"use client";

import { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ["#60a5fa", "#818cf8", "#34d399", "#fbbf24"];
    const confettiCount = 120;

    const confetti = Array.from({ length: confettiCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: Math.random() * 0.1 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      confetti.forEach((c) => {
        ctx.beginPath();
        ctx.fillStyle = c.color;
        ctx.ellipse(c.x, c.y, c.r, c.r * 0.4, c.tilt, 0, Math.PI * 2);
        ctx.fill();
      });

      update();
      requestAnimationFrame(draw);
    };

    const update = () => {
      confetti.forEach((c) => {
        c.y += c.d;
        c.x += Math.sin(c.tiltAngle) * 0.6;
        c.tiltAngle += 0.01;

        if (c.y > height) {
          c.y = -20;
          c.x = Math.random() * width;
        }
      });
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
