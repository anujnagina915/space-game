import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from '../audio/soundEffects';

interface PongProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

const WIDTH = 640;
const HEIGHT = 440;
const PADDLE_HEIGHT = 70;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;

export const Pong: React.FC<PongProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [mode, setMode] = useState<'1p' | '2p'>('1p');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const state = useRef({
    p1: { y: HEIGHT / 2 - PADDLE_HEIGHT / 2, vy: 0 },
    p2: { y: HEIGHT / 2 - PADDLE_HEIGHT / 2, vy: 0 },
    ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 5, vy: 2, speed: 5 },
    rallyCount: 0,
    keys: {} as Record<string, boolean>,
  });

  const resetBall = useCallback((towardsP1 = false) => {
    const s = state.current;
    s.ball.x = WIDTH / 2;
    s.ball.y = HEIGHT / 2;
    s.ball.speed = 5;
    const dir = towardsP1 ? -1 : 1;
    const angle = (Math.random() - 0.5) * 0.8;
    s.ball.vx = Math.cos(angle) * s.ball.speed * dir;
    s.ball.vy = Math.sin(angle) * s.ball.speed;
    s.rallyCount = 0;
  }, []);

  const initGame = useCallback(() => {
    state.current.p1.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.current.p2.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(Math.random() > 0.5);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setIsGameOver(false);
    setIsPlaying(true);
  }, [resetBall]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      state.current.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' && isGameOver) {
        initGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      state.current.keys[e.key] = false;
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
      const b = s.ball;

      if (!isGameOver) {
        // Player 1 controls (W/S or Up/Down if 1P)
        const p1Speed = 6;
        if (s.keys['w'] || s.keys['W'] || (mode === '1p' && (s.keys['ArrowUp'] || s.keys['Up']))) {
          s.p1.y = Math.max(10, s.p1.y - p1Speed);
        }
        if (s.keys['s'] || s.keys['S'] || (mode === '1p' && (s.keys['ArrowDown'] || s.keys['Down']))) {
          s.p1.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, s.p1.y + p1Speed);
        }

        // Player 2 controls / AI
        if (mode === '2p') {
          if (s.keys['ArrowUp'] || s.keys['Up']) {
            s.p2.y = Math.max(10, s.p2.y - p1Speed);
          }
          if (s.keys['ArrowDown'] || s.keys['Down']) {
            s.p2.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, s.p2.y + p1Speed);
          }
        } else {
          // AI Logic with difficulty tracking
          const targetY = b.y - PADDLE_HEIGHT / 2;
          const aiSpeed = difficulty === 'hard' ? 5.8 : difficulty === 'medium' ? 4.2 : 3.0;
          const deadzone = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 16 : 28;

          if (s.p2.y + PADDLE_HEIGHT / 2 < b.y - deadzone) {
            s.p2.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, s.p2.y + aiSpeed);
          } else if (s.p2.y + PADDLE_HEIGHT / 2 > b.y + deadzone) {
            s.p2.y = Math.max(10, s.p2.y - aiSpeed);
          }
        }

        // Ball movement
        b.x += b.vx;
        b.y += b.vy;

        // Wall bounce (Top & Bottom)
        if (b.y <= 10) {
          b.y = 10;
          b.vy = Math.abs(b.vy);
          sounds.playBounce(380);
        } else if (b.y + BALL_SIZE >= HEIGHT - 10) {
          b.y = HEIGHT - 10 - BALL_SIZE;
          b.vy = -Math.abs(b.vy);
          sounds.playBounce(380);
        }

        // P1 Paddle Collision (Left)
        const p1X = 25;
        if (b.x <= p1X + PADDLE_WIDTH && b.x + BALL_SIZE >= p1X &&
            b.y + BALL_SIZE >= s.p1.y && b.y <= s.p1.y + PADDLE_HEIGHT) {
          b.x = p1X + PADDLE_WIDTH;
          s.rallyCount++;
          // Angle deflection based on hit position
          const hitOffset = (b.y + BALL_SIZE / 2 - (s.p1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          const maxAngle = Math.PI / 3; // 60 degrees max
          const angle = hitOffset * maxAngle;

          b.speed = Math.min(13, 5 + s.rallyCount * 0.4);
          b.vx = Math.cos(angle) * b.speed;
          b.vy = Math.sin(angle) * b.speed;
          sounds.playBounce(520 + Math.round(hitOffset * 100));
        }

        // P2 Paddle Collision (Right)
        const p2X = WIDTH - 25 - PADDLE_WIDTH;
        if (b.x + BALL_SIZE >= p2X && b.x <= p2X + PADDLE_WIDTH &&
            b.y + BALL_SIZE >= s.p2.y && b.y <= s.p2.y + PADDLE_HEIGHT) {
          b.x = p2X - BALL_SIZE;
          s.rallyCount++;
          const hitOffset = (b.y + BALL_SIZE / 2 - (s.p2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          const maxAngle = Math.PI / 3;
          const angle = hitOffset * maxAngle;

          b.speed = Math.min(13, 5 + s.rallyCount * 0.4);
          b.vx = -Math.cos(angle) * b.speed;
          b.vy = Math.sin(angle) * b.speed;
          sounds.playBounce(480 + Math.round(hitOffset * 100));
        }

        // Score Goal Check
        if (b.x < 0) {
          // P2 scores
          sounds.playPoint();
          setP2Score(prev => {
            const next = prev + 1;
            if (next >= 7) {
              setIsGameOver(true);
              setWinner(mode === '1p' ? 'COMPUTER' : 'PLAYER 2');
              sounds.playGameOver();
            } else {
              resetBall(true);
            }
            return next;
          });
        } else if (b.x > WIDTH) {
          // P1 scores
          sounds.playPoint();
          setP1Score(prev => {
            const next = prev + 1;
            onScoreUpdate?.(next);
            if (next >= 7) {
              setIsGameOver(true);
              setWinner('PLAYER 1');
              sounds.playVictory();
            } else {
              resetBall(false);
            }
            return next;
          });
        }
      }

      // --- RENDER ---
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Center dashed net
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top/Bottom walls
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, WIDTH, 8);
      ctx.fillRect(0, HEIGHT - 8, WIDTH, 8);

      // Scoreboard numbers
      ctx.fillStyle = '#64748b';
      ctx.font = '40px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${p1Score}`, WIDTH / 2 - 80, 70);
      ctx.fillText(`${p2Score}`, WIDTH / 2 + 80, 70);

      // Draw Paddles
      ctx.fillStyle = '#38bdf8'; // P1 Blue
      ctx.fillRect(25, s.p1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = mode === '1p' ? '#f43f5e' : '#10b981'; // P2 Red / Green
      ctx.fillRect(WIDTH - 25 - PADDLE_WIDTH, s.p2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Ball (glow square)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x, b.y, BALL_SIZE, BALL_SIZE);

      // Game Over Screen
      if (isGameOver && winner) {
        ctx.fillStyle = 'rgba(5, 7, 10, 0.85)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = winner === 'PLAYER 1' ? '#10b981' : '#ef4444';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${winner} WINS!`, WIDTH / 2, HEIGHT / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('FIRST TO 7 POINTS VICTORIOUS', WIDTH / 2, HEIGHT / 2 + 25);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO PLAY AGAIN', WIDTH / 2, HEIGHT / 2 + 70);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, winner, mode, difficulty, p1Score, p2Score, resetBall, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Top Options Bar */}
      <div className="w-full max-w-[640px] flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(m => m === '1p' ? '2p' : '1p')}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-cyan-400 cursor-pointer"
          >
            MODE: {mode.toUpperCase()}
          </button>
          {mode === '1p' && (
            <button
              onClick={() => setDifficulty(d => d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : 'easy')}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-amber-400 cursor-pointer"
            >
              AI: {difficulty.toUpperCase()}
            </button>
          )}
        </div>
        <div className="text-emerald-400 font-pixel">
          FIRST TO 7
        </div>
      </div>

      <div className="relative w-full max-w-[640px] aspect-[640/440] bg-black border-2 border-neutral-800 rounded-b-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full h-full object-contain block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-pixel text-white mb-4 tracking-wider animate-pulse">
              PONG (1972)
            </h2>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 font-arcade">
              The game that started an industry. Master paddle angle deflection, spin, and velocity acceleration!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-neutral-950 font-pixel text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg active:scale-95"
            >
              START MATCH
            </button>
          </div>
        )}
      </div>

      {/* Touch slider paddle control for mobile */}
      <div className="w-full max-w-[640px] flex items-center justify-between gap-4 mt-4 px-2 md:hidden">
        <button
          onTouchStart={() => { state.current.keys['w'] = true; }}
          onTouchEnd={() => { state.current.keys['w'] = false; }}
          onMouseDown={() => { state.current.keys['w'] = true; }}
          onMouseUp={() => { state.current.keys['w'] = false; }}
          className="flex-1 h-14 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
        >
          ▲ UP
        </button>
        <button
          onTouchStart={() => { state.current.keys['s'] = true; }}
          onTouchEnd={() => { state.current.keys['s'] = false; }}
          onMouseDown={() => { state.current.keys['s'] = true; }}
          onMouseUp={() => { state.current.keys['s'] = false; }}
          className="flex-1 h-14 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
        >
          ▼ DOWN
        </button>
      </div>
    </div>
  );
};
