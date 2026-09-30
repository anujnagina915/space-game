import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface FlappyBirdProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

const WIDTH = 380;
const HEIGHT = 520;
const GAP_SIZE = 115;
const PIPE_WIDTH = 52;
const GRAVITY = 0.32;
const JUMP = -6.4;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export const FlappyBird: React.FC<FlappyBirdProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const state = useRef({
    bird: { x: 75, y: 220, vy: 0, radius: 13, angle: 0 },
    pipes: [] as Pipe[],
    pipeTimer: 0,
    groundOffset: 0,
  });

  const flap = useCallback(() => {
    if (!isPlaying) return;
    if (isGameOver) {
      initGame();
      return;
    }
    state.current.bird.vy = JUMP;
    sounds.playFlap();
  }, [isPlaying, isGameOver]);

  const initGame = useCallback(() => {
    state.current.bird = { x: 75, y: 220, vy: 0, radius: 13, angle: 0 };
    state.current.pipes = [
      { x: 380, topHeight: 120 + Math.random() * 160, passed: false },
      { x: 580, topHeight: 120 + Math.random() * 160, passed: false }
    ];
    state.current.pipeTimer = 0;
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  // Keyboard & Tap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

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
      const b = s.bird;

      if (!isGameOver) {
        // Bird Physics
        b.vy += GRAVITY;
        b.y += b.vy;
        b.angle = Math.min(Math.PI / 2.5, Math.max(-Math.PI / 6, (b.vy / 8) * 0.8));

        // Ground & Ceiling collision
        if (b.y + b.radius >= HEIGHT - 50) {
          b.y = HEIGHT - 50 - b.radius;
          setIsGameOver(true);
          sounds.playExplosion(0.35);
          onGameOver?.(score);
        }
        if (b.y - b.radius <= 0) {
          b.y = b.radius;
          b.vy = 0;
        }

        // Scroll ground
        s.groundOffset = (s.groundOffset + 2) % 20;

        // Pipe spawning & movement
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const p = s.pipes[i];
          p.x -= 2.2;

          // Check if scored
          if (!p.passed && p.x + PIPE_WIDTH < b.x) {
            p.passed = true;
            sounds.playPoint();
            setScore(sc => {
              const next = sc + 1;
              onScoreUpdate?.(next);
              return next;
            });
          }

          // Offscreen
          if (p.x + PIPE_WIDTH < -10) {
            s.pipes.splice(i, 1);
            continue;
          }

          // Collision Check
          const bottomY = p.topHeight + GAP_SIZE;
          const inX = b.x + b.radius > p.x && b.x - b.radius < p.x + PIPE_WIDTH;
          const hitTop = inX && b.y - b.radius < p.topHeight;
          const hitBottom = inX && b.y + b.radius > bottomY;

          if (hitTop || hitBottom) {
            setIsGameOver(true);
            sounds.playExplosion(0.3);
            onGameOver?.(score);
          }
        }

        // Spawn next pipe
        const lastPipe = s.pipes[s.pipes.length - 1];
        if (!lastPipe || lastPipe.x < WIDTH - 180) {
          s.pipes.push({
            x: WIDTH + 10,
            topHeight: 90 + Math.random() * 200,
            passed: false
          });
        }
      }

      // --- RENDER ---
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT - 50);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(80, 80, 24, 0, Math.PI * 2);
      ctx.arc(110, 75, 30, 0, Math.PI * 2);
      ctx.arc(140, 80, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(280, 140, 20, 0, Math.PI * 2);
      ctx.arc(310, 135, 26, 0, Math.PI * 2);
      ctx.arc(340, 140, 20, 0, Math.PI * 2);
      ctx.fill();

      // Distant city silhouette
      ctx.fillStyle = '#93c5fd';
      for (let c = 0; c < 12; c++) {
        const bx = c * 35;
        const bh = 40 + ((c * 17) % 50);
        ctx.fillRect(bx, HEIGHT - 50 - bh, 30, bh);
      }

      // Draw Pipes
      s.pipes.forEach(p => {
        // Top pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 3, p.topHeight - 20, PIPE_WIDTH + 6, 20);

        // Bottom pipe
        const botY = p.topHeight + GAP_SIZE;
        const botH = HEIGHT - 50 - botY;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, botY, PIPE_WIDTH, botH);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 3, botY, PIPE_WIDTH + 6, 20);

        // Pipe highlights
        ctx.fillStyle = '#86efac';
        ctx.fillRect(p.x + 4, 0, 4, p.topHeight);
        ctx.fillRect(p.x + 4, botY, 4, botH);
      });

      // Ground
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, HEIGHT - 50, WIDTH, 50);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, HEIGHT - 50, WIDTH, 10);

      // Ground stripe treads
      ctx.fillStyle = '#ca8a04';
      for (let g = -20; g < WIDTH + 20; g += 20) {
        ctx.beginPath();
        ctx.moveTo(g - s.groundOffset, HEIGHT - 40);
        ctx.lineTo(g + 10 - s.groundOffset, HEIGHT);
        ctx.lineTo(g + 4 - s.groundOffset, HEIGHT);
        ctx.lineTo(g - 6 - s.groundOffset, HEIGHT - 40);
        ctx.fill();
      }

      // Draw Bird
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Body (round yellow)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Wing
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(8, -1);
      ctx.lineTo(16, 2);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // In-game score header
      if (!isGameOver) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.strokeText(`${score}`, WIDTH / 2, 70);
        ctx.fillText(`${score}`, WIDTH / 2, 70);
      }

      // Game Over Screen
      if (isGameOver) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.75)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#ef4444';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 50);

        // Score Card Box
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.fillRect(WIDTH / 2 - 120, HEIGHT / 2 - 25, 240, 110);
        ctx.strokeRect(WIDTH / 2 - 120, HEIGHT / 2 - 25, 240, 110);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('SCORE', WIDTH / 2 - 50, HEIGHT / 2 + 5);
        ctx.fillText('BEST', WIDTH / 2 + 50, HEIGHT / 2 + 5);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText(`${score}`, WIDTH / 2 - 50, HEIGHT / 2 + 35);
        ctx.fillText(`${Math.max(score, highScore)}`, WIDTH / 2 + 50, HEIGHT / 2 + 35);

        // Medal
        if (score >= 10) {
          const medal = score >= 40 ? '💎' : score >= 30 ? '🥇' : score >= 20 ? '🥈' : '🥉';
          ctx.font = '24px sans-serif';
          ctx.fillText(medal, WIDTH / 2, HEIGHT / 2 + 65);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('TAP OR PRESS SPACE', WIDTH / 2, HEIGHT / 2 + 130);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, score, highScore, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="w-full max-w-[380px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <span className="text-amber-400">SCORE: {score}</span>
        <span className="text-neutral-400">BEST: {highScore}</span>
      </div>

      <div
        onClick={flap}
        className="relative w-full max-w-[380px] aspect-[380/520] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-yellow-400 mb-4 tracking-wider animate-pulse">
              FLAPPY BIRD
            </h2>
            <p className="text-xs text-neutral-400 max-w-xs mb-6 font-arcade">
              Tap or press Space to flap wings. Fight gravity and thread the green pipe gauntlet!
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); initGame(); }}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-yellow-400/20 active:scale-95"
            >
              TAP TO FLY
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[380px] mt-4 px-2 md:hidden">
        <button
          onClick={flap}
          className="w-full h-16 bg-amber-500 active:bg-amber-400 text-neutral-950 font-pixel text-sm rounded border border-amber-300 flex items-center justify-center font-bold active:scale-98 shadow-md"
        >
          FLAP WINGS 🪽
        </button>
      </div>
    </div>
  );
};
