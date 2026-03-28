const satori = require('satori');
const { Resvg } = require('@resvg/resvg-js');

// ━━━ HELPER: createElement shorthand ━━━
const h = (type, style, ...children) => ({
  type, props: { style, children: children.length === 1 ? children[0] : children }
});

// ━━━ PLAN DATA ━━━
const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29T00:00:00');
const TARGET_REV = 8000000;

function getPhase(days) {
  if (days < 14) return { n: '01', name: 'FOUNDATION', w: 'WK 1-2', f: 'Entity setup · Email warming · Warm outreach · Case study #1' };
  if (days < 28) return { n: '02', name: 'OUTBOUND LAUNCH', w: 'WK 3-4', f: 'Cold sequences live · LinkedIn campaigns · Discovery calls' };
  if (days < 56) return { n: '03', name: 'PIPELINE BUILD', w: 'WK 5-8', f: 'Full outbound · Proposals out · Close first deals' };
  if (days < 120) return { n: '04', name: 'REVENUE', w: 'MO 3-4', f: 'Deliver & expand · Retainer upsells · 2nd case study' };
  return { n: '05', name: 'SCALE', w: 'MO 5-8', f: 'Referral flywheel · Raise rates · Build team' };
}

function getSchedule(dow) {
  const W = [
    { t: '07:00', l: 'Pipeline review + responses', c: '#888' },
    { t: '08:00', l: 'LinkedIn outreach — 20 connects', c: '#5BA0D6' },
    { t: '09:00', l: 'Cold email sequences', c: '#00ff88' },
    { t: '10:00', l: 'Side Kick — client work', c: '#ffaa00' },
    { t: '13:00', l: 'Keto lunch + break', c: '#333' },
    { t: '14:00', l: 'Voxelised — build & deliver', c: '#00ff88' },
    { t: '16:00', l: 'Follow-ups · proposals · calls', c: '#ff6b6b' },
    { t: '17:00', l: 'Case study / Loom / content', c: '#c084fc' },
    { t: '19:00', l: 'Evening review', c: '#555' },
  ];
  const SA = [
    { t: '09:00', l: 'Weekly metrics review', c: '#ffaa00' },
    { t: '10:00', l: 'Plan next week outreach', c: '#00ff88' },
    { t: '12:00', l: 'Case study / website updates', c: '#c084fc' },
    { t: '14:00', l: 'Pipeline cleanup', c: '#5BA0D6' },
    { t: '16:00', l: 'Content batch — LinkedIn', c: '#c084fc' },
    { t: '18:00', l: 'Free evening', c: '#333' },
  ];
  const SU = [
    { t: '10:00', l: 'Light planning + inbox zero', c: '#888' },
    { t: '11:00', l: 'Smaecchan advisory — 1hr', c: '#ffaa00' },
    { t: '12:00', l: 'Relationship texting', c: '#ff6b6b' },
    { t: '14:00', l: 'Rest · dogs · recharge', c: '#333' },
    { t: '18:00', l: 'Prep Monday — 3 priorities', c: '#00ff88' },
  ];
  if (dow === 0) return SU;
  if (dow === 6) return SA;
  return W;
}

const QUOTES = [
  "The 80L car is earned in the DMs.",
  "One signed retainer changes everything.",
  "Revenue cures all anxiety.",
  "Every follow-up is a lottery ticket.",
  "Build free. Get paid. Repeat.",
  "The pipeline is the product.",
  "Show up. Ship. Follow up.",
  "Outreach today. Invoice tomorrow.",
  "No one is coming to save you. Go.",
  "80 lakhs. 8 months. No shortcuts.",
  "You're one pitch away.",
  "The grind is the shortcut.",
  "Warm leads > cold leads > no leads.",
  "The compounding starts now.",
  "Every 'no' is a 'not yet'.",
];

