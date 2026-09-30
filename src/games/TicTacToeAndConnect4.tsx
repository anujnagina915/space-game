import React, { useState, useCallback, useEffect } from 'react';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';

interface BoardGamesProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

export const TicTacToeAndConnect4: React.FC<BoardGamesProps> = ({
  onScoreUpdate,
  highScore
}) => {
  const [activeTab, setActiveTab] = useState<'tictactoe' | 'connect4'>('tictactoe');
  const [playAgainstAI, setPlayAgainstAI] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState<'unbeatable' | 'casual'>('unbeatable');
  const [streak, setStreak] = useState(0);

  // --- TIC-TAC-TOE STATE ---
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);
  const [tttWinningLine, setTttWinningLine] = useState<number[] | null>(null);

  // --- CONNECT 4 STATE ---
  // 6 rows x 7 cols
  const [c4Board, setC4Board] = useState<(string | null)[][]>(() =>
    Array(6).fill(null).map(() => Array(7).fill(null))
  );
  const [c4Turn, setC4Turn] = useState<'Red' | 'Yellow'>('Red');
  const [c4Winner, setC4Winner] = useState<string | null>(null);
  const [c4WinningCells, setC4WinningCells] = useState<{ r: number; c: number }[] | null>(null);

  // --- TIC-TAC-TOE LOGIC ---
  const checkTttWinner = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diags
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: [a, b, c] };
      }
    }
    if (board.every(cell => cell !== null)) {
      return { winner: 'Tie', line: [] };
    }
    return null;
  };

  // Minimax for Tic-Tac-Toe
  const minimax = (board: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const res = checkTttWinner(board);
    if (res) {
      if (res.winner === 'O') return 10 - depth;
      if (res.winner === 'X') return depth - 10;
      return 0;
    }

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'O';
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'X';
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return best;
    }
  };

  const getBestTttMove = (board: (string | null)[]) => {
    if (aiDifficulty === 'casual' && Math.random() < 0.4) {
      // Casual random blunder
      const empties = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
      return empties[Math.floor(Math.random() * empties.length)];
    }

    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const handleTttClick = (index: number) => {
    if (tttBoard[index] || tttWinner) return;

    sounds.playClick(true);
    const newBoard = [...tttBoard];
    newBoard[index] = tttTurn;
    setTttBoard(newBoard);

    const winRes = checkTttWinner(newBoard);
    if (winRes) {
      handleTttEnd(winRes.winner, winRes.line);
      return;
    }

    if (playAgainstAI && tttTurn === 'X') {
      setTttTurn('O');
      setTimeout(() => {
        const aiMove = getBestTttMove(newBoard);
        if (aiMove !== -1) {
          newBoard[aiMove] = 'O';
          sounds.playClick(false);
          setTttBoard([...newBoard]);
          const aiWinRes = checkTttWinner(newBoard);
          if (aiWinRes) {
            handleTttEnd(aiWinRes.winner, aiWinRes.line);
          } else {
            setTttTurn('X');
          }
        }
      }, 300);
    } else {
      setTttTurn(tttTurn === 'X' ? 'O' : 'X');
    }
  };

  const handleTttEnd = (winner: string, line: number[]) => {
    setTttWinner(winner);
    setTttWinningLine(line);
    if (winner === 'X') {
      sounds.playVictory();
      confetti({ particleCount: 50, spread: 70 });
      setStreak(s => {
        const next = s + 1;
        onScoreUpdate?.(next);
        return next;
      });
    } else if (winner === 'Tie') {
      sounds.playBounce(300);
    } else {
      sounds.playGameOver();
      setStreak(0);
    }
  };

  const resetTtt = () => {
    setTttBoard(Array(9).fill(null));
    setTttTurn('X');
    setTttWinner(null);
    setTttWinningLine(null);
  };

  // --- CONNECT 4 LOGIC ---
  const checkC4Winner = (board: (string | null)[][]) => {
    // Horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const p = board[r][c];
        if (p && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
          return { winner: p, cells: [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }] };
        }
      }
    }
    // Vertical
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 3; r++) {
        const p = board[r][c];
        if (p && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
          return { winner: p, cells: [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }] };
        }
      }
    }
    // Diagonal /
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const p = board[r][c];
        if (p && p === board[r - 1][c + 1] && p === board[r - 2][c + 2] && p === board[r - 3][c + 3]) {
          return { winner: p, cells: [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }] };
        }
      }
    }
    // Diagonal \
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const p = board[r][c];
        if (p && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
          return { winner: p, cells: [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }] };
        }
      }
    }
    // Full Tie
    if (board.every(row => row.every(cell => cell !== null))) {
      return { winner: 'Tie', cells: [] };
    }
    return null;
  };

  const dropChip = (col: number) => {
    if (c4Winner) return;

    // Find lowest open row in col
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (c4Board[r][col] === null) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return; // Column full

    sounds.playBounce(220 + targetRow * 30);
    const newBoard = c4Board.map(row => [...row]);
    newBoard[targetRow][col] = c4Turn;
    setC4Board(newBoard);

    const winRes = checkC4Winner(newBoard);
    if (winRes) {
      handleC4End(winRes.winner, winRes.cells);
      return;
    }

    if (playAgainstAI && c4Turn === 'Red') {
      setC4Turn('Yellow');
      setTimeout(() => {
        // AI heuristic move: check win, then block win, else center column priority
        const aiCol = getC4AiMove(newBoard);
        if (aiCol !== -1) {
          let aiRow = -1;
          for (let r = 5; r >= 0; r--) {
            if (newBoard[r][aiCol] === null) { aiRow = r; break; }
          }
          if (aiRow !== -1) {
            newBoard[aiRow][aiCol] = 'Yellow';
            sounds.playBounce(220 + aiRow * 30);
            setC4Board([...newBoard]);
            const aiWinRes = checkC4Winner(newBoard);
            if (aiWinRes) {
              handleC4End(aiWinRes.winner, aiWinRes.cells);
            } else {
              setC4Turn('Red');
            }
          }
        }
      }, 400);
    } else {
      setC4Turn(c4Turn === 'Red' ? 'Yellow' : 'Red');
    }
  };

  const getC4AiMove = (board: (string | null)[][]): number => {
    const validCols: number[] = [];
    for (let c = 0; c < 7; c++) {
      if (board[0][c] === null) validCols.push(c);
    }
    if (validCols.length === 0) return -1;

    // 1. Can AI win immediately?
    for (const c of validCols) {
      let r = -1;
      for (let row = 5; row >= 0; row--) { if (board[row][c] === null) { r = row; break; } }
      board[r][c] = 'Yellow';
      const win = checkC4Winner(board);
      board[r][c] = null;
      if (win?.winner === 'Yellow') return c;
    }

    // 2. Can player win next turn? Block!
    for (const c of validCols) {
      let r = -1;
      for (let row = 5; row >= 0; row--) { if (board[row][c] === null) { r = row; break; } }
      board[r][c] = 'Red';
      const win = checkC4Winner(board);
      board[r][c] = null;
      if (win?.winner === 'Red') return c;
    }

    // 3. Prefer center columns [3, 2, 4, 1, 5, 0, 6]
    const order = [3, 2, 4, 1, 5, 0, 6];
    for (const c of order) {
      if (validCols.includes(c)) return c;
    }
    return validCols[0];
  };

  const handleC4End = (winner: string, cells: { r: number; c: number }[]) => {
    setC4Winner(winner);
    setC4WinningCells(cells);
    if (winner === 'Red') {
      sounds.playVictory();
      confetti({ particleCount: 50, spread: 70 });
      setStreak(s => {
        const next = s + 1;
        onScoreUpdate?.(next);
        return next;
      });
    } else if (winner === 'Tie') {
      sounds.playBounce(300);
    } else {
      sounds.playGameOver();
      setStreak(0);
    }
  };

  const resetC4 = () => {
    setC4Board(Array(6).fill(null).map(() => Array(7).fill(null)));
    setC4Turn('Red');
    setC4Winner(null);
    setC4WinningCells(null);
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[500px]">
      {/* Game Mode Segmented Switcher */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tictactoe')}
            className={`px-3 py-1 rounded cursor-pointer ${
              activeTab === 'tictactoe' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-neutral-400'
            }`}
          >
            TIC-TAC-TOE
          </button>
          <button
            onClick={() => setActiveTab('connect4')}
            className={`px-3 py-1 rounded cursor-pointer ${
              activeTab === 'connect4' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40' : 'text-neutral-400'
            }`}
          >
            CONNECT 4
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayAgainstAI(!playAgainstAI)}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded text-[10px] cursor-pointer"
          >
            {playAgainstAI ? 'VS CPU' : '2-PLAYER'}
          </button>
          <span className="text-emerald-400 font-pixel">STREAK: {streak}</span>
        </div>
      </div>

      <div className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-b-lg shadow-2xl flex flex-col items-center">
        {/* --- TIC-TAC-TOE VIEW --- */}
        {activeTab === 'tictactoe' && (
          <div className="flex flex-col items-center w-full max-w-[320px]">
            <div className="flex items-center justify-between w-full mb-3 text-xs font-pixel text-neutral-400">
              <span>TURN: <span className={tttTurn === 'X' ? 'text-cyan-400' : 'text-rose-400'}>{tttTurn}</span></span>
              <button
                onClick={resetTtt}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
              >
                RESET
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full aspect-square p-2 bg-neutral-950 border-2 border-neutral-800 rounded-lg">
              {tttBoard.map((val, idx) => {
                const isWinCell = tttWinningLine?.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTttClick(idx)}
                    disabled={!!val || !!tttWinner}
                    className={`aspect-square rounded-md flex items-center justify-center font-pixel text-3xl font-bold transition-all cursor-pointer ${
                      val === 'X'
                        ? isWinCell ? 'bg-cyan-500 text-neutral-950 shadow-lg' : 'bg-neutral-900 text-cyan-400'
                        : val === 'O'
                        ? isWinCell ? 'bg-rose-500 text-neutral-950 shadow-lg' : 'bg-neutral-900 text-rose-400'
                        : 'bg-neutral-800/80 hover:bg-neutral-700 text-transparent'
                    }`}
                  >
                    {val || ''}
                  </button>
                );
              })}
            </div>

            {tttWinner && (
              <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-md text-center w-full">
                <span className="font-pixel text-xs text-amber-400">
                  {tttWinner === 'Tie' ? 'MATCH TIED!' : `${tttWinner} WINS THE ROUND!`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* --- CONNECT 4 VIEW --- */}
        {activeTab === 'connect4' && (
          <div className="flex flex-col items-center w-full max-w-[420px]">
            <div className="flex items-center justify-between w-full mb-3 text-xs font-pixel text-neutral-400">
              <span>
                TURN:{' '}
                <span className={c4Turn === 'Red' ? 'text-rose-400' : 'text-yellow-400'}>
                  {c4Turn}
                </span>
              </span>
              <button
                onClick={resetC4}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
              >
                RESET
              </button>
            </div>

            {/* Column Drop Buttons */}
            <div className="grid grid-cols-7 gap-1.5 w-full mb-1">
              {Array(7).fill(0).map((_, col) => (
                <button
                  key={col}
                  onClick={() => dropChip(col)}
                  disabled={c4Board[0][col] !== null || !!c4Winner}
                  className="h-7 bg-neutral-800/60 hover:bg-neutral-700 active:bg-neutral-600 rounded flex items-center justify-center text-xs text-neutral-400 font-pixel cursor-pointer transition-colors"
                >
                  ▼
                </button>
              ))}
            </div>

            {/* Connect 4 Blue Board */}
            <div className="grid grid-cols-7 gap-1.5 w-full p-2.5 bg-blue-700 border-4 border-blue-900 rounded-xl shadow-2xl">
              {c4Board.map((row, r) =>
                row.map((cell, c) => {
                  const isWinningCell = c4WinningCells?.some(pt => pt.r === r && pt.c === c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => dropChip(c)}
                      className={`aspect-square rounded-full flex items-center justify-center transition-all cursor-pointer shadow-inner ${
                        cell === 'Red'
                          ? isWinningCell
                            ? 'bg-rose-500 ring-4 ring-white animate-pulse'
                            : 'bg-rose-600 border-2 border-rose-800'
                          : cell === 'Yellow'
                          ? isWinningCell
                            ? 'bg-yellow-400 ring-4 ring-white animate-pulse'
                            : 'bg-yellow-500 border-2 border-yellow-700'
                          : 'bg-neutral-950 border-2 border-blue-800/80 hover:bg-neutral-900'
                      }`}
                    />
                  );
                })
              )}
            </div>

            {c4Winner && (
              <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-md text-center w-full">
                <span className="font-pixel text-xs text-amber-400">
                  {c4Winner === 'Tie' ? 'MATCH TIED!' : `${c4Winner.toUpperCase()} CONNECTED 4!`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
