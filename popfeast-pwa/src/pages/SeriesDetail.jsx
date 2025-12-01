import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetchDetail } from '../hooks/useFetchDetail.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';

/**
 * Series detail page
 * Features:
 * - Fetch series detail (id from route)
 * - Display poster, meta chips (seasons, episodes, genres, rating)
 * - Favorite toggle (offline tolerant)
 * - Comments list + form
 * - Loading skeleton, error, not-found states
 */
export default function SeriesDetail() {
  const { id } = useParams();
  const { data, loading, error } = useFetchDetail('series', id);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!data?.id) return;
      try {
        const all = await getFavorites();
        const isFav = all.some(f => f.item_id === data.id && f.item_type === 'series');
        setFav(isFav);
      } catch {
        // ignore
      }
    };
    load();
  }, [data]);

  const handleFav = () => {
    if (!data) return;
    setFav(prev => !prev);
    toggleFavorite({
      id: data.id,
      title: data.title,
      type: 'series',
      poster_url: data.poster_url,
      rating: data.rating,
      seasons: data.seasons,
      episodes: data.episodes
    })
      .then(async () => {
        try {
          const all = await getFavorites();
          const isFav = all.some(f => f.item_id === data.id && f.item_type === 'series');
          setFav(isFav);
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // Revert if failed and you want strict behavior:
        setFav(prev => !prev);
      });
  };

  // Comments state
  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  const [rating, setRating] = useState('');
  const [content, setContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [username, setUsername] = useState('');

  // Load comments
  useEffect(() => {
    setCLoading(true);
    fetch(`/api/series/${id}/comments?__bypass=1&_ts=${Date.now()}`, {
      headers: { 'Accept': 'application/json', 'x-bypass-cache': '1' },
      cache: 'no-store'
    })
      .then(async r => {
        if (!r.ok) throw new Error('net');
        return r.json();
      })
      .then(j => setComments(Array.isArray(j) ? j : []))
      .catch(() => { /* silent */ })
      .finally(() => setCLoading(false));
  }, [id]);

  // Submit comment
  const addComment = e => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitLoading(true);
    fetch(`/api/series/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        rating: (rating === '' ? null : Number(rating)),
        content,
        username: username ? username : null
      })
    })
      .then(async r => {
        if (!r.ok) throw new Error('net');
        return r.json();
      })
      .then(j => {
        setComments(prev => [j, ...prev]);
        setContent('');
        setRating('');
        setUsername('');
      })
      .catch(() => { /* silent */ })
      .finally(() => setSubmitLoading(false));
  };

  // Render states
  if (loading) {
    return (
      <div className="detail">
        <div className="skeleton" style={{ height: 34, width: '50%', borderRadius: 10 }} />
      </div>
    );
  }
  if (error) return <p className="muted">Error: {error}</p>;
  if (!data) return <p className="muted">Tidak ditemukan</p>;

  const avg = data.rating ? Number(data.rating).toFixed(1) : '0.0';
  const genres = data.genres || [];

  return (
    <article className="detail">
      <div className="detail-hero">
        <div className="detail-poster">
          {data.poster_url ? (
            <img src={data.poster_url} alt={data.title} />
          ) : (
            <div className="media-thumb-fallback" style={{ fontSize: '2.2rem' }}>
              {(data.title || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="detail-main">
          <h2>{data.title}</h2>
          <div className="detail-meta">
            {typeof data.seasons === 'number' && (
              <div className="meta-chip">{data.seasons} seasons</div>
            )}
            {typeof data.episodes === 'number' && (
              <div className="meta-chip">{data.episodes} eps</div>
            )}
            {genres.map(g => (
              <div key={g} className="meta-chip">{g}</div>
            ))}
            <div className="avg-rating">
              <strong>⭐{avg}</strong>/10
            </div>
          </div>
          <div className="detail-fav-wrap">
            <button
              onClick={handleFav}
              className={`detail-fav-btn ${fav ? 'active' : ''}`}
            >
              🍿 {fav ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>

      {data.description && (
        <p style={{ whiteSpace: 'pre-wrap', marginTop: 18 }}>{data.description}</p>
      )}

      <div className="comments-wrap">
        <form className="comment-form form-panel" onSubmit={addComment}>
          <h3>Tambah Komentar & Rating</h3>
            <label className="form-field" htmlFor="username">
              Nama / Username
              <input
                id="username"
                name="username"
                className="form-input"
                type="text"
                maxLength={40}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nama kamu (opsional)"
              />
            </label>
            <label className="form-field" htmlFor="rating">
              Rating (0-10)
              <input
                id="rating"
                name="rating"
                className="form-input"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rating}
                onChange={e => setRating(e.target.value)}
                required
              />
            </label>
            <label className="form-field" htmlFor="content">
              Komentar
              <textarea
                id="content"
                name="content"
                className="form-textarea"
                rows="4"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Pendapat tentang series..."
                required
              />
            </label>
            <button className="btn-primary" type="submit" disabled={submitLoading}>
              {submitLoading ? 'Mengirim...' : 'Kirim'}
            </button>
        </form>

        <div>
          <h3 style={{ margin: '0 0 12px' }}>Komentar</h3>
          {cLoading && <p className="muted">Memuat komentar...</p>}
          {!cLoading && comments.length === 0 && (
            <p className="muted">Belum ada komentar.</p>
          )}
          <div className="comment-list">
            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="top-line">
                  <span>
                    {c.username ? c.username : 'Anon'} •{' '}
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  <div className="comment-rating">
                    <strong>{Number(c.rating).toFixed(1)}</strong>/10
                  </div>
                </div>
                <div className="comment-text">{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}