// ================= SETUP =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height, T = 16; // T = tile size
const HEROINE = "Diva"; // <- put her real name here!
const PINK = "#ff1493", HOT = "#ff69b4", SOFT = "#ffd1ec", GOLD = "#ffd700", DARK = "#4a1f33";

// ================= STORY DATA (edit me!) =================
// c / r = column / row on the map. Each choice is [text, isGoodAnswer, rivalReply]
const STAGES = [
  { name: "Glitter Gulch", a: "#ffe9a8", b: "#ffd966", deco: "#ff1493",
    helper: { n: "Coco", col: "#9b5de5", hair: "#2b1b3d", c: 5, r: 3,
      lines: ["Welcome, queen! The Main Stage crown shattered into 7 pieces.", "Vanna, the Spotlight Thief, holds the first one. Go find her!"] },
    rival: { n: "Vanna", col: "#222222", hair: "#111111", c: 14, r: 8,
      ask: ["Another wannabe chasing MY spotlight? Cute.", "Give me one good reason to hand over this crown piece."],
      ch: [["Because I'm the queen. Hand it over.", false, "Everybody says that. Try harder, babe."],
           ["Because the stage glows brighter when we share it.", true, "...Ugh. That was iconic. Take it."]] } },
  { name: "Dusty Disco Desert", a: "#ffd2a8", b: "#ffb98a", deco: "#3a9d5d",
    helper: { n: "Rosie", col: "#e63946", hair: "#6b3a1e", c: 4, r: 8,
      lines: ["Yeehaw, darling! You made it through the glitter.", "Sheriff Sparkle guards the next piece. Watch out, the tumbleweeds judge."] },
    rival: { n: "Sheriff Sparkle", col: "#8b5a2b", hair: "#3b2412", c: 15, r: 3,
      ask: ["Halt! This desert ain't big enough for two divas."],
      ch: [["Move or get moved, cowgirl.", false, "Them's fightin' words. Try again, sugar."],
           ["Then let's make it a duet.", true, "A duet? Well butter my boots. The piece is yours."]] } },
  { name: "Frosted Velvet Palace", a: "#d6f0ff", b: "#b5e1ff", deco: "#7aa7ff",
    helper: { n: "Pearl", col: "#6ec6ff", hair: "#e8e8ff", c: 6, r: 9,
      lines: ["Brrr! Velvet and ice everywhere.", "Duchess Frost never smiles. Maybe you can change that?"] },
    rival: { n: "Duchess Frost", col: "#3a5a9b", hair: "#cfd8ff", c: 14, r: 4,
      ask: ["Hmph. Your outfit is... loud."],
      ch: [["I'll tone it down for you.", false, "A queen never shrinks. Again."],
           ["Thank you, loud is the whole point!", true, "*almost smiles* ...Take the piece. And the tiara tips."]] } },
  { name: "Neon Midnight Alley", a: "#3b1f5e", b: "#2d1650", deco: "#00f5d4",
    helper: { n: "Neko", col: "#f15bb5", hair: "#14081f", c: 5, r: 4,
      lines: ["Psst... the alley hums at midnight.", "Madame Static jams every signal. Be loud, be you."] },
    rival: { n: "Madame Static", col: "#00bbf9", hair: "#0b0b1e", c: 14, r: 9,
      ask: ["Bzzzt... nobody hears you in all this noise."],
      ch: [["Then I'll turn my own volume up.", true, "Bzzzt... signal clear. Wow. Take it."],
           ["Maybe I should stay quiet.", false, "Bzzzt... static wins. Try again!"]] } },
  { name: "Orchid Garden Ballroom", a: "#e6c6ff", b: "#d3a6ff", deco: "#b5179e",
    helper: { n: "Fern", col: "#4caf50", hair: "#2d4a1e", c: 7, r: 9,
      lines: ["Shhh, the orchids are gossiping about you.", "Baroness Bloom hosts the ball. Charm is the key."] },
    rival: { n: "Baroness Bloom", col: "#9d4edd", hair: "#5a189a", c: 14, r: 3,
      ask: ["Darling, this ballroom is invite-only."],
      ch: [["Please, may I come in?", false, "So polite, so dull. Try again, darling."],
           ["I don't need an invite, I bring the party.", true, "Ha! Delightful. The piece is yours, darling."]] } },
  { name: "Chrome Moon Arcade", a: "#c9d6e8", b: "#aebfd6", deco: "#ff006e",
    helper: { n: "Pixel", col: "#3a86ff", hair: "#ff9ccf", c: 4, r: 3,
      lines: ["Beep boop! Welcome to the Moon Arcade.", "The Glitch Queen scrambled every high score. Outsmart her!"] },
    rival: { n: "Glitch Queen", col: "#7209b7", hair: "#240046", c: 15, r: 8,
      ask: ["ERROR: diva not found. Prove you're real."],
      ch: [["Reboot the game so I win.", false, "CHEATER DETECTED. Try again."],
           ["I don't need a high score to be iconic.", true, "LOADING... ACCEPTED. Piece unlocked!"]] } },
  { name: "The Shattered Main Stage", a: "#ff9ccf", b: "#ff6fb8", deco: "#ffd700",
    helper: { n: "Mama Leopard", col: "#d98a2b", hair: "#4a2511", c: 5, r: 8,
      lines: ["Six pieces shine in your crown, baby.", "The last one hides in your own echo. Face her."] },
    rival: { n: "The Echo", col: "#6d3b8c", hair: "#2a1236", c: 14, r: 4,
      ask: ["You're not ready. You'll never be enough."],
      ch: [["You're right, maybe I'm not.", false, "No! That's the doubt talking. Try again."],
           ["I was born ready, and I'm still growing.", true, "...Then I'm just your voice. Wear the crown, queen."]] } }
];

