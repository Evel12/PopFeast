import { useEffect, useState } from 'react';

export function useFetchDetail(type, id) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active=true;
    setLoading(true);
    const url = `/api/${type}/${id}?_ts=${Date.now()}`;
    fetch(url, { headers: { 'Accept': 'application/json', 'x-bypass-cache': '1' }, cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Gagal memuat detail');
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          // Retry bypassing caches in case a SPA HTML was served from a proxy/cache
          const r2 = await fetch(url, { headers: { 'Accept': 'application/json', 'x-bypass-cache': '1' }, cache: 'no-store' });
          const ct2 = r2.headers.get('content-type') || '';
          if (!r2.ok || !ct2.includes('application/json')) throw new Error('Unexpected response type');
          return r2.json();
        }
        return r.json();
      })
      .then(j => { if(active){ setData(j); setError(''); } })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active=false; };
  }, [type,id]);
  return { data, loading, error };
}