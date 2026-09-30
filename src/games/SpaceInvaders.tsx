import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface SpaceInvadersProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

export const SpaceInvaders: React.FC<SpaceInvadersProps> = ({
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
  const [isPaused, setIsPaused] = useState(false);

  // Game references
  const gameStateRef = useRef({
    player: { x: 230, y: 520, w: 32, h: 20, speed: 6 },
    bullets: [] as { x: number; y: number; w: number; h: number; vy: number }[],
    alienBullets: [] as { x: number; y: number; w: number; h: number; vy: number }[],
    aliens: [] as { x: number; y: number; w: number; h: number; row: number; col: number; alive: boolean; points: number; frame: number }[],
    bunkers: [] as { x: number; y: number; w: number; h: number; hp: number }[],
    ufo: null as { x: number; y: number; w: number; h: number; speed: number; points: number } | null,
    ufoTimer: 0,
    alienDir: 1,
    alienDrop: false,
    alienMoveTimer: 0,
    alienInterval: 650,
    keys: {} as Record<string, boolean>,
    lastTime: 0,
    animationId: 0,
    marchStep: 0,
  });

  const initGame = useCallback(() => {
    const s = gameStateRef.current;
    s.player = { x: 230, y: 520, w: 32, h: 20, speed: 6 };
    s.bullets = [];
    s.alienBullets = [];
    s.ufo = null;
    s.ufoTimer = 500;
    s.alienDir = 1;
    s.alienInterval = Math.max(120, 650 - (wave - 1) * 70);

    // Build Alien Grid (5 rows x 11 cols)
    s.aliens = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        const points = r === 0 ? 30 : r < 3 ? 20 : 10;
        s.aliens.push({
          x: 45 + c * 38,
          y: 75 + r * 30,
          w: 24,
          h: 18,
          row: r,
          col: c,
          alive: true,
          points,
          frame: 0
        });
      }
    }

    // Build Bunkers (4 bunkers of 4x3 blocks each)
    s.bunkers = [];
    const bunkerXPositions = [60, 160, 260, 360];
    bunkerXPositions.forEach(bx => {
      for (let by = 0; by < 3; by++) {
        for (let bcol = 0; bcol < 4; bcol++) {
          if (by === 2 && (bcol === 1 || bcol === 2)) continue; // archway
          s.bunkers.push({
            x: bx + bcol * 10,
            y: 450 + by * 10,
            w: 10,
            h: 10,
            hp: 3
          });
        }
      }
    });

    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  }, [wave]);

  // Handle player firing
  const firePlayerLaser = useCallback(() => {
    const s = gameStateRef.current;
    if (s.bullets.length < 2) {
      s.bullets.push({
        x: s.player.x + s.player.w / 2 - 2,
        y: s.player.y - 6,
        w: 4,
        h: 12,
        vy: -9
      });
      sounds.playLaser(980, 240, 0.08);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (isGameOver) {
          initGame();
        } else if (isPlaying && !isPaused) {
          firePlayerLaser();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(p => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, isGameOver, firePlayerLaser, initGame]);

  // Main Game Loop
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = (time: number) => {
      const s = gameStateRef.current;
      const dt = time - (s.lastTime || time);
      s.lastTime = time;

      if (!isPaused && !isGameOver) {
        // 1. Move Player
        if (s.keys['ArrowLeft'] || s.keys['a'] || s.keys['A']) {
          s.player.x = Math.max(15, s.player.x - s.player.speed);
        }
        if (s.keys['ArrowRight'] || s.keys['d'] || s.keys['D']) {
          s.player.x = Math.min(canvas.width - s.player.w - 15, s.player.x + s.player.speed);
        }

        // 2. Move Player Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.y += b.vy;

          if (b.y < -10) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Bunker collision
          let hitBunker = false;
          for (let k = s.bunkers.length - 1; k >= 0; k--) {
            const bk = s.bunkers[k];
            if (bk.hp > 0 && b.x < bk.x + bk.w && b.x + b.w > bk.x && b.y < bk.y + bk.h && b.y + b.h > bk.y) {
              bk.hp--;
              hitBunker = true;
              sounds.playClick(false);
              break;
            }
          }
          if (hitBunker) {
            s.bullets.splice(i, 1);
            continue;
          }

          // UFO collision
          if (s.ufo && b.x < s.ufo.x + s.ufo.w && b.x + b.w > s.ufo.x && b.y < s.ufo.y + s.ufo.h && b.y + b.h > s.ufo.y) {
            setScore(sc => {
              const newSc = sc + (s.ufo?.points || 100);
              onScoreUpdate?.(newSc);
              return newSc;
            });
            sounds.playPoint();
            s.ufo = null;
            s.bullets.splice(i, 1);
            continue;
          }

          // Alien collision
          for (let j = 0; j < s.aliens.length; j++) {
            const a = s.aliens[j];
            if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
              a.alive = false;
              s.bullets.splice(i, 1);
              sounds.playExplosion(0.12, true);

              setScore(sc => {
                const newSc = sc + a.points;
                onScoreUpdate?.(newSc);
                return newSc;
              });

              // Speed up alien tempo as more are destroyed
              const aliveCount = s.aliens.filter(al => al.alive).length;
              s.alienInterval = Math.max(90, 80 + aliveCount * 11);

              if (aliveCount === 0) {
                // Wave cleared!
                sounds.playVictory();
                setWave(w => w + 1);
                setTimeout(() => {
                  initGame();
                }, 1000);
              }
              break;
            }
          }
        }

        // 3. Move Aliens (March cycle)
        s.alienMoveTimer += dt;
        if (s.alienMoveTimer >= s.alienInterval) {
          s.alienMoveTimer = 0;
          s.marchStep = (s.marchStep + 1) % 4;

          const livingAliens = s.aliens.filter(a => a.alive);
          let changeDir = false;

          // Check boundary hits
          for (const a of livingAliens) {
            if ((s.alienDir === 1 && a.x + a.w + 14 >= canvas.width) ||
                (s.alienDir === -1 && a.x - 14 <= 0)) {
              changeDir = true;
              break;
            }
          }

          if (changeDir) {
            s.alienDir *= -1;
            for (const a of livingAliens) {
              a.y += 18;
              a.frame = a.frame === 0 ? 1 : 0;
              // Check alien invasion landing
              if (a.y + a.h >= s.player.y) {
                setIsGameOver(true);
                sounds.playGameOver();
                onGameOver?.(score);
              }
            }
          } else {
            for (const a of livingAliens) {
              a.x += s.alienDir * 12;
              a.frame = a.frame === 0 ? 1 : 0;
            }
          }

          // Random alien firing
          if (livingAliens.length > 0 && Math.random() < 0.45 && s.alienBullets.length < 4) {
            const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
            s.alienBullets.push({
              x: shooter.x + shooter.w / 2 - 2,
              y: shooter.y + shooter.h,
              w: 3,
              h: 10,
              vy: 4.5 + wave * 0.4
            });
          }
        }

        // 4. Move Alien Bullets
        for (let i = s.alienBullets.length - 1; i >= 0; i--) {
          const ab = s.alienBullets[i];
          ab.y += ab.vy;

          if (ab.y > canvas.height + 10) {
            s.alienBullets.splice(i, 1);
            continue;
          }

          // Bunker hit
          let hitBunker = false;
          for (let k = s.bunkers.length - 1; k >= 0; k--) {
            const bk = s.bunkers[k];
            if (bk.hp > 0 && ab.x < bk.x + bk.w && ab.x + ab.w > bk.x && ab.y < bk.y + bk.h && ab.y + ab.h > bk.y) {
              bk.hp--;
              hitBunker = true;
              break;
            }
          }
          if (hitBunker) {
            s.alienBullets.splice(i, 1);
            continue;
          }

          // Player hit
          if (ab.x < s.player.x + s.player.w && ab.x + ab.w > s.player.x && ab.y < s.player.y + s.player.h && ab.y + ab.h > s.player.y) {
            s.alienBullets.splice(i, 1);
            sounds.playExplosion(0.4);
            setLives(prevLives => {
              const next = prevLives - 1;
              if (next <= 0) {
                setIsGameOver(true);
                sounds.playGameOver();
                onGameOver?.(score);
              }
              return next;
            });
          }
        }

        // 5. Mystery UFO spawn & movement
        s.ufoTimer--;
        if (!s.ufo && s.ufoTimer <= 0) {
          s.ufo = {
            x: 0,
            y: 35,
            w: 36,
            h: 16,
            speed: 2.2,
            points: [50, 100, 150, 300][Math.floor(Math.random() * 4)]
          };
          s.ufoTimer = 900 + Math.random() * 600;
        }

        if (s.ufo) {
          s.ufo.x += s.ufo.speed;
          if (s.ufo.x > canvas.width) {
            s.ufo = null;
          }
        }
      }

      // 6. Render
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let sIdx = 0; sIdx < 40; sIdx++) {
        const sx = ((sIdx * 97) % canvas.width);
        const sy = ((sIdx * 153 + (time * 0.02)) % canvas.height);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Mystery UFO
      if (s.ufo) {
        ctx.fillStyle = '#ff2a5f';
        ctx.beginPath();
        ctx.ellipse(s.ufo.x + s.ufo.w / 2, s.ufo.y + s.ufo.h / 2, s.ufo.w / 2, s.ufo.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe600';
        ctx.fillRect(s.ufo.x + 8, s.ufo.y + 4, 4, 3);
        ctx.fillRect(s.ufo.x + 16, s.ufo.y + 4, 4, 3);
        ctx.fillRect(s.ufo.x + 24, s.ufo.y + 4, 4, 3);
      }

      // Draw Invaders
      s.aliens.forEach(al => {
        if (!al.alive) return;
        const color = al.row === 0 ? '#ff3b69' : al.row < 3 ? '#ffb300' : '#00e5ff';
        ctx.fillStyle = color;

        // Custom pixel-style alien silhouettes
        const cx = al.x;
        const cy = al.y;
        if (al.row === 0) {
          // Squid alien
          ctx.fillRect(cx + 6, cy, 12, 4);
          ctx.fillRect(cx + 4, cy + 4, 16, 6);
          ctx.fillRect(cx + 2, cy + 10, 20, 4);
          if (al.frame === 0) {
            ctx.fillRect(cx + 4, cy + 14, 4, 4);
            ctx.fillRect(cx + 16, cy + 14, 4, 4);
          } else {
            ctx.fillRect(cx + 8, cy + 14, 8, 4);
          }
        } else if (al.row < 3) {
          // Crab alien
          ctx.fillRect(cx + 4, cy, 16, 4);
          ctx.fillRect(cx + 2, cy + 4, 20, 6);
          ctx.fillRect(cx + 6, cy + 10, 12, 4);
          if (al.frame === 0) {
            ctx.fillRect(cx, cy + 10, 4, 6);
            ctx.fillRect(cx + 20, cy + 10, 4, 6);
          } else {
            ctx.fillRect(cx + 2, cy + 12, 4, 4);
            ctx.fillRect(cx + 18, cy + 12, 4, 4);
          }
        } else {
          // Octopus alien
          ctx.fillRect(cx + 4, cy, 16, 6);
          ctx.fillRect(cx + 2, cy + 6, 20, 6);
          if (al.frame === 0) {
            ctx.fillRect(cx, cy + 12, 6, 6);
            ctx.fillRect(cx + 18, cy + 12, 6, 6);
          } else {
            ctx.fillRect(cx + 6, cy + 12, 4, 6);
            ctx.fillRect(cx + 14, cy + 12, 4, 6);
          }
        }
      });

      // Draw Bunkers
      s.bunkers.forEach(bk => {
        if (bk.hp <= 0) return;
        const alpha = bk.hp === 3 ? 1 : bk.hp === 2 ? 0.7 : 0.4;
        ctx.fillStyle = `rgba(0, 255, 170, ${alpha})`;
        ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      });

      // Draw Bullets
      ctx.fillStyle = '#ffffff';
      s.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // Draw Alien Bullets (squiggly / vibrant)
      ctx.fillStyle = '#ff4466';
      s.alienBullets.forEach(ab => {
        ctx.fillRect(ab.x, ab.y, ab.w, ab.h);
      });

      // Draw Player Cannon
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(s.player.x, s.player.y + 8, s.player.w, s.player.h - 8);
      ctx.fillRect(s.player.x + s.player.w / 2 - 4, s.player.y, 8, 8);
      ctx.fillRect(s.player.x + 4, s.player.y + 4, s.player.w - 8, 4);

      // Defense boundary green line
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 550);
      ctx.lineTo(canvas.width, 550);
      ctx.stroke();

      // UI HUD at bottom
      ctx.fillStyle = '#00ffaa';
      for (let i = 0; i < lives; i++) {
        const lx = 20 + i * 26;
        ctx.fillRect(lx, 558, 18, 10);
        ctx.fillRect(lx + 7, 554, 4, 4);
      }

      // Overlays
      if (isGameOver) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff3366';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 25);

        ctx.fillStyle = '#00ffaa';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE OR TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 70);
      } else if (isPaused) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffe600';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isGameOver, score, wave, lives, onScoreUpdate, onGameOver, initGame]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Top Game Bar */}
      <div className="w-full max-w-[480px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex items-center gap-4">
          <span className="text-amber-400">SCORE: {score.toString().padStart(4, '0')}</span>
          <span className="text-neutral-500">HI: {highScore.toString().padStart(4, '0')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">WAVE {wave}</span>
          <span className="text-emerald-400">♥ x {lives}</span>
        </div>
      </div>

      {/* Screen Container */}
      <div className="relative w-full max-w-[480px] aspect-[480/580] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={480}
          height={580}
          className="w-full h-full object-contain block"
        />

        {/* Start Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-emerald-400 mb-4 tracking-wider animate-pulse">
              SPACE INVADERS
            </h2>
            <p className="text-xs text-neutral-400 max-w-xs mb-6 font-arcade">
              Defend Earth from the descending alien horde! Use bunkers for cover and target the mystery UFO.
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="w-full max-w-[480px] grid grid-cols-3 gap-2 mt-4 px-2 md:hidden">
        <button
          onTouchStart={() => { gameStateRef.current.keys['ArrowLeft'] = true; }}
          onTouchEnd={() => { gameStateRef.current.keys['ArrowLeft'] = false; }}
          onMouseDown={() => { gameStateRef.current.keys['ArrowLeft'] = true; }}
          onMouseUp={() => { gameStateRef.current.keys['ArrowLeft'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:scale-95 transition-transform"
        >
          ◄ LEFT
        </button>
        <button
          onClick={firePlayerLaser}
          className="h-14 bg-emerald-600 active:bg-emerald-500 text-neutral-950 font-pixel text-xs rounded border border-emerald-400 flex items-center justify-center active:scale-95 transition-transform shadow-md"
        >
          FIRE 🔥
        </button>
        <button
          onTouchStart={() => { gameStateRef.current.keys['ArrowRight'] = true; }}
          onTouchEnd={() => { gameStateRef.current.keys['ArrowRight'] = false; }}
          onMouseDown={() => { gameStateRef.current.keys['ArrowRight'] = true; }}
          onMouseUp={() => { gameStateRef.current.keys['ArrowRight'] = false; }}
          className="h-14 bg-neutral-800 active:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:scale-95 transition-transform"
        >
          RIGHT ►
        </button>
      </div>
    </div>
  );
};
