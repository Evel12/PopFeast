import { supabase, MOCK_MODE, mockData } from '../_supabase.js';

export default async function handler(req, res){
  if(req.method === 'GET'){
    if(MOCK_MODE){ return res.status(200).json(mockData.movies); }
    const { data, error } = await supabase
      .from('movies')
      .select('id,title,year,genres,rating,poster_url,duration_minutes,description,created_at')
      .order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'POST'){
    const { title, year, genres, description, rating, poster_url, duration_minutes } = req.body || {};
    if(!title || !String(title).trim()) return res.status(400).json({error:'title required'});
    const gArr = Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',').map(s=>s.trim()).filter(Boolean) : []);
    const insertObj = {
      title:String(title).trim(),
      year: year!=='' && year!=null ? Number(year):null,
      genres: gArr,
      description: description ?? null,
      rating: rating!=='' && rating!=null? Number(rating):null,
      poster_url: poster_url ?? null,
      duration_minutes: duration_minutes!=='' && duration_minutes!=null? Number(duration_minutes):null
    };
    if(MOCK_MODE){
      const itm = { id:'m'+Date.now(), ...insertObj, created_at:new Date().toISOString() };
      mockData.movies.push(itm); return res.status(200).json(itm);
    }
    const { data, error } = await supabase.from('movies').insert(insertObj).select().single();
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  return res.status(405).json({error:'method not allowed'});
}
