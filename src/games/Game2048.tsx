import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';

interface Game2048Props {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

type Board = number[][];

const TILE_STYLES: Record<number, string> = {
  2: 'bg-neutral-800 text-neutral-100 border border-neutral-700',
  4: 'bg-neutral-700 text-neutral-100 border border-neutral-600',
  8: 'bg-amber-600 text-amber-50 font-bold shadow-sm',
  16: 'bg-orange-600 text-orange-50 font-bold shadow-sm',
  32: 'bg-rose-600 text-rose-50 font-bold shadow-md',
  64: 'bg-red-600 text-red-50 font-bold shadow-md',
  128: 'bg-yellow-500 text-neutral-950 font-bold text-lg shadow-lg shadow-yellow-500/20',
  256: 'bg-amber-400 text-neutral-950 font-bold text-lg shadow-lg shadow-amber-400/30',
  512: 'bg-emerald-500 text-neutral-950 font-bold text-lg shadow-lg shadow-emerald-500/30',
  1024: 'bg-cyan-400 text-neutral-950 font-bold text-base shadow-xl shadow-cyan-400/40',
  2048: 'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-white font-pixel text-sm shadow-xl shadow-pink-500/50 animate-pulse',
  4096: 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-neutral-950 font-pixel text-sm shadow-2xl',
};

export const Game2048: React.FC<Game2048Props> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const [board, setBoard] = useState<Board>(() => Array(4).fill(0).map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(highScore);
  const [history, setHistory] = useState<{ board: Board; score: number } | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Spawn random tile (90% chance of 2, 10% chance of 4)
  const spawnTile = (currentBoard: Board): Board => {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return currentBoard;

    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const startNewGame = useCallback(() => {
    let b = Array(4).fill(0).map(() => Array(4).fill(0));
    b = spawnTile(b);
    b = spawnTile(b);
    setBoard(b);
    setScore(0);
    setHistory(null);
    setHasWon(false);
    setKeepPlaying(false);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const slideRow = (row: number[]) => {
    let filtered = row.filter(val => val !== 0);
    let pointsGained = 0;
    let merged = false;

    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        pointsGained += filtered[i];
        filtered[i + 1] = 0;
        merged = true;
      }
    }
    filtered = filtered.filter(val => val !== 0);
    while (filtered.length < 4) filtered.push(0);

    return { row: filtered, pointsGained, merged };
  };

  const checkGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < 3 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < 3 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (isGameOver || (hasWon && !keepPlaying)) return;

    let pointsEarned = 0;
    let anyMerged = false;
    let newBoard: Board = board.map(row => [...row]);

    if (dir === 'left') {
      for (let r = 0; r < 4; r++) {
        const { row, pointsGained, merged } = slideRow(newBoard[r]);
        newBoard[r] = row;
        pointsEarned += pointsGained;
        if (merged) anyMerged = true;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...newBoard[r]].reverse();
        const { row, pointsGained, merged } = slideRow(reversed);
        newBoard[r] = row.reverse();
        pointsEarned += pointsGained;
        if (merged) anyMerged = true;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        const { row, pointsGained, merged } = slideRow(col);
        for (let r = 0; r < 4; r++) newBoard[r][c] = row[r];
        pointsEarned += pointsGained;
        if (merged) anyMerged = true;
      }
    } else if (dir === 'down') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
        const { row, pointsGained, merged } = slideRow(col);
        for (let r = 0; r < 4; r++) newBoard[3 - r][c] = row[r];
        pointsEarned += pointsGained;
        if (merged) anyMerged = true;
      }
    }

    // Check if board state changed
    const boardChanged = JSON.stringify(board) !== JSON.stringify(newBoard);
    if (boardChanged) {
      setHistory({ board, score });
      const spawned = spawnTile(newBoard);
      setBoard(spawned);

      if (anyMerged) sounds.playMerge();
      else sounds.playSlide();

      const newScore = score + pointsEarned;
      setScore(newScore);
      onScoreUpdate?.(newScore);
      if (newScore > bestScore) setBestScore(newScore);

      // Check 2048 victory condition
      if (!hasWon) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (spawned[r][c] >= 2048) {
              setHasWon(true);
              sounds.playVictory();
              confetti({ particleCount: 75, spread: 80 });
            }
          }
        }
      }

      // Check Game Over
      if (checkGameOver(spawned)) {
        setIsGameOver(true);
        sounds.playGameOver();
        onGameOver?.(newScore);
      }
    }
  }, [board, score, bestScore, hasWon, keepPlaying, isGameOver, onScoreUpdate, onGameOver]);

  const undoMove = () => {
    if (!history) return;
    setBoard(history.board);
    setScore(history.score);
    setHistory(null);
    setIsGameOver(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); move('left'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); move('right'); }
      else if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); move('up'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); move('down'); }
      else if (e.code === 'KeyU') undoMove();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[420px]">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="text-amber-400">SCORE: {score}</span>
          <span className="text-neutral-500">BEST: {Math.max(score, bestScore)}</span>
        </div>
        <div className="flex items-center gap-2">
          {history && (
            <button
              onClick={undoMove}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 rounded text-[10px] cursor-pointer"
            >
              UNDO (U)
            </button>
          )}
          <button
            onClick={startNewGame}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-[10px] font-bold cursor-pointer"
          >
            NEW
          </button>
        </div>
      </div>

      {/* Board Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-b-lg shadow-2xl flex flex-col items-center"
      >
        <div className="grid grid-cols-4 gap-3 w-full aspect-square p-3 bg-neutral-950 border-2 border-neutral-800 rounded-lg">
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-md flex items-center justify-center font-bold text-xl transition-all duration-100 ${
                  val === 0
                    ? 'bg-neutral-900/60 border border-neutral-800/40'
                    : TILE_STYLES[val] || 'bg-purple-600 text-white'
                }`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Victory Modal */}
        {hasWon && !keepPlaying && (
          <div className="absolute inset-0 bg-neutral-950/90 rounded-b-lg flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-2xl font-pixel text-amber-400 mb-2 animate-bounce">
              YOU REACHED 2048!
            </h3>
            <p className="text-xs text-neutral-300 font-sans-clean mb-6">
              Incredible strategy! Would you like to keep climbing towards 4096?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-pixel text-xs rounded font-bold cursor-pointer"
              >
                KEEP PLAYING
              </button>
              <button
                onClick={startNewGame}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-pixel text-xs rounded cursor-pointer"
              >
                NEW GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/90 rounded-b-lg flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-2xl font-pixel text-rose-500 mb-2">
              GAME OVER
            </h3>
            <p className="text-xs text-neutral-400 font-pixel mb-6">
              FINAL SCORE: {score}
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-pixel text-xs rounded font-bold cursor-pointer shadow-lg"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Mobile D-Pad */}
        <div className="w-full max-w-[240px] grid grid-cols-3 gap-2 mt-4 md:hidden">
          <div></div>
          <button
            onClick={() => move('up')}
            className="h-12 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
          >
            ▲
          </button>
          <div></div>
          <button
            onClick={() => move('left')}
            className="h-12 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
          >
            ◄
          </button>
          <button
            onClick={() => move('down')}
            className="h-12 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
          >
            ▼
          </button>
          <button
            onClick={() => move('right')}
            className="h-12 bg-neutral-800 text-neutral-200 font-pixel text-xs rounded border border-neutral-700 flex items-center justify-center active:bg-neutral-700"
          >
            ►
          </button>
        </div>

        <div className="mt-3 text-xs text-neutral-500 font-sans-clean text-center hidden md:block">
          Use Arrow Keys or WASD to slide tiles
        </div>
      </div>
    </div>
  );
};
