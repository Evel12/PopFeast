import { useEffect, useState } from 'react';
import { apiUrl } from '../api/base.js';

export function useFetchList(type) {
  const [data,setData] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(apiUrl(`/api/${type}`), { headers: { 'Accept': 'application/json' } })
      .then(r => {
        if (!r.ok) throw new Error('Gagal memuat list');
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Unexpected response type');
        return r.json();
      })
      .then(j => { if(active){ setData(j); setError(''); } })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active=false; };
  }, [type]);
  return { data, loading, error };
}