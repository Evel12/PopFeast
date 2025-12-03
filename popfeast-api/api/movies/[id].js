import { supabase, parseJson } from '../_supabase.js';
import { applyCors } from '../_cors.js';

export default async function handler(req, res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const { id } = req.query;
  if(req.method === 'GET'){
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    const { data, error } = await supabase.from('movies').select('*').eq('id',id).single();
    if(error || !data) return res.status(404).json({error:error?.message||'Not found'});
    return res.status(200).json(data);
  }
  if(req.method === 'PATCH'){
    const body = await parseJson(req);
    const updateObj = {};
    ['title','year','genres','description','rating','poster_url','duration_minutes'].forEach(k=>{
      if(body[k] !== undefined){ updateObj[k] = body[k]; }
    });
    const { data, error } = await supabase.from('movies').update(updateObj).eq('id',id).select().single();
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'DELETE'){
    const { error } = await supabase.from('movies').delete().eq('id',id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({status:'ok'});
  }
  return res.status(405).json({error:'method not allowed'});
}
