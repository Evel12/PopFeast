import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../api/base.js';

function useFetchList(url){
  const [data,setData] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  useEffect(()=>{
    let alive = true;
    setLoading(true);
    fetch(url)
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j=>{ if(alive) { setData(j||[]); setError(null);} })
      .catch(e=>{ if(alive) setError(e); })
      .finally(()=>{ if(alive) setLoading(false); });
    return () => { alive = false; };
  }, [url]);
  return { data, loading, error };
}

function SectionHeader({ title, to }){
  return (
    <div className="home-section-header">
      <h3>{title}</h3>
      {to && <Link to={to} className="home-more-link">See all →</Link>}
    </div>
  );
}

function Carousel({ items, itemType, onHoverChange }){
  // Duplicate list for seamless loop
  const marqueeItems = useMemo(()=> items && items.length ? [...items, ...items] : [], [items]);
  return (
    <div className="carousel" onMouseEnter={()=>onHoverChange && onHoverChange(true)} onMouseLeave={()=>onHoverChange && onHoverChange(false)}>
      <div className="carousel-marquee" aria-label={`${itemType} carousel`}>
        {marqueeItems.map((it, idx) => (
          <Link key={`${itemType}-${it.id}-${idx}`} to={`/${itemType === 'movie' ? 'movies' : 'series'}/${it.id}`} className="carousel-card">
            <div className="carousel-thumb poster-frame">
              {it.poster_url ? <img src={it.poster_url} alt={it.title} loading="lazy" /> : <div className="media-thumb-fallback">{(it.title||'?').charAt(0).toUpperCase()}</div>}
            </div>
            <div className="carousel-meta">
              <div className="carousel-title" title={it.title}>{it.title}</div>
              <div className="carousel-sub">
                {itemType==='movie' ? (
                  <>{it.year ?? '—'} • {(it.duration_minutes??'—')}m • {(it.rating ?? 'NR')}</>
                ) : (
                  <>{(it.seasons??'—')} seasons • {(it.episodes??'—')} eps • {(it.rating ?? 'NR')}</>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home(){
  const { data: movies } = useFetchList(apiUrl('/api/movies'));
  const { data: series } = useFetchList(apiUrl('/api/series'));
  const [focus, setFocus] = useState(null);

  // Sort lists by rating descending before slicing for carousels
  const sortedMovies = useMemo(()=> (movies||[]).slice().sort((a,b)=> (b.rating??-Infinity)-(a.rating??-Infinity)), [movies]);
  const sortedSeries = useMemo(()=> (series||[]).slice().sort((a,b)=> (b.rating??-Infinity)-(a.rating??-Infinity)), [series]);

  return (
    <div className={`home ${focus ? 'blur-active' : ''}`}>
      <section className="home-hero fade-container">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1 className="hero-title-anim">Discover What You Want</h1>
            <p className="muted hero-desc-anim">Fresh picks across movies and series.</p>
          </div>
        </div>
      </section>

      <section className={`home-section ${focus==='movies' ? 'focus-section' : ''}`}>
        <SectionHeader title="Top Rated Movies" to="/movies" />
        <Carousel items={sortedMovies.slice(0,20)} itemType="movie" onHoverChange={(v)=> setFocus(v ? 'movies' : null)} />
      </section>

      <section className={`home-section ${focus==='series' ? 'focus-section' : ''}`}>
        <SectionHeader title="Top Rated Series" to="/series" />
        <Carousel items={sortedSeries.slice(0,20)} itemType="series" onHoverChange={(v)=> setFocus(v ? 'series' : null)} />
      </section>
    </div>
  );
}
