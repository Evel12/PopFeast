import { supabase, MOCK_MODE, mockData } from '../_supabase.js';
import { applyCors } from '../_cors.js';

export default async function handler(req, res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method !== 'GET') return res.status(405).json({error:'method not allowed'});
  // Favorites must reflect immediate user actions; avoid CDN caching
  res.setHeader('Cache-Control', 'no-store');
  if(MOCK_MODE) return res.status(200).json(mockData.favorites);
  const { data, error } = await supabase.from('favorites').select('item_id,item_type,created_at');
  if(error) return res.status(500).json({error:error.message});
  return res.status(200).json(data);
}
