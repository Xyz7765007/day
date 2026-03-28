const BLOB_NAME = 'vox-tracker-data.json';
const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29');
const TARGET_REV = 8000000;

async function getData() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_NAME}&limit=1`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const list = await r.json();
    if (!list.blobs || !list.blobs.length) return null;
    const dr = await fetch(list.blobs[0].url);
    return await dr.json();
  } catch (e) { return null; }
}

function getPhase(d) {
  if (d < 14) return { n: '01', name: 'FOUNDATION', f: 'Entity / Warming / Outreach / Case study' };
  if (d < 28) return { n: '02', name: 'OUTBOUND', f: 'Cold sequences / LinkedIn / Discovery calls' };
  if (d < 56) return { n: '03', name: 'PIPELINE', f: 'Full outbound / Proposals / Close deals' };
  if (d < 120) return { n: '04', name: 'REVENUE', f: 'Deliver / Expand / Retainer upsells' };
  return { n: '05', name: 'SCALE', f: 'Referrals / Raise rates / Build team' };
}

function getSched(dow) {
  if (dow === 0) return [
    ['10:00', 'Light planning + inbox zero', '#888'],
    ['11:00', 'Smaeccan advisory (1hr)', '#ffaa00'],
    ['12:00', 'Relationship texting', '#ff6b6b'],
    ['14:00', 'Rest / dogs / recharge', '#444'],
    ['18:00', 'Prep Monday - 3 priorities', '#00ff88'],
  ];
  if (dow === 6) return [
    ['09:00', 'Weekly metrics review', '#ffaa00'],
    ['10:00', 'Plan next week outreach', '#00ff88'],
    ['12:00', 'Case study + website', '#c084fc'],
    ['14:00', 'Pipeline cleanup', '#5BA0D6'],
    ['16:00', 'Content batch - LinkedIn', '#c084fc'],
    ['18:00', 'Free evening', '#444'],
  ];
  return [
    ['07:00', 'Pipeline review + responses', '#888'],
    ['08:00', 'LinkedIn - 20 connects', '#5BA0D6'],
    ['09:00', 'Cold email sequences', '#00ff88'],
    ['10:00', 'Side Kick deliverables', '#ffaa00'],
    ['13:00', 'Keto lunch + break', '#444'],
    ['14:00', 'Voxelised build + deliver', '#00ff88'],
    ['16:00', 'Follow-ups / proposals / calls', '#ff6b6b'],
    ['17:00', 'Case study / Loom / content', '#c084fc'],
    ['19:00', 'Evening review + plan tmrw', '#888'],
  ];
}

const QUOTES = [
  "The 80L car is earned in the DMs.",
  "One signed retainer changes everything.",
  "Revenue cures all anxiety.",
  "Every follow-up is a lottery ticket.",
  "Build free. Get paid. Repeat.",
  "Show up. Ship. Follow up.",
  "Outreach today. Invoice tomorrow.",
  "No one is coming to save you. Go.",
  "80 lakhs. 8 months. No shortcuts.",
  "You are one pitch away.",
  "The grind IS the shortcut.",
  "Pipeline is the product.",
];

function fmtINR(n) {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return '₹' + (n / 1e3).toFixed(0) + 'K';
  return '₹' + n;
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export default async function handler(req, res) {
  const w = parseInt(req.query.width || req.query.w) || 1170;
  const h = parseInt(req.query.height || req.query.h) || 2532;

  let st = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '' };
  const blobData = await getData();
  if (blobData) st = { ...st, ...blobData };

  const { rev, clients, pipeline, leads, msg } = st;
  const now = new Date();
  const daysSince = Math.max(0, Math.floor((now - START_DATE) / 864e5));
  const daysLeft = Math.max(0, Math.floor((TARGET_DATE - now) / 864e5));
  const totalDays = Math.floor((TARGET_DATE - START_DATE) / 864e5);
  const pctTime = Math.round(daysSince / totalDays * 100);
  const pctRev = Math.min(100, Math.round(rev / TARGET_REV * 100));
  const phase = getPhase(daysSince);
  const dow = now.getDay();
  const dn = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const mn = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const sched = getSched(dow);
  const quote = msg || QUOTES[daysSince % QUOTES.length];
  const weekNum = Math.floor(daysSince / 7) + 1;
  const p = (n) => Math.round(n * w / 1170);

  // Schedule items SVG
  const schedY = p(830);
  const schedItems = sched.map((s, i) => {
    const y = schedY + i * p(48);
    return `
      <text x="${p(60)}" y="${y}" fill="#333" font-family="monospace" font-size="${p(13)}">${s[0]}</text>
      <circle cx="${p(120)}" cy="${y - p(4)}" r="${p(3)}" fill="${s[2]}"/>
      <text x="${p(135)}" y="${y}" fill="#aaa" font-size="${p(15)}">${esc(s[1])}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#000"/>
  <style>text { font-family: -apple-system, 'Helvetica Neue', sans-serif; }</style>

  <!-- DAYS LEFT -->
  <text x="${p(60)}" y="${p(380)}" fill="#00ff88" font-size="${p(72)}" font-weight="800">${daysLeft}</text>
  <text x="${p(60) + p(72) * String(daysLeft).length * 0.6}" y="${p(380)}" fill="#555" font-size="${p(18)}" letter-spacing="${p(3)}"> DAYS LEFT</text>

  <!-- DATE -->
  <text x="${w - p(60)}" y="${p(355)}" fill="#444" font-size="${p(13)}" text-anchor="end" letter-spacing="${p(2)}">WK ${weekNum}</text>
  <text x="${w - p(60)}" y="${p(380)}" fill="#666" font-size="${p(16)}" text-anchor="end">${dn[dow]} · ${mn[now.getMonth()]} ${now.getDate()}</text>

  <!-- TIME BAR -->
  <rect x="${p(60)}" y="${p(405)}" width="${w - p(120)}" height="${p(3)}" rx="${p(2)}" fill="#1a1a1a"/>
  <rect x="${p(60)}" y="${p(405)}" width="${Math.round((w - p(120)) * pctTime / 100)}" height="${p(3)}" rx="${p(2)}" fill="#333"/>

  <!-- REVENUE LABEL -->
  <text x="${p(60)}" y="${p(460)}" fill="#555" font-size="${p(12)}" letter-spacing="${p(2)}">REVENUE</text>
  <text x="${w - p(60)}" y="${p(460)}" fill="#555" font-size="${p(12)}" text-anchor="end">${esc(fmtINR(rev))} / ₹80L</text>

  <!-- REVENUE BAR -->
  <rect x="${p(60)}" y="${p(475)}" width="${w - p(120)}" height="${p(20)}" rx="${p(10)}" fill="#111"/>
  <rect x="${p(60)}" y="${p(475)}" width="${Math.max(p(10), Math.round((w - p(120)) * pctRev / 100))}" height="${p(20)}" rx="${p(10)}" fill="${pctRev > 0 ? '#00ff88' : '#111'}"/>
  ${pctRev >= 8 ? `<text x="${p(60) + Math.round((w - p(120)) * pctRev / 200)}" y="${p(490)}" fill="#000" font-size="${p(10)}" font-weight="700" text-anchor="middle">${pctRev}%</text>` : ''}

  <!-- CLIENTS/LEADS -->
  <text x="${p(60)}" y="${p(515)}" fill="#333" font-size="${p(11)}">${clients} clients · ${leads} leads</text>
  ${pipeline > 0 ? `<text x="${w - p(60)}" y="${p(515)}" fill="#ffaa00" font-size="${p(11)}" text-anchor="end">${esc(fmtINR(pipeline))} pipeline</text>` : ''}

  <!-- PHASE BOX -->
  <rect x="${p(60)}" y="${p(545)}" width="${w - p(120)}" height="${p(65)}" rx="${p(10)}" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="1"/>
  <text x="${p(80)}" y="${p(575)}" fill="#00ff88" font-size="${p(10)}" letter-spacing="${p(3)}">PHASE ${phase.n}</text>
  <text x="${p(80) + p(90)}" y="${p(575)}" fill="#fff" font-size="${p(14)}" font-weight="700">${esc(phase.name)}</text>
  <text x="${p(80)}" y="${p(598)}" fill="#555" font-size="${p(11)}">${esc(phase.f)}</text>

  <!-- SCHEDULE HEADER -->
  <text x="${p(60)}" y="${p(660)}" fill="#333" font-size="${p(10)}" letter-spacing="${p(3)}">TODAY</text>

  <!-- SCHEDULE ITEMS -->
  ${sched.map((s, i) => {
    const y = p(700) + i * p(44);
    return `<text x="${p(60)}" y="${y}" fill="#333" font-family="monospace" font-size="${p(13)}">${s[0]}</text>
    <circle cx="${p(118)}" cy="${y - p(4)}" r="${p(3)}" fill="${s[2]}"/>
    <text x="${p(132)}" y="${y}" fill="#aaa" font-size="${p(14)}">${esc(s[1])}</text>`;
  }).join('\n  ')}

  <!-- BOTTOM STATS -->
  <line x1="${p(60)}" y1="${h - p(280)}" x2="${w - p(60)}" y2="${h - p(280)}" stroke="#111" stroke-width="1"/>

  <text x="${p(60)}" y="${h - p(240)}" fill="#fff" font-size="${p(22)}" font-weight="700">${esc(fmtINR(Math.round(TARGET_REV / totalDays * daysSince)))}</text>
  <text x="${p(60)}" y="${h - p(218)}" fill="#444" font-size="${p(9)}" letter-spacing="${p(2)}">TARGET PACE</text>

  <text x="${w / 2}" y="${h - p(240)}" fill="${rev > 0 ? '#00ff88' : '#333'}" font-size="${p(22)}" font-weight="700" text-anchor="middle">${esc(fmtINR(rev))}</text>
  <text x="${w / 2}" y="${h - p(218)}" fill="#444" font-size="${p(9)}" text-anchor="middle" letter-spacing="${p(2)}">EARNED</text>

  <text x="${w - p(60)}" y="${h - p(240)}" fill="#ffaa00" font-size="${p(22)}" font-weight="700" text-anchor="end">${esc(fmtINR(Math.max(0, TARGET_REV - rev)))}</text>
  <text x="${w - p(60)}" y="${h - p(218)}" fill="#444" font-size="${p(9)}" text-anchor="end" letter-spacing="${p(2)}">TO GO</text>

  <!-- QUOTE -->
  <text x="${w / 2}" y="${h - p(170)}" fill="#333" font-size="${p(12)}" font-style="italic" text-anchor="middle">${esc(quote)}</text>

</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(svg);
}
