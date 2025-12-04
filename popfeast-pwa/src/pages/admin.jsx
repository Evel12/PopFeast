import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api/base.js';

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [tab, setTab] = useState('movies'); // 'movies' | 'series'
  const [pageSize, setPageSize] = useState(10);
  const [moviePage, setMoviePage] = useState(1);
  const [seriesPage, setSeriesPage] = useState(1);
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [movieFilters, setMovieFilters] = useState({ ratingMin:'', ratingMax:'', yearMin:'', yearMax:'', durMin:'', durMax:'' });
  const [seriesFilters, setSeriesFilters] = useState({ ratingMin:'', ratingMax:'', seasonsMin:'', seasonsMax:'', epsMin:'', epsMax:'' });

  const [movieForm, setMovieForm] = useState({
    id: '', title: '', year: '', genres: '', duration_minutes: '', rating: '', poster_url: '', description: ''
  });
  const [seriesForm, setSeriesForm] = useState({
    id: '', title: '', seasons: '', episodes: '', genres: '', rating: '', poster_url: '', description: ''
  });

  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [creatingMovie, setCreatingMovie] = useState(false);
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [error, setError] = useState('');
  const [lastResponse, setLastResponse] = useState('');

  function toArray(s){ return s.split(',').map(x=>x.trim()).filter(Boolean); }

  async function loadMovies() {
    setLoadingMovies(true);
    try {
      const r = await fetch(apiUrl('/api/movies'));
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Gagal memuat movies');
      setMovies(j);
    } catch(e){ setError(e.message); } finally { setLoadingMovies(false); }
  }
  async function loadSeries() {
    setLoadingSeries(true);
    try {
      const r = await fetch(apiUrl('/api/series'));
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Gagal memuat series');
      setSeries(j);
    } catch(e){ setError(e.message); } finally { setLoadingSeries(false); }
  }
  useEffect(()=>{ loadMovies(); loadSeries(); },[]);
  useEffect(()=>{
    const set = new Set();
    (Array.isArray(movies)? movies:[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
    (Array.isArray(series)? series:[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
    setAllGenres(Array.from(set).sort((a,b)=>String(a).localeCompare(String(b))));
  },[movies,series]);

  function handleMovieChange(e){ const {name,value}=e.target; setMovieForm(f=>({...f,[name]:value})); }
  function handleSeriesChange(e){ const {name,value}=e.target; setSeriesForm(f=>({...f,[name]:value})); }

  function validateMovie(p){
    if(!p.title) return 'Judul wajib diisi';
    if(p.year && p.year < 1888) return 'Tahun minimal 1888';
    if(p.rating && (p.rating<0||p.rating>10)) return 'Rating harus 0-10';
    if(p.duration_minutes && p.duration_minutes<=0) return 'Durasi harus > 0';
    return null;
  }
  function validateSeries(p){
    if(!p.title) return 'Judul wajib diisi';
    if(p.seasons && p.seasons<=0) return 'Seasons harus > 0';
    if(p.episodes && p.episodes<0) return 'Episodes tidak boleh negatif';
    if(p.rating && (p.rating<0||p.rating>10)) return 'Rating harus 0-10';
    return null;
  }

  async function submitMovie(e){
    e.preventDefault();
    const isEdit = !!movieForm.id;
    const payload = {
      title: movieForm.title.trim(),
      year: movieForm.year!==''? Number(movieForm.year):null,
      genres: toArray(movieForm.genres),
      description: movieForm.description||null,
      rating: movieForm.rating!==''? Number(movieForm.rating):null,
      poster_url: movieForm.poster_url||null,
      duration_minutes: movieForm.duration_minutes!==''? Number(movieForm.duration_minutes):null
    };
    const vErr = validateMovie(payload);
    if(vErr){ setError(vErr); return; }
    setCreatingMovie(true); setError(''); setLastResponse('');
    try{
      const r = await fetch(isEdit? apiUrl(`/api/movies/${movieForm.id}`):apiUrl('/api/movies'),{
        method:isEdit?'PATCH':'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||(isEdit?'Update movie error':'Insert movie error'));
      if(isEdit) setMovies(m=>m.map(x=>x.id===j.id?j:x)); else setMovies(m=>[j,...m]);
      resetMovieForm();
      setLastResponse(isEdit?'Movie diupdate.':'Movie ditambahkan.');
    }catch(e){ setError(e.message);} finally { setCreatingMovie(false); }
  }

  async function submitSeries(e){
    e.preventDefault();
    const isEdit = !!seriesForm.id;
    const payload = {
      title: seriesForm.title.trim(),
      seasons: seriesForm.seasons!==''? Number(seriesForm.seasons):null,
      episodes: seriesForm.episodes!==''? Number(seriesForm.episodes):null,
      genres: toArray(seriesForm.genres),
      description: seriesForm.description||null,
      rating: seriesForm.rating!==''? Number(seriesForm.rating):null,
      poster_url: seriesForm.poster_url||null
    };
    const vErr = validateSeries(payload);
    if(vErr){ setError(vErr); return; }
    setCreatingSeries(true); setError(''); setLastResponse('');
    try{
      const r = await fetch(isEdit? apiUrl(`/api/series/${seriesForm.id}`):apiUrl('/api/series'),{
        method:isEdit?'PATCH':'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||(isEdit?'Update series error':'Insert series error'));
      if(isEdit) setSeries(s=>s.map(x=>x.id===j.id?j:x)); else setSeries(s=>[j,...s]);
      resetSeriesForm();
      setLastResponse(isEdit?'Series diupdate.':'Series ditambahkan.');
    }catch(e){ setError(e.message);} finally { setCreatingSeries(false); }
  }

  async function deleteMovie(id){
    if(!confirm('Hapus movie ini?')) return;
    try{
      const r = await fetch(apiUrl(`/api/movies/${id}`),{method:'DELETE'});
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Delete movie error');
      setMovies(m=>m.filter(x=>x.id!==id));
      setLastResponse('Movie dihapus');
    }catch(e){ setError(e.message); }
  }

  async function deleteSeries(id){
    if(!confirm('Hapus series ini?')) return;
    try{
      const r = await fetch(apiUrl(`/api/series/${id}`),{method:'DELETE'});
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Delete series error');
      setSeries(s=>s.filter(x=>x.id!==id));
      setLastResponse('Series dihapus');
    }catch(e){ setError(e.message); }
  }

  function beginEditMovie(m){
    setMovieForm({
      id:m.id,
      title:m.title||'',
      year:m.year??'',
      genres:Array.isArray(m.genres)? m.genres.join(', '):'',
      duration_minutes:m.duration_minutes??'',
      rating:m.rating??'',
      poster_url:m.poster_url||'',
      description:m.description||''
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function beginEditSeries(s){
    setSeriesForm({
      id:s.id,
      title:s.title||'',
      seasons:s.seasons??'',
      episodes:s.episodes??'',
      genres:Array.isArray(s.genres)? s.genres.join(', '):'',
      rating:s.rating??'',
      poster_url:s.poster_url||'',
      description:s.description||''
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function resetMovieForm(){
    setMovieForm({id:'',title:'',year:'',genres:'',duration_minutes:'',rating:'',poster_url:'',description:''});
  }
  function resetSeriesForm(){
    setSeriesForm({id:'',title:'',seasons:'',episodes:'',genres:'',rating:'',poster_url:'',description:''});
  }

  function toggleGenre(g){ setSelectedGenres(prev => prev.includes(g)? prev.filter(x=>x!==g) : [...prev,g]); }
  function clearGenres(){ setSelectedGenres([]); }
  function onMovieFilterChange(e){ const {name,value}=e.target; setMovieFilters(f=>({...f,[name]:value})); setMoviePage(1); }
  function onSeriesFilterChange(e){ const {name,value}=e.target; setSeriesFilters(f=>({...f,[name]:value})); setSeriesPage(1); }
  function onPageSizeChange(e){ const v = Number(e.target.value)||10; setPageSize(v); setMoviePage(1); setSeriesPage(1); }

  const filteredMovies = useMemo(()=>{
    let list = movies.slice();
    if (selectedGenres.length) list = list.filter(m => selectedGenres.every(g => (m.genres||[]).includes(g)));
    const { ratingMin, ratingMax, yearMin, yearMax, durMin, durMax } = movieFilters;
    if (ratingMin!=='') list = list.filter(m => (m.rating ?? -Infinity) >= Number(ratingMin));
    if (ratingMax!=='') list = list.filter(m => (m.rating ?? Infinity) <= Number(ratingMax));
    if (yearMin!=='') list = list.filter(m => (m.year ?? -Infinity) >= Number(yearMin));
    if (yearMax!=='') list = list.filter(m => (m.year ?? Infinity) <= Number(yearMax));
    if (durMin!=='') list = list.filter(m => (m.duration_minutes ?? -Infinity) >= Number(durMin));
    if (durMax!=='') list = list.filter(m => (m.duration_minutes ?? Infinity) <= Number(durMax));
    return list;
  },[movies, selectedGenres, movieFilters]);
  const filteredSeries = useMemo(()=>{
    let list = series.slice();
    if (selectedGenres.length) list = list.filter(s => selectedGenres.every(g => (s.genres||[]).includes(g)));
    const { ratingMin, ratingMax, seasonsMin, seasonsMax, epsMin, epsMax } = seriesFilters;
    if (ratingMin!=='') list = list.filter(s => (s.rating ?? -Infinity) >= Number(ratingMin));
    if (ratingMax!=='') list = list.filter(s => (s.rating ?? Infinity) <= Number(ratingMax));
    if (seasonsMin!=='') list = list.filter(s => (s.seasons ?? -Infinity) >= Number(seasonsMin));
    if (seasonsMax!=='') list = list.filter(s => (s.seasons ?? Infinity) <= Number(seasonsMax));
    if (epsMin!=='') list = list.filter(s => (s.episodes ?? -Infinity) >= Number(epsMin));
    if (epsMax!=='') list = list.filter(s => (s.episodes ?? Infinity) <= Number(epsMax));
    return list;
  },[series, selectedGenres, seriesFilters]);

  const movieTotalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));
  const seriesTotalPages = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
  const moviePaged = useMemo(()=>{
    const start = (moviePage-1)*pageSize; return filteredMovies.slice(start, start+pageSize);
  },[filteredMovies, moviePage, pageSize]);
  const seriesPaged = useMemo(()=>{
    const start = (seriesPage-1)*pageSize; return filteredSeries.slice(start, start+pageSize);
  },[filteredSeries, seriesPage, pageSize]);

  return (
    <section className="section">
      <h2>Admin</h2>
      {error && <p className="form-error">{error}</p>}
      {lastResponse && <p className="form-success">{lastResponse}</p>}
      <div className="tabs" style={{marginBottom:12}}>
        <button className={`tab ${tab==='movies'?'active':''}`} onClick={()=>setTab('movies')}>Movies</button>
        <button className={`tab ${tab==='series'?'active':''}`} onClick={()=>setTab('series')}>Series</button>
      </div>
      <div className="filters-panel form-panel" style={{marginBottom:16}}>
        <h4>Filter</h4>
        <div className="form-fields" style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:12}}>
          <div>
            <label className="form-field">Genres</label>
            <div className="chips" style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {allGenres.map(g=> (
                <button key={g} type="button" className={`meta-chip ${selectedGenres.includes(g)?'active':''}`} onClick={()=>toggleGenre(g)}>{g}</button>
              ))}
              {allGenres.length===0 && <span className="muted">Tidak ada genres</span>}
            </div>
            {selectedGenres.length>0 && <button type="button" className="btn-mini" style={{marginTop:8}} onClick={clearGenres}>Clear Genres</button>}
          </div>
          {tab==='movies' ? (
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:8}}>
              <label className="form-field">Rating Min
                <input className="form-input" type="number" step="0.1" name="ratingMin" value={movieFilters.ratingMin} onChange={onMovieFilterChange} />
              </label>
              <label className="form-field">Rating Max
                <input className="form-input" type="number" step="0.1" name="ratingMax" value={movieFilters.ratingMax} onChange={onMovieFilterChange} />
              </label>
              <label className="form-field">Year Min
                <input className="form-input" type="number" name="yearMin" value={movieFilters.yearMin} onChange={onMovieFilterChange} />
              </label>
              <label className="form-field">Year Max
                <input className="form-input" type="number" name="yearMax" value={movieFilters.yearMax} onChange={onMovieFilterChange} />
              </label>
              <label className="form-field">Duration Min
                <input className="form-input" type="number" name="durMin" value={movieFilters.durMin} onChange={onMovieFilterChange} />
              </label>
              <label className="form-field">Duration Max
                <input className="form-input" type="number" name="durMax" value={movieFilters.durMax} onChange={onMovieFilterChange} />
              </label>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:8}}>
              <label className="form-field">Rating Min
                <input className="form-input" type="number" step="0.1" name="ratingMin" value={seriesFilters.ratingMin} onChange={onSeriesFilterChange} />
              </label>
              <label className="form-field">Rating Max
                <input className="form-input" type="number" step="0.1" name="ratingMax" value={seriesFilters.ratingMax} onChange={onSeriesFilterChange} />
              </label>
              <label className="form-field">Seasons Min
                <input className="form-input" type="number" name="seasonsMin" value={seriesFilters.seasonsMin} onChange={onSeriesFilterChange} />
              </label>
              <label className="form-field">Seasons Max
                <input className="form-input" type="number" name="seasonsMax" value={seriesFilters.seasonsMax} onChange={onSeriesFilterChange} />
              </label>
              <label className="form-field">Episodes Min
                <input className="form-input" type="number" name="epsMin" value={seriesFilters.epsMin} onChange={onSeriesFilterChange} />
              </label>
              <label className="form-field">Episodes Max
                <input className="form-input" type="number" name="epsMax" value={seriesFilters.epsMax} onChange={onSeriesFilterChange} />
              </label>
            </div>
          )}
          <div>
            <label className="form-field">Page Size
              <select className="form-input" value={pageSize} onChange={onPageSizeChange}>
                {[8,10,12,16,20,24].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="form-panel">
          <h3>{movieForm.id?'Edit Movie':'Tambah Movie'}</h3>
          <form onSubmit={submitMovie} className="form-fields">
            <label className="form-field">Judul
              <input className="form-input" name="title" value={movieForm.title} onChange={handleMovieChange} required />
            </label>
            <label className="form-field">Tahun 
              <input className="form-input" type="number" min="1888" name="year" value={movieForm.year} onChange={handleMovieChange} />
            </label>
            <label className="form-field">Genres (koma)
              <input className="form-input" name="genres" value={movieForm.genres} onChange={handleMovieChange} placeholder="Action, Sci-Fi" />
            </label>
            <label className="form-field">Durasi (menit)
              <input className="form-input" type="number" min="1" name="duration_minutes" value={movieForm.duration_minutes} onChange={handleMovieChange} />
            </label>
            <label className="form-field">Rating (0-10)
              <input className="form-input" type="number" step="0.1" min="0" max="10" name="rating" value={movieForm.rating} onChange={handleMovieChange} />
            </label>
            <label className="form-field">Poster URL
              <input className="form-input" name="poster_url" value={movieForm.poster_url} onChange={handleMovieChange} placeholder="https://..." />
            </label>
            <label className="form-field">Deskripsi
              <textarea className="form-textarea" name="description" rows="3" value={movieForm.description} onChange={handleMovieChange} />
            </label>
            <div className="form-buttons">
              <button className="btn-primary" type="submit" disabled={creatingMovie}>
                {creatingMovie ? (movieForm.id?'Mengupdate...':'Menambahkan...') : (movieForm.id?'Update Movie':'Tambah Movie')}
              </button>
              {movieForm.id && <button type="button" className="btn-secondary" onClick={resetMovieForm}>Batal Edit</button>}
            </div>
          </form>
        </div>

        {tab==='movies' && (
        <div className="list-panel">
          <h4>Daftar Movie</h4>
          {loadingMovies && <p className="muted">Memuat movies...</p>}
          <div className="list-stack">
            {moviePaged.map(m=>{
              const genresDisplay = (m.genres||[]).length? (m.genres||[]).join(', '):'No Genres';
              return (
                <div key={m.id} className="list-item">
                  <div className="list-item-header">
                    <strong>{m.title}</strong>
                    <div className="list-item-actions">
                      <button className="btn-mini" onClick={()=>beginEditMovie(m)}>Edit</button>
                      <button className="btn-mini danger" onClick={()=>deleteMovie(m.id)}>Hapus</button>
                    </div>
                  </div>
                  <div className="list-item-meta">
                    {m.year || '—'} • {genresDisplay} • {m.duration_minutes? `${m.duration_minutes} min`:'No Durasi'} • {m.rating ?? 'NR'}
                  </div>
                  {m.poster_url && <div className="list-url">{m.poster_url}</div>}
                </div>
              );
            })}
            {(!loadingMovies && filteredMovies.length===0) && <p className="muted">Tidak ada movie sesuai filter.</p>}
          </div>
          <div className="pager" style={{marginTop:12}}>
            <button className="pager-btn" disabled={moviePage<=1} onClick={()=>setMoviePage(Math.max(1,moviePage-1))}>Prev</button>
            <span className="pager-info">Page {moviePage} / {movieTotalPages}</span>
            <button className="pager-btn" disabled={moviePage>=movieTotalPages} onClick={()=>setMoviePage(Math.min(movieTotalPages,moviePage+1))}>Next</button>
          </div>
        </div>
        )}

        <div className="form-panel">
          <h3>{seriesForm.id?'Edit Series':'Tambah Series'}</h3>
          <form onSubmit={submitSeries} className="form-fields">
            <label className="form-field">Judul
              <input className="form-input" name="title" value={seriesForm.title} onChange={handleSeriesChange} required />
            </label>
            <label className="form-field">Seasons 
              <input className="form-input" type="number" min="1" name="seasons" value={seriesForm.seasons} onChange={handleSeriesChange} />
            </label>
            <label className="form-field">Episodes 
              <input className="form-input" type="number" min="0" name="episodes" value={seriesForm.episodes} onChange={handleSeriesChange} />
            </label>
            <label className="form-field">Genres (koma)
              <input className="form-input" name="genres" value={seriesForm.genres} onChange={handleSeriesChange} placeholder="Drama, Fantasy" />
            </label>
            <label className="form-field">Rating (0-10)
              <input className="form-input" type="number" step="0.1" min="0" max="10" name="rating" value={seriesForm.rating} onChange={handleSeriesChange} />
            </label>
            <label className="form-field">Poster URL
              <input className="form-input" name="poster_url" value={seriesForm.poster_url} onChange={handleSeriesChange} placeholder="https://..." />
            </label>
            <label className="form-field">Deskripsi
              <textarea className="form-textarea" name="description" rows="3" value={seriesForm.description} onChange={handleSeriesChange} />
            </label>
            <div className="form-buttons">
              <button className="btn-primary" type="submit" disabled={creatingSeries}>
                {creatingSeries ? (seriesForm.id?'Mengupdate...':'Menambahkan...') : (seriesForm.id?'Update Series':'Tambah Series')}
              </button>
              {seriesForm.id && <button type="button" className="btn-secondary" onClick={resetSeriesForm}>Batal Edit</button>}
            </div>
          </form>
        </div>

        {tab==='series' && (
        <div className="list-panel">
          <h4>Daftar Series</h4>
          {loadingSeries && <p className="muted">Memuat series...</p>}
          <div className="list-stack">
            {seriesPaged.map(s=>{
              const genresDisplay = (s.genres||[]).length? (s.genres||[]).join(', '):'No Genres';
              return (
                <div key={s.id} className="list-item">
                  <div className="list-item-header">
                    <strong>{s.title}</strong>
                    <div className="list-item-actions">
                      <button className="btn-mini" onClick={()=>beginEditSeries(s)}>Edit</button>
                      <button className="btn-mini danger" onClick={()=>deleteSeries(s.id)}>Hapus</button>
                    </div>
                  </div>
                  <div className="list-item-meta">
                    {s.seasons? `${s.seasons} seasons`:'—'} • {s.episodes? `${s.episodes} eps`:'—'} • {genresDisplay} • {s.rating ?? 'NR'}
                  </div>
                  {s.poster_url && <div className="list-url">{s.poster_url}</div>}
                </div>
              );
            })}
            {(!loadingSeries && filteredSeries.length===0) && <p className="muted">Tidak ada series sesuai filter.</p>}
          </div>
          <div className="pager" style={{marginTop:12}}>
            <button className="pager-btn" disabled={seriesPage<=1} onClick={()=>setSeriesPage(Math.max(1,seriesPage-1))}>Prev</button>
            <span className="pager-info">Page {seriesPage} / {seriesTotalPages}</span>
            <button className="pager-btn" disabled={seriesPage>=seriesTotalPages} onClick={()=>setSeriesPage(Math.min(seriesTotalPages,seriesPage+1))}>Next</button>
          </div>
        </div>
        )}

      </div>
    </section>
  );
}