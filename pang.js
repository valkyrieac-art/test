const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const message = document.querySelector("#message");
const stageLabel = document.querySelector("#stageLabel");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");

const W = canvas.width;
const H = canvas.height;
const FLOOR = H - 46;
const GRAVITY = 0.28;
const PLAYER_SPEED = 5.4;
const STARTING_LIVES = 3;
const ITEM_TYPES = ["double", "power", "vulcan", "shield", "clock", "dynamite", "life", "bonus"];
const ITEM_LABELS = {
  double: "Double",
  power: "Power",
  vulcan: "Vulcan",
  shield: "Shield",
  clock: "Clock",
  dynamite: "Dynamite",
  life: "1UP",
  bonus: "Bonus",
};
const ITEM_STYLES = {
  double: { color: "#66c7ff", icon: "II" },
  power: { color: "#ffdf70", icon: "P" },
  vulcan: { color: "#ff8f70", icon: "V" },
  shield: { color: "#7de3ff", icon: "S" },
  clock: { color: "#b99cff", icon: "T" },
  dynamite: { color: "#ff5f75", icon: "D" },
  life: { color: "#67e38f", icon: "1" },
  bonus: { color: "#f8f0a4", icon: "$" },
};

let stage = 1;
let running = false;
let paused = false;
let slowUntil = 0;
let frame = 0;
let balls = [];
let shots = [];
let items = [];
let particles = [];
let keys = new Set();

const players = [
  makePlayer(1, 190, "#ffd166", {
    left: "a",
    right: "d",
    shoot: "w",
  }),
  makePlayer(2, W - 190, "#66c7ff", {
    left: "ArrowLeft",
    right: "ArrowRight",
    shoot: "ArrowUp",
  }),
];

function makePlayer(id, x, color, controls) {
  return {
    id,
    x,
    y: FLOOR,
    w: 30,
    h: 48,
    color,
    controls,
    lives: STARTING_LIVES,
    score: 0,
    facing: id === 1 ? 1 : -1,
    weapon: "wire",
    weaponUntil: 0,
    shieldUntil: 0,
    invincibleUntil: 0,
    respawnUntil: 0,
    shootCooldown: 0,
    maxShots: 1,
    alive: true,
    scoreEl: document.querySelector(`#p${id}Score`),
    livesEl: document.querySelector(`#p${id}Lives`),
    weaponEl: document.querySelector(`#p${id}Weapon`),
  };
}

function startGame() {
  stage = 1;
  running = true;
  paused = false;
  slowUntil = 0;
  shots = [];
  items = [];
  particles = [];
  players.forEach((player, index) => {
    player.x = index === 0 ? 190 : W - 190;
    player.lives = STARTING_LIVES;
    player.score = 0;
    player.facing = index === 0 ? 1 : -1;
    resetPlayerPower(player);
    player.alive = true;
  });
  loadStage();
  requestAnimationFrame(loop);
}

function loadStage() {
  balls = [];
  shots = [];
  items = [];
  particles = [];
  const count = Math.min(2 + Math.floor(stage / 2), 5);
  for (let i = 0; i < count; i += 1) {
    balls.push(makeBall(190 + i * 135, 120 + (i % 2) * 36, 3 + Math.min(1, Math.floor(stage / 4))));
  }
  message.textContent = `Stage ${stage}. Ready.`;
  updateHud();
}

function makeBall(x, y, size, dir = 1) {
  const radius = [0, 15, 24, 36, 50][size];
  return {
    x,
    y,
    size,
    radius,
    vx: dir * (1.9 + stage * 0.07 + (4 - size) * 0.22),
    vy: -2.2,
    color: ["", "#ffdf70", "#ff8f70", "#e7627d", "#8e6dff"][size],
  };
}

function resetPlayerPower(player) {
  player.weapon = "wire";
  player.weaponUntil = 0;
  player.shieldUntil = 0;
  player.invincibleUntil = 0;
  player.respawnUntil = 0;
  player.maxShots = 1;
  player.shootCooldown = 0;
}