// ================= GAME STATE =================
let mode = "title"; // title | play | dialogue | ending
let stageIdx = 0, loadP = 0, frame = 0, fade = 0, toast = null, dlg = null, muted = false;
const won = Array(7).fill(false), talked = Array(7).fill(false);
const player = { x: 22, y: 90, w: 12, h: 12, speed: 1.6, moving: false };
let decos = [], solids = [];

// ================= HELPERS =================
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rng = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; // same "random" every time

let AC = null;
function beep(f, d = 0.08, type = "square", v = 0.04) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + d);
  } catch (e) {}
}
const jingle = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.16, "square", 0.05), i * 110));

// ================= STAGES =================
function loadStage(i) {
  stageIdx = i; fade = 1;
  const s = STAGES[i];
  player.x = 22; player.y = 90; decos = [];
  const R = rng(i * 97 + 13);
  const near = (c, r, n) => Math.abs(c - n.c) <= 1 && Math.abs(r - n.r) <= 1;
  const blocked = (c, r) => (c <= 2 && r >= 4 && r <= 8) || (c >= 18 && r >= 4 && r <= 8) ||
    near(c, r, s.helper) || near(c, r, s.rival) || decos.some(d => d.c === c && d.r === r);
  for (let tries = 0; decos.length < 10 && tries < 200; tries++) {
    const c = Math.floor(R() * 20), r = 1 + Math.floor(R() * 11);
    if (!blocked(c, r)) decos.push({ c, r, x: c * T, y: r * T, w: T, h: T });
  }
  solids = [...decos, ...[s.helper, s.rival].map(n => ({ x: n.c * T + 1, y: n.r * T + 1, w: 14, h: 14 }))];
}

function newGame() {
  won.fill(false); talked.fill(false);
  loadStage(0); mode = "play"; jingle();
  toast = { text: "Arrows/WASD to move - Space to talk", t: 300 };
}

function nextStage() {
  if (stageIdx < 6) { beep(880, 0.2); loadStage(stageIdx + 1); }
  else { mode = "ending"; jingle(); }
}

