import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface PacManProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

const TILE_SIZE = 24;
// 19 cols x 21 rows classic simplified maze
// 0: empty, 1: wall, 2: pellet, 3: energizer, 4: ghost house
const INITIAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,4,4,4,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const COLS = 19;
const ROWS = 21;
const WIDTH = COLS * TILE_SIZE; // 456
const HEIGHT = ROWS * TILE_SIZE; // 504

interface Ghost {
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  color: string;
  isFrightened: boolean;
  baseColor: string;
  speed: number;
}

export const PacMan: React.FC<PacManProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);

  const state = useRef({
    grid: JSON.parse(JSON.stringify(INITIAL_MAP)) as number[][],
    pacman: {
      x: 9 * TILE_SIZE + TILE_SIZE / 2,
      y: 16 * TILE_SIZE + TILE_SIZE / 2,
      dir: 'left' as 'up' | 'down' | 'left' | 'right',
      nextDir: 'left' as 'up' | 'down' | 'left' | 'right',
      mouthAngle: 0.2,
      mouthSpeed: 0.05,
      mouthMax: 0.45,
      speed: 2.2,
    },
    ghosts: [] as Ghost[],
    frightenedTimer: 0,
    ghostEatenMultiplier: 1,
    dotsRemaining: 0,
  });

  const initGame = useCallback(() => {
    state.current.grid = JSON.parse(JSON.stringify(INITIAL_MAP));
    state.current.pacman = {
      x: 9 * TILE_SIZE + TILE_SIZE / 2,
      y: 16 * TILE_SIZE + TILE_SIZE / 2,
      dir: 'left',
      nextDir: 'left',
      mouthAngle: 0.2,
      mouthSpeed: 0.05,
      mouthMax: 0.45,
      speed: 2.2,
    };

    state.current.ghosts = [
      { x: 9 * TILE_SIZE + 12, y: 8 * TILE_SIZE + 12, dir: 'left', color: '#ef4444', baseColor: '#ef4444', isFrightened: false, speed: 2.0 }, // Blinky
      { x: 8 * TILE_SIZE + 12, y: 10 * TILE_SIZE + 12, dir: 'up', color: '#f472b6', baseColor: '#f472b6', isFrightened: false, speed: 1.8 }, // Pinky
      { x: 9 * TILE_SIZE + 12, y: 10 * TILE_SIZE + 12, dir: 'up', color: '#38bdf8', baseColor: '#38bdf8', isFrightened: false, speed: 1.8 }, // Inky
      { x: 10 * TILE_SIZE + 12, y: 10 * TILE_SIZE + 12, dir: 'up', color: '#fb923c', baseColor: '#fb923c', isFrightened: false, speed: 1.8 }, // Clyde
    ];

    let dotCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.current.grid[r][c] === 2 || state.current.grid[r][c] === 3) dotCount++;
      }
    }
    state.current.dotsRemaining = dotCount;
    state.current.frightenedTimer = 0;

    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  const canMoveTo = (x: number, y: number): boolean => {
    // Check bounding box corners against map
    const r = 9;
    const points = [
      { col: Math.floor((x - r) / TILE_SIZE), row: Math.floor((y - r) / TILE_SIZE) },
      { col: Math.floor((x + r) / TILE_SIZE), row: Math.floor((y - r) / TILE_SIZE) },
      { col: Math.floor((x - r) / TILE_SIZE), row: Math.floor((y + r) / TILE_SIZE) },
      { col: Math.floor((x + r) / TILE_SIZE), row: Math.floor((y + r) / TILE_SIZE) },
    ];

    for (const pt of points) {
      if (pt.row < 0 || pt.row >= ROWS || pt.col < 0 || pt.col >= COLS) continue;
      if (state.current.grid[pt.row][pt.col] === 1) return false;
    }
    return true;
  };

  const setDirection = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    state.current.pacman.nextDir = dir;
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); setDirection('up'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); setDirection('down'); }
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); setDirection('left'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); setDirection('right'); }
      else if (e.code === 'Space' && isGameOver) {
        initGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection, isGameOver, initGame]);

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
      const p = s.pacman;

      if (!isGameOver) {
        // Frightened timer
        if (s.frightenedTimer > 0) {
          s.frightenedTimer--;
          if (s.frightenedTimer === 0) {
            s.ghosts.forEach(g => { g.isFrightened = false; g.color = g.baseColor; });
          }
        }

        // Try changing to desired nextDir if unblocked
        let nextX = p.x;
        let nextY = p.y;
        if (p.nextDir === 'up') nextY -= p.speed;
        else if (p.nextDir === 'down') nextY += p.speed;
        else if (p.nextDir === 'left') nextX -= p.speed;
        else if (p.nextDir === 'right') nextX += p.speed;

        if (canMoveTo(nextX, nextY)) {
          p.dir = p.nextDir;
          p.x = nextX;
          p.y = nextY;
        } else {
          // Keep continuing in current dir
          let curX = p.x;
          let curY = p.y;
          if (p.dir === 'up') curY -= p.speed;
          else if (p.dir === 'down') curY += p.speed;
          else if (p.dir === 'left') curX -= p.speed;
          else if (p.dir === 'right') curX += p.speed;

          if (canMoveTo(curX, curY)) {
            p.x = curX;
            p.y = curY;
          }
        }

        // Tunnel warp
        if (p.x < -10) p.x = WIDTH + 8;
        if (p.x > WIDTH + 10) p.x = -8;

        // Animated mouth
        p.mouthAngle += p.mouthSpeed;
        if (p.mouthAngle > p.mouthMax || p.mouthAngle < 0.05) {
          p.mouthSpeed = -p.mouthSpeed;
        }

        // Check Dot / Energizer consumption
        const curCol = Math.floor(p.x / TILE_SIZE);
        const curRow = Math.floor(p.y / TILE_SIZE);
        if (curRow >= 0 && curRow < ROWS && curCol >= 0 && curCol < COLS) {
          const tile = s.grid[curRow][curCol];
          if (tile === 2) {
            s.grid[curRow][curCol] = 0;
            s.dotsRemaining--;
            sounds.playChomp();
            setScore(sc => {
              const next = sc + 10;
              onScoreUpdate?.(next);
              return next;
            });
          } else if (tile === 3) {
            s.grid[curRow][curCol] = 0;
            s.dotsRemaining--;
            s.frightenedTimer = 380; // ~6.3 seconds
            s.ghostEatenMultiplier = 1;
            sounds.playPoint();
            s.ghosts.forEach(g => {
              g.isFrightened = true;
              g.color = '#3b82f6';
            });
            setScore(sc => {
              const next = sc + 50;
              onScoreUpdate?.(next);
              return next;
            });
          }

          // Level cleared?
          if (s.dotsRemaining <= 0) {
            sounds.playVictory();
            setTimeout(() => {
              initGame();
            }, 1000);
          }
        }

        // Move Ghosts (Simple grid patrol AI)
        const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
        s.ghosts.forEach(g => {
          let gx = g.x;
          let gy = g.y;
          const gSpeed = g.isFrightened ? 1.2 : g.speed;

          if (g.dir === 'up') gy -= gSpeed;
          else if (g.dir === 'down') gy += gSpeed;
          else if (g.dir === 'left') gx -= gSpeed;
          else if (g.dir === 'right') gx += gSpeed;

          // Check if unblocked or at intersection
          const isAligned = Math.round(g.x) % TILE_SIZE === 12 && Math.round(g.y) % TILE_SIZE === 12;

          if (canMoveTo(gx, gy) && (!isAligned || Math.random() < 0.85)) {
            g.x = gx;
            g.y = gy;
          } else {
            // Pick new valid random heading (excluding direct 180 turnaround if possible)
            const valid = directions.filter(d => {
              let tx = g.x;
              let ty = g.y;
              if (d === 'up') ty -= 6;
              else if (d === 'down') ty += 6;
              else if (d === 'left') tx -= 6;
              else if (d === 'right') tx += 6;
              return canMoveTo(tx, ty);
            });

            if (valid.length > 0) {
              g.dir = valid[Math.floor(Math.random() * valid.length)];
            }
          }

          // Tunnel wrap ghosts
          if (g.x < -10) g.x = WIDTH + 8;
          if (g.x > WIDTH + 10) g.x = -8;

          // Check Ghost collision with Pac-Man
          const dist = Math.hypot(p.x - g.x, p.y - g.y);
          if (dist < 18) {
            if (g.isFrightened) {
              // Pac-Man eats ghost!
              sounds.playMerge();
              g.x = 9 * TILE_SIZE + 12;
              g.y = 10 * TILE_SIZE + 12;
              g.isFrightened = false;
              g.color = g.baseColor;
              const bonus = 200 * s.ghostEatenMultiplier;
              s.ghostEatenMultiplier *= 2;
              setScore(sc => {
                const next = sc + bonus;
                onScoreUpdate?.(next);
                return next;
              });
            } else {
              // Ghost catches Pac-Man!
              sounds.playExplosion(0.4);
              setLives(l => {
                const next = l - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  sounds.playGameOver();
                  onGameOver?.(score);
                } else {
                  p.x = 9 * TILE_SIZE + TILE_SIZE / 2;
                  p.y = 16 * TILE_SIZE + TILE_SIZE / 2;
                  p.dir = 'left';
                  p.nextDir = 'left';
                }
                return next;
              });
            }
          }
        });
      }

      // --- RENDER ---
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw Maze
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = s.grid[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (tile === 1) {
            // Neon blue arcade wall
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          } else if (tile === 2) {
            // Yellow dot
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 3) {
            // Power Energizer
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Ghosts
      s.ghosts.forEach(g => {
        ctx.fillStyle = g.isFrightened ? (s.frightenedTimer < 100 && s.frightenedTimer % 20 < 10 ? '#ffffff' : '#3b82f6') : g.color;

        // Ghost dome + tentacle skirt
        ctx.beginPath();
        ctx.arc(g.x, g.y - 2, 10, Math.PI, 0, false);
        ctx.lineTo(g.x + 10, g.y + 10);
        ctx.lineTo(g.x + 4, g.y + 7);
        ctx.lineTo(g.x - 2, g.y + 10);
        ctx.lineTo(g.x - 8, g.y + 7);
        ctx.lineTo(g.x - 10, g.y + 10);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(g.x - 4, g.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(g.x + 4, g.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#1e3a8a';
        let pupilDx = 0;
        let pupilDy = 0;
        if (g.dir === 'left') pupilDx = -1.5;
        if (g.dir === 'right') pupilDx = 1.5;
        if (g.dir === 'up') pupilDy = -1.5;
        if (g.dir === 'down') pupilDy = 1.5;
        ctx.beginPath();
        ctx.arc(g.x - 4 + pupilDx, g.y - 2 + pupilDy, 1.5, 0, Math.PI * 2);
        ctx.arc(g.x + 4 + pupilDx, g.y - 2 + pupilDy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Pac-Man
      let angleOffset = 0;
      if (p.dir === 'down') angleOffset = Math.PI * 0.5;
      else if (p.dir === 'left') angleOffset = Math.PI;
      else if (p.dir === 'up') angleOffset = Math.PI * 1.5;

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        11,
        angleOffset + p.mouthAngle * Math.PI,
        angleOffset + (2 - p.mouthAngle) * Math.PI
      );
      ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();

      // Game Over Screen
      if (isGameOver) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#ef4444';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2, HEIGHT / 2 + 25);

        ctx.fillStyle = '#eab308';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO RESTART', WIDTH / 2, HEIGHT / 2 + 70);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, score, initGame, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="w-full max-w-[456px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <span className="text-amber-400">SCORE: {score.toString().padStart(5, '0')}</span>
        <span className="text-neutral-500">HI: {highScore.toString().padStart(5, '0')}</span>
        <span className="text-yellow-400">LIVES: {'🟡'.repeat(lives)}</span>
      </div>

      <div className="relative w-full max-w-[456px] aspect-[456/504] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-yellow-400 mb-4 tracking-wider animate-pulse">
              PAC-MAN
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-arcade">
              Chomp all pellets, grab power energizers to make ghosts vulnerable, and score massive combos!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-yellow-400/20 active:scale-95"
            >
              INSERT COIN
            </button>
          </div>
        )}
      </div>

      {/* D-Pad controls */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 mt-4 px-2 md:hidden">
        <div></div>
        <button
          onClick={() => setDirection('up')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ▲
        </button>
        <div></div>
        <button
          onClick={() => setDirection('left')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ◄
        </button>
        <button
          onClick={() => setDirection('down')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ▼
        </button>
        <button
          onClick={() => setDirection('right')}
          className="h-12 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center font-bold"
        >
          ►
        </button>
      </div>
    </div>
  );
};
