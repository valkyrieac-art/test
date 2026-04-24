const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = {
  I: '#22d3ee',
  O: '#facc15',
  T: '#a78bfa',
  S: '#4ade80',
  Z: '#fb7185',
  J: '#60a5fa',
  L: '#fb923c',
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

let board;
let current;
let score;
let lines;
let level;
let dropCounter;
let dropInterval;
let lastTime;
let gameOver;
let paused;
let rafId;

function makeBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomType() {
  return Object.keys(SHAPES)[Math.floor(Math.random() * 7)];
}

function spawnPiece() {
  const type = randomType();
  const shape = SHAPES[type].map((row) => [...row]);
  return {
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
    type,
    shape,
  };
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = board[y][x];
      drawCell(x, y, cell || '#111827');
    }
  }

  current.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawCell(current.x + x, current.y + y, COLORS[current.type]);
      }
    });
  });
}

function collides(nextX = current.x, nextY = current.y, nextShape = current.shape) {
  return nextShape.some((row, y) =>
    row.some((value, x) => {
      if (!value) return false;
      const bx = nextX + x;
      const by = nextY + y;
      return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx]);
    })
  );
}

function mergePiece() {
  current.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && current.y + y >= 0) {
        board[current.y + y][current.x + x] = COLORS[current.type];
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    const scores = [0, 100, 300, 500, 800];
    score += scores[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 700 - (level - 1) * 50);
    updatePanel();
  }
}

function rotate(shape) {
  return shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
}

function hardDrop() {
  while (!collides(current.x, current.y + 1)) {
    current.y += 1;
  }
  tick();
}

function tick() {
  if (!collides(current.x, current.y + 1)) {
    current.y += 1;
    return;
  }

  mergePiece();
  clearLines();
  current = spawnPiece();

  if (collides()) {
    gameOver = true;
    messageEl.textContent = '게임 오버! 다시 시작해보세요.';
  }
}

function updatePanel() {
  scoreEl.textContent = String(score);
  levelEl.textContent = String(level);
  linesEl.textContent = String(lines);
}

function resetGame() {
  board = makeBoard();
  current = spawnPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropCounter = 0;
  dropInterval = 700;
  lastTime = 0;
  gameOver = false;
  paused = false;
  messageEl.textContent = '';
  updatePanel();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function loop(time = 0) {
  if (gameOver) {
    draw();
    return;
  }

  const delta = time - lastTime;
  lastTime = time;

  if (!paused) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      tick();
      dropCounter = 0;
    }
  }

  draw();
  rafId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', (event) => {
  if (gameOver) return;

  if (event.key.toLowerCase() === 'p') {
    paused = !paused;
    messageEl.textContent = paused ? '일시정지' : '';
    return;
  }

  if (paused) return;

  if (event.key === 'ArrowLeft' && !collides(current.x - 1, current.y)) {
    current.x -= 1;
  } else if (event.key === 'ArrowRight' && !collides(current.x + 1, current.y)) {
    current.x += 1;
  } else if (event.key === 'ArrowDown') {
    tick();
    score += 1;
    updatePanel();
  } else if (event.key === 'ArrowUp') {
    const rotated = rotate(current.shape);
    if (!collides(current.x, current.y, rotated)) {
      current.shape = rotated;
    }
  } else if (event.code === 'Space') {
    hardDrop();
  }
});

restartBtn.addEventListener('click', resetGame);

resetGame();
