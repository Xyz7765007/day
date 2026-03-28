const sharp = require('sharp');

// satori is ESM-only, use dynamic import
let satoriModule = null;
async function getSatori() {
  if (!satoriModule) satoriModule = (await import('satori')).default;
  return satoriModule;
}

const BLOB_FILE = 'vox-tracker.json';
const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29');
const TARGET_REV = 8000000;

// Cache font in memory across invocations
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff');
  fontCache = await res.arrayBuffer();
  return fontCache;
}

let fontBoldCache = null;
async function getFontBold() {
  if (fontBoldCache) return fontBoldCache;
  const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff');
  fontBoldCache = await res.arrayBuffer();
  return fontBoldCache;
}

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
    { t: '10:00', l: 'Light planning + inbox', c: '#888' },
    { t: '11:00', l: 'Smaeccan advisory', c: '#ffaa00' },
    { t: '12:00', l: 'Relationship texting', c: '#ff6b6b' },
    { t: '14:00', l: 'Rest / dogs / recharge', c: '#444' },
    { t: '18:00', l: 'Prep Monday', c: '#00ff88' },
  ];
  if (dow === 6) return [
    { t: '09:00', l: 'Weekly metrics review', c: '#ffaa00' },
    { t: '10:00', l: 'Plan next week', c: '#00ff88' },
    { t: '12:00', l: 'Case study + website', c: '#c084fc' },
    { t: '14:00', l: 'Pipeline cleanup', c: '#5BA0D6' },
    { t: '16:00', l: 'Content batch', c: '#c084fc' },
    { t: '18:00', l: 'Free evening', c: '#444' },
  ];
  return [
    { t: '07:00', l: 'Pipeline review', c: '#888' },
    { t: '08:00', l: 'LinkedIn outreach', c: '#5BA0D6' },
    { t: '09:00', l: 'Cold email sequences', c: '#00ff88' },
    { t: '10:00', l: 'Side Kick work', c: '#ffaa00' },
    { t: '13:00', l: 'Keto lunch + break', c: '#444' },
    { t: '14:00', l: 'Voxelised build', c: '#00ff88' },
    { t: '16:00', l: 'Follow-ups / calls', c: '#ff6b6b' },
    { t: '17:00', l: 'Case study / Loom', c: '#c084fc' },
    { t: '19:00', l: 'Evening review', c: '#888' },
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
  "No one is coming to save you.",
  "80 lakhs. 8 months. No shortcuts.",
  "You are one pitch away.",
  "The grind IS the shortcut.",
  "Pipeline is the product.",
];

