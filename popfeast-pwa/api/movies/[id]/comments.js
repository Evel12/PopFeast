import { supabase, MOCK_MODE, mockData } from '../../_supabase.js';

export default async function handler(req,res){
  const { id } = req.query;
  if(req.method === 'GET'){
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=120');
    if(MOCK_MODE){
      const list = mockData.comments.filter(c=>c.item_type==='movie' && c.item_id===id).sort((a,b)=>b.created_at.localeCompare(a.created_at));
      return res.status(200).json(list);
    }
    const { data, error } = await supabase.from('comments').select('id,rating,content,created_at,username').eq('item_id',id).eq('item_type','movie').order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }
  if(req.method === 'POST'){
    const { rating, content, username } = req.body || {};
    if(rating==null || content==null) return res.status(400).json({error:'rating & content required'});
    if(MOCK_MODE){
      const c = { id:'c'+Date.now(), item_id:id, item_type:'movie', rating:Number(rating), content:String(content), created_at:new Date().toISOString(), username: username? String(username).slice(0,40): null };
      mockData.comments.push(c);
      const ratings = mockData.comments.filter(x=>x.item_type==='movie' && x.item_id===id).map(x=>x.rating);
      if(ratings.length){
        const avg = ratings.reduce((a,v)=>a+v,0)/ratings.length;
        mockData.movies = mockData.movies.map(m=> m.id===id ? {...m, rating: Number(avg.toFixed(1))}: m);
      }
      return res.status(200).json(c);
    }
    const insert = await supabase.from('comments').insert({
      item_id:id,item_type:'movie',rating:Number(rating),content:String(content),user_id:null,username: username ? String(username).slice(0,40) : null
    }).select().single();
    if(insert.error) return res.status(500).json({error:insert.error.message});
    const avgQ = await supabase.from('comments').select('rating').eq('item_id',id).eq('item_type','movie');
    if(!avgQ.error){
      const ratings = (avgQ.data||[]).map(r=>r.rating).filter(r=>typeof r==='number');
      if(ratings.length){
        const avg = ratings.reduce((a,v)=>a+v,0)/ratings.length;
        await supabase.from('movies').update({rating: Number(avg.toFixed(1))}).eq('id',id);
      }
    }
    return res.status(200).json(insert.data);
  }
  return res.status(405).json({error:'method not allowed'});
}