// ================= DIALOGUE =================
const cur = () => dlg.lines[dlg.i].text;
function say(lines, o = {}) {
  dlg = { lines, i: 0, shown: 0, lastBlip: 0, choices: o.choices || null, sel: 0, onEnd: o.onEnd || null };
  mode = "dialogue";
}
function askRival() {
  const r = STAGES[stageIdx].rival;
  say(r.ask.map(t => ({ who: r.n, text: t })), { choices: r.ch.map(c => c[0]) });
}
function pick(i) {
  const r = STAGES[stageIdx].rival, c = r.ch[i];
  say([{ who: r.n, text: c[2] }], { onEnd: () => (c[1] ? winStage() : askRival()) });
}
function winStage() {
  won[stageIdx] = true; jingle();
  const n = won.filter(Boolean).length;
  say([{ who: "Crown", text: "You earned crown piece " + n + " of 7! The door on the right is open." }]);
}
function talk(n) {
  const s = STAGES[stageIdx];
  if (n === s.helper) {
    const lines = talked[stageIdx] ? ["Go on, queen. You've got this!"] : s.helper.lines;
    talked[stageIdx] = true;
    say(lines.map(t => ({ who: n.n, text: t })));
  } else if (won[stageIdx]) say([{ who: n.n, text: "Go on, queen. Your crown awaits." }]);
  else askRival();
}
function nearNpc() {
  const s = STAGES[stageIdx];
  return [s.helper, s.rival].find(n => Math.hypot(player.x + 6 - (n.c * T + 8), player.y + 6 - (n.r * T + 8)) < 26);
}

// ================= INPUT =================
const keys = {};
function action() {
  if (mode === "title") { if (loadP >= 1) newGame(); return; }
  if (mode === "ending") { mode = "title"; loadP = 0; return; }
  if (mode === "play") { const n = nearNpc(); if (n) { beep(700, 0.05); talk(n); } return; }
  if (mode === "dialogue") {
    if (dlg.shown < cur().length) { dlg.shown = cur().length; return; }
    if (dlg.i < dlg.lines.length - 1) { dlg.i++; dlg.shown = 0; return; }
    if (dlg.choices) { pick(dlg.sel); return; }
    const f = dlg.onEnd; dlg = null; mode = "play"; if (f) f();
  }
}
function onPress(k) {
  if (k === "action") action();
  if (k === "m") muted = !muted;
  if (mode === "dialogue" && dlg.choices && dlg.i === dlg.lines.length - 1 && dlg.shown >= cur().length) {
    const n = dlg.choices.length;
    if (k === "arrowup" || k === "w") dlg.sel = (dlg.sel + n - 1) % n;
    if (k === "arrowdown" || k === "s") dlg.sel = (dlg.sel + 1) % n;
  }
}
const press = (k) => { if (!keys[k]) onPress(k); keys[k] = true; };
const release = (k) => { keys[k] = false; };
const isAction = (k) => k === "enter" || k === " " || k === "z";

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  press(isAction(k) ? "action" : k);
});
window.addEventListener("keyup", (e) => { const k = e.key.toLowerCase(); release(isAction(k) ? "action" : k); });

// touch buttons
document.querySelectorAll("[data-key]").forEach((b) => {
  const k = b.dataset.key;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); press(k); });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, () => release(k)));
});
canvas.addEventListener("pointerdown", () => { if (mode !== "play") action(); }); // tap screen to continue

// ================= UPDATE =================
function tryMove(mx, my) {
  const t = { x: player.x + mx, y: player.y + my, w: player.w, h: player.h };
  if (t.x < 0 || t.x > W - t.w || t.y < T || t.y > H - t.h) return;
  if (solids.some(s => hit(t, s))) return;
  player.x = t.x; player.y = t.y;
}