function loop() {
  if (!running) return;
  if (!paused) update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  frame += 1;
  const now = performance.now();
  const speedFactor = now < slowUntil ? 0.45 : 1;

  players.forEach((player) => updatePlayer(player, now));
  shots.forEach(updateShot);
  shots = shots.filter((shot) => !shot.dead);

  balls.forEach((ball) => updateBall(ball, speedFactor));
  items.forEach(updateItem);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
  });
  particles = particles.filter((p) => p.life > 0);

  handleShotHits();
  handlePlayerHits(now);
  handleItemPickups(now);

  if (balls.length === 0) {
    stage += 1;
    loadStage();
  }

  if (players.every((player) => player.lives <= 0)) {
    running = false;
    message.textContent = "Game over. Press Start.";
  }

  updateHud();
}

function updatePlayer(player, now) {
  if (player.lives <= 0) return;
  player.alive = true;
  if (now < player.respawnUntil) return;

  if (keys.has(player.controls.left)) {
    player.x -= PLAYER_SPEED;
    player.facing = -1;
  }
  if (keys.has(player.controls.right)) {
    player.x += PLAYER_SPEED;
    player.facing = 1;
  }
  player.x = Math.max(20, Math.min(W - 20, player.x));

  if (player.weaponUntil && now > player.weaponUntil) resetWeapon(player);
  if (player.shieldUntil && now > player.shieldUntil) player.shieldUntil = 0;
  if (player.shootCooldown > 0) player.shootCooldown -= 1;

  if (keys.has(player.controls.shoot)) shoot(player, now);
}

function shoot(player, now) {
  if (player.shootCooldown > 0) return;
  const activeShots = shots.filter((shot) => shot.owner === player).length;
  if (activeShots >= player.maxShots) return;

  if (player.weapon === "vulcan") {
    shots.push({ owner: player, type: "bullet", x: player.x, y: player.y - player.h, vx: -1.4, vy: -10, r: 5 });
    shots.push({ owner: player, type: "bullet", x: player.x, y: player.y - player.h, vx: 1.4, vy: -10, r: 5 });
    player.shootCooldown = 9;
    return;
  }

  shots.push({
    owner: player,
    type: player.weapon === "power" ? "power" : "wire",
    x: player.x,
    y: player.y - player.h,
    top: player.y - player.h,
    width: player.weapon === "power" ? 10 : 5,
    speed: player.weapon === "power" ? 14 : 10,
  });
  player.shootCooldown = player.weapon === "power" ? 18 : 22;
}

function updateShot(shot) {
  if (shot.type === "bullet") {
    shot.x += shot.vx;
    shot.y += shot.vy;
    if (shot.y < -10) shot.dead = true;
    return;
  }

  shot.top -= shot.speed;
  if (shot.top <= 0) shot.dead = true;
}

function updateBall(ball, speedFactor) {
  ball.x += ball.vx * speedFactor;
  ball.y += ball.vy * speedFactor;
  ball.vy += GRAVITY * speedFactor;

  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= W) {
    ball.vx *= -1;
    ball.x = Math.max(ball.radius, Math.min(W - ball.radius, ball.x));
  }

  if (ball.y + ball.radius >= FLOOR) {
    ball.y = FLOOR - ball.radius;
    ball.vy = -bounceFor(ball.size);
  }
}

function bounceFor(size) {
  return [0, 7.3, 8.6, 10.2, 11.4][size] + Math.min(stage * 0.08, 1.1);
}

function updateItem(item) {
  item.y += item.vy;
  item.vy += 0.16;
  if (item.y > FLOOR - 14) {
    item.y = FLOOR - 14;
    item.vy = 0;
  }
}

function handleShotHits() {
  for (const shot of shots) {
    for (const ball of balls) {
      if (shot.dead || ball.dead) continue;
      if (!shotHitsBall(shot, ball)) continue;

      shot.dead = true;
      ball.dead = true;
      splitBall(ball, shot.owner);
      maybeDropItem(ball.x, ball.y);
      burst(ball.x, ball.y, ball.color);
    }
  }
  balls = balls.filter((ball) => !ball.dead);
}

