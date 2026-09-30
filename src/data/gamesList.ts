import { GameInfo } from '../types/game';

export const GAMES: GameInfo[] = [
  // Arcade & Action
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    category: 'arcade-action',
    renderMode: 'HTML5 <canvas>',
    year: 1978,
    tagline: 'Defend Earth from descending waves of alien invaders',
    description: 'Control your cannon at the bottom of the screen. Shoot down the invading alien armada before they touch down. Take shelter behind destructible defense bunkers and shoot the mystery UFO flying along the top for bonus points!',
    controls: [
      { key: '← / → or A / D', action: 'Move Cannon' },
      { key: 'Space / Tap', action: 'Fire Laser' },
      { key: 'P', action: 'Pause Game' }
    ],
    mobileControlsType: 'horizontal-action',
    actionButtonLabel: 'FIRE',
    highscoreKey: 'space_invaders_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'asteroids',
    title: 'Asteroids',
    category: 'arcade-action',
    renderMode: 'HTML5 <canvas>',
    year: 1979,
    tagline: 'Vector physics, rotational momentum, and space rock destruction',
    description: 'Pilot your triangular vector spacecraft in a perilous asteroid field. Rotate, fire your thruster with realistic inertia and velocity, and blast asteroids into smaller fragments while avoiding floating debris.',
    controls: [
      { key: '← / → or A / D', action: 'Rotate Ship' },
      { key: '↑ or W', action: 'Main Thruster' },
      { key: 'Space', action: 'Fire Photon' },
      { key: 'Shift / H', action: 'Hyperspace Jump' }
    ],
    mobileControlsType: 'dpad-action',
    actionButtonLabel: 'FIRE',
    highscoreKey: 'asteroids_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'frogger',
    title: 'Frogger',
    category: 'arcade-action',
    renderMode: 'HTML5 <canvas>',
    year: 1981,
    tagline: 'Cross highway traffic and navigate the treacherous river',
    description: 'Guide your brave frog across a multi-lane highway packed with speeding sports cars, trucks, and bulldozers, then hop across floating logs and diving turtles to reach the 5 safety lily pads at the top before the timer expires.',
    controls: [
      { key: 'Arrow Keys or WASD', action: 'Hop Direction' },
      { key: 'Swipe / D-Pad', action: 'Mobile Hop' }
    ],
    mobileControlsType: 'dpad-action',
    actionButtonLabel: 'HOP',
    highscoreKey: 'frogger_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'pacman',
    title: 'Pac-Man (Maze Chaser)',
    category: 'arcade-action',
    renderMode: 'HTML5 <canvas>',
    year: 1980,
    tagline: 'Gobble dots, chomp power energizers, and evade the ghosts',
    description: 'Navigate the neon arcade maze, clearing all yellow dots while being pursued by Blinky, Pinky, Inky, and Clyde. Grab the flashing Power Energizers in the corners to turn the ghosts vulnerable and chomp them for big bonus points!',
    controls: [
      { key: 'Arrow Keys or WASD', action: 'Steer Pac-Man' },
      { key: 'Swipe / D-Pad', action: 'Change Direction' }
    ],
    mobileControlsType: 'dpad-action',
    highscoreKey: 'pacman_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },

  // Physics & Timing
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    category: 'physics-timing',
    renderMode: 'HTML5 <canvas>',
    year: 2013,
    tagline: 'Simple one-button gravity mechanics with punishing precision',
    description: 'Tap or press Space to flap upward against continuous gravity. Thread through randomized gaps in green pipes. Every pipe cleared awards 1 point. Unlock bronze, silver, gold, and platinum arcade medals!',
    controls: [
      { key: 'Space / Tap Screen / ↑', action: 'Flap Wings' },
      { key: 'R', action: 'Restart' }
    ],
    mobileControlsType: 'tap-only',
    actionButtonLabel: 'FLAP',
    highscoreKey: 'flappy_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'lunar-lander',
    title: 'Lunar Lander',
    category: 'physics-timing',
    renderMode: 'HTML5 <canvas>',
    year: 1979,
    tagline: 'Manage gravity, momentum, and limited fuel for a soft lunar landing',
    description: 'Guide your lunar module onto safe flat landing pads on the moon surface. Rotate your thrusters to counter lateral drift and fire the main engine to decelerate. Land softly (speed < 1.5 m/s) on bonus pads (2x, 3x, 5x) before fuel runs dry!',
    controls: [
      { key: '← / → or A / D', action: 'Rotate Thrusters' },
      { key: '↑ or W or Space', action: 'Main Engine Burn' },
      { key: 'R', action: 'Reset Lander' }
    ],
    mobileControlsType: 'dpad-action',
    actionButtonLabel: 'THRUST',
    highscoreKey: 'lunar_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'pong',
    title: 'Pong (Classic 1972)',
    category: 'physics-timing',
    renderMode: 'HTML5 <canvas>',
    year: 1972,
    tagline: 'The timeless duel: deflection angles, progressive speed, and spin',
    description: 'The foundation of video gaming. Deflect the square ball back to your opponent. Ball speed increases with each volley. Hit near paddle edges to impart sharp deflection angles. Play against an adaptive AI or invite a friend in 2-Player local mode!',
    controls: [
      { key: 'W / S or ↑ / ↓', action: 'Move Paddle (P1)' },
      { key: 'I / K or Mouse', action: 'Move Paddle (P2 / Alt)' },
      { key: 'Drag / Touch Slider', action: 'Mobile Paddle' }
    ],
    mobileControlsType: 'vertical-action',
    highscoreKey: 'pong_hi',
    highscoreUnit: 'WINS',
    higherIsBetter: true,
  },

  // Grid Puzzles & Logic
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    category: 'puzzles-logic',
    renderMode: 'DOM elements / CSS Grid',
    year: 1990,
    tagline: 'Pure deduction, recursive cell expansion, and bomb flagging',
    description: 'Clear the minefield without detonating a single bomb! Numbers indicate adjacent explosive mines. Uncover blank squares with recursive flood-fill expansion. Right-click or long-press to plant warning flags on suspected mines.',
    controls: [
      { key: 'Left Click / Tap', action: 'Reveal Cell' },
      { key: 'Right Click / Long Press', action: 'Toggle Mine Flag' },
      { key: 'Smiley Face', action: 'Reset Field' }
    ],
    mobileControlsType: 'none',
    highscoreKey: 'minesweeper_hi',
    highscoreUnit: 'SECS',
    higherIsBetter: false,
  },
  {
    id: '2048',
    title: '2048',
    category: 'puzzles-logic',
    renderMode: 'DOM elements / CSS Grid',
    year: 2014,
    tagline: 'Slide matching powers of 2 together to forge the 2048 tile',
    description: 'Use your arrow keys or touch swipe gestures to slide tiles across the 4x4 grid. When two tiles with the same number collide, they merge into one with double value! Can you achieve the legendary 2048 tile and keep going to 4096?',
    controls: [
      { key: 'Arrow Keys or WASD', action: 'Slide Grid' },
      { key: 'Touch / Swipe', action: 'Mobile Slide' },
      { key: 'U', action: 'Undo Last Move' }
    ],
    mobileControlsType: 'dpad-action',
    highscoreKey: '2048_hi',
    highscoreUnit: 'PTS',
    higherIsBetter: true,
  },
  {
    id: 'memory-match',
    title: 'Memory Card Match',
    category: 'puzzles-logic',
    renderMode: 'DOM elements / CSS Grid',
    year: 1985,
    tagline: 'Flip face-down cards to match pairs with minimal moves & time',
    description: 'Test your spatial recall with face-down cards. Flip two at a time to uncover identical pairs. Includes multiple theme decks (Retro Arcade, Cyberpunk, Pixel RPG, Space Expedition) and move/accuracy tracking.',
    controls: [
      { key: 'Click / Tap Card', action: 'Flip Card' },
      { key: 'Theme Picker', action: 'Switch Deck' },
      { key: 'New Game', action: 'Reshuffle' }
    ],
    mobileControlsType: 'none',
    highscoreKey: 'memory_hi',
    highscoreUnit: 'MOVES',
    higherIsBetter: false,
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe & Connect 4',
    category: 'puzzles-logic',
    renderMode: 'DOM elements / CSS Grid',
    year: 1974,
    tagline: 'Strategic turn-based board classics with unbeatable Minimax AI',
    description: 'Play classic 3x3 Tic-Tac-Toe or vertical 7x6 Connect 4. Challenge a mathematically optimal Minimax AI engine that never loses, or switch to Casual / 2-Player local mode to compete against a friend on the same device!',
    controls: [
      { key: 'Click Column / Cell', action: 'Place Token' },
      { key: 'Game Mode Tab', action: 'Switch 3x3 or Connect 4' },
      { key: 'AI Difficulty', action: 'Minimax / Casual / 2P' }
    ],
    mobileControlsType: 'none',
    highscoreKey: 'board_games_hi',
    highscoreUnit: 'STREAK',
    higherIsBetter: true,
  },
];