function update() {
  frame++;
  if (fade > 0) fade = Math.max(0, fade - 0.04);
  if (toast && --toast.t <= 0) toast = null;
  if (mode === "title") { loadP = Math.min(1, loadP + 0.012); return; }
  if (mode === "dialogue") {
    if (dlg.shown < cur().length) {
      dlg.shown += 0.8;
      const n = Math.floor(dlg.shown);
      if (n % 3 === 0 && n !== dlg.lastBlip) { dlg.lastBlip = n; beep(520 + Math.random() * 80, 0.03, "square", 0.02); }
    }
    return;
  }
  if (mode !== "play") return;
  let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
  let dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
  player.moving = !!(dx || dy);
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
  tryMove(dx * player.speed, 0);
  tryMove(0, dy * player.speed);
  // the door on the right edge
  if (hit(player, { x: W - 12, y: 5 * T, w: 12, h: 3 * T })) {
    if (won[stageIdx]) nextStage();
    else if (!toast) toast = { text: "Locked! Beat " + STAGES[stageIdx].rival.n + " first.", t: 120 };
  }
}

// ================= DRAWING =================
function sparkle(x, y, p) {
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 1, y - 4, 2, 8); ctx.fillRect(x - 4, y - 1, 8, 2);
  ctx.globalAlpha = 1;
}

function drawChar(x, y, col, hair, crown, walk, spots) {
  const w1 = walk && (frame >> 3) % 2 === 0;
  ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(x + 2, y + 17, 10, 2);
  ctx.fillStyle = DARK;
  ctx.fillRect(x + 3, y + 16 - (w1 ? 1 : 0), 3, 2);
  ctx.fillRect(x + 8, y + 16 - (walk && !w1 ? 1 : 0), 3, 2);
  ctx.fillStyle = hair; ctx.fillRect(x + 1, y + 3, 12, 9);
  ctx.fillStyle = "#ffd9b3"; ctx.fillRect(x + 3, y + 5, 8, 5);
  ctx.fillStyle = DARK; ctx.fillRect(x + 4, y + 7, 1, 1); ctx.fillRect(x + 9, y + 7, 1, 1);
  ctx.fillStyle = PINK; ctx.fillRect(x + 6, y + 9, 2, 1);
  ctx.fillStyle = col; ctx.fillRect(x + 2, y + 10, 10, 6);
  if (spots) { ctx.fillStyle = DARK; ctx.fillRect(x + 3, y + 12, 1, 1); ctx.fillRect(x + 7, y + 11, 1, 1); ctx.fillRect(x + 10, y + 13, 1, 1); }
  if (crown) {
    ctx.fillStyle = crown;
    ctx.fillRect(x + 3, y + 1, 8, 2);
    ctx.fillRect(x + 3, y, 2, 1); ctx.fillRect(x + 6, y, 2, 1); ctx.fillRect(x + 9, y, 2, 1);
  }
}

function drawDeco(d, s) {
  ctx.fillStyle = DARK; ctx.fillRect(d.x + 1, d.y + 2, 14, 13);
  ctx.fillStyle = s.deco; ctx.fillRect(d.x + 2, d.y + 3, 12, 11);
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(d.x + 3, d.y + 4, 4, 2);
}

function drawPortal() {
  const px = W - 14, py = 5 * T, ph = 3 * T;
  ctx.fillStyle = DARK; ctx.fillRect(px - 1, py - 2, 15, ph + 4);
  if (won[stageIdx]) {
    ctx.fillStyle = "rgb(255," + (170 + Math.sin(frame / 8) * 60 | 0) + ",225)"; ctx.fillRect(px + 1, py, 12, ph);
    sparkle(px + 7, py + 24 + Math.sin(frame / 10) * 10, frame / 6);
  } else {
    ctx.fillStyle = "#999"; ctx.fillRect(px + 1, py, 12, ph);
    ctx.fillStyle = GOLD; ctx.fillRect(px + 4, py + ph / 2 - 2, 6, 6);
    ctx.fillStyle = DARK; ctx.fillRect(px + 6, py + ph / 2, 2, 2);
  }
}

