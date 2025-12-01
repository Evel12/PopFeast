// If your existing /api files use CommonJS (module.exports = ...), mirror that style.
// This ESM style matches Vercel examples when the project uses "type":"module".
export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const upstream = process.env.UPSTREAM_API_URL;
    res.setHeader('Cache-Control', 'no-store');

    if (!upstream) {
      // Temporary stub so the details page works in prod until you wire the real backend.
      return res.status(200).json({
        id: Number(id) || id,
        title: `Stub movie ${id}`,
        poster_url: '',
        rating: 0,
        year: null,
        duration_minutes: null,
        genres: [],
        description: 'Temporary stub response from /api/movies/[id].js. Set UPSTREAM_API_URL to fetch real data.'
      });
    }

    const r = await fetch(`${upstream}/movies/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return res.status(502).json({ error: 'bad_upstream', message: 'Upstream did not return JSON' });
    }

    const j = await r.json();
    return res.status(r.status).json(j);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
}