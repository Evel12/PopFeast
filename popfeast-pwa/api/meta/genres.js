import { supabase, MOCK_MODE, mockData } from '../_supabase.js';

export default async function handler(req, res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method !== 'GET') return res.status(405).json({error:'method not allowed'});
  if(MOCK_MODE){
    const set = new Set();
    mockData.movies.forEach(r=> (r.genres||[]).forEach(g=>set.add(g)));
    mockData.series.forEach(r=> (r.genres||[]).forEach(g=>set.add(g)));
    return res.status(200).json({ genres: Array.from(set).sort((a,b)=>a.localeCompare(b)) });
  }
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
