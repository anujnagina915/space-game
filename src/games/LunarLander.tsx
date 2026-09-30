import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface LunarLanderProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

const WIDTH = 600;
const HEIGHT = 500;
const MOON_GRAVITY = 0.04;
const ENGINE_THRUST = 0.11;

interface LandingPad {
  x1: number;
  x2: number;
  y: number;
  multiplier: number;
}

export const LunarLander: React.FC<LunarLanderProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(1000);
  const [verticalSpeed, setVerticalSpeed] = useState(0);
  const [horizontalSpeed, setHorizontalSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const state = useRef({
    lander: {
      x: 300,
      y: 60,
      vx: 0.8,
      vy: 0,
      angle: 0,
      fuel: 1000,
      thrusting: false,
      crashed: false,
      landed: false,
    },
    terrain: [] as { x: number; y: number }[],
    pads: [] as LandingPad[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    keys: {} as Record<string, boolean>,
  });

  const generateTerrain = useCallback(() => {
    const terrain: { x: number; y: number }[] = [];
    const pads: LandingPad[] = [
      { x1: 70, x2: 150, y: 440, multiplier: 2 },   // Easy wide pad
      { x1: 270, x2: 330, y: 410, multiplier: 3 },  // Medium pad
      { x1: 470, x2: 510, y: 450, multiplier: 5 },  // Narrow 5x pad
    ];

    terrain.push({ x: 0, y: 420 });
    terrain.push({ x: 40, y: 400 });
    // Pad 1
    terrain.push({ x: 70, y: 440 });
    terrain.push({ x: 150, y: 440 });

    terrain.push({ x: 200, y: 360 });
    terrain.push({ x: 240, y: 430 });
    // Pad 2
    terrain.push({ x: 270, y: 410 });
    terrain.push({ x: 330, y: 410 });

    terrain.push({ x: 380, y: 350 });
    terrain.push({ x: 430, y: 470 });
    // Pad 3
    terrain.push({ x: 470, y: 450 });
    terrain.push({ x: 510, y: 450 });

    terrain.push({ x: 560, y: 390 });
    terrain.push({ x: 600, y: 430 });

    return { terrain, pads };
  }, []);

  const initGame = useCallback(() => {
    const { terrain, pads } = generateTerrain();
    state.current.terrain = terrain;
    state.current.pads = pads;
    state.current.particles = [];
    state.current.lander = {
      x: 180 + Math.random() * 240,
      y: 60,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0.2,
      angle: 0,
      fuel: 1000,
      thrusting: false,
      crashed: false,
      landed: false,
    };

    setFuel(1000);
    setStatusMessage(null);
    setIsGameOver(false);
    setIsPlaying(true);
  }, [generateTerrain]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      state.current.keys[e.key] = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        state.current.keys['Thrust'] = true;
      }
      if (e.code === 'KeyR' && isGameOver) {
        initGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      state.current.keys[e.key] = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        state.current.keys['Thrust'] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver, initGame]);

  // Main Loop
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = state.current;
      const l = s.lander;

      if (!l.crashed && !l.landed) {
        // Rotation
        if (s.keys['ArrowLeft'] || s.keys['a'] || s.keys['A']) l.angle -= 0.045;
        if (s.keys['ArrowRight'] || s.keys['d'] || s.keys['D']) l.angle += 0.045;

        // Thrust
        l.thrusting = !!(s.keys['Thrust'] && l.fuel > 0);
        if (l.thrusting) {
          l.fuel = Math.max(0, l.fuel - 2);
          setFuel(Math.round(l.fuel));
          sounds.playThrust();

          const thrustX = Math.sin(l.angle) * ENGINE_THRUST;
          const thrustY = -Math.cos(l.angle) * ENGINE_THRUST;
          l.vx += thrustX;
          l.vy += thrustY;

          // Exhaust particles
          for (let p = 0; p < 2; p++) {
            const pAngle = l.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            s.particles.push({
              x: l.x - Math.sin(l.angle) * 12,
              y: l.y + Math.cos(l.angle) * 12,
              vx: Math.cos(pAngle) * (2 + Math.random() * 2),
              vy: Math.sin(pAngle) * (2 + Math.random() * 2),
              life: 14
            });
          }
        }

        // Moon Gravity
        l.vy += MOON_GRAVITY;
        l.x += l.vx;
        l.y += l.vy;

        // Boundary wrap
        if (l.x < 10) { l.x = 10; l.vx = -l.vx * 0.4; }
        if (l.x > WIDTH - 10) { l.x = WIDTH - 10; l.vx = -l.vx * 0.4; }

        // Update telemetry
        setVerticalSpeed(parseFloat((l.vy * 10).toFixed(1)));
        setHorizontalSpeed(parseFloat((l.vx * 10).toFixed(1)));
        setAltitude(Math.max(0, Math.round(HEIGHT - 40 - l.y)));

        // Check Terrain & Pad Collision
        const feetY = l.y + 14;
        const feetX = l.x;

        // Check if hitting pads
        let hitPad: LandingPad | null = null;
        for (const pad of s.pads) {
          if (feetX >= pad.x1 && feetX <= pad.x2 && Math.abs(feetY - pad.y) < 6) {
            hitPad = pad;
            break;
          }
        }

        if (hitPad) {
          // Check landing specs: vertical speed <= 1.8, horizontal speed <= 1.2, tilt <= 14 degrees
          const safeVy = Math.abs(l.vy * 10) <= 18;
          const safeVx = Math.abs(l.vx * 10) <= 12;
          const safeAngle = Math.abs(l.angle) <= 0.25;

          if (safeVy && safeVx && safeAngle) {
            l.landed = true;
            l.vy = 0;
            l.vx = 0;
            l.angle = 0;
            sounds.playVictory();
            const earned = Math.round(l.fuel * hitPad.multiplier);
            setScore(sc => {
              const next = sc + earned;
              onScoreUpdate?.(next);
              return next;
            });
            setStatusMessage(`TOUCHDOWN! Clean Landing (${hitPad.multiplier}x Pad) +${earned} PTS`);
            setIsGameOver(true);
          } else {
            // Hard impact on pad
            l.crashed = true;
            sounds.playExplosion(0.5);
            setStatusMessage('CRASHED: Impact velocity too severe or wrong angle!');
            setIsGameOver(true);
            onGameOver?.(score);
          }
        } else if (feetY >= 350) {
          // Check collision with jagged terrain line segments
          for (let i = 0; i < s.terrain.length - 1; i++) {
            const p1 = s.terrain[i];
            const p2 = s.terrain[i + 1];
            if (feetX >= p1.x && feetX <= p2.x) {
              const slope = (p2.y - p1.y) / (p2.x - p1.x);
              const groundY = p1.y + slope * (feetX - p1.x);
              if (feetY >= groundY) {
                l.crashed = true;
                sounds.playExplosion(0.5);
                setStatusMessage('CRASHED: Struck rugged lunar crater terrain!');
                setIsGameOver(true);
                onGameOver?.(score);
                break;
              }
            }
          }
        }
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // --- RENDER ---
      ctx.fillStyle = '#020305';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Distant stars & Earth in sky
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 73) % WIDTH;
        const sy = (i * 39) % 250;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Earth crescent
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(80, 80, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020305';
      ctx.beginPath();
      ctx.arc(88, 76, 18, 0, Math.PI * 2);
      ctx.fill();

      // Draw Jagged Moon Terrain
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT);
      s.terrain.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(WIDTH, HEIGHT);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.terrain.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Highlight Landing Pads
      s.pads.forEach(pad => {
        ctx.fillStyle = pad.multiplier === 5 ? '#f43f5e' : pad.multiplier === 3 ? '#eab308' : '#10b981';
        ctx.fillRect(pad.x1, pad.y, pad.x2 - pad.x1, 5);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pad.multiplier}X`, (pad.x1 + pad.x2) / 2, pad.y + 18);
      });

      // Draw Exhaust Particles
      ctx.fillStyle = '#fb923c';
      s.particles.forEach(p => {
        ctx.fillRect(p.x, p.y, 2, 2);
      });

      // Draw Lunar Module
      if (!l.crashed) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);

        // Cabin (gold foil capsule)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, -2, 9, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit window
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-3, -7, 6, 3);

        // Descent stage base (grey/metal)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-10, 4, 20, 6);

        // Landing gear legs
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Left leg & footpad
        ctx.moveTo(-8, 9);
        ctx.lineTo(-14, 14);
        ctx.lineTo(-17, 14);
        // Right leg & footpad
        ctx.moveTo(8, 9);
        ctx.lineTo(14, 14);
        ctx.lineTo(17, 14);
        ctx.stroke();

        // Thruster nozzle
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3, 9, 6, 3);

        // Flame when thrusting
        if (l.thrusting) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-3, 12);
          ctx.lineTo(0, 20 + Math.random() * 8);
          ctx.lineTo(3, 12);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      } else {
        // Crash explosion debris
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('💥 CRASH', l.x, l.y);
      }

      // Status overlay
      if (statusMessage) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(WIDTH / 2 - 220, HEIGHT / 2 - 50, 440, 100);
        ctx.strokeStyle = l.landed ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(WIDTH / 2 - 220, HEIGHT / 2 - 50, 440, 100);

        ctx.fillStyle = l.landed ? '#10b981' : '#ef4444';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(statusMessage, WIDTH / 2, HEIGHT / 2 - 10);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PRESS R OR BUTTON BELOW TO RETRY', WIDTH / 2, HEIGHT / 2 + 25);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, score, statusMessage, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Telemetry Dashboard */}
      <div className="w-full max-w-[600px] grid grid-cols-4 gap-2 px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-[11px] font-pixel text-neutral-300">
        <div>
          <span className="text-neutral-500">FUEL:</span>{' '}
          <span className={fuel < 200 ? 'text-red-400' : 'text-emerald-400'}>{fuel}</span>
        </div>
        <div>
          <span className="text-neutral-500">V-SPD:</span>{' '}
          <span className={Math.abs(verticalSpeed) > 18 ? 'text-red-400' : 'text-emerald-400'}>
            {verticalSpeed}
          </span>
        </div>
        <div>
          <span className="text-neutral-500">H-SPD:</span>{' '}
          <span className={Math.abs(horizontalSpeed) > 12 ? 'text-red-400' : 'text-emerald-400'}>
            {horizontalSpeed}
          </span>
        </div>
        <div>
          <span className="text-neutral-500">ALT:</span>{' '}
          <span className="text-amber-400">{altitude}m</span>
        </div>
      </div>

      <div className="relative w-full max-w-[600px] aspect-[600/500] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-amber-400 mb-4 tracking-wider animate-pulse">
              LUNAR LANDER
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-arcade">
              Master lunar gravity and thrust inertia. Land softly on high-multiplier flat pads before your fuel is spent!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              COMMENCE DESCENT
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="w-full max-w-[600px] grid grid-cols-3 gap-2 mt-4 px-2 md:hidden">
        <button
          onTouchStart={() => { state.current.keys['ArrowLeft'] = true; }}
          onTouchEnd={() => { state.current.keys['ArrowLeft'] = false; }}
          onMouseDown={() => { state.current.keys['ArrowLeft'] = true; }}
          onMouseUp={() => { state.current.keys['ArrowLeft'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center"
        >
          ↶ TILT L
        </button>
        <button
          onTouchStart={() => { state.current.keys['Thrust'] = true; }}
          onTouchEnd={() => { state.current.keys['Thrust'] = false; }}
          onMouseDown={() => { state.current.keys['Thrust'] = true; }}
          onMouseUp={() => { state.current.keys['Thrust'] = false; }}
          className="h-14 bg-amber-600 active:bg-amber-500 text-neutral-950 font-pixel text-xs rounded border border-amber-400 flex items-center justify-center font-bold"
        >
          BURN ▲
        </button>
        <button
          onTouchStart={() => { state.current.keys['ArrowRight'] = true; }}
          onTouchEnd={() => { state.current.keys['ArrowRight'] = false; }}
          onMouseDown={() => { state.current.keys['ArrowRight'] = true; }}
          onMouseUp={() => { state.current.keys['ArrowRight'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center"
        >
          TILT R ↷
        </button>
      </div>
      {isGameOver && (
        <button
          onClick={initGame}
          className="mt-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-600 cursor-pointer"
        >
          RETRY MISSION 🔄
        </button>
      )}
    </div>
  );
};
