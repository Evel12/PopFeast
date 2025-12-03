import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import { useSearchSort } from '../utils/search.jsx';

export default function LayoutMobile(){
  const loc = useLocation();
  const inMovies = loc.pathname.startsWith('/movies') && !loc.pathname.includes('/movies/');
  const inSeries = loc.pathname.startsWith('/series') && !loc.pathname.includes('/series/');
  const {
    query,setQuery,sort,setSort,order,setOrder,
    MOVIE_SORTS,SERIES_SORTS,
    allGenres,selectedGenres,toggleGenre,clearGenres
  } = useSearchSort();
  const sortOptions = inMovies ? MOVIE_SORTS : inSeries ? SERIES_SORTS : [];
  const filteredGenres = allGenres;
  const [genresOpen, setGenresOpen] = useState(false);
  useEffect(()=>{ if (sort === 'genres') setGenresOpen(true); },[sort]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container app-header-inner" style={{height:70}}>
          <div className="brand">
            <Link to="/" aria-label="Go to Home" className="brand-badge"><img src="/icons/logo.png" alt="PopFeast logo" style={{width:'100%',height:'100%',objectFit:'contain'}} /></Link>
            <div>
              <div style={{fontSize:'1.1rem',fontWeight:700}}>PopFeast</div>
              <div className="muted" style={{fontSize:11,marginTop:2}}>Movies & Series Explorer</div>
            </div>
          </div>
        </div>
        {(inMovies || inSeries) && (
          <div className="subheader" style={{position:'sticky',top:70}}>
            <div className="container">
              <form onSubmit={e=>e.preventDefault()} className="header-search-sort" style={{width:'100%',gap:8}}>
                <input
                  className="header-search-input"
                  placeholder={inMovies?'Search movies...':'Search series...'}
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  style={{flex:1,minWidth:140}}
                />
                <select className="header-select" value={sort} onChange={e=>setSort(e.target.value)}>
                  {sortOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="header-select" value={order} onChange={e=>setOrder(e.target.value)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </form>
            </div>
          </div>
        )}
      </header>
      {genresOpen && sort==='genres' && (
        <div className="genre-overlay" onClick={()=>setGenresOpen(false)} role="dialog" aria-modal="true">
          <div className="genre-modal" onClick={e=>e.stopPropagation()}>
            <div className="genre-modal-header">
              <h3 style={{margin:0}}>Select Genres</h3>
              {selectedGenres.length>0 && (
                <button type="button" className="genre-clear-btn" onClick={clearGenres}>Clear ({selectedGenres.length})</button>
              )}
            </div>
            <div className="genre-chips" role="listbox" aria-label="Select genres">
              {filteredGenres.map(g=>(
                <button
                  key={g}
                  type="button"
                  aria-pressed={selectedGenres.includes(g)}
                  className={`genre-chip ${selectedGenres.includes(g)?'active':''}`}
                  onClick={()=>toggleGenre(g)}
                >{g}</button>
              ))}
              {filteredGenres.length===0 && <div className="genre-empty">No genres loaded.</div>}
            </div>
            <div className="genre-modal-footer">
              <button type="button" className="btn-primary" onClick={()=>setGenresOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
      <main className="container fade-container" style={{padding:'20px 0 120px'}}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