function fmtINR(n) {
  if (n >= 1e7) return 'Rs.' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return 'Rs.' + (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return 'Rs.' + (n / 1e3).toFixed(0) + 'K';
  return 'Rs.' + n;
}

// Helper to build satori elements (React-like objects)
function h(type, props, ...children) {
  const flatChildren = children.flat().filter(c => c != null && c !== false);
  return { type, props: { ...props, children: flatChildren.length === 1 ? flatChildren[0] : flatChildren.length > 0 ? flatChildren : undefined } };
}

module.exports = async function handler(req, res) {
  const w = parseInt(req.query.width || req.query.w) || 1170;
  const hh = parseInt(req.query.height || req.query.h) || 2532;

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

  const [font, fontBold] = await Promise.all([getFont(), getFontBold()]);

  // Build the layout using satori h() elements
  const element = h('div', {
    style: {
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: '#000', color: '#fff', fontFamily: 'Inter',
      padding: '420px 72px 160px',
    }
  },
    // Days left + date row
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' } },
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px' } },
        h('span', { style: { fontSize: '140px', fontWeight: 700, color: '#00ff88', lineHeight: 1 } }, String(dLeft)),
        h('span', { style: { fontSize: '32px', color: '#666', letterSpacing: '4px' } }, 'DAYS LEFT'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
        h('span', { style: { fontSize: '22px', color: '#555', letterSpacing: '3px' } }, `WEEK ${wk}`),
        h('span', { style: { fontSize: '28px', color: '#888' } }, `${dn[dow]}  ${mn[now.getMonth()]} ${now.getDate()}`),
      ),
    ),

    // Time progress bar
    h('div', { style: { display: 'flex', height: '6px', background: '#1a1a1a', borderRadius: '3px', marginBottom: '36px', overflow: 'hidden', width: '100%' } },
      h('div', { style: { display: 'flex', width: `${pctT}%`, height: '100%', background: '#444', borderRadius: '3px' } }),
    ),

    // Revenue label
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
      h('span', { style: { fontSize: '24px', color: '#666', letterSpacing: '4px' } }, 'REVENUE'),
      h('span', { style: { fontSize: '24px', color: '#666' } }, `${fmtINR(rev)} / Rs.80L`),
    ),

    // Revenue bar
    h('div', { style: { display: 'flex', height: '36px', background: '#111', borderRadius: '18px', marginBottom: '10px', overflow: 'hidden', width: '100%' } },
      h('div', { style: { display: 'flex', width: `${Math.max(pctR, 2)}%`, height: '100%', background: pctR > 0 ? '#00ff88' : '#111', borderRadius: '18px', alignItems: 'center', justifyContent: 'center' } },
        pctR >= 8 ? h('span', { style: { fontSize: '18px', fontWeight: 700, color: '#000' } }, `${pctR}%`) : null,
      ),
    ),

    // Sub info
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px' } },
      h('span', { style: { fontSize: '22px', color: '#444' } }, `${clients} clients  |  ${leads} leads`),
      pipeline > 0 ? h('span', { style: { fontSize: '22px', color: '#ffaa00' } }, `${fmtINR(pipeline)} pipeline`) : null,
    ),

    // Phase box
    h('div', { style: { display: 'flex', flexDirection: 'column', background: '#0a0a0a', borderRadius: '16px', padding: '20px 28px', marginBottom: '36px', border: '1px solid #1a1a1a' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' } },
        h('span', { style: { fontSize: '20px', color: '#00ff88', letterSpacing: '5px' } }, `PHASE ${phase.n}`),
        h('span', { style: { fontSize: '28px', fontWeight: 700, color: '#fff' } }, phase.name),
      ),
      h('span', { style: { fontSize: '22px', color: '#666' } }, phase.f),
    ),

    // TODAY label
    h('span', { style: { fontSize: '20px', color: '#444', letterSpacing: '5px', marginBottom: '18px' } }, 'TODAY'),

    // Schedule items
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' } },
      ...sched.map(item =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 0' } },
          h('span', { style: { fontSize: '24px', color: '#555', minWidth: '100px', fontFamily: 'Inter' } }, item.t),
          h('div', { style: { display: 'flex', width: '10px', height: '10px', borderRadius: '5px', background: item.c } }),
          h('span', { style: { fontSize: '26px', color: '#ccc' } }, item.l),
        )
      ),
    ),

    // Bottom divider
    h('div', { style: { display: 'flex', height: '1px', background: '#1a1a1a', marginTop: '20px', marginBottom: '20px', width: '100%' } }),

    // Stats row
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' } },
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { fontSize: '40px', fontWeight: 700, color: '#fff' } }, fmtINR(Math.round(TARGET_REV / tDays * dSince))),
        h('span', { style: { fontSize: '16px', color: '#555', letterSpacing: '3px' } }, 'TARGET PACE'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        h('span', { style: { fontSize: '40px', fontWeight: 700, color: rev > 0 ? '#00ff88' : '#444' } }, fmtINR(rev)),
        h('span', { style: { fontSize: '16px', color: '#555', letterSpacing: '3px' } }, 'EARNED'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
        h('span', { style: { fontSize: '40px', fontWeight: 700, color: '#ffaa00' } }, fmtINR(Math.max(0, TARGET_REV - rev))),
        h('span', { style: { fontSize: '16px', color: '#555', letterSpacing: '3px' } }, 'TO GO'),
      ),
    ),

    // Quote
    h('div', { style: { display: 'flex', justifyContent: 'center' } },
      h('span', { style: { fontSize: '22px', color: '#444', fontStyle: 'italic', textAlign: 'center' } }, quote),
    ),
  );

  try {
    const satori = await getSatori();
    const svg = await satori(element, {
      width: w,
      height: hh,
      fonts: [
        { name: 'Inter', data: font, weight: 400, style: 'normal' },
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
      ],
    });

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack?.slice(0, 500) });
  }
};
