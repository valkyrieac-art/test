const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const message = document.querySelector("#message");
const roundLabel = document.querySelector("#roundLabel");
const stageLabel = document.querySelector("#stageLabel");
const startBtn = document.querySelector("#startBtn");
const resetBtn = document.querySelector("#resetBtn");

const W = canvas.width;
const H = canvas.height;
const GRAVITY = 0.72;
const MOVE_SPEED = 4.2;
const JUMP_POWER = 14.2;
const MAX_FALL = 18;
const RESPAWN_Y = H + 90;

const ITEM_META = {
  speed: { label: "SPD", color: "#f6c85f" },
  jump: { label: "JMP", color: "#7dd3fc" },
  shield: { label: "SHD", color: "#8be28b" },
  shove: { label: "PUSH", color: "#f97373" },
};

const LEVELS = [
  {
    name: "Gate Bridge",
    start: [{ x: 70, y: 520 }, { x: 118, y: 520 }],
    goal: { x: 1010, y: 444, w: 68, h: 76 },
    platforms: [
      b(0, 584, 180, 46, "stone"),
      b(230, 520, 145, 26, "stone"),
      b(430, 468, 150, 26, "drop-a"),
      b(650, 420, 150, 26, "stone"),
      b(850, 520, 270, 46, "drop-b"),
    ],
    hazards: [b(184, 604, 164, 26, "pit"), b(584, 604, 230, 26, "pit"), b(708, 388, 86, 18, "spikes")],
    switches: [sw("gate", 250, 492, "help", "OPEN"), sw("drop-a", 455, 440, "trap", "DROP"), sw("drop-b", 886, 492, "trap", "FALL")],
    doors: [{ id: "gate", x: 580, y: 372, w: 40, h: 96, openY: 326, closedY: 372 }],
    movers: [{ id: "lift", x: 382, y: 555, w: 165, h: 24, homeY: 555, targetY: 468, switchId: "gate", kind: "help" }],
    items: [item("shield", 318, 484), item("jump", 680, 384), item("shove", 910, 484)],
  },
  {
    name: "Split Lift",
    start: [{ x: 70, y: 520 }, { x: 118, y: 520 }],
    goal: { x: 1002, y: 174, w: 78, h: 80 },
    platforms: [
      b(0, 584, 190, 46, "stone"),
      b(230, 528, 120, 24, "stone"),
      b(420, 482, 122, 24, "drop-a"),
      b(602, 420, 130, 24, "stone"),
      b(795, 328, 122, 24, "drop-b"),
      b(962, 254, 158, 28, "stone"),
    ],
    hazards: [b(190, 604, 235, 26, "pit"), b(545, 604, 230, 26, "pit"), b(824, 296, 72, 18, "spikes")],
    switches: [sw("gate", 250, 500, "help", "LIFT"), sw("drop-a", 444, 454, "trap", "DROP"), sw("drop-b", 813, 300, "trap", "CUT")],
    doors: [{ id: "gate", x: 740, y: 266, w: 38, h: 112, openY: 116, closedY: 266 }],
    movers: [{ id: "lift", x: 348, y: 548, w: 86, h: 22, homeY: 548, targetY: 424, switchId: "gate", kind: "help" }],
    items: [item("speed", 260, 492), item("shield", 635, 384), item("jump", 984, 218)],
  },
  {
    name: "Double Cross",
    start: [{ x: 62, y: 514 }, { x: 116, y: 514 }],
    goal: { x: 1016, y: 502, w: 66, h: 76 },
    platforms: [
      b(0, 578, 175, 52, "stone"),
      b(218, 506, 140, 24, "stone"),
      b(418, 432, 128, 24, "drop-a"),
      b(620, 504, 132, 24, "stone"),
      b(835, 578, 285, 52, "stone"),
      b(840, 382, 92, 22, "drop-b"),
    ],
    hazards: [b(176, 604, 255, 26, "pit"), b(548, 604, 280, 26, "pit"), b(856, 350, 62, 18, "spikes")],
    switches: [sw("gate", 246, 478, "help", "DOOR"), sw("drop-a", 443, 404, "trap", "DROP"), sw("drop-b", 858, 354, "trap", "FALL")],
    doors: [{ id: "gate", x: 778, y: 480, w: 40, h: 98, openY: 420, closedY: 480 }],
    movers: [{ id: "lift", x: 560, y: 552, w: 128, h: 22, homeY: 552, targetY: 456, switchId: "gate", kind: "help" }],
    items: [item("shove", 465, 396), item("speed", 650, 468), item("shield", 875, 338)],
  },
  {
    name: "High Road",
    start: [{ x: 62, y: 520 }, { x: 116, y: 520 }],
    goal: { x: 1010, y: 252, w: 72, h: 78 },
    platforms: [
      b(0, 584, 180, 46, "stone"),
      b(218, 530, 126, 24, "stone"),
      b(394, 482, 112, 24, "drop-a"),
      b(560, 428, 132, 24, "stone"),
      b(760, 358, 110, 24, "drop-b"),
      b(948, 330, 172, 28, "stone"),
    ],
    hazards: [b(182, 604, 198, 26, "pit"), b(508, 604, 252, 26, "pit"), b(790, 326, 56, 18, "spikes")],
    switches: [sw("gate", 238, 502, "help", "GATE"), sw("drop-a", 414, 454, "trap", "DROP"), sw("drop-b", 780, 330, "trap", "CUT")],
    doors: [{ id: "gate", x: 710, y: 316, w: 38, h: 110, openY: 186, closedY: 316 }],
    movers: [{ id: "lift", x: 518, y: 552, w: 118, h: 22, homeY: 552, targetY: 406, switchId: "gate", kind: "help" }],
    items: [item("speed", 242, 494), item("jump", 590, 392), item("shove", 798, 322), item("shield", 985, 294)],
  },
  {
    name: "Final Betrayal",
    start: [{ x: 60, y: 518 }, { x: 114, y: 518 }],
    goal: { x: 1018, y: 496, w: 64, h: 80 },
    platforms: [
      b(0, 582, 168, 48, "stone"),
      b(214, 514, 128, 24, "drop-a"),
      b(404, 448, 126, 24, "stone"),
      b(596, 384, 122, 24, "drop-b"),
      b(794, 456, 112, 24, "stone"),
      b(948, 576, 172, 54, "stone"),
    ],
    hazards: [b(170, 604, 226, 26, "pit"), b(532, 604, 410, 26, "pit"), b(624, 352, 64, 18, "spikes"), b(820, 424, 58, 18, "spikes")],
    switches: [sw("gate", 222, 486, "help", "LIFT"), sw("drop-a", 290, 486, "trap", "DROP"), sw("drop-b", 620, 356, "trap", "FALL")],
    doors: [{ id: "gate", x: 910, y: 480, w: 38, h: 96, openY: 358, closedY: 480 }],
    movers: [{ id: "lift", x: 730, y: 552, w: 92, h: 22, homeY: 552, targetY: 434, switchId: "gate", kind: "help" }],
    items: [item("shield", 236, 478), item("speed", 430, 412), item("jump", 630, 348), item("shove", 812, 420)],
  },
];

