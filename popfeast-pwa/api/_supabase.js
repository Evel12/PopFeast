import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service key; fall back to anon if service not provided
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
export const MOCK_MODE = !SUPABASE_URL || !SUPABASE_KEY;
export const supabase = (!MOCK_MODE) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const mockData = {
  movies: [
    { id:'m1', title:'Mock Movie', year:2024, genres:['Action','Sci-Fi'], rating:8.2, poster_url:'', duration_minutes:120, description:'Mock description', created_at:new Date().toISOString() }
  ],
  series: [
    { id:'s1', title:'Mock Series', seasons:2, episodes:16, genres:['Drama'], rating:7.5, poster_url:'', description:'Mock series', created_at:new Date().toISOString() }
  ],
  favorites: [],
  comments: []
};

export async function parseJson(req){
  return new Promise((resolve, reject) => {
    if(req.method === 'GET') return resolve({});
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if(!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch(e){ resolve({}); }
    });
    req.on('error', reject);
  });
}
