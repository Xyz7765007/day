const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appZZ70GXx8dSYEbA';
const TABLE = 'Tracker';
const AT_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;

const DEFAULTS = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '', streams: [0,0,0,0,0,0], log: [], checkedTasks: [] };
const STREAM_KEYS = ['stream_sidekick','stream_voxelised','stream_smaeccan','stream_parvani','stream_d2c','stream_polymarket'];

function getToken() {
  return process.env.AIRTABLE_TOKEN;
}

// Find the 'main' record
async function atGet(token) {
  const r = await fetch(`${AT_URL}?filterByFormula={key}="main"&maxRecords=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error('Airtable GET: ' + (await r.text()).slice(0, 300));
  const data = await r.json();
  if (!data.records || !data.records.length) return { recordId: null, state: null };

  const rec = data.records[0];
  const f = rec.fields;
  const streams = STREAM_KEYS.map(k => parseInt(f[k]) || 0);

  let log = [];
  try { log = JSON.parse(f.log || '[]'); } catch (e) {}

  let checkedTasks = [];
  try { checkedTasks = JSON.parse(f.checkedTasks || '[]'); } catch (e) {}

  return {
    recordId: rec.id,
    state: {
      rev: parseInt(f.rev) || 0,
      clients: parseInt(f.clients) || 0,
      pipeline: parseInt(f.pipeline) || 0,
      leads: parseInt(f.leads) || 0,
      msg: f.msg || '',
      streams,
      log,
      checkedTasks,
    }
  };
}

// Update or create the 'main' record
async function atSave(token, state, recordId) {
  const fields = {
    key: 'main',
    rev: state.rev || 0,
    clients: state.clients || 0,
    pipeline: state.pipeline || 0,
    leads: state.leads || 0,
    msg: state.msg || '',
    checkedTasks: JSON.stringify(state.checkedTasks || []),
    log: JSON.stringify((state.log || []).slice(0, 100)),
  };
  // Spread streams into separate fields
  (state.streams || []).forEach((v, i) => {
    if (STREAM_KEYS[i]) fields[STREAM_KEYS[i]] = v || 0;
  });

  if (recordId) {
    // Update existing
    const r = await fetch(`${AT_URL}/${recordId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!r.ok) throw new Error('Airtable PATCH: ' + (await r.text()).slice(0, 300));
    return await r.json();
  } else {
    // Create new
    const r = await fetch(AT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }] })
    });
    if (!r.ok) throw new Error('Airtable POST: ' + (await r.text()).slice(0, 300));
    return await r.json();
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = getToken();
  if (!token) return res.status(500).json({ error: 'AIRTABLE_TOKEN not set. Add it in Vercel Environment Variables.' });

  try {
    if (req.method === 'GET') {
      const { state } = await atGet(token);
      return res.status(200).json(state || DEFAULTS);
    }
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid body' });

      // Get existing record ID
      const { recordId } = await atGet(token);
      const merged = { ...DEFAULTS, ...body };
      await atSave(token, merged, recordId);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