const keys = new Set();
let running = false;
let won = false;
let frame = 0;
let round = 1;
let winner = null;
let nextStageAt = 0;
let level = LEVELS[0];
let platforms = [];
let hazards = [];
let switches = [];
let doors = [];
let movers = [];
let items = [];
let particles = [];

const players = [
  makePlayer(1, "#ffd166", { left: "a", right: "d", jump: "w" }),
  makePlayer(2, "#68c8ff", { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp" }),
];

function b(x, y, w, h, type) {
  return { x, y, w, h, type, baseY: y, state: "solid", fallV: 0 };
}

function sw(id, x, y, kind, label) {
  return { id, x, y, w: 58, h: 28, kind, active: false, wasActive: false, label };
}

function item(type, x, y) {
  return { type, x, y, w: 30, h: 30, taken: false, bob: Math.random() * 100 };
}

function makePlayer(id, color, controls) {
  return {
    id,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    w: 30,
    h: 42,
    vx: 0,
    vy: 0,
    color,
    controls,
    onGround: false,
    jumpHeld: false,
    jumpsUsed: 0,
    maxJumps: 2,
    falls: 0,
    finished: false,
    shield: 0,
    speedUntil: 0,
    jumpUntil: 0,
    knockVx: 0,
    fallsEl: document.querySelector(`#p${id}Falls`),
    stateEl: document.querySelector(`#p${id}State`),
    itemEl: document.querySelector(`#p${id}Item`),
  };
}

function cloneBlock(src) {
  return { ...src, baseY: src.y, state: "solid", fallV: 0 };
}

function buildLevel() {
  level = LEVELS[(round - 1) % LEVELS.length];
  platforms = level.platforms.map(cloneBlock);
  hazards = level.hazards.map(cloneBlock);
  switches = level.switches.map((switchObj) => ({ ...switchObj, active: false, wasActive: false }));
  doors = level.doors.map((door) => ({ ...door, y: door.closedY, open: false }));
  movers = level.movers.map((mover) => ({ ...mover, y: mover.homeY, active: false }));
  items = level.items.map((pickup) => ({ ...pickup, taken: false, bob: Math.random() * 100 }));
}

function resetRound(keepFalls = false) {
  buildLevel();
  players.forEach((p, index) => {
    const start = level.start[index];
    p.startX = start.x;
    p.startY = start.y;
    p.x = start.x;
    p.y = start.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.jumpHeld = false;
    p.jumpsUsed = 0;
    p.finished = false;
    p.shield = 0;
    p.speedUntil = 0;
    p.jumpUntil = 0;
    p.knockVx = 0;
    if (!keepFalls) p.falls = 0;
  });
  particles = [];
  won = false;
  winner = null;
  nextStageAt = 0;
  running = false;
  roundLabel.textContent = String(round);
  stageLabel.textContent = level.name;
  message.textContent = `${level.name}: press Start. First player to GOAL wins this stage.`;
  updateHud();
}

function startGame() {
  if (won) {
    advanceStage();
  }
  running = true;
  message.textContent = "Green switches help. Red switches can betray. Items can swing the race.";
  updateHud();
}

function update() {
  frame += 1;
  if (running && !won) {
    updateSwitches();
    updateMovingSolids();
    players.forEach(updatePlayer);
    updateItems();
    updateWin();
  } else if (won && nextStageAt && frame >= nextStageAt) {
    advanceStage();
  }
  updateParticles();
}

function updateSwitches() {
  switches.forEach((switchObj) => {
    switchObj.wasActive = switchObj.active;
    switchObj.active = players.some((p) => rectsOverlap(p, switchObj) && p.vy >= 0);
    if (switchObj.active && !switchObj.wasActive) {
      burst(switchObj.x + switchObj.w / 2, switchObj.y, switchObj.kind === "trap" ? "#ff5d6c" : "#58d68d");
      if (switchObj.kind === "trap") triggerDrop(switchObj.id);
    }
  });

  doors.forEach((door) => {
    const linkedSwitch = switches.find((switchObj) => switchObj.id === door.id);
    door.open = Boolean(linkedSwitch && linkedSwitch.active);
  });

  movers.forEach((mover) => {
    const linkedSwitch = switches.find((switchObj) => switchObj.id === mover.switchId);
    mover.active = Boolean(linkedSwitch && linkedSwitch.active);
  });
}

function triggerDrop(id) {
  platforms.forEach((platform) => {
    if (platform.type !== id || platform.state !== "solid") return;
    platform.state = "falling";
    platform.fallV = 1.8;
    nudgePlayersOff(platform);
  });
}

function nudgePlayersOff(platform) {
  players.forEach((p) => {
    const feet = p.y + p.h;
    const standing = feet <= platform.y + 8 && feet >= platform.y - 6 && rectsOverlap({ ...p, y: p.y + 2 }, platform);
    if (!standing) return;
    p.vy = Math.max(p.vy, 2.5);
    p.onGround = false;
  });
}

function updateMovingSolids() {
  doors.forEach((door) => {
    const target = door.open ? door.openY : door.closedY;
    door.y += (target - door.y) * 0.22;
  });

  movers.forEach((mover) => {
    const target = mover.active ? mover.targetY : mover.homeY;
    mover.y += (target - mover.y) * 0.18;
  });

  platforms.forEach((platform) => {
    if (!platform.type.startsWith("drop-")) return;
    if (platform.state === "falling") {
      platform.fallV = Math.min(16, platform.fallV + 0.5);
      platform.y += platform.fallV;
      if (platform.y > H + 70) {
        platform.state = "returning";
        platform.y = platform.baseY - 160;
        platform.fallV = 0;
      }
    } else if (platform.state === "returning") {
      const occupied = players.some((p) => rectsOverlap(p, { ...platform, y: platform.baseY }));
      if (!occupied) {
        platform.y += (platform.baseY - platform.y) * 0.12;
        if (Math.abs(platform.y - platform.baseY) < 1) {
          platform.y = platform.baseY;
          platform.state = "solid";
        }
      }
    }
  });
}

function updatePlayer(player) {
  if (player.finished) {
    player.vx *= 0.82;
    return;
  }

  const speed = frame < player.speedUntil ? MOVE_SPEED * 1.38 : MOVE_SPEED;
  const jumpPower = frame < player.jumpUntil ? JUMP_POWER * 1.22 : JUMP_POWER;
  const left = keys.has(player.controls.left);
  const right = keys.has(player.controls.right);
  const jump = keys.has(player.controls.jump);

  player.vx = 0;
  if (left) player.vx -= speed;
  if (right) player.vx += speed;
  player.vx += player.knockVx;
  player.knockVx *= 0.86;
  if (Math.abs(player.knockVx) < 0.1) player.knockVx = 0;
  const canJump = player.onGround || player.jumpsUsed < player.maxJumps;
  if (jump && !player.jumpHeld && canJump) {
    const usedFromGround = player.onGround;
    player.vy = -jumpPower;
    player.onGround = false;
    player.jumpsUsed = usedFromGround ? 1 : Math.max(player.jumpsUsed, 1) + 1;
    burst(player.x + player.w / 2, player.y + player.h, player.color);
  }
  player.jumpHeld = jump;

  player.vy = Math.min(MAX_FALL, player.vy + GRAVITY);
  moveAxis(player, "x", player.vx);
  moveAxis(player, "y", player.vy);

  if (hazards.some((hazard) => rectsOverlap(player, hazard)) || player.y > RESPAWN_Y) {
    if (player.shield > 0 && player.y < RESPAWN_Y) {
      player.shield -= 1;
      player.vy = -10;
      player.y -= 34;
      message.textContent = `P${player.id} shield blocked a trap.`;
      burst(player.x + player.w / 2, player.y + player.h / 2, "#8be28b");
    } else {
      respawn(player);
    }
  }

  if (rectsOverlap(player, level.goal)) {
    stageWin(player);
  }
}

function moveAxis(player, axis, amount) {
  if (axis === "x") player.x += amount;
  if (axis === "y") {
    player.y += amount;
    player.onGround = false;
  }

  const solids = [
    ...platforms.filter((platform) => platform.state === "solid"),
    ...doors,
    ...movers,
    b(0, 0, 20, H, "wall"),
    b(W - 20, 0, 20, H, "wall"),
  ];

  solids.forEach((solid) => {
    if (!rectsOverlap(player, solid)) return;
    if (axis === "x") {
      if (amount > 0) player.x = solid.x - player.w;
      if (amount < 0) player.x = solid.x + solid.w;
    } else if (amount > 0) {
      player.y = solid.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsUsed = 0;
    } else if (amount < 0) {
      player.y = solid.y + solid.h;
      player.vy = 0;
    }
  });

  player.x = Math.max(20, Math.min(W - 20 - player.w, player.x));
}

function updateItems() {
  items.forEach((pickup) => {
    if (pickup.taken) return;
    players.forEach((player) => {
      if (!rectsOverlap(player, pickup)) return;
      pickup.taken = true;
      applyItem(player, pickup.type);
      burst(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, ITEM_META[pickup.type].color);
    });
  });
}

function applyItem(player, type) {
  if (type === "speed") player.speedUntil = frame + 480;
  if (type === "jump") player.jumpUntil = frame + 480;
  if (type === "shield") player.shield += 1;
  if (type === "shove") {
    const other = players.find((p) => p !== player);
    const direction = other.x >= player.x ? 1 : -1;
    other.knockVx = direction * 11;
    other.vy = -8;
    message.textContent = `P${player.id} used PUSH on P${other.id}.`;
  } else {
    message.textContent = `P${player.id} picked up ${ITEM_META[type].label}.`;
  }
  updateHud();
}

function respawn(player) {
  player.falls += 1;
  player.x = player.startX;
  player.y = player.startY;
  player.vx = 0;
  player.vy = 0;
  player.finished = false;
  message.textContent = `P${player.id} fell. Cooperation is optional, consequences are not.`;
  burst(player.x + player.w / 2, player.y + player.h / 2, player.color);
  updateHud();
}

function stageWin(player) {
  if (won) return;
  player.finished = true;
  player.vx = 0;
  player.vy = 0;
  won = true;
  running = false;
  winner = player.id;
  nextStageAt = frame + 120;
  message.textContent = `P${player.id} wins ${level.name}. Next stage loading...`;
  for (let i = 0; i < 42; i += 1) {
    burst(level.goal.x + Math.random() * level.goal.w, level.goal.y + Math.random() * level.goal.h, player.color);
  }
  updateHud();
}

function updateWin() {
  updateHud();
}

function advanceStage() {
  round += 1;
  resetRound(true);
  running = true;
  message.textContent = `${level.name}: first player to GOAL wins.`;
}

function updateHud() {
  players.forEach((p) => {
    p.fallsEl.textContent = String(p.falls);
    p.stateEl.textContent = winner === p.id ? "Winner" : running ? "Race" : "Ready";
    const activeItems = [];
    if (p.shield > 0) activeItems.push(`SHD x${p.shield}`);
    if (frame < p.speedUntil) activeItems.push("SPD");
    if (frame < p.jumpUntil) activeItems.push("JMP");
    p.itemEl.textContent = activeItems.length ? activeItems.join(" ") : "-";
  });
}

function updateParticles() {
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life -= 1;
    return p.life > 0;
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  hazards.forEach(drawHazard);
  platforms.forEach(drawPlatform);
  movers.forEach(drawMover);
  doors.forEach(drawDoor);
  switches.forEach(drawSwitch);
  items.forEach(drawItem);
  drawGoal();
  players.forEach(drawPlayer);
  particles.forEach(drawParticle);
  if (!running && !won) drawCenterText("START");
}

function drawBackground() {
  ctx.fillStyle = "#121720";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1a222c";
  for (let x = 0; x < W; x += 56) ctx.fillRect(x, 0, 1, H);
  for (let y = 24; y < H; y += 56) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = "#10151c";
  ctx.fillRect(0, 604, W, 26);
  ctx.fillStyle = "#93a4b5";
  ctx.font = "700 13px Arial";
  ctx.textAlign = "left";
  ctx.fillText(level.name, 34, 36);
}

function drawPlatform(p) {
  if (p.y > H + 50) return;
  const isDrop = p.type.startsWith("drop-");
  ctx.fillStyle = isDrop ? "#463642" : "#303a46";
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = isDrop ? "#ff5d6c" : "#485665";
  ctx.fillRect(p.x, p.y, p.w, 5);
  if (p.state === "returning") {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#f1f5f8";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.globalAlpha = 1;
  }
}

function drawMover(m) {
  ctx.fillStyle = m.kind === "trap" ? "#62333b" : "#294937";
  ctx.fillRect(m.x, m.y, m.w, m.h);
  ctx.fillStyle = m.kind === "trap" ? "#ff5d6c" : "#58d68d";
  ctx.fillRect(m.x, m.y, m.w, 4);
}

function drawDoor(door) {
  ctx.fillStyle = "#795734";
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.fillStyle = "#d7a45a";
  ctx.fillRect(door.x + 8, door.y + 10, door.w - 16, Math.max(0, door.h - 20));
}

function drawHazard(hazard) {
  if (hazard.type === "pit") {
    ctx.fillStyle = "#080a0e";
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    ctx.fillStyle = "#ff5d6c";
    ctx.fillRect(hazard.x, hazard.y, hazard.w, 3);
    return;
  }
  ctx.fillStyle = "#ff5d6c";
  for (let x = hazard.x; x < hazard.x + hazard.w; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, hazard.y + hazard.h);
    ctx.lineTo(x + 9, hazard.y);
    ctx.lineTo(x + 18, hazard.y + hazard.h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSwitch(switchObj) {
  ctx.fillStyle = switchObj.kind === "trap" ? "#582b33" : "#244937";
  ctx.fillRect(switchObj.x, switchObj.y + 10, switchObj.w, switchObj.h - 10);
  ctx.fillStyle = switchObj.kind === "trap" ? "#ff5d6c" : "#58d68d";
  ctx.fillRect(switchObj.x + 5, switchObj.y + (switchObj.active ? 10 : 2), switchObj.w - 10, 12);
  ctx.fillStyle = "#f1f5f8";
  ctx.font = "700 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(switchObj.label, switchObj.x + switchObj.w / 2, switchObj.y + switchObj.h + 14);
}

function drawItem(pickup) {
  if (pickup.taken) return;
  const meta = ITEM_META[pickup.type];
  const y = pickup.y + Math.sin((frame + pickup.bob) * 0.08) * 4;
  ctx.fillStyle = meta.color;
  ctx.fillRect(pickup.x, y, pickup.w, pickup.h);
  ctx.fillStyle = "#10151b";
  ctx.font = "800 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText(meta.label, pickup.x + pickup.w / 2, y + 19);
}

function drawGoal() {
  const goal = level.goal;
  ctx.fillStyle = "#2e7d55";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = "#58d68d";
  ctx.fillRect(goal.x + 8, goal.y + 8, goal.w - 16, Math.min(54, goal.h - 16));
  ctx.fillStyle = "#f1f5f8";
  ctx.font = "800 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GOAL", goal.x + goal.w / 2, goal.y + goal.h / 2 + 5);
}

function drawPlayer(p) {
  ctx.globalAlpha = p.finished ? 0.72 : 1;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  if (p.shield > 0) {
    ctx.strokeStyle = "#8be28b";
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  }
  ctx.fillStyle = "#10151b";
  ctx.fillRect(p.x + 7, p.y + 10, 5, 5);
  ctx.fillRect(p.x + 18, p.y + 10, 5, 5);
  ctx.fillStyle = "#f1f5f8";
  ctx.font = "800 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`P${p.id}`, p.x + p.w / 2, p.y - 8);
  ctx.globalAlpha = 1;
}

function drawParticle(p) {
  ctx.globalAlpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x, p.y, p.size, p.size);
  ctx.globalAlpha = 1;
}

function drawCenterText(text) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.fillRect(422, 270, 276, 78);
  ctx.fillStyle = "#f1f5f8";
  ctx.font = "800 30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, 318);
}

function burst(x, y, color) {
  for (let i = 0; i < 8; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.8) * 5,
      size: 3 + Math.random() * 4,
      life: 22,
      maxLife: 22,
      color,
    });
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", () => resetRound(false));

resetRound();
loop();
