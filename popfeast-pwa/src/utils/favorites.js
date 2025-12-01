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

async function flushQueue(){
  const q = loadQueue();
  if(!q.length) return;
  const remaining = [];
  for(const item of q){
    try{
      const res = await fetch(apiUrl('/api/favorites/toggle'),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ item_id:item.item_id, item_type:item.item_type })
      });
      if(!res.ok) throw new Error('net');
    }catch(e){
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  // refresh cache if any processed
  if(remaining.length !== q.length){ await fetchAll(); }
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
      // Merge API data with local cache, prefer local entries
      const map = new Map();
      [...local, ...data].forEach(f => {
        const key = `${f.item_type}:${f.item_id}`;
        map.set(key, f);
      });
      const merged = Array.from(map.values());
      saveCache(merged);
      return merged;
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
  try {
    const res = await fetch(apiUrl('/api/favorites/toggle'),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ item_id:item.id, item_type:item.type })
    });
    if(!res.ok){
      // Force offline path for 503/non-ok
      throw new Error(`api ${res.status}`);
    }
    const j = await res.json();
    // Persist locally as well (so it survives mock mode or cold starts)
    const cache = loadCache();
    const idx = cache.findIndex(f=>f.item_id===item.id && f.item_type===item.type);
    if(j.status === 'added'){
      if(idx<0){ cache.push({ item_id:item.id, item_type:item.type, created_at:new Date().toISOString() }); }
    } else {
      if(idx>=0){ cache.splice(idx,1); }
    }
    saveCache(cache);
    // Refresh merged cache view with network bypass so UI reflects changes immediately
    await fetchAll();
  } catch (e) {
    // Queue for later sync and update local cache optimistically
    const queue = loadQueue();
    queue.push({ item_id:item.id, item_type:item.type, queued_at:Date.now() });
    saveQueue(queue);

    const cache = loadCache();
    const idx = cache.findIndex(f=>f.item_id===item.id && f.item_type===item.type);
    if(idx<0){
      cache.push({ item_id:item.id, item_type:item.type, created_at:new Date().toISOString() });
    } else {
      cache.splice(idx,1);
    }
    saveCache(cache);
  }
}