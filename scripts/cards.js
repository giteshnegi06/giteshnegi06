// Generates animated SVG project cards into assets/cards/.  Usage: node scripts/cards.js
const fs = require("fs");
const all = [
  ["ANGC Infra", "Plot sales, broker network & CRM", ["React", "Vite", "Tailwind", "Framer Motion"], "#00f7ff", "#7b61ff"],
  ["GSIPL Group", "Real estate sales & CRM dashboard", ["React", "CRM", "REST API"], "#ff9f43", "#ff3cac"],
  ["Brokrs House", "Property discovery web & app", ["React", "Tailwind", "Admin Panel"], "#39d353", "#00f7ff"],
  ["Desi Fasal", "Smart farming & investment platform", ["React", "Responsive UI"], "#a3e635", "#16a34a"],
  ["ANGC Synapse", "Software, AI & cloud solutions", ["React", "AI Solutions"], "#7b61ff", "#00f7ff"],
  ["Saffroom", "Premium mushroom & saffron brand", ["React", "Product Showcase"], "#ff5e7e", "#ffb347"],
  ["The Brokrs", "Growth & lead-generation platform", ["React", "Lead Gen"], "#00f7ff", "#39d353"],
  ["Shyam Jagat", "Organisation website", ["Next.js", "Tailwind", "Vercel"], "#ffd166", "#ef476f"],
  ["Click Card", "Social media linking cards", ["Next.js", "Dashboard", "Vercel"], "#ff3cac", "#7b61ff"],
  ["Cafe Website", "Menu + QR ordering system", ["React", "Vite", "QR Ordering"], "#ffb347", "#ff5e7e"],
  ["Barber Website", "Service discovery & booking flow", ["React", "Framer Motion"], "#4cc9f0", "#7b61ff"],
];
// shown cards, in order (1-based indexes into the list above)
const projects = [9, 8, 1, 2, 10, 11].map((n) => all[n - 1]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
fs.rmSync("assets/cards", { recursive: true, force: true });
fs.mkdirSync("assets/cards", { recursive: true });
projects.forEach(([title, kind, tags, c1, c2], i) => {
  const n = String(i + 1).padStart(2, "0");
  let x = 28;
  const chips = tags
    .map((t) => {
      const w = t.length * 7.4 + 22;
      const g = `<g transform="translate(${x},118)"><rect width="${w}" height="24" rx="12" fill="${c1}" fill-opacity="0.14" stroke="${c1}" stroke-opacity="0.55"/><text x="${w / 2}" y="16" text-anchor="middle" font-size="11.5" fill="${c1}">${esc(t)}</text></g>`;
      x += w + 8;
      return g;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="170" viewBox="0 0 420 170" font-family="'Segoe UI',Helvetica,Arial,sans-serif">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1117"/><stop offset="1" stop-color="#161b28"/></linearGradient>
<linearGradient id="ac" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="gl"><stop offset="0" stop-color="${c1}" stop-opacity="0.45"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
<clipPath id="cp"><rect width="420" height="170" rx="16"/></clipPath>
</defs>
<g clip-path="url(#cp)">
<rect width="420" height="170" fill="url(#bg)"/>
<circle cx="360" cy="30" r="90" fill="url(#gl)"><animate attributeName="cx" values="340;390;340" dur="6s" repeatCount="indefinite"/><animate attributeName="r" values="80;105;80" dur="6s" repeatCount="indefinite"/></circle>
<circle cx="40" cy="170" r="70" fill="${c2}" fill-opacity="0.12"><animate attributeName="cy" values="170;150;170" dur="7s" repeatCount="indefinite"/></circle>
<text x="392" y="64" text-anchor="end" font-size="64" font-weight="800" fill="${c1}" fill-opacity="0.13">${n}</text>
<rect width="420" height="4" fill="url(#ac)"/>
<text x="28" y="52" font-size="25" font-weight="700" fill="#f0f6fc">${esc(title)}</text>
<text x="28" y="82" font-size="13.5" fill="#9aa7b8">${esc(kind)}</text>
${chips}
<g transform="translate(28,150)"><text font-size="12" font-weight="600" fill="url(#ac)">LIVE  ↗</text></g>
<rect x="0.75" y="0.75" width="418.5" height="168.5" rx="15.5" fill="none" stroke="url(#ac)" stroke-opacity="0.45" stroke-width="1.5"/>
</g></svg>`;
  fs.writeFileSync(`assets/cards/${n}.svg`, svg);
});
console.log("wrote", projects.length, "cards");
