import { supabase, MOCK_MODE, mockData } from '../_supabase.js';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).json({error:'method not allowed'});
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=120');
  if(MOCK_MODE) return res.status(200).json(mockData.favorites);
  const { data, error } = await supabase.from('favorites').select('item_id,item_type,created_at');
  if(error) return res.status(500).json({error:error.message});
  return res.status(200).json(data);
}