function drawWorld() {
  const s = STAGES[stageIdx];
  for (let r = 0; r < H / T; r++)
    for (let c = 0; c < W / T; c++) { ctx.fillStyle = (r + c) % 2 ? s.a : s.b; ctx.fillRect(c * T, r * T, T, T); }
  drawPortal();
  const items = [
    ...decos.map(d => ({ y: d.y + T, f: () => drawDeco(d, s) })),
    ...[s.helper, s.rival].map(n => ({ y: n.r * T + T, f: () => drawChar(n.c * T + 1, n.r * T - 3, n.col, n.hair, null, false, false) })),
    { y: player.y + 12, f: () => drawChar(player.x - 1, player.y - 6, PINK, "#4a2511", GOLD, player.moving, true) }
  ];
  items.sort((a, b) => a.y - b.y).forEach(i => i.f());
  const n = mode === "play" && nearNpc();
  if (n) { // little "!" bubble above whoever you can talk to
    const bx = n.c * T + 1, by = n.r * T - 16 + Math.sin(frame / 8) * 1.5;
    ctx.fillStyle = "#fff"; ctx.fillRect(bx, by, 12, 10);
    ctx.fillStyle = PINK; ctx.font = "bold 8px monospace"; ctx.fillText("!", bx + 5, by + 8);
  }
}

function drawHUD() {
  ctx.fillStyle = HOT; ctx.fillRect(0, 0, W, T);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, T - 1, W, 1);
  ctx.font = "bold 8px monospace";
  ctx.fillText("Stage " + (stageIdx + 1) + "/7 - " + STAGES[stageIdx].name, 6, 11);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = won[i] ? GOLD : "#c2478f"; ctx.fillRect(W - 70 + i * 9, 4, 7, 8);
    if (won[i]) { ctx.fillStyle = "#fff"; ctx.fillRect(W - 69 + i * 9, 5, 2, 2); }
  }
}

function wrap(text, maxW) {
  const lines = []; let l = "";
  for (const w of text.split(" ")) {
    const t = l ? l + " " + w : w;
    if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t;
  }
  lines.push(l); return lines;
}

function drawDialogue() {
  const bx = 8, by = H - 66, bw = W - 16, bh = 60, c = dlg.lines[dlg.i];
  ctx.fillStyle = "#fff"; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
  ctx.fillStyle = PINK; ctx.fillRect(bx + 6, by - 6, Math.max(50, c.who.length * 5 + 12), 12);
  ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace"; ctx.fillText(c.who, bx + 11, by + 3);
  ctx.font = "8px monospace";
  const done = dlg.shown >= c.text.length;
  if (dlg.choices && done && dlg.i === dlg.lines.length - 1) {
    dlg.choices.forEach((t, k) => {
      ctx.fillStyle = k === dlg.sel ? PINK : DARK;
      ctx.fillText((k === dlg.sel ? "> " : "  ") + t, bx + 10, by + 24 + k * 14);
    });
    ctx.fillStyle = "#999"; ctx.fillText("Up/Down to choose, Space to confirm", bx + 10, by + bh - 6);
  } else {
    ctx.fillStyle = DARK;
    let left = Math.floor(dlg.shown);
    wrap(c.text, bw - 24).forEach((ln, k) => {
      ctx.fillText(ln.slice(0, Math.max(0, left)), bx + 10, by + 22 + k * 11);
      left -= ln.length + 1;
    });
    if (done && frame % 40 < 24) { ctx.fillStyle = PINK; ctx.fillRect(bx + bw - 14, by + bh - 10, 6, 4); }
  }
}

function drawToast() {
  ctx.font = "8px monospace";
  const w = ctx.measureText(toast.text).width + 14, x = (W - w) / 2, y = H - 24;
  ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, 14);
  ctx.strokeStyle = PINK; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 13);
  ctx.fillStyle = PINK; ctx.fillText(toast.text, x + 7, y + 10);
}

