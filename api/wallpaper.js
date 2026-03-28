import { ImageResponse } from '@vercel/og';
import { kv } from '@vercel/kv';

export const config = { runtime: 'edge' };

const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29T00:00:00');
const TARGET_REV = 8000000;

function getPhase(d) {
  if (d < 14) return { n: '01', name: 'FOUNDATION', f: 'Entity · Warming · Outreach · Case study' };
  if (d < 28) return { n: '02', name: 'OUTBOUND', f: 'Cold sequences · LinkedIn · Discovery calls' };
  if (d < 56) return { n: '03', name: 'PIPELINE', f: 'Full outbound · Proposals · Close deals' };
  if (d < 120) return { n: '04', name: 'REVENUE', f: 'Deliver · Expand · Retainer upsells' };
  return { n: '05', name: 'SCALE', f: 'Referrals · Raise rates · Build team' };
}

function getSched(dow) {
  const W = [
    { t: '07:00', l: 'Pipeline review + responses', c: '#888' },
    { t: '08:00', l: 'LinkedIn — 20 connects', c: '#5BA0D6' },
    { t: '09:00', l: 'Cold email sequences', c: '#00ff88' },
    { t: '10:00', l: 'Side Kick deliverables', c: '#ffaa00' },
    { t: '13:00', l: 'Keto lunch + break', c: '#333' },
    { t: '14:00', l: 'Voxelised build & deliver', c: '#00ff88' },
    { t: '16:00', l: 'Follow-ups · proposals · calls', c: '#ff6b6b' },
    { t: '17:00', l: 'Case study / Loom / content', c: '#c084fc' },
    { t: '19:00', l: 'Evening review + plan tmrw', c: '#888' },
  ];
  const SA = [
    { t: '09:00', l: 'Weekly metrics review', c: '#ffaa00' },
    { t: '10:00', l: 'Plan next week outreach', c: '#00ff88' },
    { t: '12:00', l: 'Case study + website', c: '#c084fc' },
    { t: '14:00', l: 'Pipeline cleanup', c: '#5BA0D6' },
    { t: '16:00', l: 'Content batch — LinkedIn', c: '#c084fc' },
    { t: '18:00', l: 'Free evening', c: '#333' },
  ];
  const SU = [
    { t: '10:00', l: 'Light planning + inbox zero', c: '#888' },
    { t: '11:00', l: 'Smaeccan advisory (1hr)', c: '#ffaa00' },
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
  "Show up. Ship. Follow up.",
  "Outreach today. Invoice tomorrow.",
  "No one is coming to save you. Go.",
  "80 lakhs. 8 months. No shortcuts.",
  "You are one pitch away.",
  "The grind IS the shortcut.",
  "Warm leads > cold leads > no leads.",
  "The compounding starts now.",
  "Pipeline is the product.",
  "Every no is a not yet.",
];

function fmtINR(n) {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const w = parseInt(searchParams.get('width') || searchParams.get('w')) || 1170;
  const h = parseInt(searchParams.get('height') || searchParams.get('h')) || 2532;

  // Read from KV
  let state = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '' };
  try {
    const kvData = await kv.get('voxelised_tracker_state');
    if (kvData) state = { ...state, ...kvData };
  } catch (e) {
    // KV not available, use defaults + URL params as fallback
    state.rev = parseInt(searchParams.get('rev')) || 0;
    state.clients = parseInt(searchParams.get('clients')) || 0;
    state.pipeline = parseInt(searchParams.get('pipeline')) || 0;
    state.leads = parseInt(searchParams.get('leads')) || 89;
    state.msg = searchParams.get('msg') || '';
  }

  const { rev, clients, pipeline, leads, msg } = state;
  const now = new Date();
  const daysSince = Math.max(0, Math.floor((now - START_DATE) / 864e5));
  const daysLeft = Math.max(0, Math.floor((TARGET_DATE - now) / 864e5));
  const totalDays = Math.floor((TARGET_DATE - START_DATE) / 864e5);
  const pctTime = Math.round(daysSince / totalDays * 100);
  const pctRev = Math.min(100, Math.round(rev / TARGET_REV * 100));
  const phase = getPhase(daysSince);
  const dow = now.getDay();
  const dn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const mn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const sched = getSched(dow);
  const quote = msg || QUOTES[daysSince % QUOTES.length];
  const weekNum = Math.floor(daysSince / 7) + 1;
  const p = (n) => Math.round(n * w / 1170);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#000', fontFamily: 'sans-serif', color: '#fff', padding: `${p(320)}px ${p(60)}px ${p(140)}px` }}>

        {/* HEADER: Days Left + Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: `${p(6)}px` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: `${p(8)}px` }}>
            <span style={{ fontSize: p(68), fontWeight: 800, color: '#00ff88', lineHeight: 1 }}>{daysLeft}</span>
            <span style={{ fontSize: p(18), color: '#555', letterSpacing: '0.15em' }}>DAYS LEFT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: p(13), color: '#444', letterSpacing: '0.2em' }}>WK {weekNum}</span>
            <span style={{ fontSize: p(16), color: '#666' }}>{dn[dow]} {mn[now.getMonth()]} {now.getDate()}</span>
          </div>
        </div>

        {/* TIME BAR */}
        <div style={{ display: 'flex', height: `${p(3)}px`, background: '#1a1a1a', borderRadius: `${p(2)}px`, marginBottom: `${p(24)}px`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: `${pctTime}%`, height: '100%', background: '#333' }}></div>
        </div>

        {/* REVENUE */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: `${p(24)}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: `${p(6)}px` }}>
            <span style={{ fontSize: p(12), color: '#555', letterSpacing: '0.2em' }}>REVENUE</span>
            <span style={{ fontSize: p(12), color: '#555' }}>{fmtINR(rev)} / 80L</span>
          </div>
          <div style={{ display: 'flex', height: `${p(18)}px`, background: '#111', borderRadius: `${p(9)}px`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', width: `${Math.max(pctRev, 2)}%`, height: '100%', background: pctRev > 0 ? '#00ff88' : '#111', borderRadius: `${p(9)}px`, alignItems: 'center', justifyContent: 'center' }}>
              {pctRev >= 8 && <span style={{ fontSize: p(10), fontWeight: 700, color: '#000' }}>{pctRev}%</span>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: `${p(6)}px` }}>
            <span style={{ fontSize: p(11), color: '#333' }}>{clients} clients  {leads} leads</span>
            {pipeline > 0 && <span style={{ fontSize: p(11), color: '#ffaa00' }}>{fmtINR(pipeline)} pipeline</span>}
          </div>
        </div>

        {/* PHASE */}
        <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: `${p(10)}px`, padding: `${p(14)}px ${p(16)}px`, marginBottom: `${p(24)}px`, border: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${p(8)}px`, marginBottom: `${p(4)}px` }}>
              <span style={{ fontSize: p(10), color: '#00ff88', letterSpacing: '0.25em' }}>PHASE {phase.n}</span>
              <span style={{ fontSize: p(13), fontWeight: 700 }}>{phase.name}</span>
            </div>
            <span style={{ fontSize: p(11), color: '#555' }}>{phase.f}</span>
          </div>
        </div>

        {/* SCHEDULE */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: p(10), color: '#333', letterSpacing: '0.25em', marginBottom: `${p(12)}px` }}>{"TODAY'S BLOCKS"}</span>
          {sched.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: `${p(9)}px`, gap: `${p(10)}px` }}>
              <span style={{ fontSize: p(12), color: '#333', minWidth: `${p(46)}px`, fontFamily: 'monospace' }}>{b.t}</span>
              <div style={{ display: 'flex', width: `${p(4)}px`, height: `${p(4)}px`, borderRadius: `${p(2)}px`, background: b.c }}></div>
              <span style={{ fontSize: p(14), color: '#aaa' }}>{b.l}</span>
            </div>
          ))}
        </div>

        {/* BOTTOM STATS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: `${p(12)}px`, paddingTop: `${p(14)}px`, borderTop: '1px solid #111' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: p(20), fontWeight: 700 }}>{fmtINR(Math.round(TARGET_REV / totalDays * daysSince))}</span>
            <span style={{ fontSize: p(9), color: '#444', letterSpacing: '0.12em' }}>TARGET PACE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: p(20), fontWeight: 700, color: rev > 0 ? '#00ff88' : '#333' }}>{fmtINR(rev)}</span>
            <span style={{ fontSize: p(9), color: '#444', letterSpacing: '0.12em' }}>EARNED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: p(20), fontWeight: 700, color: '#ffaa00' }}>{fmtINR(Math.max(0, TARGET_REV - rev))}</span>
            <span style={{ fontSize: p(9), color: '#444', letterSpacing: '0.12em' }}>TO GO</span>
          </div>
        </div>

        {/* QUOTE */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: `${p(16)}px` }}>
          <span style={{ fontSize: p(12), color: '#333', fontStyle: 'italic', textAlign: 'center' }}>{quote}</span>
        </div>
      </div>
    ),
    { width: w, height: h }
  );
}
