import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';

interface MemoryMatchProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  highScore: number;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const THEMES: Record<string, { name: string; symbols: string[] }> = {
  arcade: {
    name: 'Retro Arcade',
    symbols: ['👾', '🕹️', '🚀', '🛸', '👻', '🍒', '💣', '💎']
  },
  space: {
    name: 'Deep Space',
    symbols: ['🪐', '🌍', '🌟', '🛰️', '☄️', '🔭', '👨‍🚀', '🛸']
  },
  rpg: {
    name: 'Fantasy RPG',
    symbols: ['⚔️', '🛡️', '🏹', '🧙', '🐉', '🧪', '🗝️', '👑']
  },
  animals: {
    name: 'Cute Animals',
    symbols: ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐨']
  }
};

export const MemoryMatch: React.FC<MemoryMatchProps> = ({
  onScoreUpdate,
  onGameOver,
  highScore
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('arcade');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const symbols = THEMES[selectedTheme].symbols;
    const deckSymbols = [...symbols, ...symbols];

    // Fisher-Yates shuffle
    for (let i = deckSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckSymbols[i], deckSymbols[j]] = [deckSymbols[j], deckSymbols[i]];
    }

    const newCards: Card[] = deckSymbols.map((sym, index) => ({
      id: index,
      symbol: sym,
      isFlipped: false,
      isMatched: false
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimer(0);
    setIsGameActive(false);
    setIsGameOver(false);
  }, [selectedTheme]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isGameActive && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameActive, isGameOver]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length >= 2) return;
    const card = cards[id];
    if (card.isFlipped || card.isMatched) return;

    if (!isGameActive) setIsGameActive(true);

    sounds.playCardFlip();

    const newFlipped = [...flippedCards, id];
    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];

      if (firstCard.symbol === secondCard.symbol) {
        // Matched!
        setTimeout(() => {
          sounds.playMerge();
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true, isFlipped: true }
              : c
          ));
          setFlippedCards([]);
          setMatchedPairs(p => {
            const next = p + 1;
            if (next === 8) {
              // Won game!
              sounds.playVictory();
              setIsGameOver(true);
              confetti({ particleCount: 70, spread: 80 });
              onScoreUpdate?.(moves + 1);
            }
            return next;
          });
        }, 350);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[460px]">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-pixel text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="text-amber-400">MOVES: {moves}</span>
          <span className="text-neutral-500">PAIRS: {matchedPairs}/8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-pixel">{timer}s</span>
          <button
            onClick={initGame}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-[10px] cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="w-full p-4 bg-neutral-900 border-2 border-neutral-800 rounded-b-lg shadow-2xl flex flex-col items-center">
        {/* Theme Selector */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {Object.entries(THEMES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedTheme(key)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedTheme === key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* 4x4 Grid of Cards */}
        <div className="grid grid-cols-4 gap-3 w-full aspect-square max-w-[380px]">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || card.isFlipped}
              className={`aspect-square rounded-lg flex items-center justify-center text-3xl transition-all duration-300 transform cursor-pointer ${
                card.isFlipped || card.isMatched
                  ? card.isMatched
                    ? 'bg-emerald-950/80 border-2 border-emerald-500/70 shadow-lg shadow-emerald-500/20 scale-95'
                    : 'bg-neutral-800 border-2 border-amber-400 shadow-md rotate-y-180'
                  : 'bg-neutral-800 hover:bg-neutral-700 active:scale-95 border-2 border-neutral-700 shadow-md'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span>{card.symbol}</span>
              ) : (
                <span className="text-neutral-500 font-pixel text-lg">?</span>
              )}
            </button>
          ))}
        </div>

        {/* Win Banner */}
        {isGameOver && (
          <div className="mt-4 p-4 w-full bg-emerald-950/90 border border-emerald-500/60 rounded-lg text-center animate-fade-in">
            <h4 className="font-pixel text-emerald-400 text-sm mb-1">
              CONGRATULATIONS! ALL PAIRS MATCHED!
            </h4>
            <p className="text-xs text-neutral-300 font-sans-clean">
              Completed in {moves} moves and {timer} seconds!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
