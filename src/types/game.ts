export type GameCategory = 'arcade-action' | 'physics-timing' | 'puzzles-logic';

export type GameId =
  | 'space-invaders'
  | 'asteroids'
  | 'frogger'
  | 'pacman'
  | 'flappy-bird'
  | 'lunar-lander'
  | 'pong'
  | 'minesweeper'
  | '2048'
  | 'memory-match'
  | 'tic-tac-toe';

export interface GameInfo {
  id: GameId;
  title: string;
  category: GameCategory;
  renderMode: 'HTML5 <canvas>' | 'DOM elements / CSS Grid';
  year: number;
  tagline: string;
  description: string;
  controls: { key: string; action: string }[];
  mobileControlsType?: 'dpad-action' | 'horizontal-action' | 'vertical-action' | 'tap-only' | 'none';
  actionButtonLabel?: string;
  highscoreKey: string;
  highscoreUnit: string;
  higherIsBetter: boolean;
}

export interface ArcadeState {
  activeGame: GameId;
  soundEnabled: boolean;
  scanlines: boolean;
  highScores: Record<string, number>;
}
