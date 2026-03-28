const sharp = require('sharp');

const BLOB_FILE = 'vox-tracker.json';
const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29');
const TARGET_REV = 8000000;

async function getData(token) {
  if (!token) return null;
  try {
    const r = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_FILE}&limit=1`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const list = await r.json();
    if (!list.blobs || !list.blobs.length) return null;
    const dr = await fetch(list.blobs[0].url);
    return await dr.json();
  } catch (e) { return null; }
}

function getPhase(d) {
  if (d < 14) return { n: '01', name: 'FOUNDATION', f: 'Entity / Warming / Outreach' };
  if (d < 28) return { n: '02', name: 'OUTBOUND', f: 'Cold sequences / LinkedIn / Calls' };
  if (d < 56) return { n: '03', name: 'PIPELINE', f: 'Full outbound / Proposals / Close' };
  if (d < 120) return { n: '04', name: 'REVENUE', f: 'Deliver / Expand / Upsells' };
  return { n: '05', name: 'SCALE', f: 'Referrals / Rates / Team' };
}

function getSched(dow) {
  if (dow === 0) return [
    ['10:00', 'Light planning + inbox zero', '#888'],
    ['11:00', 'Smaeccan advisory', '#ffaa00'],
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
    ['07:00', 'Pipeline review', '#888'],
    ['08:00', 'LinkedIn - 20 connects', '#5BA0D6'],
    ['09:00', 'Cold email sequences', '#00ff88'],
    ['10:00', 'Side Kick deliverables', '#ffaa00'],
    ['13:00', 'Keto lunch + break', '#444'],
    ['14:00', 'Voxelised build + deliver', '#00ff88'],
    ['16:00', 'Follow-ups / calls', '#ff6b6b'],
    ['17:00', 'Case study / Loom', '#c084fc'],
    ['19:00', 'Evening review', '#888'],
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
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}

function e(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;'); }

module.exports = async function handler(req, res) {
  const w = parseInt(req.query.width || req.query.w) || 1170;
  const h = parseInt(req.query.height || req.query.h) || 2532;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  let st = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '' };
  const bd = await getData(token);
  if (bd) st = { ...st, ...bd };

  const { rev, clients, pipeline, leads, msg } = st;
  const now = new Date();
  const dSince = Math.max(0, Math.floor((now - START_DATE) / 864e5));
  const dLeft = Math.max(0, Math.floor((TARGET_DATE - now) / 864e5));
  const tDays = Math.floor((TARGET_DATE - START_DATE) / 864e5);
  const pctT = Math.round(dSince / tDays * 100);
  const pctR = Math.min(100, Math.round(rev / TARGET_REV * 100));
  const phase = getPhase(dSince);
  const dow = now.getDay();
  const dn = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const mn = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const sched = getSched(dow);
  const quote = msg || QUOTES[dSince % QUOTES.length];
  const wk = Math.floor(dSince / 7) + 1;

  // All sizes scaled to width. Base design at 1170.
  const s = (n) => Math.round(n * w / 1170);

  const topPad = s(420); // Below clock area
  const lx = s(80);     // Left margin
  const rx = w - s(80);  // Right edge

  // Build schedule lines
  const schedSVG = sched.map((item, i) => {
    const y = topPad + s(520) + i * s(70);
    return `
      <text x="${lx}" y="${y}" fill="#555" font-family="'Courier New',monospace" font-size="${s(24)}" font-weight="500">${item[0]}</text>
      <circle cx="${lx + s(130)}" cy="${y - s(7)}" r="${s(6)}" fill="${item[2]}"/>
      <text x="${lx + s(155)}" y="${y}" fill="#ccc" font-family="sans-serif" font-size="${s(26)}">${e(item[1])}</text>`;
  }).join('');

  const revBarW = rx - lx;
  const revFill = Math.max(s(4), Math.round(revBarW * pctR / 100));
  const timeBarFill = Math.round(revBarW * pctT / 100);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#000"/>

  <!-- DAYS LEFT -->
  <text x="${lx}" y="${topPad}" fill="#00ff88" font-family="sans-serif" font-size="${s(120)}" font-weight="800">${dLeft}</text>
  <text x="${lx + s(120) * String(dLeft).length * 0.55}" y="${topPad}" fill="#666" font-family="sans-serif" font-size="${s(30)}" letter-spacing="${s(4)}"> DAYS LEFT</text>

  <!-- WEEK + DATE -->
  <text x="${rx}" y="${topPad - s(35)}" fill="#555" font-family="sans-serif" font-size="${s(22)}" text-anchor="end" letter-spacing="${s(3)}">WEEK ${wk}</text>
  <text x="${rx}" y="${topPad}" fill="#888" font-family="sans-serif" font-size="${s(28)}" text-anchor="end">${dn[dow]}  ${mn[now.getMonth()]} ${now.getDate()}</text>

  <!-- TIME BAR -->
  <rect x="${lx}" y="${topPad + s(30)}" width="${revBarW}" height="${s(6)}" rx="${s(3)}" fill="#1a1a1a"/>
  <rect x="${lx}" y="${topPad + s(30)}" width="${timeBarFill}" height="${s(6)}" rx="${s(3)}" fill="#444"/>

  <!-- REVENUE LABEL -->
  <text x="${lx}" y="${topPad + s(100)}" fill="#666" font-family="sans-serif" font-size="${s(22)}" letter-spacing="${s(3)}">REVENUE</text>
  <text x="${rx}" y="${topPad + s(100)}" fill="#666" font-family="sans-serif" font-size="${s(22)}" text-anchor="end">${e('₹' + fmtINR(rev))} / ₹80L</text>

  <!-- REVENUE BAR -->
  <rect x="${lx}" y="${topPad + s(120)}" width="${revBarW}" height="${s(32)}" rx="${s(16)}" fill="#111"/>
  <rect x="${lx}" y="${topPad + s(120)}" width="${revFill}" height="${s(32)}" rx="${s(16)}" fill="${pctR > 0 ? '#00ff88' : '#111'}"/>
  ${pctR >= 8 ? `<text x="${lx + revFill / 2}" y="${topPad + s(142)}" fill="#000" font-family="sans-serif" font-size="${s(18)}" font-weight="700" text-anchor="middle">${pctR}%</text>` : ''}

  <!-- SUB INFO -->
  <text x="${lx}" y="${topPad + s(180)}" fill="#444" font-family="sans-serif" font-size="${s(20)}">${clients} clients · ${leads} leads</text>
  ${pipeline > 0 ? `<text x="${rx}" y="${topPad + s(180)}" fill="#ffaa00" font-family="sans-serif" font-size="${s(20)}" text-anchor="end">${e('₹' + fmtINR(pipeline))} pipeline</text>` : ''}

  <!-- PHASE BOX -->
  <rect x="${lx}" y="${topPad + s(220)}" width="${revBarW}" height="${s(100)}" rx="${s(14)}" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="1"/>
  <text x="${lx + s(24)}" y="${topPad + s(262)}" fill="#00ff88" font-family="sans-serif" font-size="${s(18)}" letter-spacing="${s(4)}">PHASE ${phase.n}</text>
  <text x="${lx + s(170)}" y="${topPad + s(262)}" fill="#fff" font-family="sans-serif" font-size="${s(26)}" font-weight="700">${e(phase.name)}</text>
  <text x="${lx + s(24)}" y="${topPad + s(298)}" fill="#666" font-family="sans-serif" font-size="${s(20)}">${e(phase.f)}</text>

  <!-- TODAY LABEL -->
  <text x="${lx}" y="${topPad + s(390)}" fill="#444" font-family="sans-serif" font-size="${s(18)}" letter-spacing="${s(4)}">TODAY</text>

  <!-- SCHEDULE -->
  ${sched.map((item, i) => {
    const y = topPad + s(440) + i * s(64);
    return `<text x="${lx}" y="${y}" fill="#555" font-family="'Courier New',monospace" font-size="${s(22)}">${item[0]}</text>
    <circle cx="${lx + s(120)}" cy="${y - s(6)}" r="${s(6)}" fill="${item[2]}"/>
    <text x="${lx + s(145)}" y="${y}" fill="#ccc" font-family="sans-serif" font-size="${s(24)}">${e(item[1])}</text>`;
  }).join('\n  ')}

  <!-- BOTTOM LINE -->
  <line x1="${lx}" y1="${h - s(340)}" x2="${rx}" y2="${h - s(340)}" stroke="#1a1a1a" stroke-width="1"/>

  <!-- STATS ROW -->
  <text x="${lx}" y="${h - s(280)}" fill="#fff" font-family="sans-serif" font-size="${s(36)}" font-weight="700">${e('₹' + fmtINR(Math.round(TARGET_REV / tDays * dSince)))}</text>
  <text x="${lx}" y="${h - s(246)}" fill="#555" font-family="sans-serif" font-size="${s(16)}" letter-spacing="${s(2)}">TARGET PACE</text>

  <text x="${w / 2}" y="${h - s(280)}" fill="${rev > 0 ? '#00ff88' : '#444'}" font-family="sans-serif" font-size="${s(36)}" font-weight="700" text-anchor="middle">${e('₹' + fmtINR(rev))}</text>
  <text x="${w / 2}" y="${h - s(246)}" fill="#555" font-family="sans-serif" font-size="${s(16)}" text-anchor="middle" letter-spacing="${s(2)}">EARNED</text>

  <text x="${rx}" y="${h - s(280)}" fill="#ffaa00" font-family="sans-serif" font-size="${s(36)}" font-weight="700" text-anchor="end">${e('₹' + fmtINR(Math.max(0, TARGET_REV - rev)))}</text>
  <text x="${rx}" y="${h - s(246)}" fill="#555" font-family="sans-serif" font-size="${s(16)}" text-anchor="end" letter-spacing="${s(2)}">TO GO</text>

  <!-- QUOTE -->
  <text x="${w / 2}" y="${h - s(180)}" fill="#444" font-family="sans-serif" font-size="${s(22)}" font-style="italic" text-anchor="middle">${e(quote)}</text>

</svg>`;

  try {
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(pngBuffer);
  } catch (err) {
    // Fallback: return SVG if sharp fails
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.status(200).send(svg);
  }
};
