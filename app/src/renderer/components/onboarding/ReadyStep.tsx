import React, { useEffect, useRef } from 'react';

interface Props {
  onLaunch: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'star';
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#22C55E', '#EAB308',
  '#06B6D4', '#F97316', '#FFFFFF', '#FFD700', '#00E5FF',
];

const ReadyStep: React.FC<Props> = ({ onLaunch }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const particles: Particle[] = [];
    let animId: number;

    const spawn = (count: number, originY?: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const life = Math.random() * 0.4 + 0.8; // 0.8–1.2 range, normalized later
        particles.push({
          x: Math.random() * W,
          y: originY ?? H * 0.45 + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 4 - 2,
          life,
          maxLife: life,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 4 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          shape: (['circle', 'rect', 'star'] as const)[Math.floor(Math.random() * 3)],
        });
      }
    };

    const drawStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.995; // air resistance
        p.rotation += p.rotationSpeed;
        p.life -= 0.004; // slow fade — ~250 frames = ~4.2s at 60fps

        if (p.life <= 0) { particles.splice(i, 1); continue; }

        // Smooth cubic fade-out for final 30% of life
        const fadeRatio = p.life / p.maxLife;
        const alpha = fadeRatio < 0.3 ? (fadeRatio / 0.3) ** 2 : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const s = p.size * (0.5 + fadeRatio * 0.5);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
        } else {
          drawStar(0, 0, s);
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1;
      if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    };

    // Burst 1 — big initial burst
    const t1 = setTimeout(() => {
      spawn(120);
      animate();
    }, 300);

    // Burst 2 — layered second burst from slightly different positions
    const t2 = setTimeout(() => {
      spawn(80, H * 0.35);
    }, 800);

    // Burst 3 — small trailing burst
    const t3 = setTimeout(() => {
      spawn(40, H * 0.5);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center relative">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      <div className="relative z-10">
        <h2
          className="text-3xl font-bold text-[#F8FAFC] mb-3"
          style={{ animation: 'readyFadeUp 600ms ease-out' }}
        >
          You're all set.
        </h2>
        <p
          className="text-[#94A3B8] text-sm mb-10"
          style={{ animation: 'readyFadeUp 600ms ease-out 150ms both' }}
        >
          CRUX Terminal is ready. Start typing.
        </p>

        {/* Blinking cursor */}
        <div
          className="flex items-center justify-center gap-1.5 mb-10 font-mono text-lg text-[#64748B]"
          style={{ animation: 'readyFadeUp 600ms ease-out 300ms both' }}
        >
          <span className="text-blue-400">$</span>
          <span className="w-2.5 h-6 bg-blue-500 rounded-sm" style={{ animation: 'cursorBlink 1s step-end infinite' }} />
        </div>

        <button
          onClick={onLaunch}
          className="px-12 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.97]"
          style={{ animation: 'readyFadeUp 600ms ease-out 450ms both' }}
        >
          Launch CRUX
        </button>
      </div>

      <style>{`
        @keyframes readyFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ReadyStep;
