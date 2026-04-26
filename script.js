const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const NEXT_BLOCK = 24;

const COLORS = {
  I: "#39c6f0",
  J: "#5b7cfa",
  L: "#f7a548",
  O: "#f8df4e",
  S: "#45d17d",
  T: "#b86cff",
  Z: "#f0576b",
  G: "#707986",
};

const ITEMS = ["Bomb", "Shield", "Attack"];

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const gameStatus = document.querySelector("#gameStatus");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const modeSelect = document.querySelector("#modeSelect");
const difficultySelect = document.querySelector("#difficultySelect");

let running = false;
let paused = false;
let lastTime = 0;
let startedAt = 0;
let gameMode = "cpu";
let cpuDifficulty = "normal";

const CPU_SETTINGS = {
  easy: {
    thinkInterval: 170,
    mistakeRate: 0.18,
    useItems: true,
    lookahead: false,
    weights: {
      lines: 5.4,
      landingHeight: -0.45,
      aggregateHeight: -0.34,
      holes: -3.8,
      bumpiness: -0.18,
      wells: -0.08,
    },
  },
  normal: {
    thinkInterval: 75,
    mistakeRate: 0.035,
    useItems: true,
    lookahead: true,
    weights: {
      lines: 7.6,
      landingHeight: -0.52,
      aggregateHeight: -0.5,
      holes: -6.2,
      bumpiness: -0.32,
      wells: -0.16,
    },
  },
  hard: {
    thinkInterval: 38,
    mistakeRate: 0,
    useItems: true,
    lookahead: true,
    weights: {
      lines: 9.2,
      landingHeight: -0.6,
      aggregateHeight: -0.62,
      holes: -8.0,
      bumpiness: -0.42,
      wells: -0.22,
    },
  },
};

const players = [
  createPlayer("p1"),
  createPlayer("p2"),
];

players[0].opponent = players[1];
players[1].opponent = players[0];

function createPlayer(prefix) {
  const boardCanvas = document.querySelector(`#${prefix}Board`);
  const nextCanvas = document.querySelector(`#${prefix}Next`);

  return {
    prefix,
    board: createBoard(),
    current: null,
    next: randomPiece(),
    score: 0,
    lines: 0,
    attack: 0,
    item: null,
    shielded: false,
    shieldUntil: 0,
    fastDropping: false,
    dropCounter: 0,
    gameOver: false,
    isCpu: false,
    aiPlan: null,
    aiNextAt: 0,
    aiPiece: null,
    boardCanvas,
    ctx: boardCanvas.getContext("2d"),
    nextCanvas,
    nextCtx: nextCanvas.getContext("2d"),
    scoreEl: document.querySelector(`#${prefix}Score`),
    linesEl: document.querySelector(`#${prefix}Lines`),
    attackEl: document.querySelector(`#${prefix}Attack`),
    speedEl: document.querySelector(`#${prefix}Speed`),
    itemEl: document.querySelector(`#${prefix}Item`),
    statusEl: document.querySelector(`#${prefix}Status`),
    overlay: document.querySelector(`#${prefix}Overlay`),
    overlayTitle: document.querySelector(`#${prefix}OverlayTitle`),
    overlayHint: document.querySelector(`#${prefix}OverlayHint`),
  };
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const names = Object.keys(SHAPES);
  const name = names[Math.floor(Math.random() * names.length)];
  const matrix = SHAPES[name].map((row) => [...row]);
  return {
    name,
    matrix,
    rotation: 0,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: 0,
  };
}

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function collides(player, piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;

      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;

      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return true;
      if (nextY >= 0 && player.board[nextY][nextX]) return true;
    }
  }
  return false;
}

function boardCollides(board, piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;

      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;

      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return true;
      if (nextY >= 0 && board[nextY][nextX]) return true;
    }
  }
  return false;
}

function merge(player) {
  player.current.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      const boardY = player.current.y + y;
      const boardX = player.current.x + x;
      if (value && boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
        player.board[boardY][boardX] = player.current.name;
      }
    });
  });
}

function clearLines(player) {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (player.board[y].every(Boolean)) {
      player.board.splice(y, 1);
      player.board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    player.score += Math.round([0, 100, 300, 500, 800][cleared] * speedLevel());
    player.lines += cleared;
    const attackRows = Math.max(0, cleared - 1);
    if (attackRows > 0) {
      player.attack += attackRows;
      player.score += attackRows * 50;
      awardItem(player);
      sendGarbage(player.opponent, attackRows);
    }
    updateStats(player);
  }
}

