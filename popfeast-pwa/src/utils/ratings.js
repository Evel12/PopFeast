const STORAGE_KEY = 'popfeast-fixed-ratings-v1';

function readStore(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeStore(obj){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
}

export function getFixedRating(type, id, fallback){
  const key = `${type}:${id}`;
  const store = readStore();
  if (store[key] == null) {
    const val = Number.isFinite(fallback) ? Number(fallback) : 0;
    store[key] = val;
    writeStore(store);
    return val;
  }
  return Number(store[key]) || 0;
}

export function primeFixedRatings(type, items){
  if (!Array.isArray(items) || items.length===0) return;
  const store = readStore();
  let changed = false;
  for (const it of items){
    if (!it || !it.id) continue;
    const key = `${type}:${it.id}`;
    if (store[key] == null){
      const val = Number(it.rating) || 0;
      store[key] = val;
      changed = true;
    }
  }
  if (changed) writeStore(store);
}
