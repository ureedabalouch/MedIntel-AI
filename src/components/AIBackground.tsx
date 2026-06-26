import React, { useEffect, useRef } from 'react';

export default function AIBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class for neural net and general dust
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
      pulseVal: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2.5 + 1;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseVal = Math.random() * Math.PI;

        const colors = [
          'rgba(0, 229, 255, ', // Cyan
          'rgba(20, 241, 149, ', // Green
          'rgba(124, 58, 237, '  // Violet
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw(context: CanvasRenderingContext2D) {
        this.pulseVal += this.pulseSpeed;
        const currentAlpha = this.alpha * (0.6 + Math.sin(this.pulseVal) * 0.4);
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color + currentAlpha + ')';
        context.fill();

        // Subtle glow
        if (this.radius > 2.5) {
          context.shadowColor = '#00E5FF';
          context.shadowBlur = 10;
          context.beginPath();
          context.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
          context.fillStyle = 'rgba(0, 229, 255, 0.05)';
          context.fill();
          context.shadowBlur = 0; // reset
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
    }

    // DNA particles (sine wave double helix)
    interface DNAPoint {
      x: number;
      yOffset: number;
      phase: number;
      speed: number;
      color: string;
    }

    const dnaPoints: DNAPoint[] = [];
    const numDnaPoints = 40;
    for (let i = 0; i < numDnaPoints; i++) {
      dnaPoints.push({
        x: (width / numDnaPoints) * i,
        yOffset: height * 0.7 + (Math.random() - 0.5) * 60,
        phase: (i / numDnaPoints) * Math.PI * 4,
        speed: 0.015,
        color: i % 2 === 0 ? 'rgba(0, 229, 255, 0.15)' : 'rgba(20, 241, 149, 0.15)',
      });
    }

    const particles: Particle[] = [];
    const numParticles = 85;
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle mesh-gradient backgrounds directly to canvas
      const grad1 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.2,
        10,
        width * 0.2,
        height * 0.2,
        width * 0.6
      );
      grad1.addColorStop(0, 'rgba(124, 58, 237, 0.04)'); // Violet
      grad1.addColorStop(1, 'rgba(7, 17, 31, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.8,
        height * 0.7,
        10,
        width * 0.8,
        height * 0.7,
        width * 0.6
      );
      grad2.addColorStop(0, 'rgba(0, 229, 255, 0.03)'); // Cyan
      grad2.addColorStop(1, 'rgba(7, 17, 31, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw neural network connections
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 3. Update & Draw Particles
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      // 4. Draw Animated DNA inspired particle helix
      const time = Date.now() * 0.001;
      ctx.lineWidth = 1;
      
      dnaPoints.forEach((point, idx) => {
        // Move along x slightly
        const xPos = (point.x + time * 10) % width;
        const amplitude = 30; // helix height

        // First Strand
        const y1 = point.yOffset + Math.sin(point.phase + time) * amplitude;
        ctx.beginPath();
        ctx.arc(xPos, y1, 2, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();

        // Second Strand (180deg out of phase)
        const y2 = point.yOffset + Math.sin(point.phase + time + Math.PI) * amplitude;
        ctx.beginPath();
        ctx.arc(xPos, y2, 2, 0, Math.PI * 2);
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(124, 58, 237, 0.15)' : 'rgba(20, 241, 149, 0.15)';
        ctx.fill();

        // Connecting bridge lines (rungs of double helix)
        if (idx % 3 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.beginPath();
          ctx.moveTo(xPos, y1);
          ctx.lineTo(xPos, y2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
      id="ai-medical-background"
    />
  );
}
