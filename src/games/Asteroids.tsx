import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface AsteroidsProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: number; // 3: large, 2: medium, 1: small
  points: number;
  vertexCount: number;
  offsets: number[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export const Asteroids: React.FC<AsteroidsProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  const gameState = useRef({
    ship: {
      x: 300,
      y: 250,
      angle: -Math.PI / 2,
      rotationSpeed: 0.08,
      vx: 0,
      vy: 0,
      thrust: 0.15,
      friction: 0.985,
      radius: 12,
      isThrusting: false,
      invulnerableTimer: 120,
    },
    lasers: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    asteroids: [] as Asteroid[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    lastTime: 0,
  });

  const spawnAsteroid = useCallback((x: number, y: number, tier: number): Asteroid => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (4 - tier) * 0.9 + Math.random() * 0.6;
    const radius = tier === 3 ? 38 : tier === 2 ? 22 : 12;
    const vertexCount = 10 + Math.floor(Math.random() * 4);
    const offsets = Array.from({ length: vertexCount }, () => 0.8 + Math.random() * 0.4);

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      tier,
      points: tier === 3 ? 20 : tier === 2 ? 50 : 100,
      vertexCount,
      offsets
    };
  }, []);

  const createWave = useCallback((count: number) => {
    const list: Asteroid[] = [];
    const width = 600;
    const height = 500;
    for (let i = 0; i < count; i++) {
      let x = Math.random() * width;
      let y = Math.random() * height;
      // Keep clear of center ship spawn
      if (Math.hypot(x - 300, y - 250) < 140) {
        x = (x + 250) % width;
        y = (y + 200) % height;
      }
      list.push(spawnAsteroid(x, y, 3));
    }
    return list;
  }, [spawnAsteroid]);

  const initGame = useCallback(() => {
    const s = gameState.current;
    s.ship = {
      x: 300,
      y: 250,
      angle: -Math.PI / 2,
      rotationSpeed: 0.08,
      vx: 0,
      vy: 0,
      thrust: 0.16,
      friction: 0.985,
      radius: 12,
      isThrusting: false,
      invulnerableTimer: 100,
    };
    s.lasers = [];
    s.particles = [];
    s.asteroids = createWave(4);

    setScore(0);
    setLives(3);
    setWave(1);
    setIsGameOver(false);
    setIsPlaying(true);
  }, [createWave]);

  const shootLaser = useCallback(() => {
    const s = gameState.current;
    if (s.lasers.length < 5) {
      const tipX = s.ship.x + Math.cos(s.ship.angle) * s.ship.radius * 1.4;
      const tipY = s.ship.y + Math.sin(s.ship.angle) * s.ship.radius * 1.4;
      const speed = 10;
      s.lasers.push({
        x: tipX,
        y: tipY,
        vx: s.ship.vx * 0.3 + Math.cos(s.ship.angle) * speed,
        vy: s.ship.vy * 0.3 + Math.sin(s.ship.angle) * speed,
        life: 45
      });
      sounds.playLaser(1100, 300, 0.07);
    }
  }, []);

  const hyperspaceJump = useCallback(() => {
    const s = gameState.current;
    s.ship.x = 50 + Math.random() * 500;
    s.ship.y = 50 + Math.random() * 400;
    s.ship.vx = 0;
    s.ship.vy = 0;
    sounds.playLaser(200, 1200, 0.2);
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (isGameOver) {
          initGame();
        } else if (isPlaying) {
          shootLaser();
        }
      }
      if (e.key === 'h' || e.key === 'H' || e.key === 'Shift') {
        if (isPlaying && !isGameOver) hyperspaceJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, shootLaser, hyperspaceJump, initGame]);

  // Main Loop
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = gameState.current;
      const width = canvas.width;
      const height = canvas.height;

      if (!isGameOver) {
        // Ship controls
        if (s.keys['ArrowLeft'] || s.keys['a'] || s.keys['A']) {
          s.ship.angle -= s.ship.rotationSpeed;
        }
        if (s.keys['ArrowRight'] || s.keys['d'] || s.keys['D']) {
          s.ship.angle += s.ship.rotationSpeed;
        }
        s.ship.isThrusting = !!(s.keys['ArrowUp'] || s.keys['w'] || s.keys['W']);

        if (s.ship.isThrusting) {
          s.ship.vx += Math.cos(s.ship.angle) * s.ship.thrust;
          s.ship.vy += Math.sin(s.ship.angle) * s.ship.thrust;
          if (Math.random() < 0.25) sounds.playThrust();

          // Exhaust flame particles
          const exAngle = s.ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
          s.particles.push({
            x: s.ship.x - Math.cos(s.ship.angle) * 10,
            y: s.ship.y - Math.sin(s.ship.angle) * 10,
            vx: Math.cos(exAngle) * (2 + Math.random() * 2),
            vy: Math.sin(exAngle) * (2 + Math.random() * 2),
            life: 15,
            maxLife: 15
          });
        }

        s.ship.vx *= s.ship.friction;
        s.ship.vy *= s.ship.friction;
        s.ship.x += s.ship.vx;
        s.ship.y += s.ship.vy;

        // Screen wrap ship
        if (s.ship.x < 0) s.ship.x += width;
        if (s.ship.x > width) s.ship.x -= width;
        if (s.ship.y < 0) s.ship.y += height;
        if (s.ship.y > height) s.ship.y -= height;

        if (s.ship.invulnerableTimer > 0) s.ship.invulnerableTimer--;

        // Update Lasers
        for (let i = s.lasers.length - 1; i >= 0; i--) {
          const l = s.lasers[i];
          l.x += l.vx;
          l.y += l.vy;
          l.life--;

          // Screen wrap lasers
          if (l.x < 0) l.x += width;
          if (l.x > width) l.x -= width;
          if (l.y < 0) l.y += height;
          if (l.y > height) l.y -= height;

          if (l.life <= 0) {
            s.lasers.splice(i, 1);
            continue;
          }

          // Laser vs Asteroids
          let laserHit = false;
          for (let j = s.asteroids.length - 1; j >= 0; j--) {
            const ast = s.asteroids[j];
            const dist = Math.hypot(l.x - ast.x, l.y - ast.y);
            if (dist < ast.radius) {
              laserHit = true;
              s.asteroids.splice(j, 1);
              sounds.playExplosion(0.2, true);

              // Split asteroid
              if (ast.tier > 1) {
                s.asteroids.push(spawnAsteroid(ast.x, ast.y, ast.tier - 1));
                s.asteroids.push(spawnAsteroid(ast.x, ast.y, ast.tier - 1));
              }

              // Spawn debris particles
              for (let p = 0; p < 8; p++) {
                const pAngle = Math.random() * Math.PI * 2;
                const pSpeed = 1 + Math.random() * 3;
                s.particles.push({
                  x: ast.x,
                  y: ast.y,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  life: 25,
                  maxLife: 25
                });
              }

              setScore(sc => {
                const newSc = sc + ast.points;
                onScoreUpdate?.(newSc);
                return newSc;
              });

              break;
            }
          }

          if (laserHit) {
            s.lasers.splice(i, 1);
          }
        }

        // Update Asteroids
        for (const ast of s.asteroids) {
          ast.x += ast.vx;
          ast.y += ast.vy;

          if (ast.x < -ast.radius) ast.x = width + ast.radius;
          if (ast.x > width + ast.radius) ast.x = -ast.radius;
          if (ast.y < -ast.radius) ast.y = height + ast.radius;
          if (ast.y > height + ast.radius) ast.y = -ast.radius;

          // Check ship collision
          if (s.ship.invulnerableTimer <= 0) {
            const shipDist = Math.hypot(s.ship.x - ast.x, s.ship.y - ast.y);
            if (shipDist < ast.radius + s.ship.radius) {
              sounds.playExplosion(0.5);

              for (let p = 0; p < 18; p++) {
                const pAngle = Math.random() * Math.PI * 2;
                const pSpeed = 2 + Math.random() * 4;
                s.particles.push({
                  x: s.ship.x,
                  y: s.ship.y,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  life: 35,
                  maxLife: 35
                });
              }

              setLives(lvs => {
                const next = lvs - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  sounds.playGameOver();
                  onGameOver?.(score);
                } else {
                  // Respawn ship in center
                  s.ship.x = width / 2;
                  s.ship.y = height / 2;
                  s.ship.vx = 0;
                  s.ship.vy = 0;
                  s.ship.invulnerableTimer = 120;
                }
                return next;
              });
              break;
            }
          }
        }

        // Check wave completion
        if (s.asteroids.length === 0) {
          sounds.playVictory();
          setWave(w => {
            const nextW = w + 1;
            s.asteroids = createWave(3 + nextW);
            return nextW;
          });
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // --- RENDER ---
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 137) % width);
        const sy = ((i * 251) % height);
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Draw Asteroids (vector wireframe)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.8;
      s.asteroids.forEach(ast => {
        ctx.beginPath();
        for (let i = 0; i < ast.vertexCount; i++) {
          const theta = (i / ast.vertexCount) * Math.PI * 2;
          const r = ast.radius * ast.offsets[i];
          const px = ast.x + Math.cos(theta) * r;
          const py = ast.y + Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      });

      // Draw Lasers
      ctx.fillStyle = '#38bdf8';
      s.lasers.forEach(l => {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      s.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      });

      // Draw Ship
      if (s.ship.invulnerableTimer % 10 < 5) {
        ctx.save();
        ctx.translate(s.ship.x, s.ship.y);
        ctx.rotate(s.ship.angle);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.ship.radius * 1.4, 0);
        ctx.lineTo(-s.ship.radius, -s.ship.radius * 0.9);
        ctx.lineTo(-s.ship.radius * 0.5, 0);
        ctx.lineTo(-s.ship.radius, s.ship.radius * 0.9);
        ctx.closePath();
        ctx.stroke();

        // Thrust flame
        if (s.ship.isThrusting) {
          ctx.strokeStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-s.ship.radius * 0.6, -s.ship.radius * 0.4);
          ctx.lineTo(-s.ship.radius * 1.6 - Math.random() * 5, 0);
          ctx.lineTo(-s.ship.radius * 0.6, s.ship.radius * 0.4);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Game Over Overlay
      if (isGameOver) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ef4444';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, width / 2, height / 2 + 25);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO PLAY AGAIN', width / 2, height / 2 + 70);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, score, wave, lives, spawnAsteroid, createWave, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Top HUD */}
      <div className="w-full max-w-[600px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex items-center gap-4">
          <span className="text-amber-400">SCORE: {score.toString().padStart(5, '0')}</span>
          <span className="text-neutral-500">HI: {highScore.toString().padStart(5, '0')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sky-400">SECTOR {wave}</span>
          <span className="text-emerald-400">SHIPS: {lives}</span>
        </div>
      </div>

      {/* Screen Frame */}
      <div className="relative w-full max-w-[600px] aspect-[600/500] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-sky-400 mb-4 tracking-wider animate-pulse">
              ASTEROIDS
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-arcade">
              Navigate zero-gravity vector space. Rotate, ignite thrusters, and blast cosmic asteroids into dust!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-sky-500/20 active:scale-95"
            >
              LAUNCH SHIP
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full max-w-[600px] grid grid-cols-4 gap-2 mt-4 px-2 md:hidden">
        <button
          onTouchStart={() => { gameState.current.keys['ArrowLeft'] = true; }}
          onTouchEnd={() => { gameState.current.keys['ArrowLeft'] = false; }}
          onMouseDown={() => { gameState.current.keys['ArrowLeft'] = true; }}
          onMouseUp={() => { gameState.current.keys['ArrowLeft'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center"
        >
          ↶ ROT
        </button>
        <button
          onTouchStart={() => { gameState.current.keys['ArrowRight'] = true; }}
          onTouchEnd={() => { gameState.current.keys['ArrowRight'] = false; }}
          onMouseDown={() => { gameState.current.keys['ArrowRight'] = true; }}
          onMouseUp={() => { gameState.current.keys['ArrowRight'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center"
        >
          ↷ ROT
        </button>
        <button
          onTouchStart={() => { gameState.current.keys['ArrowUp'] = true; }}
          onTouchEnd={() => { gameState.current.keys['ArrowUp'] = false; }}
          onMouseDown={() => { gameState.current.keys['ArrowUp'] = true; }}
          onMouseUp={() => { gameState.current.keys['ArrowUp'] = false; }}
          className="h-14 bg-amber-600/80 active:bg-amber-500 text-neutral-950 font-pixel text-xs rounded border border-amber-500 flex items-center justify-center font-bold"
        >
          THRUST ▲
        </button>
        <button
          onClick={shootLaser}
          className="h-14 bg-sky-500 active:bg-sky-400 text-neutral-950 font-pixel text-xs rounded border border-sky-400 flex items-center justify-center font-bold"
        >
          FIRE 🔥
        </button>
      </div>
    </div>
  );
};
