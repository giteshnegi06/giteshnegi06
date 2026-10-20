// Generates an animated, growing snake over the GitHub contribution grid.
// Usage: node scripts/snake.js <github-user> <out-dir>
const fs = require("fs");
const path = require("path");

const user = process.argv[2] || "giteshnegi06";
const outDir = process.argv[3] || "dist";

const STEP = 0.16; // seconds per cell (higher = slower)
const PAUSE = 2.5; // seconds before restarting
const CELL = 12;
const PITCH = 15;
const PAD = 12;
const START_LEN = 4;
const MAX_LEN = 48;

const themes = {
  light: {
    bg: "#ffffff",
    levels: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    head: "#1b5e20",
    bodyFrom: "#2e7d32",
    bodyTo: "#a5d6a7",
  },
  dark: {
    bg: "#0d1117",
    levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    head: "#00f7ff",
    bodyFrom: "#00e676",
    bodyTo: "#0b6b3a",
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
    const y = dt.getUTCDay();
    const x = Math.floor((dt - first) / 86400000 + first.getUTCDay()) / 7;
    return { x: Math.floor(x), y, level: d.level };
  });
}

const f = (n) => +n.toFixed(2);

function build(days, t) {
  const cols = Math.max(...days.map((d) => d.x)) + 1;
  const W = PAD * 2 + cols * PITCH - (PITCH - CELL);
  const H = PAD * 2 + 7 * PITCH - (PITCH - CELL);
  const cx = (x) => PAD + x * PITCH + CELL / 2;
  const cy = (y) => PAD + y * PITCH + CELL / 2;

  // boustrophedon route: down column 0, up column 1, ...
  const grid = new Map(days.map((d) => [d.x + "," + d.y, d]));
  const route = [];
  for (let x = 0; x < cols; x++) {
    for (let k = 0; k < 7; k++) {
      const y = x % 2 === 0 ? k : 6 - k;
      route.push({ x, y, cell: grid.get(x + "," + y) });
    }
  }
  const steps = route.length - 1;
  const T = steps * STEP + PAUSE;
  const run = steps * STEP;
  const pathD = route.map((p, i) => `${i ? "L" : "M"}${cx(p.x)},${cy(p.y)}`).join("");

  // cells: coloured until eaten
  let cells = "";
  let eaten = 0;
  const eatIdx = []; // route index of each eaten cell, in order
  route.forEach((p, i) => {
    if (!p.cell) return;
    const lv = p.cell.level;
    const x = PAD + p.x * PITCH;
    const y = PAD + p.y * PITCH;
    if (lv === 0) {
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${t.levels[0]}"/>`;
      return;
    }
    eatIdx.push(i);
    eaten++;
    const kt = Math.min((i * STEP) / T, 0.999);
    cells +=
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${t.levels[lv]}">` +
      `<animate attributeName="fill" dur="${f(T)}s" repeatCount="indefinite" calcMode="discrete" ` +
      `keyTimes="0;${f(kt)};1" values="${t.levels[lv]};${t.levels[0]};${t.levels[0]}"/></rect>`;
  });

  // snake: segment i trails the head by i*STEP; it appears once the snake has grown to length i+1
  const len = Math.min(MAX_LEN, START_LEN + eaten);
  let snake = "";
  for (let i = len - 1; i >= 0; i--) {
    const begin = i * STEP;
    const growAt = i < START_LEN ? 0 : eatIdx[i - START_LEN] * STEP; // global time head eats the cell that adds it
    const appear = Math.max(growAt, begin);
    const local = f(appear - begin);
    const kShow = Math.min(local / T, 0.999);
    const kEnd = Math.min(run / T, 0.999);
    const frac = len > 1 ? i / (len - 1) : 0;
    const r = i === 0 ? 7.2 : 6.2 - frac * 2.6;
    const color = i === 0 ? t.head : mix(t.bodyFrom, t.bodyTo, frac);
    const body =
      i === 0
        ? `<circle r="${r}" fill="${color}"/>` +
          `<circle cx="2.6" cy="-3.2" r="1.7" fill="#fff"/><circle cx="2.6" cy="3.2" r="1.7" fill="#fff"/>` +
          `<circle cx="3.1" cy="-3.2" r="0.8" fill="#111"/><circle cx="3.1" cy="3.2" r="0.8" fill="#111"/>` +
          `<path d="M7,0 L11,-1.6 M7,0 L11,1.6" stroke="#ff3d3d" stroke-width="1.2" stroke-linecap="round"/>`
        : `<circle r="${f(r)}" fill="${color}"/>`;
    snake +=
      `<g opacity="0">${body}` +
      `<animate attributeName="opacity" dur="${f(T)}s" begin="${f(begin)}s" repeatCount="indefinite" calcMode="discrete" ` +
      `keyTimes="0;${f(kShow)};${f(kEnd)};1" values="0;1;0;0"/>` +
      `<animateMotion dur="${f(run)}s" begin="${f(begin)}s" repeatCount="indefinite" rotate="auto" path="${pathD}" ` +
      `calcMode="linear"/></g>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>${cells}${snake}</svg>`
  );
}

function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, bl] = p(a).map((v, i) => Math.round(v + (p(b)[i] - v) * k));
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
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
