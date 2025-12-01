import { useEffect, useState } from 'react';

export function useFetchDetail(type, id) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active=true;
    setLoading(true);
    fetch(`/api/${type}/${id}`, { headers: { 'Accept': 'application/json' } })
      .then(async r => {
        if (!r.ok) throw new Error('Gagal memuat detail');
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Unexpected response type');
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