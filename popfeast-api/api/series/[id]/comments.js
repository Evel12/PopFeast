import { supabase, parseJson } from '../../_supabase.js';
import { applyCors } from '../../_cors.js';

export default async function handler(req,res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const { id } = req.query;
  if(req.method === 'GET'){
    res.setHeader('Cache-Control', 'no-store');
    const { data, error } = await supabase.from('comments').select('id,rating,content,created_at,username').eq('item_id',id).eq('item_type','series').order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'POST'){
    const body = await parseJson(req);
    const { rating, content, username } = body || {};
    if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
    const insert = await supabase.from('comments').insert({
      item_id:id,item_type:'series',rating:Number(rating),content:String(content),user_id:null,username: username ? String(username).slice(0,40) : null
    }).select().single();
    if(insert.error) return res.status(500).json({error:insert.error.message});
    const avgQ = await supabase.from('comments').select('rating').eq('item_id',id).eq('item_type','series');
    if(!avgQ.error){
      const ratings = (avgQ.data||[]).map(r=>r.rating).filter(r=>typeof r==='number');
      if(ratings.length){
        const avg = ratings.reduce((a,v)=>a+v,0)/ratings.length;
        await supabase.from('series').update({rating: Number(avg.toFixed(1))}).eq('id',id);
      }
    }
    return res.status(200).json(insert.data);
  }
  return res.status(405).json({error:'method not allowed'});
}
