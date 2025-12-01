const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function buildUrl(path){
  // If rewrites configured, relative is fine; if env provided, prefix it
  return API_BASE ? `${API_BASE}${path}` : path;
}

export async function fetchList(type) {
  const res = await fetch(buildUrl(`/api/${type}`));
  if (!res.ok) throw new Error('Gagal memuat list');
  return res.json();
}
export async function fetchDetail(type, id) {
  const res = await fetch(buildUrl(`/api/${type}/${id}`));
  if (!res.ok) throw new Error('Gagal memuat detail');
  return res.json();
}