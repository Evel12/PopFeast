export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const upstream = process.env.UPSTREAM_API_URL;
    res.setHeader('Cache-Control', 'no-store');

    if (!upstream) {
      // Temporary stub so the series detail page works.
      return res.status(200).json({
        id: Number(id) || id,
        title: `Stub series ${id}`,
        poster_url: '',
        rating: 0,
        seasons: null,
        episodes: null,
        genres: [],
        description: 'Temporary stub response from /api/series/[id].js. Set UPSTREAM_API_URL to fetch real data.'
      });
    }

    const r = await fetch(`${upstream}/series/${id}`, {
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