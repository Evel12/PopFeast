import { useEffect, useState } from 'react';

export function useFetchList(type) {
  const [data,setData] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/${type}`)
      .then(r => {
        if (!r.ok) throw new Error('Gagal memuat list');
        return r.json();
      })
      .then(j => { if(active){ setData(j); setError(''); } })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active=false; };
  }, [type]);
  return { data, loading, error };
}