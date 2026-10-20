// Generates an animated, growing, smooth-moving snake over the GitHub contribution grid.
// Usage: node scripts/snake.js <github-user> <out-dir>
const fs = require("fs");
const path = require("path");

const user = process.argv[2] || "giteshnegi06";
const outDir = process.argv[3] || "dist";

const SPEED = 90; // px per second (lower = slower)
const PAUSE = 2.5; // seconds before restarting
const CELL = 12;
const PITCH = 15;
const PAD = 14;
const SPACING = 3.2; // px between body segments (small = continuous body)
const START_PX = 50; // starting body length
const GROW_PX = 5; // length gained per contribution square eaten
const MAX_PX = 330; // maximum body length
const HEAD_R = 6.4;
const TAIL_R = 1.6;
const RUN_CAP = 110; // max seconds of hunting per loop

const themes = {
  light: {
    bg: "#ffffff",
    levels: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    headA: "#2e7d32",
    bodyA: "#43a047",
    bodyB: "#1b5e20",
    tail: "#a5d6a7",
    stroke: "#0b3d0f",
  },
  dark: {
    bg: "#0d1117",
    levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    headA: "#3ddc84",
    bodyA: "#22c55e",
    bodyB: "#15803d",
    tail: "#0b4f2a",
    stroke: "#052e16",
  },
};

async function getDays() {
  const res = await fetch(`https://github.com/users/${user}/contributions`);
  if (!res.ok) throw new Error(`contributions fetch failed: ${res.status}`);
  const html = await res.text();
  const days = [];
  for (const tag of html.match(/<td[^>]*data-date="[^>]*>/g) || []) {
    const date = tag.match(/data-date="([^"]+)"/)[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    days.push({ date, level });
  }
  if (!days.length) throw new Error("no contribution cells found");
  days.sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(days[0].date + "T00:00:00Z");
  return days.map((d) => {
    const dt = new Date(d.date + "T00:00:00Z");
    const x = Math.floor(((dt - first) / 86400000 + first.getUTCDay()) / 7);
    return { x, y: dt.getUTCDay(), level: d.level };
  });
}

const f = (n) => +n.toFixed(3);

function seedFromDate() {
  const n = new Date();
  return n.getUTCFullYear() * 400 + n.getUTCMonth() * 31 + n.getUTCDate();
}

