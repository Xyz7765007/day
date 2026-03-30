const sharp = require('sharp');

let satoriModule = null;
async function getSatori() {
  if (!satoriModule) satoriModule = (await import('satori')).default;
  return satoriModule;
}

let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  const r = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff');
  fontCache = await r.arrayBuffer();
  return fontCache;
}
let fontBoldCache = null;
async function getFontBold() {
  if (fontBoldCache) return fontBoldCache;
  const r = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff');
  fontBoldCache = await r.arrayBuffer();
  return fontBoldCache;
}

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appZZ70GXx8dSYEbA';
const TABLE = 'Tracker';
const AT_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
const STREAM_KEYS = ['stream_sidekick','stream_voxelised','stream_smaeccan','stream_parvani','stream_d2c','stream_polymarket'];

const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29');
const TARGET_REV = 8000000;

async function getData(token) {
  if (!token) return null;
  try {
    const r = await fetch(`${AT_URL}?filterByFormula={key}="main"&maxRecords=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.records || !data.records.length) return null;
    const f = data.records[0].fields;
    return {
      rev: parseInt(f.rev) || 0,
      clients: parseInt(f.clients) || 0,
      pipeline: parseInt(f.pipeline) || 0,
      leads: parseInt(f.leads) || 0,
      msg: f.msg || '',
    };
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
    { t: '10:00', l: 'Light planning', c: '#888' },
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
    { t: '10:00', l: 'Job work', c: '#ffaa00' },
    { t: '13:00', l: 'Keto lunch + break', c: '#444' },
    { t: '14:00', l: 'Personal Time', c: '#00ff88' },
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

function h(type, props, ...children) {
  const flat = children.flat().filter(c => c != null && c !== false);
  return { type, props: { ...props, children: flat.length === 1 ? flat[0] : flat.length > 0 ? flat : undefined } };
}

module.exports = async function handler(req, res) {
  const W = 1080, H = 1080;

  const token = process.env.AIRTABLE_TOKEN;
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
  const dayNum = dSince + 1;
  const targetPace = Math.round(TARGET_REV / tDays * dSince);

  const [font, fontBold] = await Promise.all([getFont(), getFontBold()]);

  const element = h('div', {
    style: {
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: '#000', color: '#fff', fontFamily: 'Inter',
      padding: '12px 52px 20px',
    }
  },
    // Green accent top
    h('div', { style: { display: 'flex', width: '100%', height: '3px', background: '#00ff88', position: 'absolute', top: 0, left: 0 } }),

    // Title
    h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '6px', marginTop: '8px' } },
      h('span', { style: { fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '1px' } },
        `0 → 80L  |  DAY ${dayNum} OF ${tDays}`
      ),
    ),
    h('div', { style: { display: 'flex', height: '1px', background: '#1a1a1a', width: '100%', marginBottom: '14px' } }),

    // Days left row
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' } },
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } },
        h('span', { style: { fontSize: '80px', fontWeight: 700, color: '#00ff88', lineHeight: 1 } }, String(dLeft)),
        h('span', { style: { fontSize: '20px', color: '#555', letterSpacing: '3px' } }, 'DAYS LEFT'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
        h('span', { style: { fontSize: '14px', color: '#444', letterSpacing: '2px' } }, `WEEK ${wk}`),
        h('span', { style: { fontSize: '18px', color: '#888' } }, `${dn[dow]} ${mn[now.getMonth()]} ${now.getDate()}`),
      ),
    ),

    // Time bar
    h('div', { style: { display: 'flex', height: '4px', background: '#1a1a1a', borderRadius: '2px', marginBottom: '14px', overflow: 'hidden', width: '100%' } },
      h('div', { style: { display: 'flex', width: `${Math.max(pctT, 1)}%`, height: '100%', background: '#444' } }),
    ),

    // Revenue label
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } },
      h('span', { style: { fontSize: '14px', color: '#555', letterSpacing: '3px' } }, 'REVENUE'),
      h('span', { style: { fontSize: '14px', color: '#555' } }, `${fmtINR(rev)} / Rs.80L`),
    ),

    // Revenue bar
    h('div', { style: { display: 'flex', height: '20px', background: '#111', borderRadius: '10px', marginBottom: '6px', overflow: 'hidden', width: '100%' } },
      h('div', { style: { display: 'flex', width: `${Math.max(pctR, 1)}%`, height: '100%', background: pctR > 0 ? '#00ff88' : '#111', borderRadius: '10px' } }),
    ),

    // Sub info
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '14px' } },
      h('span', { style: { fontSize: '14px', color: '#444' } }, `${clients} clients  |  ${leads} leads`),
      pipeline > 0 ? h('span', { style: { fontSize: '14px', color: '#ffaa00' } }, `${fmtINR(pipeline)} pipeline`) : null,
    ),

    // Phase box
    h('div', { style: { display: 'flex', flexDirection: 'column', background: '#0a0a0a', borderRadius: '10px', padding: '12px 18px', marginBottom: '14px', border: '1px solid #1a1a1a' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' } },
        h('span', { style: { fontSize: '12px', color: '#00ff88', letterSpacing: '4px' } }, `PHASE ${phase.n}`),
        h('span', { style: { fontSize: '18px', fontWeight: 700, color: '#fff' } }, phase.name),
      ),
      h('span', { style: { fontSize: '13px', color: '#555' } }, phase.f),
    ),

    // TODAY
    h('span', { style: { fontSize: '12px', color: '#444', letterSpacing: '4px', marginBottom: '8px' } }, 'TODAY'),

    // Schedule
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '14px' } },
      ...sched.map(item =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' } },
          h('span', { style: { fontSize: '15px', color: '#444', minWidth: '55px' } }, item.t),
          h('div', { style: { display: 'flex', width: '8px', height: '8px', borderRadius: '4px', background: item.c } }),
          h('span', { style: { fontSize: '16px', color: '#ccc' } }, item.l),
        )
      ),
    ),

    // Divider
    h('div', { style: { display: 'flex', height: '1px', background: '#1a1a1a', width: '100%', marginBottom: '14px' } }),

    // Stats row
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
      h('div', { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { fontSize: '26px', fontWeight: 700, color: '#fff' } }, fmtINR(targetPace)),
        h('span', { style: { fontSize: '10px', color: '#444', letterSpacing: '2px' } }, 'TARGET PACE'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        h('span', { style: { fontSize: '26px', fontWeight: 700, color: rev > 0 ? '#00ff88' : '#444' } }, fmtINR(rev)),
        h('span', { style: { fontSize: '10px', color: '#444', letterSpacing: '2px' } }, 'EARNED'),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
        h('span', { style: { fontSize: '26px', fontWeight: 700, color: '#ffaa00' } }, fmtINR(Math.max(0, TARGET_REV - rev))),
        h('span', { style: { fontSize: '10px', color: '#444', letterSpacing: '2px' } }, 'TO GO'),
      ),
    ),

    // Quote
    h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '6px' } },
      h('span', { style: { fontSize: '14px', color: '#333', fontStyle: 'italic' } }, quote),
    ),

    // Handle
    h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
      h('span', { style: { fontSize: '11px', color: '#1a1a1a' } }, '@samarthbuilds'),
    ),
  );

  try {
    const satori = await getSatori();
    const svg = await satori(element, {
      width: W, height: H,
      fonts: [
        { name: 'Inter', data: font, weight: 400, style: 'normal' },
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
      ],
    });
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Content-Disposition', `inline; filename="0to80L-Day${dayNum}.png"`);
    res.status(200).send(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
