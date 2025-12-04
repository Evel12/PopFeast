import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MOCK_MODE = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;
const supabase = (!MOCK_MODE) ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const norm = v => v === '' ? null : v;
const parseGenres = input => {
  if (Array.isArray(input)) return input.map(s => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

const mockData = {
  movies: [
    { id:'m1', title:'Mock Movie', year:2024, genres:['Action','Sci-Fi'], rating:8.2, poster_url:'', duration_minutes:120, description:'Mock description', created_at:new Date().toISOString() }
  ],
  series: [
    { id:'s1', title:'Mock Series', seasons:2, episodes:16, genres:['Drama'], rating:7.5, poster_url:'', description:'Mock series', created_at:new Date().toISOString() }
  ],
  favorites: [ /* { item_id:'m1', item_type:'movie' } */ ],
  comments: [ /* { id, item_id, item_type, rating, content, created_at } */ ]
};

app.get('/api/meta/genres', async (_req,res)=>{
  if (MOCK_MODE) {
    const set = new Set();
    mockData.movies.forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
    mockData.series.forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
    return res.json({ genres: Array.from(set).sort((a,b)=>a.localeCompare(b)) });
  }
  const [m,s] = await Promise.all([
    supabase.from('movies').select('genres'),
    supabase.from('series').select('genres')
  ]);
  if (m.error) return res.status(500).json({error:m.error.message});
  if (s.error) return res.status(500).json({error:s.error.message});
  const set = new Set();
  (m.data||[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
  (s.data||[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
  res.json({ genres: Array.from(set).sort((a,b)=>a.localeCompare(b)) });
});

app.get('/api/movies', async (_req, res) => {
  if (MOCK_MODE) return res.json(mockData.movies);
  const { data, error } = await supabase
    .from('movies')
    .select('id,title,year,genres,rating,poster_url,duration_minutes,description,created_at')
    .order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.get('/api/movies/:id', async (req,res)=>{
  const { data, error } = await supabase.from('movies').select('*').eq('id',req.params.id).single();
  if(error||!data) return res.status(404).json({error:error?.message||'Not found'});
  res.json(data);
});
app.post('/api/movies', async (req,res)=>{
  const { title, year, genres, description, rating, poster_url, duration_minutes } = req.body;
  if(!title || !String(title).trim()) return res.status(400).json({error:'title required'});
  const gArr = parseGenres(genres);
  const insertObj = {
    title:String(title).trim(),
    year: year!=='' && year!=null ? Number(year):null,
    genres: gArr,
    description: norm(description),
    rating: rating!=='' && rating!=null? Number(rating):null,
    poster_url: norm(poster_url),
    duration_minutes: duration_minutes!=='' && duration_minutes!=null? Number(duration_minutes):null
  };
  const { data, error } = await supabase.from('movies').insert(insertObj).select().single();
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.patch('/api/movies/:id', async (req,res)=>{
  const { title, year, genres, description, rating, poster_url, duration_minutes } = req.body;
  const updateObj = {};
  if(title!==undefined) updateObj.title = String(title).trim();
  if(year!==undefined) updateObj.year = year!=='' && year!=null? Number(year):null;
  if(genres!==undefined) updateObj.genres = parseGenres(genres);
  if(description!==undefined) updateObj.description = norm(description);
  if(rating!==undefined) updateObj.rating = rating!=='' && rating!=null? Number(rating):null;
  if(poster_url!==undefined) updateObj.poster_url = norm(poster_url);
  if(duration_minutes!==undefined) updateObj.duration_minutes = duration_minutes!=='' && duration_minutes!=null? Number(duration_minutes):null;
  const { data, error } = await supabase.from('movies').update(updateObj).eq('id',req.params.id).select().single();
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.delete('/api/movies/:id', async (req,res)=>{
  const { error } = await supabase.from('movies').delete().eq('id',req.params.id);
  if(error) return res.status(500).json({error:error.message});
  res.json({status:'ok'});
});

app.get('/api/series', async (_req, res) => {
  if (MOCK_MODE) return res.json(mockData.series);
  const { data, error } = await supabase
    .from('series')
    .select('id,title,seasons,episodes,genres,rating,poster_url,description,created_at')
    .order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.get('/api/series/:id', async (req,res)=>{
  const { data, error } = await supabase.from('series').select('*').eq('id',req.params.id).single();
  if(error||!data) return res.status(404).json({error:error?.message||'Not found'});
  res.json(data);
});
app.post('/api/series', async (req,res)=>{
  const { title, seasons, episodes, genres, description, rating, poster_url } = req.body;
  if(!title || !String(title).trim()) return res.status(400).json({error:'title required'});
  const gArr = parseGenres(genres);
  const insertObj = {
    title:String(title).trim(),
    seasons: seasons!=='' && seasons!=null? Number(seasons):null,
    episodes: episodes!=='' && episodes!=null? Number(episodes):null,
    genres:gArr,
    description: norm(description),
    rating: rating!=='' && rating!=null? Number(rating):null,
    poster_url: norm(poster_url)
  };
  const { data, error } = await supabase.from('series').insert(insertObj).select().single();
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.patch('/api/series/:id', async (req,res)=>{
  const { title, seasons, episodes, genres, description, rating, poster_url } = req.body;
  const updateObj = {};
  if(title!==undefined) updateObj.title = String(title).trim();
  if(seasons!==undefined) updateObj.seasons = seasons!=='' && seasons!=null? Number(seasons):null;
  if(episodes!==undefined) updateObj.episodes = episodes!=='' && episodes!=null? Number(episodes):null;
  if(genres!==undefined) updateObj.genres = parseGenres(genres);
  if(description!==undefined) updateObj.description = norm(description);
  if(rating!==undefined) updateObj.rating = rating!=='' && rating!=null? Number(rating):null;
  if(poster_url!==undefined) updateObj.poster_url = norm(poster_url);
  const { data, error } = await supabase.from('series').update(updateObj).eq('id',req.params.id).select().single();
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.delete('/api/series/:id', async (req,res)=>{
  const { error } = await supabase.from('series').delete().eq('id',req.params.id);
  if(error) return res.status(500).json({error:error.message});
  res.json({status:'ok'});
});

app.get('/api/movies/:id/comments', async (req,res)=>{
  if (MOCK_MODE) {
    const list = mockData.comments.filter(c=>c.item_type==='movie' && c.item_id===req.params.id).sort((a,b)=>b.created_at.localeCompare(a.created_at));
    return res.json(list);
  }
  const { data, error } = await supabase.from('comments').select('id,rating,content,created_at,username').eq('item_id',req.params.id).eq('item_type','movie').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.post('/api/movies/:id/comments', async (req,res)=>{
  const { rating, content, username } = req.body;
  if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
  if (MOCK_MODE) {
    const c = { id:'c'+Date.now(), item_id:req.params.id, item_type:'movie', rating:Number(rating), content:String(content), created_at:new Date().toISOString() };
    mockData.comments.push(c);
    // recompute rating
    const avg = mockData.comments.filter(x=>x.item_type==='movie' && x.item_id===req.params.id).reduce((a,x)=>a+x.rating,0)/mockData.comments.filter(x=>x.item_type==='movie' && x.item_id===req.params.id).length;
    mockData.movies = mockData.movies.map(m=> m.id===req.params.id ? {...m, rating: Number(avg.toFixed(1))}: m);
    return res.json(c);
  }
  const insert = await supabase.from('comments').insert({
    item_id:req.params.id,item_type:'movie',rating:Number(rating),content:String(content),user_id:null,username: username ? String(username).slice(0,40) : null
  }).select().single();
  if(insert.error) return res.status(500).json({error:insert.error.message});
  // recompute avg rating
  const avgQ = await supabase.from('comments').select('rating').eq('item_id',req.params.id).eq('item_type','movie');
  if(!avgQ.error){
    const ratings = (avgQ.data||[]).map(r=>r.rating).filter(r=>typeof r==='number');
    if (ratings.length){
      const avg = ratings.reduce((a,v)=>a+v,0)/ratings.length;
      await supabase.from('movies').update({rating: Number(avg.toFixed(1))}).eq('id',req.params.id);
    }
  }
  res.json(insert.data);
});
app.get('/api/series/:id/comments', async (req,res)=>{
  if (MOCK_MODE) {
    const list = mockData.comments.filter(c=>c.item_type==='series' && c.item_id===req.params.id).sort((a,b)=>b.created_at.localeCompare(a.created_at));
    return res.json(list);
  }
  const { data, error } = await supabase.from('comments').select('id,rating,content,created_at,username').eq('item_id',req.params.id).eq('item_type','series').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.post('/api/series/:id/comments', async (req,res)=>{
  const { rating, content, username } = req.body;
  if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
  if (MOCK_MODE) {
    const c = { id:'c'+Date.now(), item_id:req.params.id, item_type:'series', rating:Number(rating), content:String(content), created_at:new Date().toISOString() };
    mockData.comments.push(c);
    const avg = mockData.comments.filter(x=>x.item_type==='series' && x.item_id===req.params.id).reduce((a,x)=>a+x.rating,0)/mockData.comments.filter(x=>x.item_type==='series' && x.item_id===req.params.id).length;
    mockData.series = mockData.series.map(s=> s.id===req.params.id ? {...s, rating: Number(avg.toFixed(1))}: s);
    return res.json(c);
  }
  const insert = await supabase.from('comments').insert({
    item_id:req.params.id,item_type:'series',rating:Number(rating),content:String(content),user_id:null,username: username ? String(username).slice(0,40) : null
  }).select().single();
  if(insert.error) return res.status(500).json({error:insert.error.message});
  const avgQ = await supabase.from('comments').select('rating').eq('item_id',req.params.id).eq('item_type','series');
  if(!avgQ.error){
    const ratings = (avgQ.data||[]).map(r=>r.rating).filter(r=>typeof r==='number');
    if (ratings.length){
      const avg = ratings.reduce((a,v)=>a+v,0)/ratings.length;
      await supabase.from('series').update({rating: Number(avg.toFixed(1))}).eq('id',req.params.id);
    }
  }
  res.json(insert.data);
});

app.get('/api/search', async (req,res)=>{
  const type = (req.query.type || 'movie').toString();
  const query = (req.query.query || '').toString().trim();
  const order = (req.query.order || 'desc').toString().toLowerCase()==='asc'?'asc':'desc';
  const selectedGenres = parseGenres(req.query.genres || []);
  const sort = (req.query.sort || 'rating').toString();
  const asc = order==='asc';

  const build = (tbl, fields, extraSortMap) => {
    if (MOCK_MODE) {
      let arr = tbl==='movies'? mockData.movies.slice(): mockData.series.slice();
      if (query) arr = arr.filter(r => String(r.title).toLowerCase().includes(query.toLowerCase()));
      if (selectedGenres.length) arr = arr.filter(r => selectedGenres.every(g => (r.genres||[]).includes(g)));
      const sortMap = {
        title: r => String(r.title).toLowerCase(),
        rating: r => r.rating ?? -Infinity,
        year: r => r.year ?? -Infinity,
        duration_minutes: r => r.duration_minutes ?? -Infinity,
        seasons: r => r.seasons ?? -Infinity,
        episodes: r => r.episodes ?? -Infinity,
        genres: r => (r.genres||[]).join('|').toLowerCase(),
        created: r => r.created_at
      };
      const keyFn = sortMap[sort] || sortMap.rating;
      arr.sort((a,b)=>{
        const av = keyFn(a); const bv = keyFn(b);
        if (av < bv) return asc? -1: 1; if (av > bv) return asc? 1: -1; return 0;
      });
      return { data: arr };
    }
    let q = supabase.from(tbl).select(fields);
    if (query) q = q.ilike('title', `%${query}%`);
    if (selectedGenres.length) q = q.overlaps('genres', selectedGenres);
    const sortMap = {
      title:'title',
      rating:'rating',
      year:'year',
      duration_minutes:'duration_minutes',
      seasons:'seasons',
      episodes:'episodes',
      genres:'genres',
      created:'created_at',
      ...extraSortMap
    };
    q = q.order(sortMap[sort] || 'rating', { ascending: asc, nullsFirst: asc });
    return q;
  };

  try {
    if (type==='movie') {
      const { data, error } = await build('movies','id,title,year,genres,rating,poster_url,duration_minutes','');
      if (error) return res.status(500).json({error:error.message});
      return res.json({ items:data, type:'movie' });
    } else if (type==='series') {
      const { data, error } = await build('series','id,title,seasons,episodes,genres,rating,poster_url','');
      if (error) return res.status(500).json({error:error.message});
      return res.json({ items:data, type:'series' });
    } else {
      const [m,s] = MOCK_MODE
        ? [{ data: mockData.movies }, { data: mockData.series }]
        : await Promise.all([
            build('movies','id,title,year,genres,rating,poster_url,duration_minutes',''),
            build('series','id,title,seasons,episodes,genres,rating,poster_url','')
          ]);
      if (!MOCK_MODE) {
        if (m.error) return res.status(500).json({error:m.error.message});
        if (s.error) return res.status(500).json({error:s.error.message});
      }
      const items = [
        ...(m.data||[]).map(x=>({...x,type:'movie'})),
        ...(s.data||[]).map(x=>({...x,type:'series'}))
      ];
      return res.json({ items, type:'all' });
    }
  } catch(e){
    return res.status(500).json({error:e.message});
  }
});

// Favorites endpoints
app.get('/api/favorites', async (_req,res)=>{
  if (MOCK_MODE) return res.json(mockData.favorites);
  const { data, error } = await supabase.from('favorites').select('item_id,item_type,created_at');
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.post('/api/favorites/toggle', async (req,res)=>{
  const { item_id, item_type } = req.body;
  if(!item_id || !item_type) return res.status(400).json({error:'item_id & item_type required'});
  if(!['movie','series'].includes(item_type)) return res.status(400).json({error:'invalid item_type'});
  if (MOCK_MODE) {
    const idx = mockData.favorites.findIndex(f=>f.item_id===item_id && f.item_type===item_type);
    if (idx>=0){ mockData.favorites.splice(idx,1); return res.json({status:'removed'}); }
    mockData.favorites.push({ item_id, item_type, created_at:new Date().toISOString() });
    return res.json({status:'added'});
  }
  // check if exists
  const existQ = await supabase.from('favorites').select('id').eq('item_id',item_id).eq('item_type',item_type).limit(1);
  if(existQ.error) return res.status(500).json({error:existQ.error.message});
  if(existQ.data && existQ.data.length){
    const del = await supabase.from('favorites').delete().eq('item_id',item_id).eq('item_type',item_type);
    if(del.error) return res.status(500).json({error:del.error.message});
    return res.json({status:'removed'});
  } else {
    const ins = await supabase.from('favorites').insert({ item_id, item_type }).select().single();
    if(ins.error) return res.status(500).json({error:ins.error.message});
    return res.json({status:'added'});
  }
});

app.get('/api/health', (_req,res)=>res.json({status:'ok'}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>{
  console.log('API berjalan di port', PORT);
  if (MOCK_MODE) {
    console.log('[API] Running in MOCK mode. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env to use Supabase.');
  }
});
