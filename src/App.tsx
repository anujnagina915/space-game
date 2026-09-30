import React, { useState, useEffect } from 'react';
import { GameId, GameInfo } from './types/game';
import { GAMES } from './data/gamesList';
import { ArcadeCabinet } from './components/ArcadeCabinet';
import { GameSelector } from './components/GameSelector';

// Game Components
import { SpaceInvaders } from './games/SpaceInvaders';
import { Asteroids } from './games/Asteroids';
import { Frogger } from './games/Frogger';
import { PacMan } from './games/PacMan';
import { FlappyBird } from './games/FlappyBird';
import { LunarLander } from './games/LunarLander';
import { Pong } from './games/Pong';
import { Minesweeper } from './games/Minesweeper';
import { Game2048 } from './games/Game2048';
import { MemoryMatch } from './games/MemoryMatch';
import { TicTacToeAndConnect4 } from './games/TicTacToeAndConnect4';

import { Gamepad2, Trophy, Sparkles, Terminal, ChevronRight, LayoutGrid } from 'lucide-react';

export default function App() {
  const [activeGameId, setActiveGameId] = useState<GameId>('space-invaders');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  // Load high scores from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('omniarcade_highscores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleScoreUpdate = (gameKey: string, score: number, higherIsBetter: boolean) => {
    setHighScores(prev => {
      const current = prev[gameKey] || (higherIsBetter ? 0 : 999999);
      const isNewRecord = higherIsBetter ? score > current : score < current;
      if (isNewRecord) {
        const updated = { ...prev, [gameKey]: score };
        try {
          localStorage.setItem('omniarcade_highscores', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  };

  const activeGame = GAMES.find(g => g.id === activeGameId) || GAMES[0];
  const activeHighScore = highScores[activeGame.highscoreKey] || 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans-clean antialiased selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-pixel text-sm text-neutral-100 tracking-wider">
              OMNI<span className="text-amber-400">ARCADE</span>
            </h1>
            <p className="text-[10px] text-neutral-500 font-mono hidden sm:block">
              11 Classic Web Mini-Games · Canvas & DOM Architectures
            </p>
          </div>
        </div>

        {/* Quick Switcher Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatalogModal(!showCatalogModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-arcade font-bold cursor-pointer transition-all hover:border-amber-500/50"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">GAME SELECTOR</span>
            <span className="text-neutral-500 font-mono text-[10px]">(11)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center p-3 sm:p-6 max-w-6xl w-full mx-auto">
        {/* Game Horizontal Quick-Pills Carousel */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-4 mb-2 scrollbar-none">
          {GAMES.map(g => {
            const isCurrent = g.id === activeGameId;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGameId(g.id);
                  setShowCatalogModal(false);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-arcade font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <span>{g.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Arcade Cabinet */}
        <div className="w-full flex flex-col items-center">
          <ArcadeCabinet
            game={activeGame}
            highScore={activeHighScore}
            onOpenSelector={() => setShowCatalogModal(true)}
          >
            {activeGameId === 'space-invaders' && (
              <SpaceInvaders
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'asteroids' && (
              <Asteroids
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'frogger' && (
              <Frogger
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'pacman' && (
              <PacMan
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'flappy-bird' && (
              <FlappyBird
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'lunar-lander' && (
              <LunarLander
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'pong' && (
              <Pong
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'minesweeper' && (
              <Minesweeper
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === '2048' && (
              <Game2048
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'memory-match' && (
              <MemoryMatch
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
            {activeGameId === 'tic-tac-toe' && (
              <TicTacToeAndConnect4
                onScoreUpdate={(sc) => handleScoreUpdate(activeGame.highscoreKey, sc, activeGame.higherIsBetter)}
                highScore={activeHighScore}
              />
            )}
          </ArcadeCabinet>
        </div>

        {/* All Games Grid Catalog View (Collapsible / Full) */}
        <section className="w-full mt-10">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-pixel text-xs text-neutral-300 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              RETRO GAME VAULT & ARCHITECTURES
            </h2>
            <span className="text-xs text-neutral-500 font-mono">11 Playable Classics</span>
          </div>

          <GameSelector
            activeGameId={activeGameId}
            onSelectGame={(id) => {
              setActiveGameId(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            highScores={highScores}
          />
        </section>
      </main>

      {/* Footer & Architecture Notes */}
      <footer className="w-full border-t border-neutral-800 bg-neutral-900/50 py-8 px-4 mt-12 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="text-neutral-400">
            OmniArcade Studio · Built with HTML5 Canvas (Action / Physics) & DOM Elements / CSS Grid (Puzzles / Logic)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-500">
            <span>Web Audio API Synthesizer</span>
            <span>·</span>
            <span>Zero External Asset Dependencies</span>
            <span>·</span>
            <span>CRT Scanline Shader</span>
            <span>·</span>
            <span>1-Click Standalone HTML Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