function shotHitsBall(shot, ball) {
  if (shot.type === "bullet") {
    return Math.hypot(shot.x - ball.x, shot.y - ball.y) < ball.radius + shot.r;
  }

  const xHit = Math.abs(shot.x - ball.x) < ball.radius + shot.width;
  const yHit = shot.top <= ball.y + ball.radius && shot.y >= ball.y - ball.radius;
  return xHit && yHit;
}

function splitBall(ball, owner) {
  owner.score += [0, 120, 220, 360, 520][ball.size];
  if (ball.size <= 1) return;

  const next = ball.size - 1;
  balls.push(makeBall(ball.x - 10, ball.y, next, -1));
  balls.push(makeBall(ball.x + 10, ball.y, next, 1));
}

function maybeDropItem(x, y) {
  if (Math.random() > 0.36) return;
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  items.push({ type, x, y, vy: -2.2, r: 13 });
}

function handlePlayerHits(now) {
  for (const player of players) {
    if (player.lives <= 0 || now < player.invincibleUntil || now < player.shieldUntil) continue;

    for (const ball of balls) {
      const cx = Math.max(player.x - player.w / 2, Math.min(ball.x, player.x + player.w / 2));
      const cy = Math.max(player.y - player.h, Math.min(ball.y, player.y));
      if (Math.hypot(ball.x - cx, ball.y - cy) < ball.radius) {
        damagePlayer(player, now);
        break;
      }
    }
  }
}

function damagePlayer(player, now) {
  player.lives -= 1;
  resetPlayerPower(player);

  if (player.lives > 0) {
    player.x = player.id === 1 ? 90 : W - 90;
    player.y = FLOOR;
    player.facing = player.id === 1 ? 1 : -1;
    player.invincibleUntil = now + 2600;
    player.respawnUntil = now + 850;
    message.textContent = `Player ${player.id} lost a life. Respawning.`;
    burst(player.x, player.y - 25, player.color);
    return;
  }

  player.alive = false;
  message.textContent = `Player ${player.id} is out.`;
  burst(player.x, player.y - 25, player.color);
}

function handleItemPickups(now) {
  for (const item of items) {
    for (const player of players) {
      if (item.dead || player.lives <= 0) continue;
      if (Math.abs(item.x - player.x) < 28 && item.y > player.y - player.h - 10 && item.y < player.y + 12) {
        applyItem(player, item.type, now);
        item.dead = true;
      }
    }
  }
  items = items.filter((item) => !item.dead);
}

function applyItem(player, type, now) {
  if (type === "bonus") player.score += 800;
  if (type === "life") player.lives += 1;
  if (type === "shield") player.shieldUntil = now + 7000;
  if (type === "clock") slowUntil = now + 6500;
  if (type === "dynamite") {
    balls.forEach((ball) => {
      while (ball.size > 1) {
        ball.size -= 1;
        ball.radius = [0, 15, 24, 36, 50][ball.size];
      }
    });
  }
  if (type === "double") {
    player.weapon = "double";
    player.maxShots = 2;
    player.weaponUntil = now + 12000;
  }
  if (type === "power") {
    player.weapon = "power";
    player.maxShots = 1;
    player.weaponUntil = now + 12000;
  }
  if (type === "vulcan") {
    player.weapon = "vulcan";
    player.maxShots = 6;
    player.weaponUntil = now + 9000;
  }
  message.textContent = `Player ${player.id} picked ${ITEM_LABELS[type]}.`;
}

function resetWeapon(player) {
  player.weapon = "wire";
  player.maxShots = 1;
  player.weaponUntil = 0;
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / 12) * (1.5 + Math.random() * 2),
      vy: Math.sin((Math.PI * 2 * i) / 12) * (1.5 + Math.random() * 2),
      color,
      life: 24,
    });
  }
}

function draw() {
  drawBackground();
  items.forEach(drawItem);
  shots.forEach(drawShot);
  balls.forEach(drawBall);
  players.forEach(drawPlayer);
  particles.forEach(drawParticle);
  if (!running || paused) drawOverlay(paused ? "Paused" : "Press Start");
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#203149");
  sky.addColorStop(0.55, "#182231");
  sky.addColorStop(1, "#11151b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#233245";
  for (let x = 0; x < W; x += 88) {
    ctx.fillRect(x, FLOOR - 150 - (x % 176), 54, 150 + (x % 176));
  }

  ctx.fillStyle = "#2f7d54";
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.strokeStyle = "#79d389";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR);
  ctx.lineTo(W, FLOOR);
  ctx.stroke();
}

