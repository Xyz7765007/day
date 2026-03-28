import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// ━━━ PLAN DATA ━━━
const TARGET_DATE = new Date('2026-11-30T23:59:59');
const START_DATE = new Date('2026-03-29T00:00:00');
const TARGET_REV = 8000000; // ₹80L

function getPhase(days) {
  if (days < 14) return { n: '01', name: 'FOUNDATION', w: 'WK 1-2', f: 'Entity setup · Email warming · Warm outreach · Case study #1' };
  if (days < 28) return { n: '02', name: 'OUTBOUND LAUNCH', w: 'WK 3-4', f: 'Cold sequences live · LinkedIn campaigns · Discovery calls' };
  if (days < 56) return { n: '03', name: 'PIPELINE BUILD', w: 'WK 5-8', f: 'Full outbound running · Proposals out · Close first deals' };
  if (days < 120) return { n: '04', name: 'REVENUE', w: 'MO 3-4', f: 'Deliver & expand · Retainer upsells · 2nd case study' };
  return { n: '05', name: 'SCALE', w: 'MO 5-8', f: 'Referral flywheel · Raise rates · Build team' };
}

function getSchedule(dow, phase) {
  const blocks = {
    weekday: [
      { t: '07:00', l: 'Pipeline review + responses', c: '#888' },
      { t: '08:00', l: 'LinkedIn outreach — 20 connects', c: '#5BA0D6' },
      { t: '09:00', l: 'Cold email sequences — review & adjust', c: '#00ff88' },
      { t: '10:00', l: 'Side Kick — client deliverables', c: '#ffaa00' },
      { t: '13:00', l: 'Keto lunch + break', c: '#444' },
      { t: '14:00', l: 'Voxelised — build & deliver', c: '#00ff88' },
      { t: '16:00', l: 'Follow-ups · proposals · calls', c: '#ff6b6b' },
      { t: '17:00', l: 'Case study / Loom / content', c: '#c084fc' },
      { t: '19:00', l: 'Evening review — plan tomorrow', c: '#888' },
    ],
    saturday: [
      { t: '09:00', l: 'Weekly metrics review', c: '#ffaa00' },
      { t: '10:00', l: 'Plan next week outreach', c: '#00ff88' },
      { t: '12:00', l: 'Case study / website updates', c: '#c084fc' },
      { t: '14:00', l: 'Voxelised pipeline cleanup', c: '#5BA0D6' },
      { t: '16:00', l: 'Content batch — LinkedIn posts', c: '#c084fc' },
      { t: '18:00', l: 'Free evening', c: '#444' },
    ],
    sunday: [
      { t: '10:00', l: 'Light planning + inbox zero', c: '#888' },
      { t: '11:00', l: 'Smæccan advisory — 1 hour', c: '#ffaa00' },
      { t: '12:00', l: 'Relationship texting window', c: '#ff6b6b' },
      { t: '14:00', l: 'Rest · dogs · recharge', c: '#444' },
      { t: '18:00', l: 'Prep Monday — set 3 priorities', c: '#00ff88' },
    ],
  };
  if (dow === 0) return blocks.sunday;
  if (dow === 6) return blocks.saturday;
  return blocks.weekday;
}

const QUOTES = [
  "The ₹80L car is earned in the DMs.",
  "One signed retainer changes everything.",
  "Revenue cures all anxiety.",
  "Every follow-up is a lottery ticket.",
  "Build free. Get paid. Repeat.",
  "The pipeline is the product.",
  "Show up. Ship. Follow up.",
  "Outreach today. Invoice tomorrow.",
  "No one is coming to save you. Go.",
  "Every 'no' is a 'not yet'.",
  "Warm leads > cold leads > no leads.",
  "The compounding starts now.",
  "80 lakhs. 8 months. No shortcuts.",
  "You're one pitch away.",
  "The grind is the shortcut.",
];

function formatINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const w = parseInt(searchParams.get('width') || searchParams.get('w')) || 1170;
  const h = parseInt(searchParams.get('height') || searchParams.get('h')) || 2532;
  const rev = parseInt(searchParams.get('rev')) || 0;
  const clients = parseInt(searchParams.get('clients')) || 0;
  const pipeline = parseInt(searchParams.get('pipeline')) || 0;
  const leads = parseInt(searchParams.get('leads')) || 89;
  const msg = searchParams.get('msg') || '';

  const now = new Date();
  const daysSinceStart = Math.max(0, Math.floor((now - START_DATE) / 86400000));
  const daysLeft = Math.max(0, Math.floor((TARGET_DATE - now) / 86400000));
  const totalDays = Math.floor((TARGET_DATE - START_DATE) / 86400000);
  const pctElapsed = Math.round((daysSinceStart / totalDays) * 100);
  const pctRev = Math.min(100, Math.round((rev / TARGET_REV) * 100));
  const phase = getPhase(daysSinceStart);
  const dow = now.getDay();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const schedule = getSchedule(dow, phase);
  const quote = QUOTES[(daysSinceStart) % QUOTES.length];
  const weekNum = Math.floor(daysSinceStart / 7) + 1;

  const px = (n) => Math.round(n * w / 1170);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#000', fontFamily: 'sans-serif', color: '#fff', padding: `${px(340)}px ${px(70)}px ${px(160)}px` }}>

        {/* ── DAYS LEFT + DATE ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: `${px(8)}px` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: `${px(8)}px` }}>
            <span style={{ fontSize: px(72), fontWeight: 800, color: '#00ff88', lineHeight: 1 }}>{daysLeft}</span>
            <span style={{ fontSize: px(20), color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase' }}>days left</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: px(15), color: '#444', letterSpacing: '0.2em' }}>WEEK {weekNum}</span>
            <span style={{ fontSize: px(18), color: '#666', letterSpacing: '0.1em' }}>
              {dayNames[dow]} · {monthNames[now.getMonth()]} {now.getDate()}
            </span>
          </div>
        </div>

        {/* ── TIME PROGRESS BAR ── */}
        <div style={{ display: 'flex', height: `${px(4)}px`, background: '#1a1a1a', borderRadius: `${px(2)}px`, marginBottom: `${px(28)}px`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: `${pctElapsed}%`, height: '100%', background: '#333', borderRadius: `${px(2)}px` }}></div>
        </div>

        {/* ── REVENUE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: `${px(28)}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${px(8)}px` }}>
            <span style={{ fontSize: px(14), color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Revenue</span>
            <span style={{ fontSize: px(14), color: '#555', letterSpacing: '0.15em' }}>{formatINR(rev)} / ₹80L</span>
          </div>
          <div style={{ display: 'flex', height: `${px(20)}px`, background: '#111', borderRadius: `${px(10)}px`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', width: `${Math.max(pctRev, 1)}%`, height: '100%', background: pctRev > 0 ? '#00ff88' : '#111', borderRadius: `${px(10)}px`, alignItems: 'center', justifyContent: 'center' }}>
              {pctRev >= 10 && <span style={{ fontSize: px(11), fontWeight: 700, color: '#000' }}>{pctRev}%</span>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: `${px(8)}px` }}>
            <span style={{ fontSize: px(12), color: '#333' }}>{clients} clients · {leads} leads ready</span>
            {pipeline > 0 && <span style={{ fontSize: px(12), color: '#ffaa00' }}>₹{(pipeline/100000).toFixed(1)}L pipeline</span>}
          </div>
        </div>

        {/* ── PHASE ── */}
        <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: `${px(12)}px`, padding: `${px(16)}px ${px(20)}px`, marginBottom: `${px(28)}px`, border: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${px(8)}px`, marginBottom: `${px(6)}px` }}>
              <span style={{ fontSize: px(11), color: '#00ff88', letterSpacing: '0.25em' }}>PHASE {phase.n}</span>
              <span style={{ fontSize: px(14), fontWeight: 700, letterSpacing: '0.1em' }}>{phase.name}</span>
              <span style={{ fontSize: px(11), color: '#444', letterSpacing: '0.15em' }}>{phase.w}</span>
            </div>
            <span style={{ fontSize: px(12), color: '#555', lineHeight: 1.4 }}>{phase.f}</span>
          </div>
        </div>

        {/* ── TODAY'S SCHEDULE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: px(11), color: '#333', letterSpacing: '0.25em', marginBottom: `${px(14)}px` }}>{"TODAY'S BLOCKS"}</span>
          {schedule.map((block, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: `${px(10)}px`, gap: `${px(12)}px` }}>
              <span style={{ fontSize: px(13), color: '#333', fontWeight: 500, minWidth: `${px(50)}px`, fontFamily: 'monospace' }}>{block.t}</span>
              <div style={{ display: 'flex', width: `${px(4)}px`, height: `${px(4)}px`, borderRadius: `${px(2)}px`, background: block.c }}></div>
              <span style={{ fontSize: px(15), color: '#aaa', fontWeight: 400 }}>{block.l}</span>
            </div>
          ))}
        </div>

        {/* ── BOTTOM STATS ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: `${px(16)}px`, paddingTop: `${px(16)}px`, borderTop: '1px solid #111' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: px(22), fontWeight: 700, color: '#fff' }}>{formatINR(Math.round(TARGET_REV / totalDays * (totalDays - daysLeft)))}</span>
            <span style={{ fontSize: px(10), color: '#444', letterSpacing: '0.15em' }}>RUN RATE TARGET</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: px(22), fontWeight: 700, color: rev > 0 ? '#00ff88' : '#333' }}>{formatINR(rev)}</span>
            <span style={{ fontSize: px(10), color: '#444', letterSpacing: '0.15em' }}>EARNED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: px(22), fontWeight: 700, color: '#ffaa00' }}>{formatINR(Math.max(0, TARGET_REV - rev))}</span>
            <span style={{ fontSize: px(10), color: '#444', letterSpacing: '0.15em' }}>REMAINING</span>
          </div>
        </div>

        {/* ── MOTIVATION ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: `${px(20)}px` }}>
          <span style={{ fontSize: px(13), color: '#333', fontStyle: 'italic', textAlign: 'center' }}>
            {msg || quote}
          </span>
        </div>
      </div>
    ),
    { width: w, height: h }
  );
}
