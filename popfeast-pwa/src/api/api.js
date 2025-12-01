export async function fetchList(type) {
  const res = await fetch(`/api/${type}`);
  if (!res.ok) throw new Error('Gagal memuat list');
  return res.json();
}
export async function fetchDetail(type, id) {
  const res = await fetch(`/api/${type}/${id}`);
  if (!res.ok) throw new Error('Gagal memuat detail');
  return res.json();
}