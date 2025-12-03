import { supabase, parseJson } from '../_supabase.js';
import { applyCors } from '../_cors.js';

export default async function handler(req,res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if(req.method !== 'POST') return res.status(405).json({error:'method not allowed'});
  const body = await parseJson(req);
  const { item_id, item_type } = body || {};
  if(!item_id || !item_type) return res.status(400).json({error:'item_id & item_type required'});
  if(!['movie','series'].includes(item_type)) return res.status(400).json({error:'invalid item_type'});
  const { data, error } = await supabase.from('favorites').select('id').eq('item_id',item_id).eq('item_type',item_type).limit(1);
  if(error) return res.status(500).json({error:error.message});
  if(data && data.length) return res.status(200).json({status:'added'});
  const ins = await supabase.from('favorites').insert({ item_id, item_type }).select().single();
  if(ins.error) return res.status(500).json({error:ins.error.message});
  return res.status(200).json({status:'added'});
}
