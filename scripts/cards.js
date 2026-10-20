// Generates minimal SVG project cards into assets/cards/.  Usage: node scripts/cards.js
const fs = require("fs");
const projects = [
  ["Click Card", "Social media linking cards", "Next.js · Vercel", "#ff3cac", "https://clickcard-2.vercel.app/"],
  ["Shyam Jagat", "Organisation website", "Next.js · Tailwind", "#ffd166", "https://ssj-three.vercel.app/"],
  ["ANGC Infra", "Plots, brokers & CRM", "React · Vite · Tailwind", "#00f7ff", "https://www.angcinfra.com/"],
  ["GSIPL Group", "Real estate sales & CRM", "React · REST API", "#ff9f43", "https://gsiplgroup.com/"],
  ["Cafe Website", "Menu + QR ordering", "React · Vite", "#ffb347", "https://qr-ordering-sable.vercel.app/cafe-login"],
  ["Barber Website", "Service discovery & booking", "React · Framer Motion", "#4cc9f0", "https://www.sahilhairexpert.com/"],
];
fs.mkdirSync("assets/cards", { recursive: true });
projects.forEach(([title, kind, stack, c], i) => {
  const n = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  fs.writeFileSync(
    `assets/cards/${n}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="270" height="96" viewBox="0 0 270 96" font-family="'Segoe UI',Helvetica,Arial,sans-serif">
<rect x="0.5" y="0.5" width="269" height="95" rx="10" fill="#0d1117" stroke="#30363d"/>
<rect x="16" y="18" width="3" height="22" rx="1.5" fill="${c}"><animate attributeName="height" values="22;34;22" dur="3s" repeatCount="indefinite"/></rect>
<text x="28" y="35" font-size="16" font-weight="600" fill="#f0f6fc">${title}</text>
<text x="28" y="56" font-size="12" fill="#8b949e">${kind}</text>
<text x="28" y="78" font-size="11" fill="${c}">${stack}</text>
<text x="254" y="78" text-anchor="end" font-size="13" fill="#8b949e">↗</text>
</svg>`,
  );
});
console.log("wrote", projects.length, "cards");
