const BLOB_FILE = 'vox-tracker.json';
const DEFAULTS = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '', streams: [0,0,0,0,0,0], log: [], checkedTasks: [] };

async function blobGet(token) {
  const r = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_FILE}&limit=1`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const list = await r.json();
  if (!list.blobs || !list.blobs.length) return null;
  const dr = await fetch(list.blobs[0].url);
  return await dr.json();
}

async function blobPut(token, data) {
  // Delete old
  try {
    const lr = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_FILE}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const list = await lr.json();
    if (list.blobs?.length) {
      await fetch('https://blob.vercel-storage.com/delete', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ urls: list.blobs.map(b => b.url) })
      });
    }
  } catch (e) {}
  // Write new
  const r = await fetch(`https://blob.vercel-storage.com/${BLOB_FILE}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('Blob write: ' + (await r.text()).slice(0, 200));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not set. Link Blob store to project.' });

  try {
    if (req.method === 'GET') {
      const data = await blobGet(token);
      return res.status(200).json(data || DEFAULTS);
    }
    if (req.method === 'POST') {
      const current = (await blobGet(token)) || DEFAULTS;
      const merged = { ...DEFAULTS, ...current, ...req.body };
      if (merged.log?.length > 100) merged.log = merged.log.slice(0, 100);
      await blobPut(token, merged);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
