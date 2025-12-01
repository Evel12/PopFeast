import { supabase, MOCK_MODE, mockData, parseJson } from '../_supabase.js';
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
  if(MOCK_MODE){
    const idx = mockData.favorites.findIndex(f=>f.item_id===item_id && f.item_type===item_type);
    if(idx>=0) mockData.favorites.splice(idx,1);
    return res.status(200).json({status:'removed'});
  }
  const del = await supabase.from('favorites').delete().eq('item_id',item_id).eq('item_type',item_type);
  if(del.error) return res.status(500).json({error:del.error.message});
  return res.status(200).json({status:'removed'});
}
