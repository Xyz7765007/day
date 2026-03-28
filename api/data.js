import { kv } from '@vercel/kv';

const KEY = 'voxelised_tracker_state';
const DEFAULTS = {
  rev: 0,
  clients: 0,
  pipeline: 0,
  leads: 89,
  msg: '',
  streams: [0, 0, 0, 0, 0, 0],
  log: [],
  checkedTasks: [],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await kv.get(KEY);
      return res.status(200).json(data || DEFAULTS);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid body' });
      }
      // Merge with defaults to ensure all fields exist
      const current = (await kv.get(KEY)) || DEFAULTS;
      const merged = { ...DEFAULTS, ...current, ...body };
      // Cap log at 100 entries
      if (merged.log && merged.log.length > 100) merged.log = merged.log.slice(0, 100);
      await kv.set(KEY, merged);
      return res.status(200).json({ ok: true, data: merged });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('KV error:', err);
    return res.status(500).json({ error: err.message });
  }
}