function sendGarbage(target, rows) {
  if (target.gameOver) return;

  expireShield(target);

  if (target.shielded) {
    target.statusEl.textContent = "Shield blocked";
    updateStats(target);
    return;
  }

  for (let i = 0; i < rows; i += 1) {
    const gap = Math.floor(Math.random() * COLS);
    target.board.shift();
    target.board.push(
      Array.from({ length: COLS }, (_, index) => (index === gap ? null : "G")),
    );
  }

  target.statusEl.textContent = `+${rows} attack`;
  resolveGarbageOverlap(target);
}

function awardItem(player) {
  if (player.item) return;
  player.item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
}

function useItem(player) {
  if (!canPlay(player) || !player.item) return;

  if (player.item === "Bomb") {
    player.board.splice(ROWS - 2, 2);
    player.board.unshift(Array(COLS).fill(null), Array(COLS).fill(null));
    player.score += 150;
    player.statusEl.textContent = "Bomb used";
  }

  if (player.item === "Shield") {
    player.shielded = true;
    player.shieldUntil = performance.now() + 5000;
    player.statusEl.textContent = "Shield 5s";
  }

  if (player.item === "Attack") {
    player.attack += 2;
    player.score += 100;
    player.statusEl.textContent = "Attack used";
    sendGarbage(player.opponent, 2);
  }

  player.item = null;
  updateStats(player);
  draw(player);
}

function expireShield(player) {
  if (player.shielded && performance.now() >= player.shieldUntil) {
    player.shielded = false;
    player.shieldUntil = 0;
    if (!player.gameOver) player.statusEl.textContent = "Playing";
  }
}

function resolveGarbageOverlap(player) {
  if (!player.current || !collides(player, player.current)) return;

  const limit = player.current.matrix.length + 2;
  for (let i = 0; i < limit; i += 1) {
    player.current.y -= 1;
    if (!collides(player, player.current)) {
      draw(player);
      return;
    }
  }

  endPlayer(player);
}

function spawn(player) {
  player.current = player.next;
  player.next = randomPiece();
  player.aiPlan = null;
  player.aiPiece = player.current;
  player.fastDropping = false;
  drawNext(player);

  if (collides(player, player.current)) {
    endPlayer(player);
  }
}

function endPlayer(player) {
  player.gameOver = true;
  player.statusEl.textContent = "Game over";
  showOverlay(player, "Game Over", "Press Start to play again");

  const winner = players.find((candidate) => candidate !== player);
  if (winner && !winner.gameOver) {
    winner.statusEl.textContent = "Winner";
    gameStatus.textContent = `${winner.prefix === "p1" ? "Player 1" : "Player 2"} wins`;
  }

  if (players.every((candidate) => candidate.gameOver)) running = false;
}

function resetPlayer(player) {
  player.board = createBoard();
  player.current = null;
  player.next = randomPiece();
  player.score = 0;
  player.lines = 0;
  player.attack = 0;
  player.item = null;
  player.shielded = false;
  player.shieldUntil = 0;
  player.fastDropping = false;
  player.dropCounter = 0;
  player.gameOver = false;
  player.aiPlan = null;
  player.aiNextAt = 0;
  player.aiPiece = null;
  player.statusEl.textContent = player.isCpu ? "CPU" : "Playing";
  hideOverlay(player);
  updateStats(player);
  spawn(player);
  draw(player);
}

function hardReset() {
  gameMode = modeSelect.value;
  cpuDifficulty = difficultySelect.value;
  players[1].isCpu = gameMode === "cpu";
  running = true;
  paused = false;
  lastTime = 0;
  startedAt = performance.now();
  players.forEach(resetPlayer);
  gameStatus.textContent = players[1].isCpu ? `Playing vs CPU (${cpuDifficulty})` : "Playing 1P vs 2P";
  requestAnimationFrame(update);
}

function togglePause() {
  if (!running || players.every((player) => player.gameOver)) return;
  paused = !paused;
  gameStatus.textContent = paused ? "Paused" : "Playing";

  players.forEach((player) => {
    if (player.gameOver) return;
    player.statusEl.textContent = paused ? "Paused" : "Playing";
    if (paused) showOverlay(player, "Paused", "Press P to resume");
    else hideOverlay(player);
  });

  if (!paused) {
    lastTime = 0;
    requestAnimationFrame(update);
  }
}