function rng(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

function build(days, t) {
  const cols = Math.max(...days.map((d) => d.x)) + 1;
  const W = PAD * 2 + (cols - 1) * PITCH + CELL;
  const H = PAD * 2 + 6 * PITCH + CELL;
  const cx = (x) => PAD + x * PITCH + CELL / 2;
  const cy = (y) => PAD + y * PITCH + CELL / 2;

  // Random hunt: the snake picks one of the few nearest uneaten squares, walks there
  // with grid steps (no U-turns), and eats everything it passes over.
  const rnd = rng(seedFromDate());
  const key = (x, y) => x + "," + y;
  const cellAt = new Map(days.map((c) => [key(c.x, c.y), c]));
  const food = new Set(days.filter((c) => c.level > 0).map((c) => key(c.x, c.y)));
  const visited = new Map(); // key -> distance along path when first reached
  const pts = [[0, 3]];
  let px = 0;
  let py = 3;
  let prev = null;
  let corners = 0;
  let steps = 0;
  const maxSteps = Math.floor((RUN_CAP * SPEED) / PITCH);
  const visit = () => {
    const k = key(px, py);
    if (!visited.has(k)) visited.set(k, steps);
    food.delete(k);
  };
  visit();
  while (food.size && steps < maxSteps) {
    const list = [...food]
      .map((k) => k.split(",").map(Number))
      .sort((p, q) => Math.abs(p[0] - px) + Math.abs(p[1] - py) - (Math.abs(q[0] - px) + Math.abs(q[1] - py)));
    const [tx, ty] = list[Math.floor(rnd() * Math.min(4, list.length))];
    while ((px !== tx || py !== ty) && steps < maxSteps) {
      const opts = [];
      if (tx > px) opts.push([1, 0]);
      if (tx < px) opts.push([-1, 0]);
      if (ty > py) opts.push([0, 1]);
      if (ty < py) opts.push([0, -1]);
      let ok = opts.filter((m) => !prev || !(m[0] === -prev[0] && m[1] === -prev[1]));
      if (!ok.length) {
        // would have to turn around: sidestep first
        ok = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(
          (m) =>
            (!prev || !(m[0] === -prev[0] && m[1] === -prev[1])) &&
            px + m[0] >= 0 && px + m[0] < cols && py + m[1] >= 0 && py + m[1] < 7 &&
            (m[0] === 0) !== (prev ? prev[0] === 0 : false),
        );
      }
      const straight = prev && ok.find((m) => m[0] === prev[0] && m[1] === prev[1]);
      const m = straight && rnd() < 0.65 ? straight : ok[Math.floor(rnd() * ok.length)];
      if (prev && (m[0] !== prev[0] || m[1] !== prev[1])) corners++;
      px += m[0];
      py += m[1];
      prev = m;
      steps++;
      pts.push([px, py]);
      visit();
    }
  }
  // keep only direction changes, then round every corner with a small curve
  const keep = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a1 = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
    const b1 = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]];
    if (a1[0] !== b1[0] || a1[1] !== b1[1]) keep.push(pts[i]);
  }
  keep.push(pts[pts.length - 1]);
  const RAD = PITCH / 2;
  let d = `M${cx(keep[0][0])},${cy(keep[0][1])}`;
  for (let i = 1; i < keep.length - 1; i++) {
    const [x0, y0] = [cx(keep[i - 1][0]), cy(keep[i - 1][1])];
    const [x1, y1] = [cx(keep[i][0]), cy(keep[i][1])];
    const [x2, y2] = [cx(keep[i + 1][0]), cy(keep[i + 1][1])];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const r1 = Math.min(RAD, l1 / 2);
    const r2 = Math.min(RAD, l2 / 2);
    d += ` L${f(x1 - ((x1 - x0) / l1) * r1)},${f(y1 - ((y1 - y0) / l1) * r1)}`;
    d += ` Q${x1},${y1} ${f(x1 + ((x2 - x1) / l2) * r2)},${f(y1 + ((y2 - y1) / l2) * r2)}`;
  }
  const last = keep[keep.length - 1];
  d += ` L${cx(last[0])},${cy(last[1])}`;
  const total = Math.max(steps * PITCH - corners * 0.39 * RAD, PITCH);
  const run = total / SPEED;
  const distOf = (k) => visited.get(k) * PITCH;

  const nSeg = Math.round(MAX_PX / SPACING) + 1;
  const lag = SPACING / SPEED;
  const T = run + (nSeg - 1) * lag + PAUSE;

  let cells = "";
  const eatTimes = [];
  const sorted = [...days].sort(
    (a, b) => (visited.get(key(a.x, a.y)) ?? 1e9) - (visited.get(key(b.x, b.y)) ?? 1e9),
  );
  for (const c of sorted) {
    const x = PAD + c.x * PITCH;
    const y = PAD + c.y * PITCH;
    if (c.level === 0) {
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${t.levels[0]}"/>`;
      continue;
    }
    if (!visited.has(key(c.x, c.y))) {
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${t.levels[c.level]}"/>`;
      continue;
    }
    const at = distOf(key(c.x, c.y)) / SPEED;
    eatTimes.push(at);
    const kt = Math.min(at / T, 0.999);
    cells +=
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${t.levels[c.level]}">` +
      `<animate attributeName="fill" dur="${f(T)}s" repeatCount="indefinite" calcMode="discrete" ` +
      `keyTimes="0;${f(kt)};1" values="${t.levels[c.level]};${t.levels[0]};${t.levels[0]}"/></rect>`;
  }

  // body segment j sits j*SPACING behind the head; it appears when the snake has grown that long
  const maxLen = Math.min(MAX_PX, START_PX + GROW_PX * eatTimes.length);
  const count = Math.floor(maxLen / SPACING) + 1;
  let snake = "";
  for (let j = count - 1; j >= 0; j--) {
    const begin = j * lag;
    const need = Math.ceil((j * SPACING - START_PX) / GROW_PX);
    const growAt = need <= 0 ? 0 : eatTimes[need - 1];
    const local = Math.max(growAt - begin, 0);
    const kShow = Math.min(local / T, 0.998);
    const kEnd = Math.min(run / T, 0.999);
    const frac = count > 1 ? j / (count - 1) : 0;
    const r = HEAD_R - 0.8 - (HEAD_R - TAIL_R - 0.8) * Math.pow(frac, 0.8);
    // alternating scale bands + fading toward the tail
    const band = Math.floor(j / 3) % 2 === 0 ? t.bodyA : t.bodyB;
    const color = mix(band, t.tail, Math.pow(frac, 1.6));

    let shape;
    if (j === 0) {
      shape =
        // tongue (flicks)
        `<path d="M7,0 L13,0 M13,0 L16,-2.2 M13,0 L16,2.2" stroke="#ef2b4a" stroke-width="1.1" stroke-linecap="round" fill="none">` +
        `<animate attributeName="opacity" dur="1.1s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.45;0.5;0.8;0.85"/></path>` +
        `<ellipse rx="8.6" ry="6.6" fill="${t.headA}" stroke="${t.stroke}" stroke-width="0.8"/>` +
        `<ellipse cx="-1" rx="4.5" ry="3" fill="${mix(t.headA, "#ffffff", 0.18)}" opacity="0.7"/>` +
        `<ellipse cx="3.2" cy="-3.4" rx="2.2" ry="2.5" fill="#fff8c4"/><ellipse cx="3.2" cy="3.4" rx="2.2" ry="2.5" fill="#fff8c4"/>` +
        `<ellipse cx="3.6" cy="-3.4" rx="0.7" ry="1.8" fill="#111"/><ellipse cx="3.6" cy="3.4" rx="0.7" ry="1.8" fill="#111"/>`;
    } else {
      shape = `<circle r="${f(Math.max(r, 1.4))}" fill="${color}" stroke="${t.stroke}" stroke-width="0.35" stroke-opacity="0.55"/>`;
    }

    snake +=
      `<g opacity="0">${shape}` +
      `<animate attributeName="opacity" dur="${f(T)}s" begin="${f(begin)}s" repeatCount="indefinite" calcMode="discrete" ` +
      `keyTimes="0;${f(kShow)};${f(kEnd)};1" values="0;1;0;0"/>` +
      `<animateMotion dur="${f(T)}s" begin="${f(begin)}s" repeatCount="indefinite" rotate="auto" path="${d}" ` +
      `calcMode="linear" keyPoints="0;1;1" keyTimes="0;${f(run / T)};1"/></g>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>${cells}${snake}</svg>`
  );
}

(async () => {
  const days = await getDays();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "snake.svg"), build(days, themes.light));
  fs.writeFileSync(path.join(outDir, "snake-dark.svg"), build(days, themes.dark));
  console.log(`wrote snake.svg and snake-dark.svg (${days.length} days)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
