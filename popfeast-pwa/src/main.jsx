import React, { useState } from 'react';
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
  return ready ? <App /> : <Splash onDone={()=>setReady(true)} />;
}

createRoot(document.getElementById('root')).render(<Root />);