import { useEffect, useState } from 'react';

export function useFetchDetail(type, id) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active=true;
    setLoading(true);
    fetch(`/api/${type}/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Gagal memuat detail');
        return r.json();
      })
      .then(j => { if(active){ setData(j); setError(''); } })
      .catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active=false; };
  }, [type,id]);
  return { data, loading, error };
}