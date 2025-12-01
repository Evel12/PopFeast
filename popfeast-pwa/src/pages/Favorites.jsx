import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';

export default function Favorites() {
  const [favMovies, setFavMovies] = useState([]);
  const [favSeries, setFavSeries] = useState([]);
  const [view, setView] = useState('movie'); // 'movie' | 'series'
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const reload = async () => {
    // get favorite id/type pairs
    const all = await getFavorites();
    const movieIds = new Set(all.filter(f=>f.item_type==='movie').map(f=>f.item_id));
    const seriesIds = new Set(all.filter(f=>f.item_type==='series').map(f=>f.item_id));

    // fetch full lists and filter to favorites
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/series')
      ]);
      const moviesData = moviesRes.ok ? await moviesRes.json() : [];
      const seriesData = seriesRes.ok ? await seriesRes.json() : [];
      setFavMovies(moviesData.filter(m=>movieIds.has(m.id)).map(m=>({
        id: m.id,
        type: 'movie',
        title: m.title,
        poster_url: m.poster_url,
        rating: (m.average_rating ?? m.avg_rating ?? m.rating ?? 0),
        genres: m.genres,
        duration_minutes: m.duration_minutes,
        year: m.year
      })));
      setFavSeries(seriesData.filter(s=>seriesIds.has(s.id)).map(s=>({
        id: s.id,
        type: 'series',
        title: s.title,
        poster_url: s.poster_url,
        rating: (s.average_rating ?? s.avg_rating ?? s.rating ?? 0),
        genres: s.genres,
        seasons: s.seasons,
        episodes: s.episodes
      })));
    } catch (e) {
      // Fallback: empty lists if fetch fails
      setFavMovies([]);
      setFavSeries([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [view]);

  const currentList = useMemo(() => (view === 'movie' ? favMovies : favSeries), [view, favMovies, favSeries]);
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, page, pageSize]);

  const [pendingIds, setPendingIds] = useState(new Set());
  const handleRemove = async (item) => {
    if (pendingIds.has(item.id)) return;
    setPendingIds(prev => new Set(prev).add(item.id));
    // Optimistic removal from current list
    if (item.type === 'movie') {
      setFavMovies(prev => prev.filter(m => m.id !== item.id));
    } else {
      setFavSeries(prev => prev.filter(s => s.id !== item.id));
    }
    // Perform network toggle and then refresh to reconcile
    toggleFavorite(item)
      .then(() => reload())
      .catch(() => reload())
      .finally(() => setPendingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; }));
  };

  const renderCard = (f) => (
    <div key={`${f.type}-${f.id}`} className="media-card" style={{minHeight:300, position:'relative'}}>
      <button
        className="fav-btn fav-active"
        aria-label="Remove favorite"
        onClick={() => handleRemove(f)}
      >🍿</button>
      <Link
        to={f.type==='movie' ? `/movies/${f.id}` : `/series/${f.id}`}
        aria-label={`Open ${f.title}`}
        style={{position:'absolute', inset:0, zIndex:1}}
      />
      <div className="media-thumb">
        {f.poster_url ? (
          <img src={f.poster_url} alt={f.title} loading="lazy" />
        ) : (
          <div className="media-thumb-fallback">
            {(f.title || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="rating-pill">
          <span>⭐{(f.rating ?? 0).toFixed(1)}</span>/10
        </div>
      </div>
      <div className="media-body">
        <h3 className="card-title">{f.title}</h3>
        <div className="card-meta">
          <div className="meta-chip">{f.type}</div>
          {f.type === 'movie' && f.duration_minutes && <div className="meta-chip">{f.duration_minutes} min</div>}
          {f.type === 'movie' && f.year && <div className="meta-chip">{f.year}</div>}
          {f.type === 'series' && f.seasons != null && <div className="meta-chip">{f.seasons} seasons</div>}
          {f.type === 'series' && f.episodes != null && <div className="meta-chip">{f.episodes} eps</div>}
          {Array.isArray(f.genres) && f.genres.slice(0,2).map(g => (
            <div key={g} className="meta-chip">{g}</div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="section">
      <h2>Favorites</h2>

      <div className="tabs">
        <button className={`tab ${view==='movie'?'active':''}`} onClick={()=>setView('movie')}>Movies</button>
        <button className={`tab ${view==='series'?'active':''}`} onClick={()=>setView('series')}>Series</button>
      </div>

      {currentList.length === 0 && (
        <p className="muted">No {view} favorites yet.</p>
      )}

      <div className="media-grid">
        {paged.map(renderCard)}
      </div>

      {currentList.length > pageSize && (
        <div className="pager">
          <button className="pager-btn" disabled={page<=1} onClick={()=>setPage(Math.max(1,page-1))}>Prev</button>
          <span className="pager-info">Page {page} / {totalPages}</span>
          <button className="pager-btn" disabled={page>=totalPages} onClick={()=>setPage(Math.min(totalPages,page+1))}>Next</button>
        </div>
      )}
    </section>
  );
}