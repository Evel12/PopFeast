import { apiUrl } from './base.js';

export async function fetchList(type) {
  const res = await fetch(apiUrl(`/api/${type}`));
  if (!res.ok) throw new Error('Gagal memuat list');
  return res.json();
}
export async function fetchDetail(type, id) {
  const res = await fetch(apiUrl(`/api/${type}/${id}`));
  if (!res.ok) throw new Error('Gagal memuat detail');
  return res.json();
}