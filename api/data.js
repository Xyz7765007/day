const KEY = 'voxelised_tracker';
const DEFAULTS = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '', streams: [0,0,0,0,0,0], log: [], checkedTasks: [] };

async function kvGet() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(`${url}/get/${KEY}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    return d.result ? JSON.parse(d.result) : null;
  } catch (e) { console.error('KV GET error:', e); return null; }
}

async function kvSet(value) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV not configured. Add Vercel KV store to your project.');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', KEY, JSON.stringify(value)])
  });
  if (!r.ok) throw new Error('KV SET failed: ' + (await r.text()));
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await kvGet();
      return res.status(200).json(data || DEFAULTS);
    }
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid body' });
      const current = (await kvGet()) || DEFAULTS;
      const merged = { ...DEFAULTS, ...current, ...body };
      if (merged.log?.length > 100) merged.log = merged.log.slice(0, 100);
      await kvSet(merged);
      return res.status(200).json({ ok: true, data: merged });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
