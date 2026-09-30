import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface FroggerProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

const GRID_SIZE = 36;
const COLS = 13;
const ROWS = 14;
const WIDTH = COLS * GRID_SIZE; // 468
const HEIGHT = ROWS * GRID_SIZE; // 504

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  type: 'car' | 'truck' | 'racecar' | 'log' | 'turtle';
  color: string;
}

export const Frogger: React.FC<FroggerProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [homesFilled, setHomesFilled] = useState<boolean[]>([false, false, false, false, false]);

  const state = useRef({
    frog: { x: 6 * GRID_SIZE, y: 12 * GRID_SIZE, dir: 'up' as 'up' | 'down' | 'left' | 'right' },
    obstacles: [] as Obstacle[],
    timer: 60,
    maxTimer: 60,
    homeSlots: [0.5, 3.25, 6, 8.75, 11.5].map(col => ({ x: col * GRID_SIZE, filled: false })),
    highestRowReached: 12,
  });

  const initObstacles = useCallback(() => {
    const obs: Obstacle[] = [];
    // Traffic Rows (rows 7, 8, 9, 10, 11)
    // Row 11: Yellow slow cars (right)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 160, y: 11 * GRID_SIZE + 4, w: 32, h: 26, speed: 1.5, type: 'car', color: '#facc15' });
    }
    // Row 10: Bulldozers (left)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 150, y: 10 * GRID_SIZE + 4, w: 30, h: 26, speed: -1.2, type: 'car', color: '#fb923c' });
    }
    // Row 9: Purple cars (right)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 140, y: 9 * GRID_SIZE + 4, w: 34, h: 26, speed: 2.2, type: 'car', color: '#c084fc' });
    }
    // Row 8: Fast racecars (left)
    for (let i = 0; i < 2; i++) {
      obs.push({ x: i * 240, y: 8 * GRID_SIZE + 4, w: 36, h: 26, speed: -3.5, type: 'racecar', color: '#ef4444' });
    }
    // Row 7: Big trucks (right)
    for (let i = 0; i < 2; i++) {
      obs.push({ x: i * 220, y: 7 * GRID_SIZE + 4, w: 60, h: 26, speed: 1.8, type: 'truck', color: '#38bdf8' });
    }

    // River Rows (rows 1, 2, 3, 4, 5)
    // Row 5: Medium logs (right)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 170, y: 5 * GRID_SIZE + 4, w: 85, h: 28, speed: 1.6, type: 'log', color: '#92400e' });
    }
    // Row 4: Turtles (left)
    for (let i = 0; i < 4; i++) {
      obs.push({ x: i * 120, y: 4 * GRID_SIZE + 4, w: 64, h: 28, speed: -1.9, type: 'turtle', color: '#10b981' });
    }
    // Row 3: Long logs (right)
    for (let i = 0; i < 2; i++) {
      obs.push({ x: i * 260, y: 3 * GRID_SIZE + 4, w: 140, h: 28, speed: 2.5, type: 'log', color: '#92400e' });
    }
    // Row 2: Short logs (left)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 160, y: 2 * GRID_SIZE + 4, w: 75, h: 28, speed: -1.4, type: 'log', color: '#92400e' });
    }
    // Row 1: Diving turtles (right)
    for (let i = 0; i < 3; i++) {
      obs.push({ x: i * 150, y: 1 * GRID_SIZE + 4, w: 68, h: 28, speed: 2.0, type: 'turtle', color: '#10b981' });
    }

    state.current.obstacles = obs;
  }, []);

  const resetFrog = useCallback(() => {
    state.current.frog = { x: 6 * GRID_SIZE, y: 12 * GRID_SIZE, dir: 'up' };
    state.current.highestRowReached = 12;
    state.current.timer = 60;
  }, []);

  const killFrog = useCallback((reason: 'water' | 'car') => {
    if (reason === 'water') sounds.playExplosion(0.2, true);
    else sounds.playExplosion(0.35);

    setLives(l => {
      const next = l - 1;
      if (next <= 0) {
        setIsGameOver(true);
        sounds.playGameOver();
        onGameOver?.(score);
      } else {
        resetFrog();
      }
      return next;
    });
  }, [score, resetFrog, onGameOver]);

  const hop = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (!isPlaying || isGameOver) return;
    const f = state.current.frog;
    f.dir = dir;

    if (dir === 'up' && f.y > GRID_SIZE) {
      f.y -= GRID_SIZE;
      const currentRow = Math.round(f.y / GRID_SIZE);
      if (currentRow < state.current.highestRowReached) {
        state.current.highestRowReached = currentRow;
        setScore(sc => {
          const next = sc + 10;
          onScoreUpdate?.(next);
          return next;
        });
      }
    } else if (dir === 'down' && f.y < 12 * GRID_SIZE) {
      f.y += GRID_SIZE;
    } else if (dir === 'left' && f.x > 0) {
      f.x -= GRID_SIZE;
    } else if (dir === 'right' && f.x < WIDTH - GRID_SIZE) {
      f.x += GRID_SIZE;
    }
    sounds.playHop();
  }, [isPlaying, isGameOver, onScoreUpdate]);

  const initGame = useCallback(() => {
    initObstacles();
    resetFrog();
    state.current.homeSlots = [0.5, 3.25, 6, 8.75, 11.5].map(col => ({ x: col * GRID_SIZE, filled: false }));
    setHomesFilled([false, false, false, false, false]);
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsPlaying(true);
  }, [initObstacles, resetFrog]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); hop('up'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); hop('down'); }
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); hop('left'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); hop('right'); }
      else if (e.code === 'Space' && isGameOver) {
        initGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hop, isGameOver, initGame]);

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
      const f = s.frog;

      if (!isGameOver) {
        // Decrement timer
        s.timer -= 1 / 60;
        if (s.timer <= 0) {
          killFrog('water');
        }

        // Update obstacles
        for (const obs of s.obstacles) {
          obs.x += obs.speed;
          if (obs.speed > 0 && obs.x > WIDTH) obs.x = -obs.w;
          else if (obs.speed < 0 && obs.x < -obs.w) obs.x = WIDTH;
        }

        const frogRow = Math.round(f.y / GRID_SIZE);

        // 1. Check Traffic Collisions (rows 7 - 11)
        if (frogRow >= 7 && frogRow <= 11) {
          for (const obs of s.obstacles) {
            if (obs.type === 'car' || obs.type === 'truck' || obs.type === 'racecar') {
              if (f.x + 6 < obs.x + obs.w && f.x + GRID_SIZE - 6 > obs.x &&
                  f.y + 6 < obs.y + obs.h && f.y + GRID_SIZE - 6 > obs.y) {
                killFrog('car');
                break;
              }
            }
          }
        }

        // 2. Check River & Floating Platform Rides (rows 1 - 5)
        if (frogRow >= 1 && frogRow <= 5) {
          let onPlatform = false;
          for (const obs of s.obstacles) {
            if (obs.type === 'log' || obs.type === 'turtle') {
              if (f.x + 8 < obs.x + obs.w && f.x + GRID_SIZE - 8 > obs.x &&
                  f.y + 8 < obs.y + obs.h && f.y + GRID_SIZE - 8 > obs.y) {
                onPlatform = true;
                f.x += obs.speed; // Ride platform!
                break;
              }
            }
          }

          if (!onPlatform || f.x < 0 || f.x > WIDTH - GRID_SIZE) {
            killFrog('water');
          }
        }

        // 3. Check Home Lily Pads (row 0)
        if (frogRow === 0) {
          let foundHome = false;
          for (let i = 0; i < s.homeSlots.length; i++) {
            const h = s.homeSlots[i];
            if (Math.abs(f.x - h.x) < 22) {
              if (!h.filled) {
                h.filled = true;
                foundHome = true;
                sounds.playPoint();
                setHomesFilled([...s.homeSlots.map(slot => slot.filled)]);

                const bonus = 50 + Math.floor(s.timer) * 10;
                setScore(sc => {
                  const next = sc + bonus;
                  onScoreUpdate?.(next);
                  return next;
                });

                // Check if all 5 homes are filled
                if (s.homeSlots.every(slot => slot.filled)) {
                  sounds.playVictory();
                  setScore(sc => {
                    const next = sc + 1000;
                    onScoreUpdate?.(next);
                    return next;
                  });
                  setTimeout(() => {
                    s.homeSlots.forEach(slot => slot.filled = false);
                    setHomesFilled([false, false, false, false, false]);
                    resetFrog();
                  }, 800);
                } else {
                  resetFrog();
                }
              }
              break;
            }
          }

          if (!foundHome) {
            // Hit wall/shrub between homes
            killFrog('water');
          }
        }
      }

      // --- RENDER ---
      // Background: River (blue), Safe Medians (purple/green), Highway (dark grey)
      ctx.fillStyle = '#064e3b'; // Top header green
      ctx.fillRect(0, 0, WIDTH, GRID_SIZE);

      ctx.fillStyle = '#0284c7'; // River
      ctx.fillRect(0, GRID_SIZE, WIDTH, 5 * GRID_SIZE);

      ctx.fillStyle = '#475569'; // Median safe bank
      ctx.fillRect(0, 6 * GRID_SIZE, WIDTH, GRID_SIZE);

      ctx.fillStyle = '#1e293b'; // Road
      ctx.fillRect(0, 7 * GRID_SIZE, WIDTH, 5 * GRID_SIZE);

      ctx.fillStyle = '#475569'; // Starting bank
      ctx.fillRect(0, 12 * GRID_SIZE, WIDTH, 2 * GRID_SIZE);

      // Road lane markers (dashed white)
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([12, 12]);
      for (let r = 8; r <= 11; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID_SIZE);
        ctx.lineTo(WIDTH, r * GRID_SIZE);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw 5 Home Bays at Top
      for (let i = 0; i < s.homeSlots.length; i++) {
        const h = s.homeSlots[i];
        ctx.fillStyle = '#065f46';
        ctx.fillRect(h.x - 4, 0, 36, GRID_SIZE);
        if (h.filled) {
          // Green frog in home
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(h.x + 14, 18, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Obstacles
      for (const obs of s.obstacles) {
        ctx.fillStyle = obs.color;
        if (obs.type === 'log') {
          // Log rounded bark
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
          ctx.fill();
          ctx.fillStyle = '#b45309';
          ctx.fillRect(obs.x + 8, obs.y + 4, obs.w - 16, 4);
        } else if (obs.type === 'turtle') {
          // Turtle shells
          const count = Math.floor(obs.w / 28);
          for (let tc = 0; tc < count; tc++) {
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.ellipse(obs.x + 14 + tc * 28, obs.y + obs.h / 2, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#10b981';
            ctx.fillRect(obs.x + 10 + tc * 28, obs.y + 8, 8, 8);
          }
        } else {
          // Vehicles
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
          ctx.fill();
          // Headlights
          ctx.fillStyle = '#fef08a';
          const lightX = obs.speed > 0 ? obs.x + obs.w - 4 : obs.x + 2;
          ctx.fillRect(lightX, obs.y + 4, 3, 5);
          ctx.fillRect(lightX, obs.y + obs.h - 9, 3, 5);
        }
      }

      // Draw Frog
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(f.x + GRID_SIZE / 2, f.y + GRID_SIZE / 2, 11, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(f.x + GRID_SIZE / 2 - 5, f.y + 8, 4, 0, Math.PI * 2);
      ctx.arc(f.x + GRID_SIZE / 2 + 5, f.y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(f.x + GRID_SIZE / 2 - 5, f.y + 8, 2, 0, Math.PI * 2);
      ctx.arc(f.x + GRID_SIZE / 2 + 5, f.y + 8, 2, 0, Math.PI * 2);
      ctx.fill();

      // Time gauge bar at bottom
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, HEIGHT - 18, WIDTH, 18);
      ctx.fillStyle = s.timer > 15 ? '#22c55e' : '#ef4444';
      ctx.fillRect(10, HEIGHT - 14, (WIDTH - 20) * (s.timer / s.maxTimer), 10);

      // Game Over Screen
      if (isGameOver) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#ef4444';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2, HEIGHT / 2 + 25);

        ctx.fillStyle = '#22c55e';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO TRY AGAIN', WIDTH / 2, HEIGHT / 2 + 70);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, score, killFrog, resetFrog, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Top HUD */}
      <div className="w-full max-w-[468px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <span className="text-amber-400">SCORE: {score.toString().padStart(5, '0')}</span>
        <div className="flex items-center gap-1">
          {homesFilled.map((h, i) => (
            <span key={i} className={h ? 'text-emerald-400' : 'text-neutral-600'}>🐸</span>
          ))}
        </div>
        <span className="text-emerald-400">LIVES: {lives}</span>
      </div>

      <div className="relative w-full max-w-[468px] aspect-[468/504] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-emerald-400 mb-4 tracking-wider animate-pulse">
              FROGGER
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-arcade">
              Cross heavy traffic and jump across floating river logs to reach the 5 lily pad homes safely!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              START HOPPING
            </button>
          </div>
        )}
      </div>

      {/* D-Pad mobile controls */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 mt-4 px-2 md:hidden">
        <div></div>
        <button
          onClick={() => hop('up')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ▲ UP
        </button>
        <div></div>
        <button
          onClick={() => hop('left')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ◄
        </button>
        <button
          onClick={() => hop('down')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ▼
        </button>
        <button
          onClick={() => hop('right')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ►
        </button>
      </div>
    </div>
  );
};
