import React, { useState } from 'react';
import { GameInfo, GameCategory, GameId } from '../types/game';
import { GAMES } from '../data/gamesList';
import { Gamepad2, Sparkles, Flame, Brain, Play, Trophy, Code } from 'lucide-react';

interface GameSelectorProps {
  activeGameId: GameId;
  onSelectGame: (id: GameId) => void;
  highScores: Record<string, number>;
  onClose?: () => void;
}

const CATEGORIES: { id: GameCategory | 'all'; label: string; icon: React.ReactNode; count: number }[] = [
  { id: 'all', label: 'All Classics', icon: <Gamepad2 className="w-4 h-4" />, count: 11 },
  { id: 'arcade-action', label: 'Arcade & Action', icon: <Flame className="w-4 h-4" />, count: 4 },
  { id: 'physics-timing', label: 'Physics & Timing', icon: <Sparkles className="w-4 h-4" />, count: 3 },
  { id: 'puzzles-logic', label: 'Grid Puzzles & Logic', icon: <Brain className="w-4 h-4" />, count: 4 },
];

export const GameSelector: React.FC<GameSelectorProps> = ({
  activeGameId,
  onSelectGame,
  highScores,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = GAMES.filter(g => {
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.renderMode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl py-6 px-4">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-arcade font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-800 text-amber-400 shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className="text-[10px] text-neutral-500 font-mono">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 w-48 sm:w-60 font-sans-clean"
          />
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map(g => {
          const isSelected = g.id === activeGameId;
          const score = highScores[g.highscoreKey] || 0;

          return (
            <div
              key={g.id}
              onClick={() => {
                onSelectGame(g.id);
                onClose?.();
              }}
              className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-900/90 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-arcade font-bold text-base text-neutral-100 group-hover:text-amber-400 transition-colors">
                      {g.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-0.5">
                      <span>{g.year}</span>
                      <span>·</span>
                      <span className="text-emerald-400/90">{g.renderMode}</span>
                    </div>
                  </div>
                  {score > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-pixel text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>{score}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-400 font-sans-clean line-clamp-2 leading-relaxed mb-4">
                  {g.tagline}
                </p>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
                <span className="text-[11px] text-neutral-500 font-mono">
                  {g.controls[0]?.key}
                </span>

                <span
                  className={`flex items-center gap-1 font-arcade font-bold transition-all ${
                    isSelected ? 'text-amber-400' : 'text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isSelected ? 'PLAYING' : 'LAUNCH'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
