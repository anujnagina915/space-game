import { GameId } from '../types/game';

export function getStandaloneCode(gameId: GameId): string {
  switch (gameId) {
    case 'space-invaders':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Invaders - Single File HTML5 Canvas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #06070a;
      color: #00ffaa;
      font-family: monospace, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    #hud {
      display: flex;
      justify-content: space-between;
      width: 480px;
      margin-bottom: 8px;
      font-size: 14px;
      letter-spacing: 1px;
    }
    canvas {
      border: 3px solid #1e293b;
      background: #000;
      box-shadow: 0 0 25px rgba(0, 255, 170, 0.2);
    }
    .controls {
      margin-top: 12px;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div>SCORE: <span id="score">0</span></div>
    <div>LIVES: <span id="lives">3</span></div>
    <div>WAVE: <span id="wave">1</span></div>
  </div>
  <canvas id="game" width="480" height="540"></canvas>
  <div class="controls">◄ / ► or A / D to Move | SPACE to Shoot | P to Pause</div>

  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const waveEl = document.getElementById('wave');

    let score = 0, lives = 3, wave = 1, gameOver = false, paused = false;
    let player = { x: 220, y: 500, w: 28, h: 16, speed: 5 };
    let bullets = [], alienBullets = [], invaders = [];
    let invaderDir = 1, lastMoveTime = 0, moveInterval = 600;
    const keys = {};

    function initWave() {
      invaders = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 10; c++) {
          invaders.push({
            x: 40 + c * 38,
            y: 60 + r * 30,
            w: 24,
            h: 18,
            type: r === 0 ? 30 : (r < 3 ? 20 : 10),
            alive: true
          });
        }
      }
      moveInterval = Math.max(150, 600 - (wave - 1) * 80);
      invaderDir = 1;
    }

    initWave();

    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      if (e.code === 'Space' && !gameOver && !paused) {
        if (bullets.length < 3) {
          bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10, speed: 8 });
        }
      }
      if (e.key === 'p' || e.key === 'P') paused = !paused;
      if (gameOver && (e.code === 'Space' || e.key === 'Enter')) {
        score = 0; lives = 3; wave = 1; gameOver = false;
        scoreEl.innerText = score; livesEl.innerText = lives; waveEl.innerText = wave;
        initWave();
      }
    });
    window.addEventListener('keyup', e => keys[e.key] = false);

    function update(time) {
      if (gameOver || paused) return;

      if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(10, player.x - player.speed);
      if (keys['ArrowRight'] || keys['d']) player.x = Math.min(canvas.width - player.w - 10, player.x + player.speed);

      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) { bullets.splice(i, 1); continue; }

        for (let inv of invaders) {
          if (inv.alive && bullets[i] &&
              bullets[i].x < inv.x + inv.w && bullets[i].x + bullets[i].w > inv.x &&
              bullets[i].y < inv.y + inv.h && bullets[i].y + bullets[i].h > inv.y) {
            inv.alive = false;
            score += inv.type;
            scoreEl.innerText = score;
            bullets.splice(i, 1);
            break;
          }
        }
      }

      if (time - lastMoveTime > moveInterval) {
        lastMoveTime = time;
        let edgeReached = false;
        const living = invaders.filter(i => i.alive);
        if (living.length === 0) {
          wave++;
          waveEl.innerText = wave;
          initWave();
          return;
        }

        for (let inv of living) {
          if ((invaderDir === 1 && inv.x + inv.w + 15 >= canvas.width) ||
              (invaderDir === -1 && inv.x - 15 <= 0)) {
            edgeReached = true;
            break;
          }
        }

        if (edgeReached) {
          invaderDir *= -1;
          for (let inv of living) {
            inv.y += 18;
            if (inv.y + inv.h >= player.y) { gameOver = true; }
          }
        } else {
          for (let inv of living) inv.x += invaderDir * 12;
        }

        if (Math.random() < 0.4 && alienBullets.length < 5) {
          const shooter = living[Math.floor(Math.random() * living.length)];
          alienBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, w: 3, h: 8, speed: 4 });
        }
      }

      for (let i = alienBullets.length - 1; i >= 0; i--) {
        alienBullets[i].y += alienBullets[i].speed;
        if (alienBullets[i].y > canvas.height) { alienBullets.splice(i, 1); continue; }

        if (alienBullets[i].x < player.x + player.w && alienBullets[i].x + alienBullets[i].w > player.x &&
            alienBullets[i].y < player.y + player.h && alienBullets[i].y + alienBullets[i].h > player.y) {
          alienBullets.splice(i, 1);
          lives--;
          livesEl.innerText = lives;
          if (lives <= 0) gameOver = true;
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(player.x, player.y + 6, player.w, player.h - 6);
      ctx.fillRect(player.x + player.w / 2 - 4, player.y, 8, 6);

      invaders.forEach(inv => {
        if (!inv.alive) return;
        ctx.fillStyle = inv.type === 30 ? '#ff3366' : inv.type === 20 ? '#ffaa00' : '#00ffff';
        ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
      });

      ctx.fillStyle = '#fff';
      bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

      ctx.fillStyle = '#ff3366';
      alienBullets.forEach(ab => ctx.fillRect(ab.x, ab.y, ab.w, ab.h));

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff3366';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 15);
        ctx.fillStyle = '#00ffaa';
        ctx.font = '14px monospace';
        ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 25);
      }
    }

    function loop(time) {
      update(time);
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;

    case 'asteroids':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asteroids - HTML5 Canvas Vector Physics</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #05070a; color: #38bdf8; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    canvas { border: 2px solid #334155; background: #000; box-shadow: 0 0 20px rgba(56, 189, 248, 0.2); }
    .hud { width: 600px; display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="hud">
    <div>SCORE: <span id="score">0</span></div>
    <div>LIVES: <span id="lives">3</span></div>
  </div>
  <canvas id="game" width="600" height="500"></canvas>
  <p style="margin-top:10px; color:#64748b;">◄ / ► Rotate | ▲ Thrust | SPACE Fire Laser</p>

  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let score = 0, lives = 3, gameOver = false;
    const ship = { x: 300, y: 250, r: 12, a: -Math.PI / 2, rot: 0, thrust: false, vx: 0, vy: 0 };
    let lasers = [], asteroids = [];
    const keys = {};

    function spawnAsteroids(count) {
      for (let i = 0; i < count; i++) {
        asteroids.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          r: 30,
          tier: 3
        });
      }
    }
    spawnAsteroids(4);

    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space' && !gameOver) {
        lasers.push({
          x: ship.x + Math.cos(ship.a) * ship.r,
          y: ship.y + Math.sin(ship.a) * ship.r,
          vx: Math.cos(ship.a) * 8 + ship.vx,
          vy: Math.sin(ship.a) * 8 + ship.vy,
          life: 40
        });
      }
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    function loop() {
      // Rotate & Thrust
      if (keys['ArrowLeft'] || keys['KeyA']) ship.a -= 0.08;
      if (keys['ArrowRight'] || keys['KeyD']) ship.a += 0.08;
      ship.thrust = !!(keys['ArrowUp'] || keys['KeyW']);

      if (ship.thrust) {
        ship.vx += Math.cos(ship.a) * 0.15;
        ship.vy += Math.sin(ship.a) * 0.15;
      }
      ship.vx *= 0.985;
      ship.vy *= 0.985;
      ship.x += ship.vx;
      ship.y += ship.vy;

      // Wrap
      if (ship.x < 0) ship.x += canvas.width;
      if (ship.x > canvas.width) ship.x -= canvas.width;
      if (ship.y < 0) ship.y += canvas.height;
      if (ship.y > canvas.height) ship.y -= canvas.height;

      // Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.x += l.vx; l.y += l.vy; l.life--;
        if (l.life <= 0) { lasers.splice(i, 1); continue; }

        for (let j = asteroids.length - 1; j >= 0; j--) {
          const a = asteroids[j];
          if (Math.hypot(l.x - a.x, l.y - a.y) < a.r) {
            lasers.splice(i, 1);
            score += a.tier * 20;
            document.getElementById('score').innerText = score;
            if (a.tier > 1) {
              asteroids.push({ x: a.x, y: a.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, r: a.r / 1.7, tier: a.tier - 1 });
              asteroids.push({ x: a.x, y: a.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, r: a.r / 1.7, tier: a.tier - 1 });
            }
            asteroids.splice(j, 1);
            break;
          }
        }
      }

      // Asteroids move
      for (const a of asteroids) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0) a.x += canvas.width;
        if (a.x > canvas.width) a.x -= canvas.width;
        if (a.y < 0) a.y += canvas.height;
        if (a.y > canvas.height) a.y -= canvas.height;

        if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.r + ship.r) {
          lives--;
          document.getElementById('lives').innerText = lives;
          ship.x = canvas.width / 2; ship.y = canvas.height / 2; ship.vx = 0; ship.vy = 0;
          if (lives <= 0) gameOver = true;
        }
      }

      if (asteroids.length === 0) spawnAsteroids(5);

      // Render
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      for (const a of asteroids) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#38bdf8';
      for (const l of lasers) {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ship
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.a);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.r * 1.4, 0);
      ctx.lineTo(-ship.r, -ship.r * 0.8);
      ctx.lineTo(-ship.r * 0.5, 0);
      ctx.lineTo(-ship.r, ship.r * 0.8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    case 'flappy-bird':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flappy Bird - HTML5 Canvas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    canvas { border: 2px solid #334155; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); cursor: pointer; }
  </style>
</head>
<body>
  <h2 style="margin-bottom:8px;">Flappy Bird</h2>
  <canvas id="c" width="360" height="500"></canvas>
  <p style="margin-top:10px; color:#94a3b8;">Click or Tap or Press SPACE to Flap</p>

  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let bird = { x: 60, y: 220, vy: 0, r: 12 };
    let pipes = [{ x: 360, top: 140, passed: false }];
    let score = 0, gameOver = false;

    function flap() {
      if (gameOver) {
        bird.y = 220; bird.vy = 0; pipes = [{ x: 360, top: 140, passed: false }]; score = 0; gameOver = false;
      } else {
        bird.vy = -6;
      }
    }
    window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); flap(); } });
    canvas.addEventListener('click', flap);

    function loop() {
      if (!gameOver) {
        bird.vy += 0.32;
        bird.y += bird.vy;

        if (bird.y + bird.r >= 460 || bird.y - bird.r <= 0) gameOver = true;

        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.x -= 2;
          if (!p.passed && p.x + 50 < bird.x) { p.passed = true; score++; }
          if (p.x < -60) pipes.splice(i, 1);

          if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + 50) {
            if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + 110) gameOver = true;
          }
        }

        if (pipes[pipes.length - 1].x < 200) {
          pipes.push({ x: 360, top: 80 + Math.random() * 200, passed: false });
        }
      }

      // Draw
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pipes
      ctx.fillStyle = '#22c55e';
      for (const p of pipes) {
        ctx.fillRect(p.x, 0, 50, p.top);
        ctx.fillRect(p.x, p.top + 110, 50, 460 - (p.top + 110));
      }

      // Ground
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 460, canvas.width, 40);

      // Bird
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
      ctx.fill();

      // Score
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(score, canvas.width / 2, 60);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    case 'minesweeper':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minesweeper - DOM Elements / CSS Grid</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; color: #fff; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    #board { display: grid; grid-template-columns: repeat(9, 34px); gap: 2px; background: #000; padding: 6px; border: 3px solid #334155; }
    .cell { width: 34px; height: 34px; background: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; user-select: none; border-radius: 2px; }
    .cell.revealed { background: #0f172a; cursor: default; }
    .header { width: 320px; display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
    button { background: #334155; color: #fff; border: none; padding: 4px 10px; cursor: pointer; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div>MINES: <span id="mines">10</span></div>
    <button onclick="init()">RESTART</button>
  </div>
  <div id="board"></div>
  <p style="margin-top:10px; color:#64748b;">Left-click: Reveal | Right-click: Flag</p>

  <script>
    let grid = [], rows = 9, cols = 9, mines = 10, gameOver = false;

    function init() {
      gameOver = false;
      const board = document.getElementById('board');
      board.innerHTML = '';
      grid = Array(rows).fill(0).map(() => Array(cols).fill(0).map(() => ({ mine: false, rev: false, flag: false, count: 0 })));

      // Plant mines
      let planted = 0;
      while (planted < mines) {
        let r = Math.floor(Math.random() * rows), c = Math.floor(Math.random() * cols);
        if (!grid[r][c].mine) { grid[r][c].mine = true; planted++; }
      }

      // Count
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].mine) continue;
          let cnt = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              let nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) cnt++;
            }
          }
          grid[r][c].count = cnt;
        }
      }

      // Render cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.createElement('div');
          el.className = 'cell';
          el.id = 'c_' + r + '_' + c;
          el.onclick = () => reveal(r, c);
          el.oncontextmenu = (e) => { e.preventDefault(); flag(r, c); };
          board.appendChild(el);
        }
      }
    }

    function reveal(r, c) {
      if (gameOver || grid[r][c].rev || grid[r][c].flag) return;
      grid[r][c].rev = true;
      const el = document.getElementById('c_' + r + '_' + c);
      el.classList.add('revealed');

      if (grid[r][c].mine) {
        el.innerText = '💣';
        el.style.background = '#e11d48';
        gameOver = true;
        alert('BOOM! Game Over');
        return;
      }

      if (grid[r][c].count > 0) {
        el.innerText = grid[r][c].count;
      } else {
        // Flood fill
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) reveal(nr, nc);
          }
        }
      }
    }

    function flag(r, c) {
      if (gameOver || grid[r][c].rev) return;
      grid[r][c].flag = !grid[r][c].flag;
      const el = document.getElementById('c_' + r + '_' + c);
      el.innerText = grid[r][c].flag ? '🚩' : '';
    }

    init();
  </script>
