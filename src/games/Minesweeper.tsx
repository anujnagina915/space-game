import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';

interface MinesweeperProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const NUMBER_COLORS = [
  '',
  'text-blue-400',
  'text-emerald-400',
  'text-rose-400',
  'text-purple-400',
  'text-amber-400',
  'text-cyan-400',
  'text-neutral-200',
  'text-neutral-400'
];

export const Minesweeper: React.FC<MinesweeperProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate'>('beginner');
  const rows = difficulty === 'beginner' ? 9 : 14;
  const cols = difficulty === 'beginner' ? 9 : 14;
  const mineCount = difficulty === 'beginner' ? 10 : 32;

  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(mineCount);
  const [timer, setTimer] = useState(0);
  const [faceStatus, setFaceStatus] = useState<'normal' | 'scared' | 'won' | 'dead'>('normal');
  const [flagMode, setFlagMode] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize clean empty board
  const createEmptyBoard = useCallback((r: number, c: number) => {
    const grid: Cell[][] = [];
    for (let i = 0; i < r; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < c; j++) {
        row.push({
          row: i,
          col: j,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBoard(createEmptyBoard(rows, cols));
    setGameStarted(false);
    setIsGameOver(false);
    setHasWon(false);
    setFlagsLeft(mineCount);
    setTimer(0);
    setFaceStatus('normal');
  }, [rows, cols, mineCount, createEmptyBoard]);

  useEffect(() => {
    resetGame();
  }, [difficulty, resetGame]);

  // Timer loop
  useEffect(() => {
    if (gameStarted && !isGameOver && !hasWon) {
      timerRef.current = setInterval(() => {
        setTimer(t => Math.min(999, t + 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isGameOver, hasWon]);

  // Seed mines avoiding first clicked cell
  const populateMines = (initialBoard: Cell[][], startRow: number, startCol: number) => {
    let placed = 0;
    while (placed < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      // Safe 3x3 surrounding zone on first click
      if (Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1) continue;
      if (!initialBoard[r][c].isMine) {
        initialBoard[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (initialBoard[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && initialBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        initialBoard[r][c].neighborMines = count;
      }
    }
    return initialBoard;
  };

  // Reveal cell with recursive flood-fill
  const revealCell = (r: number, c: number) => {
    if (isGameOver || hasWon) return;

    let currentBoard = [...board.map(row => [...row])];

    if (!gameStarted) {
      currentBoard = populateMines(currentBoard, r, c);
      setGameStarted(true);
    }

    const cell = currentBoard[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    if (cell.isMine) {
      // Detonate!
      sounds.playExplosion(0.5);
      // Reveal all mines
      currentBoard.forEach(row => {
        row.forEach(cl => {
          if (cl.isMine) cl.isRevealed = true;
        });
      });
      setBoard(currentBoard);
      setIsGameOver(true);
      setFaceStatus('dead');
      sounds.playGameOver();
      onGameOver?.(timer);
      return;
    }

    // Recursive reveal
    const toVisit = [[r, c]];
    sounds.playClick(true);

    while (toVisit.length > 0) {
      const [cr, cc] = toVisit.pop()!;
      const target = currentBoard[cr][cc];
      if (target.isRevealed || target.isFlagged) continue;

      target.isRevealed = true;

      if (target.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (!currentBoard[nr][nc].isRevealed && !currentBoard[nr][nc].isFlagged) {
                toVisit.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    // Check Victory condition: all non-mine cells revealed
    let unrevealedSafe = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!currentBoard[i][j].isMine && !currentBoard[i][j].isRevealed) {
          unrevealedSafe++;
        }
      }
    }

    setBoard(currentBoard);

    if (unrevealedSafe === 0) {
      setHasWon(true);
      setFaceStatus('won');
      sounds.playVictory();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onScoreUpdate?.(timer);
    }
  };

  // Toggle Flag
  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isGameOver || hasWon) return;

    const currentBoard = [...board.map(row => [...row])];
    const cell = currentBoard[r][c];
    if (cell.isRevealed) return;

    if (!cell.isFlagged && flagsLeft <= 0) return;

    cell.isFlagged = !cell.isFlagged;
    sounds.playClick(false);
    setFlagsLeft(prev => cell.isFlagged ? prev - 1 : prev + 1);
    setBoard(currentBoard);
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[480px]">
      {/* Mode Switcher */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex gap-2">
          <button
            onClick={() => setDifficulty('beginner')}
            className={`px-2 py-1 rounded cursor-pointer ${difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-neutral-400'}`}
          >
            BEGINNER
          </button>
          <button
            onClick={() => setDifficulty('intermediate')}
            className={`px-2 py-1 rounded cursor-pointer ${difficulty === 'intermediate' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-neutral-400'}`}
          >
            INTERMEDIATE
          </button>
        </div>
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={`px-2 py-1 rounded text-xs cursor-pointer md:hidden ${flagMode ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50' : 'bg-neutral-800 text-neutral-300'}`}
        >
          {flagMode ? '🚩 MODE: ON' : '⛏️ DIG MODE'}
        </button>
      </div>

      {/* Retro Windows 95 / Modern Dark Arcade Cabinet Style Frame */}
      <div className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-b-lg shadow-2xl flex flex-col items-center">
        {/* Header Display */}
        <div className="w-full flex items-center justify-between p-3 bg-neutral-950 border-2 border-neutral-800 rounded-md mb-4 shadow-inner">
          {/* Bomb Counter */}
          <div className="bg-black px-3 py-1 rounded border border-neutral-800 font-pixel text-rose-500 text-lg tracking-widest min-w-[70px] text-center">
            {Math.max(0, flagsLeft).toString().padStart(3, '0')}
          </div>

          {/* Smiley Button */}
          <button
            onClick={resetGame}
            onMouseDown={() => !isGameOver && !hasWon && setFaceStatus('scared')}
            onMouseUp={() => !isGameOver && !hasWon && setFaceStatus('normal')}
            className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-md border-2 border-neutral-700 flex items-center justify-center text-2xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {faceStatus === 'dead' ? '😵' : faceStatus === 'won' ? '😎' : faceStatus === 'scared' ? '😮' : '🙂'}
          </button>

          {/* Stopwatch */}
          <div className="bg-black px-3 py-1 rounded border border-neutral-800 font-pixel text-rose-500 text-lg tracking-widest min-w-[70px] text-center">
            {timer.toString().padStart(3, '0')}
          </div>
        </div>

        {/* The Grid */}
        <div
          className="grid gap-[2px] p-2 bg-neutral-950 border-2 border-neutral-800 rounded-md"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: difficulty === 'beginner' ? '320px' : '440px',
            maxWidth: '100%',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(r, c, e)}
                disabled={cell.isRevealed}
                className={`aspect-square flex items-center justify-center font-bold text-sm transition-colors rounded-[2px] cursor-pointer select-none ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-rose-600 text-white'
                      : 'bg-neutral-900 border border-neutral-800/80'
                    : 'bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border-t border-l border-neutral-700 border-b-2 border-r-2 border-neutral-900 shadow-sm'
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    '💣'
                  ) : cell.neighborMines > 0 ? (
                    <span className={`font-pixel text-[11px] ${NUMBER_COLORS[cell.neighborMines]}`}>
                      {cell.neighborMines}
                    </span>
                  ) : null
                ) : cell.isFlagged ? (
                  '🚩'
                ) : null}
              </button>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs text-neutral-500 font-sans-clean text-center">
          Left-Click to Reveal · Right-Click to Flag · Mobile: Use Toggle Button
        </div>
      </div>
    </div>
  );
};
