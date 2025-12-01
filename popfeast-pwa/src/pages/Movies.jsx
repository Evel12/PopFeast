import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetchList } from '../hooks/useFetchList.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';
import { useSearchSort } from '../context/SearchSortContext.jsx';

export default function Movies() {
  const { data, loading, error } = useFetchList('movies');
  const [favSet, setFavSet] = useState(new Set());
  const [pending, setPending] = useState(new Set());
  const { query, sort, order, selectedGenres } = useSearchSort();
  

  useEffect(() => {
    const loadFavs = async () => {
      const all = await getFavorites();
      const set = new Set(all.filter(f=>f.item_type==='movie').map(f=>f.item_id));
      setFavSet(set);
    };
    loadFavs();
  }, [data]);

  const filteredSorted = useMemo(() => {
    let list = data;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q));
    }
    if (selectedGenres.length) {
      list = list.filter(m => {
        const gs = m.genres || [];
        return selectedGenres.every(sel => gs.includes(sel));
      });
    }
    const asc = order === 'asc';
    list = [...list].sort((a, b) => {
      const getVal = (obj) => {
        switch (sort) {
          case 'title': return obj.title?.toLowerCase() || '';
          case 'year': return obj.year || 0;
          case 'duration_minutes': return obj.duration_minutes || 0;
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

  const handleToggle = async (movie, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending.has(movie.id)) return; // prevent spamming/races
    setPending(prev => new Set(prev).add(movie.id));
    // Optimistic update: flip immediately
    const wasFav = favSet.has(movie.id);
    setFavSet(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(movie.id); else next.add(movie.id);
      return next;
    });
    // Fire request in background; reconcile if it fails
    toggleFavorite({
      id: movie.id,
      title: movie.title,
      type: 'movie',
      poster_url: movie.poster_url,
      rating: movie.rating,
      year: movie.year,
      duration_minutes: movie.duration_minutes
    }).then(async () => {
      if (!navigator.onLine) return;
      const all = await getFavorites();
      const set = new Set(all.filter(f=>f.item_type==='movie').map(f=>f.item_id));
      setFavSet(set);
    }).catch(() => {
      // Offline or failure: keep optimistic state; will reconcile when back online
    }).finally(() => {
      setPending(prev => { const next = new Set(prev); next.delete(movie.id); return next; });
    });
  };

  return (
    <section className="section">
      <h2 style={{marginTop:0}}>Movies</h2>
      {loading && (
        <div className="media-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="media-card">
              <div className="media-thumb skeleton" />
              <div className="media-body">
                <div className="skeleton" style={{height:18,width:'75%',borderRadius:8}} />
                <div className="skeleton" style={{height:12,width:'55%',borderRadius:8,marginTop:10}} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="muted">Error: {error}</p>}
      {!loading && !error && (
        <div className="media-grid">
          {filteredSorted.map(m => {
            const poster = m.poster_url;
            const fav = favSet.has(m.id);
            const genres = (m.genres || []).slice(0,2);
            return (
              <Link to={`/movies/${m.id}`} key={m.id} className="media-card">
                <button
                  className={`fav-btn ${fav ? 'fav-active' : ''}`}
                  aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                  onClick={(e) => handleToggle(m, e)}
                  type="button"
                  disabled={pending.has(m.id)}
                >🍿</button>
                <div className="media-thumb">
                  {poster ? (
                    <img src={poster} alt={m.title} loading="lazy" />
                  ) : (
                    <div className="media-thumb-fallback">
                      {(m.title || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="rating-pill">
                    <span>⭐{(m.rating ?? 0).toFixed(1)}</span>/10
                  </div>
                </div>
                <div className="media-body">
                  <h3 className="card-title">{m.title}</h3>
                  <div className="card-meta">
                    {m.year && <div className="meta-chip">{m.year}</div>}
                    {genres.map(g => <div key={g} className="meta-chip">{g}</div>)}
                    {m.duration_minutes && <div className="meta-chip">{m.duration_minutes} min</div>}
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