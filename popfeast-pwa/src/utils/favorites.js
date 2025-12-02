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

async function fetchAll(preferCache=false){
  const local = loadCache();
  if (preferCache && Array.isArray(local) && local.length) {
    // Kick off a background refresh but return cached immediately
    fetch(apiUrl('/api/favorites?__bypass=1&_ts='+Date.now()), { headers: { 'Accept': 'application/json', 'x-bypass-cache':'1' }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { if (Array.isArray(data)) saveCache(data); })
      .catch(()=>{});
    return local;
  }
  try {
    const res = await fetch(apiUrl('/api/favorites?__bypass=1&_ts='+Date.now()), { headers: { 'Accept': 'application/json', 'x-bypass-cache':'1' }, cache: 'no-store' });
    if(!res.ok) throw new Error('net');
    const data = await res.json();
    if(Array.isArray(data)){
      // Source of truth = server; do not overlay pending ops
      saveCache(data);
      return data;
    }
  } catch(e){ /* fallback to local */ }
  return local;
}

export async function getFavorites(preferCache=false){
  return fetchAll(preferCache);
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
  // Determine intended operation by current server state
  const current = await fetchAll();
  const exists = current.some(f=>f.item_id===item.id && f.item_type===item.type);
  const endpoint = exists ? '/api/favorites/remove' : '/api/favorites/add';
  const body = JSON.stringify({ item_id:item.id, item_type:item.type });

  // If offline, queue and return queued
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const queue = loadQueue();
    queue.push({ item_id:item.id, item_type:item.type, op: exists ? 'remove' : 'add', queued_at:Date.now() });
    saveQueue(queue);
    return { status: 'queued' };
  }

  // Online: call API, only update cache after success
  const res = await fetch(apiUrl(endpoint), { method:'POST', headers:{'Content-Type':'application/json','x-bypass-cache':'1','Accept':'application/json'}, body, cache:'no-store' });
  if (!res.ok) {
    // Do not modify local cache if server rejects
    const errText = await res.text().catch(()=> '');
    throw new Error(errText || 'Failed to update favorite');
  }
  // Update local cache immediately for snappy UX
  const cache = loadCache();
  const keyIndex = cache.findIndex(f=>f.item_id===item.id && f.item_type===item.type);
  if (endpoint.endsWith('/add')) {
    if (keyIndex < 0) cache.push({ item_id:item.id, item_type:item.type, created_at:new Date().toISOString() });
  } else {
    if (keyIndex >= 0) cache.splice(keyIndex,1);
  }
  saveCache(cache);
  // Background refresh from server to ensure correctness
  fetchAll().catch(()=>{});
  return { status: exists ? 'removed' : 'added' };
}