import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import Splash from './components/Splash.jsx';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

function Root(){
  const [ready,setReady] = useState(false);
  // Warm common API caches once SW is ready
  useEffect(()=>{
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        const prefetch = ['/api/movies','/api/series','/api/favorites','/api/meta/genres'];
        prefetch.forEach(u => { try { fetch(u).catch(()=>{}); } catch(_){} });
      }).catch(()=>{});
    }
  },[]);
  return ready ? <App /> : <Splash onDone={()=>setReady(true)} />;
}

createRoot(document.getElementById('root')).render(<Root />);