function fmtINR(n) {
  if (n >= 1e7) return '\u20B9' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return '\u20B9' + (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return '\u20B9' + (n / 1e3).toFixed(0) + 'K';
  return '\u20B9' + n;
}

// ━━━ FETCH FONT ━━━
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  const res = await fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2');
  fontCache = await res.arrayBuffer();
  return fontCache;
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const w = parseInt(url.searchParams.get('width') || url.searchParams.get('w')) || 1170;
  const ht = parseInt(url.searchParams.get('height') || url.searchParams.get('h')) || 2532;
  const rev = parseInt(url.searchParams.get('rev')) || 0;
  const clients = parseInt(url.searchParams.get('clients')) || 0;
  const pipeline = parseInt(url.searchParams.get('pipeline')) || 0;
  const leads = parseInt(url.searchParams.get('leads')) || 89;
  const msg = url.searchParams.get('msg') || '';

  const now = new Date();
  const daysSince = Math.max(0, Math.floor((now - START_DATE) / 864e5));
  const daysLeft = Math.max(0, Math.floor((TARGET_DATE - now) / 864e5));
  const totalDays = Math.floor((TARGET_DATE - START_DATE) / 864e5);
  const pctTime = Math.round((daysSince / totalDays) * 100);
  const pctRev = Math.min(100, Math.round((rev / TARGET_REV) * 100));
  const phase = getPhase(daysSince);
  const dow = now.getDay();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const schedule = getSchedule(dow);
  const quote = msg || QUOTES[daysSince % QUOTES.length];
  const weekNum = Math.floor(daysSince / 7) + 1;
  const remaining = Math.max(0, TARGET_REV - rev);
  const runRate = Math.round(TARGET_REV / totalDays * daysSince);

  const fontData = await getFont();

  // ━━━ BUILD LAYOUT ━━━
  const scheduleRows = schedule.map(b =>
    h('div', { display: 'flex', alignItems: 'center', marginBottom: 14, gap: 14 },
      h('span', { fontSize: 17, color: '#444', fontWeight: 500, width: 58, fontFamily: 'Inter' }, b.t),
      h('div', { width: 5, height: 5, borderRadius: 3, backgroundColor: b.c }),
      h('span', { fontSize: 19, color: '#bbb', fontWeight: 400 }, b.l)
    )
  );

  const tree = h('div', {
    display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
    backgroundColor: '#000', color: '#fff', fontFamily: 'Inter',
    padding: '380px 70px 160px'
  },
    // ── DAYS LEFT + DATE ──
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
      h('div', { display: 'flex', alignItems: 'baseline', gap: 10 },
        h('span', { fontSize: 82, fontWeight: 800, color: '#00ff88', lineHeight: 1 }, String(daysLeft)),
        h('span', { fontSize: 22, color: '#555', letterSpacing: 3 }, 'DAYS LEFT')
      ),
      h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
        h('span', { fontSize: 16, color: '#444', letterSpacing: 4 }, 'WEEK ' + weekNum),
        h('span', { fontSize: 20, color: '#666', letterSpacing: 2 },
          dayNames[dow] + ' \u00B7 ' + monthNames[now.getMonth()] + ' ' + now.getDate()
        )
      )
    ),

    // ── TIME BAR ──
    h('div', { display: 'flex', height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, marginBottom: 34, overflow: 'hidden' },
      h('div', { display: 'flex', width: pctTime + '%', height: 4, backgroundColor: '#333', borderRadius: 2 })
    ),

    // ── REVENUE ──
    h('div', { display: 'flex', flexDirection: 'column', marginBottom: 32 },
      h('div', { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
        h('span', { fontSize: 15, color: '#555', letterSpacing: 3 }, 'REVENUE'),
        h('span', { fontSize: 15, color: '#555', letterSpacing: 2 }, fmtINR(rev) + ' / \u20B980L')
      ),
      h('div', { display: 'flex', height: 22, backgroundColor: '#111', borderRadius: 11, overflow: 'hidden' },
        h('div', { display: 'flex', width: Math.max(pctRev, 2) + '%', height: 22, backgroundColor: pctRev > 0 ? '#00ff88' : '#111', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          pctRev >= 8 ? h('span', { fontSize: 12, fontWeight: 700, color: '#000' }, pctRev + '%') : ''
        )
      ),
      h('div', { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
        h('span', { fontSize: 14, color: '#333' }, clients + ' clients \u00B7 ' + leads + ' leads'),
        pipeline > 0 ? h('span', { fontSize: 14, color: '#ffaa00' }, fmtINR(pipeline) + ' pipeline') : h('span', { fontSize: 14, color: '#333' }, '')
      )
    ),

    // ── PHASE ──
    h('div', { display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a', borderRadius: 14, padding: '18px 22px', marginBottom: 32, border: '1px solid #1a1a1a' },
      h('div', { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
        h('span', { fontSize: 13, color: '#00ff88', letterSpacing: 4 }, 'PHASE ' + phase.n),
        h('span', { fontSize: 17, fontWeight: 700, letterSpacing: 2 }, phase.name),
        h('span', { fontSize: 13, color: '#444', letterSpacing: 3 }, phase.w)
      ),
      h('span', { fontSize: 14, color: '#555', lineHeight: 1.4 }, phase.f)
    ),

    // ── SCHEDULE ──
    h('div', { display: 'flex', flexDirection: 'column', flex: 1 },
      h('span', { fontSize: 13, color: '#333', letterSpacing: 5, marginBottom: 18 }, "TODAY'S BLOCKS"),
      ...scheduleRows
    ),

    // ── BOTTOM STATS ──
    h('div', { display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTop: '1px solid #151515' },
      h('div', { display: 'flex', flexDirection: 'column' },
        h('span', { fontSize: 26, fontWeight: 700, color: '#fff' }, fmtINR(runRate)),
        h('span', { fontSize: 11, color: '#444', letterSpacing: 3 }, 'RUN RATE')
      ),
      h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center' },
        h('span', { fontSize: 26, fontWeight: 700, color: rev > 0 ? '#00ff88' : '#333' }, fmtINR(rev)),
        h('span', { fontSize: 11, color: '#444', letterSpacing: 3 }, 'EARNED')
      ),
      h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
        h('span', { fontSize: 26, fontWeight: 700, color: '#ffaa00' }, fmtINR(remaining)),
        h('span', { fontSize: 11, color: '#444', letterSpacing: 3 }, 'REMAINING')
      )
    ),

    // ── QUOTE ──
    h('div', { display: 'flex', justifyContent: 'center', marginTop: 24 },
      h('span', { fontSize: 15, color: '#2a2a2a', textAlign: 'center' }, quote)
    )
  );

  // ━━━ RENDER ━━━
  try {
    const svg = await satori(tree, {
      width: w,
      height: ht,
      fonts: [{
        name: 'Inter',
        data: fontData,
        weight: 400,
        style: 'normal',
      }],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: w },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Length', pngBuffer.length);
    res.status(200).end(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
