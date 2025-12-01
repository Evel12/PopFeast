import React,{useEffect,useState} from 'react';
import { useParams } from 'react-router-dom';
import { useFetchDetail } from '../hooks/useFetchDetail.js';
import { getFavorites,toggleFavorite } from '../utils/favorites.js';

export default function MovieDetail(){
  const { id } = useParams();
  const { data, loading, error } = useFetchDetail('movies', id);
  const [fav,setFav]=useState(false);

  useEffect(()=>{ 
    const load = async () => {
      if(!data?.id) return;
      const all = await getFavorites();
      const isFav = all.some(f=>f.item_id===data.id && f.item_type==='movie');
      setFav(isFav);
    };
    load();
  },[data]);

  const handleFav=async ()=>{
    if(!data)return;
    // Optimistic flip
    setFav(prev => !prev);
    toggleFavorite({
      id:data.id,title:data.title,type:'movie',
      poster_url:data.poster_url,rating:data.rating,
      year:data.year,duration_minutes:data.duration_minutes
    }).then(async ()=>{
      const all = await getFavorites();
      const isFav = all.some(f=>f.item_id===data.id && f.item_type==='movie');
      setFav(isFav);
    }).catch(()=>{
      // Offline: keep optimistic state; will reconcile after reconnect
    });
  };

  const [comments,setComments]=useState([]);
  const [cLoading,setCLoading]=useState(true);
  const [rating,setRating]=useState(8);
  const [content,setContent]=useState('');
  const [submitLoading,setSubmitLoading]=useState(false);
  const [username,setUsername]=useState(()=> localStorage.getItem('pf_username') || '');

  useEffect(()=>{
    setCLoading(true);
    fetch(`/api/movies/${id}/comments`)
      .then(r=>r.json()).then(j=>setComments(j))
      .catch(()=>{}).finally(()=>setCLoading(false));
  },[id]);

  const addComment=e=>{
    e.preventDefault();
    if(!content.trim())return;
    localStorage.setItem('pf_username', username);
    setSubmitLoading(true);
    fetch(`/api/movies/${id}/comments`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({rating:Number(rating),content,username: username || null})
    }).then(r=>r.json()).then(j=>{
      setComments(prev=>[j,...prev]);setContent('');
    }).finally(()=>setSubmitLoading(false));
  };

  if(loading) return <div className="detail"><div className="skeleton" style={{height:34,width:'50%',borderRadius:10}}/></div>;
  if(error) return <p className="muted">Error: {error}</p>;
  if(!data) return <p className="muted">Tidak ditemukan</p>;

  const avg = data.rating ? Number(data.rating).toFixed(1) : '0.0';
  const genres = data.genres || [];

  return (
    <article className="detail">
      <div className="detail-hero">
        <div className="detail-poster">
          {data.poster_url ? <img src={data.poster_url} alt={data.title}/> :
            <div className="media-thumb-fallback" style={{fontSize:'2.2rem'}}>{(data.title||'?').charAt(0).toUpperCase()}</div>}
        </div>
        <div className="detail-main">
          <h2>{data.title}</h2>
          <div className="detail-meta">
            {data.year && <div className="meta-chip">{data.year}</div>}
            {genres.map(g=> <div key={g} className="meta-chip">{g}</div>)}
            {data.duration_minutes && <div className="meta-chip">{data.duration_minutes} min</div>}
            <div className="avg-rating"><strong>⭐{avg}</strong>/10</div>
          </div>
          <div className="detail-fav-wrap">
            <button onClick={handleFav} className={`detail-fav-btn ${fav?'active':''}`}>
              🍿 {fav?'Favorited':'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>

      {data.description && <p style={{whiteSpace:'pre-wrap',marginTop:18}}>{data.description}</p>}

      <div className="comments-wrap">
        <form className="comment-form form-panel" onSubmit={addComment}>
          <h3>Tambah Komentar & Rating</h3>
          <label className="form-field">Nama / Username
            <input
              className="form-input"
              type="text"
              maxLength={40}
              value={username}
              onChange={e=>setUsername(e.target.value)}
              placeholder="Nama kamu (opsional)"
            />
          </label>
          <label className="form-field">Rating (0-10)
            <input
              className="form-input"
              type="number" min="0" max="10" step="0.1"
              value={rating}
              onChange={e=>setRating(e.target.value)}
              required
            />
          </label>
          <label className="form-field">Komentar
            <textarea
              className="form-textarea"
              rows="4"
              value={content}
              onChange={e=>setContent(e.target.value)}
              placeholder="Pendapatmu..."
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={submitLoading}>
            {submitLoading?'Mengirim...':'Kirim'}
          </button>
        </form>
        <div>
          <h3 style={{margin:'0 0 12px'}}>Komentar</h3>
          {cLoading && <p className="muted">Memuat komentar...</p>}
          {!cLoading && comments.length===0 && <p className="muted">Belum ada komentar.</p>}
          <div className="comment-list">
            {comments.map(c=> (
              <div key={c.id} className="comment-item">
                <div className="top-line">
                  <span>{c.username ? c.username : 'Anon'} • {new Date(c.created_at).toLocaleString()}</span>
                  <div className="comment-rating"><strong>{Number(c.rating).toFixed(1)}</strong>/10</div>
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