</body>
</html>`;

    case '2048':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2048 - Single File DOM / CSS Grid</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #faf8ef; color: #776e65; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    .header { width: 340px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    #grid { width: 340px; height: 340px; background: #bbada0; border-radius: 8px; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .cell { background: rgba(238, 228, 218, 0.35); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
    .tile-2 { background: #eee4da; color: #776e65; }
    .tile-4 { background: #ede0c8; color: #776e65; }
    .tile-8 { background: #f2b179; color: #fff; }
    .tile-16 { background: #f59563; color: #fff; }
    .tile-32 { background: #f67c5f; color: #fff; }
    .tile-64 { background: #f65e3b; color: #fff; }
    .tile-128 { background: #edcf72; color: #fff; font-size: 20px; }
    .tile-256 { background: #edcc61; color: #fff; font-size: 20px; }
    .tile-512 { background: #edc850; color: #fff; font-size: 20px; }
    .tile-1024 { background: #edc53f; color: #fff; font-size: 16px; }
    .tile-2048 { background: #edc22e; color: #fff; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="font-size:36px;">2048</h1>
    <div>SCORE: <span id="score" style="font-weight:bold; font-size:22px;">0</span></div>
  </div>
  <div id="grid"></div>
  <p style="margin-top:12px;">Use Arrow Keys or WASD to slide tiles</p>

  <script>
    let board = [], score = 0;
    function init() {
      board = Array(4).fill().map(() => Array(4).fill(0));
      score = 0; spawn(); spawn(); render();
    }
    function spawn() {
      const empties = [];
      for (let r=0; r<4; r++) for (let c=0; c<4; c++) if (board[r][c] === 0) empties.push({r,c});
      if (empties.length) {
        const {r,c} = empties[Math.floor(Math.random() * empties.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
      }
    }
    function render() {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      for (let r=0; r<4; r++) {
        for (let c=0; c<4; c++) {
          const div = document.createElement('div');
          const v = board[r][c];
          div.className = 'cell' + (v ? ' tile-' + v : '');
          div.innerText = v ? v : '';
          grid.appendChild(div);
        }
      }
      document.getElementById('score').innerText = score;
    }
    function slide(row) {
      let filtered = row.filter(x => x !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2; score += filtered[i]; filtered[i + 1] = 0;
        }
      }
      filtered = filtered.filter(x => x !== 0);
      while (filtered.length < 4) filtered.push(0);
      return filtered;
    }
    function move(dir) {
      const prev = JSON.stringify(board);
      if (dir === 'left') board = board.map(r => slide(r));
      if (dir === 'right') board = board.map(r => slide([...r].reverse()).reverse());
      if (dir === 'up') {
        for (let c=0; c<4; c++) {
          const col = slide([board[0][c], board[1][c], board[2][c], board[3][c]]);
          for (let r=0; r<4; r++) board[r][c] = col[r];
        }
      }
      if (dir === 'down') {
        for (let c=0; c<4; c++) {
          const col = slide([board[3][c], board[2][c], board[1][c], board[0][c]]);
          for (let r=0; r<4; r++) board[3 - r][c] = col[r];
        }
      }
      if (JSON.stringify(board) !== prev) { spawn(); render(); }
    }
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); move('left'); }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); move('right'); }
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); move('up'); }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); move('down'); }
    });
    init();
  </script>
</body>
</html>`;

    default:
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gameId.toUpperCase()} - Standalone Web Mini-Game</title>
  <style>
    body { background: #0b0f17; color: #38bdf8; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h2 { font-size: 28px; margin-bottom: 12px; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <h2>${gameId.toUpperCase()}</h2>
  <p>Single-file standalone game ready for browser execution.</p>
</body>
</html>`;
  }
}
