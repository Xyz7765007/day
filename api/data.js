const DEFAULTS = { rev: 0, clients: 0, pipeline: 0, leads: 89, msg: '', streams: [0,0,0,0,0,0], log: [], checkedTasks: [] };
const BLOB_NAME = 'vox-tracker-data.json';

async function blobRead() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    // List blobs to find our data file
    const listRes = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_NAME}&limit=1`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const list = await listRes.json();
    if (!list.blobs || !list.blobs.length) return null;
    // Fetch the public URL
    const dataRes = await fetch(list.blobs[0].url);
    return await dataRes.json();
  } catch (e) { console.error('Blob read error:', e); return null; }
}

async function blobWrite(data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set. Create a Blob store in Vercel dashboard and link it to this project.');

  // Delete old blob(s) first
  try {
    const listRes = await fetch(`https://blob.vercel-storage.com?prefix=${BLOB_NAME}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const list = await listRes.json();
    if (list.blobs && list.blobs.length > 0) {
      await fetch('https://blob.vercel-storage.com/delete', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ urls: list.blobs.map(b => b.url) })
      });
    }
  } catch (e) { /* ignore delete errors */ }

  // Write new blob
  const res = await fetch(`https://blob.vercel-storage.com/${BLOB_NAME}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-content-type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Blob write failed: ' + (await res.text()));
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await blobRead();
      return res.status(200).json(data || DEFAULTS);
    }
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid body' });
      const current = (await blobRead()) || DEFAULTS;
      const merged = { ...DEFAULTS, ...current, ...body };
      if (merged.log?.length > 100) merged.log = merged.log.slice(0, 100);
      await blobWrite(merged);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