function drawTitle() {
  ctx.fillStyle = "#ffb3d9"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = DARK;
  for (let i = 0; i < 46; i++) { const x = (i * 97) % W, y = (i * 61) % H; ctx.fillRect(x, y, 5, 4); ctx.fillRect(x + 1, y - 1, 3, 1); }
  ctx.fillStyle = "#fff"; ctx.fillRect(38, 26, 244, 142);
  ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.strokeRect(39, 27, 242, 140);
  const g = ctx.createLinearGradient(40, 0, 280, 0); g.addColorStop(0, PINK); g.addColorStop(1, HOT);
  ctx.fillStyle = g; ctx.fillRect(40, 28, 240, 14);
  ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace"; ctx.fillText("QueenOfSevenStages.exe", 46, 38);
  ["_", "o", "x"].forEach((t, k) => { ctx.fillStyle = SOFT; ctx.fillRect(238 + k * 14, 31, 11, 9); ctx.fillStyle = PINK; ctx.fillText(t, 241 + k * 14, 38); });
  ctx.textAlign = "center";
  ctx.fillStyle = PINK; ctx.font = "bold 14px monospace";
  ctx.fillText("Queen of the", 160, 66); ctx.fillText("Seven Stages", 160, 84);
  ctx.font = "8px monospace"; ctx.fillStyle = DARK;
  ctx.fillText("A glitter adventure for " + HEROINE, 160, 100);
  ctx.strokeStyle = DARK; ctx.lineWidth = 1; ctx.strokeRect(70.5, 110.5, 180, 10);
  ctx.fillStyle = HOT;
  for (let i = 0; i < Math.floor(loadP * 22); i++) ctx.fillRect(72 + i * 8, 112, 6, 6);
  ctx.fillStyle = PINK;
  if (loadP < 1) ctx.fillText("Loading... " + Math.floor(loadP * 100) + "%", 160, 138);
  else if (frame % 60 < 40) ctx.fillText("Press SPACE or tap to start", 160, 138);
  ctx.fillStyle = "#999"; ctx.fillText("Best viewed in 800x600 - (c) 2003", 160, 158);
  ctx.textAlign = "left";
  [[56, 60], [260, 70], [70, 140], [250, 130], [160, 48]].forEach(([x, y], i) => sparkle(x, y, frame / 8 + i * 2));
}

function drawEnding() {
  for (let r = 0; r < H / T; r++)
    for (let c = 0; c < W / T; c++) { ctx.fillStyle = (r + c) % 2 ? "#ff9ccf" : "#ff6fb8"; ctx.fillRect(c * T, r * T, T, T); }
  ctx.fillStyle = GOLD; ctx.fillRect(130, 44, 60, 18);
  [130, 150, 170, 184].forEach(x => ctx.fillRect(x, 32, 6, 14));
  ctx.fillStyle = "#fff"; ctx.fillRect(138, 50, 4, 4); ctx.fillRect(158, 50, 4, 4); ctx.fillRect(178, 50, 4, 4);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff"; ctx.font = "bold 14px monospace"; ctx.fillText("THE CROWN IS WHOLE!", 160, 96);
  ctx.font = "8px monospace"; ctx.fillStyle = DARK;
  ctx.fillText("Long live " + HEROINE + ", Queen of the Seven Stages", 160, 114);
  if (frame % 60 < 40) ctx.fillText("Press SPACE or tap to play again", 160, 150);
  ctx.textAlign = "left";
  for (let i = 0; i < 12; i++) sparkle((i * 83) % W, 20 + (i * 47) % 150, frame / 8 + i);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (mode === "title") drawTitle();
  else if (mode === "ending") drawEnding();
  else {
    drawWorld(); drawHUD();
    if (mode === "dialogue") drawDialogue(); else if (toast) drawToast();
  }
  if (fade > 0) { ctx.fillStyle = "rgba(255,255,255," + fade + ")"; ctx.fillRect(0, 0, W, H); }
}

// ================= GAME LOOP =================
// Fixed 60 updates per second, so the game runs the same speed on every screen
loadStage(0);
let last = 0, acc = 0;
function loop(t) {
  acc += Math.min(100, t - last); last = t;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