function drawPlayer(player) {
  if (player.lives <= 0) return;
  const now = performance.now();
  if (now < player.invincibleUntil && Math.floor(frame / 6) % 2 === 0) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  if (now < player.respawnUntil) ctx.globalAlpha = 0.55;

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = player.color;
  roundRect(-15, -38, 30, 32, 8);

  ctx.fillStyle = "#f4c7a1";
  ctx.beginPath();
  ctx.arc(0, -48, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = player.id === 1 ? "#38435a" : "#5b375f";
  ctx.beginPath();
  ctx.arc(0, -55, 16, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-17, -56, 34, 7);

  ctx.fillStyle = "#111820";
  ctx.beginPath();
  ctx.arc(-5, -48, 2.2, 0, Math.PI * 2);
  ctx.arc(6, -48, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111820";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -43, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = player.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-14, -30);
  ctx.lineTo(-25, -18);
  ctx.moveTo(14, -30);
  ctx.lineTo(25, -18);
  ctx.stroke();

  ctx.fillStyle = "#101820";
  ctx.fillRect(-14, -6, 10, 9);
  ctx.fillRect(4, -6, 10, 9);

  if (now < player.respawnUntil) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("READY", 0, -70);
  }

  ctx.restore();

  if (now < player.shieldUntil) {
    ctx.strokeStyle = "rgba(110, 220, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 25, 33, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBall(ball) {
  const grad = ctx.createRadialGradient(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 3, ball.x, ball.y, ball.radius);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.18, ball.color);
  grad.addColorStop(1, "#5c2f72");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShot(shot) {
  if (shot.type === "bullet") {
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.strokeStyle = shot.type === "power" ? "#fffb9a" : "#d8e6ff";
  ctx.lineWidth = shot.width;
  ctx.beginPath();
  ctx.moveTo(shot.x, shot.y);
  ctx.lineTo(shot.x, shot.top);
  ctx.stroke();
}

function drawItem(item) {
  const style = ITEM_STYLES[item.type];
  ctx.save();
  ctx.shadowColor = style.color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#111820";
  ctx.strokeStyle = style.color;
  ctx.lineWidth = 2;
  roundRect(item.x - 22, item.y - 18, 44, 36, 7);
  ctx.shadowBlur = 0;

  ctx.fillStyle = style.color;
  ctx.beginPath();
  ctx.arc(item.x, item.y - 3, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101820";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(style.icon, item.x, item.y + 2);

  ctx.fillStyle = "#eef3f7";
  ctx.font = "9px Arial";
  ctx.fillText(ITEM_LABELS[item.type], item.x, item.y + 15);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
  ctx.stroke();
}

function drawParticle(particle) {
  ctx.fillStyle = particle.color;
  ctx.globalAlpha = Math.max(0, particle.life / 24);
  ctx.fillRect(particle.x, particle.y, 4, 4);
  ctx.globalAlpha = 1;
}

function drawOverlay(text) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#eef3f7";
  ctx.font = "42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2);
}

function updateHud() {
  stageLabel.textContent = stage.toString();
  players.forEach((player) => {
    player.scoreEl.textContent = player.score.toString();
    player.livesEl.textContent = player.lives.toString();
    player.weaponEl.textContent = weaponLabel(player);
  });
}

function weaponLabel(player) {
  const now = performance.now();
  if (now < player.shieldUntil) return `${player.weapon} + Shield`;
  return player.weapon === "wire" ? "Wire" : ITEM_LABELS[player.weapon] || player.weapon;
}

document.addEventListener("keydown", (event) => {
  keys.add(event.key);
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", () => {
  if (!running) return;
  paused = !paused;
  message.textContent = paused ? "Paused." : "Resumed.";
});

updateHud();
draw();