function move(player, direction) {
  if (!canPlay(player)) return;
  if (!collides(player, player.current, direction, 0)) {
    player.current.x += direction;
    draw(player);
  }
}

function rotateCurrent(player) {
  if (!canPlay(player)) return;
  const rotated = rotate(player.current.matrix);
  const originalX = player.current.x;
  const kicks = [0, -1, 1, -2, 2];

  for (const kick of kicks) {
    player.current.x = originalX + kick;
    if (!collides(player, player.current, 0, 0, rotated)) {
      player.current.matrix = rotated;
      player.current.rotation = (player.current.rotation + 1) % 4;
      draw(player);
      return;
    }
  }

  player.current.x = originalX;
}

function lockPiece(player) {
  merge(player);
  clearLines(player);
  spawn(player);
}

function canPlay(player) {
  return running && !paused && !player.gameOver && player.current;
}

function dropInterval(player) {
  const level = Math.floor(player.lines / 10) + 1;
  const elapsedSeconds = startedAt ? (performance.now() - startedAt) / 1000 : 0;
  const interval = Math.max(70, 800 - (level - 1) * 48 - elapsedSeconds * 3.2);
  return player.fastDropping ? interval / 8 : interval;
}

function speedLevel() {
  if (!startedAt) return 1;
  return 1 + (performance.now() - startedAt) / 45000;
}

function stepDown(player) {
  if (!canPlay(player)) return;
  if (!collides(player, player.current, 0, 1)) {
    player.current.y += 1;
    if (player.fastDropping) player.score += 1;
  } else {
    lockPiece(player);
  }
  player.dropCounter = 0;
  draw(player);
}

function updateCpu(player, time) {
  const settings = CPU_SETTINGS[cpuDifficulty];
  if (time < player.aiNextAt) return;
  player.aiNextAt = time + settings.thinkInterval;

  if (settings.useItems && player.item && shouldCpuUseItem(player)) {
    useItem(player);
    return;
  }

  if (!player.aiPlan || player.aiPiece !== player.current) {
    player.aiPlan = chooseCpuPlan(player, settings);
    player.aiPiece = player.current;
  }

  if (!player.aiPlan) return;

  if (Math.random() < settings.mistakeRate) {
    const drift = Math.random() < 0.5 ? -1 : 1;
    move(player, drift);
    player.fastDropping = false;
    return;
  }

  if (!matricesEqual(player.current.matrix, player.aiPlan.matrix)) {
    rotateCurrent(player);
    player.fastDropping = false;
    return;
  }

  if (player.current.x < player.aiPlan.x) {
    move(player, 1);
    player.fastDropping = false;
    return;
  }

  if (player.current.x > player.aiPlan.x) {
    move(player, -1);
    player.fastDropping = false;
    return;
  }

  player.fastDropping = true;
}

function chooseCpuPlan(player, settings) {
  const candidates = scorePiecePlacements(player.board, player.current, settings, player.next);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);

  const poolSize = cpuDifficulty === "easy" ? 4 : cpuDifficulty === "normal" ? 2 : 1;
  return candidates[Math.floor(Math.random() * Math.min(poolSize, candidates.length))];
}

function scorePiecePlacements(board, piece, settings, nextPiece = null) {
  const candidates = [];
  const rotations = uniqueRotations(piece.matrix);

  rotations.forEach((matrix) => {
    const bounds = filledColumnBounds(matrix);
    const minX = -bounds.left;
    const maxX = COLS - 1 - bounds.right;

    for (let x = minX; x <= maxX; x += 1) {
      const testPiece = {
        ...piece,
        x,
        y: piece.y,
        matrix,
      };
      if (boardCollides(board, testPiece)) continue;
      while (!boardCollides(board, testPiece, 0, 1)) testPiece.y += 1;

      const candidateBoard = cloneBoard(board);
      mergeIntoBoard(candidateBoard, testPiece);
      const cleared = clearFullRows(candidateBoard);
      const score = scoreBoard(candidateBoard, testPiece, cleared, settings);
      const lookaheadScore = settings.lookahead && nextPiece
        ? bestNextPieceScore(candidateBoard, nextPiece, settings)
        : 0;

      candidates.push({ x, matrix, score: score + lookaheadScore * 0.42 });
    }
  });

  return candidates;
}

function bestNextPieceScore(board, nextPiece, settings) {
  const candidates = scorePiecePlacements(board, nextPiece, { ...settings, lookahead: false });
  if (!candidates.length) return -1000;
  return Math.max(...candidates.map((candidate) => candidate.score));
}

