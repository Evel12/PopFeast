import { supabase, parseJson } from '../_supabase.js';
import { applyCors } from '../_cors.js';

export default async function handler(req, res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method === 'GET'){
    res.setHeader('Cache-Control', 'no-store');
    if(!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data, error } = await supabase
      .from('series')
      .select('id,title,seasons,episodes,genres,rating,poster_url,description,created_at')
      .order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'POST'){
    const body = await parseJson(req);
    const { title, seasons, episodes, genres, description, rating, poster_url } = body || {};
    if(!title || !String(title).trim()) return res.status(400).json({error:'title required'});
    const gArr = Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',').map(s=>s.trim()).filter(Boolean) : []);
    const insertObj = {
      title:String(title).trim(),
      seasons: seasons!=='' && seasons!=null? Number(seasons):null,
      episodes: episodes!=='' && episodes!=null? Number(episodes):null,
      genres:gArr,
      description: description ?? null,
      rating: rating!=='' && rating!=null? Number(rating):null,
      poster_url: poster_url ?? null
    };
    const { data, error } = await supabase.from('series').insert(insertObj).select().single();
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  return res.status(405).json({error:'method not allowed'});
}
