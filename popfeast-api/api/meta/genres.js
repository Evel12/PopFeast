import { supabase } from '../_supabase.js';
import { applyCors } from '../_cors.js';

export default async function handler(req, res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
    if(req.method !== 'GET') return res.status(405).json({error:'method not allowed'});
    res.setHeader('Cache-Control','no-store');
  const [m,s] = await Promise.all([
    supabase.from('movies').select('genres'),
    supabase.from('series').select('genres')
  ]);
  if(m.error) return res.status(500).json({error:m.error.message});
  if(s.error) return res.status(500).json({error:s.error.message});
  const set = new Set();
  (m.data||[]).forEach(r=> (r.genres||[]).forEach(g=>set.add(g)));
  (s.data||[]).forEach(r=> (r.genres||[]).forEach(g=>set.add(g)));
  return res.status(200).json({ genres: Array.from(set).sort((a,b)=>a.localeCompare(b)) });
}