function scoreBoard(board, piece, cleared, settings) {
  const metrics = boardMetrics(board);
  const landingHeight = ROWS - (piece.y + piece.matrix.length / 2);
  return (
    cleared * settings.weights.lines +
    landingHeight * settings.weights.landingHeight +
    metrics.aggregateHeight * settings.weights.aggregateHeight +
    metrics.holes * settings.weights.holes +
    metrics.bumpiness * settings.weights.bumpiness +
    metrics.wells * settings.weights.wells
  );
}

function uniqueRotations(matrix) {
  const rotations = [];
  let rotated = matrix.map((row) => [...row]);
  for (let i = 0; i < 4; i += 1) {
    if (!rotations.some((candidate) => matricesEqual(candidate, rotated))) {
      rotations.push(rotated.map((row) => [...row]));
    }
    rotated = rotate(rotated);
  }
  return rotations;
}

function filledColumnBounds(matrix) {
  let left = matrix[0].length - 1;
  let right = 0;

  matrix.forEach((row) => {
    row.forEach((value, x) => {
      if (!value) return;
      left = Math.min(left, x);
      right = Math.max(right, x);
    });
  });

  return { left, right };
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function mergeIntoBoard(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const boardY = piece.y + y;
      const boardX = piece.x + x;
      if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
        board[boardY][boardX] = piece.name;
      }
    });
  });
}

function clearFullRows(board) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (!board[y].every(Boolean)) continue;
    board.splice(y, 1);
    board.unshift(Array(COLS).fill(null));
    cleared += 1;
    y += 1;
  }
  return cleared;
}

function boardMetrics(board) {
  const heights = [];
  let holes = 0;

  for (let x = 0; x < COLS; x += 1) {
    let seenBlock = false;
    let height = 0;
    for (let y = 0; y < ROWS; y += 1) {
      if (board[y][x]) {
        if (!seenBlock) height = ROWS - y;
        seenBlock = true;
      } else if (seenBlock) {
        holes += 1;
      }
    }
    heights.push(height);
  }

  let bumpiness = 0;
  for (let i = 0; i < heights.length - 1; i += 1) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  let wells = 0;
  for (let x = 0; x < COLS; x += 1) {
    const left = x === 0 ? ROWS : heights[x - 1];
    const right = x === COLS - 1 ? ROWS : heights[x + 1];
    const depth = Math.min(left, right) - heights[x];
    if (depth > 0) wells += depth;
  }

  return {
    aggregateHeight: heights.reduce((sum, height) => sum + height, 0),
    holes,
    bumpiness,
    wells,
  };
}

function matricesEqual(a, b) {
  if (!a || !b || a.length !== b.length || a[0].length !== b[0].length) return false;
  for (let y = 0; y < a.length; y += 1) {
    for (let x = 0; x < a[y].length; x += 1) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

function shouldCpuUseItem(player) {
  const metrics = boardMetrics(player.board);
  const tallest = columnHeights(player.board).reduce((max, height) => Math.max(max, height), 0);
  const topDanger = tallest >= 14 || player.board.slice(0, 5).some((row) => row.some(Boolean));
  const opponentMetrics = boardMetrics(player.opponent.board);
  const opponentDanger = columnHeights(player.opponent.board).some((height) => height >= 10);
  const opponentShielded = player.opponent.shielded && performance.now() < player.opponent.shieldUntil;

  if (player.item === "Bomb") return topDanger || metrics.holes >= 5;
  if (player.item === "Shield") return topDanger || player.opponent.attack >= 2;
  if (player.item === "Attack") return !opponentShielded && (opponentDanger || opponentMetrics.holes >= 3 || player.lines >= 2);
  return false;
}

function columnHeights(board) {
  return Array.from({ length: COLS }, (_, x) => {
    for (let y = 0; y < ROWS; y += 1) {
      if (board[y][x]) return ROWS - y;
    }
    return 0;
  });
}

function update(time = 0) {
  if (!running || paused) return;

  const delta = time - lastTime;
  lastTime = time;

  players.forEach((player) => {
    expireShield(player);
    if (!canPlay(player)) return;
    if (player.isCpu) updateCpu(player, time);
    player.dropCounter += delta;
    if (player.dropCounter > dropInterval(player)) stepDown(player);
    draw(player);
    updateStats(player);
  });

  requestAnimationFrame(update);
}

function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x * size, y * size, size, size);
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.fillRect(x * size + 3, y * size + 3, size - 6, 3);
  context.strokeStyle = "rgba(0,0,0,0.38)";
  context.lineWidth = 2;
  context.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
}

