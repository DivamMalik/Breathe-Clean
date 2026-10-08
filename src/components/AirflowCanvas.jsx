import React, { useEffect, useRef } from 'react';

/**
 * AirflowCanvas renders realistic animated particle streamlines
 * representing Fresh Air (Green), Filtered Air (Cyan), and Purified Air (Purple).
 * The simulation dynamically speeds up, slows down, or changes particle density
 * based on window status, HVAC percentage, and Air Purifier status.
 */
export default function AirflowCanvas({
  windowLOpen = true,
  windowROpen = true,
  hvacLevel = 35,
  purifierOn = true,
  flowSpeedMultiplier = 1
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize canvas to match display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle pool
    const particles = [];
    const maxParticles = 90;

    class FlowParticle {
      constructor() {
        this.reset();
      }

      reset() {
        // Types: 'fresh' (green, from windows), 'hvac' (cyan, from ceiling), 'purifier' (purple, from center)
        const activeTypes = [];
        if (windowLOpen || windowROpen) activeTypes.push('fresh');
        if (hvacLevel > 0) activeTypes.push('hvac');
        if (purifierOn) activeTypes.push('purifier');

        if (activeTypes.length === 0) {
          this.active = false;
          return;
        }

        this.active = true;
        this.type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        this.w = canvas.width || 600;
        this.h = canvas.height || 400;

        if (this.type === 'fresh') {
          // Inflow from left or right windows
          const fromLeft = windowLOpen && (!windowROpen || Math.random() < 0.6);
          this.x = fromLeft ? Math.random() * (this.w * 0.15) : this.w * (0.85 + Math.random() * 0.15);
          this.y = this.h * 0.2 + Math.random() * (this.h * 0.55);
          this.vx = fromLeft ? (1.5 + Math.random() * 2) : -(1.5 + Math.random() * 2);
          this.vy = (Math.random() - 0.4) * 0.8;
          this.color = '#10b981'; // Green
          this.size = 2 + Math.random() * 2.5;
          this.life = 0;
          this.maxLife = 120 + Math.random() * 80;
        } else if (this.type === 'hvac') {
          // From ceiling vents descending into the room
          this.x = this.w * 0.25 + Math.random() * (this.w * 0.5);
          this.y = Math.random() * (this.h * 0.18);
          this.vx = (Math.random() - 0.5) * 1.2;
          this.vy = (1.2 + (hvacLevel / 60)) * (0.8 + Math.random() * 0.8);
          this.color = '#0284c7'; // Cyan
          this.size = 2 + Math.random() * 2.2;
          this.life = 0;
          this.maxLife = 100 + Math.random() * 70;
        } else {
          // Purifier aura radiating outward from floor center
          this.x = this.w * 0.52 + (Math.random() - 0.5) * 30;
          this.y = this.h * 0.72 + (Math.random() - 0.5) * 20;
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.0 + Math.random() * 1.8;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed * 0.6 - 0.6; // upward bias
          this.color = '#8b5cf6'; // Purple
          this.size = 2.5 + Math.random() * 3;
          this.life = 0;
          this.maxLife = 90 + Math.random() * 60;
        }
      }

      update() {
        if (!this.active) {
          this.reset();
          return;
        }
        this.x += this.vx * flowSpeedMultiplier;
        this.y += this.vy * flowSpeedMultiplier;
        this.life++;

        if (this.life >= this.maxLife || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }

      draw() {
        if (!this.active) return;
        const progress = this.life / this.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.75;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;

        // Draw particle head
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw smooth motion trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      const p = new FlowParticle();
      p.life = Math.random() * p.maxLife; // stagger starting frames
      particles.push(p);
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [windowLOpen, windowROpen, hvacLevel, purifierOn, flowSpeedMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      className="room-canvas-overlay"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
}
