import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const norm = v => v === '' ? null : v;
const parseGenres = input => {
  if (Array.isArray(input)) return input.map(s => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

/* META GENRES */
app.get('/api/meta/genres', async (_req,res)=>{
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

/* MOVIES */
app.get('/api/movies', async (_req, res) => {
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

/* SERIES */
app.get('/api/series', async (_req, res) => {
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

/* COMMENTS */
app.get('/api/movies/:id/comments', async (req,res)=>{
  const { data, error } = await supabase.from('comments').select('id,rating,content,created_at').eq('item_id',req.params.id).eq('item_type','movie').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.post('/api/movies/:id/comments', async (req,res)=>{
  const { rating, content } = req.body;
  if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
  const { data, error } = await supabase.from('comments').insert({
    item_id:req.params.id,item_type:'movie',rating:Number(rating),content:String(content),user_id:null
  }).select().single();
  if(error) return res.status(500).json({error:error.message});
  await supabase.rpc('recalc_movie_rating',{movie_id_input:req.params.id}).catch(()=>{});
  res.json(data);
});
app.get('/api/series/:id/comments', async (req,res)=>{
  const { data, error } = await supabase.from('comments').select('id,rating,content,created_at').eq('item_id',req.params.id).eq('item_type','series').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});
app.post('/api/series/:id/comments', async (req,res)=>{
  const { rating, content } = req.body;
  if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
  const { data, error } = await supabase.from('comments').insert({
    item_id:req.params.id,item_type:'series',rating:Number(rating),content:String(content),user_id:null
  }).select().single();
  if(error) return res.status(500).json({error:error.message});
  await supabase.rpc('recalc_series_rating',{series_id_input:req.params.id}).catch(()=>{});
  res.json(data);
});

/* META SEARCH (genres filter & sorting) */
app.get('/api/search', async (req,res)=>{
  const type = (req.query.type || 'movie').toString();
  const query = (req.query.query || '').toString().trim();
  const order = (req.query.order || 'desc').toString().toLowerCase()==='asc'?'asc':'desc';
  const selectedGenres = parseGenres(req.query.genres || []);
  const sort = (req.query.sort || 'rating').toString();
  const asc = order==='asc';

  const build = (tbl, fields, extraSortMap) => {
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
      const [m,s] = await Promise.all([
        build('movies','id,title,year,genres,rating,poster_url,duration_minutes',''),
        build('series','id,title,seasons,episodes,genres,rating,poster_url','')
      ]);
      if (m.error) return res.status(500).json({error:m.error.message});
      if (s.error) return res.status(500).json({error:s.error.message});
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

app.get('/api/health', (_req,res)=>res.json({status:'ok'}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('API berjalan di port', PORT));