function drawGrid(player) {
  const { ctx, boardCanvas } = player;
  ctx.strokeStyle = "rgba(255,255,255,0.11)";
  ctx.lineWidth = 1;

  for (let x = 1; x < COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, boardCanvas.height);
    ctx.stroke();
  }

  for (let y = 1; y < ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(boardCanvas.width, y * BLOCK);
    ctx.stroke();
  }
}

function drawMatrix(context, matrix, offsetX, offsetY, size, color) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawCell(context, x + offsetX, y + offsetY, size, color);
    });
  });
}

function draw(player) {
  const { ctx, boardCanvas } = player;
  ctx.fillStyle = "#030405";
  ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawGrid(player);

  player.board.forEach((row, y) => {
    row.forEach((name, x) => {
      if (name) drawCell(ctx, x, y, BLOCK, COLORS[name]);
    });
  });

  if (player.current) {
    drawMatrix(ctx, player.current.matrix, player.current.x, player.current.y, BLOCK, COLORS[player.current.name]);
  }
}

function drawNext(player) {
  player.nextCtx.fillStyle = "#121720";
  player.nextCtx.fillRect(0, 0, player.nextCanvas.width, player.nextCanvas.height);

  const matrix = player.next.matrix;
  const offsetX = Math.floor((5 - matrix[0].length) / 2);
  const offsetY = Math.floor((5 - matrix.length) / 2);
  drawMatrix(player.nextCtx, matrix, offsetX, offsetY, NEXT_BLOCK, COLORS[player.next.name]);
}

function updateStats(player) {
  player.scoreEl.textContent = player.score.toString();
  player.linesEl.textContent = player.lines.toString();
  player.attackEl.textContent = player.attack.toString();
  player.speedEl.textContent = speedLevel().toFixed(1);
  if (player.shielded) {
    player.itemEl.textContent = `Shield ${Math.ceil((player.shieldUntil - performance.now()) / 1000)}s`;
  } else {
    player.itemEl.textContent = player.item || "-";
  }
}

function showOverlay(player, title, hint) {
  player.overlayTitle.textContent = title;
  player.overlayHint.textContent = hint;
  player.overlay.classList.remove("hidden");
}

function hideOverlay(player) {
  player.overlay.classList.add("hidden");
}

document.addEventListener("keydown", (event) => {
  if (event.repeat && ["s", "S", "ArrowDown"].includes(event.key)) return;

  if (event.key === "p" || event.key === "P") {
    togglePause();
    return;
  }

  if (event.key === "a" || event.key === "A") move(players[0], -1);
  if (event.key === "d" || event.key === "D") move(players[0], 1);
  if (event.key === "s" || event.key === "S") players[0].fastDropping = true;
  if (event.key === "w" || event.key === "W") rotateCurrent(players[0]);
  if (event.key === "q" || event.key === "Q") useItem(players[0]);

  if (!players[1].isCpu && event.key === "ArrowLeft") move(players[1], -1);
  if (!players[1].isCpu && event.key === "ArrowRight") move(players[1], 1);
  if (!players[1].isCpu && event.key === "ArrowDown") players[1].fastDropping = true;
  if (event.key === "ArrowUp" || event.key === " ") {
    event.preventDefault();
    if (!players[1].isCpu) rotateCurrent(players[1]);
  }
  if (!players[1].isCpu && event.key === "/") useItem(players[1]);
});

document.addEventListener("keyup", (event) => {
  if (event.key === "s" || event.key === "S") players[0].fastDropping = false;
  if (!players[1].isCpu && event.key === "ArrowDown") players[1].fastDropping = false;
});

startBtn.addEventListener("click", hardReset);
pauseBtn.addEventListener("click", togglePause);
modeSelect.addEventListener("change", () => {
  difficultySelect.disabled = modeSelect.value !== "cpu";
  gameStatus.textContent = modeSelect.value === "cpu" ? "Ready vs CPU" : "Ready 1P vs 2P";
});

players.forEach((player) => {
  updateStats(player);
  drawNext(player);
  draw(player);
  showOverlay(player, "Tetris", "Press Start to play");
});

difficultySelect.disabled = modeSelect.value !== "cpu";
