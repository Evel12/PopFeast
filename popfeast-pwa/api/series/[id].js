import { supabase, MOCK_MODE, mockData, parseJson } from '../_supabase.js';

export default async function handler(req, res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const { id } = req.query;
  if(req.method === 'GET'){
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    if(MOCK_MODE){ const itm = mockData.series.find(s=>s.id===id); if(!itm) return res.status(404).json({error:'Not found'}); return res.status(200).json(itm); }
    const { data, error } = await supabase.from('series').select('*').eq('id',id).single();
    if(error || !data) return res.status(404).json({error:error?.message||'Not found'});
    return res.status(200).json(data);
  }
  if(req.method === 'PATCH'){
    const body = await parseJson(req);
    const updateObj = {};
    ['title','seasons','episodes','genres','description','rating','poster_url'].forEach(k=>{ if(body[k] !== undefined){ updateObj[k] = body[k]; } });
    if(MOCK_MODE){
      const idx = mockData.series.findIndex(s=>s.id===id);
      if(idx<0) return res.status(404).json({error:'Not found'});
      mockData.series[idx] = { ...mockData.series[idx], ...updateObj };
      return res.status(200).json(mockData.series[idx]);
    }
    const { data, error } = await supabase.from('series').update(updateObj).eq('id',id).select().single();
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'DELETE'){
    if(MOCK_MODE){ const idx = mockData.series.findIndex(s=>s.id===id); if(idx<0) return res.status(404).json({error:'Not found'}); mockData.series.splice(idx,1); return res.status(200).json({status:'ok'}); }
    const { error } = await supabase.from('series').delete().eq('id',id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({status:'ok'});
  }
  return res.status(405).json({error:'method not allowed'});
}