import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

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
