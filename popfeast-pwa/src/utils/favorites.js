// Favorites utility now prefers API; falls back to localStorage offline.
// Adds an offline queue to sync pending toggles when back online.
const KEY = 'popfeast_favs_cache';
const QUEUE_KEY = 'popfeast_favs_queue';
import { apiUrl } from '../api/base.js';

function loadCache(){
  try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; }
}
function saveCache(list){ localStorage.setItem(KEY, JSON.stringify(list)); }

function loadQueue(){
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]'); } catch { return []; }
}
function saveQueue(list){ localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); }

function pendingOpsMap(){
  const q = loadQueue();
  const map = new Map();
  for (const it of q) {
    const key = `${it.item_type}:${it.item_id}`;
    // last op wins
    map.set(key, it.op || 'toggle');
  }
  return map;
}

async function flushQueue(){
  const q = loadQueue();
  if(!q.length) return;
  const remaining = [];
  for(const item of q){
    try{
      const endpoint = item.op === 'add'
        ? '/api/favorites/add'
        : item.op === 'remove'
          ? '/api/favorites/remove'
          : '/api/favorites/toggle';
      const res = await fetch(apiUrl(endpoint),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ item_id:item.item_id, item_type:item.item_type })
      });
      if(!res.ok) throw new Error('net');
    }catch(e){
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  // Avoid blocking UI; refresh cache async
  if(remaining.length !== q.length){ fetchAll().catch(()=>{}); }
}

// Attempt to flush queue when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue(); });
}

async function fetchAll(){
  const local = loadCache();
  try {
    const res = await fetch(apiUrl('/api/favorites'), { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    if(!res.ok) throw new Error('net');
    const data = await res.json();
    if(Array.isArray(data)){
      // Source of truth = server; overlay pending operations
      let final = [...data];
      const serverSet = new Set(final.map(f => `${f.item_type}:${f.item_id}`));
      const pend = pendingOpsMap();
      for (const [key, op] of pend.entries()) {
        const [item_type, item_id] = key.split(':');
        if (op === 'add') {
          if (!serverSet.has(key)) {
            final.push({ item_id, item_type, created_at: new Date().toISOString() });
            serverSet.add(key);
          }
        } else if (op === 'remove') {
          if (serverSet.has(key)) {
            final = final.filter(f => !(f.item_id === item_id && f.item_type === item_type));
            serverSet.delete(key);
          }
        } else if (op === 'toggle') {
          if (serverSet.has(key)) {
            final = final.filter(f => !(f.item_id === item_id && f.item_type === item_type));
            serverSet.delete(key);
          } else {
            final.push({ item_id, item_type, created_at: new Date().toISOString() });
            serverSet.add(key);
          }
        }
      }
      saveCache(final);
      return final;
    }
  } catch(e){ /* fallback to local */ }
  return local;
}

export async function getFavorites(){
  return fetchAll();
}

export async function getFavoritesByType(type){
  const all = await fetchAll();
  return all.filter(f=>f.item_type===type);
}

export async function isFavorite(item_id, item_type){
  const all = await fetchAll();
  return all.some(f=>f.item_id===item_id && f.item_type===item_type);
}

export async function toggleFavorite(item){
  // Optimistic local toggle immediately
  const cache = loadCache();
  const idx = cache.findIndex(f=>f.item_id===item.id && f.item_type===item.type);
  const nowFav = idx < 0; // target state after click
  if(nowFav){
    cache.push({ item_id:item.id, item_type:item.type, created_at:new Date().toISOString() });
  } else {
    cache.splice(idx,1);
  }
  saveCache(cache);

  // Fire-and-forget network ensure add/remove; on failure, enqueue
  const endpoint = nowFav ? '/api/favorites/add' : '/api/favorites/remove';
  fetch(apiUrl(endpoint),{
    method:'POST',headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ item_id:item.id, item_type:item.type })
  })
  .then(async res => {
    if(!res.ok) throw new Error('net');
    // Best-effort background refresh
    fetchAll().catch(()=>{});
  })
  .catch(() => {
    const queue = loadQueue();
    queue.push({ item_id:item.id, item_type:item.type, op: nowFav ? 'add' : 'remove', queued_at:Date.now() });
    saveQueue(queue);
  });
}