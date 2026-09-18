"use client";

import { useEffect, useRef } from "react";

/**
 * 漂浮光晕粒子 — 在背景中缓慢移动的柔光点
 * 模拟水下光线或深空星光的感觉
 */
interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaDir: number;
}

export default function FloatingOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animId: number;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // 创建柔和光晕粒子
    const orbs: Orb[] = [];
    const count = 8;
    const w = () => canvas.width / dpr;
    const h = () => canvas.height / dpr;

    for (let i = 0; i < count; i++) {
      orbs.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 80 + Math.random() * 160,
        alpha: 0.02 + Math.random() * 0.04,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const animate = () => {
      const W = w();
      const H = h();
      ctx.clearRect(0, 0, W, H);

      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 环绕边界
        if (orb.x < -orb.size) orb.x = W + orb.size;
        if (orb.x > W + orb.size) orb.x = -orb.size;
        if (orb.y < -orb.size) orb.y = H + orb.size;
        if (orb.y > H + orb.size) orb.y = -orb.size;

        // 透明度呼吸
        orb.alpha += orb.alphaDir * 0.00015;
        if (orb.alpha > 0.06) orb.alphaDir = -1;
        if (orb.alpha < 0.015) orb.alphaDir = 1;

        // 绘制柔光
        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.size
        );
        gradient.addColorStop(
          0,
          `rgba(147, 197, 253, ${orb.alpha * 1.5})`
        ); // blue-300
        gradient.addColorStop(
          0.5,
          `rgba(191, 219, 254, ${orb.alpha})`
        ); // blue-200
        gradient.addColorStop(1, "rgba(191, 219, 254, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(
          orb.x - orb.size,
          orb.y - orb.size,
          orb.size * 2,
          orb.size * 2
        );
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
