import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchList } from '../hooks/useFetchList.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';
import { useSearchSort } from '../context/SearchSortContext.jsx';

export default function Series() {
  const { data, loading, error } = useFetchList('series');
  const [favSet, setFavSet] = useState(new Set());
  const [pending, setPending] = useState(new Set());
  const { query, sort, order, selectedGenres } = useSearchSort();

  useEffect(() => {
    const loadFavs = async () => {
      const all = await getFavorites();
      const set = new Set(all.filter(f=>f.item_type==='series').map(f=>f.item_id));
      setFavSet(set);
    };
    loadFavs();
  }, [data]);

  const filteredSorted = useMemo(() => {
    let list = data;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q));
    }
    if (selectedGenres.length) {
      list = list.filter(s => {
        const gs = s.genres || [];
        return selectedGenres.every(sel => gs.includes(sel));
      });
    }
    const asc = order === 'asc';
    list = [...list].sort((a, b) => {
      const getVal = (obj) => {
        switch (sort) {
          case 'title': return obj.title?.toLowerCase() || '';
          case 'seasons': return obj.seasons || 0;
          case 'episodes': return obj.episodes || 0;
          case 'genres': return (obj.genres||[]).join('|').toLowerCase();
          case 'rating': return obj.rating || 0;
          default: return obj.rating || 0;
        }
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, query, sort, order, selectedGenres]);

  const handleToggle = async (series, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending.has(series.id)) return;
    setPending(prev => new Set(prev).add(series.id));
    // Optimistic flip; reconcile on response
    const wasFav = favSet.has(series.id);
    setFavSet(prev => { const next = new Set(prev); if (wasFav) next.delete(series.id); else next.add(series.id); return next; });
    toggleFavorite({
      id: series.id,
      title: series.title,
      type: 'series',
      poster_url: series.poster_url,
      rating: series.rating,
      seasons: series.seasons,
      episodes: series.episodes
    }).then(async () => {
      const all = await getFavorites();
      const set = new Set(all.filter(f=>f.item_type==='series').map(f=>f.item_id));
      setFavSet(set);
    }).catch(() => {
      setFavSet(prev => { const next = new Set(prev); if (wasFav) next.add(series.id); else next.delete(series.id); return next; });
    }).finally(() => {
      setPending(prev => { const next = new Set(prev); next.delete(series.id); return next; });
    });
  };

  return (
    <section className="section">
      <h2 style={{marginTop:0}}>Series</h2>
      {loading && (
        <div className="media-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="media-card">
              <div className="media-thumb skeleton" />
              <div className="media-body">
                <div className="skeleton" style={{height:18,width:'70%',borderRadius:8}} />
                <div className="skeleton" style={{height:12,width:'50%',borderRadius:8,marginTop:10}} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="muted">Error: {error}</p>}
      {!loading && !error && (
        <div className="media-grid">
          {filteredSorted.map(s => {
            const poster = s.poster_url;
            const fav = favSet.has(s.id);
            const genres = (s.genres || []).slice(0,2);
            return (
              <Link to={`/series/${s.id}`} key={s.id} className="media-card">
                <button
                  className={`fav-btn ${fav ? 'fav-active' : ''}`}
                  aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                  onClick={(e) => handleToggle(s, e)}
                  type="button"
                  disabled={pending.has(s.id)}
                >🍿</button>
                <div className="media-thumb">
                  {poster ? (
                    <img src={poster} alt={s.title} loading="lazy" />
                  ) : (
                    <div className="media-thumb-fallback">
                      {(s.title || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="rating-pill">
                    <span>⭐{(s.rating ?? 0).toFixed(1)}</span>/10
                  </div>
                </div>
                <div className="media-body">
                  <h3 className="card-title">{s.title}</h3>
                  <div className="card-meta">
                    {typeof s.seasons === 'number' && <div className="meta-chip">{s.seasons} seasons</div>}
                    {typeof s.episodes === 'number' && <div className="meta-chip">{s.episodes} eps</div>}
                    {genres.map(g => <div key={g} className="meta-chip">{g}</div>)}
                  </div>
                  <div className="chev">›</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}